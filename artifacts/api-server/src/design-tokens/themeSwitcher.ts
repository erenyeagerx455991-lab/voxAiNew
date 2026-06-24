// ── V7.3.3 Theme Switcher ─────────────────────────────────────────────────────
// Switches between Light/Dark/Auto/Enterprise/Creator/Dashboard themes
// by replacing token values — no component regeneration required.

import type { TokenSet, ThemeMode } from "./tokenTypes.js";
import { TOKEN_REGISTRY } from "./tokenRegistry.js";

// ── Light overrides ───────────────────────────────────────────────────────────

function applyLightMode(base: TokenSet): TokenSet {
  const isDark = base.metadata.mode === 'dark';
  if (!isDark) return base;

  return {
    ...base,
    metadata: { ...base.metadata, mode: 'light' },
    colors: {
      ...base.colors,
      surface:       '#FFFFFF',
      surfacePanel:  '#F7F7F7',
      surfaceCard:   '#FFFFFF',
      border:        '#E5E5E5',
      borderSubtle:  '#F0F0F0',
      text:          '#0F0F0F',
      textMuted:     '#6B7280',
      textInverse:   '#FFFFFF',
      background:    '#FFFFFF',
      backgroundAlt: '#F7F7F7',
      badge:         '#F3F4F6',
      badgeFg:       base.colors.primary,
    },
  };
}

// ── Dark overrides ────────────────────────────────────────────────────────────

function applyDarkMode(base: TokenSet): TokenSet {
  const isLight = base.metadata.mode === 'light';
  if (!isLight) return base;

  return {
    ...base,
    metadata: { ...base.metadata, mode: 'dark' },
    colors: {
      ...base.colors,
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
      badge:         '#1E1E2E',
      badgeFg:       base.colors.accent,
    },
  };
}

// ── Enterprise mode ───────────────────────────────────────────────────────────

function applyEnterpriseMode(base: TokenSet): TokenSet {
  return {
    ...base,
    metadata: { ...base.metadata, mode: 'enterprise', shadingStyle: 'flat', personality: 'professional' },
    colors: {
      ...base.colors,
      primary:   '#1A56DB',
      primaryFg: '#FFFFFF',
      accent:    '#2563EB',
      accentFg:  '#FFFFFF',
      badge:     '#EFF6FF',
      badgeFg:   '#1A56DB',
    },
    radius: {
      ...base.radius,
      button: '0.375rem',
      card:   '0.5rem',
      badge:  '0.25rem',
      input:  '0.375rem',
    },
    motion: {
      ...base.motion,
      durationFast:   '100ms',
      durationNormal: '150ms',
      durationSlow:   '250ms',
    },
  };
}

// ── Creator mode ──────────────────────────────────────────────────────────────

function applyCreatorMode(base: TokenSet): TokenSet {
  return {
    ...base,
    metadata: { ...base.metadata, mode: 'creator', personality: 'expressive' },
    colors: {
      ...base.colors,
      primary:   '#7C3AED',
      primaryFg: '#FFFFFF',
      accent:    '#EC4899',
      accentFg:  '#FFFFFF',
      badge:     '#F5F3FF',
      badgeFg:   '#7C3AED',
    },
    radius: {
      ...base.radius,
      button: '0.75rem',
      card:   '1rem',
      badge:  '0.5rem',
    },
    motion: {
      ...base.motion,
      durationNormal: '350ms',
      easingDefault:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  };
}

// ── Dashboard mode ────────────────────────────────────────────────────────────

function applyDashboardMode(base: TokenSet): TokenSet {
  return {
    ...base,
    metadata: { ...base.metadata, mode: 'dashboard' },
    spacing: {
      ...base.spacing,
      section: '2rem',
      gutter:  '1rem',
    },
    layout: {
      ...base.layout,
      heroMinH: '40vh',
      sectionPy: '2rem',
    },
    shadows: {
      ...base.shadows,
      surface: base.shadows.subtle,
    },
  };
}

// ── Theme switcher ────────────────────────────────────────────────────────────

export function switchTheme(base: TokenSet, targetMode: ThemeMode): TokenSet {
  switch (targetMode) {
    case 'light':      return applyLightMode(base);
    case 'dark':       return applyDarkMode(base);
    case 'enterprise': return applyEnterpriseMode(base);
    case 'creator':    return applyCreatorMode(base);
    case 'dashboard':  return applyDashboardMode(base);
    case 'auto':       return base;
    default:           return base;
  }
}

// ── Get all modes for a given base theme ──────────────────────────────────────

export function getAllModes(themeId: string): Partial<Record<ThemeMode, TokenSet>> {
  const base = TOKEN_REGISTRY[themeId];
  if (!base) return {};

  const modes: ThemeMode[] = ['light', 'dark', 'enterprise', 'creator', 'dashboard', 'auto'];
  const result: Partial<Record<ThemeMode, TokenSet>> = {};
  for (const mode of modes) {
    result[mode] = switchTheme(base, mode);
  }
  return result;
}

// ── Detect current mode of a token set ───────────────────────────────────────

export function detectThemeMode(tokenSet: TokenSet): ThemeMode {
  return tokenSet.metadata.mode;
}

export const SUPPORTED_MODES: ThemeMode[] = ['light', 'dark', 'auto', 'enterprise', 'creator', 'dashboard'];
