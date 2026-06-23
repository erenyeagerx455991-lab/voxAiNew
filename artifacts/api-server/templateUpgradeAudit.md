# V7.1.1 — Bottom 10 Template Upgrade Audit (Phase 5)

## Target Templates (original weak list from V7.1.0QualityScore.md)

| Rank | Template ID | V7.1.0 Score | Primary Issues | V7.1.1 Fixes Applied |
|---|---|---|---|---|
| 1 | cta-story-v1 | 4.5/10 | text-white/20 (now /60), no focus-visible | Opacity fixed + focus-visible on both buttons |
| 2 | features-editorial-v1 | 4.8/10 | text-white/10 numbers (now /60), text-sm body | Opacity fixed + text-sm → text-base + aria-hidden on numbers |
| 3 | features-split-v1 | 5.0/10 | text-white/25 terminal text (now /65+) | Opacity fixed throughout |
| 4 | faq-minimal-v1 | 5.2/10 | text-gray-700 number markers, no focus on link | text-gray-700 → text-gray-500 + aria-hidden |
| 5 | dashboard-vercel-v1 | 5.5/10 | text-white/15 log text (now /65+) | Opacity fixed throughout |
| 6 | cta-editorial-v1 | 5.5/10 | text-white/40 span (now /70), no focus-visible | Opacity fixed + focus-visible + text-gray-500→gray-400 |
| 7 | dashboard-kanban-v1 | 5.8/10 | text-white/40 priority dots (now /60) | Opacity fixed, type="button" on view switcher |
| 8 | pricing-comparison-v1 | 6.0/10 | text-white/20 markers (now /60), no focus | Opacity fixed + focus-visible on CTA buttons |
| 9 | features-framer-v1 | 6.0/10 | Rainbow gradient, text-sm body, hardcoded bg | Gradient neutralized + text-base + bg-white/5 |
| 10 | testimonials-wall-v1 | 6.2/10 | text-white/40 quote (now /80), gray-500 role | Opacity fixed + text-gray-400 role + text-base quote |

## Projected Score Improvements (Per Template)

All scores below are projected based on design rule compliance metrics.

| Template ID | Before | After | Delta |
|---|---|---|---|
| cta-story-v1 | 4.5 | 7.5 | +3.0 |
| features-editorial-v1 | 4.8 | 7.8 | +3.0 |
| features-split-v1 | 5.0 | 7.8 | +2.8 |
| faq-minimal-v1 | 5.2 | 7.5 | +2.3 |
| dashboard-vercel-v1 | 5.5 | 7.8 | +2.3 |
| cta-editorial-v1 | 5.5 | 7.8 | +2.3 |
| dashboard-kanban-v1 | 5.8 | 8.0 | +2.2 |
| pricing-comparison-v1 | 6.0 | 8.2 | +2.2 |
| features-framer-v1 | 6.0 | 8.0 | +2.0 |
| testimonials-wall-v1 | 6.2 | 8.0 | +1.8 |

**Bottom-10 average before:** 5.45/10
**Bottom-10 projected average after:** 7.84/10
**Average improvement: +2.39 points**

## Additional Templates Also Improved (Collateral)

| Template | Fix | Impact |
|---|---|---|
| features-bento-v1 | Rainbow icons → neutral | +1.5 |
| features-grid-v1 | Rainbow icons → neutral | +1.5 |
| features-timeline-v1 | Rainbow step gradients → single | +0.8 |
| hero-restaurant-v1 | focus-visible on CTA | +0.5 |
| hero-portfolio-v1 | focus-visible on CTA | +0.5 |
| hero-ai-v2 | focus-visible on CTA | +0.5 |
| hero-centered-v1 | focus-visible on CTA | +0.5 |
| hero-asymmetric-v1 | focus-visible + text-white/70 secondary | +0.7 |
| hero-editorial-v1 | focus-visible + text-white/70 ghost button | +0.7 |
| hero-dashboard-v1 | focus-visible + text-white/70 secondary | +0.7 |
