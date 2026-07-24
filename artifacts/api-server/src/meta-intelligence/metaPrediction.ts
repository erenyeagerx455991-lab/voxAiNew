// ── V10.1 — Meta Prediction ────────────────────────────────────────────────────
// Predicts future build quality, time, cost, and success rate.
// Zero LLM calls. Deterministic weighted formulas only.
import type { MetaContext, MetaPredictionBlueprint } from './metaTypes.js';

const BASE_BUILD_MS: Record<string, number> = {
  simple:     60_000,
  standard:   120_000,
  enterprise: 180_000,
};

export function predictOutcomes(ctx: MetaContext): MetaPredictionBlueprint {
  const repairAttempts  = ctx.repairAttempts  ?? 0;
  const retryCount      = ctx.retryCount      ?? 0;
  const successRate     = ctx.historicalSuccessRate ?? 0.9;
  const tokenEfficiency = ctx.tokenEfficiency  ?? 0.75;
  const parallelEff     = ctx.parallelEfficiency ?? 0.7;

  // Predicted quality score: weighted average of upstream intelligence scores
  const qualityInputs = [
    ctx.reasoningScore   * 0.20,
    ctx.planningScore    * 0.20,
    ctx.executionScore   * 0.15,
    ctx.adaptiveScore    * 0.15,
    ctx.optimizationScore * 0.15,
    (ctx.qualityScore  ?? 7) * 0.15,
  ];
  const predictedQualityScore = Math.min(10,
    Math.round(qualityInputs.reduce((a, b) => a + b, 0) * 10) / 10
  );

  // Predicted build time: base × complexity penalty × repair overhead × parallel savings
  const baseBuildMs       = BASE_BUILD_MS[ctx.complexity] ?? 120_000;
  const repairOverhead    = 1 + repairAttempts * 0.15;
  const retryOverhead     = 1 + retryCount * 0.05;
  const parallelSavings   = 1 - (parallelEff - 0.5) * 0.3;
  const predictedBuildTimeMs = Math.round(
    baseBuildMs * repairOverhead * retryOverhead * parallelSavings
  );

  // Predicted cost: based on token efficiency and retry/repair overhead
  const baseCostByComplexity: Record<string, number> = {
    simple: 0.02, standard: 0.05, enterprise: 0.10,
  };
  const baseCost = baseCostByComplexity[ctx.complexity] ?? 0.05;
  const tokenWaste = 1 + (1 - tokenEfficiency) * 0.5;
  const repairCost = 1 + repairAttempts * 0.1;
  const predictedCost = Math.round(baseCost * tokenWaste * repairCost * 1000) / 1000;

  // Predicted success rate: weighted by historical rate + engine scores
  const engineAvg = (
    ctx.reasoningScore + ctx.planningScore + ctx.executionScore +
    ctx.adaptiveScore + ctx.optimizationScore
  ) / 5;
  const predictedSuccessRate = Math.min(1,
    Math.round((successRate * 0.6 + (engineAvg / 10) * 0.4) * 100) / 100
  );

  // Prediction confidence: how reliable are the upstream signals?
  const hasLatencies = Object.keys(ctx.agentLatencies ?? {}).length > 0;
  const hasHistory   = (ctx.historicalBuildTimeMs ?? 0) > 0;
  const predictionConfidence = Math.min(1,
    0.6 + (hasLatencies ? 0.2 : 0) + (hasHistory ? 0.2 : 0)
  );

  // Prediction score: how good is the outlook?
  const predictionScore = Math.round(
    predictedQualityScore * 0.4 +
    predictedSuccessRate * 10 * 0.4 +
    predictionConfidence * 10 * 0.2
  * 10) / 10;

  const recommendations: string[] = [];
  if (predictedQualityScore < 7)
    recommendations.push('Predicted quality below threshold — increase reasoning and planning scores');
  if (predictedSuccessRate < 0.8)
    recommendations.push('Success rate forecast low — investigate historical failure patterns');
  if (predictedCost > 0.08)
    recommendations.push('Cost forecast high — enable token compression and reduce repair passes');
  if (predictionConfidence < 0.7)
    recommendations.push('Low prediction confidence — provide more telemetry data for accurate forecasting');
  if (predictedBuildTimeMs > 180_000)
    recommendations.push('Build time forecast long — improve parallel execution efficiency');

  return {
    predictedQualityScore,
    predictedBuildTimeMs,
    predictedCost,
    predictedSuccessRate,
    predictionConfidence,
    predictionScore,
    recommendations,
  };
}
