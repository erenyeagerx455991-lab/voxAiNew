---
name: VoxAI V5.1 Stability Release
description: Validation Agent, multi-pass repair loop, build health metrics, component registry aliases, token limit reductions
---

# V5.1 Stability Release

## What Changed

### 1. Enhanced Validation Agent (validateTsxFile — 12 checks)
**Hard errors** (break render):
1. Missing capitalized function definition
2. Missing JSX return statement
3. JSX fragment syntax `<> </>` — banned in CDN+Babel preview
4. React.FC / JSX.Element type annotations (Babel strict mode failures)
5. Stray import inside function body
6. HTML void elements without self-closing slash (`<br>` → `<br />`)
7. Object spread as className: `className={{ … }}` is invalid

**Warnings** (degrade quality):
8. Unclosed JSX tags (heuristic: open vs close tag count)
9. `.map()` without `key=` prop
10. `window`/`document` outside `useEffect`
11. Async component function
12. Style prop using string for numeric values (`"14px"` → `14`)

### 2. Multi-Pass Repair Loop (MAX 3 passes)
**Before:** Single-pass parallel repair (one round, no re-validation)
**After:** Up to 3 sequential passes, each: validate all → repair failures in parallel → re-validate
- `totalRepairAttempts` counts LLM calls
- `totalFilesRepaired` counts successful repairs
- Breaks early when all files pass
- Reports but doesn't repair on final pass
- Repair system prompt: "Fix ONLY the reported issues. Return COMPLETE file."

### 3. Build Health Metrics
**Server SSE event:** `build_health` emitted after repair loop, before backend/db/auth agents
Fields: `validationScore`, `compileSuccessRate`, `repairAttempts`, `filesRepaired`, `totalFiles`, `passedFiles`, `failedFiles`, `tokenEstimate`

**Client flow:**
- `BuildHealth` interface in `builderService.ts`
- `mockAiService.ts` handles `build_health` SSE → calls `onBuildHealth()`
- `useAppStore.ts` has `buildHealth` state + setter
- `WorkspacePreviewPanel.tsx` renders `BuildHealthPanel` when `buildHealth` is set
- `App.tsx` passes `buildHealth={store.buildHealth}` to panel

**BuildHealthPanel UI:**
- Color-coded score badge (green ≥90%, yellow ≥70%, red <70%)
- 4-column grid: Files passed/total, Repairs, Passes (attempts), Token estimate

### 4. Component Registry Named Aliases
`NAMED_COMPONENTS` map in `registry.ts` maps 9 canonical names:
- HeroLinear → hero-asymmetric-v1
- HeroStripe → hero-saas-v1
- HeroFramer → hero-editorial-v1
- PricingStripe → pricing-horizontal-v1
- PricingLinear → pricing-minimal-v1
- NavbarMinimal → navbar-minimal-v1
- NavbarFloating → navbar-modern-v1
- DashboardAnalytics → dashboard-revenue-v1
- DashboardSaaS → dashboard-kanban-v1

`getRegistryCatalogue()` injected into `buildCodeSystem()` so every codegen call sees the available components.

### 5. Token Limit Reductions
- Planner: 2500 → 1800 tokens
- Architecture agent: 2000 → 700 tokens
- Per-file repair: 1500 tokens (unchanged)

**Why:** Groq free tier TPM cap is 12k. Reducing planner/arch tokens prevents overflow on complex multi-file projects while still generating sufficient output.

**How to apply:** Don't reduce planner below 1500 (needs to emit full DESIGN_BRIEF + PAGE_BLUEPRINT blocks). Architecture can go as low as 600 if needed.
