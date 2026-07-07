---
name: VoxAI V8.3 Autonomous AI Design Director
description: 25-category static strategic review engine at pipeline step 11.5 (between Optimization and Backend). No LLM, pure heuristics. Key gotchas and decisions.
---

# VoxAI V8.3 — Autonomous AI Design Director

## Architecture
- **8 core modules** in `src/design-director/`: directorTypes, directorReview, directorRecommendations, designDirector, directorLearning, directorMetrics, directorPersistence, directorFacade
- **1 pipeline step**: `src/agents/pipeline/designDirectorStep.ts`
- **Pipeline position**: step 11.5 — between `runOptimizationStep` (step 11) and `runBackendStep` (step 12)
- Step output variable: `directedFrontend` (flows to `runBackendStep` and `done` SSE)

## Key Gotchas

**DIRECTOR_WEIGHTS must sum to exactly 1.00** (currently 1.00 across 25 categories). If adding/changing weights, recalculate. The test `expect(sum).toBeCloseTo(1.0, 2)` allows ±0.005.

**htmlFor regex must be `/htmlFor|<Label/` not `/htmlFor=|<Label/`** — the `=` variant falsely rejects `htmlFor` without attribute-value syntax in test strings.

**Conditional categories** (pricingPresentation, dashboardExperience, forms) return score=7.5, confidence=0.5 when the relevant flag is false (`hasPricing`, `isDashboard`, `isForm`). Do not penalize these categories for pages that don't need them.

**Director failure is non-fatal** — `designDirectorStep.ts` catches all errors and returns a neutral `DirectorReview` (score=7.0, empty arrays) so SSE stream is never broken.

**`mostImprovedCategories`** is always `[]` from `runDesignDirector()` — it's an additive field meant to be populated by external learning history comparison, not the base engine.

## 25 Categories and Weights

visualHierarchy: 0.07, typography: 0.05, spacing: 0.05, composition: 0.04, layoutRhythm: 0.03, brandConsistency: 0.06, premiumFeel: 0.05, modernity: 0.03, trust: 0.06, emotionalImpact: 0.03, storytelling: 0.03, ctaPlacement: 0.06, pricingPresentation: 0.03, dashboardExperience: 0.02, navigation: 0.04, forms: 0.03, motion: 0.02, accessibility: 0.05, performance: 0.02, responsiveness: 0.03, componentConsistency: 0.05, tokenConsistency: 0.03, dnaAlignment: 0.04, uxAlignment: 0.04, conversionAlignment: 0.04

Sum = 1.00

## SSE Events (4 new + 1 additive field)
- `director_start` — agent start signal
- `director_review` — scores, top recommendations, creative direction, confidence
- `director_complete` — final score, most common problems
- `director_learning` — DNA learning feedback
- `done` SSE gains additive field: `directorScore`

## Persistence
- File: `/tmp/voxai-director/director-history.json`
- Max 500 records, 30s debounced save
- Hydrated at startup via `hydrateDirectorLearning` in `index.ts`

## Wiring Checklist (for future steps)
- AgentName union extended with "DesignDirector" in `agentMetrics.ts`
- `designDirector: getDirectorMetrics()` added to `/api/telemetry/quality`
- `initDirectorPersistence` + `hydrateDirectorLearning` in `index.ts`

**Why:** This engine must be pure static analysis (no LLM) to stay fast in the pipeline. All LLM-based analysis was already handled by earlier steps (evaluator, critic, conversion). The Director synthesizes all prior signals into a unified strategic score.
