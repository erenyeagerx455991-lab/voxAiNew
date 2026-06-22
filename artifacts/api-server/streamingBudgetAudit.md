# Streaming Budget Audit — V7.0.6

Verified by source inspection of `src/agents/llm/aiService.ts`.

## Streaming Token Recording Chain

```
callAI(options: { stream: true, onToken })
  → callModelStreaming()
      fetch(OPENROUTER_URL, { stream_options: { include_usage: true } })
      → SSE chunk: { usage: { prompt_tokens, completion_tokens } }
      aiService.ts:123–126: parses usage from final SSE chunk
      → returns { text, promptTokens, completionTokens }
  → accountTokens(promptTokens, completionTokens)    [aiService.ts:232]
      → recordProviderTokens("openrouter", total)    [providerBudget.ts:53]
          → recordTokenUsage("openrouter", total)    [tokenBudget.ts:60]  — daily budget
          → s.tpmWindow.push({ ts, tokens })         [providerBudget.ts:58] — TPM window
          → recordBudgetEvent("token_consumed", ...) [budgetMetrics.ts]   — telemetry
      → tokenContext.getStore() → recordTokensUsed(userId, total) [userLimits.ts:86]
```

## Exact File and Line References

| Step | File | Line | Description |
|---|---|---|---|
| stream_options set | `src/agents/llm/aiService.ts` | 90 | `stream_options: { include_usage: true }` sent to OpenRouter |
| Usage chunk parsed | `src/agents/llm/aiService.ts` | 123–126 | `parsed.usage.prompt_tokens/completion_tokens` captured |
| accountTokens called | `src/agents/llm/aiService.ts` | 232 | after successful stream completion |
| recordProviderTokens | `src/cost/providerBudget.ts` | 53 | updates TPM window + delegates to recordTokenUsage |
| recordTokenUsage | `src/cost/tokenBudget.ts` | 60 | updates daily/monthly totals, checks emergency threshold |
| recordBudgetEvent | `src/cost/budgetMetrics.ts` | — | telemetry event emitted |
| recordTokensUsed | `src/limits/userLimits.ts` | 86 | per-user daily token counter |

## Status

**VERIFIED**: `stream_options.include_usage: true` is sent. Usage is parsed from the final SSE chunk. `recordProviderTokens()` is called after successful streaming response via `accountTokens()`. Chain is complete and live.
