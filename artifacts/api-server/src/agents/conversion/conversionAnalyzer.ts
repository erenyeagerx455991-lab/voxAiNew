// ── V7.3.1 Conversion Intelligence Engine ────────────────────────────────────
// Acts like a CRO specialist: analyzes trust signals, CTA hierarchy,
// pricing psychology, offer clarity, and funnel sequencing.

import type { DesignDNA } from "../types.js";
import type { EvaluationResult } from "../designEvaluator/evaluator.js";
import type { CritiqueReport } from "../designCritic/designCritic.js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversionIssueSeverity = 'critical' | 'major' | 'minor' | 'info';

export type ConversionIssueCategory =
  | 'trust' | 'cta' | 'pricing' | 'offerClarity' | 'funnel' | 'friction';

export interface ConversionIssue {
  category:   ConversionIssueCategory;
  severity:   ConversionIssueSeverity;
  message:    string;
  suggestion: string;
  fixKey:     string;
}

export interface FunnelAnalysis {
  sections:       string[];
  idealFlow:      string[];
  missingStages:  string[];
  outOfOrder:     string[];
  score:          number;
}

export interface ConversionReport {
  conversionScore:   number;
  trustScore:        number;
  ctaScore:          number;
  pricingScore:      number;
  offerClarityScore: number;
  funnelScore:       number;
  issues:            ConversionIssue[];
  funnelAnalysis:    FunnelAnalysis;
  repairRequired:    boolean;
}

export interface ConversionInput {
  code:             string;
  sectionOrder:     string[];
  evaluationResult: EvaluationResult;
  critiqueReport:   CritiqueReport | null;
  designDNA:        DesignDNA;
}

export const CONVERSION_REPAIR_THRESHOLD = 8.5;

// ── Weights (sum = 1.00) ──────────────────────────────────────────────────────
const WEIGHTS = { trust: 0.30, cta: 0.25, offerClarity: 0.20, pricing: 0.15, funnel: 0.10 };

// ── Phase 2: Trust Signal Intelligence ───────────────────────────────────────

