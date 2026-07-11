// ── V8.6 Backend Architect — Blueprint Validator ──────────────────────────────
import type {
  BackendArchitectureBlueprint,
  BackendQualityScore,
  BackendArchitectureDimension,
} from './backendTypes.js';

function score(value: boolean, weight: number): number {
  return value ? weight : 0;
}

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

function scoreArchitecture(bp: BackendArchitectureBlueprint): number {
  let s = 5;
  s += score(bp.serviceArchitecture.serviceCount > 3, 1);
  s += score(bp.repositoryArchitecture.hasTransactions, 1);
  s += score(bp.controllerArchitecture.hasValidation, 1);
  s += score(bp.controllerArchitecture.hasErrorHandling, 1);
  s += score(bp.folderStructure.directories.length >= 6, 1);
  return clamp(s);
}

function scoreDatabase(bp: BackendArchitectureBlueprint): number {
  const db = bp.databaseArchitecture;
  let s = 4;
  s += score(db.hasMigrations, 1);
  s += score(db.hasIndexing, 1);
  s += score(db.connectionPooling, 1);
  s += score(db.hasSeeding, 0.5);
  s += score(db.estimatedTables > 0, 0.5);
  s += score(db.hasCache, 1);
  s += score(db.hasMigrations && db.hasIndexing, 1);
  return clamp(s);
}

function scoreAPI(bp: BackendArchitectureBlueprint): number {
  const api = bp.apiArchitecture;
  let s = 3;
  s += score(api.hasREST, 1);
  s += score(api.hasHealthAPI, 1);
  s += score(api.hasPagination, 1);
  s += score(api.hasFiltering, 0.5);
  s += score(api.hasVersioning, 0.5);
  s += score(api.hasRateLimiting, 1);
  s += score(api.hasSorting, 0.5);
  s += score(api.hasSearch, 0.5);
  return clamp(s);
}

function scoreSecurity(bp: BackendArchitectureBlueprint): number {
  const sec = bp.securityArchitecture;
  let s = 0;
  s += score(sec.hasHelmet, 1);
  s += score(sec.hasCORSConfig, 1);
  s += score(sec.hasRateLimiting, 1);
  s += score(sec.hasInputSanitization, 1);
  s += score(sec.hasSQLInjectionProtection, 1);
  s += score(sec.hasXSSProtection, 1);
  s += score(sec.hasHashing, 1);
  s += score(sec.hasEncryption, 1);
  s += score(sec.hasOWASPCompliance, 1);
  s += score(sec.hasSecretManagement, 1);
  return clamp(s);
}

function scorePerformance(bp: BackendArchitectureBlueprint): number {
  const perf = bp.performanceArchitecture;
  let s = 2;
  s += score(perf.hasConnectionPooling, 1.5);
  s += score(perf.hasQueryOptimization, 1.5);
  s += score(perf.hasNPlusOneProtection, 1.5);
  s += score(perf.hasResponseCompression, 1.5);
  s += score(bp.cacheArchitecture.hasRedis || bp.cacheArchitecture.hasMemoryCache, 1);
  s += score(perf.hasHTTP2, 0.5);
  return clamp(s);
}

function scoreScalability(bp: BackendArchitectureBlueprint): number {
  const dep  = bp.deploymentArchitecture;
  const perf = bp.performanceArchitecture;
  let s = 3;
  s += score(dep.hasDocker, 1);
  s += score(dep.hasCICD, 1);
  s += score(dep.hasRollback, 1);
  s += score(perf.scalingStrategy === 'Horizontal' || perf.scalingStrategy === 'Auto', 1);
  s += score(dep.hasBlueGreen, 1);
  s += score(dep.hasKubernetes, 1);
  s += score(bp.queueArchitecture.hasQueues, 0.5);
  s += score(bp.cacheArchitecture.hasRedis, 0.5);
  return clamp(s);
}

function scoreReliability(bp: BackendArchitectureBlueprint): number {
  let s = 2;
  s += score(bp.monitoringArchitecture.hasHealthChecks, 2);
  s += score(bp.loggingArchitecture.hasStructuredJSON, 1);
  s += score(bp.monitoringArchitecture.hasCrashReports, 1);
  s += score(bp.queueArchitecture.hasRetryQueue, 1);
  s += score(bp.queueArchitecture.hasDeadLetterQueue, 1);
  s += score(bp.deploymentArchitecture.hasRollback, 1);
  s += score(bp.loggingArchitecture.hasRequestLogs, 1);
  return clamp(s);
}

function scoreMaintainability(bp: BackendArchitectureBlueprint): number {
  let s = 3;
  s += score(bp.repositoryArchitecture.hasDatabaseAbstraction, 1.5);
  s += score(bp.validationArchitecture.hasSchemaValidation, 1.5);
  s += score(bp.serviceArchitecture.hasUtilityServices, 1);
  s += score(bp.controllerArchitecture.hasResponseNormalization, 1);
  s += score(bp.folderStructure.directories.length >= 8, 1);
  s += score(bp.serviceArchitecture.hasDomainServices, 1);
  return clamp(s);
}

