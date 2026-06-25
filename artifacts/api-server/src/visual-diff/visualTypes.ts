// ── V7.3.4 Visual Diff Types ──────────────────────────────────────────────────
// All types for the visual intelligence layer. Analysis is static code-based
// (no headless browser) — infers visual quality from HTML/JSX/Tailwind patterns.

export type Viewport = 'desktop' | 'tablet' | 'mobile';
export type IssueSeverity = 'critical' | 'major' | 'minor';

export interface VisualIssue {
  category: 'hero' | 'cta' | 'layout' | 'responsive' | 'dom' | 'regression';
  severity: IssueSeverity;
  message: string;
  region?: VisualRegion;
  repairSuggestion?: string;
}

export interface VisualRegion {
  section: string;
  component?: string;
  viewport?: Viewport;
}

export interface VisualSnapshot {
  candidateId: string;
  buildId: string;
  viewport: Viewport;
  screenshotPath: string; // logical path (no real file written)
  capturedAt: string;
  structureHash: string; // fingerprint for quick diff
  sectionCount: number;
  componentCount: number;
  hasHero: boolean;
  hasCTA: boolean;
  hasNav: boolean;
  hasFooter: boolean;
  responsiveClasses: string[];
  gridClasses: string[];
}

export interface VisualCandidate {
  label: 'A' | 'B' | 'C' | 'winner' | 'repaired';
  candidateId: string;
  buildId: string;
  snapshot: VisualSnapshot;
  heroScore: number;
  ctaScore: number;
  layoutScore: number;
  responsiveScore: number;
  visualScore: number; // 0–10 composite
  issues: VisualIssue[];
}

export interface VisualComparison {
  candidateA: string;
  candidateB: string;
  similarityScore: number; // 0–100
  layoutShiftPercent: number;
  spacingDeltaPercent: number;
  componentDisplacement: number;
  regionMismatches: string[];
}

export interface VisualScore {
  heroScore: number;
  ctaScore: number;
  layoutScore: number;
  responsiveScore: number;
  visualScore: number; // weighted composite 0–10
}

export interface VisualAnalysisResult extends VisualScore {
  issues: VisualIssue[];
  domIssues: string[];
  snapshot: Omit<VisualSnapshot, 'candidateId' | 'buildId' | 'screenshotPath' | 'capturedAt'>;
}

export interface VisualValidationResult {
  passed: boolean;
  regression: boolean;
  regressionType?: 'visual' | 'layout' | 'cta';
  winnerScore: number;
  repairedScore: number;
  delta: number;
  details: string;
}

export interface VisualDiffReport {
  buildId: string;
  candidateScores: Array<{ label: string; visualScore: number }>;
  comparisons: VisualComparison[];
  winnerVisualScore: number;
  repairedVisualScore?: number;
  regressionDetected: boolean;
  issues: VisualIssue[];
  generatedAt: string;
}

export interface VisualMetrics {
  totalBuilds: number;
  averageVisualScore: number;
  averageHeroScore: number;
  averageCTAScore: number;
  averageLayoutScore: number;
  averageResponsiveScore: number;
  visualRegressionRate: number;
  repairImprovementRate: number;
  topVisualPatterns: string[];
  worstVisualPatterns: string[];
}

// Hero-specific analysis types
export interface HeroAnalysis {
  score: number;
  hasHeadline: boolean;
  hasCTA: boolean;
  hasTrustSignal: boolean;
  hasBadge: boolean;
  hasDescription: boolean;
  hasHeroHeight: boolean;
  issues: VisualIssue[];
}

// CTA-specific analysis types
export interface CTAAnalysis {
  score: number;
  primaryCTAVisible: boolean;
  secondaryCTAVisible: boolean;
  ctaCount: number;
  hasContrast: boolean;
  placement: 'above-fold' | 'below-fold' | 'none';
  clickHierarchy: boolean;
  issues: VisualIssue[];
}

// Layout-specific analysis types
export interface LayoutAnalysis {
  score: number;
  hasGrid: boolean;
  hasFlex: boolean;
  hasGap: boolean;
  alignmentConsistent: boolean;
  sectionCount: number;
  hasWhitespace: boolean;
  hasCardBalance: boolean;
  issues: VisualIssue[];
}

// Responsive-specific analysis types
export interface ResponsiveAnalysis {
  score: number;
  hasBreakpoints: boolean;
  hasMobileStacking: boolean;
  hasResponsiveText: boolean;
  hasResponsiveGrid: boolean;
  noHardcodedWidths: boolean;
  mobileNavHandled: boolean;
  issues: VisualIssue[];
}

// DOM analysis types
export interface DOMAnalysis {
  overflowIssues: string[];
  emptySections: string[];
  duplicateSections: string[];
  missingCTA: boolean;
  missingHeader: boolean;
  missingFooter: boolean;
  brokenGrids: string[];
  issues: VisualIssue[];
}
