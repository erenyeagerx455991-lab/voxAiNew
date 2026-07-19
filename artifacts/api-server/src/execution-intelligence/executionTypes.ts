// ── V9.6 Autonomous Execution Intelligence Engine — Types ─────────────────────
//
// The Execution Intelligence layer sits between Reasoning (V9.5) and the Planner.
// Reasoning decides WHAT should happen; Execution Intelligence decides HOW.
// Static/deterministic — zero LLM calls.

// ── Task Graph ─────────────────────────────────────────────────────────────────

export type TaskId = string;

export type ExecutionMode =
  | 'sequential'
  | 'parallel'
  | 'hybrid'
  | 'critical-path-first'
  | 'cost-optimized';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type RetryPolicy = 'never' | 'linear' | 'exponential' | 'immediate';

export type BackoffStrategy = 'none' | 'linear' | 'exponential' | 'jitter';

export type FailureStrategy = 'abort' | 'skip' | 'retry' | 'fallback' | 'recover';

export interface TaskRetryConfig {
  retryCount:       number;
  policy:           RetryPolicy;
  backoff:          BackoffStrategy;
  retryWindowMs:    number;
  retryable:        boolean;
}

export interface TaskTimeoutConfig {
  timeoutMs:    number;
  onTimeout:    FailureStrategy;
  category:     'small' | 'medium' | 'large' | 'enterprise';
}

export interface ExecutionTask {
  id:               TaskId;
  name:             string;
  dependsOn:        TaskId[];
  priority:         TaskPriority;
  priorityScore:    number;      // 0–10
  estimatedCostTokens: number;
  estimatedTimeMs:  number;
  parallelizable:   boolean;
  retryable:        boolean;
  timeout:          TaskTimeoutConfig;
  rollbackRequired: boolean;
  isCritical:       boolean;     // on the critical path
  isBlocking:       boolean;     // blocks ≥1 other tasks
}

// ── Dependency Analysis ────────────────────────────────────────────────────────

export interface DependencyAnalysis {
  missingDependencies:   { taskId: TaskId; missing: TaskId[] }[];
  circularDependencies:  TaskId[][];   // each entry is a cycle
  redundantDependencies: { taskId: TaskId; redundant: TaskId[] }[];
  independentBranches:   TaskId[][];   // groups with no shared ancestors
  blockingChains:        TaskId[][];   // chains where one task blocks many
  hasCycle:              boolean;
  isValid:               boolean;
}

// ── Task Graph ─────────────────────────────────────────────────────────────────

export interface TaskGraph {
  tasks:             ExecutionTask[];
  taskMap:           Record<TaskId, ExecutionTask>;
  topologicalOrder:  TaskId[];
  dependencyAnalysis: DependencyAnalysis;
  totalTasks:        number;
  parallelizableTasks: number;
  criticalTasks:     number;
}

// ── Parallel Planning ──────────────────────────────────────────────────────────

export interface ParallelGroup {
  groupId:      string;
  tasks:        TaskId[];
  canRunWith:   string[]; // other groupIds that can execute in parallel
  estimatedMs:  number;
}

export interface ParallelPlan {
  groups:           ParallelGroup[];
  parallelGroups:   TaskId[][];   // flat: tasks that can run together
  parallelEfficiency: number;     // 0–1: ratio of parallel savings
  idleTimePrediction: number;     // ms saved by parallelism
  sequentialFallback: TaskId[];   // safe order if parallelism fails
}

// ── Critical Path ──────────────────────────────────────────────────────────────

export interface CriticalPathResult {
  path:                 TaskId[];
  criticalTasks:        TaskId[];
  blockingTasks:        TaskId[];
  bottlenecks:          TaskId[];
  estimatedCompletionMs: number;
  criticalPathDurationMs: number;
}

// ── Priority Plan ──────────────────────────────────────────────────────────────

export interface PriorityScore {
  taskId:         TaskId;
  priority:       TaskPriority;
  score:          number;  // 0–10
  businessValue:  number;
  userImpact:     number;
  dependencyDepth: number;
  risk:           number;
  executionCost:  number;
  estimatedDuration: number;
  criticality:    number;
}

// ── Retry Plan ─────────────────────────────────────────────────────────────────

export interface RetryPlan {
  taskId:        TaskId;
  config:        TaskRetryConfig;
  failureReason: 'network' | 'timeout' | 'provider' | 'validation' | 'user' | 'config' | 'unknown';
  shouldRetry:   boolean;
}

// ── Timeout Plan ───────────────────────────────────────────────────────────────

export interface TimeoutPlan {
  taskId:    TaskId;
  config:    TaskTimeoutConfig;
}

// ── Resource Plan ──────────────────────────────────────────────────────────────

export interface ResourceEstimate {
  cpu:              'low' | 'medium' | 'high';
  memoryMb:         number;
  llmCalls:         number;
  apiCalls:         number;
  diskMb:           number;
  networkKb:        number;
  cacheHits:        number;
  tempStorageMb:    number;
}

// ── Cost Plan ──────────────────────────────────────────────────────────────────

export interface CostEstimate {
  tokenUsage:         number;
  apiCostUsd:         number;
  infrastructureCost: number;
  totalCost:          number;
  costConfidence:     number;  // 0–1
}

