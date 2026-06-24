---
name: VoxAI V7.2.8 Forms & Workflow Engine
description: Production-grade form generation system — 12th evaluator dimension, 8 priority-15 templates, 35 form RAG refs, CODEFIX §6 enforcement, form telemetry, SectionType 'form'.
---

## Rule
`formScore` is the 12th evaluator dimension (weight 0.05). Weights redistributed: hero 0.15, coverage 0.05, accountMenu 0.04, consistency 0.04 (all reduced). Non-form builds (no form tags, no multi-input patterns) receive score 10 — no penalty.

**Why:** Generic form output (raw inputs, no Labels, no validation, no loading states) was the main remaining quality gap vs Stripe/Linear/Notion/Vercel checkout flows. A dedicated evaluator dimension forces detection and penalization.

**How to apply:**
- `scoreForm(code, isForm)` in `evaluator.ts` — auto-detects form content (formTag + handleSubmit + 2+ inputs); returns 10 for non-form builds
- Scoring: RHF (useForm/handleSubmit/register) +2, Zod (z.object/zodResolver) +2, Label+htmlFor +2, error states (formState.errors) +2, loading (isSubmitting/disabled) +2 = 10 max
- `isForm?: boolean` added to `EvaluationInput` interface
- CODEFIX rule §6 (forms) was added above old §6 (dashboards), making dashboards §7 — VERIFY numbering in prompts.ts if needed
- 35 form refs in `sectionCorpus.ts`: login (5), signup (5), checkout (4), settings (4), onboarding (4), booking (3), profile (2), admin-crud (4), contact (2)
- `'form'` added to `SectionType` union and `ALL_SECTION_TYPES` array in `sectionCorpus.ts`
- `normalizeSectionType("ContactForm")` now correctly returns `'form'` — test updated accordingly
- `formMetrics.ts` tracks reactHookFormUsage/zodUsage/labelUsage/errorStateUsage/loadingStateUsage/multiStepUsage/crudUsage per build; exposed at `GET /api/telemetry/quality → formQuality`
- `designEvaluatorStep.ts` imports `recordFormScore`, calls it after `recordDashboardScore`, and includes `formScore` in the `EvaluatorResult` return

## Weight table (V7.2.8, 12 dimensions, sum = 1.00)
| Dimension | Weight |
|-----------|--------|
| hero | 0.15 |
| layout | 0.14 |
| cta | 0.10 |
| accessibility | 0.16 |
| shadcn | 0.07 |
| coverage | 0.05 |
| navigation | 0.10 |
| accountMenu | 0.04 |
| authNavbarAlignment | 0.04 |
| consistency | 0.04 |
| dashboard | 0.06 |
| form | 0.05 |

## 8 Premium form templates (all priority 15, category 'form')
- `login-enterprise-v1` — Stripe split-panel login
- `signup-enterprise-v1` — 2-step with password strength meter
- `checkout-enterprise-v1` — 2-column checkout (payment + order summary)
- `settings-workspace-v1` — Vercel-style Tabs settings with danger zone
- `profile-dashboard-v1` — GitHub-style profile with avatar, slug, social links
- `admin-crud-v1` — DataTable + Edit Modal + Delete AlertDialog CRUD
- `onboarding-multistep-v1` — 4-step Progress wizard (Linear style)
- `booking-workflow-v1` — Calendly-style calendar + time slot + attendee form

## Test status
1015/1015 pass (pre-existing 604>600 token estimate failure is gone — VERIFY if this was fixed or moved to 1015 total).
Actually: 1015 pass, 1 fail (604>600 pre-existing). Total 1016 tests.
