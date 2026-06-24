# V7.2.5 Navbar Audit

## Scope
8 navbar templates scanned across `registry.ts` and `diversity-templates.ts`.

---

## Template Inventory

| ID | Name | Priority | Mobile Menu | Dropdown | aria-label | shadcn Usage | Score |
|---|---|---|---|---|---|---|---|
| `navbar-modern-v1` | Navbar Modern | 9 | None (hidden md:flex) | None | ✅ | `button` raw | 5/10 |
| `navbar-minimal-v1` | Navbar Minimal | 8 | None (hidden md:flex) | None | ✅ | `a` raw | 4/10 |
| `navbar-minimal-v2` | Navbar Minimal Transparent | 12 | None (hidden md:flex) | None | ❌ | None | 4/10 |
| `navbar-editorial-v2` | Navbar Editorial Bold | 11 | None (hidden md:flex) | None | ❌ | None | 3/10 |
| `navbar-enterprise-v2` | Navbar Enterprise Double Row | 11 | None (hidden md:flex) | None | ❌ | None | 4/10 |
| `navbar-dashboard-v2` | Navbar Dashboard App Bar | 10 | None | None | ❌ | None | 4/10 |
| `navbar-floating-v2` | Navbar Floating Island | 11 | None (hidden md:flex) | None | ❌ | None | 3/10 |
| `navbar-centered-v2` | Navbar Centered Logo | 10 | None (hidden md:flex) | None | ❌ | None | 3/10 |

---

## Top 5 Templates (pre-V7.2.5)

1. `navbar-modern-v1` — Has aria-label, focus-visible:ring, type="button". Best existing template.
2. `navbar-minimal-v1` — Has aria-label, focus-visible:ring on links. Good a11y baseline.
3. `navbar-enterprise-v2` — Two-tier layout, best structural complexity. Missing a11y.
4. `navbar-minimal-v2` — Clean Linear DNA. Missing a11y + mobile.
5. `navbar-floating-v2` — Creative pill layout. Missing a11y + mobile.

## Bottom 5 Templates (pre-V7.2.5)

1. `navbar-editorial-v2` — No aria-label, no mobile menu, no shadcn. Bare minimum.
2. `navbar-centered-v2` — Symmetric but incomplete. No a11y, no mobile.
3. `navbar-floating-v2` — No a11y, no mobile.
4. `navbar-minimal-v2` — No a11y, no mobile despite claiming Linear DNA.
5. `navbar-dashboard-v2` — No NavigationMenu, no Sheet, no a11y.

---

## Gaps Identified

| Gap | Affected Templates | Impact |
|---|---|---|
| No NavigationMenu usage | All 8 | High — misses structured nav semantics |
| No Sheet mobile menu | All 8 | High — mobile navigation broken |
| No aria-label on nav | 6/8 | High — WCAG 2.4.1 violation |
| No focus-visible:ring on links | 6/8 | High — keyboard nav broken |
| No dropdown/mega menu | All 8 | Medium — competitor gap vs Lovable/Bolt/v0 |
| Custom toggle instead of Sheet | All 8 | Medium — inconsistent pattern |

---

## V7.2.5 New Standard

### Required Components
- `NavigationMenu` — wraps desktop nav
- `NavigationMenuList` — list of menu items
- `NavigationMenuItem` — individual item
- `NavigationMenuTrigger` — trigger for dropdown content
- `NavigationMenuContent` — dropdown content panel
- `NavigationMenuLink` — styled anchor within nav

### Optional Enhancements
- `Sheet` + `SheetContent` — mobile menu (side drawer)
- `Button` — CTA button
- `Separator` — visual dividers
- `Badge` — new feature indicators

### Rules
- **NEVER** build desktop navigation with raw `<div>` groups
- **ALWAYS** use `NavigationMenu` for desktop navigation
- **ALWAYS** use `Sheet` for mobile menu — no custom overlay systems
- **ALWAYS** add `aria-label="Main navigation"` to the root `<nav>`
- **ALWAYS** add `type="button"` to the mobile toggle button
- **ALWAYS** add `aria-expanded` to the mobile toggle button
- **ALWAYS** add `aria-hidden="true"` to decorative icons
- **ALWAYS** add `focus-visible:outline-none focus-visible:ring-2` to all interactive elements

---

## V7.2.5 New Templates (Priority 15)

| ID | DNA | Mobile | Mega Menu | Badge |
|---|---|---|---|---|
| `navbar-navigation-v1` | Linear / Vercel | Sheet | 1 trigger | No |
| `navbar-navigation-v2` | Framer / creative | Sheet | 2 triggers | No |
| `navbar-navigation-v3` | Enterprise | Sheet | 3 triggers | Yes |
| `navbar-navigation-enterprise-v1` | Stripe | Sheet | Wide mega menu | Yes |
| `navbar-navigation-saas-v1` | Generic SaaS | Sheet | No trigger | Badge CTA |

---

## Expected Outcome

| Metric | Before | After |
|---|---|---|
| NavigationMenu usage | 0% | 100% new builds |
| Sheet mobile menu | 0% | 100% new builds |
| aria-label compliance | 25% | 100% |
| focus-visible compliance | 25% | 100% |
| Overall navbar score | 3.8/10 | 8.5/10 |
