// ── V7.3.0 Design Critic Agent ────────────────────────────────────────────────
// Acts like a senior product designer + art director reviewing the output
// across 12 quality dimensions before final delivery.

import { callAI } from "../llm/aiService.js";
import type { DesignDNA } from "../types.js";
import type { EvaluationResult } from "../designEvaluator/evaluator.js";
import { createLogger } from "../../lib/structuredLogger.js";

const log = createLogger("DesignCritic");

// ── Types ─────────────────────────────────────────────────────────────────────

export type CritiqueSeverity = 'critical' | 'major' | 'minor' | 'info';

export type CritiqueCategory =
  | 'hero' | 'layout' | 'typography' | 'ctaHierarchy' | 'trustBuilding'
  | 'accessibility' | 'motion' | 'dashboardUX' | 'formsUX' | 'navbarUX'
  | 'conversion' | 'visualHierarchy';

export interface CritiqueIssue {
  category:   CritiqueCategory;
  severity:   CritiqueSeverity;
  message:    string;
  suggestion: string;
}

export interface CritiqueReport {
  criticScore:        number;
  categoryScores:     Record<CritiqueCategory, number>;
  issues:             CritiqueIssue[];
  topRecommendation:  string;
  repairRequired:     boolean;
  rawCritique:        string;
}

export interface CriticInput {
  code:               string;
  evaluationResult:   EvaluationResult;
  designDNA:          DesignDNA;
  retrievalReferences: string[];
  openrouterKey:      string;
}

// ── Category weights (sum = 1.00) ─────────────────────────────────────────────
const CRITIC_WEIGHTS: Record<CritiqueCategory, number> = {
  hero:           0.12,
  layout:         0.12,
  typography:     0.08,
  ctaHierarchy:   0.12,
  trustBuilding:  0.10,
  accessibility:  0.08,
  motion:         0.05,
  dashboardUX:    0.05,
  formsUX:        0.05,
  navbarUX:       0.05,
  conversion:     0.12,
  visualHierarchy: 0.06,
};

export const CRITIC_REPAIR_THRESHOLD = 8.5;

// ── Rule-based pre-scoring (fast, no LLM) ─────────────────────────────────────

function ruleBasedScores(code: string, dna: DesignDNA, evalResult: EvaluationResult): Partial<Record<CritiqueCategory, number>> {
  const scores: Partial<Record<CritiqueCategory, number>> = {};

  // Hero: use evaluator heroScore, boost for trust signals near CTA
  const heroScore = evalResult.heroScore;
  const heroBlock = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s|\nexport\s|$)/) ?? [''])[0];
  const hasTrustNearHero = /Avatar|testimonial|trusted by|rating|stars/i.test(heroBlock);
  scores.hero = Math.min(10, heroScore + (hasTrustNearHero ? 0.5 : 0));

  // Layout: from evaluator
  scores.layout = evalResult.layoutScore;

  // Typography: heading hierarchy, size variety, font weight contrast
  const hasH1 = /<h1|className=".*text-[456789]xl/.test(code);
  const hasH2 = /<h2|className=".*text-[234]xl/.test(code);
  const hasBodyText = /text-sm|text-base|text-lg/.test(code);
  const hasFontWeight = /font-bold|font-semibold|font-medium/.test(code);
  const typScore = (hasH1 ? 3 : 0) + (hasH2 ? 2 : 0) + (hasBodyText ? 2 : 0) + (hasFontWeight ? 2 : 0);
  scores.typography = Math.min(10, typScore + 1);

  // CTA Hierarchy: from evaluator ctaScore, check for primary/secondary distinction
  const hasPrimaryBtn  = /Button.*variant="default"|btn-primary|primary.*CTA/i.test(code);
  const hasSecondaryBtn = /variant="outline"|variant="ghost"|secondary.*btn/i.test(code);
  scores.ctaHierarchy  = Math.min(10, evalResult.ctaScore + (hasPrimaryBtn && hasSecondaryBtn ? 1 : 0));

  // Trust building
  const trustSignals = [
    /\btrusted by\b|\b\d+[,\d]* (users|customers|companies)\b/i,
    /Avatar|testimonial|review|rating/i,
    /SOC\s*2|ISO\s*\d|HIPAA|GDPR/i,
    /star|★|⭐/,
    /badge.*secure|secure.*badge/i,
  ].filter(r => r.test(code)).length;
  scores.trustBuilding = Math.min(10, trustSignals * 2 + 2);

  // Accessibility: from evaluator
  scores.accessibility = evalResult.accessibilityScore;

  // Motion: from evaluator
  scores.motion = evalResult.motionScore;

  // Dashboard UX: from evaluator
  scores.dashboardUX = evalResult.dashboardScore;

  // Forms UX: from evaluator
  scores.formsUX = evalResult.formScore;

  // Navbar UX: from evaluator
  scores.navbarUX = evalResult.navigationScore;

  // Visual Hierarchy: spacing rhythm, section separation, whitespace
  const hasSectionSpacing = /py-\d{2}|py-24|py-16|py-20/.test(code);
  const hasSeparators     = /Separator|border-t|border-b/.test(code);
  const hasContainerMax   = /max-w-\d|container/.test(code);
  const vhScore = (hasSectionSpacing ? 3 : 0) + (hasSeparators ? 2 : 0) + (hasContainerMax ? 2 : 0) + 1;
  scores.visualHierarchy  = Math.min(10, vhScore + evalResult.consistencyScore * 0.2);

  return scores;
}

