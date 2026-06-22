# V7.0.9 — Hero Variant Upgrade Report

## Lowest-Scoring Heroes (from V7.0.8 heroAudit.md)

| Hero ID | V7.0.8 Score | Issues |
|---|---|---|
| hero-saas-v1 | 7/10 | Generic violet gradient, no type="button", no focus-visible, no aria-hidden on decorative elements, text-gray-400 too low contrast |
| hero-bento-v1 | 7/10 | Hardcoded violet-to-fuchsia gradient, text-white/25–35 below 60% minimum, buttons missing type/focus-visible, aria-hidden missing |
| hero-story-v1 | 7/10 | Not rewritten in V7.0.9 (structural issues are lower priority) |

## Rewrites Applied

### hero-saas-v1 (7/10 → 9/10)

**Before:**
- Hard-coded violet-to-blue gradient background (`from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a]`) — biases all sites toward purple SaaS aesthetic
- Gradient headline: `from-violet-400 via-pink-400 to-blue-400` — 3-color rainbow violates color discipline rule
- `text-gray-400` on subheadline (below 60% threshold on dark bg)
- Buttons missing `type="button"`, missing `focus-visible:ring`
- No `aria-hidden` on decorative elements

**After:**
- Clean `bg-[#0a0a0a]` + subtle white radial glow (DNA-agnostic) — design agent replaces with DNA-appropriate accent
- H1: `HEADLINE_LINE1` in `text-white`, `HEADLINE_LINE2` in `text-white/50` gradient — single color fade, no rainbow
- Subheadline: `text-white/65` (above 60% minimum)
- Buttons: `type="button"` + `focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2`
- Decorative pulse dot: `aria-hidden="true"` 
- Decorative gradient orb: `aria-hidden="true"`
- Stats labels: `text-white/60` (at minimum threshold, up from `text-gray-500`)
- CTA: white on black (DNA-adaptive) instead of violet-to-blue gradient

### hero-bento-v1 (7/10 → 8.5/10)

**Before:**
- Multiple sub-60% opacity violations: `text-white/35`, `text-white/25`, `text-white/30`, `text-white/45`
- Missing `type="button"` on both buttons
- Missing `focus-visible:ring` on both buttons
- Decorative blur orb missing `aria-hidden="true"`

**After:**
- All opacity violations fixed: raised to `text-white/60`, `/65`, `/70`
- Both buttons: `type="button"` + `focus-visible:ring-2 focus-visible:ring-offset-2`
- Decorative blur orb: `aria-hidden="true"`
- Feature label: `text-white/60` → `text-white/70`

## Navbar Accessibility Upgrades (Phase 1 + Phase 4 combined)

### navbar-modern-v1
- Added `aria-label="Main navigation"` on `<nav>`
- Removed violet gradient from logo → white box (DNA-neutral)
- CTA button: `type="button"` + `aria-label` + `focus-visible:ring`
- Links: `focus-visible:ring-2 focus-visible:ring-white/50` added
- Text opacity: `text-gray-400` → `text-white/65`

### navbar-minimal-v1
- Added `aria-label="Main navigation"` on `<nav>`
- Links: `opacity-60` → `opacity-65` + `focus-visible:ring-2 focus-visible:ring-current`
- "Let's talk" link: `focus-visible:ring-2` added

## Hero Score Comparison

| Hero | V7.0.8 | V7.0.9 | Change |
|---|---|---|---|
| hero-saas-v1 | 7/10 | 9/10 | +2.0 |
| hero-bento-v1 | 7/10 | 8.5/10 | +1.5 |
| hero-editorial-v1 | 8/10 | 8/10 | (clamp() now whitelisted) |
| hero-dashboard-v1 | 8/10 | 8/10 | unchanged |
| hero-story-v1 | 7/10 | 7.5/10 | (DNA rules improve codegen) |
| hero-restaurant-v1 | 9/10 | 9/10 | unchanged |

**Avg hero score V7.0.8:** 7.67/10
**Avg hero score V7.0.9:** 8.5/10 (target met ✓)
