// ── V9.6 Execution Intelligence — Main Orchestrator ───────────────────────────
// Orchestrates all sub-planners into a complete ExecutionIntelligenceBlueprint.
// Static/deterministic — zero LLM calls.
import type {
  ExecutionIntelligenceBlueprint,
  ExecutionIntelligenceContext,
  FailureStrategy,
} from './executionTypes.js';
import { buildTaskGraph } from './taskGraphBuilder.js';
import { planParallelExecution } from './parallelPlanner.js';
import { computeCriticalPath } from './criticalPathPlanner.js';
import { scheduleExecution } from './executionScheduler.js';
import { estimateResources } from './resourcePlanner.js';
import { estimateExecutionCost } from './executionCostPlanner.js';
import { estimateExecutionTime } from './executionTimePlanner.js';
import { planCheckpoints } from './checkpointPlanner.js';
import { planResume } from './resumePlanner.js';
import { planRollback } from './rollbackPlanner.js';
import { validateExecutionBlueprint } from './executionValidator.js';
import { computeRetryConfig } from './retryPlanner.js';
import { computeTimeoutConfig } from './timeoutPlanner.js';

export function buildExecutionBlueprint(
  ctx: ExecutionIntelligenceContext,
): ExecutionIntelligenceBlueprint {
  // ── 1. Task graph ────────────────────────────────────────────────────────────
  const taskGraph = buildTaskGraph(ctx);
  const { tasks } = taskGraph;

  // ── 2. Critical path (marks isCritical on tasks) ────────────────────────────
  const criticalPath = computeCriticalPath(tasks, taskGraph.topologicalOrder);
  for (const t of tasks) {
    taskGraph.taskMap[t.id].isCritical = criticalPath.criticalTasks.includes(t.id);
  }
  taskGraph.criticalTasks = criticalPath.criticalTasks.length;

  // ── 3. Parallel planning ─────────────────────────────────────────────────────
  const parallelPlan = planParallelExecution(tasks, taskGraph.topologicalOrder);

  // ── 4. Scheduling ────────────────────────────────────────────────────────────
  const { executionOrder, executionMode } = scheduleExecution(
    tasks,
    taskGraph.topologicalOrder,
    ctx.chosenPath,
  );

  // ── 5. Retry + timeout maps ──────────────────────────────────────────────────
  const retries: ExecutionIntelligenceBlueprint['retries'] = {};
  const timeoutPolicies: ExecutionIntelligenceBlueprint['timeoutPolicies'] = {};
  for (const t of tasks) {
    retries[t.id] = computeRetryConfig(t.id, t.retryable);
    // Re-derive timeout from the task's pre-computed field (already stored on the task)
    timeoutPolicies[t.id] = computeTimeoutConfig(t.id, t.estimatedTimeMs, ctx.complexity);
  }

  // ── 6. Resource, cost, time estimates ────────────────────────────────────────
  const resourceUsage = estimateResources(tasks, ctx);
  const estimatedCost = estimateExecutionCost(tasks, ctx);
  const estimatedTime = estimateExecutionTime(
    tasks,
    criticalPath.criticalPathDurationMs,
    parallelPlan.idleTimePrediction,
  );

  // ── 7. Checkpoints, resume, rollback ────────────────────────────────────────
  const checkpoints = planCheckpoints(tasks);
  const resumePlan = planResume(tasks, checkpoints);
  const rollbackAnchor =
    tasks.find(t => t.rollbackRequired)?.id ?? tasks[0]?.id ?? 'planning';
  const rollbackPlan = planRollback(tasks, rollbackAnchor);

  // ── 8. Failure strategy ──────────────────────────────────────────────────────
  const failureStrategy: FailureStrategy =
    ctx.complexity === 'enterprise' ? 'recover' : 'retry';

  // ── 9. Assemble partial for validation ───────────────────────────────────────
  const partial = {
    buildId: ctx.buildId,
    taskGraph,
    executionOrder,
    parallelGroups: parallelPlan.parallelGroups,
    checkpoints,
    retries,
    timeoutPolicies,
    rollbackPlan,
    resumePlan,
    criticalPath,
    executionScore: 0,
    estimatedCost,
    estimatedTime,
    resourceUsage,
    failureStrategy,
    executionMode,
  };

  const validation = validateExecutionBlueprint(partial as any);

  return {
    ...partial,
    executionScore: validation.overallScore,
    validation,
    recordedAt: Date.now(),
    version: 0,
  };
}

export function buildFallbackExecutionBlueprint(
  buildId: string,
): ExecutionIntelligenceBlueprint {
  return buildExecutionBlueprint({
    buildId,
    complexity: 'simple',
    chosenPath: 'B',
    reasoningScore: 5,
  });
}
