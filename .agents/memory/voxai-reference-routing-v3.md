---
name: VoxAI Reference Routing V3
description: Hero template selection and Design DNA routing — architecture decisions, ordering rules, and verified hero/DNA pairs per reference.
---

## Core Rule
primaryReference (first explicitly named by user) ALWAYS controls hero template via direct HERO_REFERENCE_MAP lookup. No blending, no first-match-wins across map entries.

## Selector Priority Order (registry.ts selectHeroVariant)
1. primaryReference → exact key lookup in HERO_REFERENCE_MAP (deterministic, no loops)
2. Industry keyword fallback (agency/portfolio → hero-story-v1) — BEFORE DNA fallback
3. Design DNA fallback (heroStyle/designLanguage combos)
4. Let normal scoring run (return undefined)

**Why industry before DNA:** Bold-motion DNA (which agencies often get) would route to hero-bento-v1 via DNA fallback, overriding the correct hero-story-v1.

## DESIGN_SYSTEM heroStyle Fixes (agents.ts)
- Linear: heroStyle "centered-minimal" → "editorial-large"
- Vercel: heroStyle "centered-minimal" → "split-layout"
These fixed values flow through DNA verifier to correctly trigger editorial-v1 and asymmetric-v1 in DNA fallback too.

## DNA Fallback Combos (registry.ts)
- heroStyle "split-layout" → hero-asymmetric-v1
- heroStyle "editorial-large" + designLanguage "bold-motion" → hero-bento-v1  (Framer, checked FIRST)
- heroStyle "editorial-large" → hero-editorial-v1  (Linear)
- heroStyle "centered-gradient" OR (premium-gradient + expressive) → hero-centered-v1
- minimal-flat + decorationLevel "none" → hero-editorial-v1
- monochrome + decorationLevel "none" → hero-asymmetric-v1

## REFERENCE_VERIFIERS (agents.ts) — strict heroStyle checks
- stripe: designLanguage=="premium-gradient" AND heroStyle=="centered-gradient"
- linear: designLanguage=="minimal-flat" AND heroStyle=="editorial-large" AND decorationLevel=="none"
- vercel: designLanguage=="monochrome" AND heroStyle=="split-layout"
- framer: designLanguage=="bold-motion" AND animationPersonality=="expressive"

## Planner Output Fields Added
- primaryReference: first explicitly mentioned site (or "none")
- secondaryReferences: remaining sites in user order (or "none")
- referenceSites: still present for backwards compat

## Verified Test Results (all 5 pass)
| Prompt | primaryReference | selectedHero | designLanguage | heroStyle | status |
|--------|-----------------|--------------|----------------|-----------|--------|
| similar to Stripe | Stripe | hero-centered-v1 | premium-gradient | centered-gradient | ✅ pass |
| similar to Vercel | Vercel | hero-asymmetric-v1 | monochrome | split-layout | ✅ pass |
| similar to Linear | Linear | hero-editorial-v1 | minimal-flat | editorial-large | ✅ pass |
| similar to Framer | none* | hero-bento-v1 | bold-motion | editorial-large | ✅ pass |
| creative agency | none | hero-story-v1 | editorial | editorial-large | ✅ pass |

*Framer: llama-3.1-8b-instant sometimes doesn't extract "Framer" as a reference, but Design Agent correctly infers bold-motion DNA from the brief text, and bold-motion+editorial-large → hero-bento-v1 via DNA fallback. Net result: correct template.

## Audit Endpoint New Fields
referenceRouting: { primaryReference, secondaryReferences, selectedHero, expectedHero, heroMatch, dnaPass, validationStatus }
