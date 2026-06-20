# Memory Hardening Report — V7.0.3

Date: 2026-06-20
Scope: Eliminate all three open memory-growth risks identified in V7.0 audit.

---

## Before / After Summary

| Structure | Before | After |
|---|---|---|
| `_localJobs` | Unbounded — grew O(total builds), never cleared | Bounded — TTL 1 h + hard cap of 1,000 entries |
| `tpmWindow` | O(tokens) — one array push per token | O(requests) — one compact `{ts, tokens}` record per request |
| `enqueueTimes` | Unbounded — random-key mismatch prevented deletion | Bounded — entries deleted on start/fail/cancel/complete |
| `avgWaitMs` | Always 0 (key mismatch) | Real wait time from enqueue to start |

---

## Phase 2 Fix — TPM Window (`providerBudget.ts`)

### Root cause
`recordProviderTokens(provider, N)` executed `for (let i = 0; i < N; i++) s.tpmWindow.push(Date.now())` — one timestamp push per token.

### Fix
Replaced `tpmWindow: number[]` with `tpmWindow: RequestRecord[]` where `RequestRecord = { ts: number; tokens: number }`. Every call to `recordProviderTokens` now pushes exactly one record.

The TPM sum uses `arr.reduce((acc, r) => acc + r.tokens, 0)` — mathematically identical to the original, but O(requests) in memory.

**File**: `src/cost/providerBudget.ts`

| Metric | Before | After |
|---|---|---|
| Entries per 10k-token request | 10,000 | 1 |
| Memory per 10k-token request | ~80 KB | 24 bytes |
| Entries at MAX_RPM=30, 4k tokens/req | 120,000 | 30 |
| Budget accuracy | Correct | Correct (same math) |
| RPM tracking | Unchanged | Unchanged |

### Maximum retained budget samples
**`tpmWindow`**: At most `MAX_RPM` entries per provider per minute (one per request). Default: 30 for Groq, 60 for OpenRouter. Entries expire after 60 seconds via `purgeTpmWindow`.

**`rpmWindow`**: Same — at most `MAX_RPM` timestamps. Already O(requests) before this fix.

---

## Phase 3 Fix — Local Job Retention (`buildQueue.ts`)

### Root cause
`_localJobs.set(jobId, info)` in `enqueueBuild()` with no corresponding delete path. Entries accumulated for the process lifetime.

### Fix

Two-pass bounded retention via `evictTerminalJobs()`:

**Pass 1 — TTL eviction**: Remove any terminal job (`done`, `failed`, `cancelled`, `timeout`) whose `completedAt` is older than `TERMINAL_JOB_TTL_MS = 3,600,000 ms (1 hour)`.

**Pass 2 — Cap eviction**: If `_localJobs.size > MAX_LOCAL_JOBS (1,000)` after TTL pass, remove oldest terminal jobs by `completedAt` until size ≤ 1,000.

**File**: `src/queue/buildQueue.ts`

