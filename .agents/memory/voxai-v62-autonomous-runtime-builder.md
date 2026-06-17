---
name: VoxAI V6.2 Autonomous Runtime Builder
description: 10-phase proactive runtime builder replacing reactive validator; dependency intelligence, import/component/route/package resolvers, 5-pass autonomous loop, 9-dim health, timeline, preview gate.
---

## Architecture

### New Files
- `artifacts/api-server/src/runtime/dependencyResolverV2.ts` — full Dependency Intelligence Engine: `buildRuntimeDependencyGraph()`, `resolveImports()` (auto-injects missing React/router hooks), `resolveComponents()`, `resolveRoutes()`, `resolvePackages()`.

### Updated Files
- `artifacts/api-server/src/runtime/runtimeManager.ts` — added `RuntimeHealthV3` (9 dims), `TimelineEvent`, `RuntimeTimeline`, and functions: `initTimeline()`, `addTimelineEvent()`, `finalizeTimeline()`, `getTimeline()`, `computeHealthV3(state, depGraph?)`.
- `artifacts/api-server/src/routes/agents.ts` — added `POST /agents/autonomous-build` endpoint (SSE, 10 phases, 5-pass loop). Also added `import { buildRuntimeDependencyGraph, ... } from dependencyResolverV2.js` at top.
- `artifacts/voxai/src/services/builderService.ts` — added types: `RuntimeHealthV3`, `TimelineEvent`, `RuntimeTimeline`, `RuntimeDependencyGraph` + sub-interfaces, `AutonomousBuildState`.
- `artifacts/voxai/src/hooks/useAppStore.ts` — added state `runtimeHealthV3`, `runtimeTimeline`, `autonomousBuildState`; after main build `done`, auto-calls `/api/agents/autonomous-build` and streams SSE events; exports new types.
- `artifacts/voxai/src/components/WorkspacePreviewPanel.tsx` — added `AutonomousBuildPanel`, `RuntimeTimelinePanel`; RuntimeEnginePanel now shows "Runtime Health V3" with 9 bars (compile, runtime, repair, dependencies, routes, imports, packages, components, pages) + preview gate banner.
- `artifacts/voxai/src/App.tsx` — passes `runtimeHealthV3`, `runtimeTimeline`, `autonomousBuildState` to `WorkspacePreviewPanel`.

## 10 SSE Phases (POST /agents/autonomous-build)
1. `dependency_plan` — buildRuntimeDependencyGraph
2. `imports_resolved` — resolveImports (auto-injects missing hook imports)
3. `components_resolved` — resolveComponents
4. `routes_resolved` — resolveRoutes
5. `packages_resolved` — resolvePackages
6. `sandbox_result` — validateFiles initial scan
7. `autonomous_build_pass` × N — up to 5 passes; stops at ≥95; each pass repairs failing files with REPAIR_MODEL
8. `runtime_health_v3` — computeHealthV3 blended with pass scores
9. `runtime_timeline` — finalizeTimeline
10. `preview_gate_pass` / `preview_gate_fail` / `preview_gate_repaired` — gate at 90

## Key Rules
**Why:** `ValidationResult.score` not `runtimeScore` — the `validateFiles()` function returns `.score`, not `.runtimeScore` (which belongs to the custom `runtimeValidate()` result at line 1712).
**How to apply:** Always use `.score` when using `validateFiles()` return value in autonomous-build loop.

## V3 Health Dimensions
9 total: compile, runtime, repair, dependencies, routes (from V6.1 logic) + imports, packages, components, pages (from depGraph).
`computeHealthV3` blends state-based dims with depGraph-based dims. If no depGraph, imports/packages/components/pages fall back to state-derived estimates.

## Autonomous Build Trigger
Called automatically after main build `done` event (when `serverFiles.length > 0 && chatId`). Runs in background — does not block UI or main build step transitions.

## Pre-existing TS7030 Warnings
`Not all code paths return a value` at line 4428+ is the same pre-existing Express route pattern present at 6+ other locations (2542, 3387, 3662, 3758, 4042). Not introduced by V6.2, not blocking.
