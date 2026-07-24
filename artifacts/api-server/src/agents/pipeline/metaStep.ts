// ── V10.1 Autonomous Meta Intelligence Engine — Pipeline Step ──────────────────
//
// Runs as step 0.9995 — after SelfOptimizationEngine (0.999), before Planner (1).
// Observes the entire AI system, evaluates all engines, and recommends improvements.
//
// Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; falls back to a safe default blueprint.
import type { Response } from 'express';
import type { MetaBlueprint } from '../../meta-intelligence/metaTypes.js';
import {
  runMetaIntelligenceEngine,
  learnFromMetaResult,
  buildFallbackMetaBlueprint,
} from '../../meta-intelligence/metaFacade.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface MetaStepOutput {
  buildId:       string;
  blueprint:     MetaBlueprint;
  contextString: string;
}

export async function runMetaStep(
  buildId:           string,
  res:               Response,
  prompt:            string,
  complexity:        'simple' | 'standard' | 'enterprise',
  reasoningScore:    number,
  planningScore:     number,
  executionScore:    number,
  adaptiveScore:     number,
  optimizationScore: number,
  upstream?: {
    qualityScore?:           number;
    runtimeScore?:           number;
    knowledgeScore?:         number;
    workflowScore?:          number;
    agentLatencies?:         Record<string, number>;
    agentFailureRates?:      Record<string, number>;
    repairAttempts?:         number;
    retryCount?:             number;
    tokenEfficiency?:        number;
    cacheHitRate?:           number;
    parallelEfficiency?:     number;
    memoryUsage?:            number;
    historicalSuccessRate?:  number;
    historicalBuildTimeMs?:  number;
    optimizationPerformanceScore?: number;
    optimizationCostScore?:        number;
    optimizationTokenScore?:       number;
  },
): Promise<MetaStepOutput> {
  return withAgentMetrics('MetaIntelligence', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'meta_start', buildId });

    let result: { blueprint: MetaBlueprint; contextString: string };
    try {
      result = runMetaIntelligenceEngine({
        buildId,
        prompt,
        complexity,
        reasoningScore,
        planningScore,
        executionScore,
        adaptiveScore,
        optimizationScore,
        qualityScore:           upstream?.qualityScore,
        runtimeScore:           upstream?.runtimeScore,
        knowledgeScore:         upstream?.knowledgeScore,
        workflowScore:          upstream?.workflowScore,
        agentLatencies:         upstream?.agentLatencies,
        agentFailureRates:      upstream?.agentFailureRates,
        repairAttempts:         upstream?.repairAttempts,
        retryCount:             upstream?.retryCount,
        tokenEfficiency:        upstream?.tokenEfficiency,
        cacheHitRate:           upstream?.cacheHitRate,
        parallelEfficiency:     upstream?.parallelEfficiency,
        memoryUsage:            upstream?.memoryUsage,
        historicalSuccessRate:  upstream?.historicalSuccessRate,
        historicalBuildTimeMs:  upstream?.historicalBuildTimeMs,
        optimizationPerformanceScore: upstream?.optimizationPerformanceScore,
        optimizationCostScore:        upstream?.optimizationCostScore,
        optimizationTokenScore:       upstream?.optimizationTokenScore,
      });
    } catch {
      const blueprint = buildFallbackMetaBlueprint(buildId);
      result = { blueprint, contextString: blueprint.contextString };
    }

    const { blueprint, contextString } = result;

    sendEvent({
      type:              'meta_progress',
      buildId,
      overallMetaScore:  blueprint.overallMetaScore,
      healthStatus:      blueprint.health.healthStatus,
      maturityLevel:     blueprint.evolution.maturityLevel,
      architectureScore: blueprint.validation.architectureScore,
      performanceScore:  blueprint.validation.performanceScore,
      issueCount:        blueprint.diagnostics.issueCount,
      recommendationCount: blueprint.recommendations.totalCount,
      evolutionPriority: blueprint.evolution.evolutionPriority,
    });

    sendEvent({
      type:             'meta_complete',
      buildId,
      overallMetaScore: blueprint.overallMetaScore,
      valid:            blueprint.validation.valid,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after build finishes — records learning. Never throws. */
export function finalizeMetaStep(
  res:                Response,
  buildId:            string,
  blueprint:          MetaBlueprint,
  buildSucceeded:     boolean,
  buildTimeMs:        number,
  actualQualityScore: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* never throw */ }
    };

    learnFromMetaResult(buildId, blueprint, buildSucceeded, buildTimeMs, actualQualityScore);
    sendEvent({
      type:             'meta_learning',
      buildId,
      overallMetaScore: blueprint.overallMetaScore,
      healthStatus:     blueprint.health.healthStatus,
    });
  } catch { /* learning must never stop a build */ }
}
