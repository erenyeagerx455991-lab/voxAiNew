// ── V9.7 Autonomous Planning Intelligence Engine — Pipeline Step ───────────────
//
// Runs as step 0.997 — after ExecutionIntelligence (0.995), before Planner (1).
// Builds a complete PlanningBlueprint from the prompt + upstream context:
// goals, requirements, dependency graph, milestones, roadmap, features, tasks,
// risks, estimation, increments, priorities, implementation plan, validation.
//
// Static/deterministic — zero LLM calls.
// Failures MUST NEVER stop a build; falls back to a safe default blueprint.
import type { Response } from 'express';
import type { PlanningBlueprint } from '../../planning-intelligence/planningTypes.js';
import { runPlanningIntelligence, learnFromPlanningResult } from '../../planning-intelligence/planningFacade.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface PlanningIntelligenceStepOutput {
  buildId:       string;
  blueprint:     PlanningBlueprint;
  contextString: string;
}

export async function runPlanningIntelligenceStep(
  buildId: string,
  res: Response,
  prompt: string,
  complexity: 'simple' | 'standard' | 'enterprise',
  chosenPath: string,
  reasoningScore: number,
  executionMode: string,
  modelBudget?: {
    totalTokenBudget?: number;
    expectedTotalCost?: number;
    tokenEfficiency?: number;
  },
  upstream?: {
    productManagerOutput?:    { productScore?: number };
    frontendArchitectOutput?: { overallScore?: number };
    backendArchitectOutput?:  { overallScore?: number };
  },
): Promise<PlanningIntelligenceStepOutput> {
  return withAgentMetrics('PlanningIntelligence', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'planning_start', buildId });

    let result: { blueprint: PlanningBlueprint; contextString: string };
    try {
      result = runPlanningIntelligence({
        buildId,
        prompt,
        complexity,
        chosenPath,
        reasoningScore,
        executionMode,
        totalTokenBudget:  modelBudget?.totalTokenBudget,
        expectedTotalCost: modelBudget?.expectedTotalCost,
        tokenEfficiency:   modelBudget?.tokenEfficiency,
        productScore:      upstream?.productManagerOutput?.productScore,
        frontendScore:     upstream?.frontendArchitectOutput?.overallScore,
        backendScore:      upstream?.backendArchitectOutput?.overallScore,
      });
    } catch {
      const { buildFallbackPlanningBlueprint } = await import('../../planning-intelligence/planningIntelligence.js');
      const blueprint = buildFallbackPlanningBlueprint(buildId);
      result = { blueprint, contextString: '\n\n## V9.7 Planning Intelligence\nFallback mode — minimal planning context.' };
    }

    const { blueprint, contextString } = result;

    sendEvent({
      type:              'planning_progress',
      buildId,
      planningScore:     blueprint.planningScore,
      goalCount:         blueprint.goals.goalCount,
      featureCount:      blueprint.features.coreFeatures.length,
      milestoneCount:    blueprint.milestones.totalMilestones,
      taskCount:         blueprint.tasks.totalTasks,
      riskLevel:         blueprint.risks.overallRiskLevel,
      estimatedDays:     blueprint.estimation.developmentDays,
      dependenciesValid: blueprint.dependencies.isValid,
    });

    sendEvent({
      type:          'planning_complete',
      buildId,
      planningScore: blueprint.planningScore,
      roadmapScore:  blueprint.validation.roadmapScore,
      valid:         blueprint.validation.valid,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after build finishes — records learning. Never throws. */
export function finalizePlanningIntelligenceStep(
  res: Response,
  buildId: string,
  blueprint: PlanningBlueprint,
  buildSucceeded: boolean,
  planningTimeMs: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    learnFromPlanningResult(buildId, blueprint, buildSucceeded, planningTimeMs);
    sendEvent({ type: 'planning_learning', buildId, planningScore: blueprint.planningScore });
  } catch { /* learning/telemetry must never stop a build */ }
}
