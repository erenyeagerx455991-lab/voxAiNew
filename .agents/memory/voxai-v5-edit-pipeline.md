---
name: VoxAI NexoGen V5 Edit Pipeline
description: 5-step surgical edit pipeline replacing full-project regeneration; file-level targeting, dependency graph, diff tracking, undo/redo
---

# VoxAI NexoGen V5 Edit Pipeline

## Architecture

### Server-side (`artifacts/api-server/src/routes/agents.ts`)
- `/agents/edit` now runs a 5-step SSE pipeline:
  - Step 0: **Intent Detector** — INTENT_SYSTEM, calls PLANNER_MODEL, outputs JSON `{editType, targetFiles, newFiles, reason}` 
  - Step 1: **File Resolver** — `resolveAffectedFiles()` expands target via dep graph; adds App.tsx if page changed
  - Step 2: **Patch Generator** — EDIT_SYSTEM feeds ONLY the targeted files as context (not the full project)
  - Step 3: **Quality Gate** — `validateEditFiles()` checks completeness, exports, truncation; produces score 0-100
  - Step 4: **Merge Engine** — `mergeProjectFiles()` + builds diff `{changedFiles, createdFiles, deletedFiles}`
- SSE events: `intent_detected`, `file_targets`, `quality_check`, `edit_identified`, `edit_done` (includes `diff` and `intentResult`)
- Accepts `componentRegistry` and `themeTokens` from client for design preservation

### Client-side (`mockAiService.ts`)
- `mockEditResponse()` signature: prompt, files, memory, onToken, onDone, onError, onStep, onIntentDetected, onFileTargets, onQualityCheck, registry, themeTokens
- `onDone` receives `EditDiff` via the `diff` field on `edit_done` SSE event

### State (`useAppStore.ts`)
- New state: `editHistory`, `lastEditDiff`, `editIntentType`, `editTargetFiles`, `editQualityScore`
- Undo/redo: `undoStackRef`, `redoStackRef` — save snapshot before each edit, clear redo on new edit
- `undoEdit()` / `redoEdit()` swap project files from stacks, update preview
- `themeTokensRef` keeps current themeTokens in sync for edit calls
- `canUndo` / `canRedo` derived from stack lengths at return time

### UI
**ChatView.tsx:**
- `EDIT_STEPS` (5 items) shown when `isEditMode && buildStep >= 0 && buildStep < 9`
- `BUILD_STEPS` (10 items) shown otherwise
- `EditDiffPanel` renders after the last assistant message (yellow `~` changed, green `+` created, red `−` deleted)

**WorkspacePreviewPanel.tsx:**
- `FileTreeView` accepts `diff?: EditDiff | null` prop; shows `DiffBadge` next to each file
- Toolbar shows `Undo2` / `Redo2` buttons (disabled when stack empty) when `canUndo || canRedo`

**Why:** Surgical edits preserve design intent; full regeneration loses brand tokens and component structure.

**How to apply:** When adding new edit capabilities, always thread through the 5-step pipeline. New SSE event types go in both agents.ts (emit) and mockAiService.ts (handle). Quality gate score threshold is 60 for pass.