// ── Design taste rules (fast, no LLM) ─────────────────────────────────────────

function detectTasteIssues(code: string, dna: DesignDNA): CritiqueIssue[] {
  const issues: CritiqueIssue[] = [];

  // Generic layout detection
  if (/placeholder|lorem ipsum|your company|acme corp/i.test(code)) {
    issues.push({ category: 'hero', severity: 'critical', message: 'Generic placeholder copy detected in hero section.', suggestion: 'Replace all placeholders with specific, industry-relevant copy and real product names.' });
  }

  // Too many gradients
  const gradientCount = (code.match(/gradient-to-|from-\[|via-\[|bg-gradient/g) ?? []).length;
  if (gradientCount > 8) {
    issues.push({ category: 'visualHierarchy', severity: 'major', message: `Gradient overuse detected (${gradientCount} gradient instances) creating visual noise.`, suggestion: 'Limit gradients to 1-2 focal elements. Use flat surfaces for supporting sections.' });
  }

  // CTA overload
  const ctaCount = (code.match(/Get Started|Sign Up|Try Now|Start Free|Book Demo|Learn More|Get Access/gi) ?? []).length;
  if (ctaCount > 5) {
    issues.push({ category: 'ctaHierarchy', severity: 'major', message: `CTA overload detected (${ctaCount} CTAs). Users experience decision fatigue.`, suggestion: 'Reduce to 1 primary CTA per viewport. Secondary links should be text-only, not buttons.' });
  }

  // Weak trust signal placement — CTA without nearby social proof
  const heroBlock = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s|\nexport\s|$)/) ?? [''])[0];
  const ctaInHero  = /Button|CTA|Get Started|Sign Up/i.test(heroBlock);
  const proofInHero = /trusted|customers|users|rating|stars|Avatar|testimonial/i.test(heroBlock);
  if (ctaInHero && !proofInHero) {
    issues.push({ category: 'trustBuilding', severity: 'major', message: 'Hero CTA appears without adjacent trust signals (ratings, social proof, or customer count).', suggestion: 'Add a trust layer directly below the primary CTA: "Trusted by X,000 teams" or a 5-star rating badge.' });
  }

  // Pricing without differentiation
  if (/function\s+Pricing/i.test(code)) {
    const pricingBlock = (code.match(/function\s+Pricing[\s\S]*?(?=\nfunction\s|\nexport\s|$)/) ?? [''])[0];
    const hasMostPopular = /most popular|recommended|best value|highlighted|ring-2|border-2.*accent/i.test(pricingBlock);
    if (!hasMostPopular) {
      issues.push({ category: 'conversion', severity: 'major', message: 'Pricing section lacks a highlighted recommended plan. All tiers appear equal in weight.', suggestion: 'Mark one plan as "Most Popular" with a highlighted border and badge. This anchors the user decision.' });
    }
  }

  // Feature repetition
  const featureTexts = code.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g) ?? [];
  const uniqueFeatures = new Set(featureTexts.map(f => f.toLowerCase()));
  if (featureTexts.length > 0 && uniqueFeatures.size / featureTexts.length < 0.5) {
    issues.push({ category: 'visualHierarchy', severity: 'minor', message: 'Feature section contains repetitive copy patterns. Diverse value propositions are needed.', suggestion: 'Each feature must articulate a distinct benefit. Avoid restating the same value in different words.' });
  }

  // Weak spacing rhythm
  const hasConsistentPadding = /py-24|py-20|py-16/.test(code);
  if (!hasConsistentPadding) {
    issues.push({ category: 'layout', severity: 'minor', message: 'Inconsistent section spacing detected. Sections lack a unified vertical rhythm.', suggestion: 'Apply consistent section padding (py-20 or py-24) to all top-level sections for visual rhythm.' });
  }

  // Typography monotony
  const headingVariety = new Set((code.match(/text-[2-9]xl|text-\dxl/g) ?? [])).size;
  if (headingVariety < 2) {
    issues.push({ category: 'typography', severity: 'minor', message: 'Heading size variety is low — typography lacks visual hierarchy.', suggestion: 'Use at least 3 distinct text sizes (e.g., text-6xl for hero, text-3xl for section heads, text-xl for subheadings).' });
  }

  // DNA animation personality mismatch
  const animPersonality = dna.animationPersonality ?? 'subtle';
  const hasMotion       = /motion\.|whileInView|AnimatePresence/.test(code);
  if (animPersonality === 'none' && hasMotion) {
    issues.push({ category: 'motion', severity: 'minor', message: 'Motion elements present despite DNA animation personality set to "none".', suggestion: 'Remove Framer Motion wrappers. Keep hover states via Tailwind transition classes only.' });
  }
  if ((animPersonality === 'expressive' || animPersonality === 'moderate') && !hasMotion) {
    issues.push({ category: 'motion', severity: 'minor', message: `DNA requests "${animPersonality}" animation but no Framer Motion elements found.`, suggestion: 'Add whileInView entrance animations on section headings and staggerChildren on feature grids.' });
  }

  return issues;
}

