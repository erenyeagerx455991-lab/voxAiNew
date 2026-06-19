---
name: VoxAI V7.0 Scalability Foundation
description: BullMQ queue, workspace registry, token budget, user limits, load test results — all V7.0 decisions and quirks.
---

## What was built

12 new modules across 4 directories:
- `src/queue/` — queueTypes, redisClient, buildEventBus, buildQueue, queueWorker, queueMetrics
- `src/workspace/` — workspaceRegistry, workspaceManager
- `src/cost/` — tokenBudget, providerBudget, budgetMetrics
- `src/limits/` — userLimits

## Key decisions

### Redis is optional — always graceful fallback
`isRedisAvailable()` returns false in Replit dev. Queue runs inline via `setImmediate`. All 339 tests pass in this mode with no code changes needed.

### vi.mock hoisting — never reference outer variables in factory
`workerRecovery.test.ts` originally did `const mockPipeline = vi.fn()` then used it in `vi.mock(...)` factory — this causes "Cannot access before initialization" because `vi.mock` is hoisted. Fix: use `vi.fn()` inline in the factory, then get the typed reference via `vi.mocked()` after a top-level `await import(...)`.

### emergencyShutdownThreshold ordering matters in token budget tests
`checkTokenBudget()` checks emergency shutdown BEFORE checking daily limit. If threshold is 90% and you add 1001 tokens to a 1000-token limit, emergency fires first (at 100.1% > 90%) — not the daily limit. Fix: set `emergencyShutdownThreshold: 101` in the shared `beforeEach` so daily limit fires first. Tests that specifically test emergency must call `configureTokenBudget({ emergencyShutdownThreshold: 90 })` within themselves.

### getStaleWorkspaces boundary: use <= not <
`getStaleWorkspaces(0)` sets `cutoff = Date.now() - 0 = Date.now()`. An entry registered at `Date.now()` has `lastAccessedAt === cutoff`. Using strict `<` misses it; must use `<=`.

### autocannon load scripts — no setupClient with setHeadersTimeout
The installed autocannon version doesn't support `client.setHeadersTimeout()` in `setupClient`. Remove the `setupClient` block entirely; timeouts are handled by autocannon's own defaults. Compile TS scripts with `esbuild --bundle --platform=node --format=cjs` since `tsx` is not in the workspace.

## Load test results (2026-06-19, Replit dev, single process, in-memory queue)

| Tier | Req/s | Avg latency | p95 | Errors |
|---|---|---|---|---|
| 10 users / 10s | 2,488 | 3.54 ms | 17 ms | 0 |
| 100 users / 30s | 3,321 | 29.68 ms | 71 ms | 0 |

p95 stays under 75ms at 100 concurrent — well within 200ms SLA target.

## Test count
293 (V6.x) + 46 (V7.0) = **339 / 339 passing**
