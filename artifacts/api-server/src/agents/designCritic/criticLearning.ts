// ── V7.3.0 Critic Learning Loop ───────────────────────────────────────────────
// Tracks which critique categories and suggestions improved output scores.
// Successful suggestions are promoted; ineffective ones are demoted.
// Quality weight factors feed back into future critic prompts.

export interface CriticOutcome {
  category:       string;
  suggestionType: string;
  applied:        boolean;
  scoreBefore:    number;
  scoreAfter:     number;
  improved:       boolean;
}

export interface CategoryWeight {
  category:   string;
  weight:     number;
  successes:  number;
  attempts:   number;
  successRate: number;
}

const _outcomes: CriticOutcome[] = [];

// Base weights — start equal, adjusted by learning
const _categoryWeights: Record<string, { successes: number; attempts: number }> = {
  hero:           { successes: 0, attempts: 0 },
  layout:         { successes: 0, attempts: 0 },
  typography:     { successes: 0, attempts: 0 },
  ctaHierarchy:   { successes: 0, attempts: 0 },
  trustBuilding:  { successes: 0, attempts: 0 },
  accessibility:  { successes: 0, attempts: 0 },
  motion:         { successes: 0, attempts: 0 },
  dashboardUX:    { successes: 0, attempts: 0 },
  formsUX:        { successes: 0, attempts: 0 },
  navbarUX:       { successes: 0, attempts: 0 },
  conversion:     { successes: 0, attempts: 0 },
  visualHierarchy: { successes: 0, attempts: 0 },
};

export function recordCriticOutcome(outcome: CriticOutcome): void {
  _outcomes.push(outcome);
  if (_outcomes.length > 500) _outcomes.shift();

  const entry = _categoryWeights[outcome.category];
  if (entry) {
    entry.attempts++;
    if (outcome.improved) entry.successes++;
  }
}

export function getCategorySuccessRates(): CategoryWeight[] {
  return Object.entries(_categoryWeights).map(([category, { successes, attempts }]) => ({
    category,
    weight:      attempts > 0 ? Math.round(successes / attempts * 100) / 100 : 0.5,
    successes,
    attempts,
    successRate: attempts > 0 ? Math.round(successes / attempts * 100) : 50,
  }));
}

export function getHighImpactCategories(): string[] {
  return getCategorySuccessRates()
    .filter(c => c.attempts >= 3)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map(c => c.category);
}

export function getLowEffectCategories(): string[] {
  return getCategorySuccessRates()
    .filter(c => c.attempts >= 3 && c.successRate < 30)
    .map(c => c.category);
}

export function getCriticLearningMetrics() {
  const rates = getCategorySuccessRates();
  const total = _outcomes.length;
  const improved = _outcomes.filter(o => o.improved).length;

  return {
    totalOutcomes:     total,
    overallSuccessRate: total > 0 ? Math.round(improved / total * 100) + '%' : 'N/A',
    categoryWeights:   rates,
    highImpactCategories: getHighImpactCategories(),
    lowEffectCategories:  getLowEffectCategories(),
  };
}

export function resetCriticLearning(): void {
  _outcomes.length = 0;
  for (const key of Object.keys(_categoryWeights)) {
    _categoryWeights[key] = { successes: 0, attempts: 0 };
  }
}
