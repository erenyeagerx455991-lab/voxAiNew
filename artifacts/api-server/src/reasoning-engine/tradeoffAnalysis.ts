// ── V9.5 Trade-off Analysis Engine ────────────────────────────────────────────
import type { ConstraintSet, GoalSet, TradeoffAnalysis, TradeoffDimension } from './types.js';
import { ALL_TRADEOFF_DIMENSIONS } from './types.js';

function levelToScore(level: 'low' | 'medium' | 'high'): number {
  return level === 'high' ? 9 : level === 'medium' ? 6 : 3;
}

export function analyzeTradeoffs(goals: GoalSet, constraints: ConstraintSet): TradeoffAnalysis {
  const scores: Record<TradeoffDimension, number> = {
    Speed:               10 - levelToScore(constraints.time) + 1,
    Quality:              levelToScore(constraints.complexity),
    Cost:                 10 - levelToScore(constraints.budget),
    Maintainability:      levelToScore(constraints.complexity) - 1,
    Performance:          levelToScore(constraints.performance),
    Security:             levelToScore(constraints.security),
    Scalability:          constraints.complexity === 'high' ? 9 : 6,
    Accessibility:        6,
    DeveloperExperience:  constraints.dependencies === 'high' ? 5 : 7,
    UserExperience:       7,
    BusinessValue:        goals.businessGoal.toLowerCase().includes('revenue') ? 9 : 6,
  };

  // Clamp every dimension to [0, 10].
  for (const dim of ALL_TRADEOFF_DIMENSIONS) {
    scores[dim] = Math.max(0, Math.min(10, scores[dim]));
  }

  let dominant: TradeoffDimension = ALL_TRADEOFF_DIMENSIONS[0];
  let weakest: TradeoffDimension = ALL_TRADEOFF_DIMENSIONS[0];
  for (const dim of ALL_TRADEOFF_DIMENSIONS) {
    if (scores[dim] > scores[dominant]) dominant = dim;
    if (scores[dim] < scores[weakest]) weakest = dim;
  }

  return { scores, dominant, weakest };
}
