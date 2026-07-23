// ── V10.0 — Token Optimizer ────────────────────────────────────────────────────
import type { SelfOptimizationContext, TokenBlueprint } from './optimizationTypes.js';

export function optimizeTokens(ctx: SelfOptimizationContext): TokenBlueprint {
  const budget = ctx.totalTokenBudget ?? 50_000;
  const efficiency = ctx.tokenEfficiency ?? 0.75;
  const compression = ctx.compressionRatio ?? 0.8;

  // Split budget: 40% prompt, 60% completion
  const promptTokenBudget      = Math.round(budget * 0.4);
  const completionTokenBudget  = Math.round(budget * 0.6);
  const estimatedTotalTokens   = Math.round(budget / Math.max(0.1, efficiency));

  const compressionOpportunities: string[] = [];
  if (compression > 0.9) compressionOpportunities.push('Enable prompt compression — low compression ratio detected');
  if (efficiency < 0.6)  compressionOpportunities.push('Remove unused context sections');
  if (efficiency < 0.5)  compressionOpportunities.push('Deduplicate repeated context blocks');

  const duplicateContextSavings = Math.round(estimatedTotalTokens * (1 - compression) * 0.3);

  // Score based on efficiency
  const tokenScore = efficiency >= 0.85 ? 9
    : efficiency >= 0.7  ? 7.5
    : efficiency >= 0.55 ? 6
    : 4;

  const recommendations: string[] = [];
  if (efficiency < 0.7) recommendations.push(`Token efficiency ${Math.round(efficiency * 100)}% below 70% target`);
  if (duplicateContextSavings > 2_000) recommendations.push(`~${duplicateContextSavings} tokens recoverable via deduplication`);

  return {
    estimatedTotalTokens,
    promptTokenBudget,
    completionTokenBudget,
    compressionOpportunities,
    duplicateContextSavings,
    tokenScore,
    recommendations,
  };
}
