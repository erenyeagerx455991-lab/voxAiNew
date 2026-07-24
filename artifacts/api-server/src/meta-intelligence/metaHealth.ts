// ── V10.1 — Meta Health ────────────────────────────────────────────────────────
// Computes 7 health dimensions and an overall health status.
// Zero LLM calls. Deterministic weighted formulas only.
import type { MetaContext, MetaHealthBlueprint } from './metaTypes.js';

type HealthStatus = MetaHealthBlueprint['healthStatus'];

export function computeHealth(ctx: MetaContext): MetaHealthBlueprint {
  const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 10) / 10));

  const repairAttempts  = ctx.repairAttempts  ?? 0;
  const retryCount      = ctx.retryCount      ?? 0;
  const parallelEff     = ctx.parallelEfficiency ?? 0.7;
  const cacheHitRate    = ctx.cacheHitRate     ?? 0.5;
  const tokenEfficiency = ctx.tokenEfficiency  ?? 0.75;
  const memoryUsage     = ctx.memoryUsage       ?? 512;
  const successRate     = ctx.historicalSuccessRate ?? 0.9;
  const failureRates    = ctx.agentFailureRates ?? {};

  // System health: overall engine score average
  const allScores = [
    ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
    ctx.adaptiveScore,  ctx.optimizationScore,
    ctx.qualityScore  ?? 7, ctx.runtimeScore   ?? 7,
    ctx.knowledgeScore ?? 7, ctx.workflowScore  ?? 7,
  ];
  const systemHealth = clamp(allScores.reduce((a, b) => a + b, 0) / allScores.length);

  // Module health: based on individual engine scores
  const coreScores = [
    ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
    ctx.adaptiveScore,  ctx.optimizationScore,
  ];
  const moduleHealth = clamp(coreScores.reduce((a, b) => a + b, 0) / coreScores.length);

  // Pipeline health: based on repair/retry rates and success
  const repairPenalty  = Math.min(3, repairAttempts * 0.5);
  const retryPenalty   = Math.min(2, retryCount * 0.4);
  const pipelineHealth = clamp(10 - repairPenalty - retryPenalty + (successRate - 0.9) * 5);

  // Agent health: based on failure rates
  const failRateValues = Object.values(failureRates);
  const avgFailureRate = failRateValues.length > 0
    ? failRateValues.reduce((a, b) => a + b, 0) / failRateValues.length
    : 0;
  const agentHealth = clamp((1 - avgFailureRate) * 10);

  // Learning health: based on historical success rate and build time
  const buildTimeOk = (ctx.historicalBuildTimeMs ?? 120_000) < 200_000;
  const learningHealth = clamp(successRate * 10 * 0.7 + (buildTimeOk ? 3 : 1.5));

  // Memory health: lower usage = healthier
  const memoryHealth = clamp(
    memoryUsage < 256  ? 10 :
    memoryUsage < 512  ? 9  :
    memoryUsage < 1024 ? 7  :
    memoryUsage < 1536 ? 5  : 3
  );

  // Optimization health: token efficiency + parallel + cache
  const optimizationHealth = clamp(
    tokenEfficiency * 4 + parallelEff * 3 + cacheHitRate * 3
  );

  // Overall: weighted average
  const overallHealth = clamp(
    systemHealth      * 0.20 +
    moduleHealth      * 0.15 +
    pipelineHealth    * 0.20 +
    agentHealth       * 0.15 +
    learningHealth    * 0.10 +
    memoryHealth      * 0.10 +
    optimizationHealth * 0.10
  );

  const healthStatus: HealthStatus =
    overallHealth >= 8.5 ? 'optimal' :
    overallHealth >= 7.0 ? 'healthy' :
    overallHealth >= 5.0 ? 'degraded' :
    'critical';

  return {
    systemHealth,
    moduleHealth,
    pipelineHealth,
    agentHealth,
    learningHealth,
    memoryHealth,
    optimizationHealth,
    overallHealth,
    healthStatus,
  };
}
