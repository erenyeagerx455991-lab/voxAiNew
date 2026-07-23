// ── V10.0 — Self-Optimization Engine — Main Entry Point ───────────────────────
// Runs all 20 optimizers, validates, persists, and returns an OptimizationBlueprint.
// Zero LLM calls. Fully deterministic. Never throws into the pipeline.
import type { SelfOptimizationContext, OptimizationBlueprint, OptimizationLearningRecord } from './optimizationTypes.js';
import { optimizePerformance }  from './performanceOptimizer.js';
import { optimizeLatency }      from './latencyOptimizer.js';
import { optimizeTokens }       from './tokenOptimizer.js';
import { optimizeCost }         from './costOptimizer.js';
import { optimizeWorkflow }     from './workflowOptimizer.js';
import { optimizeParallel }     from './parallelOptimizer.js';
import { optimizeScheduler }    from './schedulerOptimizer.js';
import { optimizeRepair }       from './repairOptimizer.js';
import { optimizeRetry }        from './retryOptimizer.js';
import { optimizeTimeouts }     from './timeoutOptimizer.js';
import { optimizeResources }    from './resourceOptimizer.js';
import { optimizeMemory }       from './memoryOptimizer.js';
import { optimizeCache }        from './cacheOptimizer.js';
import { optimizePrompt }       from './promptOptimizer.js';
import { optimizeContext }      from './contextOptimizer.js';
import { optimizeQuality }      from './qualityOptimizer.js';
import { optimizeAgents }       from './agentOptimizer.js';
import { optimizeModel }        from './modelOptimizer.js';
import { optimizeOrdering }     from './orderingOptimizer.js';
import { optimizeConfidence }   from './confidenceOptimizer.js';
import { validateOptimization } from './optimizationValidator.js';
import { saveOptimizationSnapshot, getCurrentOptimizationSnapshot, getOptimizationPersistenceStats, rollbackToOptimizationSnapshot, resetOptimizationPersistence } from './optimizationPersistence.js';
import { learnFromOptimization, getOptimizationLearningStats, resetOptimizationLearning } from './optimizationLearning.js';
import { recordOptimizationMetric, getOptimizationMetricsSnapshot, resetOptimizationMetrics } from './optimizationMetrics.js';

// ── Context string builder ──────────────────────────────────────────────────────
function buildContextString(bp: Omit<OptimizationBlueprint, 'contextString'>): string {
  const { validation: v, model, quality, parallel, performance, confidence } = bp;
  const skippable = bp.workflow.skippableSteps.join(', ') || 'none';
  return [
    '\n\n## V10.0 Self-Optimization Engine',
    `Overall: ${v.overallScore}/10 | Model: ${model.recommendedTier} | Risk: ${confidence.riskLevel}`,
    `Performance: ${v.performanceScore}/10 | Latency: ${v.latencyScore}/10 | Cost: ${v.costScore}/10`,
    `Quality: threshold=${quality.qualityThreshold}, candidates=${quality.candidateCount}, mode=${quality.executionMode}`,
    `Parallel: degree=${parallel.maxDegree}, score=${v.parallelismScore}/10`,
    `Build time: ~${Math.round(performance.estimatedBuildTimeMs / 1000)}s`,
    `Skippable: [${skippable}]`,
    `Rationale: ${model.modelSelectionRationale}`,
  ].join('\n');
}

// ── Main builder ────────────────────────────────────────────────────────────────
export function buildOptimizationBlueprint(ctx: SelfOptimizationContext): OptimizationBlueprint {
  const performance = optimizePerformance(ctx);
  const latency     = optimizeLatency(ctx);
  const token       = optimizeTokens(ctx);
  const cost        = optimizeCost(ctx);
  const workflow    = optimizeWorkflow(ctx);
  const parallel    = optimizeParallel(ctx);
  const scheduler   = optimizeScheduler(ctx);
  const repair      = optimizeRepair(ctx);
  const retry       = optimizeRetry(ctx);
  const timeout     = optimizeTimeouts(ctx);
  const resource    = optimizeResources(ctx);
  const memory      = optimizeMemory(ctx);
  const cache       = optimizeCache(ctx);
  const prompt      = optimizePrompt(ctx);
  const context     = optimizeContext(ctx);
  const quality     = optimizeQuality(ctx);
  const agent       = optimizeAgents(ctx);
  const model       = optimizeModel(ctx);
  const ordering    = optimizeOrdering(ctx);
  const confidence  = optimizeConfidence(ctx);

  const validation = validateOptimization(
    performance, latency, cost, quality, workflow, scheduler,
    parallel, resource, token, repair, retry, model, confidence,
  );

  const base: Omit<OptimizationBlueprint, 'contextString'> = {
    buildId: ctx.buildId,
    performance, latency, token, cost, workflow, parallel, scheduler,
    repair, retry, timeout, resource, memory, cache, prompt, context,
    quality, agent, model, ordering, confidence,
    validation,
    overallOptimizationScore: validation.overallScore,
    recordedAt: Date.now(),
    version: 0,
  };

  return { ...base, contextString: buildContextString(base) };
}

