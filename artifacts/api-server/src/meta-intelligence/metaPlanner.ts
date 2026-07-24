// ── V10.1 — Meta Planner ───────────────────────────────────────────────────────
// Produces recommendations for every major pipeline domain.
// Zero LLM calls. Purely deterministic.
import type { MetaContext, MetaPlannerBlueprint } from './metaTypes.js';

export function planMetaRecommendations(ctx: MetaContext): MetaPlannerBlueprint {
  const repairAttempts    = ctx.repairAttempts    ?? 0;
  const retryCount        = ctx.retryCount        ?? 0;
  const parallelEff       = ctx.parallelEfficiency ?? 0.7;
  const cacheHitRate      = ctx.cacheHitRate       ?? 0.5;
  const tokenEfficiency   = ctx.tokenEfficiency    ?? 0.75;
  const successRate       = ctx.historicalSuccessRate ?? 0.9;
  const memoryUsage       = ctx.memoryUsage        ?? 512;

  // Planner recommendations
  const plannerRecommendations: string[] = [];
  if (ctx.reasoningScore < 7)   plannerRecommendations.push('Increase reasoning depth — score below threshold');
  if (ctx.planningScore < 7)    plannerRecommendations.push('Strengthen planning intelligence — low confidence detected');
  if (ctx.complexity === 'enterprise') plannerRecommendations.push('Enable extended planning horizon for enterprise builds');
  if (ctx.planningScore >= 8)   plannerRecommendations.push('Planning operating optimally — maintain current configuration');

  // Workflow recommendations
  const workflowRecommendations: string[] = [];
  if (ctx.workflowScore !== undefined && ctx.workflowScore < 6)
    workflowRecommendations.push('Workflow score low — review step ordering and skip logic');
  if (ctx.complexity === 'simple')
    workflowRecommendations.push('Skip optional enrichment steps for simple builds to reduce latency');
  if (parallelEff < 0.5)
    workflowRecommendations.push('Increase parallel execution degree — current efficiency below 50%');
  if (parallelEff >= 0.8)
    workflowRecommendations.push('Parallel execution effective — consider adding more concurrent waves');

  // Knowledge recommendations
  const knowledgeRecommendations: string[] = [];
  if ((ctx.knowledgeScore ?? 7) < 7)
    knowledgeRecommendations.push('Knowledge retrieval score low — review RAG corpus coverage');
  if (cacheHitRate < 0.4)
    knowledgeRecommendations.push('Low cache hit rate — expand cache TTL or warm up frequently-used references');
  if (cacheHitRate >= 0.7)
    knowledgeRecommendations.push('Cache utilization strong — consider increasing cache allocation');

  // Execution recommendations
  const executionRecommendations: string[] = [];
  if (ctx.executionScore < 7)
    executionRecommendations.push('Execution intelligence score low — review critical path planning');
  if (ctx.optimizationScore < 7)
    executionRecommendations.push('Self-optimization score low — check token and cost budgets');
  if (ctx.executionScore >= 8 && ctx.optimizationScore >= 8)
    executionRecommendations.push('Execution and optimization at high confidence — maintain current strategy');

  // Reasoning recommendations
  const reasoningRecommendations: string[] = [];
  if (ctx.reasoningScore < 6)
    reasoningRecommendations.push('Reasoning score critical — check upstream scores feeding the reasoning engine');
  if (ctx.adaptiveScore < 7)
    reasoningRecommendations.push('Adaptive intelligence below threshold — review failure adaptation logic');
  if (ctx.reasoningScore >= 8)
    reasoningRecommendations.push('Reasoning strong — good foundation for high-quality generation');

  // Repair recommendations
  const repairRecommendations: string[] = [];
  if (repairAttempts > 3)
    repairRecommendations.push('High repair frequency — consider raising quality threshold or improving codegen');
  if (repairAttempts === 0)
    repairRecommendations.push('Zero repairs needed — generation quality excellent');
  if (repairAttempts >= 2 && repairAttempts <= 3)
    repairRecommendations.push('Moderate repair activity — monitor for increasing trend');

  // Retry recommendations
  const retryRecommendations: string[] = [];
  if (retryCount > 3)
    retryRecommendations.push('High retry count — investigate API stability and rate limit headroom');
  if (retryCount === 0)
    retryRecommendations.push('Zero retries — API stability excellent');
  if (retryCount > 0 && tokenEfficiency < 0.6)
    retryRecommendations.push('Retries combined with low token efficiency — consider exponential backoff');

  // Resource recommendations
  const resourceRecommendations: string[] = [];
  if (memoryUsage > 1_500)
    resourceRecommendations.push('High memory usage — enable aggressive GC and context compression');
  if (memoryUsage < 256)
    resourceRecommendations.push('Low memory usage — can increase cache allocation for better performance');
  if (tokenEfficiency < 0.6)
    resourceRecommendations.push('Token efficiency low — enable prompt compression and deduplication');
  if (tokenEfficiency >= 0.85)
    resourceRecommendations.push('Token efficiency excellent — minimal waste detected');

  // Parallel recommendations
  const parallelRecommendations: string[] = [];
  if (parallelEff < 0.4)
    parallelRecommendations.push('Parallel efficiency critically low — review dependency chains blocking concurrency');
  if (ctx.complexity === 'enterprise' && parallelEff < 0.6)
    parallelRecommendations.push('Enterprise build with low parallelism — significant latency improvement possible');
  if (parallelEff >= 0.75)
    parallelRecommendations.push('Parallel execution well-utilized');

  // Ordering recommendations
  const orderingRecommendations: string[] = [];
  if (successRate < 0.8)
    orderingRecommendations.push('Low success rate — prioritize critical-path agents first to fail fast');
  if (ctx.complexity === 'enterprise')
    orderingRecommendations.push('Enterprise: use quality-first ordering to maximize output score');
  if (ctx.complexity === 'simple')
    orderingRecommendations.push('Simple: use cost-first ordering to minimize unnecessary steps');

  // Planner score: average of domain health
  const domainScores = [
    ctx.planningScore, ctx.reasoningScore, ctx.executionScore,
    ctx.adaptiveScore, ctx.optimizationScore,
    (ctx.knowledgeScore ?? 7), (ctx.workflowScore ?? 7),
  ];
  const plannerScore = Math.round(
    domainScores.reduce((s, v) => s + v, 0) / domainScores.length * 10
  ) / 10;

  return {
    plannerRecommendations,
    workflowRecommendations,
    knowledgeRecommendations,
    executionRecommendations,
    reasoningRecommendations,
    repairRecommendations,
    retryRecommendations,
    resourceRecommendations,
    parallelRecommendations,
    orderingRecommendations,
    plannerScore,
  };
}
