// ── V10.0 — Quality Optimizer ──────────────────────────────────────────────────
import type { SelfOptimizationContext, QualityBlueprint } from './optimizationTypes.js';

export function optimizeQuality(ctx: SelfOptimizationContext): QualityBlueprint {
  const adaptiveScore = ctx.adaptiveScore ?? 7.5;
  const executionScore = ctx.executionScore ?? 7.5;

  // Quality threshold: driven by complexity
  const qualityThreshold = ctx.complexity === 'enterprise' ? 8.5
    : ctx.complexity === 'simple' ? 6.5
    : 7.5;

  const repairThreshold = qualityThreshold - 0.5;

  // Candidate count: more for complex/high-quality
  const candidateCount = ctx.complexity === 'enterprise' ? 3
    : ctx.complexity === 'simple' ? 1
    : adaptiveScore >= 8 ? 3
    : 2;

  let executionMode: QualityBlueprint['executionMode'];
  if (ctx.complexity === 'enterprise' || adaptiveScore >= 8.5) executionMode = 'thorough';
  else if (ctx.complexity === 'simple') executionMode = 'fast';
  else executionMode = 'standard';

  let validationStrictness: QualityBlueprint['validationStrictness'];
  if (ctx.complexity === 'enterprise') validationStrictness = 'strict';
  else if (ctx.complexity === 'simple') validationStrictness = 'permissive';
  else validationStrictness = 'standard';

  const qualityScore = Math.min(10, (adaptiveScore + executionScore) / 2);

  const recommendations: string[] = [];
  if (candidateCount === 1 && ctx.complexity !== 'simple') recommendations.push('Consider 2 candidates for better quality safety net');
  if (executionMode === 'thorough') recommendations.push('Thorough mode: expect longer build times');

  return { qualityThreshold, repairThreshold, candidateCount, executionMode, validationStrictness, qualityScore, recommendations };
}
