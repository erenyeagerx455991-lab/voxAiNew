# Queue Verification — V7.0.4 Independent Audit

Auditor: independent source review
Date: 2026-06-20
Scope: V7.0.1 queue-activation fix

---

## 1. Build Route — enqueueBuild() Usage

**File**: `src/routes/agents.ts:86`

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

**Verdict**: `enqueueBuild()` IS called from the build route. The V7.0 finding (queue not wired) is resolved.

**Import confirmed** at `agents.ts:44`:
```typescript
import { enqueueBuild } from "../queue/buildQueue.js";
```

---

## 2. Direct runBuildPipeline() Bypass Scan

**Search**: all call sites of `runBuildPipeline` in `agents.ts`.

Result: `runBuildPipeline` is imported at `agents.ts:43` but is NOT called directly anywhere in the build route handler. The only call site in the build route is `enqueueBuild(...)`.

`runBuildPipeline` is called only from `src/queue/queueWorker.ts:55` inside `executeBuildJob()`.

**Verdict**: No bypass. All builds go through the queue.

---

## 3. Worker Execution Path

**File**: `src/queue/queueWorker.ts`

```typescript
export async function executeBuildJob(jobId: string, data: BuildJobData): Promise<void> {
  updateJobStatus(jobId, 'running');
  recordJobStarted(jobId, userId);
  const bridge = makeSseBridge(jobId);
  await tokenContext.run({ userId, buildId: jobId }, () =>
    runBuildPipeline({ prompt, chatId, keys: { groqKey, openrouterKey } }, bridge)
  );
  updateJobStatus(jobId, 'done');
  recordJobCompleted(jobId, userId, Date.now() - t0);
}
```

**In-memory mode** (`initQueueWorker:71`):
```typescript
setInlineExecutor(executeBuildJob);
```

**In-memory dispatch** (`buildQueue.ts:129`):
```typescript
setImmediate(() => { _inlineExecutor!(jobId, jobData).catch(() => {}); });
```

**Verdict**: Worker executes builds via `executeBuildJob` in both Redis and in-memory modes. `setImmediate` prevents blocking the Promise chain before subscription is set up.

---

## 4. SSE Bridge Losslessness

**File**: `src/queue/queueWorker.ts:25-42`

The `makeSseBridge` function creates a mock `Response` whose `write()` method:
1. Strips the `data: ` prefix and `\n\n` suffix
2. JSON-parses the SSE payload
3. Calls `emitJobEvent(jobId, parsedEvent)`

`enqueueBuild` subscribes to the same event bus via `subscribeToJob` before `setImmediate` fires, so no events are dropped.

**Verdict**: SSE bridge is lossless for well-formed JSON SSE events. Non-JSON chunks are silently dropped (no-op `catch`).

---

## 5. Metrics Increment Verification

| Metric Function | Called From | Trigger |
|---|---|---|
| `recordJobEnqueued(userId, jobId)` | `buildQueue.ts:99` | On every `enqueueBuild()` call |
| `recordJobStarted(jobId, userId)` | `queueWorker.ts:47` | On `executeBuildJob` entry |
| `recordJobCompleted(jobId, userId, ms)` | `queueWorker.ts:58` | On successful pipeline completion |
| `recordJobFailed(jobId, userId, error)` | `queueWorker.ts:63` | On caught exception |
| `recordJobFailed(jobId, userId, 'timeout')` | `buildQueue.ts:105` | On timeout |

All five metric events are wired to real state transitions.

---

## 6. Open Issues

| Issue | Status |
|---|---|
| Redis unavailable — BullMQ retry/persistence path inactive | OPEN — environment constraint |
| No retry in in-memory mode — failed jobs are terminal | OPEN |
| `checkProviderBudget()` not called before LLM requests | OPEN |

---

## Summary

| Check | Result |
|---|---|
| `enqueueBuild()` in build route | VERIFIED |
| No `runBuildPipeline()` bypass | VERIFIED |
| Worker executes real builds | VERIFIED |
| Metrics increment on real events | VERIFIED |
| SSE bridge lossless | VERIFIED |
| Redis path active | NOT VERIFIED — Redis unavailable |
