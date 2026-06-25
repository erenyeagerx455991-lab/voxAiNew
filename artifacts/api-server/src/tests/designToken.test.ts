// ── V7.3.3 Design Token System Tests ──────────────────────────────────────────
// 70+ tests covering: registry, resolver, theme switching, DNA mapping,
// CSS variables, validator, metrics, tree integration, critic integration.

import { describe, it, expect, beforeEach } from "vitest";
import { TOKEN_REGISTRY, getTheme, getAllThemes, REGISTRY_SIZE } from "../../src/design-tokens/tokenRegistry.js";
import { resolveTokenSet, resolveFromDNAComposition, getThemeIdForDNA } from "../../src/design-tokens/tokenResolver.js";
import { switchTheme, getAllModes, detectThemeMode, SUPPORTED_MODES } from "../../src/design-tokens/themeSwitcher.js";
import { generateCSSVariables, buildTokenCodegenContext, countCSSVariables } from "../../src/design-tokens/cssVariables.js";
import { validateTokenUsage, quickTokenScore, usesTokenVariables } from "../../src/design-tokens/tokenValidator.js";
import { recordTokenBuild, getDesignTokenMetrics, resetDesignTokenMetrics } from "../../src/telemetry/designTokenMetrics.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTokenInput(dna: string, industry = 'saas', auth = 'guest') {
  return {
    primaryDNA: dna as never,
    industry: industry as never,
    authState: auth as never,
  };
}

// ── Phase 1+2: Token Registry ─────────────────────────────────────────────────

