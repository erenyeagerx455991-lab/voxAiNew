---
name: VoxAI V7.3.5 Self-Evolving DNA Engine
description: 18-phase autonomous design DNA learning loop — what was pre-built, what needed fixing, and key invariants.
---

# VoxAI V7.3.5 Self-Evolving Design DNA Engine

## What was pre-built (Phases 1–16 already existed)
- `dnaMetrics.ts`, `dnaLearning.ts`, `dnaEvolution.ts` — full DNA store, quality formula, promotion/demotion, evolution hints
- `evaluator.ts` — `dnaQuality: 0.03` dimension already wired (16th dimension)
- `retriever.ts` + `sectionRetriever.ts` — `dnaQualityBonus` already applied (±7.5 range)
- `treeBuilder.ts` — DNA quality > 7.0 boosts optional component priority
- `plannerStep.ts` — `buildDNAOptimizationHints()` already injected into user prompt
- `criticLearning.ts`, `tokenLearning.ts`, `motionMetrics.ts` — learning stores exist
- `sectionReferenceMetrics.ts` — had hero/pricing/cta/features but MISSING navbar/dashboard/form
- `buildPipeline.ts` — `recordDNAOutcome()` wired after ConversionStep

## Gaps fixed in this session
- **Phase 13**: Added `getTopNavbarReferences`, `getTopDashboardReferences`, `getTopFormReferences` to `sectionReferenceMetrics.ts`; added `'form'` to `getAllSectionLeaderboards` ALL_TYPES; added navbar/dashboard/form to `getSectionLearningMetrics`
- **Phase 15**: Telemetry `/telemetry/quality.designDNA` updated to dual-shape: flat Phase 15 fields at top level + `evolution`/`tokenLearning`/`sectionLeaderboards` nested for backward compat (spread would break existing `.evolution` consumers)
- **Tests**: Fixed failing test (`overallScore:4.0` with default high other scores → quality=6.28 > 5.5 filter; fix: lower ALL scores to 1.0); added 15 new `it()` blocks → 82 total across 20 suites
- **Audit**: Updated `v7.3.5Audit.md` with corrected counts, dual-shape telemetry schema, Phase 13 component table

## Key invariants
- **Telemetry backward compat**: never use bare `...getDNAEvolutionMetrics()` spread — it removes `designDNA.evolution` path; always project flat fields explicitly AND keep `evolution:` key
- **computeEvolutionInsights filter**: threshold is `qualityScore > 5.5`; test scores must produce quality < 5.5 (use all scores at 1.0 with repairTriggered=true → quality ≈ 0.95)
- **DNA quality formula**: weights sum to 1.0 (0.35+0.15+0.15+0.15+0.05+0.05+0.05+0.05); cold start = 5.0
- **Prefix convention**: sectionReferenceMetrics uses `'navbar-'`, `'dashboard-'`, `'form-'` prefixes matching sectionCorpus IDs

## Test count
1417 total (1399 baseline + 18 new); all pass; 82 `it()` blocks in `dnaLearning.test.ts`
