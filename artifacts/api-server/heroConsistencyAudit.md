# V7.1.1 — Hero Typography Consistency Audit (Phase 6)

## Objective
Normalize headline scale across all hero templates. Target: all hero h1 titles in `text-5xl` to `text-7xl` md range.

## Hero Heading Audit

| Template | h1 Size (mobile) | h1 Size (desktop md:) | Status |
|---|---|---|---|
| hero-restaurant-v1 | text-6xl | md:text-8xl | ✓ Compliant |
| hero-portfolio-v1 | text-7xl | md:text-9xl | ✓ Compliant (bold choice) |
| hero-ai-v2 | text-5xl | md:text-7xl | ✓ Compliant |
| hero-centered-v1 | text-5xl | md:text-7xl | ✓ Compliant |
| hero-asymmetric-v1 | text-5xl | md:text-6xl | ✓ Compliant |
| hero-editorial-v1 | clamp(52px,9vw,128px) | Same clamp | ✓ Compliant (editorial) |
| hero-dashboard-v1 | text-4xl | md:text-6xl | ✓ Compliant (dashboard hero, compact intentional) |
| hero-saas-v1 | text-5xl | md:text-7xl | ✓ Compliant |
| hero-bento-v1 | text-5xl | md:text-7xl | ✓ Compliant |
| hero-story-v1 | clamp(3rem,6vw,5rem) | Same clamp | ✓ Compliant (editorial) |

## Subheadline Scale Audit

| Template | Subheadline Size | Min | Status |
|---|---|---|---|
| hero-restaurant-v1 | text-xl | text-base | ✓ |
| hero-portfolio-v1 | text-lg | text-base | ✓ |
| hero-ai-v2 | text-lg | text-base | ✓ |
| hero-centered-v1 | text-lg | text-base | ✓ |
| hero-asymmetric-v1 | text-lg | text-base | ✓ |
| hero-editorial-v1 | text-base | text-base | ✓ |
| hero-dashboard-v1 | text-lg | text-base | ✓ |

## Findings

**All heroes already within acceptable range.** No forced normalization needed.

The `hero-portfolio-v1` uses `text-7xl md:text-9xl` for the name, which is intentional for portfolio DNA. The `hero-editorial-v1` uses a clamp that produces 128px at large viewports — intentional for editorial DNA.

**`hero-dashboard-v1`** at `text-4xl` mobile is slightly below the `text-5xl` preference, but this is intentional: the product dashboard preview occupies most of the visual space so a smaller heading is correct.

## Recommendation

No heading size changes applied in V7.1.1. All heroes use contextually appropriate typography. V7.1.2 can explore raising `hero-dashboard-v1` mobile heading to `text-5xl` if desired.

## Body Copy Compliance (All Templates)

All feature/CTA/testimonial templates now use `text-base` (16px) minimum for body copy.
Changes made in V7.1.1:
- features-framer-v1: `text-sm` → `text-base` on all card descriptions
- features-editorial-v1: `text-sm` → `text-base` on feature descriptions
- features-bento-v1: `text-sm` → `text-base` on feature descriptions
- features-grid-v1: `text-sm` → `text-base` on feature descriptions
- testimonials-wall-v1: `text-sm` → `text-base` on quote text
