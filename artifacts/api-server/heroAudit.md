# Hero Variant System Audit — V7.0.8

Source: direct inspection of `src/components/registry.ts` hero entries.
Generated: 2026-06-22.

---

## Hero Variant Inventory (10 total)

| ID | Name | DNA Target | Layout Style | Theme | Priority |
|---|---|---|---|---|---|
| hero-saas-v1 | Hero SaaS | generic/ai/startup | centered | dark | 10 |
| hero-restaurant-v1 | Hero Restaurant | restaurant | centered fullbleed | dark | 10 |
| hero-portfolio-v1 | Hero Portfolio | portfolio/agency | bottom-anchored split | dark | 10 |
| hero-ai-v2 | Hero AI Animated | ai/startup | centered + orbs | dark | 9 |
| hero-centered-v1 | Hero Centered Premium | saas/fintech (Stripe DNA) | centered + gradient orbs | dark | 11 |
| hero-asymmetric-v1 | Hero Asymmetric Split | saas/generic (Vercel DNA) | 2-col text+terminal | dark | 11 |
| hero-editorial-v1 | Hero Editorial Typography | saas/ai (Linear DNA) | editorial bottom-bar | dark | 11 |
| hero-dashboard-v1 | Hero Dashboard Preview | saas/analytics | top text + full-width mockup | dark | 10 |
| hero-bento-v1 | Hero Bento Grid | saas/agency (Framer DNA) | card mosaic grid | dark | 10 |
| hero-story-v1 | Hero Narrative Story | agency/portfolio | editorial split bottom-bar | **light** | 10 |

---

## Layout Diversity Matrix

| Layout Pattern | Heroes Using It |
|---|---|
| Centered (text + CTAs stacked) | hero-saas-v1, hero-restaurant-v1, hero-ai-v2, hero-centered-v1 |
| Two-column grid | hero-asymmetric-v1 |
| Editorial (oversized type, bottom bar) | hero-editorial-v1, hero-story-v1 |
| Full-width product mockup below text | hero-dashboard-v1 |
| Card mosaic / bento grid | hero-bento-v1 |
| Bottom-anchored flex-col | hero-portfolio-v1 |

**Score: 6 unique layout patterns across 10 variants. Excellent.**

---

## DNA Alignment Assessment

### Reference Site Coverage

| Reference Site DNA | Hero Variant | Match |
|---|---|---|
| Linear (editorial-large, minimal-flat) | hero-editorial-v1 | ✅ Exact — oversized type, bottom bar, no badge, no stats |
| Stripe (centered-gradient, premium-gradient) | hero-centered-v1 | ✅ Exact — #0A2540 bg, #635BFF accent, gradient orbs, pill CTAs |
| Vercel (split-layout, monochrome) | hero-asymmetric-v1 | ✅ Exact — black bg, white primary, terminal mockup, 2-col grid |
| Framer (bold-motion, expressive) | hero-bento-v1 | ✅ Exact — card mosaic, violet accent, hover:scale animation |
| Notion (editorial-large, light) | **None** | ❌ Missing — no light editorial hero |
| Cursor (centered-minimal, dev-minimal) | **None** | ❌ Missing — hero-ai-v2 partially covers but lacks green/cyan accent |
| Perplexity (centered-minimal, academic-clean) | **None** | ❌ Missing — no academic-clean hero |

**Reference Coverage: 4/7 (57%).** Three reference site DNAs have no dedicated hero variant.

---

## Structural Quality Assessment

### hero-saas-v1

**Strengths:**
- Stats row adds social proof
- Dual CTAs (primary/secondary) correct
- Animate-pulse badge draws attention

**Weaknesses:**
- Hard-coded violet gradient: `from-violet-600 to-blue-600` — does not adapt to design DNA colors
- `from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a]` baked in — ignores colorSystem.background
- Stats use `text-gray-500` which could fail contrast on some surface colors
- No aria-label on buttons

**Rating: 7/10**

---

### hero-centered-v1 (Stripe DNA)

