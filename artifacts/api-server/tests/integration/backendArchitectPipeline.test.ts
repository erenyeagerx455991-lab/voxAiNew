// ── V8.6 Backend Architect — Integration & Pipeline Tests ─────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import type { Response } from 'express';

// static imports only — no await import() inside test bodies
import { runBackendArchitect }        from '../../src/backend-architect/backendArchitect.js';
import { validateBackendBlueprint }   from '../../src/backend-architect/backendValidator.js';
import { recordBackendBuild, getBackendMetrics, resetBackendMetrics } from '../../src/backend-architect/backendMetrics.js';
import { learnFromBackendBuild, getBackendLearningStats, resetBackendLearning } from '../../src/backend-architect/backendLearning.js';
import {
  persistArchitectureSnapshot,
  getArchitectureHistory,
  rollbackToVersion,
  resetBackendArchitectPersistence,
  getPersistenceStats,
  getCurrentSnapshot,
} from '../../src/backend-architect/backendPersistence.js';
import {
  classifyBackendType,
  isEnterpriseBackend,
  isHighTrafficBackend,
  ALL_BACKEND_TYPES,
} from '../../src/backend-architect/backendPlanner.js';
import { planDatabaseArchitecture }   from '../../src/backend-architect/databasePlanner.js';
import { planAPIArchitecture }        from '../../src/backend-architect/apiPlanner.js';
import { planSecurityArchitecture }   from '../../src/backend-architect/securityPlanner.js';
import { planCacheArchitecture }      from '../../src/backend-architect/cachePlanner.js';
import { planDeploymentArchitecture } from '../../src/backend-architect/deploymentPlanner.js';
import { ALL_BACKEND_DIMENSIONS }     from '../../src/backend-architect/backendTypes.js';
import type { BackendType }           from '../../src/backend-architect/backendTypes.js';
import { runBackendArchitectStep }    from '../../src/agents/pipeline/backendArchitectStep.js';

// facade static imports
import {
  classifyBackendType       as facadeClassify,
  runBackendArchitect       as facadeRunArchitect,
  validateBackendBlueprint  as facadeValidate,
  getBackendMetrics         as facadeGetMetrics,
  learnFromBackendBuild     as facadeLearn,
  initBackendArchitectPersistence as facadeInitPersist,
  persistArchitectureSnapshot as facadePersist,
  rollbackToVersion         as facadeRollback,
  ALL_BACKEND_TYPES         as facadeAllTypes,
  ALL_BACKEND_DIMENSIONS    as facadeAllDims,
} from '../../src/backend-architect/backendFacade.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeProductPlan(goal = 'SaaS' as any) {
  return {
    productGoal:        goal,
    plannedFeatures:    [] as any[],
    productName:        'IntegTest',
    productDescription: '',
    keyPersonas:        [],
    objectives:         [],
    contextString:      '',
    productScore:       7,
  };
}

function makeMockRes() {
  const events: object[] = [];
  const res = {
    write: (chunk: string) => {
      try {
        const payload = chunk.replace(/^data: /, '').trim();
        if (payload) events.push(JSON.parse(payload));
      } catch { /* ignore non-JSON */ }
      return true;
    },
    events,
  } as unknown as Response & { events: object[] };
  return res;
}

// ── 1. Full pipeline integration ──────────────────────────────────────────────

