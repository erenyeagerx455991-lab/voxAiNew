---
name: VoxAI V3.5 Edit System
description: How the file-level editing, project memory, ZIP export, and quality gate work in NexoGen V3.5
---

# Edit Mode Detection
- `projectFilesRef.current.length > 0` → route handleSend to `/api/agents/edit` (mockEditResponse)
- `projectFilesRef.current.length === 0` → full build via `/api/agents/build` (mockStreamResponse)
- Refs (`projectFilesRef`, `projectMemoryRef`) are kept in sync via `useEffect` to prevent stale closures inside handleSend callback

# File Persistence
- `FILES_KEY(id)` = `voxai_files_${id}` stored in localStorage after every successful build/edit
- Loaded back in `setActiveChatId` so switching chats restores project files → edit mode remains active
- `ProjectMemory` stored separately as `voxai_memory_${id}` via `saveProjectMemory`/`loadProjectMemory`

# Edit Agent (server — POST /api/agents/edit)
- SSE endpoint; sends: `edit_identified` (modifiedCount + file list), `edit_done` (merged files array)
- `extractEditFiles(raw)` parses `// === FILE: path/name ===` delimiters
- `extractDeletedPaths(raw)` parses `// === DELETE: path ===` delimiters
- `mergeProjectFiles(existing, modified, deleted)` does the merge
- File context truncated to 3000 chars per file (TSX/TS only) to stay within context limits

# ZIP Export (server — POST /api/agents/export)
- Uses `fflate` (`strToU8` + `zipSync`); returns binary ZIP with `Content-Disposition: attachment`
- Client: `exportProjectZip(files, projectName)` triggers browser download via blob URL

# Quality Gate V2 (server — after Architecture Agent)
- `computeQualityScore(pb)` returns `{ score, passed, issues }` (score 0–100, pass threshold = 70)
- If score < 70: retries Architecture Agent with issue list prepended to prompt
- Emits SSE: `{ type: "quality_gate", score, passed, issues }` and `{ type: "quality_gate_retry", ... }` on retry

# ProjectMemory Shape
```typescript
{
  projectType, description, pages, routes, entities, features,
  authProvider, generatedFiles, dependencyGraph, timestamp
}
```
- `buildDependencyGraph(files)` in builderService.ts — traces relative imports between TSX/TS files

**Why:** Edit mode needs to persist files across chat switches (localStorage) and use refs (not state) inside handleSend callbacks to avoid stale closures. Quality gate retry at score < 70 prevents low-quality blueprints reaching the frontend agents.
