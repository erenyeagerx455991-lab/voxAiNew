// ── V9.9 Autonomous Adaptive Intelligence Engine — Types ───────────────────────

// ── Context ────────────────────────────────────────────────────────────────────
export interface AdaptiveIntelligenceContext {
  buildId: string;
  prompt: string;
  complexity: 'simple' | 'standard' | 'enterprise';
  executionMode: string;
  chosenPath: string;
  reasoningScore: number;
  planningScore: number;
  executionScore: number;
  productScore?: number;
  frontendScore?: number;
  backendScore?: number;
  devopsScore?: number;
  qaScore?: number;
  totalTokenBudget?: number;
  expectedTotalCost?: number;
  tokenEfficiency?: number;
  historicalSuccessRate?: number;
  historicalBuildTimeMs?: number;
}

// ── Phase 1 — Runtime Adaptation ───────────────────────────────────────────────
export type RuntimeMode = 'fast' | 'balanced' | 'quality' | 'enterprise';
export type ResourcePressure = 'low' | 'medium' | 'high';

export interface RuntimeAdaptation {
  detectedMode: RuntimeMode;
  complexityFactor: number;      // 0-1
  resourcePressure: ResourcePressure;
  historicalSuccessRate: number; // 0-1
  adaptationRequired: boolean;
  adaptationReasons: string[];
}

// ── Phase 2 — Strategy Selection ───────────────────────────────────────────────
export type AdaptiveStrategy = 'speed' | 'cost' | 'quality' | 'balanced' | 'enterprise';

export interface StrategySelection {
  selectedStrategy: AdaptiveStrategy;
  strategyScore: number;     // 0-10
  speedScore: number;
  costScore: number;
  qualityScore: number;
  balancedScore: number;
  enterpriseScore: number;
  strategyRationale: string;
}

// ── Phase 3 — Agent Adaptation ─────────────────────────────────────────────────
export type AgentAdaptationAction = 'skip' | 'upgrade' | 'merge' | 'repeat' | 'downgrade' | 'normal';

export interface AgentAdaptationDecision {
  agent: string;
  action: AgentAdaptationAction;
  reason: string;
  priority: number; // 1-10
}

export interface AgentAdaptation {
  decisions: AgentAdaptationDecision[];
  agentsToSkip: string[];
  agentsToUpgrade: string[];
  agentsToMerge: string[][];
  agentsToRepeat: string[];
  agentsToDowngrade: string[];
  totalAgents: number;
  skippableCount: number;
}

// ── Phase 4 — Resource Adaptation ──────────────────────────────────────────────
export interface ResourceBudget {
  cpuBudget: number;     // 0-100 (relative units)
  memoryBudget: number;  // MB
  tokenBudget: number;   // max tokens
  apiBudget: number;     // max concurrent requests
  retryBudget: number;   // max retries per agent
  timeoutBudget: number; // ms per agent
}

// ── Phase 5 — Execution Adaptation ─────────────────────────────────────────────
export type ParallelismLevel = 'sequential' | 'partial' | 'full';
export type RetryMode = 'aggressive' | 'standard' | 'conservative';
export type RecoveryMode = 'fail-fast' | 'degrade' | 'resilient';
export type ExecutionOrder = 'critical-path-first' | 'cost-optimized' | 'quality-first' | 'balanced';

export interface ExecutionAdaptation {
  parallelism: ParallelismLevel;
  retryPolicy: RetryMode;
  recoveryPolicy: RecoveryMode;
  executionOrder: ExecutionOrder;
  maxParallelAgents: number;
}

// ── Phase 6 — Quality Adaptation ───────────────────────────────────────────────
export type QualityMode = 'strict' | 'standard' | 'permissive';

export interface QualityAdaptation {
  evaluationThreshold: number;   // 0-10
  repairThreshold: number;       // 0-10
  candidateCount: number;        // 1-3
  runtimePolicies: string[];
  qualityMode: QualityMode;
}

// ── Phase 7 — Failure Adaptation ───────────────────────────────────────────────
export type FailurePatternType =
  | 'frequent-failures'
  | 'slow-agents'
  | 'cost-spikes'
  | 'retry-storms'
  | 'recovery-loops';

export type FailureSeverity = 'low' | 'medium' | 'high';

export interface FailurePattern {
  type: FailurePatternType;
  severity: FailureSeverity;
  detected: boolean;
  description: string;
}

