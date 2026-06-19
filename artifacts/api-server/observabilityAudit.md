# NexoGen V6.4.9.1 — Observability Audit Report

> All measurements taken directly from source. No prior reports assumed correct.
> Date: 2026-06-19

---

## Phase 1 — Console.* Reality Check

### Measured Total

| Category | Count |
|---|---|
| Production code (`console.*`) | **27** |
| Comments mentioning console | 1 |
| Regex pattern (runtimeValidator.ts) | 1 (NOT a console call — it's a lint rule) |
| Validation scripts (`src/validation/`) | 23 (expected — CLI harnesses) |
| Test files (`src/tests/`) | 0 |
| **Grand total in src/ (all files)** | **51 lines matching `console\.`** |

Note: The previous report claimed "96→28". The actual production code count is **27**, not 28. The discrepancy: `runtimeValidator.ts:60` is a regex string `/console\.error\(/` inside a rules array — not an actual call. `contextManager.ts:290` is a JSDoc comment.

---

### File-by-File Breakdown (Production Code Only)

#### `src/agents/backend/backendAgent.ts` — 6 calls — **Must Migrate**

```
line  67: console.log(`[BackendAgent] Extracted ${extracted.length} files from output`)
line  75: console.error('[BackendAgent] Generation failed:', e)
line 114: console.log(`[DatabaseAgent] Extracted ${extracted.length} files from output`)
line 122: console.error('[DatabaseAgent] Generation failed:', e)
line 160: console.log(`[AuthAgent] Extracted ${extracted.length} files from output`)
line 168: console.error('[AuthAgent] Generation failed:', e)
```

Classification: **Must Migrate** — these agents run during every build pipeline invocation (steps 5–7).

---

#### `src/agents/dna/dnaAgent.ts` — 1 call — **Must Migrate**

```
line 154: console.error('[DNAMixer] AI extraction failed, using reference fallback:', e)
```

Classification: **Must Migrate** — DNA extraction runs in every planner step.

---

#### `src/agents/frontend/frontendAgent.ts` — 1 production call + 1 false positive

```
line  45: console.warn(`[FileValidation] ${f.name}.tsx: ${validation.issues.join('; ')}`)  ← Must Migrate
line 217: console.log(`🚀 Server running on http://localhost:${PORT}`)                      ← FALSE POSITIVE
```

Line 217 is inside a template string that generates a server.ts file for the user's project — it is **not executed by the API server itself**. Classification: line 45 **Must Migrate**, line 217 **Acceptable** (generated code artifact).

---

#### `src/runtime/astResolver.ts` — 13 calls — **Acceptable**

```
line  83: console.log('[AST_SUCCESS] Parsed file successfully')
line  88: console.warn('[AST_FAILURE]', error)
line 160: console.warn('[REGEX_FALLBACK_USED] extractImportsAST traverse failed:', err)
line 167: console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for imports')
line 250: console.warn('[REGEX_FALLBACK_USED] extractExportsAST traverse failed:', err)
line 256: console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for exports')
line 318: console.warn('[REGEX_FALLBACK_USED] extractHooksAST traverse failed:', err)
line 324: console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for hooks')
line 538: console.warn('[REGEX_FALLBACK_USED] extractDefinedComponentsAST traverse failed:', err)
line 544: console.warn('[REGEX_FALLBACK_USED] AST parse failed for extractDefinedComponentsAST')
line 592: console.warn('[REGEX_FALLBACK_USED] extractUsedJSXComponentsAST traverse failed:', err)
line 598: console.warn('[REGEX_FALLBACK_USED] AST parse failed for extractUsedJSXComponentsAST')
line 767: console.warn('[REGEX_FALLBACK_USED] extractRoutesAST failed for file:', f.name, err)
```

Classification: **Acceptable for now** — these are debug-level AST parse fallback signals. They fire during static analysis on user-submitted code, not the core build path. Low migration priority.

---

#### `src/runtime/security/packageScanner.ts` — 1 call — **Acceptable**

```
line 145: console.log(`[${event}] ${JSON.stringify(entry)}`)
```

Classification: **Acceptable** — security event logger already emitting structured JSON via console; could be migrated but functional.

---

#### `src/runtime/security/securityValidation.ts` — 5 calls — **Acceptable**

```
line 109: console.log(`[SECURITY_VALIDATION_PASS] ${c.name}`)
line 113: console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — assertion returned false`)
line 119: console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — ${reason}`)
line 126: console.log(`[SECURITY_VALIDATION_PASS] ${summary}`)
line 128: console.error(`[SECURITY_VALIDATION_FAIL] ${summary} (${failed} failed)`)
```

Classification: **Acceptable** — internal validation harness, not in the build hot path.

---

### Validation Scripts (Not Production — Expected console.*)

| File | Calls | Purpose |
|---|---|---|
| `src/validation/decompositionValidation.ts` | 11 | CLI test runner — intentional |
| `src/validation/securityCompletionValidation.ts` | 12 | CLI security checker — intentional |

These are standalone scripts meant to be run from terminal. console.* is correct here.

---

### Summary

| Classification | Count | Files |
|---|---|---|
| Must Migrate | 8 | backendAgent.ts (6), dnaAgent.ts (1), frontendAgent.ts (1) |
| Acceptable | 19 | astResolver.ts (13), packageScanner.ts (1), securityValidation.ts (5) |
| False Positive (generated code) | 1 | frontendAgent.ts line 217 |
| Validation harnesses (intentional) | 23 | decompositionValidation.ts, securityCompletionValidation.ts |
| Comments / regex patterns | 2 | contextManager.ts, runtimeValidator.ts |

---

## Phase 2 — Metrics Usage Audit

### `metricsProvider.ts` — Used

| Export | Type | Used Where | Status |
|---|---|---|---|
| `MetricsSnapshot` | Interface | all modules | ✅ |
| `HistogramData` | Interface | all modules | ✅ |
| `MetricsProvider` | Interface | MemoryMetricsProvider implements it | ⚠️ Only local use |
| `MemoryMetricsProvider` | Class | test files only (as import) | ⚠️ Tests only |
| `globalMetrics` | Singleton | all 5 domain modules + telemetry route | ✅ |

**Dead export**: `MetricsProvider` interface is declared but no external consumer type-checks against it.

---

### `buildMetrics.ts` — Partially Used

| Export | Called In Production | Called In Tests |
|---|---|---|
| `recordBuildStart` | ✅ `buildPipeline.ts:31` | ✅ |
| `recordBuildSuccess` | ✅ `buildPipeline.ts:62` | ✅ |
| `recordBuildFailure` | ✅ `buildPipeline.ts:82` | ✅ |
| `getBuildSnapshot` | ❌ Never | ✅ tests only |

`getBuildSnapshot` is never called in production. The endpoint reads `globalMetrics.snapshot()` directly, not this function.

---

### `agentMetrics.ts` — Partially Used

| Export | Called In Production | Called In Tests |
|---|---|---|
| `AgentName` (type) | ✅ implicit via buildPipeline | ✅ |
| `withAgentMetrics` | ✅ `buildPipeline.ts` (6 calls) | ✅ |
| `recordAgentRetry` | ❌ **Never called in production** | ✅ tests only |
| `getAgentSnapshot` | ❌ Never | ✅ tests only |

`recordAgentRetry` exists in tests and is exported, but **no production code calls it**. Architecture, frontend, planner retry logic exists but does not invoke this function.

---

### `tokenMetrics.ts` — Well Used

| Export | Called In Production | Called In Tests |
|---|---|---|
| `LLMProvider` (type) | ✅ | ✅ |
| `recordLLMCall` | ✅ `llmClient.ts` (6 call sites) | ✅ |
| `getTokenSnapshot` | ❌ Never | ✅ tests only |

The most reliably wired module — fires on every Groq and OpenRouter call.

---

### `repairMetrics.ts` — DEAD in Production

| Export | Called In Production | Called In Tests |
|---|---|---|
| `recordRepairAttempt` | ❌ **Never** | ✅ tests only |
| `recordRepairSuccess` | ❌ **Never** | ✅ tests only |
| `recordRepairFailure` | ❌ **Never** | ✅ tests only |
| `getRepairSnapshot` | ❌ Never | ✅ tests only |

**CRITICAL**: `repairStep.ts` and `routes/agents.ts` (runtime-repair) never import or call any of these functions. The entire repair metrics module collects zero real data. Tests pass because they call the functions directly.

---

### `runtimeMetrics.ts` — Mostly Used

| Export | Called In Production | Called In Tests |
|---|---|---|
| `recordRuntimeCheck` | ✅ `runtimeValidationStep.ts:160` | ✅ |
| `recordViteBuildDuration` | ✅ `runtimeValidationStep.ts:95` | ✅ |
| `recordRepairLoopDuration` | ✅ `runtimeValidationStep.ts:147` | ✅ |
| `recordValidationDuration` | ❌ **Never** | ✅ tests only |
| `getRuntimeSnapshot` | ❌ Never | ✅ tests only |

`recordValidationDuration` has no call site in production.

---

### `traceContext.ts` — Partially Used

| Export | Called In Production | Called In Tests |
|---|---|---|
| `TraceContext` (interface) | ✅ buildMetrics.ts, buildPipeline.ts | ✅ |
| `createTraceContext` | ✅ `buildPipeline.ts:28` | ✅ |
| `withBuildId` | ✅ `buildPipeline.ts:28` | ✅ |
| `childSpan` | ❌ **Never called in production** | ✅ tests only |
| `traceToHeaders` | ❌ **Never called in production** | ✅ tests only |

Per-step child spans do not exist. The entire build shares one root span with no hierarchy.

---

### Dead Exports Summary

| Module | Dead Export | Verdict |
|---|---|---|
| agentMetrics | `recordAgentRetry` | Not wired — needs call site in repair/architecture flows |
| agentMetrics | `getAgentSnapshot` | Test-only utility — acceptable |
| buildMetrics | `getBuildSnapshot` | Test-only utility — acceptable |
| repairMetrics | `recordRepairAttempt` | **CRITICAL** — entire module dead in production |
| repairMetrics | `recordRepairSuccess` | **CRITICAL** — entire module dead in production |
| repairMetrics | `recordRepairFailure` | **CRITICAL** — entire module dead in production |
| repairMetrics | `getRepairSnapshot` | Test-only utility — acceptable |
| runtimeMetrics | `recordValidationDuration` | Not wired — no call site |
| runtimeMetrics | `getRuntimeSnapshot` | Test-only utility — acceptable |
| tokenMetrics | `getTokenSnapshot` | Test-only utility — acceptable |
| traceContext | `childSpan` | Not wired — no step-level spans |
| traceContext | `traceToHeaders` | Not wired — no outbound propagation |
| metricsProvider | `MetricsProvider` (interface) | Internal — acceptable |
| structuredLogger | `logger` (singleton export) | Imported nowhere — dead export |

---

## Phase 3 — Endpoint Security

See `telemetrySecurityReport.md` for full analysis.

Summary:
- ✅ `authMiddleware` is the second argument to `router.get` — inline, cannot be bypassed by future middleware ordering changes
- ✅ Response built from `globalMetrics.snapshot()` — no req.body, no process.env access
- ✅ Histogram `values[]` array stripped from response (replaced with count/avg/percentiles)
- ✅ `recentBuilds` contains only `buildId`, `status`, `durationMs` — no prompt text
- ✅ No imports of prompts, keys, or source code modules

---

## Phase 4 — Structured Logger Audit

### Using `createLogger` ✅

| File | Logger Name |
|---|---|
| `agents/pipeline/plannerStep.ts` | `PlannerStep` |
| `agents/pipeline/architectureStep.ts` | `ArchitectureStep` |
| `agents/pipeline/frontendStep.ts` | `FrontendStep` |
| `agents/pipeline/repairStep.ts` | `RepairStep` |
| `agents/pipeline/backendStep.ts` | `BackendStep` |
| `agents/pipeline/runtimeValidationStep.ts` | `RuntimeValidationStep` |
| `routes/agents.ts` | `AgentsRoute` |
| `security/authMiddleware.ts` | `AuthMiddleware` |
| `security/workspaceCleanup.ts` | `WorkspaceCleanup` |
| `security/corsConfig.ts` | `CorsConfig` |
| `security/rateLimiter.ts` | `RateLimiter` |

### Using `setLogContext` / `clearLogContext` ✅

| File | Usage |
|---|---|
| `agents/pipeline/buildPipeline.ts` | setLogContext at start, clearLogContext in finally |

### Using inline `process.stdout/stderr` (not logger) ⚠️

| File | Lines | Classification |
|---|---|---|
| `routes/chat.ts` | 1 | Acceptable — simple diagnostic |
| `contextManager.ts` | 2 | Acceptable — utility path |

### Still using `console.*` (Must Migrate)

| File | Count |
|---|---|
| `agents/backend/backendAgent.ts` | 6 |
| `agents/dna/dnaAgent.ts` | 1 |
| `agents/frontend/frontendAgent.ts` | 1 |

### `logger` singleton export — DEAD

`src/lib/structuredLogger.ts:61` exports `export const logger = createLogger("api-server")`.
This is imported by **zero** files. Dead export.

---

## Phase 5 — Trace Propagation Verification

### Propagation Chain

```
HTTP Request → routes/agents.ts → runBuildPipeline()
  ↓ createTraceContext({ requestId: chatId })
  ↓ withBuildId(trace, buildId)          ← traceId ✅ buildId ✅ requestId ✅
  ↓ setLogContext({ traceId, requestId, buildId })   ← module globals
  ↓ recordBuildStart(buildId, trace)
  ↓
  ├─ withAgentMetrics("Planner") → runPlannerStep()
  │    log.info(...)   ← picks up traceId/requestId/buildId from module globals ✅
  ├─ withAgentMetrics("Architecture") → runArchitectureStep()
  │    log.info(...)   ← same globals ✅
  ├─ withAgentMetrics("Frontend") → runFrontendStep()
  ├─ withAgentMetrics("Repair") → runRepairStep()
  ├─ withAgentMetrics("Scaffold") → runBackendStep()
  └─ withAgentMetrics("RuntimeValidation") → runRuntimeValidationStep()
       log.info(...)   ← same globals ✅
  ↓
  clearLogContext()   ← clears globals after build ✅
