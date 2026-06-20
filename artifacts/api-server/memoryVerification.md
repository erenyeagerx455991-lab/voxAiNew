# Memory Verification — V7.0.4 Independent Audit

Auditor: independent source review + analytical stress test
Date: 2026-06-20
Scope: V7.0.3 memory-hardening fix

---

## 1. tpmWindow — O(tokens) Bug

### Original Finding
V7.0 scorecard: `tpmWindow pushes O(tokens) entries per call. With 10k token responses, 10k timestamps per invocation.`

### Current Implementation
**File**: `src/cost/providerBudget.ts:10-14`

```typescript
/** One record per REQUEST (not per token) — fixes the O(tokens) memory bug. */
interface RequestRecord { ts: number; tokens: number }

interface ProviderState {
  rpmWindow: number[];        // one timestamp per request
  tpmWindow: RequestRecord[]; // one { ts, tokens } per request — O(requests)
}
```

**Write path** (`providerBudget.ts:53-59`):
```typescript
export function recordProviderTokens(provider: Provider, tokens: number): void {
  purgeTpmWindow(s.tpmWindow, 60_000);
  // ONE entry per request — O(requests), not O(tokens)
  s.tpmWindow.push({ ts: Date.now(), tokens });
}
```

**Purge path** (`providerBudget.ts:38-41`):
```typescript
function purgeTpmWindow(arr: RequestRecord[], windowMs: number): void {
  const cutoff = Date.now() - windowMs;
  while (arr.length > 0 && arr[0].ts < cutoff) arr.shift();
}
```

### Analytical Stress Test

**1k requests in 60s window**:
- Entries retained: ≤1000 (bounded by sliding window, purged on each write)
- Memory per entry: ~24 bytes (`ts: number` + `tokens: number`)
- Max memory: 24KB

**10k requests in 60s window** (≈167 req/s sustained):
- Entries retained: ≤10,000
- Max memory: 240KB

**100k simulated events in 60s window** (≈1,667 req/s sustained):
- Entries retained: ≤100,000
- Max memory: ~2.4MB
- Note: purge fires on every write, so older-than-60s entries are evicted continuously

**Verdict**: O(tokens) bug FIXED. Now O(requests-in-window). At realistic sustained rates (≤100 req/s), max retained entries ≤6,000 and max memory ≤144KB.

### Caveat
`recordProviderTokens()` is **not called** from `callGroq` or `callOpenRouter`. `accountTokens()` calls `recordTokenUsage()` (budget) but NOT `recordProviderTokens()`. The tpmWindow fix is structurally correct but the data path to populate it does not exist in the live build pipeline.

---

## 2. _localJobs — Unbounded Growth

### Original Finding
V7.0 scorecard: `_localJobs in buildQueue.ts:15 is unbounded. Grows by 1 entry per build forever.`

### Current Implementation
**File**: `src/queue/buildQueue.ts:21-63`

```typescript
const MAX_LOCAL_JOBS = 1000;
const TERMINAL_JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

export function evictTerminalJobs(): void {
  const cutoff = Date.now() - TERMINAL_JOB_TTL_MS;
  // TTL pass: remove terminal jobs older than 1 hour
  for (const [id, info] of _localJobs) {
    if (TERMINAL_STATUSES.has(info.status) && (info.completedAt ?? 0) < cutoff) {
      _localJobs.delete(id);
    }
  }
  // Cap pass: remove oldest terminal jobs if still over MAX_LOCAL_JOBS
  if (_localJobs.size > MAX_LOCAL_JOBS) {
    const terminal = [..._localJobs.entries()]
      .filter(([, info]) => TERMINAL_STATUSES.has(info.status))
      .sort(([, a], [, b]) => (a.completedAt ?? 0) - (b.completedAt ?? 0));
    for (const [id] of terminal) {
      if (_localJobs.size <= MAX_LOCAL_JOBS) break;
      _localJobs.delete(id);
    }
  }
}
```