**Strengths:**
- Three layered gradient orbs match Stripe's visual language precisely
- `#0A2540` background hard-coded to Stripe brand
- Pill CTAs match Stripe's `rounded-full` button style
- Stats bar with `border-t border-white/8` matches Stripe design rhythm

**Weaknesses:**
- Completely hard-coded to Stripe palette — cannot adapt if design DNA calls different accent
- Stats are hardcoded strings ("99.99% Uptime SLA", "$0 Setup fee") — copy agent must overwrite
- No mobile hamburger menu reference (handled by separate navbar component)

**Rating: 9/10** (best DNA fidelity in the set)

---

### hero-asymmetric-v1 (Vercel DNA)

**Strengths:**
- `bg-black` + monochrome scheme matches Vercel exactly
- Terminal mockup (traffic lights + monospace cmdLines) is a realistic product preview
- `font-black tracking-tighter leading-[0.92]` matches Vercel's tightly-set headings
- `hidden md:block` correctly hides terminal on mobile — good responsive practice

**Weaknesses:**
- Hard-coded `text-[#00FFF0]` for the leading command line — this is a Vercel/dev-minimal accent color that won't adapt
- `style={{height: h + 'px'}}` — one inline style but not for webkit, borderline violation of ABSOLUTE TECHNICAL RULES rule 6
- Terminal content is generic (`PRODUCT_COMMAND`) — placeholder copy not adapted

**Rating: 8/10**

---

### hero-editorial-v1 (Linear DNA)

**Strengths:**
- `style={{fontSize: 'clamp(52px, 9vw, 128px)'}}` — fluid typography done right (exempt from style= ban as WebkitTextStroke pattern)
- No badge, no stats, no orbs — pure typography as intended for Linear DNA
- Bottom divider bar pattern is an exact Linear copy
- `tracking-[-0.04em]` — precise tracking spec rather than Tailwind preset

**Weaknesses:**
- `style={{fontSize: '...'}}` uses inline style, not a Tailwind class — a rule violation (ABSOLUTE TECHNICAL RULES rule 6) that CODEFIX should catch but won't because this pattern is structural
- Subheadline `text-white/35` — very low contrast (35% opacity on dark bg)
- No interactive animations even though `animationPersonality: subtle` would allow hover transitions
- CTA buttons have no type="button" attribute

**Rating: 8/10**

---

### hero-dashboard-v1

**Strengths:**
- Full-width product mockup is visually impressive and immediately communicates "SaaS product"
- Bar chart using inline heights + array of heights is clever and avoids any SVG complexity
- KPI cards with 3-col grid inside mockup look realistic
- Sidebar nav items add product realism

**Weaknesses:**
- `style={{height: h + 'px'}}` on bar chart elements — inline styles for dynamic heights are unavoidable here but technically violate rule 6
- The `barHeights` array is 24 items — the bar chart resolution is fixed at 24 bars
- `min-h-[calc(100vh-80px)]` — not used here but the pattern would be calc-based
- Mockup is always dark — does not adapt to light theme builds

**Rating: 8/10**

---

### hero-bento-v1

**Strengths:**
- Grid mosaic is structurally unique — no other hero looks like this
- `grid-cols-12` with col-span arithmetic creates sophisticated asymmetric layout
- hover:scale-[1.01] adds expressive animation matching Framer DNA
- Integration chips inside bento card add product context

**Weaknesses:**
- `style={{gridTemplateRows: 'repeat(3, auto)'}}` — inline style for grid template (unavoidable but still violates rule 6)
- Hard-coded violet gradient `from-violet-600 to-fuchsia-600` — ignores DNA accent color
- Headline card uses violet which may conflict with some design DNA palettes

**Rating: 7/10**

---

### hero-story-v1 (Light Theme)

**Strengths:**
- Only light-background hero in the entire library — critical for Notion DNA and agency sites
- Service tags row creates a unique editorial bottom bar
- Agency-specific copy pattern is authentic

