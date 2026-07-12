// ── V9.0 Runtime Intelligence Engine — Core Unit Tests ───────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { runRuntimeIntelligence }           from '../../runtime-intelligence/runtimeArchitect.js';
import { classifyGenerationMode, getModeRationale } from '../../runtime-intelligence/generationModeClassifier.js';
import { planGenerationStrategy }    from '../../runtime-intelligence/generationStrategyPlanner.js';
import { planCandidateStrategy }     from '../../runtime-intelligence/candidateStrategyPlanner.js';
import { planRepairStrategy }        from '../../runtime-intelligence/repairStrategyPlanner.js';
import { planEvaluationStrategy }    from '../../runtime-intelligence/evaluationStrategyPlanner.js';
import { planOptimizationStrategy }  from '../../runtime-intelligence/optimizationStrategyPlanner.js';
import { planCachingStrategy }       from '../../runtime-intelligence/cachingStrategyPlanner.js';
import { planContextStrategy }       from '../../runtime-intelligence/contextStrategyPlanner.js';
import { planParallelizationStrategy } from '../../runtime-intelligence/parallelizationStrategyPlanner.js';
import { planValidationStrategy }    from '../../runtime-intelligence/validationStrategyPlanner.js';
import { planRenderingStrategy }     from '../../runtime-intelligence/renderingStrategyPlanner.js';
import { planPromptStrategy }        from '../../runtime-intelligence/promptStrategyPlanner.js';
import { planRetryStrategy }         from '../../runtime-intelligence/retryStrategyPlanner.js';
import { planStreamingStrategy }     from '../../runtime-intelligence/streamingStrategyPlanner.js';
import { planDeploymentStrategy }    from '../../runtime-intelligence/deploymentStrategyPlanner.js';
import { planRiskStrategy }          from '../../runtime-intelligence/riskStrategyPlanner.js';
import { planMemoryStrategy }        from '../../runtime-intelligence/memoryStrategyPlanner.js';
import { predictPerformance }        from '../../runtime-intelligence/performanceIntelligence.js';
import { planRetrievalIntelligence } from '../../runtime-intelligence/retrievalIntelligence.js';
import { validateRuntimeBlueprint }  from '../../runtime-intelligence/runtimeValidator.js';
import { ALL_RUNTIME_DIMENSIONS }    from '../../runtime-intelligence/runtimeTypes.js';
import type { GenerationMode, RuntimeIntelligenceInput } from '../../runtime-intelligence/runtimeTypes.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALL_MODES: GenerationMode[] = [
  'Fast', 'Balanced', 'Quality', 'Enterprise', 'Creative', 'Strict', 'Experimental', 'Safe',
];

function makeInput(overrides: Partial<RuntimeIntelligenceInput> = {}): RuntimeIntelligenceInput {
  return {
    prompt:            'Build a SaaS project management app',
    buildId:           'test-build-1',
    productGoal:       'SaaS',
    productFeatures:   ['Authentication', 'Dashboard', 'Settings', 'Billing'],
    businessObjective: 'Freemium',
    backendType:       'SaaSBackend',
    infraType:         'Standard',
    serviceCount:      3,
    hasAuth:           true,
    hasPayments:       false,
    hasRealtime:       false,
    hasCompliance:     false,
    productScore:      7,
    frontendScore:     7,
    backendScore:      7,
    devopsScore:       7,
    qaScore:           7,
    securityScore:     7,
    ...overrides,
  };
}

// ── runRuntimeIntelligence — smoke tests ──────────────────────────────────────

