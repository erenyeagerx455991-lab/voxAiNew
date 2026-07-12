---
name: VoxAI V8.7 DevOps Architect
description: 28-module static DevOps planning engine, step 0.7 in pipeline; key constraints, naming quirks, test fixes.
---

## Rule
Step 0.7 — `runDevOpsArchitectStep` executes after `runBackendArchitectStep` (0.6) and before the LLM Planner (step 1). Zero LLM calls; pure deterministic functions only.

**Why:** V8.7 spec requires all DevOps architecture generation to be static/deterministic so it completes in < 10ms and never consumes AI quota.

## Key quirks found during implementation

- **`deploymentPlanner.ts` naming**: function is `planDevOpsDeployment` (not `planDeployment`) to avoid collision with `backend-architect/deploymentPlanner.ts`.
- **`DevOpsMetricsSnapshot`**: re-exported from `devopsMetrics.ts` (also via facade), NOT from `devopsTypes.ts` — import from the right place in tests.
- **`isEnterprise` helper**: `SaaSBackend` is NOT in the ENTERPRISE array. Security planner uses `!isSimple(t)` to classify it as 'Standard' compliance (not 'Basic').
- **`capacityUsed` in persistence**: uses `Math.max(1, Math.round(...))` so 1-of-500 doesn't round to 0.
- **Integration test imports**: ESM project — never use `require()` in integration tests. Use named imports from `devopsFacade.ts` barrel exclusively.
- **`saveDevOpsBlueprint` must be imported**: it IS exported from facade, but was accidentally omitted from integration test imports — caused ReferenceError.

## 9 Validator Dimensions (ALL_DEVOPS_DIMENSIONS)
infrastructure, security, performance, reliability, scalability, cost, monitoring, deployment, recovery

## Persistence caps
- `devopsPersistence.ts`: max 500 snapshots  
- `devopsLearning.ts`: max 200 learning records  
- `devopsMetrics.ts`: max 500 metric records

## Test baseline
2994 tests pass, 0 failures, 79 test files (adds 166 tests over V8.6 baseline of 2828).
