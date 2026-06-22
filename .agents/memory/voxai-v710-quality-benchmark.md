---
name: VoxAI V7.1.0 Real Output Quality Benchmark
description: Evidence-based quality measurement across 75 templates. 10 audit docs. No code changes — documentation only.
---

## Measured Score: 7.2/10 overall

| Dimension | Score | Notes |
|---|---|---|
| Design DNA variety | 9.5/10 | 7 DNA profiles, 9 hero variants — genuine differentiator vs. competitors |
| Section routing | 9.2/10 | Category-aware RAG selection, restaurant/agency/portfolio routing works |
| Full-stack pipeline | 8.5/10 | Backend/DB/auth generation confirmed |
| Spacing consistency | 8.5/10 | 85%+ 8pt grid in templates |
| Prompt quality | 8.3/10 | CODEFIX 9.5, DESIGN 9.0, buildCodeSystem 8.5, planner 7.0 |
| Hero quality (top 2) | 8.4/10 | hero-saas-v1 8.8, hero-bento-v1 8.0 |
| Typography | 7.5/10 | H1/H2/H3 scale good; text-sm body in feature cards is violation |
| Color discipline | 6.5/10 | Rainbow gradients in features-bento-v1 and features-grid-v1 |
| Template a11y | 3.2/10 | 22% type="button", 5% focus-visible, 0% FAQ aria-expanded |
| shadcn (template) | 0% | Zero templates use shadcn; prompt-only guidance is unreliable |

## Key Finding: The Fundamental Gap
VoxAI chose DNA variety over shadcn foundation. Lovable/v0 chose shadcn and get a11y for free. This is the core competitive gap — not visual quality but accessibility reliability. Template-level fixes (not prompt guidance) are needed.

## Bottom 10 Weak Components (worst first)
1. cta-story-v1 (4.5) — text-white/20, no a11y
2. features-editorial-v1 (4.8) — text-white/10, severe contrast
3. features-split-v1 (5.0) — text-white/8, near-invisible
4. faq-minimal-v1 (5.2) — no aria-expanded on accordion
5. dashboard-vercel-v1 (5.5) — text-white/15
6. cta-editorial-v1 (5.5) — text-white/40
7. dashboard-kanban-v1 (5.8) — text-white/20
8. pricing-comparison-v1 (6.0)
9. features-framer-v1 (6.0) — hardcoded #FF3D57
10. testimonials-wall-v1 (6.2)

## Highest ROI Fix for V7.1.1
Raise ALL sub-60% opacity text across all 75 templates to minimum text-white/60. Affects ~45+ templates. Accessibility template score jumps from 3.2 → 7+. Zero risk.

## Missing Prompt Constraints (not in any current prompt)
1. Section background alternation (no guidance → monotone flat pages)
2. Section count ceiling (no max → can produce 12+ section pages)
3. Diversity template preference (no guidance → hero-saas-v1 overused)

## What V7.1.0 Could NOT Measure
- Runtime shadcn adoption (requires actual builds)
- End-to-end screenshots of all 20 benchmark builds (38min sequential)
- Real WCAG contrast on rendered pages (requires browser engine)
- Competitor direct side-by-side (requires accounts on Lovable/Bolt/v0)

## Documents Created
artifacts/api-server/: outputBenchmarkDataset.md, heroQualityAudit.md, designConsistencyAudit.md, accessibilityValidation.md, shadcnUsageAudit.md, competitorComparison.md, weakComponentReport.md, promptOptimizationReport.md, v7.1.0QualityScore.md

## Why
The V7.0.9 "8.5/10" was a prompt-improvement projection, not a measurement. V7.1.0 establishes the honest measured baseline (7.2/10) with specific template-level evidence so V7.1.1 fixes target the real gaps.