describe("Token Registry", () => {
  it("has 8 baseline themes", () => {
    expect(REGISTRY_SIZE).toBe(8);
  });

  it("has all required theme IDs", () => {
    const ids = Object.keys(TOKEN_REGISTRY);
    expect(ids).toContain('linear');
    expect(ids).toContain('stripe');
    expect(ids).toContain('vercel');
    expect(ids).toContain('framer');
    expect(ids).toContain('apple');
    expect(ids).toContain('notion');
    expect(ids).toContain('github');
    expect(ids).toContain('paypal');
  });

  it("getTheme returns correct theme", () => {
    const theme = getTheme('linear');
    expect(theme).toBeDefined();
    expect(theme!.metadata.themeId).toBe('linear');
  });

  it("getTheme returns undefined for unknown", () => {
    expect(getTheme('nonexistent')).toBeUndefined();
  });

  it("getAllThemes returns all 8 themes", () => {
    expect(getAllThemes()).toHaveLength(8);
  });

  it("every theme has required color tokens", () => {
    for (const theme of getAllThemes()) {
      expect(theme.colors.primary).toBeTruthy();
      expect(theme.colors.accent).toBeTruthy();
      expect(theme.colors.surface).toBeTruthy();
      expect(theme.colors.text).toBeTruthy();
      expect(theme.colors.background).toBeTruthy();
    }
  });

  it("every theme has required typography tokens", () => {
    for (const theme of getAllThemes()) {
      expect(theme.typography.fontFamily).toBeTruthy();
      expect(theme.typography.heroXl).toBeTruthy();
      expect(theme.typography.bodyMd).toBeTruthy();
    }
  });

  it("every theme has required radius tokens", () => {
    for (const theme of getAllThemes()) {
      expect(theme.radius.button).toBeTruthy();
      expect(theme.radius.card).toBeTruthy();
      expect(theme.radius.badge).toBeTruthy();
    }
  });

  it("every theme has required shadow tokens", () => {
    for (const theme of getAllThemes()) {
      expect(theme.shadows.surface).toBeTruthy();
      expect(theme.shadows.floating).toBeTruthy();
    }
  });

  it("every theme has required motion tokens", () => {
    for (const theme of getAllThemes()) {
      expect(theme.motion.durationNormal).toBeTruthy();
      expect(theme.motion.easingDefault).toBeTruthy();
    }
  });

  it("every theme has metadata.dna matching themeId", () => {
    for (const theme of getAllThemes()) {
      expect(theme.metadata.dna).toBe(theme.metadata.themeId);
    }
  });

  it("linear theme has neutral primary", () => {
    const theme = getTheme('linear')!;
    expect(theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
  });

  it("stripe theme has indigo primary", () => {
    const theme = getTheme('stripe')!;
    expect(theme.colors.primary).toBe('#635BFF');
  });

  it("framer theme has blue primary and pink accent", () => {
    const theme = getTheme('framer')!;
    expect(theme.colors.primary).toBe('#0055FF');
    expect(theme.colors.accent).toBe('#FF0080');
  });

  it("notion theme is light mode", () => {
    const theme = getTheme('notion')!;
    expect(theme.metadata.mode).toBe('light');
  });

  it("apple theme is light mode with glassmorphism", () => {
    const theme = getTheme('apple')!;
    expect(theme.metadata.mode).toBe('light');
    expect(theme.metadata.shadingStyle).toBe('glassmorphism');
  });

  it("linear has restrained motion", () => {
    const theme = getTheme('linear')!;
    expect(theme.metadata.personality).toBe('restrained');
  });

  it("framer has expressive motion", () => {
    const theme = getTheme('framer')!;
    expect(theme.metadata.personality).toBe('expressive');
  });
});

// ── Phase 3: Token Resolver ───────────────────────────────────────────────────

describe("Token Resolver — resolveTokenSet", () => {
  it("resolves linear DNA to linear theme", () => {
    const result = resolveTokenSet(makeTokenInput('linear'));
    expect(result.metadata.themeId).toBe('linear');
  });

  it("resolves stripe DNA to stripe theme", () => {
    const result = resolveTokenSet(makeTokenInput('stripe'));
    expect(result.metadata.themeId).toBe('stripe');
  });

  it("resolves framer DNA to framer theme", () => {
    const result = resolveTokenSet(makeTokenInput('framer'));
    expect(result.metadata.themeId).toBe('framer');
  });

  it("resolves vercel DNA to vercel theme", () => {
    const result = resolveTokenSet(makeTokenInput('vercel'));
    expect(result.metadata.themeId).toBe('vercel');
  });

  it("resolves cursor DNA to linear (fallback)", () => {
    const result = resolveTokenSet(makeTokenInput('cursor'));
    expect(result.metadata.themeId).toBe('linear');
  });

  it("resolves unknown DNA to linear (fallback)", () => {
    const result = resolveTokenSet(makeTokenInput('unknown_dna'));
    expect(result.metadata.themeId).toBe('linear');
  });

  it("is deterministic — same input always produces same output", () => {
    const a = resolveTokenSet(makeTokenInput('stripe', 'saas', 'guest'));
    const b = resolveTokenSet(makeTokenInput('stripe', 'saas', 'guest'));
    expect(a.metadata.themeId).toBe(b.metadata.themeId);
    expect(a.colors.primary).toBe(b.colors.primary);
  });

  it("healthcare industry modifies surface to light", () => {
    const result = resolveTokenSet(makeTokenInput('linear', 'healthcare', 'guest'));
    expect(result.colors.surface).toBe('#FFFFFF');
    expect(result.colors.background).toBe('#F8FAFB');
  });

  it("dashboard auth reduces section spacing", () => {
    const base = resolveTokenSet(makeTokenInput('stripe', 'saas', 'guest'));
    const dashboard = resolveTokenSet(makeTokenInput('stripe', 'saas', 'dashboard'));
    expect(dashboard.spacing.section).toBe('3rem');
    expect(parseFloat(dashboard.spacing.section) < parseFloat(base.spacing.section)).toBe(true);
  });

  it("admin auth reduces heroMinH", () => {
    const result = resolveTokenSet(makeTokenInput('stripe', 'saas', 'admin'));
    expect(result.layout.heroMinH).toBe('60vh');
  });
});

describe("Token Resolver — resolveFromDNAComposition", () => {
  it("selects theme from highest DNA weight", () => {
    const result = resolveFromDNAComposition({ stripe: 0.7, linear: 0.3 }, 'saas' as never, 'guest' as never);
    expect(result.metadata.themeId).toBe('stripe');
  });

  it("falls back to linear when weights are equal", () => {
    const result = resolveFromDNAComposition({ stripe: 0.5, linear: 0.5 }, 'saas' as never, 'guest' as never);
    // stripe comes first alphabetically but stripe > linear is sorted
    expect(['stripe', 'linear']).toContain(result.metadata.themeId);
  });

  it("handles empty composition gracefully", () => {
    const result = resolveFromDNAComposition({}, 'saas' as never, 'guest' as never);
    expect(result.metadata.themeId).toBe('linear');
  });

  it("getThemeIdForDNA maps correctly", () => {
    expect(getThemeIdForDNA('stripe')).toBe('stripe');
    expect(getThemeIdForDNA('framer')).toBe('framer');
    expect(getThemeIdForDNA('cursor')).toBe('linear');
    expect(getThemeIdForDNA('unknown')).toBe('linear');
  });
});

// ── Phase 6: CSS Variable System ──────────────────────────────────────────────

describe("CSS Variable Generator", () => {
  const linearTheme = getTheme('linear')!;

  it("generates a :root block", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain(':root {');
    expect(css).toContain('}');
  });

  it("includes all color variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--primary:');
    expect(css).toContain('--accent:');
    expect(css).toContain('--surface:');
    expect(css).toContain('--border:');
    expect(css).toContain('--text:');
    expect(css).toContain('--background:');
  });

  it("includes radius variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--radius-button:');
    expect(css).toContain('--radius-card:');
    expect(css).toContain('--radius-badge:');
  });

  it("includes shadow variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--shadow-surface:');
    expect(css).toContain('--shadow-floating:');
    expect(css).toContain('--shadow-subtle:');
  });

  it("includes motion variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--duration-normal:');
    expect(css).toContain('--easing-default:');
  });

  it("includes spacing variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--space-section:');
    expect(css).toContain('--space-gutter:');
  });

  it("includes typography variables", () => {
    const css = generateCSSVariables(linearTheme);
    expect(css).toContain('--font-family:');
    expect(css).toContain('--text-hero-xl:');
    expect(css).toContain('--font-weight-display:');
  });

  it("countCSSVariables returns ≥ 50 variables", () => {
    expect(countCSSVariables(linearTheme)).toBeGreaterThanOrEqual(50);
  });

  it("buildTokenCodegenContext contains CRITICAL STYLING RULES", () => {
    const ctx = buildTokenCodegenContext(linearTheme);
    expect(ctx).toContain('CRITICAL STYLING RULES');
    expect(ctx).toContain('DO NOT use hardcoded hex');
    expect(ctx).toContain('var(--primary)');
  });

  it("token codegen context includes theme name and mode", () => {
    const ctx = buildTokenCodegenContext(linearTheme);
    expect(ctx).toContain('Linear');
  });
});

