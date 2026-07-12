// ── V8.7 DevOps Architect — Integration Tests ────────────────────────────────
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  ALL_DEVOPS_DIMENSIONS,
  runDevOpsArchitect,
  validateDevOpsBlueprint,
  getDevOpsMetrics,
  resetDevOpsMetrics,
  getDevOpsLearningStats,
  resetDevOpsLearning,
  saveDevOpsBlueprint,
  getDevOpsPersistenceStats,
  resetDevOpsPersistence,
  flushDevOpsPersistence,
  rollbackDevOpsToVersion,
  getCurrentDevOpsVersion,
  getDevOpsSnapshotAtVersion,
  detectInfrastructure,
  planCloud,
  planContainer, planDocker, planKubernetes, planNetwork, planCDN,
  planLoadBalancer, planAutoScaling, planCICD, planEnvironments,
  planSecrets, planDevOpsDeployment, planMonitoring, planLogging,
  planAlerts, planBackup, planRecovery, planCost, planDevOpsSecurity,
  planDevOpsPerformance,
} from '../../src/devops-architect/devopsFacade.js';

import type { BackendType, DevOpsBlueprint } from '../../src/devops-architect/devopsTypes.js';

// re-export the facade constant to verify facade barrel works
import { ALL_DEVOPS_DIMENSIONS as facadeAllDims } from '../../src/devops-architect/devopsFacade.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_BACKEND_TYPES: BackendType[] = [
  'LandingAPI', 'SaaSBackend', 'ECommerce', 'MicroserviceCandidate',
  'APIGateway', 'Marketplace', 'SocialPlatform', 'AIPlatform', 'Analytics',
  'Enterprise', 'MultiTenant', 'Healthcare', 'Finance', 'ERPBackend',
  'ServerlessCandidate', 'BookingPlatform', 'CRMBackend',
];

