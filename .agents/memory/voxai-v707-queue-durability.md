---
name: VoxAI V7.0.7 Queue Durability
description: stalledCount/retryTotal/deadJobCount wired live in queueMetrics; BullMQ events hooked; resetQueueMetrics fixed; 487 tests pass.
---

## Rule
`stalledCount`, `retryTotal`, `deadJobCount` in `queueMetrics.ts` must all be:
1. Incremented by dedicated export functions (`recordJobStalled`, `recordJobRetry`, `recordJobDead`)
2. Included in the `getQueueMetrics()` return object
3. Reset in `resetQueueMetrics()`

**Why:** Before V7.0.7 these three counters existed in the `QueueSnapshot` interface and in module-level variables, but were never incremented and never included in the return statement — so they always read as `undefined` / `0` regardless of actual queue activity.

## How to Apply
- BullMQ `stalled` event → `recordJobStalled(jobId, 'unknown')` (jobId string, no data object available)
- BullMQ `failed` event → check `job.attemptsMade >= job.opts?.attempts` to distinguish retry vs dead
  - retry (will be re-attempted) → `recordJobRetry(jobId, userId, attemptsMade)`
  - dead (all attempts exhausted) → `recordJobDead(jobId, userId, error)`
- `resetQueueMetrics()` must include `stalledCount = retryTotal = deadJobCount = 0`

## Files Changed
- `src/queue/queueMetrics.ts` — 3 new export functions + getQueueMetrics return + resetQueueMetrics fix
- `src/queue/queueWorker.ts` — updated import + `stalled`/`failed` BullMQ listeners
- `tests/integration/queueDurability.test.ts` — 13 new durability tests
- `v7.0.7Audit.md` — production readiness audit

## Test Baseline
474 → 487 tests (13 new in queueDurability.test.ts)
