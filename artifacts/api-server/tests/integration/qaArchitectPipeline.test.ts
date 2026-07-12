// ── V8.8 QA Architect — Integration Tests ────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ALL_QA_DIMENSIONS,
  runQAArchitect,
  validateQABlueprint,
  getQAMetrics, resetQAMetrics,
  getQALearningStats, resetQALearning,
  getQAPersistenceStats, resetQAPersistence,
  saveQABlueprint, flushQAPersistence,
  rollbackQAToVersion, getCurrentQAVersion, getQASnapshotAtVersion,
  planTestStrategy, planUnitTests, planIntegrationTests, planAPITests,
  planContractTests, planE2ETests, planAccessibilityTests, planResponsiveTests,
  planBrowserCompatibility, planMobileTests, planPerformanceTests,
  planSecurityTests, planVisualRegression, planChaosTests, planReliability,
  planCoverage, planRisks, predictFailures,
} from '../../src/qa-architect/qaFacade.js';

import type { BackendType } from '../../src/backend-architect/backendTypes.js';
import type { QABlueprint, QAStrategy } from '../../src/qa-architect/qaTypes.js';

// Re-import to verify facade barrel
import { ALL_QA_DIMENSIONS as facadeDims } from '../../src/qa-architect/qaFacade.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_BACKEND_TYPES: BackendType[] = [
  'LandingAPI','SaaSBackend','ECommerce','MicroserviceCandidate',
  'APIGateway','Marketplace','SocialPlatform','AIPlatform','Analytics',
  'Enterprise','MultiTenant','Healthcare','Finance','ERPBackend',
  'ServerlessCandidate','BookingPlatform','CRMBackend',
];

function makeBackendOutput(backendType: BackendType) {
  const dims = ['architecture','database'];
  return {
    blueprint: {
      backendType, backendTypeConfidence: 0.9,
      databaseArchitecture: { primary: 'PostgreSQL', orm: 'Prisma', indexing: [], connectionPooling: true, migrations: true, tableEstimate: 10, hasCaching: false, cacheProvider: 'Redis', hasReadReplica: false, hasSharding: false },
      apiArchitecture: { primaryStyle: 'REST', pagination: 'cursor', versioning: 'header', hasGraphQL: false, hasgRPC: false, hasOpenAPI: true, hasWebSockets: false, hasWebhooks: false, filterSupport: 'basic' },
      authArchitecture: { primaryStrategy: 'JWT', strategies: ['JWT'], hasRefreshToken: true, hasOAuth: false, hasAPIKeys: false, hasMultiTenant: false, sessionDuration: '7d', roles: ['user','admin'] },
      permissionArchitecture: { hasRBAC: true, hasABAC: false, hasFeatureFlags: false, permissionCategories: [], roleHierarchy: [], hasTenantIsolation: false, hasWorkspaceIsolation: false },
      serviceArchitecture: { services: [], serviceCount: 3, hasDomainEvents: false, hasCommandBus: false },
      repositoryArchitecture: { repositories: [], hasUnitOfWork: true, hasTransactions: true },
      controllerArchitecture: { controllers: [], hasValidation: true, hasTransformation: true },
      middlewareArchitecture: { middlewares: [], hasCors: true, hasHelmet: true, hasRateLimiter: true, hasCompression: true, hasAuth: true, hasLogging: true },
      validationArchitecture: { schema: 'Zod', hasRequestValidation: true, hasResponseValidation: false, validationScopes: ['body'] },
      cacheArchitecture: { layers: ['Memory'], provider: 'Redis', defaultTTL: 300, hasRedis: false, hasCDN: false, hasMemoryCache: true, strategies: ['LRU'] },
      queueArchitecture: { hasQueues: false, provider: 'BullMQ', queues: [], hasDLQ: false, hasPriorityQueue: false, concurrency: 1 },
      eventArchitecture: { patterns: [], hasPubSub: false, hasEventEmitter: true, hasWebhookEmission: false },
      storageArchitecture: { providers: [], hasFileUpload: false, hasObjectStorage: false, maxFileSizeMB: 10 },
      loggingArchitecture: { format: 'JSON', hasStructuredLogs: true, hasRequestLogs: true, hasAuditLogs: false, retention: '30d' },
      monitoringArchitecture: { hasHealthChecks: true, hasMetrics: false, hasTracing: false, crashReporting: false, externalMonitor: 'None' },
      deploymentArchitecture: { strategy: 'Rolling', hasDocker: true, hasCI: true, environments: ['development','production'], hasCDN: false, hasEdge: false },
      testingArchitecture: { frameworks: ['Vitest'], hasUnitTests: true, hasIntegrationTests: true, hasAPITests: false, hasLoadTests: false, coverageTarget: 80 },
      securityArchitecture: { hasHelmet: true, hasCORS: true, hasRateLimiting: true, hasInputSanitization: true, hashingAlgorithm: 'bcrypt', encryptionAtRest: false, encryptionInTransit: true, complianceLevel: 'Basic' },
      performanceArchitecture: { estimatedRPS: 100, hasConnectionPooling: true, hasCDN: false, hasEdgeCompute: false, compressionEnabled: true, targetP99LatencyMs: 200 },
      qualityScores: dims.map(d => ({ dimension: d, score: 7, rationale: 'ok' })),
      overallScore: 7,
    },
    overallScore: 7, enrichedPromptWithArchitecture: 'BACKEND', processingTimeMs: 1,
  };
}

