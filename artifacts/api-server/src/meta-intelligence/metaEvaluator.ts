// ── V10.1 — Meta Evaluator ─────────────────────────────────────────────────────
// Evaluates every intelligence engine on 5 dimensions.
// Returns MetaEvaluatorBlueprint. Zero LLM calls.
import type { MetaContext, MetaEvaluatorBlueprint, EngineEvaluation } from './metaTypes.js';

function evaluateEngine(
  name: string,
  score: number,
  failureRate: number,
  latencyMs: number,
): EngineEvaluation {
  const stability = Math.max(0, Math.round((1 - failureRate) * 10 * 10) / 10);
  const latencyPenalty = latencyMs > 30_000 ? 2 : latencyMs > 15_000 ? 1 : 0;
  const confidence = Math.min(1, (score / 10) * 0.6 + (1 - failureRate) * 0.4);
  const improvementPotential = Math.round(Math.max(0, 10 - score) * 10) / 10;
  const risk: EngineEvaluation['risk'] =
    score < 5 || failureRate > 0.2 ? 'high'
    : score < 7 || failureRate > 0.1 ? 'medium'
    : 'low';

  const engineScore = Math.max(0, Math.min(10,
    Math.round((score - latencyPenalty) * 10) / 10
  ));

  const recommendations: string[] = [];
  if (score < 6)           recommendations.push(`${name}: score critically low (${score}/10) — review inputs`);
  if (failureRate > 0.1)   recommendations.push(`${name}: failure rate ${Math.round(failureRate * 100)}% — investigate stability`);
  if (latencyMs > 20_000)  recommendations.push(`${name}: high latency (${Math.round(latencyMs / 1000)}s) — optimize`);
  if (improvementPotential > 3) recommendations.push(`${name}: ${improvementPotential}/10 improvement potential available`);

  return { name, score: engineScore, confidence, risk, improvementPotential, stability, recommendations };
}

export function evaluateEngines(ctx: MetaContext): MetaEvaluatorBlueprint {
  const latencies    = ctx.agentLatencies    ?? {};
  const failureRates = ctx.agentFailureRates ?? {};

  const engineInputs: Array<[string, number]> = [
    ['ReasoningEngine',        ctx.reasoningScore],
    ['PlanningIntelligence',   ctx.planningScore],
    ['ExecutionIntelligence',  ctx.executionScore],
    ['AdaptiveIntelligence',   ctx.adaptiveScore],
    ['SelfOptimizationEngine', ctx.optimizationScore],
    ['KnowledgeEngine',        ctx.knowledgeScore  ?? 7],
    ['RuntimeIntelligence',    ctx.runtimeScore    ?? 7],
    ['WorkflowIntelligence',   ctx.workflowScore   ?? 7],
  ];

  const engines: EngineEvaluation[] = engineInputs.map(([name, score]) =>
    evaluateEngine(
      name,
      score,
      failureRates[name] ?? 0,
      latencies[name]    ?? 0,
    )
  );

  const sorted = [...engines].sort((a, b) => b.score - a.score);
  const bestEngine  = sorted[0]?.name  ?? engines[0]?.name  ?? 'unknown';
  const worstEngine = sorted[sorted.length - 1]?.name ?? engines[engines.length - 1]?.name ?? 'unknown';

  const avgScore = engines.length > 0
    ? Math.round(engines.reduce((s, e) => s + e.score, 0) / engines.length * 10) / 10
    : 7;

  const evaluatorScore = Math.min(10, Math.round(avgScore * 10) / 10);

  return { engines, bestEngine, worstEngine, avgScore, evaluatorScore };
}
