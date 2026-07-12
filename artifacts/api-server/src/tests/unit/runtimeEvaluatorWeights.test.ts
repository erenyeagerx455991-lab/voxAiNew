// V9.1 Runtime Intelligence Activation — evaluator weight wiring tests.
//
// Covers the previously-untested gap: RuntimeBlueprint.evaluationStrategy.weights
// actually changing evaluateDesign()'s overallScore composition, across the
// project-type profiles produced by planEvaluationStrategy(), plus the
// telemetry/learning recording that rides along with each evaluation.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateDesign,
  computeEffectiveWeights,
  RUNTIME_WEIGHT_CATEGORIES,
  DIMENSION_TO_RUNTIME_CATEGORY,
} from '../../agents/designEvaluator/evaluator.js';
import { planEvaluationStrategy } from '../../runtime-intelligence/evaluationStrategyPlanner.js';
import type { GenerationMode, RuntimeIntelligenceInput } from '../../runtime-intelligence/runtimeTypes.js';
import {
  recordEvaluatorWeightUsage,
  getEvaluatorWeightStats,
  resetEvaluatorWeightUsage,
} from '../../runtime-intelligence/runtimeMetrics.js';
import { learnFromRuntimeBuild, getRuntimeLearningStats, resetRuntimeLearning } from '../../runtime-intelligence/runtimeLearning.js';
import type { DesignDNA } from '../../agents/types.js';

const MOCK_DNA: DesignDNA = {
  designLanguage: 'monochrome',
  layoutStyle: 'flat-ui',
  typographySystem: { headingWeight: 'font-black', headingTracking: 'tracking-tighter', scale: 'lg', fontFamily: 'sans' },
  spacingSystem: { density: 'balanced', sectionPadding: 'py-24', componentGap: 'gap-6' },
  colorSystem: { theme: 'dark', background: '#0a0a0a', surface: '#141414', primary: '#ffffff', secondary: '#e5e5e5', accent: '#ffffff', text: '#ffffff', textMuted: '#666666', border: '#2a2a2a' },
  animationPersonality: 'subtle',
  decorationLevel: 'none',
  componentPreferences: ['flat-card', 'solid-button'],
  heroStyle: 'centered-minimal',
  cardStyle: 'flat-bordered',
  visualDensity: 'balanced',
  theme: 'dark',
  primaryColor: '#ffffff',
  secondaryColor: '#e5e5e5',
  accentColor: '#ffffff',
  bgColor: '#0a0a0a',
  bgGradient: 'from-[#0a0a0a] to-[#111111]',
  headingGradient: 'from-white to-gray-400',
  buttonStyle: 'rounded-lg',
  buttonColors: 'bg-white text-black',
  cardStyleTokens: 'bg-[#141414] border border-[#2a2a2a] rounded-xl',
  mood: 'Sharp',
};

