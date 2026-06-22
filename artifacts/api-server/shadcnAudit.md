# Shadcn/UI Component Adoption Audit — V7.0.8

Source: `src/agents/frontend/codeSystem.ts` (SHADCN/UI section), `src/components/registry.ts` (standaloneCode analysis).
Generated: 2026-06-22.

---

## How Shadcn Is Delivered

VoxAI does **not** install shadcn/ui as an npm package in generated projects. Instead, shadcn components are injected as **UMD global variables** via the code-gen system prompt. This is the "Lucide CDN bridge" pattern from V7.0 Multi-File Foundation.

### Injection Mechanism (from buildCodeSystem())

```
═══ SHADCN/UI COMPONENTS ═══
The following components are available as globals (no import needed). Use them for interactive UI elements:
- <Button variant="default|outline|ghost|secondary|destructive" size="default|sm|lg">...</Button>
- <Card className="..."><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>...</CardContent></Card>
- <Input placeholder="..." className="..." type="text|email|password" />
- <Badge variant="default|secondary|outline">Status</Badge>
- <Avatar><AvatarImage src="..." /><AvatarFallback>AB</AvatarFallback></Avatar>
Prefer these over raw <button> / <input> / <div> for form elements and action buttons.
```

The agent is instructed to use these as JSX without import statements, relying on the preview runtime having them globally available.

---

## Components Exposed

| Component | Variants Documented | Sub-components | Use Case |
|---|---|---|---|
| Button | default, outline, ghost, secondary, destructive | None | CTAs, actions |
| Card | — | CardHeader, CardTitle, CardContent | Content containers |
| Input | — | — | Form text inputs |
| Badge | default, secondary, outline | — | Status labels, tags |
| Avatar | — | AvatarImage, AvatarFallback | User avatars |

**Total exposed: 5 components, 8 sub-components.**

---

## Components NOT Exposed

These shadcn/ui components exist in shadcn's library but are NOT documented in the system prompt:

| Component | Common Use | Impact of Absence |
|---|---|---|
| Select | Dropdowns | Agent uses raw `<select>` — no shadcn styling |
| Checkbox | Multi-select forms | Agent uses raw `<input type="checkbox">` |
| RadioGroup | Choice inputs | Agent uses raw `<input type="radio">` |
| Switch | Toggle settings | Agent uses custom div-based toggle |
| Textarea | Long-form input | Agent uses raw `<textarea>` |
| Tabs | Content tabs | Agent builds custom tab with useState |
| Dialog / Modal | Overlays | Agent builds custom div overlay |
| Dropdown Menu | Nav dropdowns | Agent builds custom dropdown |
| Accordion | FAQ sections | Agent builds custom accordion |
| Tooltip | Info overlays | Agent omits entirely |
| Progress | Loading states | Agent builds custom progress bar |
| Skeleton | Loading states | Agent omits or uses custom pulse div |
| Alert | Status messages | Agent uses custom styled div |
| Table | Data tables | Agent uses raw `<table>` |
| Separator | Dividers | Agent uses `<hr>` or `border-t` div |

**15 additional shadcn components available but not documented = agent cannot use them.**

---

## Shadcn Usage in Registry standaloneCode

All 75 registry templates use **raw Tailwind CSS** — zero shadcn component usage.

This is intentional: registry templates are structural references injected before codegen. They demonstrate layouts and patterns, not the final shadcn component layer. The code-gen agent then adapts these patterns using the shadcn globals.

**Consequence:** The code-gen agent sees structural references (raw Tailwind buttons, raw input divs) and then a separate instruction to prefer shadcn. These two inputs can conflict — the agent may copy the template's raw pattern instead of upgrading to shadcn.

---

## Shadcn Adoption Rate Assessment

Based on the system prompt instruction: `"Prefer these over raw <button> / <input> / <div> for form elements and action buttons."`

| Context | Expected Agent Behavior | Likely Actual Behavior |
|---|---|---|
| Hero CTA buttons | Use `<Button variant="default">` | ⚠️ Often uses raw `<button>` (templates show this) |
| Feature card CTAs | Use `<Button variant="outline">` | ⚠️ Often uses raw `<button>` |
| Contact form inputs | Use `<Input>` | ✅ More likely here (explicit instruction) |
| Contact form submit | Use `<Button>` | ✅ More likely |
| Pricing badges | Use `<Badge>` | ⚠️ Variable |
| Testimonial avatars | Use `<Avatar>` | ⚠️ Sometimes custom divs |
| Feature cards | Use `<Card>` | ⚠️ Often custom Tailwind card |
| Status indicators | Use `<Badge>` | ⚠️ Often custom badge |

