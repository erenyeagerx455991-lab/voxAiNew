# Build Load Baseline — V7.0.5

Captured: 2026-06-20T04:59:12Z
Purpose: Pre-test snapshot before any load testing

---

## Worker Configuration

| Parameter | Value | Source |
|---|---|---|
| `WORKER_CONCURRENCY` | 3 | `queueTypes.ts:50` default — env var not set |
| `DEFAULT_JOB_TIMEOUT_MS` | 300,000 ms (5 min) | `queueTypes.ts:48` |
| `MAX_JOB_RETRIES` | 1 | `queueTypes.ts:49` |
| Queue mode | **In-memory** | Redis unavailable (confirmed from startup log) |
| BullMQ Redis path | Inactive | `REDIS_URL` not set; `isRedisAvailable()` returns false |

---

## Queue Mode Evidence

Startup log (2026-06-20T04:55:24Z):
```
{"component":"RedisClient","event":"REDIS_UNAVAILABLE","message":"Redis not reachable — queue runs in-memory mode"}
{"component":"BuildQueue","event":"QUEUE_IN_MEMORY","reason":"Redis unavailable — using in-memory job tracking"}
{"component":"QueueWorker","event":"WORKER_IN_MEMORY","reason":"Redis unavailable — jobs execute inline via setImmediate"}
```

Consequence: All builds execute via `_inlineExecutor` (setImmediate dispatch). BullMQ retry, persistence, and distributed queue are inactive.

---

## Pre-Test Queue Metrics (from /api/telemetry/queue)

```json
{
  "enqueuedTotal": 0,
  "completedTotal": 0,
  "failedTotal": 0,
  "cancelledTotal": 0,
  "activeNow": 0,
  "queuedNow": 0,
  "avgWaitMs": 0,
  "avgDurationMs": 0,
  "p95WaitMs": 0,
  "p95DurationMs": 0,
  "byUser": {},
  "recentFailures": []
}
```

All counters are zero — server cold start, no builds have been processed since startup.

---

## Pre-Test Token Budget

```json
{
  "daily": { "groq": 0, "openrouter": 0 },
  "monthly": { "groq": 0, "openrouter": 0 },
  "limits": {
    "dailyGroqTokens": 2000000,
    "dailyOpenRouterTokens": 500000,
    "monthlyGroqTokens": 40000000,
    "monthlyOpenRouterTokens": 10000000,
    "emergencyShutdownThreshold": 95
  },
  "emergencyShutdown": false
}
```

---

## Pre-Test Provider Rate Limits

```json
{
  "groq":       { "currentRPM": 0, "maxRPM": 30, "currentTPM": 0, "maxTPM": 6000 },
  "openrouter": { "currentRPM": 0, "maxRPM": 60, "currentTPM": 0, "maxTPM": 20000 }
}
```

**Note**: `checkProviderBudget()` is not called in the live LLM path (confirmed in V7.0.4 audit). These limits are tracked in `providerBudget.ts` but are never enforced at the call site. Real provider rate limits (Groq API tier, OpenRouter API tier) apply externally.

---

## Pre-Test Server Resource Usage

Measured from server process after ~3 minutes of uptime with 0 builds:

| Metric | Value |
|---|---|
| Heap used | Captured from API process at startup — not sampled from external tool |
| RSS | Not directly measurable from bash (separate process) |
| Uptime | ~183 seconds at capture time |
| Total requests served | 4 (health checks only) |

---

## Build Pipeline Architecture

```
POST /agents/build
  → checkBuildLimit(userId)         [userLimits.ts]
  → checkTokenBudget()              [tokenBudget.ts]
  → recordBuildStarted(userId)      [userLimits.ts]
  → enqueueBuild(opts)              [buildQueue.ts]
      → setImmediate(_inlineExecutor)
          → executeBuildJob(jobId, data)
              → tokenContext.run(...)
                  → runBuildPipeline(...)
                      → runPlannerStep       [Groq: llama-3.3-70b-versatile]
                      → runArchitectureStep  [Groq: llama-3.3-70b-versatile]
                      → runFrontendStep      [OpenRouter: deepseek/deepseek-chat]
                      → runRepairStep        [Groq: llama-3.1-8b-instant]
                      → runBackendStep       [Groq: llama-3.3-70b-versatile]
                      → runRuntimeValidation [Groq: llama-3.1-8b-instant]
```

Every step makes at least one real LLM API call. Build duration is dominated by LLM response time.

---

## Expected Measurement Constraints

| Concurrency | Feasibility | Constraint |
|---|---|---|
| 1 user | Feasible | Single build: ~60–120s |
| 3 users | Feasible | 3 parallel builds; may hit Groq 30 RPM limit |
| 5 users | Constrained | 5 simultaneous Groq calls exceed 30 RPM/min default |
| 10 users | Not safe | Would consume >100k tokens/build × 10 = ~1M tokens in one run |
| 25 users | Not safe | Exceeds Groq TPM limit (6000/min default) within seconds |

The 5/10/25-user tests are documented as environment-constrained (LLM API limits, API cost, container resource limits). They are not run.
