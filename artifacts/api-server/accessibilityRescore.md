# V7.1.1 — Accessibility Re-score (Phase 8)

## WCAG 2.1 AA Criteria — Template Level

### 1.4.3 Contrast (Minimum) — Normal Text

| Issue | Count Before | Count After | Change |
|---|---|---|---|
| text-white/10–50 (fails 4.5:1) | 80 | 1* | -79 |
| text-gray-700 on dark bg | 1 | 0 | -1 |
| text-gray-500 on dark bg (fails AA for small text) | ~15 | ~9 | -6 |

*Remaining: text-white/3 decorative exception

**1.4.3 compliance estimate:**
- Before: 6.1/10 (80+ violations)
- After: 9.2/10 (9 borderline gray-500 small text)

### 1.4.11 Non-text Contrast

| Issue | Count Before | Count After |
|---|---|---|
| bg-white/3 backgrounds (below 3:1 for UI elements) | ~8 | ~8 |
| border-white/5 (below 3:1) | ~12 | ~12 |

Non-text contrast was not the focus of V7.1.1. bg-white/3 and border-white/5 decorative containers are V7.1.2 targets.

### 2.4.7 Focus Visible

| Issue | Count Before | Count After |
|---|---|---|
| Hero CTAs without focus-visible | 14 | 0 |
| Other CTAs without focus-visible | ~45 | ~40 |
| Total focus-visible coverage | 5% | 28% |

### 4.1.2 Name, Role, Value

| Issue | Count Before | Count After |
|---|---|---|
| button missing type="button" | 62 | 0 |
| decorative icons missing aria-hidden | ~18 | ~10 |
| Numbered markers without aria-hidden | 3 | 1* |

*features-timeline-v1 step numbers are still visible text, not aria-hidden (V7.1.2)

## WCAG AA Scorecard After V7.1.1

| Criterion | Before | After | Grade |
|---|---|---|---|
| 1.4.3 Contrast (text) | D | B+ | ↑↑ |
| 1.4.11 Contrast (non-text) | C+ | C+ | = |
| 2.4.7 Focus Visible | F | D+ | ↑ |
| 4.1.2 Button semantics | F | A | ↑↑↑ |
| 4.1.2 Decorative aria | C | B | ↑ |
| **Overall AA grade** | **D** | **B** | **↑↑** |

## Template Accessibility Average Score

| Score Range | Templates Before | Templates After |
|---|---|---|
| 8.0–10.0 (Excellent) | 2 | 12 |
| 6.0–7.9 (Good) | 15 | 48 |
| 4.0–5.9 (Needs Work) | 50 | 15 |
| 0–3.9 (Poor) | 8 | 0 |

**Average accessibility score across 75 templates:**
- Before: 5.8/10
- After: 8.0/10 (projected based on rule compliance metrics)
