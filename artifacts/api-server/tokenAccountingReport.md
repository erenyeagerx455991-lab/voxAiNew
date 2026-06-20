# Token Accounting Report — V7.0.2

Date: 2026-06-20
Scope: Wire real provider-reported token counts into global budget gate and per-user quota.

---

## Before / After Summary

| Metric | Before (V7.0.1) | After (V7.0.2) |
|---|---|---|
| `global usage` | **dead** — `recordTokenUsage` never called; counters always 0 | **live** — incremented on every successful provider response |
| `per-user usage` | **dead** — `recordTokensUsed` never called; `dailyTokens` always 0 | **live** — incremented via `AsyncLocalStorage` context per build |
| Budget gate triggers | Never (denominator always 0) | Yes — blocks at daily/monthly limit or 95% emergency threshold |
| Per-user token quota | Never triggered | Blocks `checkBuildLimit` when `dailyTokens >= dailyTokenQuota` |
| Retry double-count | N/A (no counting) | Protected — 429 responses carry no usage; only successful responses count |
| Fallback double-count | N/A | Protected — OR failures carry no usage; Groq success counts once |

---

## Files Changed

| File | Lines Changed | What Changed |
|---|---|---|
| `src/agents/llm/tokenContext.ts` | NEW | `AsyncLocalStorage<{ userId, buildId }>` — threads context without signature changes |
| `src/agents/llm/llmClient.ts` | +30 | Imports `recordTokenUsage`, `recordTokensUsed`, `tokenContext`; calls `accountTokens()` on every successful response; adds `stream_options: { include_usage: true }` for streaming; captures usage from final streaming chunk |
| `src/queue/queueWorker.ts` | +4 | Wraps `runBuildPipeline` in `tokenContext.run({ userId, buildId: jobId }, ...)` |
| `src/limits/userLimits.ts` | +2 | Adds `dailyTokens >= dailyTokenQuota` check to `checkBuildLimit()` |

---

## Phase 1 — LLM Entry Points

All LLM traffic flows through two functions only:

| Function | File | Line | Provider |
|---|---|---|---|
| `callGroq()` | `src/agents/llm/llmClient.ts` | 33 | Groq |
| `callOpenRouter()` | `src/agents/llm/llmClient.ts` | 87 | OpenRouter |

No other code makes LLM API calls. All pipeline steps import from `llmClient.ts`.

---

## Phase 2 — Canonical Token Sources

### Groq — non-streaming
```
Response JSON: data.usage.prompt_tokens    (e.g. 123)
               data.usage.completion_tokens (e.g. 456)
Used at:       llmClient.ts:74  (post-V7.0.2 line)
Total:         prompt_tokens + completion_tokens = 579
```

### Groq — streaming
Groq streaming does not include usage in content chunks by default.

**Fix applied**: Added `stream_options: { include_usage: true }` to the request body.

```
Request body (streaming): { ..., stream: true, stream_options: { include_usage: true } }

Final chunk before [DONE]:
  data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":80,"completion_tokens":40}}

Captured at: llmClient.ts streaming loop — `if (parsed.usage) { streamPt = ...; streamCt = ...; }`
Recorded at: after loop completes — `accountTokens('groq', streamPt, streamCt)`
```

If the server omits the usage chunk (e.g., older Groq API version), `streamPt` and `streamCt` remain 0 — recorded as 0 (no estimation, per spec).

### OpenRouter — non-streaming only
```
Response JSON: data.usage.prompt_tokens     (e.g. 200)
               data.usage.completion_tokens  (e.g. 100)
Used at:       llmClient.ts:128 (post-V7.0.2 line)
Total:         300
```

OpenRouter is non-streaming in this codebase — no streaming path exists.

---

## Phase 3 — Double-Count Protection

### Groq 429 retry (recursive, no limit)

```typescript
// llmClient.ts:60-66
if (resp.status === 429 && body.includes("Please try again")) {
  const wait = ...;
  await new Promise(r => setTimeout(r, wait));
  return callGroq(apiKey, model, messages, stream, maxTokens, onToken); // recursive
}
// Note: 429 response → resp.ok = false → accountTokens() never called
// Successful retry → accountTokens() called once with real usage
```

**Verified by test**: `providerUsageParsing.test.ts` — "Groq 429 retry: two retries before success still counts once" — 3 fetch calls, budget increments exactly once.

### OpenRouter → Groq fallback (`frontendStep.ts:165-175`)

```
callOpenRouter throws OpenRouterError (resp.ok = false)
  → accountTokens() NOT called (exception path)
  → caller catches, calls callGroq(fallback)
    → callGroq succeeds → accountTokens('groq', pt, ct) called once
```

**Verified by test**: `providerUsageParsing.test.ts` — "OpenRouter→Groq fallback: counts OR failure as 0, Groq success as real tokens".

### Application-level retries (`architectureStep.ts`, `frontendStep.ts`)

Each `callGroq()` / `callOpenRouter()` call is independent. Failed calls (non-2xx) call `recordLLMCall({ success: false })` but do NOT call `accountTokens()`. Successful retry calls count their own usage independently — this is correct (both calls consumed tokens from the provider).

---

## Phase 4 — Global Token Accounting

### Wiring point: `accountTokens()` in `llmClient.ts`

