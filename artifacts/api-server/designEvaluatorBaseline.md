# V7.1.4 — Design Evaluator Baseline Audit (Phase 1)

**Date:** June 23, 2026
**Purpose:** Document the current build pipeline output locations, existing retry/repair systems, and integration points for the Design Evaluator Agent.

---

## Current Build Pipeline — Exact File Map

```
artifacts/api-server/src/agents/pipeline/buildPipeline.ts  (orchestrator)
    ↓ runPlannerStep()       → plannerStep.ts
    ↓ runArchitectureStep()  → architectureStep.ts
    ↓ runFrontendStep()      → frontendStep.ts
    ↓ runRepairStep()        → repairStep.ts          ← FINAL JSX OUTPUT
    ↓ runBackendStep()       → backendStep.ts
    ↓ runRuntimeValidationStep() → runtimeValidationStep.ts
    ↓ SSE done event { code: repairedFrontend.fixedCode, files: runtimeResult.allFiles }
```

---

## Final Output Locations

| Output | Variable | File | Line |
|--------|----------|------|------|
| Raw generated JSX | `generatedCode` | `frontendStep.ts` | ~162 |
| CodeFix pass output | `fixedCode` | `frontendStep.ts` | ~186 |
| Structural repair output | `repairedFrontend.fixedCode` | `repairStep.ts` (returned) | ~129 |
| Multi-file project output | `repairedFrontend.projectFiles` | `repairStep.ts` (returned) | ~129 |
| SSE done code payload | `repairedFrontend.fixedCode` | `buildPipeline.ts` | ~68 |

The **Design Evaluator insertion point** is between `runRepairStep()` (line 46) and `runBackendStep()` (line 50) in `buildPipeline.ts`.

---

## Existing Retry Systems

### 1. Design Agent Retry (frontendStep.ts, lines 103–129)
- **Trigger:** DNA verification fails against reference site requirements
- **Max retries:** 1 (attempt1 → attempt2 only)
- **Input:** DesignDNA JSON output from Design Agent
- **Output:** Same DesignDNA type, corrected values
- **SSE events:** `design_retry` (on failure), `step: 2 done` (on completion)

### 2. Structural Repair Loop (repairStep.ts, lines 31–78)
- **Trigger:** `validateTsxFile()` returns `valid: false` for any TSX file
- **Max passes:** 3 (`MAX_REPAIR_PASSES = 3`, line 13)
- **Input:** Individual TSX files with compile-level issues
- **Output:** Repaired file content (mutates `file.content`)
- **SSE events:** `build_health` (post-repair metrics), `runtime_validate` (if runtime issues)
- **Model:** callAI() with `label: repair:{filename}`, `maxTokens: 1500`
- **Telemetry:** `recordRepairAttempt()`, `recordRepairSuccess()`, `recordRepairFailure()`

### 3. Runtime Repair System (runtimeValidationStep.ts)
- **Trigger:** Runtime score < threshold after Vite build
- **Scope:** Validates compiled output, not raw JSX
- **SSE events:** `runtime_validate`

---

## Existing Quality Tracking

### qualityMetrics.ts
Fields tracked per build:
- `designScore` — was a placeholder 0–10 from DNA source (not computed from code analysis)
- `accessibilityScore` — placeholder
- `shadcnUsage` — placeholder
- `componentReuse` — placeholder
- `heroVariantUsed` — from design.heroStyle
- `designDNAUsed` — from design.designLanguage

**Key gap:** `designScore` has never been computed from actual output code — it was set by the caller with estimated values. V7.1.4 will compute it programmatically.

### repairMetrics.ts
Tracks: attempts, successes, failures, repair pass counts. Persists to `globalMetrics` via `setSection('repairs', ...)`.

---

## SSE Event Inventory (Pre-V7.1.4)

| Event type | Emitted from | Purpose |
|-----------|-------------|---------|
| `step` | all steps | Step lifecycle |
| `token` | plannerStep | Plan text streaming |
| `codegen_token` | frontendStep | Code streaming |
| `dna_composition` | plannerStep | DNA fusion result |
| `design_retry` | frontendStep | DNA retry trigger |
| `design_agent_error` | frontendStep | DNA parse failure |
| `template_selected` | plannerStep | Template match |
| `registry_selection` | frontendStep | Registry picks |
| `build_health` | repairStep | Validation scores |
| `runtime_validate` | repairStep | Runtime issues |
| `registry_health` | repairStep | Registry coverage |
| `done` | buildPipeline | Final output |

**V7.1.4 adds:** `design_eval_start`, `design_eval_result`, `design_repair_start`, `design_repair_done`

---

## Integration Plan

```
Current:   Planner → Architecture → Frontend → Repair → Backend → RuntimeValidation → done
V7.1.4:   Planner → Architecture → Frontend → Repair → DesignEvaluator → Backend → RuntimeValidation → done
```

- DesignEvaluator receives `FrontendOutput` from repairStep
- Returns `EvaluatorStepOutput extends FrontendOutput` (backward compatible)
- Passes improved `fixedCode` to backendStep if repair was applied
- Telemetry integrates into existing `qualityMetrics.ts` (extends `recordQualityScore`)
- No new endpoints, no schema changes, no queue changes
