// ── V10.0 — Retry Optimizer ────────────────────────────────────────────────────
import type { SelfOptimizationContext, RetryBlueprint } from './optimizationTypes.js';

export function optimizeRetry(ctx: SelfOptimizationContext): RetryBlueprint {
  const retries = ctx.retryCount ?? 0;
  const successRate = ctx.historicalSuccessRate ?? 0.9;
  const efficiency = ctx.tokenEfficiency ?? 0.75;

  let maxRetries: number;
  if (ctx.complexity === 'enterprise') maxRetries = 3;
  else if (ctx.complexity === 'simple' || efficiency < 0.5) maxRetries = 1;
  else maxRetries = 2;

  // Delay: exponential for enterprise, fixed for simple
  const retryDelay = ctx.complexity === 'enterprise' ? 2_000
    : ctx.complexity === 'simple' ? 500
    : 1_000;

  let retryStrategy: RetryBlueprint['retryStrategy'];
  if (maxRetries === 0 || efficiency < 0.4) retryStrategy = 'none';
  else if (ctx.complexity === 'enterprise') retryStrategy = 'exponential';
  else if (ctx.complexity === 'simple') retryStrategy = 'fixed';
  else retryStrategy = 'linear';

  const retryConfidence = successRate >= 0.9 ? 0.9
    : successRate >= 0.75 ? 0.75
    : 0.5;

  // Score: penalize high actual retry count
  const retryScore = retries === 0 ? 9
    : retries === 1 ? 8
    : retries <= 3 ? 6
    : 4;

  const recommendations: string[] = [];
  if (retries > 2) recommendations.push(`${retries} retries detected — improve upstream error handling`);
  if (retryStrategy === 'exponential') recommendations.push('Exponential backoff recommended for enterprise reliability');
  if (retryStrategy === 'none') recommendations.push('No retries — ensure first-pass success rate is high');

  return { maxRetries, retryDelay, retryStrategy, retryConfidence, retryScore, recommendations };
}