// ── Time Plan ──────────────────────────────────────────────────────────────────

export interface TimeEstimate {
  minimumMs:          number;
  averageMs:          number;
  worstCaseMs:        number;
  criticalPathMs:     number;
  parallelSavingsMs:  number;
}

// ── Checkpoints ────────────────────────────────────────────────────────────────

export interface Checkpoint {
  id:            string;
  afterTaskId:   TaskId;
  reason:        'milestone' | 'cost-threshold' | 'critical-boundary' | 'recovery-point';
  supportsResume: boolean;
  supportsRollback: boolean;
}

// ── Resume Plan ────────────────────────────────────────────────────────────────

export type ResumeReason = 'crash' | 'restart' | 'timeout' | 'user-pause' | 'deployment-interrupt';

export interface ResumePlan {
  resumable:         boolean;
  lastCheckpoint:    string | null;
  resumeFromTaskId:  TaskId | null;
  skippableOnResume: TaskId[];
  resumeReasons:     ResumeReason[];
  estimatedResumeMs: number;
}

// ── Rollback Plan ──────────────────────────────────────────────────────────────

export interface RollbackPlan {
  rollbackTasks:       TaskId[];   // only affected tasks
  fullPipelineRestart: boolean;    // true only if no partial rollback is possible
  rollbackOrder:       TaskId[];
  estimatedRollbackMs: number;
}

// ── Failure Recovery ───────────────────────────────────────────────────────────

export interface FailureRecoveryPlan {
  failedTaskId:       TaskId;
  affectedTasks:      TaskId[];
  unaffectedTasks:    TaskId[];
  recoveryPath:       TaskId[];
  skipOnRecovery:     TaskId[];
  strategy:           FailureStrategy;
  estimatedRecoveryMs: number;
}

// ── Validation ─────────────────────────────────────────────────────────────────

export interface ExecutionValidationResult {
  taskGraphScore:       number;  // 0–10
  dependenciesScore:    number;
  parallelismScore:     number;
  criticalPathScore:    number;
  retryStrategyScore:   number;
  timeoutStrategyScore: number;
  resourceScore:        number;
  costScore:            number;
  recoveryScore:        number;
  overallScore:         number;  // weighted average
  valid:                boolean;
  warnings:             string[];
}

// ── Master Blueprint ───────────────────────────────────────────────────────────

export interface ExecutionIntelligenceBlueprint {
  buildId:          string;
  taskGraph:        TaskGraph;
  executionOrder:   TaskId[];
  parallelGroups:   TaskId[][];
  checkpoints:      Checkpoint[];
  retries:          Record<TaskId, TaskRetryConfig>;
  timeoutPolicies:  Record<TaskId, TaskTimeoutConfig>;
  rollbackPlan:     RollbackPlan;
  resumePlan:       ResumePlan;
  criticalPath:     CriticalPathResult;
  executionScore:   number;  // 0–10
  estimatedCost:    CostEstimate;
  estimatedTime:    TimeEstimate;
  resourceUsage:    ResourceEstimate;
  failureStrategy:  FailureStrategy;
  executionMode:    ExecutionMode;
  validation:       ExecutionValidationResult;
  recordedAt:       number;
  version:          number;  // set by persistence
}

// ── Learning ───────────────────────────────────────────────────────────────────

export interface ExecutionLearningRecord {
  buildId:              string;
  executionMode:        ExecutionMode;
  actualDurationMs:     number;
  estimatedDurationMs:  number;
  actualRetries:        number;
  failed:               boolean;
  recovered:            boolean;
  parallelEfficiency:   number;
  executionScore:       number;
  recordedAt:           number;
}

export interface ExecutionLearningStats {
  totalRecords:         number;
  averageDurationMs:    number;
  averageRetries:       number;
  failureRate:          number;
  recoveryRate:         number;
  parallelEfficiency:   number;
  costPredictionAccuracy: number;
  executionSuccessRate: number;
  byMode:               Record<string, { count: number; averageScore: number; avgDurationMs: number }>;
}

// ── Metrics ────────────────────────────────────────────────────────────────────

export interface ExecutionIntelligenceTelemetrySnapshot {
  executionScore:       number;
  parallelEfficiency:   number;
  averageDuration:      number;
  averageRetries:       number;
  failureRate:          number;
  recoveryRate:         number;
  learningStatistics:   ExecutionLearningStats;
  plannerDistribution:  Record<ExecutionMode, number>;
  persistenceHealth: {
    totalSnapshots: number;
    currentVersion: number;
    oldestVersion:  number | null;
    newestVersion:  number | null;
    capacityUsed:   number;
  };
  estimatedCost:    number;
  estimatedTime:    number;
}

// ── Context passed INTO the step ───────────────────────────────────────────────

export interface ExecutionIntelligenceContext {
  buildId:    string;
  complexity: 'simple' | 'standard' | 'enterprise';
  chosenPath: string;             // from ReasoningBlueprint.chosenPath.id
  reasoningScore: number;         // from ReasoningBlueprint.confidence.confidenceScore
  totalTokenBudget?: number;
  expectedTotalCost?: number;
  tokenEfficiency?: number;
  productScore?: number;
  frontendScore?: number;
  backendScore?: number;
  devopsScore?: number;
  qaScore?: number;
  runtimeScore?: number;
}
