# V7.1.4 — Design Evaluator Architecture (Phase 2)

**Date:** June 23, 2026

---

## Module Structure

```
artifacts/api-server/src/
├── agents/
│   ├── designEvaluator/
│   │   ├── evaluator.ts          — Pure scoring engine (no LLM, no side effects)
│   │   └── repairAgent.ts        — LLM-based targeted repair
│   └── pipeline/
│       └── designEvaluatorStep.ts — Pipeline orchestration + SSE + repair loop
└── telemetry/
    └── evaluatorMetrics.ts       — Score persistence + reporting
```

---

## evaluateDesign() — Scoring Engine

### Input
```typescript
interface EvaluationInput {
  code: string;          // full fixedCode from repairStep output
  sectionOrder: string[]; // from PageBlueprint.sectionOrder
  designDNA: DesignDNA;   // from frontendStep Design Agent
}
```

### Output
```typescript
interface EvaluationResult {
  overallScore: number;         // 0–10 weighted aggregate
  heroScore: number;            // 0–10
  layoutScore: number;          // 0–10
  ctaScore: number;             // 0–10
  accessibilityScore: number;   // 0–10
  shadcnScore: number;          // 0–10
  consistencyScore: number;     // 0–10
  issues: EvaluationIssue[];    // sorted: critical → major → minor
}

interface EvaluationIssue {
  category: 'hero' | 'layout' | 'cta' | 'accessibility' | 'shadcn' | 'consistency';
  severity: 'critical' | 'major' | 'minor';
  message: string;  // always actionable and specific (>30 chars)
}
```

---

## Scoring Dimensions

### Hero Score (weight: 25%)
| Check | Points | Detection |
|-------|--------|-----------|
| Badge/pill label | +2 | `<Badge` in Hero function block |
| H1 headline | +2 | `<h1` in Hero block |
| Supporting copy | +1 | `<p` in Hero block |
| Dual CTA (primary + outline) | +3 | 2× `<Button`, one with `variant="outline"` |
| Trust signal | +2 | ★ rating, avatar, user count, logo cloud, metric strip |

### Layout Score (weight: 20%)
| Check | Points | Detection |
|-------|--------|-----------|
| Section count 6–10 | +2 | `sectionOrder.length` |
| Background alternation | +4 | bg-[#hex] pattern adjacency check |
| No consecutive duplicate grids | +2 | `grid-cols-N` run analysis |
| Non-card section present | +2 | `flex-row/col`, `<table`, `<ul`, `border-t` |

### CTA Score (weight: 15%)
| Check | Points | Detection |
|-------|--------|-----------|
| Has solid primary Button | +3 | `<Button` without variant |
| Has outline/ghost secondary | +3 | `variant="outline"` or `"ghost"` |
| No repeated CTA text | +2 | Button inner text uniqueness |
| No vague CTAs | +2 | "Get Started", "Learn More" regex |

### Accessibility Score (weight: 20%)
| Check | Points | Detection |
|-------|--------|-----------|
| `type="button"` on all `<button>` | +3 | Raw `<button>` vs typed count |
| `focus-visible:ring` coverage | +3 | Count vs interactive element ratio |
| `aria-label` present | +2 | Regex scan |
| No text-white/25–45 | +2 | Low-opacity class regex |

### Shadcn Score (weight: 10%)
| Check | Points | Detection |
|-------|--------|-----------|
| Uses `<Button` | +2 | Regex |
| Uses `<Card` | +2 | Regex |
| Uses `<Badge` | +2 | Regex |
| Uses Avatar/Input/Accordion/Tabs | +1 each, max +4 | Regex per component |

### Consistency Score (weight: 10%)
| Check | Points | Detection |
|-------|--------|-----------|
| No Lorem ipsum | +2 | Case-insensitive regex |
| No placeholder names | +2 | "Acme Corp", "John Doe", etc. |
| ≤2 border-radius values | +2 | Count used rounded-* classes |
| ≤1 gradient color family | +2 | from-{color}-N extraction |
| No text-white/25–45 | +2 | Regex (also in accessibility) |

### Overall Score Formula
```
overall = hero×0.25 + layout×0.20 + cta×0.15 + accessibility×0.20 + shadcn×0.10 + consistency×0.10
```

---

## Quality Thresholds

| Range | Label | Action |
|-------|-------|--------|
| 9.0–10.0 | Excellent | No action |
| 8.5–8.9 | Production Ready | No action |
| 8.0–8.4 | Good | No action |
| 7.0–7.9 | Needs Improvement | No action (logged) |
| < 7.0 | Repair Required | → Auto Repair Loop |
| < 8.0 (all) | Below threshold | → Auto Repair Loop |

**Repair threshold: `< 8.0`**

---

## SSE Events (V7.1.4)

| Event | When | Key fields |
|-------|------|-----------|
| `design_eval_start` | Before evaluation | `agent: "Design Evaluator"` |
| `design_eval_result` | After initial evaluation | All 7 scores + issues[] + repairRequired |
| `design_repair_start` | Before each repair pass | `pass`, `maxPasses`, `currentScore`, `issueCount` |
| `design_repair_done` | After each repair pass | `pass`, `prevScore`, `newScore`, `improvement`, `thresholdMet` |

All existing SSE events unchanged.

---

## Pipeline Position

```
runRepairStep(frontend)              ← structural TSX repair (3 passes max)
    ↓
runDesignEvaluatorStep(repairedFrontend)  ← NEW: design quality evaluation + targeted repair
    ↓
runBackendStep(evaluatedFrontend)    ← now receives improved fixedCode if repair applied
    ↓
runRuntimeValidationStep(...)
    ↓
SSE done { code: evaluatedFrontend.fixedCode }
```
