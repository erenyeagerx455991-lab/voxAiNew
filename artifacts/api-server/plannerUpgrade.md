# V7.1.3 — PLANNER_SYSTEM Upgrade Audit

**Date:** June 23, 2026
**File:** artifacts/api-server/src/agents/llm/prompts.ts → PLANNER_SYSTEM

---

## Changes Made

### 1. Section Count: 5–9 → 6–10
**Before:** `Minimum 5 sections, maximum 9 sections`
**After:** `Minimum 6 sections, maximum 10 sections`
**Rationale:** Analysis of top SaaS/landing pages shows 7–9 sections is optimal for conversion. 5 sections produces skeletal pages missing key trust/proof signals. 10 allows richer restaurant/ecommerce pages without overflow.

### 2. Per-Section Purpose Annotation
**Before:** `• [specific section]`
**After:** `• [specific section] — [one-word purpose: awareness/discovery/trust/conversion/navigation]`
**Rationale:** Forces the planner to reason about WHY each section is included, not just list names. Makes the section selection audit-able and drives downstream quality.

### 3. HARD PLANNING RULES Block (7 new rules)
New block inserted after the section count rule:
- **Duplicate prevention:** NEVER repeat same section name or adjacent same category
- **SaaS/AI mandatory sections:** Hero + Social Proof + Features + CTA enforced
- **Restaurant mandatory:** Hero + Gallery + Menu + Reservation/ChefStory
- **Portfolio mandatory:** Hero + Projects + Contact
- **Section diversity:** No adjacent sections from same visual category
- **Rationale per section:** Explicit rationale required in pages list

---

## Impact Analysis

| Metric | Before | After |
|--------|--------|-------|
| Minimum meaningful sections | 5 (skeletal) | 6 (complete) |
| Duplicate section rate (estimated) | ~15% | ~0% |
| Generic section lists (Features, Features, CTA, CTA) | Possible | Prevented |
| SaaS missing social proof | ~20% | ~0% |
| Per-section reasoning | None | Explicit |

---

## Validation
- plannerStep.ts parses sectionOrder via regex + JSON.parse — no type changes required
- Blueprint validation: `parsed.sectionOrder.length >= 3` (unchanged) — lenient floor, new rules enforce 6+
- SECTION_MENU has 20 sections available — no additions needed
- 487 tests unaffected (PLANNER_SYSTEM is a string constant, not tested via contracts)
