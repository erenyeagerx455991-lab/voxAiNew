# Design Agent Audit — V7.0.8

Source: `src/agents/llm/prompts.ts` (DESIGN_SYSTEM), `src/agents/frontend/codeSystem.ts` (buildCodeSystem, DEFAULT_DESIGN), `src/agents/pipeline/frontendStep.ts`.
Generated: 2026-06-22.

---

## Agent Role Summary

The Design Agent is step 2 of the frontend pipeline (frontendStep.ts):

```
plannerStep → [Design Agent] → [Frontend Agent] → [Code Fix Agent]
```

**Input:** DESIGN_SYSTEM system prompt + user prompt + DESIGN_BRIEF extracted by Planner.
**Output:** DesignDNA JSON object (23+ tokens).
**Purpose:** Translate business context and reference sites into a precise design token system.

---

## DESIGN_SYSTEM Prompt Structure

The DESIGN_SYSTEM prompt has 4 main sections:

1. **Reference Site DNA Library** — 7 reference sites with full token sets (17 tokens each)
2. **Dominance Rules** — enforcement: primary reference controls entire DNA
3. **Instructions** — 5 procedural rules
4. **Industry Defaults** — 8 industry fallback palettes
5. **Output Schema** — full DesignDNA JSON schema

**Total prompt length:** ~3,200 characters. Well within model context limits.

---

## Reference Site DNA Library Assessment

### Coverage and Completeness

| Site | bg | surface | primary | accent | text | textMuted | border | headingWeight | headingTracking | scale | cardStyle | heroStyle | animation | decoration | visualDensity | buttonStyle | mood |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Linear | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Stripe | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vercel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Notion | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Framer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cursor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perplexity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Library Completeness: 10/10** — All 7 reference sites have all 17 DNA tokens.

---

### DNA Accuracy Assessment (vs. actual sites, 2026)

| Site | bg Accuracy | Typography Accuracy | Animation Accuracy | Overall |
|---|---|---|---|---|
| Linear | `#0F0F0F` ✅ | `font-black tracking-tight` ✅ | `subtle` ✅ | Excellent |
| Stripe | `#0A2540` ✅ | `font-bold scale:xl` ✅ | `expressive` ✅ | Excellent |
| Vercel | `#000000` ✅ | `font-black tracking-tighter` ✅ | `subtle` ✅ | Excellent |
| Notion | `#FFFFFF` ✅ | `font-bold tracking-normal` ✅ | `none` ✅ | Excellent |
| Framer | `#0B0B0B` ✅ | `font-black tracking-tighter` ✅ | `expressive` ✅ | Excellent |
| Cursor | `#0D0D0D` ✅ | `font-bold tracking-tight` ✅ | `subtle` ✅ | Excellent |
| Perplexity | `#1C1C1E` ✅ | `font-semibold tracking-normal` ✅ | `subtle` ✅ | Good |

**DNA Accuracy: 9.5/10** — Token choices match each site's actual visual identity closely.

---

## Dominance Rules Assessment

The DOMINANCE RULES section:

```
- Single reference: The entire DNA must match that reference. No exceptions. No mixing.
- Linear as primary: designLanguage MUST be "minimal-flat", heroStyle MUST be "editorial-large", decorationLevel MUST be "none"
- Stripe as primary: designLanguage MUST be "premium-gradient", heroStyle MUST be "centered-gradient", decorationLevel MUST be "rich"
- Vercel as primary: designLanguage MUST be "monochrome", heroStyle MUST be "split-layout", decorationLevel MUST be "none"
- Framer as primary: designLanguage MUST be "bold-motion", heroStyle MUST be "editorial-large", animationPersonality MUST be "expressive"
- Notion as primary: designLanguage MUST be "editorial", heroStyle MUST be "editorial-large", theme MUST be "light"
- Multiple references: primaryReference controls entire DNA. Secondary references are ignored.
```

**Assessment of dominance coverage:**

