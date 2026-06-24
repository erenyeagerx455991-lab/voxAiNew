---
name: VoxAI V7.2.6 Auth-Aware Navigation
description: Auth-aware navbar system — 5 new templates, accountMenuScore evaluator dimension, navigationIntelligence telemetry, auth-state recommendation engine.
---

## What changed

### 5 new navbar templates (diversity-templates.ts, all priority 15)
- `navbar-auth-v1` — Vercel DNA: NavigationMenu + Avatar/AvatarFallback/DropdownMenu (Profile/Settings/Billing/Team/Logout) + Sheet mobile
- `navbar-auth-v2` — GitHub DNA: NavigationMenu + notification Badge + Avatar/DropdownMenu (Profile/Repos/Settings/Support/Logout) + Sheet mobile
- `navbar-admin-v1` — Stripe DNA: NavigationMenu + Command palette (⌘K) + Admin Badge + Avatar/DropdownMenu + Sheet mobile
- `navbar-dashboard-v1` — Linear DNA: workspace switcher DropdownMenu + NavigationMenu + Avatar/DropdownMenu + Sheet mobile
- `navbar-command-v1` — Notion DNA: prominent Command palette search bar + NavigationMenu + Avatar/DropdownMenu + Sheet mobile

### Evaluator (evaluator.ts)
- Added `accountMenuScore` as 9th evaluation dimension (0–10)
- `scoreAccountMenu()` checks: DropdownMenu (+3), Avatar (+3), AvatarFallback (+1), DropdownMenuTrigger (+1), logout action (+2)
- Weight redistribution (sums to 1.00): hero 0.20, layout 0.17, cta 0.13, accessibility 0.17, shadcn 0.07, coverage 0.06, navigation 0.10, accountMenu 0.05, consistency 0.05
- `EvaluationResult` interface extended with `accountMenuScore: number`

### NavigationMetrics (navigationMetrics.ts)
- `NavigationBuildRecord` extended with: `avatarUsage`, `dropdownUsage`, `commandUsage` (booleans), `accountMenuScore` (number)
- `getNavigationQualityMetrics()` returns `navigationIntelligence: { avatarUsage, dropdownUsage, commandUsage, accountMenuScore }`

### Recommendation engine (componentRecommendations.ts)
- New SECTION_DEFAULTS entries: `navbar-guest`, `navbar-authenticated`, `navbar-dashboard`, `navbar-admin`
- `navbar-authenticated` and above always recommend Avatar + DropdownMenu

### EvaluatorResult (designEvaluatorStep.ts)
- Interface extended with `navigationScore` and `accountMenuScore` fields (spreads from EvaluationResult)

## Rules
- Never generate custom profile menus — always use DropdownMenu
- Never use raw img for avatars — always Avatar + AvatarFallback with initials
- Mobile nav must use Sheet + SheetContent side="left" — no custom overlays
- Command palette for dashboard/admin/devtools contexts only

**Why:** Brings navbar patterns up to Linear/Notion/Stripe quality standard; accountMenuScore surfaces auth UX gaps; template DNA mapping ensures brand-appropriate output.

**How to apply:** When planner selects navbar, evaluator now scores accountMenuScore separately. Templates are DNA-routed: vercel→auth-v1, github→auth-v2, stripe→admin-v1, linear→dashboard-v1, notion→command-v1.
