// ── V9.5 Multi-Path Reasoning Engine ──────────────────────────────────────────
import type { ConstraintSet, ReasoningPath, TradeoffAnalysis } from './types.js';

export function generatePaths(constraints: ConstraintSet, tradeoffs: TradeoffAnalysis): ReasoningPath[] {
  const pathA: ReasoningPath = {
    id: 'A',
    name: 'Highest Quality',
    description: 'Maximizes quality, security, and polish at the highest cost.',
    qualityScore: 10,
    costScore: 3,
    speedScore: 4,
    overallScore: 0,
  };
  const pathB: ReasoningPath = {
    id: 'B',
    name: 'Balanced',
    description: 'Balances quality, cost, and speed for most builds.',
    qualityScore: 7.5,
    costScore: 7,
    speedScore: 7,
    overallScore: 0,
  };
  const pathC: ReasoningPath = {
    id: 'C',
    name: 'Fastest',
    description: 'Minimizes time and cost, accepting reduced polish.',
    qualityScore: 5,
    costScore: 9.5,
    speedScore: 10,
    overallScore: 0,
  };

  const paths = [pathA, pathB, pathC];
  for (const p of paths) {
    p.overallScore = Number((p.qualityScore * 0.45 + p.costScore * 0.25 + p.speedScore * 0.30).toFixed(2));
  }
  return paths;
}

/** Selects the optimal path given constraints + trade-off analysis. Deterministic. */
export function selectOptimalPath(paths: ReasoningPath[], constraints: ConstraintSet, tradeoffs: TradeoffAnalysis): ReasoningPath {
  // Time-constrained builds bias toward speed; security/budget-heavy builds bias toward quality.
  if (constraints.time === 'low' && constraints.budget !== 'high') {
    return paths.find(p => p.id === 'C') ?? paths[0];
  }
  if (constraints.security === 'high' || constraints.budget === 'high') {
    return paths.find(p => p.id === 'A') ?? paths[0];
  }
  // Otherwise pick the highest overallScore (Balanced typically wins for standard builds).
  return [...paths].sort((a, b) => b.overallScore - a.overallScore)[0];
}