describe('runBackendArchitect — full pipeline integration', () => {
  it('runs to completion for every backend type without throwing', () => {
    const types: BackendType[] = [
      'SaaSBackend', 'CRMBackend', 'ECommerce', 'Marketplace',
      'LandingAPI', 'Finance', 'Healthcare', 'AIPlatform',
      'Analytics', 'Education', 'Documentation', 'Enterprise',
    ];
    for (const goal of types) {
      expect(() =>
        runBackendArchitect(`build a ${goal} app`, makeProductPlan(goal)),
      ).not.toThrow();
    }
  });

  it('produces a valid blueprint score for SaaS', () => {
    const result = runBackendArchitect('saas subscription platform', makeProductPlan('SaaS'));
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);
  });

  it('all 20 sub-architectures are present in blueprint', () => {
    const { blueprint } = runBackendArchitect('saas platform', makeProductPlan());
    const keys: (keyof typeof blueprint)[] = [
      'databaseArchitecture', 'apiArchitecture', 'authArchitecture',
      'permissionArchitecture', 'serviceArchitecture', 'repositoryArchitecture',
      'controllerArchitecture', 'middlewareArchitecture', 'validationArchitecture',
      'cacheArchitecture', 'queueArchitecture', 'eventArchitecture',
      'storageArchitecture', 'loggingArchitecture', 'monitoringArchitecture',
      'securityArchitecture', 'deploymentArchitecture', 'testingArchitecture',
      'performanceArchitecture', 'folderStructure',
    ];
    for (const key of keys) {
      expect(blueprint[key], `Missing sub-architecture: ${key}`).toBeDefined();
    }
  });

  it('enrichedPromptWithArchitecture contains key backend metadata', () => {
    const result = runBackendArchitect('finance banking platform', makeProductPlan('Finance'));
    const ctx = result.enrichedPromptWithArchitecture;
    expect(ctx).toContain('DATABASE:');
    expect(ctx).toContain('AUTH:');
    expect(ctx).toContain('SECURITY:');
    expect(ctx).toContain('SCORE:');
  });

  it('finance backend uses PostgreSQL', () => {
    const { blueprint } = runBackendArchitect('fintech banking system', makeProductPlan('Finance'));
    expect(blueprint.databaseArchitecture.primary).toBe('PostgreSQL');
  });

  it('AI platform includes vector DB in secondary', () => {
    const { blueprint } = runBackendArchitect('ai platform with llm', makeProductPlan('AIProduct'));
    expect(blueprint.databaseArchitecture.secondary).toContain('VectorDB');
  });

  it('security compliance is Enterprise for Finance', () => {
    const { blueprint } = runBackendArchitect('finance system', makeProductPlan('Finance'));
    expect(blueprint.securityArchitecture.complianceLevel).toBe('Enterprise');
  });

  it('LandingAPI has no auth', () => {
    const { blueprint } = runBackendArchitect('landing page', makeProductPlan('LandingPage'));
    expect(blueprint.authArchitecture.primaryStrategy).toBe('None');
  });

  it('ECommerce has payment services', () => {
    const { blueprint } = runBackendArchitect('ecommerce shop', makeProductPlan('ECommerce'));
    expect(blueprint.serviceArchitecture.hasPaymentServices).toBe(true);
  });

  it('blueprint.backendType is always a known type', () => {
    const result = runBackendArchitect('analytics dashboard', makeProductPlan('Dashboard'));
    expect(ALL_BACKEND_TYPES as readonly string[]).toContain(result.blueprint.backendType);
  });
});

// ── 2. SSE event emission (backendArchitectStep) ───────────────────────────────

describe('SSE event emission via pipeline step', () => {
  it('emits backend_architect_start event', async () => {
    const res = makeMockRes();
    await runBackendArchitectStep('saas platform', 'build-sse-1', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    const types = res.events.map((e: any) => e.type);
    expect(types).toContain('backend_architect_start');
  });

  it('emits backend_architect_progress event', async () => {
    const res = makeMockRes();
    await runBackendArchitectStep('saas platform', 'build-sse-2', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    const types = res.events.map((e: any) => e.type);
    expect(types).toContain('backend_architect_progress');
  });

  it('emits backend_architect_complete event', async () => {
    const res = makeMockRes();
    await runBackendArchitectStep('saas platform', 'build-sse-3', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    const types = res.events.map((e: any) => e.type);
    expect(types).toContain('backend_architect_complete');
  });

  it('backend_architect_progress includes backendType and score', async () => {
    const res = makeMockRes();
    await runBackendArchitectStep('saas platform', 'build-sse-4', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    const progress = res.events.find((e: any) => e.type === 'backend_architect_progress') as any;
    expect(progress).toBeDefined();
    expect(progress.backendType).toBeDefined();
    expect(typeof progress.score).toBe('number');
  });

  it('backend_architect_complete includes overallScore', async () => {
    const res = makeMockRes();
    await runBackendArchitectStep('saas platform', 'build-sse-5', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    const complete = res.events.find((e: any) => e.type === 'backend_architect_complete') as any;
    expect(complete).toBeDefined();
    expect(typeof complete.overallScore).toBe('number');
  });

  it('step returns a valid BackendArchitectOutput', async () => {
    const res = makeMockRes();
    const output = await runBackendArchitectStep('saas platform', 'build-sse-6', res, {
      productPlan: makeProductPlan(),
      contextString: '',
      productScore: 7,
    } as any);
    expect(output).toHaveProperty('blueprint');
    expect(output).toHaveProperty('overallScore');
    expect(output).toHaveProperty('enrichedPromptWithArchitecture');
  });

  it('step never throws — even on minimal product plan', async () => {
    const res = makeMockRes();
    await expect(
      runBackendArchitectStep('', 'build-sse-7', res, {
        productPlan: { ...makeProductPlan(), plannedFeatures: [] },
        contextString: '',
        productScore: 0,
      } as any),
    ).resolves.toBeDefined();
  });
});

// ── 3. Telemetry shape ─────────────────────────────────────────────────────────

describe('telemetry — backendArchitecture shape (Phase 21)', () => {
  beforeEach(() => resetBackendMetrics());

  it('getBackendMetrics returns required V8.6 telemetry fields', () => {
    const m = getBackendMetrics();
    expect(m).toHaveProperty('totalBuilds');
    expect(m).toHaveProperty('averageScore');
    expect(m).toHaveProperty('averageSecurityScore');
    expect(m).toHaveProperty('averageDatabaseScore');
    expect(m).toHaveProperty('averageAPIScore');
    expect(m).toHaveProperty('scoreByDimension');
    expect(m).toHaveProperty('topBackendTypes');
    expect(m).toHaveProperty('learningRecordCount');
    expect(m).toHaveProperty('lastUpdated');
  });

  it('scoreByDimension after a build has all 10 dimensions', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 7, rationale: '' }));
    recordBackendBuild('SaaSBackend', qs, 7);
    const { scoreByDimension } = getBackendMetrics();
    for (const dim of ALL_BACKEND_DIMENSIONS) {
      expect(scoreByDimension).toHaveProperty(dim);
    }
  });

  it('topBackendTypes is an array', () => {
    expect(Array.isArray(getBackendMetrics().topBackendTypes)).toBe(true);
  });

  it('lastUpdated is a recent timestamp', () => {
    const before = Date.now() - 2000;
    const { lastUpdated } = getBackendMetrics();
    expect(lastUpdated).toBeGreaterThan(before);
  });

  it('averageScore increases when a high-score build is added', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 9, rationale: '' }));
    recordBackendBuild('Finance', qs, 9);
    expect(getBackendMetrics().averageScore).toBeGreaterThan(0);
  });

  it('topBackendTypes reflects the most-built type', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 7, rationale: '' }));
    recordBackendBuild('SaaSBackend', qs, 7);
    recordBackendBuild('SaaSBackend', qs, 7);
    recordBackendBuild('Finance', qs, 7);
    const top = getBackendMetrics().topBackendTypes;
    expect(top[0].type).toBe('SaaSBackend');
  });
});

