/**
 * V8.2 — UX Intelligence & Conversion Prediction Engine
 * Type definitions — Phase 2 schema
 */

// ── Conversion levels ─────────────────────────────────────────────────────────

export type ConversionLevel = "very_low" | "low" | "medium" | "high" | "very_high";
export type BounceRisk      = "very_high" | "high" | "medium" | "low" | "very_low";
export type EngagementLevel = "very_low" | "low" | "medium" | "high" | "very_high";

// ── UX dimension scores (all 0–10) ────────────────────────────────────────────

export interface UXDimensions {
  // Phase 2 — 17 predicted dimensions
  visualClarity:          number;
  cognitiveLoad:          number;   // inverted: high score = LOW load = GOOD
  ctaDiscoverability:     number;
  readingFlow:            number;
  trust:                  number;
  scanningEfficiency:     number;
  navigationSimplicity:   number;
  formFriction:           number;   // inverted: high score = LOW friction = GOOD
  pricingClarity:         number;
  dashboardUsability:     number;
  informationDensity:     number;   // inverted: high score = GOOD density balance
  whitespaceBalance:      number;
  hierarchy:              number;
  accessibilityConfidence: number;
  motionComfort:          number;
  perceivedPerformance:   number;
  overallConversionProbability: number;
}

// ── Conversion prediction (Phase 4) ──────────────────────────────────────────

export interface ConversionPrediction {
  level:              ConversionLevel;
  expectedBounceRisk:     BounceRisk;
  expectedEngagement:     EngagementLevel;
  expectedScrollDepth:    number;  // 0–1 (fraction of page scrolled)
  expectedCTAInteraction: number;  // 0–1 probability
  expectedFormCompletion: number;  // 0–1 probability (0 if no form)
  expectedTrustLevel:     number;  // 0–10
}

// ── UX issue ──────────────────────────────────────────────────────────────────

export interface UXIssue {
  category:       string;
  severity:       "critical" | "major" | "minor";
  message:        string;
  recommendation: string;
  dimension:      keyof UXDimensions;
  score:          number;
}

// ── Full UX prediction result (Phase 2 + Phase 3 + Phase 4) ──────────────────

export interface UXPredictionResult {
  dimensions:           UXDimensions;
  overallUXScore:       number;   // 0–10 weighted composite (Phase 3)
  conversionPrediction: ConversionPrediction;
  confidence:           number;   // 0–1 (grows with learning data)
  issues:               UXIssue[];
  topInsights:          string[]; // human-readable summary points
  analyzedAt:           string;   // ISO timestamp
}

// ── Phase 3 — Weighted formula ────────────────────────────────────────────────
// Spec weights (sum = 110 from "Example" in spec):
//   visualHierarchy 18, trust 14, cta 14, navigation 10, forms 10,
//   accessibility 10, whitespace 8, density 8, motion 4, performance 4,
//   consistency 10
// Normalised to 1.0 by dividing by 110.

export const UX_WEIGHTS = {
  hierarchy:              18 / 110,  // ≈ 0.164
  trust:                  14 / 110,  // ≈ 0.127
  ctaDiscoverability:     14 / 110,  // ≈ 0.127
  navigation:             10 / 110,  // ≈ 0.091
  forms:                  10 / 110,  // ≈ 0.091
  accessibility:          10 / 110,  // ≈ 0.091
  whitespace:              8 / 110,  // ≈ 0.073
  density:                 8 / 110,  // ≈ 0.073
  motion:                  4 / 110,  // ≈ 0.036
  perceivedPerformance:    4 / 110,  // ≈ 0.036
  consistency:            10 / 110,  // ≈ 0.091
} as const;

export function computeOverallUXScore(dims: UXDimensions): number {
  const raw =
    dims.hierarchy              * UX_WEIGHTS.hierarchy +
    dims.trust                  * UX_WEIGHTS.trust +
    dims.ctaDiscoverability     * UX_WEIGHTS.ctaDiscoverability +
    dims.navigationSimplicity   * UX_WEIGHTS.navigation +
    dims.formFriction           * UX_WEIGHTS.forms +
    dims.accessibilityConfidence * UX_WEIGHTS.accessibility +
    dims.whitespaceBalance      * UX_WEIGHTS.whitespace +
    dims.informationDensity     * UX_WEIGHTS.density +
    dims.motionComfort          * UX_WEIGHTS.motion +
    dims.perceivedPerformance   * UX_WEIGHTS.perceivedPerformance +
    dims.visualClarity          * UX_WEIGHTS.consistency;

  return Math.round(Math.max(0, Math.min(10, raw)) * 100) / 100;
}

export function scoreToConversionLevel(score: number): ConversionLevel {
  if (score >= 8.5) return "very_high";
  if (score >= 7.0) return "high";
  if (score >= 5.5) return "medium";
  if (score >= 4.0) return "low";
  return "very_low";
}

// ── Learning input types (Phase 11) ──────────────────────────────────────────

export interface UXBuildLearningInput {
  buildId:         string;
  dnaId?:          string;
  uxScore:         number;
  conversionLevel: ConversionLevel;
  repairTriggered: boolean;
  success:         boolean;
  dimensions:      Partial<UXDimensions>;
}

export interface UXFeedbackInput {
  buildId:         string;
  rating:          number;      // 1–5
  action:          "accepted" | "edited" | "rejected";
  editedSections?: string[];
}

export interface UXBenchmarkInput {
  buildId:         string;
  benchmarkScore:  number;
  category:        string;
  delta:           number;
}

export interface UXVisualDiffInput {
  buildId:            string;
  pixelDiff:          number;
  layoutRegression:   boolean;
  spacingRegression:  boolean;
  uxScoreBefore:      number;
  uxScoreAfter:       number;
}

// ── Persistence record (Phase 10) ─────────────────────────────────────────────

export interface UXBuildRecord {
  readonly buildId:       string;
  readonly timestamp:     string;
  readonly overallUXScore: number;
  readonly conversionLevel: ConversionLevel;
  readonly dimensions:    UXDimensions;
  readonly confidence:    number;
  readonly issueCount:    number;
}

// ── Telemetry snapshot (Phase 9) ─────────────────────────────────────────────

export interface UXQualitySnapshot {
  averageUXScore:          number;
  averageConversionPrediction: number;
  averageTrustScore:       number;
  averageCTA:              number;
  averageForms:            number;
  averageNavigation:       number;
  averageDensity:          number;
  averageHierarchy:        number;
  topPerformingPatterns:   string[];
  lowestPatterns:          string[];
  learningTrend:           "improving" | "stable" | "degrading";
  predictionConfidence:    number;
  totalPredictions:        number;
  lastPredictionAt:        string | null;
}
