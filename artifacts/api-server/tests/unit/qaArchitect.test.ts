// ── V8.8 QA Architect — Unit Tests ───────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';

import {
  ALL_QA_DIMENSIONS,
  planTestStrategy,
  planUnitTests,
  planIntegrationTests,
  planAPITests,
  planContractTests,
  planE2ETests,
  planAccessibilityTests,
  planResponsiveTests,
  planBrowserCompatibility,
  planMobileTests,
  planPerformanceTests,
  planSecurityTests,
  planVisualRegression,
  planChaosTests,
  planReliability,
  planCoverage,
  planRisks,
  predictFailures,
  validateQABlueprint,
  recordQABuild,
  getQAMetrics,
  resetQAMetrics,
  learnFromQABuild,
  getQALearningStats,
  resetQALearning,
  saveQABlueprint,
  flushQAPersistence,
  getQASnapshots,
  getRecentQASnapshots,
  getQASnapshotAtVersion,
  rollbackQAToVersion,
  getCurrentQAVersion,
  getQAPersistenceStats,
  resetQAPersistence,
  runQAArchitect,
} from '../../src/qa-architect/qaFacade.js';

import type { BackendType } from '../../src/backend-architect/backendTypes.js';
import type { QABlueprint, QAStrategy } from '../../src/qa-architect/qaTypes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeBackendOutput(backendType: BackendType) {
  const dims = ['architecture','database','api','security'];
  return {
    blueprint: {
      backendType,
      backendTypeConfidence: 0.9,
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
      userPersonas: [], plannedFeatures: ['auth'],
      informationArchitecture: { pages: [], navigation: [] },
      userJourney: [], monetizationPlan: { hasPricing: false, tiers: [], currency: 'USD' },
      roadmap: [], detectedRisks: [], qualityScores: [],
      overallProductScore: 7, confidence: 0.8, promptSummary: 'SaaS',
    },
    productScore: 7, contextString: 'Product: SaaS',
  };
}