export function buildFallbackOptimizationBlueprint(buildId: string): OptimizationBlueprint {
  return buildOptimizationBlueprint({
    buildId,
    prompt: '',
    complexity: 'standard',
    reasoningScore: 7,
    planningScore: 7,
    executionScore: 7,
    adaptiveScore: 7,
    tokenEfficiency: 0.75,
    historicalSuccessRate: 0.9,
  });
}

// ── Façade API ──────────────────────────────────────────────────────────────────
export interface OptimizationFacadeResult {
  blueprint: OptimizationBlueprint;
  contextString: string;
}

export function runSelfOptimizationEngine(ctx: SelfOptimizationContext): OptimizationFacadeResult {
  const startedAt = Date.now();
  let blueprint: OptimizationBlueprint;

  try {
    blueprint = buildOptimizationBlueprint(ctx);
  } catch {
    blueprint = buildFallbackOptimizationBlueprint(ctx.buildId);
  }

  const snap = saveOptimizationSnapshot(ctx.buildId, blueprint);
  blueprint = snap.blueprint;

  const adaptationTimeMs = Date.now() - startedAt;
  recordOptimizationMetric({
    overallOptimizationScore: blueprint.overallOptimizationScore,
    performanceScore:         blueprint.validation.performanceScore,
    latencyScore:             blueprint.validation.latencyScore,
    costScore:                blueprint.validation.costScore,
    qualityScore:             blueprint.validation.qualityScore,
    workflowScore:            blueprint.validation.workflowScore,
    parallelScore:            blueprint.validation.parallelismScore,
    resourceScore:            blueprint.validation.resourceUsageScore,
    tokenScore:               blueprint.validation.tokenEfficiencyScore,
    repairScore:              blueprint.validation.repairStrategyScore,
    retryScore:               blueprint.validation.retryStrategyScore,
    modelScore:               blueprint.validation.modelAllocationScore,
    agentUtilization:         1 - blueprint.workflow.skippableSteps.length / 20,
    adaptationTimeMs,
    complexity: ctx.complexity,
    recordedAt: Date.now(),
  });

  return { blueprint, contextString: blueprint.contextString };
}

export function persistOptimizationSnapshot(buildId: string, blueprint: OptimizationBlueprint) {
  return saveOptimizationSnapshot(buildId, blueprint);
}

export function learnFromOptimizationResult(
  buildId: string,
  blueprint: OptimizationBlueprint,
  buildSucceeded: boolean,
  buildTimeMs: number,
  actualCost: number,
  actualQualityScore: number,
): void {
  const record: OptimizationLearningRecord = {
    buildId,
    overallOptimizationScore: blueprint.overallOptimizationScore,
    buildSucceeded,
    buildTimeMs,
    estimatedBuildTimeMs: blueprint.performance.estimatedBuildTimeMs,
    totalCostActual:  actualCost,
    totalCostEstimated: blueprint.cost.estimatedTotalCost,
    qualityScoreActual: actualQualityScore,
    repairAttempts: 0,
    retryCount: 0,
    complexity: blueprint.retry.retryStrategy === 'none' ? 'simple' : blueprint.quality.candidateCount >= 3 ? 'enterprise' : 'standard',
    modelTier: blueprint.model.recommendedTier,
    recordedAt: Date.now(),
  };
  learnFromOptimization(record).catch(() => { /* fire-and-forget */ });
}

export { getOptimizationMetricsSnapshot as getOptimizationMetrics };
export { getOptimizationLearningStats   as getOptimizationStats };
export { getCurrentOptimizationSnapshot, getOptimizationPersistenceStats };
export { rollbackToOptimizationSnapshot as rollbackOptimization };

export function resetOptimizationEngine(): void {
  resetOptimizationPersistence();
  resetOptimizationLearning();
  resetOptimizationMetrics();
}
