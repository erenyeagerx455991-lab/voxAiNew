// ── V8.7 DevOps Architect — Unit Tests ───────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ALL_DEVOPS_DIMENSIONS,
  detectInfrastructure,
  planCloud,
  planContainer,
  planDocker,
  planKubernetes,
  planNetwork,
  planCDN,
  planLoadBalancer,
  planAutoScaling,
  planCICD,
  planEnvironments,
  planSecrets,
  planDevOpsDeployment,
  planMonitoring,
  planLogging,
  planAlerts,
  planBackup,
  planRecovery,
  planCost,
  planDevOpsSecurity,
  planDevOpsPerformance,
  validateDevOpsBlueprint,
  recordDevOpsBuild,
  getDevOpsMetrics,
  resetDevOpsMetrics,
  learnFromDevOpsBuild,
  getDevOpsLearningStats,
  resetDevOpsLearning,
  saveDevOpsBlueprint,
  flushDevOpsPersistence,
  getDevOpsSnapshots,
  getRecentDevOpsSnapshots,
  getDevOpsSnapshotAtVersion,
  rollbackDevOpsToVersion,
  getCurrentDevOpsVersion,
  getDevOpsPersistenceStats,
  resetDevOpsPersistence,
  runDevOpsArchitect,
} from '../../src/devops-architect/devopsFacade.js';

import type {
  BackendType, DevOpsBlueprint, DevOpsDimension, InfrastructureType,
} from '../../src/devops-architect/devopsTypes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

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
      productGoal: { type: 'SaaSBackend', description: 'SaaS app', targetAudience: 'SMBs', uniqueValueProposition: 'Fast', success: ['ARR'], confidence: 0.8 },
      businessObjective: { primary: 'Growth', secondary: [], kpis: ['MRR'] },
      userPersonas: [],
      plannedFeatures: ['auth','dashboard'],
      informationArchitecture: { pages: [], navigation: [] },
      userJourney: [],
      monetizationPlan: { hasPricing: false, tiers: [], currency: 'USD' },
      roadmap: [],
      detectedRisks: [],
      qualityScores: [],
      overallProductScore: 7,
      confidence: 0.8,
      promptSummary: 'Build a SaaS app',
    },
    productScore: 7,
    contextString: 'Product: SaaS app',
  };
}

// ── Phase 1: Infrastructure Detection ─────────────────────────────────────────

