// ── V9.5 Autonomous Reasoning & Decision Intelligence Engine — Pipeline Step ──
//
// Runs as step 0.99 — the last step before the Planner, after ModelOrchestrator
// (0.95) and KnowledgeEngine (0.97). Builds a full ReasoningBlueprint (goals,
// constraints, ambiguity, trade-offs, multi-path reasoning, decision matrix,
// confidence, conflicts, explanation, domain scores), persists a versioned
// snapshot, and hands the blueprint to every downstream agent.
//
// Static/deterministic — no new outbound LLM calls. Failures MUST NEVER stop
// a build; on error, falls back to a safe default blueprint.
import type { Response } from 'express';
import type { ReasoningBlueprint, ReasoningContext } from '../../reasoning-engine/types.js';
import { buildReasoningBlueprint, buildFallbackReasoningBlueprint } from '../../reasoning-engine/reasoningBlueprintBuilder.js';
import { persistReasoningSnapshot } from '../../reasoning-engine/reasoningPersistence.js';
import { learnFromDecision } from '../../reasoning-engine/reasoningLearning.js';
import { recordReasoningExecution } from '../../reasoning-engine/reasoningMetrics.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

export interface ReasoningStepUpstream {
  productManagerOutput?:     { productScore?: number };
  frontendArchitectOutput?:  { overallScore?: number };
  backendArchitectOutput?:   { overallScore?: number };
  devopsArchitectOutput?:    { overallScore?: number };
  qaArchitectOutput?:        { overallScore?: number };
  runtimeIntelligenceOutput?: { overallScore?: number };
  securityScore?:            number;
  knowledgeScore?:           number;
}

export interface ReasoningStepOutput {
  buildId:        string;
  blueprint:      ReasoningBlueprint;
  contextString:  string;
}

export async function runReasoningEngineStep(
  buildId: string,
  res: Response,
  prompt: string,
  complexity: 'simple' | 'standard' | 'enterprise',
  modelBudget: { totalTokenBudget?: number; tokenEfficiency?: number; expectedTotalCost?: number; fallbackPrediction?: number } | undefined,
  upstream: ReasoningStepUpstream,
): Promise<ReasoningStepOutput> {
  return withAgentMetrics('ReasoningEngine', async () => {
    const startedAt = Date.now();
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'reasoning_start', buildId });

    const ctx: ReasoningContext = {
      prompt,
      buildId,
      complexity,
      productScore:       upstream.productManagerOutput?.productScore,
      frontendScore:      upstream.frontendArchitectOutput?.overallScore,
      backendScore:        upstream.backendArchitectOutput?.overallScore,
      devopsScore:         upstream.devopsArchitectOutput?.overallScore,
      qaScore:             upstream.qaArchitectOutput?.overallScore,
      runtimeScore:        upstream.runtimeIntelligenceOutput?.overallScore,
      securityScore:       upstream.securityScore,
      knowledgeScore:      upstream.knowledgeScore,
      tokenEfficiency:     modelBudget?.tokenEfficiency,
      fallbackPrediction:  modelBudget?.fallbackPrediction,
      totalTokenBudget:    modelBudget?.totalTokenBudget,
      expectedTotalCost:   modelBudget?.expectedTotalCost,
    };

    let blueprint: ReasoningBlueprint;
    try {
      blueprint = buildReasoningBlueprint(ctx);
    } catch {
      blueprint = buildFallbackReasoningBlueprint(buildId);
    }

    sendEvent({
      type:           'reasoning_progress',
      buildId,
      chosenPath:     blueprint.chosenPath.id,
      confidenceScore: blueprint.confidence.confidenceScore,
      conflictsResolved: blueprint.conflictsResolved.length,
    });

    try {
      persistReasoningSnapshot(buildId, blueprint);
    } catch { /* persistence must never stop a build */ }

    const decisionLatencyMs = Date.now() - startedAt;
    try {
      const tradeoffSpread = blueprint.tradeoffs.scores[blueprint.tradeoffs.dominant] - blueprint.tradeoffs.scores[blueprint.tradeoffs.weakest];
      recordReasoningExecution({
        buildId,
        confidenceScore:   blueprint.confidence.confidenceScore,
        decisionQuality:   blueprint.decisionMatrix.compositeScore,
        tradeoffAccuracy:  Math.max(0, 10 - tradeoffSpread * 0.3),
        riskScore:         blueprint.confidence.riskScore,
        alternativesCount: blueprint.paths.length,
        decisionLatencyMs,
        recordedAt: Date.now(),
      });
    } catch { /* telemetry must never stop a build */ }

    const contextString = [
      `\nReasoning Engine — primary goal: ${blueprint.goals.primaryGoal}`,
      `\nReasoning Engine — chosen strategy: ${blueprint.chosenPath.name} (${blueprint.explanation.whyChosen})`,
    ].join('');

    sendEvent({
      type:    'reasoning_complete',
      buildId,
      chosenPath: blueprint.chosenPath.id,
      decisionQuality: blueprint.decisionMatrix.compositeScore,
    });

    return { buildId, blueprint, contextString };
  });
}

/** Called after the build finishes — records learning. Never throws. */
export function finalizeReasoningEngineExecution(
  res: Response,
  buildId: string,
  blueprint: ReasoningBlueprint,
  overallScore: number,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    void learnFromDecision({
      buildId,
      chosenPathId: blueprint.chosenPath.id,
      confidenceScore: blueprint.confidence.confidenceScore,
      productionSuccess: overallScore >= 6,
      overallScore,
      recordedAt: Date.now(),
    });

    sendEvent({
      type: 'reasoning_learning',
      buildId,
      overallScore,
    });
  } catch { /* learning/telemetry must never stop a build */ }
}
