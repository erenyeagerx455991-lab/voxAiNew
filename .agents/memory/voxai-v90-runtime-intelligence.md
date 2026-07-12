---
name: VoxAI V9.0 Runtime Intelligence Engine
description: Generation-strategy brain (step 0.9, no LLM) that decides candidate count/repair policy/evaluation threshold per build; how it is wired into downstream steps and where it is still advisory-only.
---

The V9.0 engine (src/runtime-intelligence/) computes a `RuntimeBlueprint` (16 strategy dimensions) from prior architect outputs and classifies a `GenerationMode` (Fast/Balanced/Quality/Enterprise/Creative/Strict/Experimental/Safe). It was originally wired only as advisory text (`contextString` appended to the Planner prompt) plus telemetry/SSE — the blueprint was computed but never changed actual pipeline behavior.

**Fixed to be load-bearing, not decorative:**
- `runCandidateSelectionStep(..., runtimeBlueprint?)` → `generateCandidates(..., count)` now actually skips B/C generation for count=1 (Fast/Safe) or generates only B for count=2 (Balanced), saving real LLM calls. Count=5 (Experimental) is capped to 3 — no D/E variant directives exist yet in candidateGenerator.ts.
- `runRepairStep(..., runtimeBlueprint?)` honors `repairStrategy.policy === 'skip'` (short-circuits the whole loop, Fast mode) and `repairStrategy.maxPasses` (replaces the old fixed `MAX_REPAIR_PASSES = 3`).
- `runDesignEvaluatorStep(..., runtimeBlueprint?)` honors `evaluationStrategy.threshold` as the repair-trigger gate (replaces fixed `REPAIR_THRESHOLD = 8.0`) and strict mode gets +1 repair pass.
- All three params are optional with defaults matching pre-V9.0 behavior, so callers/tests that don't pass a blueprint are unaffected.

**Still advisory-only (real remaining gap, not yet wired):** `evaluationStrategy.weights` (dynamic per-project-type evaluator dimension weights) and the fixed `EVALUATOR_WEIGHT/VISUAL_WEIGHT/UX_WEIGHT` constants in candidateSelectionStep.ts / the internal weighting inside `evaluateDesign()` are NOT reweighted by the blueprint — landing/dashboard/enterprise still score with the same fixed weights regardless of mode. Reweighting `evaluateDesign()`'s internals is a bigger, separate lift (touches the 25-category evaluator core, not just a pipeline step).

**Why:** the task spec explicitly requires the engine to *control* generation, not just annotate it — "Everything becomes dynamic." Verified via live end-to-end build: Fast-mode prompt → candidateCount 1, repairAttempts 0, eval threshold 5; Strict/Enterprise prompt → candidateCount 3, repair policy aggressive/safe.

**How to apply:** when adding a new pipeline step whose behavior should vary by generation mode, take `runtimeBlueprint?: RuntimeBlueprint` as an optional trailing param (never required — keeps back-compat and unit tests simple) and read the relevant `*Strategy` field with a sensible default.
