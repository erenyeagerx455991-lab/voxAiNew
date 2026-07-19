// ── V9.6 Execution Intelligence — Façade ──────────────────────────────────────
// Single entry point that external pipeline code calls.
// Handles building, persisting, and recording metrics atomically.
import type {
  ExecutionIntelligenceBlueprint,
  ExecutionIntelligenceContext,
  ExecutionLearningRecord,
} from './executionTypes.js';
import { buildExecutionBlueprint, buildFallbackExecutionBlueprint } from './executionIntelligence.js';
import { saveExecutionSnapshot } from './executionPersistence.js';
import { recordExecutionMetric } from './executionMetrics.js';
import { learnFromExecution } from './executionLearning.js';

export interface ExecutionFacadeResult {
  blueprint:  ExecutionIntelligenceBlueprint;
  contextString: string;  // injected into the Planner prompt
}

export function runExecutionIntelligence(
  ctx: ExecutionIntelligenceContext,
): ExecutionFacadeResult {
  let blueprint: ExecutionIntelligenceBlueprint;
  try {
    blueprint = buildExecutionBlueprint(ctx);
  } catch {
    blueprint = buildFallbackExecutionBlueprint(ctx.buildId);
  }

  // Persist (version assigned inside)
  const snap = saveExecutionSnapshot(ctx.buildId, blueprint);
  blueprint = snap.blueprint;

  // Record rolling metric
  recordExecutionMetric({
    executionScore:     blueprint.executionScore,
    parallelEfficiency: blueprint.taskGraph.parallelizableTasks / Math.max(1, blueprint.taskGraph.totalTasks),
    actualDurationMs:   blueprint.estimatedTime.averageMs,
    actualRetries:      0,
    failed:             false,
    recovered:          false,
    executionMode:      blueprint.executionMode,
    estimatedCost:      blueprint.estimatedCost.totalCost,
    estimatedTimeMs:    blueprint.estimatedTime.averageMs,
    recordedAt:         Date.now(),
  });

  // Build context string for the Planner
  const contextString = buildExecutionContextString(blueprint);

  return { blueprint, contextString };
}

export function finalizeExecutionIntelligence(
  buildId: string,
  blueprint: ExecutionIntelligenceBlueprint,
  actualScore: number,
  actualDurationMs: number,
): void {
  // Fire-and-forget async learning — never blocks the pipeline
  const record: ExecutionLearningRecord = {
    buildId,
    executionMode:       blueprint.executionMode,
    actualDurationMs,
    estimatedDurationMs: blueprint.estimatedTime.averageMs,
    actualRetries:       0,
    failed:              actualScore < 5,
    recovered:           false,
    parallelEfficiency:  blueprint.taskGraph.parallelizableTasks / Math.max(1, blueprint.taskGraph.totalTasks),
    executionScore:      actualScore,
    recordedAt:          Date.now(),
  };
  learnFromExecution(record).catch(() => { /* never throws into pipeline */ });
}

function buildExecutionContextString(bp: ExecutionIntelligenceBlueprint): string {
  const criticalIds = bp.criticalPath.criticalTasks.slice(0, 5).join(', ');
  const parallelPct = Math.round(
    (bp.taskGraph.parallelizableTasks / Math.max(1, bp.taskGraph.totalTasks)) * 100,
  );
  return [
    '\n\n## V9.6 Execution Intelligence',
    `Execution Mode: ${bp.executionMode}`,
    `Total Tasks: ${bp.taskGraph.totalTasks} (${parallelPct}% parallelizable)`,
    `Critical Path: ${criticalIds}`,
    `Estimated Time: ${Math.round(bp.estimatedTime.averageMs / 1000)}s avg / ${Math.round(bp.estimatedTime.worstCaseMs / 1000)}s worst`,
    `Estimated Cost: $${bp.estimatedCost.totalCost.toFixed(4)} (confidence ${Math.round(bp.estimatedCost.costConfidence * 100)}%)`,
    `Checkpoints: ${bp.checkpoints.length} | Resume: ${bp.resumePlan.resumable ? 'YES' : 'NO'}`,
    `Execution Score: ${bp.executionScore}/10`,
    `Failure Strategy: ${bp.failureStrategy}`,
  ].join('\n');
}
