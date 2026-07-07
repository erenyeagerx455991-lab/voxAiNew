// ── V8.3 Autonomous AI Design Director — Creative Direction ────────────────────
// Generates strategic, high-level creative recommendations from review results.
// Never generates React code — strategy only.

import type { DirectorCategoryReview, DirectorCategory } from './directorTypes.js';
import { scoreSeverity } from './directorTypes.js';

// ── Director Score Weights (sum = 1.00) ───────────────────────────────────────

export const DIRECTOR_WEIGHTS: Record<DirectorCategory, number> = {
  visualHierarchy:       0.07,
  typography:            0.05,
  spacing:               0.05,
  composition:           0.04,
  layoutRhythm:          0.03,
  brandConsistency:      0.06,
  premiumFeel:           0.05,
  modernity:             0.03,
  trust:                 0.06,
  emotionalImpact:       0.03,
  storytelling:          0.03,
  ctaPlacement:          0.06,
  pricingPresentation:   0.03,
  dashboardExperience:   0.02,
  navigation:            0.04,
  forms:                 0.03,
  motion:                0.02,
  accessibility:         0.05,
  performance:           0.02,
  responsiveness:        0.03,
  componentConsistency:  0.05,
  tokenConsistency:      0.03,
  dnaAlignment:          0.04,
  uxAlignment:           0.04,
  conversionAlignment:   0.04,
};

// ── Overall Director Score ────────────────────────────────────────────────────

export function computeDirectorScore(reviews: DirectorCategoryReview[]): number {
  const byCategory = new Map(reviews.map(r => [r.category, r]));
  let total = 0;
  let weightSum = 0;

  for (const [cat, weight] of Object.entries(DIRECTOR_WEIGHTS)) {
    const rev = byCategory.get(cat as DirectorCategory);
    if (rev) {
      total += rev.score * weight;
      weightSum += weight;
    }
  }

  if (weightSum === 0) return 5.0;
  const raw = total / weightSum;
  return Math.round(Math.min(10, Math.max(0, raw)) * 10) / 10;
}

// ── Top Recommendations ───────────────────────────────────────────────────────

export function extractTopRecommendations(reviews: DirectorCategoryReview[]): string[] {
  return reviews
    .filter(r => r.score < 7.0)
    .sort((a, b) => {
      // Sort by weight * severity
      const wA = DIRECTOR_WEIGHTS[a.category] ?? 0;
      const wB = DIRECTOR_WEIGHTS[b.category] ?? 0;
      const severityScore = (s: string) => ({ Critical: 4, High: 3, Medium: 2, Low: 1 }[s] ?? 1);
      return (wB * severityScore(b.severity)) - (wA * severityScore(a.severity));
    })
    .slice(0, 5)
    .map(r => r.recommendation);
}

// ── Critical Issues ───────────────────────────────────────────────────────────

export function extractCriticalIssues(reviews: DirectorCategoryReview[]): string[] {
  return reviews
    .filter(r => r.severity === 'Critical')
    .map(r => `[${r.category}] ${r.reason}`);
}

// ── Most Improved / Most Common Problems ──────────────────────────────────────

export function extractMostCommonProblems(reviews: DirectorCategoryReview[]): DirectorCategory[] {
  return reviews
    .filter(r => r.score < 6.5)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(r => r.category);
}

// ── Creative Direction Summary ────────────────────────────────────────────────

export function buildCreativeDirection(
  reviews: DirectorCategoryReview[],
  overallScore: number,
  dnaId?: string,
): string {
  const criticalCount = reviews.filter(r => r.severity === 'Critical').length;
  const highCount     = reviews.filter(r => r.severity === 'High').length;
  const weakest       = reviews
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(r => r.category);

  const dnaNote = dnaId && dnaId !== 'generic'
    ? ` The ${dnaId} DNA direction should be reinforced more consistently.`
    : '';

  if (overallScore >= 8.5) {
    return `This design is production-ready with strong scores across the board.${dnaNote} Focus on polish: micro-interactions, typography refinement, and conversion-path clarity.`;
  }

  if (criticalCount > 0) {
    return `Critical issues must be addressed before shipping: ${weakest.join(', ')} need immediate attention.${dnaNote} Resolve these first to avoid losing user trust and conversion.`;
  }

  if (highCount > 1) {
    return `Several high-severity gaps reduce the design's effectiveness: ${weakest.slice(0, 2).join(' and ')} are the top priorities.${dnaNote} Address these to significantly improve quality.`;
  }

  return `The design is on a good trajectory. Key improvements — ${weakest.join(', ')} — will lift quality from ${overallScore.toFixed(1)} toward 9+.${dnaNote}`;
}

// ── Review Confidence Aggregation ────────────────────────────────────────────

export function computeDirectorConfidence(reviews: DirectorCategoryReview[]): number {
  if (reviews.length === 0) return 0.5;
  const avg = reviews.reduce((s, r) => s + r.confidence, 0) / reviews.length;
  return Math.round(Math.min(1, Math.max(0.1, avg)) * 100) / 100;
}

// ── Review Distribution ───────────────────────────────────────────────────────

export interface ReviewDistribution {
  critical: number;
  high:     number;
  medium:   number;
  low:      number;
}

export function computeReviewDistribution(reviews: DirectorCategoryReview[]): ReviewDistribution {
  return {
    critical: reviews.filter(r => r.severity === 'Critical').length,
    high:     reviews.filter(r => r.severity === 'High').length,
    medium:   reviews.filter(r => r.severity === 'Medium').length,
    low:      reviews.filter(r => r.severity === 'Low').length,
  };
}

// ── Severity from score (re-exported for convenience) ─────────────────────────

export { scoreSeverity };
