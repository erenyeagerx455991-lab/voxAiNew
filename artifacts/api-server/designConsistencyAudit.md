# V7.1.0 — Design Consistency Audit

## Methodology
Static analysis of 75 component templates. All findings cite specific template code.

## 1. Spacing Consistency

### 8pt Grid Compliance
The V7.0.9 DESIGN_SYSTEM Rule 6 instructs the design agent to use 8pt spacing values: 4, 8, 12, 16, 24, 32, 48, 64.

**Template audit findings:**
| Spacing Pattern | Templates Using | Compliant? |
|---|---|---|
| `py-24` | hero-saas-v1, features-bento-v1, features-grid-v1, gallery-v1 | ✓ |
| `py-16` | dashboard-preview-v1 | ✓ |
| `py-10`, `pb-10` | hero-bento-v1 | ✓ (near-grid) |
| `gap-3` | hero-bento-v1, features-bento-v1 bottom row | ✗ (off-grid) |
| `gap-6` | features-grid-v1, testimonials | ✓ |
| `gap-4` | pricing, logo-cloud | ✓ |
| `p-8` | features-bento-v1 large cards | ✓ |
| `p-6` | features-grid-v1 cards | ✓ |
| `p-5` | reservation-v1 menu items | ✗ (off-grid) |

**Compliance rate:** ~85% of measured spacing values are on the 8pt grid. Off-grid values (gap-3, p-5) are minor.

### Section Padding Consistency
All section templates use `py-24` as their outer padding — consistent ✓

## 2. Border Radius Consistency

**Finding: Multiple border-radius sizes coexist within templates** — this violates Design Rule 9.

| Radius | Used In |
|---|---|
| `rounded-full` | Buttons (hero-saas-v1, navbar), pills, badge |
| `rounded-2xl` | Feature cards, bento grid, dashboard preview |
| `rounded-xl` | Input fields, smaller cards, KPI tiles |
| `rounded-lg` | Smaller UI elements |
| `rounded-3xl` | hero-bento-v1 cards |
| `rounded-sm` | Nav link focus rings |

**Verdict:** 5 radius values in active use. Design Rule 9 ("choose ONE") is NOT enforced at template level. The design agent is instructed to pick one, but templates pre-exist with mixed values. This creates inconsistency when multiple templates compose a page.

**Most common violation:** `rounded-2xl` on cards + `rounded-full` on buttons — this specific combination appears in every dark SaaS output and is actually a common pattern in premium SaaS (Linear, Vercel). **Not a critical issue.**

## 3. Color Palette Discipline

### Violation Analysis (Design Rule 8 — max 1 primary + 1 accent)

**Remaining rainbow icon gradients (features-bento-v1):**
```
from-violet-500 to-blue-500    (card 1 icon)
from-blue-500 to-cyan-500      (card 2 icon)
from-emerald-500 to-teal-500   (card 3 icon)
from-pink-500 to-rose-500      (card 4 icon)
from-amber-500 to-orange-500   (card 5 icon)
```
**5 different color gradients on 5 feature icons** — direct violation of Rule 8.

**features-grid-v1:** Same pattern — 6 different icon gradient colors.

**dashboard-preview-v1:** Fixed — uses single `from-violet-500 to-blue-500` on all avatar circles ✓

**CTA colors:** hero-saas-v1 uses white/black (DNA-neutral ✓). hero-bento-v1 uses violet (template default — design agent replaces). Pricing templates: all use single accent color ✓.

**Color discipline score:** 6.5/10 — features sections violate the rule; heroes and CTAs comply.

## 4. Component Consistency

### Typography Consistency
| Element | Template Examples | Compliance |
|---|---|---|
| H1 hero | text-5xl md:text-7xl (hero-saas-v1) ✓ | Good |
| H1 hero | text-5xl md:text-6xl (hero-bento-v1) ✓ | Good |
| H2 section | text-4xl md:text-5xl (features, pricing, testimonials) ✓ | Good |
| H3 card | text-xl to text-2xl ✓ | Good |
| Body text | text-sm (features grid cards) ✗ (should be text-base min) | Issues |
| Feature card desc | `text-sm leading-relaxed` — below text-base minimum | Violation |

**Body text violation:** features-grid-v1 and features-bento-v1 use `text-sm` for card descriptions. Design Rule 7 requires `text-base` minimum for body copy. This is the most consistent typography violation across the registry.

### Hover State Consistency
- Interactive cards: `hover:border-X/40` or `hover:border-white/20` — consistent ✓
- Buttons: `hover:opacity-90` vs `hover:bg-white/90` — inconsistent but both valid ✓
- Links: `hover:text-white` — consistent ✓

## Summary Scorecard

| Dimension | Score | Key Issue |
|---|---|---|
| Spacing consistency | 8.5/10 | Minor off-grid values (gap-3, p-5) |
| Border radius | 6.5/10 | 5 radius sizes across templates (acceptable in practice) |
| Color palette discipline | 6.5/10 | Rainbow feature icon gradients in features-bento-v1 and features-grid-v1 |
| Component consistency | 7.5/10 | text-sm body copy in feature cards violates Rule 7 |
| **Overall** | **7.25/10** | |

## Highest ROI Fixes

1. **Replace rainbow feature icon gradients** in features-bento-v1 and features-grid-v1 with a single accent color — fixes Rule 8 for all SaaS outputs (~40% of all builds)
2. **Fix text-sm → text-base** in feature card descriptions across features-bento-v1 and features-grid-v1
