---
name: VoxAI V9.7 Autonomous Planning Intelligence Engine
description: 22-module deterministic planning layer; step 0.997; 13 planners; 179 new tests (4113 pass total)
---

## Rule
Step 0.997 in `buildPipeline.ts` — after ExecutionIntelligence (0.995), before Planner (1). Zero LLM calls.

## Key Details
- 22 source files in `src/planning-intelligence/`
- 13 planners: goal → requirement → dependency → milestone → roadmap → feature → task → risk → estimation → increment → priority → implementation → validation
- `buildPlanningBlueprint()` orchestrates all 13; `buildFallbackPlanningBlueprint()` never throws
- Persistence cap: 500 (same as V9.6); Learning cap: 500; Metrics cap: 500
- `planningFacade.ts`: `rollbackPlanning` is a re-export of `getPlanningSnapshot` (NOT a dynamic require)
- `priorityPlanner.ts` in planning-intelligence/ = FEATURE priority; the one in execution-intelligence/ = TASK priority (distinct)
- Sprint counts: simple=2, standard=3, enterprise=5 (these are regression-tested and hardcoded)
- Increment counts: simple=3, standard=4, enterprise=5

**Why:** Provides the Planner agent with a deterministic 8-line context string summarizing goals, features, risks, critical path, and cost estimate without any LLM calls, enriching generated output quality at ~0 added latency.

**How to apply:** Any new module adding a planner must: (1) add types to planningTypes.ts, (2) export from index.ts, (3) call from planningIntelligence.ts buildPlanningBlueprint(), (4) add tests in planningIntelligence.test.ts.
