# Design System Audit — V7.0.8

Source: `src/agents/frontend/codeSystem.ts` (DEFAULT_DESIGN, buildCodeSystem), `src/agents/llm/prompts.ts` (DESIGN_SYSTEM).
Generated: 2026-06-22.

---

## Design System Architecture

VoxAI uses a **DesignDNA** object as the central design token carrier, flowing through:

```
DESIGN_SYSTEM prompt (LLM) → DesignDNA JSON → buildCodeSystem() → Code Gen Agent
```

### DesignDNA Interface (from DEFAULT_DESIGN + usage)

| Token | Values | Default |
|---|---|---|
| `designLanguage` | minimal-flat, premium-gradient, monochrome, editorial, bold-motion, dev-minimal, academic-clean, warm-organic, luxury-editorial | monochrome |
| `layoutStyle` | flat-ui, layered-depth, grid-strict, editorial-flow, asymmetric, dense-grid | flat-ui |
| `typographySystem.headingWeight` | font-black, font-bold, font-semibold | font-black |
| `typographySystem.headingTracking` | tracking-tighter, tracking-tight, tracking-normal, tracking-wide | tracking-tighter |
| `typographySystem.scale` | xl, lg, md | lg |
| `typographySystem.fontFamily` | sans, serif, mono | sans |
| `spacingSystem.density` | tight, comfortable, spacious | balanced |
| `spacingSystem.sectionPadding` | py-16, py-20, py-24, py-32 | py-24 |
| `spacingSystem.componentGap` | gap-3, gap-4, gap-6, gap-8 | gap-6 |
| `colorSystem.theme` | dark, light | dark |
| `colorSystem.background` | hex | #0a0a0a |
| `colorSystem.surface` | hex | #141414 |
| `colorSystem.primary` | hex | #ffffff |
| `colorSystem.secondary` | hex | #e5e5e5 |
| `colorSystem.accent` | hex | #ffffff |
| `colorSystem.text` | hex | #ffffff |
| `colorSystem.textMuted` | hex | #666666 |
| `colorSystem.border` | hex/rgba | #2a2a2a |
| `animationPersonality` | none, subtle, moderate, expressive | subtle |
| `decorationLevel` | none, minimal, moderate, rich | none |
| `heroStyle` | centered-minimal, centered-gradient, split-layout, editorial-large, fullbleed-overlay | centered-minimal |
| `cardStyle` | flat-bordered, glass-blur, solid-surface, gradient-border, outline-hover | flat-bordered |
| `visualDensity` | sparse, balanced, dense | balanced |
| `mood` | one word | Sharp |

**Legacy flat tokens** (kept for backward compat): `theme`, `primaryColor`, `secondaryColor`, `accentColor`, `bgColor`, `bgGradient`, `headingGradient`, `buttonStyle`, `buttonColors`, `cardStyleTokens`.

---

## buildCodeSystem() Token Injection Assessment

`buildCodeSystem()` translates DesignDNA tokens into explicit Tailwind guidance injected into the code-gen prompt. This is the critical bridge between design intent and generated output.

### Typography Injection

```
Heading weight: ${headingWeight}        ← direct token injection
Heading tracking: ${headingTracking}    ← direct token injection
Hero heading size: ${headingScale}      ← derived: xl→text-6xl md:text-8xl, lg→text-5xl md:text-7xl
Section heading size: ${subHeadingScale}← derived
Font family: ${fontFamily}              ← class injected as font-${fontFamily}
```

**Assessment:** Good. `headingScale` derivation is correct and covers all 3 scale values.

**Gap:** No line-height guidance. `leading-none` vs `leading-tight` vs `leading-relaxed` is not specified per scale — left to model discretion.

---

### Color Injection

```
Background: ${bg}         ← colorSystem.background ?? bgColor ?? '#0a0a0a'
Surface: ${surface}       ← colorSystem.surface ?? '#1a1a1a'
Primary: ${primary}       ← colorSystem.primary ?? primaryColor ?? '#ffffff'
Accent: ${accent}         ← colorSystem.accent ?? accentColor ?? primary
Text: ${textColor}        ← colorSystem.text ?? '#ffffff'
TextMuted: ${textMuted}   ← colorSystem.textMuted ?? '#888888'
Border: ${borderColor}    ← colorSystem.border ?? '#333333'
Heading Gradient: ${headingGradient}
```

