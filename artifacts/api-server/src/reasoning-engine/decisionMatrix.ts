// ── V9.5 Decision Matrix Engine ───────────────────────────────────────────────
import type {
  AmbiguityReport, ConstraintSet, DecisionMatrixFactors, DecisionMatrixResult,
  ReasoningContext, ReasoningPath,
} from './types.js';

/** 10 factors from the spec — weights sum to 1.00. */
export const DECISION_MATRIX_WEIGHTS: Record<keyof DecisionMatrixFactors, number> = {
  businessValue:     0.12,
  technicalQuality:  0.12,
  risk:              0.10,
  performance:       0.10,
  security:          0.10,
  maintainability:   0.10,
  runtimeCost:       0.10,
  complexity:        0.08,
  confidence:        0.10,
  futureFlexibility: 0.08,
};

const WEIGHT_SUM = Object.values(DECISION_MATRIX_WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(WEIGHT_SUM - 1) > 0.001) {
  throw new Error(`V9.5 DECISION_MATRIX_WEIGHTS must sum to 1.00, got ${WEIGHT_SUM}`);
}

export function evaluateDecision(
  path: ReasoningPath,
  ctx: ReasoningContext,
  constraints: ConstraintSet,
  ambiguity: AmbiguityReport,
): DecisionMatrixResult {
  const factors: DecisionMatrixFactors = {
    businessValue:     path.qualityScore,
    technicalQuality:  (ctx.frontendScore ?? path.qualityScore) * 0.5 + (ctx.backendScore ?? path.qualityScore) * 0.5,
    risk:              Math.max(0, 10 - ambiguity.ambiguityScore),
    performance:       ctx.runtimeScore ?? path.speedScore,
    security:          ctx.securityScore ?? (constraints.security === 'high' ? 8 : 6),
    maintainability:   ctx.backendScore ?? 6,
    runtimeCost:       path.costScore,
    complexity:        constraints.complexity === 'high' ? 4 : constraints.complexity === 'medium' ? 6 : 8,
    confidence:        Math.max(0, 10 - ambiguity.ambiguityScore * 0.5),
    futureFlexibility: constraints.complexity === 'low' ? 5 : 7,
  };

  for (const key of Object.keys(factors) as (keyof DecisionMatrixFactors)[]) {
    factors[key] = Math.max(0, Math.min(10, factors[key]));
  }

  let compositeScore = 0;
  for (const key of Object.keys(DECISION_MATRIX_WEIGHTS) as (keyof DecisionMatrixFactors)[]) {
    compositeScore += factors[key] * DECISION_MATRIX_WEIGHTS[key];
  }

  return { factors, compositeScore: Number(compositeScore.toFixed(2)) };
}
