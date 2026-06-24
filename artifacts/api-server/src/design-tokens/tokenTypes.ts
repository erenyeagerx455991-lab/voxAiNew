// ── V7.3.3 Design Token Types ─────────────────────────────────────────────────
// Single source of truth for all styling decisions per build.

export type ThemeMode = 'light' | 'dark' | 'auto' | 'enterprise' | 'creator' | 'dashboard';
export type DNABrand = 'stripe' | 'linear' | 'vercel' | 'framer' | 'apple' | 'notion' | 'github' | 'paypal' | 'cursor' | 'perplexity' | string;
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type ShadowScale = 'none' | 'subtle' | 'soft' | 'surface' | 'floating' | 'enterprise' | 'expressive';
export type SpacingScale = 'compact' | 'normal' | 'comfortable' | 'spacious';
export type MotionPersonality = 'instant' | 'restrained' | 'professional' | 'fluid' | 'expressive';

// ── Color tokens ──────────────────────────────────────────────────────────────

export interface ColorTokens {
  primary:       string;
  primaryFg:     string;
  accent:        string;
  accentFg:      string;
  surface:       string;
  surfacePanel:  string;
  surfaceCard:   string;
  border:        string;
  borderSubtle:  string;
  text:          string;
  textMuted:     string;
  textInverse:   string;
  background:    string;
  backgroundAlt: string;
  success:       string;
  warning:       string;
  error:         string;
  badge:         string;
  badgeFg:       string;
}

// ── Typography tokens ─────────────────────────────────────────────────────────

export interface TypographyTokens {
  fontFamily:      string;
  fontFamilyMono:  string;
  heroXl:          string;
  heroLg:          string;
  heading1:        string;
  heading2:        string;
  heading3:        string;
  bodyLg:          string;
  bodyMd:          string;
  bodySm:          string;
  caption:         string;
  fontWeightDisplay: string;
  fontWeightHeading: string;
  fontWeightBody:    string;
  lineHeightTight:   string;
  lineHeightNormal:  string;
  lineHeightRelaxed: string;
  letterSpacingTight: string;
  letterSpacingNormal: string;
  letterSpacingWide:   string;
}

// ── Spacing tokens ─────────────────────────────────────────────────────────────

export interface SpacingTokens {
  xs:  string;
  sm:  string;
  md:  string;
  lg:  string;
  xl:  string;
  '2xl': string;
  '3xl': string;
  section:  string;
  container: string;
  gutter:    string;
}

// ── Radius tokens ──────────────────────────────────────────────────────────────

export interface RadiusTokens {
  none:   string;
  sm:     string;
  md:     string;
  lg:     string;
  xl:     string;
  '2xl':  string;
  full:   string;
  button: string;
  card:   string;
  badge:  string;
  input:  string;
}

// ── Shadow tokens ──────────────────────────────────────────────────────────────

export interface ShadowTokens {
  none:      string;
  subtle:    string;
  surface:   string;
  floating:  string;
  enterprise: string;
  inset:     string;
}

// ── Motion tokens ──────────────────────────────────────────────────────────────

export interface MotionTokens {
  durationFast:    string;
  durationNormal:  string;
  durationSlow:    string;
  easingDefault:   string;
  easingExpressive: string;
  easingEnter:     string;
  easingExit:      string;
  staggerDelay:    string;
}

// ── Layout tokens ──────────────────────────────────────────────────────────────

export interface LayoutTokens {
  maxWidth:    string;
  heroMinH:    string;
  sectionPy:   string;
  navHeight:   string;
  sidebarW:    string;
  breakpointSm: string;
  breakpointMd: string;
  breakpointLg: string;
  breakpointXl: string;
}

// ── Theme metadata ─────────────────────────────────────────────────────────────

export interface ThemeMetadata {
  themeId:     string;
  themeName:   string;
  dna:         DNABrand;
  mode:        ThemeMode;
  personality: MotionPersonality;
  shadingStyle: 'flat' | 'gradient' | 'glassmorphism' | 'neumorphic';
  colorTemperature: 'cool' | 'neutral' | 'warm';
}

// ── Full token set ─────────────────────────────────────────────────────────────

export interface TokenSet {
  metadata:   ThemeMetadata;
  colors:     ColorTokens;
  typography: TypographyTokens;
  spacing:    SpacingTokens;
  radius:     RadiusTokens;
  shadows:    ShadowTokens;
  motion:     MotionTokens;
  layout:     LayoutTokens;
}

// ── Token violation ────────────────────────────────────────────────────────────

export interface TokenViolation {
  type: 'hardcoded_color' | 'hardcoded_radius' | 'hardcoded_shadow' | 'missing_variable' | 'theme_conflict' | 'invalid_token_ref';
  value: string;
  severity: 'error' | 'warning';
  line?: number;
  context?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  violations: TokenViolation[];
  violationCount: number;
  hardcodedColorCount: number;
  hardcodedRadiusCount: number;
  hardcodedShadowCount: number;
  tokenQualityScore: number;
}
