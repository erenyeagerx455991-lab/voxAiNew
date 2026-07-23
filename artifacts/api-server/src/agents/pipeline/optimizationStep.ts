// ── V10.0 Autonomous Self-Optimization Engine — Pipeline Step ─────────────────
//
// Runs as step 0.999 — after AdaptiveIntelligence (0.998), before Planner (1).
// Observes, analyzes, and recommends optimizations for the build.
//
// Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; falls back to a safe default blueprint.
import type { Response } from 'express';
import type { OptimizationBlueprint } from '../../self-optimization-engine/optimizationTypes.js';
import {
  runSelfOptimizationEngine,
  learnFromOptimizationResult,
  buildFallbackOptimizationBlueprint,
} from '../../self-optimization-engine/optimizationFacade.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface OptimizationStepOutput {
  buildId:       string;
  blueprint:     OptimizationBlueprint;
  contextString: string;
}

export async function runOptimizationStep(
  buildId: string,
  res: Response,
  prompt: string,
  complexity: 'simple' | 'standard' | 'enterprise',
  reasoningScore: number,
  planningScore: number,
  executionScore: number,
  adaptiveScore: number,
  modelBudget?: {
    totalTokenBudget?: number;
    expectedTotalCost?: number;
    tokenEfficiency?: number;
  },
  upstream?: {
    qualityScore?:          number;
    runtimeScore?:          number;
    knowledgeScore?:        number;
    workflowScore?:         number;
    agentLatencies?:        Record<string, number>;
    agentFailureRates?:     Record<string, number>;
    repairAttempts?:        number;
    retryCount?:            number;
    parallelEfficiency?:    number;
    cacheHitRate?:          number;
    compressionRatio?:      number;
    memoryUsage?:           number;
    historicalSuccessRate?: number;
    historicalBuildTimeMs?: number;
  },
): Promise<OptimizationStepOutput> {
  return withAgentMetrics('SelfOptimizationEngine', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'optimization_start', buildId });

    let result: { blueprint: OptimizationBlueprint; contextString: string };
    try {
      result = runSelfOptimizationEngine({
        buildId,
        prompt,
        complexity,
        reasoningScore,
        planningScore,
        executionScore,
        adaptiveScore,
        totalTokenBudget:  modelBudget?.totalTokenBudget,
        expectedTotalCost: modelBudget?.expectedTotalCost,
        tokenEfficiency:   modelBudget?.tokenEfficiency,
        qualityScore:      upstream?.qualityScore,
        runtimeScore:      upstream?.runtimeScore,
        knowledgeScore:    upstream?.knowledgeScore,
        workflowScore:     upstream?.workflowScore,
        agentLatencies:    upstream?.agentLatencies,
        agentFailureRates: upstream?.agentFailureRates,
        repairAttempts:    upstream?.repairAttempts,
        retryCount:        upstream?.retryCount,
        parallelEfficiency:upstream?.parallelEfficiency,
        cacheHitRate:      upstream?.cacheHitRate,
        compressionRatio:  upstream?.compressionRatio,
        memoryUsage:       upstream?.memoryUsage,
        historicalSuccessRate: upstream?.historicalSuccessRate,
        historicalBuildTimeMs: upstream?.historicalBuildTimeMs,
      });
    } catch {
      const blueprint = buildFallbackOptimizationBlueprint(buildId);
      result = { blueprint, contextString: blueprint.contextString };
    }

    const { blueprint, contextString } = result;

    sendEvent({
      type:                    'optimization_progress',
      buildId,
      overallOptimizationScore: blueprint.overallOptimizationScore,
      modelTier:               blueprint.model.recommendedTier,
      riskLevel:               blueprint.confidence.riskLevel,
      performanceScore:        blueprint.validation.performanceScore,
      costScore:               blueprint.validation.costScore,
      qualityScore:            blueprint.validation.qualityScore,
      parallelScore:           blueprint.validation.parallelismScore,
      skippableSteps:          blueprint.workflow.skippableSteps.length,
      estimatedBuildMs:        blueprint.performance.estimatedBuildTimeMs,
    });

    sendEvent({
      type:                    'optimization_complete',
      buildId,
      overallOptimizationScore: blueprint.overallOptimizationScore,
      valid:                   blueprint.validation.valid,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after build finishes — records learning. Never throws. */
export function finalizeOptimizationStep(
  res: Response,
  buildId: string,
  blueprint: OptimizationBlueprint,
  buildSucceeded: boolean,
  buildTimeMs: number,
  actualCost: number,
  actualQualityScore: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* never throw */ }
    };

    learnFromOptimizationResult(buildId, blueprint, buildSucceeded, buildTimeMs, actualCost, actualQualityScore);
    sendEvent({ type: 'optimization_learning', buildId, overallOptimizationScore: blueprint.overallOptimizationScore });
  } catch { /* learning must never stop a build */ }
}
