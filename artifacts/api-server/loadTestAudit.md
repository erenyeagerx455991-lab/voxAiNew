# Load Test Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Scope: `scripts/load/10-users.ts`, `scripts/load/100-users.ts`, `scripts/load/500-users.ts`, result JSON files

---

## What Was Actually Tested

**File**: `scripts/load/10-users.ts:14-19`
```typescript
const result = await autocannon({
  url: `${BASE_URL}/api/healthz`,   // ← health check endpoint
  connections: 10,
  duration: 10,
  pipelining: 1,
});
```

**File**: `scripts/load/100-users.ts:14-19` — same endpoint.

Both tests hit `/api/healthz`. This endpoint returns:
```json
{"status":"ok"}
```

It involves:
- One JSON serialization
- Zero database calls
- Zero LLM calls
- Zero SSE streaming
- Zero queue activity
- Zero file I/O

---

## Measured Results (From Result Files)

### 10 Users — `scripts/load/results-10-users.json`
```json
{
  "concurrency": 10,
  "durationSeconds": 10,
  "requestsTotal": 24873,
  "throughputRps": 2487.7,
  "latencyAvgMs": 3.54,
  "latencyP50Ms": 3,
  "latencyP95Ms": 17,
  "latencyMaxMs": 43,
  "errors": 0,
  "non2xx": 0,
  "bytesPerSec": 2596864,
  "generatedAt": "2026-06-19T17:14:19.845Z"
}
```

### 100 Users — `scripts/load/results-100-users.json`
```json
{
  "concurrency": 100,
  "durationSeconds": 30,
  "requestsTotal": 99604,
  "throughputRps": 3320.64,
  "latencyAvgMs": 29.68,
  "latencyP50Ms": 28,
  "latencyP95Ms": 71,
  "latencyMaxMs": 238,
  "errors": 0,
  "non2xx": 0,
  "bytesPerSec": 3466342.4,
  "generatedAt": "2026-06-19T17:15:00.319Z"
}
```

---

## Was the Queue Active?

The queue was initialized (in-memory mode) but not exercised. The health endpoint does not interact with `buildQueue`, `queueWorker`, `buildEventBus`, or any queue module.

**Verdict**: Queue was NOT active during load tests.

---

## Were LLM Calls Disabled?

Yes — by the nature of the endpoint. `/api/healthz` makes no external API calls.

---

## Were Telemetry Systems Enabled?

The token budget, user limits, workspace registry, and queue metrics modules are all initialized at server startup, but none are touched by the health endpoint. Telemetry had zero overhead contribution to the measured numbers.

---

## Does the Benchmark Represent Real Production Load?

**NO.**

A real build request involves:

| Step | Typical duration |
|---|---|
| DNA/Planner agent (Groq) | 5–15 s |
| Design agent (OpenRouter) | 10–30 s |
| Codegen agent (OpenRouter) | 20–60 s |
| Backend/DB agents (Groq) | 5–20 s |
| Validation + repair loop | 5–30 s |
| SSE streaming to client | Duration of above |
| **Total** | **45 s – 2 min** |

The measured throughput of 2,488–3,321 req/s applies to health checks with ~10-byte payloads. A real build request holds an HTTP connection open for up to 5 minutes and makes 8-15 external API calls.

---

## Realistic Build Throughput Estimate

With WORKER_CONCURRENCY=3 (default) and average build time of 90 seconds:
- **Theoretical max**: 3 concurrent builds / 90 s = **0.033 builds/s = 2 builds/min**
- **Real bottleneck**: Groq TPM limits (6,000 TPM default) and OpenRouter rate limits
- **Per-user limit**: 2 concurrent builds

The reported 2,488–3,321 req/s numbers have no relationship to build capacity.

---

## 500-Users Script

**File**: `scripts/load/500-users.ts` — script exists. Never run. No results file. The script itself contains:
```typescript
console.log("WARNING: Requires a production/deployed environment...");
```

No 500-user results were collected. The `scripts/load/results-500-users.json` file does not exist.

---

## p95 < 200ms Claim — Verified For Health Check Only

The claim "p95 stays under 75ms at 100 users" is accurate for `/api/healthz`. This claim does not apply to build requests, which have p95 latency measured in tens of seconds.

---

## Summary

| Claim | Verified? | Notes |
|---|---|---|
| 2,488 req/s measured | YES | On `/api/healthz`, not build endpoint |
| 3,321 req/s measured | YES | On `/api/healthz`, not build endpoint |
| p95 < 200ms | YES | For health check only |
| Queue was active | NO | Queue not in request path for tested endpoint |
| LLM calls included | NO | Health check makes no LLM calls |
| 500-user test run | NO | Script exists, no results |
| Benchmark represents production build load | NO | Off by 4-5 orders of magnitude in latency |
