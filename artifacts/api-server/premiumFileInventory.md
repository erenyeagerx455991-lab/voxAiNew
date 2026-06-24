# V7.2.10 Premium Registry — Phase 1 File Inventory

Generated: 2026-06-24

## Registry File Locations

The "premium registry" in this codebase is NOT split into separate cta.ts / navbars.ts / heroes.ts files.
It lives in 3 consolidated files:

| File | Lines | Path |
|------|-------|------|
| registry.ts | 1615 | src/components/registry.ts |
| section-templates.ts | 1191 | src/components/section-templates.ts |
| diversity-templates.ts | 2238 | src/components/diversity-templates.ts |

## Pre-Migration Raw HTML Audit

| File | `<button` | `<input` | `<textarea` | `<table` | `<select` | `<dialog` |
|------|-----------|----------|-------------|----------|-----------|-----------|
| registry.ts | 32 | 5 | 1 | 0 | 0 | 0 |
| section-templates.ts | 8 | 3 | 0 | 1 | 0 | 0 |
| diversity-templates.ts | 42 | 1 | 0 | 0 | 0 | 0 |
| **Total** | **82** | **9** | **1** | **1** | 0 | 0 |

## Pre-Migration Shadcn Audit

| File | `<Button` | `<Input` | `<Card` | `<Badge` | Shadcn total |
|------|-----------|----------|---------|----------|--------------|
| registry.ts | 0 | 0 | 0 | 0 | 15 |
| section-templates.ts | 0 | 0 | 8 | 7 | 34 |
| diversity-templates.ts | 14 | 0 | 16 | 18 | 398 |

## Migration Plan

### Priority 1 — Critical (covers 92 raw elements)
- Replace all `<button` → `<Button`, `</button>` → `</Button>` across all 3 files
- Replace all `<input` → `<Input` across all 3 files
- Replace all `<textarea` → `<Textarea`, `</textarea>` → `</Textarea>` in registry.ts

### Priority 2 — Structural (1 element)
- `<table>` in `pricing-comparison-v1` (section-templates.ts line 759): Keep as HTML table —
  semantically correct for tabular comparison data; no Shadcn Table global is registered.
  Replace only the `<button>` inside it.

### Shadcn Globals Available (UMD pattern)
Button, Input, Textarea, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription,
Badge, Avatar, AvatarImage, AvatarFallback, Separator, Skeleton, Progress, Tabs, TabsList,
TabsTrigger, TabsContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent,
Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, Sheet, SheetContent,
Tooltip, TooltipTrigger, TooltipContent, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
DropdownMenuItem, Select, SelectTrigger, SelectContent, SelectItem, Switch, Label, Command,
CommandInput, CommandList, CommandItem, Calendar, DatePicker, DataTable, Drawer, DrawerContent,
HoverCard, HoverCardContent, Menubar, NavigationMenu, NavigationMenuList, NavigationMenuItem,
NavigationMenuLink

## Coverage Target
- Goal: ≥95% Shadcn component coverage across all templates
- TOTAL_COMPONENT_FAMILIES: 36 (must stay constant)
