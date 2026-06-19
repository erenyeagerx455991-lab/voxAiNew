# Registry Inventory — V6.6 Pre-RAG Audit

## Source Files

| File | Lines | Purpose |
|---|---|---|
| `src/components/registry.ts` | 1,598 | Master registry — imports section + diversity templates, defines navbar/hero/features/pricing/testimonials/cta/footer/gallery/faq/contact/logo-cloud |
| `src/components/section-templates.ts` | 1,043 | Architecture V2 section templates (features, dashboard-preview, pricing variants) |
| `src/components/diversity-templates.ts` | 1,110 | Diversity templates (bento, navbar, cta, faq variants) |
| **Total** | **3,751** | |

---

## Component Counts

| Source | Count | Categories |
|---|---|---|
| `diversity-templates.ts` | 23 | bento (×6), navbar (×6), cta (×6), faq (×5) |
| `section-templates.ts` | 16 | features (×6), dashboard-preview (×5), pricing (×5) |
| `registry.ts` (own)  | 38 | navbar (×2), hero (×6), features (×2), pricing (×4), testimonials (×2), cta (×2), footer (×2), gallery (×1), faq (×1), contact (×1), logo-cloud (×2), bento (×2), dashboard-preview (×3), menu-section (×2), chef-story (×1), reservation (×1), projects (×1), case-studies (×1) |
| **Total** | **77** | 19 categories |

---

## Category Breakdown

| Category | Count | Notes |
|---|---|---|
| hero | 6 | saas, restaurant, portfolio, editorial, asymmetric, bento-split |
| bento | 8 | 6 diversity + 2 registry |
| navbar | 8 | 6 diversity + 2 registry |
| cta | 8 | 6 diversity + 2 registry |
| faq | 6 | 5 diversity + 1 registry |
| features | 8 | 6 section-templates + 2 registry |
| dashboard-preview | 8 | 5 section-templates + 3 registry |
| pricing | 9 | 5 section-templates + 4 registry |
| testimonials | 2 | |
| footer | 2 | |
| gallery | 1 | |
| contact | 1 | |
| logo-cloud | 2 | |
| menu-section | 2 | restaurant |
| chef-story | 1 | restaurant |
| reservation | 1 | restaurant |
| projects | 1 | portfolio |
| case-studies | 1 | agency |

---

## Named Component Aliases (NAMED_COMPONENTS)

9 aliases mapping human-readable names → template IDs:

| Alias | Template ID |
|---|---|
| HeroLinear | hero-asymmetric-v1 |
| HeroStripe | hero-saas-v1 |
| HeroFramer | hero-editorial-v1 |
| PricingStripe | pricing-horizontal-v1 |
| PricingLinear | pricing-minimal-v1 |
| NavbarMinimal | navbar-minimal-v1 |
| NavbarFloating | navbar-modern-v1 |
| DashboardAnalytics | dashboard-revenue-v1 |
| DashboardSaaS | dashboard-kanban-v1 |

---

## Prompt Injection Analysis (Pre-RAG)

### Injection Point
`src/agents/frontend/codeSystem.ts` → `buildCodeSystem()` → `componentSection`

### What was injected per build

| Component | Tokens (estimated) |
|---|---|
| `getRegistryCatalogue()` — 9-bullet named component list | ~100 tokens |
| `buildContextFromTemplates(selectedTemplates)` — full JSX `standaloneCode` for 8-10 templates | ~2,800–3,500 tokens |
| **Total per build** | **~3,000–3,600 tokens** |

### Problems
- Full `standaloneCode` injected regardless of relevance
- Every build receives the same 8-10 structural code templates
- No scoring or ranking — selection based only on `category` + `industry` match + `priority` sort
- No caching — identical prompts repeat the full injection

---

## Duplicate / Overlap Analysis

- `bento` category: defined in both `diversity-templates.ts` (6 items) and `registry.ts` (2 items) — 8 total, no true duplicates (different IDs)
- `navbar` category: defined in both `diversity-templates.ts` (6) and `registry.ts` (2) — 8 total, no duplicates
- The `SECTION_TO_CATEGORY` map has some alias redundancy (`logocloud`, `logo-cloud`, `logostrip` all → `logo-cloud`) but this is intentional for prompt flexibility

---

## Unused Entry Analysis

- `gallery`: 1 component (`gallery-masonry-v1`), only matched when prompt contains "gallery"
- `contact`: 1 component (`contact-form-v1`), only matched when prompt contains "contact/agency/restaurant"
- `chef-story`, `reservation`, `menu-section`: restaurant-only, unused for all other verticals
- `case-studies`, `projects`: portfolio/agency-only

---

## Ownership Map

| Industry | Primary Components |
|---|---|
| SaaS / AI / Startup | hero-saas-v1, features-bento-*, pricing-*, navbar-modern-v1, dashboard-* |
| Restaurant | hero-restaurant-v1, menu-section-*, chef-story-*, reservation-* |
| Portfolio | hero-portfolio-v1, projects-*, gallery-masonry-v1 |
| Agency | hero-agency-v1, case-studies-*, features-editorial-v1 |
| E-commerce | hero-saas-v1 (fallback), pricing-comparison-v1 |
| Fintech | hero-saas-v1, pricing-comparison-v1, dashboard-revenue-v1 |
| Generic | navbar-modern-v1, hero-saas-v1, features-bento-v1, pricing-minimal-v1 |
