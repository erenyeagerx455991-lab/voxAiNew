# V7.1.3 — Prompt Intelligence Upgrade — Release Summary

**Date:** June 23, 2026
**Scope:** PLANNER_SYSTEM, DESIGN_SYSTEM, buildCodeSystem, CODEFIX_SYSTEM
**Previous Version:** V7.1.2 (Template Hardening — score 8.1/10)
**Target Score:** 8.5+/10

---

## Overview

V7.1.3 upgrades all four prompt systems with intelligence rules targeting three core weaknesses:

1. **Generic output** — vague CTAs, Lorem ipsum, placeholder names, cliché headlines
2. **Layout monotony** — adjacent sections using same background/layout/alignment
3. **Structural gaps** — missing hero badges, missing dual CTAs, missing trust signals

No changes to: queue, telemetry, rate limits, budgets, RAG, registry, component system, SSE contracts, or test infrastructure.

---

## Changes by Component

### 1. PLANNER_SYSTEM (prompts.ts)

| Change | Before | After |
|--------|--------|-------|
| Section count range | 5–9 | 6–10 |
| Duplicate section rule | None | HARD RULE: no repeat names or adjacent categories |
| Mandatory SaaS sections | None | Hero + Social Proof + Features + CTA enforced |
| Mandatory Restaurant sections | Guidance only | Hero + Gallery + Menu + Reservation/ChefStory enforced |
| Mandatory Portfolio sections | Guidance only | Hero + Projects + Contact enforced |
| Per-section rationale | None | One-word purpose annotation required |
| Adjacent category diversity | None | No two adjacent sections from same visual category |

**Prompt additions:** ~350 characters (HARD PLANNING RULES block)

---

### 2. DESIGN_SYSTEM (prompts.ts)

| Rule | Description |
|------|-------------|
| Rule 11 (NEW) | Section Background Alternation — bg → surface → bg pattern mandated |
| Rule 12 (NEW) | Visual Hierarchy Flow — Hero (awareness) → Features (understanding) → Social Proof (trust) → CTA (conversion) |
| Rule 13 (NEW) | Focal Point + CTA Anchor — ONE dominant CTA per page (solid/gradient), all others subordinate |

**Before:** 10 rules (6–10 design rules)
**After:** 13 rules (6–13 design rules)
**Prompt additions:** ~380 characters

---

### 3. buildCodeSystem / Frontend Agent (codeSystem.ts)

| Section (NEW) | Rules | Description |
|---------------|-------|-------------|
| Hero Requirements | 24–28 | Badge + H1 + copy + dual CTA + trust signal always required |
| Layout Diversity | 29–32 | Background alternation, no adjacent duplicate grids/alignment, weight gradient |
| Anti-Generic Content | 33–39 | 7 forbidden patterns with explicit bad→good examples |
| CTA Intelligence | 40–43 | Dominant CTA, subordinate others, bottom CTA reinforces hero, pricing exception |

**Before:** 23 numbered rules
**After:** 43 numbered rules (+20 rules across 4 new sections)
**Prompt additions:** ~900 characters (dynamically interpolated, uses design DNA values)

---

### 4. CODEFIX_SYSTEM (prompts.ts)

| Section (NEW) | Description |
|---------------|-------------|
| Section 5: Anti-Generic Content Preservation | 6 rules preventing the fix agent from stripping specific copy, metric numbers, CTA labels, or business names during the fix pass |

**Before:** 4 sections
**After:** 5 sections
**Prompt additions:** ~350 characters

---

## Expected Quality Impact

| Dimension | V7.1.2 Score | V7.1.3 Expected |
|-----------|-------------|-----------------|
| Hero composition (badge + dual CTA + trust signal) | 5.5/10 | 8.5/10 |
| Layout diversity (alternating backgrounds) | 5.0/10 | 8.0/10 |
| Content specificity (no Lorem ipsum, no placeholder names) | 7.0/10 | 9.0/10 |
| CTA intelligence (one dominant CTA) | 5.5/10 | 8.0/10 |
| Section plan quality (no duplicates, mandatory sections) | 6.0/10 | 9.0/10 |
| **Overall prompt intelligence** | **6.0/10** | **8.5/10** |

---

## Files Changed

| File | Change Type | Lines Added |
|------|-------------|-------------|
| `src/agents/llm/prompts.ts` | 4 targeted edits | ~45 lines |
| `src/agents/frontend/codeSystem.ts` | 1 targeted edit | ~45 lines |

## Files NOT Changed (by design)

- `src/agents/pipeline/*.ts` — no pipeline contract changes
- `src/agents/types.ts` — no type changes
- `src/components/registry*.ts` — registry system untouched
- `src/cost/*.ts` — budget system untouched
- `src/queue/*.ts` — queue system untouched
- All test files — 487 tests expected green (string constants not in test contracts)

---

## Audit Docs Written

| File | Contents |
|------|----------|
| `promptBaseline.md` | Phase 1 audit — gap analysis before V7.1.3 |
| `plannerUpgrade.md` | PLANNER_SYSTEM change log + impact analysis |
| `designUpgrade.md` | DESIGN_SYSTEM change log + impact analysis |
| `frontendUpgrade.md` | buildCodeSystem change log + token budget analysis |
| `codefixUpgrade.md` | CODEFIX_SYSTEM change log + preservation contract |
| `v713-upgrade-summary.md` | This file — release summary |
