---
name: VoxAI V9.2 Adaptive Multi-Agent Orchestrator
description: New src/agent-orchestrator/ module — deterministic execution-planning brain; how it's wired into buildPipeline.ts and what constraints govern it.
---

New module `src/agent-orchestrator/` (registry, dependency graph, execution planner, parallel scheduler, retry engine, context allocator, model allocator, cost intelligence, health monitor, learning, persistence, telemetry). Deterministic, no LLM calls — reuses Runtime Intelligence's `GenerationMode` for complexity classification instead of writing a duplicate classifier (Fast/Safe→simple, Balanced/Strict→standard, else→enterprise).

**Why wiring was scoped down from "true parallel execution":** `buildPipeline.ts`'s real steps have hard data dependencies (e.g. BackendArchitect literally consumes FrontendArchitect's output as an argument) that don't match the spec's abstract "Frontend + Backend can run in parallel" example. Restructuring those signatures to enable real concurrency would risk correctness for cosmetic parallelism gains, so the dependency graph's `parallelGroups` field reflects the *conceptual* agent graph (used for cost/time prediction and telemetry) rather than driving actual `Promise.all` execution in buildPipeline.ts.

**What is actually load-bearing:** the Orchestrator runs as a real pipeline step (`orchestratorStep.ts`, after Runtime Intelligence, before Planner) and its `skippedAgents` decision genuinely skips the 6 pass-through-safe enrichment steps (UXIntelligence, DesignCritic, ConversionIntelligence, Accessibility, Optimization, DesignDirector) for simple/standard builds — passing the previous step's frontend object straight through unchanged. This is safe specifically because every downstream consumer of those steps' fields already used `?? default` fallbacks (verified before wiring).

**How to apply:** if extending real parallelism further, first verify with the actual step function signatures (not the spec's assumed graph) which steps have zero shared-object data dependencies; do not assume the spec's example graph matches the codebase's true dependency graph.

Gotchas: `buildPipelineContract.test.ts` and similar "contract" tests use hardcoded literal objects, not real pipeline execution — safe to wire real skip/gating logic into `buildPipeline.ts` without touching those tests. Skipping DesignCritic requires an explicit cast (`CriticStepOutput extends EvaluatorStepOutput` with 2 added fields) since it's a type-only widening, not a runtime issue.

Repo has a pre-existing broken `pnpm run typecheck` baseline unrelated to any VoxAI feature work (backend-architect `ProductFeature` union gaps, `devopsFacade.ts` duplicate identifier, `queueWorker.ts` ioredis version mismatch, `uxIntelligence.test.ts` readonly array literal). Confirmed via `git stash` before this change — do not attempt to fix these unless asked; only check that your own diff doesn't add new lines to the error list.
