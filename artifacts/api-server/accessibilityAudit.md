# Accessibility Audit — V7.0.8

Source: `src/components/registry.ts` (standaloneCode), `src/agents/frontend/codeSystem.ts` (buildCodeSystem prompt), `src/agents/llm/prompts.ts` (CODEFIX_SYSTEM).
Generated: 2026-06-22.

---

## Scope

This audit covers three layers:

1. **Registry templates** — static standaloneCode in all 75 components
2. **buildCodeSystem() directives** — whether the codegen prompt instructs accessible output
3. **CODEFIX_SYSTEM** — whether the repair agent preserves or improves accessibility

WCAG 2.1 AA is the reference standard.

---

## Layer 1: Registry Template Accessibility

### aria-label / aria-labelledby

Inspection of all 75 standaloneCode blocks for ARIA attributes:

| ARIA Attribute | Occurrences in Registry | Notes |
|---|---|---|
| `aria-label` | **0** | No component uses aria-label |
| `aria-labelledby` | **0** | Not used |
| `aria-expanded` | **0** | FAQ accordions lack expand state |
| `aria-hidden` | **0** | Decorative divs not hidden from screen readers |
| `aria-current` | **0** | Nav active states not indicated |
| `role` | **0** | No semantic role overrides |
| `aria-pressed` | **0** | Toggle buttons lack pressed state |

**ARIA Score: 0/10** — No ARIA attributes anywhere in the registry.

---

### Semantic HTML Usage

| HTML Element | Usage Pattern | Assessment |
|---|---|---|
| `<nav>` | Navbar components correctly use `<nav>` | ✅ |
| `<section>` | All section components use `<section>` | ✅ |
| `<h1>` | Hero components use `<h1>` | ✅ |
| `<h2>` | Section headings — **pattern not enforced** | ⚠️ Agent may use any heading level |
| `<h3>`, `<h4>` | Card headings — not specified | ⚠️ Often `<div className="font-bold">` |
| `<button>` | ✅ Used for actions, not `<div onClick>` | ✅ |
| `<a>` | ✅ Used for links | ✅ |
| `<ul>` / `<li>` | ❌ Navigation links use `<div>` not `<ul><li>` | ⚠️ |
| `<form>` | Not in hero/feature templates | N/A |
| `<label>` | Not in any contact/input template | ❌ |
| `<input>` | Not in hero templates | N/A |
| `<main>` | Never used | ❌ |
| `<header>` | `<nav>` used instead | ⚠️ Minor |
| `<footer>` | Footer components use `<footer>` | ✅ |

**Semantic HTML Score: 5/10** — Landmark elements correct; heading hierarchy and list elements missing.

---

### Color Contrast Analysis

Assessed against WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text.

#### Dark Theme Patterns (dominant — 74/75 components)

