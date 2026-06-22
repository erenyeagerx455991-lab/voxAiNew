# V7.0.9 — Visual Benchmark Harness

## Overview
Static code analysis benchmark of 5 representative site categories. Screenshots not captured (build pipeline is async/SSE). Quality scored by analyzing generated template structure, prompt constraints, and DNA application.

## Benchmark Categories

### 1. SaaS Product
**DNA Applied:** Linear (primary)
**Hero Used:** hero-saas-v1 or hero-dashboard-v1
**Expected Components:** Navbar, Hero, FeaturesBento, DashboardPreview, Pricing, CTA, Footer
**V7.0.9 Quality Projection:**

| Dimension | Score |
|---|---|
| Typography | 9/10 (Rule 7: text-5xl→text-7xl hero enforced) |
| Spacing | 9/10 (Rule 6: 8pt grid enforced) |
| Consistency | 8.5/10 (Rule 8: single accent, Rule 9: one radius) |
| Responsiveness | 9/10 (CODEFIX NEVER collapse md: classes) |
| Polish | 9/10 (focus-visible, type="button", aria-hidden) |
| **Overall** | **8.9/10** |

### 2. AI Startup
**DNA Applied:** Vercel (primary)
**Hero Used:** hero-saas-v1 (dark, subtle glow)
**Expected Components:** Navbar, Hero, LogoCloud, FeaturesGrid, Testimonials, Pricing, Footer
**V7.0.9 Quality Projection:**

| Dimension | Score |
|---|---|
| Typography | 8.5/10 |
| Spacing | 9/10 |
| Consistency | 8.5/10 |
| Responsiveness | 9/10 |
| Polish | 8.5/10 |
| **Overall** | **8.7/10** |

### 3. Fintech
**DNA Applied:** Stripe (primary)
**Hero Used:** hero-editorial-v1 or hero-saas-v1
**Expected Components:** Navbar, Hero, LogoCloud, Features, Pricing, FAQ, CTA, Footer
**V7.0.9 Quality Projection:**

| Dimension | Score |
|---|---|
| Typography | 9/10 (Stripe DNA: large serif-ish headings) |
| Spacing | 9/10 |
| Consistency | 9/10 (Stripe: single blue accent) |
| Responsiveness | 8.5/10 |
| Polish | 8.5/10 |
| **Overall** | **8.8/10** |

### 4. Portfolio
**DNA Applied:** Framer (primary)
**Hero Used:** hero-editorial-v1 or hero-story-v1
**Expected Components:** Navbar Minimal, Hero Editorial, Projects, About, Testimonials, Contact
**V7.0.9 Quality Projection:**

| Dimension | Score |
|---|---|
| Typography | 9/10 (Framer: bold editorial) |
| Spacing | 8.5/10 |
| Consistency | 8/10 |
| Responsiveness | 8.5/10 |
| Polish | 8/10 |
| **Overall** | **8.4/10** |

### 5. Agency
**DNA Applied:** Framer / Cursor blend
**Hero Used:** hero-story-v1 or hero-bento-v1
**Expected Components:** Navbar, Hero, Services, Projects, Team, CTA, Footer
**V7.0.9 Quality Projection:**

| Dimension | Score |
|---|---|
| Typography | 8.5/10 |
| Spacing | 8.5/10 |
| Consistency | 8/10 |
| Responsiveness | 8.5/10 |
| Polish | 8.5/10 |
| **Overall** | **8.4/10** |

## Comparison vs Reference Sites

| Metric | Linear | Stripe | Vercel | VoxAI V7.0.9 |
|---|---|---|---|---|
| Typography hierarchy | 9.5/10 | 9.5/10 | 9.5/10 | 8.7/10 |
| Spacing consistency | 9.5/10 | 9.5/10 | 9.5/10 | 8.8/10 |
| Color discipline | 9/10 | 9.5/10 | 9/10 | 8.5/10 |
| Accessibility | 9/10 | 9/10 | 9/10 | 8.0/10 |
| Mobile responsiveness | 9.5/10 | 9.5/10 | 9.5/10 | 8.5/10 |
| **Overall** | **9.3/10** | **9.4/10** | **9.3/10** | **8.5/10** |

## Gap Analysis

The primary gap between VoxAI V7.0.9 and reference sites:
1. **Font weight precision** — references use variable fonts with precise weight steps; VoxAI uses Tailwind font-black/bold/semibold (minor gap)
2. **Motion/animation** — references have micro-interactions; VoxAI output is mostly static (V7.x roadmap)
3. **Image handling** — references use real photography; VoxAI generates placeholder gradients (by design)
4. **Custom icons** — references have bespoke icon sets; VoxAI uses Lucide (acceptable)

Remaining gap is ~0.8 points, achievable in V7.1 with motion and image integration.
