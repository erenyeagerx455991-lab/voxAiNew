# V7.0.9 — Shadcn/UI Expansion Audit

## Current State (V7.0.8)

**Documented & Retrievable via RAG:** 5 components
- Button, Input, Card, Dialog, Table

**Coverage: ~30–40%** of generated components use shadcn primitives.

## Target State (V7.0.9)

**Coverage: 70%+**

## Expanded Components — 13 New

| Component | Use Case | Priority |
|---|---|---|
| Badge | Feature labels, status indicators, version tags | High |
| Tabs | Menu sections, pricing tiers, dashboard filters | High |
| Accordion | FAQ sections, expandable feature lists | High |
| Sheet | Mobile navigation drawers, side panels | Medium |
| Popover | Tooltip-style popovers, info overlays | Medium |
| Tooltip | Icon labels, shortcut hints | Medium |
| DropdownMenu | Nav menus, settings, user menus | High |
| Alert | Error messages, success banners, info notices | Medium |
| Separator | Content dividers, visual hierarchy | Low |
| Skeleton | Loading states in dashboard previews | Medium |
| Command | Search inputs, command palettes | Medium |
| Avatar | User profiles, team sections, testimonials | High |
| Progress | Onboarding flows, skill bars, upload indicators | Medium |

## Integration in buildCodeSystem()

All 13 new components are documented in the accessibility rules section (Rule 23) as GLOBALS that can be used without imports. The frontend agent is explicitly told these components exist and must prefer them over raw HTML equivalents.

### High-Priority Usage Patterns

**Badge** — replace `<span className="bg-X text-Y px-2 py-0.5 rounded-full text-xs">` with `<Badge variant="outline">`

**Avatar** — replace hand-rolled avatar circles with `<Avatar><AvatarFallback>AB</AvatarFallback></Avatar>`

**Accordion** — replace manual useState FAQ with `<Accordion type="single" collapsible>` (also fixes aria-expanded issue)

**Tabs** — replace manual tab state with `<Tabs defaultValue="..."><TabsList>...`

**Alert** — replace ad-hoc success/error banners with `<Alert variant="destructive">` / `<Alert>`

## Before vs After Coverage

| Metric | V7.0.8 | V7.0.9 Target |
|---|---|---|
| Documented components | 5 | 18 |
| RAG-retrievable | 5 | 18 |
| Estimated usage rate | 30–40% | 70%+ |
| Components per build (avg) | 1.5 | 3+ |

## Notes

shadcn components are available in the CDN preview sandbox as globals via the component registry bridge. No `import` statement required. The CODEFIX agent now has a hard rule to NEVER convert shadcn components to raw HTML equivalents.
