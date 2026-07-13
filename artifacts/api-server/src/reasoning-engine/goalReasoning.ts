// ── V9.5 Goal Reasoning Engine ────────────────────────────────────────────────
// Deterministic keyword-heuristic goal extraction — no LLM calls.
import type { GoalSet } from './types.js';

const BUSINESS_KEYWORDS = ['revenue', 'sales', 'customers', 'market', 'growth', 'monetize', 'subscription', 'saas'];
const TECHNICAL_KEYWORDS = ['api', 'database', 'performance', 'scale', 'architecture', 'integration', 'backend'];
const USER_KEYWORDS = ['user', 'experience', 'easy', 'intuitive', 'accessible', 'friendly', 'simple'];
const QUALITY_KEYWORDS = ['quality', 'reliable', 'secure', 'robust', 'production', 'tested', 'polished'];

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some(k => text.includes(k));
}

export function analyzeGoals(prompt: string): GoalSet {
  const text = (prompt || '').toLowerCase();
  const sentences = (prompt || '')
    .split(/[.!?\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const primaryGoal = sentences[0] || 'Build a functional software product from the given prompt.';
  const secondaryGoals = sentences.slice(1, 4);

  const hiddenGoals: string[] = [];
  if (!containsAny(text, ['accessib', 'a11y'])) hiddenGoals.push('Implicit accessibility compliance expected');
  if (!containsAny(text, ['security', 'auth', 'secure'])) hiddenGoals.push('Implicit baseline security expected');
  if (!containsAny(text, ['mobile', 'responsive'])) hiddenGoals.push('Implicit responsive/mobile support expected');

  const businessGoal = containsAny(text, BUSINESS_KEYWORDS)
    ? 'Drive measurable business value (revenue, growth, or market reach).'
    : 'Deliver a credible, launch-ready product for its target audience.';

  const technicalGoal = containsAny(text, TECHNICAL_KEYWORDS)
    ? 'Deliver a technically sound, scalable architecture.'
    : 'Deliver a maintainable, production-quality codebase.';

  const userGoal = containsAny(text, USER_KEYWORDS)
    ? 'Deliver an intuitive, friction-free user experience.'
    : 'Deliver a usable, clear interface for the target user.';

  const qualityGoal = containsAny(text, QUALITY_KEYWORDS)
    ? 'Meet a high bar for reliability, security, and polish.'
    : 'Meet a reasonable bar for correctness and stability.';

  const successCriteria = [
    'Build completes without unrecoverable errors',
    'Generated UI matches stated goals and audience',
    'No critical security or accessibility violations',
  ];
  if (containsAny(text, BUSINESS_KEYWORDS)) successCriteria.push('Product supports a plausible monetization path');

  return {
    primaryGoal,
    secondaryGoals,
    hiddenGoals,
    businessGoal,
    technicalGoal,
    userGoal,
    qualityGoal,
    successCriteria,
  };
}
