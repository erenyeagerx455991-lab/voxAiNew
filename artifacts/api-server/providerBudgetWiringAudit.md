# Provider Budget Wiring Audit — V7.0.6 (Post-Implementation)

Generated after V7.0.6 implementation. Every call site verified by source inspection.

## checkProviderBudget() — All Call Sites

| File | Line | Live? | Notes |
|---|---|---|---|
| `src/agents/llm/aiService.ts` | ~187 (in callAI loop) | **YES — LIVE** | Called before every outbound request in MODEL_CHAIN loop |
| `src/cost/providerBudget.ts` | 62 | YES — definition | |

## recordProviderTokens() — All Call Sites

| File | Line | Live? | Notes |
|---|---|---|---|
| `src/agents/llm/aiService.ts` | ~232 (in accountTokens) | **YES — LIVE** | Called after every successful response via accountTokens() |
| `src/cost/providerBudget.ts` | 53 | YES — definition | |

## recordProviderRequest() — All Call Sites

| File | Line | Live? | Notes |
|---|---|---|---|
| `src/agents/llm/aiService.ts` | ~191 (in callAI loop) | **YES — LIVE** | Called before fetch() to record RPM request |
| `src/cost/providerBudget.ts` | 47 | YES — definition | |

## Dead Paths Remaining

**NONE.** All three functions are now live in the production execution path.

## Success Criteria Verification

- checkProviderBudget() dead path removed: **YES**
- recordProviderTokens() dead path removed: **YES**
- recordProviderRequest() dead path removed: **YES**
- All production implementations connected to runtime: **YES**
- Phase 1A: **PASS**
