# VoxAI V6.6 Registry V2 + RAG Retrieval — Final Report

## Summary

V6.6 replaces full-registry prompt injection (~3,200 tokens/build) with an intent-based
top-K component retrieval system (target: <600 tokens/build). All pipeline steps are
unchanged; only the `componentContext` string injected into the codegen system prompt
changes.

---

## Architecture

### Before (buildContextFromTemplates)
```
prompt → selectTemplatesForPrompt() → 8–10 templates → buildContextFromTemplates()
                                         ↓
                       Full standaloneCode (JSX) for each template
                       ≈ 3,000–3,600 tokens injected per build
```

### After (RAG V2)
```
prompt → parseIntent() → intent{industry, style, sections, goals, keywords}
                          ↓
            searchIndex → getAllComponentMetadata() → rankComponents()
                          ↓
            top-K scored results → buildCompressedCatalogue()
            ≈ 200–600 tokens injected per build
```

---

## Module Inventory

| Module | Path | Description |
|---|---|---|
| `registryTypes.ts` | `src/components/registryV2/` | TypeScript types for all V2 structures |
| `componentTags.ts` | `src/components/registryV2/` | Master tag taxonomy (industry, style, conversion goal) |
| `componentMetadata.ts` | `src/components/registryV2/` | Structured metadata for all 77 components |
| `searchIndex.ts` | `src/components/registryV2/` | Keyword index built at startup, `getIndexStats()` |
| `intentParser.ts` | `src/components/retrieval/` | Prompt → `RetrievalIntent` (industry/style/sections/keywords/goal) |
| `scoreComponents.ts` | `src/components/retrieval/` | Per-component scoring formula with `matchReasons` |
| `retrieveComponents.ts` | `src/components/retrieval/` | Top-level retrieval: intent + score + cache + metrics |
| `retrievalCache.ts` | `src/components/retrieval/` | In-memory LRU cache, 15 min TTL, `evictExpired()` |
| `buildRegistryContext.ts` | `src/components/retrieval/` | `buildCompressedCatalogue()` — compact prompt string |
| `registryMetrics.ts` | `src/components/retrieval/` | Registry telemetry (hits, misses, top queries, latency) |

---

## Call-Site Replacement (agents.ts)

```ts
// Before
const componentContext = buildContextFromTemplates(selectedTemplates);

// After
const ragResult = await retrieveComponents(prompt, blueprint.sectionOrder, 15);
const componentContext = buildCompressedCatalogue(ragResult);
```

`selectTemplatesForPrompt` is still called above this — it drives the audit validation
(heroMatch, featuresMatch, dashboardMatch, pricingMatch) and is not replaced.

---

## Token Reduction

| Metric | Before | After (target) |
|---|---|---|
| Tokens per build | ~3,200 | <600 |
| Reduction | — | >80% |
| Components injected | 8–10 full JSX blobs | 10–15 compact descriptions |
| Caching | None | 15-min in-memory LRU |

---

## Scoring Formula

Each component receives a score based on:

| Signal | Weight |
|---|---|
| Industry match | High |
| Section/category match | High |
| Style match | Medium |
| Conversion goal match | Medium |
| Keyword hits | Per-hit bonus |
| Priority (1–10 base score) | Low |

All matches are appended to `matchReasons[]` for transparency.

---

## Test Coverage

| Test File | Tests | Focus |
|---|---|---|
| `tests/unit/retrieval.test.ts` | 17 | Intent parsing + end-to-end retrieval |
| `tests/unit/scoring.test.ts` | 10 | Scoring formula + rank ordering |
| `tests/unit/cache.test.ts` | 9 | Cache CRUD, TTL expiry, eviction |
| `tests/integration/registryPipeline.test.ts` | 12 | Full pipeline + token targets |
| **Total new** | **48** | |
| **Total suite** | **293** | All passing ✓ |

---

## Telemetry

New endpoint: `GET /api/telemetry/registry` (auth-gated)

Exposes:
- `totalRetrievals`, `cacheHitRate`, `avgRetrievalMs`
- `topQueries[]` — most-frequent prompt prefixes
- `componentHitCounts` — which components get selected most
- `avgComponentsReturned`, `avgTokenEstimate`

---

## Backward Compatibility

- Audit validation (`heroMatch`, `featuresMatch`, etc.) unchanged — still driven by `selectTemplatesForPrompt`
- All SSE events unchanged
- All existing 206 tests pass unchanged
- `buildContextFromTemplates` import retained in `registry.ts` (not removed, may be referenced elsewhere)

---

## Phase Checklist

- [x] Phase 1: Registry inventory + audit (`registryInventory.md`)
- [x] Phase 2: Type definitions (`registryTypes.ts`)
- [x] Phase 3: Component metadata layer (`componentMetadata.ts`, `componentTags.ts`)
- [x] Phase 4: Search index (`searchIndex.ts`)
- [x] Phase 5: Intent parser (`intentParser.ts`)
- [x] Phase 6: Scoring engine (`scoreComponents.ts`)
- [x] Phase 7: Retrieval cache (`retrievalCache.ts`)
- [x] Phase 8: Top-level retrieval (`retrieveComponents.ts`)
- [x] Phase 9: Context builder (`buildRegistryContext.ts`)
- [x] Phase 10: Registry metrics (`registryMetrics.ts`)
- [x] Phase 11: Telemetry endpoint (`GET /api/telemetry/registry`)
- [x] Phase 12: Call-site wiring in `agents.ts`
- [x] Phase 13: Tests (48 new, 293 total all passing)
- [x] Phase 14: Report + inventory docs
