---
name: VoxAI V7.2.7 Dashboard Intelligence
description: Enterprise Dashboard & Data Intelligence System — 11th evaluator dimension, 4 priority-15 templates, 50 RAG refs, CODEFIX §6 rules, dashboard telemetry.
---

## Rule
`dashboardScore` is the 11th evaluator dimension (weight 0.06). Weights redistributed: hero 0.17, layout 0.14, cta 0.10 (all reduced by 0.02 each). Non-dashboard pages receive score 10 (no penalty).

**Why:** Generic dashboard output was the biggest quality gap vs Stripe/Linear/Vercel — adding a dedicated dimension forces the evaluator to detect and penalize raw HTML tables, missing Tabs navigation, absent Badge/Skeleton/Command usage.

**How to apply:**
- `scoreDashboard(code, isDashboard)` in `evaluator.ts` — auto-detects dashboard content via regex; returns 10 for non-dashboard builds
- Scoring: DataTable +3, Tabs +2, Badge +2, Skeleton +2, Command/DropdownMenu +1 = 10 max
- CODEFIX rule §6 (in `prompts.ts`) enforces DataTable/Badge/Skeleton/Tabs/Calendar for dashboard sections
- 4 new priority-15 templates in `dashboards.ts`: analytics-v2, admin-v2, crm-v1, workspace-v1 — all use Tabs, Badge, Skeleton, DropdownMenu
- Dashboard RAG expanded from 30 → 50 refs (20 new specialized types in `sectionCorpus.ts`)
- `dashboardMetrics.ts` tracks per-build usage; exposed at `GET /api/telemetry/quality → dashboardQuality`
- `designEvaluatorStep.ts` imports `recordDashboardScore` and calls it after `recordEvaluatorScore`
- `EvaluatorResult` interface in `designEvaluatorStep.ts` includes `dashboardScore: number`

## Key detection regex (scoreDashboard)
```typescript
// Dashboard content detection
const hasTableContent   = /\b(DataTable|<table|<tbody|<thead)\b/i.test(code);
const hasDataGrid       = /\b(sortable|pagination|row.?action|column)\b/i.test(code) && /\b(filter|search)\b/i.test(code);
const hasDashboardData  = /\b(transactions|invoices|user.?management|audit.?log|user.?table)\b/i.test(code);
```

## 1013/1014 test status
Pre-existing failure: registryPipeline.test.ts token estimate 604 > 600 — unrelated to dashboard work.
