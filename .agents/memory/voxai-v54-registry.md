---
name: VoxAI V5.4 Component Registry System
description: Component Registry engine — DNA-driven variant selection, lock/unlock, Registry tab in WorkspacePreviewPanel.
---

## What was built
- `selectRegistryComponentsServer()` in agents.ts — pure deterministic function, no AI call needed; maps DNA dominant brand → named component variants (HeroLinear, PricingStripe, etc.) for each section in sectionOrder.
- `buildCodeSystem()` now accepts 5th param `registrySelection`; injects `═══ COMPONENT REGISTRY (V5.4) ═══` block before SHADCN section when selection is present.
- Two new SSEs: `registry_selection` (fires after component library selection, before step 3) and `registry_health` (fires after build_health).
- Frontend: `registrySelection`/`registryHealth`/`lockedComponents` state in useAppStore; `lockComponent`/`unlockComponent` callbacks persist to localStorage via `saveRegistrySelection`.
- WorkspacePreviewPanel: new `RegistryPanel` component shows coverage score, stats grid, per-section component list with lock toggle; Registry tab appears in tab bar when a selection exists.

## Key patterns
- Registry selection is stored under `voxai_registry_<chatId>` in localStorage (via `saveRegistrySelection`).
- Locking a component sets `lockedComponents[]` — currently persisted but NOT yet enforced in the edit pipeline (future: V5.5 edit system should skip locked sections).
- `RegistryCategory` is `Partial<Record<RegistryCategory, string>>` where values are `"ComponentName — style hint"` strings.

## Bugs fixed during implementation
- `hero.ts` and `premium/pricing.ts` had `${var}` inside outer template literals — escaped to `\${var}`.
- `Industry` type was missing `developer`, `productivity`, `enterprise`, `design`, `media`, `business`, `global` — added to types.ts AND selector.ts INDUSTRY_KEYWORDS.
- `blueprint.dependencies` was used in builderService.ts graph builder but the field was missing from `ProjectBlueprint` interface — added as optional.
- `componentOwnership.ts` getSectionsByBrand had implicit `any` — cast brand to `BrandKey`.

**Why:** Registry gives AI structural constraints before codegen; locked components protect user-approved sections from being changed on edits.
