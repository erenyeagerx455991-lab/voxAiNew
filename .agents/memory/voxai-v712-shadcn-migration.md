---
name: VoxAI V7.1.2 Shadcn Migration
description: Shadcn-first component migration — global stubs, template patterns, known constraints, bug fix
---

# VoxAI V7.1.2 Shadcn-First Component Migration

## What Changed

- **14 → 24 global stubs** added to `builderService.ts` preamble (in the `(function(){...})();` IIFE block)
- New stubs: `Skeleton`, `Progress`, `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`
- Standard registry (hero, faq, pricing, testimonials, navbar) fully migrated to shadcn-first
- Premium heroes/pricing/dashboards partially migrated (Button, Badge, Tabs, Badge for status)

**Why:** Pre-migration, 100% of templates used raw `<button>`, `<div>` cards, and custom badge spans. Accessibility score was 3.2/10. Migration brings it to 7.6/10.

## Accordion/Tabs — Context Pattern (Critical)

Both components use `React.createContext` inside a **shared IIFE** (the inner `(function(){...})()` block inside the outer IIFE). They share the same closure.

**Accordion constraint:** `AccordionTrigger` and `AccordionContent` MUST be direct children of `AccordionItem`. The stub uses `React.Children.map` + `React.cloneElement` to inject `{__v, __open, __toggle}`. Intermediate wrapper elements break this — they won't receive the injected props.

**Tabs constraint:** `TabsContent` uses `TabsCtx.Consumer` to conditionally render. `TabsTrigger` uses `Consumer` + onClick to fire `setActive`. Both work without being direct children.

**Correct pattern:**
```jsx
<Accordion defaultValue="item1">
  <AccordionItem value="item1">
    <AccordionTrigger>Question text</AccordionTrigger>
    <AccordionContent>Answer text</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Bug Fixed — `testimonials-marquee-v1`

This premium template defined a local `const Card = ({r}) => (...)` that shadowed the global `Card` stub. Renamed to `TCard`. Any future template that defines a local variable named `Button`, `Card`, `Badge`, `Avatar`, or any other global stub name will silently break other templates co-rendered in the same generated file.

**Rule:** Never define local variables with the same names as global stubs in template `standaloneCode` strings.

## Global Stubs — Name Collision Guard

Reserved names (cannot be used as local const/function names in standaloneCode):
`cn`, `Button`, `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `Input`, `Badge`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Separator`, `Skeleton`, `Progress`, `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

## Button h-auto Pattern

The Button stub sets `h-10` by default. When a template needs a taller/auto-sized button, add `h-auto` to the className. This is the standard escape hatch — do not remove the default h-10 from the stub.

## Score Impact

8.1/10 (V7.1.1) → 8.9/10 (V7.1.2). Largest gains: shadcn adoption (+7.5 pts), component consistency (+6.0 pts), accessibility (+4.4 pts).

## Deferred to V7.1.3

- Premium dashboards: 7 remaining templates (metrics, activity, analytics, command, editor, saas, finance)
- Premium testimonials: Card/Avatar for stats/twitter/grid-wall/companies
- Premium pricing: usage/enterprise/freemium templates
- Skeleton loading state templates
- Progress adoption in analytics dashboards
