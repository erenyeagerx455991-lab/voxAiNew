---
name: VoxAI V6.1 Self-Healing Engine
description: V6.1 runtime repair upgrade — error classification, KG-targeted file resolution, self-healing loop with quality gate, 5-dim health scores, repair history/metrics, full SSE event pipeline.
---

## Architecture

### Backend (`api-server`)
- **`repairStrategies.ts`** (NEW) — `classifyRuntimeError()` classifies errors into 9 categories (import/jsx/typescript/hook/route/api/dependency/runtime/unknown); `REPAIR_PROMPTS` map holds category-specific prompt strategies.
- **`runtimeManager.ts`** — Added `RuntimeRepairRecord`, `RepairMetrics`, `RuntimeHealthV2` interfaces; `addRepairRecord()`, `getRepairHistory()`, `getRepairMetrics()`, `computeHealthV2()` functions; in-memory `repairStore` Map.
- **`runtimeValidator.ts`** — Added `computeRepairQuality(repaired, original, category)` — quality gate returning 0-100 score; threshold is ≥80 to accept patch.
- **`agents.ts`** — `/agents/runtime-repair` endpoint completely replaced with V6.1 self-healing loop. Also added `GET /agents/repair-history/:chatId` endpoint.

### Frontend (`voxai`)
- **`builderService.ts`** — Added `RuntimeRepairRecord`, `RepairMetrics`, `RuntimeHealthV2`, `SelfHealingState` interfaces; `saveRepairHistory`, `loadRepairHistory`, `computeRepairMetrics`, `clearRepairHistory` utilities.
- **`mockAiService.ts`** — `runtimeRepair()` upgraded: new params `knowledgeGraph`, `lockedComponents`, `chatId`, `onRepairStep` callback; handles all 9 SSE events.
- **`useAppStore.ts`** — Added `repairHistory`, `repairMetrics`, `selfHealingState` state; `onRuntimeError` now passes KG+locked context, drives `selfHealingState` phase transitions.
- **`WorkspacePreviewPanel.tsx`** — RuntimeEnginePanel upgraded with: `SelfHealingPanel` (phase progress bar + category badge), `DimHealthBar` (5× compile/runtime/repair/dep/route), `RepairHistoryTimeline`, `RepairAnalyticsPanel`, `CategoryBadge`; `BUILD_STEP_LABELS` now has 12 entries (step 10 = "Self-healing issues...").

## SSE Event Sequence
`repair_start` → `repair_classify` → `repair_targets` → loop: `repair_generate` → `repair_apply` → `repair_validate` → (`repair_success` | `repair_failed`) → `repair_complete` + `runtime_repair_done` (backward-compat)

## Key Decisions
- Quality gate threshold: ≥80 to accept patch; retry loop up to 3 total attempts.
- `resolveAffectedFilesFromGraph()` reduces token cost by targeting only KG-linked files instead of all project files.
- Locked components (from registry) are excluded from repair via `lockedFilePaths` Set — repair agent never patches them.
- `repair_complete` always fires (even on full failure) so frontend state always settles.

**Why:** Previous single-pass repair had no classification, no quality validation, and no KG targeting — leading to high false-success rates and token waste.
