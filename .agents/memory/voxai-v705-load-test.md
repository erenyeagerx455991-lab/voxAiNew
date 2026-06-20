---
name: VoxAI V7.0.5 Real Build Load Test Findings
description: Real measured build throughput and timing data from live LLM pipeline test runs.
---

## Root Cause Fixed
`setContext is not defined` ReferenceError in structuredLogger.ts.
The `export { ... } from` syntax does NOT create a local binding accessible within the same file under esbuild.
Fix: change to `import { ... } from "..."` + `export { ... }` (local import first, then re-export).

## Real Build Timing (1 concurrent user, 2026-06-20)

| Step | Agent | Duration |
|---|---|---|
| 0 | Planner | 1,441ms |
| 1 | Architecture | 893ms |
| 2 | Design | 1,977ms |
| 3 | Frontend | 15,784ms |
| 4 | Code Fix | **65,036ms** ← dominant |
| 5 | Backend | 28,392ms |
| 6 | Database | 2,376ms (parallel) |
| 7 | Auth | 2,683ms (parallel) |
| 8 | Scaffold | ~0ms |
| 9 | Runtime | NOT MEASURED (bash timeout) |

Total steps 0–8: ~114,692ms. Full build >115s.

## Key Numbers
- Queue wait (server-side): 1ms (in-memory mode)
- Queue wait (client-observed): 121ms (SSE header flush)
- Tokens per build (incomplete): ~35,332 (Groq 32,681 + OR 2,651)
- Daily Groq budget consumed per build: ~1.6%
- Max safe daily builds (Groq limit): ~57 builds/day
- Lower bound builds/min per worker: ~0.41

## Concurrency Limits
- Per-user concurrent limit: 2 (LIMIT_MAX_ACTIVE)
- Worker slots: 3 (WORKER_CONCURRENCY)
- User limit binds before worker limit for same-IP requests

## What Couldn't Be Measured
- Full build duration (step 9 Runtime Agent not observed)
- Server heap growth (no /api/diagnostics/memory endpoint)
- 3+ concurrent builds (token cost + time constraints)
- P95 latency (only 1 completed build observed)

**Why:** esbuild `export { X } from "..."` does NOT create a local binding for X within the same module. Always use `import { X } from "..."` + `export { X }` when you need both local access and re-export in the same file.
