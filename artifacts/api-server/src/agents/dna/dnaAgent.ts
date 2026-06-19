import type { DNAComposition } from "../types.js";
import { callGroq } from "../llm/llmClient.js";
import { DNA_MIXER_SYSTEM } from "../llm/prompts.js";

export type { DNAComposition };

export const DNA_BRAND_KEYS: (keyof DNAComposition)[] = ['stripe','linear','framer','vercel','notion','cursor','raycast'];

export const EMPTY_DNA: DNAComposition = { stripe:0, linear:0, framer:0, vercel:0, notion:0, cursor:0, raycast:0 };

export const COMPOSITION_SECTIONS = ['hero','navbar','features','pricing','testimonials','trust','cta','footer','dashboard','bento','animations','typography','changelog'];

export const BRAND_STRENGTHS_V45: Record<string, Record<string, number>> = {
  stripe:  { pricing:10, trust:10, cta:9, navbar:8, footer:8, testimonials:8, dashboard:6, hero:5, features:6, bento:4, animations:3, typography:5, changelog:3 },
  linear:  { hero:10, dashboard:10, typography:10, features:8, navbar:8, footer:6, cta:7, changelog:10, bento:6, animations:6, pricing:6, trust:5, testimonials:5 },
  framer:  { features:10, bento:10, animations:10, storytelling:10, hero:9, trust:6, footer:6, navbar:6, pricing:5, dashboard:5, typography:7, cta:6 },
  vercel:  { hero:8, features:7, navbar:7, footer:7, pricing:6, dashboard:7, bento:7, cta:6, trust:6, typography:7, changelog:7, animations:5 },
  notion:  { hero:5, features:6, navbar:6, footer:6, pricing:5, dashboard:7, typography:9, changelog:8, cta:4, trust:5, bento:5, animations:2 },
  cursor:  { hero:9, features:8, animations:8, bento:8, navbar:7, footer:6, pricing:6, dashboard:7, cta:7, trust:6, typography:6, changelog:6 },
  raycast: { hero:9, features:9, bento:9, animations:8, navbar:7, footer:6, pricing:5, cta:7, dashboard:6, trust:6, typography:6, changelog:7 },
};

export const BRAND_TOKENS_V45: Record<string, { primary:string; surface:string; accent:string; border:string; card:string; text:string; textMuted:string }> = {
  stripe:  { primary:'#635BFF', surface:'#0A2540', accent:'#00D4FF', border:'rgba(255,255,255,0.1)', card:'#0F3460',  text:'#FFFFFF', textMuted:'#A8B4C0' },
  linear:  { primary:'#5E6AD2', surface:'#0F0F0F', accent:'#F7C948', border:'#2A2A2A',               card:'#111111',  text:'#FFFFFF', textMuted:'#8A8A8A' },
  framer:  { primary:'#FF3D57', surface:'#0B0B0B', accent:'#FF6B35', border:'#222222',               card:'#141414',  text:'#FFFFFF', textMuted:'#666666' },
  vercel:  { primary:'#FFFFFF', surface:'#000000', accent:'#0070F3', border:'#333333',               card:'#111111',  text:'#FFFFFF', textMuted:'#888888' },
  notion:  { primary:'#37352F', surface:'#FFFFFF', accent:'#2F80ED', border:'#E9E9E7',               card:'#F7F6F3',  text:'#37352F', textMuted:'#9B9B9B' },
  cursor:  { primary:'#00FF9D', surface:'#0D0D0D', accent:'#00CC7A', border:'#252525',               card:'#161616',  text:'#FFFFFF', textMuted:'#555555' },
  raycast: { primary:'#FF5F57', surface:'#0C0C0C', accent:'#FF8B50', border:'#1C1C1C',               card:'#111111',  text:'#FFFFFF', textMuted:'#666666' },
};

export function normalizeDNAServer(raw: Partial<DNAComposition>): DNAComposition {
  const total = DNA_BRAND_KEYS.reduce((s, k) => s + (raw[k] ?? 0), 0);
  if (total === 0) return { ...EMPTY_DNA };
  const scale = 100 / total;
  return DNA_BRAND_KEYS.reduce((out, k) => {
    out[k] = Math.round((raw[k] ?? 0) * scale);
    return out;
  }, {} as DNAComposition);
}

