// ── V9.6 Execution Cost Planner ───────────────────────────────────────────────
import type { CostEstimate, ExecutionIntelligenceContext } from './executionTypes.js';

// OpenRouter average cost: ~$0.0000008 per token (blended across models)
const COST_PER_TOKEN_USD = 0.0000008;

export function estimateExecutionCost(
  tasks: { estimatedCostTokens: number }[],
  ctx: ExecutionIntelligenceContext,
): CostEstimate {
  const tokenUsage = tasks.reduce((s, t) => s + t.estimatedCostTokens, 0);
  const apiCostUsd = Number((tokenUsage * COST_PER_TOKEN_USD).toFixed(4));
  const infrastructureCost = ctx.complexity === 'enterprise' ? 0.002 : 0.001;
  const totalCost = Number((apiCostUsd + infrastructureCost).toFixed(4));

  // Confidence: higher when context provides an expected budget
  const budgetDelta = ctx.expectedTotalCost
    ? Math.abs(totalCost - ctx.expectedTotalCost) / Math.max(ctx.expectedTotalCost, 0.001)
    : 0.2;
  const costConfidence = Math.max(0.3, Math.min(1, 1 - budgetDelta));

  return { tokenUsage, apiCostUsd, infrastructureCost, totalCost, costConfidence: Number(costConfidence.toFixed(2)) };
}