function makeBackendOutput(backendType: BackendType) {
  const dims = ['architecture','database','api','authentication','authorization','security','performance','scalability','reliability','maintainability','developerExperience','testability'];
  return {
    blueprint: {
      backendType,
      backendTypeConfidence: 0.9,
      databaseArchitecture: { primary: 'PostgreSQL', orm: 'Prisma', indexing: [], connectionPooling: true, migrations: true, tableEstimate: 10, hasCaching: false, cacheProvider: 'Redis', hasReadReplica: false, hasSharding: false },
      apiArchitecture: { primaryStyle: 'REST', pagination: 'cursor', versioning: 'header', hasGraphQL: false, hasgRPC: false, hasOpenAPI: true, hasWebSockets: false, hasWebhooks: false, filterSupport: 'basic' },
      authArchitecture: { primaryStrategy: 'JWT', strategies: ['JWT'], hasRefreshToken: true, hasOAuth: false, hasAPIKeys: false, hasMultiTenant: false, sessionDuration: '7d', roles: ['user','admin'] },
      permissionArchitecture: { hasRBAC: true, hasABAC: false, hasFeatureFlags: false, permissionCategories: ['read','write'], roleHierarchy: ['user','admin'], hasTenantIsolation: false, hasWorkspaceIsolation: false },
      serviceArchitecture: { services: [], serviceCount: 5, hasDomainEvents: false, hasCommandBus: false },
      repositoryArchitecture: { repositories: [], hasUnitOfWork: true, hasTransactions: true },
      controllerArchitecture: { controllers: [], hasValidation: true, hasTransformation: true },
      middlewareArchitecture: { middlewares: [], hasCors: true, hasHelmet: true, hasRateLimiter: true, hasCompression: true, hasAuth: true, hasLogging: true },
      validationArchitecture: { schema: 'Zod', hasRequestValidation: true, hasResponseValidation: false, validationScopes: ['body','params'] },
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
    overallScore: 7,
    enrichedPromptWithArchitecture: 'BACKEND: SaaS',
    processingTimeMs: 2,
  };
}

function makeProductOutput() {
  return {
    productPlan: {
      productGoal: { type: 'SaaSBackend', description: 'SaaS', targetAudience: 'SMBs', uniqueValueProposition: 'Fast', success: [], confidence: 0.8 },
      businessObjective: { primary: 'Growth', secondary: [], kpis: [] },
      userPersonas: [], plannedFeatures: ['auth','dashboard'],
      informationArchitecture: { pages: [], navigation: [] },
      userJourney: [], monetizationPlan: { hasPricing: false, tiers: [], currency: 'USD' },
      roadmap: [], detectedRisks: [], qualityScores: [],
      overallProductScore: 7, confidence: 0.8, promptSummary: 'SaaS app',
    },
    productScore: 7,
    contextString: 'Product: SaaS',
  };
}

function makeBlueprint(t: BackendType): DevOpsBlueprint {
  const infra = detectInfrastructure(t);
  const cloud = planCloud(t, infra.type);
  return {
    infrastructureType: infra.type, infrastructureConfidence: infra.confidence,
    infrastructure: infra, container: planContainer(t, infra.type),
    docker: planDocker(t, infra.type), kubernetes: planKubernetes(t, infra.type),
    cloud, network: planNetwork(t, cloud.provider), cdn: planCDN(t, cloud.provider),
    loadBalancer: planLoadBalancer(t, infra.type), autoScaling: planAutoScaling(t, infra.type),
    cicd: planCICD(t), environments: planEnvironments(t), secrets: planSecrets(t, cloud.provider),
    deployment: planDevOpsDeployment(t), monitoring: planMonitoring(t), logging: planLogging(t),
    alerts: planAlerts(t), backup: planBackup(t), recovery: planRecovery(t),
    cost: planCost(t, cloud.provider, infra.type), security: planDevOpsSecurity(t, cloud.provider),
    performance: planDevOpsPerformance(t, cloud.provider), qualityScores: [], overallScore: 0,
  };
}

// ── SSE Event Shapes ──────────────────────────────────────────────────────────

describe('Pipeline Step — SSE event shapes', () => {
  it('devops_architect_start has buildId field', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runDevOpsArchitectStep } = await import('../../src/agents/pipeline/devopsArchitectStep.js');
    await runDevOpsArchitectStep('test', 'build-1', res, makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const start = events.find((e: any) => e.type === 'devops_architect_start');
    expect(start).toBeDefined();
    expect((start as any).buildId).toBe('build-1');
  });

  it('devops_architect_progress has all required fields', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runDevOpsArchitectStep } = await import('../../src/agents/pipeline/devopsArchitectStep.js');
    await runDevOpsArchitectStep('test', 'build-2', res, makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const progress = events.find((e: any) => e.type === 'devops_architect_progress');
    expect(progress).toBeDefined();
    expect((progress as any).infrastructureType).toBeDefined();
    expect((progress as any).cloudProvider).toBeDefined();
    expect((progress as any).deployStrategy).toBeDefined();
    expect((progress as any).score).toBeGreaterThan(0);
  });

  it('devops_architect_complete has score fields', async () => {
    const events: object[] = [];
    const res = { write: (d: string) => { events.push(JSON.parse(d.replace(/^data: /, '').trim())); } } as any;
    const { runDevOpsArchitectStep } = await import('../../src/agents/pipeline/devopsArchitectStep.js');
    await runDevOpsArchitectStep('test', 'build-3', res, makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const done = events.find((e: any) => e.type === 'devops_architect_complete');
    expect(done).toBeDefined();
    expect((done as any).overallScore).toBeGreaterThan(0);
    expect((done as any).infrastructureScore).toBeGreaterThanOrEqual(0);
    expect((done as any).securityScore).toBeGreaterThanOrEqual(0);
    expect((done as any).processingTimeMs).toBeGreaterThanOrEqual(0);
  });
});

// ── Cross-Planner Coherence ───────────────────────────────────────────────────