```typescript
function accountTokens(provider: 'groq' | 'openrouter', promptTokens: number, completionTokens: number): void {
  const total = promptTokens + completionTokens;
  if (total <= 0) return;                         // ← defensive: skip zero-token responses
  recordTokenUsage(provider, total);              // ← global daily + monthly counters
  const ctx = tokenContext.getStore();
  if (ctx) recordTokensUsed(ctx.userId, total);  // ← per-user (when context is set)
}
```

Called from:
- `callGroq()` non-streaming: line ~74
- `callGroq()` streaming: after reader loop completes
- `callOpenRouter()`: line ~128

**What `recordTokenUsage` does** (`tokenBudget.ts:60`):
- Increments `daily[provider]` and `monthly[provider]`
- Checks if daily usage >= 95% of limit → sets `_emergencyShutdown = true` if so
- Emergency shutdown blocks all future builds via `checkTokenBudget()`

---

## Phase 5 — Per-User Token Accounting

### Context propagation via `AsyncLocalStorage`

```
executeBuildJob(jobId, { userId, ... })
  │
  ▼
tokenContext.run({ userId, buildId: jobId }, () =>
  runBuildPipeline(...)                          ← pipeline runs inside context
    │
    ├── callGroq()  ← tokenContext.getStore() returns { userId, buildId }
    │                 → recordTokensUsed(userId, total)
    │
    └── callOpenRouter() ← same
)
```

**File**: `queueWorker.ts:57` — `await tokenContext.run({ userId, buildId: jobId }, () => runBuildPipeline(...))`

**What `recordTokensUsed` does** (`userLimits.ts:84`):
- Increments `state.dailyTokens` for the user
- Logs `TOKEN_QUOTA_EXCEEDED` warning when `dailyTokens > dailyTokenQuota`

**What `checkBuildLimit` now does** (`userLimits.ts:65`, post-V7.0.2):
- Returns `{ allowed: false, reason: "Daily token quota reached (...)" }` when `dailyTokens >= dailyTokenQuota`
- This blocks the build at `agents.ts:77` with HTTP 429

---

## Phase 6 — Streaming Validation

| Path | Usage Available | How |
|---|---|---|
| Groq non-streaming | YES | `data.usage.prompt_tokens` + `data.usage.completion_tokens` in response body |
| Groq streaming | YES (with fix) | `stream_options: { include_usage: true }` causes final chunk to carry usage |
| Groq streaming (server omits usage) | NO — recorded as 0 | Documented limitation: no estimation per spec |
| OpenRouter | YES | `data.usage.prompt_tokens` + `data.usage.completion_tokens` in response body |

**Only the Planner Agent uses Groq streaming** (`plannerStep.ts:28-36`). All other agents use non-streaming.

---

## Phase 7 — Budget Gate Validation

Demonstrated in `budgetGate.test.ts` — "real usage flow: record → budget rises → threshold → gate activates":

```
1. configureTokenBudget({ dailyGroqTokens: 500 })
2. POST /api/agents/build → 200 (budget open)
3. recordTokenUsage('groq', 501)              ← budget rises above limit
4. POST /api/agents/build → 503               ← gate activates
   { error: "Daily Groq token limit reached" }
5. mockEnqueue call count = 1                 ← only first call went through
```

---

## Phase 8 — Test Results

| Suite | Tests | Status |
|---|---|---|
| `tokenAccounting.test.ts` (new) | 16 | PASS |
| `budgetGate.test.ts` (new) | 10 | PASS |
| `providerUsageParsing.test.ts` (new) | 13 | PASS |
| All prior tests (362) | 362 | PASS |
| **Total** | **399 / 399** | **PASS** |

---

## Final Questions (Phase 9)

### 1. Can token budgets now trigger?

**YES.**

`recordTokenUsage(provider, total)` is called on every successful provider response. `checkTokenBudget()` reads live counters. Demonstrated in `budgetGate.test.ts`.

### 2. Can daily user token quotas now trigger?

**YES.**

`recordTokensUsed(userId, total)` is called via `AsyncLocalStorage` context for every build's LLM calls. `checkBuildLimit()` now evaluates `dailyTokens >= dailyTokenQuota` and returns `{ allowed: false }` blocking the build with HTTP 429.

### 3. Are retries counted once?

**YES.**

Groq 429 retries: the failed 429 response has no usage; only the eventual successful response records usage. Verified with a 3-call retry test (1 result recorded, not 3).

### 4. Are fallback providers counted once?

**YES.**

OpenRouter failures throw before `accountTokens()` is called (no usage on failure). The Groq fallback counts its own usage exactly once on success. Verified in `providerUsageParsing.test.ts`.

### 5. Are streaming requests accounted for?

**YES — with one documented limitation.**

Groq streaming now includes `stream_options: { include_usage: true }` which causes the final SSE chunk to carry usage counts. These are captured and recorded.

**Limitation**: If the Groq API server omits the usage chunk (e.g., network truncation, API version regression), `streamPt` and `streamCt` remain 0 — the request is recorded as 0 tokens. No estimation is performed per spec.

### 6. Which requests still cannot be measured?

| Request type | Why | Tokens recorded |
|---|---|---|
| Failed HTTP responses (any provider) | No usage in error body | 0 (correct) |
| Groq streaming with server-omitted usage | Groq omits final usage chunk | 0 (documented limitation) |
| 429 retry attempts (before final success) | 429 has no usage | 0 (correct — no output produced) |
| External LLM calls (if any future agent bypasses `llmClient.ts`) | No wiring | 0 (architectural gap) |

**Coverage**: All paths through `callGroq()` and `callOpenRouter()` that produce actual model output are now measured. No estimation used anywhere.
