# V7.0.9 — Accessibility Upgrade Plan

## Baseline Score
**2.4 / 10** (V7.0.8 audit)

## Root Causes of Low Score
1. No `aria-label` on buttons (icon or text-only)
2. No `aria-label` on `<nav>` elements
3. No `aria-expanded` / `aria-controls` on FAQ/accordion toggles
4. No `focus-visible:ring` classes on interactive elements
5. No `htmlFor`/`id` association on form inputs
6. Muted text below 60% opacity (`text-white/25`, `text-white/35`)
7. Decorative divs without `aria-hidden="true"`

## Changes Applied in V7.0.9

### 1. Registry Templates — Structural Changes
| Template | Change |
|---|---|
| `navbar-modern-v1` | Added `aria-label="Main navigation"` on `<nav>`, `type="button"`, `aria-label` on CTA, `focus-visible:ring` on links + button, `aria-hidden` on logo icon |
| `navbar-minimal-v1` | Added `aria-label="Main navigation"` on `<nav>`, `focus-visible:ring` on all `<a>` elements, opacity 60→65% |
| `hero-saas-v1` | Added `type="button"` on both CTAs, `aria-hidden="true"` on decorative gradient orb, `focus-visible:ring` on both buttons, muted text raised from `text-gray-400` → `text-white/65` |

### 2. codeSystem.ts — Prompt Injection (Rules 15–23)
The `buildCodeSystem()` function now emits mandatory accessibility rules in the frontend agent prompt:

- Rule 15: ALL `<button>` elements MUST have `type="button"`
- Rule 16: ALL `<nav>` elements MUST have `aria-label`
- Rule 17: ALL buttons MUST have `focus-visible:ring-2 focus-visible:ring-offset-2`
- Rule 18: ALL nav links `<a>` MUST have `focus-visible:ring` 
- Rule 19: FAQ/Accordion toggles MUST have `aria-expanded` + `aria-controls`
- Rule 20: ALL form `<input>` MUST have `<label htmlFor>` + `id` pair
- Rule 21: Decorative elements MUST have `aria-hidden="true"`
- Rule 22: Muted text NEVER below `text-white/60` opacity
- Rule 23: shadcn components (`Button`, `Input`, etc.) are globals — use them directly

### 3. CODEFIX_SYSTEM — Preservation Rules
Extended CODEFIX prompt now explicitly preserves:
- `aria-label`, `aria-expanded`, `aria-controls`, `aria-current`, `role`, `tabIndex`
- All `focus-visible:` classes (hard NEVER rule)
- All `type="button"` attributes
- All responsive and hover classes

### 4. DESIGN_SYSTEM — Muted Text Rule 10
Added rule to DESIGN_SYSTEM: muted text minimum `text-white/60` (dark) or `text-gray-500` (light). NEVER `text-white/25`, `/30`, `/35`, `/45`.

## Keyboard Navigation Checklist
- [x] All buttons keyboard-reachable via Tab
- [x] All nav links keyboard-reachable via Tab  
- [x] Focus rings visible on all interactive elements
- [x] FAQ accordions operable via keyboard (aria-expanded)
- [x] Forms operable via keyboard (label association)
- [x] No focus traps introduced

## Screen Reader Checklist
- [x] Nav landmark labelled (`aria-label="Main navigation"`)
- [x] Buttons with meaningful labels
- [x] Decorative elements hidden (`aria-hidden`)
- [x] Form inputs labelled
- [x] Expanded/collapsed state communicated (`aria-expanded`)

## Target Score
**8.0+ / 10**

## Projection
| Category | Before | After |
|---|---|---|
| Focus visibility | 1/10 | 9/10 |
| ARIA labels | 2/10 | 8/10 |
| Keyboard nav | 3/10 | 8/10 |
| Form accessibility | 1/10 | 8/10 |
| Screen reader support | 3/10 | 7/10 |
| **Overall** | **2.4/10** | **8.0+/10** |
