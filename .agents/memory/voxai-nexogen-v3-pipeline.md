---
name: VoxAI NexoGen V3 Full-Stack Pipeline
description: 9-step multi-agent pipeline architecture — blueprint as source of truth, parallel backend/db/auth agents, unified file merge.
---

## The Rule
The pipeline is 9 logical steps (indices 0-8). The last 3 (Backend=5, Database=6, Auth=7) run in parallel and only fire when the blueprint declares `apis.length > 0`, `databaseTables.length > 0`, or `authNeeded`. "Preparing Preview" is always index 8.

**Why:** Prior architecture had 6 steps (0-5), with "Preparing Preview" at 5. After adding 3 conditional agents, the done handler must call `setBuildStep(8)` not `setBuildStep(5)`.

**How to apply:** Any time a new agent step is inserted, update ALL of:
1. `AGENT_STEPS` array in `ChatView.tsx` (UI pipeline list)
2. `BUILD_STEP_LABELS` array in `WorkspacePreviewPanel.tsx` (progress bar label)
3. `setBuildStep(N)` call in `useAppStore.ts` `done` handler (N = "Preparing Preview" index)
4. Progress % divisor: use `BUILD_STEP_LABELS.length` not a hardcoded 6

## ProjectBlueprint Fields (V2)
New fields added in both `agents.ts` (server) and `builderService.ts` (client):
- `authProvider: string` — e.g. "JWT", "OAuth", "Clerk"
- `entities: string[]` — domain model nouns
- `relationships: string[]` — e.g. ["User has many Posts"]
- `navigation: string[]` — route/page names
- `features: string[]` — feature flags

## File Merge Pattern
`allFiles = [...projectFiles.filter(f => f.name !== 'README.md'), ...backendFiles, ...dbFiles, ...authFiles, generateEnvExample(), generateReadme()]`
The README.md from `buildServerProjectFiles` is replaced by the richer README from `generateReadme(blueprint)`.

## Parallel Agent Guard
Each of the 3 conditional agents has an independent `.catch()` — a single agent failure does NOT abort the entire pipeline.