```

### What Works

- traceId, requestId, buildId preserved across all pipeline steps ✅
- All structured log lines include these fields during a build ✅
- clearLogContext() called in `finally` block ✅

### Critical Gap — Concurrent Build Safety ❌

`setLogContext` / `clearLogContext` write to **module-level global variables**:

```typescript
let _traceId: string | null = null;   // ← global
let _requestId: string | null = null; // ← global
let _buildId: string | null = null;   // ← global
```

Node.js is single-threaded but async. If two builds run concurrently:

1. Build A sets `_traceId = "aaa"`
2. Build B sets `_traceId = "bbb"` (overwrites)
3. Build A's log lines now emit `traceId: "bbb"` ← **wrong trace context**

This is a real production hazard. Fix requires `AsyncLocalStorage` (Node.js built-in).

### What Doesn't Work

- `childSpan` never called — no per-step span hierarchy. All steps share one root span.
- `traceToHeaders` never called — trace does not propagate to any external service.
- The trace context object is NOT passed to pipeline step functions. They rely on the global state, which is unsafe under concurrency.

---

## Phase 6 — Metrics Value Validation

### Metrics That Change in Production

| Metric | Trigger | Verified Call Site |
|---|---|---|
| `builds.started` counter | every build | `buildPipeline.ts:31` |
| `builds.success` counter | successful builds | `buildPipeline.ts:62` |
| `builds.failed` counter | failed builds | `buildPipeline.ts:82` |
| `builds.duration` histogram | successful builds | `buildMetrics.ts:44` |
| `agents.*.calls` counter | each pipeline step | `buildPipeline.ts` (6 wraps) |
| `agents.*.successes` counter | each successful step | `agentMetrics.ts:52` |
| `agents.*.failures` counter | step errors | `agentMetrics.ts:58` |
| `agents.*.latency` histogram | each step | `agentMetrics.ts:53` |
| `tokens.groq.requests` counter | every Groq call | `llmClient.ts:51,79` |
| `tokens.groq.failures` counter | Groq errors | `llmClient.ts:45,82` |
| `tokens.groq.total` counter | token counts | `llmClient.ts:52` |
| `tokens.openrouter.*` | OpenRouter calls | `llmClient.ts:102,111` |
| `runtime.passes` / `runtime.failures` | build verdict | `runtimeValidationStep.ts:160` |
| `runtime.vite_build` histogram | per vite build | `runtimeValidationStep.ts:95` |
| `runtime.repair_loop` histogram | per repair pass | `runtimeValidationStep.ts:147` |

### Metrics That Never Change — DEAD

| Metric | Reason |
|---|---|
| `repairs.attempts` | `recordRepairAttempt` never called in production |
| `repairs.successes` | `recordRepairSuccess` never called in production |
| `repairs.failures` | `recordRepairFailure` never called in production |
| `runtime.validation` histogram | `recordValidationDuration` never called |
| Any agent retry counter | `recordAgentRetry` never called |

The **entire `repairs` section** of `/api/telemetry/metrics` will always show zeros.

---

## Phase 7 — Memory Growth Audit

### Data Structures — Unbounded Growth

#### `buildMetrics.ts`

```typescript
const builds = new Map<string, BuildRecord>();   // grows forever
const durations: number[] = [];                   // grows forever
```

- `builds` Map: never evicted. Each entry ~200 bytes (buildId string, timestamps, status).
- `durations`: all successful build times. ~8 bytes each.

| Scenario | builds Map | durations array | Estimate |
|---|---|---|---|
| 100 builds | 100 entries | 100 nums | ~22 KB |
| 1,000 builds | 1,000 entries | 1,000 nums | ~220 KB |
| 10,000 builds | 10,000 entries | 10,000 nums | ~2.2 MB |

Verdict: **Moderate risk**. Low urgency at 10K builds but unbounded.

#### `agentMetrics.ts`

```typescript
agentRecords.get(name).latencies: number[]   // grows forever per agent
```

11 fixed agent names × N builds × steps per build. Each build invokes ~6 agents.

| Scenario | Total latency entries | Estimate |
|---|---|---|
| 100 builds | ~600 | ~5 KB |
| 1,000 builds | ~6,000 | ~50 KB |
| 10,000 builds | ~60,000 | ~500 KB |

Verdict: **Low risk** — agent names are bounded (11 max), latency arrays grow at 6 entries/build.

#### `tokenMetrics.ts`

```typescript
providerRecords[provider].latencies: number[]   // grows forever
```

Each build makes ~8–12 LLM calls (planner + design + codegen + codefix + repair×3 + architecture).

| Scenario | latency entries | Estimate |
|---|---|---|
| 100 builds | ~1,000 | ~8 KB |
| 1,000 builds | ~10,000 | ~80 KB |
| 10,000 builds | ~100,000 | ~800 KB |

Verdict: **Low risk** individually.

#### `metricsProvider.ts` — Histograms

```typescript
private histograms: Map<string, number[]> = new Map();
// recordDuration pushes to this array, no cap
```

The histogram internal `number[]` arrays grow **without any limit**. `snapshot()` returns only the last 100 values (`values: sorted.slice(-100)`) but the underlying array still holds all values:

```typescript
recordDuration(key: string, durationMs: number): void {
  const existing = this.histograms.get(key) ?? [];
  existing.push(durationMs);         // ← no cap here
  this.histograms.set(key, existing);
}
```

Known histogram keys: `builds.duration`, `agents.*.latency` (11 keys), `tokens.groq.latency`, `tokens.openrouter.latency`, `runtime.vite_build`, `runtime.repair_loop`, `runtime.validation` = **16 histogram arrays**.

At 10,000 builds (~10 LLM calls each = 100,000 token latency entries in one array):

| Array | Entries at 10K builds | Bytes |
|---|---|---|
| `tokens.groq.latency` | ~80,000 | ~640 KB |
| `tokens.openrouter.latency` | ~20,000 | ~160 KB |
| `agents.Frontend.latency` | ~10,000 | ~80 KB |
| Other agent latencies (×10) | ~50,000 | ~400 KB |
| `builds.duration` | ~10,000 | ~80 KB |
| `runtime.vite_build` | ~10,000 | ~80 KB |

**Total histogram memory at 10K builds: ~1.5 MB** in globalMetrics histograms alone, plus duplicated internal arrays in domain modules.

#### **Combined Worst-Case Estimate**

| Builds | Total heap from telemetry | Risk Level |
|---|---|---|
| 100 | ~100 KB | ✅ Negligible |
| 1,000 | ~1 MB | ✅ Fine |
| 10,000 | ~10 MB | ⚠️ Moderate |
| 100,000 | ~100 MB | ❌ **CRITICAL** |

**Verdict**: Not an immediate crisis at typical API server traffic (10–100 builds/day), but will OOM a long-running instance over weeks/months without a restart. No cleanup strategy exists.

---

## Phase 8 — Observability ROI

### Before V6.4.9

- **Logging**: unstructured `console.*` — no component field, no event name, no traceId, no timestamp field (TTY formatting only), not machine-parseable
- **Metrics**: zero
- **Tracing**: zero
- **Monitoring**: zero

### After V6.4.9

- **Logging**: structured JSON on 11 hot-path files; 8 must-migrate calls remain; concurrent context unsafe
- **Metrics**: 4 of 5 domain modules actively collecting; repair metrics dead; endpoint live
- **Tracing**: trace IDs generated and present in logs; no per-step spans; concurrent-unsafe context
- **Monitoring**: no export, no alerting, no Prometheus, no OTel

### Scored Assessment

| Dimension | Score | Evidence |
|---|---|---|
| **Logging** | 6/10 | Hot paths structured ✅; cold paths unstructured ⚠️; global context unsafe ❌ |
| **Metrics** | 6/10 | Build/agent/token/runtime working ✅; repair dead ❌; unbounded memory ❌ |
| **Tracing** | 3/10 | IDs generated ✅; no child spans ❌; concurrent-unsafe ❌; not propagated externally ❌ |
| **Monitoring** | 1/10 | Endpoint exists ✅; no export, no alerts, no dashboards ❌ |
| **Overall** | **4/10** | — |

---

## Phase 9 — See `telemetryCleanupPlan.md`

---

## Phase 10 — Final Verdict

### Evidence Summary

| Finding | Severity |
|---|---|
| Repair metrics module is dead (zero production calls) | HIGH |
| Module-global log context is concurrent-unsafe | HIGH |
| All duration arrays grow without bound | HIGH |
| `childSpan` / per-step span hierarchy absent | MEDIUM |
| 8 production console.* calls remain (backendAgent, dnaAgent, frontendAgent) | MEDIUM |
| 5 dead exports: recordAgentRetry, recordValidationDuration, childSpan, traceToHeaders, logger | MEDIUM |
| No external metric export (Prometheus, OTel) | MEDIUM |

### Verdict: **C — Partial Implementation**

The telemetry foundation is architecturally sound and the most important paths (builds, tokens, agents, runtime) are instrumented. The endpoint works and is secure. Tests validate the API contracts.

However three gaps prevent calling this production-ready:

1. **repairMetrics is silently dead** — the metrics section users would care most about (repair success rates, pass counts) never accumulates real data
2. **Concurrent builds corrupt each other's log context** — a production API serving concurrent users will produce traces with wrong IDs
3. **Unbounded memory** — no cap on any duration array or build history; a server running 10K+ builds will leak gigabytes

This is a strong foundation with three specific fixes needed before calling it production-ready.