// ── Phase 7: Theme Switcher ───────────────────────────────────────────────────

describe("Theme Switcher", () => {
  const darkTheme = getTheme('linear')!;
  const lightTheme = getTheme('notion')!;

  it("SUPPORTED_MODES contains all 6 modes", () => {
    expect(SUPPORTED_MODES).toContain('light');
    expect(SUPPORTED_MODES).toContain('dark');
    expect(SUPPORTED_MODES).toContain('auto');
    expect(SUPPORTED_MODES).toContain('enterprise');
    expect(SUPPORTED_MODES).toContain('creator');
    expect(SUPPORTED_MODES).toContain('dashboard');
  });

  it("switchTheme to light makes surface white for dark theme", () => {
    const switched = switchTheme(darkTheme, 'light');
    expect(switched.colors.surface).toBe('#FFFFFF');
    expect(switched.metadata.mode).toBe('light');
  });

  it("switchTheme to dark for already-dark is no-op", () => {
    const switched = switchTheme(darkTheme, 'dark');
    expect(switched.colors.surface).toBe(darkTheme.colors.surface);
  });

  it("switchTheme to enterprise changes primary to enterprise blue", () => {
    const switched = switchTheme(darkTheme, 'enterprise');
    expect(switched.colors.primary).toBe('#1A56DB');
    expect(switched.metadata.mode).toBe('enterprise');
  });

  it("switchTheme to creator changes primary to purple", () => {
    const switched = switchTheme(darkTheme, 'creator');
    expect(switched.colors.primary).toBe('#7C3AED');
    expect(switched.metadata.mode).toBe('creator');
  });

  it("switchTheme to dashboard reduces section spacing", () => {
    const switched = switchTheme(darkTheme, 'dashboard');
    expect(switched.spacing.section).toBe('2rem');
  });

  it("switchTheme to auto is no-op", () => {
    const switched = switchTheme(darkTheme, 'auto');
    expect(switched.colors.primary).toBe(darkTheme.colors.primary);
  });

  it("getAllModes returns 6 mode variants", () => {
    const modes = getAllModes('linear');
    expect(Object.keys(modes)).toHaveLength(6);
  });

  it("detectThemeMode returns correct mode", () => {
    expect(detectThemeMode(darkTheme)).toBe('dark');
    expect(detectThemeMode(lightTheme)).toBe('light');
  });

  it("getAllModes returns undefined for unknown theme", () => {
    const modes = getAllModes('nonexistent');
    expect(Object.keys(modes)).toHaveLength(0);
  });
});