// ── Conversion review (fast, no LLM) ─────────────────────────────────────────

function detectConversionIssues(code: string): CritiqueIssue[] {
  const issues: CritiqueIssue[] = [];

  // Social proof placement (should appear before or near CTA sections)
  const socialProofExists = /testimonial|review|trusted by|rating|customers/i.test(code);
  const ctaSectionExists  = /function\s+CTA|function\s+Pricing/i.test(code);
  if (!socialProofExists && ctaSectionExists) {
    issues.push({ category: 'conversion', severity: 'major', message: 'No social proof found before conversion sections (CTA/Pricing). Users lack validation before committing.', suggestion: 'Add a social proof band above CTA: company logos, review count, or a brief testimonial carousel.' });
  }

  // Value proposition clarity
  const heroBlock = (code.match(/function\s+Hero[\s\S]*?(?=\nfunction\s|\nexport\s|$)/) ?? [''])[0];
  const hasValueProp = /save|reduce|increase|improve|faster|easier|automate|eliminate/i.test(heroBlock);
  if (!hasValueProp) {
    issues.push({ category: 'conversion', severity: 'major', message: 'Hero headline lacks a quantified or outcome-driven value proposition.', suggestion: 'Rewrite hero headline to include a specific outcome: "Reduce onboarding time by 60%" outperforms "The Platform for Teams".' });
  }

  // Offer clarity in pricing
  if (/function\s+Pricing/i.test(code)) {
    const hasFreeTrial = /free trial|14.day|30.day|no credit card/i.test(code);
    if (!hasFreeTrial) {
      issues.push({ category: 'conversion', severity: 'minor', message: 'Pricing section has no free trial or low-commitment offer visible.', suggestion: 'Add "Start free trial — no credit card required" near pricing CTA to reduce commitment friction.' });
    }
  }

  // Decision friction — too many choices
  const navLinks = (code.match(/<a\s|<Link\s|href=/g) ?? []).length;
  const heroButtons = (heroBlock.match(/Button|<button/g) ?? []).length;
  if (heroButtons > 3) {
    issues.push({ category: 'conversion', severity: 'major', message: `Hero section has ${heroButtons} buttons — too many choices reduce conversion.`, suggestion: 'Hero should have exactly 1 primary CTA button and optionally 1 secondary text link. Remove all others.' });
  }

  return issues;
}