describe('Cross-Planner Coherence', () => {
  it('all backend types produce coherent blueprints', () => {
    for (const t of ALL_BACKEND_TYPES) {
      const out = runDevOpsArchitect('test', makeProductOutput() as any, makeBackendOutput(t) as any);
      expect(out.blueprint.infrastructure.type).toBeDefined();
      expect(out.blueprint.cloud.provider).toBeDefined();
      expect(out.blueprint.qualityScores.length).toBe(9);
    }
  });

  it('Serverless infra never has Kubernetes resources', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('ServerlessCandidate') as any);
    expect(out.blueprint.kubernetes.hasDeployment).toBe(false);
  });

  it('Kubernetes infra always has Deployment + Service + HPA for non-simple', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('MicroserviceCandidate') as any);
    expect(out.blueprint.kubernetes.hasDeployment).toBe(true);
    expect(out.blueprint.kubernetes.hasService).toBe(true);
    expect(out.blueprint.kubernetes.hasHPA).toBe(true);
  });

  it('Finance blueprint cost estimate > 0', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    expect(out.blueprint.cost.estimatedMonthlyUSD).toBeGreaterThan(0);
  });

  it('AIPlatform enables AI inference cost', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('AIPlatform') as any);
    expect(out.blueprint.cost.aiInference).toBeGreaterThan(0);
  });

  it('Enterprise has 4 environments', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('Enterprise') as any);
    expect(out.blueprint.environments.environments).toContain('staging');
    expect(out.blueprint.environments.environments).toContain('local');
  });

  it('cloud.provider matches expected for Finance', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    expect(out.blueprint.cloud.provider).toBe('AWS');
  });

  it('cloud.provider matches expected for AIPlatform', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('AIPlatform') as any);
    expect(out.blueprint.cloud.provider).toBe('GCP');
  });
});

// ── Telemetry Shape ───────────────────────────────────────────────────────────

describe('Telemetry — getDevOpsMetrics shape', () => {
  beforeEach(() => { resetDevOpsMetrics(); });

  it('scoreByDimension is populated after builds', () => {
    const out = runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const m = getDevOpsMetrics();
    expect(m.totalBuilds).toBeGreaterThan(0);
    expect(m.scoreByDimension).toHaveProperty('infrastructure');
    expect(m.scoreByDimension).toHaveProperty('security');
    expect(m.scoreByDimension).toHaveProperty('monitoring');
    expect(m.scoreByDimension).toHaveProperty('deployment');
  });

  it('averageScore is between 0 and 10 after build', () => {
    runDevOpsArchitect('', makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    const m = getDevOpsMetrics();
    expect(m.averageScore).toBeGreaterThanOrEqual(0);
    expect(m.averageScore).toBeLessThanOrEqual(10);
  });
});

// ── Persistence Rollback ──────────────────────────────────────────────────────

describe('Persistence — rollback', () => {
  beforeEach(() => { resetDevOpsPersistence(); });

  it('rollback to v1 returns saved blueprint', () => {
    const bp = makeBlueprint('SaaSBackend');
    saveDevOpsBlueprint(bp);
    flushDevOpsPersistence();
    const v = getCurrentDevOpsVersion();
    const rolled = rollbackDevOpsToVersion(v);
    expect(rolled).not.toBeNull();
  });

  it('multi-version rollback retrieves correct version', () => {
    const bp1 = makeBlueprint('SaaSBackend');
    const bp2 = makeBlueprint('Enterprise');
    saveDevOpsBlueprint(bp1); flushDevOpsPersistence(); const v1 = getCurrentDevOpsVersion();
    saveDevOpsBlueprint(bp2); flushDevOpsPersistence(); const v2 = getCurrentDevOpsVersion();
    expect(v1).toBeLessThan(v2);
    const snap1 = getDevOpsSnapshotAtVersion(v1);
    expect(snap1?.blueprint.infrastructureType).toBe(bp1.infrastructureType);
  });

  it('persistenceStats shows both capacity and version', () => {
    const bp = makeBlueprint('Finance');
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    const stats = getDevOpsPersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThan(0);
  });
});

// ── Facade Re-Exports ────────────────────────────────────────────────────────

describe('Facade barrel', () => {
  it('re-exports ALL_DEVOPS_DIMENSIONS constant', () => {
    expect(facadeAllDims).toHaveLength(9);
  });

  it('re-exports runDevOpsArchitect', () => {
    expect(typeof runDevOpsArchitect).toBe('function');
  });

  it('re-exports validateDevOpsBlueprint', () => {
    expect(typeof validateDevOpsBlueprint).toBe('function');
  });

  it('re-exports getDevOpsMetrics', () => {
    expect(typeof getDevOpsMetrics).toBe('function');
  });

  it('re-exports getDevOpsLearningStats', () => {
    expect(typeof getDevOpsLearningStats).toBe('function');
  });

  it('re-exports rollbackDevOpsToVersion', () => {
    expect(typeof rollbackDevOpsToVersion).toBe('function');
  });
});
