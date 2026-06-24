// ── V7.3.1 Conversion Learning Loop ──────────────────────────────────────────
// Tracks which conversion fixes improved evaluator/critic/final scores.
// Successful fix categories are promoted; ineffective ones are demoted.

export interface ConversionOutcome {
  fixCategory:   string;
  applied:       boolean;
  scoreBefore:   number;
  scoreAfter:    number;
  improved:      boolean;
}

export interface FixWeight {
  category:    string;
  successes:   number;
  attempts:    number;
  successRate: number;
  priority:    'high' | 'medium' | 'low';
}

const FIX_CATEGORIES = [
  'trust_signal_hero', 'trust_signal_pricing', 'cta_hierarchy', 'cta_overload',
  'pricing_highlight', 'pricing_risk_reversal', 'pricing_annual_toggle',
  'offer_clarity_hero', 'offer_clarity_feature', 'funnel_sequencing',
  'social_proof_placement', 'value_prop_specificity',
];

const _outcomes: ConversionOutcome[] = [];
const _weights: Record<string, { successes: number; attempts: number }> = Object.fromEntries(
  FIX_CATEGORIES.map(c => [c, { successes: 0, attempts: 0 }])
);

export function recordConversionOutcome(outcome: ConversionOutcome): void {
  _outcomes.push(outcome);
  if (_outcomes.length > 500) _outcomes.shift();

  const entry = _weights[outcome.fixCategory];
  if (entry) {
    entry.attempts++;
    if (outcome.improved) entry.successes++;
  }
}

export function getFixWeights(): FixWeight[] {
  return Object.entries(_weights).map(([category, { successes, attempts }]) => {
    const successRate = attempts > 0 ? Math.round(successes / attempts * 100) : 50;
    return {
      category,
      successes,
      attempts,
      successRate,
      priority: successRate >= 70 ? 'high' : successRate >= 40 ? 'medium' : 'low',
    };
  });
}

export function getHighPriorityFixes(): string[] {
  return getFixWeights()
    .filter(w => w.attempts >= 3 && w.priority === 'high')
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5)
    .map(w => w.category);
}

export function getLowPriorityFixes(): string[] {
  return getFixWeights()
    .filter(w => w.attempts >= 3 && w.successRate < 30)
    .map(w => w.category);
}

export function getConversionLearningMetrics() {
  const total    = _outcomes.length;
  const improved = _outcomes.filter(o => o.improved).length;
  return {
    totalOutcomes:        total,
    overallSuccessRate:   total > 0 ? `${Math.round(improved / total * 100)}%` : 'N/A',
    fixWeights:           getFixWeights(),
    highPriorityFixes:    getHighPriorityFixes(),
    lowPriorityFixes:     getLowPriorityFixes(),
  };
}

export function resetConversionLearning(): void {
  _outcomes.length = 0;
  for (const key of Object.keys(_weights)) {
    _weights[key] = { successes: 0, attempts: 0 };
  }
}