// ── LLM-based visual critic for qualitative assessment ────────────────────────

const CRITIC_SYSTEM = `You are a world-class Product Design Critic with 20 years of experience at top-tier companies (Stripe, Linear, Figma, Notion, Apple).

Your role is to review React JSX landing page code and give specific, actionable, human-like critique across these dimensions:
- Hero impact and credibility
- Layout rhythm and negative space
- CTA hierarchy and conversion flow
- Trust signal placement
- Visual hierarchy and typographic contrast
- Overall conversion readiness

You respond ONLY with a valid JSON object. No markdown fences, no explanation text before or after.

JSON structure:
{
  "conversionScore": <0-10 float>,
  "visualHierarchyScore": <0-10 float>,
  "trustBuildingScore": <0-10 float>,
  "topRecommendation": "<single most impactful change, 1-2 sentences>",
  "issues": [
    {
      "category": "<hero|layout|typography|ctaHierarchy|trustBuilding|accessibility|motion|dashboardUX|formsUX|navbarUX|conversion|visualHierarchy>",
      "severity": "<critical|major|minor|info>",
      "message": "<specific, non-generic problem description, 1 sentence>",
      "suggestion": "<concrete fix, 1-2 sentences, reference specific elements>"
    }
  ]
}

Rules for critique quality:
- NEVER say "the design could be better" — name the specific element and the specific fix.
- NEVER use generic phrases like "improve contrast" — say WHICH element, HOW MUCH, and WHY.
- Max 6 issues. Prioritize critical and major only unless space allows minor.
- topRecommendation must be the single change with highest conversion impact.`;

