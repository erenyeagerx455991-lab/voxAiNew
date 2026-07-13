// ── V9.5 Conflict Resolution Engine ───────────────────────────────────────────
import type { ConflictPair, ConflictResolution, ConstraintSet, TradeoffAnalysis } from './types.js';
import { ALL_CONFLICT_PAIRS } from './types.js';

/** Deterministic priority rules per conflict pair — resolved without user input. */
export function resolveConflicts(constraints: ConstraintSet, tradeoffs: TradeoffAnalysis): ConflictResolution[] {
  const resolutions: ConflictResolution[] = [];

  const push = (pair: ConflictPair, winner: string, rationale: string, severity: ConflictResolution['severity']) => {
    resolutions.push({ pair, winner, rationale, severity });
  };

  push('ProductVsPerformance',
    tradeoffs.scores.BusinessValue >= tradeoffs.scores.Performance ? 'Product' : 'Performance',
    'Higher scoring dimension wins when goals conflict.', 'medium');

  push('SecurityVsUX',
    constraints.security === 'high' ? 'Security' : 'UX',
    constraints.security === 'high'
      ? 'High security constraint overrides UX friction concerns.'
      : 'No elevated security constraint — optimizing for UX.',
    constraints.security === 'high' ? 'high' : 'low');

  push('PerformanceVsCost',
    constraints.performance === 'high' ? 'Performance' : 'Cost',
    'Performance constraint level determines the winner.', 'medium');

  push('AccessibilityVsDesign', 'Accessibility',
    'Accessibility is a non-negotiable baseline regardless of design preference.', 'medium');

  push('MaintainabilityVsSpeed',
    constraints.time === 'low' ? 'Speed' : 'Maintainability',
    constraints.time === 'low'
      ? 'Tight time constraint favors shipping over long-term maintainability.'
      : 'No urgent time pressure — favoring maintainable structure.',
    'low');

  push('BusinessVsEngineering',
    tradeoffs.scores.BusinessValue >= 7 ? 'Business' : 'Engineering',
    'Business value score determines priority when they conflict.', 'medium');

  push('RuntimeVsQuality',
    constraints.complexity === 'high' ? 'Quality' : 'Runtime',
    constraints.complexity === 'high'
      ? 'Enterprise-complexity builds favor quality over raw runtime speed.'
      : 'Simpler builds favor faster runtime over marginal quality gains.',
    'low');

  return resolutions;
}

export { ALL_CONFLICT_PAIRS };