function scoreDX(bp: BackendArchitectureBlueprint): number {
  let s = 3;
  s += score(bp.validationArchitecture.library === 'Zod', 1);
  s += score(bp.databaseArchitecture.ormChoice === 'Prisma', 1);
  s += score(bp.apiArchitecture.hasVersioning, 1);
  s += score(bp.monitoringArchitecture.hasHealthChecks, 1);
  s += score(bp.loggingArchitecture.hasStructuredJSON, 1);
  s += score(bp.testingArchitecture.testingFramework === 'Vitest', 1);
  s += score(bp.databaseArchitecture.hasSeeding, 1);
  return clamp(s);
}

function scoreTestability(bp: BackendArchitectureBlueprint): number {
  const t = bp.testingArchitecture;
  let s = 2;
  s += score(t.hasUnitTests, 1.5);
  s += score(t.hasIntegrationTests, 1.5);
  s += score(t.hasAPITests, 1);
  s += score(t.hasRepositoryTests, 1);
  s += score(t.targetCoverage >= 70, 1);
  s += score(t.targetCoverage >= 80, 1);
  s += score(t.hasSmokeTests, 0.5);
  s += score(t.hasSecurityTests, 0.5);
  return clamp(s);
}

// ── New V8.6 dimensions: authentication & authorization ────────────────────────

function scoreAuthentication(bp: BackendArchitectureBlueprint): number {
  const auth = bp.authArchitecture;
  if (auth.primaryStrategy === 'None') return 3; // baseline for public APIs
  let s = 3;
  s += score(auth.hasRefreshToken, 1.5);
  s += score(auth.hasOAuth, 1);
  s += score(auth.strategies.length > 1, 1);
  s += score(auth.hasAPIKeys, 0.5);
  s += score(auth.hasMultiTenant, 1);
  s += score(auth.roles.length >= 2, 1);
  s += score(auth.sessionDuration.length > 0, 0.5);
  return clamp(s);
}

function scoreAuthorization(bp: BackendArchitectureBlueprint): number {
  const perm = bp.permissionArchitecture;
  const auth = bp.authArchitecture;
  if (auth.primaryStrategy === 'None') return 3; // baseline for public APIs
  let s = 2;
  s += score(perm.hasRBAC, 2);
  s += score(perm.permissionCategories.length >= 3, 1.5);
  s += score(perm.roleHierarchy.length >= 2, 1);
  s += score(perm.hasFeatureFlags, 1);
  s += score(perm.hasTenantIsolation, 1);
  s += score(perm.hasABAC, 1);
  s += score(perm.hasWorkspaceIsolation, 0.5);
  return clamp(s);
}

const SCORERS: Record<BackendArchitectureDimension, (bp: BackendArchitectureBlueprint) => number> = {
  architecture:       scoreArchitecture,
  database:           scoreDatabase,
  api:                scoreAPI,
  authentication:     scoreAuthentication,
  authorization:      scoreAuthorization,
  security:           scoreSecurity,
  performance:        scorePerformance,
  scalability:        scoreScalability,
  reliability:        scoreReliability,
  maintainability:    scoreMaintainability,
  developerExperience:scoreDX,
  testability:        scoreTestability,
};

const RATIONALES: Record<BackendArchitectureDimension, string> = {
  architecture:       'Service/controller/repository layering and folder structure completeness',
  database:           'Database choice, indexing, migrations, connection pooling, caching',
  api:                'REST coverage, pagination, filtering, versioning, health endpoints',
  authentication:     'Auth strategy, refresh tokens, OAuth, multi-tenant, session management',
  authorization:      'RBAC/ABAC, permission categories, role hierarchy, tenant isolation',
  security:           'OWASP compliance, helmet, CORS, hashing, encryption, rate limiting',
  performance:        'Connection pooling, query optimization, compression, caching layers',
  scalability:        'Docker, CI/CD, horizontal scaling, blue-green, K8s support',
  reliability:        'Health checks, crash reports, retry queues, structured logging',
  maintainability:    'DB abstraction, schema validation, domain services, folder clarity',
  developerExperience:'Zod, Prisma, versioned API, seeding, Vitest, structured logs',
  testability:        'Unit/integration/API/repo tests, coverage target, smoke tests',
};

export function validateBackendBlueprint(
  bp: BackendArchitectureBlueprint,
): { qualityScores: BackendQualityScore[]; overallScore: number } {
  const qualityScores: BackendQualityScore[] = [];
  let total = 0;

  const dims = Object.keys(SCORERS) as BackendArchitectureDimension[];
  for (const dim of dims) {
    const s = clamp(SCORERS[dim](bp));
    qualityScores.push({ dimension: dim, score: s, rationale: RATIONALES[dim] });
    total += s;
  }

  const overallScore = clamp(total / dims.length);
  return { qualityScores, overallScore };
}