describe('Phase 1: Infrastructure Detection', () => {
  it('returns InfrastructureBlueprint with required fields', () => {
    const result = detectInfrastructure('SaaSBackend');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('hasContainers');
    expect(result).toHaveProperty('hasOrchestration');
    expect(result).toHaveProperty('regions');
    expect(result).toHaveProperty('replicaCount');
  });

  it('ServerlessCandidate → Serverless with high confidence', () => {
    const r = detectInfrastructure('ServerlessCandidate');
    expect(r.type).toBe('Serverless');
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('MicroserviceCandidate → Kubernetes with high confidence', () => {
    const r = detectInfrastructure('MicroserviceCandidate');
    expect(r.type).toBe('Kubernetes');
    expect(r.confidence).toBeGreaterThanOrEqual(0.88);
  });

  it('LandingAPI → Docker (simple)', () => {
    const r = detectInfrastructure('LandingAPI');
    expect(r.type).toBe('Docker');
  });

  it('Enterprise → Kubernetes with orchestration', () => {
    const r = detectInfrastructure('Enterprise');
    expect(r.type).toBe('Kubernetes');
    expect(r.hasOrchestration).toBe(true);
  });

  it('Kubernetes infra has no containers for Serverless', () => {
    const r = detectInfrastructure('ServerlessCandidate');
    expect(r.hasContainers).toBe(false);
  });

  it('confidence is between 0 and 1', () => {
    for (const t of ['SaaSBackend','Enterprise','LandingAPI','AIPlatform'] as BackendType[]) {
      const r = detectInfrastructure(t);
      expect(r.confidence).toBeGreaterThan(0);
      expect(r.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('Enterprise infra has multi-region CDN', () => {
    const r = detectInfrastructure('Finance');
    expect(r.regions.length).toBeGreaterThan(0);
  });

  it('replica count >= 1 for all types', () => {
    const types: BackendType[] = ['SaaSBackend','LandingAPI','Enterprise','AIPlatform','Marketplace'];
    for (const t of types) {
      expect(detectInfrastructure(t).replicaCount).toBeGreaterThanOrEqual(1);
    }
  });

  it('high-traffic types get load balancer', () => {
    const r = detectInfrastructure('Marketplace');
    expect(r.hasLoadBalancer).toBe(true);
  });
});

// ── Phase 2: Cloud Planner ─────────────────────────────────────────────────────

describe('Phase 2: Cloud Planner', () => {
  it('returns CloudBlueprint with all required fields', () => {
    const r = planCloud('SaaSBackend', 'DockerCompose');
    expect(r).toHaveProperty('provider');
    expect(r).toHaveProperty('region');
    expect(r).toHaveProperty('rationale');
    expect(r).toHaveProperty('hasMultiRegion');
  });

  it('Serverless → Vercel', () => {
    const r = planCloud('LandingAPI', 'Serverless');
    expect(r.provider).toBe('Vercel');
  });

  it('Edge → Cloudflare', () => {
    const r = planCloud('LandingAPI', 'Edge');
    expect(r.provider).toBe('Cloudflare');
  });

  it('Finance → AWS', () => {
    const r = planCloud('Finance', 'Kubernetes');
    expect(r.provider).toBe('AWS');
  });

  it('AIPlatform → GCP', () => {
    const r = planCloud('AIPlatform', 'Kubernetes');
    expect(r.provider).toBe('GCP');
  });

  it('Enterprise → Azure for ERP backend', () => {
    const r = planCloud('ERPBackend', 'Kubernetes');
    expect(r.provider).toBe('Azure');
  });

  it('rationale is non-empty string', () => {
    const r = planCloud('SaaSBackend', 'Kubernetes');
    expect(r.rationale).toBeTypeOf('string');
    expect(r.rationale.length).toBeGreaterThan(5);
  });

  it('enterprise has managed services', () => {
    const r = planCloud('Enterprise', 'Kubernetes');
    expect(r.hasManagedDatabase).toBe(true);
    expect(r.hasObjectStorage).toBe(true);
  });

  it('always has object storage', () => {
    for (const t of ['SaaSBackend','LandingAPI'] as BackendType[]) {
      expect(planCloud(t, 'Docker').hasObjectStorage).toBe(true);
    }
  });
});

// ── Phase 3: Container Planner ─────────────────────────────────────────────────

describe('Phase 3: Container Planner', () => {
  it('returns ContainerBlueprint with all required fields', () => {
    const r = planContainer('SaaSBackend', 'DockerCompose');
    expect(r).toHaveProperty('hasDockerfile');
    expect(r).toHaveProperty('hasMultiStage');
    expect(r).toHaveProperty('hasDistroless');
    expect(r).toHaveProperty('hasHealthCheck');
    expect(r).toHaveProperty('hasImageOptimization');
  });

  it('Finance uses distroless image', () => {
    const r = planContainer('Finance', 'Kubernetes');
    expect(r.hasDistroless).toBe(true);
  });

  it('Healthcare uses distroless image', () => {
    const r = planContainer('Healthcare', 'Kubernetes');
    expect(r.hasDistroless).toBe(true);
  });

  it('Serverless has no Dockerfile', () => {
    const r = planContainer('LandingAPI', 'Serverless');
    expect(r.hasDockerfile).toBe(false);
  });

  it('non-Serverless gets Dockerfile', () => {
    const r = planContainer('SaaSBackend', 'Docker');
    expect(r.hasDockerfile).toBe(true);
  });

  it('health check always enabled', () => {
    const r = planContainer('SaaSBackend', 'Kubernetes');
    expect(r.hasHealthCheck).toBe(true);
  });

  it('Kubernetes uses multi-stage build', () => {
    const r = planContainer('SaaSBackend', 'Kubernetes');
    expect(r.hasMultiStage).toBe(true);
  });
});

// ── Phase 4: Kubernetes Planner ────────────────────────────────────────────────

describe('Phase 4: Kubernetes Planner', () => {
  it('returns KubernetesBlueprint with required fields', () => {
    const r = planKubernetes('SaaSBackend', 'Kubernetes');
    expect(r).toHaveProperty('hasDeployment');
    expect(r).toHaveProperty('hasIngress');
    expect(r).toHaveProperty('hasHPA');
    expect(r).toHaveProperty('namespace');
    expect(r).toHaveProperty('resources');
  });

  it('Kubernetes infra enables all resources', () => {
    const r = planKubernetes('SaaSBackend', 'Kubernetes');
    expect(r.hasDeployment).toBe(true);
    expect(r.hasService).toBe(true);
    expect(r.hasIngress).toBe(true);
    expect(r.hasConfigMap).toBe(true);
    expect(r.hasSecret).toBe(true);
  });

  it('non-Kubernetes infra disables K8s resources', () => {
    const r = planKubernetes('SaaSBackend', 'Docker');
    expect(r.hasDeployment).toBe(false);
    expect(r.hasHPA).toBe(false);
  });

  it('Enterprise gets PodDisruptionBudget', () => {
    const r = planKubernetes('Enterprise', 'Kubernetes');
    expect(r.hasPodDisruptionBudget).toBe(true);
  });

  it('resources.requests and limits are non-empty strings', () => {
    const r = planKubernetes('SaaSBackend', 'Kubernetes');
    expect(r.resources.requests.cpu).toBeTypeOf('string');
    expect(r.resources.limits.memory).toBeTypeOf('string');
  });

  it('Enterprise replica count is 3', () => {
    const r = planKubernetes('Enterprise', 'Kubernetes');
    expect(r.replicaCount).toBe(3);
  });
});

// ── Phase 5: CI/CD Planner ─────────────────────────────────────────────────────

describe('Phase 5: CI/CD Planner', () => {
  it('returns CICDBlueprint with all required fields', () => {
    const r = planCICD('SaaSBackend');
    expect(r).toHaveProperty('provider');
    expect(r).toHaveProperty('stages');
    expect(r).toHaveProperty('hasLint');
    expect(r).toHaveProperty('hasTests');
    expect(r).toHaveProperty('hasBuild');
    expect(r).toHaveProperty('hasSecurityScan');
    expect(r).toHaveProperty('hasDeploy');
    expect(r).toHaveProperty('hasRollback');
  });

  it('always has lint, test, build, deploy', () => {
    const r = planCICD('SaaSBackend');
    expect(r.hasLint).toBe(true);
    expect(r.hasTests).toBe(true);
    expect(r.hasBuild).toBe(true);
    expect(r.hasDeploy).toBe(true);
  });

  it('Enterprise/ERPBackend → Jenkins', () => {
    const r = planCICD('ERPBackend');
    expect(r.provider).toBe('Jenkins');
  });

  it('SaaSBackend → GitHub Actions', () => {
    const r = planCICD('SaaSBackend');
    expect(r.provider).toBe('GitHubActions');
  });

  it('Finance → BlueGreen deploy strategy', () => {
    const r = planCICD('Finance');
    expect(r.deployStrategy).toBe('BlueGreen');
  });

  it('Marketplace → Canary deploy strategy', () => {
    const r = planCICD('Marketplace');
    expect(r.deployStrategy).toBe('Canary');
  });

  it('stages array is non-empty', () => {
    const r = planCICD('SaaSBackend');
    expect(r.stages.length).toBeGreaterThan(2);
  });
});

// ── Phase 6: Environment Planner ──────────────────────────────────────────────

describe('Phase 6: Environment Planner', () => {
  it('returns EnvironmentBlueprint with all fields', () => {
    const r = planEnvironments('SaaSBackend');
    expect(r).toHaveProperty('environments');
    expect(r).toHaveProperty('hasFeatureFlags');
    expect(r).toHaveProperty('hasSecretManagement');
    expect(r).toHaveProperty('variables');
    expect(r).toHaveProperty('secretCount');
  });

  it('Enterprise has all 4 environments', () => {
    const r = planEnvironments('Enterprise');
    expect(r.environments).toContain('local');
    expect(r.environments).toContain('development');
    expect(r.environments).toContain('staging');
    expect(r.environments).toContain('production');
  });

  it('SaaSBackend has feature flags', () => {
    const r = planEnvironments('SaaSBackend');
    expect(r.hasFeatureFlags).toBe(true);
  });

  it('Enterprise has secret management', () => {
    const r = planEnvironments('Enterprise');
    expect(r.hasSecretManagement).toBe(true);
  });

  it('variables array is non-empty', () => {
    const r = planEnvironments('SaaSBackend');
    expect(r.variables.length).toBeGreaterThan(0);
  });
});

// ── Phase 7: Networking ────────────────────────────────────────────────────────

describe('Phase 7: Networking', () => {
  it('always has HTTPS and TLS 1.3', () => {
    const r = planNetwork('SaaSBackend', 'AWS');
    expect(r.hasHTTPS).toBe(true);
    expect(r.hasTLS).toBe(true);
    expect(r.tlsVersion).toBe('1.3');
  });

  it('Finance gets WAF', () => {
    const r = planNetwork('Finance', 'AWS');
    expect(r.hasWAF).toBe(true);
  });

  it('Cloudflare gets DDoS protection', () => {
    const r = planNetwork('SaaSBackend', 'Cloudflare');
    expect(r.hasDDoSProtection).toBe(true);
  });

  it('Vercel has no reverse proxy (passes through)', () => {
    const r = planNetwork('LandingAPI', 'Vercel');
    expect(r.reverseProxyType).toBe('None');
  });
});

// ── Phase 8: Load Balancing ────────────────────────────────────────────────────

describe('Phase 8: Load Balancing', () => {
  it('returns LoadBalancerBlueprint with required fields', () => {
    const r = planLoadBalancer('SaaSBackend', 'DockerCompose');
    expect(r).toHaveProperty('strategy');
    expect(r).toHaveProperty('hasHealthChecks');
    expect(r).toHaveProperty('healthCheckPath');
  });

  it('health check path is /health', () => {
    const r = planLoadBalancer('SaaSBackend', 'DockerCompose');
    expect(r.healthCheckPath).toBe('/health');
  });

  it('always has health checks', () => {
    const r = planLoadBalancer('LandingAPI', 'Docker');
    expect(r.hasHealthChecks).toBe(true);
  });

  it('always has SSL termination', () => {
    const r = planLoadBalancer('SaaSBackend', 'Kubernetes');
    expect(r.hasSSLTermination).toBe(true);
  });

  it('StickySessions for booking/CRM backends', () => {
    const r = planLoadBalancer('BookingPlatform' as BackendType, 'Kubernetes');
    expect(r.hasStickySession).toBe(true);
  });
});

// ── Phase 9: Auto Scaling ─────────────────────────────────────────────────────

describe('Phase 9: Auto Scaling', () => {
  it('returns AutoScalingBlueprint with required fields', () => {
    const r = planAutoScaling('SaaSBackend', 'Kubernetes');
    expect(r).toHaveProperty('types');
    expect(r).toHaveProperty('minReplicas');
    expect(r).toHaveProperty('maxReplicas');
    expect(r).toHaveProperty('targetCPUPercent');
    expect(r).toHaveProperty('cooldownSeconds');
  });

  it('minReplicas <= maxReplicas', () => {
    for (const t of ['SaaSBackend','Enterprise','LandingAPI'] as BackendType[]) {
      const r = planAutoScaling(t, 'Kubernetes');
      expect(r.minReplicas).toBeLessThanOrEqual(r.maxReplicas);
    }
  });

  it('AIPlatform gets AI worker scaling', () => {
    const r = planAutoScaling('AIPlatform', 'Kubernetes');
    expect(r.hasAIWorkerScaling).toBe(true);
    expect(r.types).toContain('AIWorker');
  });

  it('high-traffic gets queue scaling', () => {
    const r = planAutoScaling('Marketplace', 'Kubernetes');
    expect(r.hasQueueScaling).toBe(true);
  });

  it('cpu percent is between 50 and 90', () => {
    const r = planAutoScaling('SaaSBackend', 'Kubernetes');
    expect(r.targetCPUPercent).toBeGreaterThan(50);
    expect(r.targetCPUPercent).toBeLessThanOrEqual(90);
  });
});

// ── Phase 10: Monitoring ──────────────────────────────────────────────────────

describe('Phase 10: Monitoring', () => {
  it('returns MonitoringBlueprint with all required fields', () => {
    const r = planMonitoring('SaaSBackend');
    expect(r).toHaveProperty('hasPrometheus');
    expect(r).toHaveProperty('hasGrafana');
    expect(r).toHaveProperty('hasOpenTelemetry');
    expect(r).toHaveProperty('hasMetrics');
    expect(r).toHaveProperty('hasTracing');
    expect(r).toHaveProperty('hasLogs');
    expect(r).toHaveProperty('dashboards');
  });

  it('always has metrics and logs', () => {
    for (const t of ['SaaSBackend','LandingAPI','Enterprise'] as BackendType[]) {
      const r = planMonitoring(t);
      expect(r.hasMetrics).toBe(true);
      expect(r.hasLogs).toBe(true);
    }
  });

  it('Enterprise gets Prometheus and Grafana', () => {
    const r = planMonitoring('Enterprise');
    expect(r.hasPrometheus).toBe(true);
    expect(r.hasGrafana).toBe(true);
  });

  it('Enterprise gets OpenTelemetry', () => {
    const r = planMonitoring('Enterprise');
    expect(r.hasOpenTelemetry).toBe(true);
  });

  it('dashboards array is non-empty', () => {
    const r = planMonitoring('SaaSBackend');
    expect(r.dashboards.length).toBeGreaterThan(0);
  });

  it('tracingSampleRate is between 0 and 1', () => {
    const r = planMonitoring('SaaSBackend');
    expect(r.tracingSampleRate).toBeGreaterThan(0);
    expect(r.tracingSampleRate).toBeLessThanOrEqual(1);
  });
});

// ── Phase 11: Logging ─────────────────────────────────────────────────────────

describe('Phase 11: Logging', () => {
  it('returns LoggingBlueprint with required fields', () => {
    const r = planLogging('SaaSBackend');
    expect(r).toHaveProperty('format');
    expect(r).toHaveProperty('hasJSONLogs');
    expect(r).toHaveProperty('hasRequestLogs');
    expect(r).toHaveProperty('hasErrorLogs');
    expect(r).toHaveProperty('retentionDays');
    expect(r).toHaveProperty('aggregator');
  });

  it('always uses JSON format', () => {
    for (const t of ['SaaSBackend','LandingAPI','Enterprise'] as BackendType[]) {
      expect(planLogging(t).format).toBe('JSON');
    }
  });

  it('always has JSON and error logs', () => {
    const r = planLogging('SaaSBackend');
    expect(r.hasJSONLogs).toBe(true);
    expect(r.hasErrorLogs).toBe(true);
  });

  it('Finance has audit logs', () => {
    const r = planLogging('Finance');
    expect(r.hasAuditLogs).toBe(true);
  });

  it('AIPlatform has AI logs', () => {
    const r = planLogging('AIPlatform');
    expect(r.hasAILogs).toBe(true);
  });

  it('retentionDays > 0', () => {
    const r = planLogging('SaaSBackend');
    expect(r.retentionDays).toBeGreaterThan(0);
  });
});

// ── Phase 12: Alerts ──────────────────────────────────────────────────────────

describe('Phase 12: Alerts', () => {
  it('returns AlertBlueprint with all spec-required alert types', () => {
    const r = planAlerts('SaaSBackend');
    expect(r.hasCPUAlert).toBe(true);
    expect(r.hasMemoryAlert).toBe(true);
    expect(r.hasLatencyAlert).toBe(true);
    expect(r.hasErrorRateAlert).toBe(true);
  });

  it('always has email channel', () => {
    const r = planAlerts('LandingAPI');
    expect(r.channels).toContain('email');
  });

  it('Enterprise gets Slack and PagerDuty', () => {
    const r = planAlerts('Enterprise');
    expect(r.channels).toContain('slack');
    expect(r.channels).toContain('pagerduty');
  });

  it('Enterprise gets on-call rotation', () => {
    const r = planAlerts('Enterprise');
    expect(r.oncallRotation).toBe(true);
  });

  it('alerts array is non-empty', () => {
    const r = planAlerts('SaaSBackend');
    expect(r.alerts.length).toBeGreaterThan(0);
  });

  it('high traffic gets queue backlog alert', () => {
    const r = planAlerts('Marketplace');
    expect(r.hasQueueBacklogAlert).toBe(true);
  });
});

// ── Phase 13: Backup ──────────────────────────────────────────────────────────

describe('Phase 13: Backup', () => {
  it('always has database backup', () => {
    for (const t of ['SaaSBackend','LandingAPI','Enterprise'] as BackendType[]) {
      expect(planBackup(t).hasDatabaseBackup).toBe(true);
    }
  });

  it('always has retention policy', () => {
    const r = planBackup('SaaSBackend');
    expect(r.hasRetentionPolicy).toBe(true);
  });

  it('Finance → Continuous backup', () => {
    const r = planBackup('Finance');
    expect(r.frequency).toBe('Continuous');
  });

  it('Finance → cross-region encrypted', () => {
    const r = planBackup('Finance');
    expect(r.crossRegion).toBe(true);
    expect(r.encryption).toBe(true);
  });

  it('retentionDays > 0', () => {
    const r = planBackup('SaaSBackend');
    expect(r.retentionDays).toBeGreaterThan(0);
  });
});

// ── Phase 14: Disaster Recovery ───────────────────────────────────────────────

describe('Phase 14: Disaster Recovery', () => {
  it('returns RecoveryBlueprint with all fields', () => {
    const r = planRecovery('SaaSBackend');
    expect(r).toHaveProperty('rtoMinutes');
    expect(r).toHaveProperty('rpoMinutes');
    expect(r).toHaveProperty('tier');
    expect(r).toHaveProperty('hasFailover');
    expect(r).toHaveProperty('hasMultiRegion');
    expect(r).toHaveProperty('hasRunbook');
  });

  it('RTO > 0 for all backend types', () => {
    for (const t of ['SaaSBackend','Finance','LandingAPI'] as BackendType[]) {
      expect(planRecovery(t).rtoMinutes).toBeGreaterThan(0);
    }
  });

  it('Finance → Hot tier with automated failover', () => {
    const r = planRecovery('Finance');
    expect(r.tier).toBe('Hot');
    expect(r.hasAutomatedFailover).toBe(true);
  });

  it('Hot tier → multi-region', () => {
    const r = planRecovery('Finance');
    expect(r.hasMultiRegion).toBe(true);
  });

  it('Enterprise has runbook', () => {
    const r = planRecovery('Enterprise');
    expect(r.hasRunbook).toBe(true);
  });
});

// ── Phase 15: Cost Planner ────────────────────────────────────────────────────

describe('Phase 15: Cost Planner', () => {
  it('returns CostBlueprint with all required fields', () => {
    const r = planCost('SaaSBackend', 'AWS', 'DockerCompose');
    expect(r).toHaveProperty('estimatedMonthlyUSD');
    expect(r).toHaveProperty('compute');
    expect(r).toHaveProperty('storage');
    expect(r).toHaveProperty('bandwidth');
    expect(r).toHaveProperty('aiInference');
    expect(r).toHaveProperty('cache');
    expect(r).toHaveProperty('monitoring');
    expect(r).toHaveProperty('optimizationSuggestions');
    expect(r).toHaveProperty('savingsOpportunities');
  });

  it('estimatedMonthlyUSD is positive', () => {
    const r = planCost('SaaSBackend', 'AWS', 'DockerCompose');
    expect(r.estimatedMonthlyUSD).toBeGreaterThan(0);
  });

  it('AIPlatform has AI inference cost', () => {
    const r = planCost('AIPlatform', 'GCP', 'Kubernetes');
    expect(r.aiInference).toBeGreaterThan(0);
  });

  it('optimization suggestions are non-empty', () => {
    const r = planCost('SaaSBackend', 'AWS', 'Kubernetes');
    expect(r.optimizationSuggestions.length).toBeGreaterThan(0);
  });

  it('Railway costs less than AWS for same workload', () => {
    const aws     = planCost('LandingAPI', 'AWS', 'Docker');
    const railway = planCost('LandingAPI', 'Railway', 'Docker');
    expect(railway.estimatedMonthlyUSD).toBeLessThan(aws.estimatedMonthlyUSD);
  });
});

// ── Phase 16: Security Planner ────────────────────────────────────────────────

describe('Phase 16: DevOps Security Planner', () => {
  it('returns DevOpsSecurityBlueprint with all fields', () => {
    const r = planDevOpsSecurity('SaaSBackend', 'AWS');
    expect(r).toHaveProperty('hasSecretRotation');
    expect(r).toHaveProperty('hasIAM');
    expect(r).toHaveProperty('hasKMS');
    expect(r).toHaveProperty('hasEncryption');
    expect(r).toHaveProperty('hasWAF');
    expect(r).toHaveProperty('hasDDoSProtection');
    expect(r).toHaveProperty('hasRateLimiting');
    expect(r).toHaveProperty('complianceLevel');
  });

  it('always has rate limiting', () => {
    const r = planDevOpsSecurity('LandingAPI', 'Railway');
    expect(r.hasRateLimiting).toBe(true);
  });

  it('Finance → Enterprise compliance', () => {
    const r = planDevOpsSecurity('Finance', 'AWS');
    expect(r.complianceLevel).toBe('Enterprise');
    expect(r.hasWAF).toBe(true);
    expect(r.hasKMS).toBe(true);
    expect(r.hasSecretRotation).toBe(true);
  });

  it('SaaSBackend → Standard compliance', () => {
    const r = planDevOpsSecurity('SaaSBackend', 'AWS');
    expect(r.complianceLevel).toBe('Standard');
  });

  it('SelfHosted has no IAM', () => {
    const r = planDevOpsSecurity('SaaSBackend', 'SelfHosted');
    expect(r.hasIAM).toBe(false);
  });
});

// ── Phase 17: Performance Planner ─────────────────────────────────────────────

describe('Phase 17: DevOps Performance Planner', () => {
  it('returns DevOpsPerformanceBlueprint with all fields', () => {
    const r = planDevOpsPerformance('SaaSBackend', 'AWS');
    expect(r).toHaveProperty('hasCDNCache');
    expect(r).toHaveProperty('hasRedis');
    expect(r).toHaveProperty('hasCompression');
    expect(r).toHaveProperty('hasHTTP2');
    expect(r).toHaveProperty('hasHTTP3');
    expect(r).toHaveProperty('targetP99LatencyMs');
  });

  it('always has HTTP2 and compression', () => {
    for (const t of ['SaaSBackend','LandingAPI','Enterprise'] as BackendType[]) {
      const r = planDevOpsPerformance(t, 'AWS');
      expect(r.hasHTTP2).toBe(true);
      expect(r.hasCompression).toBe(true);
    }
  });

  it('Cloudflare enables HTTP3', () => {
    const r = planDevOpsPerformance('SaaSBackend', 'Cloudflare');
    expect(r.hasHTTP3).toBe(true);
  });

  it('high-traffic targets tighter P99 latency', () => {
    const simple    = planDevOpsPerformance('LandingAPI', 'AWS');
    const highTraffic = planDevOpsPerformance('Marketplace', 'AWS');
    expect(highTraffic.targetP99LatencyMs).toBeLessThanOrEqual(simple.targetP99LatencyMs);
  });

  it('P99 latency > 0', () => {
    const r = planDevOpsPerformance('SaaSBackend', 'AWS');
    expect(r.targetP99LatencyMs).toBeGreaterThan(0);
  });
});

// ── Phase 18: DevOps Validator ────────────────────────────────────────────────

describe('Phase 18: DevOps Validator', () => {
  function makeBlueprint(t: BackendType = 'SaaSBackend'): DevOpsBlueprint {
    const infra      = detectInfrastructure(t);
    const cloud      = planCloud(t, infra.type);
    const container  = planContainer(t, infra.type);
    const docker     = planDocker(t, infra.type);
    const kubernetes = planKubernetes(t, infra.type);
    const network    = planNetwork(t, cloud.provider);
    const cdn        = planCDN(t, cloud.provider);
    const lb         = planLoadBalancer(t, infra.type);
    const scaling    = planAutoScaling(t, infra.type);
    const cicd       = planCICD(t);
    const envs       = planEnvironments(t);
    const secrets    = planSecrets(t, cloud.provider);
    const deployment = planDevOpsDeployment(t);
    const monitoring = planMonitoring(t);
    const logging    = planLogging(t);
    const alerts     = planAlerts(t);
    const backup     = planBackup(t);
    const recovery   = planRecovery(t);
    const cost       = planCost(t, cloud.provider, infra.type);
    const security   = planDevOpsSecurity(t, cloud.provider);
    const performance = planDevOpsPerformance(t, cloud.provider);

    return {
      infrastructureType: infra.type, infrastructureConfidence: infra.confidence,
      infrastructure: infra, container, docker, kubernetes, cloud, network, cdn,
      loadBalancer: lb, autoScaling: scaling, cicd, environments: envs, secrets,
      deployment, monitoring, logging, alerts, backup, recovery, cost, security,
      performance, qualityScores: [], overallScore: 0,
    };
  }

  it('returns 9 quality scores', () => {
    const bp = makeBlueprint('SaaSBackend');
    const { qualityScores } = validateDevOpsBlueprint(bp);
    expect(qualityScores).toHaveLength(9);
  });

  it('all scores are between 0 and 10', () => {
    const bp = makeBlueprint('SaaSBackend');
    const { qualityScores } = validateDevOpsBlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('overallScore is average of all dimensions', () => {
    const bp = makeBlueprint('Enterprise');
    const { qualityScores, overallScore } = validateDevOpsBlueprint(bp);
    const expected = parseFloat((qualityScores.reduce((s, q) => s + q.score, 0) / qualityScores.length).toFixed(2));
    expect(overallScore).toBe(expected);
  });

  it('Enterprise scores higher than LandingAPI', () => {
    const ent = validateDevOpsBlueprint(makeBlueprint('Enterprise')).overallScore;
    const lnd = validateDevOpsBlueprint(makeBlueprint('LandingAPI')).overallScore;
    expect(ent).toBeGreaterThan(lnd);
  });

  it('all 9 dimensions are covered', () => {
    const bp = makeBlueprint('SaaSBackend');
    const { qualityScores } = validateDevOpsBlueprint(bp);
    for (const dim of ALL_DEVOPS_DIMENSIONS) {
      expect(qualityScores.find(q => q.dimension === dim)).toBeDefined();
    }
  });

  it('each score has a non-empty rationale', () => {
    const bp = makeBlueprint('SaaSBackend');
    const { qualityScores } = validateDevOpsBlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.rationale.length).toBeGreaterThan(5);
    }
  });
});

// ── Phase 19: Learning ────────────────────────────────────────────────────────

describe('Phase 19: Learning Engine', () => {
  beforeEach(() => { resetDevOpsLearning(); });

  it('learnFromDevOpsBuild is async and non-throwing', async () => {
    const infra   = detectInfrastructure('SaaSBackend');
    const cloud   = planCloud('SaaSBackend', infra.type);
    const partial = { infrastructureType: infra.type, infrastructureConfidence: 0.8, infrastructure: infra, cloud, container: planContainer('SaaSBackend', infra.type), docker: planDocker('SaaSBackend', infra.type), kubernetes: planKubernetes('SaaSBackend', infra.type), network: planNetwork('SaaSBackend', cloud.provider), cdn: planCDN('SaaSBackend', cloud.provider), loadBalancer: planLoadBalancer('SaaSBackend', infra.type), autoScaling: planAutoScaling('SaaSBackend', infra.type), cicd: planCICD('SaaSBackend'), environments: planEnvironments('SaaSBackend'), secrets: planSecrets('SaaSBackend', cloud.provider), deployment: planDevOpsDeployment('SaaSBackend'), monitoring: planMonitoring('SaaSBackend'), logging: planLogging('SaaSBackend'), alerts: planAlerts('SaaSBackend'), backup: planBackup('SaaSBackend'), recovery: planRecovery('SaaSBackend'), cost: planCost('SaaSBackend', cloud.provider, infra.type), security: planDevOpsSecurity('SaaSBackend', cloud.provider), performance: planDevOpsPerformance('SaaSBackend', cloud.provider), qualityScores: [], overallScore: 7 } as DevOpsBlueprint;
    await expect(learnFromDevOpsBuild({ buildId: 'test-1', blueprint: partial })).resolves.toBeUndefined();
  });

  it('accumulates learning records', async () => {
    const infra = detectInfrastructure('SaaSBackend');
    const cloud = planCloud('SaaSBackend', infra.type);
    const partial = { infrastructureType: infra.type, infrastructureConfidence: 0.8, infrastructure: infra, cloud, container: planContainer('SaaSBackend', infra.type), docker: planDocker('SaaSBackend', infra.type), kubernetes: planKubernetes('SaaSBackend', infra.type), network: planNetwork('SaaSBackend', cloud.provider), cdn: planCDN('SaaSBackend', cloud.provider), loadBalancer: planLoadBalancer('SaaSBackend', infra.type), autoScaling: planAutoScaling('SaaSBackend', infra.type), cicd: planCICD('SaaSBackend'), environments: planEnvironments('SaaSBackend'), secrets: planSecrets('SaaSBackend', cloud.provider), deployment: planDevOpsDeployment('SaaSBackend'), monitoring: planMonitoring('SaaSBackend'), logging: planLogging('SaaSBackend'), alerts: planAlerts('SaaSBackend'), backup: planBackup('SaaSBackend'), recovery: planRecovery('SaaSBackend'), cost: planCost('SaaSBackend', cloud.provider, infra.type), security: planDevOpsSecurity('SaaSBackend', cloud.provider), performance: planDevOpsPerformance('SaaSBackend', cloud.provider), qualityScores: [], overallScore: 7 } as DevOpsBlueprint;
    await learnFromDevOpsBuild({ buildId: 'a', blueprint: partial });
    await learnFromDevOpsBuild({ buildId: 'b', blueprint: partial });
    const stats = getDevOpsLearningStats();
    expect(stats.totalRecords).toBe(2);
  });

  it('averageScore is a finite number', async () => {
    const infra = detectInfrastructure('SaaSBackend');
    const cloud = planCloud('SaaSBackend', infra.type);
    const partial = { infrastructureType: infra.type, infrastructureConfidence: 0.8, infrastructure: infra, cloud, container: planContainer('SaaSBackend', infra.type), docker: planDocker('SaaSBackend', infra.type), kubernetes: planKubernetes('SaaSBackend', infra.type), network: planNetwork('SaaSBackend', cloud.provider), cdn: planCDN('SaaSBackend', cloud.provider), loadBalancer: planLoadBalancer('SaaSBackend', infra.type), autoScaling: planAutoScaling('SaaSBackend', infra.type), cicd: planCICD('SaaSBackend'), environments: planEnvironments('SaaSBackend'), secrets: planSecrets('SaaSBackend', cloud.provider), deployment: planDevOpsDeployment('SaaSBackend'), monitoring: planMonitoring('SaaSBackend'), logging: planLogging('SaaSBackend'), alerts: planAlerts('SaaSBackend'), backup: planBackup('SaaSBackend'), recovery: planRecovery('SaaSBackend'), cost: planCost('SaaSBackend', cloud.provider, infra.type), security: planDevOpsSecurity('SaaSBackend', cloud.provider), performance: planDevOpsPerformance('SaaSBackend', cloud.provider), qualityScores: [], overallScore: 8 } as DevOpsBlueprint;
    await learnFromDevOpsBuild({ buildId: 'c', blueprint: partial });
    const stats = getDevOpsLearningStats();
    expect(isFinite(stats.averageScore)).toBe(true);
  });

  it('empty state returns zeros', () => {
    const stats = getDevOpsLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.averageScore).toBe(0);
  });

  it('byInfra tracks infrastructure type distribution', async () => {
    const infra = detectInfrastructure('SaaSBackend');
    const cloud = planCloud('SaaSBackend', infra.type);
    const partial = { infrastructureType: infra.type, infrastructureConfidence: 0.8, infrastructure: infra, cloud, container: planContainer('SaaSBackend', infra.type), docker: planDocker('SaaSBackend', infra.type), kubernetes: planKubernetes('SaaSBackend', infra.type), network: planNetwork('SaaSBackend', cloud.provider), cdn: planCDN('SaaSBackend', cloud.provider), loadBalancer: planLoadBalancer('SaaSBackend', infra.type), autoScaling: planAutoScaling('SaaSBackend', infra.type), cicd: planCICD('SaaSBackend'), environments: planEnvironments('SaaSBackend'), secrets: planSecrets('SaaSBackend', cloud.provider), deployment: planDevOpsDeployment('SaaSBackend'), monitoring: planMonitoring('SaaSBackend'), logging: planLogging('SaaSBackend'), alerts: planAlerts('SaaSBackend'), backup: planBackup('SaaSBackend'), recovery: planRecovery('SaaSBackend'), cost: planCost('SaaSBackend', cloud.provider, infra.type), security: planDevOpsSecurity('SaaSBackend', cloud.provider), performance: planDevOpsPerformance('SaaSBackend', cloud.provider), qualityScores: [], overallScore: 7 } as DevOpsBlueprint;
    await learnFromDevOpsBuild({ buildId: 'x', blueprint: partial });
    const stats = getDevOpsLearningStats();
    expect(stats.byInfra[infra.type]).toBeGreaterThanOrEqual(1);
  });
});

// ── Phase 20: Metrics ─────────────────────────────────────────────────────────

describe('Phase 20: DevOps Metrics', () => {
  beforeEach(() => { resetDevOpsMetrics(); });

  it('returns DevOpsMetricsSnapshot with all required fields', () => {
    const m = getDevOpsMetrics();
    expect(m).toHaveProperty('totalBuilds');
    expect(m).toHaveProperty('averageScore');
    expect(m).toHaveProperty('averageInfraScore');
    expect(m).toHaveProperty('averageSecurityScore');
    expect(m).toHaveProperty('averageMonitoringScore');
    expect(m).toHaveProperty('scoreByDimension');
    expect(m).toHaveProperty('topInfraTypes');
    expect(m).toHaveProperty('topCloudProviders');
    expect(m).toHaveProperty('learningRecordCount');
    expect(m).toHaveProperty('lastUpdated');
  });

  it('empty state returns 0 for all counts', () => {
    const m = getDevOpsMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageScore).toBe(0);
  });

  it('recordDevOpsBuild increments totalBuilds', () => {
    recordDevOpsBuild('Docker', 'AWS', 7.5, { infrastructure: 7, security: 8, monitoring: 6, deployment: 7, performance: 7, reliability: 7, scalability: 7, cost: 6, recovery: 7 });
    expect(getDevOpsMetrics().totalBuilds).toBe(1);
  });

  it('averageScore is computed correctly', () => {
    recordDevOpsBuild('Kubernetes', 'AWS', 8, { infrastructure: 8 });
    recordDevOpsBuild('Docker', 'GCP', 6, { infrastructure: 6 });
    const m = getDevOpsMetrics();
    expect(m.averageScore).toBe(7);
  });

  it('topInfraTypes reflects recorded builds', () => {
    recordDevOpsBuild('Kubernetes', 'AWS', 8, {});
    recordDevOpsBuild('Kubernetes', 'AWS', 7, {});
    recordDevOpsBuild('Docker', 'GCP', 6, {});
    const m = getDevOpsMetrics();
    expect(m.topInfraTypes[0].type).toBe('Kubernetes');
    expect(m.topInfraTypes[0].count).toBe(2);
  });

  it('scoreByDimension contains all 9 dimensions', () => {
    recordDevOpsBuild('Docker', 'AWS', 7, { infrastructure: 7, security: 8, performance: 7, reliability: 7, scalability: 7, cost: 6, monitoring: 7, deployment: 7, recovery: 7 });
    const m = getDevOpsMetrics();
    for (const dim of ALL_DEVOPS_DIMENSIONS) {
      expect(m.scoreByDimension).toHaveProperty(dim);
    }
  });
});

// ── Phase 21: Persistence ─────────────────────────────────────────────────────

describe('Phase 21: Persistence', () => {
  beforeEach(() => { resetDevOpsPersistence(); });

  function makeMinimalBlueprint(): DevOpsBlueprint {
    const t = 'SaaSBackend';
    const infra = detectInfrastructure(t);
    const cloud = planCloud(t, infra.type);
    return {
      infrastructureType: infra.type, infrastructureConfidence: 0.8,
      infrastructure: infra, container: planContainer(t, infra.type),
      docker: planDocker(t, infra.type), kubernetes: planKubernetes(t, infra.type),
      cloud, network: planNetwork(t, cloud.provider), cdn: planCDN(t, cloud.provider),
      loadBalancer: planLoadBalancer(t, infra.type), autoScaling: planAutoScaling(t, infra.type),
      cicd: planCICD(t), environments: planEnvironments(t), secrets: planSecrets(t, cloud.provider),
      deployment: planDevOpsDeployment(t), monitoring: planMonitoring(t), logging: planLogging(t),
      alerts: planAlerts(t), backup: planBackup(t), recovery: planRecovery(t),
      cost: planCost(t, cloud.provider, infra.type), security: planDevOpsSecurity(t, cloud.provider),
      performance: planDevOpsPerformance(t, cloud.provider), qualityScores: [], overallScore: 7,
    };
  }

  it('save + flush creates a snapshot', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp);
    flushDevOpsPersistence();
    expect(getDevOpsSnapshots().length).toBe(1);
  });

  it('version increments on each flush', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    expect(getCurrentDevOpsVersion()).toBe(2);
  });

  it('getRecentDevOpsSnapshots returns limited results', () => {
    const bp = makeMinimalBlueprint();
    for (let i = 0; i < 5; i++) { saveDevOpsBlueprint(bp); flushDevOpsPersistence(); }
    expect(getRecentDevOpsSnapshots(3).length).toBe(3);
  });

  it('rollback retrieves blueprint at version', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    const v = getCurrentDevOpsVersion();
    const rolled = rollbackDevOpsToVersion(v);
    expect(rolled).not.toBeNull();
    expect(rolled?.infrastructureType).toBe(bp.infrastructureType);
  });

  it('rollback to non-existent version returns null', () => {
    expect(rollbackDevOpsToVersion(9999)).toBeNull();
  });

  it('getDevOpsSnapshotAtVersion returns correct snapshot', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    const v   = getCurrentDevOpsVersion();
    const snap = getDevOpsSnapshotAtVersion(v);
    expect(snap?.version).toBe(v);
  });

  it('persistenceStats reflects stored snapshots', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    const stats = getDevOpsPersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.currentVersion).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThan(0);
  });

  it('capacityUsed is 0 when empty', () => {
    const stats = getDevOpsPersistenceStats();
    expect(stats.capacityUsed).toBe(0);
  });

  it('newestVersion > oldestVersion when 2 snapshots exist', () => {
    const bp = makeMinimalBlueprint();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    saveDevOpsBlueprint(bp); flushDevOpsPersistence();
    const stats = getDevOpsPersistenceStats();
    expect(stats.newestVersion!).toBeGreaterThan(stats.oldestVersion!);
  });
});

