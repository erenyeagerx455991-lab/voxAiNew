---
name: VoxAI V6.4.9 Observability & Telemetry
description: Structured telemetry foundation — 7 modules, structuredLogger, metrics endpoint, console migration, 206 tests.
---

## Rule
All production logging in hot-path files (pipeline steps, routes, security) must use `createLogger(component)` from `src/lib/structuredLogger.ts`, not `console.*`.

**Why:** Ad-hoc console.* produces unstructured, unsearchable logs. Structured JSON logs are machine-parseable by log aggregators. 28 console.* calls remain only in low-priority utility files (astResolver, backendAgent, etc.) — scheduled for V6.5.x.

**How to apply:** `import { createLogger } from "../../lib/structuredLogger.js"; const log = createLogger("MyModule");` — then `log.info("EVENT_NAME", { key: value })`.

## Telemetry Modules

- `src/telemetry/metricsProvider.ts` — `MemoryMetricsProvider` (counters, gauges, histograms, sections); `globalMetrics` singleton
- `src/telemetry/traceContext.ts` — `TraceContext` type, `createTraceContext()`, `childSpan()`, `withBuildId()`, `traceToHeaders()`
- `src/telemetry/buildMetrics.ts` — `recordBuildStart/Success/Failure`, `getBuildSnapshot()`
- `src/telemetry/agentMetrics.ts` — `withAgentMetrics(name, fn)`, `recordAgentRetry(name)`, `getAgentSnapshot()`
- `src/telemetry/tokenMetrics.ts` — `recordLLMCall({provider, model, latencyMs, success, promptTokens?, completionTokens?})`, `getTokenSnapshot()`
- `src/telemetry/repairMetrics.ts` — `recordRepairAttempt/Success/Failure`, `getRepairSnapshot()`
- `src/telemetry/runtimeMetrics.ts` — `recordRuntimeCheck(passed)`, `recordViteBuildDuration(ms)`, `recordRepairLoopDuration(ms)`, `recordValidationDuration(ms)`, `getRuntimeSnapshot()`

## Metrics Endpoint

`GET /api/telemetry/metrics` — protected by `authMiddleware` (bypassed in dev when `API_KEY` unset).
Returns snapshot of all 7 sections + counters/gauges/histograms. Never includes secrets, source code, or prompts.
Registered in `src/routes/index.ts` via `import telemetryRouter from "./telemetry.js"`.

## Migration Stats (before → after)

- Production `console.*` calls: **96 → 28** (−71%, 68 migrated)
- Migrated files: plannerStep, architectureStep, frontendStep, repairStep, backendStep, runtimeValidationStep, agents.ts, chat.ts, authMiddleware, workspaceCleanup, corsConfig, rateLimiter, contextManager
- Remaining 28 calls: astResolver.ts (13), backendAgent.ts (6), securityValidation.ts (5), frontendAgent.ts (2), dnaAgent.ts (1), packageScanner.ts (1)

## Test Count

- Before: 129 tests
- After: **206 tests** (+77)
- New test files: telemetryStore, buildMetrics, agentMetrics, tokenMetrics, repairMetrics, runtimeMetrics (unit); telemetryEndpoint, tracePropagation (integration)
- All 206 pass, build clean

## SSE Contract

Zero SSE event type changes. All pre-existing 129 tests continue to pass. Only `log.*` calls replaced `console.*` calls — no business logic changes.
