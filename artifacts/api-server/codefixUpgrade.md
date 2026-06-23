# V7.1.3 — CODEFIX_SYSTEM Upgrade Audit

**Date:** June 23, 2026
**File:** artifacts/api-server/src/agents/llm/prompts.ts → CODEFIX_SYSTEM

---

## Changes Made

### Section 5 — Anti-Generic Content Preservation (NEW)
```
5. ANTI-GENERIC CONTENT — preserve and enforce:
   - NEVER replace specific business names, product names, or industry-specific copy with generic placeholders.
   - NEVER introduce "Lorem ipsum", "Acme Corp", "Your Company", "John Doe", "Jane Smith", or any generic placeholder text.
   - NEVER simplify specific metric numbers (e.g., "47,312 active users") into rounded placeholders ("50,000+").
   - NEVER reduce a specific CTA label ("Start your free 14-day trial →") to a generic one ("Get Started").
   - PRESERVE all industry-specific terminology, proper nouns, and specific copy already in the code.
   - PRESERVE CTA hierarchy: the hero primary button must remain the most visually dominant CTA on the page.
```

**Rationale:** The Code Fix Agent receives output from the Code Gen Agent (now using Anti-Generic rules 33–39) and must not silently strip specific content during fix passes. Without this section, the agent might:
- Replace "Join 8,400+ teams already building" with "Get started today" (shorter, but loses specificity)
- Replace "47k users · 99.9% uptime · < 200ms latency" with "Trusted by thousands" (generic)
- Reduce "Start building free →" to "Get Started" (loses the arrow and free indicator)

**Impact:** The fix pass now preserves all anti-generic work done in the generation pass.

---

## Rule Count Before → After

| Category | Before | After |
|----------|--------|-------|
| Critical bug fixes | Section 1 (~8 rules) | 1 (unchanged) |
| Preserve dynamic structure | Section 2 (~8 rules) | 2 (unchanged) |
| Hard rules (NEVER) | Section 3 (~6 rules) | 3 (unchanged) |
| Return format | Section 4 (1 rule) | 4 (unchanged) |
| Anti-generic preservation | None | Section 5 (6 rules) |
| **Total sections** | **4** | **5** |

---

## Interaction with buildCodeSystem Rules
The new CODEFIX_SYSTEM section 5 creates a preservation contract for the anti-generic rules added to buildCodeSystem (rules 33–39):

| buildCodeSystem Rule | CODEFIX_SYSTEM Preservation |
|---------------------|----------------------------|
| Rule 33 (no Lorem Ipsum) | Section 5 rule 2 (never introduce Lorem Ipsum) |
| Rule 34 (no placeholder names) | Section 5 rule 2 (never introduce placeholders) |
| Rule 35 (no cliché headlines) | Section 5 rule 1 (preserve specific copy) |
| Rule 36 (no vague CTAs) | Section 5 rule 4 (never reduce specific CTA) |
| Rule 38 (realistic metrics) | Section 5 rule 3 (never simplify specific metrics) |

---

## Validation
- CODEFIX_SYSTEM string length: +~350 chars — well within Groq truncation budget
- truncateForGroq() handles system + user budget at 5,000 tokens — new section adds ~80 tokens to system, leaving user context unaffected
- 487 tests unaffected (CODEFIX_SYSTEM is a string constant, not tested via contract tests)
