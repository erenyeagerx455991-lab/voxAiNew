# V7.1.2 Shadcn Migration Baseline — Phase 1 Inventory

**Date:** June 23, 2026
**Scope:** All component-library registry templates

---

## Pre-Migration State

### Standard Registry (`registry/`)

| File | Templates | Raw `<button>` | Custom Badge Divs | Raw Card Divs | Shadcn Usage |
|------|-----------|----------------|-------------------|---------------|--------------|
| hero.ts | 4 | 8 | 4 | 0 | 0% |
| pricing.ts | 2 | 5 | 1 | 10 | 0% |
| faq.ts | 1 | 0 (local state) | 0 | 0 | 0% |
| testimonials.ts | 2 | 0 | 0 | 6 | 0% |
| navbar.ts | 2 | 3 | 2 | 0 | 0% |
| **Subtotal** | **11** | **16** | **7** | **16** | **0%** |

### Premium Registry (`registry/premium/`)

| File | Templates | Raw `<button>` | Custom Badge Divs | Raw Card Divs | Shadcn Usage |
|------|-----------|----------------|-------------------|---------------|--------------|
| heroes.ts | 10 | 22 | 9 | 0 | 0% |
| pricing.ts | 6 | 12 | 6 | 18 | 0% |
| testimonials.ts | 6 | 0 | 2 | 22 | 0% |
| dashboards.ts | 10 | 15 | 8 | 0 | 0% |
| **Subtotal** | **32** | **49** | **25** | **40** | **0%** |

### Server-Side Templates

| File | Templates | Shadcn Usage |
|------|-----------|--------------|
| diversity-templates.ts | 28 | 0% |
| section-templates.ts | 17 | 0% |

**Total Pre-Migration: ~88 templates, 0% shadcn adoption across all categories**

---

## Global Stubs Available (builderService.ts preamble)

### Before V7.1.2
- `cn` (clsx helper)
- `Button` (variant-aware)
- `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`
- `Input`
- `Badge`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Separator`

### Added in V7.1.2
- `Skeleton` — animated pulse loading state
- `Progress` — value-based horizontal progress bar
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` — React.createContext IIFE
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — React.createContext IIFE

---

## Migration Targets (V7.1.2)

### Priority 1 — Full Migration (Standard Registry)
- hero.ts → Badge + Button throughout
- faq.ts → full Accordion component
- pricing.ts → Card + Badge + Button + Separator
- testimonials.ts → Card + Avatar + AvatarFallback
- navbar.ts → Button for CTAs

### Priority 2 — Partial Migration (Premium Registry)
- premium/heroes.ts → Badge + Button for key templates
- premium/pricing.ts → Button for all CTAs
- premium/dashboards.ts → Tabs (period toggle), Badge (status), Button (actions)
- premium/testimonials.ts → Fix local `Card` variable conflict, add Avatar

---

## Known Constraint: Accordion Context Model

The `Accordion` stub uses `React.createContext` inside an IIFE that also defines `Tabs`. Both components share the same preamble block. `AccordionItem` uses `React.cloneElement` to pass `__v/__open/__toggle` props to direct children. Templates must use `AccordionItem > AccordionTrigger + AccordionContent` structure exactly.

Passing props through intermediate wrappers will break `__open/__toggle` propagation.
