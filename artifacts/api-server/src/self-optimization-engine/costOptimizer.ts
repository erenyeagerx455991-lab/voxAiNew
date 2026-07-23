// ── V10.0 — Cost Optimizer ─────────────────────────────────────────────────────
import type { SelfOptimizationContext, CostBlueprint } from './optimizationTypes.js';

export function optimizeCost(ctx: SelfOptimizationContext): CostBlueprint {
  const base = ctx.expectedTotalCost ?? 0.05;
  const repairs = ctx.repairAttempts ?? 0;
  const retries = ctx.retryCount ?? 0;

  const repairCostEstimate = Math.round(base * 0.15 * repairs * 100) / 100;
  const retryCostEstimate  = Math.round(base * 0.05 * retries * 100) / 100;
  const llmCallCostEstimate = Math.round(base * 0.7 * 100) / 100;
  const estimatedTotalCost  = Math.round((base + repairCostEstimate + retryCostEstimate) * 100) / 100;

  const efficiency = ctx.tokenEfficiency ?? 0.75;
  let costMode: CostBlueprint['costMode'];
  if (efficiency < 0.5 || estimatedTotalCost > base * 1.5) costMode = 'aggressive';
  else if (estimatedTotalCost > base * 1.2) costMode = 'moderate';
  else costMode = 'none';

  // Score: penalize high repair/retry cost
  const overrun = estimatedTotalCost / Math.max(0.001, base);
  const costScore = overrun <= 1.05 ? 9
    : overrun <= 1.2 ? 7.5
    : overrun <= 1.5 ? 6
    : 4;

  const recommendations: string[] = [];
  if (repairs > 2) recommendations.push(`${repairs} repair attempts increasing cost — raise quality threshold`);
  if (retries > 1) recommendations.push(`${retries} retries detected — improve upstream reliability`);
  if (costMode === 'aggressive') recommendations.push('Enable aggressive cost mode — reduce model tier');

  return { estimatedTotalCost, repairCostEstimate, retryCostEstimate, llmCallCostEstimate, costScore, costMode, recommendations };
}
