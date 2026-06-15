---
name: VoxAI V4.5 DNA Composition Engine
description: Multi-brand DNA fusion architecture replacing winner-takes-all reference routing; section ownership resolved algorithmically per brand strengths.
---

## The rule
`primaryReference` no longer controls the entire design. Multiple brands contribute by percentage (e.g. Stripe 40% + Linear 35% + Framer 25%) and each section (hero, pricing, footer…) gets an independent owner decided by `brandStrength × compositionPct`.

**Why:** "Winner takes all" means 51% Stripe erases all Linear/Framer influence. Composition makes multi-brand prompts meaningful.

## Architecture

### Server (`agents.ts` — after build route, before router.post)
- `DNAComposition` interface: `{ stripe, linear, framer, vercel, notion, cursor, raycast: number }`
- `BRAND_STRENGTHS_V45`: per-brand scores per section (hero/pricing/cta/animations etc.)
- `extractDNAComposition(prompt, referenceSites, primaryRef, secondaryRefs, groqKey)`: 3-tier fallback — explicit % regex → equal split with position bonus → AI (llama-3.1-8b-instant, 300 tokens)
- `resolveSectionOwnershipServer(dna, sections)`: picks winner per section
- `generateThemeTokensServer(dna)`, `generateMotionProfileServer(dna)`: pure algorithmic
- `buildDNAContextString(dna, ownership, theme)`: markdown block injected into Design Agent prompt
- DNA runs **within step 0** (Planner Agent), fires `{ type: "dna_composition", composition, sectionOwnership, themeTokens, motionProfile }` SSE before Architecture Agent starts
- `done` SSE includes `dnaComposition`, `sectionOwnership`, `themeTokens`, `motionProfile`

### Client
- `src/lib/dnaMixer.ts` — normalizeDNA, getActiveBrands, parseDNAFromText, BRAND_COLOR/LABEL (Record<string,string>)
- `src/lib/componentOwnership.ts` — BRAND_STRENGTHS, resolveSectionOwnership, SectionOwnership = Record<string,string>
- `src/theme/themeBuilder.ts` — generateThemeFromComposition, generateMotionProfile, TypographyProfile; brand fields typed as `string` (not BrandKey) to be compatible with server JSON
- `src/components/DNACompositionPanel.tsx` — compact visual panel with composition bars, section ownership grid, theme swatches, motion badge; shown as absolute overlay during build
- `mockAiService.ts` — `onDnaComposition?: (data: DNABuildData) => void` as 6th param of mockStreamResponse
- `useAppStore.ts` — `dnaCompositionRef` ref for stale-closure-safe memory persistence; 4 DNA state vars; referenceComposition stored in ProjectMemory
- `WorkspacePreviewPanel.tsx` — shows DNACompositionPanel as absolute bottom overlay when isBuilding && all DNA data available

## Type compatibility note
Server returns plain `string` for brand names (as JSON). Client's `BRAND_COLOR`, `BRAND_LABEL`, `SectionOwnership` must use `Record<string,string>` NOT `Record<BrandKey,string>` to avoid structural mismatch. ThemeTokens `primaryBrand/surfaceBrand/accentBrand` and MotionProfile `dominantSource` must be `string` in both `builderService.ts` and `themeBuilder.ts`.
