// ── V10.1 — Autonomous Meta Intelligence Engine — Types ────────────────────────
// All TypeScript interfaces for the Meta Intelligence Engine.
// Zero LLM calls. Fully deterministic. Completely additive.

// ── Context (input) ────────────────────────────────────────────────────────────
export interface MetaContext {
  buildId: string;
  prompt: string;
  complexity: 'simple' | 'standard' | 'enterprise';

  // Upstream engine scores (0-10)
  reasoningScore:    number;
  planningScore:     number;
  executionScore:    number;
  adaptiveScore:     number;
  optimizationScore: number;

  // Optional quality signals
  qualityScore?:    number;
  runtimeScore?:    number;
  knowledgeScore?:  number;
  workflowScore?:   number;

  // Agent telemetry
  agentLatencies?:    Record<string, number>;   // agent → ms
  agentFailureRates?: Record<string, number>;   // agent → 0-1
  repairAttempts?:    number;
  retryCount?:        number;

  // Resource telemetry
  tokenEfficiency?:        number;   // 0-1
  cacheHitRate?:           number;   // 0-1
  parallelEfficiency?:     number;   // 0-1
  memoryUsage?:            number;   // MB
  historicalSuccessRate?:  number;   // 0-1
  historicalBuildTimeMs?:  number;

  // Optimization engine outputs (optional passthrough)
  optimizationPerformanceScore?: number;
  optimizationCostScore?:        number;
  optimizationTokenScore?:       number;
}

// ── Engine evaluation ──────────────────────────────────────────────────────────
export interface EngineEvaluation {
  name:                 string;
  score:                number;    // 0-10
  confidence:           number;    // 0-1
  risk:                 'low' | 'medium' | 'high';
  improvementPotential: number;    // 0-10
  stability:            number;    // 0-10
  recommendations:      string[];
}

// ── Module scoring ─────────────────────────────────────────────────────────────
export interface ModuleScore {
  name:            string;
  efficiency:      number;    // 0-10
  quality:         number;    // 0-10
  reliability:     number;    // 0-10
  scalability:     number;    // 0-10
  maintainability: number;    // 0-10
  performance:     number;    // 0-10
  learning:        number;    // 0-10
  optimization:    number;    // 0-10
  cost:            number;    // 0-10
  confidence:      number;    // 0-10
  overall:         number;    // weighted average
}

// ── Sub-blueprint types ────────────────────────────────────────────────────────
export interface MetaAnalysisBlueprint {
  engineCount:         number;
  analyzedEngines:     string[];
  weakModules:         string[];
  slowModules:         string[];
  expensiveModules:    string[];
  unstableModules:     string[];
  unusedIntelligence:  string[];
  duplicateWork:       string[];
  bottlenecks:         string[];
  successPatterns:     string[];
  failurePatterns:     string[];
  analysisScore:       number;    // 0-10
  recommendations:     string[];
}

export interface MetaPlannerBlueprint {
  plannerRecommendations:   string[];
  workflowRecommendations:  string[];
  knowledgeRecommendations: string[];
  executionRecommendations: string[];
  reasoningRecommendations: string[];
  repairRecommendations:    string[];
  retryRecommendations:     string[];
  resourceRecommendations:  string[];
  parallelRecommendations:  string[];
  orderingRecommendations:  string[];
  plannerScore:             number;    // 0-10
}

export interface MetaEvaluatorBlueprint {
  engines:       EngineEvaluation[];
  bestEngine:    string;
  worstEngine:   string;
  avgScore:      number;
  evaluatorScore: number;    // 0-10
}

export interface MetaScoringBlueprint {
  moduleScores:   ModuleScore[];
  topModule:      string;
  bottomModule:   string;
  avgModuleScore: number;
  scoringScore:   number;    // 0-10
}

export interface MetaPredictionBlueprint {
  predictedQualityScore:  number;    // 0-10
  predictedBuildTimeMs:   number;
  predictedCost:          number;    // USD
  predictedSuccessRate:   number;    // 0-1
  predictionConfidence:   number;    // 0-1
  predictionScore:        number;    // 0-10
  recommendations:        string[];
}

export interface MetaRecommendationsBlueprint {
  immediate:         string[];   // act now
  shortTerm:         string[];   // next build
  longTerm:          string[];   // systemic
  totalCount:        number;
  recommendationScore: number;   // 0-10
}

