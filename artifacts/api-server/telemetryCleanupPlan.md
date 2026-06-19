# Telemetry Cleanup Plan — V6.4.9.1

> Priority-ranked fixes based on direct source inspection.
> Date: 2026-06-19

---

## CRITICAL

### C1 — Wire `repairMetrics` to Production Code

**Problem**: `recordRepairAttempt`, `recordRepairSuccess`, `recordRepairFailure` are never called in production. The entire `repairs` section of `/api/telemetry/metrics` returns zeros permanently.

**Where to add calls**:

```
src/agents/pipeline/repairStep.ts
  - for each file in repair loop: recordRepairAttempt(buildId, file.name)
  - on success: recordRepairSuccess(buildId, file.name, pass+1)
  - on failure after max passes: recordRepairFailure(buildId, file.name)

src/routes/agents.ts (runtime-repair route, ~line 870)
  - after repair attempt: recordRepairAttempt(chatId, failingFile.name)
  - on repairedSuccessfully: recordRepairSuccess(chatId, lastRepairedFile, attemptNumber)
```

**Requires**: import `{ recordRepairAttempt, recordRepairSuccess, recordRepairFailure }` from telemetry module. Pass `buildId`/`chatId` through function signatures or access from closure.

**Impact**: Repair metrics go from zero-always to actually useful.

---

### C2 — Fix Concurrent Log Context (AsyncLocalStorage)

**Problem**: `setLogContext`/`clearLogContext` in `structuredLogger.ts` use module-level globals. Two concurrent builds overwrite each other's traceId/requestId/buildId.

**Current (broken under concurrency)**:
```typescript
let _traceId: string | null = null;   // shared by all concurrent requests
```

**Fix**: Replace with `AsyncLocalStorage<LogContext>`:
```typescript
import { AsyncLocalStorage } from "node:async_hooks";
const storage = new AsyncLocalStorage<{ traceId: string; requestId: string; buildId: string; }>();

export function setLogContext(ctx: ...) { /* storage.run(ctx, ...) */ }
// emit() reads from storage.getStore() instead of globals
```

This is a Node.js built-in (no dependencies). The `buildPipeline.ts` call site signature does not need to change.

**Impact**: Log lines from concurrent builds no longer contaminate each other's trace context. HIGH correctness improvement.

---

### C3 — Cap Unbounded Duration Arrays

**Problem**: Every `recordDuration()` call appends to an array that grows forever. All duration arrays in `metricsProvider.ts`, `buildMetrics.ts`, `agentMetrics.ts`, `tokenMetrics.ts`, and `runtimeMetrics.ts` are unbounded.

**Fix**: Add a cap in `metricsProvider.recordDuration()`:
```typescript
recordDuration(key: string, durationMs: number): void {
  const existing = this.histograms.get(key) ?? [];
  existing.push(durationMs);
  if (existing.length > 1000) existing.splice(0, existing.length - 1000);  // sliding window
  this.histograms.set(key, existing);
}
```

Also cap domain module arrays:
```typescript
// buildMetrics.ts
if (durations.length > 500) durations.splice(0, durations.length - 500);

// agentMetrics.ts — inside getOrCreate
rec.latencies = rec.latencies.slice(-500);

// tokenMetrics.ts
if (rec.latencies.length > 500) rec.latencies.splice(0, rec.latencies.length - 500);

// runtimeMetrics.ts — all three arrays
if (viteBuildDurations.length > 500) viteBuildDurations.splice(0, viteBuildDurations.length - 500);
```

Also cap `builds` Map in `buildMetrics.ts`:
```typescript
// In syncSnapshot or recordBuildStart:
if (builds.size > 500) {
  const oldest = [...builds.keys()].slice(0, builds.size - 500);
  oldest.forEach(k => builds.delete(k));
}
```

**Impact**: Eliminates OOM risk on long-running instances. After fix: max ~5 MB for telemetry regardless of uptime.

---

## HIGH

### H1 — Wire `recordAgentRetry` to Retry Logic

**Problem**: `recordAgentRetry` is exported but never called. Retry logic exists (architectureStep.ts has a blueprint retry, frontendStep.ts has a DNA retry) but does not instrument retries.

**Where to add**:
```
src/agents/pipeline/architectureStep.ts:72 (blueprint validation retry)
  → recordAgentRetry("Architecture")

src/agents/pipeline/frontendStep.ts:117 (DNA verification retry)
  → recordAgentRetry("Design")

src/agents/pipeline/repairStep.ts (each repair pass)
  → recordAgentRetry("Repair")
```

**Impact**: Retry rates become observable — currently invisible.

---

### H2 — Wire `recordValidationDuration` to Static Validator

**Problem**: `recordValidationDuration` exists but has no call site. The static validator (`validateFiles()`) is called in multiple places.

**Where to add**:
```
src/agents/pipeline/repairStep.ts (validateTsxFile loop)
  → const t = Date.now(); ... recordValidationDuration(Date.now() - t)

src/routes/agents.ts (autonomous build loop, validateFiles calls)
  → wrap each validateFiles() with timer
```

---

### H3 — Migrate Remaining 8 Production Console.* Calls

**Files**: `backendAgent.ts` (6), `dnaAgent.ts` (1), `frontendAgent.ts:45` (1)

These run on every build pipeline invocation. They should use `createLogger`.

Pattern:
```typescript
import { createLogger } from "../../lib/structuredLogger.js";
const log = createLogger("BackendAgent");
// replace console.log → log.info("BACKEND_EXTRACTED", { count: extracted.length })
// replace console.error → log.error("BACKEND_GENERATION_FAILED", { error: String(e) })
```

