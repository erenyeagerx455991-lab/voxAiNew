# V7.1.3 Prompt Intelligence Baseline — Phase 1 Audit

**Date:** June 23, 2026
**Scope:** plannerStep.ts, designStep.ts (DESIGN_SYSTEM), frontendStep.ts (buildCodeSystem), codefixStep.ts (CODEFIX_SYSTEM)

---

## 1. PLANNER_SYSTEM (prompts.ts)

**System prompt length:** ~1,700 characters
**Constraint count:** 11 rules total
- Section order rules: 6
- Reference extraction rules: 5

**Design rules:** 0
**Layout rules:** 6 (sectionOrder composition rules)
**Accessibility rules:** 0
**Anti-generic rules:** 0

### Identified Weaknesses

| Gap | Severity | Evidence |
|-----|----------|----------|
| No duplicate section prevention | HIGH | Theoretically possible to emit Hero→Hero or CTA→CTA |
| No mandatory section enforcement | HIGH | SaaS site without social proof is valid under current rules |
| No per-section rationale output | MEDIUM | Section selection is opaque — no reasoning emitted |
| Weak section count language | LOW | "Minimum 5, maximum 9" exists but no hard enforcement on adjacency |
| No diversity constraint | HIGH | Two consecutive Features sections allowed |

### Current sectionOrder Rules (verbatim)
```
- Navbar is always first, Footer is always last
- Hero is almost always second
- Choose sections that make sense for the specific site type
- Restaurant: Gallery, Menu, ChefStory, Reservation
- Portfolio: Projects, CaseStudies, Contact
- SaaS/AI startup: LogoCloud, FeaturesBento or Features, DashboardPreview, Pricing, Testimonials
- Agency: Projects or CaseStudies, Testimonials, Contact
- Minimum 5 sections, maximum 9 sections
- Only use section names exactly as listed above
```

**Missing rules to add:** duplicate prevention, mandatory SaaS/AI sections, per-section rationale, adjacent-category diversity.

---

## 2. DESIGN_SYSTEM (prompts.ts)

**System prompt length:** ~3,800 characters
**Constraint count:** 10 total
- Reference DNA library: 7 reference sites
- Dominance rules: 7
- Premium design rules: 5 (rules 6–10)

**Design rules:** 5 (rules 6–10)
**Layout rules:** 0 (no layout-specific rules in design step)
**Accessibility rules:** 1 (rule 10: muted text minimum opacity)
**Anti-generic rules:** 0

### Rule 6–10 Inventory (current)
| # | Rule | Status |
|---|------|--------|
| 6 | 8pt spacing grid | ✓ Present |
| 7 | Typography scale (h1/h2/h3/body) | ✓ Present |
| 8 | Color discipline (1 primary + 1 accent) | ✓ Present |
| 9 | Visual restraint (border-radius, shadow) | ✓ Present |
| 10 | Muted text minimum opacity | ✓ Present |

### Missing Rules (per V7.1.3 spec)
| # | Rule | Gap |
|---|------|-----|
| — | Section background alternation | ❌ Missing |
| — | Visual hierarchy flow (awareness → trust → conversion) | ❌ Missing |
| — | Page focal point + CTA anchor enforcement | ❌ Missing |

### Duplicated Rules
- Color discipline (1 primary color) appears in DESIGN_SYSTEM rule 8 AND implicitly in CODEFIX_SYSTEM's "never convert" rules. Acceptable duplication.

---

## 3. buildCodeSystem / Frontend Agent (codeSystem.ts)

**System prompt length:** ~5,500 characters (built dynamically per-build)
**Numbered rules:** 23 (rules 1–23)
- Technical rules (1–14): 14
- Accessibility rules (15–23): 9

**Design rules:** 8 (layout style variants by design.layoutStyle)
**Layout rules:** 9 (per-section type + structure variation)
**Accessibility rules:** 9

### Missing Rules (per V7.1.3 spec)
| Category | Gap |
|----------|-----|
| Hero requirements | ❌ No mandated badge/dual-CTA/trust-signal |
| Anti-duplicate layouts | ❌ No rule preventing same card layout in adjacent sections |
| Anti-generic content | ❌ No rule preventing Lorem Ipsum or placeholder copy |
| Layout diversity | ❌ No adjacent-section background alternation enforcement |
| CTA intelligence | ❌ No dominant CTA rule, no visual hierarchy for CTAs |
| Desktop-first premium | ❌ Mentions "mobile-first" in planner, no desktop-first premium rule |

### Identified Weak Instructions
- "Sections alternate between: grid layout, list layout, and split-layout — never 3 consecutive grids" — exists in FLAT_UI default only, not enforced globally
- "Replace ALL placeholder text with real, specific content" — present but no hard examples of what NOT to write

---

## 4. CODEFIX_SYSTEM (prompts.ts)

**System prompt length:** ~1,500 characters
**Constraint count:** ~25 (4 major sections with nested rules)
**Design rules:** 0
**Layout rules:** 2 (preserve spacing, preserve hierarchy)
**Anti-generic rules:** 0

### Identified Weaknesses
| Gap | Severity |
|-----|----------|
| May re-introduce generic content during fix pass | MEDIUM |
| No instruction to preserve anti-generic content | MEDIUM |
| No CTA hierarchy preservation rule | LOW |

---

## Summary Scorecard (Before V7.1.3)

| Dimension | Score | Key Gap |
|-----------|-------|---------|
| Planner constraint coverage | 4/10 | No duplicate section, no mandatory sections |
| Design rule completeness | 6/10 | Missing alternation, hierarchy, focal point |
| Frontend generation rules | 7/10 | Missing anti-generic, hero requirements |
| CodeFix preservation quality | 7/10 | No anti-generic preservation |
| **Overall prompt intelligence** | **6/10** | Multiple structural gaps |

Target after V7.1.3: 8.5+/10
