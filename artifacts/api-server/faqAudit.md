# FAQ Modernization Audit — V7.1.2 Phase 5

**Date:** June 23, 2026

---

## Standard Registry — faq.ts

### faq-accordion-v1 (Shadcn Accordion)

**Before (raw div-based):**
```jsx
// Custom accordion state
const [open, setOpen] = React.useState(null);
// ...
<div onClick={() => setOpen(open === i ? null : i)}>
  <div className="flex justify-between py-4">{faq.q}</div>
  {open === i && <div className="pb-4 text-sm">{faq.a}</div>}
</div>
```

**After (shadcn Accordion):**
```jsx
<Accordion defaultValue="q1">
  {faqs.map(faq => (
    <AccordionItem value={faq.id}>
      <AccordionTrigger>{faq.q}</AccordionTrigger>
      <AccordionContent>{faq.a}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

---

## Accordion Stub Implementation

The global `Accordion` stub uses `React.createContext` to share `{open, toggle}` state. `AccordionItem` uses `React.Children.map` + `React.cloneElement` to inject `{__v, __open, __toggle}` into direct children. This approach avoids needing `useContext` in child components (which may not be available in the sandboxed Babel scope).

**Critical constraint:** `AccordionTrigger` and `AccordionContent` must be direct children of `AccordionItem`. Intermediate wrappers will not receive the `__open/__toggle` props.

---

## Component Usage

| Component | Used In | Props |
|-----------|---------|-------|
| `Accordion` | Outer wrapper | `defaultValue="q1"` |
| `AccordionItem` | Per-FAQ | `value={faq.id}` + custom bg/border className |
| `AccordionTrigger` | Question row | `className` for text styling |
| `AccordionContent` | Answer body | `className` for text/spacing |
| `Badge` | Section header | uppercase + violet variant |

---

## UX Improvements from Migration

| Feature | Before | After |
|---------|--------|-------|
| Open/close animation | CSS `rotate-45` via class toggle | CSS `rotate(180deg)` via inline style on SVG |
| First item expanded | No default | `defaultValue="q1"` sets default |
| Chevron icon | Custom div with `+` text | Built-in SVG chevron in AccordionTrigger |
| Keyboard accessibility | None (div, not button) | Proper `<button type="button">` in AccordionTrigger |
| Content hiding | `display:none` via conditional render | Full unmount when `__open` is false |

---

## Premium Registry

No premium FAQ file exists in the registry. The standard `faq-accordion-v1` is the authoritative FAQ template for all industries.

---

## Test Cases

1. **Default open:** `defaultValue="q1"` renders first item expanded on mount ✓
2. **Toggle behavior:** Clicking same item closes it (open === v ? null : v logic) ✓
3. **Mutual exclusion:** Only one item open at a time ✓
4. **Chevron rotation:** Rotates 180° when open, 0° when closed ✓
5. **Content unmounting:** AccordionContent returns null when `!p.__open` ✓
