// ── V7.3.3 CSS Variable Generator ─────────────────────────────────────────────
// Generates :root { } CSS variable block from a resolved TokenSet.
// Every generated website injects this block as the styling foundation.

import type { TokenSet } from "./tokenTypes.js";

// ── Variable name map ─────────────────────────────────────────────────────────

function generateColorVariables(colors: TokenSet['colors']): string[] {
  return [
    `  --primary: ${colors.primary};`,
    `  --primary-fg: ${colors.primaryFg};`,
    `  --accent: ${colors.accent};`,
    `  --accent-fg: ${colors.accentFg};`,
    `  --surface: ${colors.surface};`,
    `  --surface-panel: ${colors.surfacePanel};`,
    `  --surface-card: ${colors.surfaceCard};`,
    `  --border: ${colors.border};`,
    `  --border-subtle: ${colors.borderSubtle};`,
    `  --text: ${colors.text};`,
    `  --text-muted: ${colors.textMuted};`,
    `  --text-inverse: ${colors.textInverse};`,
    `  --background: ${colors.background};`,
    `  --background-alt: ${colors.backgroundAlt};`,
    `  --success: ${colors.success};`,
    `  --warning: ${colors.warning};`,
    `  --error: ${colors.error};`,
    `  --badge: ${colors.badge};`,
    `  --badge-fg: ${colors.badgeFg};`,
  ];
}

function generateRadiusVariables(radius: TokenSet['radius']): string[] {
  return [
    `  --radius-none: ${radius.none};`,
    `  --radius-sm: ${radius.sm};`,
    `  --radius-md: ${radius.md};`,
    `  --radius-lg: ${radius.lg};`,
    `  --radius-xl: ${radius.xl};`,
    `  --radius-2xl: ${radius['2xl']};`,
    `  --radius-full: ${radius.full};`,
    `  --radius-button: ${radius.button};`,
    `  --radius-card: ${radius.card};`,
    `  --radius-badge: ${radius.badge};`,
    `  --radius-input: ${radius.input};`,
  ];
}

function generateShadowVariables(shadows: TokenSet['shadows']): string[] {
  return [
    `  --shadow-none: ${shadows.none};`,
    `  --shadow-subtle: ${shadows.subtle};`,
    `  --shadow-surface: ${shadows.surface};`,
    `  --shadow-floating: ${shadows.floating};`,
    `  --shadow-enterprise: ${shadows.enterprise};`,
    `  --shadow-inset: ${shadows.inset};`,
  ];
}

function generateMotionVariables(motion: TokenSet['motion']): string[] {
  return [
    `  --duration-fast: ${motion.durationFast};`,
    `  --duration-normal: ${motion.durationNormal};`,
    `  --duration-slow: ${motion.durationSlow};`,
    `  --easing-default: ${motion.easingDefault};`,
    `  --easing-expressive: ${motion.easingExpressive};`,
    `  --easing-enter: ${motion.easingEnter};`,
    `  --easing-exit: ${motion.easingExit};`,
    `  --stagger-delay: ${motion.staggerDelay};`,
  ];
}

function generateSpacingVariables(spacing: TokenSet['spacing']): string[] {
  return [
    `  --space-xs: ${spacing.xs};`,
    `  --space-sm: ${spacing.sm};`,
    `  --space-md: ${spacing.md};`,
    `  --space-lg: ${spacing.lg};`,
    `  --space-xl: ${spacing.xl};`,
    `  --space-2xl: ${spacing['2xl']};`,
    `  --space-3xl: ${spacing['3xl']};`,
    `  --space-section: ${spacing.section};`,
    `  --space-gutter: ${spacing.gutter};`,
  ];
}

