// ── V9.6 Autonomous Execution Intelligence Engine — Pipeline Step ──────────────
//
// Runs as step 0.995 — after ReasoningEngine (0.99), before the Planner (1).
// Converts the ReasoningBlueprint into a full ExecutionIntelligenceBlueprint:
// task graph, dependency DAG, parallel groups, critical path, retry/timeout
// policies, cost/time estimates, checkpoints, resume/rollback plans.
//
// Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; on error, falls back to a safe default.
import type { Response } from 'express';
import type { ReasoningBlueprint } from '../../reasoning-engine/types.js';
import type { ExecutionIntelligenceBlueprint, ExecutionIntelligenceContext } from '../../execution-intelligence/executionTypes.js';
import { runExecutionIntelligence, finalizeExecutionIntelligence } from '../../execution-intelligence/executionFacade.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface ExecutionIntelligenceStepOutput {
  buildId:       string;
  blueprint:     ExecutionIntelligenceBlueprint;
  contextString: string;
}

export async function runExecutionIntelligenceStep(
  buildId: string,
  res: Response,
  complexity: 'simple' | 'standard' | 'enterprise',
  reasoningBlueprint: ReasoningBlueprint,
  modelBudget?: {
    totalTokenBudget?: number;
    tokenEfficiency?: number;
    expectedTotalCost?: number;
  },
  upstream?: {
    productManagerOutput?:    { productScore?: number };
    frontendArchitectOutput?: { overallScore?: number };
    backendArchitectOutput?:  { overallScore?: number };
    devopsArchitectOutput?:   { overallScore?: number };
    qaArchitectOutput?:       { overallScore?: number };
    runtimeIntelligenceOutput?: { overallScore?: number };
  },
): Promise<ExecutionIntelligenceStepOutput> {
  return withAgentMetrics('ExecutionIntelligence', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'execution_start', buildId });

    const ctx: ExecutionIntelligenceContext = {
      buildId,
      complexity,
      chosenPath:      reasoningBlueprint.chosenPath.id,
      reasoningScore:  reasoningBlueprint.confidence.confidenceScore,
      totalTokenBudget: modelBudget?.totalTokenBudget,
      expectedTotalCost: modelBudget?.expectedTotalCost,
      tokenEfficiency:  modelBudget?.tokenEfficiency,
      productScore:     upstream?.productManagerOutput?.productScore,
      frontendScore:    upstream?.frontendArchitectOutput?.overallScore,
      backendScore:     upstream?.backendArchitectOutput?.overallScore,
      devopsScore:      upstream?.devopsArchitectOutput?.overallScore,
      qaScore:          upstream?.qaArchitectOutput?.overallScore,
      runtimeScore:     upstream?.runtimeIntelligenceOutput?.overallScore,
    };

    let result: { blueprint: ExecutionIntelligenceBlueprint; contextString: string };
    try {
      result = runExecutionIntelligence(ctx);
    } catch {
      const { buildFallbackExecutionBlueprint } = await import('../../execution-intelligence/executionIntelligence.js');
      const blueprint = buildFallbackExecutionBlueprint(buildId);
      result = { blueprint, contextString: '\n\n## V9.6 Execution Intelligence\nFallback mode — simple sequential execution.' };
    }

    const { blueprint, contextString } = result;

    sendEvent({
      type:             'execution_progress',
      buildId,
      executionMode:    blueprint.executionMode,
      totalTasks:       blueprint.taskGraph.totalTasks,
      criticalPath:     blueprint.criticalPath.criticalTasks.length,
      parallelGroups:   blueprint.parallelGroups.length,
      estimatedTimeMs:  blueprint.estimatedTime.averageMs,
      executionScore:   blueprint.executionScore,
    });

    sendEvent({
      type:           'execution_complete',
      buildId,
      executionMode:  blueprint.executionMode,
      executionScore: blueprint.executionScore,
      estimatedCost:  blueprint.estimatedCost.totalCost,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after the build finishes — records learning. Never throws. */
export function finalizeExecutionIntelligenceStep(
  res: Response,
  buildId: string,
  blueprint: ExecutionIntelligenceBlueprint,
  overallScore: number,
  actualDurationMs: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    finalizeExecutionIntelligence(buildId, blueprint, overallScore, actualDurationMs);

    sendEvent({ type: 'execution_learning', buildId, overallScore });
  } catch { /* learning/telemetry must never stop a build */ }
}
