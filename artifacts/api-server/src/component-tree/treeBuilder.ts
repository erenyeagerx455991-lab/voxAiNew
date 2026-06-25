// ── V7.3.2 Tree Builder ───────────────────────────────────────────────────────
// Builds a PageTree deterministically from planner + architecture output.
// No LLM calls — pure mapping from sections + DNA + industry + auth.

import type {
  PageTree, SectionNode, ComponentNode,
  SectionType, DNABrand, AuthState, Industry,
  TreeMetadata, TreeStatistics,
} from "./componentTreeTypes.js";
import type { PlannerOutput, ArchitectureOutput } from "../agents/pipeline/pipelineTypes.js";
import { COMPONENT_CATALOG, type CatalogEntry } from "./componentCatalog.js";

// ── Section type normalization ─────────────────────────────────────────────────

const SECTION_TYPE_MAP: Record<string, SectionType> = {
  hero: 'hero', features: 'features', pricing: 'pricing', cta: 'cta',
  testimonials: 'testimonials', faq: 'faq', navbar: 'navbar', footer: 'footer',
  dashboard: 'dashboard', bento: 'bento', stats: 'stats', integrations: 'integrations',
  timeline: 'timeline', auth: 'auth', settings: 'settings', form: 'form',
  // Aliases — section name → type
  'how-it-works': 'features', 'use-cases': 'features', usecases: 'features',
  doctors: 'features', services: 'features', trust: 'features',
  integrations_grid: 'integrations',
  // CTA variants
  'call to action': 'cta', 'call-to-action': 'cta', 'action': 'cta',
  // FAQ variants
  'frequently asked': 'faq', 'frequently': 'faq', 'questions': 'faq',
};

