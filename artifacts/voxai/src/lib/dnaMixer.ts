export interface DNAComposition {
  stripe:  number;
  linear:  number;
  framer:  number;
  vercel:  number;
  notion:  number;
  cursor:  number;
  raycast: number;
}

export const EMPTY_DNA: DNAComposition = {
  stripe: 0, linear: 0, framer: 0, vercel: 0, notion: 0, cursor: 0, raycast: 0,
};

export type BrandKey = keyof DNAComposition;
export const BRAND_KEYS: BrandKey[] = ['stripe', 'linear', 'framer', 'vercel', 'notion', 'cursor', 'raycast'];

export function normalizeDNA(raw: Partial<DNAComposition>): DNAComposition {
  const total = BRAND_KEYS.reduce((s, k) => s + (raw[k] ?? 0), 0);
  if (total === 0) return { ...EMPTY_DNA };
  const scale = 100 / total;
  return BRAND_KEYS.reduce((out, k) => {
    out[k] = Math.round((raw[k] ?? 0) * scale);
    return out;
  }, {} as DNAComposition);
}

export function getDominantBrand(dna: DNAComposition): BrandKey | null {
  const entries = BRAND_KEYS.map(k => [k, dna[k]] as [BrandKey, number]).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

export function getActiveBrands(dna: DNAComposition): Array<{ brand: BrandKey; pct: number }> {
  return BRAND_KEYS
    .map(k => ({ brand: k, pct: dna[k] }))
    .filter(e => e.pct > 0)
    .sort((a, b) => b.pct - a.pct);
}

export function isSingleBrand(dna: DNAComposition): boolean {
  return getActiveBrands(dna).length <= 1;
}

export const BRAND_COLOR: Record<string, string> = {
  stripe:  '#635BFF',
  linear:  '#5E6AD2',
  framer:  '#FF3D57',
  vercel:  '#FFFFFF',
  notion:  '#8B5CF6',
  cursor:  '#00FF9D',
  raycast: '#FF5F57',
};

export const BRAND_LABEL: Record<string, string> = {
  stripe:  'Stripe',
  linear:  'Linear',
  framer:  'Framer',
  vercel:  'Vercel',
  notion:  'Notion',
  cursor:  'Cursor',
  raycast: 'Raycast',
};

export function parseDNAFromText(text: string): Partial<DNAComposition> {
  const result: Partial<DNAComposition> = {};
  const pattern = /(\d+)\s*%?\s*(stripe|linear|framer|vercel|notion|cursor|raycast)/gi;
  for (const m of text.matchAll(pattern)) {
    result[m[2].toLowerCase() as BrandKey] = parseInt(m[1]);
  }
  return result;
}

export function extractBrandMentions(text: string): BrandKey[] {
  const lower = text.toLowerCase();
  return BRAND_KEYS.filter(k => lower.includes(k));
}

export function buildCompositionSummary(dna: DNAComposition): string {
  const active = getActiveBrands(dna);
  if (active.length === 0) return 'No references detected';
  return active.map(({ brand, pct }) => `${BRAND_LABEL[brand]} ${pct}%`).join(' + ');
}