**Weaknesses:**
- `bg-[#f5f5f0]` hard-coded — cannot adapt to a Notion-style `bg-[#FFFFFF]`
- Service tags are hardcoded: `['Brand Strategy', 'Web Design', 'Motion', 'Development']`
- Eyebrow label `AGENCY_TYPE` placeholder is not standard (other heroes use `HEADLINE_BADGE`)
- No CTA primary button — only link text ("Let's talk →") — may be too minimal for agency conversion

**Rating: 7/10**

---

## Responsiveness Assessment

| Hero | Mobile Hidden Elements | Responsive Classes | Score |
|---|---|---|---|
| hero-saas-v1 | None | `text-5xl md:text-7xl`, `flex-col sm:flex-row` | ✅ |
| hero-restaurant-v1 | None | `text-6xl md:text-8xl`, `flex-col sm:flex-row` | ✅ |
| hero-portfolio-v1 | None | `text-7xl md:text-9xl`, `flex-col md:flex-row` | ✅ |
| hero-ai-v2 | None | `text-5xl md:text-7xl`, `flex-col sm:flex-row` | ✅ |
| hero-centered-v1 | None | `text-5xl md:text-7xl`, `flex-col sm:flex-row` | ✅ |
| hero-asymmetric-v1 | Terminal mockup (`hidden md:block`) | `grid md:grid-cols-2` | ✅ |
| hero-editorial-v1 | None | `flex-col md:flex-row`, `px-8 md:px-16` | ✅ |
| hero-dashboard-v1 | None | `text-4xl md:text-6xl`, `grid-cols-3` (mockup doesn't collapse) | ⚠️ Mockup is fixed-height on mobile |
| hero-bento-v1 | None | `grid-cols-12` with `md:col-span-N` fallbacks | ✅ |
| hero-story-v1 | None | `flex-col md:flex-row` | ✅ |

**Responsive Score: 9/10 (hero-dashboard-v1 mockup does not collapse gracefully on mobile)**

---

## Routing Logic Assessment

Routing lives in `src/components/registry.ts` `selectComponents()` function.

**Priority system:** hero-centered-v1, hero-asymmetric-v1, hero-editorial-v1 all use `priority: 11` — they take precedence over the `priority: 10` variants for their respective DNA targets.

**DNA → hero routing:**
- `heroStyle: 'editorial-large'` → hero-editorial-v1 (Linear/Framer DNA)
- `heroStyle: 'split-layout'` → hero-asymmetric-v1 (Vercel DNA)
- `heroStyle: 'centered-gradient'` → hero-centered-v1 (Stripe DNA)
- `heroStyle: 'centered-minimal'` → hero-saas-v1, hero-ai-v2, hero-dashboard-v1 (by industry)
- `heroStyle: 'fullbleed-overlay'` → hero-restaurant-v1 (restaurant industry)

**Gaps:** No hero maps to heroStyle: 'editorial-large' for Notion DNA (which uses theme: light). The routing would fall to hero-editorial-v1 (dark), which is wrong.

---

## Summary Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Layout Diversity | 9/10 | 6 distinct layout patterns |
| DNA Alignment | 7/10 | 4/7 reference sites covered; Notion/Cursor/Perplexity missing |
| Code Quality | 7/10 | Inline style violations in 4/10 components; no aria attributes |
| Responsiveness | 9/10 | All mobile-aware; dashboard mockup gap |
| Routing Logic | 8/10 | Priority system solid; Notion light-theme routing gap |
| **TOTAL** | **8/10** | Good system with specific fixable gaps |

---

## Priority Fixes

1. **Add hero-notion-v1** — Light editorial hero (`bg-[#FFFFFF]`, `text-[#37352F]`, `editorial-large`, Notion DNA)
2. **Fix hero-dashboard-v1 mobile** — Wrap mockup in `overflow-x-auto` or hide on `sm:hidden`
3. **Remove hardcoded palettes** — hero-saas-v1, hero-bento-v1 should reference design DNA tokens not hard-coded violet
4. **Add type="button"** to all button elements to prevent accidental form submission
5. **Fix hero-editorial-v1 inline fontSize** — Use `text-[clamp(52px,9vw,128px)]` Tailwind arbitrary value instead of style={}