function makeProductOutput() {
  return {
    productPlan: {
      productGoal: { type: 'SaaSBackend', description: 'SaaS', targetAudience: 'SMBs', uniqueValueProposition: 'Fast', success: [], confidence: 0.8 },
      businessObjective: { primary: 'Growth', secondary: [], kpis: [] },
      userPersonas: [], plannedFeatures: ['auth'],
      informationArchitecture: { pages: [], navigation: [] },
      userJourney: [], monetizationPlan: { hasPricing: false, tiers: [], currency: 'USD' },
      roadmap: [], detectedRisks: [], qualityScores: [],
      overallProductScore: 7, confidence: 0.8, promptSummary: 'SaaS',
    },
    productScore: 7, contextString: 'Product',
  };
}

function makeBlueprint(t: BackendType): QABlueprint {
  const strategy           = planTestStrategy(t);
  const unitTests          = planUnitTests(t);
  const integrationTests   = planIntegrationTests(t);
  const apiTests           = planAPITests(t);
  const contractTests      = planContractTests(t);
  const e2eTests           = planE2ETests(t);
  const accessibilityTests = planAccessibilityTests(t);
  const responsiveTests    = planResponsiveTests(t);
  const browserCompatibility = planBrowserCompatibility(t);
  const mobileTests        = planMobileTests(t);
  const performanceTests   = planPerformanceTests(t);
  const securityTests      = planSecurityTests(t);
  const visualRegression   = planVisualRegression(t);
  const chaosTests         = planChaosTests(t);
  const reliability        = planReliability(t);
  const coverage           = planCoverage(t);
  const risk               = planRisks(t);
  const failurePredictions = predictFailures(t);
  return {
    strategy, unitTests, integrationTests, apiTests, contractTests,
    e2eTests, accessibilityTests, responsiveTests, browserCompatibility,
    mobileTests, performanceTests, securityTests, visualRegression,
    chaosTests, reliability, coverage, risk, failurePredictions,
    qualityScores: [], overallScore: 0,
  };
}

// ── SSE Event Shapes ──────────────────────────────────────────────────────────

describe('Pipeline Step — SSE event shapes', () => {
  it('qa_architect_start has buildId', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runQAArchitectStep } = await import('../../src/agents/pipeline/qaArchitectStep.js');
    const devopsOut = {} as any;
    await runQAArchitectStep('test', 'qa-build-1', res, makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any, devopsOut);
    const start = events.find((e: any) => e.type === 'qa_architect_start');
    expect(start).toBeDefined();
    expect((start as any).buildId).toBe('qa-build-1');
  });

  it('qa_architect_progress has all required fields', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runQAArchitectStep } = await import('../../src/agents/pipeline/qaArchitectStep.js');
    await runQAArchitectStep('test', 'qa-build-2', res, makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any, {} as any);
    const prog = events.find((e: any) => e.type === 'qa_architect_progress');
    expect(prog).toBeDefined();
    expect((prog as any).qaStrategy).toBeDefined();
    expect((prog as any).confidence).toBeGreaterThan(0);
    expect((prog as any).riskScore).toBeGreaterThanOrEqual(0);
    expect((prog as any).score).toBeGreaterThan(0);
  });

  it('qa_architect_complete has all required score fields', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runQAArchitectStep } = await import('../../src/agents/pipeline/qaArchitectStep.js');
    await runQAArchitectStep('test', 'qa-build-3', res, makeProductOutput() as any, makeBackendOutput('Finance') as any, {} as any);
    const done = events.find((e: any) => e.type === 'qa_architect_complete');
    expect(done).toBeDefined();
    expect((done as any).overallScore).toBeGreaterThan(0);
    expect((done as any).testingScore).toBeGreaterThanOrEqual(0);
    expect((done as any).coverageScore).toBeGreaterThanOrEqual(0);
    expect((done as any).reliabilityScore).toBeGreaterThanOrEqual(0);
    expect((done as any).securityScore).toBeGreaterThanOrEqual(0);
    expect((done as any).processingTimeMs).toBeGreaterThanOrEqual(0);
  });
});

// ── Cross-Planner Coherence ───────────────────────────────────────────────────

