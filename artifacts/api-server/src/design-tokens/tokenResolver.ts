// ── V7.3.3 Token Resolver ─────────────────────────────────────────────────────
// Deterministically maps DNA + industry + auth → TokenSet.
// No randomization. Same input always produces same output.

import type { TokenSet, DNABrand, ThemeMode } from "./tokenTypes.js";
import type { AuthState, Industry } from "../component-tree/componentTreeTypes.js";
import { TOKEN_REGISTRY } from "./tokenRegistry.js";

// ── DNA → primary theme mapping ───────────────────────────────────────────────

const DNA_THEME_MAP: Record<string, string> = {
  stripe:     'stripe',
  linear:     'linear',
  vercel:     'vercel',
  framer:     'framer',
  apple:      'apple',
  notion:     'notion',
  github:     'github',
  paypal:     'paypal',
  cursor:     'linear',
  perplexity: 'linear',
};

// ── Industry modifier — adjusts certain token values ─────────────────────────

function applyIndustryModifiers(base: TokenSet, industry: Industry): TokenSet {
  // Healthcare → lighter, more trustworthy (notion-like light tones)
  if (industry === 'healthcare') {
    return {
      ...base,
      metadata: { ...base.metadata, colorTemperature: 'warm' },
      colors: { ...base.colors, surface: '#FFFFFF', background: '#F8FAFB', backgroundAlt: '#F0F4F7', text: '#1A202C', textMuted: '#718096', border: '#E2E8F0', surfaceCard: '#FFFFFF', surfacePanel: '#F8FAFB' },
    };
  }
  // Restaurant → warmer palette
  if (industry === 'restaurant') {
    return {
      ...base,
      metadata: { ...base.metadata, colorTemperature: 'warm' },
      colors: { ...base.colors, accent: '#C45C2C', badge: '#FFF3EC', badgeFg: '#C45C2C' },
    };
  }
  // Enterprise → more conservative radius
  if (industry === 'enterprise') {
    return {
      ...base,
      radius: { ...base.radius, button: '0.375rem', card: '0.5rem', badge: '0.25rem' },
    };
  }
  return base;
}

// ── Auth state modifier ────────────────────────────────────────────────────────

function applyAuthModifiers(base: TokenSet, authState: AuthState): TokenSet {
  if (authState === 'dashboard' || authState === 'admin') {
    // Dashboard/admin: denser spacing, more panel-focused
    return {
      ...base,
      spacing: {
        ...base.spacing,
        section: '3rem',
        gutter: '1rem',
      },
      layout: {
        ...base.layout,
        heroMinH: '60vh',
        sectionPy: '3rem',
      },
    };
  }
  return base;
}

// ── Mode modifier ─────────────────────────────────────────────────────────────

function applyModeModifiers(base: TokenSet, mode: ThemeMode): TokenSet {
  if (mode === 'enterprise') {
    return {
      ...base,
      metadata: { ...base.metadata, mode },
      colors: {
        ...base.colors,
        primary: '#1A56DB',
        accent: '#2563EB',
        badge: '#EFF6FF',
        badgeFg: '#1A56DB',
      },
    };
  }
  if (mode === 'creator') {
    return {
      ...base,
      metadata: { ...base.metadata, mode },
      colors: {
        ...base.colors,
        primary: '#7C3AED',
        accent: '#EC4899',
        badge: '#F5F3FF',
        badgeFg: '#7C3AED',
      },
    };
  }
  return base;
}

// ── Main resolver ─────────────────────────────────────────────────────────────

export interface TokenResolverInput {
  primaryDNA: DNABrand;
  industry: Industry;
  authState: AuthState;
  mode?: ThemeMode;
  dnaWeights?: Record<string, number>;
}

export function resolveTokenSet(input: TokenResolverInput): TokenSet {
  const { primaryDNA, industry, authState, mode = 'auto' } = input;

  // 1. Lookup base theme by DNA
  const themeId = DNA_THEME_MAP[primaryDNA] ?? 'linear';
  const base = TOKEN_REGISTRY[themeId] ?? TOKEN_REGISTRY['linear'];

  // 2. Apply industry modifiers
  let resolved = applyIndustryModifiers(base, industry);

  // 3. Apply auth state modifiers
  resolved = applyAuthModifiers(resolved, authState);

  // 4. Apply mode modifiers (only if explicitly set, not 'auto')
  if (mode !== 'auto') {
    resolved = applyModeModifiers(resolved, mode);
  }

  return {
    ...resolved,
    metadata: {
      ...resolved.metadata,
      themeId,
      mode: mode === 'auto' ? resolved.metadata.mode : mode,
    },
  };
}

// ── Resolve from dna composition (weighted) ───────────────────────────────────

export function resolveFromDNAComposition(
  dnaWeights: Record<string, number>,
  industry: Industry,
  authState: AuthState,
): TokenSet {
  // Find primary DNA (highest weight)
  const entries = Object.entries(dnaWeights).sort(([, a], [, b]) => b - a);
  const primaryDNA = (entries[0]?.[0] ?? 'linear') as DNABrand;

  return resolveTokenSet({ primaryDNA, industry, authState, dnaWeights });
}

// ── Theme name resolver ───────────────────────────────────────────────────────

export function getThemeIdForDNA(dna: DNABrand): string {
  return DNA_THEME_MAP[dna] ?? 'linear';
}
