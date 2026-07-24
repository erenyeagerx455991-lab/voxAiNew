---
name: VoxAI V10.1 Meta Intelligence Engine
description: 17-module deterministic meta-brain (step 0.9995); key quirks, wiring points, and test baseline.
---

# VoxAI V10.1 Autonomous Meta Intelligence Engine

## Rule
Step 0.9995 — between SelfOptimizationEngine (0.999) and Planner (1.0). Observes the whole AI system, produces a MetaBlueprint, appends contextString to the enriched prompt fed to Planner. Zero LLM calls. Never blocks pipeline (full try/catch → fallback).

**Why:** Spec requires "Brain that continuously improves the Brain" — deterministic, advisory only, no code generation.

**How to apply:** Any new upstream engine score should be added to MetaContext and threaded through metaFacade → all 9 sub-modules automatically pick it up via optional fields.

## Key quirks

### Tuple type inference (metaEvolution.ts)
TypeScript cannot infer `[[string, number], ...]` from array literals. Must use:
```typescript
([ ['Name', score], ... ] as Array<[string, number]>).sort(...)
```
The pre-existing typecheck baseline already has errors in buildPipeline.ts step-11 (design optimization `runOptimizationStep` args, `.design`, `.fixedCode`) and frontendStep.ts — those are NOT introduced by V10.1.

### AgentName union
Added `"MetaIntelligence"` to `src/telemetry/agentMetrics.ts`. Must extend this union for every new `withAgentMetrics()` call.

### Duplicate import guard
The old `import { runOptimizationStep }` at line 50 of buildPipeline.ts was removed when adding the complete `import { runOptimizationStep, finalizeOptimizationStep }` at line 67. Always check for duplicate imports when adding to buildPipeline.ts.

## Module inventory (17 files in src/meta-intelligence/)
metaTypes, metaAnalyzer, metaPlanner, metaEvaluator, metaScoring, metaPrediction, metaRecommendations, metaEvolution, metaHealth, metaDiagnostics, metaValidator, metaLearning, metaMetrics, metaPersistence, metaTelemetry, metaFacade + metaStep (in src/agents/pipeline/)

## Wiring (4 files touched)
- `src/telemetry/agentMetrics.ts` — AgentName union
- `src/index.ts` — Promise.all import init (metaPersistence/metaMetrics/metaLearning)
- `src/routes/telemetry.ts` — `metaIntelligence` block in quality response
- `src/agents/pipeline/buildPipeline.ts` — import metaStep, step 0.9995 call, finalize call, pass enrichedPromptWithMeta to Planner

## Validator weights (must sum to 1.00)
architecture:0.10, performance:0.10, learning:0.08, optimization:0.10, reasoning:0.10, planning:0.10, execution:0.10, workflow:0.08, knowledge:0.08, confidence:0.08, maintainability:0.06, reliability:0.02

## Persistence
500-cap in-memory Map keyed by integer version. `capacityUsed = Math.max(1, Math.round((total/500)*100))`.

## Test baseline
4580 tests pass (4426 V10.0 baseline + 154 new meta-intelligence tests). Test file: `src/tests/unit/metaIntelligence.test.ts`.
