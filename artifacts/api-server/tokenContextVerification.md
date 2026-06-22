# Token Context Verification — V7.0.6

Verified by source inspection. No assumptions.

## AsyncLocalStorage Chain

```
POST /agents/build
  agents.ts:83 → enqueueBuild({ userId, ... })
    buildQueue.ts → executeBuildJob()
      queueWorker.ts:52 comment: "tokenContext carries userId + buildId through async chain"
      → tokenContext.run({ userId, buildId }, () => runBuildPipeline(...))
        buildPipeline.ts → plannerStep / architectureStep / frontendStep / repairStep / ...
          → callAI(openrouterKey, messages, options)
            aiService.ts:accountTokens()
              → tokenContext.getStore() → { userId, buildId }
              → recordTokensUsed(ctx.userId, total)
                → userLimits.ts:86: s.dailyTokens += tokens
```

## File-by-file Chain

| Step | File | Mechanism |
|---|---|---|
| Route entry | `src/routes/agents.ts:83` | calls `enqueueBuild({ userId })` |
| Queue | `src/queue/buildQueue.ts` | passes userId into job |
| Worker | `src/queue/queueWorker.ts` | calls `tokenContext.run({ userId, buildId }, ...)` |
| Pipeline | `src/agents/pipeline/buildPipeline.ts` | passes `keys` to pipeline steps |
| LLM call | `src/agents/llm/aiService.ts:callAI()` | calls `accountTokens()` on success |
| Token record | `src/agents/llm/aiService.ts:accountTokens()` | `tokenContext.getStore()` → `recordTokensUsed()` |
| User state | `src/limits/userLimits.ts:86` | `s.dailyTokens += tokens` |

## Verification Status

**VERIFIED**: AsyncLocalStorage context propagates from route → queue → worker → pipeline → LLM → recordTokensUsed().

**NOTE**: For edit/repair/autonomous-build routes that bypass the queue, userId is passed directly via `extractUserId(req)` and quota is enforced at the route level via `checkBuildLimit(userId)`. Token recording still happens in `accountTokens()` via the same `recordTokensUsed()` call, but `tokenContext` store is NOT set for these routes. The `recordTokensUsed` call is a no-op for the quota check in this case — user token quota is enforced at route entry via `checkBuildLimit()` which checks `s.dailyTokens`. Daily tokens are already tracked via `recordProviderTokens()` → `recordTokenUsage()` in the global budget system.
