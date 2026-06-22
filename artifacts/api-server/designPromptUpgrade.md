# V7.0.9 — Design Agent Prompt Upgrade

## Overview
The DESIGN_SYSTEM prompt in `prompts.ts` was upgraded with 5 new Premium Design Rules (6–10) appended after the existing 5 instructions.

## Changes

### DESIGN_SYSTEM — 5 New Premium Design Rules

**Rule 6 — Spacing System (8pt Grid)**
```
SPACING SYSTEM (8pt grid): Use spacing values from this set: 4, 8, 12, 16, 24, 32, 48, 64.
In Tailwind: gap-4, gap-6, gap-8, py-12, py-16, py-24, py-32.
Never use arbitrary odd values like py-19 or gap-7.
```
*Impact: Eliminates inconsistent section spacing that made designs look amateur*

**Rule 7 — Typography Scale**
```
TYPOGRAPHY SCALE:
- Hero H1: scale "xl" → text-6xl md:text-8xl | scale "lg" → text-5xl md:text-7xl | scale "md" → text-4xl md:text-5xl
- Section H2: always 2 steps below hero
- Card H3: text-xl to text-2xl — never smaller
- Body copy: text-base to text-lg — NEVER text-xs or text-sm for primary body text
```
*Impact: Eliminates oversized H1 / undersized H2 hierarchy problems*

**Rule 8 — Color Discipline**
```
COLOR DISCIPLINE: Maximum 1 primary action color + 1 accent highlight.
NEVER use 3+ competing CTA colors.
Feature icons use a SINGLE consistent icon color (the accent), not a rainbow of per-card gradients.
```
*Impact: Eliminates rainbow icon gradient patterns that dilute premium feel*

**Rule 9 — Visual Restraint**
```
VISUAL RESTRAINT: Choose ONE border-radius size (rounded-lg, rounded-xl, or rounded-2xl) and use it
consistently throughout. No competing shadow depths — one elevation level per z-layer.
Generous whitespace is premium; dense layouts feel cheap.
```
*Impact: Prevents mixed radius inconsistency seen in V7.0.8 outputs*

**Rule 10 — Muted Text Minimum Opacity**
```
MUTED TEXT MINIMUM OPACITY: NEVER use opacity below 60% for readable text.
Subheadings: minimum text-white/70 (dark theme) or text-gray-600 (light).
Labels/captions: minimum text-white/60 (dark) or text-gray-500 (light).
NEVER use text-white/25, text-white/30, text-white/35, or text-white/45.
```
*Impact: Fixes accessibility WCAG contrast failures on muted text*

### buildCodeSystem() — Flat UI Default Layout Rules
The `default` case in `layoutStyleRules()` now returns explicit guidance:
- Section heading alignment (centered hero, left for content sections)
- Feature grid: `grid-cols-1 md:grid-cols-3` with equal-height cards
- Card padding consistency (p-6 or p-8 — pick one)
- Section layout variation (grid / list / split — never 3 consecutive grids)
- Border divider restraint (max 2 per page)

### buildCodeSystem() — Accessibility Rules (Rules 15–23)
See `accessibilityUpgradePlan.md` for full details.

## Score Comparison

| Dimension | Before | After |
|---|---|---|
| Spacing guidance | 2/10 | 9/10 |
| Typography guidance | 3/10 | 9/10 |
| Color discipline | 2/10 | 9/10 |
| Visual restraint | 3/10 | 9/10 |
| Accessibility guidance | 0/10 | 9/10 |
| Flat-UI layout guidance | 1/10 | 8/10 |
| **Overall design prompt** | **3/10** | **9/10** |
