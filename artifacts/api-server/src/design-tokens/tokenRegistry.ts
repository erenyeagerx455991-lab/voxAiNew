// ── V7.3.3 Design Token Registry ──────────────────────────────────────────────
// Baseline token sets for each DNA brand. Each theme is deterministic.

import type { TokenSet, ColorTokens, TypographyTokens, SpacingTokens, RadiusTokens, ShadowTokens, MotionTokens, LayoutTokens, ThemeMetadata } from "./tokenTypes.js";

// ── Shared typography defaults ─────────────────────────────────────────────────

const SYSTEM_FONT = "'Inter', 'system-ui', -apple-system, sans-serif";
const MONO_FONT   = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";

function makeTypography(heroXl: string, heroLg: string, h1: string, fontFamily = SYSTEM_FONT, letterSpacing = 'normal'): TypographyTokens {
  return {
    fontFamily,
    fontFamilyMono: MONO_FONT,
    heroXl,
    heroLg,
    heading1: h1,
    heading2: 'clamp(1.25rem, 2vw, 2rem)',
    heading3: 'clamp(1.1rem, 1.5vw, 1.5rem)',
    bodyLg:   '1.125rem',
    bodyMd:   '1rem',
    bodySm:   '0.875rem',
    caption:  '0.75rem',
    fontWeightDisplay: '800',
    fontWeightHeading: '700',
    fontWeightBody:    '400',
    lineHeightTight:   '1.1',
    lineHeightNormal:  '1.5',
    lineHeightRelaxed: '1.75',
    letterSpacingTight:  '-0.03em',
    letterSpacingNormal: letterSpacing === 'normal' ? '0em' : '-0.01em',
    letterSpacingWide:   '0.05em',
  };
}

function makeLayout(): LayoutTokens {
  return {
    maxWidth:    '1200px',
    heroMinH:    '80vh',
    sectionPy:   '6rem',
    navHeight:   '64px',
    sidebarW:    '240px',
    breakpointSm: '640px',
    breakpointMd: '768px',
    breakpointLg: '1024px',
    breakpointXl: '1280px',
  };
}

// ── Linear theme ──────────────────────────────────────────────────────────────

const LINEAR_COLORS: ColorTokens = {
  primary:       '#5E6AD2',
  primaryFg:     '#FFFFFF',
  accent:        '#8B8FF7',
  accentFg:      '#FFFFFF',
  surface:       '#0F0F0F',
  surfacePanel:  '#161616',
  surfaceCard:   '#1A1A1A',
  border:        '#2A2A2A',
  borderSubtle:  '#222222',
  text:          '#F2F2F2',
  textMuted:     '#8A8A8A',
  textInverse:   '#0F0F0F',
  background:    '#0F0F0F',
  backgroundAlt: '#161616',
  success:       '#3DD68C',
  warning:       '#F6AD55',
  error:         '#F87171',
  badge:         '#1E1E2E',
  badgeFg:       '#8B8FF7',
};

const LINEAR_SPACING: SpacingTokens = {
  xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem',
  '2xl': '3rem', '3xl': '4rem', section: '5rem', container: '1200px', gutter: '1.5rem',
};

const LINEAR_RADIUS: RadiusTokens = {
  none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem',
  '2xl': '1rem', full: '9999px', button: '0.375rem', card: '0.5rem', badge: '0.25rem', input: '0.375rem',
};

const LINEAR_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 2px rgba(0,0,0,0.4)',
  surface:    '0 2px 8px rgba(0,0,0,0.3), 0 0 1px rgba(0,0,0,0.2)',
  floating:   '0 8px 24px rgba(0,0,0,0.4)',
  enterprise: '0 4px 16px rgba(0,0,0,0.3)',
  inset:      'inset 0 1px 2px rgba(0,0,0,0.4)',
};

const LINEAR_MOTION: MotionTokens = {
  durationFast:    '100ms',
  durationNormal:  '200ms',
  durationSlow:    '300ms',
  easingDefault:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easingExpressive: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easingEnter:     'cubic-bezier(0, 0, 0.2, 1)',
  easingExit:      'cubic-bezier(0.4, 0, 1, 1)',
  staggerDelay:    '50ms',
};

// ── Stripe theme ──────────────────────────────────────────────────────────────

