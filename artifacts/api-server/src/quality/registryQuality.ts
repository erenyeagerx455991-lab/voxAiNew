// V7.3.1 — Premium Registry Quality Scoring Engine
// Phase 8: qualityRegistryScore() — 5-dimension static analysis of template code.
// Does NOT modify existing evaluator dimensions.

export interface RegistryQualityBreakdown {
  hierarchy: number;        // 0–10: badge + heading + subtitle + visual zone
  trust: number;            // 0–10: Avatar/stars/metrics/social proof/security
  ctaQuality: number;       // 0–10: dual CTA + benefit-driven copy
  layoutUniqueness: number; // 0–10: distinct from generic 3-col grid
  premiumPatterns: number;  // 0–10: advanced Shadcn components
  overallScore: number;     // 0–10: weighted composite
}

export interface RegistryQualityRecord {
  templateId: string;
  category: string;
  name: string;
  breakdown: RegistryQualityBreakdown;
  scoredAt: number;
}

// ── 1. Static scoring engine ──────────────────────────────────────────────────

function scoreHierarchy(code: string): number {
  const hasBadge         = /<Badge\b|HEADLINE_BADGE|eyebrow/.test(code);
  const hasStrongHeading = /text-[5-9]xl|font-black|font-bold.*tracking-tight|tracking-tighter/.test(code);
  const hasSubtitle      = /SUBHEADLINE|SUBHEADING|text-lg.*leading|text-xl.*leading|text-base.*leading-relaxed/.test(code);
  const hasVisualZone    = /dashboard|terminal|bento|masonry|bg-\[#1|min-h-\[|aspect-|row-span|grid-cols-12/.test(code);
  return Math.min(10,
    (hasBadge ? 2.5 : 0) +
    (hasStrongHeading ? 2.5 : 0) +
    (hasSubtitle ? 2.5 : 0) +
    (hasVisualZone ? 2.5 : 0)
  );
}

function scoreTrust(code: string): number {
  const hasAvatar       = /<Avatar\b/.test(code);
  const hasStars        = /★|text-amber.*★|stars|rating/.test(code);
  const hasMetrics      = /\d+[K+%].*label|value.*\d+[KM+]|50K\+|10K\+|99\.9/.test(code);
  const hasSocialProof  = /Trusted by|teams|users|companies|customers|reviews/i.test(code);
  const hasSecurityBadge = /SOC 2|GDPR|Uptime SLA|SSO|SAML|ISO/i.test(code);
  const hasQuote        = /TESTIMONIAL|quote|"[^"]{20,}"/i.test(code);
  return Math.min(10,
    (hasAvatar ? 3 : 0) +
    (hasStars ? 2 : 0) +
    (hasMetrics ? 2 : 0) +
    (hasSocialProof ? 1.5 : 0) +
    (hasSecurityBadge ? 1.5 : 0) +
    (hasQuote ? 1 : 0)
  );
}

function scoreCtaQuality(code: string): number {
  const buttonCount    = (code.match(/<Button\b/g) ?? []).length;
  const hasDualCta     = buttonCount >= 2;
  const hasPrimaryAction = /Start Free|Free Trial|Book Demo|Create Workspace|Launch Project|Get Started Free|Start Trial|Reserve|Sign Up Free|CTA_PRIMARY/i.test(code);
  const hasSecondaryAction = /See Demo|View Work|View Pricing|CTA_SECONDARY|Watch Demo|Learn More|Contact Sales/i.test(code);
  return Math.min(10,
    (hasDualCta ? 4 : buttonCount > 0 ? 2 : 0) +
    (hasPrimaryAction ? 3 : 0) +
    (hasSecondaryAction ? 3 : 0)
  );
}

