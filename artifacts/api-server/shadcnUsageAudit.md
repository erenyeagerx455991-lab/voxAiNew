# V7.1.0 — Shadcn/UI Adoption Audit

## Methodology
Static analysis of all 75 component templates. Evidence: direct code inspection of standaloneCode in registry.ts (31), section-templates.ts (16), diversity-templates.ts (28).

## Current Adoption (Template-Level)

### shadcn Components Used in Templates
| Component | Template Appearances | Notes |
|---|---|---|
| None | 0 in registry.ts | All templates use raw HTML |
| None | 0 in section-templates.ts | All templates use raw HTML |
| None | 0 in diversity-templates.ts | All templates use raw HTML |

**Template-level shadcn usage: 0%**

### V7.0.9 Strategy
The V7.0.9 approach relied on:
1. `buildCodeSystem()` Rule 23: documented 18 shadcn components as GLOBALS that agents should use
2. CODEFIX_SYSTEM: instructed not to replace shadcn components once generated

This is **prompt-only** enforcement, not template-level enforcement. The actual generated shadcn adoption depends entirely on whether the LLM follows Rule 23 in each build.

### Custom Components (Raw HTML/Tailwind)
| Pattern | Usage |
|---|---|
| `<button className="...">` | All 23 interactive templates |
| `<input className="...">` | reservation-v1, contact-v1, navbar-dashboard-v2 |
| `<div className="...bg-white/5...">` | All card-based layouts |
| Hardcoded gradient icon divs | features-bento-v1, features-grid-v1, diversity bento templates |

**Raw div percentage (template-level): 100%** — every component uses raw Tailwind divs, not shadcn primitives.

## Gap Analysis: Promised vs. Actual

| V7.0.9 Claim | Reality | Status |
|---|---|---|
| "18 shadcn components documented" | Documented in prompt only, zero templates use them | Partial |
| "70%+ adoption target" | 0% in templates; LLM-dependent at runtime | Not measured |
| "CODEFIX preserves shadcn" | Rule prevents removal, but if not generated, nothing to preserve | Conditional |

## Impact Assessment

### Why Template-Level shadcn Adoption Matters
If a template uses `<Button>` (shadcn), the generated output **always** contains shadcn. If a template uses `<button>`, the LLM must independently decide to upgrade to `<Button>` based only on prompt guidance — which is unreliable.

### Components With Highest Shadcn Upgrade Value
| Raw Pattern | shadcn Equivalent | Impact |
|---|---|---|
| Hero CTA `<button>` | `<Button size="lg">` | All hero variants |
| Feature card | `<Card><CardContent>` | All feature grids |
| Navbar CTA | `<Button variant="outline">` | All navbars |
| Pricing badge | `<Badge>` | All pricing sections |
| FAQ accordion | `<Accordion>` | All FAQ sections (also fixes a11y) |
| Avatar circles | `<Avatar><AvatarFallback>` | Testimonials, team sections |
| Tab menus | `<Tabs><TabsList>` | Menu sections, pricing toggle |

## Honest Adoption Score

| Level | Score | What It Measures |
|---|---|---|
| Template-level shadcn | 0% | Direct template code |
| Prompt-guided shadcn (V7.0.9) | Unknown | LLM runtime compliance — not measured without actual builds |

## Recommendation for V7.1.1
Convert the 10 highest-traffic templates to use shadcn components directly in standaloneCode. This guarantees 100% shadcn adoption for those templates regardless of LLM compliance:

Priority order:
1. faq-accordion-v1 → use `<Accordion>` (also fixes all aria issues)
2. menu-section-v1 → use `<Tabs>` (also fixes tab aria)
3. All pricing templates → add `<Badge>` for plan labels
4. Testimonials templates → add `<Avatar>` for author photos
5. Hero CTAs → upgrade to `<Button size="lg">`