// ── Full Orchestrator ─────────────────────────────────────────────────────────

describe('DevOps Architect Orchestrator — runDevOpsArchitect', () => {
  const types: BackendType[] = [
    'SaaSBackend','Enterprise','AIPlatform','Finance','LandingAPI',
    'Marketplace','MicroserviceCandidate','ServerlessCandidate',
  ];

  it.each(types)('produces a valid blueprint for %s', (t) => {
    const out = runDevOpsArchitect('build a product', makeProductOutput(), makeBackendOutput(t));
    expect(out.blueprint.infrastructureType).toBeDefined();
    expect(out.blueprint.qualityScores).toHaveLength(9);
    expect(out.overallScore).toBeGreaterThan(0);
    expect(out.overallScore).toBeLessThanOrEqual(10);
    expect(out.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(out.enrichedPromptWithDevOps.length).toBeGreaterThan(10);
  });

  it('enrichedPromptWithDevOps contains DEVOPS ARCHITECTURE', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('SaaSBackend'));
    expect(out.enrichedPromptWithDevOps).toContain('DEVOPS ARCHITECTURE');
  });

  it('blueprint is immutable (Object.frozen)', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('Enterprise'));
    expect(Object.isFrozen(out.blueprint)).toBe(true);
  });

  it('all qualityScores are within 0–10', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('Enterprise'));
    for (const qs of out.blueprint.qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('AIPlatform generates AI-worker scaling', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('AIPlatform'));
    expect(out.blueprint.autoScaling.hasAIWorkerScaling).toBe(true);
  });

  it('Finance blueprint → BlueGreen deployment', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('Finance'));
    expect(out.blueprint.deployment.hasBlueGreen).toBe(true);
  });

  it('enriched prompt contains cloud provider', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('SaaSBackend'));
    expect(out.enrichedPromptWithDevOps).toContain('CLOUD:');
  });

  it('enriched prompt contains SCORE', () => {
    const out = runDevOpsArchitect('', makeProductOutput(), makeBackendOutput('SaaSBackend'));
    expect(out.enrichedPromptWithDevOps).toContain('DEVOPS_SCORE');
  });
});

// ── Type Integrity ────────────────────────────────────────────────────────────

describe('Type Integrity', () => {
  it('ALL_DEVOPS_DIMENSIONS has exactly 9 entries', () => {
    expect(ALL_DEVOPS_DIMENSIONS).toHaveLength(9);
  });

  it('ALL_DEVOPS_DIMENSIONS contains all spec-required dimensions', () => {
    expect(ALL_DEVOPS_DIMENSIONS).toContain('infrastructure');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('security');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('performance');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('reliability');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('scalability');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('cost');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('monitoring');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('deployment');
    expect(ALL_DEVOPS_DIMENSIONS).toContain('recovery');
  });
});
