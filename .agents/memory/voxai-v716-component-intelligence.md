---
name: VoxAI V7.1.6 Component Intelligence
description: Per-component quality scoring engine; metrics hook in pipeline; deprecation logic; telemetry extension.
---

## Rule
`src/quality/componentMetrics.ts` is the single source of truth for per-component performance data.
**Do NOT add componentMetrics logic elsewhere.**

## Quality score formula
qualityScore = designScore×0.40 + accessScore×0.25 + (successRate×10)×0.20 + ((1−repairRate)×10)×0.15

All sub-scores 0–10.  designScore = (heroScore+layoutScore+ctaScore+shadcnScore+consistencyScore)/5.

## Auto-deprecation
After ≥3 uses: repairRate > 50% AND qualityScore < 6 → deprecated=true  
Rehabilitation: repairRate ≤ 30% AND qualityScore ≥ 7 → deprecated=false

## Pipeline integration
- `designEvaluatorStep.ts` calls `recordComponentBuildResult()` after `recordEvaluatorScore()`; extracts componentId from hint via `hint.split(/\s/)[0]`
- `frontendStep.ts` calls `isComponentDeprecated()` + `getBestAlternativeInCategory()` after `selectRegistryComponentsServer()`; swaps or removes deprecated components
- `EvaluatorResult` now includes `componentsUsed: Array<{componentId, category}>`

## Telemetry
GET /telemetry/quality now returns `componentQuality` field (totalTracked, topComponents, deprecated, categoryRankings).

## Test count
530 tests pass (26 new in tests/integration/componentQuality.test.ts).

**Why:** Self-improving pipeline — bad components get flagged and avoided automatically over time.