// ── 4. Persistence integration ─────────────────────────────────────────────────

describe('persistence integration (Phase 23)', () => {
  beforeEach(() => resetBackendArchitectPersistence());

  it('records survive multiple persist calls', () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    persistArchitectureSnapshot('b1', blueprint);
    persistArchitectureSnapshot('b2', blueprint);
    persistArchitectureSnapshot('b3', blueprint);
    expect(getArchitectureHistory()).toHaveLength(3);
  });

  it('rollback + re-run: rolled-back blueprint is valid', () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    persistArchitectureSnapshot('original', blueprint);
    const snap = getCurrentSnapshot()!;
    const result = rollbackToVersion(snap.version) as { ok: true; snapshot: any };
    expect(result.ok).toBe(true);
    const { overallScore } = validateBackendBlueprint(result.snapshot.blueprint);
    expect(overallScore).toBeGreaterThanOrEqual(0);
  });

  it('capacity stat reports a non-negative integer', () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    persistArchitectureSnapshot('b1', blueprint);
    const { capacityUsed, totalSnapshots } = getPersistenceStats();
    expect(capacityUsed).toBeGreaterThanOrEqual(0);
    expect(capacityUsed).toBeLessThanOrEqual(100);
    expect(totalSnapshots).toBe(1);
  });

  it('snapshot includes recordedAt timestamp', () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    persistArchitectureSnapshot('ts-test', blueprint);
    const snap = getCurrentSnapshot()!;
    expect(snap.recordedAt).toBeGreaterThan(0);
  });

  it('snapshot backendType matches blueprint', () => {
    const result = runBackendArchitect('finance system', makeProductPlan('Finance'));
    persistArchitectureSnapshot('fin', result.blueprint);
    const snap = getCurrentSnapshot()!;
    expect(snap.backendType).toBe(result.blueprint.backendType);
  });

  it('history is ordered newest first', () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    persistArchitectureSnapshot('first',  blueprint);
    persistArchitectureSnapshot('second', blueprint);
    const history = getArchitectureHistory();
    expect(history[0].buildId).toBe('second');
  });
});

// ── 5. Cross-planner coherence ─────────────────────────────────────────────────