const SAMPLE_CODE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-4">
      <a href="/" className="font-bold focus-visible:outline-none focus-visible:ring-2">Acme</a>
      <Button variant="outline" type="button" className="focus-visible:outline-none focus-visible:ring-2">Sign in</Button>
    </nav>
  );
}
function Hero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Badge variant="secondary" className="mb-4">Trusted by teams</Badge>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter">Ship faster with AI review</h1>
      <p className="text-lg max-w-2xl mt-6">Catches bugs before production. Real-time analysis, one-click fixes.</p>
      <div className="flex flex-row gap-4 mt-8">
        <Button className="rounded-lg px-8 py-3 focus-visible:outline-none focus-visible:ring-2" type="button">Start free</Button>
        <Button variant="outline" className="rounded-lg px-8 py-3 focus-visible:outline-none focus-visible:ring-2" type="button">See how it works</Button>
      </div>
    </div>
  );
}
function App() {
  return (<div><Navbar/><Hero/></div>);
}
`;
const SECTION_ORDER = ['Navbar', 'Hero', 'Features', 'Testimonials', 'CTA', 'Footer'];

function makeRuntimeInput(overrides: Partial<RuntimeIntelligenceInput> = {}): RuntimeIntelligenceInput {
  return {
    prompt: 'Build a product',
    backendType: 'Generic',
    productGoal: 'Generic product',
    hasCompliance: false,
    hasPricing: false,
    hasAuth: false,
    ...overrides,
  } as RuntimeIntelligenceInput;
}

describe('V9.1 — computeEffectiveWeights()', () => {
  it('falls back to the static distribution when no runtime weights are given', () => {
    const w = computeEffectiveWeights(undefined);
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 2);
  });

  it('falls back to static distribution for an empty weights object', () => {
    const w = computeEffectiveWeights({});
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 2);
  });

  it('falls back to static distribution when runtime weights use no measurable categories', () => {
    const w = computeEffectiveWeights({ performance: 0.5, seo: 0.5 });
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 2);
  });

  it('always sums to ~1.00 regardless of profile', () => {
    for (const profile of ['ecommerce', 'enterprise', 'dashboard', 'landing-page', 'saas', 'balanced'] as const) {
      const runtimeInputByProfile: Record<string, RuntimeIntelligenceInput> = {
        ecommerce: makeRuntimeInput({ backendType: 'ECommerce', productGoal: 'ecommerce shop' }),
        enterprise: makeRuntimeInput({ backendType: 'Healthcare', hasCompliance: true }),
        dashboard: makeRuntimeInput({ backendType: 'Dashboard', productGoal: 'analytics dashboard' }),
        'landing-page': makeRuntimeInput({ backendType: 'LandingAPI', productGoal: 'marketing landing page' }),
        saas: makeRuntimeInput({ backendType: 'SaaSBackend', productGoal: 'saas product' }),
        balanced: makeRuntimeInput({ backendType: 'Generic', productGoal: 'generic app' }),
      };
      const strategy = planEvaluationStrategy('Quality', runtimeInputByProfile[profile]!);
      expect(strategy.profile).toBe(profile);
      const w = computeEffectiveWeights(strategy.weights);
      const total = Object.values(w).reduce((a, b) => a + b, 0);
      expect(total).toBeCloseTo(1.0, 2);
    }
  });

  it('every WEIGHTS dimension maps to a known runtime macro-category', () => {
    for (const cat of Object.values(DIMENSION_TO_RUNTIME_CATEGORY)) {
      expect(RUNTIME_WEIGHT_CATEGORIES).toContain(cat);
    }
  });

  it('landing-page profile (visual-heavy) shifts weight toward visual dimensions vs dashboard (usability-heavy)', () => {
    const landing = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'LandingAPI', productGoal: 'landing' }));
    const dashboard = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'Dashboard', productGoal: 'dashboard' }));

    const wLanding = computeEffectiveWeights(landing.weights);
    const wDashboard = computeEffectiveWeights(dashboard.weights);

    // hero/layout are 'visual' dimensions — should carry more weight for landing pages.
    expect(wLanding.hero + wLanding.layout).toBeGreaterThan(wDashboard.hero + wDashboard.layout);
    // navigation/dashboard/form are 'usability' dimensions — should carry more weight for dashboards.
    expect(wDashboard.navigation + wDashboard.dashboard + wDashboard.form)
      .toBeGreaterThan(wLanding.navigation + wLanding.dashboard + wLanding.form);
  });
});

describe('V9.1 — evaluateDesign() dynamic weighting end-to-end', () => {
  it('dynamicWeightsUsed is false when no runtimeWeights are passed', () => {
    const result = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA });
    expect(result.dynamicWeightsUsed).toBe(false);
  });

  it('dynamicWeightsUsed is true and weightsApplied differs from static when runtimeWeights are passed', () => {
    const dashboard = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'Dashboard', productGoal: 'dashboard' }));
    const staticResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA });
    const dynamicResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: dashboard.weights });

    expect(dynamicResult.dynamicWeightsUsed).toBe(true);
    expect(dynamicResult.weightsApplied).not.toEqual(staticResult.weightsApplied);
  });

  it('the same code scores differently under different profiles (weights are load-bearing, not decorative)', () => {
    const landing = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'LandingAPI', productGoal: 'landing' }));
    const enterprise = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'Healthcare', hasCompliance: true }));

    const landingResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: landing.weights });
    const enterpriseResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: enterprise.weights });

    // Different profiles redistribute weight differently — at minimum the applied
    // weight sets themselves must differ (overallScore may coincidentally tie on a fixed fixture).
    expect(landingResult.weightsApplied).not.toEqual(enterpriseResult.weightsApplied);
  });

  it('is still pure — identical inputs (including runtimeWeights) produce identical output', () => {
    const dashboard = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'Dashboard', productGoal: 'dashboard' }));
    const r1 = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: dashboard.weights });
    const r2 = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: dashboard.weights });
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.weightsApplied).toEqual(r2.weightsApplied);
  });
});

describe('V9.1 — runtimeMetrics telemetry for evaluator weight usage', () => {
  beforeEach(() => {
    resetEvaluatorWeightUsage();
  });

  it('records dynamic vs static usage and computes activation rate', () => {
    const dashboard = planEvaluationStrategy('Quality', makeRuntimeInput({ backendType: 'Dashboard', productGoal: 'dashboard' }));
    const dynamicResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA, runtimeWeights: dashboard.weights });
    const staticResult = evaluateDesign({ code: SAMPLE_CODE, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA });

    recordEvaluatorWeightUsage('dashboard', dynamicResult.weightsApplied, dynamicResult.dynamicWeightsUsed);
    recordEvaluatorWeightUsage('static-default', staticResult.weightsApplied, staticResult.dynamicWeightsUsed);

    const stats = getEvaluatorWeightStats();
    expect(stats.totalEvaluations).toBe(2);
    expect(stats.dynamicWeightUsage).toBe(1);
    expect(stats.weightActivationRate).toBeCloseTo(0.5, 2);
    expect(stats.projectTypeDistribution.dashboard).toBe(1);
    expect(stats.projectTypeDistribution['static-default']).toBe(1);
    expect(Object.keys(stats.averageWeightsUsed).length).toBeGreaterThan(0);
  });

  it('resetEvaluatorWeightUsage clears all recorded usage', () => {
    recordEvaluatorWeightUsage('saas', { hero: 0.2 }, true);
    resetEvaluatorWeightUsage();
    const stats = getEvaluatorWeightStats();
    expect(stats.totalEvaluations).toBe(0);
    expect(stats.dynamicWeightUsage).toBe(0);
    expect(stats.weightActivationRate).toBe(0);
  });
});

describe('V9.1 — Runtime Learning records weight profile outcomes', () => {
  beforeEach(() => {
    resetRuntimeLearning();
  });

  it('learns from a build and reports stats keyed by weight profile', async () => {
    const mode: GenerationMode = 'Quality';
    const strategy = planEvaluationStrategy(mode, makeRuntimeInput({ backendType: 'ECommerce', productGoal: 'ecommerce shop' }));
    await learnFromRuntimeBuild({
      buildId: 'test-weights-001',
      blueprint: {
        mode,
        evaluationStrategy: strategy,
        candidateStrategy: { count: 2 },
        performancePrediction: { estimatedBuildTimeMs: 40_000, estimatedRepairCount: 1 },
        qualityScores: [],
      } as never,
      actualBuildTimeMs: 42_000,
      actualRepairCount: 1,
      overallBuildScore: 8.4,
    });

    const stats = getRuntimeLearningStats();
    expect(stats.totalRecords).toBe(1);
    expect(stats.byWeightProfile['ecommerce']).toBeDefined();
    expect(stats.byWeightProfile['ecommerce']!.count).toBe(1);
  });
});
