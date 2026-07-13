// ── V9.5 Autonomous Reasoning & Decision Intelligence Engine — Types ──────────
//
// The reasoning-driven "thinking brain" that runs before the Product Manager.
// It does NOT generate UI, code, APIs, or infrastructure — only structured
// reasoning + decision-making metadata consumed by every downstream agent.
// Static/deterministic — no new outbound LLM calls.

/** 25 independent reasoning domains from the V9.5 spec. */
export type ReasoningDomain =
  | 'Business' | 'Product' | 'Architecture' | 'UI' | 'Backend'
  | 'Infrastructure' | 'Security' | 'QA' | 'Performance' | 'Runtime'
  | 'Cost' | 'Accessibility' | 'Scalability' | 'Reliability'
  | 'Maintainability' | 'Deployment' | 'UserExperience' | 'Conversion'
  | 'Risk' | 'Priority' | 'Dependency' | 'Constraint' | 'Resource'
  | 'Execution' | 'Failure';

export const ALL_REASONING_DOMAINS: ReasoningDomain[] = [
  'Business', 'Product', 'Architecture', 'UI', 'Backend',
  'Infrastructure', 'Security', 'QA', 'Performance', 'Runtime',
  'Cost', 'Accessibility', 'Scalability', 'Reliability',
  'Maintainability', 'Deployment', 'UserExperience', 'Conversion',
  'Risk', 'Priority', 'Dependency', 'Constraint', 'Resource',
  'Execution', 'Failure',
];

/** Loose upstream signal bag — kept optional/untyped to avoid coupling to
 *  every upstream step's exact output shape (mirrors the V9.4 pattern). */
export interface ReasoningContext {
  prompt:                string;
  buildId:                string;
  complexity:            'simple' | 'standard' | 'enterprise';
  productScore?:          number;
  frontendScore?:         number;
  backendScore?:          number;
  devopsScore?:           number;
  qaScore?:               number;
  runtimeScore?:          number;
  securityScore?:         number;
  knowledgeScore?:        number;
  tokenEfficiency?:       number;  // 0-1
  fallbackPrediction?:    number;  // 0-1
  totalTokenBudget?:      number;
  expectedTotalCost?:     number;
}

export interface GoalSet {
  primaryGoal:      string;
  secondaryGoals:   string[];
  hiddenGoals:      string[];
  businessGoal:     string;
  technicalGoal:    string;
  userGoal:         string;
  qualityGoal:      string;
  successCriteria:  string[];
}

export type ConstraintLevel = 'low' | 'medium' | 'high';

export interface ConstraintSet {
  budget:        ConstraintLevel;
  time:          ConstraintLevel;
  complexity:    ConstraintLevel;
  performance:   ConstraintLevel;
  security:      ConstraintLevel;
  compliance:    ConstraintLevel;
  platform:      string;
  browser:       string;
  device:        string;
  framework:     string;
  dependencies:  ConstraintLevel;
  resources:     ConstraintLevel;
  tokenBudget:   number;
  latency:       ConstraintLevel;
}

export interface AmbiguityReport {
  incompletePrompt:         boolean;
  conflictingRequests:      boolean;
  missingInformation:       boolean;
  implicitAssumptions:      string[];
  contradictoryObjectives:  boolean;
  ambiguityScore:           number;  // 0-10, higher = more ambiguous
  resolved:                 boolean;
  resolutionNotes:          string[];
}

export type TradeoffDimension =
  | 'Speed' | 'Quality' | 'Cost' | 'Maintainability' | 'Performance'
  | 'Security' | 'Scalability' | 'Accessibility' | 'DeveloperExperience'
  | 'UserExperience' | 'BusinessValue';

export const ALL_TRADEOFF_DIMENSIONS: TradeoffDimension[] = [
  'Speed', 'Quality', 'Cost', 'Maintainability', 'Performance',
  'Security', 'Scalability', 'Accessibility', 'DeveloperExperience',
  'UserExperience', 'BusinessValue',
];

export interface TradeoffAnalysis {
  scores:      Record<TradeoffDimension, number>; // 0-10
  dominant:    TradeoffDimension;
  weakest:     TradeoffDimension;
}

export type ReasoningPathId = 'A' | 'B' | 'C';

