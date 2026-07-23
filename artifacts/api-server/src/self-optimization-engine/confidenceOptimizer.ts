// ── V10.0 — Confidence Optimizer ───────────────────────────────────────────────
import type { SelfOptimizationContext, ConfidenceBlueprint } from './optimizationTypes.js';

export function optimizeConfidence(ctx: SelfOptimizationContext): ConfidenceBlueprint {
  const scores = [
    ctx.reasoningScore, ctx.planningScore, ctx.executionScore, ctx.adaptiveScore,
    ctx.qualityScore, ctx.runtimeScore, ctx.knowledgeScore, ctx.workflowScore,
  ].filter((s): s is number => s !== undefined && s > 0);

  const avgScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 7;

  const successRate = ctx.historicalSuccessRate ?? 0.9;
  const efficiency  = ctx.tokenEfficiency ?? 0.75;

  // Execution confidence: weighted average of multiple signals
  const executionConfidence = Math.min(1,
    avgScore / 10 * 0.4 +
    successRate * 0.35 +
    efficiency * 0.25
  );

  const confidenceFactors: string[] = [];
  if (avgScore >= 8) confidenceFactors.push(`high-upstream-scores (avg=${avgScore.toFixed(1)})`);
  if (successRate >= 0.9) confidenceFactors.push(`high-success-rate (${Math.round(successRate * 100)}%)`);
  if (efficiency >= 0.75) confidenceFactors.push(`good-token-efficiency (${Math.round(efficiency * 100)}%)`);
  if (avgScore < 6) confidenceFactors.push('low-upstream-scores — review intelligence engines');
  if (successRate < 0.75) confidenceFactors.push('low-historical-success — check error patterns');

  const riskLevel: ConfidenceBlueprint['riskLevel'] = executionConfidence >= 0.8 ? 'low'
    : executionConfidence >= 0.6 ? 'medium'
    : 'high';

  const confidenceScore = Math.round(executionConfidence * 10 * 10) / 10;

  const recommendations: string[] = [];
  if (riskLevel === 'high') recommendations.push('High risk — enable circuit breaker and conservative mode');
  if (riskLevel === 'medium') recommendations.push('Medium risk — monitor repair/retry rates closely');
  if (executionConfidence >= 0.9) recommendations.push('High confidence — can reduce candidate count to 1');

  return { executionConfidence, confidenceFactors, confidenceScore, riskLevel, recommendations };
}
