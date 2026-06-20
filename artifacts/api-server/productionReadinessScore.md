# Production Readiness Score — V7.0.4 Independent Audit

Auditor: independent source review
Date: 2026-06-20
Baseline: V7.0 scorecard (3.6 / 10)
Fixes reviewed: V7.0.1, V7.0.2, V7.0.3

Evidence for every score change is in the four verification reports:
`queueVerification.md`, `tokenVerification.md`, `memoryVerification.md`, `metricsVerification.md`, `benchmarkVerification.md`

---

## 1. Queue Reliability

**Previous score: 4 / 10**

### Evidence for change

VERIFIED (V7.0.1):
- `enqueueBuild()` is called at `agents.ts:86` — confirmed by source read
- No direct `runBuildPipeline()` call in build route — confirmed by source scan
- Worker (`executeBuildJob`) calls `runBuildPipeline` with SSE bridge — confirmed
- All 5 metric events (enqueued, started, completed, failed, timeout) wired to real transitions — confirmed
- In-memory fallback (`setInlineExecutor`) registered — confirmed

Still open:
- Redis unavailable — BullMQ retry (exponential backoff, `MAX_JOB_RETRIES+1` attempts) is inactive
- In-memory mode has no retry — failed jobs are terminal
- `checkProviderBudget()` not called before LLM requests — no pre-flight RPM/TPM gate

**New score: 7 / 10**

Rationale: The central V7.0 deliverable (queue wired to build route) is confirmed working. Score capped at 7 because the Redis retry path is inactive in the current environment and there is no in-memory retry.

---

## 2. Persistence

**Previous score: 1 / 10**

### Evidence for change

No change in persistence architecture:
- Redis still unavailable in Replit environment (confirmed by server startup log: "Redis not reachable — queue runs in-memory mode")
- All job state in `_localJobs` (module-level Map) — reset on process restart
- `_localJobs` now has TTL + cap eviction (V7.0.3) — this is a memory fix, not a persistence fix
- No write-ahead log, no database writes, no alternative persistence path

**New score: 1 / 10**

No change. Persistence gap is an environment constraint, not a code fix.

---

## 3. Recovery

**Previous score: 2 / 10**

### Evidence for change

No change in recovery architecture:
- BullMQ retry config (`attempts: MAX_JOB_RETRIES + 1`, exponential backoff) exists in `buildQueue.ts:74-77` but applies only to Redis path — Redis is unavailable
- In-memory mode: caught exceptions are handled and reported; job marked `failed`; no re-queue
- `finally` block in `agents.ts:97` — `recordBuildCompleted(userId)` always fires — confirmed
- No `unhandledRejection` / `uncaughtException` handler — process crash is unrecovered
- No health check that restarts the process on hang

**New score: 2 / 10**

No change. Recovery mechanisms only exist on the Redis path which is inactive.

---

## 4. Observability

**Previous score: 6 / 10**

### Evidence for change

VERIFIED improvements:
- `avgWaitMs` key-mismatch bug fixed (V7.0.3) — metric now produces real values
- Token accounting wired (V7.0.2) — `recordTokenUsage()` fires on real LLM responses — budget metrics are no longer stuck at 0
- `recordTokensUsed()` fires per-user via `tokenContext` — per-user quota counters reflect real usage

Still open:
- No distributed trace ID correlated across all SSE events in a single build
- Edit endpoint (`/agents/edit`) has no `tokenContext.run()` wrapper — edit token usage not attributed to users
- `byUser` in queueMetrics still unbounded — telemetry grows without pruning

**New score: 8 / 10**

Rationale: The two specific blind spots called out in V7.0 (avgWaitMs always 0, token counters always 0) are both fixed. Structured logging, SSE events, telemetry endpoints all functioning. Deduction for missing edit-path token attribution and no distributed trace IDs.

---

## 5. Quota Enforcement

**Previous score: 5 / 10**

### Evidence for change

VERIFIED improvements (V7.0.2):
- `recordTokensUsed(ctx.userId, total)` IS called from `accountTokens()` in `llmClient.ts:25`
- `checkBuildLimit(userId)` IS called at `agents.ts:72` — per-user concurrent + daily build quota enforced
- `checkTokenBudget()` IS called at `agents.ts:75` — global token budget gate now has real data to act on

Still open:
- `checkProviderBudget()` is NOT called from `callGroq` or `callOpenRouter` — RPM/TPM pre-flight check does not exist in the live LLM path
- `recordProviderTokens()` is NOT called from `accountTokens()` — tpmWindow never populates
- `extractUserId` uses IP address for unauthenticated users — trivial bypass via proxy/VPN
- Edit endpoint (`/agents/edit`) token usage not counted toward per-user quota

**New score: 7 / 10**

Rationale: Per-user token accounting is now real and enforced on the build path. The global budget gate closes when real usage accumulates. Deduction for missing RPM/TPM pre-flight and edit path exclusion.

---

## 6. Memory Safety

**Previous score: 4 / 10**

### Evidence for change

VERIFIED fixes (V7.0.3):
- `tpmWindow`: O(requests) — one `{ts, tokens}` struct per request, not O(tokens). Confirmed by source (`providerBudget.ts:10-14`). At 1k req/s sustained, max ~60k entries × 24 bytes = 1.4MB. Bounded by 60s sliding window with purge.
- `_localJobs`: Hard cap at 1000 + 1h TTL eviction. Eviction called on every new enqueue and on every terminal status transition. Non-terminal jobs protected.
- `enqueueTimes`: Keyed by jobId. Deleted on start, complete, fail, cancel. No leak path.
- `waitTimes` / `durations`: Capped at 500 with `shift()` eviction.
- `recentFailures`: Capped at 50 with `shift()` eviction.
- `startTimes`: Deleted on complete/fail.

