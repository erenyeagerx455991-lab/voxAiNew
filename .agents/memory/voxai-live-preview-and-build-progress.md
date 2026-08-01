---
name: VoxAI Live Preview & Build Progress UI
description: Live preview iframe security/viewport/console system and polished SSE build progress indicators
---

## Live Preview System (WorkspacePreviewPanel.tsx)

### Iframe security fix
- Removed `allow-same-origin` from iframe sandbox — now uses `sandbox="allow-scripts"` only.
- Generated app cannot access parent window cookies/localStorage.

### Viewport simulation
- State: `viewport: 'mobile' | 'tablet' | 'desktop'` (default `'desktop'`).
- Mobile = 375px frame, Tablet = 768px frame, Desktop = fills container.
- Non-desktop modes render inside a device chrome wrapper with traffic light dots.

### Console capture
- `buildPreviewHtml()` in `builderService.ts` already overrides `console.log/warn/error/info` in the generated app's `<head>` to `postMessage` events of type `console_log` to the parent.
- `WorkspacePreviewPanel.tsx` listens for `console_log` events and appends to `consoleLogs[]` (capped at 200).
- Console panel is collapsible, 144px tall at bottom, colored by level.
- Red dot badge on the console toggle icon when any error entries exist.

### Other preview additions
- `refreshKey` state — increments on Refresh click, forces iframe key change without rebuild.
- `iframeLoading` state — shows spinner overlay while iframe initialises.
- `isFullscreen` state — makes outer div `fixed inset-0 z-50`.
- Auto-clear: `consoleLogs` and `runtimeError` banner reset when `serverFiles.length` or `code` changes.
- Fake address bar showing `nexogen://preview`.

---

## Build Progress UI Upgrade

### SSE data plumbing
- `mockAiService.ts`: `onStep` callback now `(step: number, agent?: string, status?: string)`.
- Both `mockStreamResponse` (line ~126) and `mockEditResponse` (line ~317) forward `json.agent` and `json.status` from SSE `type:"step"` events.

### State additions in useAppStore.ts
- `buildAgentName: string` and `buildAgentStatus: string` added to `AppState` interface and as `useState('')` variables.
- `handleStep(step, agent?, status?)` updates all three.
- Reset to `''` added in `handleError`.

### AgentPipeline redesign (ChatView.tsx)
- Self-contained elapsed timer via `setInterval` inside the component.
- Header row: label + elapsed time (e.g. `43s`) + percentage.
- 3px gradient progress bar (violet→fuchsia→indigo for build; blue→cyan for edit).
- Per-step row: 20×20 icon (done=gradient circle+checkmark, active=ping animation ring+spinner or `!` for error/warn, pending=gray dot), label, status badge (running/warn/error).
- Footer: "X / N agents done".
- `agentStatus === 'error'` → red ring, red label, "error" badge.
- `agentStatus === 'warn'` → yellow ring, yellow label, "warn" badge.

### BuildingState redesign (WorkspacePreviewPanel.tsx)
- SVG arc ring (r=44, circumference-based strokeDashoffset) with `linearGradient` violet→fuchsia→indigo.
- Ring centre shows `pct%` and elapsed time in mono font.
- Step label below ring with smooth `transition-all duration-500`.
- Step pip row: completed=2×2 indigo dot, active=3×2 violet dot with glow shadow, pending=2×2 gray dot.
- Still has skeleton preview blocks above the ring.

**Why:** `agentStatus` ('active'/'done'/'warn'/'error') was sent by the SSE pipeline but completely ignored by the frontend. Now it drives visual state in the progress panel.
