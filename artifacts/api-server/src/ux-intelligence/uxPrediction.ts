/**
 * V8.2 — UX Prediction Engine
 *
 * Core prediction pipeline (Phase 2–4):
 *   1. Analyze code with heuristics
 *   2. Apply learned weight adjustments
 *   3. Compute weighted overall score (Phase 3)
 *   4. Predict conversion probability + behavioral signals (Phase 4)
 *   5. Surface issues and insights
 *
 * No LLM calls — pure static analysis + learned offsets.
 */

import { analyzeUXHeuristics } from "./uxHeuristics.js";
import {
  computeOverallUXScore,
  scoreToConversionLevel,
  type UXDimensions,
  type UXPredictionResult,
  type ConversionPrediction,
  type UXIssue,
  type BounceRisk,
  type EngagementLevel,
} from "./uxTypes.js";
import { getLearnedOffsets } from "./uxLearning.js";

// ── Conversion prediction from UX score ──────────────────────────────────────

function predictBounceRisk(overallScore: number, dims: UXDimensions): BounceRisk {
  // Low trust or CTA = high bounce risk
  const riskScore = overallScore * 0.5 + dims.trust * 0.3 + dims.ctaDiscoverability * 0.2;
  if (riskScore >= 8.5) return "very_low";
  if (riskScore >= 7.0) return "low";
  if (riskScore >= 5.5) return "medium";
  if (riskScore >= 4.0) return "high";
  return "very_high";
}

function predictEngagement(overallScore: number, dims: UXDimensions): EngagementLevel {
  const eng = overallScore * 0.4 + dims.scanningEfficiency * 0.3 + dims.hierarchy * 0.3;
  if (eng >= 8.5) return "very_high";
  if (eng >= 7.0) return "high";
  if (eng >= 5.5) return "medium";
  if (eng >= 4.0) return "low";
  return "very_low";
}

function predictScrollDepth(dims: UXDimensions): number {
  const base = (dims.scanningEfficiency * 0.4 + dims.informationDensity * 0.3 + dims.whitespaceBalance * 0.3) / 10;
  return Math.round(Math.max(0.1, Math.min(1.0, base)) * 100) / 100;
}

function predictCTAInteraction(dims: UXDimensions): number {
  const p = (dims.ctaDiscoverability * 0.5 + dims.trust * 0.3 + dims.hierarchy * 0.2) / 10;
  return Math.round(Math.max(0.05, Math.min(0.95, p)) * 100) / 100;
}

function predictFormCompletion(dims: UXDimensions, code: string): number {
  const hasForm = /form|input|<Form/i.test(code);
  if (!hasForm) return 0;
  const p = (dims.formFriction * 0.5 + dims.trust * 0.3 + dims.cognitiveLoad * 0.2) / 10;
  return Math.round(Math.max(0.05, Math.min(0.9, p)) * 100) / 100;
}

function buildConversionPrediction(
  overallScore: number,
  dims: UXDimensions,
  code: string,
): ConversionPrediction {
  return {
    level:                  scoreToConversionLevel(overallScore),
    expectedBounceRisk:     predictBounceRisk(overallScore, dims),
    expectedEngagement:     predictEngagement(overallScore, dims),
    expectedScrollDepth:    predictScrollDepth(dims),
    expectedCTAInteraction: predictCTAInteraction(dims),
    expectedFormCompletion: predictFormCompletion(dims, code),
    expectedTrustLevel:     Math.round(dims.trust * 10) / 10,
  };
}

// ── Issue detection ───────────────────────────────────────────────────────────

const ISSUE_THRESHOLD = 6.0;
const CRITICAL_THRESHOLD = 4.0;

interface DimMeta {
  label: string;
  category: string;
  recommendation: string;
}

const DIM_META: Partial<Record<keyof UXDimensions, DimMeta>> = {
  ctaDiscoverability: {
    label: "Weak CTA visibility",
    category: "conversion",
    recommendation: "Add a prominent, high-contrast Call-to-Action button above the fold with clear copy (Get Started, Try Free, etc.)",
  },
  cognitiveLoad: {
    label: "Too much cognitive load",
    category: "usability",
    recommendation: "Simplify the page by removing competing elements; focus on one primary goal per section",
  },
  navigationSimplicity: {
    label: "Navigation too complex",
    category: "navigation",
    recommendation: "Reduce navigation items to 5–7 max; use mega-menu or progressive disclosure for depth",
  },
  pricingClarity: {
    label: "Pricing confusing",
    category: "conversion",
    recommendation: "Highlight the recommended plan, show clear price/period, list top 3–5 features, add FAQ",
  },
  dashboardUsability: {
    label: "Dashboard overloaded",
    category: "usability",
    recommendation: "Use progressive disclosure, tabs/filters, skeleton loaders, and limit default visible metrics",
  },
  formFriction: {
    label: "Forms intimidating",
    category: "forms",
    recommendation: "Reduce field count, add labels + helper text, use social login, show progress for multi-step",
  },
  trust: {
    label: "Poor trust signals",
    category: "trust",
    recommendation: "Add testimonials, social proof numbers, security badges, company logos, and guarantee copy",
  },
  hierarchy: {
    label: "Weak hierarchy",
    category: "visual",
    recommendation: "Establish clear H1→H2→H3 heading structure; use large hero headline, contrasting CTA",
  },
  whitespaceBalance: {
    label: "Insufficient whitespace",
    category: "visual",
    recommendation: "Increase section padding (py-20+), use gap classes, breathe space between elements",
  },
  accessibilityConfidence: {
    label: "Accessibility gaps",
    category: "accessibility",
    recommendation: "Add aria-label on interactive elements, ensure focus-visible states, provide alt text on all images",
  },
  motionComfort: {
    label: "Motion without safety net",
    category: "motion",
    recommendation: "Wrap all animations in prefers-reduced-motion media query or use motion-safe: Tailwind classes",
  },
  perceivedPerformance: {
    label: "No loading feedback",
    category: "performance",
    recommendation: "Add Skeleton loaders, Suspense boundaries, and loading spinners for async content",
  },
};

