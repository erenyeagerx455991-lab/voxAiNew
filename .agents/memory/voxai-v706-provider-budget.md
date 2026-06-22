---
name: VoxAI V7.0.6 Provider Budget Enforcement
description: Dead provider budget path now live; edit quota hardened; test infrastructure notes.
---

## What changed

`checkProviderBudget()`, `recordProviderTokens()`, and `recordProviderRequest()` were fully implemented but never called. All three are now live in `src/agents/llm/aiService.ts`:
- `checkProviderBudget(PROVIDER)` fires **before** every outbound `fetch()` inside the MODEL_CHAIN loop — budget-exceeded throws `{ code: "PROVIDER_BUDGET_EXCEEDED", provider }` immediately (no fallback).
- `recordProviderRequest(PROVIDER)` fires after the budget check, before the network call, to advance the RPM window.
- `recordProviderTokens(PROVIDER, total)` fires inside `accountTokens()` on every successful response (streaming and non-streaming).
- `recordTokenUsage()` is now called indirectly via `recordProviderTokens()` — do NOT re-add a direct `recordTokenUsage()` call to `aiService.ts`.

## Edit quota hardening

Three routes now enforce quota before SSE streaming begins:
- `POST /agents/edit` — `checkBuildLimit(userId)` + `checkTokenBudget()` + `recordBuildStarted/Completed` (finally block)
- `POST /agents/runtime-repair` — same
- `POST /agents/autonomous-build` — same

## Test infrastructure

**`_configureProviderLimitsForTest(provider, maxRpm, maxTpm)`** added to `providerBudget.ts` — mutates `MAX_RPM[provider]` and `MAX_TPM[provider]` directly. Required because these are object constants evaluated at module load time; setting env vars after import has no effect.

**Always call `_configureProviderLimitsForTest()` BEFORE `_resetProviderBudgetForTest()`** when overriding limits — reset clears the window state but not the limits object.

## queueActivation.test.ts

Build route passes `groqKey: ""` (hardcoded empty string). The test "passes prompt, chatId, userId, and API keys to enqueueBuild" must assert `call.groqKey === ""` not `"test-groq-key"`. The test "rejects 500 when GROQ_API_KEY is missing" was updated to delete `OPENROUTER_API_KEY` instead.

**Why:** Groq was removed from the pipeline in the previous session. GROQ_API_KEY is no longer checked anywhere in `agents.ts`.

## Audit docs produced

All in `artifacts/api-server/`:
- `providerBudgetBaseline.md` — pre-implementation dead-path inventory
- `editSurfaceAudit.md` — all mutating endpoints and quota status
- `streamingBudgetAudit.md` — streaming token recording chain
- `providerBudgetWiringAudit.md` — post-implementation call-site verification
- `tokenContextVerification.md` — AsyncLocalStorage propagation chain
- `v7.0.6Audit.md` — final production audit