Eviction is triggered at:
1. `buildQueue.ts:89` — on every `enqueueBuild()` call (before adding new job)
2. `buildQueue.ts:147` — `setImmediate(evictTerminalJobs)` when any job reaches terminal status

### Analytical Stress Test

**1k jobs processed**:
- All complete within 1h → `_localJobs.size` stays ≤1000 due to cap pass
- Entries evicted: 0 until first TTL expires or 1000 cap is hit

**10k jobs processed (burst)**:
- Cap pass fires when size > 1000 on each new enqueue
- After 10k jobs: `_localJobs.size` = min(1000, active+queued+recent_terminal)
- Non-terminal jobs (running, queued) are never evicted — correct behavior

**100k jobs (soak)**:
- Same bound applies — 1000 hard cap on terminal entries
- Active jobs do not count toward cap eviction — cannot cause false eviction

**Verdict**: Unbounded growth bug FIXED. Hard cap at 1000. TTL eviction at 1 hour. Non-terminal jobs protected from eviction.

---

## 3. enqueueTimes — Key Mismatch Bug

### Original Finding
V7.0 scorecard: `avgWaitMs` permanently 0 due to key-mismatch — enqueueTimes was keyed by a random string, not jobId.

### Current Implementation
**File**: `src/queue/queueMetrics.ts:62-68`

```typescript
export function recordJobEnqueued(userId: string, jobId: string): void {
  enqueuedTotal++;
  queuedNow++;
  enqueueTimes.set(jobId, Date.now());  // keyed by jobId
  userEntry(userId).enqueued++;
}
```

**File**: `src/queue/queueMetrics.ts:70-80`

```typescript
export function recordJobStarted(jobId: string, userId: string): void {
  const enqueued = enqueueTimes.get(jobId) ?? Date.now(); // lookup by same jobId
  const waitMs = Date.now() - enqueued;
  cappedPush(waitTimes, waitMs);
  enqueueTimes.delete(jobId);
  ...
}
```

**Call site** (`buildQueue.ts:99`):
```typescript
recordJobEnqueued(opts.userId, jobId);
```
`jobId` is the UUID generated at line 84 — the same ID used throughout the lifecycle.

**Verdict**: Key-mismatch bug FIXED. `enqueueTimes` is keyed and looked up by the same `jobId`. `avgWaitMs` will now reflect real wait times.

Cleanup on all exit paths:
- `recordJobStarted`: `enqueueTimes.delete(jobId)` ✅
- `recordJobCompleted`: `enqueueTimes.delete(jobId)` ✅
- `recordJobFailed`: `enqueueTimes.delete(jobId)` ✅
- `recordJobCancelled`: `if (jobId) enqueueTimes.delete(jobId)` ✅

---

## 4. Still-Unbounded Structures

| Structure | Location | Bound | Risk |
|---|---|---|---|
| `byUser` (queueMetrics) | `queueMetrics.ts:32` | No pruning — grows with unique users | Low at ≤10k users (~1MB) |
| `_users` (userLimits) | `userLimits.ts:31` | No pruning — grows with unique IPs | Low at ≤10k IPs (~1MB) |
| `startTimes` (queueMetrics) | `queueMetrics.ts:31` | Deleted on complete/fail | Bounded by active jobs |

`byUser` and `_users` are low risk in single-instance deployments with realistic user counts. They become a concern at > 100k unique users over the server lifetime.

---

## Summary

| Structure | Original Finding | Verified Fix |
|---|---|---|
| `tpmWindow` | O(tokens) per call | FIXED — O(requests), ~24 bytes/record |
| `_localJobs` | Unbounded | FIXED — 1000 cap + 1h TTL eviction |
| `enqueueTimes` | Key mismatch, never deleted | FIXED — jobId key, deleted on all exit paths |
| `byUser` | Unbounded | STILL OPEN — no pruning |
| `_users` | Unbounded | STILL OPEN — no pruning |