describe('runRuntimeIntelligence — output contract', () => {
  it('returns an output with required fields', () => {
    const out = runRuntimeIntelligence(makeInput());
    expect(out).toHaveProperty('blueprint');
    expect(out).toHaveProperty('overallScore');
    expect(out).toHaveProperty('processingTimeMs');
    expect(out).toHaveProperty('contextString');
  });

  it('overallScore is between 0 and 10', () => {
    const { overallScore } = runRuntimeIntelligence(makeInput());
    expect(overallScore).toBeGreaterThanOrEqual(0);
    expect(overallScore).toBeLessThanOrEqual(10);
  });

  it('processingTimeMs is non-negative', () => {
    const { processingTimeMs } = runRuntimeIntelligence(makeInput());
    expect(processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('contextString is a non-empty string', () => {
    const { contextString } = runRuntimeIntelligence(makeInput());
    expect(typeof contextString).toBe('string');
    expect(contextString.length).toBeGreaterThan(0);
  });

  it('contextString contains RUNTIME INTELLIGENCE header', () => {
    const { contextString } = runRuntimeIntelligence(makeInput());
    expect(contextString).toContain('RUNTIME INTELLIGENCE');
  });

  it('blueprint contains all required strategy fields', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    expect(blueprint).toHaveProperty('mode');
    expect(blueprint).toHaveProperty('generationStrategy');
    expect(blueprint).toHaveProperty('candidateStrategy');
    expect(blueprint).toHaveProperty('repairStrategy');
    expect(blueprint).toHaveProperty('evaluationStrategy');
    expect(blueprint).toHaveProperty('optimizationStrategy');
    expect(blueprint).toHaveProperty('cachingStrategy');
    expect(blueprint).toHaveProperty('contextStrategy');
    expect(blueprint).toHaveProperty('parallelizationStrategy');
    expect(blueprint).toHaveProperty('validationStrategy');
    expect(blueprint).toHaveProperty('renderingStrategy');
    expect(blueprint).toHaveProperty('promptStrategy');
    expect(blueprint).toHaveProperty('retryStrategy');
    expect(blueprint).toHaveProperty('streamingStrategy');
    expect(blueprint).toHaveProperty('deploymentStrategy');
    expect(blueprint).toHaveProperty('riskStrategy');
    expect(blueprint).toHaveProperty('memoryStrategy');
    expect(blueprint).toHaveProperty('performancePrediction');
    expect(blueprint).toHaveProperty('retrievalIntelligence');
    expect(blueprint).toHaveProperty('runtimeContext');
    expect(blueprint).toHaveProperty('qualityScores');
    expect(blueprint).toHaveProperty('overallScore');
    expect(blueprint).toHaveProperty('recommendations');
  });

  it('qualityScores covers all 16 dimensions', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    const dims = blueprint.qualityScores.map(q => q.dimension);
    for (const dim of ALL_RUNTIME_DIMENSIONS) {
      expect(dims).toContain(dim);
    }
  });

  it('every qualityScore is between 0 and 10', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    for (const qs of blueprint.qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('recommendations is an array of strings', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    expect(Array.isArray(blueprint.recommendations)).toBe(true);
    for (const rec of blueprint.recommendations) {
      expect(typeof rec).toBe('string');
    }
  });

  it('streaming is always enabled (SSE must never be disabled)', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    expect(blueprint.streamingStrategy.enableSSE).toBe(true);
  });

  it('does NOT generate UI (no code/HTML in output)', () => {
    const { contextString, blueprint } = runRuntimeIntelligence(makeInput());
    // The output is strategy data, not UI code
    expect(contextString).not.toContain('<div');
    expect(contextString).not.toContain('function Component');
    expect(blueprint.mode).not.toContain('<');
  });
});

// ── runRuntimeIntelligence — all backend types ────────────────────────────────

describe('runRuntimeIntelligence — backend type coverage', () => {
  const BACKEND_TYPES = [
    'SaaSBackend', 'Healthcare', 'Finance', 'ECommerce', 'AIPlatform',
    'LandingAPI', 'Dashboard', 'DeveloperPlatform', 'InternalTool', 'Marketplace',
  ];

  for (const bt of BACKEND_TYPES) {
    it(`executes without error for ${bt}`, () => {
      expect(() => runRuntimeIntelligence(makeInput({ backendType: bt }))).not.toThrow();
    });

    it(`returns a valid overallScore for ${bt}`, () => {
      const { overallScore } = runRuntimeIntelligence(makeInput({ backendType: bt }));
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(10);
    });
  }
});

// ── GenerationMode Classifier ─────────────────────────────────────────────────

describe('classifyGenerationMode', () => {
  it('returns Fast for "fast" prompt keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Build a fast landing page' }))).toBe('Fast');
  });

  it('returns Fast for "quick" prompt keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Quick MVP prototype' }))).toBe('Fast');
  });

  it('returns Creative for "creative" prompt keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Creative portfolio site' }))).toBe('Creative');
  });

  it('returns Experimental for "experimental" keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'An experimental cutting-edge AI interface' }))).toBe('Experimental');
  });

  it('returns Safe for "safe" keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Build a safe conservative admin panel' }))).toBe('Safe');
  });

  it('returns Strict for "strict" keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Strict formal compliance portal' }))).toBe('Strict');
  });

  it('returns Quality for "premium" keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Premium polished SaaS product' }))).toBe('Quality');
  });

  it('returns Enterprise for Healthcare backend type', () => {
    expect(classifyGenerationMode(makeInput({ backendType: 'Healthcare' }))).toBe('Enterprise');
  });

  it('returns Enterprise for Finance backend type', () => {
    expect(classifyGenerationMode(makeInput({ backendType: 'Finance' }))).toBe('Enterprise');
  });

  it('returns Enterprise when hasCompliance is true', () => {
    expect(classifyGenerationMode(makeInput({ hasCompliance: true }))).toBe('Enterprise');
  });

  it('returns Enterprise for "enterprise" prompt keyword', () => {
    expect(classifyGenerationMode(makeInput({ prompt: 'Enterprise B2B SaaS platform' }))).toBe('Enterprise');
  });

  it('returns Balanced for plain SaaS project', () => {
    const mode = classifyGenerationMode(makeInput());
    expect(mode).toBe('Balanced');
  });

  it('returns Quality for high complexity (8+ services)', () => {
    const mode = classifyGenerationMode(makeInput({ serviceCount: 10, productFeatures: new Array(12).fill('Feature') }));
    expect(['Quality', 'Enterprise']).toContain(mode);
  });

  it('getModeRationale returns a non-empty string for every mode', () => {
    for (const mode of ALL_MODES) {
      const rationale = getModeRationale(mode, makeInput());
      expect(typeof rationale).toBe('string');
      expect(rationale.length).toBeGreaterThan(0);
    }
  });
});