export function normalizeSectionToType(section: string): SectionType {
  const lower = section.toLowerCase();
  for (const [key, val] of Object.entries(SECTION_TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'unknown';
}

// ── Industry detection from prompt/blueprint ──────────────────────────────────

const INDUSTRY_KEYWORDS: Record<Industry, string[]> = {
  healthcare: ['health', 'medical', 'doctor', 'patient', 'clinic', 'hospital', 'wellness'],
  ecommerce:  ['shop', 'store', 'buy', 'product', 'cart', 'checkout', 'commerce'],
  fintech:    ['finance', 'payment', 'bank', 'invest', 'trading', 'money', 'wallet'],
  education:  ['learn', 'course', 'education', 'school', 'teach', 'training', 'tutor'],
  creative:   ['design', 'creative', 'art', 'agency', 'studio', 'brand'],
  restaurant: ['restaurant', 'food', 'menu', 'cuisine', 'chef', 'dining', 'catering'],
  portfolio:  ['portfolio', 'freelance', 'personal', 'about me', 'work', 'showcase'],
  ai:         ['ai', 'artificial intelligence', 'ml', 'machine learning', 'llm', 'chatbot', 'gpt'],
  enterprise: ['enterprise', 'b2b', 'corporate', 'company', 'organization', 'team'],
  saas:       ['saas', 'software', 'platform', 'app', 'tool', 'subscription', 'service'],
};

export function detectIndustry(prompt: string, websiteType: string): Industry {
  const lower = (prompt + ' ' + websiteType).toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return industry as Industry;
  }
  return 'saas';
}

// ── Auth state normalization ───────────────────────────────────────────────────

function normalizeAuthState(auth: string): AuthState {
  if (auth === 'admin') return 'admin';
  if (auth === 'dashboard') return 'dashboard';
  if (auth === 'authenticated') return 'authenticated';
  return 'guest';
}

// ── Primary DNA detection ─────────────────────────────────────────────────────

export function detectPrimaryDNA(dnaWeights: Record<string, number>): DNABrand {
  if (!dnaWeights || Object.keys(dnaWeights).length === 0) return 'linear';
  return Object.entries(dnaWeights).sort(([, a], [, b]) => b - a)[0][0] as DNABrand;
}

// ── Component selection per section ──────────────────────────────────────────

const SECTION_REQUIRED_COMPONENTS: Record<SectionType, string[]> = {
  hero:         ['HeroHeadline', 'PrimaryCTA'],
  features:     ['FeatureGrid', 'FeatureCard'],
  pricing:      ['PricingHeader', 'PricingGrid', 'PricingCard'],
  cta:          ['CTAHeadline', 'CTAButton'],
  testimonials: ['TestimonialCard'],
  faq:          ['FAQAccordion'],
  navbar:       ['Logo', 'NavigationMenu'],
  footer:       ['FooterLinks'],
  dashboard:    ['DashboardTabs', 'DataTable'],
  bento:        ['FeatureGrid', 'FeatureCard'],
  stats:        ['MetricCard'],
  integrations: ['FeatureGrid', 'FeatureCard'],
  timeline:     ['FeatureCard'],
  auth:         [],
  settings:     ['SettingsTabs'],
  form:         [],
  unknown:      [],
};

const DNA_HERO_COMPONENTS: Record<string, string[]> = {
  stripe:     ['AnnouncementBar', 'HeroBadge', 'HeroHeadline', 'HeroSupportingCopy', 'CTAGroup', 'TrustRow', 'EnterpriseProof'],
  linear:     ['MinimalBadge', 'HeroHeadline', 'HeroSupportingCopy', 'CTAGroup'],
  vercel:     ['HeroHeadline', 'HeroSupportingCopy', 'CTAGroup', 'TrustRow'],
  framer:     ['MotionBadge', 'HeroHeadline', 'AnimatedVisual', 'CTAGroup'],
  notion:     ['Eyebrow', 'HeroHeadline', 'HeroSupportingCopy', 'CTAGroup', 'TrustRow'],
  cursor:     ['HeroBadge', 'Eyebrow', 'HeroHeadline', 'AnimatedVisual', 'CTAGroup'],
  perplexity: ['HeroBadge', 'HeroHeadline', 'HeroSupportingCopy', 'CTAGroup'],
};

const AUTH_SECTION_OVERRIDES: Record<AuthState, Partial<Record<SectionType, string[]>>> = {
  guest:         {},
  authenticated: {
    navbar: ['Logo', 'NavigationMenu', 'AvatarMenu'],
    dashboard: ['DashboardTabs', 'DashboardFilters', 'DataTable'],
  },
  admin: {
    navbar:    ['Logo', 'NavigationMenu', 'CommandPalette', 'AvatarMenu'],
    dashboard: ['DashboardTabs', 'DashboardFilters', 'DataTable', 'CRUDTable'],
    settings:  ['SettingsTabs', 'AvatarUploader'],
  },
  dashboard: {
    navbar:    ['Logo', 'NavigationMenu', 'AvatarMenu'],
    dashboard: ['DashboardTabs', 'DashboardFilters', 'DataTable'],
  },
};

function selectComponentsForSection(
  sectionType: SectionType,
  primaryDNA: DNABrand,
  authState: AuthState,
  industry: Industry,
): string[] {
  // Auth overrides first
  const authOverride = AUTH_SECTION_OVERRIDES[authState]?.[sectionType];
  if (authOverride && authOverride.length > 0) return authOverride;

  // DNA-specific hero components
  if (sectionType === 'hero') {
    return DNA_HERO_COMPONENTS[primaryDNA] ?? DNA_HERO_COMPONENTS['linear'];
  }

  // Navbar with CTA for guest
  if (sectionType === 'navbar' && authState === 'guest') {
    return ['Logo', 'NavigationMenu', 'NavbarCTAButton'];
  }

  // CTA with social proof for all
  if (sectionType === 'cta') {
    return ['CTAHeadline', 'CTAButton', 'SocialProof'];
  }

  // Enterprise/saas pricing with FAQ
  if (sectionType === 'pricing' && (industry === 'enterprise' || industry === 'saas')) {
    return ['PricingHeader', 'PricingToggle', 'PricingGrid', 'PricingCard', 'PricingFAQ'];
  }

  // Default required components
  return SECTION_REQUIRED_COMPONENTS[sectionType] ?? [];
}

// ── Node builders ─────────────────────────────────────────────────────────────

// ── V7.3.3 Token metadata per component ──────────────────────────────────────

const COMPONENT_TOKEN_MAP: Record<string, { tokenTypography?: string; tokenColor?: string; tokenShadow?: string; tokenRadius?: string }> = {
  HeroHeadline:      { tokenTypography: 'hero-xl',    tokenColor: 'text' },
  HeroSupportingCopy:{ tokenTypography: 'body-lg',    tokenColor: 'text-muted' },
  CTAGroup:          { tokenColor: 'primary',         tokenRadius: 'radius-button',  tokenShadow: 'shadow-surface' },
  PrimaryCTA:        { tokenColor: 'primary',         tokenRadius: 'radius-button',  tokenShadow: 'shadow-surface' },
  CTAButton:         { tokenColor: 'primary',         tokenRadius: 'radius-button',  tokenShadow: 'shadow-surface' },
  NavbarCTAButton:   { tokenColor: 'primary',         tokenRadius: 'radius-button' },
  CTAHeadline:       { tokenTypography: 'heading1',   tokenColor: 'text' },
  HeroBadge:         { tokenColor: 'badge',           tokenRadius: 'radius-badge' },
  MinimalBadge:      { tokenColor: 'badge',           tokenRadius: 'radius-badge' },
  MotionBadge:       { tokenColor: 'badge',           tokenRadius: 'radius-badge' },
  Eyebrow:           { tokenTypography: 'caption',    tokenColor: 'text-muted' },
  AnnouncementBar:   { tokenColor: 'surface-panel',   tokenRadius: 'radius-md' },
  TrustRow:          { tokenColor: 'text-muted',      tokenTypography: 'body-sm' },
  EnterpriseProof:   { tokenColor: 'surface-card',    tokenShadow: 'shadow-subtle' },
  AnimatedVisual:    { tokenShadow: 'shadow-floating' },
  FeatureCard:       { tokenColor: 'surface-card',    tokenShadow: 'shadow-surface', tokenRadius: 'radius-card' },
  FeatureGrid:       { tokenColor: 'surface',         tokenShadow: 'shadow-subtle' },
  PricingCard:       { tokenColor: 'surface-card',    tokenShadow: 'shadow-surface', tokenRadius: 'radius-card' },
  PricingGrid:       { tokenColor: 'surface' },
  PricingHeader:     { tokenTypography: 'heading1',   tokenColor: 'text' },
  PricingToggle:     { tokenColor: 'surface-panel',   tokenRadius: 'radius-full' },
  PricingFAQ:        { tokenColor: 'surface-card',    tokenRadius: 'radius-card' },
  TestimonialCard:   { tokenColor: 'surface-card',    tokenShadow: 'shadow-surface', tokenRadius: 'radius-card' },
  FAQAccordion:      { tokenColor: 'surface',         tokenRadius: 'radius-md' },
  Logo:              { tokenColor: 'text' },
  NavigationMenu:    { tokenColor: 'text',            tokenTypography: 'body-md' },
  AvatarMenu:        { tokenColor: 'surface-card',    tokenRadius: 'radius-full' },
  CommandPalette:    { tokenColor: 'surface-panel',   tokenShadow: 'shadow-floating', tokenRadius: 'radius-lg' },
  FooterLinks:       { tokenColor: 'text-muted',      tokenTypography: 'body-sm' },
  DashboardTabs:     { tokenColor: 'surface-panel',   tokenRadius: 'radius-md' },
  DashboardFilters:  { tokenColor: 'surface',         tokenRadius: 'radius-input' },
  DataTable:         { tokenColor: 'surface-card',    tokenShadow: 'shadow-subtle' },
  CRUDTable:         { tokenColor: 'surface-card',    tokenShadow: 'shadow-subtle' },
  MetricCard:        { tokenColor: 'surface-card',    tokenShadow: 'shadow-surface', tokenRadius: 'radius-card' },
  SettingsTabs:      { tokenColor: 'surface-panel',   tokenRadius: 'radius-md' },
  AvatarUploader:    { tokenColor: 'surface-card',    tokenRadius: 'radius-full' },
  SocialProof:       { tokenColor: 'text-muted',      tokenTypography: 'body-sm' },
};

function buildComponentNode(
  componentId: string,
  sectionId: string,
  sectionType: SectionType,
  catalog: CatalogEntry | undefined,
  order: number,
): ComponentNode {
  const tokenMeta = COMPONENT_TOKEN_MAP[componentId] ?? {};
  return {
    id: `${sectionId}-${componentId}`,
    name: componentId,
    type: 'component',
    parentId: sectionId,
    sectionType,
    required: catalog ? catalog.priority >= 8 : false,
    priority: catalog?.priority ?? 5,
    metadata: {
      shadcnComponents: catalog?.recommendedShadcn ?? [],
      requiresTrustSignal: catalog?.requiresTrustSignal ?? false,
      requiresCTA: catalog?.requiresCTA ?? false,
      dnaSpecific: undefined,
      ...tokenMeta,
    },
  };
}

function buildSectionNode(
  sectionName: string,
  order: number,
  primaryDNA: DNABrand,
  authState: AuthState,
  industry: Industry,
  dnaWeights: Record<string, number>,
): SectionNode {
  const sectionType = normalizeSectionToType(sectionName);
  const sectionId = `section-${order}-${sectionType}`;

  const componentIds = selectComponentsForSection(sectionType, primaryDNA, authState, industry);

  const children: ComponentNode[] = componentIds.map((cId, idx) => {
    const entry = COMPONENT_CATALOG.find(c => c.id === cId);
    return buildComponentNode(cId, sectionId, sectionType, entry, idx);
  });

  const topDNAs = Object.entries(dnaWeights)
    .filter(([, w]) => w > 0.1)
    .sort(([, a], [, b]) => b - a)
    .map(([d]) => d as DNABrand);

  return {
    id: sectionId,
    name: sectionName,
    type: 'section',
    parentId: 'root',
    sectionType,
    order,
    children,
    dna: topDNAs.length > 0 ? topDNAs : [primaryDNA],
    industry: [industry],
    authState: [authState],
    required: order === 0,
    priority: order === 0 ? 10 : Math.max(3, 8 - order),
    metadata: { originalName: sectionName },
  };
}

// ── Tree statistics ────────────────────────────────────────────────────────────

function computeStatistics(sections: SectionNode[]): TreeStatistics {
  const allComponents = sections.flatMap(s => s.children);
  const shadcnSet = new Set<string>();
  let required = 0;
  let optional = 0;

  for (const c of allComponents) {
    c.metadata.shadcnComponents.forEach(s => shadcnSet.add(s));
    if (c.required) required++; else optional++;
  }

  return {
    sectionCount: sections.length,
    totalNodes: sections.length + allComponents.length,
    maxDepth: 2,
    componentNames: [...new Set(allComponents.map(c => c.name))],
    requiredCount: required,
    optionalCount: optional,
    shadcnComponentsUsed: [...shadcnSet],
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface BuildTreeInput {
  plan: PlannerOutput;
  architecture: ArchitectureOutput;
  buildId?: string;
}

export function buildComponentTree(input: BuildTreeInput): PageTree {
  const { plan, architecture, buildId = 'unknown' } = input;
  const { blueprint, dnaComposition, authState: rawAuthState } = plan;
  const { projectBlueprint } = architecture;

  const authState = normalizeAuthState(rawAuthState ?? 'guest');
  const dnaWeights = (dnaComposition as unknown as Record<string, number>) ?? {};
  const primaryDNA = detectPrimaryDNA(dnaWeights);
  const industry = detectIndustry(
    blueprint.websiteType ?? '',
    projectBlueprint.projectType ?? ''
  );

  const sections: SectionNode[] = blueprint.sectionOrder.map((name, idx) =>
    buildSectionNode(name, idx, primaryDNA, authState, industry, dnaWeights)
  );

  const stats = computeStatistics(sections);

  const metadata: TreeMetadata = {
    buildId,
    generatedAt: Date.now(),
    industry,
    authState,
    dnaWeights,
    websiteType: blueprint.websiteType ?? 'landing',
    primaryDNA,
  };

  return {
    id: `tree-${buildId}`,
    name: `${blueprint.websiteType ?? 'Landing'} Page`,
    sections,
    metadata,
    statistics: stats,
  };
}

// ── Tree context summary (for prompt injection) ───────────────────────────────

export function buildTreeContextString(tree: PageTree): string {
  const lines: string[] = [
    '## Component Architecture Tree',
    `Industry: ${tree.metadata.industry} | Auth: ${tree.metadata.authState} | DNA: ${tree.metadata.primaryDNA}`,
    '',
  ];

  for (const section of tree.sections) {
    lines.push(`### ${section.name} (${section.sectionType})`);
    for (const component of section.children) {
      const shadcn = component.metadata.shadcnComponents.length > 0
        ? ` [${component.metadata.shadcnComponents.join(', ')}]`
        : '';
      const required = component.required ? ' *required*' : '';
      lines.push(`  - ${component.name}${shadcn}${required}`);
    }
    lines.push('');
  }

  lines.push(`Total: ${tree.statistics.sectionCount} sections, ${tree.statistics.totalNodes} nodes`);
  lines.push(`Shadcn used: ${tree.statistics.shadcnComponentsUsed.join(', ') || 'none'}`);

  return lines.join('\n');
}
