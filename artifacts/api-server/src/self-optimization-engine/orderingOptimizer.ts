// ── V10.0 — Ordering Optimizer ─────────────────────────────────────────────────
import type { SelfOptimizationContext, OrderingBlueprint } from './optimizationTypes.js';

const QUALITY_FIRST_ORDER = [
  'DesignEvaluator', 'DesignCritic', 'Frontend', 'Architecture', 'Repair',
  'Backend', 'RuntimeValidation', 'ConversionIntelligence',
];

const COST_FIRST_ORDER = [
  'Architecture', 'Frontend', 'Backend', 'RuntimeValidation',
  'DesignEvaluator', 'Repair',
];

const CRITICAL_PATH_ORDER = [
  'Planner', 'Architecture', 'Frontend', 'Backend', 'Repair', 'RuntimeValidation',
];

const BALANCED_ORDER = [
  'Planner', 'Architecture', 'Frontend', 'CandidateSelection', 'Repair',
  'DesignEvaluator', 'DesignCritic', 'Backend', 'RuntimeValidation',
];

export function optimizeOrdering(ctx: SelfOptimizationContext): OrderingBlueprint {
  let orderingStrategy: OrderingBlueprint['orderingStrategy'];

  if (ctx.complexity === 'enterprise') orderingStrategy = 'quality-first';
  else if ((ctx.tokenEfficiency ?? 0.75) < 0.5) orderingStrategy = 'cost-first';
  else if ((ctx.adaptiveScore ?? 7.5) >= 8) orderingStrategy = 'quality-first';
  else if (ctx.complexity === 'simple') orderingStrategy = 'critical-path';
  else orderingStrategy = 'balanced';

  const recommendedOrder = orderingStrategy === 'quality-first' ? QUALITY_FIRST_ORDER
    : orderingStrategy === 'cost-first' ? COST_FIRST_ORDER
    : orderingStrategy === 'critical-path' ? CRITICAL_PATH_ORDER
    : BALANCED_ORDER;

  const orderingScore = orderingStrategy === 'quality-first' ? 9
    : orderingStrategy === 'balanced' ? 8.5
    : orderingStrategy === 'critical-path' ? 8
    : 7;

  const recommendations: string[] = [];
  recommendations.push(`${orderingStrategy} ordering selected for ${ctx.complexity} build`);

  return { recommendedOrder, orderingStrategy, orderingScore, recommendations };
}
