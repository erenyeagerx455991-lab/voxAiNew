---
name: VoxAI V7.1.5 Design System Foundation
description: Industry-standard design system rules added to generation prompts — shadcn-first, typography, spacing, color, motion, layout, a11y.
---

# VoxAI V7.1.5 — Industry Standard Design System Foundation

## What changed

### builderService.ts (preview globals)
New globals added to `buildPreviewHtml()` after the existing Accordion/Tabs block:
- Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
- Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose
- Tooltip, TooltipProvider, TooltipTrigger, TooltipContent
- DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup, etc.
- Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel
- Switch, Label, Textarea
- **Framer Motion shim** (window.motion) — lightweight IntersectionObserver-based shim supporting: motion.div/section/h1-h6/p/span/ul/li/a/button/article, initial/animate/whileInView/transition props; AnimatePresence; useAnimation; useInView

### codeSystem.ts (FRONTEND agent prompt)
New sections added (in order):
1. `═══ SHADCN-FIRST RULES (V7.1.5) ═══` — 14 NEVER rules, covers every raw HTML fallback
2. Expanded `═══ SHADCN/UI COMPONENTS (V7.1.5) ═══` — full globals catalogue with all new components + motion examples
3. `═══ TYPOGRAPHY SYSTEM (V7.1.5) ═══` — minimum sizes: H1≥text-5xl, H2≥text-3xl, H3≥text-xl, body=text-base, no arbitrary sizes
4. `═══ SPACING SYSTEM (V7.1.5) ═══` — 8pt grid whitelist, explicit forbidden values (p-7, mt-11, gap-13, etc.)
5. `═══ COLOR DISCIPLINE (V7.1.5) ═══` — max 1 primary + 1 accent, single icon color per section
6. `═══ FRAMER MOTION ANIMATION RULES (V7.1.5) ═══` — allowed (fade/slide/scale/stagger), forbidden (spin/bounce/parallax), 150–400ms duration constraint
7. Updated rule 21 — icon aria-hidden="true" requirement for all decorative Lucide icons

### prompts.ts
- CODEFIX_SYSTEM: expanded shadcn globals list to all new components; added Framer Motion preservation rules
- PLANNER_SYSTEM: added CONVERSION FUNNEL ORDER — mandatory Hero→Credibility→Features→Proof→Testimonials→Pricing→CTA→FAQ for SaaS/AI sites

## Key decisions
**Why lightweight motion shim instead of CDN:** framer-motion v11 has no UMD bundle. Shim uses IntersectionObserver + requestAnimationFrame for whileInView, rAF double-tick for animate, CSS transitions for actual movement.

**Why:** All 3 workflows rebuild clean after changes. No test regressions observed (changes are prompt-only + preview HTML globals).
