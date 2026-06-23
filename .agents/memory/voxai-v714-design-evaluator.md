---
name: VoxAI V7.1.4 Design Evaluator
description: Post-repair design quality scoring engine with LLM auto-repair loop. Pure static analysis, no LLM in scoring.
---

# VoxAI V7.1.4 — Design Evaluator Agent + Auto Repair Loop

## Architecture
```
buildPipeline.ts: repairStep → DesignEvaluatorStep → backendStep
```

## Files Added
- `src/agents/designEvaluator/evaluator.ts` — `evaluateDesign()`: pure fn, 6 dimensions
- `src/agents/designEvaluator/repairAgent.ts` — `runDesignRepair()`: LLM repair, max 8 issues/pass
- `src/agents/pipeline/designEvaluatorStep.ts` — orchestrates eval+repair loop, emits SSE
- `src/telemetry/evaluatorMetrics.ts` — `recordEvaluatorScore()` → `runtime.evaluator` section
- `src/tests/integration/designEvaluator.test.ts` — 17 tests

## Files Modified
- `buildPipeline.ts` — added `runDesignEvaluatorStep` between repairStep and backendStep; `done` SSE uses `evaluatedFrontend.fixedCode`

## Scoring Dimensions (weights)
- Hero 25%: badge+2, h1+2, p+1, dual-cta+3, trust-signal+2
- Layout 20%: section-count+2, bg-alternation+4, no-consec-grids+2, non-card+2
- CTA 15%: solid-btn+3, outline-btn+3, unique-text+2, no-vague+2
- Accessibility 20%: type=button+3, focus-visible+3, aria-label+2, no-low-opacity+2
- Shadcn 10%: Button+2, Card+2, Badge+2, advanced(Avatar/Input/Accordion/Tabs)+1each
- Consistency 10%: no-lorem+2, no-placeholder-names+2, ≤2-radii+2, ≤1-gradient-family+2, no-low-opacity+2

**Overall = weighted sum of 6 scores**

## Repair Loop
- Threshold: `< 8.0` triggers repair
- Max passes: `MAX_DESIGN_REPAIR_PASSES = 2` (exported constant)
- Infinite loop: impossible — `repairCount` monotonically increments; `evaluateDesign` is pure
- On repair error: `break` immediately
- If repair output < 50% of input length: kept original, `error` returned

## SSE Events Added
`design_eval_start`, `design_eval_result`, `design_repair_start`, `design_repair_done`
All additive — no existing events changed.

## Telemetry
`recordEvaluatorScore()` in `evaluatorMetrics.ts` → `globalMetrics.setSection('runtime', { evaluator: ... })`
Queryable at `GET /api/telemetry/metrics` → `runtime.evaluator`
No new endpoints.

## Known Gaps
1. `bg-[#hex]` alternation check misses CSS token classes (`bg-background`)
2. `projectFiles` array not updated after repair — only `fixedCode` updated
3. `done` SSE does not include `evaluationResult` — frontend must read `design_eval_result` event separately
4. Trust signal regex may miss CSS-only logo clouds

## Test Count
487 → 504 (+17 new in designEvaluator.test.ts)

**Why:** Generated output was never evaluated — "if generation succeeds, quality is acceptable" assumption was incorrect. Static scoring is fast (no LLM, <5ms) and deterministic. LLM repair only triggers when score < 8.0, keeping overhead minimal.
