// ── V8.3 Autonomous AI Design Director — Core Engine ─────────────────────────
// Runs all 25 category reviewers and produces a unified DirectorReview.
// Pure static analysis — no LLM, no I/O.

import type { DirectorReview, DirectorReviewInput } from './directorTypes.js';
import {
  scoreVisualHierarchy, scoreTypography, scoreSpacing, scoreComposition,
  scoreLayoutRhythm, scoreBrandConsistency, scorePremiumFeel, scoreModernity,
  scoreTrust, scoreEmotionalImpact, scoreStorytelling, scoreCTAPlacement,
  scorePricingPresentation, scoreDashboardExperience, scoreNavigation,
  scoreForms, scoreMotion, scoreAccessibility, scorePerformance,
  scoreResponsiveness, scoreComponentConsistency, scoreTokenConsistency,
  scoreDNAAlignment, scoreUXAlignment, scoreConversionAlignment,
} from './directorReview.js';
import {
  computeDirectorScore, extractTopRecommendations, extractCriticalIssues,
  extractMostCommonProblems, buildCreativeDirection, computeDirectorConfidence,
} from './directorRecommendations.js';

// ── Main entry point ──────────────────────────────────────────────────────────

export function runDesignDirector(input: DirectorReviewInput): DirectorReview {
  // Run all 25 category reviewers
  const categoryReviews = [
    scoreVisualHierarchy(input),
    scoreTypography(input),
    scoreSpacing(input),
    scoreComposition(input),
    scoreLayoutRhythm(input),
    scoreBrandConsistency(input),
    scorePremiumFeel(input),
    scoreModernity(input),
    scoreTrust(input),
    scoreEmotionalImpact(input),
    scoreStorytelling(input),
    scoreCTAPlacement(input),
    scorePricingPresentation(input),
    scoreDashboardExperience(input),
    scoreNavigation(input),
    scoreForms(input),
    scoreMotion(input),
    scoreAccessibility(input),
    scorePerformance(input),
    scoreResponsiveness(input),
    scoreComponentConsistency(input),
    scoreTokenConsistency(input),
    scoreDNAAlignment(input),
    scoreUXAlignment(input),
    scoreConversionAlignment(input),
  ];

  const overallScore       = computeDirectorScore(categoryReviews);
  const topRecommendations = extractTopRecommendations(categoryReviews);
  const criticalIssues     = extractCriticalIssues(categoryReviews);
  const mostCommonProblems = extractMostCommonProblems(categoryReviews);
  const confidence         = computeDirectorConfidence(categoryReviews);
  const creativeDirection  = buildCreativeDirection(categoryReviews, overallScore, input.dnaId);

  return {
    overallScore,
    categoryReviews,
    topRecommendations,
    criticalIssues,
    mostImprovedCategories: [], // populated by learning loop after history comparison
    mostCommonProblems,
    creativeDirection,
    confidence,
  };
}

// ── Category score map helper (for telemetry & learning) ─────────────────────

export function buildCategoryScoreMap(review: DirectorReview): Record<string, number> {
  return Object.fromEntries(review.categoryReviews.map(r => [r.category, r.score]));
}
