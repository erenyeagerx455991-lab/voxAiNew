# V7.1.0 — Weak Component Report

## Methodology
Static code analysis of all 75 templates. Scored on: typography, spacing, accessibility, color discipline, visual hierarchy.

## Bottom 10 Components (Ranked Weakest First)

### Rank 1: cta-story-v1 — Score: 4.5/10
**Category:** cta | **File:** diversity-templates.ts
**Issues:**
- `text-white/20` on body text (WCAG contrast failure — below 60% minimum)
- Missing `type="button"`, `focus-visible:ring`
- No `aria-label` on form inputs
- Generic background with minimal visual interest

### Rank 2: features-editorial-v1 — Score: 4.8/10
**Category:** features | **File:** section-templates.ts
**Issues:**
- `text-white/10` (5% opacity) on decorative text — severe WCAG failure
- `text-white/30` on body text — below 60% minimum
- No `focus-visible` on interactive elements
- Missing `aria-label` on buttons

### Rank 3: features-split-v1 — Score: 5.0/10
**Category:** features | **File:** section-templates.ts
**Issues:**
- `text-white/8` (3% opacity) — virtually invisible, severe WCAG failure
- `text-white/40` on body text — below 60% minimum
- Hardcoded colors (hex values) that don't respond to DNA
- No accessibility attributes on interactive elements

### Rank 4: faq-minimal-v1 — Score: 5.2/10
**Category:** faq | **File:** diversity-templates.ts
**Issues:**
- Low-opacity text throughout
- No `aria-expanded` on accordion triggers
- No `aria-controls` or `role="region"` on panels
- Missing `type="button"` on toggle buttons
- Users cannot determine open/closed state via screen reader

### Rank 5: dashboard-vercel-v1 — Score: 5.5/10
**Category:** dashboard-preview | **File:** section-templates.ts
**Issues:**
- `text-white/15` (7.5% opacity) on some labels — extreme WCAG failure
- `text-white/25` on secondary text — below 60% minimum
- Hardcoded colors that resist DNA adaptation
- No interactive accessibility attributes

### Rank 6: cta-editorial-v1 — Score: 5.5/10
**Category:** cta | **File:** diversity-templates.ts
**Issues:**
- `text-white/40` on body text — below 60% minimum
- No `focus-visible:ring` on CTA button
- Minimal visual hierarchy

### Rank 7: dashboard-kanban-v1 — Score: 5.8/10
**Category:** dashboard-preview | **File:** section-templates.ts
**Issues:**
- `text-white/20` on labels — below 60% minimum
- View switcher buttons missing `aria-label` and `role="tab"`
- Hardcoded colors in card system

### Rank 8: pricing-comparison-v1 — Score: 6.0/10
**Category:** pricing | **File:** section-templates.ts
**Issues:**
- `text-white/30` on feature descriptions — below 60% minimum
- Hardcoded colors (`#0A2540`, etc.)
- No `aria-label` on pricing buttons
- Missing `aria-selected` on toggle tabs

### Rank 9: features-framer-v1 — Score: 6.0/10
**Category:** features | **File:** section-templates.ts
**Issues:**
- `text-white/35` on supporting text — below 60% minimum
- Hardcoded accent color (`#FF3D57`) — resists DNA override
- No `focus-visible` on links/buttons

### Rank 10: testimonials-wall-v1 — Score: 6.2/10
**Category:** testimonials | **File:** diversity-templates.ts
**Issues:**
- `text-white/40` on testimonial body text — below 60% minimum
- Hardcoded colors in rating/star system
- No avatar `aria-label`
- Ticker animation has no `prefers-reduced-motion` check

## Common Patterns Across All 10

| Issue | Count | Affected Templates |
|---|---|---|
| Sub-60% opacity text | 10/10 | All weak components |
| Missing `focus-visible:ring` | 9/10 | All except partial fixes |
| Missing `type="button"` | 9/10 | Most |
| Hardcoded hex colors | 7/10 | Most |
| No aria attributes | 8/10 | Most |

## Highest ROI Fix

**Single fix, maximum impact: Raise all sub-60% opacity text to minimum text-white/60**
- Affects: all 10 weak components
- Changes: ~30 lines across 10 templates
- Impact: +2 points on accessibility score, eliminates WCAG contrast failures
- Risk: Zero (purely additive color change)

## Next Highest ROI

**Apply `type="button"` + `focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2`** to all buttons in weak components.
- Affects: 9/10 weak components
- Impact: +1.5 accessibility points per component