const STRIPE_COLORS: ColorTokens = {
  primary:       '#635BFF',
  primaryFg:     '#FFFFFF',
  accent:        '#7A73FF',
  accentFg:      '#FFFFFF',
  surface:       '#0A2540',
  surfacePanel:  '#0D2B4B',
  surfaceCard:   '#132F4F',
  border:        '#1E4976',
  borderSubtle:  '#163A5F',
  text:          '#FFFFFF',
  textMuted:     '#8DA3BE',
  textInverse:   '#0A2540',
  background:    '#0A2540',
  backgroundAlt: '#0D2B4B',
  success:       '#00D924',
  warning:       '#FF9B00',
  error:         '#FF4B4B',
  badge:         '#132F4F',
  badgeFg:       '#7A73FF',
};

const STRIPE_SPACING: SpacingTokens = {
  xs: '0.25rem', sm: '0.75rem', md: '1.25rem', lg: '2rem', xl: '3rem',
  '2xl': '4rem', '3xl': '6rem', section: '7rem', container: '1200px', gutter: '2rem',
};

const STRIPE_RADIUS: RadiusTokens = {
  none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem',
  '2xl': '1.5rem', full: '9999px', button: '0.5rem', card: '0.75rem', badge: '0.5rem', input: '0.5rem',
};

const STRIPE_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 3px rgba(0,0,0,0.2)',
  surface:    '0 4px 16px rgba(0,0,0,0.3)',
  floating:   '0 16px 48px rgba(0,0,0,0.4)',
  enterprise: '0 8px 32px rgba(99,91,255,0.15), 0 2px 8px rgba(0,0,0,0.3)',
  inset:      'inset 0 1px 3px rgba(0,0,0,0.3)',
};

const STRIPE_MOTION: MotionTokens = {
  durationFast:    '150ms',
  durationNormal:  '250ms',
  durationSlow:    '400ms',
  easingDefault:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easingExpressive: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easingEnter:     'cubic-bezier(0, 0, 0.2, 1)',
  easingExit:      'cubic-bezier(0.4, 0, 1, 1)',
  staggerDelay:    '80ms',
};

// ── Vercel theme ──────────────────────────────────────────────────────────────

const VERCEL_COLORS: ColorTokens = {
  primary:       '#FFFFFF',
  primaryFg:     '#000000',
  accent:        '#FFFFFF',
  accentFg:      '#000000',
  surface:       '#000000',
  surfacePanel:  '#111111',
  surfaceCard:   '#1A1A1A',
  border:        '#333333',
  borderSubtle:  '#222222',
  text:          '#FFFFFF',
  textMuted:     '#888888',
  textInverse:   '#000000',
  background:    '#000000',
  backgroundAlt: '#111111',
  success:       '#00C9A7',
  warning:       '#FFBA00',
  error:         '#FF0000',
  badge:         '#1A1A1A',
  badgeFg:       '#FFFFFF',
};

const VERCEL_RADIUS: RadiusTokens = {
  none: '0', sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem',
  '2xl': '0.75rem', full: '9999px', button: '0.25rem', card: '0.375rem', badge: '0.25rem', input: '0.25rem',
};

const VERCEL_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 2px rgba(0,0,0,0.5)',
  surface:    '0 2px 8px rgba(0,0,0,0.5)',
  floating:   '0 8px 32px rgba(0,0,0,0.6)',
  enterprise: '0 4px 16px rgba(0,0,0,0.5)',
  inset:      'inset 0 1px 2px rgba(0,0,0,0.5)',
};

// ── Framer theme ──────────────────────────────────────────────────────────────

const FRAMER_COLORS: ColorTokens = {
  primary:       '#0055FF',
  primaryFg:     '#FFFFFF',
  accent:        '#FF0080',
  accentFg:      '#FFFFFF',
  surface:       '#0F0F0F',
  surfacePanel:  '#151515',
  surfaceCard:   '#1C1C1C',
  border:        '#2A2A2A',
  borderSubtle:  '#202020',
  text:          '#FFFFFF',
  textMuted:     '#888888',
  textInverse:   '#0F0F0F',
  background:    '#0F0F0F',
  backgroundAlt: '#151515',
  success:       '#00E676',
  warning:       '#FFD740',
  error:         '#FF5252',
  badge:         '#1C1C3C',
  badgeFg:       '#0055FF',
};

const FRAMER_RADIUS: RadiusTokens = {
  none: '0', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.5rem',
  '2xl': '2rem', full: '9999px', button: '0.75rem', card: '1rem', badge: '0.5rem', input: '0.75rem',
};