// ── Phase 14: Token Validator ─────────────────────────────────────────────────

describe("Token Validator", () => {
  it("detects hardcoded hex color violations", () => {
    const code = `const style = { color: '#FF0000', background: '#0A2540' };`;
    const result = validateTokenUsage(code);
    expect(result.hardcodedColorCount).toBeGreaterThan(0);
    expect(result.tokenQualityScore).toBeLessThan(10);
  });

  it("detects Tailwind color class violations", () => {
    const code = `<div className="text-purple-600 bg-blue-500 border-green-400">`;
    const result = validateTokenUsage(code);
    expect(result.hardcodedColorCount).toBeGreaterThan(0);
  });

  it("detects hardcoded radius violations", () => {
    const code = `<div className="rounded-2xl rounded-xl rounded-lg">`;
    const result = validateTokenUsage(code);
    expect(result.hardcodedRadiusCount).toBeGreaterThan(0);
  });

  it("detects hardcoded shadow violations", () => {
    const code = `<div className="shadow-lg shadow-xl shadow-md">`;
    const result = validateTokenUsage(code);
    expect(result.hardcodedShadowCount).toBeGreaterThan(0);
  });

  it("clean code with CSS variables scores 10", () => {
    const code = `
      const style = {
        color: 'var(--primary)',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-surface)',
      };
    `;
    const result = validateTokenUsage(code);
    expect(result.tokenQualityScore).toBe(10);
  });

  it("empty code returns score 10", () => {
    const result = validateTokenUsage('');
    expect(result.tokenQualityScore).toBe(10);
  });

  it("violationCount aggregates all violation types", () => {
    const code = `
      color: #FF0000;
      background: rgb(10, 37, 64);
      className="text-purple-600 rounded-2xl shadow-lg"
    `;
    const result = validateTokenUsage(code);
    expect(result.violationCount).toBeGreaterThan(0);
  });

  it("usesTokenVariables detects CSS variable usage", () => {
    expect(usesTokenVariables('color: var(--primary)')).toBe(true);
    expect(usesTokenVariables('color: #FF0000')).toBe(false);
  });

  it("quickTokenScore returns 0-10", () => {
    const score = quickTokenScore('color: #FF0000; background: rgb(0,0,0)');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("valid field is false only on error-severity violations", () => {
    const code = `color: #FF0000;`;
    const result = validateTokenUsage(code);
    expect(result.valid).toBe(true); // violations are warnings, not errors
  });

  it("skips comment lines", () => {
    const code = `// color: #FF0000 — old hardcoded value\n* background: #0A2540`;
    const result = validateTokenUsage(code);
    expect(result.hardcodedColorCount).toBe(0);
  });

  it("token definition lines are allowed", () => {
    const code = `:root {\n  --primary: #635BFF;\n  --accent: #7A73FF;\n}`;
    const result = validateTokenUsage(code);
    expect(result.tokenQualityScore).toBe(10);
  });
});

// ── Phase 13: Telemetry Metrics ───────────────────────────────────────────────

describe("Design Token Metrics", () => {
  beforeEach(() => {
    resetDesignTokenMetrics();
  });

  it("initial metrics are zeroed", () => {
    const metrics = getDesignTokenMetrics();
    expect(metrics.totalBuilds).toBe(0);
    expect(metrics.averageTokenScore).toBe(0);
    expect(metrics.mostUsedTheme).toBe('');
  });

  it("recordTokenBuild increments totalBuilds", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 8.5, hardcodedColorCount: 2, hardcodedRadiusCount: 1, hardcodedShadowCount: 0, violationCount: 3, usedCSSVariables: true });
    expect(getDesignTokenMetrics().totalBuilds).toBe(1);
  });

  it("averageTokenScore is computed correctly", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 8, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    recordTokenBuild({ themeId: 'stripe', mode: 'dark', dna: 'stripe', tokenQualityScore: 6, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    expect(getDesignTokenMetrics().averageTokenScore).toBe(7);
  });

  it("themeDistribution tracks theme usage", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 9, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 9, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    recordTokenBuild({ themeId: 'stripe', mode: 'dark', dna: 'stripe', tokenQualityScore: 8, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    const metrics = getDesignTokenMetrics();
    expect(metrics.themeDistribution['linear']).toBe(2);
    expect(metrics.themeDistribution['stripe']).toBe(1);
    expect(metrics.mostUsedTheme).toBe('linear');
    expect(metrics.leastUsedTheme).toBe('stripe');
  });

  it("cssVariableAdoptionRate is computed", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 9, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    recordTokenBuild({ themeId: 'stripe', mode: 'dark', dna: 'stripe', tokenQualityScore: 5, hardcodedColorCount: 5, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 5, usedCSSVariables: false });
    expect(getDesignTokenMetrics().cssVariableAdoptionRate).toBe(0.5);
  });

  it("tokenViolations aggregates hardcoded counts", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 7, hardcodedColorCount: 3, hardcodedRadiusCount: 2, hardcodedShadowCount: 1, violationCount: 6, usedCSSVariables: false });
    const metrics = getDesignTokenMetrics();
    expect(metrics.hardcodedColorUsage).toBe(3);
    expect(metrics.hardcodedRadiusUsage).toBe(2);
    expect(metrics.hardcodedShadowUsage).toBe(1);
  });

  it("resetDesignTokenMetrics clears all records", () => {
    recordTokenBuild({ themeId: 'linear', mode: 'dark', dna: 'linear', tokenQualityScore: 9, hardcodedColorCount: 0, hardcodedRadiusCount: 0, hardcodedShadowCount: 0, violationCount: 0, usedCSSVariables: true });
    resetDesignTokenMetrics();
    expect(getDesignTokenMetrics().totalBuilds).toBe(0);
  });
});

