---
name: VoxAI V6.4.7 Test Infrastructure
description: Vitest + supertest test suite — 129 tests, 80% coverage, 10 test files across unit + integration.
---

## What was built

- `vitest.config.ts` — Node env, coverage v8, thresholds (stmt/func/line 70%, branch 60%), verbose reporter
- `package.json` scripts: `test`, `test:watch`, `test:coverage`
- `src/tests/setup.ts` — global setup (LOG_LEVEL=silent, NODE_ENV=test)
- `src/tests/helpers/fixtures.ts` — shared package.json, npm output, and ProjectFile fixtures

10 test files:
- `unit/packageScanner.test.ts` — 15 tests (safe pkg, 4 blocked hooks, suspicious deps, path traversal, metrics)
- `unit/errorClassifier.test.ts` — 14 tests (install + build classifiers, dedup)
- `unit/dependencyResolverV2.test.ts` — 29 tests (all 5 exported functions)
- `unit/buildRepairTargets.test.ts` — 9 tests (single/multi file, fallback, token guard)
- `unit/workspaceCleanup.test.ts` — 7 tests (active registry, cleanup result shape)
- `unit/securityMetrics.test.ts` — 8 tests (counter increment, snapshot isolation)
- `unit/rateLimiter.test.ts` — 14 tests (config, HTTP behavior, auth source verification)
- `unit/corsConfig.test.ts` — 10 tests (allowed origins, OPTIONS preflight, blocked origin)
- `integration/securityMiddleware.test.ts` — 7 tests (supertest against express apps)
- `integration/criticalRegression.test.ts` — 17 tests (source-level regressions for all V6.4.3+V6.4.6 controls)

## Final result
- 129 tests, 129 pass
- Statements: 80.25% | Branches: 76.38% | Functions: 76.25% | Lines: 80.11%
- All 4 coverage gates pass

## Key gotchas

**authMiddleware module-level key capture:**
`const CONFIGURED_KEY = process.env['API_KEY']` is set at import time, not per-request.
Setting `process.env['API_KEY']` in `beforeEach` has NO effect — the module is already cached.
To test enforcement, you'd need `vi.resetModules()` + dynamic re-import in a fresh vitest worker.
`vi.isolateModules()` does NOT exist in Vitest 4.x — it was removed.
The current tests verify enforcement via source-level assertions and the integration tests instead.

**resolveComponents / resolveRoutes return objects, not arrays:**
```ts
// WRONG:
const resolutions = resolveComponents(files);
// RIGHT:
const { resolutions } = resolveComponents(files);
const { resolutions } = resolveRoutes(files);
```

**resolvePackages takes full ResolvedDependencies, not just .packages:**
```ts
// WRONG:
resolvePackages(files, RESOLVED_DEPS.packages)
// RIGHT:
resolvePackages(files, RESOLVED_DEPS)
```

**buildExecutor.ts excluded from coverage:**
90%+ of its code is subprocess execution (`npm install`, `vite build`) that requires a live OS.
`buildRepairTargets` and `buildRuntimeState` are the only testable exports — tested in buildRepairTargets.test.ts.
Integration-tested via the V6.4.1 build engine validation (real builds).

**CORS regex single-subdomain only:**
`/^https?:\/\/[a-zA-Z0-9-]+\.repl\.co$/` — only matches `X.repl.co`, not `X.Y.repl.co`.
Test fixtures must use single-segment subdomains: `project.repl.co`, `abc123.replit.dev`.

**getRateLimitMetrics() returns config, not hit counts:**
Returns `{ buildLimit, chatLimit, generalLimit, windowMs }` — NOT `{ buildHits, chatHits }`.
Hit counts are tracked via `securityMetrics.ts` `recordRateLimitHit()`.
