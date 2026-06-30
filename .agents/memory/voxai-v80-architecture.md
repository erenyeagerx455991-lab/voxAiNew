---
name: VoxAI V8.0 Architecture Cleanup
description: Modular orchestrator, unified context, extracted agents, two new pipeline steps, slimmed route handler
---

# V8.0 Architecture Cleanup

## What was built

| File | Purpose |
|---|---|
| `src/context/buildContext.ts` | `BuildContext` immutable type + `snapshotContext()` (keys stripped) |
| `src/context/contextBuilder.ts` | `createBuildContext()` factory + `enrichContext()` + `validateBuildContext()` |
| `src/orchestrator/toolRouter.ts` | `routeToStrategy()` maps request → `BuildStrategy`; `classifyPromptIntent()` heuristic |
| `src/orchestrator/orchestrator.ts` | Central coordinator wrapping `runBuildPipeline`; zero business logic |
| `src/agents/edit/editAgent.ts` | Extracted edit pipeline (intent → resolver → patch → quality gate → merge) |
| `src/agents/audit/auditAgent.ts` | Extracted audit (planner + design agent + template routing + architecture diversity) |
| `src/runtime/runtimeRepairAgent.ts` | Extracted runtime repair (classify → target → 3-pass repair → quality gate) |
| `src/agents/pipeline/accessibilityStep.ts` | WCAG 2.1 AA evaluation + repair; step 10; `AccessibilityStepOutput` extends `FrontendOutput` |
| `src/agents/pipeline/optimizationStep.ts` | Bundle + render efficiency scoring; step 11; static analysis only (no LLM) |
| `src/agents/pipeline/buildPipeline.ts` | 13-step pipeline; steps 10+11 inserted after ConversionIntelligence |
| `src/routes/agents.ts` | Slimmed to pure HTTP adapters; delegates all logic to agent modules |
| `src/telemetry/agentMetrics.ts` | `AgentName` union extended: CandidateSelection, DesignEvaluator, DesignCritic, ConversionIntelligence, Accessibility, Optimization |

## AgentName union — always extend here first
When adding a new `withAgentMetrics()` call, add the string to the `AgentName` union in
`src/telemetry/agentMetrics.ts` **first** — TypeScript will error if you don't.

## Route handler void-return pattern
All Express async route handlers must use `{ res.status(XXX).json(...); return; }` — NOT
`return res.status(XXX).json(...)` — to satisfy TypeScript's TS7030 "not all code paths return" rule.

## Pipeline step numbering
Steps 10 and 11 (Accessibility, Optimization) emit SSE `{ type: "step", step: 10|11, ... }`.
Runtime validation still emits `step: 9` — step numbers are SSE identifiers, not execution order.

## Tests and build
1417 tests pass, build clean, all V8.0 type errors resolved.
Pre-existing type errors in conversionStep, designCriticStep, designEvaluator, queueWorker (ioredis version mismatch) are NOT new — they predate V8.0.

**Why:** Code review caught that `AgentName` was a strict union (not `string`) causing typecheck failure when new agent names were used without registration.
**How to apply:** Any new step/agent must add its name to `AgentName` before using `withAgentMetrics()`.