const FRAMER_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 2px 8px rgba(0,0,0,0.3)',
  surface:    '0 4px 20px rgba(0,85,255,0.1)',
  floating:   '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,85,255,0.1)',
  enterprise: '0 8px 32px rgba(0,85,255,0.2)',
  inset:      'inset 0 2px 4px rgba(0,0,0,0.3)',
};

const FRAMER_MOTION: MotionTokens = {
  durationFast:    '200ms',
  durationNormal:  '350ms',
  durationSlow:    '600ms',
  easingDefault:   'cubic-bezier(0.16, 1, 0.3, 1)',
  easingExpressive: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  easingEnter:     'cubic-bezier(0.16, 1, 0.3, 1)',
  easingExit:      'cubic-bezier(0.7, 0, 0.84, 0)',
  staggerDelay:    '60ms',
};

// ── Notion theme ──────────────────────────────────────────────────────────────

const NOTION_COLORS: ColorTokens = {
  primary:       '#2383E2',
  primaryFg:     '#FFFFFF',
  accent:        '#E16259',
  accentFg:      '#FFFFFF',
  surface:       '#FFFFFF',
  surfacePanel:  '#F7F7F5',
  surfaceCard:   '#FFFFFF',
  border:        '#E9E9E7',
  borderSubtle:  '#F1F1EF',
  text:          '#37352F',
  textMuted:     '#9B9A97',
  textInverse:   '#FFFFFF',
  background:    '#FFFFFF',
  backgroundAlt: '#F7F7F5',
  success:       '#0F9D58',
  warning:       '#E67E22',
  error:         '#E74C3C',
  badge:         '#F1F1EF',
  badgeFg:       '#37352F',
};

const NOTION_RADIUS: RadiusTokens = {
  none: '0', sm: '0.125rem', md: '0.25rem', lg: '0.375rem', xl: '0.5rem',
  '2xl': '0.75rem', full: '9999px', button: '0.25rem', card: '0.25rem', badge: '0.25rem', input: '0.25rem',
};

const NOTION_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 3px rgba(0,0,0,0.08)',
  surface:    '0 2px 8px rgba(0,0,0,0.1)',
  floating:   '0 8px 24px rgba(0,0,0,0.15)',
  enterprise: '0 4px 16px rgba(0,0,0,0.1)',
  inset:      'inset 0 1px 2px rgba(0,0,0,0.08)',
};

// ── Apple theme ───────────────────────────────────────────────────────────────

const APPLE_COLORS: ColorTokens = {
  primary:       '#0071E3',
  primaryFg:     '#FFFFFF',
  accent:        '#06C',
  accentFg:      '#FFFFFF',
  surface:       '#FBFBFD',
  surfacePanel:  '#F5F5F7',
  surfaceCard:   '#FFFFFF',
  border:        '#D2D2D7',
  borderSubtle:  '#E8E8ED',
  text:          '#1D1D1F',
  textMuted:     '#6E6E73',
  textInverse:   '#F5F5F7',
  background:    '#FFFFFF',
  backgroundAlt: '#F5F5F7',
  success:       '#25D366',
  warning:       '#FF9500',
  error:         '#FF3B30',
  badge:         '#E8E8ED',
  badgeFg:       '#1D1D1F',
};

const APPLE_RADIUS: RadiusTokens = {
  none: '0', sm: '0.5rem', md: '0.75rem', lg: '1rem', xl: '1.25rem',
  '2xl': '1.5rem', full: '9999px', button: '0.75rem', card: '1.25rem', badge: '0.5rem', input: '0.75rem',
};

const APPLE_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 4px rgba(0,0,0,0.06)',
  surface:    '0 4px 16px rgba(0,0,0,0.1)',
  floating:   '0 16px 48px rgba(0,0,0,0.15)',
  enterprise: '0 8px 32px rgba(0,0,0,0.12)',
  inset:      'inset 0 1px 2px rgba(0,0,0,0.06)',
};

// ── GitHub theme ──────────────────────────────────────────────────────────────

const GITHUB_COLORS: ColorTokens = {
  primary:       '#238636',
  primaryFg:     '#FFFFFF',
  accent:        '#58A6FF',
  accentFg:      '#FFFFFF',
  surface:       '#0D1117',
  surfacePanel:  '#161B22',
  surfaceCard:   '#21262D',
  border:        '#30363D',
  borderSubtle:  '#21262D',
  text:          '#E6EDF3',
  textMuted:     '#8B949E',
  textInverse:   '#0D1117',
  background:    '#0D1117',
  backgroundAlt: '#161B22',
  success:       '#3FB950',
  warning:       '#D29922',
  error:         '#F85149',
  badge:         '#21262D',
  badgeFg:       '#58A6FF',
};