function generateTypographyVariables(typography: TokenSet['typography']): string[] {
  return [
    `  --font-family: ${typography.fontFamily};`,
    `  --font-family-mono: ${typography.fontFamilyMono};`,
    `  --text-hero-xl: ${typography.heroXl};`,
    `  --text-hero-lg: ${typography.heroLg};`,
    `  --text-h1: ${typography.heading1};`,
    `  --text-h2: ${typography.heading2};`,
    `  --text-h3: ${typography.heading3};`,
    `  --text-body-lg: ${typography.bodyLg};`,
    `  --text-body-md: ${typography.bodyMd};`,
    `  --text-body-sm: ${typography.bodySm};`,
    `  --text-caption: ${typography.caption};`,
    `  --font-weight-display: ${typography.fontWeightDisplay};`,
    `  --font-weight-heading: ${typography.fontWeightHeading};`,
    `  --font-weight-body: ${typography.fontWeightBody};`,
    `  --line-height-tight: ${typography.lineHeightTight};`,
    `  --line-height-normal: ${typography.lineHeightNormal};`,
    `  --line-height-relaxed: ${typography.lineHeightRelaxed};`,
    `  --letter-spacing-tight: ${typography.letterSpacingTight};`,
    `  --letter-spacing-normal: ${typography.letterSpacingNormal};`,
    `  --letter-spacing-wide: ${typography.letterSpacingWide};`,
  ];
}

function generateLayoutVariables(layout: TokenSet['layout']): string[] {
  return [
    `  --max-width: ${layout.maxWidth};`,
    `  --hero-min-h: ${layout.heroMinH};`,
    `  --section-py: ${layout.sectionPy};`,
    `  --nav-height: ${layout.navHeight};`,
    `  --sidebar-w: ${layout.sidebarW};`,
  ];
}

// ── Main generator ─────────────────────────────────────────────────────────────

export function generateCSSVariables(tokenSet: TokenSet): string {
  const lines: string[] = [
    `/* ── Design Tokens: ${tokenSet.metadata.themeName} (${tokenSet.metadata.themeId}) ── */`,
    `:root {`,
    `  /* Colors */`,
    ...generateColorVariables(tokenSet.colors),
    `  /* Radius */`,
    ...generateRadiusVariables(tokenSet.radius),
    `  /* Shadows */`,
    ...generateShadowVariables(tokenSet.shadows),
    `  /* Motion */`,
    ...generateMotionVariables(tokenSet.motion),
    `  /* Spacing */`,
    ...generateSpacingVariables(tokenSet.spacing),
    `  /* Typography */`,
    ...generateTypographyVariables(tokenSet.typography),
    `  /* Layout */`,
    ...generateLayoutVariables(tokenSet.layout),
    `}`,
    '',
    `/* ── Token aliases for component use ── */`,
    `/* Use these in your code instead of hardcoded values: */`,
    `/* color: var(--primary)   instead of text-purple-600 */`,
    `/* border-radius: var(--radius-card)  instead of rounded-2xl */`,
    `/* box-shadow: var(--shadow-surface)  instead of shadow-lg */`,
    `/* background: var(--surface)         instead of bg-gray-900 */`,
  ];

  return lines.join('\n');
}

// ── Codegen injection block ───────────────────────────────────────────────────

export function buildTokenCodegenContext(tokenSet: TokenSet): string {
  const css = generateCSSVariables(tokenSet);
  return [
    '## Design Token System',
    `Theme: **${tokenSet.metadata.themeName}** | Mode: ${tokenSet.metadata.mode} | Personality: ${tokenSet.metadata.personality}`,
    '',
    'CRITICAL STYLING RULES:',
    '1. DO NOT use hardcoded hex colors (#HEX). Use CSS variables: `color: var(--primary)`',
    '2. DO NOT use Tailwind color classes like text-purple-600, bg-blue-500. Use semantic tokens.',
    '3. DO NOT use hardcoded border-radius values like rounded-2xl. Use var(--radius-card).',
    '4. DO NOT use hardcoded shadows like shadow-lg. Use var(--shadow-surface).',
    '5. Inject the CSS variable block into the generated code <style> or styled-components.',
    '',
    'ALLOWED token references in className / style props:',
    '  Colors:  var(--primary), var(--accent), var(--surface), var(--surface-card), var(--border), var(--text), var(--text-muted), var(--background)',
    '  Radius:  var(--radius-button), var(--radius-card), var(--radius-badge), var(--radius-input)',
    '  Shadow:  var(--shadow-surface), var(--shadow-floating), var(--shadow-subtle)',
    '  Motion:  var(--duration-normal), var(--easing-default)',
    '  Space:   var(--space-section), var(--space-gutter)',
    '',
    '```css',
    css,
    '```',
  ].join('\n');
}

// ── Variable count ─────────────────────────────────────────────────────────────

export function countCSSVariables(tokenSet: TokenSet): number {
  const css = generateCSSVariables(tokenSet);
  return (css.match(/--[\w-]+:/g) ?? []).length;
}
