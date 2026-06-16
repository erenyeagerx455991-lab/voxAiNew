import type { DNAComposition, BrandKey } from './dnaMixer';

export const BRAND_STRENGTHS: Record<BrandKey, Record<string, number>> = {
  stripe: {
    pricing: 10, trust: 10, cta: 9, navbar: 8, footer: 8,
    testimonials: 8, dashboard: 6, hero: 5, features: 6,
    bento: 4, animations: 3, changelog: 3, typography: 5,
  },
  linear: {
    hero: 10, dashboard: 10, typography: 10, features: 8,
    navbar: 8, footer: 6, cta: 7, changelog: 10, bento: 6,
    animations: 6, pricing: 6, trust: 5, testimonials: 5,
  },
  framer: {
    features: 10, bento: 10, animations: 10, storytelling: 10,
    hero: 9, trust: 6, footer: 6, navbar: 6, pricing: 5,
    dashboard: 5, typography: 7, changelog: 5, cta: 6,
  },
  vercel: {
    hero: 8, features: 7, navbar: 7, footer: 7, pricing: 6,
    dashboard: 7, bento: 7, cta: 6, trust: 6, typography: 7,
    changelog: 7, animations: 5, testimonials: 5,
  },
  notion: {
    hero: 5, features: 6, navbar: 6, footer: 6, pricing: 5,
    dashboard: 7, typography: 9, changelog: 8, cta: 4,
    trust: 5, testimonials: 5, bento: 5, animations: 2,
  },
  cursor: {
    hero: 9, features: 8, animations: 8, bento: 8, navbar: 7,
    footer: 6, pricing: 6, dashboard: 7, cta: 7, trust: 6,
    typography: 6, changelog: 6, testimonials: 5,
  },
  raycast: {
    hero: 9, features: 9, bento: 9, animations: 8, navbar: 7,
    footer: 6, pricing: 5, cta: 7, dashboard: 6, trust: 6,
    typography: 6, changelog: 7, testimonials: 5,
  },
};

export const ALL_SECTIONS = [
  'hero', 'navbar', 'features', 'pricing', 'testimonials', 'trust',
  'cta', 'footer', 'dashboard', 'bento', 'animations', 'typography', 'changelog',
] as const;

export type SectionName = typeof ALL_SECTIONS[number];
export type SectionOwnership = Record<string, string>;

export function resolveSectionOwnership(
  dna: DNAComposition,
  sections?: string[],
): SectionOwnership {
  const targetSections = sections ?? [...ALL_SECTIONS];
  const brands = (Object.entries(dna) as [BrandKey, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return {};

  const ownership: SectionOwnership = {};

  for (const section of targetSections) {
    let bestBrand: BrandKey = brands[0][0];
    let bestScore = -1;

    for (const [brand, pct] of brands) {
      const strength = BRAND_STRENGTHS[brand]?.[section] ?? 5;
      const score = (pct / 100) * strength;
      if (score > bestScore) {
        bestScore = score;
        bestBrand = brand;
      }
    }
    ownership[section] = bestBrand;
  }

  return ownership;
}

export function getSectionsByBrand(ownership: SectionOwnership): Record<BrandKey, string[]> {
  const result: Partial<Record<BrandKey, string[]>> = {};
  for (const [section, brand] of Object.entries(ownership)) {
    const b = brand as BrandKey;
    if (!result[b]) result[b] = [];
    result[b]!.push(section);
  }
  return result as Record<BrandKey, string[]>;
}
