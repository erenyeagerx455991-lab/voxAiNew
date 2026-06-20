# Benchmark Verification — V7.0.4 Independent Audit

Auditor: independent source review
Date: 2026-06-20
Scope: all load test scripts and result files

---

## Inventory of Load Test Artifacts

| File | Status |
|---|---|
| `scripts/load/10-users.ts` | Source — examined |
| `scripts/load/10-users.cjs` | Compiled output |
| `scripts/load/results-10-users.json` | Result file — examined |
| `scripts/load/100-users.ts` | Source — examined |
| `scripts/load/100-users.cjs` | Compiled output |
| `scripts/load/results-100-users.json` | Result file — examined |
| `scripts/load/500-users.ts` | Source — examined |
| `scripts/load/results-500-users.json` | Does NOT exist — test never run |

---

## Classification: 10-Users Test

**Script** (`10-users.ts:14-21`):
```typescript
const result = await autocannon({
  url: `${BASE_URL}/api/healthz`,
  connections: 10,
  duration: 10,
});
```

**Result** (`results-10-users.json`):
```json
{
  "concurrency": 10,
  "durationSeconds": 10,
  "requestsTotal": 24873,
  "throughputRps": 2487.7,
  "latencyAvgMs": 3.54,
  "latencyP95Ms": 17,
  "errors": 0
}
```

**Classification**: HEALTH CHECK TEST

The URL is `/api/healthz`. This is a synchronous JSON response returning server status with no AI calls, no queue operations, no database access, no SSE streaming.

The 2,487 req/s figure measures Express + JSON serialization latency only. It has zero bearing on build throughput.

---

## Classification: 100-Users Test

**Script** (`100-users.ts:14-22`):
```typescript
const result = await autocannon({
  url: `${BASE_URL}/api/healthz`,
  connections: 100,
  duration: 30,
});
```

**Result** (`results-100-users.json`):
```json
{
  "concurrency": 100,
  "durationSeconds": 30,
  "requestsTotal": 99604,
  "throughputRps": 3320.64,
  "latencyAvgMs": 29.68,
  "latencyP95Ms": 71,
  "errors": 0
}
```

**Classification**: HEALTH CHECK TEST

Same endpoint. 3,320 req/s measures the same health check handler under 100 parallel connections. Not representative of build capacity.

---

## Classification: 500-Users Test

**Script** (`500-users.ts`): Targets `/api/healthz`. Contains note: `"Run against a deployed instance — Replit dev env has limited fd capacity."`

**Classification**: HEALTH CHECK TEST (script exists, was never run — no results file)

---

## What Was Never Measured

| Metric | Status |
|---|---|
| `/agents/build` throughput | NOT MEASURED |
| Concurrent build capacity | NOT MEASURED |
| Queue wait time under load | NOT MEASURED |
| SSE streaming latency | NOT MEASURED |
| Build pipeline end-to-end time | NOT MEASURED |
| Memory growth during builds | NOT MEASURED |
| LLM provider timeout behavior | NOT MEASURED |

---

## Previously Reported Numbers — Reclassification

| Source | Reported As | Actual Subject | Classification |
|---|---|---|---|
| V7.0 scalabilityReport.md "2.5k req/s @ 10 users" | Build throughput | `/api/healthz` | HEALTH CHECK TEST |
| V7.0 scalabilityReport.md "3.3k req/s @ 100 users" | Build throughput | `/api/healthz` | HEALTH CHECK TEST |
| V7.0 scalabilityScorecard.md Queue Reliability score | Based on health check data | No build load tested | HEALTH CHECK TEST |

---

## Summary

All three load test scripts target `/api/healthz`.
Zero load tests target the build endpoint (`/agents/build`).
All previously reported throughput numbers measure health check performance only.
No benchmark exists for the actual build pipeline under concurrent load.

The build endpoint is an SSE endpoint that: (1) extracts user ID, (2) checks build limits, (3) checks token budget, (4) calls `enqueueBuild`, (5) streams events for the full pipeline duration (typically 30–120 seconds). Its throughput characteristics are fundamentally different from a health check endpoint and remain unmeasured.