Still open:
- `byUser` (queueMetrics): Unbounded. Grows with unique users. No pruning.
- `_users` (userLimits): Unbounded. Grows with unique IPs. No pruning.
- Risk is low at realistic user counts (< 100k users × ~200 bytes = 20MB). Becomes a concern in high-traffic or long-running deployments.

**New score: 8 / 10**

Rationale: All three critical findings from V7.0 are fixed and verified by source. Two low-risk unbounded structures remain.

---

## 7. Production Readiness

**Previous score: 3 / 10**

### Evidence for change

VERIFIED improvements:
- Queue is wired to build route — confirmed
- Token accounting is real — budget gate can now close on real usage
- Memory structures bounded — confirmed
- `avgWaitMs` real — confirmed
- Security baseline (helmet, CORS, rate limiting, auth middleware) — unchanged, working

Still open:
- Redis unavailable — no persistence, no retry, no distributed queue
- All load tests measured health check endpoint only — build throughput unmeasured
- RPM/TPM pre-flight not active in LLM call path
- Edit endpoint excluded from token quota and user limits
- No crash recovery / process supervisor

**New score: 5 / 10**

Rationale: The three critical wiring gaps from V7.0 are resolved. Score held below 6 because: no persistence, no build load test data, RPM/TPM pre-flight missing, edit path is a quota bypass.

---

## Final Scorecard

| Dimension | V7.0 Score | V7.0.4 Score | Change |
|---|---|---|---|
| Queue Reliability | 4 / 10 | 7 / 10 | +3 — enqueueBuild wired, worker confirmed |
| Persistence | 1 / 10 | 1 / 10 | 0 — Redis still unavailable |
| Recovery | 2 / 10 | 2 / 10 | 0 — retry only on inactive Redis path |
| Observability | 6 / 10 | 8 / 10 | +2 — avgWaitMs and token counters fixed |
| Quota Enforcement | 5 / 10 | 7 / 10 | +2 — per-user token quota now real |
| Memory Safety | 4 / 10 | 8 / 10 | +4 — tpmWindow, _localJobs, enqueueTimes fixed |
| Production Readiness | 3 / 10 | 5 / 10 | +2 — core wiring gaps resolved |
| **AVERAGE** | **3.6 / 10** | **5.3 / 10** | **+1.7** |

---

## Final Questions

### 1. Which original audit findings remain open?

| Finding | Status |
|---|---|
| Redis unavailable — no persistence | OPEN (environment) |
| No in-memory retry for failed builds | OPEN |
| `checkProviderBudget()` not called in LLM path | OPEN |
| `recordProviderTokens()` not called from accountTokens | OPEN |
| All load tests hit health check, not build endpoint | OPEN |
| Edit endpoint has no token accounting or user limits | OPEN |
| `byUser` / `_users` unbounded | OPEN (low risk) |
| `extractUserId` IP-based — proxy bypass trivial | OPEN |

### 2. Which fixes were verified?

| Fix | Verified By |
|---|---|
| `enqueueBuild()` wired to build route (V7.0.1) | Source read: `agents.ts:86` |
| No `runBuildPipeline()` bypass (V7.0.1) | Source scan: no direct call in build route |
| Worker executes builds via `executeBuildJob` (V7.0.1) | Source read: `queueWorker.ts:44-66` |
| SSE bridge lossless (V7.0.1) | Source read: `queueWorker.ts:25-42` |
| `accountTokens()` in Groq non-streaming (V7.0.2) | Source read: `llmClient.ts:85` |
| `accountTokens()` in Groq streaming (V7.0.2) | Source read: `llmClient.ts:125` + `stream_options` |
| `accountTokens()` in OpenRouter (V7.0.2) | Source read: `llmClient.ts:169` |
| `tokenContext` (AsyncLocalStorage) threads userId (V7.0.2) | Source read: `tokenContext.ts`, `queueWorker.ts:54` |
| `tpmWindow` O(requests) fix (V7.0.3) | Source read: `providerBudget.ts:10-14` |
| `_localJobs` 1000 cap + 1h TTL eviction (V7.0.3) | Source read: `buildQueue.ts:21-63` |
| `enqueueTimes` jobId key fix (V7.0.3) | Source read: `queueMetrics.ts:62-68` |
| `avgWaitMs` now real (V7.0.3, depends on V7.0.3 key fix) | Source read: `queueMetrics.ts:70-80` |

### 3. Which fixes are still only assumed?

| Claim | Assumed — Not Verified |
|---|---|
| tpmWindow fix is exercised in production | `recordProviderTokens()` is not called from `accountTokens()` — the fixed code path is not reachable from the live build pipeline |
| Per-user token quota enforced for edits | Edit endpoint has no `tokenContext.run()` wrapper |
| Build throughput improved vs V7.0 | No build load test has been run before or after any V7.x release |

### 4. What is the current production-readiness score?

**5.3 / 10**

Up from 3.6 / 10 at V7.0. Grade: **C+**

### 5. What is now the highest-risk subsystem?

**Persistence / Recovery** (shared score: 1.5 average)

Redis is unavailable. All job state is in-process memory. Any process restart (deploy, crash, OOM) loses all running and queued builds with no notification to clients. The SSE connection closes. The client has no way to retrieve results or know the build was lost. This is a silent data loss path on every restart.

The second-highest risk is the **build load test gap**: throughput, latency, and failure behavior of the actual build endpoint under concurrent load are entirely unknown. The system has been validated structurally but not under production-representative load.
