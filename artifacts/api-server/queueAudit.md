# Queue Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Scope: `src/queue/` (6 files)

---

## Architecture Diagram

```
HTTP POST /agents/build
    │
    ▼
agents.ts:71   checkBuildLimit()   ──► reject 429
agents.ts:74   checkTokenBudget()  ──► reject 503
agents.ts:77   recordBuildStarted()
    │
    ▼
agents.ts:85   runBuildPipeline()  ◄── DIRECT CALL (no queue involved)
    │           (SSE to HTTP response)
    ▼
agents.ts:89   recordBuildCompleted()

─────────────────────────────────────────────────
enqueueBuild() ← exists but is NOT called from agents.ts
─────────────────────────────────────────────────
```

**Critical finding**: The build route (`agents.ts:60-93`) calls `runBuildPipeline` directly. `enqueueBuild` is implemented but not wired to the HTTP route. The queue infrastructure exists as a library that is unused in the live request path.

---

## Finding 1: Jobs Are Executed But Not Through the Queue

**File**: `src/routes/agents.ts:85`
```typescript
await runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, res);
```

**File**: `src/queue/buildQueue.ts:45` — `enqueueBuild()` exists but is not imported or called in `agents.ts`.

**Verdict**: Jobs execute. Queue is not in the execution path.

---

## Finding 2: In-Memory Mode Is Not a Fallback — It Is the Only Mode

**File**: `src/queue/redisClient.ts:11`
```typescript
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
```

Redis is not installed in the Replit environment. `initRedis()` catches the connection failure and sets `_available = false`. All downstream calls to `initBuildQueue()` and `initQueueWorker()` immediately return after logging "in-memory mode."

**File**: `src/queue/buildQueue.ts:14-15`
```typescript
let _queue: Queue<BuildJobData> | null = null;
const _localJobs = new Map<string, JobInfo>();
```

`_queue` is never assigned. `_localJobs` is the only storage.

**Verdict**: BullMQ code compiles and initializes, but zero BullMQ functionality is exercised at runtime. The system is an in-memory Map with a BullMQ import.

---

## Finding 3: No Persistence

In-memory mode stores job state in a module-level `Map` (`_localJobs`, `buildQueue.ts:15`). On process restart this Map is gone. There is no write-ahead log, no Redis fallback, no database.

Redis mode (`buildQueue.ts:33-42`) configures:
```typescript
removeOnComplete: { age: 3600, count: 500 },
removeOnFail: { age: 86400, count: 200 },
```
Even if Redis were available, completed jobs are erased after 1 hour.

**Verdict**: Zero persistence in current environment. Jobs queued or in-flight at restart are permanently lost.

---

## Finding 4: _localJobs Memory Leak

**File**: `src/queue/buildQueue.ts:14-15, 55-56, 96-106`

Every call to `enqueueBuild` inserts a `JobInfo` into `_localJobs`. There is no TTL, no eviction, no periodic pruning. `closeQueue()` clears it but is only called during test teardown. In a long-running server process every build job ever submitted accumulates in this Map.

**Evidence**: No `_localJobs.delete(jobId)` appears anywhere in the production code paths (only inside `closeQueue()` which clears the entire map).

**Growth**: Each `JobInfo` ≈ 200 bytes. 1,000 builds/day × 30 days = 30,000 entries ≈ 6 MB. At 10,000 builds/day this reaches 60 MB/month.

---

## Finding 5: avgWaitMs Is Always 0 in In-Memory Mode

**File**: `src/queue/queueMetrics.ts:60-61`
```typescript
enqueueTimes.set(`${Date.now()}-${Math.random()}`, Date.now());
```

Keys are stored as random composite strings. `recordJobStarted` looks them up by `jobId`:
```typescript
const enqueued = enqueueTimes.get(jobId) ?? Date.now();  // line 65
```

The jobId never matches. `enqueued` always falls back to `Date.now()`. `waitMs` is always 0. `avgWaitMs` and `p95WaitMs` in the metrics snapshot are permanently 0.

---

## Finding 6: Worker Recovery Is Test-Only

**File**: `tests/integration/workerRecovery.test.ts:17-20`
```typescript
vi.mock("../../src/agents/pipeline/buildPipeline.js", () => ({
  runBuildPipeline: vi.fn(),
}));
```

All 8 recovery tests mock `runBuildPipeline` completely. No real pipeline executes. Tests verify event-bus plumbing, not actual recovery behavior.

No retry-on-crash mechanism exists. If `runBuildPipeline` throws, the error is caught and logged (`queueWorker.ts:55-61`). The job is marked `failed`. No re-queue, no retry (BullMQ's `attempts: MAX_JOB_RETRIES + 1` only applies to Redis mode which is unused).

---

## Finding 7: Backpressure Is Per-User Only

**File**: `src/limits/userLimits.ts:56-62`

`checkBuildLimit` enforces per-user concurrent build limit (default 2) and daily quota (default 20). There is no global queue depth limit, no global concurrency cap, no CPU/memory-based backpressure.

If 100 users each start 2 builds simultaneously, 200 concurrent `runBuildPipeline` calls execute. Each pipeline makes multiple HTTP calls to Groq/OpenRouter. No mechanism prevents this.

---

## Persistence Analysis

| Scenario | Job outcome |
|---|---|
| Process restarts cleanly | All queued + running jobs lost |
| Process OOM-killed | All queued + running jobs lost |
| Redis available (not current) | Jobs survive restart; completed jobs deleted after 1hr |
| Redis crashes mid-job (not current) | Job state lost; BullMQ would retry on reconnect |

---

## Failure Modes

| Failure | Behavior | Data Loss |
|---|---|---|
| Redis unavailable | Graceful in-memory fallback | None (but no persistence gained) |
| Server restart | All in-memory job state lost | YES — all queued/running jobs |
| `runBuildPipeline` throws | Caught, `failed` status, error event emitted | No new data loss |
| EventEmitter leak (client disconnect before done) | Listener remains until timeout (5 min) | No data loss; memory held |
| `_localJobs` unbounded | Gradual memory growth | None immediately; OOM risk long-term |

---

## Scalability Limits

- **Current (in-memory)**: Limited by Node.js single-process memory and concurrent HTTP connections
- **Concurrency**: No global cap — only per-user limits apply
- **With Redis**: BullMQ concurrency controlled by `WORKER_CONCURRENCY` (default 3) — but this only limits the BullMQ Worker, not the direct `runBuildPipeline` call path
- **Actual limiting factor**: Groq/OpenRouter API rate limits and LLM response time (20-120 s per build)

---

## Summary

| Claim | Verified? | Notes |
|---|---|---|
| Jobs are executed | YES | Via direct `runBuildPipeline` call, not through queue |
| Queue wraps execution | NO | Queue not in live request path |
| Redis is optional | YES | Graceful degradation confirmed |
| Jobs persisted | NO | Zero persistence in current environment |
| Worker recovery real | NO | Tests mock the pipeline entirely |
| Queue telemetry real | PARTIAL | Counters real; avgWaitMs always 0 (bug) |
| Backpressure implemented | PARTIAL | Per-user limits only; no global cap |