export interface ReasoningPath {
  id:            ReasoningPathId;
  name:          string;
  description:   string;
  qualityScore:  number; // 0-10
  costScore:     number; // 0-10 (higher = cheaper)
  speedScore:    number; // 0-10 (higher = faster)
  overallScore:  number; // 0-10
}

/** The 10 decision-matrix factors from the spec, each normalized 0-10. */
export interface DecisionMatrixFactors {
  businessValue:      number;
  technicalQuality:   number;
  risk:               number; // higher = lower risk (inverted for scoring)
  performance:        number;
  security:           number;
  maintainability:    number;
  runtimeCost:        number; // higher = cheaper
  complexity:         number; // higher = simpler
  confidence:         number;
  futureFlexibility:  number;
}

export interface DecisionMatrixResult {
  factors:         DecisionMatrixFactors;
  compositeScore:  number; // 0-10
}

export interface ConfidenceBundle {
  confidenceScore:          number; // 0-10
  reasoningScore:           number; // 0-10
  riskScore:                number; // 0-10 (higher = riskier)
  complexityScore:          number; // 0-10 (higher = more complex)
  decisionStability:        number; // 0-10
  alternativeAvailability:  number; // 0-10
}

export interface DecisionExplanation {
  decisionId:              string;
  chosenPath:              ReasoningPathId;
  whyChosen:               string;
  whyAlternativesRejected: Record<string, string>;
  expectedImpact:          string;
  expectedRisks:           string[];
  expectedBenefits:        string[];
  expectedTradeoffs:       string[];
  futureImplications:      string;
}

export type ConflictPair =
  | 'ProductVsPerformance' | 'SecurityVsUX' | 'PerformanceVsCost'
  | 'AccessibilityVsDesign' | 'MaintainabilityVsSpeed'
  | 'BusinessVsEngineering' | 'RuntimeVsQuality';

export const ALL_CONFLICT_PAIRS: ConflictPair[] = [
  'ProductVsPerformance', 'SecurityVsUX', 'PerformanceVsCost',
  'AccessibilityVsDesign', 'MaintainabilityVsSpeed',
  'BusinessVsEngineering', 'RuntimeVsQuality',
];

export interface ConflictResolution {
  pair:       ConflictPair;
  winner:     string;
  rationale:  string;
  severity:   'low' | 'medium' | 'high';
}

export type DecisionNodeType =
  | 'Goal' | 'Reasoning' | 'Decision' | 'Architecture'
  | 'Generation' | 'Evaluation' | 'ProductionResult';

export interface DecisionGraphNode {
  id:     string;
  type:   DecisionNodeType;
  label:  string;
  data?:  Record<string, unknown>;
}

export interface DecisionGraphEdge {
  from:     string;
  to:       string;
  relation: string;
  weight:   number;
}

export interface ReasoningBlueprint {
  buildId:            string;
  goals:              GoalSet;
  constraints:        ConstraintSet;
  ambiguity:          AmbiguityReport;
  tradeoffs:          TradeoffAnalysis;
  paths:              ReasoningPath[];
  chosenPath:         ReasoningPath;
  decisionMatrix:     DecisionMatrixResult;
  confidence:         ConfidenceBundle;
  explanation:        DecisionExplanation;
  conflictsResolved:  ConflictResolution[];
  domainScores:       Record<ReasoningDomain, number>;
  recordedAt:         number;
  version:            number;
}

export interface ReasoningLearningRecord {
  buildId:            string;
  chosenPathId:       ReasoningPathId;
  confidenceScore:    number;
  productionSuccess:  boolean;
  overallScore:       number; // 0-10
  recordedAt:         number;
}

export interface ReasoningLearningStats {
  totalRecords:           number;
  averageConfidence:      number;
  averageScore:           number;
  productionSuccessRate:  number;
  byPath:                 Record<string, { count: number; averageScore: number }>;
}

export interface ReasoningEngineTelemetrySnapshot {
  reasoningScore:        number;
  decisionQuality:       number;
  confidenceScore:       number;
  tradeoffAccuracy:      number;
  decisionConsistency:   number;
  riskAccuracy:          number;
  alternativeCoverage:   number;
  decisionLatency:       number; // ms
  learningStatistics:    ReasoningLearningStats;
  decisionGrowth:        number;
  persistenceHealth: {
    totalSnapshots: number;
    currentVersion: number;
    oldestVersion:  number | null;
    newestVersion:  number | null;
    capacityUsed:   number;
  };
}
