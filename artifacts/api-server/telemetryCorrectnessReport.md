# Telemetry Correctness Report — V6.4.9.2

## Summary

All 3 critical correctness issues (C1, C2, C3) identified in the V6.4.9.1 audit have been resolved.
206 tests pass across 19 test files. 0 failures.

---

## Repair Metrics (C1 Fix)

**Problem:** `repairMetrics.ts` functions were never called in production code. `/api/telemetry/metrics` always reported `repairs = 0`.

**Locations wired:**

| File | What was added |
|---|---|
| `src/agents/pipeline/repairStep.ts` | `recordRepairAttempt()` per file per pass; `recordRepairSuccess()` on cleaned result accepted; `recordRepairFailure()` on empty/short result or exception or max-pass exhaust |
| `src/agents/pipeline/runtimeValidationStep.ts` | `recordRepairAttempt()` per repair target; `recordRepairSuccess()` when Groq fix accepted; `recordRepairFailure()` on empty result or exception |

**Counters verified:**

- `repairs.attempts` — increments on every file repair attempt
- `repairs.successes` — increments when fixed content passes length threshold
- `repairs.failures` — increments on exception, empty response, or max-pass exhaustion
- `repairs.totalAttempts`, `repairs.successfulRepairs`, `repairs.failedRepairs`, `repairs.successRate`, `repairs.averageRepairPasses` — all populated correctly in snapshot

**No duplicate counting:** Each file tracked by `buildId + filePath` key. A file entering a new pass gets a new `recordRepairAttempt` call (correct — it is a new attempt).

---

## AsyncLocalStorage Context (C2 Fix)

**Problem:** Module-level globals `_traceId`, `_requestId`, `_buildId`, `_sessionId` caused trace contamination between concurrent builds.

**Files created/modified:**

| File | Change |
|---|---|
| `src/telemetry/contextStore.ts` | **New.** `AsyncLocalStorage`-based context store with `runWithContext()`, `getContext()`, `setContext()`, `updateContext()` |
| `src/lib/structuredLogger.ts` | **Rewritten.** All 4 module-level globals removed. `emit()` now reads `getContext()` per call. `setLogContext()` and `clearLogContext()` kept as shims for backwards compatibility |

**Globals removed:**

```
let _traceId    ← deleted
let _requestId  ← deleted
let _buildId    ← deleted
let _sessionId  ← deleted
```

**API preserved:** All callers of `setLogContext()`, `clearLogContext()`, and `createLogger()` continue to work unchanged. The shims forward to `setContext()` internally.

**Concurrency guarantee:** Each `runWithContext()` call creates an isolated async context. Nested async operations (setTimeout, Promise.all, await chains) all inherit the parent context. Concurrent builds cannot bleed into each other.

---

## Memory Caps (C3 Fix)

**Problem:** All histogram arrays used unbounded `push()`. Long-running servers leaked memory continuously.

**Constants file created:**

`src/telemetry/constants.ts`

```ts
MAX_DURATION_SAMPLES = 1000
MAX_TOKEN_SAMPLES    = 1000
MAX_REPAIR_SAMPLES   = 1000
```

No magic numbers exist in any telemetry file. All files import from `constants.ts`.

**Files updated with capped arrays:**

| File | Arrays capped |
|---|---|
| `src/telemetry/metricsProvider.ts` | All histogram arrays via `cappedPush()` using `MAX_DURATION_SAMPLES` |
| `src/telemetry/buildMetrics.ts` | `durations[]` |
| `src/telemetry/agentMetrics.ts` | `latencies[]` per agent |
| `src/telemetry/tokenMetrics.ts` | `latencies[]` per provider |
| `src/telemetry/runtimeMetrics.ts` | `viteBuildDurations[]`, `repairLoopDurations[]`, `validationDurations[]` |
| `src/telemetry/repairMetrics.ts` | `repairPassCounts[]`, `repairRecords[]` |

**Cap behavior:** When array length exceeds cap, `arr.shift()` evicts the oldest sample before the new one is stored. Array never exceeds `MAX_SAMPLES` entries. Memory is O(1) bounded per histogram key.

---

## Validation

### Tests

| Test file | Tests | Status |
|---|---|---|
| `tests/integration/telemetryConcurrency.test.ts` | 5 | ✅ pass |
| `tests/unit/metricsMemoryCap.test.ts` | 7 | ✅ pass |
| `tests/integration/repairMetricsIntegration.test.ts` | 8 | ✅ pass |
| All pre-existing test files (16 files) | 186 | ✅ pass |
| **Total** | **206** | **✅ 206/206** |

### Concurrency tests verify

- Two simultaneous build contexts with `traceId=A` and `traceId=B` produce zero cross-contamination
- Three concurrent build contexts all isolated independently
- Nested async operations (setTimeout, Promise.all) inherit parent context
- `setContext()` mutation affects only the current async context, not peers

### Memory cap tests verify

- 10,000 inserts never exceed `MAX_DURATION_SAMPLES` stored values
- Oldest values evicted when cap is reached; newest values retained
- p50/p95/p99 calculations remain correct after cap
- Multiple histograms each capped independently
- Counters and gauges are not subject to sample caps (they are scalar, not arrays)
- `sum` field reflects only the capped sample set

### Endpoint regression (GET /api/telemetry/metrics)

Response shape unchanged. All 5 pre-existing endpoint tests pass:
- Returns 401 when `API_KEY` set and no key provided
- Returns 200 in dev mode (no `API_KEY`)
- Response body has all required top-level keys: `builds`, `agents`, `tokens`, `repairs`, `runtime`, `counters`, `gauges`, `histograms`
- No secrets or prompts leaked
- `generatedAt` is a valid ISO timestamp

---

## Performance

| Metric | Before | After |
|---|---|---|
| Histogram memory growth | O(n) unbounded | O(1) bounded at 1,000 samples |
| Max samples per histogram | Unlimited | 1,000 |
| Max repair records | Unlimited | 1,000 |
| Concurrent build isolation | None (globals) | Full (AsyncLocalStorage) |

---

## Remaining Risks

- `setLogContext()` shim calls `setContext()` which mutates the current async store. If called outside a `runWithContext()` block (e.g. from top-level startup code), the mutation has no effect since there is no active store. This is safe but callers outside a request context will see no context fields in logs — same behaviour as before V6.4.9.2.
- `repairRecords` array in `repairMetrics.ts` is searched by linear scan (`Array.find`). At MAX_REPAIR_SAMPLES=1000 this is negligible. If the cap is raised significantly, a Map indexed by `buildId:filePath` would be more efficient.
- Build-level `buildId` is passed to `repairStep.ts` via a type assertion on the `frontend` object. If `buildId` is absent, it falls back to `"unknown"`, grouping all repair records under one key. The upstream pipeline should propagate `buildId` explicitly for full per-build repair tracking.
