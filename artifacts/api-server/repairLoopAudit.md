# V7.1.4 — Repair Loop Safety Audit (Phase 7)

**Date:** June 23, 2026

---

## All Repair Loops in the System (Post-V7.1.4)

| Loop | File | Max Passes | Trigger | Termination Guarantee |
|------|------|-----------|---------|----------------------|
| Design Agent Retry | frontendStep.ts | 1 retry (2 total) | DNA verification failure | `attempt1` then `attempt2` — no loop |
| Structural Repair | repairStep.ts | 3 | `validateTsxFile()` returns invalid | `for (let pass = 0; pass < 3; pass++)` — bounded for loop |
| **Design Evaluator Repair** | designEvaluatorStep.ts | **2** | `overallScore < 8.0` | See analysis below |

---

## Design Evaluator Repair Loop — Safety Analysis

### Code Structure
```typescript
const MAX_DESIGN_REPAIR_PASSES = 2;  // exported constant, tested in unit tests

while (evalResult.overallScore < REPAIR_THRESHOLD && repairCount < MAX_DESIGN_REPAIR_PASSES) {
  repairCount++;
  // ... repair pass ...
  if (repairResult.attempted && !repairResult.error) {
    // re-evaluate — evalResult is reassigned
  } else {
    break;  // immediate exit on repair failure
  }
}
```

### Termination Proof

**Case 1 — Score improves above threshold after pass 1:**
- Pass 1: score 6.5 → 8.2. Loop condition `8.2 < 8.0` is false. Loop exits after 1 pass. ✓

**Case 2 — Score never reaches threshold:**
- Pass 1: score 6.5 → 7.0. Condition `7.0 < 8.0 && 1 < 2` → continue.
- Pass 2: score 7.0 → 7.4. Condition `7.4 < 8.0 && 2 < 2` → **false** (`repairCount` is now 2, not `< 2`). Loop exits. ✓

**Case 3 — Repair produces error:**
- Pass 1: `runDesignRepair()` returns `{ error: "..." }`. `break` executed immediately. ✓

**Case 4 — LLM makes code worse (score decreases):**
- `evalResult` is reassigned from `evaluateDesign()` (pure function) after each pass.
- Even if score decreases, `repairCount` still increments.
- Loop exits after `MAX_DESIGN_REPAIR_PASSES` regardless of score direction. ✓

**Case 5 — Infinite loop via external mutation:**
- `evaluateDesign()` is a **pure function** — same input always returns same output.
- `repairCount` is a local variable incremented monotonically — cannot decrease.
- `MAX_DESIGN_REPAIR_PASSES` is a compile-time constant (not configurable at runtime). ✓

### Infinite Loop: Impossible ✓

---

## Combined Repair Budget (Worst Case)

For a single build where everything fails:

| Repair Type | Passes | LLM Calls | Model |
|-------------|--------|-----------|-------|
| Design Agent Retry | 1 | 1 | OpenRouter (Design model) |
| Structural Repair (3 files failing) | 3 passes × 3 files | 9 | OpenRouter (repair) |
| Design Evaluator Repair | 2 | 2 | OpenRouter (repair, 8000 tokens) |
| **Total worst case** | — | **12** | — |

Typical case: 0–2 structural repairs + 0–1 design repair = 1–3 LLM calls beyond normal pipeline.

---

## Score Re-evaluation After Repair

After each design repair pass, `evaluateDesign()` is called again on the updated code. This:
1. Provides an accurate measurement of improvement (not estimated)
2. Can detect if repair made things worse (no protection needed — loop exits anyway after max passes)
3. Emits `design_repair_done` SSE with `prevScore`, `newScore`, and `improvement` delta

The re-evaluation uses the same deterministic scoring logic as the initial evaluation — no LLM involved in scoring.

---

## Telemetry Tracking

Every repair loop invocation records:
- `repairCount` — 0, 1, or 2
- `repairApplied` — true only if at least one pass succeeded without error
- `overallScore` — final score after all repair passes
- Score distribution bucket (excellent / productionReady / good / needsImprovement / repairRequired)

These are queryable via `GET /api/telemetry/metrics` → `runtime.evaluator.repairStats`.
