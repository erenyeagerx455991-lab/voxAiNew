// ── V9.9 Adaptive Intelligence — Phase 18: Façade ─────────────────────────────
// Single public API entry point for the entire adaptive-intelligence module.
import type {
  AdaptiveIntelligenceContext,
  AdaptiveBlueprint,
  AdaptiveLearningRecord,
} from './adaptiveTypes.js';
import { buildAdaptiveBlueprint, buildFallbackAdaptiveBlueprint } from './adaptiveIntelligence.js';
import { saveAdaptiveSnapshot, getCurrentAdaptiveSnapshot, getAdaptivePersistenceStats, rollbackToAdaptiveSnapshot, resetAdaptivePersistence } from './adaptivePersistence.js';
import { learnFromAdaptive, getAdaptiveLearningStats, resetAdaptiveLearning } from './adaptiveLearning.js';
import { recordAdaptiveMetric, getAdaptiveMetricsSnapshot, resetAdaptiveMetrics } from './adaptiveMetrics.js';

export interface AdaptiveFacadeResult {
  blueprint:     AdaptiveBlueprint;
  contextString: string;
}

export function runAdaptiveIntelligence(ctx: AdaptiveIntelligenceContext): AdaptiveFacadeResult {
  const startedAt = Date.now();
  let blueprint: AdaptiveBlueprint;

  try {
    blueprint = buildAdaptiveBlueprint(ctx);
  } catch {
    blueprint = buildFallbackAdaptiveBlueprint(ctx.buildId);
  }

  // Persist (version assigned inside)
  const snap = saveAdaptiveSnapshot(ctx.buildId, blueprint);
  blueprint = snap.blueprint;

  // Record rolling metric
  const adaptationTimeMs = Date.now() - startedAt;
  recordAdaptiveMetric({
    adaptiveScore:            blueprint.adaptiveScore,
    runtimeOptimizationScore: blueprint.runtimeAdaptation.complexityFactor * 10,
    costOptimizationScore:    blueprint.performanceAdaptation.costOptimization === 'aggressive' ? 9
                              : blueprint.performanceAdaptation.costOptimization === 'moderate' ? 7 : 5,
    qualityOptimizationScore: blueprint.qualityAdaptation.evaluationThreshold,
    performanceGain:          Math.round((1 - blueprint.performanceAdaptation.estimatedCost / Math.max(0.01, ctx.expectedTotalCost ?? 0.05)) * 100) / 100,
    failureReduction:         blueprint.failureAdaptation.detectedCount > 0
                              ? Math.min(1, blueprint.failureAdaptation.recoveryActions.length * 0.2) : 0,
    agentUtilization:         1 - blueprint.agentAdaptation.skippableCount / Math.max(1, blueprint.agentAdaptation.totalAgents),
    adaptationTimeMs,
    strategy: blueprint.strategySelection.selectedStrategy,
    complexity: ctx.complexity,
    recordedAt: Date.now(),
  });

  return { blueprint, contextString: blueprint.contextString };
}

export function persistAdaptiveSnapshot(buildId: string, blueprint: AdaptiveBlueprint) {
  return saveAdaptiveSnapshot(buildId, blueprint);
}

export function learnFromAdaptiveResult(
  buildId: string,
  blueprint: AdaptiveBlueprint,
  buildSucceeded: boolean,
  buildTimeMs: number,
  actualCost: number,
): void {
  const record: AdaptiveLearningRecord = {
    buildId,
    strategy:             blueprint.strategySelection.selectedStrategy,
    complexity:           blueprint.runtimeAdaptation.complexityFactor > 0.7 ? 'enterprise'
                          : blueprint.runtimeAdaptation.complexityFactor > 0.3 ? 'standard' : 'simple',
    adaptiveScore:        blueprint.adaptiveScore,
    buildSucceeded,
    buildTimeMs,
    estimatedBuildTimeMs: blueprint.performanceAdaptation.estimatedBuildTimeMs,
    agentsSkipped:        blueprint.agentAdaptation.skippableCount,
    costActual:           actualCost,
    costEstimated:        blueprint.performanceAdaptation.estimatedCost,
    failuresDetected:     blueprint.failureAdaptation.detectedCount,
    recordedAt:           Date.now(),
  };
  // Fire-and-forget — never blocks pipeline
  learnFromAdaptive(record).catch(() => { /* never throws into pipeline */ });
}

export { getAdaptiveMetricsSnapshot as getAdaptiveMetrics };
export { getAdaptiveLearningStats   as getAdaptiveStats };
export { getCurrentAdaptiveSnapshot, getAdaptivePersistenceStats };

export { rollbackToAdaptiveSnapshot as rollbackAdaptive };

export function resetAdaptive(): void {
  resetAdaptivePersistence();
  resetAdaptiveLearning();
  resetAdaptiveMetrics();
}
