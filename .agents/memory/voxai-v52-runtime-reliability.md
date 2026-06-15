---
name: VoxAI V5.2 Runtime Reliability Layer
description: 6-phase runtime safety system — moves from "compiles" to "actually runs"; covers static analysis, Error Boundary, postMessage capture, auto-repair, safe prompt rules, BuildHealth V2.
---

## What was built

**Phase 1 — runRuntimeValidator() in agents.ts**
Static analysis runs after compile validation. Detects: unsafe `.map()` without Array.isArray guard, hooks called conditionally, `useState()` with no initial value for vars used in `.map()`, route/import mismatches in App.tsx. Emits `runtime_validate` SSE with issues list.

**Phase 2 — buildPreviewHtml() enhanced in builderService.ts**
- `__reportRuntimeError(msg, stack, file, component)` helper posts to `window.parent` via `postMessage({type:'runtime_error',...})` before showing the error UI.
- `window.addEventListener('error', ...)` and `window.addEventListener('unhandledrejection', ...)` both call `__reportRuntimeError`.
- `__NexoErrorBoundary` class component wraps `<App>` — catches render-time crashes via `componentDidCatch`, also calls `__reportRuntimeError`.
- `appRoot.render(React.createElement(__NexoErrorBoundary, null, React.createElement(App)))` replaces bare App render.

**Phase 3 — POST /agents/runtime-repair endpoint in agents.ts**
- Uses `REPAIR_MODEL = "llama-3.1-8b-instant"` (fast surgical repair).
- Finds failing file by name match. Passes up to 2 dependency files for context.
- Max 3 attempts enforced server-side.
- Returns SSE stream with `runtime_repair_done` event containing repaired files or failure message.
- `runtimeRepair()` function in mockAiService.ts handles the SSE streaming and callbacks.

**Phase 4 — SAFE_CODING_RULES in buildCodeSystem() prompt (agents.ts)**
Added rules 10-14 to the codegen system prompt:
- Always use `Array.isArray()` before `.map()`
- Always use optional chaining `?.`
- Always provide `useState()` initial values matching type
- Never call hooks conditionally
- Always add default prop values

**Phase 5 — validateRoutes() in agents.ts**
Checks App.tsx imports and route `element={<Comp />}` references against the set of actually generated component files. Logs issues. `routesValid` boolean included in build health metrics.

**Phase 6 — BuildHealth V2 interface + BuildHealthPanel V2**
BuildHealth interface extended with: `runtimeScore`, `runtimeErrors`, `filesValidated`, `runtimeRepairAttempts`, `routesValid`.
BuildHealthPanel now shows: Compile%, Runtime%, Routes (ok/err), RT Issues, Repairs, Tokens.
Overall score = avg(compileScore, runtimeScore).

## Client-side wiring
- `WorkspacePreviewPanel.tsx`: `useRef<HTMLIFrameElement>` + `useEffect(() => window.addEventListener('message', ...))` captures postMessage. Runtime error banner shown inline above iframe with dismiss button.
- `useAppStore.ts`: `onRuntimeError` callback stores error AND auto-triggers `runtimeRepair()` from mockAiService; on success applies repaired files and persists to localStorage; runtimeRepairAttempt counter prevents infinite loops.
- `App.tsx`: passes `onRuntimeError={store.onRuntimeError}` to WorkspacePreviewPanel.

## Why
Compile validation only catches syntax errors. Real crashes happen at runtime: undefined.map(), hook-in-conditional, route references to non-existent components. This layer catches and auto-repairs those in production previews.

## Key constraints
- `REPAIR_MODEL = "llama-3.1-8b-instant"` — fast/cheap for repair, not deepseek or 70b.
- Max 3 runtime repair attempts enforced both server (returns 200+repaired:false) and client (runtimeRepairAttempt counter).
- postMessage uses `'*'` as targetOrigin (sandboxed iframe, safe for error reporting only).
- Error Boundary class must be in the Babel-compiled script block (not in user code), hence it's injected as `__NexoErrorBoundary` in the template string.