const GITHUB_RADIUS: RadiusTokens = {
  none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem',
  '2xl': '1rem', full: '9999px', button: '0.375rem', card: '0.5rem', badge: '1rem', input: '0.375rem',
};

const GITHUB_SHADOWS: ShadowTokens = {
  none:       'none',
  subtle:     '0 1px 2px rgba(0,0,0,0.3)',
  surface:    '0 2px 8px rgba(0,0,0,0.4)',
  floating:   '0 8px 24px rgba(0,0,0,0.5)',
  enterprise: '0 4px 16px rgba(0,0,0,0.4)',
  inset:      'inset 0 1px 2px rgba(0,0,0,0.4)',
};

// ── PayPal theme ──────────────────────────────────────────────────────────────

const PAYPAL_COLORS: ColorTokens = {
  primary:       '#0070BA',
  primaryFg:     '#FFFFFF',
  accent:        '#003087',
  accentFg:      '#FFFFFF',
  surface:       '#FFFFFF',
  surfacePanel:  '#F5F7FA',
  surfaceCard:   '#FFFFFF',
  border:        '#D8D8D8',
  borderSubtle:  '#EDEDED',
  text:          '#2C2E2F',
  textMuted:     '#687173',
  textInverse:   '#FFFFFF',
  background:    '#FFFFFF',
  backgroundAlt: '#F5F7FA',
  success:       '#00CF00',
  warning:       '#FF9600',
  error:         '#CC0000',
  badge:         '#EEF3F8',
  badgeFg:       '#0070BA',
};

// ── Shared motion (restrained) ────────────────────────────────────────────────

const RESTRAINED_MOTION: MotionTokens = {
  durationFast:    '120ms',
  durationNormal:  '200ms',
  durationSlow:    '300ms',
  easingDefault:   'cubic-bezier(0.4, 0, 0.2, 1)',
  easingExpressive: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easingEnter:     'cubic-bezier(0, 0, 0.2, 1)',
  easingExit:      'cubic-bezier(0.4, 0, 1, 1)',
  staggerDelay:    '50ms',
};

const STANDARD_SPACING: SpacingTokens = {
  xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2.5rem',
  '2xl': '3.5rem', '3xl': '5rem', section: '6rem', container: '1200px', gutter: '1.5rem',
};

// ── Token registry ─────────────────────────────────────────────────────────────