function buildFullBlueprint(t: BackendType): QABlueprint {
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

// ── Phase 1: Test Strategy ────────────────────────────────────────────────────

describe('Phase 1: Test Strategy', () => {
  it('returns all required fields', () => {
    const r = planTestStrategy('SaaSBackend');
    expect(r).toHaveProperty('strategy');
    expect(r).toHaveProperty('confidence');
    expect(r).toHaveProperty('rationale');
    expect(r).toHaveProperty('priorityOrder');
    expect(r).toHaveProperty('automationTarget');
    expect(r).toHaveProperty('testPyramidRatios');
  });

  it('Finance → e2e-first', () => expect(planTestStrategy('Finance').strategy).toBe('e2e-first'));
  it('Healthcare → e2e-first', () => expect(planTestStrategy('Healthcare').strategy).toBe('e2e-first'));
  it('APIGateway → api-first', () => expect(planTestStrategy('APIGateway').strategy).toBe('api-first'));
  it('ECommerce → ui-first',   () => expect(planTestStrategy('ECommerce').strategy).toBe('ui-first'));
  it('SaaSBackend → unit-first',() => expect(planTestStrategy('SaaSBackend').strategy).toBe('unit-first'));

  it('confidence is between 0.8 and 1', () => {
    for (const t of ['SaaSBackend','Finance','ECommerce','APIGateway'] as BackendType[]) {
      const c = planTestStrategy(t).confidence;
      expect(c).toBeGreaterThan(0.8);
      expect(c).toBeLessThanOrEqual(1);
    }
  });

  it('priorityOrder contains all 5 strategies', () => {
    const r = planTestStrategy('SaaSBackend');
    expect(r.priorityOrder).toHaveLength(5);
    expect(r.priorityOrder[0]).toBe(r.strategy);
  });

  it('testPyramidRatios are positive and sum to 100', () => {
    const r = planTestStrategy('Finance');
    const { unit, integration, e2e } = r.testPyramidRatios;
    expect(unit + integration + e2e).toBe(100);
  });

  it('automationTarget is between 80 and 100', () => {
    const r = planTestStrategy('Finance');
    expect(r.automationTarget).toBeGreaterThanOrEqual(80);
    expect(r.automationTarget).toBeLessThanOrEqual(100);
  });
});

// ── Phase 2: Unit Test Planner ────────────────────────────────────────────────

describe('Phase 2: Unit Test Planner', () => {
  it('returns all required fields', () => {
    const r = planUnitTests('SaaSBackend');
    expect(r).toHaveProperty('estimatedTests');
    expect(r).toHaveProperty('areas');
    expect(r).toHaveProperty('criticalPaths');
    expect(r).toHaveProperty('frameworks');
    expect(r).toHaveProperty('hasMocking');
    expect(r).toHaveProperty('coverageTarget');
  });

  it('complex types get more unit tests than simple', () => {
    const enterprise = planUnitTests('Enterprise').estimatedTests;
    const landing    = planUnitTests('LandingAPI').estimatedTests;
    expect(enterprise).toBeGreaterThan(landing);
  });

  it('Finance gets higher coverage target', () => {
    expect(planUnitTests('Finance').coverageTarget).toBeGreaterThanOrEqual(85);
  });

  it('LandingAPI gets lower coverage target', () => {
    expect(planUnitTests('LandingAPI').coverageTarget).toBeLessThan(80);
  });

  it('always has mocking', () => {
    for (const t of ['SaaSBackend','LandingAPI','Enterprise'] as BackendType[]) {
      expect(planUnitTests(t).hasMocking).toBe(true);
    }
  });

  it('areas is non-empty', () => {
    expect(planUnitTests('SaaSBackend').areas.length).toBeGreaterThan(0);
  });

  it('AIPlatform unit tests include AI-specific areas', () => {
    const r = planUnitTests('AIPlatform');
    const hasAI = r.areas.some(a => a.toLowerCase().includes('ai') || a.toLowerCase().includes('prompt'));
    expect(hasAI).toBe(true);
  });
});

// ── Phase 3: Integration Test Planner ─────────────────────────────────────────

describe('Phase 3: Integration Test Planner', () => {
  it('returns all required fields', () => {
    const r = planIntegrationTests('SaaSBackend');
    expect(r).toHaveProperty('estimatedTests');
    expect(r).toHaveProperty('integrationPoints');
    expect(r).toHaveProperty('dependencyGraph');
    expect(r).toHaveProperty('hasDatabaseTests');
    expect(r).toHaveProperty('hasAuthTests');
    expect(r).toHaveProperty('hasPaymentTests');
  });

  it('always has database and auth tests', () => {
    for (const t of ['SaaSBackend','LandingAPI','Finance'] as BackendType[]) {
      const r = planIntegrationTests(t);
      expect(r.hasDatabaseTests).toBe(true);
      expect(r.hasAuthTests).toBe(true);
    }
  });

  it('Finance has payment tests', () => {
    expect(planIntegrationTests('Finance').hasPaymentTests).toBe(true);
  });

  it('LandingAPI has no payment tests', () => {
    expect(planIntegrationTests('LandingAPI').hasPaymentTests).toBe(false);
  });

  it('Enterprise gets queue and cache tests', () => {
    const r = planIntegrationTests('Enterprise');
    expect(r.hasQueueTests).toBe(true);
    expect(r.hasCacheTests).toBe(true);
  });

  it('dependencyGraph is a non-empty object', () => {
    const r = planIntegrationTests('SaaSBackend');
    expect(Object.keys(r.dependencyGraph).length).toBeGreaterThan(0);
  });

  it('complex types get more integration tests', () => {
    const ent = planIntegrationTests('Enterprise').estimatedTests;
    const lnd = planIntegrationTests('LandingAPI').estimatedTests;
    expect(ent).toBeGreaterThan(lnd);
  });
});

// ── Phase 4: API Test Planner ──────────────────────────────────────────────────

describe('Phase 4: API Test Planner', () => {
  it('returns all required fields', () => {
    const r = planAPITests('SaaSBackend');
    expect(r).toHaveProperty('estimatedTests');
    expect(r).toHaveProperty('verbs');
    expect(r).toHaveProperty('hasHeaderTests');
    expect(r).toHaveProperty('hasAuthTests');
    expect(r).toHaveProperty('hasErrorTests');
    expect(r).toHaveProperty('hasValidationTests');
    expect(r).toHaveProperty('hasRateLimitTests');
    expect(r).toHaveProperty('hasTimeoutTests');
  });

  it('always has all 5 HTTP verbs', () => {
    const r = planAPITests('SaaSBackend');
    expect(r.verbs).toContain('GET');
    expect(r.verbs).toContain('POST');
    expect(r.verbs).toContain('PUT');
    expect(r.verbs).toContain('PATCH');
    expect(r.verbs).toContain('DELETE');
  });

  it('always has auth, error, and validation tests', () => {
    const r = planAPITests('SaaSBackend');
    expect(r.hasAuthTests).toBe(true);
    expect(r.hasErrorTests).toBe(true);
    expect(r.hasValidationTests).toBe(true);
  });

  it('SaaSBackend has rate limit and timeout tests', () => {
    const r = planAPITests('SaaSBackend');
    expect(r.hasRateLimitTests).toBe(true);
    expect(r.hasTimeoutTests).toBe(true);
  });

  it('estimatedTests is positive', () => {
    expect(planAPITests('SaaSBackend').estimatedTests).toBeGreaterThan(0);
  });
});

// ── Phase 5: Contract Test Planner ────────────────────────────────────────────

describe('Phase 5: Contract Test Planner', () => {
  it('returns all required fields', () => {
    const r = planContractTests('SaaSBackend');
    expect(r).toHaveProperty('hasContractTests');
    expect(r).toHaveProperty('checkedAspects');
    expect(r).toHaveProperty('hasVersioning');
    expect(r).toHaveProperty('hasBreakingChangeDetection');
    expect(r).toHaveProperty('hasResponseShape');
    expect(r).toHaveProperty('hasErrorFormat');
    expect(r).toHaveProperty('providerTestCount');
    expect(r).toHaveProperty('consumerTestCount');
  });

  it('SaaSBackend has contract tests', () => {
    expect(planContractTests('SaaSBackend').hasContractTests).toBe(true);
  });

  it('checkedAspects includes all 5 spec items', () => {
    const r = planContractTests('SaaSBackend');
    expect(r.checkedAspects).toContain('schema');
    expect(r.checkedAspects).toContain('version');
    expect(r.checkedAspects).toContain('breaking changes');
    expect(r.checkedAspects).toContain('response shape');
    expect(r.checkedAspects).toContain('error format');
  });

  it('MicroserviceCandidate gets more contract tests', () => {
    const ms  = planContractTests('MicroserviceCandidate').providerTestCount;
    const lnd = planContractTests('LandingAPI').providerTestCount;
    expect(ms).toBeGreaterThan(lnd);
  });
});

// ── Phase 6: E2E Planner ──────────────────────────────────────────────────────

describe('Phase 6: E2E Planner', () => {
  it('returns all required fields', () => {
    const r = planE2ETests('SaaSBackend');
    expect(r).toHaveProperty('estimatedTests');
    expect(r).toHaveProperty('journeys');
    expect(r).toHaveProperty('framework');
    expect(r).toHaveProperty('hasRecording');
    expect(r).toHaveProperty('hasRetry');
    expect(r).toHaveProperty('hasParallelExec');
    expect(r).toHaveProperty('ciIntegration');
  });

  it('uses Playwright', () => {
    expect(planE2ETests('SaaSBackend').framework).toBe('Playwright');
  });

  it('always has recording, retry, CI integration', () => {
    const r = planE2ETests('SaaSBackend');
    expect(r.hasRecording).toBe(true);
    expect(r.hasRetry).toBe(true);
    expect(r.ciIntegration).toBe(true);
  });

  it('Finance includes Login, Recovery, Onboarding journeys', () => {
    const r = planE2ETests('Finance');
    expect(r.journeys).toContain('Login');
    expect(r.journeys).toContain('Recovery');
    expect(r.journeys).toContain('Onboarding');
  });

  it('ECommerce includes Checkout journey', () => {
    expect(planE2ETests('ECommerce').journeys).toContain('Checkout');
  });

  it('Finance gets parallel execution', () => {
    expect(planE2ETests('Finance').hasParallelExec).toBe(true);
  });
});

// ── Phase 7: Accessibility Planner ───────────────────────────────────────────

describe('Phase 7: Accessibility Planner', () => {
  it('returns all required fields', () => {
    const r = planAccessibilityTests('SaaSBackend');
    expect(r).toHaveProperty('standard');
    expect(r).toHaveProperty('hasKeyboardTests');
    expect(r).toHaveProperty('hasScreenReader');
    expect(r).toHaveProperty('hasFocusTests');
    expect(r).toHaveProperty('hasContrastTests');
    expect(r).toHaveProperty('hasARIATests');
    expect(r).toHaveProperty('hasLabelTests');
    expect(r).toHaveProperty('hasNavTests');
    expect(r).toHaveProperty('tools');
    expect(r).toHaveProperty('automatedChecks');
  });

  it('Finance → WCAG2.1-AAA', () => {
    expect(planAccessibilityTests('Finance').standard).toBe('WCAG2.1-AAA');
  });

  it('SaaSBackend → WCAG2.1-AA', () => {
    expect(planAccessibilityTests('SaaSBackend').standard).toBe('WCAG2.1-AA');
  });

  it('always has all 7 test types', () => {
    const r = planAccessibilityTests('SaaSBackend');
    expect(r.hasKeyboardTests).toBe(true);
    expect(r.hasScreenReader).toBe(true);
    expect(r.hasFocusTests).toBe(true);
    expect(r.hasContrastTests).toBe(true);
    expect(r.hasARIATests).toBe(true);
    expect(r.hasLabelTests).toBe(true);
    expect(r.hasNavTests).toBe(true);
  });

  it('automatedChecks > 0', () => {
    expect(planAccessibilityTests('SaaSBackend').automatedChecks).toBeGreaterThan(0);
  });

  it('regulated types get more automated checks', () => {
    const fin = planAccessibilityTests('Finance').automatedChecks;
    const sas = planAccessibilityTests('SaaSBackend').automatedChecks;
    expect(fin).toBeGreaterThan(sas);
  });
});

// ── Phase 8: Responsive Planner ───────────────────────────────────────────────

describe('Phase 8: Responsive Planner', () => {
  it('returns all required fields', () => {
    const r = planResponsiveTests('SaaSBackend');
    expect(r).toHaveProperty('viewports');
    expect(r).toHaveProperty('breakpoints');
    expect(r).toHaveProperty('hasOrientationTests');
    expect(r).toHaveProperty('tools');
    expect(r).toHaveProperty('snapshotPerViewport');
  });

  it('all types include at least Desktop and Mobile', () => {
    const r = planResponsiveTests('SaaSBackend');
    expect(r.viewports).toContain('Desktop');
    expect(r.viewports).toContain('Mobile');
  });

  it('mobile-first types include Landscape and Portrait', () => {
    const r = planResponsiveTests('ECommerce');
    expect(r.viewports).toContain('Landscape');
    expect(r.viewports).toContain('Portrait');
    expect(r.hasOrientationTests).toBe(true);
  });

  it('always has snapshotPerViewport', () => {
    expect(planResponsiveTests('SaaSBackend').snapshotPerViewport).toBe(true);
  });

  it('breakpoints are non-empty', () => {
    expect(planResponsiveTests('SaaSBackend').breakpoints.length).toBeGreaterThan(0);
  });
});

// ── Phase 9: Browser Compatibility ────────────────────────────────────────────

describe('Phase 9: Browser Compatibility', () => {
  it('returns all required fields', () => {
    const r = planBrowserCompatibility('SaaSBackend');
    expect(r).toHaveProperty('browsers');
    expect(r).toHaveProperty('hasAutomation');
    expect(r).toHaveProperty('matrix');
    expect(r).toHaveProperty('tools');
    expect(r).toHaveProperty('criticalBrowsers');
  });

  it('always covers all 7 required browsers', () => {
    const r = planBrowserCompatibility('SaaSBackend');
    expect(r.browsers).toContain('Chrome');
    expect(r.browsers).toContain('Firefox');
    expect(r.browsers).toContain('Safari');
    expect(r.browsers).toContain('Edge');
    expect(r.browsers).toContain('Brave');
    expect(r.browsers).toContain('MobileChrome');
    expect(r.browsers).toContain('MobileSafari');
  });

  it('always has automation', () => {
    expect(planBrowserCompatibility('SaaSBackend').hasAutomation).toBe(true);
  });

  it('matrix has entry for all 7 browsers', () => {
    const r = planBrowserCompatibility('SaaSBackend');
    expect(Object.keys(r.matrix)).toHaveLength(7);
  });

  it('all matrix entries have support:true and minVersion', () => {
    const r = planBrowserCompatibility('SaaSBackend');
    for (const entry of Object.values(r.matrix)) {
      expect(entry.support).toBe(true);
      expect(entry.minVersion).toBeTypeOf('string');
    }
  });

  it('criticalBrowsers is non-empty', () => {
    expect(planBrowserCompatibility('SaaSBackend').criticalBrowsers.length).toBeGreaterThan(0);
  });
});

// ── Phase 10: Mobile Testing ──────────────────────────────────────────────────

describe('Phase 10: Mobile Testing', () => {
  it('returns all required fields', () => {
    const r = planMobileTests('SaaSBackend');
    expect(r).toHaveProperty('hasTouchTests');
    expect(r).toHaveProperty('hasGestureTests');
    expect(r).toHaveProperty('hasViewportTests');
    expect(r).toHaveProperty('hasKeyboardTests');
    expect(r).toHaveProperty('hasSafeAreaTests');
    expect(r).toHaveProperty('hasOrientationTests');
    expect(r).toHaveProperty('hasPerformanceTests');
    expect(r).toHaveProperty('devices');
  });

  it('always has touch, viewport, keyboard, safe-area, performance', () => {
    const r = planMobileTests('LandingAPI');
    expect(r.hasTouchTests).toBe(true);
    expect(r.hasViewportTests).toBe(true);
    expect(r.hasKeyboardTests).toBe(true);
    expect(r.hasSafeAreaTests).toBe(true);
    expect(r.hasPerformanceTests).toBe(true);
  });

  it('ECommerce gets gesture and orientation tests', () => {
    const r = planMobileTests('ECommerce');
    expect(r.hasGestureTests).toBe(true);
    expect(r.hasOrientationTests).toBe(true);
  });

  it('devices is non-empty', () => {
    expect(planMobileTests('SaaSBackend').devices.length).toBeGreaterThan(0);
  });
});

// ── Phase 11: Performance Testing ────────────────────────────────────────────

describe('Phase 11: Performance Testing', () => {
  it('returns all required spec fields', () => {
    const r = planPerformanceTests('SaaSBackend');
    expect(r).toHaveProperty('hasLoadTests');
    expect(r).toHaveProperty('hasStressTests');
    expect(r).toHaveProperty('hasMemoryLeakTests');
    expect(r).toHaveProperty('hasCPUTests');
    expect(r).toHaveProperty('hasBundleSizeTests');
    expect(r).toHaveProperty('hasHydrationTests');
    expect(r).toHaveProperty('targetTTFBms');
    expect(r).toHaveProperty('targetLCPms');
    expect(r).toHaveProperty('targetCLS');
    expect(r).toHaveProperty('targetFIDms');
    expect(r).toHaveProperty('targetINPms');
  });

  it('always has load, memory, bundle, hydration tests', () => {
    const r = planPerformanceTests('SaaSBackend');
    expect(r.hasLoadTests).toBe(true);
    expect(r.hasMemoryLeakTests).toBe(true);
    expect(r.hasBundleSizeTests).toBe(true);
    expect(r.hasHydrationTests).toBe(true);
  });

  it('high-traffic types have tighter LCP target', () => {
    const marketplace = planPerformanceTests('Marketplace');
    const landing     = planPerformanceTests('LandingAPI');
    expect(marketplace.targetLCPms).toBeLessThan(landing.targetLCPms);
  });

  it('high-traffic maxConcurrentUsers > standard', () => {
    const ht  = planPerformanceTests('Marketplace').maxConcurrentUsers;
    const std = planPerformanceTests('SaaSBackend').maxConcurrentUsers;
    expect(ht).toBeGreaterThan(std);
  });

  it('targetCLS is 0.1', () => {
    expect(planPerformanceTests('SaaSBackend').targetCLS).toBe(0.1);
  });
});

// ── Phase 12: Security Testing ────────────────────────────────────────────────

describe('Phase 12: Security Testing', () => {
  it('returns all required spec fields', () => {
    const r = planSecurityTests('SaaSBackend');
    expect(r).toHaveProperty('hasAuthTests');
    expect(r).toHaveProperty('hasAuthzTests');
    expect(r).toHaveProperty('hasJWTTests');
    expect(r).toHaveProperty('hasCSRFTests');
    expect(r).toHaveProperty('hasXSSTests');
    expect(r).toHaveProperty('hasSQLInjectionTests');
    expect(r).toHaveProperty('hasPromptInjectionTests');
    expect(r).toHaveProperty('hasRateLimitTests');
    expect(r).toHaveProperty('hasSecretsTests');
  });

  it('always has auth, CSRF, XSS, SQL injection, rate limit tests', () => {
    const r = planSecurityTests('LandingAPI');
    expect(r.hasAuthTests).toBe(true);
    expect(r.hasCSRFTests).toBe(true);
    expect(r.hasXSSTests).toBe(true);
    expect(r.hasSQLInjectionTests).toBe(true);
    expect(r.hasRateLimitTests).toBe(true);
  });

  it('AIPlatform has prompt injection tests', () => {
    expect(planSecurityTests('AIPlatform').hasPromptInjectionTests).toBe(true);
  });

  it('LandingAPI has no prompt injection tests', () => {
    expect(planSecurityTests('LandingAPI').hasPromptInjectionTests).toBe(false);
  });

  it('Finance → Quarterly penetration test schedule', () => {
    expect(planSecurityTests('Finance').penetrationTestSchedule).toBe('Quarterly');
  });
});

// ── Phase 13: Visual Regression ───────────────────────────────────────────────

describe('Phase 13: Visual Regression', () => {
  it('returns all required spec fields', () => {
    const r = planVisualRegression('SaaSBackend');
    expect(r).toHaveProperty('hasScreenshotComparison');
    expect(r).toHaveProperty('hasLayoutDriftDetection');
    expect(r).toHaveProperty('hasSpacingDriftDetection');
    expect(r).toHaveProperty('hasTypographyDriftDetection');
    expect(r).toHaveProperty('hasThemeDriftDetection');
    expect(r).toHaveProperty('hasMotionDriftDetection');
    expect(r).toHaveProperty('tools');
    expect(r).toHaveProperty('snapshotCount');
    expect(r).toHaveProperty('diffThresholdPercent');
  });

  it('always has screenshot comparison, layout/spacing/typography drift', () => {
    const r = planVisualRegression('LandingAPI');
    expect(r.hasScreenshotComparison).toBe(true);
    expect(r.hasLayoutDriftDetection).toBe(true);
    expect(r.hasSpacingDriftDetection).toBe(true);
    expect(r.hasTypographyDriftDetection).toBe(true);
  });

  it('snapshotCount > 0', () => {
    expect(planVisualRegression('SaaSBackend').snapshotCount).toBeGreaterThan(0);
  });

  it('diffThresholdPercent > 0', () => {
    expect(planVisualRegression('SaaSBackend').diffThresholdPercent).toBeGreaterThan(0);
  });

  it('UI-heavy gets motion drift detection', () => {
    expect(planVisualRegression('ECommerce').hasMotionDriftDetection).toBe(true);
  });

  it('UI-heavy gets more snapshots', () => {
    const ec  = planVisualRegression('ECommerce').snapshotCount;
    const lnd = planVisualRegression('LandingAPI').snapshotCount;
    expect(ec).toBeGreaterThan(lnd);
  });
});

// ── Phase 14: Chaos Testing ───────────────────────────────────────────────────

describe('Phase 14: Chaos Testing', () => {
  it('returns all required spec fields', () => {
    const r = planChaosTests('SaaSBackend');
    expect(r).toHaveProperty('scenarios');
    expect(r).toHaveProperty('hasAutomation');
    expect(r).toHaveProperty('hasGameDays');
    expect(r).toHaveProperty('recoveryTargetSecs');
    expect(r).toHaveProperty('tools');
    expect(r).toHaveProperty('schedule');
  });

  it('always includes ServerCrash, NetworkLatency, HighTraffic', () => {
    const r = planChaosTests('LandingAPI');
    expect(r.scenarios).toContain('ServerCrash');
    expect(r.scenarios).toContain('NetworkLatency');
    expect(r.scenarios).toContain('HighTraffic');
  });

  it('AIPlatform includes AITimeout', () => {
    expect(planChaosTests('AIPlatform').scenarios).toContain('AITimeout');
  });

  it('Marketplace includes QueueOutage and RedisFailure', () => {
    const r = planChaosTests('Marketplace');
    expect(r.scenarios).toContain('QueueOutage');
    expect(r.scenarios).toContain('RedisFailure');
  });

  it('Enterprise gets game days and automation', () => {
    const r = planChaosTests('Enterprise');
    expect(r.hasGameDays).toBe(true);
    expect(r.hasAutomation).toBe(true);
  });

  it('recoveryTargetSecs > 0', () => {
    expect(planChaosTests('SaaSBackend').recoveryTargetSecs).toBeGreaterThan(0);
  });
});

// ── Phase 15: Reliability ─────────────────────────────────────────────────────

describe('Phase 15: Reliability Planner', () => {
  it('returns all required spec fields', () => {
    const r = planReliability('SaaSBackend');
    expect(r).toHaveProperty('predictedAvailabilityPercent');
    expect(r).toHaveProperty('hasFailover');
    expect(r).toHaveProperty('hasRetryPolicy');
    expect(r).toHaveProperty('hasCircuitBreaker');
    expect(r).toHaveProperty('hasGracefulDegradation');
    expect(r).toHaveProperty('retryMaxAttempts');
    expect(r).toHaveProperty('retryBackoffMs');
    expect(r).toHaveProperty('mttrMinutes');
    expect(r).toHaveProperty('sloTarget');
  });

  it('Finance → 99.99% availability', () => {
    expect(planReliability('Finance').predictedAvailabilityPercent).toBe(99.99);
  });

  it('LandingAPI has lower availability target', () => {
    const avail = planReliability('LandingAPI').predictedAvailabilityPercent;
    expect(avail).toBeLessThan(99.9);
  });

  it('always has retry policy and graceful degradation', () => {
    for (const t of ['SaaSBackend','LandingAPI','Finance'] as BackendType[]) {
      const r = planReliability(t);
      expect(r.hasRetryPolicy).toBe(true);
      expect(r.hasGracefulDegradation).toBe(true);
    }
  });

  it('Finance gets more retry attempts', () => {
    const fin = planReliability('Finance').retryMaxAttempts;
    const sas = planReliability('SaaSBackend').retryMaxAttempts;
    expect(fin).toBeGreaterThan(sas);
  });

  it('sloTarget is non-empty string', () => {
    expect(planReliability('SaaSBackend').sloTarget.length).toBeGreaterThan(5);
  });
});

// ── Phase 16: Coverage Planner ────────────────────────────────────────────────

describe('Phase 16: Coverage Planner', () => {
  it('returns all required spec fields', () => {
    const r = planCoverage('SaaSBackend');
    expect(r).toHaveProperty('unitPercent');
    expect(r).toHaveProperty('integrationPercent');
    expect(r).toHaveProperty('e2ePercent');
    expect(r).toHaveProperty('apiPercent');
    expect(r).toHaveProperty('criticalPathPercent');
    expect(r).toHaveProperty('overallQualityScore');
    expect(r).toHaveProperty('hasThresholdEnforcement');
    expect(r).toHaveProperty('reportingTool');
  });

  it('always enforces thresholds', () => {
    expect(planCoverage('LandingAPI').hasThresholdEnforcement).toBe(true);
  });

  it('Finance has highest coverage targets', () => {
    const r = planCoverage('Finance');
    expect(r.unitPercent).toBeGreaterThanOrEqual(90);
    expect(r.criticalPathPercent).toBeGreaterThanOrEqual(95);
  });

  it('LandingAPI has lower targets', () => {
    const r = planCoverage('LandingAPI');
    expect(r.unitPercent).toBeLessThan(80);
  });

  it('overallQualityScore is between 50 and 100', () => {
    for (const t of ['SaaSBackend','Finance','LandingAPI'] as BackendType[]) {
      const s = planCoverage(t).overallQualityScore;
      expect(s).toBeGreaterThan(50);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

// ── Phase 17: Risk Planner ────────────────────────────────────────────────────

describe('Phase 17: Risk Planner', () => {
  it('returns all required spec fields', () => {
    const r = planRisks('SaaSBackend');
    expect(r).toHaveProperty('items');
    expect(r).toHaveProperty('highRiskCount');
    expect(r).toHaveProperty('mediumRiskCount');
    expect(r).toHaveProperty('lowRiskCount');
    expect(r).toHaveProperty('overallRiskScore');
    expect(r).toHaveProperty('mitigationPriority');
  });

  it('each item has subsystem, level, reason, mitigation', () => {
    const r = planRisks('SaaSBackend');
    for (const item of r.items) {
      expect(item.subsystem).toBeTypeOf('string');
      expect(['High','Medium','Low']).toContain(item.level);
      expect(item.reason.length).toBeGreaterThan(5);
      expect(item.mitigation.length).toBeGreaterThan(5);
    }
  });

  it('Finance has high-risk Payment item', () => {
    const r = planRisks('Finance');
    expect(r.items.some(i => i.subsystem === 'Payment')).toBe(true);
  });

  it('AIPlatform has high-risk AI prompt item', () => {
    const r = planRisks('AIPlatform');
    expect(r.items.some(i => i.subsystem.toLowerCase().includes('ai'))).toBe(true);
  });

  it('Enterprise has multi-tenant isolation risk', () => {
    const r = planRisks('ERPBackend');
    expect(r.items.some(i => i.subsystem.toLowerCase().includes('tenant'))).toBe(true);
  });

  it('highRiskCount + mediumRiskCount + lowRiskCount = items.length', () => {
    const r = planRisks('Finance');
    expect(r.highRiskCount + r.mediumRiskCount + r.lowRiskCount).toBe(r.items.length);
  });

  it('overallRiskScore is between 0 and 10', () => {
    for (const t of ['SaaSBackend','Finance','LandingAPI'] as BackendType[]) {
      const s = planRisks(t).overallRiskScore;
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(10);
    }
  });
});

// ── Phase 18: Failure Prediction ──────────────────────────────────────────────

describe('Phase 18: Failure Prediction', () => {
  it('returns non-empty array', () => {
    expect(predictFailures('SaaSBackend').length).toBeGreaterThan(0);
  });

  it('each prediction has all required fields', () => {
    for (const f of predictFailures('SaaSBackend')) {
      expect(f.category).toBeTypeOf('string');
      expect(['High','Medium','Low']).toContain(f.probability);
      expect(f.rationale.length).toBeGreaterThan(5);
      expect(f.prevention.length).toBeGreaterThan(5);
    }
  });

  it('Finance has High-probability AuthBug', () => {
    const r = predictFailures('Finance');
    const auth = r.find(f => f.category === 'AuthBug');
    expect(auth).toBeDefined();
    expect(auth!.probability).toBe('High');
  });

  it('AIPlatform has SlowRendering prediction', () => {
    const r = predictFailures('AIPlatform');
    expect(r.some(f => f.category === 'SlowRendering')).toBe(true);
  });

  it('categories are unique (no duplicates)', () => {
    const r = predictFailures('Finance');
    const cats = r.map(f => f.category);
    expect(new Set(cats).size).toBe(cats.length);
  });
});

// ── Phase 19: QA Validator ────────────────────────────────────────────────────

describe('Phase 19: QA Validator', () => {
  it('returns exactly 10 quality scores', () => {
    const bp = buildFullBlueprint('SaaSBackend');
    const { qualityScores } = validateQABlueprint(bp);
    expect(qualityScores).toHaveLength(10);
  });

  it('all scores are between 0 and 10', () => {
    const bp = buildFullBlueprint('SaaSBackend');
    const { qualityScores } = validateQABlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('overallScore is average of dimension scores', () => {
    const bp = buildFullBlueprint('Enterprise');
    const { qualityScores, overallScore } = validateQABlueprint(bp);
    const expected = parseFloat((qualityScores.reduce((s, q) => s + q.score, 0) / qualityScores.length).toFixed(2));
    expect(overallScore).toBe(expected);
  });

  it('covers all 10 spec dimensions', () => {
    const bp = buildFullBlueprint('SaaSBackend');
    const { qualityScores } = validateQABlueprint(bp);
    for (const dim of ALL_QA_DIMENSIONS) {
      expect(qualityScores.find(q => q.dimension === dim)).toBeDefined();
    }
  });

  it('each score has non-empty rationale', () => {
    const bp = buildFullBlueprint('SaaSBackend');
    const { qualityScores } = validateQABlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.rationale.length).toBeGreaterThan(5);
    }
  });

  it('confidence is between 0.7 and 1', () => {
    const bp = buildFullBlueprint('SaaSBackend');
    const { confidence } = validateQABlueprint(bp);
    expect(confidence).toBeGreaterThan(0.7);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('Finance scores higher than LandingAPI', () => {
    const fin = validateQABlueprint(buildFullBlueprint('Finance')).overallScore;
    const lnd = validateQABlueprint(buildFullBlueprint('LandingAPI')).overallScore;
    expect(fin).toBeGreaterThan(lnd);
  });
});

// ── Phase 20: Learning ────────────────────────────────────────────────────────

describe('Phase 20: Learning', () => {
  beforeEach(() => { resetQALearning(); });

  it('learnFromQABuild resolves without throwing', async () => {
    const bp = { ...buildFullBlueprint('SaaSBackend'), overallScore: 7 };
    await expect(learnFromQABuild({ buildId: 'test-1', blueprint: bp as any })).resolves.toBeUndefined();
  });

  it('accumulates learning records', async () => {
    const bp = { ...buildFullBlueprint('SaaSBackend'), overallScore: 7 };
    await learnFromQABuild({ buildId: 'a', blueprint: bp as any });
    await learnFromQABuild({ buildId: 'b', blueprint: bp as any });
    expect(getQALearningStats().totalRecords).toBe(2);
  });

  it('empty state returns zeros', () => {
    const s = getQALearningStats();
    expect(s.totalRecords).toBe(0);
    expect(s.averageScore).toBe(0);
  });

  it('averageScore is finite after recording', async () => {
    const bp = { ...buildFullBlueprint('SaaSBackend'), overallScore: 8 };
    await learnFromQABuild({ buildId: 'c', blueprint: bp as any });
    expect(isFinite(getQALearningStats().averageScore)).toBe(true);
  });

  it('byStrategy tracks strategy distribution', async () => {
    const bp = { ...buildFullBlueprint('SaaSBackend'), overallScore: 7, strategy: { ...planTestStrategy('SaaSBackend') } };
    await learnFromQABuild({ buildId: 'x', blueprint: bp as any });
    const stats = getQALearningStats();
    expect(stats.byStrategy['unit-first']).toBeGreaterThanOrEqual(1);
  });
});

// ── Phase 21: Metrics ─────────────────────────────────────────────────────────

describe('Phase 21: Metrics', () => {
  beforeEach(() => { resetQAMetrics(); });

  it('returns QAMetricsSnapshot with all required fields', () => {
    const m = getQAMetrics();
    expect(m).toHaveProperty('totalBuilds');
    expect(m).toHaveProperty('averageScore');
    expect(m).toHaveProperty('averageTestingScore');
    expect(m).toHaveProperty('averageCoverageScore');
    expect(m).toHaveProperty('averageReliabilityScore');
    expect(m).toHaveProperty('averageA11yScore');
    expect(m).toHaveProperty('averagePerfScore');
    expect(m).toHaveProperty('averageSecurityScore');
    expect(m).toHaveProperty('topStrategies');
    expect(m).toHaveProperty('lastUpdated');
  });

  it('empty state → all zeros', () => {
    const m = getQAMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageScore).toBe(0);
  });

  it('recordQABuild increments totalBuilds', () => {
    recordQABuild('unit-first', 7.5, { testing: 7, coverage: 8 });
    expect(getQAMetrics().totalBuilds).toBe(1);
  });

  it('averageScore is correct after two records', () => {
    recordQABuild('unit-first', 8, {});
    recordQABuild('e2e-first', 6, {});
    expect(getQAMetrics().averageScore).toBe(7);
  });

  it('topStrategies reflects recorded builds', () => {
    recordQABuild('unit-first', 8, {});
    recordQABuild('unit-first', 7, {});
    recordQABuild('e2e-first', 6, {});
    const m = getQAMetrics();
    expect(m.topStrategies[0].strategy).toBe('unit-first');
    expect(m.topStrategies[0].count).toBe(2);
  });

  it('scoreByDimension contains all 10 dimensions after full record', () => {
    recordQABuild('unit-first', 8, {
      testing: 8, coverage: 7, reliability: 8, accessibility: 7,
      performance: 7, security: 8, responsiveness: 7, compatibility: 8,
      risk: 6, maintainability: 7,
    });
    const m = getQAMetrics();
    for (const dim of ALL_QA_DIMENSIONS) {
      expect(m.scoreByDimension).toHaveProperty(dim);
    }
  });
});

// ── Phase 22: Persistence ─────────────────────────────────────────────────────

describe('Phase 22: Persistence', () => {
  beforeEach(() => { resetQAPersistence(); });

  it('save + flush creates snapshot', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    expect(getQASnapshots().length).toBe(1);
  });

  it('version increments on each flush', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    saveQABlueprint(bp); flushQAPersistence();
    expect(getCurrentQAVersion()).toBe(2);
  });

  it('getRecentQASnapshots returns limited results', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    for (let i = 0; i < 5; i++) { saveQABlueprint(bp); flushQAPersistence(); }
    expect(getRecentQASnapshots(3).length).toBe(3);
  });

  it('rollback retrieves blueprint at version', () => {
    const bp = buildFullBlueprint('Finance') as any;
    saveQABlueprint(bp); flushQAPersistence();
    const v = getCurrentQAVersion();
    const rolled = rollbackQAToVersion(v);
    expect(rolled).not.toBeNull();
  });

  it('rollback to non-existent version returns null', () => {
    expect(rollbackQAToVersion(9999)).toBeNull();
  });

  it('getQASnapshotAtVersion returns correct snapshot', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    const v    = getCurrentQAVersion();
    const snap = getQASnapshotAtVersion(v);
    expect(snap?.version).toBe(v);
  });

  it('persistenceStats reflects stored snapshots', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    const stats = getQAPersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.currentVersion).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThan(0);
  });

  it('capacityUsed is 0 when empty', () => {
    expect(getQAPersistenceStats().capacityUsed).toBe(0);
  });

  it('newestVersion > oldestVersion when 2 snapshots exist', () => {
    const bp = buildFullBlueprint('SaaSBackend') as any;
    saveQABlueprint(bp); flushQAPersistence();
    saveQABlueprint(bp); flushQAPersistence();
    const stats = getQAPersistenceStats();
    expect(stats.newestVersion!).toBeGreaterThan(stats.oldestVersion!);
  });
});

// ── Orchestrator ──────────────────────────────────────────────────────────────

describe('QA Architect Orchestrator — runQAArchitect', () => {
  const ALL_TYPES: BackendType[] = [
    'SaaSBackend','Enterprise','AIPlatform','Finance','LandingAPI',
    'Marketplace','MicroserviceCandidate','ServerlessCandidate','ECommerce',
  ];

  it.each(ALL_TYPES)('produces valid blueprint for %s', (t) => {
    const out = runQAArchitect('build a product', makeProductOutput() as any, makeBackendOutput(t) as any);
    expect(out.blueprint.qualityScores).toHaveLength(10);
    expect(out.overallScore).toBeGreaterThan(0);
    expect(out.overallScore).toBeLessThanOrEqual(10);
    expect(out.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(out.enrichedPromptWithQA.length).toBeGreaterThan(10);
  });

  it('blueprint is frozen (immutable)', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Enterprise') as any);
    expect(Object.isFrozen(out.blueprint)).toBe(true);
  });

  it('enrichedPromptWithQA contains QA_STRATEGY', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    expect(out.enrichedPromptWithQA).toContain('QA_STRATEGY');
  });

  it('enrichedPromptWithQA contains DEVOPS_QA_SCORE', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('SaaSBackend') as any);
    expect(out.enrichedPromptWithQA).toContain('DEVOPS_QA_SCORE');
  });

  it('Finance blueprint → e2e-first strategy', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Finance') as any);
    expect(out.blueprint.strategy.strategy).toBe('e2e-first');
  });

  it('AIPlatform has prompt injection security tests', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('AIPlatform') as any);
    expect(out.blueprint.securityTests.hasPromptInjectionTests).toBe(true);
  });

  it('all qualityScores are within 0–10', () => {
    const out = runQAArchitect('', makeProductOutput() as any, makeBackendOutput('Enterprise') as any);
    for (const qs of out.blueprint.qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });
});

// ── Type Integrity ────────────────────────────────────────────────────────────

describe('Type Integrity', () => {
  it('ALL_QA_DIMENSIONS has exactly 10 entries', () => {
    expect(ALL_QA_DIMENSIONS).toHaveLength(10);
  });

  it('ALL_QA_DIMENSIONS contains all spec-required dimensions', () => {
    const required = ['testing','coverage','reliability','accessibility',
      'performance','security','responsiveness','compatibility','risk','maintainability'];
    for (const d of required) {
      expect(ALL_QA_DIMENSIONS).toContain(d);
    }
  });
});
