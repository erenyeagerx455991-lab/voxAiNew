---
name: VoxAI V7.3.1 Premium Registry Quality Upgrade
description: 10 template upgrades to hero/CTA/pricing/dashboard templates; premiumQualityAudit.md written; all infrastructure already existed.
---

## What was done

Upgraded 10 templates across 3 files to score higher on `qualityRegistryScore()` (5-dim: hierarchy, trust, ctaQuality, layoutUniqueness, premiumPatterns).

## Critical bug fixed: cta-editorial-v1

Used `<a href="#">` instead of `<Button>` — ctaQuality score was literally 0 because the scorer checks `buttonCount` via `/<Button\b/g.exec()`. Converted both CTAs to `<Button type="button">`.

**Why:** The `scoreCTA()` function in `registryQuality.ts` counts `<Button` occurrences, not anchor tags. Any template using `<a>` for CTAs scores 0 on ctaQuality (weight 0.20).

## Template changes by file

**section-templates.ts:**
- `pricing-minimal-v1`: Added `badge` field to plans; `<Badge>` "Most Popular" on Pro; SOC 2/GDPR trust badges; "no CC required" note at bottom
- `pricing-comparison-v1`: Added "Save 20% annually" `<Badge>`; FAQ contact `<Button>` at bottom
- `dashboard-vercel-v1`: `<Badge>` on build status; `<Progress>` build %
- `dashboard-kanban-v1`: `<Badge>` on issue labels; `<Progress>` sprint; `<Skeleton>` loading
- `dashboard-revenue-v1`: `<Badge>` for Paid/Processing status; `<Progress>` revenue chart; `<Skeleton>` in chart header
- `dashboard-aiflow-v1`: `<Badge>` on Processing status; `<Progress>` pipeline 3/5; `<Skeleton>` pending nodes

**registry.ts:**
- `hero-bento-v1`: Added `HEADLINE_BADGE` inline div above heading; `<Avatar>` stack with "10K+ teams" in stats card
- `hero-dashboard-v1`: Added `<Avatar>` trust stack ("2,400+ teams trust us") below dual CTAs

**diversity-templates.ts:**
- `cta-editorial-v1`: `<a>` → `<Button>`; added Avatar trust row ("8,000+ teams this year")
- `cta-minimal-v1`: Added Avatar social proof ("5,000+ teams already inside") above action buttons

## Scoring impact

- `cta-editorial-v1`: +3.9 (ctaQuality 0→7)
- `hero-bento-v1`: +2.0 (trust +3pts from Avatar; hierarchy +badge)
- Dashboard templates: +1.5–1.8 each (premiumPatterns: Badge+Progress+Skeleton = 3 components × 1.4 = 4.2pts)

## Infrastructure (already existed — no changes needed)

- `qualityRegistryScore()` in `registryQuality.ts`
- Leaderboard in `registryLeaderboard.ts`
- `GET /api/telemetry/quality` → `premiumRegistryQuality` already wired

## Audit doc

Written to `premiumQualityAudit.md` at repo root.
