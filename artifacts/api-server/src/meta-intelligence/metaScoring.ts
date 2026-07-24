// ── V10.1 — Meta Scoring ───────────────────────────────────────────────────────
// Scores every module on 10 dimensions and returns MetaScoringBlueprint.
// Zero LLM calls. Deterministic weighted formulas only.
import type { MetaContext, MetaScoringBlueprint, ModuleScore } from './metaTypes.js';

const SCORE_WEIGHTS = {
  efficiency:      0.12,
  quality:         0.15,
  reliability:     0.15,
  scalability:     0.10,
  maintainability: 0.08,
  performance:     0.12,
  learning:        0.10,
  optimization:    0.10,
  cost:            0.08,
  confidence:      0.10,
} as const;

function scoreModule(
  name: string,
  baseScore: number,
  failureRate: number,
  latencyMs: number,
  ctx: MetaContext,
): ModuleScore {
  const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 10) / 10));

  const efficiency      = clamp(baseScore - (latencyMs > 20_000 ? 2 : latencyMs > 10_000 ? 1 : 0));
  const quality         = clamp(baseScore);
  const reliability     = clamp((1 - failureRate) * 10);
  const scalability     = clamp(ctx.complexity === 'enterprise' ? baseScore : baseScore * 1.1);
  const maintainability = clamp(7.5); // static modules are inherently maintainable
  const performance     = clamp(baseScore - (latencyMs > 15_000 ? 1.5 : 0));
  const learning        = clamp((ctx.historicalSuccessRate ?? 0.9) * 10 * 0.7 + baseScore * 0.3);
  const optimization    = clamp(ctx.optimizationScore * 0.5 + baseScore * 0.5);
  const cost            = clamp(10 - (failureRate > 0.1 ? 3 : failureRate > 0.05 ? 1.5 : 0)
                                    - ((ctx.retryCount ?? 0) > 2 ? 1 : 0));
  const confidence      = clamp(baseScore * 0.6 + (1 - failureRate) * 10 * 0.4);

  const overall = clamp(
    efficiency      * SCORE_WEIGHTS.efficiency      +
    quality         * SCORE_WEIGHTS.quality         +
    reliability     * SCORE_WEIGHTS.reliability     +
    scalability     * SCORE_WEIGHTS.scalability     +
    maintainability * SCORE_WEIGHTS.maintainability +
    performance     * SCORE_WEIGHTS.performance     +
    learning        * SCORE_WEIGHTS.learning        +
    optimization    * SCORE_WEIGHTS.optimization    +
    cost            * SCORE_WEIGHTS.cost            +
    confidence      * SCORE_WEIGHTS.confidence
  );

  return {
    name, efficiency, quality, reliability, scalability, maintainability,
    performance, learning, optimization, cost, confidence, overall,
  };
}

export function scoreModules(ctx: MetaContext): MetaScoringBlueprint {
  const latencies    = ctx.agentLatencies    ?? {};
  const failureRates = ctx.agentFailureRates ?? {};

  const moduleInputs: Array<[string, number]> = [
    ['ReasoningEngine',        ctx.reasoningScore],
    ['PlanningIntelligence',   ctx.planningScore],
    ['ExecutionIntelligence',  ctx.executionScore],
    ['AdaptiveIntelligence',   ctx.adaptiveScore],
    ['SelfOptimizationEngine', ctx.optimizationScore],
    ['KnowledgeEngine',        ctx.knowledgeScore  ?? 7],
    ['RuntimeIntelligence',    ctx.runtimeScore    ?? 7],
  ];

  const moduleScores: ModuleScore[] = moduleInputs.map(([name, score]) =>
    scoreModule(name, score, failureRates[name] ?? 0, latencies[name] ?? 0, ctx)
  );

  const sorted      = [...moduleScores].sort((a, b) => b.overall - a.overall);
  const topModule   = sorted[0]?.name ?? '';
  const bottomModule = sorted[sorted.length - 1]?.name ?? '';

  const avgModuleScore = moduleScores.length > 0
    ? Math.round(moduleScores.reduce((s, m) => s + m.overall, 0) / moduleScores.length * 10) / 10
    : 7;

  const scoringScore = Math.min(10, avgModuleScore);

  return { moduleScores, topModule, bottomModule, avgModuleScore, scoringScore };
}