function scoreLayoutUniqueness(code: string): number {
  const isAsymmetric  = /grid-cols-12|col-span-[5-9]|col-span-1[0-2]/.test(code);
  const isEditorial   = /clamp\(|tracking-\[-|0\.9[0-9]em|0\.8[0-9]em|font-black.*text-[7-9]xl/.test(code);
  const isMosaic      = /masonry|mosaic|row-span-[23]|auto-rows/.test(code);
  const isTimeline    = /left-1\/2.*translate-x-px|center.*line|timeline/.test(code);
  const isBento       = /bento|grid-cols-12.*gap|auto-rows-\[/.test(code);
  const isSplit       = /md:order-[12]|flex-row-reverse|md:col-span-[5-7].*md:col-span-[3-5]/.test(code);
  const isDouble      = /two-tier|double-row|utility.*bar/.test(code);
  return Math.min(10,
    (isAsymmetric ? 2.5 : 0) +
    (isEditorial ? 2 : 0) +
    (isMosaic ? 2 : 0) +
    (isTimeline ? 2 : 0) +
    (isBento ? 1.5 : 0) +
    (isSplit ? 1 : 0) +
    (isDouble ? 1 : 0)
  );
}

function scorePremiumPatterns(code: string): number {
  const components = [
    '<Tabs', '<DataTable', '<Command', '<Accordion', '<Skeleton',
    '<Progress', '<NavigationMenu', '<Avatar', '<Badge', '<Dialog',
    '<HoverCard', '<Drawer', '<Switch', '<Select', '<Calendar',
  ];
  const count = components.filter(c => code.includes(c)).length;
  return Math.min(10, count * 1.4);
}

// Category-specific dimension weights — must sum to 1.00
const CATEGORY_WEIGHTS: Record<string, {
  hierarchy: number; trust: number; ctaQuality: number;
  layoutUniqueness: number; premiumPatterns: number;
}> = {
  hero:             { hierarchy: 0.35, trust: 0.25, ctaQuality: 0.20, layoutUniqueness: 0.10, premiumPatterns: 0.10 },
  cta:              { hierarchy: 0.20, trust: 0.30, ctaQuality: 0.35, layoutUniqueness: 0.05, premiumPatterns: 0.10 },
  'dashboard-preview': { hierarchy: 0.15, trust: 0.10, ctaQuality: 0.05, layoutUniqueness: 0.20, premiumPatterns: 0.50 },
  pricing:          { hierarchy: 0.20, trust: 0.25, ctaQuality: 0.25, layoutUniqueness: 0.15, premiumPatterns: 0.15 },
  testimonials:     { hierarchy: 0.20, trust: 0.40, ctaQuality: 0.05, layoutUniqueness: 0.20, premiumPatterns: 0.15 },
  features:         { hierarchy: 0.25, trust: 0.15, ctaQuality: 0.20, layoutUniqueness: 0.25, premiumPatterns: 0.15 },
  bento:            { hierarchy: 0.20, trust: 0.10, ctaQuality: 0.15, layoutUniqueness: 0.35, premiumPatterns: 0.20 },
  navbar:           { hierarchy: 0.15, trust: 0.10, ctaQuality: 0.20, layoutUniqueness: 0.25, premiumPatterns: 0.30 },
  faq:              { hierarchy: 0.20, trust: 0.10, ctaQuality: 0.15, layoutUniqueness: 0.25, premiumPatterns: 0.30 },
  default:          { hierarchy: 0.20, trust: 0.20, ctaQuality: 0.20, layoutUniqueness: 0.20, premiumPatterns: 0.20 },
};

export function qualityRegistryScore(code: string, category: string): RegistryQualityBreakdown {
  const w = CATEGORY_WEIGHTS[category] ?? CATEGORY_WEIGHTS['default'];

  const hierarchy        = scoreHierarchy(code);
  const trust            = scoreTrust(code);
  const ctaQuality       = scoreCtaQuality(code);
  const layoutUniqueness = scoreLayoutUniqueness(code);
  const premiumPatterns  = scorePremiumPatterns(code);

  const overallScore = Math.round(Math.min(10, Math.max(0,
    hierarchy * w.hierarchy +
    trust * w.trust +
    ctaQuality * w.ctaQuality +
    layoutUniqueness * w.layoutUniqueness +
    premiumPatterns * w.premiumPatterns
  )) * 10) / 10;

  return {
    hierarchy:        Math.round(hierarchy * 10) / 10,
    trust:            Math.round(trust * 10) / 10,
    ctaQuality:       Math.round(ctaQuality * 10) / 10,
    layoutUniqueness: Math.round(layoutUniqueness * 10) / 10,
    premiumPatterns:  Math.round(premiumPatterns * 10) / 10,
    overallScore,
  };
}

// ── 2. In-memory record store ─────────────────────────────────────────────────

const qualityStore = new Map<string, RegistryQualityRecord>();

export function recordRegistryQuality(
  templateId: string,
  category: string,
  name: string,
  code: string,
): RegistryQualityRecord {
  const breakdown = qualityRegistryScore(code, category);
  const rec: RegistryQualityRecord = { templateId, category, name, breakdown, scoredAt: Date.now() };
  qualityStore.set(templateId, rec);
  return rec;
}

export function getRegistryQualityRecord(templateId: string): RegistryQualityRecord | undefined {
  return qualityStore.get(templateId);
}

export function getAllRegistryQualityRecords(): RegistryQualityRecord[] {
  return [...qualityStore.values()];
}

export function getAverageRegistryQuality(): number {
  const all = [...qualityStore.values()];
  if (all.length === 0) return 0;
  const sum = all.reduce((s, r) => s + r.breakdown.overallScore, 0);
  return Math.round((sum / all.length) * 10) / 10;
}

export function resetRegistryQualityStore(): void {
  qualityStore.clear();
}