export interface MetaEvolutionBlueprint {
  nextImprovementTargets: string[];
  evolutionPriority:      'performance' | 'quality' | 'cost' | 'reliability' | 'balanced';
  evolutionScore:         number;    // 0-10
  maturityLevel:          'bootstrap' | 'developing' | 'mature' | 'advanced';
  recommendations:        string[];
}

export interface MetaHealthBlueprint {
  systemHealth:      number;    // 0-10
  moduleHealth:      number;    // 0-10
  pipelineHealth:    number;    // 0-10
  agentHealth:       number;    // 0-10
  learningHealth:    number;    // 0-10
  memoryHealth:      number;    // 0-10
  optimizationHealth: number;  // 0-10
  overallHealth:     number;    // weighted average
  healthStatus:      'critical' | 'degraded' | 'healthy' | 'optimal';
}

export interface MetaDiagnosticsBlueprint {
  deadModules:       string[];
  duplicateModules:  string[];
  unusedModules:     string[];
  slowModules:       string[];
  unstableModules:   string[];
  overloadedModules: string[];
  diagnosticScore:   number;    // 0-10 (higher = fewer issues)
  issueCount:        number;
}

// ── Validation ─────────────────────────────────────────────────────────────────
export interface MetaValidation {
  architectureScore:   number;   // 0-10
  performanceScore:    number;
  learningScore:       number;
  optimizationScore:   number;
  reasoningScore:      number;
  planningScore:       number;
  executionScore:      number;
  workflowScore:       number;
  knowledgeScore:      number;
  confidenceScore:     number;
  maintainabilityScore: number;
  reliabilityScore:    number;
  overallMetaScore:    number;   // weighted average of 12 dims
  valid:               boolean;
  warnings:            string[];
}

// ── Main blueprint ─────────────────────────────────────────────────────────────
export interface MetaBlueprint {
  buildId:         string;
  analysis:        MetaAnalysisBlueprint;
  planner:         MetaPlannerBlueprint;
  evaluator:       MetaEvaluatorBlueprint;
  scoring:         MetaScoringBlueprint;
  prediction:      MetaPredictionBlueprint;
  recommendations: MetaRecommendationsBlueprint;
  evolution:       MetaEvolutionBlueprint;
  health:          MetaHealthBlueprint;
  diagnostics:     MetaDiagnosticsBlueprint;
  validation:      MetaValidation;
  overallMetaScore: number;
  contextString:   string;
  recordedAt:      number;
  version:         number;
}

// ── Learning & Metrics ─────────────────────────────────────────────────────────
export interface MetaLearningRecord {
  buildId:           string;
  overallMetaScore:  number;
  buildSucceeded:    boolean;
  buildTimeMs:       number;
  predictedQuality:  number;
  actualQuality:     number;
  complexity:        'simple' | 'standard' | 'enterprise';
  healthStatus:      string;
  issueCount:        number;
  recordedAt:        number;
}

export interface MetaMetricRecord {
  overallMetaScore:    number;
  architectureScore:   number;
  performanceScore:    number;
  learningScore:       number;
  optimizationScore:   number;
  healthScore:         number;
  confidenceScore:     number;
  diagnosticScore:     number;
  recommendationCount: number;
  adaptationTimeMs:    number;
  complexity:          'simple' | 'standard' | 'enterprise';
  recordedAt:          number;
}

export interface MetaLearningStats {
  totalRecords:          number;
  averageMetaScore:      number;
  buildSuccessRate:      number;
  averageBuildTimeMs:    number;
  predictionAccuracy:    number;
  byComplexity:          Record<string, { count: number; avgScore: number }>;
  byHealthStatus:        Record<string, { count: number; avgScore: number }>;
}

export interface MetaMetricsSnapshot {
  overallMetaScore:    number;
  architectureScore:   number;
  performanceScore:    number;
  learningScore:       number;
  optimizationScore:   number;
  healthScore:         number;
  confidenceScore:     number;
  diagnosticScore:     number;
  recommendationCount: number;
  adaptationSuccessRate: number;
  learningStatistics:  MetaLearningStats;
  plannerDistribution: Record<string, number>;
  persistenceHealth: {
    totalSnapshots:  number;
    currentVersion:  number;
    capacityUsed:    number;
    oldestVersion:   number | null;
    newestVersion:   number | null;
  };
}

// ── Persistence ────────────────────────────────────────────────────────────────
export interface MetaSnapshot {
  version:   number;
  buildId:   string;
  blueprint: MetaBlueprint;
  savedAt:   number;
}
