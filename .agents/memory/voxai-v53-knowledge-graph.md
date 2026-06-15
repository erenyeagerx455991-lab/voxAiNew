---
name: VoxAI V5.3 Knowledge Graph System
description: Project Knowledge Graph — build pipeline generates graph, edit agent uses it for context minimization, UI shows Graph tab
---

## Architecture

### Data Model (builderService.ts)
- `ProjectKnowledgeGraph` interface with: `pages (KGPage[])`, `components (KGComponent[])`, `apis (KGApi[])`, `databaseTables (KGDatabaseTable[])`, `routes (string[])`, `dependencies (string[])`, `graphHealthScore (0-100)`, `editContextHint`
- `KGComponent` has `section` field (hero/pricing/navigation/footer/dashboard/chart/auth/features) for keyword matching

### Build Pipeline (agents.ts)
- After Project Validator, before DONE SSE: calls `buildKnowledgeGraphServer(allFiles, projectBlueprint)`
- Emits SSE events: `graph_build_start` → `graph_build_done` (with graph) → `graph_health`
- Graph is also included in the `done` SSE payload as `knowledgeGraph`

### Edit Agent (agents.ts)
- Edit route now accepts `knowledgeGraph` in request body
- After `resolveAffectedFiles()`, calls `resolveEditTargetsServer(graph, prompt, files)`
- If resolved: emits `graph_context` SSE with `{filesLoaded, filesSkipped, tokensSaved, resolvedNodes}`
- Graph targets are MERGED with intent targets (not replacement) for safety

### Client-Side (mockAiService.ts)
- `mockStreamResponse`: new optional `onKnowledgeGraph` callback (8th param)
- `mockEditResponse`: new optional `knowledgeGraph` and `onGraphContext` params (12th/13th)
- Handles `graph_build_done` SSE → calls `onKnowledgeGraph`
- Handles `graph_context` SSE → calls `onGraphContext`

### State (useAppStore.ts)
- New state: `knowledgeGraph: ProjectKnowledgeGraph | null`, `graphContext: {...} | null`
- On full build: graph saved via `onKnowledgeGraph` callback
- On edit: graph rebuilt from updated files (`buildKnowledgeGraph()` called in handleDone)
- Persisted: `saveKnowledgeGraph(chatId, graph)` / `loadKnowledgeGraph(chatId)` — key `voxai_graph_${chatId}`
- Cleared: on `handleNewChat`, `handleDeleteChat`, `setActiveChatId(null)`
- Loaded: on `setActiveChatId(id)` from localStorage

### UI (WorkspacePreviewPanel.tsx)
- New `knowledgeGraph` prop
- Graph tab appears only when `knowledgeGraph` is available
- `KnowledgeGraphPanel` component: health score header + 4-col grid (Pages/Comps/APIs/Routes)
- Collapsible sections via `KGSection`: Pages, Components, Routes, APIs, Database, Dependencies
- Component section badges show section type (hero/pricing/auth etc.)

## Why
- Edit Agent was loading all files → high token usage + slow edits
- Graph lets edit agent identify only affected files without scanning all code
- Graph persists across reloads → no rebuild needed on reopen

## How to apply
- Graph resolver runs on EVERY edit; if `resolved: false`, falls back to intent-based resolution
- Graph is merged (not replaced) with intent targets for safety
- Token savings ≈ 150 tokens × filesSkipped
