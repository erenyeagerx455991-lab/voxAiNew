// ── V10.0 Autonomous Self-Optimization Engine — Types ─────────────────────────
// All TypeScript interfaces for the Self-Optimization Engine.
// Zero LLM calls. Fully deterministic. Completely additive.

// ── Context (input) ────────────────────────────────────────────────────────────
export interface SelfOptimizationContext {
  buildId: string;
  prompt: string;
  complexity: 'simple' | 'standard' | 'enterprise';

  // Upstream intelligence scores (0-10)
  reasoningScore: number;
  planningScore: number;
  executionScore: number;
  adaptiveScore: number;
  qualityScore?: number;
  runtimeScore?: number;
  knowledgeScore?: number;
  workflowScore?: number;

  // Resource telemetry
  tokenEfficiency?: number;          // 0-1
  totalTokenBudget?: number;
  expectedTotalCost?: number;        // USD
  historicalSuccessRate?: number;    // 0-1
  historicalBuildTimeMs?: number;

  // Agent telemetry
  agentLatencies?: Record<string, number>;     // agent → ms
  agentFailureRates?: Record<string, number>;  // agent → 0-1
  repairAttempts?: number;
  retryCount?: number;
  totalAgentCalls?: number;

  // Execution telemetry
  parallelEfficiency?: number;       // 0-1
  cacheHitRate?: number;             // 0-1
  compressionRatio?: number;         // 0-1
  memoryUsage?: number;              // MB
  idleTimeMs?: number;
  criticalPathMs?: number;
}

// ── Sub-blueprint types ────────────────────────────────────────────────────────
export interface PerformanceBlueprint {
  estimatedBuildTimeMs: number;
  slowAgents: string[];
  criticalPath: string[];
  bottlenecks: string[];
  parallelizableSteps: string[];
  performanceScore: number;         // 0-10
  recommendations: string[];
}

export interface LatencyBlueprint {
  p50EstimateMs: number;
  p95EstimateMs: number;
  agentLatencyBudgets: Record<string, number>;
  latencyScore: number;
  targetLatencyMs: number;
  recommendations: string[];
}

export interface TokenBlueprint {
  estimatedTotalTokens: number;
  promptTokenBudget: number;
  completionTokenBudget: number;
  compressionOpportunities: string[];
  duplicateContextSavings: number;
  tokenScore: number;
  recommendations: string[];
}

export interface CostBlueprint {
  estimatedTotalCost: number;
  repairCostEstimate: number;
  retryCostEstimate: number;
  llmCallCostEstimate: number;
  costScore: number;
  costMode: 'aggressive' | 'moderate' | 'none';
  recommendations: string[];
}

export interface WorkflowBlueprint {
  recommendedOrder: string[];
  skippableSteps: string[];
  mergeableSteps: string[][];
  workflowScore: number;
  recommendations: string[];
}

export interface ParallelBlueprint {
  parallelGroups: string[][];
  blockingChains: string[];
  idleWorkerCount: number;
  parallelScore: number;
  maxDegree: number;
  recommendations: string[];
}

export interface SchedulerBlueprint {
  priority: 'high' | 'normal' | 'low';
  schedulingMode: 'eager' | 'lazy' | 'batch';
  queueStrategy: 'fifo' | 'priority' | 'round-robin';
  schedulerScore: number;
  recommendations: string[];
}

export interface RepairBlueprint {
  repairThreshold: number;          // 0-10
  maxRepairPasses: number;
  repairConfidence: number;         // 0-1
  repairNecessary: boolean;
  repairScore: number;
  recommendations: string[];
}

export interface RetryBlueprint {
  maxRetries: number;
  retryDelay: number;               // ms
  retryStrategy: 'exponential' | 'linear' | 'fixed' | 'none';
  retryConfidence: number;          // 0-1
  retryScore: number;
  recommendations: string[];
}

export interface TimeoutBlueprint {
  globalTimeoutMs: number;
  agentTimeouts: Record<string, number>;
  timeoutScore: number;
  recommendations: string[];
}

export interface ResourceBlueprint {
  cpuAllocation: number;            // %
  memoryAllocationMB: number;
  diskBudgetMB: number;
  networkBudget: number;
  llmConcurrency: number;
  apiConcurrency: number;
  cacheAllocationMB: number;
  resourceScore: number;
  recommendations: string[];
}

export interface MemoryBlueprint {
  memoryMode: 'minimal' | 'standard' | 'generous';
  estimatedPeakMB: number;
  garbageCollectionHint: 'aggressive' | 'standard' | 'lazy';
  memoryScore: number;
  recommendations: string[];
}

export interface CacheBlueprint {
  cacheEnabled: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  estimatedHitRate: number;         // 0-1
  cacheTtlMs: number;
  cacheScore: number;
  recommendations: string[];
}

export interface PromptBlueprint {
  compressionEnabled: boolean;
  compressionRatio: number;         // 0-1
  deduplicationEnabled: boolean;
  estimatedSavingsTokens: number;
  promptScore: number;
  recommendations: string[];
}

export interface ContextBlueprint {
  contextWindowUsage: number;       // 0-1
  unusedContextFraction: number;
  contextReductionEnabled: boolean;
  contextScore: number;
  recommendations: string[];
}

export interface QualityBlueprint {
  qualityThreshold: number;         // 0-10
  repairThreshold: number;          // 0-10
  candidateCount: number;
  executionMode: 'fast' | 'standard' | 'thorough';
  validationStrictness: 'strict' | 'standard' | 'permissive';
  qualityScore: number;
  recommendations: string[];
}

