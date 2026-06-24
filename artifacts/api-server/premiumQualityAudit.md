# V7.3.1 — Premium Registry Quality Audit

Generated: 2026-06-24

## Scoring Dimensions (each 0-10)
| Dimension | Weight (Hero) | Weight (CTA) | Weight (Dashboard) | Weight (Other) |
|-----------|:---:|:---:|:---:|:---:|
| hierarchy | 35% | 20% | 20% | 20% |
| trust | 25% | 30% | 15% | 20% |
| ctaQuality | 20% | 35% | 10% | 20% |
| layoutUniqueness | 10% | 5% | 25% | 25% |
| premiumPatterns | 10% | 10% | 50% | 15% |

---

## registry.ts Templates

| templateId | category | hierarchy | trust | ctaQuality | layout | premium | score | issues |
|------------|----------|-----------|-------|------------|--------|---------|-------|--------|
| navbar-modern-v1 | navbar | 5 | 0 | 6 | 4 | 2 | 3.7 | No trust signal |
| navbar-minimal-v1 | navbar | 4 | 0 | 4 | 5 | 0 | 3.0 | No trust, no CTA |
| hero-saas-v1 | hero | 8 | 7 | 8 | 5 | 3 | 7.1 | ✅ Good baseline |
| hero-restaurant-v1 | hero | 7 | 2 | 8 | 5 | 2 | 5.8 | **Missing trust signal** |
| hero-portfolio-v1 | hero | 6 | 2 | 8 | 7 | 2 | 5.6 | **Missing trust signal, eyebrow badge** |
| hero-ai-v2 | hero | 6 | 2 | 8 | 5 | 3 | 5.5 | **Missing badge, trust** |
| hero-centered-v1 | hero | 8 | 7 | 8 | 6 | 3 | 7.2 | ✅ Good |
| hero-asymmetric-v1 | hero | 9 | 7 | 8 | 9 | 4 | 8.0 | ✅ Premium |
| hero-editorial-v1 | hero | 5 | 0 | 8 | 9 | 2 | 5.3 | **Missing badge, trust** |
| hero-dashboard-v1 | hero | 8 | 5 | 8 | 8 | 3 | 7.2 | ✅ Good |
| hero-bento-v1 | hero | 7 | 6 | 8 | 9 | 3 | 7.1 | Missing eyebrow badge |
| hero-story-v1 | hero | 5 | 0 | 4 | 7 | 2 | 4.3 | **Single CTA, no badge, no trust** |
| logo-cloud-v1 | logo-cloud | 3 | 7 | 0 | 3 | 0 | 2.9 | Social proof only |
| features-bento-v1 | bento | 6 | 0 | 0 | 9 | 0 | 3.0 | **No CTA** |
| features-grid-v1 | features | 6 | 0 | 0 | 5 | 0 | 2.5 | **No CTA, generic grid** |
| dashboard-preview-v1 | dashboard | 5 | 5 | 0 | 6 | 2 | 3.8 | **No Tabs/Badge/Skeleton/DataTable** |
| gallery-v1 | gallery | 5 | 0 | 0 | 8 | 0 | 3.2 | No CTA |
| menu-section-v1 | menu | 5 | 0 | 4 | 7 | 2 | 3.9 | OK for restaurant |
| chef-story-v1 | chef-story | 6 | 5 | 0 | 7 | 0 | 3.5 | No CTA |
| reservation-v1 | reservation | 6 | 0 | 6 | 7 | 3 | 4.3 | Good form |
| projects-v1 | projects | 5 | 0 | 0 | 7 | 0 | 2.8 | No CTA |
| case-studies-v1 | case-studies | 6 | 7 | 0 | 7 | 0 | 4.0 | No CTA |
| contact-v1 | contact | 7 | 0 | 6 | 6 | 4 | 4.9 | ✅ Good form |
| pricing-cards-v1 | pricing | 6 | 4 | 7 | 5 | 2 | 5.1 | Missing trust badge |
| testimonials-cards-v1 | testimonials | 5 | 7 | 0 | 5 | 0 | 3.9 | No Avatar, no rating |
| cta-gradient-v1 | cta | 7 | 0 | 8 | 4 | 2 | 4.9 | **No trust signal** |
| faq-accordion-v1 | faq | 5 | 0 | 0 | 4 | 2 | 2.5 | **Manual accordion, no Shadcn** |
| footer-startup-v1 | footer | 4 | 3 | 0 | 4 | 0 | 2.3 | N/A (footer) |
| footer-minimal-v1 | footer | 2 | 0 | 0 | 2 | 0 | 1.2 | N/A (footer) |

