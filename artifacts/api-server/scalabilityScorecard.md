# Scalability Scorecard — V7.0

Auditor: independent code review
Date: 2026-06-19

---

## Scores

### Queue Reliability — 4 / 10

**Evidence**:
- `enqueueBuild()` is not called from the build route (`agents.ts:60-93`). The queue infrastructure exists but is not in the live execution path. (`queueAudit.md §Finding 1`)
- In-memory mode is the only mode in the current environment. All job state is lost on restart.
- `avgWaitMs` metric is permanently 0 due to a key-mismatch bug. (`queueMetrics.ts:60` vs `:65`)
- Worker recovery tests mock `runBuildPipeline` entirely — no real recovery is tested.
- **What works**: BullMQ library is imported and initializes cleanly. In-memory executor runs jobs correctly. Queue metrics (counts) are real.

---

### Persistence — 1 / 10

**Evidence**:
- Redis is unavailable in the Replit environment. There is no alternative persistence path.
- `_localJobs` is a module-level `Map`. No write-ahead log. No database. Process restart loses everything.
- Even with Redis, completed jobs are removed after 1 hour (`removeOnComplete: { age: 3600 }`).
- `_resetBudgetForTest()`, `_resetLimitsForTest()`, `_resetBusForTest()` all exist — confirming all state is ephemeral in-memory.
- **Score rationale**: 1 point for the BullMQ + ioredis code being correctly structured and ready to gain persistence once Redis is available.

---

### Recovery — 2 / 10

**Evidence**:
- No retry mechanism for in-memory mode. A failed job is marked failed and not re-queued. (`queueWorker.ts:55-61`)
- BullMQ retry config (`attempts: MAX_JOB_RETRIES + 1`, `backoff: exponential`) exists in Redis queue config (`buildQueue.ts:36-38`) but applies only to the Redis path which is inactive.
- No `unhandledRejection` handler — a process crash is not recovered from.
- All `workerRecovery.test.ts` tests mock the pipeline; no integration test exercises a real failed build recovery.
- **What works**: Caught exceptions are correctly handled and reported. `finally` block in agents.ts ensures `recordBuildCompleted` always runs.

---

### Observability — 6 / 10

**Evidence**:
- `getQueueMetrics()` returns real-time counters (enqueuedTotal, completedTotal, failedTotal, activeNow). (`queueMetrics.ts:97-110`)
- Structured logging (pino-based) emits JSON with level, timestamp, component, event fields on every queue operation.
- `GET /api/telemetry/queue` is a real endpoint returning real data. (`telemetry.ts:46-54`)
- Budget metrics (`getBudgetMetrics`) are real but always show 0 usage since recordTokenUsage is never called.
- `avgWaitMs` is always 0 — a metric users would trust but cannot. (`queueMetrics.ts:60, 65`)
- Workspace telemetry shows 0/0/0 — real but misleading (registry is always empty).
- No distributed tracing. No per-build request ID correlated across all SSE events.
- **Score rationale**: Infrastructure is good; three specific blind spots prevent a higher score.

---

### Quota Enforcement — 5 / 10

**Evidence**:
- Per-user concurrent build limit: ENFORCED and correct. (`agents.ts:71-72`, `userLimits.ts:54-57`)
- Daily build quota: ENFORCED with lazy reset. (`userLimits.ts:60-61`)
- Per-user token quota: NOT ENFORCED — `recordTokensUsed` never called. (`quotaAudit.md §Finding 2`)
- Global token budget gate: EXISTS but guard condition never triggers because counters stay at 0. (`quotaAudit.md §Finding 3`)
- `extractUserId` uses IP address for anonymous users, enabling trivial limit bypass via VPN/proxy. (`quotaAudit.md §Finding 4`)
- Provider RPM/TPM limits: NOT ENFORCED — `checkProviderBudget` never called from build route.

---

### Memory Safety — 4 / 10

**Evidence**:
- `_localJobs` in `buildQueue.ts:15` is unbounded. Grows by 1 entry per build forever. (`resourceAudit.md`)
- `tpmWindow` in `providerBudget.ts:45` pushes O(tokens) entries per call. With 10k token responses, 10k timestamps per invocation. (`resourceAudit.md §Critical Finding`)
- `byUser` (queueMetrics) and `_users` (userLimits) grow with unique users and are never pruned.
- EventBus listeners can leak for up to 5 minutes per disconnected client.
- **What works**: `recentFailures`, `_events`, `waitTimes`, `durations` are all correctly bounded with `MAX_*` caps and `shift()` eviction.
- **Mitigation**: `tpmWindow` and `_localJobs` bugs are not triggered in production because the code paths that would trigger them (`recordProviderTokens`, `enqueueBuild`) are not wired to the build route.

---

### Production Readiness — 3 / 10

**Evidence**:
- Queue not wired to build route — the central V7.0 feature is not active in production.
- No persistence in current environment.
- Load test measured health check endpoint, not build endpoint. Reported numbers are not representative of build throughput.
- Token budgets have a gate but no recording — the gate will never close through normal operation.
- Workspace registry tracks zero real workspaces.
- Two critical memory bugs exist (`_localJobs` leak, `tpmWindow` O(tokens)) — not triggered currently but will manifest if wiring is added.
- **What's production-quality**: Security headers (helmet), CORS, rate limiting, auth middleware, structured logging, cleanup scheduler — all from V6.x and working correctly.

---

## Overall Scorecard

| Dimension | Score | Verdict |
|---|---|---|
| Queue Reliability | 4/10 | Queue exists but not in request path |
| Persistence | 1/10 | Zero persistence in current environment |
| Recovery | 2/10 | Caught errors handled; no retry, no crash recovery |
| Observability | 6/10 | Good infrastructure; 3 blind spots |
| Quota Enforcement | 5/10 | Build count enforced; token quotas not wired |
| Memory Safety | 4/10 | Two unbounded structures; tpmWindow O(tokens) bug |
| Production Readiness | 3/10 | Core features not in live path; benchmark misleading |
| **AVERAGE** | **3.6 / 10** | |

---

## Final Verdict

**C — Significant Gaps**

The V7.0 implementation built the correct architectural pieces (BullMQ, Redis client, workspace registry, token budget, user limits) and all 339 tests pass. However:

1. The queue is not connected to the live build route — the central V7.0 deliverable is not active.
2. Token recording is never called — budget enforcement is a gate that can never close.
3. The load test measured a health check endpoint — reported throughput numbers do not reflect build capacity.
4. Two unbounded memory structures will cause problems the moment the dead code is wired in.

The infrastructure is a correct foundation that requires integration work before V7.0 claims are accurate.