async function runLLMCritique(
  code: string,
  evalResult: EvaluationResult,
  dna: DesignDNA,
  openrouterKey: string
): Promise<{ conversionScore: number; visualHierarchyScore: number; trustBuildingScore: number; topRecommendation: string; issues: CritiqueIssue[] }> {
  const codeSnippet = code.slice(0, 6000);
  const cs = dna.colorSystem ?? {};

  const userPrompt = `Review this React JSX landing page code as a senior product designer.

=== EVALUATOR SCORES (context only — do not just echo these) ===
Overall: ${evalResult.overallScore}/10 | Hero: ${evalResult.heroScore} | Layout: ${evalResult.layoutScore}
CTA: ${evalResult.ctaScore} | Trust/Conversion signals: review the code

=== DNA TOKENS ===
Design Language: ${dna.designLanguage ?? 'unknown'}
Animation: ${dna.animationPersonality ?? 'subtle'}
Theme: ${dna.theme ?? 'dark'}
Primary: ${cs.primary ?? dna.primaryColor ?? '#fff'}
Accent: ${cs.accent ?? dna.accentColor ?? '#888'}

=== CODE (first 6000 chars) ===
${codeSnippet}

Return the JSON critique now:`;

  try {
    const raw = await callAI(
      openrouterKey,
      [
        { role: 'system', content: CRITIC_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      { label: 'design-critic', maxTokens: 1200 }
    );

    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return {
      conversionScore:      typeof parsed.conversionScore === 'number' ? Math.min(10, Math.max(0, parsed.conversionScore)) : 7,
      visualHierarchyScore: typeof parsed.visualHierarchyScore === 'number' ? Math.min(10, Math.max(0, parsed.visualHierarchyScore)) : 7,
      trustBuildingScore:   typeof parsed.trustBuildingScore === 'number' ? Math.min(10, Math.max(0, parsed.trustBuildingScore)) : 7,
      topRecommendation:    typeof parsed.topRecommendation === 'string' ? parsed.topRecommendation : 'Improve trust signal placement near the primary CTA.',
      issues:               Array.isArray(parsed.issues) ? parsed.issues.slice(0, 6) as CritiqueIssue[] : [],
    };
  } catch (e) {
    log.warn("CRITIC_LLM_PARSE_FAILED", { error: String(e) });
    return { conversionScore: 7, visualHierarchyScore: 7, trustBuildingScore: 7, topRecommendation: 'Review CTA hierarchy and trust signal placement.', issues: [] };
  }
}

// ── Main critic function ───────────────────────────────────────────────────────

export async function runDesignCritic(input: CriticInput): Promise<CritiqueReport> {
  const { code, evaluationResult, designDNA, openrouterKey } = input;

  // Phase 1+2+5: Rule-based scoring (fast, no LLM cost)
  const ruleScores = ruleBasedScores(code, designDNA, evaluationResult);
  const tasteIssues       = detectTasteIssues(code, designDNA);
  const conversionIssues  = detectConversionIssues(code);

  // Phase 3+4+6: LLM-based qualitative critique
  let llmResult = { conversionScore: 7.5, visualHierarchyScore: 7.5, trustBuildingScore: 7.5, topRecommendation: '', issues: [] as CritiqueIssue[] };
  try {
    llmResult = await runLLMCritique(code, evaluationResult, designDNA, openrouterKey);
  } catch (e) {
    log.error("CRITIC_LLM_FAILED", { error: String(e) });
  }

  // Merge scores: rule-based + LLM override for qualitative categories
  const categoryScores: Record<CritiqueCategory, number> = {
    hero:            ruleScores.hero            ?? evaluationResult.heroScore,
    layout:          ruleScores.layout          ?? evaluationResult.layoutScore,
    typography:      ruleScores.typography      ?? 7,
    ctaHierarchy:    ruleScores.ctaHierarchy    ?? evaluationResult.ctaScore,
    trustBuilding:   Math.round(((ruleScores.trustBuilding ?? 7) + llmResult.trustBuildingScore) / 2 * 10) / 10,
    accessibility:   ruleScores.accessibility   ?? evaluationResult.accessibilityScore,
    motion:          ruleScores.motion          ?? evaluationResult.motionScore,
    dashboardUX:     ruleScores.dashboardUX     ?? evaluationResult.dashboardScore,
    formsUX:         ruleScores.formsUX         ?? evaluationResult.formScore,
    navbarUX:        ruleScores.navbarUX        ?? evaluationResult.navigationScore,
    conversion:      Math.round(((ruleScores.visualHierarchy ?? 7) + llmResult.conversionScore) / 2 * 10) / 10,
    visualHierarchy: Math.round(((ruleScores.visualHierarchy ?? 7) + llmResult.visualHierarchyScore) / 2 * 10) / 10,
  };

  // Phase 7: Compute weighted criticScore
  let criticScore = 0;
  for (const [cat, weight] of Object.entries(CRITIC_WEIGHTS)) {
    criticScore += (categoryScores[cat as CritiqueCategory] ?? 7) * weight;
  }
  criticScore = Math.round(criticScore * 10) / 10;

  // Merge all issues (rule-based + LLM)
  const allIssues: CritiqueIssue[] = [
    ...tasteIssues,
    ...conversionIssues,
    ...llmResult.issues,
  ].sort((a, b) => {
    const sev: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  }).slice(0, 10);

  const topRecommendation = llmResult.topRecommendation ||
    (allIssues[0]?.suggestion ?? 'Design quality is strong. No critical improvements needed.');

  return {
    criticScore,
    categoryScores,
    issues: allIssues,
    topRecommendation,
    repairRequired: criticScore < CRITIC_REPAIR_THRESHOLD,
    rawCritique: JSON.stringify({ categoryScores, issues: allIssues }),
  };
}
