---
name: VoxAI V7.1.8 Design RAG Foundation
description: 104-reference design corpus, quality-aware retriever, planner+frontend injection, evaluator Phase 8 fields, telemetry extension.
---

## Architecture

**Files:**
- `src/design-rag/designCorpus.ts` — 104 DesignReference objects, 8 categories (hero×25, features×20, pricing×15, testimonials×10, dashboard×10, faq×8, cta×8, navbar×8)
- `src/design-rag/retriever.ts` — scoring engine, dedup, top-5, `extractRetrievalIntent()`, `retrieveDesignReferences()`, `buildRetrievalContext()`

## Injection Point

`frontendStep.ts` — AFTER registry selection + deprecation filtering (V7.1.6), BEFORE codegen callAI call.

Retrieval context appended to system prompt: `${buildCodeSystem(...)}\n\n${retrievalCtx}`. Fails silently if retrieval throws.

## Pipeline Types

`FrontendOutput` carries `retrievalContext: string` and `retrievalReferenceIds: string[]`.

## EvaluatorResult Phase 8

Added to `designEvaluatorStep.ts`:
- `referencesUsed: string[]` — from `frontend.retrievalReferenceIds ?? []`
- `scoreBeforeRepair: number` — captured as `initialScore` before while loop
- `scoreAfterRepair: number` — final evalResult.overallScore
- `retrievalImpactScore: number` — same as scoreAfterRepair (no A/B baseline)

## Telemetry

`GET /telemetry/quality` now returns `retrieval: getRetrievalMetrics()`.
`recordDesignRetrieval()` called inside `retriever.ts` on every retrieval.

## Test Count

591 tests pass (530 baseline + 61 new design-rag tests).

**Why:** Retrieval must be inside frontendStep, not plannerStep — planner runs before DNA composition is finalized, while frontendStep has both `design.designLanguage` and `dnaComposition` available as stable inputs.
