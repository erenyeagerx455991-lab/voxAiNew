// ── V8.2 UX Intelligence — Types ──────────────────────────────────────────────
// Central type definitions for the AI UX Intelligence & Conversion Prediction Engine.

// ── 17 UX Prediction Metrics (0–10 each) ─────────────────────────────────────

export interface UXMetrics {
  /** Visual contrast, color hierarchy, focal points */
  visualClarity: number;
  /** Mental effort to understand the page */
  cognitiveLoad: number;
  /** How easily users find and notice the primary CTA */
  ctaDiscoverability: number;
  /** Natural reading flow (F-pattern / Z-pattern adherence) */
  readingFlow: number;
  /** Social proof, trust signals, credibility markers */
  trust: number;
  /** Scannability — headings, bullets, whitespace */
  scanningEfficiency: number;
  /** Navigation clarity, depth, predictability */
  navigationSimplicity: number;
  /** Form length, labels, validation friction */
  formFriction: number;
  /** Pricing table clarity, feature comparison, anchoring */
  pricingClarity: number;
  /** Dashboard widget density, data legibility */
  dashboardUsability: number;
  /** Information density — not too sparse, not too dense */
  informationDensity: number;
  /** Whitespace use — breathing room, visual separation */
  whitespaceBalance: number;
  /** Visual hierarchy strength — heading scale, prominence */
  hierarchy: number;
  /** Predicted accessibility compliance confidence */
  accessibilityConfidence: number;
  /** Motion appropriateness — not distracting, purposeful */
  motionComfort: number;
  /** Perceived page load speed signals */
  perceivedPerformance: number;
}

// ── Conversion Prediction ─────────────────────────────────────────────────────

export type ConversionPrediction = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';

export interface UXBehaviorPredictions {
  /** Expected bounce risk 0–10 (10 = very high risk) */
  bounceRisk: number;
  /** Expected engagement level 0–10 */
  engagement: number;
  /** Expected scroll depth 0–10 */
  scrollDepth: number;
  /** Expected CTA interaction probability 0–10 */
  ctaInteraction: number;
  /** Expected form completion rate 0–10 */
  formCompletion: number;
  /** Expected trust level 0–10 */
  trustLevel: number;
}

// ── UX Report (full output of prediction engine) ──────────────────────────────

export interface UXReport {
  /** All 17 individual UX metric scores (0–10 each) */
  metrics: UXMetrics;
  /** Weighted aggregate UX score (0–10) */
  overallUXScore: number;
  /** Human-readable conversion prediction */
  conversionPrediction: ConversionPrediction;
  /** Confidence in prediction (0–1) */
  confidence: number;
  /** Predicted behavioral signals */
  behaviorPredictions: UXBehaviorPredictions;
  /** Top UX issues found (max 5) */
  topIssues: string[];
  /** UX strengths detected (max 3) */
  strengths: string[];
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface UXLearningRecord {
  buildId: string;
  overallUXScore: number;
  conversionPrediction: ConversionPrediction;
  metrics: UXMetrics;
  evaluatorScore: number;
  repairTriggered: boolean;
  sectionOrder: string[];
  recordedAt: number;
}

export interface UXLearningInput {
  buildId: string;
  uxReport: UXReport;
  evaluatorScore: number;
  repairTriggered: boolean;
  sectionOrder: string[];
  dnaId?: string;
}

// ── Heuristic scoring input ───────────────────────────────────────────────────

export interface UXScoringInput {
  code: string;
  sectionOrder: string[];
  authState?: string;
  isDashboard?: boolean;
  isForm?: boolean;
  hasPricing?: boolean;
}
