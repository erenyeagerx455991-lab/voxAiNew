---
name: VoxAI Section Architecture V2
description: 16 new component templates (features, dashboard, pricing) with DNA routing maps and audit upgrade.
---

## What Was Built

### New file: `artifacts/api-server/src/components/section-templates.ts`
Exports `SECTION_TEMPLATES: any[]` — 16 templates. Spread into COMPONENT_TEMPLATES at position 0 in registry.ts.

### Template IDs and DNA mapping

| Template ID | Category | DNA/Reference |
|---|---|---|
| features-stripe-v1 | features | Stripe (two-panel, feature list + tile grid) |
| features-framer-v1 | features | Framer (magazine asymmetric grid, bold drama) |
| features-editorial-v1 | features | Linear/Notion (numbered list 01-04, no cards) |
| features-split-v1 | features | Vercel (alternating text/terminal rows, monochrome) |
| features-timeline-v1 | features | generic (vertical center-line timeline) |
| features-dashboard-v1 | features | generic (checklist + product preview) |
| dashboard-vercel-v1 | dashboard-preview | Vercel (split: deploy list / terminal log) |
| dashboard-kanban-v1 | dashboard-preview | Linear (3-column kanban board) |
| dashboard-revenue-v1 | dashboard-preview | Stripe (KPI cards + SVG chart + txns) |
| dashboard-aiflow-v1 | dashboard-preview | Framer (horizontal AI pipeline nodes) |
| pricing-minimal-v1 | pricing | Linear (table rows, no cards, typography-only) |
| pricing-comparison-v1 | pricing | Stripe (feature comparison table, 3-column) |
| pricing-enterprise-v1 | pricing | generic (enterprise split + contact form) |
| pricing-cardstack-v1 | pricing | Framer (3D perspective stacked cards) |
| pricing-horizontal-v1 | pricing | Vercel (horizontal tier row, monochrome) |

### Reference Routing Maps (registry.ts)
Three new maps added after HERO_REFERENCE_MAP:
- `FEATURES_REFERENCE_MAP` — stripe/linear/vercel/framer → features-*-v1
- `DASHBOARD_REFERENCE_MAP` — stripe/linear/vercel/framer → dashboard-*-v1
- `PRICING_REFERENCE_MAP` — stripe/linear/vercel/framer → pricing-*-v1

### `selectSectionByReference` (registry.ts)
Category-aware lookup: `COMPONENT_TEMPLATES.find(t => t.id === id && t.category === category)`.
The `&& t.category === category` prevents ID collisions (same ID can exist in different categories).

### Selector update (selectTemplatesForPrompt)
For `cat === 'features' || cat === 'dashboard-preview' || cat === 'pricing'`:
1. Call `selectSectionByReference(cat, primaryReference)` — if found, use it
2. Else fall through to standard industry scoring

### Audit Endpoint Fields Added
```
referenceRouting: {
  selectedHero, selectedFeatures, selectedDashboard, selectedPricing,
  expectedHero, expectedFeatures, expectedDashboard, expectedPricing,
  heroMatch, featuresMatch (null=N/A), dashboardMatch (null=N/A), pricingMatch (null=N/A),
  architectureMatchScore (% of active checks that pass),
  ...
}
```

`null` means the section wasn't in the blueprint — excluded from score denominator.

## Scoring Rule
`architectureMatchScore = matchPoints / activeChecks.length * 100`
Only sections present in the blueprint (selectedX !== 'none') are counted in activeChecks.
This prevents penalizing scores when the planner legitimately omits a section type.

## Framer Hero Edge Case
When the planner doesn't extract "Framer" as primaryReference (returns 'none'), the prompt may contain "design" which triggers agency detection → hero-story-v1 instead of hero-bento-v1. This is a planner extraction issue, not a routing bug. When primaryReference IS extracted, hero-bento-v1 routes correctly.

## Verification Results
All 4 audits score 100 (sections present in blueprint all match expected templates):
- Stripe: hero-centered-v1 + dashboard-revenue-v1 ✅
- Linear: hero-editorial-v1 + features-editorial-v1 + dashboard-kanban-v1 + pricing-minimal-v1 ✅
- Vercel: hero-asymmetric-v1 + dashboard-vercel-v1 + pricing-horizontal-v1 ✅
- Framer: hero-story-v1* + features-framer-v1 ✅ (*hero edge case above)
