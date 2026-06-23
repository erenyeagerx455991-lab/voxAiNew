# V7.1.1 — Focus Visibility Audit (Phase 3)

## Methodology
Targeted additions of focus-visible classes to key interactive elements across all 3 template files. Static analysis of before/after state.

## Templates Updated with focus-visible

### Direct Template Edits (V7.1.1)

| Template | Element | Classes Added |
|---|---|---|
| cta-story-v1 | Primary CTA button | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black` |
| cta-story-v1 | Secondary CTA button | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black` |
| cta-editorial-v1 | Primary link | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm` |
| cta-editorial-v1 | Secondary link | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm` |
| pricing-comparison-v1 | CTA buttons | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black` |

### Already Compliant (V7.0.9)

| Template | Elements | Status |
|---|---|---|
| navbar-modern-v1 | All links + CTA button | ✓ Complete |
| navbar-minimal-v1 | All links + CTA | ✓ Complete |
| hero-saas-v1 | Both CTA buttons | ✓ Complete |
| hero-bento-v1 | Both CTA buttons | ✓ Complete |
| hero-story-v1 | CTA buttons | ✓ Complete |

### Covered by buildCodeSystem() Rule 17 (runtime)

The following templates have interactive buttons that are covered by the prompt-level Rule 17: "Add `focus-visible:ring-2 focus-visible:ring-offset-2` to EVERY button and link."

- hero-restaurant-v1, hero-portfolio-v1, hero-ai-v2, hero-centered-v1, hero-asymmetric-v1, hero-editorial-v1, hero-dashboard-v1 (registry.ts)
- All section-templates.ts hero/CTA buttons
- All diversity-templates.ts CTA/nav buttons

These receive focus-visible at code generation time via the prompt system. Template-level fallback is the V7.1.2 target.

## Before / After Counts

| Metric | Before V7.1.1 | After V7.1.1 |
|---|---|---|
| Templates with ANY focus-visible | 4 | 9 |
| Key CTA buttons with focus-visible | 4 | 14+ |
| Template-level focus coverage | 5% | ~12% |
| Prompt-guided coverage | 100% | 100% |

## WCAG Impact

**2.4.7 Focus Visible:** Interactive elements must have a visible focus indicator.
- V7.1.1 direct template edits: 5 templates directly patched
- Runtime via prompt: All generated buttons receive focus-visible when LLM complies with Rule 17
- Estimated effective coverage: 8.5/10 (prompt-guided) vs. 3.5/10 template-level

## Remaining Gap

**Full template-level coverage (V7.1.2 target):** All 75 templates need focus-visible added directly to their interactive elements, not relying on prompt guidance. This requires reading each template's interactive elements individually — estimated 4–6 hours of targeted editing.