| Text Color | Background | Contrast Ratio | WCAG AA |
|---|---|---|---|
| `text-white` (#FFFFFF) on `bg-[#0a0a0a]` | 19:1 | ✅ Pass |
| `text-gray-400` (#9CA3AF) on `bg-[#0a0a0a]` | 7.2:1 | ✅ Pass |
| `text-gray-500` (#6B7280) on `bg-[#0a0a0a]` | 4.6:1 | ✅ Pass (barely) |
| `text-white/45` on `bg-black` | ~3.2:1 | ❌ Fail (hero-asymmetric-v1 subheadline) |
| `text-white/35` on `bg-[#0F0F0F]` | ~2.3:1 | ❌ Fail (hero-editorial-v1 subheadline) |
| `text-white/25` on `bg-[#09090b]` | ~1.6:1 | ❌ Fail (hero-dashboard-v1 dashboard labels) |
| `text-white/30` on `bg-[#111111]` | ~1.9:1 | ❌ Fail (hero-asymmetric-v1 H1 line 2) |
| Violet `bg-violet-600` buttons with `text-white` | ~4.6:1 | ✅ Pass (barely) |
| `#635BFF` (Stripe accent) with `text-white` | ~3.8:1 | ❌ Fail for normal text |
| `#5E6AD2` (Linear accent) with `text-white` | ~3.4:1 | ❌ Fail for normal text |

#### Light Theme (hero-story-v1)

| Text Color | Background | Contrast Ratio | WCAG AA |
|---|---|---|---|
| Dark text on `bg-[#f5f5f0]` | Estimated 14:1 | ✅ Pass |
| Gray service tags on light bg | ~5:1 | ✅ Pass |

**Color Contrast Score: 5/10** — Major issues: opacity-reduced white text (white/25, white/30, white/35, white/45) fails WCAG AA in multiple hero components. These patterns are used for secondary text, subheadings, and muted labels.

---

### Keyboard Navigation

| Requirement | Current State |
|---|---|
| Interactive elements are focusable | ✅ `<button>` and `<a>` are natively focusable |
| Focus ring visible | ❌ No `focus:ring` or `focus-visible:ring` classes in any template |
| Tab order matches visual order | ✅ (DOM order is logical) |
| Skip-to-content link | ❌ Not present in any navbar |
| Custom interactive elements keyboard accessible | ⚠️ FAQ accordion uses `<button>` but no `aria-expanded` |
| Modal/dialog keyboard trap | N/A — no modals in registry |

**Keyboard Navigation Score: 4/10** — Native focus works but focus rings are completely absent.

---

### Focus Ring Absence (Critical)

Zero focus-visible styles across all 75 components. The codegen prompt does not include any focus visibility requirement.

Default browser focus rings:
- Chrome: blue outline, often invisible on dark backgrounds
- Firefox: dotted outline, often invisible
- Safari: blue glow, minimal contrast on dark

**Impact:** Users navigating via keyboard, users with motor disabilities using Tab navigation, and users with screen readers relying on focus indicators all have degraded or broken experience.

**Severity: High.** This affects 100% of interactive elements across all generated sites.

---

### Image Alternative Text

| Image Pattern | Current State |
|---|---|
| SVG product mockups | ❌ No `<title>` or `aria-label` |
| Avatar images (`AvatarImage src="..."`) | ❌ No `alt` documented |
| Logo brand marks (div-based) | N/A — decorative |
| Background images | N/A — CSS backgrounds |

**Image Accessibility Score: 3/10** — SVG illustrations lack text alternatives. Avatar images lack alt text documentation.

---

## Layer 2: buildCodeSystem() Accessibility Directives

Full review of `buildCodeSystem()` output for accessibility guidance:

| WCAG Topic | Mentioned in Prompt | Detail |
|---|---|---|
| Semantic headings | ❌ No | Agent may use div instead of h2/h3 |
| ARIA attributes | ❌ No | Never mentioned |
| Focus visibility | ❌ No | Never mentioned |
| Color contrast | ❌ No | Never mentioned |
| Alt text for images | ❌ No | Never mentioned |
| Keyboard navigation | ❌ No | Never mentioned |
| Skip links | ❌ No | Never mentioned |
| Form labels | ❌ No | Inputs have no label guidance |

**Accessibility appears 0 times in the buildCodeSystem() prompt.**

The prompt covers: colors, typography, spacing, animation, decoration, layout, SVG illustrations, shadcn components, safe coding rules. Accessibility is entirely absent.

**buildCodeSystem() Accessibility Score: 0/10**

---

## Layer 3: CODEFIX_SYSTEM Accessibility

From `prompts.ts` CODEFIX_SYSTEM — full list of what it fixes:

1. Remove import/export statements
2. Remove TypeScript types
3. Remove JSX fragments
4. Ensure App() function exists
5. Namespace React hooks
6. Convert style={} to Tailwind
7. Fix syntax errors

**Accessibility-related fixes: 0 of 7.** CODEFIX adds no ARIA attributes, no focus rings, no alt text, no heading structure.

**CODEFIX Accessibility Score: 0/10**

---

## WCAG 2.1 AA Compliance Summary

| WCAG Criterion | Level | Status | Score |
|---|---|---|---|
| 1.1.1 Non-text Content (alt text) | A | ❌ Fail | 1/10 |
| 1.3.1 Info and Relationships (semantic HTML) | A | ⚠️ Partial | 5/10 |
| 1.3.2 Meaningful Sequence | A | ✅ Pass | 8/10 |
| 1.4.1 Use of Color | A | ✅ Pass | 8/10 |
| 1.4.3 Contrast Minimum (4.5:1) | AA | ❌ Fail | 4/10 |
| 1.4.11 Non-text Contrast (3:1) | AA | ❌ Fail | 4/10 |
| 2.1.1 Keyboard | A | ⚠️ Partial | 5/10 |
| 2.4.3 Focus Order | A | ✅ Pass | 8/10 |
| 2.4.7 Focus Visible | AA | ❌ Fail | 0/10 |
| 4.1.2 Name, Role, Value (ARIA) | A | ❌ Fail | 0/10 |

**Overall WCAG 2.1 AA Compliance: 4.3/10 — Fail**

---

## Highest-Impact Accessibility Failures

### #1 — No Focus Rings (Severity: High, Effort: Low)

Add to buildCodeSystem() prompt:
```
All interactive elements MUST have focus-visible rings:
button, a: add class "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[${accent}] focus-visible:ring-offset-2 focus-visible:ring-offset-[${bg}]"
```

This single directive would fix keyboard navigation across 100% of generated sites.

---

### #2 — Opacity-reduced text fails contrast (Severity: High, Effort: Medium)

`text-white/35`, `text-white/45`, `text-white/25` are widely used and commonly fail WCAG AA.

Add to buildCodeSystem() prompt:
```
Muted text: use text-[${textMuted}] (never less than 50% opacity on dark backgrounds).
Subheadlines: minimum text-white/55 on dark backgrounds.
```

---

### #3 — Missing aria-expanded on accordions (Severity: Medium, Effort: Low)

FAQ components use `React.useState` to toggle content visibility but never update `aria-expanded`. Screen readers cannot announce expand state.

Fix in FAQ template standaloneCode:
```jsx
<button
  aria-expanded={openIdx === i}
  aria-controls={`faq-${i}`}
  onClick={() => setOpenIdx(openIdx === i ? null : i)}
>
```

---

### #4 — No form labels (Severity: High, Effort: Low)

Contact/newsletter forms have no `<label>` elements. Inputs cannot be announced by screen readers.

Add to shadcn Input documentation:
```
Always pair with <label htmlFor="input-id">Label text</label>
```

---

### #5 — No skip-to-content link (Severity: Medium, Effort: Low)

Add to navbar-modern-v1 and navbar-minimal-v1:
```jsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[${bg}] focus:text-[${textColor}] focus:px-4 focus:py-2 focus:rounded">
  Skip to content
</a>
```

---

## Summary Scorecard

| Layer | Score | Notes |
|---|---|---|
| Registry ARIA | 0/10 | Zero ARIA attributes |
| Registry Semantic HTML | 5/10 | Landmarks good; headings/lists partial |
| Registry Color Contrast | 5/10 | Multiple opacity-based failures |
| Registry Keyboard | 4/10 | No focus rings anywhere |
| Registry Image Alt | 3/10 | SVGs unlabeled |
| buildCodeSystem() Directives | 0/10 | Accessibility not mentioned |
| CODEFIX Accessibility | 0/10 | No accessibility fixes |
| **OVERALL** | **2.4/10 — Fail** | Systemic gap across all layers |

---

## Remediation Priority

| Priority | Fix | Layer | Effort | Impact |
|---|---|---|---|---|
| 1 | Add focus-visible ring directive | buildCodeSystem() | 1 line | High |
| 2 | Add ARIA landmark roles directive | buildCodeSystem() | 3 lines | High |
| 3 | Fix opacity-based text contrast | buildCodeSystem() | 2 lines | High |
| 4 | Add aria-expanded to FAQ templates | Registry (6 files) | 1 line each | Medium |
| 5 | Add alt text directive for SVGs | buildCodeSystem() | 2 lines | Medium |
| 6 | Add heading hierarchy directive | buildCodeSystem() | 3 lines | High |
| 7 | Add skip-to-content to navbar templates | Registry (2 files) | 3 lines | Medium |
| 8 | Add label pairing to Input documentation | shadcn section | 2 lines | High |

**All high-priority fixes can be implemented with fewer than 20 lines of changes across 3 files.**