function scoreTrust(code: string): { score: number; issues: ConversionIssue[] } {
  const issues: ConversionIssue[] = [];
  let score = 0;

  // Detect trust signals
  const hasLogos       = /logo-cloud|partner|trusted-by|powered-by|as-seen-on/i.test(code) || /trusted by|powered by/i.test(code);
  const hasTestimonials = /testimonial|quote.*author|blockquote|review.*card/i.test(code);
  const hasMetrics     = /\d[\d,]+\s*(users|customers|companies|teams|clients|projects)/i.test(code);
  const hasAwards      = /award|winner|featured in|techcrunch|producthunt/i.test(code);
  const hasRatings     = /\d+\.\d+\s*\/\s*5|\d+\s*stars?|★|⭐/i.test(code);
  const hasReviewCount = /[\d,]+\s+reviews?/i.test(code);
  const hasUserCount   = /[\d,]+\+?\s*(users|customers|businesses)/i.test(code);

  if (hasLogos)        score += 1.5;
  if (hasTestimonials) score += 2.0;
  if (hasMetrics)      score += 1.5;
  if (hasAwards)       score += 0.5;
  if (hasRatings)      score += 1.5;
  if (hasReviewCount)  score += 0.5;
  if (hasUserCount)    score += 0.5;
  score = Math.min(8, score); // rule-based cap at 8

  // Hero trust check
  const heroBlock = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];
  const heroHasCTA    = /Button|Get Started|Sign Up|Try|Start/i.test(heroBlock);
  const heroHasTrust  = /trusted|users|customers|rating|stars|Avatar|testimonial|\d[\d,]+/i.test(heroBlock);

  if (heroHasCTA && !heroHasTrust) {
    score = Math.max(0, score - 2);
    issues.push({
      category: 'trust', severity: 'critical',
      message: 'Hero section has a primary CTA but no adjacent trust signal. Users lack validation before clicking.',
      suggestion: 'Add directly below the CTA: "Trusted by 12,000+ teams" with a star rating or logo strip. Proven to increase conversion 15-30%.',
      fixKey: 'trust_signal_hero',
    });
  }

  // Pricing trust check
  const hasPricingSection = /function\s+Pricing/i.test(code);
  if (hasPricingSection) {
    const pricingBlock = (code.match(/function\s+Pricing[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];
    const pricingHasTrust = /testimonial|review|trusted|guaranteed|money.back|no.risk/i.test(pricingBlock);
    if (!pricingHasTrust) {
      score = Math.max(0, score - 1);
      issues.push({
        category: 'trust', severity: 'major',
        message: 'Pricing section lacks a trust signal (testimonial, guarantee, or review) near the purchase CTA.',
        suggestion: 'Add a 1-2 line customer quote or "30-day money-back guarantee" badge directly below the pricing cards.',
        fixKey: 'trust_signal_pricing',
      });
    }
  }

  if (!hasTestimonials && !hasMetrics && !hasLogos) {
    issues.push({
      category: 'trust', severity: 'major',
      message: 'No social proof elements detected (testimonials, metrics, or logo strip).',
      suggestion: 'Add at least one: a logo strip with 6 recognizable brands, or a metrics bar ("10M+ tasks completed"). Logos alone lift conversion 20%.',
      fixKey: 'social_proof_placement',
    });
  }

  return { score: Math.round(Math.max(0, Math.min(10, score + 2)) * 10) / 10, issues };
}

// ── Phase 3: CTA Intelligence ─────────────────────────────────────────────────

function scoreCTA(code: string): { score: number; issues: ConversionIssue[] } {
  const issues: ConversionIssue[] = [];
  let score = 7;

  const heroBlock   = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];
  const allButtons  = code.match(/Button|<button/gi) ?? [];
  const ctaKeywords = code.match(/Get Started|Sign Up|Try Now|Start Free|Book Demo|Learn More|Get Access|Subscribe|Join Now|Buy Now|Purchase|Upgrade/gi) ?? [];

  // One dominant CTA rule
  const primaryBtns = (heroBlock.match(/variant="default"|variant="primary"|btn-primary/gi) ?? []).length;
  const outlineBtns = (heroBlock.match(/variant="outline"|variant="ghost"/gi) ?? []).length;

  if (primaryBtns === 0) {
    score -= 2;
    issues.push({
      category: 'cta', severity: 'critical',
      message: 'No dominant primary CTA detected in hero section.',
      suggestion: 'Hero must have exactly one <Button variant="default"> as the primary action. It should be visually 2-3× more prominent than any secondary link.',
      fixKey: 'cta_hierarchy',
    });
  }

  if (primaryBtns > 1) {
    score -= 1.5;
    issues.push({
      category: 'cta', severity: 'major',
      message: `Hero has ${primaryBtns} primary-style buttons competing for attention. Decision paralysis reduces conversion.`,
      suggestion: 'Keep exactly 1 primary CTA button (variant="default"). Demote all others to variant="outline" or plain text links.',
      fixKey: 'cta_hierarchy',
    });
  }

  // CTA overload
  if (ctaKeywords.length > 6) {
    score -= 1;
    issues.push({
      category: 'cta', severity: 'major',
      message: `${ctaKeywords.length} CTA labels detected across the page. CTA overload dilutes intent signals.`,
      suggestion: 'Use one CTA label consistently (e.g., "Start free trial"). Vary only between primary action and secondary escape (e.g., "Book a demo").',
      fixKey: 'cta_overload',
    });
  }

  // Strong CTA copy check
  const hasWeakCTA = /learn more|click here|submit|go/i.test(code) && !/free trial|start building|get (started|access|\w+ free)/i.test(code);
  if (hasWeakCTA) {
    score -= 0.5;
    issues.push({
      category: 'cta', severity: 'minor',
      message: 'CTA copy uses weak, non-specific language ("Learn More", "Submit") that fails to communicate value.',
      suggestion: 'Replace generic CTA labels with outcome-oriented copy: "Start building for free", "Get your first report", "See a live demo".',
      fixKey: 'cta_hierarchy',
    });
  }

  // Good: has primary + secondary structure
  if (primaryBtns === 1 && outlineBtns >= 1) score += 1;

  return { score: Math.round(Math.max(0, Math.min(10, score)) * 10) / 10, issues };
}

// ── Phase 4: Pricing Psychology ───────────────────────────────────────────────