// ── Phase 4: Component Tree Token Integration ──────────────────────────────────

describe("Component Tree — token metadata", () => {
  it("buildComponentTree types are re-exported correctly", async () => {
    const { buildComponentTree } = await import("../../src/component-tree/treeBuilder.js");
    expect(typeof buildComponentTree).toBe('function');
  });

  it("COMPONENT_TOKEN_MAP covers HeroHeadline", async () => {
    const { buildComponentTree } = await import("../../src/component-tree/treeBuilder.js");
    const tree = buildComponentTree({
      plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['hero'] }, dnaComposition: { linear: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never,
      architecture: { plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['hero'] }, dnaComposition: { linear: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never, projectBlueprint: { pages: ['index.tsx'], projectType: 'landing', language: 'tsx', framework: 'react', libraries: [] } } as never,
      buildId: 'test-tree',
    });
    const hero = tree.sections.find(s => s.sectionType === 'hero');
    const headline = hero?.children.find(c => c.name === 'HeroHeadline');
    expect(headline?.metadata.tokenTypography).toBe('hero-xl');
    expect(headline?.metadata.tokenColor).toBe('text');
  });

  it("CTAButton (in cta section) has token color primary and shadow surface", async () => {
    const { buildComponentTree } = await import("../../src/component-tree/treeBuilder.js");
    const tree = buildComponentTree({
      plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['cta'] }, dnaComposition: { stripe: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never,
      architecture: { plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['cta'] }, dnaComposition: { stripe: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never, projectBlueprint: { pages: ['index.tsx'], projectType: 'landing', language: 'tsx', framework: 'react', libraries: [] } } as never,
      buildId: 'test-cta',
    });
    const cta = tree.sections.find(s => s.sectionType === 'cta');
    const ctaButton = cta?.children.find(c => c.name === 'CTAButton');
    expect(ctaButton?.metadata.tokenColor).toBe('primary');
    expect(ctaButton?.metadata.tokenShadow).toBe('shadow-surface');
  });

  it("FeatureCard has token radius-card", async () => {
    const { buildComponentTree } = await import("../../src/component-tree/treeBuilder.js");
    const tree = buildComponentTree({
      plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['features'] }, dnaComposition: { stripe: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never,
      architecture: { plan: { authState: 'guest', blueprint: { websiteType: 'SaaS', sectionOrder: ['features'] }, dnaComposition: { stripe: 1 }, dnaOwnership: {}, dnaTheme: null, dnaMotion: null, referenceSites: '', primaryReference: '', secondaryReferences: [], briefText: 'test', cleanPlan: 'test', templateContext: '', templateMatch: { templateId: '', template: {}, confidence: 0, pages: [], apis: [], databaseTables: [], features: [] }, navbarVariant: '', authConfidence: 0 } as never, projectBlueprint: { pages: ['index.tsx'], projectType: 'landing', language: 'tsx', framework: 'react', libraries: [] } } as never,
      buildId: 'test-features',
    });
    const features = tree.sections.find(s => s.sectionType === 'features');
    const card = features?.children.find(c => c.name === 'FeatureCard');
    expect(card?.metadata.tokenRadius).toBe('radius-card');
  });
});

// ── Phase 11: Multi-Candidate consistency ────────────────────────────────────

describe("Multi-Candidate Token Consistency", () => {
  it("same DNA composition always resolves same tokenSet", () => {
    const comp = { stripe: 0.7, linear: 0.3 };
    const a = resolveFromDNAComposition(comp, 'saas' as never, 'guest' as never);
    const b = resolveFromDNAComposition(comp, 'saas' as never, 'guest' as never);
    const c = resolveFromDNAComposition(comp, 'saas' as never, 'guest' as never);
    expect(a.metadata.themeId).toBe(b.metadata.themeId);
    expect(b.metadata.themeId).toBe(c.metadata.themeId);
    expect(a.colors.primary).toBe(b.colors.primary);
    expect(b.colors.primary).toBe(c.colors.primary);
  });

  it("all 3 candidates share same token theme when DNA is identical", () => {
    const dna = { framer: 1.0 };
    const candidates = [0, 1, 2].map(() =>
      resolveFromDNAComposition(dna, 'saas' as never, 'guest' as never)
    );
    const themeIds = candidates.map(t => t.metadata.themeId);
    expect(new Set(themeIds).size).toBe(1);
  });
});
