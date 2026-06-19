---
name: VoxAI V6.4.9 Build Pipeline Extraction
description: Completed pipeline decomposition — build route reduced to 22 lines, 8 pipeline step files created.
---

## Summary

The `/agents/build` inline pipeline (was 878 LOC) was extracted into `src/agents/pipeline/`:

- `pipelineTypes.ts` — shared interfaces (PlannerOutput, ArchitectureOutput, FrontendOutput, BackendOutput, etc.)
- `plannerStep.ts` — step 0: Planner Agent (DNA + template selection)
- `architectureStep.ts` — step 1: Architecture Agent (blueprint + quality gate)
- `frontendStep.ts` — steps 2-4: Design + Frontend + CodeFix agents
- `repairStep.ts` — step 4: repair loop + build health
- `backendStep.ts` — steps 5-8: Backend/DB/Auth + Scaffold + KnowledgeGraph
- `runtimeValidationStep.ts` — step 9: real npm build + auto-repair loop
- `buildPipeline.ts` — thin orchestrator calling steps in sequence

## Key constraints

- `backendStep` takes `ArchitectureOutput` + `FrontendOutput` — it needs repaired frontend files to assemble `allFiles`
- `architectureStep` takes `PlannerOutput` PLUS the raw `prompt` string (needed for LLM call context)
- Execution sequence: plan → arch → frontend → repair → backend → runtime (sequential, not parallel for correctness)
- `buildPipeline.ts` exports `runBuildPipeline(input: BuildPipelineInput, res: Response)` — the only import needed in agents.ts

## Final LOC

- `routes/agents.ts`: 1254 (other routes: audit, edit, export, runtime-repair, autonomous-build still need their imports)
- `/agents/build` route body: 22 lines
- Largest pipeline file: `frontendStep.ts` at 205 LOC

## Tests

- Contract tests at `src/tests/integration/buildPipelineContract.test.ts` — 20/20 pass
- Security validation at `src/validation/securityCompletionValidation.ts`
- Decomposition report at `src/validation/decompositionValidation.ts`

**Why:** the remaining 54 LOC above the 1200 target are imports used by other routes (`validateFiles`, `classifyRuntimeError`, `buildRuntimeDependencyGraph`, etc). Cannot be removed without breaking audit/edit/runtime-repair/autonomous-build routes.
