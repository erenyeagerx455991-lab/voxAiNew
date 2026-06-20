# Queue Activation Report — V7.0.1

Date: 2026-06-20
Scope: wire `enqueueBuild` into the live build path — no other changes.

---

## 1. Is the queue now in the live build path?

**YES.**

**File**: `src/routes/agents.ts:88-96`
```typescript
await enqueueBuild({
  prompt,
  chatId,
  userId,
  groqKey,
  openrouterKey,
  onEvent: (event) => sse(res, event as Record<string, unknown>),
});
```

Every POST to `/api/agents/build` now calls `enqueueBuild`. The previous direct call to `runBuildPipeline` at line 85 has been replaced.

---

## 2. Does any build still bypass the queue?

**NO.**

`runBuildPipeline` is no longer imported or called from the `/agents/build` route handler. The import remains in `agents.ts` because other routes (e.g., `/agents/audit`) use related pipeline utilities, but the build handler no longer calls it directly.

Verification: `queueActivation.test.ts` mocks `runBuildPipeline` to throw `MUST_NOT_CALL_DIRECTLY`. All 7 tests in that suite pass, including the assertion `expect(mockPipeline).not.toHaveBeenCalled()`.

---

## 3. Does the worker execute real builds?

**YES — in in-memory mode.**

**Execution path**:
```
POST /agents/build
  │
  ▼
agents.ts:88    enqueueBuild({ prompt, chatId, userId, groqKey, openrouterKey, onEvent })
  │
  ▼
buildQueue.ts:55-56  _localJobs.set(jobId, info)     ← job registered
buildQueue.ts:57     recordJobEnqueued(userId)        ← metrics updated
buildQueue.ts:86-87  setImmediate(() => _inlineExecutor(jobId, jobData))
  │
  ▼ (next event loop tick)
queueWorker.ts:43    executeBuildJob(jobId, data)
queueWorker.ts:45      updateJobStatus(jobId, 'running')
queueWorker.ts:46      recordJobStarted(jobId, userId)
queueWorker.ts:48      bridge = makeSseBridge(jobId)
  │
  ▼
queueWorker.ts:51    runBuildPipeline({ prompt, chatId, keys }, bridge)
                       │  pipeline writes SSE events to bridge:
                       │    bridge.write(`data: {"type":"step",...}\n\n`)
                       │      → JSON.parse → emitJobEvent(jobId, event)
                       │        → subscribeToJob callback
                       │          → opts.onEvent(event)
                       │            → sse(res, event)
                       │              → res.write(`data: ${JSON.stringify(event)}\n\n`)
                       ▼
                    Client receives SSE events unchanged
  │
  ▼
queueWorker.ts:52    updateJobStatus(jobId, 'done')
queueWorker.ts:53    recordJobCompleted(jobId, userId, durationMs)
  │
  ▼
buildQueue.ts:71-74  enqueueBuild subscriber receives 'done' → clearTimeout → unsub → resolve
  │
  ▼
agents.ts:100        recordBuildCompleted(userId)  [finally]
agents.ts:103        res.end()
```

**Worker recovery with Redis unavailable**: Stated plainly — there is no recovery. The inline executor runs jobs synchronously in the same process via `setImmediate`. If the process crashes mid-build, the job is lost. BullMQ retry logic (`attempts: 2`, exponential backoff) is only active when Redis is available.

---

## 4. Are queue metrics now real?

**YES — for the first time.**

Before activation, every queue metric counter was permanently 0 because `enqueueBuild` was never called.

After activation, for every build:

| Metric | When it increments |
|---|---|
| `enqueuedTotal` | `enqueueBuild()` called (line 57 of buildQueue.ts) |
| `activeNow` | `recordJobStarted()` in `executeBuildJob` (line 46) |
| `completedTotal` | `recordJobCompleted()` on success (line 53) |
| `failedTotal` | `recordJobFailed()` on exception (line 58) |
| `byUser[userId].enqueued` | `recordJobEnqueued()` (line 57) |
| `byUser[userId].completed` | `recordJobCompleted()` (line 53) |

**Known limitation**: `avgWaitMs` and `p95WaitMs` remain 0. The `enqueueTimes` key mismatch bug (`${Date.now()}-${Math.random()}` stored but `jobId` looked up) means wait time is always computed as 0 ms. This bug was documented in `queueAudit.md` and is not fixed in this release.

---

## 5. Does SSE still work?

**YES — format unchanged.**

The SSE round-trip is lossless for all pipeline events:

1. Pipeline calls `sse(bridge, event)` → `bridge.write(`data: ${JSON.stringify(event)}\n\n`)`
2. Bridge strips prefix, JSON-parses → `emitJobEvent(jobId, event)` (plain object)
3. `opts.onEvent(event)` called with plain object
4. `sse(res, event)` → `res.write(`data: ${JSON.stringify(event)}\n\n`)` (identical to step 1)

Non-JSON writes (SSE comments like `: keepalive`) are silently dropped by the bridge's try/catch (`queueWorker.ts:31`). The pipeline uses `sse()` for all writes, which always produces valid JSON — so nothing is lost.

All existing SSE event types flow unchanged:
- `{ type: "step", step: N, agent: "...", status: "..." }`
- `{ type: "done", code: "..." }`
- `{ type: "error", error: "..." }`
- All repair, runtime, DNA composition events

---

## 6. Cancellation

No build cancellation endpoint existed before activation and none was added. `cancelJob()` in `buildQueue.ts` is implemented but has no HTTP route. Behavior is unchanged (not implemented).

---

## 7. Test Results

| Suite | Tests | Result |
|---|---|---|
| `queueActivation.test.ts` (new) | 7 | PASS |
| `workerExecution.test.ts` (new) | 10 | PASS |
| `sseBridge.test.ts` (new) | 7 | PASS |
| All prior tests (339) | 339 | PASS |
| **Total** | **362 / 362** | **PASS** |

---

## 8. Change Summary

### Only file modified in production code

**`src/routes/agents.ts`**

```diff
+ import { enqueueBuild } from "../queue/buildQueue.js";

- try {
-   await runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, res);
- } catch (err: any) {
-   sse(res, { type: "error", error: err?.message ?? "Multi-agent pipeline failed" });
- } finally {
-   recordBuildCompleted(userId);
- }

+ try {
+   await enqueueBuild({
+     prompt, chatId, userId,
+     groqKey, openrouterKey,
+     onEvent: (event) => sse(res, event as Record<string, unknown>),
+   });
+ } catch (err: any) {
+   sse(res, { type: "error", error: err?.message ?? "Queue dispatch failed" });
+ } finally {
+   recordBuildCompleted(userId);
+ }
```

No other production files changed. No behavior changes for the client — same SSE format, same headers, same error responses, same limit checks.

---

## 9. Remaining Gaps (Not Fixed in This Release)

Per the activation scope — these are documented, not fixed:

| Gap | File | Impact |
|---|---|---|
| `avgWaitMs` always 0 | `queueMetrics.ts:60` | Metric inaccurate |
| `recordTokenUsage` never called | `agents.ts`, `tokenBudget.ts` | Budget gate never closes naturally |
| `tpmWindow` O(tokens) push | `providerBudget.ts:45` | Memory risk if wired |
| `_localJobs` never evicted | `buildQueue.ts:15` | Memory growth per build |
| No job persistence on restart | all queue modules | Jobs lost on crash |