export interface AdaptiveRecoveryPlan {
  patterns: FailurePattern[];
  detectedCount: number;
  recoveryActions: string[];
  fallbackStrategy: string;
  circuitBreakerEnabled: boolean;
  degradationPath: string[];
}

// ── Phase 8 — Performance Adaptation ───────────────────────────────────────────
export type MemoryOptimization = 'none' | 'moderate' | 'aggressive';
export type LatencyTarget = 'fast' | 'balanced' | 'thorough';
export type CostOptimization = 'none' | 'moderate' | 'aggressive';
export type ThroughputMode = 'single' | 'batch';

export interface PerformanceAdaptation {
  targetBuildTimeMs: number;
  memoryOptimization: MemoryOptimization;
  latencyTarget: LatencyTarget;
  costOptimization: CostOptimization;
  throughputMode: ThroughputMode;
  estimatedBuildTimeMs: number;
  estimatedCost: number;
}

// ── Phase 9 — Adaptive Validator ───────────────────────────────────────────────
export interface AdaptiveValidation {
  adaptationQuality: number;      // 0-10
  resourceUsageScore: number;     // 0-10
  costEfficiencyScore: number;    // 0-10
  runtimeStabilityScore: number;  // 0-10
  learningQualityScore: number;   // 0-10
  adaptationAccuracyScore: number; // 0-10
  overallScore: number;           // 0-10
  valid: boolean;
  warnings: string[];
}

// ── Main Blueprint ──────────────────────────────────────────────────────────────
export interface AdaptiveBlueprint {
  buildId: string;
  runtimeAdaptation: RuntimeAdaptation;
  strategySelection: StrategySelection;
  agentAdaptation: AgentAdaptation;
  resourceBudget: ResourceBudget;
  executionAdaptation: ExecutionAdaptation;
  qualityAdaptation: QualityAdaptation;
  failureAdaptation: AdaptiveRecoveryPlan;
  performanceAdaptation: PerformanceAdaptation;
  validation: AdaptiveValidation;
  adaptiveScore: number; // 0-10
  contextString: string;
  recordedAt: number;
  version: number;
}

// ── Phase 10 — Learning ────────────────────────────────────────────────────────
export interface AdaptiveLearningRecord {
  buildId: string;
  strategy: AdaptiveStrategy;
  complexity: string;
  adaptiveScore: number;
  buildSucceeded: boolean;
  buildTimeMs: number;
  estimatedBuildTimeMs: number;
  agentsSkipped: number;
  costActual: number;
  costEstimated: number;
  failuresDetected: number;
  recordedAt: number;
}

export interface AdaptiveLearningStats {
  totalRecords: number;
  averageAdaptiveScore: number;
  buildSuccessRate: number;
  averageBuildTimeMs: number;
  timeAccuracy: number;   // 0-1
  costAccuracy: number;   // 0-1
  byStrategy: Record<string, { count: number; avgScore: number }>;
  byComplexity: Record<string, { count: number; avgScore: number }>;
}

// ── Phase 11 — Metrics ─────────────────────────────────────────────────────────
export interface AdaptiveMetricRecord {
  adaptiveScore: number;
  runtimeOptimizationScore: number;
  costOptimizationScore: number;
  qualityOptimizationScore: number;
  performanceGain: number;        // 0-1 relative improvement
  failureReduction: number;       // 0-1
  agentUtilization: number;       // 0-1
  adaptationTimeMs: number;
  strategy: AdaptiveStrategy;
  complexity: string;
  recordedAt: number;
}

export interface AdaptiveMetricsSnapshot {
  adaptiveScore: number;
  runtimeOptimizationScore: number;
  costOptimizationScore: number;
  qualityOptimizationScore: number;
  performanceGain: number;
  failureReduction: number;
  adaptationSuccessRate: number;
  learningStatistics: AdaptiveLearningStats;
  plannerDistribution: Record<string, number>;
  persistenceHealth: {
    totalSnapshots: number;
    currentVersion: number;
    capacityUsed: number;
    oldestVersion: number | null;
    newestVersion: number | null;
  };
}

// ── Phase 12 — Persistence ─────────────────────────────────────────────────────
export interface AdaptiveSnapshot {
  version: number;
  buildId: string;
  blueprint: AdaptiveBlueprint;
  savedAt: number;
}
