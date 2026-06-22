# V7.1.0 — Prompt Quality Validation Report

## Methodology
Direct inspection of all 5 pipeline prompt systems: plannerStep.ts, architectureStep.ts, DESIGN_SYSTEM, buildCodeSystem() frontend prompt, and CODEFIX_SYSTEM. Evidence: actual prompt text, not runtime behavior.

## 1. plannerStep.ts

**Current function:** Determines website type, section order, page count.
**Specificity:** Medium — defines what sections go on which pages.
**Design constraints:** None — planner is structural only.
**Accessibility guidance:** None — by design.
**Redundancy found:** None.
**Missing:** No guidance on section count ceiling (can produce 12+ sections = cluttered output).
**Conflicting instructions:** None.
**Score: 7/10**

### Recommendation
Add a max section count: "For a single landing page, include 5–8 sections maximum. More than 8 sections creates cluttered, unfocused output."

## 2. architectureStep.ts (registry selection)

**Current function:** Selects component IDs from registry, assembles blueprint.
**Specificity:** High — uses RAG to select relevant components.
**Design constraints:** None — architecture is structural.
**Accessibility guidance:** None — by design.
**Redundancy:** None.
**Missing:** No instruction to prefer diversity templates over base templates when available (leads to repetitive hero-saas-v1 overuse).
**Conflicting instructions:** None.
**Score: 7.5/10**

### Recommendation
Add: "When multiple hero variants exist for the detected industry/DNA, prefer the most specific variant over generic fallbacks."

## 3. DESIGN_SYSTEM (V7.0.9 — 10 rules)

**Current rules:** DNA library (Stripe/Linear/Vercel/Framer/Notion/Cursor/Raycast), reference routing, industry defaults, Rules 6–10 (spacing, typography, color, restraint, opacity).

**Specificity:** High — DNA library gives precise token values per reference.
**Design constraints:** Strong — Rules 6–10 added in V7.0.9.
**Accessibility guidance:** Rule 10 (muted text opacity).
**Redundancy found:**
- Rule 4 ("NEVER default to purple gradients") partially overlaps with DNA-specific rules that already define the palette. Minor.
**Missing:**
- No instruction on section background alternation (all sections end up same dark bg)
- No guidance on image/media placeholder quality
- No mobile-first breakpoint reminder ("design for mobile first, then expand")
**Conflicting instructions:** None.
**Score: 9/10**

## 4. buildCodeSystem() Frontend Prompt (V7.0.9 — 23 rules)

**Current rules:** DNA tokens (10), variation seed rules (3), feature/stat count, structure variation rules (5), safe coding rules (14), flat-ui layout rules (V7.0.9), Accessibility Rules 15–23 (V7.0.9).

**Specificity:** High — specific Tailwind classes with examples.
**Design constraints:** Strong — Rules 15–23 cover accessibility comprehensively.
**Accessibility guidance:** Comprehensive — 9 mandatory rules.
**Redundancy found:**
- Rule 17 (focus-visible on buttons) and Rule 18 (focus-visible on links) are similar; could be merged.
- Rule 22 (muted text opacity) repeats Design Rule 10 — acceptable redundancy for emphasis.
**Missing:**
- No explicit instruction to alternate section background colors (all sections render same dark bg, creating flat visual rhythm)
- No guidance on component max width within sections
- Rule 19 (aria-expanded) would benefit from a code example for the specific pattern
**Conflicting instructions:**
- The flat-ui default layout rule says "left-aligned on desktop for content sections" but DNA tokens often include `textAlign: "center"` — minor conflict that model must resolve.
**Score: 8.5/10**

## 5. CODEFIX_SYSTEM (V7.0.9 — 4 sections)

**Current rules:** Critical fixes (7), preserve dynamic structure (8 rules), NEVER rules (6), output (1).

**Specificity:** Very high — explicit NEVER prohibitions.
**Design constraints:** Preservation-focused (correct for codefix role).
**Accessibility guidance:** Strong — NEVER strip aria attributes explicitly listed.
**Redundancy found:**
- Section 2 item "KEEP all aria-label..." and Section 3 "NEVER remove aria-label..." are identical in intent — intentional redundancy for emphasis.
- Section 2 item "KEEP all hover:..." overlaps with Section 3 "NEVER remove hover:..." — same.
**Missing:**
- No instruction on what to do when JSX fragments ARE the cause of a crash (currently: always wrap in div — correct)
- No instruction to preserve `style={{fontSize:'clamp(...)'}}` (added in V7.0.9 to exception list)
**Conflicting instructions:** None found.
**Score: 9.5/10**

## Summary Scorecard

| Prompt | Score | Primary Issue |
|---|---|---|
| CODEFIX_SYSTEM | 9.5/10 | Intentional redundancy (by design) |
| DESIGN_SYSTEM | 9.0/10 | Missing section bg alternation guidance |
| buildCodeSystem() | 8.5/10 | bg alternation, minor focus-visible redundancy |
| architectureStep | 7.5/10 | No diversity template preference |
| plannerStep | 7.0/10 | No section count ceiling |
| **Overall** | **8.3/10** | |

## Top 3 Missing Constraints (Not Present in Any Prompt)

1. **Section background alternation**: "Alternate section backgrounds between pure dark, dark with subtle tint, and dark with card grid — never 6 consecutive identical dark sections."
2. **Section count ceiling**: "Maximum 7–8 sections per page."
3. **Diversity template preference**: "When selecting hero variant, prefer industry-specific hero over generic hero-saas-v1."