// ── GenerationStrategy ────────────────────────────────────────────────────────

describe('planGenerationStrategy', () => {
  it('Fast mode is not incremental and not parallel', () => {
    const s = planGenerationStrategy('Fast', makeInput());
    expect(s.isIncremental).toBe(false);
    expect(s.isParallel).toBe(false);
    expect(s.maxIterations).toBe(1);
    expect(s.contextDepth).toBe('minimal');
  });

  it('Enterprise mode is incremental and parallel with deep context', () => {
    const s = planGenerationStrategy('Enterprise', makeInput());
    expect(s.isIncremental).toBe(true);
    expect(s.isParallel).toBe(true);
    expect(s.maxIterations).toBeGreaterThanOrEqual(3);
    expect(s.contextDepth).toBe('deep');
  });

  it('all modes return a mode-matching strategy', () => {
    for (const mode of ALL_MODES) {
      const s = planGenerationStrategy(mode, makeInput());
      expect(s.mode).toBe(mode);
    }
  });

  it('Creative mode is not deterministic', () => {
    const s = planGenerationStrategy('Creative', makeInput());
    expect(s.isDeterministic).toBe(false);
  });

  it('Enterprise mode is deterministic', () => {
    const s = planGenerationStrategy('Enterprise', makeInput());
    expect(s.isDeterministic).toBe(true);
  });
});

// ── CandidateStrategy ─────────────────────────────────────────────────────────

describe('planCandidateStrategy', () => {
  it('Fast mode generates exactly 1 candidate', () => {
    const s = planCandidateStrategy('Fast', makeInput());
    expect(s.count).toBe(1);
    expect(s.parallelGeneration).toBe(false);
  });

  it('Safe mode generates exactly 1 candidate', () => {
    const s = planCandidateStrategy('Safe', makeInput());
    expect(s.count).toBe(1);
  });

  it('Experimental mode generates 5 candidates', () => {
    const s = planCandidateStrategy('Experimental', makeInput());
    expect(s.count).toBe(5);
  });

  it('Quality mode generates at least 3 candidates', () => {
    const s = planCandidateStrategy('Quality', makeInput());
    expect(s.count).toBeGreaterThanOrEqual(3);
  });

  it('Balanced mode generates 2 candidates with parallelGeneration', () => {
    const s = planCandidateStrategy('Balanced', makeInput());
    expect(s.count).toBe(2);
    expect(s.parallelGeneration).toBe(true);
  });

  it('all modes return count 1-5', () => {
    for (const mode of ALL_MODES) {
      const s = planCandidateStrategy(mode, makeInput());
      expect([1, 2, 3, 5]).toContain(s.count);
    }
  });
});

// ── RepairStrategy ────────────────────────────────────────────────────────────

