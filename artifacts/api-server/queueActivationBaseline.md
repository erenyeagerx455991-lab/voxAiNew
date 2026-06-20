# Queue Activation Baseline — V7.0.1

Recorded before any changes.

---

## Current Live Build Path

```
Client
  │  POST /agents/build  { prompt, chatId }
  ▼
agents.ts:70    extractUserId(req)
agents.ts:71    checkBuildLimit(userId)          → 429 if over limit
agents.ts:74    checkTokenBudget()               → 503 if over budget
agents.ts:77    recordBuildStarted(userId)
agents.ts:79-82 res headers + flushHeaders()     SSE stream opened to client
  │
  │  try
  ▼
agents.ts:85    runBuildPipeline({ prompt, chatId, keys }, res)
                  │  writes SSE events DIRECTLY to res:
                  │    data: {"type":"step","step":0,...}\n\n
                  │    data: {"type":"step","step":1,...}\n\n
                  │    ...
                  │    data: {"type":"done","code":"..."}\n\n
                  ▼
                res.write() → Express HTTP response → Client
  │
  │  catch(err)
agents.ts:87    sse(res, { type:"error", error:... })
  │
  │  finally
agents.ts:89    recordBuildCompleted(userId)
  │
agents.ts:92    res.end()
```

### Exact Lines

| Line | Code |
|---|---|
| 60 | `router.post("/agents/build", async (req, res) => {` |
| 70 | `const userId = extractUserId(req);` |
| 71 | `const limitCheck = checkBuildLimit(userId);` |
| 74 | `const budgetCheck = checkTokenBudget();` |
| 77 | `recordBuildStarted(userId);` |
| 79-82 | SSE headers set, `res.flushHeaders()` |
| 84-90 | `try { await runBuildPipeline(..., res) } catch {...} finally { recordBuildCompleted }` |
| 92 | `res.end()` |

---

## What the Queue Modules Do (Pre-Activation)

- `initRedis()` → connects (fails, in-memory mode)
- `initBuildQueue()` → no-op (Redis unavailable)
- `initQueueWorker()` → registers `executeBuildJob` as inline executor; sets `_inMemoryActive=true`
- `enqueueBuild()` → **exists but not called from agents.ts**
- `_localJobs` Map → always empty
- Queue metrics counters → always 0

---

## SSE Event Format

`sse()` at `src/agents/streaming/sseManager.ts:3-5`:
```typescript
export function sse(res: Response, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
```

Pipeline writes: `data: ${JSON.stringify(event)}\n\n`
`makeSseBridge.write()` strips `data: ` prefix and `\n\n` suffix, calls `JSON.parse`, then `emitJobEvent`.
Round-trip is lossless for all pipeline events (all are JSON objects via `sse()`).

---

## Cancellation

No cancellation endpoint exists in `agents.ts`. `cancelJob()` in `buildQueue.ts` can cancel queued (not running) jobs. No HTTP route calls it. Not implemented in the live path — no behavior to preserve.

---

## Telemetry Flow (Pre-Activation)

`runBuildPipeline` internally calls:
- `recordBuildStart()` / `recordBuildSuccess()` / `recordBuildFailure()` from `buildMetrics.ts`
- `withAgentMetrics()` from `agentMetrics.ts`
- `setLogContext()` / `clearLogContext()` from `structuredLogger.ts`

These are called by the pipeline, not by agents.ts. They will continue to fire unchanged after queue activation because the pipeline itself is not modified.

---

## Queue Metrics Pre-Activation (Measured From Running Server)

```
GET /api/telemetry/queue →
{
  "queue": { "enqueuedTotal": 0, "completedTotal": 0, "failedTotal": 0, "activeNow": 0, ... },
  "budget": { "events": { "totalRecorded": 0 } },
  ...
}
```

All counters are 0 because `enqueueBuild` is never called.
