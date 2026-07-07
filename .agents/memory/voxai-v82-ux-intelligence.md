---
name: VoxAI V8.2 UX Intelligence & Conversion Prediction Engine
description: Static UX scoring step (step 6.5) between Repair and DesignEvaluator; 17 metrics; conversion prediction; DNA learning; debounced persistence.
---

## Key Architecture

- **Pipeline position:** step 6.5 (between Repair=6 and DesignEvaluator=7)
- **All scoring is static** — pure code analysis, no LLM, no I/O, ~1–5ms
- **Entry point:** `src/agents/pipeline/uxIntelligenceStep.ts` → calls `predictUX()` from `src/ux-intelligence/uxPrediction.ts`
- **8 files** in `src/ux-intelligence/` (types, heuristics, ranking, prediction, learning, metrics, persistence, facade)

## Critical Invariants

**Why:** These were review-blocking bugs fixed before ship — do not regress.

1. **AgentName must include `"UXIntelligence"`** in `src/telemetry/agentMetrics.ts` union.
2. **`predictUX()` wrapped in try/catch** in the pipeline step — SSE stream must never break from UX step.
3. **`hydrateUXLearning(records)`** called at startup after `initUXPersistence()` resolves — links disk to in-memory.
4. **`CandidateScore.uxScore` is required** — legacy fixtures must include `uxScore: 5` (neutral).
5. **`EvaluatorResult.issues` must be `EvaluationIssue[]`** (not `Array<{category:string;...}>`) — narrower union literal required for structural compatibility with `EvaluationResult`.
6. **`resetUXLearning()` clears `_saveTimer`** — if this is removed, debounce timer bleeds across tests.
7. **`NEUTRAL_UX_METRICS`** must contain all 16 `UXMetrics` fields — used in `learnFromVisualDiff()` when no code is available to analyze.

## Persistence Save Semantics

`learnFromUX()` schedules a debounced disk write (30-second single-fire timer) after every history push. Multiple calls within 30s coalesce into one write. Fully non-blocking — `saveUXSnapshot()` runs inside `setTimeout` callback with no await. After timer fires, next call starts a fresh window. `resetUXLearning()` calls `clearTimeout(_saveTimer)` to reset state for test isolation.

## Formula Reference

### Overall UX Score weights (sum = 1.00)
trust 14%, ctaDiscoverability 14%, hierarchy 11%, navigationSimplicity 10%, formFriction 10%, accessibilityConfidence 10%, whitespaceBalance 8%, informationDensity 8%, visualClarity 7%, motionComfort 4%, perceivedPerformance 4%

### Candidate Selection weights (V8.2)
`65% evaluator + 25% visual + 10% UX` (was 70/30 in V7.3.4). Tie-break: combinedScore → uxScore → visualScore → accessibilityScore → shadcnScore → consistencyScore.

### Evaluator blend
`overallScore = eval * 0.96 + uxPredictionScore * 0.04` — only when `uxReport` present; backward-compatible when absent.