describe('cross-planner coherence', () => {
  it('enterprise backends have Docker enabled', () => {
    for (const t of ['Enterprise', 'Finance', 'Healthcare'] as BackendType[]) {
      expect(planDeploymentArchitecture(t).hasDocker).toBe(true);
    }
  });

  it('enterprise backends have Redis cache', () => {
    for (const t of ['Enterprise', 'Finance', 'Healthcare'] as BackendType[]) {
      expect(planCacheArchitecture(t, []).hasRedis).toBe(true);
    }
  });

  it('all backends have security helmet', () => {
    for (const t of ALL_BACKEND_TYPES) {
      expect(planSecurityArchitecture(t).hasHelmet).toBe(true);
    }
  });

  it('all backends have CORS configuration', () => {
    for (const t of ALL_BACKEND_TYPES) {
      expect(planSecurityArchitecture(t).hasCORSConfig).toBe(true);
    }
  });

  it('all backends have health API', () => {
    for (const t of ALL_BACKEND_TYPES) {
      expect(planAPIArchitecture(t, []).hasHealthAPI).toBe(true);
    }
  });

  it('enterprise backends have connection pooling in DB', () => {
    for (const t of ['Enterprise', 'Finance', 'Healthcare', 'MultiTenant'] as BackendType[]) {
      expect(planDatabaseArchitecture(t, []).connectionPooling).toBe(true);
    }
  });

  it('LandingAPI uses SQLite (lightweight)', () => {
    expect(planDatabaseArchitecture('LandingAPI', []).primary).toBe('SQLite');
  });

  it('all backends have a valid compliance level', () => {
    for (const t of ALL_BACKEND_TYPES) {
      const sec = planSecurityArchitecture(t);
      expect(['Basic', 'Standard', 'Enterprise']).toContain(sec.complianceLevel);
    }
  });

  it('high traffic backends have response or CDN cache', () => {
    for (const t of ALL_BACKEND_TYPES) {
      if (isHighTrafficBackend(t)) {
        const cache = planCacheArchitecture(t, []);
        expect(cache.hasResponseCache || cache.hasCDNCache).toBe(true);
      }
    }
  });
});

// ── 6. Learning integration ────────────────────────────────────────────────────

describe('learning integration (Phase 20)', () => {
  beforeEach(() => resetBackendLearning());

  it('learning does not block or throw', async () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    await expect(learnFromBackendBuild({ buildId: 'learn-1', blueprint })).resolves.not.toThrow();
  });

  it('byType is populated after learning', async () => {
    const result = runBackendArchitect('saas platform', makeProductPlan());
    await learnFromBackendBuild({ buildId: 'learn-2', blueprint: result.blueprint });
    const stats = getBackendLearningStats();
    expect(stats.byType[result.blueprint.backendType]).toBeGreaterThanOrEqual(1);
  });

  it('multiple builds accumulate learning correctly', async () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    for (let i = 0; i < 5; i++) {
      await learnFromBackendBuild({ buildId: `learn-acc-${i}`, blueprint });
    }
    expect(getBackendLearningStats().totalRecords).toBe(5);
  });

  it('learning with evaluatorScore updates averageScore', async () => {
    const { blueprint } = runBackendArchitect('saas', makeProductPlan());
    await learnFromBackendBuild({ buildId: 'eval-1', blueprint, evaluatorScore: 9 });
    expect(getBackendLearningStats().averageScore).toBe(9);
  });

  it('never throws on null blueprint', async () => {
    await expect(learnFromBackendBuild({ buildId: 'null-test', blueprint: null as any }))
      .resolves.not.toThrow();
  });
});

// ── 7. Facade re-exports ───────────────────────────────────────────────────────

describe('backendFacade — public API contract', () => {
  it('re-exports classifyBackendType', () => {
    expect(typeof facadeClassify).toBe('function');
  });

  it('re-exports runBackendArchitect', () => {
    expect(typeof facadeRunArchitect).toBe('function');
  });

  it('re-exports validateBackendBlueprint', () => {
    expect(typeof facadeValidate).toBe('function');
  });

  it('re-exports getBackendMetrics', () => {
    expect(typeof facadeGetMetrics).toBe('function');
  });

  it('re-exports learnFromBackendBuild', () => {
    expect(typeof facadeLearn).toBe('function');
  });

  it('re-exports initBackendArchitectPersistence', () => {
    expect(typeof facadeInitPersist).toBe('function');
  });

  it('re-exports persistArchitectureSnapshot', () => {
    expect(typeof facadePersist).toBe('function');
  });

  it('re-exports rollbackToVersion', () => {
    expect(typeof facadeRollback).toBe('function');
  });

  it('re-exports ALL_BACKEND_TYPES constant', () => {
    expect(Array.isArray(facadeAllTypes)).toBe(true);
    expect(facadeAllTypes.length).toBeGreaterThan(0);
  });

  it('re-exports ALL_BACKEND_DIMENSIONS constant', () => {
    expect(Array.isArray(facadeAllDims)).toBe(true);
    expect(facadeAllDims).toHaveLength(10);
  });

  it('facade runBackendArchitect works end-to-end', () => {
    const result = facadeRunArchitect('saas platform', makeProductPlan());
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.blueprint).toBeDefined();
  });

  it('facade validateBackendBlueprint works', () => {
    const { blueprint } = facadeRunArchitect('saas platform', makeProductPlan());
    const { overallScore } = facadeValidate(blueprint);
    expect(overallScore).toBeGreaterThan(0);
  });
});