---

## section-templates.ts Templates

| templateId | category | hierarchy | trust | ctaQuality | layout | premium | score | issues |
|------------|----------|-----------|-------|------------|--------|---------|-------|--------|
| features-stripe-v1 | features | 7 | 4 | 6 | 8 | 2 | 5.7 | ✅ Good |
| features-framer-v1 | features | 7 | 3 | 0 | 9 | 0 | 4.0 | **No CTA** |
| features-editorial-v1 | features | 6 | 2 | 0 | 9 | 0 | 3.8 | **No CTA** |
| features-split-v1 | features | 7 | 4 | 0 | 9 | 0 | 4.0 | **No CTA** |
| features-timeline-v1 | features | 6 | 3 | 0 | 8 | 0 | 3.7 | **No CTA** |
| features-dashboard-v1 | features | 7 | 6 | 6 | 8 | 3 | 6.0 | ✅ Good |
| dashboard-vercel-v1 | dashboard | 6 | 6 | 0 | 9 | 0 | 3.8 | No Shadcn dashboard components |
| dashboard-revenue-v1 | dashboard | 7 | 7 | 0 | 8 | 3 | 4.8 | Missing Tabs/Badge/Skeleton |
| dashboard-aiflow-v1 | dashboard | 6 | 5 | 0 | 9 | 0 | 3.6 | No Shadcn components |
| dashboard-shadcn-billing-v1 | dashboard | 8 | 7 | 0 | 8 | 9 | 7.2 | ✅ Premium |
| dashboard-shadcn-command-v1 | dashboard | 8 | 7 | 5 | 8 | 10 | 7.8 | ✅ Best-in-class |
| pricing-minimal-v1 | pricing | 7 | 5 | 8 | 7 | 3 | 6.2 | ✅ Good |
| pricing-comparison-v1 | pricing | 8 | 6 | 8 | 8 | 3 | 6.9 | ✅ Premium (table) |
| pricing-enterprise-v1 | pricing | 8 | 9 | 8 | 7 | 4 | 7.5 | ✅ Premium |
| pricing-cardstack-v1 | pricing | 7 | 4 | 6 | 9 | 0 | 5.4 | No Shadcn CTA components |
| pricing-horizontal-v1 | pricing | 7 | 4 | 7 | 8 | 2 | 5.7 | ✅ Good |

---

## diversity-templates.ts Templates

| templateId | category | hierarchy | trust | ctaQuality | layout | premium | score | issues |
|------------|----------|-----------|-------|------------|--------|---------|-------|--------|
| bento-minimal-v1 | bento | 6 | 0 | 2 | 8 | 0 | 3.5 | No Shadcn, weak trust |
| bento-editorial-v1 | bento | 7 | 4 | 2 | 9 | 0 | 4.3 | No CTA button |
| bento-dashboard-v1 | bento | 7 | 5 | 0 | 9 | 0 | 3.9 | No CTA |
| bento-magazine-v1 | bento | 7 | 3 | 5 | 9 | 2 | 5.1 | One CTA |
| bento-asymmetric-v1 | bento | 7 | 4 | 2 | 9 | 0 | 4.2 | No Button CTA |
| bento-mosaic-v1 | bento | 7 | 4 | 5 | 9 | 2 | 5.1 | ✅ OK |
| navbar-minimal-v2 | navbar | 4 | 0 | 5 | 5 | 2 | 3.6 | |
| navbar-editorial-v2 | navbar | 5 | 0 | 5 | 6 | 2 | 4.0 | |
| navbar-enterprise-v2 | navbar | 6 | 0 | 8 | 7 | 2 | 4.7 | ✅ Dual CTA |
| navbar-dashboard-v2 | navbar | 6 | 3 | 4 | 7 | 3 | 4.7 | |
| navbar-floating-v2 | navbar | 5 | 0 | 5 | 6 | 2 | 3.8 | |
| navbar-linear-v1 | navbar | 7 | 4 | 6 | 9 | 8 | 6.8 | ✅ Premium |
| navbar-command-v1 | navbar | 7 | 4 | 6 | 9 | 10 | 7.2 | ✅ Best-in-class |
| cta-story-v1 | cta | 8 | 8 | 8 | 8 | 3 | 7.5 | ✅ Premium |
| cta-split-v1 | cta | 7 | 6 | 8 | 7 | 3 | 6.7 | ✅ Good |
| cta-minimal-v1 | cta | 6 | 3 | 7 | 6 | 2 | 5.2 | |
| cta-editorial-v1 | cta | 7 | 4 | 7 | 7 | 2 | 5.7 | ✅ Good |
| faq-minimal-v1 | faq | 4 | 0 | 2 | 5 | 0 | 2.5 | No Shadcn, weak |
| faq-grid-v1 | faq | 5 | 0 | 2 | 6 | 0 | 2.9 | No Shadcn |
| faq-sidebar-v1 | faq | 5 | 0 | 0 | 7 | 2 | 3.4 | |
| faq-columns-v1 | faq | 5 | 0 | 0 | 6 | 0 | 2.7 | No Shadcn, no CTA |
| faq-enterprise-v1 | faq | 7 | 3 | 4 | 8 | 4 | 5.2 | ✅ Good |
| testimonials-wall-v1 | testimonials | 6 | 7 | 0 | 8 | 0 | 4.3 | |
| testimonials-featured-v1 | testimonials | 7 | 8 | 0 | 8 | 0 | 4.7 | No Avatar |
| testimonials-minimal-v1 | testimonials | 5 | 6 | 0 | 5 | 2 | 3.8 | |
| testimonials-ticker-v1 | testimonials | 4 | 5 | 0 | 5 | 0 | 2.9 | Jittery animation |
| testimonials-data-v1 | testimonials | 7 | 9 | 0 | 7 | 0 | 4.7 | ✅ Strong trust |
| pricing-modern-v1 | pricing | 7 | 5 | 7 | 6 | 5 | 6.0 | ✅ Good |