| Site | Must-enforce tokens specified | Missing enforcements |
|---|---|---|
| Linear | designLanguage, heroStyle, decorationLevel | Not enforcing: bg color, font-black, visualDensity |
| Stripe | designLanguage, heroStyle, decorationLevel | Not enforcing: bg color (#0A2540), primary color (#635BFF) |
| Vercel | designLanguage, heroStyle, decorationLevel | Not enforcing: bg color (#000000), font-black |
| Framer | designLanguage, heroStyle, animationPersonality | Not enforcing: primary (#FF3D57), decorationLevel |
| Notion | designLanguage, heroStyle, theme | Not enforcing: bg (#FFFFFF), fontFamily:serif |
| Cursor | **Not in DOMINANCE RULES** | ❌ Missing |
| Perplexity | **Not in DOMINANCE RULES** | ❌ Missing |

**Gap:** Cursor and Perplexity have no DOMINANCE RULES entries. A prompt mentioning "like Cursor" will get the DNA from the library but has no must-enforce anchors — the model may drift.

**Gap:** Even defined sites only enforce 3 of 17 DNA tokens as MUST. The remaining 14 rely on the model correctly copying from the library description. For high-stakes tokens like `bg` and `primary` colors, explicit enforcement would improve fidelity.

---

## Instructions Section Assessment

```
1. Identify the primaryReference (first explicitly named reference site in the brief/prompt)
2. If a primaryReference is found, apply ONLY its DNA — do NOT blend with secondary references
3. If no reference is found, derive a unique design identity from business type, industry, and tone
4. NEVER default to purple gradients. NEVER default to glassmorphism unless explicitly appropriate.
5. Every site must have a unique visual identity
```

**Assessment:**

| Instruction | Clarity | Enforceability |
|---|---|---|
| 1. Identify primaryReference | Clear | ✅ — Planner provides it in DESIGN_BRIEF |
| 2. Apply ONLY its DNA | Clear | ⚠️ — Model can still blend; relies on dominance rules |
| 3. Derive unique identity | Clear | ✅ — Industry defaults provided |
| 4. NEVER default to purple/glass | Very specific | ✅ — Common failure pattern explicitly blocked |
| 5. Every site unique | Vague | ⚠️ — No mechanism to verify uniqueness |

**Instructions Score: 8/10** — Well-targeted at known failure modes (purple gradient default, glassmorphism).

---

## Industry Defaults Assessment

8 industry defaults are specified as plain-language descriptions (not JSON):

```
Fintech/Banking → dark navy, blue accent, premium, trust-focused
Healthcare → light clean, green/teal accent, calm, editorial
Food/Restaurant → warm dark, amber accent, textured, sensory
Fashion/Luxury → black/cream, gold accent, serif, editorial
Education → light, indigo accent, readable, comfortable
Developer Tool → dark, green/cyan accent, monospace, dense
Creative Agency → dark, bold accent color, dramatic typography
E-commerce → light clean or dark based on brand, clear CTAs
```

**Assessment:**

| Strength | Issue |
|---|---|
| Plain language is clear for LLM interpretation | No hex codes — agent must derive colors |
| Coverage is strong for common types | No token-level specification (unlike reference sites) |
| `E-commerce: varies` handles ambiguity | Too vague — model may produce inconsistent results |
| `Developer Tool → monospace` correctly sets fontFamily | Missing `fontFamily: serif` for Fashion/Luxury default |

**Industry Defaults Score: 7/10** — Good directionality, but inconsistency vs. the full-token reference site library means industry-derived DNA may vary between builds for the same industry.

---

## Output Schema Assessment

The DESIGN_SYSTEM output schema requests 25+ fields:

| Schema Group | Fields | Assessment |
|---|---|---|
| Primary tokens | designLanguage, layoutStyle, theme, visualDensity, mood | ✅ Clear |
| typographySystem | headingWeight, headingTracking, scale, fontFamily | ✅ Clear |
| spacingSystem | density, sectionPadding, componentGap | ✅ Clear |
| colorSystem | theme, bg, surface, primary, secondary, accent, text, textMuted, border | ✅ Clear |
| Animation | animationPersonality, decorationLevel | ✅ Clear |
| Component tokens | componentPreferences, heroStyle, cardStyle | ✅ Clear |
| Legacy flat tokens | primaryColor, secondaryColor, accentColor, bgColor, bgGradient, headingGradient, buttonStyle, buttonColors, cardStyleTokens | ⚠️ Duplicate of colorSystem |

**Gap:** The schema has duplicated color fields:
- `colorSystem.primary` AND `primaryColor`
- `colorSystem.background` AND `bgColor`
- `colorSystem.theme` AND `theme` (top-level)

This forces the model to populate two token sets. `buildCodeSystem()` handles the fallback chain but the model must be consistent to ensure both are set. A simplified schema with only `colorSystem` would reduce error surface.

**Output Schema Score: 7/10** — Duplication increases the chance of inconsistency.

---

## Pipeline Integration Assessment

### How DESIGN_BRIEF Feeds the Design Agent

The Planner (PLANNER_SYSTEM) produces:

```
---DESIGN_BRIEF---
businessName:
websiteType:
targetAudience:
contentTone:
keyFeatures:
colorMood:
referenceSites:
primaryReference:
secondaryReferences:
---END_BRIEF---
```

**Design Agent receives:** the full DESIGN_BRIEF as part of its user message context.

**Assessment:** `primaryReference` is the critical field. The Design Agent's instruction #1 is to find it. The Planner has explicit reference extraction rules ("NEVER add inferred or competitor sites") that protect the signal quality.

**Risk:** If the Planner misidentifies a reference site (e.g., outputs "similar to Linear-style" instead of "Linear"), the Design Agent may not match it to the DNA library.

---

### Design Agent → Code Gen Agent Handoff

The DesignDNA output from the Design Agent is passed directly to `buildCodeSystem()` which injects all tokens. No transformation or validation occurs between agent output and codegen prompt construction.

**Risk:** If the Design Agent outputs a malformed JSON or omits required fields, `buildCodeSystem()` falls back to defaults via the `?? fallback` chain — **silently**. A build can proceed with partial DNA without any error indication.

**Recommendation:** Add a validation step in frontendStep.ts that checks required DesignDNA fields before calling `buildCodeSystem()`, logging a warning if fallbacks are applied.

---

## Summary Scorecard

| Dimension | Score | Notes |
|---|---|---|
| Reference Site Library Completeness | 10/10 | 7 sites × 17 tokens, all accurate |
| Dominance Rule Coverage | 7/10 | Cursor and Perplexity missing; only 3 tokens enforced per site |
| Industry Default Quality | 7/10 | Plain language, no hex codes, inconsistent vs. reference sites |
| Output Schema Design | 7/10 | Duplicated flat + nested color tokens |
| Instructions Clarity | 8/10 | Well-targeted; minor vagueness on "unique identity" |
| Pipeline Integration | 7/10 | No DNA validation; silent fallbacks |
| **OVERALL** | **7.7/10 — Good** | Strong core; specific fixable gaps |

---

## Priority Fixes

1. **Add Cursor and Perplexity to DOMINANCE RULES** — 2 lines each, ensures color/heroStyle anchoring
2. **Add hex-code industry defaults** — replace plain-language descriptions with actual hex values (e.g., Fintech: `bg: #0D1B2A, primary: #3B82F6`)
3. **Simplify schema — remove legacy flat tokens** — or at least make them derived from colorSystem, not independently specified
4. **Add DNA validation in frontendStep.ts** — check required fields (bg, primary, heroStyle) are present before calling buildCodeSystem()
5. **Add layout style to DOMINANCE RULES** — `Vercel as primary → layoutStyle MUST be "flat-ui"`, `Linear → layoutStyle MUST be "editorial-flow"`
