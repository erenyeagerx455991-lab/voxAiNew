// ── V9.3 Model & Resource Orchestration Engine — Pipeline Step ────────────────
//
// Runs as step 0.95 — immediately after Orchestrator (V9.2, step 0.9) and
// before Planner. Takes the ExecutionBlueprint produced by the Orchestrator
// and enriches it with a ModelExecutionBlueprint: per-agent provider routing,
// token budget allocation, fallback chains, cache policy, cost prediction, etc.
//
// Failures MUST NEVER stop a build — always falls back to a safe default
// blueprint routing all traffic to OpenRouter/Groq.
import type { Response } from 'express';
import type { ExecutionBlueprint } from '../../agent-orchestrator/types.js';
import type { ModelExecutionBlueprint } from '../../model-orchestrator/types.js';
import { buildModelExecutionBlueprint, buildFallbackModelBlueprint } from '../../model-orchestrator/blueprintBuilder.js';
import { persistModelBlueprint, getCurrentModelBlueprint } from '../../model-orchestrator/modelOrchestratorPersistence.js';
import { learnFromModelOrchestration } from '../../model-orchestrator/modelOrchestratorLearning.js';
import { recordModelOrchestration } from '../../model-orchestrator/modelOrchestratorMetrics.js';
import { getCacheHitRate } from '../../model-orchestrator/cacheIntelligence.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export async function runModelOrchestratorStep(
  buildId: string,
  res: Response,
  executionBlueprint: ExecutionBlueprint,
): Promise<ModelExecutionBlueprint> {
  return withAgentMetrics('ModelOrchestrator' as any, async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'model_router_start', buildId });

    let modelBlueprint: ModelExecutionBlueprint;
    const buildCount = (() => {
      try { return getCurrentModelBlueprint()?.version ?? 0; } catch { return 0; }
    })();

    try {
      modelBlueprint = buildModelExecutionBlueprint(executionBlueprint, buildCount);
    } catch {
      modelBlueprint = buildFallbackModelBlueprint(buildId);
    }

    sendEvent({
      type:                  'model_router_progress',
      buildId,
      complexity:            modelBlueprint.complexity,
      totalTokenBudget:      modelBlueprint.totalTokenBudget,
      providerDistribution:  modelBlueprint.providerDistribution,
      expectedTotalCost:     modelBlueprint.expectedTotalCost,
      cacheHitPrediction:    modelBlueprint.cacheHitPrediction,
      tokenEfficiency:       modelBlueprint.tokenEfficiency,
    });

    sendEvent({
      type:                  'model_router_complete',
      buildId,
      expectedTotalCost:     modelBlueprint.expectedTotalCost,
      expectedTotalLatencyMs: modelBlueprint.expectedTotalLatencyMs,
      budgetUtilization:     modelBlueprint.budgetUtilization,
      fallbackPrediction:    modelBlueprint.fallbackPrediction,
    });

    try {
      persistModelBlueprint(buildId, modelBlueprint);
    } catch { /* persistence must never stop a build */ }

    return modelBlueprint;
  });
}

/** Called after the build finishes — records learning + telemetry. Never throws. */
export function finalizeModelOrchestratorExecution(
  res: Response,
  modelBlueprint: ModelExecutionBlueprint,
  routingScore: number,
  actualCost: number,
  actualLatencyMs: number,
  fallbacksUsed = 0,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    const cacheHitRate  = getCacheHitRate();
    const tokenEff      = modelBlueprint.tokenEfficiency;
    const primaryProvider = Object.entries(modelBlueprint.providerDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] as any ?? 'openrouter';

    void learnFromModelOrchestration({
      buildId:        modelBlueprint.buildId,
      complexity:     modelBlueprint.complexity,
      bestProvider:   primaryProvider,
      bestTokenAlloc: Object.fromEntries(
        Object.entries(modelBlueprint.agentPlans).map(([a, p]) => [a, p.tokenBudget]),
      ) as any,
      cacheStrategy:  'prompt',
      routingScore,
      costSavings:    Math.max(0, modelBlueprint.expectedTotalCost - actualCost),
      latencySavings: Math.max(0, modelBlueprint.expectedTotalLatencyMs - actualLatencyMs),
      recordedAt:     Date.now(),
    });

    recordModelOrchestration(
      modelBlueprint.buildId,
      routingScore,
      cacheHitRate,
      fallbacksUsed > 0,
      tokenEff,
      modelBlueprint.budgetUtilization,
      actualCost,
      actualLatencyMs,
      primaryProvider,
    );

    sendEvent({
      type:            'model_router_learning',
      buildId:         modelBlueprint.buildId,
      routingScore,
      cacheHitRate,
      actualCost,
      actualLatencyMs,
      tokenEfficiency: tokenEff,
    });
  } catch { /* learning/telemetry must never stop a build */ }
}