---

## MEDIUM

### M1 — Add Per-Step Child Spans

**Problem**: `childSpan` is exported and tested but never called. All pipeline steps share one root span — no per-step timing or nesting.

**Fix**: Pass the trace context into each pipeline step function and create a child span:
```typescript
// plannerStep.ts
export async function runPlannerStep(prompt, keys, res, parentTrace?: TraceContext) {
  const span = parentTrace ? childSpan(parentTrace) : createTraceContext();
  setLogContext({ traceId: span.traceId, requestId: span.requestId });
  ...
}
```

This requires updating `buildPipeline.ts` to pass `trace` into each step call.

---

### M2 — Remove Dead `logger` Export from structuredLogger

**Problem**: `export const logger = createLogger("api-server")` on line 61 of `structuredLogger.ts` is imported by zero files.

**Fix**: Delete the line. Any consumer that needs a logger should call `createLogger(name)` directly.

---

### M3 — Remove Dead `traceToHeaders` Export or Wire It

**Problem**: `traceToHeaders` is exported and tested but never called in production. It has value only if trace context is propagated to downstream services (e.g. outbound HTTP to Groq/OpenRouter via a header). Currently unused.

**Options**:
- Wire it into `llmClient.ts` Groq/OpenRouter fetch calls (adds `x-trace-id` headers)
- Or delete it until needed

---

### M4 — getSnapshot Functions Only in Tests

`getBuildSnapshot`, `getAgentSnapshot`, `getTokenSnapshot`, `getRepairSnapshot`, `getRuntimeSnapshot` are never called in production code — only in tests and from their own module's internal `syncSnapshot`.

The endpoint reads `globalMetrics.snapshot()` directly, bypassing these.

**Option A** (clean): Remove getSnapshot functions; the tests call the domain record/sync functions directly and assert on `globalMetrics.snapshot()`.

**Option B** (keep for debugging): Document them as debug utilities only.

---

### M5 — Deduplicate Percentile Function

The `computePercentile` / `percentile` helper is independently defined in:
- `metricsProvider.ts`
- `buildMetrics.ts`
- `agentMetrics.ts`
- `tokenMetrics.ts`
- `runtimeMetrics.ts`

Five copies. Extract to a shared `src/telemetry/utils.ts` and import.

---

## LOW

### L1 — `MetricsProvider` Interface is Unused as a Type Constraint

`MetricsProvider` interface is defined but no function signature types against it (it's only satisfied by `MemoryMetricsProvider`). Useful if a Prometheus or OTel adapter is added — otherwise noise.

No action needed, but add a comment if keeping.

---

### L2 — `buildMetrics.ts` Stores Prompt (80 chars) with No Purpose

`BuildRecord` stores `prompt: prompt.slice(0, 80)` but this field is never exposed in any snapshot. It sits in memory unused.

**Fix**: Remove prompt from BuildRecord or include it in `recentBuilds` with a clear privacy note.

---

### L3 — `repairRecords` Array in `repairMetrics.ts` is Unbounded

Even after C3 (cap durations), `repairRecords: RepairRecord[]` grows without bound. The snapshot only shows `slice(-20)` but the full array accumulates.

**Fix**: Cap at 100 entries:
```typescript
if (repairRecords.length > 100) repairRecords.splice(0, repairRecords.length - 100);
```

---

## Summary Table

| ID | Priority | Action | Files Affected |
|---|---|---|---|
| C1 | CRITICAL | Wire repairMetrics to production | repairStep.ts, agents.ts |
| C2 | CRITICAL | AsyncLocalStorage for log context | structuredLogger.ts, buildPipeline.ts |
| C3 | CRITICAL | Cap all duration arrays | metricsProvider.ts, buildMetrics.ts, agentMetrics.ts, tokenMetrics.ts, runtimeMetrics.ts |
| H1 | HIGH | Wire recordAgentRetry | architectureStep.ts, frontendStep.ts, repairStep.ts |
| H2 | HIGH | Wire recordValidationDuration | repairStep.ts, agents.ts |
| H3 | HIGH | Migrate 8 remaining console.* | backendAgent.ts, dnaAgent.ts, frontendAgent.ts |
| M1 | MEDIUM | Add childSpan to pipeline steps | all pipeline steps, buildPipeline.ts |
| M2 | MEDIUM | Remove dead `logger` export | structuredLogger.ts |
| M3 | MEDIUM | Wire or remove traceToHeaders | llmClient.ts or traceContext.ts |
| M4 | MEDIUM | Decision on getSnapshot utilities | all telemetry modules |
| M5 | MEDIUM | Deduplicate percentile helper | telemetry utils.ts |
| L1 | LOW | Comment MetricsProvider interface | metricsProvider.ts |
| L2 | LOW | Remove unused prompt storage | buildMetrics.ts |
| L3 | LOW | Cap repairRecords array | repairMetrics.ts |

---

## Recommended Implementation Order

1. **C3** (memory cap) — safest, no behavior change, prevents OOM
2. **C1** (wire repairMetrics) — highest observability ROI, simple plumbing
3. **H3** (migrate console.* in backendAgent/dnaAgent) — completes hot-path migration
4. **C2** (AsyncLocalStorage) — correctness fix, moderate refactor
5. **H1 + H2** (wire retries and validation duration) — fills remaining metric gaps
6. **M1** (child spans) — tracing quality, larger refactor
7. **M2–M5, L1–L3** — housekeeping