export interface AgentBlueprint {
  agentScores: Record<string, AgentOptimizationScore>;
  lowPerformingAgents: string[];
  highPerformingAgents: string[];
  agentScore: number;
  recommendations: string[];
}

export interface AgentOptimizationScore {
  efficiency: number;    // 0-10
  latency: number;       // 0-10
  quality: number;       // 0-10
  cost: number;          // 0-10
  successRate: number;   // 0-10
  confidence: number;    // 0-10
  composite: number;     // 0-10
}

export interface ModelBlueprint {
  recommendedTier: 'fast' | 'standard' | 'quality' | 'premium';
  modelSelectionRationale: string;
  qualityWeight: number;            // 0-1
  latencyWeight: number;            // 0-1
  costWeight: number;               // 0-1
  modelScore: number;
  recommendations: string[];
}

export interface OrderingBlueprint {
  recommendedOrder: string[];
  orderingStrategy: 'critical-path' | 'quality-first' | 'cost-first' | 'balanced';
  orderingScore: number;
  recommendations: string[];
}

export interface ConfidenceBlueprint {
  executionConfidence: number;      // 0-1
  confidenceFactors: string[];
  confidenceScore: number;          // 0-10
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

// ── Validation ─────────────────────────────────────────────────────────────────
export interface OptimizationValidation {
  performanceScore:      number;   // 0-10
  latencyScore:          number;
  costScore:             number;
  qualityScore:          number;
  workflowScore:         number;
  schedulingScore:       number;
  parallelismScore:      number;
  resourceUsageScore:    number;
  tokenEfficiencyScore:  number;
  repairStrategyScore:   number;
  retryStrategyScore:    number;
  modelAllocationScore:  number;
  confidenceScore:       number;
  overallScore:          number;   // weighted average of 13 dims
  valid:                 boolean;
  warnings:              string[];
}

// ── Main blueprint ─────────────────────────────────────────────────────────────
export interface OptimizationBlueprint {
  buildId: string;
  performance:  PerformanceBlueprint;
  latency:      LatencyBlueprint;
  token:        TokenBlueprint;
  cost:         CostBlueprint;
  workflow:     WorkflowBlueprint;
  parallel:     ParallelBlueprint;
  scheduler:    SchedulerBlueprint;
  repair:       RepairBlueprint;
  retry:        RetryBlueprint;
  timeout:      TimeoutBlueprint;
  resource:     ResourceBlueprint;
  memory:       MemoryBlueprint;
  cache:        CacheBlueprint;
  prompt:       PromptBlueprint;
  context:      ContextBlueprint;
  quality:      QualityBlueprint;
  agent:        AgentBlueprint;
  model:        ModelBlueprint;
  ordering:     OrderingBlueprint;
  confidence:   ConfidenceBlueprint;
  validation:   OptimizationValidation;
  overallOptimizationScore: number;
  contextString: string;
  recordedAt: number;
  version: number;
}

// ── Learning & Metrics ─────────────────────────────────────────────────────────
export interface OptimizationLearningRecord {
  buildId: string;
  overallOptimizationScore: number;
  buildSucceeded: boolean;
  buildTimeMs: number;
  estimatedBuildTimeMs: number;
  totalCostActual: number;
  totalCostEstimated: number;
  qualityScoreActual: number;
  repairAttempts: number;
  retryCount: number;
  complexity: 'simple' | 'standard' | 'enterprise';
  modelTier: string;
  recordedAt: number;
}

export interface OptimizationMetricRecord {
  overallOptimizationScore:   number;
  performanceScore:           number;
  latencyScore:               number;
  costScore:                  number;
  qualityScore:               number;
  workflowScore:              number;
  parallelScore:              number;
  resourceScore:              number;
  tokenScore:                 number;
  repairScore:                number;
  retryScore:                 number;
  modelScore:                 number;
  agentUtilization:           number;
  adaptationTimeMs:           number;
  complexity:                 'simple' | 'standard' | 'enterprise';
  recordedAt:                 number;
}

export interface OptimizationLearningStats {
  totalRecords: number;
  averageOptimizationScore: number;
  buildSuccessRate: number;
  averageBuildTimeMs: number;
  timeAccuracy: number;
  costAccuracy: number;
  byComplexity: Record<string, { count: number; avgScore: number }>;
  byModelTier: Record<string, { count: number; avgScore: number }>;
}

export interface OptimizationMetricsSnapshot {
  overallOptimizationScore:   number;
  performanceScore:           number;
  latencyScore:               number;
  costScore:                  number;
  qualityScore:               number;
  workflowScore:              number;
  parallelScore:              number;
  resourceScore:              number;
  tokenScore:                 number;
  repairScore:                number;
  retryScore:                 number;
  modelScore:                 number;
  adaptationSuccessRate:      number;
  learningStatistics:         OptimizationLearningStats;
  plannerDistribution:        Record<string, number>;
  persistenceHealth: {
    totalSnapshots: number;
    currentVersion: number;
    capacityUsed: number;
    oldestVersion: number | null;
    newestVersion: number | null;
  };
}

// ── Persistence ────────────────────────────────────────────────────────────────
export interface OptimizationSnapshot {
  version:    number;
  buildId:    string;
  blueprint:  OptimizationBlueprint;
  savedAt:    number;
}
