---
name: VoxAI V7.1.3 Prompt Intelligence
description: Prompt upgrade adding hero requirements, layout diversity, anti-generic rules, and CTA intelligence across all 4 agents.
---

# VoxAI V7.1.3 — Prompt Intelligence Upgrade

## Files Changed
- `artifacts/api-server/src/agents/llm/prompts.ts` — PLANNER_SYSTEM, DESIGN_SYSTEM, CODEFIX_SYSTEM
- `artifacts/api-server/src/agents/frontend/codeSystem.ts` — buildCodeSystem()

## Key Rules Added

### PLANNER_SYSTEM
- Section count: 5–9 → 6–10
- HARD PLANNING RULES block: no duplicate section names, no adjacent same category
- Mandatory SaaS/AI sections: Hero + Social Proof + Features + CTA enforced
- Mandatory Restaurant: Hero + Gallery + Menu + Reservation/ChefStory
- Mandatory Portfolio: Hero + Projects + Contact
- Per-section purpose annotation required in 📄 Pages output

### DESIGN_SYSTEM
- Rule 11: Section Background Alternation (bg → surface → bg pattern)
- Rule 12: Visual Hierarchy Flow (Hero → Features → Social Proof → CTA funnel)
- Rule 13: Focal Point + CTA Anchor (ONE dominant CTA, hero H1 is focal point)

### buildCodeSystem (Frontend Agent)
- Rules 24–28: Hero Requirements (badge, H1, copy, dual CTA, trust signal — all mandatory)
- Rules 29–32: Layout Diversity (background alternation, no adjacent duplicate grids/alignment, weight gradient)
- Rules 33–39: Anti-Generic Content (no Lorem ipsum, no placeholder names, no cliché headlines, no vague CTAs)
- Rules 40–43: CTA Intelligence (one dominant CTA, subordinate others, bottom CTA reinforces hero)
- Total rules: 23 → 43

### CODEFIX_SYSTEM
- Section 5: Anti-Generic Content Preservation — prevents fix pass from stripping specific names, metrics, or CTA copy

## What NOT to change
- Do NOT touch queue, telemetry, rate limits, budgets, RAG, registry, component system
- Do NOT add any of these rules to BACKEND_SYSTEM, DATABASE_SYSTEM, AUTH_SYSTEM, or EDIT_SYSTEM
- Do NOT modify plannerStep.ts, frontendStep.ts, or pipelineTypes.ts — prompt changes only

## Validation
- Build: ⚡ Done (esbuild, no errors)
- Tests: 487/487 pass (string constants not in test contracts)
- Audit docs: promptBaseline.md, plannerUpgrade.md, designUpgrade.md, frontendUpgrade.md, codefixUpgrade.md, v713-upgrade-summary.md

**Why:** Generic output (Lorem ipsum, "Acme Corp", "The Future of X") was the top user complaint. Layout monotony (same background, same grid repeat) was the top visual weakness. Hero sections were missing key trust-building elements (badge, dual CTA, trust signal).
