// ── V8.2 UX Intelligence — Ranking Utilities ──────────────────────────────────
// Weighted UX score computation and conversion prediction.

import type { UXMetrics, ConversionPrediction, UXBehaviorPredictions } from './uxTypes.js';

// ── Overall UX Score Weights (sum = 1.00) ─────────────────────────────────────
// Spec-defined weights (Phase 3):

export const UX_WEIGHTS = {
  visualClarity:          0.07, // contributes to hierarchy (18% total)
  hierarchy:              0.11, // visual hierarchy bucket
  trust:                  0.14,
  ctaDiscoverability:     0.14,
  navigationSimplicity:   0.10,
  formFriction:           0.10, // inverted: high friction = low score
  accessibilityConfidence: 0.10,
  whitespaceBalance:      0.08,
  informationDensity:     0.08,
  motionComfort:          0.04,
  perceivedPerformance:   0.04,
  // remaining dimensions contribute via behavior predictions
  cognitiveLoad:          0.00, // used only in behavior predictions
  readingFlow:            0.00, // used only in behavior predictions
  scanningEfficiency:     0.00, // factored into hierarchy bucket
  pricingClarity:         0.00, // conditional
  dashboardUsability:     0.00, // conditional
} as const;

// Actual weighted dimensions used in overallUXScore
const SCORED_DIMS: Array<keyof typeof UX_WEIGHTS> = [
  'visualClarity', 'hierarchy', 'trust', 'ctaDiscoverability',
  'navigationSimplicity', 'formFriction', 'accessibilityConfidence',
  'whitespaceBalance', 'informationDensity', 'motionComfort', 'perceivedPerformance',
];

// ── Overall UX Score ─────────────────────────────────────────────────────────

export function computeOverallUXScore(metrics: UXMetrics): number {
  let total = 0;
  for (const dim of SCORED_DIMS) {
    total += metrics[dim] * UX_WEIGHTS[dim];
  }
  // Normalize: weights sum to (0.07+0.11+0.14+0.14+0.10+0.10+0.10+0.08+0.08+0.04+0.04) = 1.00
  return Math.min(10, Math.max(0, Math.round(total * 10) / 10));
}

// ── Conversion Prediction ─────────────────────────────────────────────────────

export function predictConversion(uxScore: number, metrics: UXMetrics): ConversionPrediction {
  // Weighted conversion signal: trust + CTA + forms are highest impact
  const conversionSignal =
    metrics.trust            * 0.30 +
    metrics.ctaDiscoverability * 0.25 +
    metrics.formFriction     * 0.20 +
    metrics.hierarchy        * 0.15 +
    uxScore                  * 0.10;

  if (conversionSignal >= 8.5) return 'Very High';
  if (conversionSignal >= 7.0) return 'High';
  if (conversionSignal >= 5.0) return 'Medium';
  if (conversionSignal >= 3.0) return 'Low';
  return 'Very Low';
}

// ── Prediction Confidence ─────────────────────────────────────────────────────

export function computeConfidence(metrics: UXMetrics, sectionCount: number): number {
  // More sections + more code signals → higher confidence in prediction
  let confidence = 0.5;
  if (sectionCount >= 4) confidence += 0.15;
  if (sectionCount >= 6) confidence += 0.10;
  // Metrics spread (high variance = lower confidence in aggregate)
  const values = SCORED_DIMS.map(d => metrics[d]);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  if (variance < 2) confidence += 0.15; // consistent metrics
  else if (variance > 5) confidence -= 0.10; // high variance = less confident
  return Math.min(1, Math.max(0.1, Math.round(confidence * 100) / 100));
}

// ── Behavior Predictions ──────────────────────────────────────────────────────

