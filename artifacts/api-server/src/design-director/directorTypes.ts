// ── V8.3 Autonomous AI Design Director — Types ─────────────────────────────────
// Central type definitions for the strategic design review engine.

// ── 25 Review Categories ──────────────────────────────────────────────────────

export type DirectorCategory =
  | 'visualHierarchy'
  | 'typography'
  | 'spacing'
  | 'composition'
  | 'layoutRhythm'
  | 'brandConsistency'
  | 'premiumFeel'
  | 'modernity'
  | 'trust'
  | 'emotionalImpact'
  | 'storytelling'
  | 'ctaPlacement'
  | 'pricingPresentation'
  | 'dashboardExperience'
  | 'navigation'
  | 'forms'
  | 'motion'
  | 'accessibility'
  | 'performance'
  | 'responsiveness'
  | 'componentConsistency'
  | 'tokenConsistency'
  | 'dnaAlignment'
  | 'uxAlignment'
  | 'conversionAlignment';

export const ALL_DIRECTOR_CATEGORIES: DirectorCategory[] = [
  'visualHierarchy', 'typography', 'spacing', 'composition', 'layoutRhythm',
  'brandConsistency', 'premiumFeel', 'modernity', 'trust', 'emotionalImpact',
  'storytelling', 'ctaPlacement', 'pricingPresentation', 'dashboardExperience',
  'navigation', 'forms', 'motion', 'accessibility', 'performance', 'responsiveness',
  'componentConsistency', 'tokenConsistency', 'dnaAlignment', 'uxAlignment',
  'conversionAlignment',
];

// ── Severity ──────────────────────────────────────────────────────────────────

export type DirectorSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export function scoreSeverity(score: number): DirectorSeverity {
  if (score >= 7) return 'Low';
  if (score >= 5) return 'Medium';
  if (score >= 3) return 'High';
  return 'Critical';
}

// ── Per-Category Review Item ──────────────────────────────────────────────────

export interface DirectorCategoryReview {
  category:            DirectorCategory;
  score:               number;           // 0–10
  severity:            DirectorSeverity;
  confidence:          number;           // 0–1
  reason:              string;
  recommendation:      string;
  expectedImprovement: string;
}

// ── Full Director Review ──────────────────────────────────────────────────────

export interface DirectorReview {
  /** Weighted overall director score (0–10) */
  overallScore:         number;
  /** All 25 category reviews */
  categoryReviews:      DirectorCategoryReview[];
  /** Top 5 strategic recommendations */
  topRecommendations:   string[];
  /** Critical issues only (score < 3) */
  criticalIssues:       string[];
  /** Categories that improved most vs. prior builds */
  mostImprovedCategories: DirectorCategory[];
  /** Most common problem categories */
  mostCommonProblems:   DirectorCategory[];
  /** Strategic creative direction summary (1–3 sentences) */
  creativeDirection:    string;
  /** Confidence in the overall review (0–1) */
  confidence:           number;
}

// ── Input for design review ───────────────────────────────────────────────────

export interface DirectorReviewInput {
  code:              string;
  sectionOrder:      string[];
  dnaId?:            string;
  dnaTheme?:         Record<string, unknown> | null;
  dnaMotion?:        Record<string, unknown> | null;
  uxScore?:          number;
  uxTopIssues?:      string[];
  conversionPrediction?: string;
  criticScore?:      number;
  criticIssues?:     string[];
  evaluatorScore?:   number;
  visualScore?:      number;
  accessibilityScore?: number;
  motionScore?:      number;
  tokenScore?:       number;
  treeScore?:        number;
  isDashboard?:      boolean;
  isForm?:           boolean;
  hasPricing?:       boolean;
  authState?:        string;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface DirectorLearningRecord {
  buildId:       string;
  overallScore:  number;
  categoryScores: Record<DirectorCategory, number>;
  criticalCount: number;
  dnaId:         string;
  improved:      boolean;
  recordedAt:    number;
}

export interface DirectorLearningInput {
  buildId:        string;
  directorReview: DirectorReview;
  dnaId?:         string;
  evaluatorScore?: number;
}
