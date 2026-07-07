// ── V8.2 UX Intelligence — Prediction Engine ──────────────────────────────────
// Main orchestrator: runs all heuristic scorers and assembles UXReport.
// Pure function — deterministic, no LLM, no side effects.

import type { UXScoringInput, UXMetrics, UXReport } from './uxTypes.js';
import {
  scoreVisualClarity,
  scoreCognitiveLoad,
  scoreCtaDiscoverability,
  scoreReadingFlow,
  scoreTrust,
  scoreScanningEfficiency,
  scoreNavigationSimplicity,
  scoreFormFriction,
  scorePricingClarity,
  scoreDashboardUsability,
  scoreInformationDensity,
  scoreWhitespaceBalance,
  scoreHierarchy,
  scoreAccessibilityConfidence,
  scoreMotionComfort,
  scorePerceivedPerformance,
} from './uxHeuristics.js';
import {
  computeOverallUXScore,
  predictConversion,
  computeConfidence,
  predictBehavior,
  extractTopIssues,
  extractStrengths,
} from './uxRanking.js';

// ── Main Prediction Entry Point ───────────────────────────────────────────────

export function predictUX(input: UXScoringInput): UXReport {
  const { code, sectionOrder, authState = 'guest', isDashboard = false, isForm = false, hasPricing = false } = input;

  // Detect page type from sectionOrder if not passed explicitly
  const detectedDashboard = isDashboard || sectionOrder.some(s => /dashboard|analytics|overview/i.test(s));
  const detectedForm = isForm || sectionOrder.some(s => /form|signup|login|register|contact/i.test(s));
  const detectedPricing = hasPricing || sectionOrder.some(s => /pricing|plans?|tier/i.test(s));
  const _ = authState; // used downstream; keep for future auth-aware scoring

  // ── Score all 17 dimensions ───────────────────────────────────────────────
  const metrics: UXMetrics = {
    visualClarity:          scoreVisualClarity(code),
    cognitiveLoad:          scoreCognitiveLoad(code, sectionOrder),
    ctaDiscoverability:     scoreCtaDiscoverability(code),
    readingFlow:            scoreReadingFlow(code, sectionOrder),
    trust:                  scoreTrust(code),
    scanningEfficiency:     scoreScanningEfficiency(code),
    navigationSimplicity:   scoreNavigationSimplicity(code),
    formFriction:           scoreFormFriction(code, detectedForm),
    pricingClarity:         scorePricingClarity(code, detectedPricing),
    dashboardUsability:     scoreDashboardUsability(code, detectedDashboard),
    informationDensity:     scoreInformationDensity(code, sectionOrder),
    whitespaceBalance:      scoreWhitespaceBalance(code),
    hierarchy:              scoreHierarchy(code),
    accessibilityConfidence: scoreAccessibilityConfidence(code),
    motionComfort:          scoreMotionComfort(code),
    perceivedPerformance:   scorePerceivedPerformance(code),
  };

  const overallUXScore = computeOverallUXScore(metrics);
  const conversionPrediction = predictConversion(overallUXScore, metrics);
  const confidence = computeConfidence(metrics, sectionOrder.length);
  const behaviorPredictions = predictBehavior(metrics, overallUXScore);
  const topIssues = extractTopIssues(metrics);
  const strengths = extractStrengths(metrics);

  return {
    metrics,
    overallUXScore,
    conversionPrediction,
    confidence,
    behaviorPredictions,
    topIssues,
    strengths,
  };
}