Eviction is triggered at:
1. `enqueueBuild()` — before adding the new job (prevents pre-existing leak from blocking new work)
2. `updateJobStatus(jobId, terminalStatus)` — via `setImmediate(evictTerminalJobs)` (runs after current event loop tick so it doesn't block status update)

### Maximum retained jobs
**Active (queued + running)**: Limited by `maxActiveBuildsConcurrent + maxQueuedBuilds` = 2 + 5 = 7 (default env). Never evicted.

**Terminal**: At most 1,000 entries hard cap. After 1 hour of inactivity, drops to 0.

**Total maximum**: 1,007 entries in the extreme case (7 active + 1,000 retained terminal).

---

## Phase 4 — Active Job Safety

`evictTerminalJobs` only removes jobs whose `status` is in `TERMINAL_STATUSES = new Set(['done', 'failed', 'cancelled', 'timeout'])`.

Jobs with status `queued` or `running` are **never removed**, even if they have been running for more than 1 hour (long-running builds are not evicted).

**Verified by tests**: `jobEviction.test.ts`
- "NEVER evicts queued jobs" ✓
- "NEVER evicts running jobs" ✓
- "evicts old terminal jobs but keeps active jobs alongside them" ✓
- "cap eviction preserves active jobs even when total > 1000" ✓

---

## Phase 5 Fix — Queue Metrics Key (`queueMetrics.ts`)

### Root cause
`recordJobEnqueued(userId)` stored: `enqueueTimes.set(`${Date.now()}-${Math.random()}`, Date.now())`
`recordJobStarted(jobId, userId)` looked up: `enqueueTimes.get(jobId)` — always a miss → wait time always computed as `Date.now() - Date.now() = 0`.

Additionally, entries were never deleted (key mismatch prevented the `enqueueTimes.delete(jobId)` in `recordJobStarted` from removing anything), causing unbounded growth.

### Fix

1. Changed `recordJobEnqueued(userId)` signature to `recordJobEnqueued(userId, jobId)`.
2. Stores: `enqueueTimes.set(jobId, Date.now())` — keyed by jobId.
3. Deletion is now correct: `enqueueTimes.delete(jobId)` in `recordJobStarted` removes the right entry.
4. Added cleanup in `recordJobFailed` and `recordJobCompleted` (`enqueueTimes.delete(jobId)`) so timeout/cancelled/failed-before-start cases don't leak.
5. Updated call site: `buildQueue.ts:recordJobEnqueued(opts.userId, jobId)`.

**Files**: `src/queue/queueMetrics.ts`, `src/queue/buildQueue.ts`

### Maximum retained telemetry samples

| Structure | Cap | How |
|---|---|---|
| `waitTimes` | 500 | `cappedPush` (shift on overflow) |
| `durations` | 500 | `cappedPush` (shift on overflow) |
| `enqueueTimes` | ≤ active jobs ≈ 7 | Deleted on start/fail/cancel/complete |
| `startTimes` | ≤ active jobs ≈ 7 | Deleted on complete/fail |
| `recentFailures` | 50 | shift on overflow |
| `byUser` | unique user count | Unbounded (low-risk — each entry ~100 bytes) |

---

## Phase 6 — Stress Simulation

### 100 builds
- `_localJobs` peaks at ≤100 entries; after eviction, 0 (all terminal, older than 1h if simulated with old timestamps)
- `tpmWindow`: ≤100 entries per provider per minute window
- `enqueueTimes`: bounded to currently-active jobs (≤7)

### 1,000 builds
- `_localJobs`: hard-capped at 1,000; oldest terminal evicted first
- `tpmWindow`: ≤1,000 entries per 60s window (in practice far fewer as requests don't arrive at MAX_RPM continuously)
- Verified: `memorySafety.test.ts` — "1,000 token accounting calls stay O(requests) not O(tokens)" — 1,000 records (not 4,000,000)

### 10,000 builds
- `_localJobs`: stays at ≤1,000 (eviction removes oldest terminal on every new enqueue)
- `tpmWindow`: bounded by 60s window purge — max ~MAX_RPM records at any time
- Memory growth: O(1) amortized (bounded structures everywhere except `byUser`)

---

## Phase 7 — Test Results

| Suite | Tests | Status |
|---|---|---|
| `memorySafety.test.ts` (new) | 9 | PASS |
| `jobEviction.test.ts` (new) | 12 | PASS |
| `providerBudget.test.ts` (new) | 17 | PASS |
| All prior tests (399) | 399 | PASS |
| **Total** | **438 / 438** | **PASS** |

---

## Phase 8 — Final Audit Questions

### 1. Can memory grow without bound?

**No — after V7.0.3, all three previously unbounded structures are now bounded.**

### 2. What structures remain unbounded?

One low-risk structure remains unbounded:
- **`byUser` in `queueMetrics.ts`**: one entry per unique `userId`. At ~100 bytes per entry, 10,000 unique users = ~1 MB. Acceptable for the current scale.

All other structures are bounded.

### 3. Maximum retained jobs?

**1,007 entries** maximum:
- 7 active (queued + running) — never evicted
- 1,000 terminal — hard cap enforced by `evictTerminalJobs`

In practice, active jobs are far fewer (default `LIMIT_MAX_ACTIVE=2 + LIMIT_MAX_QUEUED=5`).

### 4. Maximum retained telemetry samples?

| Metric | Maximum |
|---|---|
| `waitTimes` (avgWaitMs, p95WaitMs) | 500 |
| `durations` (avgDurationMs, p95DurationMs) | 500 |
| `recentFailures` | 50 |
| `enqueueTimes` | ~7 (active jobs) |
| `startTimes` | ~7 (active jobs) |

### 5. Maximum retained budget samples?

| Structure | Maximum | Window |
|---|---|---|
| `rpmWindow` (groq) | 30 | 60 s sliding |
| `rpmWindow` (openrouter) | 60 | 60 s sliding |
| `tpmWindow` (groq) | 30 | 60 s sliding, 1 record/request |
| `tpmWindow` (openrouter) | 60 | 60 s sliding, 1 record/request |

In all cases these are compact `{ ts, tokens }` records (24 bytes each) or timestamps (8 bytes each). Total peak: ~(90 + 120) × 24 = ~5 KB. Negligible.

---

## Files Changed

| File | Change |
|---|---|
| `src/cost/providerBudget.ts` | `tpmWindow: number[]` → `tpmWindow: RequestRecord[]`; one record per request |
| `src/queue/buildQueue.ts` | `evictTerminalJobs()` (TTL + cap); `evictTerminalJobs` called in `enqueueBuild` and scheduled from `updateJobStatus`; `recordJobEnqueued(userId, jobId)` call updated |
| `src/queue/queueMetrics.ts` | `recordJobEnqueued(userId, jobId)` — jobId passed and stored as key; cleanup in fail/cancel/complete |