export function resolveSectionOwnershipServer(dna: DNAComposition, sections: string[]): Record<string, string> {
  const brands = (Object.entries(dna) as [string, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return {};
  const ownership: Record<string, string> = {};
  for (const section of sections) {
    let best = brands[0][0];
    let bestScore = -1;
    for (const [brand, pct] of brands) {
      const strength = BRAND_STRENGTHS_V45[brand]?.[section] ?? 5;
      const score = (pct / 100) * strength;
      if (score > bestScore) { bestScore = score; best = brand; }
    }
    ownership[section] = best;
  }
  return ownership;
}

export function pickOwnerServer(dna: DNAComposition, strengthKey: string): string {
  const brands = (Object.entries(dna) as [string, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return 'linear';
  let best = brands[0][0]; let bestScore = -1;
  for (const [brand, pct] of brands) {
    const score = (pct / 100) * (BRAND_STRENGTHS_V45[brand]?.[strengthKey] ?? 5);
    if (score > bestScore) { bestScore = score; best = brand; }
  }
  return best;
}

export function generateThemeTokensServer(dna: DNAComposition) {
  const primaryBrand  = pickOwnerServer(dna, 'cta');
  const surfaceBrand  = pickOwnerServer(dna, 'hero');
  const accentBrand   = pickOwnerServer(dna, 'animations');
  const pt = BRAND_TOKENS_V45[primaryBrand] ?? BRAND_TOKENS_V45.linear;
  const st = BRAND_TOKENS_V45[surfaceBrand] ?? BRAND_TOKENS_V45.linear;
  const at = BRAND_TOKENS_V45[accentBrand]  ?? BRAND_TOKENS_V45.linear;
  return {
    primary: pt.primary, surface: st.surface, accent: at.accent,
    border: st.border,   card: st.card,       text: st.text,   textMuted: st.textMuted,
    isDark: surfaceBrand !== 'notion',
    primaryBrand, surfaceBrand, accentBrand,
  };
}

export function generateMotionProfileServer(dna: DNAComposition) {
  const score = (dna.framer ?? 0) + (dna.cursor ?? 0) * 0.7 + (dna.raycast ?? 0) * 0.7;
  return {
    level: score > 50 ? 'advanced' : score > 20 ? 'standard' : 'minimal',
    hoverLift: score > 20, staggerAnimation: score > 20, revealTransitions: score > 20,
    motionCards: score > 30, bentoInteractions: score > 20, advancedMode: score > 50,
    dominantSource: dna.framer >= dna.cursor && dna.framer >= dna.raycast
      ? (dna.framer > 0 ? 'framer' : 'none')
      : dna.cursor >= dna.raycast ? (dna.cursor > 0 ? 'cursor' : 'none')
      : (dna.raycast > 0 ? 'raycast' : 'none'),
  };
}

export async function extractDNAComposition(
  userPrompt: string,
  referenceSites: string,
  primaryRef: string,
  secondaryRefs: string[],
  groqKey: string
): Promise<DNAComposition> {
  // 1. Try explicit percentage extraction first (regex, no LLM)
  const percentPattern = /(\d+)\s*%?\s*(stripe|linear|framer|vercel|notion|cursor|raycast)/gi;
  const rawPct: Partial<DNAComposition> = {};
  let hasExplicitPct = false;
  for (const m of userPrompt.matchAll(percentPattern)) {
    (rawPct as Record<string, number>)[m[2].toLowerCase()] = parseInt(m[1]);
    hasExplicitPct = true;
  }
  if (hasExplicitPct) return normalizeDNAServer(rawPct);

  // 2. Use planner-detected references with position weighting (no LLM)
  const allRefs = [primaryRef, ...secondaryRefs]
    .filter(r => r && r !== 'none')
    .map(r => r.toLowerCase().trim())
    .filter(r => DNA_BRAND_KEYS.includes(r as keyof DNAComposition));

  if (allRefs.length > 0) {
    const hasWeightWords = /heavily|mostly|primarily|dominated|mainly|strongly|slight|little|mostly/i.test(userPrompt);
    if (!hasWeightWords) {
      const base = Math.floor(100 / allRefs.length);
      const bonus = 100 - base * allRefs.length;
      const rawEq: Partial<DNAComposition> = {};
      allRefs.forEach((r, i) => { (rawEq as Record<string,number>)[r] = base + (i === 0 ? bonus : 0); });
      return normalizeDNAServer(rawEq);
    }
  }

  // 3. Fall back to AI extraction for complex weighting language
  try {
    const extraction = await callGroq(groqKey, 'llama-3.1-8b-instant',
      [
        { role: 'system', content: DNA_MIXER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      false, 300
    );
    if (extraction) {
      const jsonMatch = extraction.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        const extracted: Partial<DNAComposition> = {};
        for (const k of DNA_BRAND_KEYS) {
          if (typeof parsed[k] === 'number' && (parsed[k] as number) > 0) extracted[k] = parsed[k] as number;
        }
        if (Object.keys(extracted).length > 0) return normalizeDNAServer(extracted);
      }
    }
  } catch (e) {
    console.error('[DNAMixer] AI extraction failed, using reference fallback:', e);
  }

  // 4. Final fallback: reference sites from planner
  if (allRefs.length > 0) {
    const rawFb: Partial<DNAComposition> = {};
    allRefs.forEach((r, i) => { (rawFb as Record<string,number>)[r] = i === 0 ? 50 : Math.floor(50 / (allRefs.length - 1)); });
    return normalizeDNAServer(rawFb);
  }

  return { ...EMPTY_DNA };
}

// ── V5.4: COMPONENT REGISTRY ENGINE ─────────────────────────────────────────

export const REGISTRY_STYLE_HINTS_SERVER: Record<string, string> = {
  HeroLinear: 'oversized editorial typography, left-aligned, dark minimal, NO decoration',
  HeroStripe: 'centered gradient hero, radial glow orbs, premium dark navy, bold CTA',
  HeroFramer: 'dramatic oversized text, expressive animations, bold accent colors',
  HeroVercel: 'split layout, monochrome black/white, strong left text + right visual',
  HeroNotion: 'clean editorial, light theme, simple centered copy, minimal decoration',
  HeroMinimal: 'clean centered layout, strong typography, subtle hover only',
  HeroEditorial: 'magazine-style, huge type fills the viewport, editorial whitespace',
  HeroBento: 'bento grid hero with feature tiles, dark, modern asymmetric layout',
  PricingStripe: 'gradient-border 3-tier cards, popular badge, trust signals, dark navy',
  PricingMinimal: 'flat 3-column minimal cards, simple border, clean dark background',
  PricingEnterprise: 'feature comparison table, check marks, enterprise tier highlighted',
  PricingCards: 'elevated cards with popular glow, icon features, gradient CTA button',
  NavbarMinimal: 'sticky minimal bar, logo + 4-5 ghost links + CTA, dark',
  NavbarFloating: 'floating pill navbar centered, blur backdrop, ghost links',
  NavbarEnterprise: 'full-width, mega-menu dropdowns, announcement bar, dark',
  NavbarSidebar: 'left sidebar with icon + label nav, dark, collapsible mobile',
  DashboardAnalytics: 'KPI stat cards row, line + bar charts, data table, dark sidebar',
  DashboardSaaS: 'overview stats, recent activity feed, quick actions, dark sidebar',
  DashboardFinance: 'portfolio chart, asset allocation, transaction list, premium dark',
  DashboardAI: 'chat interface, prompt history, model selector, dark terminal feel',
  FeaturesGrid: '3-column icon + title + description cards, flat-bordered, dark',
  FeaturesBento: 'asymmetric bento grid, large feature card + small tiles, dark',
  TestimonialsCards: '3-column quote cards, avatar, star rating, flat-bordered dark',
  TestimonialsWall: 'masonry grid of testimonial tiles, varied sizes, dark',
  CtaStripe: 'gradient CTA banner, two buttons (primary + outline), trust line',
  CtaMinimal: 'centered minimal CTA, one headline, one button, flat dark',
  CtaGradient: 'animated gradient background, bold headline, glowing button',
  FooterSimple: 'single-row logo + links + copyright, minimal dark',
  FooterEnterprise: '4-column footer with link groups, social icons, newsletter form',
};

export function getDominantBrandServer(dna: DNAComposition): string {
  const entries = (Object.entries(dna) as [string, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  return entries.length > 0 ? entries[0][0] : 'linear';
}

export function selectRegistryComponentsServer(
  dna: DNAComposition,
  blueprint: import('../types.js').PageBlueprint,
  projectBlueprint: import('../types.js').ProjectBlueprint
): Record<string, string> {
  const selection: Record<string, string> = {};
  const dominant = getDominantBrandServer(dna);
  const sections = blueprint.sectionOrder ?? [];
  const hint = (name: string) => `${name} — ${REGISTRY_STYLE_HINTS_SERVER[name] || 'selected component variant'}`;

  for (const section of sections) {
    const s = section.toLowerCase().replace(/\s+/g, '');

    if (s === 'hero' || s.startsWith('hero')) {
      let name = 'HeroMinimal';
      if (dominant === 'linear') name = 'HeroLinear';
      else if (dominant === 'stripe') name = 'HeroStripe';
      else if (dominant === 'framer') name = 'HeroFramer';
      else if (dominant === 'vercel') name = 'HeroVercel';
      else if (dominant === 'notion') name = 'HeroNotion';
      else if (dominant === 'cursor' || dominant === 'raycast') name = 'HeroBento';
      selection.hero = hint(name);
    }

    if (s === 'pricing') {
      let name = 'PricingCards';
      if (dominant === 'stripe') name = 'PricingStripe';
      else if (dominant === 'linear' && (dna.linear ?? 0) > 20) name = 'PricingMinimal';
      else if (projectBlueprint.projectType?.toLowerCase().includes('enterprise')) name = 'PricingEnterprise';
      selection.pricing = hint(name);
    }

    if (s === 'navbar' || s === 'navigation') {
      let name = 'NavbarEnterprise';
      if (dominant === 'framer' || dominant === 'cursor') name = 'NavbarFloating';
      else if ((dna.linear ?? 0) > 30 || (dna.vercel ?? 0) > 30) name = 'NavbarMinimal';
      else if (projectBlueprint.dashboardNeeded) name = 'NavbarSidebar';
      selection.navbar = hint(name);
    }

    if (s === 'features' || s === 'featuresbento' || (s.includes('feature') && !s.includes('featured'))) {
      let name = 'FeaturesGrid';
      if (dominant === 'framer' || dominant === 'cursor' || dominant === 'raycast') name = 'FeaturesBento';
      selection.features = hint(name);
    }

    if (s === 'testimonials') {
      let name = 'TestimonialsCards';
      if (dominant === 'framer') name = 'TestimonialsWall';
      selection.testimonials = hint(name);
    }

    if (s === 'cta' || s.includes('calltoaction')) {
      let name = 'CtaMinimal';
      if (dominant === 'stripe') name = 'CtaStripe';
      else if (dominant === 'framer') name = 'CtaGradient';
      selection.cta = hint(name);
    }

    if (s === 'footer') {
      let name = 'FooterSimple';
      if (dominant === 'stripe' || (projectBlueprint.pages && projectBlueprint.pages.length > 2)) name = 'FooterEnterprise';
      selection.footer = hint(name);
    }

    if (s === 'dashboard' || s.includes('dashboard')) {
      let name = 'DashboardSaaS';
      if (dominant === 'stripe' || projectBlueprint.projectType?.toLowerCase().includes('finance')) name = 'DashboardFinance';
      else if (dominant === 'cursor' || projectBlueprint.projectType?.toLowerCase().includes('ai')) name = 'DashboardAI';
      selection.dashboard = hint(name);
    }

    if (s === 'faq') {
      selection.faq = hint('FaqAccordion');
    }
  }

  return selection;
}

export function computeRegistryHealthServer(
  selection: Record<string, string>,
  sectionOrder: string[]
): { coverageScore: number; reusedComponents: number; customComponents: number; lockedComponents: number; editCompatibility: number; totalSections: number; mappedSections: number } {
  const MAPPABLE = ['hero', 'pricing', 'navbar', 'features', 'faq', 'testimonials', 'cta', 'footer', 'dashboard', 'navigation', 'auth'];
  const mappable = sectionOrder.filter(s =>
    MAPPABLE.some(m => s.toLowerCase().replace(/\s+/g, '') === m || s.toLowerCase().includes(m))
  );
  const totalSections = mappable.length;
  const mappedSections = Object.keys(selection).length;
  const coverageScore = totalSections > 0 ? Math.min(100, Math.round((mappedSections / totalSections) * 100)) : 0;
  const reusedComponents = mappedSections;
  const editCompatibility = Math.min(100, reusedComponents * 12);
  return { coverageScore, reusedComponents, customComponents: Math.max(0, sectionOrder.length - mappedSections), lockedComponents: 0, editCompatibility, totalSections, mappedSections };
}

export function buildDNAContextString(dna: DNAComposition, ownership: Record<string, string>, theme: ReturnType<typeof generateThemeTokensServer>): string {
  const active = DNA_BRAND_KEYS.filter(k => dna[k] > 0).map(k => `${k.charAt(0).toUpperCase()+k.slice(1)} ${dna[k]}%`);
  if (active.length === 0) return '';
  const ownerLines = Object.entries(ownership).slice(0, 8).map(([s, b]) => `  ${s} → ${b}`).join('\n');
  return `\n\n## DNA COMPOSITION (V4.5 Fusion Mode)\nComposition: ${active.join(' + ')}\nSection Ownership:\n${ownerLines}\nTheme: primary=${theme.primary} surface=${theme.surface} accent=${theme.accent}\nMode: ${theme.isDark ? 'dark' : 'light'}`;
}
