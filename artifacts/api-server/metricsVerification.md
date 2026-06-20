# Metrics Correctness Verification — V7.0.4 Independent Audit

Auditor: independent source review
Date: 2026-06-20
Scope: queueMetrics.ts state transitions

---

## 1. avgWaitMs

**Formula**: `avg(waitTimes)` where `waitTimes` is a sliding window of the last 500 real wait durations.

**Data path**:
1. `recordJobEnqueued(userId, jobId)` → `enqueueTimes.set(jobId, Date.now())`
2. `recordJobStarted(jobId, userId)` → `waitMs = Date.now() - enqueueTimes.get(jobId)` → `cappedPush(waitTimes, waitMs)`
3. `getQueueMetrics()` → `avg([...waitTimes].sort())`

**Previous bug**: `enqueueTimes` was keyed by a random string in `recordJobEnqueued`. `recordJobStarted` looked up by `jobId`. The keys never matched. `enqueueTimes.get(jobId)` always returned `undefined`. `waitMs` fell back to `Date.now() - Date.now() ≈ 0`. All wait samples were 0.

**Current state**: Key is `jobId` in both write and read. Wait time reflects the real interval between `enqueueBuild()` call and `executeBuildJob()` entry.

**Verdict**: avgWaitMs now produces real values. The V7.0 bug is fixed.

---

## 2. completedTotal

**File**: `queueMetrics.ts:82-89`

```typescript
export function recordJobCompleted(jobId: string, userId: string, durationMs: number): void {
  completedTotal++;
  activeNow = Math.max(0, activeNow - 1);
  cappedPush(durations, durationMs);
  startTimes.delete(jobId);
  enqueueTimes.delete(jobId);
  userEntry(userId).completed++;
}
```

**Trigger**: `queueWorker.ts:58` — `recordJobCompleted(jobId, userId, Date.now() - t0)` — called only on successful `runBuildPipeline` completion.

**Verdict**: Correctly increments once per successful build. No double-increment path identified.

---

## 3. failedTotal

**File**: `queueMetrics.ts:91-99`

```typescript
export function recordJobFailed(jobId: string, userId: string, error: string): void {
  failedTotal++;
  activeNow = Math.max(0, activeNow - 1);
  enqueueTimes.delete(jobId);
  startTimes.delete(jobId);
  userEntry(userId).failed++;
  recentFailures.push({ jobId, userId, error, at: Date.now() });
  if (recentFailures.length > MAX_FAILURES) recentFailures.shift();
}
```

**Trigger paths**:
- `queueWorker.ts:63` — on caught exception in `executeBuildJob`
- `buildQueue.ts:105` — on timeout

**Verdict**: Correctly increments on genuine failures and timeouts. `recentFailures` is bounded at 50 entries.

---

## 4. activeNow

**Transitions**:

| Event | Change | Guard |
|---|---|---|
| `recordJobStarted` | `activeNow++` | none |
| `recordJobCompleted` | `activeNow = Math.max(0, activeNow - 1)` | underflow guard |
| `recordJobFailed` | `activeNow = Math.max(0, activeNow - 1)` | underflow guard |

**Risk**: If `recordJobStarted` is called but neither `recordJobCompleted` nor `recordJobFailed` fire (e.g., process kill mid-build), `activeNow` leaks upward. On restart, `activeNow` resets to 0 (module re-init).

**Verdict**: Correct for normal operation. No permanent leak — module restart resets all counters. No cross-restart persistence.

---

## 5. queuedNow (Queue Depth)

**Transitions**:

| Event | Change |
|---|---|
| `recordJobEnqueued` | `queuedNow++` |
| `recordJobStarted` | `queuedNow = Math.max(0, queuedNow - 1)` |
| `recordJobCancelled` | `queuedNow = Math.max(0, queuedNow - 1)` |

**Note**: `recordJobFailed` does NOT decrement `queuedNow`. This is correct: `recordJobFailed` is called after `recordJobStarted`, by which point `queuedNow` was already decremented on start. A job that was never started and fails (timeout before start) uses the timeout path which calls `updateJobStatus(jobId, 'timeout')` and `recordJobFailed` — at that point the job was in `queuedNow` but `recordJobStarted` was never called. This means `queuedNow` over-counts by 1 per timeout-before-start event.

**Verdict**: Minor edge case — `queuedNow` over-counts by 1 for each job that times out before being picked up by the worker. Under normal load this is rare.

---

## 6. p95WaitMs / p95DurationMs

**Formula** (`queueMetrics.ts:43-47`):
```typescript
function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}
```

This is a standard nearest-rank percentile. Correct for sorted arrays.

**Window**: Last 500 samples (`MAX_SAMPLES = 500`). Window uses `shift()` eviction — the oldest samples are dropped, not the highest-latency ones. This is correct behavior for a sliding window.

---

## Summary

| Metric | Previous State | Current State |
|---|---|---|
| avgWaitMs | Always 0 (key mismatch) | FIXED — real wait times |
| completedTotal | Real but not from build route | Real — from wired build route |
| failedTotal | Real but not from build route | Real — from wired build route |
| activeNow | Real but not from build route | Real — guarded decrement |
| queuedNow (depth) | Real but not from build route | Real — minor over-count on pre-start timeout |
| p95WaitMs | Always 0 | FIXED — real samples |
| byUser tallies | Correct structure | Correct — still unbounded growth |
