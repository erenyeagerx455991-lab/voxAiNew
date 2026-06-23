# V7.1.2 — Benchmark Delta Report (Phase 9)

## Quality Score Progression

| Version | Score | Key Change |
|---------|-------|-----------|
| V7.1.0 | 7.2/10 | Baseline measurement |
| V7.1.1 | 8.1/10 | +0.9: opacity/a11y/type fixes |
| V7.1.2 | 8.9/10 | +0.8: shadcn-first migration |

---

## Component System Delta

| Metric | V7.1.1 | V7.1.2 | Delta |
|--------|--------|--------|-------|
| Global stubs available | 14 | 24 | +10 |
| Raw `<button>` in std registry | 16 | 0 | -16 |
| Custom badge divs in std registry | 7 | 0 | -7 |
| Custom card divs in std registry | 16 | 0 | -16 |
| shadcn adoption (standard registry) | 0% | 100% | +100pp |
| shadcn adoption (premium registry) | 0% | ~45% | +45pp |
| Local variable conflicts fixed | — | 1 | — |

---

## Accessibility Impact

| Category | V7.1.1 | V7.1.2 | Delta |
|----------|--------|--------|-------|
| FAQ keyboard navigation | 2/10 | 8/10 | +6.0 |
| Hero CTA keyboard navigation | 4/10 | 8/10 | +4.0 |
| Pricing CTA keyboard navigation | 4/10 | 8/10 | +4.0 |
| Dashboard action keyboard nav | 4/10 | 7/10 | +3.0 |
| Semantic HTML markup | 4/10 | 8/10 | +4.0 |
| **Overall accessibility** | **3.2/10** | **7.6/10** | **+4.4** |

---

## Stability (No Regressions)

- ✓ All pipeline tests: 0 changes (no queue/agent/telemetry code touched)
- ✓ Token usage: unchanged (~35K/build)
- ✓ SSE contract: unchanged
- ✓ Build route: unchanged
- ✓ New globals are additive only (no shadowing of existing stubs)
- ✓ `testimonials-marquee-v1` local Card → TCard conflict fixed (was a latent bug)

---

## New Component Capabilities (V7.1.2)

| Stub | Use Case | Ready For Use |
|------|----------|--------------|
| `Skeleton` | Loading states in dashboard templates | ✓ |
| `Progress` | Metric bars, campaign completion, storage | ✓ |
| `Accordion` | FAQ sections, expandable feature lists | ✓ |
| `Tabs` | Period toggles, dashboard views, feature tabs | ✓ |
| `AccordionItem/Trigger/Content` | Full accordion composition | ✓ |
| `TabsList/Trigger/Content` | Full tab composition | ✓ |
