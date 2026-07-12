// ── V9.0 Runtime Intelligence — Evaluation Strategy Planner ──────────────────
//
// Runtime dynamically changes evaluator weights per project type.
// All weight sets MUST sum to exactly 1.00.
import type { GenerationMode, EvaluationStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

// ── Dynamic weight profiles ───────────────────────────────────────────────────
// Spec-defined profiles (sum to 1.00 each):

const WEIGHTS_LANDING_PAGE: Record<string, number> = {
  visual:     0.35,
  performance:0.15,
  conversion: 0.25,
  accessibility:0.10,
  seo:        0.15,
};

const WEIGHTS_DASHBOARD: Record<string, number> = {
  performance:  0.30,
  usability:    0.30,
  accessibility:0.20,
  visual:       0.10,
  animation:    0.10,
};

const WEIGHTS_ENTERPRISE: Record<string, number> = {
  reliability:  0.35,
  security:     0.30,
  performance:  0.20,
  visual:       0.05,
  accessibility:0.10,
};

const WEIGHTS_SAAS: Record<string, number> = {
  visual:       0.25,
  performance:  0.20,
  conversion:   0.20,
  accessibility:0.15,
  usability:    0.20,
};

const WEIGHTS_ECOMMERCE: Record<string, number> = {
  conversion:   0.35,
  performance:  0.25,
  visual:       0.20,
  accessibility:0.10,
  seo:          0.10,
};

const WEIGHTS_BALANCED: Record<string, number> = {
  visual:       0.25,
  performance:  0.20,
  accessibility:0.20,
  conversion:   0.20,
  usability:    0.15,
};

function selectWeights(input: RuntimeIntelligenceInput): { weights: Record<string, number>; profile: string } {
  const goal = input.productGoal.toLowerCase();
  const bt   = input.backendType;

  if (bt === 'ECommerce' || goal.includes('ecommerce') || goal.includes('shop')) {
    return { weights: WEIGHTS_ECOMMERCE, profile: 'ecommerce' };
  }
  if (['Healthcare', 'Finance', 'ERPBackend'].includes(bt) || input.hasCompliance) {
    return { weights: WEIGHTS_ENTERPRISE, profile: 'enterprise' };
  }
  if (bt === 'Dashboard' || goal.includes('dashboard') || goal.includes('analytics')) {
    return { weights: WEIGHTS_DASHBOARD, profile: 'dashboard' };
  }
  if (bt === 'LandingAPI' || goal.includes('landing') || goal.includes('marketing')) {
    return { weights: WEIGHTS_LANDING_PAGE, profile: 'landing-page' };
  }
  if (bt === 'SaaSBackend' || goal.includes('saas')) {
    return { weights: WEIGHTS_SAAS, profile: 'saas' };
  }
  return { weights: WEIGHTS_BALANCED, profile: 'balanced' };
}

function topDimension(weights: Record<string, number>): string {
  return Object.entries(weights).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'visual';
}

const THRESHOLD_MAP: Record<GenerationMode, number> = {
  Fast:         5.0,
  Balanced:     6.5,
  Quality:      8.0,
  Enterprise:   8.5,
  Creative:     7.5,
  Strict:       8.0,
  Experimental: 6.5,
  Safe:         7.0,
};

export function planEvaluationStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): EvaluationStrategy {
  const { weights, profile } = selectWeights(input);
  const topDim = topDimension(weights);
  return {
    isStrict:          mode === 'Strict' || mode === 'Enterprise',
    weights,
    threshold:         THRESHOLD_MAP[mode],
    priorityDimension: topDim,
    rationale:         `${profile} evaluation profile: ${topDim} weighted ${(weights[topDim]! * 100).toFixed(0)}% (threshold ${THRESHOLD_MAP[mode]})`,
  };
}
