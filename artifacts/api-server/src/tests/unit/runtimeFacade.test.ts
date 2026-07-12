// ── V9.0 Runtime Intelligence — Facade Unit Tests ────────────────────────────
import { describe, it, expect } from 'vitest';
import * as facade from '../../runtime-intelligence/runtimeFacade.js';

describe('runtimeFacade — module loads cleanly', () => {
  it('imports without throwing', () => {
    expect(facade).toBeDefined();
  });
});

describe('runtimeFacade — classifier exports', () => {
  it('exports classifyGenerationMode as a function', () => {
    expect(typeof facade.classifyGenerationMode).toBe('function');
  });

  it('exports getModeRationale as a function', () => {
    expect(typeof facade.getModeRationale).toBe('function');
  });
});

describe('runtimeFacade — strategy planner exports', () => {
  const expectedPlanners = [
    'planGenerationStrategy',
    'planCandidateStrategy',
    'planRepairStrategy',
    'planEvaluationStrategy',
    'planOptimizationStrategy',
    'planCachingStrategy',
    'planContextStrategy',
    'planParallelizationStrategy',
    'planValidationStrategy',
    'planRenderingStrategy',
    'planPromptStrategy',
    'planRetryStrategy',
    'planStreamingStrategy',
    'planDeploymentStrategy',
    'planRiskStrategy',
    'planMemoryStrategy',
  ];

  for (const name of expectedPlanners) {
    it(`exports ${name} as a function`, () => {
      expect(typeof (facade as Record<string, unknown>)[name]).toBe('function');
    });
  }
});

describe('runtimeFacade — intelligence module exports', () => {
  it('exports predictPerformance', () => {
    expect(typeof facade.predictPerformance).toBe('function');
  });

  it('exports planRetrievalIntelligence', () => {
    expect(typeof facade.planRetrievalIntelligence).toBe('function');
  });

  it('exports buildRuntimeContext', () => {
    expect(typeof facade.buildRuntimeContext).toBe('function');
  });

  it('exports buildContextString', () => {
    expect(typeof facade.buildContextString).toBe('function');
  });
});

describe('runtimeFacade — validator export', () => {
  it('exports validateRuntimeBlueprint', () => {
    expect(typeof facade.validateRuntimeBlueprint).toBe('function');
  });
});

describe('runtimeFacade — metrics exports', () => {
  it('exports recordRuntimeBuild', () => {
    expect(typeof facade.recordRuntimeBuild).toBe('function');
  });

  it('exports getRuntimeMetrics', () => {
    expect(typeof facade.getRuntimeMetrics).toBe('function');
  });

  it('exports resetRuntimeMetrics', () => {
    expect(typeof facade.resetRuntimeMetrics).toBe('function');
  });
});

describe('runtimeFacade — learning exports', () => {
  it('exports learnFromRuntimeBuild', () => {
    expect(typeof facade.learnFromRuntimeBuild).toBe('function');
  });

  it('exports getRuntimeLearningStats', () => {
    expect(typeof facade.getRuntimeLearningStats).toBe('function');
  });

  it('exports getRuntimeLearningRecords', () => {
    expect(typeof facade.getRuntimeLearningRecords).toBe('function');
  });

  it('exports resetRuntimeLearning', () => {
    expect(typeof facade.resetRuntimeLearning).toBe('function');
  });
});

describe('runtimeFacade — persistence exports', () => {
  it('exports initRuntimeIntelligencePersistence', () => {
    expect(typeof facade.initRuntimeIntelligencePersistence).toBe('function');
  });

  it('exports persistRuntimeSnapshot', () => {
    expect(typeof facade.persistRuntimeSnapshot).toBe('function');
  });

  it('exports getCurrentRuntimeSnapshot', () => {
    expect(typeof facade.getCurrentRuntimeSnapshot).toBe('function');
  });

  it('exports getRuntimeSnapshotByVersion', () => {
    expect(typeof facade.getRuntimeSnapshotByVersion).toBe('function');
  });

  it('exports getRollbackSnapshot', () => {
    expect(typeof facade.getRollbackSnapshot).toBe('function');
  });

  it('exports getRuntimePersistenceStats', () => {
    expect(typeof facade.getRuntimePersistenceStats).toBe('function');
  });

  it('exports resetRuntimePersistence', () => {
    expect(typeof facade.resetRuntimePersistence).toBe('function');
  });
});

describe('runtimeFacade — orchestrator export', () => {
  it('exports runRuntimeIntelligence', () => {
    expect(typeof facade.runRuntimeIntelligence).toBe('function');
  });
});

describe('runtimeFacade — constant exports', () => {
  it('exports ALL_RUNTIME_DIMENSIONS as a non-empty array', () => {
    expect(Array.isArray(facade.ALL_RUNTIME_DIMENSIONS)).toBe(true);
    expect(facade.ALL_RUNTIME_DIMENSIONS.length).toBe(16);
  });
});

describe('runtimeFacade — smoke integration', () => {
  it('runRuntimeIntelligence returns a valid blueprint', () => {
    const out = facade.runRuntimeIntelligence({
      prompt: 'Build a SaaS app', buildId: 'b1',
      productGoal: 'SaaS', productFeatures: ['Auth'],
      businessObjective: 'Freemium', backendType: 'SaaSBackend', infraType: 'Standard',
      serviceCount: 2, hasAuth: true, hasPayments: false, hasRealtime: false, hasCompliance: false,
      productScore: 7, frontendScore: 7, backendScore: 7, devopsScore: 7, qaScore: 7, securityScore: 7,
    });
    expect(out.overallScore).toBeGreaterThan(0);
    expect(out.blueprint.streamingStrategy.enableSSE).toBe(true);
    expect(out.contextString).toContain('RUNTIME INTELLIGENCE');
  });

  it('validateRuntimeBlueprint via facade scores correctly', () => {
    const { blueprint } = facade.runRuntimeIntelligence({
      prompt: 'Enterprise healthcare app', buildId: 'b2',
      productGoal: 'Healthcare', productFeatures: ['Auth', 'Compliance', 'Dashboard'],
      businessObjective: 'Enterprise', backendType: 'Healthcare', infraType: 'Enterprise',
      serviceCount: 5, hasAuth: true, hasPayments: false, hasRealtime: false, hasCompliance: true,
      productScore: 8, frontendScore: 8, backendScore: 8, devopsScore: 8, qaScore: 8, securityScore: 9,
    });
    const result = facade.validateRuntimeBlueprint(blueprint);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.qualityScores.length).toBe(16);
  });
});
