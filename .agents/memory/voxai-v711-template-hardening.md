---
name: VoxAI V7.1.1 Template Hardening
description: Accessibility & template quality fixes — raised measured score from 7.2 to 8.1/10 across 75 templates.
---

## What was done

170+ targeted changes across registry.ts (1610 lines), section-templates.ts (1044 lines), diversity-templates.ts (1111 lines).

## Phase Summary

| Phase | Fix | Count | Method |
|---|---|---|---|
| 1 | text-white/10–50 → /60–70 | 80 violations | perl -i regex |
| 2 | type="button" on all buttons | 62 buttons | perl -i regex |
| 3 | focus-visible on hero/CTA | 19 elements | targeted edit |
| 4 | Rainbow gradients → single accent | 4 templates | targeted edit |
| 5 | Bottom-10 template upgrades | 10 templates | targeted edit |
| 6 | text-sm → text-base body copy | 5 templates | targeted edit |

## Key Rules

- **text-white/60 is the minimum** for text on dark backgrounds (opacity floor)
- **text-gray-400 is the minimum** for gray text on dark backgrounds (not gray-500)
- **text-gray-700 on dark bg is invisible** — was in faq-minimal-v1 number markers
- **text-gray-500 text-xs** is borderline fail — need to raise to gray-400 for small text
- **type="button" required** on ALL buttons not inside a form with a submit handler
- **Rainbow gradients** (4+ different accent colors in one template) violate Rule 8 — use single family

## Exception Applied

`text-white/3` on decorative 240px quotation mark in cta-story-v1 — left unchanged. This is a purely decorative visual texture (`select-none pointer-events-none`). Not a text content violation.

## Audit Documents Written (10 total)

opacityFixAudit.md, buttonAudit.md, focusAudit.md, gradientAudit.md, templateUpgradeAudit.md, heroConsistencyAudit.md, designRuleValidation.md, accessibilityRescore.md, benchmarkDelta.md, v7.1.1QualityAudit.md

## Test State

487/487 tests pass. All 46 test files pass. No API contract changes.

## V7.1.2 Targets (remaining gap to 8.8+)

- Full focus-visible sweep on remaining ~47 templates (currently only 28% covered)
- Non-text contrast: bg-white/3 containers below 3:1 threshold
- Remaining ~9 gray-500 small text instances
- Aria-hidden sweep on all remaining decorative elements

**Why:** Template quality affects LLM output quality — the design agent reads these templates as examples. High-quality templates → higher-quality generated code.
