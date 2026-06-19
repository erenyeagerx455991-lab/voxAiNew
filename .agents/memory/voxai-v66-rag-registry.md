---
name: VoxAI V6.6 RAG Registry
description: Intent-based top-K component retrieval replaces full registry injection in agents.ts; 80%+ token reduction; 293 tests all pass.
---

## What Changed

### Call-site (agents.ts ~line 220)
```ts
// Before
const componentContext = buildContextFromTemplates(selectedTemplates);

// After
const ragResult = await retrieveComponents(prompt, blueprint.sectionOrder, 15);
const componentContext = buildCompressedCatalogue(ragResult);
```
`selectTemplatesForPrompt()` is kept above — still drives audit validation (heroMatch/featuresMatch/dashboardMatch/pricingMatch). Do NOT remove it.

### Token reduction
- Before: ~3,200 tokens (full JSX standaloneCode for 8-10 templates)
- After: <600 tokens (compact descriptions for top-15 ranked components)

### Module locations
All new V6.6 modules live in:
- `src/components/registryV2/` — registryTypes, componentTags, componentMetadata, searchIndex
- `src/components/retrieval/` — intentParser, scoreComponents, retrieveComponents, retrievalCache, buildRegistryContext, registryMetrics

### Telemetry
- `GET /api/telemetry/registry` (auth-gated) added to telemetry.ts

## Test Suite

27 test files, 293 tests, all passing.

New files:
- `tests/unit/retrieval.test.ts` — 17 tests (intent parsing + retrieval)
- `tests/unit/scoring.test.ts` — 10 tests (scoring formula)
- `tests/unit/cache.test.ts` — 9 tests (cache TTL/eviction)
- `tests/integration/registryPipeline.test.ts` — 12 tests (E2E pipeline + token targets)

vitest.config.ts `include` was updated to add `'tests/**/*.test.ts'` alongside `'src/tests/**/*.test.ts'`.

## Known Gotcha

`repairMetrics.ts` has module-level variables (`totalAttempts`, `successfulRepairs`, `repairPassCounts[]`, `repairRecords[]`). These persist across tests. Must call `resetRepairMetrics()` (not `globalMetrics.reset()`) in `beforeEach` for repair metrics integration tests. The `resetRepairMetrics()` function was added to `repairMetrics.ts` to support this.

**Why:** Module-level state bleeds across test files — `globalMetrics.reset()` only resets the metrics store, not the module's own counters/arrays.

**How to apply:** Any new test file that calls `recordRepairAttempt/Success/Failure` must import and call `resetRepairMetrics()` in `beforeEach`.
