# Component Library Inventory — V7.0.8

Source: direct inspection of `src/components/registry.ts`, `section-templates.ts`, `diversity-templates.ts`.
Generated: 2026-06-22. No assumptions.

---

## File Sources

| File | Components | Lines |
|---|---|---|
| `src/components/registry.ts` | 31 | 1,597 |
| `src/components/section-templates.ts` | 16 | 1,043 |
| `src/components/diversity-templates.ts` | 28 | 1,110 |
| **Total** | **75** | **3,750** |

---

## Category Totals

| Category | Count | File(s) |
|---|---|---|
| hero | 10 | registry.ts |
| navbar | 2 | registry.ts |
| features | 4 | registry.ts + section-templates.ts |
| pricing | 4 | registry.ts + section-templates.ts |
| testimonials | 3 | registry.ts |
| cta | 8 | registry.ts + diversity-templates.ts |
| footer | 3 | registry.ts |
| bento | 8 | registry.ts + diversity-templates.ts |
| dashboard-preview | 4 | registry.ts + section-templates.ts |
| faq | 6 | registry.ts + diversity-templates.ts |
| logo-cloud | 2 | registry.ts |
| gallery | 2 | registry.ts |
| contact | 1 | registry.ts |
| menu-section | 1 | registry.ts |
| chef-story | 1 | registry.ts |
| reservation | 1 | registry.ts |
| projects | 2 | registry.ts |
| case-studies | 2 | registry.ts |
| **TOTAL** | **75** | |

---

## Full Component Inventory

### HERO (10)

| ID | Name | Industries | Tags | Code Length (chars) | Priority |
|---|---|---|---|---|---|
| hero-saas-v1 | Hero SaaS | saas, ai, startup, fintech, generic | gradient, glassmorphism, stats, badge, dark | ~900 | 10 |
| hero-restaurant-v1 | Hero Restaurant | restaurant | full-bleed, overlay, minimal, elegant | ~700 | 10 |
| hero-portfolio-v1 | Hero Portfolio | portfolio, agency | split, minimal, text-heavy | ~850 | 10 |
| hero-ai-v2 | Hero AI Animated | ai, saas, startup | ai, animated, gradient, dark | ~1000 | 9 |
| hero-centered-v1 | Hero Centered Premium | saas, fintech, ai, startup | centered, gradient-orbs, pill-cta, stripe-style | ~1100 | 11 |
| hero-asymmetric-v1 | Hero Asymmetric Split | saas, ai, startup, generic | asymmetric, two-column, product-mockup, vercel-style | ~1500 | 11 |
| hero-editorial-v1 | Hero Editorial Typography | saas, ai, startup | editorial, oversized-type, linear-style, minimal | ~700 | 11 |
| hero-dashboard-v1 | Hero Dashboard Preview | saas, ai, startup | dashboard, product-screenshot, app-preview | ~1600 | 10 |
| hero-bento-v1 | Hero Bento Grid | saas, ai, startup, agency | bento, grid, framer-style, card-mosaic | ~1400 | 10 |
| hero-story-v1 | Hero Narrative Story | agency, portfolio, startup | narrative, editorial, light-bg, agency-style | ~900 | 10 |

### NAVBAR (2)

| ID | Name | Industries | Tags | Shadcn | Tailwind |
|---|---|---|---|---|---|
| navbar-modern-v1 | Navbar Modern | saas, ai, startup, generic | sticky, blur, dark | None | YES |
| navbar-minimal-v1 | Navbar Minimal | portfolio, agency, restaurant | minimal, light-compatible, clean | None | YES |

### FEATURES (4)

| ID | Name | Category | Notes |
|---|---|---|---|
| features-v1 (registry) | Features Grid | features | 3-col card grid, dark |
| features-v2 (registry) | Features List | features | alternating list |
| features-dashboard-v2 (section-templates) | Features Dashboard V2 | features | dashboard-preview hybrid |
| features-grid-v2 (section-templates) | Features Grid V2 | features | upgraded 3-col |

### PRICING (4)

| ID | Notes |
|---|---|
| pricing-v1 (registry) | 3-tier standard |
| pricing-table-v1 (registry) | Feature comparison table |
| pricing-v2 (section-templates) | Upgraded 3-tier with toggle |
| pricing-cards-v2 (section-templates) | Card variant |

### BENTO (8)

8 bento variants across registry.ts and diversity-templates.ts. Includes grid, masonry, and asymmetric layouts.

### CTA (8)

8 CTA variants including: centered banner, split layout, gradient, minimal, newsletter, dark/light combos.

### FAQ (6)

6 FAQ variants: standard accordion, numbered, minimal, grouped, split-layout, dark/light.

### DASHBOARD-PREVIEW (4)

4 dashboard mockup variants: analytics, SaaS metrics, CRM, minimal.

### TESTIMONIALS (3)

3 testimonial variants: card grid, masonry, single large quote.

### FOOTER (3)

3 footer variants: 4-column grid, minimal 2-row, dark centered.

---

## Structural Analysis

### Shadcn Usage in standaloneCode

**None.** All 75 standalone code components use raw Tailwind CSS only.

Shadcn components (Button, Card, Input, Badge, Avatar) are injected into the final generated output via `buildCodeSystem()` as globals — they are **not** part of the registry templates themselves. This is by design: registry templates serve as structural references; shadcn injection happens at codegen time.

### Tailwind Usage

**100%.** Every component uses Tailwind CSS exclusively.

### Dependency Count

All components are self-contained. Dependencies:
- React (global) — all components
- React.useState, React.useEffect — hero-ai-v2, hero-bento-v1 (word cycling, intervals)
- Lucide icons — none in standalone code; injected at codegen time
- Shadcn — none in standalone code

---

## Quality Issues Identified

### Duplicate / Near-Duplicate Components

| Issue | Components | Severity |
|---|---|---|
| Near-duplicate hero pattern | hero-saas-v1 vs hero-centered-v1 | Low — different color systems and DNA targeting |
| Minimal navbar is very short | navbar-minimal-v1 | Low — appropriate for minimal pattern |
| Restaurant-specific components are isolated | menu-section, chef-story, reservation | None — intentional |

### Short Components (<100 LOC equivalent)

| Component | Reason |
|---|---|
| hero-editorial-v1 | ~45 lines — intentional minimalism; typography IS the hero |
| navbar-minimal-v1 | ~20 lines — intentional; minimal nav |
| hero-restaurant-v1 | ~25 lines — intentional fullbleed simplicity |

### Oversized Components (>200 lines)

| Component | Lines | Reason |
|---|---|---|
| hero-dashboard-v1 | ~75 lines | Complex bar chart SVG inline |
| hero-asymmetric-v1 | ~80 lines | Terminal mockup + full 2-col layout |
| hero-bento-v1 | ~70 lines | Multi-card bento grid |

No components exceed 200 lines. None qualify as oversized.

### Placeholder Components

**None.** All components contain real JSX, actual Tailwind class names, and placeholder copy strings (HEADLINE_LINE1, SUBHEADLINE, etc.) as intended structural templates.

### Coverage Gaps

| Gap | Impact |
|---|---|
| Only 2 navbar variants | Any prompt gets one of two navbars — low variety |
| No auth form components (login/signup) | Auth pages use generic form pattern |
| No blog/article section component | Blog projects use ad-hoc pattern |
| No e-commerce product grid component | E-commerce lacks structural reference |
| Light-mode hero only in hero-story-v1 | 9 of 10 heroes are dark — limits light theme variety |