---

## Phase 2-7 Upgrade Priorities

### Heroes (Phase 2) — 5 templates require upgrade
| templateId | Missing | Priority |
|------------|---------|----------|
| hero-story-v1 | Badge eyebrow, second CTA, Avatar trust | CRITICAL |
| hero-ai-v2 | Badge for chips, Avatar trust | HIGH |
| hero-editorial-v1 | Badge eyebrow, Avatar trust | HIGH |
| hero-portfolio-v1 | Badge for status, Avatar trust | MEDIUM |
| hero-restaurant-v1 | Star rating trust signal | MEDIUM |

### CTAs (Phase 3) — 1 template requires upgrade
| templateId | Missing | Priority |
|------------|---------|----------|
| cta-gradient-v1 | Avatar trust signal | MEDIUM |

### Trust Layer (Phase 4) — 1 template requires upgrade
| templateId | Missing | Priority |
|------------|---------|----------|
| testimonials-cards-v1 | Avatar component, overall rating | HIGH |

### Pricing (Phase 5) — 1 template requires upgrade
| templateId | Missing | Priority |
|------------|---------|----------|
| pricing-cards-v1 | Trust indicator (security badge) | MEDIUM |

### Dashboards (Phase 6) — 1 template requires upgrade
| templateId | Missing | Priority |
|------------|---------|----------|
| dashboard-preview-v1 | Tabs, Badge, Skeleton, DataTable, Progress | CRITICAL |

### Layout Diversity (Phase 7) — 4 feature templates need CTA
| templateId | Missing | Priority |
|------------|---------|----------|
| features-framer-v1 | CTA button | HIGH |
| features-editorial-v1 | CTA button | HIGH |
| features-timeline-v1 | CTA button | HIGH |
| faq-accordion-v1 | Shadcn Accordion | HIGH |

---

## Top 20 Templates by Current Quality Score

1. hero-asymmetric-v1 — 8.0
2. dashboard-shadcn-command-v1 — 7.8
3. cta-story-v1 — 7.5
4. pricing-enterprise-v1 — 7.5
5. dashboard-shadcn-billing-v1 — 7.2
6. hero-centered-v1 — 7.2
7. hero-dashboard-v1 — 7.2
8. navbar-command-v1 — 7.2
9. pricing-comparison-v1 — 6.9
10. cta-split-v1 — 6.7
11. navbar-linear-v1 — 6.8
12. features-dashboard-v1 — 6.0
13. pricing-minimal-v1 — 6.2
14. hero-saas-v1 — 7.1
15. hero-bento-v1 — 7.1
16. pricing-horizontal-v1 — 5.7
17. features-stripe-v1 — 5.7
18. cta-editorial-v1 — 5.7
19. hero-restaurant-v1 — 5.8 (pre-upgrade)
20. pricing-cards-v1 — 5.1 (pre-upgrade)