describe('planRepairStrategy', () => {
  it('Fast mode skips repair', () => {
    const s = planRepairStrategy('Fast', makeInput());
    expect(s.policy).toBe('skip');
    expect(s.maxPasses).toBe(0);
  });

  it('Enterprise mode uses aggressive repair with 5 passes', () => {
    const s = planRepairStrategy('Enterprise', makeInput());
    expect(s.policy).toBe('aggressive');
    expect(s.maxPasses).toBe(5);
    expect(s.threshold).toBeGreaterThanOrEqual(8.0);
  });

  it('Strict mode is conservative', () => {
    const s = planRepairStrategy('Strict', makeInput());
    expect(s.isConservative).toBe(true);
  });

  it('Safe mode is conservative', () => {
    const s = planRepairStrategy('Safe', makeInput());
    expect(s.isConservative).toBe(true);
  });

  it('threshold is between 0 and 10 for all modes', () => {
    for (const mode of ALL_MODES) {
      const s = planRepairStrategy(mode, makeInput());
      expect(s.threshold).toBeGreaterThanOrEqual(0);
      expect(s.threshold).toBeLessThanOrEqual(10);
    }
  });
});

// ── EvaluationStrategy ────────────────────────────────────────────────────────

describe('planEvaluationStrategy', () => {
  it('weights sum to approximately 1.00 for all input types', () => {
    const inputs = [
      makeInput(),
      makeInput({ backendType: 'ECommerce' }),
      makeInput({ backendType: 'Healthcare', hasCompliance: true }),
      makeInput({ backendType: 'Dashboard', productGoal: 'Dashboard' }),
      makeInput({ backendType: 'LandingAPI', productGoal: 'LandingPage' }),
    ];
    for (const inp of inputs) {
      const s = planEvaluationStrategy('Balanced', inp);
      const total = Object.values(s.weights).reduce((a, b) => a + b, 0);
      expect(Math.abs(total - 1.0)).toBeLessThan(0.02);
    }
  });

  it('Enterprise mode is strict', () => {
    const s = planEvaluationStrategy('Enterprise', makeInput());
    expect(s.isStrict).toBe(true);
  });

  it('Strict mode is strict', () => {
    const s = planEvaluationStrategy('Strict', makeInput());
    expect(s.isStrict).toBe(true);
  });

  it('ECommerce prioritizes conversion', () => {
    const s = planEvaluationStrategy('Quality', makeInput({ backendType: 'ECommerce' }));
    expect(s.weights['conversion']).toBeDefined();
    expect(s.weights['conversion']!).toBeGreaterThanOrEqual(0.25);
  });

  it('Dashboard prioritizes performance or usability', () => {
    const s = planEvaluationStrategy('Quality', makeInput({ backendType: 'Dashboard', productGoal: 'Dashboard' }));
    const topWeight = Math.max(...Object.values(s.weights));
    expect(topWeight).toBeGreaterThanOrEqual(0.25);
  });

  it('LandingPage prioritizes visual', () => {
    const s = planEvaluationStrategy('Quality', makeInput({ backendType: 'LandingAPI', productGoal: 'LandingPage' }));
    expect(s.weights['visual']).toBeGreaterThanOrEqual(0.3);
  });

  it('Healthcare/compliance → Enterprise profile (reliability/security)', () => {
    const s = planEvaluationStrategy('Quality', makeInput({ backendType: 'Healthcare', hasCompliance: true }));
    expect(s.weights['reliability'] ?? s.weights['security']).toBeDefined();
  });

  it('threshold increases from Fast to Enterprise', () => {
    const fast       = planEvaluationStrategy('Fast',       makeInput()).threshold;
    const enterprise = planEvaluationStrategy('Enterprise', makeInput()).threshold;
    expect(enterprise).toBeGreaterThan(fast);
  });

  it('priorityDimension is a non-empty string', () => {
    const s = planEvaluationStrategy('Balanced', makeInput());
    expect(typeof s.priorityDimension).toBe('string');
    expect(s.priorityDimension.length).toBeGreaterThan(0);
  });
});

// ── OptimizationStrategy ──────────────────────────────────────────────────────