**Assessment:** Complete. Fallback chain is well-ordered: `colorSystem.field ?? legacyField ?? hardcoded`.

**Gap:** `secondary` color from `colorSystem.secondary` is not injected. Code-gen agent has no signal for what `secondary` means. This field is defined in the DesignDNA schema and populated by the Design Agent, but unused downstream.

---

### Card Style Injection

```typescript
switch (design.cardStyle) {
  'flat-bordered':   'bg-[${surface}] border border-[${borderColor}] rounded-xl'
  'glass-blur':      'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl'
  'solid-surface':   'bg-[${surface}] rounded-xl'
  'gradient-border': 'bg-[${surface}] border border-[${accent}]/30 rounded-2xl hover:border-[${accent}]/60'
  'outline-hover':   'bg-transparent border border-[${borderColor}] hover:border-[${primary}] rounded-lg'
}
```

**Assessment:** All 5 card styles are mapped. `gradient-border` correctly uses accent color. `glass-blur` uses hardcoded `bg-white/5` regardless of theme (fails on light theme where glass blur is transparent-black not transparent-white).

**Gap:** `glass-blur` on light theme would produce invisible cards. Should use `bg-black/5` when `isLight` is true.

---

### Button Style Injection

```typescript
const buttonGuide = (() => {
  if (comps.includes('ghost-button')) → border + transparent
  if (comps.includes('outline-button')) → border only
  default → 'bg-[${primary}] text-white hover:opacity-90 ${radius}'
})()
```

**Assessment:** Covers 3 button styles. The default solid button always uses `text-white` even when `primary` is a light color (e.g., Notion DNA `primary: #37352F` with Notion `theme: light` — dark button text would be wrong here since bg is very dark).

**Gap:** For light theme builds with dark primary colors, the button text color derivation is wrong. Should derive text color from primary color luminance.

---

### Hero Layout Injection

```
'centered-minimal':  'min-h-screen flex flex-col items-center justify-center text-center px-6 — clean'
'centered-gradient': 'min-h-screen flex flex-col items-center justify-center text-center px-6 — add gradient orbs'
'split-layout':      'min-h-screen grid grid-cols-1 md:grid-cols-2 gap-0 — left text, right visual'
'editorial-large':   'min-h-screen flex flex-col justify-end px-8 md:px-16 pb-24 — oversized text, minimal content'
'fullbleed-overlay': 'min-h-screen relative — full background with overlay, centered content'
```

**Assessment:** All 5 heroStyles mapped. Hero guide is textual description, not CSS directive — relies on model to interpret correctly. This can lead to variability between builds.

**Gap:** `split-layout` says `grid-cols-1 md:grid-cols-2 gap-0` but the description adds "left: text content, right: visual/mockup" without specifying which column comes first in markup. This ambiguity creates inconsistency between builds.

---

### Animation Injection

```
'none':       'No hover animations. No transitions. Static elements only.'
'subtle':     'Subtle hover effects only: hover:opacity-80, hover:border-color transitions (duration-200).'
'moderate':   'Moderate hover effects: hover:scale-[1.02], hover:-translate-y-1, color transitions (duration-300).'
'expressive': 'Rich animations: hover:scale-105, hover:-translate-y-2, gradient shimmer...'
```

**Assessment:** Clear progressive scale. Textual directives — model must internalize them.

**Gap:** No JavaScript animation guidance for state-driven animations (e.g., accordion expand, modal fade). `animationPersonality: expressive` currently implies CSS-only expressive animations.

---

### Layout Style Injection

| Style | Injection Quality |
|---|---|
| editorial-flow | Excellent — precise rules: oversized heading, left-aligned, horizontal rules |
| grid-strict | Good — explicit grid column counts |
| asymmetric | Good — alternating direction, unequal columns |
| layered-depth | Good — z-index, negative margins, shadow |
| dense-grid | Good — max py-16, text-sm, tight gaps |
| flat-ui (default) | **No injection** — default produces no layout rules |

