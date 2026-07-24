// ── V10.1 — Meta Recommendations ──────────────────────────────────────────────
// Generates immediate, short-term, and long-term actionable recommendations.
// Zero LLM calls. Deterministic.
import type { MetaContext, MetaRecommendationsBlueprint } from './metaTypes.js';

export function generateRecommendations(ctx: MetaContext): MetaRecommendationsBlueprint {
  const repairAttempts  = ctx.repairAttempts  ?? 0;
  const retryCount      = ctx.retryCount      ?? 0;
  const tokenEfficiency = ctx.tokenEfficiency  ?? 0.75;
  const cacheHitRate    = ctx.cacheHitRate     ?? 0.5;
  const parallelEff     = ctx.parallelEfficiency ?? 0.7;
  const memoryUsage     = ctx.memoryUsage       ?? 512;
  const successRate     = ctx.historicalSuccessRate ?? 0.9;

  const immediate: string[] = [];
  const shortTerm: string[]  = [];
  const longTerm: string[]   = [];

  // ── Immediate (act now) ──────────────────────────────────────────────────────
  if (repairAttempts > 4)
    immediate.push('Reduce repair passes immediately — excessive iteration detected');
  if (retryCount > 4)
    immediate.push('Investigate API rate-limit or stability issue causing high retries');
  if (tokenEfficiency < 0.4)
    immediate.push('Enable prompt compression — token waste is critical');
  if (memoryUsage > 2_000)
    immediate.push('Enable aggressive garbage collection — memory usage dangerously high');
  if (ctx.reasoningScore < 5)
    immediate.push('ReasoningEngine score critical — upstream inputs need urgent review');
  if (successRate < 0.6)
    immediate.push('Historical success rate below 60% — enable conservative build mode');

  // ── Short-term (next build) ──────────────────────────────────────────────────
  if (parallelEff < 0.5)
    shortTerm.push('Increase parallel execution degree to reduce overall latency');
  if (cacheHitRate < 0.4)
    shortTerm.push('Warm up knowledge cache with frequently-requested reference sites');
  if (ctx.adaptiveScore < 7)
    shortTerm.push('Review adaptive intelligence configuration for current complexity level');
  if (ctx.planningScore < 7)
    shortTerm.push('Strengthen planning phase inputs — reasoning and execution scores feed planning');
  if (tokenEfficiency < 0.65)
    shortTerm.push('Enable deduplication of repeated context blocks across agents');
  if (repairAttempts >= 2)
    shortTerm.push('Review frontend codegen prompts — recurring repair suggests systemic quality gap');
  if ((ctx.qualityScore ?? 8) < 7)
    shortTerm.push('Tune design evaluator threshold — current quality output below standard target');

  // ── Long-term (systemic) ─────────────────────────────────────────────────────
  if (ctx.complexity === 'enterprise' && parallelEff < 0.7)
    longTerm.push('Architect concurrent agent wave execution for enterprise builds');
  if (successRate < 0.85)
    longTerm.push('Invest in build-level failure analysis to identify systemic root causes');
  if (ctx.optimizationScore < 8)
    longTerm.push('Calibrate self-optimization thresholds against observed build outcomes');
  if ((ctx.knowledgeScore ?? 7) < 7)
    longTerm.push('Expand knowledge corpus with higher-quality reference sites');
  if (cacheHitRate < 0.5)
    longTerm.push('Implement semantic cache pre-warming based on industry/complexity patterns');
  longTerm.push('Maintain continuous telemetry collection to feed meta-intelligence learning loop');
  if (ctx.executionScore >= 8 && ctx.adaptiveScore >= 8)
    longTerm.push('System approaching maturity — consider V10.2 autonomous software company layer');

  const totalCount = immediate.length + shortTerm.length + longTerm.length;

  // Recommendation score: fewer urgent issues = higher score
  const urgencyPenalty = immediate.length * 1.5 + shortTerm.length * 0.5;
  const recommendationScore = Math.max(0, Math.min(10,
    Math.round((10 - urgencyPenalty) * 10) / 10
  ));

  return { immediate, shortTerm, longTerm, totalCount, recommendationScore };
}
