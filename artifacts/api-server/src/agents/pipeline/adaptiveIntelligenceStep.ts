// ── V9.9 Autonomous Adaptive Intelligence Engine — Pipeline Step ───────────────
//
// Runs as step 0.998 — after PlanningIntelligence (0.997), before Planner (1).
// Analyzes runtime conditions and produces an AdaptiveBlueprint that informs
// the Planner how the AI system should dynamically adapt itself.
//
// Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; falls back to a safe default blueprint.
import type { Response } from 'express';
import type { AdaptiveBlueprint } from '../../adaptive-intelligence/adaptiveTypes.js';
import { runAdaptiveIntelligence, learnFromAdaptiveResult } from '../../adaptive-intelligence/adaptiveFacade.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface AdaptiveIntelligenceStepOutput {
  buildId:       string;
  blueprint:     AdaptiveBlueprint;
  contextString: string;
}

export async function runAdaptiveIntelligenceStep(
  buildId: string,
  res: Response,
  prompt: string,
  complexity: 'simple' | 'standard' | 'enterprise',
  chosenPath: string,
  reasoningScore: number,
  executionMode: string,
  planningScore: number,
  executionScore: number,
  modelBudget?: {
    totalTokenBudget?: number;
    expectedTotalCost?: number;
    tokenEfficiency?: number;
  },
  upstream?: {
    productManagerOutput?:    { productScore?: number };
    frontendArchitectOutput?: { overallScore?: number };
    backendArchitectOutput?:  { overallScore?: number };
    devopsArchitectOutput?:   { overallScore?: number };
    qaArchitectOutput?:       { overallScore?: number };
    historicalSuccessRate?:   number;
    historicalBuildTimeMs?:   number;
  },
): Promise<AdaptiveIntelligenceStepOutput> {
  return withAgentMetrics('AdaptiveIntelligence', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'adaptive_start', buildId });

    let result: { blueprint: AdaptiveBlueprint; contextString: string };
    try {
      result = runAdaptiveIntelligence({
        buildId,
        prompt,
        complexity,
        chosenPath,
        reasoningScore,
        executionMode,
        planningScore,
        executionScore,
        totalTokenBudget:    modelBudget?.totalTokenBudget,
        expectedTotalCost:   modelBudget?.expectedTotalCost,
        tokenEfficiency:     modelBudget?.tokenEfficiency,
        productScore:        upstream?.productManagerOutput?.productScore,
        frontendScore:       upstream?.frontendArchitectOutput?.overallScore,
        backendScore:        upstream?.backendArchitectOutput?.overallScore,
        devopsScore:         upstream?.devopsArchitectOutput?.overallScore,
        qaScore:             upstream?.qaArchitectOutput?.overallScore,
        historicalSuccessRate: upstream?.historicalSuccessRate,
        historicalBuildTimeMs: upstream?.historicalBuildTimeMs,
      });
    } catch {
      const { buildFallbackAdaptiveBlueprint } = await import('../../adaptive-intelligence/adaptiveIntelligence.js');
      const blueprint = buildFallbackAdaptiveBlueprint(buildId);
      result = { blueprint, contextString: '\n\n## V9.9 Adaptive Intelligence\nFallback mode — balanced defaults applied.' };
    }

    const { blueprint, contextString } = result;

    sendEvent({
      type:              'adaptive_progress',
      buildId,
      adaptiveScore:     blueprint.adaptiveScore,
      strategy:          blueprint.strategySelection.selectedStrategy,
      detectedMode:      blueprint.runtimeAdaptation.detectedMode,
      agentsSkipped:     blueprint.agentAdaptation.agentsToSkip.length,
      candidateCount:    blueprint.qualityAdaptation.candidateCount,
      evalThreshold:     blueprint.qualityAdaptation.evaluationThreshold,
      failuresDetected:  blueprint.failureAdaptation.detectedCount,
      estimatedBuildMs:  blueprint.performanceAdaptation.estimatedBuildTimeMs,
    });

    sendEvent({
      type:          'adaptive_complete',
      buildId,
      adaptiveScore: blueprint.adaptiveScore,
      strategy:      blueprint.strategySelection.selectedStrategy,
      valid:         blueprint.validation.valid,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after build finishes — records learning. Never throws. */
export function finalizeAdaptiveIntelligenceStep(
  res: Response,
  buildId: string,
  blueprint: AdaptiveBlueprint,
  buildSucceeded: boolean,
  buildTimeMs: number,
  actualCost: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    learnFromAdaptiveResult(buildId, blueprint, buildSucceeded, buildTimeMs, actualCost);
    sendEvent({ type: 'adaptive_learning', buildId, adaptiveScore: blueprint.adaptiveScore, strategy: blueprint.strategySelection.selectedStrategy });
  } catch { /* learning/telemetry must never stop a build */ }
}
