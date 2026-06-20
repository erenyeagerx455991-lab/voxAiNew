# Token Flow Baseline — V7.0.2

Captured before wiring. Describes the pre-activation state.

---

## 1. Where do tokens enter the system?

All LLM traffic flows through two functions in `src/agents/llm/llmClient.ts`:

| Function | Line | Protocol |
|---|---|---|
| `callGroq()` | 18 | REST fetch → Groq API |
| `callOpenRouter()` | 87 | REST fetch → OpenRouter API |

No other code makes LLM API calls. Every pipeline step (Planner, Design, Frontend, Codegen, Backend, Repair, Code Fix) imports and calls one of these two functions.

---

## 2. Where are usage values available?

### callGroq — non-streaming (success path)
```
Line 50: const data = await resp.json()
          data.usage.prompt_tokens      ← available
          data.usage.completion_tokens  ← available
Line 54: recordLLMCall({ promptTokens: data.usage?.prompt_tokens, ... })
```
Usage is **available and already extracted** but not wired to `recordTokenUsage`.

### callGroq — streaming (success path)
```
Lines 62-77: reader loop — chunks arrive as SSE lines
             parsed.usage              ← NOT captured (pre-V7.0.2)
Line 79:    recordLLMCall({ provider: "groq", ..., success: true })
             promptTokens: undefined   ← missing
```
Usage is **not available by default** in streaming mode. Groq supports `stream_options: { include_usage: true }` which appends a final chunk with usage before `[DONE]`.

### callOpenRouter — non-streaming only
```
Line 110: const data = await resp.json()
           data.usage.prompt_tokens      ← available
           data.usage.completion_tokens  ← available
Line 111: recordLLMCall({ promptTokens: data.usage?.prompt_tokens, ... })
```
Usage is **available and already extracted** but not wired to `recordTokenUsage`.

---

## 3. Which providers expose usage metadata?

| Provider | Non-streaming usage | Streaming usage |
|---|---|---|
| Groq | YES — `usage.prompt_tokens`, `usage.completion_tokens` always present on success | YES — requires `stream_options: { include_usage: true }` |
| OpenRouter | YES — `usage.prompt_tokens`, `usage.completion_tokens` always present on success | NOT USED — OpenRouter is non-streaming in this codebase |

---

## 4. Which paths do not expose usage?

| Path | Reason |
|---|---|
| Failed HTTP responses (non-2xx) | No response body is parsed; `resp.text()` is called for error message only |
| Groq 429 retry attempt | Retry uses `resp.text()` (error body), not `resp.json()`. Usage = 0 (correct — provider returned no output) |
| OpenRouter failure → Groq fallback | OpenRouter throws before usage is available; Groq success path will record its own usage |

---

## 5. Which paths retry automatically?

### callGroq — automatic 429 retry (lines 40-44)
```typescript
if (resp.status === 429 && body.includes("Please try again")) {
  const wait = parseInt(...) * 1000 + 300;
  await new Promise(r => setTimeout(r, wait));
  return callGroq(apiKey, model, messages, stream, maxTokens, onToken); // recursive
}
```
- **Retry type**: Recursive self-call
- **Limit**: No hard retry limit (reliant on Groq rate limit window clearing)
- **Double-count risk**: NONE — the 429 response carries no usage data; only the eventual successful response records usage

### callOpenRouter — no automatic retry
- Throws `OpenRouterError` immediately on any non-2xx response
- Higher-level callers (e.g., `architectureStep.ts` validation loop, `frontendStep.ts` fallback) implement their own retry/fallback at the application layer

### Application-level retries (not in llmClient.ts)
| Location | Strategy |
|---|---|
| `frontendStep.ts:105-131` | Re-calls `runDesignAgent()` with modified prompt up to 3 times |
| `architectureStep.ts:66-93` | Re-calls `callGroq()` if JSON validation fails |
| `frontendStep.ts:165-175` | Falls back from OpenRouter to Groq if OpenRouter throws |

All application-level retries call `callGroq` / `callOpenRouter` fresh each time. Each successful call records its own usage exactly once.

---

## Pre-Activation Dead Code

| Function | Caller count (pre-V7.0.2) |
|---|---|
| `recordTokenUsage(provider, tokens)` in `tokenBudget.ts:60` | 0 — never called |
| `recordTokensUsed(userId, tokens)` in `userLimits.ts:84` | 0 — never called |

**Effect**:
- `checkTokenBudget()` in `agents.ts:75` always returns `{ allowed: true }` (daily.groq = 0 forever)
- `getUserQuotaStatus(userId).dailyTokens` always returns 0
- `checkBuildLimit()` never blocks on token quota (dailyTokens never increments)
- Emergency shutdown never triggers naturally

---

## Post-Activation (V7.0.2)

After wiring:
- `callGroq()` non-streaming: calls `accountTokens('groq', pt, ct)` at line ~74
- `callGroq()` streaming: captures usage from final chunk; calls `accountTokens('groq', streamPt, streamCt)` after loop
- `callOpenRouter()`: calls `accountTokens('openrouter', pt, ct)` at line ~128
- `accountTokens()` calls both `recordTokenUsage(provider, total)` and, when `tokenContext` has a store, `recordTokensUsed(userId, total)`
- `tokenContext` is set by `tokenContext.run({ userId, buildId: jobId }, ...)` in `queueWorker.ts:executeBuildJob`
- `checkBuildLimit()` now checks `dailyTokens >= dailyTokenQuota` and blocks if exceeded
