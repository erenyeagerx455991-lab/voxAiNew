import type { DNAComposition, BrandKey } from '../lib/dnaMixer';
import { BRAND_STRENGTHS } from '../lib/componentOwnership';

export interface ThemeTokens {
  primary:      string;
  surface:      string;
  accent:       string;
  border:       string;
  card:         string;
  text:         string;
  textMuted:    string;
  isDark:       boolean;
  primaryBrand: string;
  surfaceBrand: string;
  accentBrand:  string;
}

export interface MotionProfile {
  level:             'minimal' | 'standard' | 'advanced';
  hoverLift:         boolean;
  staggerAnimation:  boolean;
  revealTransitions: boolean;
  motionCards:       boolean;
  bentoInteractions: boolean;
  advancedMode:      boolean;
  dominantSource:    string;
}

export interface TypographyProfile {
  style:           'editorial' | 'modern-saas' | 'developer' | 'minimal' | 'luxury';
  heroFont:        string;
  bodyFont:        string;
  headingWeight:   string;
  letterSpacing:   string;
  source:          BrandKey;
}

const BRAND_TOKENS: Record<BrandKey, Omit<ThemeTokens, 'isDark' | 'primaryBrand' | 'surfaceBrand' | 'accentBrand'>> = {
  stripe:  { primary: '#635BFF', surface: '#0A2540', accent: '#00D4FF', border: 'rgba(255,255,255,0.1)', card: '#0F3460', text: '#FFFFFF', textMuted: '#A8B4C0' },
  linear:  { primary: '#5E6AD2', surface: '#0F0F0F', accent: '#F7C948', border: '#2A2A2A',               card: '#111111', text: '#FFFFFF', textMuted: '#8A8A8A' },
  framer:  { primary: '#FF3D57', surface: '#0B0B0B', accent: '#FF6B35', border: '#222222',               card: '#141414', text: '#FFFFFF', textMuted: '#666666' },
  vercel:  { primary: '#FFFFFF', surface: '#000000', accent: '#0070F3', border: '#333333',               card: '#111111', text: '#FFFFFF', textMuted: '#888888' },
  notion:  { primary: '#37352F', surface: '#FFFFFF', accent: '#2F80ED', border: '#E9E9E7',               card: '#F7F6F3', text: '#37352F', textMuted: '#9B9B9B' },
  cursor:  { primary: '#00FF9D', surface: '#0D0D0D', accent: '#00CC7A', border: '#252525',               card: '#161616', text: '#FFFFFF', textMuted: '#555555' },
  raycast: { primary: '#FF5F57', surface: '#0C0C0C', accent: '#FF8B50', border: '#1C1C1C',               card: '#111111', text: '#FFFFFF', textMuted: '#666666' },
};

const TYPOGRAPHY_PROFILES: Record<BrandKey, TypographyProfile> = {
  stripe:  { style: 'modern-saas', heroFont: 'Inter',     bodyFont: 'Inter',    headingWeight: 'font-bold',  letterSpacing: 'tracking-tight',   source: 'stripe'  },
  linear:  { style: 'editorial',   heroFont: 'Inter',     bodyFont: 'Inter',    headingWeight: 'font-black', letterSpacing: 'tracking-tight',   source: 'linear'  },
  framer:  { style: 'luxury',      heroFont: 'Inter',     bodyFont: 'Inter',    headingWeight: 'font-black', letterSpacing: 'tracking-tighter', source: 'framer'  },
  vercel:  { style: 'developer',   heroFont: 'Geist',     bodyFont: 'Geist',    headingWeight: 'font-black', letterSpacing: 'tracking-tighter', source: 'vercel'  },
  notion:  { style: 'editorial',   heroFont: 'Inter',     bodyFont: 'Inter',    headingWeight: 'font-bold',  letterSpacing: 'tracking-normal',  source: 'notion'  },
  cursor:  { style: 'developer',   heroFont: 'JetBrains', bodyFont: 'Inter',    headingWeight: 'font-bold',  letterSpacing: 'tracking-tight',   source: 'cursor'  },
  raycast: { style: 'modern-saas', heroFont: 'Inter',     bodyFont: 'Inter',    headingWeight: 'font-bold',  letterSpacing: 'tracking-tight',   source: 'raycast' },
};

function pickOwner(dna: DNAComposition, strengthKey: string): BrandKey {
  const brands = (Object.entries(dna) as [BrandKey, number][]).filter(([, pct]) => pct > 0);
  if (brands.length === 0) return 'linear';
  let best: BrandKey = brands[0][0];
  let bestScore = -1;
  for (const [brand, pct] of brands) {
    const strength = BRAND_STRENGTHS[brand]?.[strengthKey] ?? 5;
    const score = (pct / 100) * strength;
    if (score > bestScore) { bestScore = score; best = brand; }
  }
  return best;
}

export function generateThemeFromComposition(dna: DNAComposition): ThemeTokens {
  const primaryBrand  = pickOwner(dna, 'cta');
  const surfaceBrand  = pickOwner(dna, 'hero');
  const accentBrand   = pickOwner(dna, 'animations');

  const pt = BRAND_TOKENS[primaryBrand];
  const st = BRAND_TOKENS[surfaceBrand];
  const at = BRAND_TOKENS[accentBrand];

  return {
    primary:      pt.primary,
    surface:      st.surface,
    accent:       at.accent,
    border:       st.border,
    card:         st.card,
    text:         st.text,
    textMuted:    st.textMuted,
    isDark:       surfaceBrand !== 'notion',
    primaryBrand,
    surfaceBrand,
    accentBrand,
  };
}

export function generateMotionProfile(dna: DNAComposition): MotionProfile {
  const framer  = dna.framer  ?? 0;
  const cursor  = dna.cursor  ?? 0;
  const raycast = dna.raycast ?? 0;
  const score   = framer + cursor * 0.7 + raycast * 0.7;

  return {
    level:             score > 50 ? 'advanced' : score > 20 ? 'standard' : 'minimal',
    hoverLift:         score > 20,
    staggerAnimation:  score > 20,
    revealTransitions: score > 20,
    motionCards:       score > 30,
    bentoInteractions: score > 20,
    advancedMode:      score > 50,
    dominantSource:    framer >= cursor && framer >= raycast
                         ? (framer > 0 ? 'framer'  : 'none')
                         : cursor >= raycast
                           ? (cursor  > 0 ? 'cursor'  : 'none')
                           : (raycast > 0 ? 'raycast' : 'none'),
  };
}

export function generateTypographyProfile(dna: DNAComposition): TypographyProfile {
  return TYPOGRAPHY_PROFILES[pickOwner(dna, 'typography')];
}
