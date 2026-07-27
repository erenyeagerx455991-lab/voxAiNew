---
name: VoxAI V10.2 Manual Development Intelligence Engine
description: 31-module browser-IDE layer; pipeline step 0.99995; 310 new tests; 4791 total pass.
---

## Key facts

- **Step position**: 0.99995 — after MetaIntelligence (0.9995), before Planner (1).
- **Entry point**: `workspaceFacade.ts` → `workspaceStep.ts` → route `workspace.ts`.
- **Route mounting**: added `workspaceRouter` in `src/routes/index.ts`.
- **AgentName**: `"ManualDevelopment"` added to both `telemetry/agentMetrics.ts` AND `agent-orchestrator/types.ts`.
- **Telemetry**: `manualDevelopment` block added to `/api/telemetry/quality` response.
- **Tests**: `src/tests/unit/manualDevelopment.test.ts` — 310 deterministic tests.
- **Audit**: `artifacts/api-server/v10.2Audit.md`.

## Critical bugs found and fixed

1. **path-to-regexp v8 rejects `/*` and `:param*` wildcards** — file-path routes that contain
   slashes must use query params instead: `GET /workspace/:projectId/file?path=src/App.tsx`.
   Never use wildcard catch-all patterns in Express 5 route paths.

2. **`extractImports()` missed bare side-effect imports** (`import './styles.css'`) — needed
   a separate pattern `/import\s+['"]([^'"]+)['"]/g` in addition to the `from` pattern.

3. **Local import path resolution produced `src/./utils`** — normalize with
   `.replace(/\/\.\//g, '/')` before constructing candidate paths.

## File route API (query-param style)

```
GET    /api/workspace/:projectId/files          → list all files
POST   /api/workspace/:projectId/files          → create file (body: {path, content})
GET    /api/workspace/:projectId/file?path=...  → get single file
PUT    /api/workspace/:projectId/file?path=...  → update file (body: {content, source})
DELETE /api/workspace/:projectId/file?path=...  → delete file
```

**Why:** Express 5 / path-to-regexp v8 removed unnamed `*` wildcards AND
`:param*` syntax. File paths contain `/` which the router treats as segment
separators, breaking named wildcard capture. Query params are the only safe
cross-version approach.

## Persistence / metrics caps

- Persistence cap: 500 records (same as V9–V10 engines).
- Undo/redo: 200 levels per file.
- Snapshots: 50 in-memory, 500 on disk.
- Edit history: 500 entries.
