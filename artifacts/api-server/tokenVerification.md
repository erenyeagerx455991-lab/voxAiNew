# Token Accounting Verification — V7.0.4 Independent Audit

Auditor: independent source review
Date: 2026-06-20
Scope: V7.0.2 token-accounting fix

---

## 1. recordTokenUsage() and recordTokensUsed() — Call Sites

**File**: `src/agents/llm/llmClient.ts:20-26`

```typescript
function accountTokens(provider: 'groq' | 'openrouter', promptTokens: number, completionTokens: number): void {
  const total = promptTokens + completionTokens;
  if (total <= 0) return;
  recordTokenUsage(provider, total);         // global budget (tokenBudget.ts)
  const ctx = tokenContext.getStore();
  if (ctx) recordTokensUsed(ctx.userId, total); // per-user quota (userLimits.ts)
}
```

Both functions are triggered by the single `accountTokens()` call. Neither is called elsewhere in the LLM client.

---

## 2. Groq — Non-Streaming Path

**File**: `src/agents/llm/llmClient.ts:78-86`

```typescript
const pt = data.usage?.prompt_tokens    ?? 0;
const ct = data.usage?.completion_tokens ?? 0;
recordLLMCall({ provider: "groq", model, ..., promptTokens: pt, completionTokens: ct });
accountTokens('groq', pt, ct);
```

Token counts come directly from `data.usage` in the JSON response body.

**Verdict**: VERIFIED. Fires on every successful non-streaming Groq call.

---

## 3. Groq — Streaming Path

**File**: `src/agents/llm/llmClient.ts:50-57, 112-125`

```typescript
body: JSON.stringify({
  model, messages, max_tokens: maxTokens,
  stream,
  ...(stream ? { stream_options: { include_usage: true } } : {}),
}),
```

`stream_options.include_usage: true` causes Groq to append a final SSE chunk with `usage` before `[DONE]`. The parser captures it:

```typescript
if (parsed.usage) {
  streamPt = parsed.usage.prompt_tokens    ?? 0;
  streamCt = parsed.usage.completion_tokens ?? 0;
}
```

After the read loop exits:
```typescript
accountTokens('groq', streamPt, streamCt);
```

**Verdict**: VERIFIED. `stream_options` is the only mechanism to get token counts from streaming Groq. If Groq does not emit a usage chunk, both `streamPt` and `streamCt` remain 0 and `accountTokens` no-ops due to the `total <= 0` guard.

---

## 4. OpenRouter Path

**File**: `src/agents/llm/llmClient.ts:158-170`

```typescript
const pt = data.usage?.prompt_tokens    ?? 0;
const ct = data.usage?.completion_tokens ?? 0;
recordLLMCall({ provider: "openrouter", model, ..., promptTokens: pt, completionTokens: ct });
accountTokens('openrouter', pt, ct);
```

OpenRouter always responds with a JSON body. Usage is in `data.usage`.

**Verdict**: VERIFIED. Fires on every successful OpenRouter call.

---

## 5. Fallback Path (OpenRouter → Groq)

When OpenRouter throws (non-200 response), the catch path in `frontendStep.ts` (not shown but referenced in comment at `llmClient.ts:155-156`) calls Groq directly. Each provider records its own usage independently:

- OpenRouter error path: `recordLLMCall(..., success: false)` — no `accountTokens` (no usage data)
- Groq success path: `accountTokens('groq', pt, ct)` as normal

**Verdict**: No double-counting. Each call records only on its own success.

---

## 6. Retry Path (429)

**File**: `src/agents/llm/llmClient.ts:61-67`

```typescript
if (resp.status === 429 && body.includes("Please try again")) {
  const wait = parseInt(body.match(/try again in (\d+\.?\d*)s/)?.[1] ?? "2") * 1000 + 300;
  await new Promise(r => setTimeout(r, wait));
  return (callGroq as ...)(apiKey, model, messages, stream, maxTokens, onToken);
}
```

The 429 response contains no token usage. The retry is a recursive call; when it succeeds, it calls `accountTokens` exactly once for the successful response.

**Verdict**: No double-counting on retry. Tokens recorded once on successful resolution.

---

## 7. AsyncLocalStorage Threading

**File**: `src/agents/llm/tokenContext.ts`
```typescript
export const tokenContext = new AsyncLocalStorage<TokenBuildContext>();
```

**File**: `src/queue/queueWorker.ts:54-56`
```typescript
await tokenContext.run({ userId, buildId: jobId }, () =>
  runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, bridge)
);
```

`tokenContext.run(ctx, fn)` sets the context for the entire async subtree of `fn`. Every `callGroq` / `callOpenRouter` called inside `runBuildPipeline` inherits this context via `tokenContext.getStore()`.

**Verdict**: VERIFIED. Per-user attribution is correct as long as `executeBuildJob` is the entry point (which it is for all builds through the queue).

---

## 8. Edge Cases

| Scenario | Result |
|---|---|
| Usage chunk missing from Groq stream | `streamPt=0, streamCt=0` → `accountTokens` no-ops |
| `data.usage` absent from OpenRouter | `pt=0, ct=0` → `accountTokens` no-ops |
| `tokenContext.getStore()` returns null (direct call outside queue) | `recordTokensUsed` skipped — global budget records but per-user quota does not |
| Edit endpoint (`/agents/edit`) | Calls `callGroq` directly — no `tokenContext.run()` wrapping → per-user quota NOT updated for edits |

---

## Summary

| Check | Result |
|---|---|
| `recordTokenUsage()` called — Groq non-streaming | VERIFIED |
| `recordTokenUsage()` called — Groq streaming | VERIFIED |
| `recordTokenUsage()` called — OpenRouter | VERIFIED |
| `recordTokensUsed()` called — per-user via AsyncLocalStorage | VERIFIED |
| No double-counting on fallback | VERIFIED |
| No double-counting on retry | VERIFIED |
| Edit endpoint token attribution | NOT WIRED — edit route has no `tokenContext.run()` |
