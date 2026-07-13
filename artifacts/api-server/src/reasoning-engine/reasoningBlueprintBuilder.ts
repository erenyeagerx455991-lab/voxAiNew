// ── V9.5 Reasoning Blueprint Builder ──────────────────────────────────────────
// Orchestrates every reasoning module into one ReasoningBlueprint. Static/
// deterministic — no LLM calls. Failures fall back to a safe default blueprint.
import type { ReasoningBlueprint, ReasoningContext } from './types.js';
import { analyzeGoals } from './goalReasoning.js';
import { analyzeConstraints } from './constraintReasoning.js';
import { detectAmbiguity } from './ambiguityResolution.js';
import { analyzeTradeoffs } from './tradeoffAnalysis.js';
import { generatePaths, selectOptimalPath } from './multiPathReasoning.js';
import { evaluateDecision } from './decisionMatrix.js';
import { computeConfidence } from './confidenceEngine.js';
import { resolveConflicts } from './conflictResolution.js';
import { buildExplanation } from './decisionExplanation.js';
import { scoreAllDomains } from './reasoningDomains.js';
import { linkDecisionChain } from './decisionGraph.js';

export function buildReasoningBlueprint(ctx: ReasoningContext): ReasoningBlueprint {
  const goals = analyzeGoals(ctx.prompt);
  const constraints = analyzeConstraints(ctx);
  const ambiguity = detectAmbiguity(ctx.prompt);
  const tradeoffs = analyzeTradeoffs(goals, constraints);
  const paths = generatePaths(constraints, tradeoffs);
  const chosenPath = selectOptimalPath(paths, constraints, tradeoffs);
  const decisionMatrix = evaluateDecision(chosenPath, ctx, constraints, ambiguity);
  const confidence = computeConfidence(decisionMatrix, ambiguity, paths);
  const conflictsResolved = resolveConflicts(constraints, tradeoffs);
  const explanation = buildExplanation(ctx.buildId, chosenPath, paths, decisionMatrix, conflictsResolved);
  const domainScores = scoreAllDomains(ctx, ambiguity);

  try {
    linkDecisionChain(ctx.buildId, {
      Goal: goals.primaryGoal,
      Reasoning: `${paths.length} paths reasoned over`,
      Decision: `Path ${chosenPath.id}: ${chosenPath.name}`,
      Architecture: `${ctx.complexity} complexity`,
    });
  } catch { /* graph linking must never stop a build */ }

  return {
    buildId: ctx.buildId,
    goals,
    constraints,
    ambiguity,
    tradeoffs,
    paths,
    chosenPath,
    decisionMatrix,
    confidence,
    explanation,
    conflictsResolved,
    domainScores,
    recordedAt: Date.now(),
    version: 0, // assigned by persistence layer on save
  };
}

/** Safe fallback used if the blueprint builder throws for any reason. */
export function buildFallbackReasoningBlueprint(buildId: string): ReasoningBlueprint {
  return buildReasoningBlueprint({ buildId, prompt: '', complexity: 'standard' });
}