export function predictBehavior(metrics: UXMetrics, uxScore: number): UXBehaviorPredictions {
  // Bounce risk: inverse of engagement signals
  const bounceRisk = clamp(10 - (
    metrics.trust * 0.3 +
    metrics.ctaDiscoverability * 0.25 +
    metrics.hierarchy * 0.25 +
    metrics.readingFlow * 0.2
  ));

  // Engagement: hierarchy + content richness
  const engagement = clamp(
    metrics.hierarchy * 0.25 +
    metrics.scanningEfficiency * 0.25 +
    metrics.informationDensity * 0.25 +
    metrics.readingFlow * 0.25
  );

  // Scroll depth: visual interest + content structure
  const scrollDepth = clamp(
    metrics.scanningEfficiency * 0.3 +
    metrics.whitespaceBalance * 0.25 +
    metrics.informationDensity * 0.25 +
    metrics.motionComfort * 0.2
  );

  // CTA interaction: discoverability + trust
  const ctaInteraction = clamp(
    metrics.ctaDiscoverability * 0.5 +
    metrics.trust * 0.3 +
    metrics.hierarchy * 0.2
  );

  // Form completion: inverse friction
  const formCompletion = clamp(
    metrics.formFriction * 0.6 +
    metrics.accessibilityConfidence * 0.2 +
    metrics.trust * 0.2
  );

  // Trust level: direct trust metric + credibility signals
  const trustLevel = clamp(
    metrics.trust * 0.6 +
    metrics.accessibilityConfidence * 0.2 +
    metrics.perceivedPerformance * 0.2
  );

  return {
    bounceRisk:     Math.round(bounceRisk * 10) / 10,
    engagement:     Math.round(engagement * 10) / 10,
    scrollDepth:    Math.round(scrollDepth * 10) / 10,
    ctaInteraction: Math.round(ctaInteraction * 10) / 10,
    formCompletion: Math.round(formCompletion * 10) / 10,
    trustLevel:     Math.round(trustLevel * 10) / 10,
  };
}

function clamp(v: number, min = 0, max = 10): number {
  return Math.min(max, Math.max(min, v));
}

// ── Top Issues Extractor ──────────────────────────────────────────────────────

export function extractTopIssues(metrics: UXMetrics): string[] {
  const issues: Array<{ score: number; message: string }> = [
    { score: metrics.trust,               message: 'Low trust signals — add social proof, reviews, or logo clouds' },
    { score: metrics.ctaDiscoverability,  message: 'Weak CTA visibility — primary CTA needs more prominence and contrast' },
    { score: metrics.hierarchy,           message: 'Poor visual hierarchy — strengthen heading scale and font weight contrast' },
    { score: metrics.navigationSimplicity, message: 'Navigation too complex — simplify menu structure (max 5–7 items)' },
    { score: metrics.formFriction,        message: 'High form friction — reduce fields, add clear labels and error messages' },
    { score: metrics.whitespaceBalance,   message: 'Insufficient whitespace — increase section padding and component gaps' },
    { score: metrics.accessibilityConfidence, message: 'Accessibility gaps — add ARIA labels, focus indicators, and alt text' },
    { score: metrics.perceivedPerformance, message: 'Slow perceived performance — add skeleton states and loading indicators' },
    { score: metrics.visualClarity,       message: 'Low visual clarity — improve color contrast and focus indicators' },
    { score: metrics.cognitiveLoad,       message: 'Too much cognitive load — simplify content, use progressive disclosure' },
  ];

  return issues
    .filter(i => i.score < 6.0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(i => i.message);
}

// ── Strengths Extractor ───────────────────────────────────────────────────────

export function extractStrengths(metrics: UXMetrics): string[] {
  const strengths: Array<{ score: number; message: string }> = [
    { score: metrics.trust,               message: 'Strong trust signals and social proof' },
    { score: metrics.ctaDiscoverability,  message: 'Clear, discoverable CTAs with good contrast' },
    { score: metrics.hierarchy,           message: 'Excellent visual hierarchy and heading structure' },
    { score: metrics.navigationSimplicity, message: 'Clean, simple navigation' },
    { score: metrics.whitespaceBalance,   message: 'Well-balanced whitespace and breathing room' },
    { score: metrics.accessibilityConfidence, message: 'Strong accessibility implementation' },
    { score: metrics.motionComfort,       message: 'Comfortable, purposeful motion design' },
    { score: metrics.scanningEfficiency,  message: 'Highly scannable content layout' },
  ];

  return strengths
    .filter(s => s.score >= 7.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.message);
}