function detectIssues(dims: UXDimensions): UXIssue[] {
  const issues: UXIssue[] = [];
  const entries = Object.entries(dims) as [keyof UXDimensions, number][];

  for (const [key, score] of entries) {
    if (score >= ISSUE_THRESHOLD) continue;
    const meta = DIM_META[key];
    if (!meta) continue;
    issues.push({
      category:       meta.category,
      severity:       score < CRITICAL_THRESHOLD ? "critical" : "major",
      message:        meta.label,
      recommendation: meta.recommendation,
      dimension:      key,
      score,
    });
  }

  return issues.sort((a, b) => a.score - b.score); // worst first
}

// ── Top insights ──────────────────────────────────────────────────────────────

function buildInsights(
  overallScore: number,
  dims: UXDimensions,
  prediction: ConversionPrediction,
): string[] {
  const insights: string[] = [];

  if (overallScore >= 8.5)
    insights.push(`Excellent UX quality (${overallScore}/10) — High conversion expected`);
  else if (overallScore >= 7.0)
    insights.push(`Good UX quality (${overallScore}/10) — Moderate-high conversion likely`);
  else if (overallScore >= 5.5)
    insights.push(`Average UX quality (${overallScore}/10) — Conversion optimization recommended`);
  else
    insights.push(`Below-average UX quality (${overallScore}/10) — Significant improvements needed`);

  if (dims.trust >= 7)   insights.push("Strong trust signals detected");
  if (dims.trust < 5)    insights.push("Trust signals are weak — add testimonials and social proof");
  if (dims.ctaDiscoverability >= 8) insights.push("CTAs are prominent and discoverable");
  if (dims.ctaDiscoverability < 5)  insights.push("CTAs are hard to find — increase prominence");
  if (dims.whitespaceBalance >= 8)  insights.push("Excellent whitespace balance improves readability");
  if (prediction.expectedBounceRisk === "very_low" || prediction.expectedBounceRisk === "low")
    insights.push("Low bounce risk — users likely to stay and engage");
  if (prediction.expectedBounceRisk === "high" || prediction.expectedBounceRisk === "very_high")
    insights.push("High bounce risk — consider improving above-the-fold content");

  return insights.slice(0, 5);
}

// ── Confidence from learning data ─────────────────────────────────────────────

function computeConfidence(totalPredictions: number): number {
  // Asymptotic: ~0.5 at 10 predictions, ~0.85 at 100
  return Math.round(Math.min(0.95, 1 - Math.exp(-totalPredictions / 50)) * 1000) / 1000;
}

// ── Main prediction function ──────────────────────────────────────────────────

export function predictUX(
  code: string,
  options: { totalPriorPredictions?: number } = {},
): UXPredictionResult {
  const baseDims  = analyzeUXHeuristics(code);
  const offsets   = getLearnedOffsets();

  // Apply learned offsets to each dimension
  const dims: UXDimensions = {} as UXDimensions;
  for (const key of Object.keys(baseDims) as (keyof UXDimensions)[]) {
    const base   = baseDims[key];
    const offset = (offsets[key] ?? 0);
    dims[key] = Math.round(Math.max(0, Math.min(10, base + offset)) * 100) / 100;
  }

  const overallUXScore     = computeOverallUXScore(dims);
  const conversionPrediction = buildConversionPrediction(overallUXScore, dims, code);
  const issues             = detectIssues(dims);
  const topInsights        = buildInsights(overallUXScore, dims, conversionPrediction);
  const confidence         = computeConfidence(options.totalPriorPredictions ?? 0);

  return {
    dimensions:           dims,
    overallUXScore,
    conversionPrediction,
    confidence,
    issues,
    topInsights,
    analyzedAt:           new Date().toISOString(),
  };
}
