---
name: VoxAI V6.4 Real Build Engine
description: Real npm install + Vite build execution replacing prediction-based validation. New files, integration points, security model, and verified results.
---

## Rule
Every generated project is now validated by actual `npm install` (Phase 3) + `vite build` (Phase 4) execution in an isolated `/tmp/nexogen-runs/{uuid}` workspace. Static validators (validateFiles, detectMissingImports) are removed from the Runtime Agent path.

**Why:** Static regex/AST validation cannot catch real build errors like missing packages, wrong import paths, Rollup bundling failures, or esbuild syntax errors. Real builds produce real errors.

## New Files
- `src/runtime/errorClassifier.ts` — classifies raw npm/vite stdout+stderr into `RealBuildError[]` typed by category (dependency/typescript/jsx/import/route/runtime/build/unknown). Two exports: `classifyInstallOutput(output, exitCode)` and `classifyBuildOutput(output, exitCode)`.
- `src/runtime/buildExecutor.ts` — core service. Key exports:
  - `setupWorkspace(files, packages, onLog?)` → `SetupResult` — creates dir + writes scaffold + runs npm install once
  - `rebuildWorkspace(workspaceDir, files, onLog?)` → `BuildRunResult` — overwrites files on disk + vite build (per repair pass)
  - `teardownWorkspace(workspaceDir)` — always called in finally block
  - `buildRepairTargets(errors, files)` → `RepairTarget[]` — Phase 8 targeted context (failing file + direct imports only)
- Both imported in `src/routes/agents.ts` at top.

## Integration Pattern (agents.ts)
Runtime Agent section (formerly V6.0 static) replaced with:
1. `setupWorkspace(allFiles, resolvedDeps.packages)` — npm install once
2. Loop up to `MAX_REAL_PASSES = 5`:
   - `rebuildWorkspace(workspaceDir, allFiles)` — real vite build
   - If success → emit `runtime_passed`, break
   - `buildRepairTargets(errors, allFiles)` → repair with REPAIR_MODEL (llama-3.1-8b-instant)
   - Repairs mutate `target.file.content` in-place — allFiles array is shared
3. `teardownWorkspace` in finally
4. `done` SSE always fires (CDN iframe preview still works)
5. `runtime_health` carries `realBuild: true` + `buildPassed` from real result

## Security
- `assertSafePath()` guards all file ops and `runCmd()` calls — only `/tmp/nexogen-runs/*` and `/tmp/nexogen-npm-cache`
- Only whitelisted commands: `npm`, `npx`, `node` (Set enforced in `runCmd`)
- Resource limits: install 180s, build 120s (SIGKILL on timeout)

## Scaffold Generated Per Workspace
package.json with pinned versions (react 18.3, vite 5.1, @vitejs/plugin-react 4.2), vite.config.ts (esbuild transform), tsconfig.json (strict:false, allowJs:true, skipLibCheck:true), index.html, src/main.tsx (auto-generated if missing).

## Shared npm Cache
`/tmp/nexogen-npm-cache` shared across all builds. First install: ~33s. Subsequent: ~19s avg.

## Phase 14 Verification Results
- 10/10 projects tested: SaaS, Portfolio, E-Commerce, CRM, Analytics, Admin, AI Chat, Agency, Dashboard+Routes, Community
- npm install success: 10/10 (100%)
- Vite build success: 10/10 (100%)
- Avg install time: ~20.7s (cold: 33s, warm: 19s)
- Avg build time: ~7.8s

## SSE Events Added
`runtime_build_start`, `runtime_build_done`, `runtime_error`, `runtime_repair_start`, `runtime_repair_done`, `runtime_passed`, `runtime_failed`

## How to Apply
- Do NOT re-add static `validateFiles` / `detectMissingImports` to the Runtime Agent path — they are intentionally removed
- The `done` SSE always fires even if real build fails (backward compat)
- `runtime_health.buildPassed` now reflects real build result, not static analysis
- `runtime_health.realBuild: true` distinguishes V6.4 results from older static results
