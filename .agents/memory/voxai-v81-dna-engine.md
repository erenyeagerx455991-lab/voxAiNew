---
name: VoxAI V8.1 Self-Evolving Design DNA Engine
description: 6 new design-dna modules; 8 learnFrom* functions; Phase 10 promotion/demotion; 165 new tests; all additive.
---

## What was built
6 new files in `src/design-dna/`:
- `dnaTypes.ts` — `DesignDNARecord` schema, `computeV81Quality()` (Phase 9 formula), `computeConfidence()`
- `dnaRegistry.ts` — In-memory CRUD Map for DNA records; `resetRegistry()` for tests
- `dnaRanking.ts` — 21-category ranking engine; `RankCategory` union type; `resetRankings()` for tests
- `dnaVersioning.ts` — Immutable version snapshots (frozen); rollback; 50-version cap per DNA
- `dnaPersistence.ts` — JSON write to `/tmp/voxai-dna/snapshot.json`; debounced 5s; disabled in tests
- `designDNA.ts` — Facade: `learnFromBuild/Critic/Benchmark/Repair/UserFeedback/VisualDiff/Runtime/Telemetry`, `rollbackDna`, `getDNAManagerMetrics`, `computeDnaStatus`

## Phase 9 quality formula (V8.1)
```
rankingScore = evaluator×0.35 + critic×0.20 + a11y×0.10 + perf×0.10 + visual×0.10
             + runtimeStability×0.05 + userFeedback×0.05 + benchmark×0.05
```
Existing per-dimension formula in `dnaMetrics.ts` is UNCHANGED.

## Phase 10 promotion/demotion rules (computeDnaStatus in designDNA.ts)
Promote only when ALL 5 met: rankingScore≥9, repairRate<15%, a11y≥9, perf≥8.5, visual≥9.
Demote when ANY 1 triggered: repairRate>50%, a11y<7, perf<7, criticSeverityHigh, visualRegressionHigh.

## Pipeline wiring
- `buildPipeline.ts`: `setImmediate(() => learnFromBuild(...))` fires after `sse(res, { type: "done" })`.
- Wrapped in try/catch — DNA learning NEVER throws into the build pipeline.

## Telemetry
- `routes/telemetry.ts`: `getDNAManagerMetrics()` call wrapped in try/catch in `designDNA` key.
- V8.1 fields added additively: currentVersion, evolutionCount, topLayouts/Components/Sections/Themes/Motions/Tokens, learningRate, confidence, lastEvolution, v81* detail keys.

## Test infrastructure
6 test files in `src/tests/unit/dna*.test.ts`; 165 new tests.
All tests call `resetRegistry()`, `resetRankings()`, `resetVersionHistory()`, `resetPersistenceMetrics()`, `disablePersistence()` in `beforeEach`.

## Critical fixes (found by code review, all applied)
1. `learnFromVisualDiff()` now calls `computeDnaStatus()` with `visualRegressionHigh: input.layoutRegression` — Phase 10 demotion trigger enforced.
2. `learnFromRepair()` now recomputes status with new repairRate after each repair call.
3. `buildPipeline.ts` learnFromBuild hook uses `criticScore: 5` (neutral) — critic delivers separately via `learnFromCritic()`.
4. `dnaPersistence.ts` now saves/loads `versionHistory` for rollback continuity across restarts.
5. `initPersistence()` wired into `src/index.ts` startup (non-blocking, best-effort).
6. Registry capped at 500 records — LRU eviction by usageCount (prevents unbounded growth).

## Important rules
- `AgentName` union in `agentMetrics.ts` must be extended for every new `withAgentMetrics()` call.
- `dnaPersistence.ts` uses `/tmp` — not preserved across container restarts (by design for dev); version history IS persisted within a session.
- `_statusOverrides` Map in `dnaRanking.ts` and version history Map in `dnaVersioning.ts` are bounded (50 cap on versions; ranking statuses are few by design).
- All `learnFrom*` functions in `designDNA.ts` are the ONLY public surface for pipeline code; internal modules (registry, ranking, versioning) must not be called directly from pipeline.
- `DNAPersistenceSnapshot` in `dnaTypes.ts` includes `versionHistory?` field (added V8.1 — backward compatible; old snapshots without it load fine).
