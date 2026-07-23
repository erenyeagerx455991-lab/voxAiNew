// ── V10.0 — Context Optimizer ──────────────────────────────────────────────────
import type { SelfOptimizationContext, ContextBlueprint } from './optimizationTypes.js';

export function optimizeContext(ctx: SelfOptimizationContext): ContextBlueprint {
  const efficiency = ctx.tokenEfficiency ?? 0.75;
  const budget = ctx.totalTokenBudget ?? 50_000;

  // Estimate context window usage
  const contextWindowUsage = Math.min(1, (budget / Math.max(1, efficiency)) / 128_000);

  // Unused fraction: tokens in prompt not contributing to output quality
  const unusedContextFraction = Math.max(0, 1 - efficiency - 0.1);

  const contextReductionEnabled = unusedContextFraction > 0.2 || contextWindowUsage > 0.7;

  const contextScore = contextWindowUsage <= 0.5 && unusedContextFraction <= 0.15 ? 9
    : contextWindowUsage <= 0.7 ? 7.5
    : contextWindowUsage <= 0.85 ? 6
    : 4;

  const recommendations: string[] = [];
  if (contextReductionEnabled) recommendations.push(`Reduce context: ~${Math.round(unusedContextFraction * 100)}% unused`);
  if (contextWindowUsage > 0.85) recommendations.push('Context near window limit — trim low-value sections');

  return { contextWindowUsage, unusedContextFraction, contextReductionEnabled, contextScore, recommendations };
}
