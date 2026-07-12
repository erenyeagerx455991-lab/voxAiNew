---
name: VoxAI V9.1 Runtime Intelligence — Evaluator Weight Activation
description: RuntimeBlueprint.evaluationStrategy.weights now actually drives Design Evaluator scoring (was advisory-only in V9.0); where the wiring lives and two TS pitfalls to watch for.
---

The V9.1 spec's one gap from V9.0 (`evaluationStrategy.weights` computed but unused) was already fully implemented in the repo when this task started — `evaluateDesign()` takes `runtimeWeights`, `computeEffectiveWeights()` in `evaluator.ts` remaps the static per-dimension `WEIGHTS` onto 5 runtime macro-categories (visual/conversion/accessibility/usability/animation), and `EvaluationResult` carries `weightsApplied`/`dynamicWeightsUsed`. Telemetry (`runtimeMetrics.ts`), learning (`runtimeLearning.ts`, records `weightProfile`), and persistence with rollback/version history (`runtimePersistence.ts`, `getActiveEvaluatorProfile()`) were also already built. Only a dedicated unit-test file for this wiring was missing — added at `src/tests/unit/runtimeEvaluatorWeights.test.ts`.

**Two TS bugs fixed while verifying (both introduced by the same V9.1 work, not caught until a full `tsc` run):**
1. `runtimePersistence.ts` imported `RuntimeSnapshot` as a type but never re-exported it, so `runtimeFacade.ts`'s `export type { RuntimeSnapshot as RuntimeSnapshotRecord } from './runtimePersistence.js'` failed — needs an explicit `export type { RuntimeSnapshot } from './runtimeTypes.js';` re-export line in `runtimePersistence.ts`.
2. `EvaluatorResult` (the pipeline-step-local interface in `designEvaluatorStep.ts`) wasn't updated when `EvaluationResult` gained `weightsApplied`/`dynamicWeightsUsed` — broke type-assignability in `designCriticStep.ts`/`conversionStep.ts` even though the runtime spread (`...evalResult`) already carried the fields correctly. When evaluator.ts's core result type gains a field, grep for every step-local "shadow" interface (`EvaluatorResult`, etc.) that mirrors it.

**How to apply:** before assuming a "still advisory-only" gap noted in an earlier memory file is still open, grep the actual code first — a prior session may have closed it without a memory update. Always run a full `pnpm run typecheck` after touching runtime-intelligence/evaluator code; `pnpm run test` alone won't catch interface-shadow mismatches like #2.
