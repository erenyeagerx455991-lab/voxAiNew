---
name: VoxAI V9.9 Adaptive Intelligence Engine
description: 9-phase deterministic adaptive brain at step 0.998; strategy/agent/resource/quality/execution/failure/performance adaptation; persistence cap 500; 267 tests
---

# VoxAI V9.9 Autonomous Adaptive Intelligence Engine

**Step:** 0.998 — after PlanningIntelligence (0.997), before Planner (1)

**Module path:** `src/adaptive-intelligence/`

**Zero LLM calls. Fully additive. Never throws into pipeline.**

## Key decisions

**Strategy selection rules:**
- `complexity === 'enterprise'` → always `enterprise` (hard override, not a score race)
- `tokenEfficiency < 0.5` (high pressure) → `cost`
- `complexity === 'simple' && tokenEfficiency >= 0.75` → `speed`
- default → `balanced`

**Why:** Enterprise must always get maximum quality. High token pressure must always minimize cost. These are safety rules, not preferences.

**capacityUsed formula:**
```ts
total === 0 ? 0 : Math.max(1, Math.round((total / 500) * 100))
```
Use `Math.max(1, …)` when total > 0, otherwise 0. Avoids rounding to 0 for 1-2 records.
**Why:** Same issue as V8.7 DevOps — `Math.round(1/500*100) = 0` fails the `> 0` assertion.

**AgentName union:** Must be extended in BOTH locations:
1. `src/telemetry/agentMetrics.ts` — the `AgentName` used by `withAgentMetrics()`
2. `src/agent-orchestrator/types.ts` — the `AgentName` used by the orchestrator

V9.9 adds `'AdaptiveIntelligence'` to both. V9.5–9.7 added ReasoningEngine/ExecutionIntelligence/PlanningIntelligence only to `types.ts` — missing from `agentMetrics.ts` (pre-existing baseline error fixed in V9.9).

**Mock Response in SSE tests:**
Use `import type { Response as ExpressResponse } from 'express'` and cast mock as `unknown as ExpressResponse`. Do NOT use bare `Response` (global fetch type) — it produces TS2345 errors.

## Files created
- `src/adaptive-intelligence/adaptiveTypes.ts` — all types
- `src/adaptive-intelligence/adaptiveIntelligence.ts` — phases 1–9 + main builder
- `src/adaptive-intelligence/adaptiveLearning.ts` — phase 10 fire-and-forget
- `src/adaptive-intelligence/adaptiveMetrics.ts` — phase 11 rolling 500-record metrics
- `src/adaptive-intelligence/adaptivePersistence.ts` — phase 12 versioned 500-cap snapshots
- `src/adaptive-intelligence/adaptiveTelemetry.ts` — phase 13 re-export
- `src/adaptive-intelligence/adaptiveFacade.ts` — phase 18 public API
- `src/agents/pipeline/adaptiveIntelligenceStep.ts` — phases 14+15 SSE + pipeline
- `src/tests/unit/adaptiveIntelligence.test.ts` — 267 tests (phase 19)
- `artifacts/api-server/v9.9Audit.md` — phase 20 audit

## Files modified
- `src/telemetry/agentMetrics.ts` — added AdaptiveIntelligence + backfilled ReasoningEngine/ExecutionIntelligence/PlanningIntelligence
- `src/agent-orchestrator/types.ts` — added AdaptiveIntelligence to AgentName union
- `src/agent-orchestrator/agentRegistry.ts` — added AdaptiveIntelligence registry entry
- `src/agents/pipeline/buildPipeline.ts` — step 0.998 inserted, context string wired, finalize call added
- `src/index.ts` — V9.9 startup init block
- `src/routes/telemetry.ts` — `adaptiveIntelligence` field added to /api/telemetry/quality

## Test count
4259 total (267 new) — all pass.