describe('Cross-Planner Coherence', () => {
  it('all backend types produce coherent blueprints', () => {
    for (const t of ALL_BACKEND_TYPES) {
      const out = runQAArchitect('test', makeProductOutput() as any, makeBackendOutput(t) as any);
      expect(out.blueprint.strategy.strategy).toBeDefined();
      expect(out.blueprint.qualityScores.length).toBe(10);
      expect(out.overallScore).toBeGreaterThan(0);
    }
  });

  it('Finance → e2e-first strategy, high reliability', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    expect(out.blueprint.strategy.strategy).toBe('e2e-first');
    expect(out.blueprint.reliability.predictedAvailabilityPercent).toBe(99.99);
  });

  it('AIPlatform → prompt injection tests active', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('AIPlatform') as any);
    expect(out.blueprint.securityTests.hasPromptInjectionTests).toBe(true);
    expect(out.blueprint.chaosTests.scenarios).toContain('AITimeout');
  });

  it('ECommerce → checkout E2E journey + gesture tests', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('ECommerce') as any);
    expect(out.blueprint.e2eTests.journeys).toContain('Checkout');
    expect(out.blueprint.mobileTests.hasGestureTests).toBe(true);
  });

  it('Enterprise → high coverage targets and WCAG-AAA', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Enterprise') as any);
    expect(out.blueprint.coverage.unitPercent).toBeGreaterThanOrEqual(85);
    expect(out.blueprint.accessibilityTests.standard).toBe('WCAG2.1-AAA');
  });

  it('Finance has more high-risk items than LandingAPI', () => {
    const fin = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    const lnd = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('LandingAPI') as any);
    // Finance adds Payment as an extra High-risk item
    expect(fin.blueprint.risk.highRiskCount).toBeGreaterThan(lnd.blueprint.risk.highRiskCount);
  });

  it('all browser types covered for any backend', () => {
    for (const t of ['SaaSBackend','Finance','LandingAPI'] as BackendType[]) {
      const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput(t) as any);
      expect(out.blueprint.browserCompatibility.browsers.length).toBe(7);
    }
  });
});

// ── Telemetry Shape ───────────────────────────────────────────────────────────

describe('Telemetry — getQAMetrics shape', () => {
  beforeEach(() => { resetQAMetrics(); });

  it('scoreByDimension populated after builds', () => {
    runQAArchitect('', makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const m = getQAMetrics();
    expect(m.totalBuilds).toBeGreaterThan(0);
    expect(m.scoreByDimension).toHaveProperty('testing');
    expect(m.scoreByDimension).toHaveProperty('security');
    expect(m.scoreByDimension).toHaveProperty('coverage');
    expect(m.scoreByDimension).toHaveProperty('reliability');
  });

  it('averageScore is between 0 and 10 after build', () => {
    runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    const m = getQAMetrics();
    expect(m.averageScore).toBeGreaterThanOrEqual(0);
    expect(m.averageScore).toBeLessThanOrEqual(10);
  });
});

// ── Persistence Rollback ──────────────────────────────────────────────────────

describe('Persistence — rollback', () => {
  beforeEach(() => { resetQAPersistence(); });

  it('rollback to v1 returns saved blueprint', () => {
    const bp = makeBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    const v = getCurrentQAVersion();
    const rolled = rollbackQAToVersion(v);
    expect(rolled).not.toBeNull();
  });

  it('multi-version rollback retrieves correct version', () => {
    const bp1 = makeBlueprint('SaaSBackend') as any;
    const bp2 = makeBlueprint('Enterprise') as any;
    saveQABlueprint(bp1); flushQAPersistence(); const v1 = getCurrentQAVersion();
    saveQABlueprint(bp2); flushQAPersistence(); const v2 = getCurrentQAVersion();
    expect(v1).toBeLessThan(v2);
    const snap1 = getQASnapshotAtVersion(v1);
    expect(snap1?.blueprint.strategy.strategy).toBe(bp1.strategy.strategy);
  });

  it('persistenceStats shows capacity and version', () => {
    const bp = makeBlueprint('Finance') as any;
    saveQABlueprint(bp); flushQAPersistence();
    const stats = getQAPersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThan(0);
  });
});

// ── Facade Re-Exports ────────────────────────────────────────────────────────

describe('Facade barrel', () => {
  it('re-exports ALL_QA_DIMENSIONS', () => {
    expect(facadeDims).toHaveLength(10);
  });
  it('re-exports runQAArchitect', () => {
    expect(typeof runQAArchitect).toBe('function');
  });
  it('re-exports validateQABlueprint', () => {
    expect(typeof validateQABlueprint).toBe('function');
  });
  it('re-exports getQAMetrics', () => {
    expect(typeof getQAMetrics).toBe('function');
  });
  it('re-exports getQALearningStats', () => {
    expect(typeof getQALearningStats).toBe('function');
  });
  it('re-exports rollbackQAToVersion', () => {
    expect(typeof rollbackQAToVersion).toBe('function');
  });
  it('re-exports saveQABlueprint', () => {
    expect(typeof saveQABlueprint).toBe('function');
  });
});
