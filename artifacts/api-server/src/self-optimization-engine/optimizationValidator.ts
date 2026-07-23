// ── V10.0 — Optimization Validator ────────────────────────────────────────────
// 13-dimension scoring. Each 0-10. Overall = weighted average.
import type {
  OptimizationValidation,
  PerformanceBlueprint,
  LatencyBlueprint,
  CostBlueprint,
  QualityBlueprint,
  WorkflowBlueprint,
  SchedulerBlueprint,
  ParallelBlueprint,
  ResourceBlueprint,
  TokenBlueprint,
  RepairBlueprint,
  RetryBlueprint,
  ModelBlueprint,
  ConfidenceBlueprint,
} from './optimizationTypes.js';

// Weights must sum to 1.00
const VALIDATION_WEIGHTS = {
  performance:    0.12,
  latency:        0.10,
  cost:           0.10,
  quality:        0.12,
  workflow:       0.08,
  scheduling:     0.06,
  parallelism:    0.08,
  resourceUsage:  0.08,
  tokenEfficiency:0.08,
  repairStrategy: 0.06,
  retryStrategy:  0.05,
  modelAllocation:0.04,
  confidence:     0.03,
} as const;

// Verify compile-time sum (approximate): 0.12+0.10+0.10+0.12+0.08+0.06+0.08+0.08+0.08+0.06+0.05+0.04+0.03 = 1.00 ✓

export function validateOptimization(
  performance:  PerformanceBlueprint,
  latency:      LatencyBlueprint,
  cost:         CostBlueprint,
  quality:      QualityBlueprint,
  workflow:     WorkflowBlueprint,
  scheduler:    SchedulerBlueprint,
  parallel:     ParallelBlueprint,
  resource:     ResourceBlueprint,
  token:        TokenBlueprint,
  repair:       RepairBlueprint,
  retry:        RetryBlueprint,
  model:        ModelBlueprint,
  confidence:   ConfidenceBlueprint,
): OptimizationValidation {
  const performanceScore    = performance.performanceScore;
  const latencyScore        = latency.latencyScore;
  const costScore           = cost.costScore;
  const qualityScore        = quality.qualityScore;
  const workflowScore       = workflow.workflowScore;
  const schedulingScore     = scheduler.schedulerScore;
  const parallelismScore    = parallel.parallelScore;
  const resourceUsageScore  = resource.resourceScore;
  const tokenEfficiencyScore= token.tokenScore;
  const repairStrategyScore = repair.repairScore;
  const retryStrategyScore  = retry.retryScore;
  const modelAllocationScore= model.modelScore;
  const confidenceScore     = confidence.confidenceScore;

  const overallScore = Math.round((
    performanceScore     * VALIDATION_WEIGHTS.performance    +
    latencyScore         * VALIDATION_WEIGHTS.latency        +
    costScore            * VALIDATION_WEIGHTS.cost           +
    qualityScore         * VALIDATION_WEIGHTS.quality        +
    workflowScore        * VALIDATION_WEIGHTS.workflow       +
    schedulingScore      * VALIDATION_WEIGHTS.scheduling     +
    parallelismScore     * VALIDATION_WEIGHTS.parallelism    +
    resourceUsageScore   * VALIDATION_WEIGHTS.resourceUsage  +
    tokenEfficiencyScore * VALIDATION_WEIGHTS.tokenEfficiency+
    repairStrategyScore  * VALIDATION_WEIGHTS.repairStrategy +
    retryStrategyScore   * VALIDATION_WEIGHTS.retryStrategy  +
    modelAllocationScore * VALIDATION_WEIGHTS.modelAllocation+
    confidenceScore      * VALIDATION_WEIGHTS.confidence
  ) * 10) / 10;

  const warnings: string[] = [];
  if (performanceScore < 6) warnings.push('Performance score below threshold — check slow agents');
  if (costScore < 6) warnings.push('Cost score below threshold — high repair/retry cost');
  if (confidence.riskLevel === 'high') warnings.push('High execution risk — enable conservative mode');
  if (tokenEfficiencyScore < 6) warnings.push('Token efficiency low — enable compression');
  if (parallelismScore < 6) warnings.push('Low parallelism — consider wave-based execution');

  return {
    performanceScore,
    latencyScore,
    costScore,
    qualityScore,
    workflowScore,
    schedulingScore,
    parallelismScore,
    resourceUsageScore,
    tokenEfficiencyScore,
    repairStrategyScore,
    retryStrategyScore,
    modelAllocationScore,
    confidenceScore,
    overallScore,
    valid: overallScore >= 6.0,
    warnings,
  };
}
