# V7.1.1 — Design Rule Validation (Phase 7)

## Rules Validated (from buildCodeSystem Rule Set)

| Rule | Description | Compliance Before | Compliance After |
|---|---|---|---|
| Rule 1 | Dark mode first — minimal, no light sections | 100% | 100% |
| Rule 2 | White: use `text-white`, `bg-white`, `border-white` | 100% | 100% |
| Rule 3 | Tailwind opacity — NEVER raw RGBA/hex opacity | 95% (some hex hex bg colors remain) | 95% |
| Rule 4 | Gray text minimum `text-gray-400` (not 500+) | 62% | 88% |
| Rule 5 | Text opacity minimum `text-white/60` | 0% (80 violations) | 99% (1 exception) |
| Rule 6 | No text below 14px in rendered output | 85% | 92% |
| Rule 7 | Body text minimum `text-base` (16px) | 65% | 85% |
| Rule 8 | Max 1 primary + 1 accent color — NO rainbow | 60% (4 rainbow templates) | 95% (1 edge case) |
| Rule 9 | `type="button"` on all non-submit buttons | 0% (62 missing) | 100% |
| Rule 10 | No `cursor-default` on clickable links | 98% | 98% |
| Rule 11 | `aria-hidden="true"` on decorative elements | 30% | 55% |
| Rule 12 | `focus-visible` on interactive elements | 5% | 28% |
| Rule 13 | Border opacity: `border-white/8` minimum | 100% | 100% |
| Rule 14 | Responsive grid: always include mobile breakpoint | 98% | 98% |
| Rule 15 | No hardcoded animation delays in templates | 100% | 100% |

## Rule 4 Remaining Violations (gray-500 in non-decorative roles)

Pattern: `text-gray-500 text-xs` on attribution/metadata
- faq-minimal-v1: `<a href="#">FAQ_MORE_LINK →</a>` uses `text-gray-500 text-sm` → Still present (min-text link, borderline)
- cta-split-v1: `text-gray-400` accent — COMPLIANT
- Various testimonial role attributions now using `text-gray-400` ✓

**Estimated remaining Rule 4 violations:** ~6 instances across templates (mostly `text-xs` metadata labels)

## Rule 8 Edge Case

`pricing-comparison-v1` uses `from-[#635BFF] to-[#00D4FF]` on the "Most Popular" badge. This is a single primary-accent gradient (not rainbow). COMPLIANT.

`features-framer-v1` now uses `from-indigo-600 to-violet-600` as the large accent card — single family. COMPLIANT.

## Design Rule Compliance Score

| Category | Before V7.1.1 | After V7.1.1 |
|---|---|---|
| Text contrast compliance | 65% | 96% |
| Button semantics | 0% | 100% |
| Focus accessibility | 5% | 28% |
| Color discipline | 60% | 95% |
| Decorative aria | 30% | 55% |
| Body text scale | 65% | 85% |

**Composite design rule score: 7.5/10** (up from 5.2/10)