**Gap:** `flat-ui` (the default and most common layoutStyle) injects nothing. No explicit layout guidance for the majority of builds. The code-gen agent gets zero layout direction unless a non-default layoutStyle is selected.

---

### Structure Variation Engine

```typescript
const variationSeed = blueprint.sectionOrder.join('').charCodeAt-hash;
const featureCount = 3 + (variationSeed % 3);   // 3, 4, or 5
const statCount = 2 + (variationSeed % 2);       // 2 or 3
const accentVariant = ['side-border', 'number-prefix', 'horizontal-rule'][variationSeed % 3];
```

**Assessment:** Deterministic variation per project (same prompt = same seed = same variation). Good for reproducibility. The seed is a function of section order, so different page blueprints produce different variation parameters.

**Gap:** `featureCount: 3-5` and `statCount: 2-3` are variation parameters but the system prompt directive says "use exactly ${featureCount}" — the agent may not always respect this.

---

## Reference Site DNA Library Completeness

| Reference | DNA Tokens Defined | Design Agent Uses |
|---|---|---|
| Linear | 17 tokens | ✅ |
| Stripe | 17 tokens | ✅ |
| Vercel | 17 tokens | ✅ |
| Notion | 17 tokens | ✅ |
| Framer | 17 tokens | ✅ |
| Cursor | 17 tokens | ✅ |
| Perplexity | 17 tokens | ✅ |

All 7 reference sites are fully specified with identical token structures.

---

## Industry Default DNA Assessment

| Industry | Background | Accent | Theme | Typography |
|---|---|---|---|---|
| Fintech/Banking | dark navy | blue | dark | premium |
| Healthcare | light clean | green/teal | light | editorial |
| Food/Restaurant | warm dark | amber | dark | sensory |
| Fashion/Luxury | black/cream | gold | dark/light | serif |
| Education | light | indigo | light | readable |
| Developer Tool | dark | green/cyan | dark | monospace |
| Creative Agency | dark | bold color | dark | dramatic |
| E-commerce | light/dark | clear CTAs | varies | clear |

**Assessment:** 8 industry defaults defined. Good coverage. 

**Gap:** No explicit tokens for: sports/fitness, healthcare tech, non-profit, real-estate, legal. These use fallback generic dark pattern.

---

## DEFAULT_DESIGN Token Assessment

The `DEFAULT_DESIGN` object is the fallback when no DNA is produced:

```
designLanguage: "monochrome"    ← Correct neutral choice
theme: "dark"                   ← Dark default is appropriate
background: "#0a0a0a"           ← Near-black, good contrast
primary: "#ffffff"              ← White-on-black, maximum contrast
heroStyle: "centered-minimal"   ← Appropriate generic default
animationPersonality: "subtle"  ← Conservative default
decorationLevel: "none"         ← Clean default
```

**Assessment:** All defaults are well-chosen. The monochrome/dark/centered-minimal default produces clean, readable output even without any DNA. Score: 9/10.

---

## Summary Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Token Coverage | 8/10 | secondary color unused; line-height not specified |
| Reference Site Library | 10/10 | All 7 fully defined with 17 tokens each |
| Industry Defaults | 7/10 | 8 industries; 5+ missing |
| buildCodeSystem() Injection | 8/10 | flat-ui default has no layout rules |
| Color Adaptation | 7/10 | glass-blur breaks on light theme; button text wrong for dark-primary+light-theme |
| Structure Variation | 8/10 | Deterministic seed is clever; agent compliance uncertain |
| DEFAULT_DESIGN | 9/10 | Excellent neutral fallback |
| **OVERALL** | **8.1/10** | Strong system with specific fixable gaps |

---

## Priority Fixes

1. **Inject flat-ui layout rules** in `buildCodeSystem()` to give the default layoutStyle explicit direction
2. **Fix glass-blur on light theme** — use `bg-black/5` when `isLight` is true
3. **Inject secondary color** — it is currently populated but never used downstream
4. **Derive button text color from primary luminance** — prevents white-text on white-button on light builds
5. **Fix split-layout description** — specify "left column (first in markup)" explicitly
