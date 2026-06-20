# Resource & Memory Audit — V7.0

Auditor: independent code review
Date: 2026-06-19
Scope: all V7.0 modules

---

## Memory Structures Survey

### Bounded Structures

| Structure | File | Cap | Notes |
|---|---|---|---|
| `waitTimes[]` | `queueMetrics.ts:27` | 500 samples | `cappedPush` enforced |
| `durations[]` | `queueMetrics.ts:28` | 500 samples | `cappedPush` enforced |
| `recentFailures[]` | `queueMetrics.ts:32` | 50 entries | `shift()` on overflow |
| `_events[]` | `budgetMetrics.ts:16` | 200 entries | `shift()` on overflow |
| `bus` EventEmitter listeners | `buildEventBus.ts:4` | 500 | `setMaxListeners(500)` |

### Unbounded Structures — RISKS

| Structure | File | Growth Rate | Risk |
|---|---|---|---|
| `_localJobs` | `buildQueue.ts:15` | 1 entry per build, never evicted | MEDIUM — grows forever |
| `byUser` | `queueMetrics.ts:31` | 1 entry per unique userId, never pruned | LOW — small entries |
| `_users` | `userLimits.ts:31` | 1 entry per unique userId, never pruned | LOW — small entries |
| `enqueueTimes` | `queueMetrics.ts:29` | 1 entry per enqueue, deleted on start | LOW — short-lived |
| `startTimes` | `queueMetrics.ts:30` | 1 entry per start, deleted on complete | LOW — short-lived |
| `tpmWindow[]` | `providerBudget.ts:26-28` | O(tokens) per minute | SEVERE — see below |

---

## Critical Finding: providerBudget.ts tpmWindow O(tokens) Growth

**File**: `src/cost/providerBudget.ts:42-47`
```typescript
export function recordProviderTokens(provider: Provider, tokens: number): void {
  recordTokenUsage(provider, tokens);
  const s = _state[provider];
  purgeWindow(s.tpmWindow, 60_000);
  for (let i = 0; i < tokens; i++) s.tpmWindow.push(Date.now()); // ← one entry per token
  recordBudgetEvent('token_consumed', { provider, tokens });
}
```

Each call pushes one timestamp per token into a sliding-window array. A single LLM response of 10,000 tokens pushes 10,000 `Date` numbers into the array. With `MAX_TPM = 20,000` for OpenRouter, this window can hold up to 20,000 entries before triggering the limit.

**Severity**: SEVERE — but currently not reached because `recordProviderTokens` is never called from the build route. If wired in, a burst of 3 concurrent builds each using 10k tokens would push 30,000 entries in under a second. At 8 bytes per number × 30,000 = 240 KB per provider, with purge window of 60 s.

**Correct implementation**: Push a single `{ timestamp, count: tokens }` object and sum during the check, instead of one entry per token.

---

## Finding: _localJobs Never Evicted

**File**: `src/queue/buildQueue.ts:15, 55-56`
```typescript
const _localJobs = new Map<string, JobInfo>();
// ...
_localJobs.set(jobId, info);  // inserted on every enqueue
```

No code path removes individual entries from `_localJobs` outside of `closeQueue()` which clears the entire map. This is only called in test teardown.

**Growth estimate**:
- Each `JobInfo`: ~200 bytes (strings for jobId, userId, status, error)
- 100 builds/day × 365 days = 36,500 entries ≈ 7 MB
- 1,000 builds/day × 365 days = 365,000 entries ≈ 73 MB

At scale this causes gradual OOM. Note: since `enqueueBuild` is not called from the live path, this is currently theoretical.

---

## Finding: buildEventBus Listener Leak on Client Disconnect

**File**: `src/queue/buildEventBus.ts:7-11`
```typescript
export function subscribeToJob(jobId: string, cb: SseEventCallback): () => void {
  bus.on(channel, cb);
  return () => bus.off(channel, cb);
```

**File**: `src/queue/buildQueue.ts:68-76`
```typescript
const unsub = subscribeToJob(jobId, (event) => {
  opts.onEvent(event);
  if (e.type === 'done' || e.type === 'error') {
    clearTimeout(timer);
    unsub();
    resolve(jobId);
  }
});
```

If a client disconnects mid-build (SSE connection drops), `opts.onEvent` is called on a closed response, but no error is thrown — Express's `res.write()` on a closed connection returns `false` silently. The subscription stays alive until the timeout fires (5 min default). During that window, the EventEmitter holds a reference to the callback, which holds a reference to the closed `res` object. Memory is held for up to 5 minutes per disconnected client.

---

## Finding: EventEmitter Max Listeners

**File**: `src/queue/buildEventBus.ts:4`
```typescript
bus.setMaxListeners(500);
```

With 500 concurrent jobs each having one subscription, the limit is reached. Beyond 500, Node.js emits a memory-leak warning to stderr. At that point new `bus.on()` calls still work but warnings flood logs.

---

## Workspace Registry Memory

**File**: `src/workspace/workspaceRegistry.ts:16`
```typescript
const _registry = new Map<string, WorkspaceEntry>();
```

Currently empty in production (allocateWorkspace never called). If wired in, each `WorkspaceEntry` is ~300 bytes. Entries are removed by `unregisterWorkspace()`. The risk is low if `done()`/`fail()` are always called.

---

## Telemetry Memory

**File**: `src/telemetry/` — existing V6.x telemetry modules. Not new in V7.0; not audited here.

---

## Summary Table

| Structure | Bounded | Risk Level | Notes |
|---|---|---|---|
| `_localJobs` | NO | MEDIUM | Grows per build; never pruned |
| `tpmWindow` in providerBudget | YES (by TPM cap) | SEVERE if wired | O(tokens) per call |
| `byUser` / `_users` maps | NO | LOW | Small per-entry; grows with unique users |
| `recentFailures`, `_events` | YES | NONE | Correctly capped |
| `waitTimes`, `durations` | YES | NONE | Correctly capped |
| EventBus listeners | YES (500) | LOW | Listener leak on disconnect — 5 min TTL |
| Workspace registry | N/A | LOW | Empty in production |