export const TOKEN_REGISTRY: Record<string, TokenSet> = {
  linear: {
    metadata: { themeId: 'linear', themeName: 'Linear', dna: 'linear', mode: 'dark', personality: 'restrained', shadingStyle: 'flat', colorTemperature: 'cool' },
    colors: LINEAR_COLORS,
    typography: makeTypography('clamp(3rem, 6vw, 5rem)', 'clamp(2rem, 4vw, 3.5rem)', 'clamp(1.75rem, 3vw, 2.5rem)', SYSTEM_FONT, 'tight'),
    spacing: LINEAR_SPACING,
    radius: LINEAR_RADIUS,
    shadows: LINEAR_SHADOWS,
    motion: LINEAR_MOTION,
    layout: makeLayout(),
  },
  stripe: {
    metadata: { themeId: 'stripe', themeName: 'Stripe', dna: 'stripe', mode: 'dark', personality: 'professional', shadingStyle: 'gradient', colorTemperature: 'cool' },
    colors: STRIPE_COLORS,
    typography: makeTypography('clamp(2.5rem, 5vw, 4.5rem)', 'clamp(2rem, 3.5vw, 3rem)', 'clamp(1.5rem, 2.5vw, 2.25rem)'),
    spacing: STRIPE_SPACING,
    radius: STRIPE_RADIUS,
    shadows: STRIPE_SHADOWS,
    motion: STRIPE_MOTION,
    layout: { ...makeLayout(), sectionPy: '7rem', heroMinH: '85vh' },
  },
  vercel: {
    metadata: { themeId: 'vercel', themeName: 'Vercel', dna: 'vercel', mode: 'dark', personality: 'restrained', shadingStyle: 'flat', colorTemperature: 'neutral' },
    colors: VERCEL_COLORS,
    typography: makeTypography('clamp(3rem, 7vw, 6rem)', 'clamp(2rem, 4vw, 3.5rem)', 'clamp(1.5rem, 2.5vw, 2rem)', SYSTEM_FONT, 'tight'),
    spacing: LINEAR_SPACING,
    radius: VERCEL_RADIUS,
    shadows: VERCEL_SHADOWS,
    motion: RESTRAINED_MOTION,
    layout: { ...makeLayout(), heroMinH: '90vh' },
  },
  framer: {
    metadata: { themeId: 'framer', themeName: 'Framer', dna: 'framer', mode: 'dark', personality: 'expressive', shadingStyle: 'gradient', colorTemperature: 'cool' },
    colors: FRAMER_COLORS,
    typography: makeTypography('clamp(3rem, 7vw, 6rem)', 'clamp(2rem, 4vw, 3.5rem)', 'clamp(1.75rem, 3vw, 2.5rem)'),
    spacing: { ...STANDARD_SPACING, section: '8rem' },
    radius: FRAMER_RADIUS,
    shadows: FRAMER_SHADOWS,
    motion: FRAMER_MOTION,
    layout: { ...makeLayout(), heroMinH: '100vh' },
  },
  apple: {
    metadata: { themeId: 'apple', themeName: 'Apple', dna: 'apple', mode: 'light', personality: 'fluid', shadingStyle: 'glassmorphism', colorTemperature: 'neutral' },
    colors: APPLE_COLORS,
    typography: makeTypography('clamp(3rem, 6vw, 5rem)', 'clamp(2rem, 4vw, 3.5rem)', 'clamp(1.75rem, 3vw, 2.5rem)', "'SF Pro Display', 'Helvetica Neue', sans-serif"),
    spacing: { ...STANDARD_SPACING, section: '8rem' },
    radius: APPLE_RADIUS,
    shadows: APPLE_SHADOWS,
    motion: { ...RESTRAINED_MOTION, durationNormal: '300ms', durationSlow: '500ms' },
    layout: { ...makeLayout(), heroMinH: '85vh' },
  },
  notion: {
    metadata: { themeId: 'notion', themeName: 'Notion', dna: 'notion', mode: 'light', personality: 'restrained', shadingStyle: 'flat', colorTemperature: 'warm' },
    colors: NOTION_COLORS,
    typography: makeTypography('clamp(2rem, 5vw, 4rem)', 'clamp(1.75rem, 3vw, 3rem)', 'clamp(1.5rem, 2.5vw, 2rem)', "'Notion Sans', 'Inter', sans-serif"),
    spacing: STANDARD_SPACING,
    radius: NOTION_RADIUS,
    shadows: NOTION_SHADOWS,
    motion: RESTRAINED_MOTION,
    layout: { ...makeLayout(), maxWidth: '900px' },
  },
  github: {
    metadata: { themeId: 'github', themeName: 'GitHub', dna: 'github', mode: 'dark', personality: 'professional', shadingStyle: 'flat', colorTemperature: 'neutral' },
    colors: GITHUB_COLORS,
    typography: makeTypography('clamp(2.5rem, 5vw, 4rem)', 'clamp(2rem, 3.5vw, 3rem)', 'clamp(1.5rem, 2.5vw, 2.25rem)'),
    spacing: STANDARD_SPACING,
    radius: GITHUB_RADIUS,
    shadows: GITHUB_SHADOWS,
    motion: RESTRAINED_MOTION,
    layout: makeLayout(),
  },
  paypal: {
    metadata: { themeId: 'paypal', themeName: 'PayPal', dna: 'paypal', mode: 'light', personality: 'professional', shadingStyle: 'flat', colorTemperature: 'cool' },
    colors: PAYPAL_COLORS,
    typography: makeTypography('clamp(2.5rem, 5vw, 4rem)', 'clamp(1.75rem, 3.5vw, 3rem)', 'clamp(1.5rem, 2.5vw, 2rem)'),
    spacing: STRIPE_SPACING,
    radius: { ...STRIPE_RADIUS, button: '1.5rem', badge: '1rem' },
    shadows: NOTION_SHADOWS,
    motion: RESTRAINED_MOTION,
    layout: makeLayout(),
  },
};

export const REGISTRY_THEME_IDS = Object.keys(TOKEN_REGISTRY);
export const REGISTRY_SIZE = REGISTRY_THEME_IDS.length;

export function getTheme(themeId: string): TokenSet | undefined {
  return TOKEN_REGISTRY[themeId];
}

export function getAllThemes(): TokenSet[] {
  return Object.values(TOKEN_REGISTRY);
}
