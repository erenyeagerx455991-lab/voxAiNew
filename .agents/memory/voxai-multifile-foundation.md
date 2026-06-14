---
name: VoxAI Multi-File Foundation
description: Architecture Agent, generateProjectFiles, Lucide CDN global bridge, 6-step pipeline layout
---

## Pipeline step numbers (must stay in sync across agents.ts, ChatView, WorkspacePreviewPanel, mockAiService)

| Step | Agent | Color |
|------|-------|-------|
| 0 | Planner Agent | violet→purple |
| 1 | Architecture Agent | fuchsia→pink |
| 2 | Design Agent | pink→rose |
| 3 | Frontend Agent | blue→cyan |
| 4 | Code Fix Agent | emerald→teal |
| 5 | Preparing Preview | amber→orange |

`mockAiService.ts` fires `onStep?.(5)` on the `done` SSE event (client-side only). The backend fires 0–4 via SSE `step` events.

## Architecture Agent

Uses `PLANNER_MODEL` (Groq llama-3.3-70b-versatile), not DESIGN_MODEL. Runs after Planner in agents.ts. Outputs `ProjectBlueprint` JSON. Has a graceful fallback (uses PageBlueprint fields) if the LLM fails to parse.

**Why:** Gives the Files tab real page/component names and decides whether auth/dashboard/routing are needed.

## Lucide React in preview iframe

The preview HTML loads Lucide via UMD CDN (`unpkg.com/lucide-react@latest/dist/umd/lucide-react.js`), then runs a bridge script:
```js
if (window.lucideReact) {
  Object.keys(window.lucideReact).forEach(key => {
    if (/^[A-Z]/.test(key)) window[key] = window.lucideReact[key];
  });
}
```
This makes all icon components (`ChevronRight`, `ArrowRight`, etc.) available as globals so generated JSX `<ChevronRight />` works without imports.

**Why:** The preview is a single Babel-transformed JSX blob — no bundler, no imports. Globals are the only way to provide icon components.

**How to apply:** CODEFIX_SYSTEM must NOT strip Lucide icon JSX. buildCodeSystem must instruct the model to use them.

## generateProjectFiles()

Located in `builderService.ts`. Takes `(code, projectBlueprint?, sectionOrder?)` and returns ~10+ `ProjectFile` objects. Extracts component functions by matching `^function [A-Z]\w+\s*\(\s*\)` at line start. Converts `React.useState` → `useState` for the per-file exports. Adds `lucide-react` import per file based on icon detection. Uses React Router in App.tsx only when `pages.length > 1` and at least 2 page components are detected.

**Why:** Produces a realistic file tree without requiring a separate code-splitting LLM pass.
