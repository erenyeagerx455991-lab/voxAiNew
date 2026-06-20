# Failure Mode Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Method: source code analysis (no destructive testing performed on running server)

---

## Failure 1: Redis Unavailable

**Expected**: In-memory fallback, degraded persistence.

**Actual**: Confirmed from server startup log:
```
{"level":"warn","component":"RedisClient","event":"REDIS_UNAVAILABLE","message":"Redis not reachable — queue runs in-memory mode"}
{"level":"info","component":"BuildQueue","event":"QUEUE_IN_MEMORY","reason":"Redis unavailable — using in-memory job tracking"}
{"level":"info","component":"QueueWorker","event":"WORKER_IN_MEMORY","reason":"Redis unavailable — jobs execute inline via setImmediate"}
```

**File**: `src/app.ts:87-94` — `initRedis().then(...)catch(...)` both branches call `initBuildQueue()` and `initQueueWorker()`. Server starts correctly in both cases.

**Data loss risk**: YES — all jobs lost on restart. Acceptable for current dev environment.

**Recovery path**: Set `REDIS_URL` env var and restart server.

---

## Failure 2: Queue Worker Crash

**Scenario**: The in-memory worker (inline executor) crashes mid-job.

**File**: `src/queue/queueWorker.ts:50-61`
```typescript
try {
  await runBuildPipeline({ prompt, chatId, keys: {...} }, bridge);
  updateJobStatus(jobId, 'done');
  recordJobCompleted(jobId, userId, Date.now() - t0);
} catch (err) {
  const error = err instanceof Error ? err.message : String(err);
  updateJobStatus(jobId, 'failed', error);
  recordJobFailed(jobId, userId, error);
  emitJobDone(jobId, { type: 'error', error });
}
```

Any exception thrown by `runBuildPipeline` is caught. The error event is emitted to the client. Metrics are updated.

**Unhandled path**: An unhandled promise rejection in `runBuildPipeline` that is not caught inside the pipeline would propagate up. In Node.js v18+, unhandled rejections terminate the process by default. This would kill the server. No global `unhandledRejection` handler exists in the codebase.

**Data loss risk**: MEDIUM — a process crash loses all in-flight jobs and the `_localJobs` Map.

---

## Failure 3: Build Pipeline Crash

**Expected**: Error returned to client, build marked failed.

**Actual**: Confirmed by code path at `src/routes/agents.ts:86-88`:
```typescript
} catch (err: any) {
  sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
}
```

And in the `finally` block at line 89:
```typescript
recordBuildCompleted(userId);
```

The user's active build counter is always decremented. The SSE error is emitted to the client.

**Data loss risk**: NONE — no data to lose; build output was streaming.

**Caveat**: If `res.write()` is called after the SSE connection is already closed (e.g., client timeout), the write is silently discarded. The client receives no error notification.

---

## Failure 4: Workspace Deletion Failure

**File**: `src/workspace/workspaceManager.ts:56-58`
```typescript
try {
  await rm(path, { recursive: true, force: true });
} catch (rmErr) {
  log.warn('WORKSPACE_CLEANUP_FAILED', { workspaceId, error: String(rmErr) });
}
unregisterWorkspace(workspaceId);  // always called
```

An `rm` failure is logged but does not propagate. The workspace is unregistered regardless. The directory remains on disk. The filesystem-level cleanup scheduler will eventually remove it.

**File**: `src/security/workspaceCleanup.ts:45-47`
```typescript
} catch (err) {
  result.errors.push(`${entry}: ...`);
}
```

Cleanup errors are collected and logged but do not stop the cleanup loop from processing remaining entries.

**Data loss risk**: NONE. **Disk leak risk**: LOW — bounded by MAX_AGE_MS (1 hour default).

---

## Failure 5: Budget Exhaustion

**Scenario**: Token budget limit reached.

**File**: `src/routes/agents.ts:74-75`
```typescript
const budgetCheck = checkTokenBudget();
if (!budgetCheck.allowed) return res.status(503).json({ error: budgetCheck.reason });
```

The check runs before the build starts. If the budget is exhausted, new builds are blocked with 503. **In-flight builds are not interrupted** — there is no mid-build budget check.

**Real-world note**: Since `recordTokenUsage` is never called from the build route, the budget counters stay at 0. Budget exhaustion can only be triggered by calling `recordTokenUsage` directly (e.g., manually or from a future wiring) or by triggering the emergency shutdown externally.

**Recovery path**: Call `resetEmergencyShutdown()` (no HTTP endpoint exposes this currently) or restart the process to reset the in-memory state.

---

## Failure 6: Telemetry Endpoint Failure

**File**: `src/routes/telemetry.ts:46-54`
```typescript
router.get("/telemetry/queue", authMiddleware, (_req, res) => {
  res.json({
    queue:   getQueueMetrics(),
    budget:  getBudgetMetrics(),
    usage:   getBudgetUsage(),
    users:   getAllUserStats(),
    ...
  });
});
```

No try/catch wraps the metric calls. If any metric function throws (e.g., due to a corrupted internal state), the Express error handler returns a 500 with no JSON body. The telemetry endpoint itself does not affect build functionality — it is read-only.

**Data loss risk**: NONE. **Observability risk**: LOW — telemetry goes dark but builds continue.

---

## Failure 7: Multiple Simultaneous Builds (Same User)

**Per-user limit default**: 2 concurrent builds (`maxActiveBuildsConcurrent = 2`).

**File**: `src/limits/userLimits.ts:54-57`
```typescript
if (s.activeBuilds >= _config.maxActiveBuildsConcurrent)
  return { allowed: false, reason: `Max concurrent builds reached (2)` };
```

A 3rd request from the same user gets a 429. The check and record are synchronous — no race condition.

**Cross-user interference**: None. Each user has independent state in `_users` Map.

**Global interference**: No global concurrency cap. 50 users × 2 concurrent builds = 100 simultaneous `runBuildPipeline` calls. Each pipeline holds open LLM connections. This could exhaust Groq/OpenRouter rate limits much faster than per-user limits suggest.

---

## Failure Summary Matrix

| Failure | Detected | Logged | Client Notified | Data Loss | Auto Recovery |
|---|---|---|---|---|---|
| Redis unavailable | YES | YES | N/A | YES (restart) | NO |
| Worker crash (caught) | YES | YES | YES | NO | NO |
| Unhandled process crash | N/A | N/A | NO | YES | NO |
| Build pipeline error | YES | YES | YES | NO | NO |
| Workspace rm failure | YES | YES | NO | NO | YES (scheduler) |
| Budget exhaustion | GATE ONLY | NO | YES (503) | N/A | NO |
| Telemetry failure | NO try/catch | YES (Express) | 500 | NO | N/A |
| Simultaneous builds (same user) | YES | NO | YES (429) | N/A | N/A |
