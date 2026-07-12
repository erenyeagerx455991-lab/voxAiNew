---
name: VoxAI V8.8 QA Architect
description: 25-module static QA/reliability planning engine, step 0.8 in pipeline; key constraints, routing decisions, test fixes.
---

## Rule
Step 0.8 — `runQAArchitectStep` executes after `runDevOpsArchitectStep` (0.7) and before the LLM Planner (step 1). Zero LLM calls; all planners are pure functions.

**Why:** V8.8 spec requires all QA architecture generation to be static/deterministic so it completes in < 10ms and never consumes AI quota.

## Key quirks found during implementation

- **Risk score caps at 10 for all non-trivial types**: Base items include 3 High-level risks (Auth/Authz/DB) which already sum to 7.5. Adding 3 Medium risks pushes over 10 for all types. Do NOT test `overallRiskScore` comparisons between types — test `highRiskCount` instead (Finance adds Payment as extra High, so count IS differentiated).
- **AgentName union must be extended**: `'QAArchitect'` added to `agentMetrics.ts` for `withAgentMetrics()` to compile. Every new step needs this.
- **DevOpsArchitect was also missing from the union**: Added `'DevOpsArchitect'` at the same time as V8.8 (V8.7 silently compiled because TS allows extra string literals as arguments in some configurations — guarded now).
- **`saveQABlueprint` must be in imports**: Same pattern as V8.7 — it IS in the facade, but easy to omit from test imports causing ReferenceError.
- **Facade imports**: All qa-architect functions export through `qaFacade.ts` — never import directly from sub-modules in tests.
- **10 validator dimensions** (not 9 like V8.7): testing, coverage, reliability, accessibility, performance, security, responsiveness, compatibility, risk, maintainability.

## Strategy Routing
Finance/Healthcare → e2e-first | APIGateway/LandingAPI → api-first | ECommerce/Social/Booking → ui-first | Marketplace/ERP/CRM → integration-first | default → unit-first

## Caps
- `qaPersistence.ts`: max 500 snapshots
- `qaLearning.ts`: max 200 learning records
- `qaMetrics.ts`: max 500 metric records

## Test baseline
3165 tests pass, 0 failures, 81 test files (adds 171 tests over V8.8 baseline of 2994).
