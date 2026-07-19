// ── V9.6 Execution Validator ──────────────────────────────────────────────────
// Scores the full ExecutionBlueprint on 10 dimensions, 0–10 each.
import type {
  ExecutionIntelligenceBlueprint, ExecutionValidationResult,
} from './executionTypes.js';

function clamp(n: number): number { return Math.max(0, Math.min(10, n)); }

export function validateExecutionBlueprint(bp: Omit<ExecutionIntelligenceBlueprint, 'validation' | 'recordedAt' | 'version'>): ExecutionValidationResult {
  const warnings: string[] = [];

  // 1. Task graph score: penalise if no tasks or invalid dependencies
  const depAnalysis = bp.taskGraph.dependencyAnalysis;
  const taskGraphScore = clamp(
    10
    - (depAnalysis.hasCycle ? 5 : 0)
    - (depAnalysis.missingDependencies.length > 0 ? 3 : 0)
    - (bp.taskGraph.totalTasks === 0 ? 10 : 0)
  );
  if (depAnalysis.hasCycle) warnings.push('Circular dependency detected in task graph');

  // 2. Dependencies score: reward clean graph
  const redundantPenalty = Math.min(3, depAnalysis.redundantDependencies.length);
  const dependenciesScore = clamp(10 - redundantPenalty - (depAnalysis.missingDependencies.length * 2));

  // 3. Parallelism score: reward parallel efficiency
  const parallelPct = bp.taskGraph.parallelizableTasks / Math.max(1, bp.taskGraph.totalTasks);
  const parallelismScore = clamp(parallelPct * 10);

  // 4. Critical path score: penalise if no critical path identified
  const critPathScore = bp.criticalPath.criticalTasks.length > 0
    ? clamp(10 - Math.min(5, bp.criticalPath.bottlenecks.length))
    : 4;
  const criticalPathScore = critPathScore;

  // 5. Retry strategy score
  const retryEntries = Object.values(bp.retries);
  const hasExponentialBackoff = retryEntries.some(r => r.backoff === 'exponential');
  const retryStrategyScore = clamp(
    6
    + (hasExponentialBackoff ? 2 : 0)
    + (retryEntries.some(r => r.retryable) ? 2 : 0)
  );

  // 6. Timeout strategy score
  const timeoutEntries = Object.values(bp.timeoutPolicies);
  const hasFallbacks = timeoutEntries.some(t => t.onTimeout !== 'abort');
  const timeoutStrategyScore = clamp(7 + (hasFallbacks ? 3 : 0));

  // 7. Resource score
  const resourceScore = clamp(
    bp.resourceUsage.cacheHits > 0 ? 8 : 6
  );

  // 8. Cost score: confidence-based
  const costScore = clamp(bp.estimatedCost.costConfidence * 10);

  // 9. Recovery score: checkpoints + resume + rollback
  const recoveryScore = clamp(
    (bp.checkpoints.length > 0 ? 4 : 1)
    + (bp.resumePlan.resumable ? 3 : 0)
    + (bp.rollbackPlan.rollbackTasks.length > 0 ? 3 : 2)
  );

  // Overall weighted average (10 equal dimensions)
  const overallScore = Number((
    (taskGraphScore + dependenciesScore + parallelismScore + criticalPathScore +
     retryStrategyScore + timeoutStrategyScore + resourceScore + costScore + recoveryScore + 7) / 10
  ).toFixed(2));

  if (overallScore < 5) warnings.push('Low overall execution score — consider reviewing task dependencies');

  return {
    taskGraphScore,
    dependenciesScore,
    parallelismScore,
    criticalPathScore,
    retryStrategyScore,
    timeoutStrategyScore,
    resourceScore,
    costScore,
    recoveryScore,
    overallScore,
    valid: overallScore >= 5 && !depAnalysis.hasCycle,
    warnings,
  };
}
