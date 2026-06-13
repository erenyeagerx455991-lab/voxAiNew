---
name: VoxAI Hero System V2
description: 6 hero layout variants with DNA-aware selector; reference site routing and DNA fallback logic; Groq Code Fix TPM fix.
---

## Hero Variants Added (registry.ts)

| ID | Style | Reference |
|---|---|---|
| hero-centered-v1 | Layered gradient orbs, pill CTAs, stat divider row | Stripe |
| hero-asymmetric-v1 | 2-col grid: text left / terminal mockup right | Vercel |
| hero-editorial-v1 | Oversized type fills viewport, bottom bar w/ CTA | Linear, Notion |
| hero-dashboard-v1 | Compact text top + full-width dashboard mockup below | Analytics SaaS |
| hero-bento-v1 | Bento card mosaic IS the hero, no centered block | Framer, Webflow |
| hero-story-v1 | Light bg, eyebrow rule, editorial type, service tags | Agency, Portfolio |

All V2 variants have `priority: 10` or `11` so they beat `hero-saas-v1` (priority 10).

## Selector Architecture

`selectTemplatesForPrompt(prompt, sectionOrder?, design?, referenceSites?)` in registry.ts.

Priority order inside `selectHeroVariant()`:
1. **HERO_REFERENCE_MAP** — explicit ref site keyword → hero ID (highest priority)
2. **DNA fallback** — `designLanguage` + `heroStyle` + `decorationLevel` + `animationPersonality`
3. **Industry fallback** — `agency`/`portfolio` detected industries → hero-story-v1
4. **Normal scoring** — falls through to priority/industry-based selection

## Reference Site Map
```
stripe/paypal/square/braintree → hero-centered-v1
vercel/netlify/railway/cursor  → hero-asymmetric-v1
linear/notion/craft            → hero-editorial-v1
framer/webflow/figma           → hero-bento-v1
```

## DNA Fallback Rules
- `premium-gradient` + `expressive` → hero-centered-v1
- `monochrome`/`minimal-flat` + `minimal`/`none` decoration → hero-asymmetric-v1
- `minimal-flat` + `none` decoration → hero-editorial-v1
- `expressive` + `rich` decoration (non-layered-depth) → hero-bento-v1

## Groq Code Fix TPM Fix
CODEFIX_MODEL = `llama-3.3-70b-versatile` has 12K TPM limit on free tier.
Old: `max_tokens=8000` → request = ~4K input + 8K output = 12K+ → rate limit error.
Fix: `max_tokens=4096` → request = ~4K input + 4K output = ~8K → within limit.
Code fixer only edits, output ≈ input size, so 4096 is sufficient.

## standaloneCode Template Constraints
- No `${...}` template literals in JSX — they get evaluated inside the TS backtick string
- Use string concatenation: `(val) + 'px'` not `` `${val}px` ``
- Pre-compute arrays for things like bar chart heights (no `Math.random()` unless deterministic)
- No import/export statements in standaloneCode

**Why:** The `standaloneCode` field is itself a TypeScript template literal string. Any `${...}` inside is evaluated at module load time, causing runtime errors or wrong values.