function scorePricing(code: string): { score: number; issues: ConversionIssue[]; hasPricing: boolean } {
  if (!/function\s+Pricing/i.test(code)) return { score: 8, issues: [], hasPricing: false };

  const issues: ConversionIssue[] = [];
  let score = 5;

  const pricingBlock = (code.match(/function\s+Pricing[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];

  const hasMostPopular   = /most popular|recommended|best value|ring-2|border-2|ring-accent/i.test(pricingBlock);
  const hasSavings       = /save|% off|savings|annual|yearly|per year/i.test(pricingBlock);
  const hasAnnualToggle  = /monthly|annually|toggle|Switch|billing.*period/i.test(pricingBlock);
  const hasFeatureComp   = /check|included|✓|feature.*row|compare/i.test(pricingBlock);
  const hasRiskReversal  = /money.back|guarantee|cancel.*anytime|no.*commitment|free.*trial|30.day/i.test(pricingBlock);
  const hasFreeEntry     = /free|starter|basic.*\$0|\$0/i.test(pricingBlock);

  if (hasMostPopular)  score += 1.5;
  if (hasSavings)      score += 1.0;
  if (hasAnnualToggle) score += 0.5;
  if (hasFeatureComp)  score += 1.0;
  if (hasRiskReversal) score += 1.5;
  if (hasFreeEntry)    score += 0.5;

  if (!hasMostPopular) {
    issues.push({
      category: 'pricing', severity: 'major',
      message: 'No plan is visually distinguished as "Most Popular" or recommended. All tiers appear equal, removing the anchoring effect.',
      suggestion: 'Add ring-2 ring-blue-500 border + a "Most Popular" Badge to the middle tier. This single change is proven to increase paid plan selection by 20-40%.',
      fixKey: 'pricing_highlight',
    });
  }

  if (!hasRiskReversal) {
    issues.push({
      category: 'pricing', severity: 'major',
      message: 'Pricing section lacks a risk-reversal statement ("money-back guarantee", "cancel anytime", "no credit card").',
      suggestion: 'Add directly below pricing cards: "30-day money-back guarantee · No credit card required · Cancel anytime". Reduces purchase anxiety significantly.',
      fixKey: 'pricing_risk_reversal',
    });
  }

  if (!hasAnnualToggle && hasSavings) {
    issues.push({
      category: 'pricing', severity: 'minor',
      message: 'Pricing mentions savings but has no monthly/annual toggle to show the discount explicitly.',
      suggestion: 'Add a billing toggle (Monthly / Annually — Save 20%) above the pricing cards. Users need to see the math to feel the saving.',
      fixKey: 'pricing_annual_toggle',
    });
  }

  // Pricing confusion: too many tiers (>4)
  const tierCount = (pricingBlock.match(/<Card|CardContent/g) ?? []).length / 2;
  if (tierCount > 4) {
    score -= 1;
    issues.push({
      category: 'pricing', severity: 'major',
      message: `${Math.round(tierCount)} pricing tiers detected. More than 4 tiers creates pricing confusion and analysis paralysis.`,
      suggestion: 'Consolidate to 3 tiers: Free/Starter, Pro (most popular), Enterprise. This is the most widely-tested pricing structure.',
      fixKey: 'pricing_highlight',
    });
  }

  return { score: Math.round(Math.max(0, Math.min(10, score)) * 10) / 10, issues, hasPricing: true };
}

// ── Phase 5: Offer Clarity ────────────────────────────────────────────────────

function scoreOfferClarity(code: string): { score: number; issues: ConversionIssue[] } {
  const issues: ConversionIssue[] = [];
  let score = 7;

  const heroBlock = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];

  // Quantified outcome detection
  const hasQuantifiedOutcome = /\d+%|\d+x\s*(faster|better|more)|reduce.*\d+|increase.*\d+|save.*\d+|cut.*\d+/i.test(heroBlock);
  const hasSpecificOutcome   = /reduce|increase|save|automate|eliminate|replace|cut|boost|accelerate/i.test(heroBlock);
  const hasGenericVague      = /transform your|unlock your|empower|supercharge|revolutionize|the future of|next.gen|best.in.class|world.class/i.test(heroBlock);

  if (hasQuantifiedOutcome) score += 2;
  else if (hasSpecificOutcome) score += 1;

  if (hasGenericVague) {
    score -= 1.5;
    issues.push({
      category: 'offerClarity', severity: 'major',
      message: 'Hero value proposition uses vague transformation language ("empower", "revolutionize", "transform") with no specific outcome.',
      suggestion: 'Replace with a quantified, role-specific outcome: "Cut code review time by 60% with AI-powered suggestions" beats "Revolutionize your dev workflow" every time.',
      fixKey: 'offer_clarity_hero',
    });
  }

  if (!hasSpecificOutcome && !hasQuantifiedOutcome) {
    score -= 2;
    issues.push({
      category: 'offerClarity', severity: 'critical',
      message: 'Hero headline makes no specific promise — it is a category description, not a value proposition.',
      suggestion: 'A good headline answers: WHO is this for, WHAT do they get, HOW FAST. Example: "Onboard customers 3× faster — no code required."',
      fixKey: 'value_prop_specificity',
    });
  }

  // Feature section clarity
  const featureBlock = (code.match(/function\s+Feature[\s\S]*?(?=\nfunction\s+[A-Z]|\nexport\s|$)/) ?? [''])[0];
  if (featureBlock) {
    const genericFeatures = (featureBlock.match(/fast|powerful|easy|simple|smart|modern|intuitive/gi) ?? []).length;
    if (genericFeatures > 5) {
      score -= 0.5;
      issues.push({
        category: 'offerClarity', severity: 'minor',
        message: `Feature descriptions use ${genericFeatures} generic adjectives ("fast", "powerful", "intuitive") instead of specific benefits.`,
        suggestion: 'Replace adjectives with outcomes: "Syncs in 2 seconds" > "Fast sync". "Zero onboarding — live in 5 minutes" > "Easy setup".',
        fixKey: 'offer_clarity_feature',
      });
    }
  }

  return { score: Math.round(Math.max(0, Math.min(10, score)) * 10) / 10, issues };
}

// ── Phase 6: Funnel Sequencing ────────────────────────────────────────────────

const IDEAL_FUNNEL = ['hero', 'trust', 'features', 'proof', 'pricing', 'cta'];
const FUNNEL_ALIASES: Record<string, string> = {
  'Hero': 'hero', 'HeroSection': 'hero',
  'LogoBand': 'trust', 'LogoCloud': 'trust', 'Testimonials': 'proof', 'SocialProof': 'proof',
  'Stats': 'trust', 'TrustBand': 'trust', 'Partners': 'trust',
  'Features': 'features', 'Feature': 'features', 'Benefits': 'features', 'HowItWorks': 'features',
  'Proof': 'proof', 'CaseStudies': 'proof', 'Reviews': 'proof',
  'Pricing': 'pricing', 'Plans': 'pricing',
  'CTA': 'cta', 'CallToAction': 'cta', 'FinalCTA': 'cta',
  'FAQ': 'features', 'Comparison': 'features',
  'Navbar': 'hero', 'Footer': 'cta',
};

function analyzeFunnel(sectionOrder: string[]): FunnelAnalysis {
  const mapped = sectionOrder.map(s => FUNNEL_ALIASES[s] ?? 'other').filter(s => s !== 'other');
  const uniqueMapped = [...new Set(mapped)];

  const missingStages = IDEAL_FUNNEL.filter(stage =>
    stage !== 'trust' && stage !== 'proof' && !uniqueMapped.includes(stage)
  );

  // Check ordering: hero should be first, pricing/cta should be near end
  const outOfOrder: string[] = [];
  const heroIdx    = uniqueMapped.indexOf('hero');
  const pricingIdx = uniqueMapped.indexOf('pricing');
  const ctaIdx     = uniqueMapped.indexOf('cta');
  const trustIdx   = uniqueMapped.indexOf('trust');
  const featuresIdx = uniqueMapped.indexOf('features');

  if (heroIdx > 0) outOfOrder.push('hero-not-first');
  if (pricingIdx !== -1 && featuresIdx !== -1 && pricingIdx < featuresIdx) outOfOrder.push('pricing-before-features');
  if (ctaIdx !== -1 && pricingIdx !== -1 && ctaIdx < pricingIdx) outOfOrder.push('cta-before-pricing');
  if (trustIdx !== -1 && heroIdx !== -1 && trustIdx < heroIdx) outOfOrder.push('trust-before-hero');

  // Score: start at 10, deduct for issues
  let score = 10;
  score -= missingStages.filter(s => s === 'hero' || s === 'cta').length * 2;
  score -= outOfOrder.length * 1.5;
  if (!uniqueMapped.includes('pricing')) score -= 0;  // optional
  if (!uniqueMapped.includes('trust') && !uniqueMapped.includes('proof')) score -= 1;

  return {
    sections:      sectionOrder,
    idealFlow:     IDEAL_FUNNEL,
    missingStages,
    outOfOrder,
    score:         Math.round(Math.max(0, Math.min(10, score)) * 10) / 10,
  };
}

function scoreFunnel(sectionOrder: string[], code: string): { score: number; issues: ConversionIssue[]; analysis: FunnelAnalysis } {
  const analysis = analyzeFunnel(sectionOrder);
  const issues: ConversionIssue[] = [];

  if (analysis.missingStages.includes('hero')) {
    issues.push({ category: 'funnel', severity: 'critical', message: 'No Hero section detected. Users have no orientation point.', suggestion: 'Add a Hero section as the first visible content.', fixKey: 'funnel_sequencing' });
  }
  if (analysis.missingStages.includes('cta')) {
    issues.push({ category: 'funnel', severity: 'major', message: 'No dedicated CTA/conversion section at end of funnel.', suggestion: 'Add a CTA or FinalCTA section as the last content section before the footer.', fixKey: 'funnel_sequencing' });
  }
  if (analysis.outOfOrder.includes('pricing-before-features')) {
    issues.push({ category: 'funnel', severity: 'major', message: 'Pricing section appears before Features. Users commit before understanding value.', suggestion: 'Move Pricing to after Features/Benefits. Establish value before revealing price.', fixKey: 'funnel_sequencing' });
  }
  if (!analyzeFunnel(sectionOrder).sections.some(s => /testimonial|proof|review|stats|trust/i.test(s))) {
    issues.push({ category: 'funnel', severity: 'minor', message: 'Funnel is missing a social proof or trust stage between features and pricing.', suggestion: 'Insert a Testimonials or Stats section between Features and Pricing to validate before the commitment ask.', fixKey: 'social_proof_placement' });
  }

  return { score: analysis.score, issues, analysis };
}

// ── Phase 7: Conversion Score ─────────────────────────────────────────────────

export function analyzeConversion(input: ConversionInput): ConversionReport {
  const { code, sectionOrder, evaluationResult } = input;

  const trust       = scoreTrust(code);
  const cta         = scoreCTA(code);
  const pricing     = scorePricing(code);
  const offerClarity = scoreOfferClarity(code);
  const funnel      = scoreFunnel(sectionOrder, code);

  // Pull any critic conversion insights to boost trust/cta scores
  const criticBoost = input.critiqueReport
    ? (input.critiqueReport.categoryScores.trustBuilding > 8 ? 0.3 : 0) +
      (input.critiqueReport.categoryScores.ctaHierarchy > 8 ? 0.3 : 0)
    : 0;

  const trustScore        = Math.min(10, trust.score + criticBoost * 0.5);
  const ctaScore          = Math.min(10, cta.score + criticBoost * 0.5);
  const pricingScore      = pricing.score;
  const offerClarityScore = offerClarity.score;
  const funnelScore       = funnel.score;

  const conversionScore = Math.round(
    (trustScore * WEIGHTS.trust +
     ctaScore   * WEIGHTS.cta +
     offerClarityScore * WEIGHTS.offerClarity +
     pricingScore      * WEIGHTS.pricing +
     funnelScore       * WEIGHTS.funnel) * 10
  ) / 10;

  const allIssues = [
    ...trust.issues,
    ...cta.issues,
    ...pricing.issues,
    ...offerClarity.issues,
    ...funnel.issues,
  ].sort((a, b) => {
    const sev: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  }).slice(0, 10);

  return {
    conversionScore,
    trustScore:        Math.round(trustScore * 10) / 10,
    ctaScore:          Math.round(ctaScore * 10) / 10,
    pricingScore:      Math.round(pricingScore * 10) / 10,
    offerClarityScore: Math.round(offerClarityScore * 10) / 10,
    funnelScore:       Math.round(funnelScore * 10) / 10,
    issues:            allIssues,
    funnelAnalysis:    funnel.analysis,
    repairRequired:    conversionScore < CONVERSION_REPAIR_THRESHOLD,
  };
}
