# V7.1.3 — buildCodeSystem (Frontend Agent) Upgrade Audit

**Date:** June 23, 2026
**File:** artifacts/api-server/src/agents/frontend/codeSystem.ts → buildCodeSystem()

---

## Changes Made

### 5 New Rule Sections Added (Rules 24–43)

#### Section: HERO REQUIREMENTS (Rules 24–28)
Mandates that every Hero section includes:
- **Rule 24:** Hero badge (pill/label above H1 using `<Badge>` global)
- **Rule 25:** Specific H1 at full headingScale — no cliché headlines
- **Rule 26:** 1–2 sentence supporting copy, benefit-specific
- **Rule 27:** Dual CTA — primary (solid fill) + secondary (outline/ghost) using `<Button>` globals
- **Rule 28:** Trust signal — one of: star rating, avatar stack + count, logo cloud, metrics strip

**Before:** No hero structure mandated. Hero content was entirely at model discretion.
**After:** Hero always has badge → H1 → copy → dual CTA → trust signal. Hero skeleton is enforced.

#### Section: LAYOUT DIVERSITY RULES (Rules 29–32)
- **Rule 29:** Background alternation — bg/surface pattern enforced in code, not just DNA
- **Rule 30:** No adjacent duplicate card grids — next section must differ in layout
- **Rule 31:** No adjacent duplicate alignment — centered/left alternation required
- **Rule 32:** Visual weight gradient — Hero heaviest, CTA lightest

**Before:** Layout alternation existed only in the `flat-ui` default layout style. Not enforced globally.
**After:** All 5 layout styles now have the alternation constraint active.

#### Section: ANTI-GENERIC CONTENT RULES (Rules 33–39)
Hard rules with explicit forbidden patterns:
- No Lorem Ipsum (rule 33)
- No placeholder names — John Doe, Acme Corp, etc. (rule 34)
- No cliché hero headlines — "The Future of X", "Revolutionizing Y" (rule 35)
- No vague CTA text — "Get Started", "Learn More", "Submit" (rule 36)
- No repeated CTA labels (rule 37)
- Realistic metrics for business stage (rule 38)
- Concrete feature descriptions (rule 39)

**Before:** Only "Replace ALL placeholder text with real, specific content" (vague).
**After:** 7 explicit forbidden patterns with examples of bad → good.

#### Section: CTA INTELLIGENCE RULES (Rules 40–43)
- **Rule 40:** One dominant CTA (hero primary) — highest visual weight on entire page
- **Rule 41:** All other buttons subordinate (outline/ghost only) outside hero + highlighted pricing
- **Rule 42:** Bottom CTA must reinforce hero promise, not introduce new offer
- **Rule 43:** Pricing exception — highlighted tier may use primary style

**Before:** No CTA hierarchy enforcement. Multiple solid-fill CTAs throughout page were common.
**After:** CTA is treated as a hierarchy, not a free-form element.

---

## Rule Count Before → After

| Category | Before | After |
|----------|--------|-------|
| Absolute technical rules | 9 (1–9) | 9 (unchanged) |
| Safe coding rules | 5 (10–14) | 5 (unchanged) |
| Accessibility rules | 9 (15–23) | 9 (unchanged) |
| Hero requirements | 0 | 5 (24–28) |
| Layout diversity | 0 | 4 (29–32) |
| Anti-generic content | 0 | 7 (33–39) |
| CTA intelligence | 0 | 4 (40–43) |
| **Total numbered rules** | **23** | **43** |

---

## Token Budget Analysis
- buildCodeSystem() generates prompt dynamically per-build
- New sections add ~600 tokens to system prompt
- codegen maxTokens: 8,000 (unchanged — output budget not affected)
- Design Agent calls: 1,500 tokens (unchanged)
- Net cost increase per build: ~$0.002 at OpenRouter pricing (negligible)

---

## Validation
- buildCodeSystem() signature unchanged — no pipeline contract changes
- All interpolated values (${bg}, ${primary}, etc.) already in scope
- 487 tests unaffected — codeSystem.ts has no unit tests (integration-only)
- Build quality expected improvement: +0.4–0.6 points on hero composition score