**Estimated adoption rate: ~30-40% of possible shadcn usage sites.**

The primary friction is the registry templates demonstrating raw Tailwind patterns. The agent pattern-matches to templates more than it follows the "prefer shadcn" directive.

---

## Component Quality Assessment

### Button

**API documented in prompt:** `variant="default|outline|ghost|secondary|destructive"`, `size="default|sm|lg"`.

**Missing:** `asChild` prop documentation (for link-style buttons), `disabled` state, `loading` state pattern.

**Rating: 7/10** — Core functionality covered; edge cases missing.

---

### Card

**API documented:** `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`.

**Missing:** `CardFooter`, `CardDescription`. These are common in shadcn Card usage patterns (pricing cards, feature cards typically need description + footer).

**Rating: 6/10** — Missing two common sub-components.

---

### Input

**API documented:** `placeholder`, `className`, `type="text|email|password"`.

**Missing:** `id` (required for `<label>` association), `name` (required for form submission), `required`, `disabled`, `onChange` handler pattern with `React.useState`.

**Critical gap:** Without `id` documentation, generated forms have inputs without labels — accessibility failure.

**Rating: 5/10** — Missing critical attributes for functional forms.

---

### Badge

**API documented:** `variant="default|secondary|outline"`.

**Missing:** Custom className usage, icon combination patterns.

**Rating: 8/10** — Simple component, well documented.

---

### Avatar

**API documented:** `<Avatar>`, `<AvatarImage src="...">`, `<AvatarFallback>AB</AvatarFallback>`.

**Missing:** `className` on Avatar for sizing (shadcn Avatar defaults to small — need `className="h-10 w-10"` etc.).

**Rating: 7/10** — Core documented; sizing not addressed.

---

## CODEFIX_SYSTEM Shadcn Handling

From `prompts.ts` CODEFIX_SYSTEM:

```
1. Fix these CRITICAL issues:
   - Remove any import/export statements
   ...
2. Preserve the dynamic structure:
   - KEEP all Lucide icon JSX elements — they are available as globals
```

**Shadcn is not mentioned in CODEFIX_SYSTEM at all.** If the code-gen agent produces `import { Button } from '@/components/ui/button'`, CODEFIX will correctly strip the import but won't know whether to keep or replace the `<Button>` JSX. This can produce broken JSX with `Button` used without an import and without a global binding.

**Critical gap:** CODEFIX_SYSTEM should explicitly say: "Keep all shadcn JSX elements (Button, Card, Input, Badge, Avatar) — they are available as globals in the preview."

---

## Preview Runtime Assessment

The system promises shadcn components are "available as globals" in the preview. This requires the preview iframe to inject shadcn component bindings into the JavaScript scope before the generated code runs.

**From V7.0 Multi-File Foundation notes:** The preview uses UMD globals pattern. Lucide is confirmed working. Shadcn as globals is a more complex proposition because shadcn components are styled React components, not simple SVG renderers.

**Unverified:** Whether all 5 shadcn globals (Button, Card, Input, Badge, Avatar) are actually injected into the preview runtime. If they are missing, any `<Button>` in generated code will throw `ReferenceError: Button is not defined` — a runtime crash.

---

## Summary Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Component Coverage | 4/10 | Only 5 of 20+ shadcn components exposed |
| API Documentation Quality | 6/10 | Basic variants only; missing critical attributes |
| Adoption Rate (estimated) | 4/10 | Templates compete with shadcn directives |
| CODEFIX Integration | 3/10 | Shadcn not mentioned in CODEFIX_SYSTEM |
| Registry Template Alignment | 3/10 | 0/75 templates use shadcn |
| Runtime Reliability | 6/10 | Globals pattern unverified for all 5 components |
| **OVERALL** | **4.3/10** | Weakest subsystem in the design stack |

---

## Priority Fixes

1. **Add shadcn preservation to CODEFIX_SYSTEM** — "Keep all shadcn JSX (Button, Card, Input, Badge, Avatar) — globals in preview"
2. **Expand documented components** — add Select, Textarea, Tabs, Dialog, Accordion, Switch at minimum
3. **Add Input id/name/onChange documentation** — critical for accessible, functional forms
4. **Add CardFooter and CardDescription** to the Card API documentation
5. **Verify preview runtime** — confirm all 5 globals are injected before component code runs; add a runtime check that throws a clear error if missing
6. **Upgrade 3-5 registry templates to use shadcn** — so agent learns the pattern from structural reference, not just directive text