describe('planOptimizationStrategy', () => {
  it('LandingAPI has seoOverMotion=true', () => {
    const s = planOptimizationStrategy('Balanced', makeInput({ backendType: 'LandingAPI' }));
    expect(s.seoOverMotion).toBe(true);
  });

  it('Dashboard has performanceOverAnimation=true', () => {
    const s = planOptimizationStrategy('Balanced', makeInput({ backendType: 'Dashboard', productGoal: 'Dashboard' }));
    expect(s.performanceOverAnimation).toBe(true);
  });

  it('Healthcare has accessibilityPriority=true', () => {
    const s = planOptimizationStrategy('Enterprise', makeInput({ backendType: 'Healthcare', hasCompliance: true }));
    expect(s.accessibilityPriority).toBe(true);
  });

  it('Fast mode uses minimal bundle size', () => {
    const s = planOptimizationStrategy('Fast', makeInput());
    expect(s.bundleSizeTarget).toBe('minimal');
  });

  it('Quality mode has designQualityOverSpeed=true', () => {
    const s = planOptimizationStrategy('Quality', makeInput());
    expect(s.designQualityOverSpeed).toBe(true);
  });
});

// ── Streaming always enabled ──────────────────────────────────────────────────

describe('planStreamingStrategy', () => {
  it('SSE is always enabled for ALL modes', () => {
    for (const mode of ALL_MODES) {
      const s = planStreamingStrategy(mode, makeInput());
      expect(s.enableSSE).toBe(true);
    }
  });

  it('flushIntervalMs is positive for all modes', () => {
    for (const mode of ALL_MODES) {
      const s = planStreamingStrategy(mode, makeInput());
      expect(s.flushIntervalMs).toBeGreaterThan(0);
    }
  });

  it('batchSize is at least 1 for all modes', () => {
    for (const mode of ALL_MODES) {
      const s = planStreamingStrategy(mode, makeInput());
      expect(s.batchSize).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── PerformancePrediction ─────────────────────────────────────────────────────

describe('predictPerformance', () => {
  it('estimatedBuildTimeMs is positive for all modes', () => {
    for (const mode of ALL_MODES) {
      const p = predictPerformance(mode, makeInput());
      expect(p.estimatedBuildTimeMs).toBeGreaterThan(0);
    }
  });

  it('Fast mode is faster than Enterprise', () => {
    const fast       = predictPerformance('Fast',       makeInput()).estimatedBuildTimeMs;
    const enterprise = predictPerformance('Enterprise', makeInput()).estimatedBuildTimeMs;
    expect(fast).toBeLessThan(enterprise);
  });

  it('estimatedCompletionProbability is between 0.7 and 1.0', () => {
    for (const mode of ALL_MODES) {
      const p = predictPerformance(mode, makeInput());
      expect(p.estimatedCompletionProbability).toBeGreaterThanOrEqual(0.70);
      expect(p.estimatedCompletionProbability).toBeLessThanOrEqual(1.0);
    }
  });

  it('estimatedTokenUsage is positive', () => {
    for (const mode of ALL_MODES) {
      const p = predictPerformance(mode, makeInput());
      expect(p.estimatedTokenUsage).toBeGreaterThan(0);
    }
  });

  it('compliance reduces completion probability', () => {
    const base       = predictPerformance('Enterprise', makeInput({ hasCompliance: false }));
    const compliance = predictPerformance('Enterprise', makeInput({ hasCompliance: true }));
    expect(compliance.estimatedCompletionProbability).toBeLessThanOrEqual(base.estimatedCompletionProbability);
  });

  it('enterprise mode Fast repair count is 0', () => {
    const p = predictPerformance('Fast', makeInput());
    expect(p.estimatedRepairCount).toBe(0);
  });
});

// ── RetrievalIntelligence ─────────────────────────────────────────────────────

describe('planRetrievalIntelligence', () => {
  it('returns a libraries array with at least 3 entries', () => {
    const r = planRetrievalIntelligence('Balanced', makeInput());
    expect(Array.isArray(r.libraries)).toBe(true);
    expect(r.libraries.length).toBeGreaterThanOrEqual(3);
  });

  it('always includes shadcn and tailwind', () => {
    const r = planRetrievalIntelligence('Quality', makeInput());
    expect(r.libraries).toContain('shadcn');
    expect(r.libraries).toContain('tailwind');
  });

  it('hasAuth project includes auth-patterns', () => {
    const r = planRetrievalIntelligence('Balanced', makeInput({ hasAuth: true }));
    expect(r.libraries).toContain('auth-patterns');
  });

  it('hasPayments project includes stripe-patterns', () => {
    const r = planRetrievalIntelligence('Balanced', makeInput({ hasPayments: true }));
    expect(r.libraries).toContain('stripe-patterns');
  });

  it('Enterprise mode queries more RAGs than Fast', () => {
    const fast       = planRetrievalIntelligence('Fast',       makeInput()).ragQueriesCount;
    const enterprise = planRetrievalIntelligence('Enterprise', makeInput()).ragQueriesCount;
    expect(enterprise).toBeGreaterThan(fast);
  });

  it('maxContextTokens is positive', () => {
    const r = planRetrievalIntelligence('Balanced', makeInput());
    expect(r.maxContextTokens).toBeGreaterThan(0);
  });
});

// ── ValidationStrategy ────────────────────────────────────────────────────────

describe('planValidationStrategy', () => {
  it('compliance input forces enterprise level', () => {
    const s = planValidationStrategy('Balanced', makeInput({ hasCompliance: true }));
    expect(s.level).toBe('enterprise');
  });

  it('Enterprise mode uses enterprise validation', () => {
    const s = planValidationStrategy('Enterprise', makeInput());
    expect(s.level).toBe('enterprise');
  });

  it('Fast mode uses minimal validation', () => {
    const s = planValidationStrategy('Fast', makeInput());
    expect(s.level).toBe('minimal');
  });

  it('failFast is true for Fast and Safe modes', () => {
    expect(planValidationStrategy('Fast', makeInput()).failFast).toBe(true);
    expect(planValidationStrategy('Safe', makeInput()).failFast).toBe(true);
  });

  it('enterprise level validates runtime and accessibility', () => {
    const s = planValidationStrategy('Enterprise', makeInput());
    expect(s.validateRuntime).toBe(true);
    expect(s.validateTypes).toBe(true);
  });
});

// ── RiskStrategy ──────────────────────────────────────────────────────────────

describe('planRiskStrategy', () => {
  it('Healthcare returns critical risk level', () => {
    const s = planRiskStrategy('Enterprise', makeInput({ backendType: 'Healthcare', hasCompliance: true }));
    expect(s.level).toBe('critical');
  });

  it('Finance returns critical risk level', () => {
    const s = planRiskStrategy('Enterprise', makeInput({ backendType: 'Finance', hasCompliance: true }));
    expect(s.level).toBe('critical');
  });

  it('critical risk has failSafe=true', () => {
    const s = planRiskStrategy('Enterprise', makeInput({ hasCompliance: true }));
    expect(s.failSafe).toBe(true);
  });

  it('Safe mode has failSafe=true', () => {
    const s = planRiskStrategy('Safe', makeInput());
    expect(s.failSafe).toBe(true);
  });

  it('mitigationPriority is a non-empty array', () => {
    const s = planRiskStrategy('Enterprise', makeInput({ hasAuth: true, hasPayments: true }));
    expect(Array.isArray(s.mitigationPriority)).toBe(true);
    expect(s.mitigationPriority.length).toBeGreaterThan(0);
  });
});

// ── validateRuntimeBlueprint ──────────────────────────────────────────────────

describe('validateRuntimeBlueprint', () => {
  it('returns qualityScores, overallScore, recommendations', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    const result = validateRuntimeBlueprint(blueprint);
    expect(result).toHaveProperty('qualityScores');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('recommendations');
  });

  it('overallScore is between 0 and 10', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    expect(validateRuntimeBlueprint(blueprint).overallScore).toBeGreaterThanOrEqual(0);
    expect(validateRuntimeBlueprint(blueprint).overallScore).toBeLessThanOrEqual(10);
  });

  it('covers all 16 dimensions', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    const dims = validateRuntimeBlueprint(blueprint).qualityScores.map(q => q.dimension);
    for (const dim of ALL_RUNTIME_DIMENSIONS) {
      expect(dims).toContain(dim);
    }
  });
});

// ── ALL_RUNTIME_DIMENSIONS ────────────────────────────────────────────────────

describe('ALL_RUNTIME_DIMENSIONS', () => {
  it('has exactly 16 entries', () => {
    expect(ALL_RUNTIME_DIMENSIONS.length).toBe(16);
  });

  it('includes all required dimensions', () => {
    const required = [
      'generation', 'candidate', 'repair', 'evaluation', 'optimization',
      'caching', 'context', 'parallelization', 'validation', 'rendering',
      'prompt', 'retry', 'streaming', 'deployment', 'risk', 'memory',
    ];
    for (const dim of required) {
      expect(ALL_RUNTIME_DIMENSIONS).toContain(dim);
    }
  });
});
