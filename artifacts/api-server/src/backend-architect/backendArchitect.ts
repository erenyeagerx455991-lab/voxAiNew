// ── V8.6 Backend Architect — Main Orchestration Engine ────────────────────────
import type { ProductPlan } from '../product-manager/productTypes.js';
import type {
  BackendArchitectureBlueprint,
  BackendArchitectOutput,
  BackendFolderStructure,
  ServiceArchitecture,
} from './backendTypes.js';
import { classifyBackendType, isEnterpriseBackend } from './backendPlanner.js';
import { planDatabaseArchitecture }   from './databasePlanner.js';
import { planAPIArchitecture }        from './apiPlanner.js';
import { planAuthArchitecture }       from './authPlanner.js';
import { planPermissionArchitecture } from './permissionPlanner.js';
import { planServiceLayer }           from './servicePlanner.js';
import { planRepositoryLayer }        from './repositoryPlanner.js';
import { planControllerArchitecture } from './controllerPlanner.js';
import { planMiddlewareArchitecture } from './middlewarePlanner.js';
import { planValidationArchitecture } from './validationPlanner.js';
import { planCacheArchitecture }      from './cachePlanner.js';
import { planQueueArchitecture }      from './queuePlanner.js';
import { planEventArchitecture }      from './eventPlanner.js';
import { planStorageArchitecture }    from './storagePlanner.js';
import { planLoggingArchitecture }    from './loggingPlanner.js';
import { planMonitoringArchitecture } from './monitoringPlanner.js';
import { planSecurityArchitecture }   from './securityPlanner.js';
import { planDeploymentArchitecture } from './deploymentPlanner.js';
import { planTestingArchitecture }    from './testingPlanner.js';
import { planPerformanceArchitecture } from './performancePlanner.js';
import { validateBackendBlueprint }   from './backendValidator.js';
import { recordBackendBuild }         from './backendMetrics.js';

// ── Folder Structure ───────────────────────────────────────────────────────────

function planFolderStructure(
  services: ServiceArchitecture,
  isEnterprise: boolean,
): BackendFolderStructure {
  const dirs: string[] = [
    'src/controllers',
    'src/services',
    'src/repositories',
    'src/middlewares',
    'src/validators',
    'src/models',
    'src/routes',
    'src/types',
    'src/utils',
    'src/config',
  ];

  if (services.hasNotificationServices) dirs.push('src/providers');
  if (services.hasIntegrationServices)  dirs.push('src/integrations');
  if (isEnterprise)                      dirs.push('src/entities', 'src/events', 'src/queues', 'src/jobs');
  if (services.hasAIServices)            dirs.push('src/ai');
  if (services.hasAnalyticsServices)     dirs.push('src/analytics');

  dirs.push('src/cache', 'src/storage');
  dirs.push('tests/unit', 'tests/integration', 'tests/api');

  const pattern = isEnterprise ? 'domain-driven' : 'layered';

  return {
    root:         'src/',
    directories:  [...new Set(dirs)],
    keyFiles:     [
      'src/index.ts',
      'src/app.ts',
      'src/config/env.ts',
      'src/config/database.ts',
      'src/types/index.ts',
      'src/utils/logger.ts',
    ],
    pattern,
  };
}

// ── Context String Builder ─────────────────────────────────────────────────────

function buildBackendContext(blueprint: BackendArchitectureBlueprint, prompt: string): string {
  const lines: string[] = [
    `[BACKEND ARCHITECT V8.6 — ${blueprint.backendType}]`,
    ``,
    `DATABASE: ${blueprint.databaseArchitecture.primary} | ORM: ${blueprint.databaseArchitecture.ormChoice}`,
    `API STYLE: ${blueprint.apiArchitecture.primaryStyle} | PREFIX: ${blueprint.apiArchitecture.apiPrefix}${blueprint.apiArchitecture.versionPrefix}`,
    `AUTH: ${blueprint.authArchitecture.primaryStrategy} | ROLES: ${blueprint.authArchitecture.roles.join(', ')}`,
    `PERMISSIONS: ${blueprint.permissionArchitecture.model}`,
    `CACHE: ${blueprint.cacheArchitecture.primaryLayer} | TTL: ${blueprint.cacheArchitecture.defaultTTL}s`,
    `QUEUES: ${blueprint.queueArchitecture.hasQueues ? blueprint.queueArchitecture.queueProvider : 'None'}`,
    `STORAGE: ${blueprint.storageArchitecture.primaryProvider}`,
    `DEPLOYMENT: ${blueprint.deploymentArchitecture.strategy} | SCALING: ${blueprint.performanceArchitecture.scalingStrategy}`,
    `SECURITY: ${blueprint.securityArchitecture.complianceLevel} | OWASP: ${blueprint.securityArchitecture.hasOWASPCompliance}`,
    `TESTING: ${blueprint.testingArchitecture.testingFramework} | COVERAGE: ${blueprint.testingArchitecture.targetCoverage}%`,
    `VALIDATION: ${blueprint.validationArchitecture.library}`,
    `SERVICES (${blueprint.serviceArchitecture.serviceCount}): ${blueprint.serviceArchitecture.services.slice(0, 5).join(', ')}${blueprint.serviceArchitecture.serviceCount > 5 ? '...' : ''}`,
    `CONTROLLERS: ${blueprint.controllerArchitecture.controllerCount}`,
    `FOLDER: ${blueprint.folderStructure.pattern}`,
    `SCORE: ${blueprint.overallScore.toFixed(1)}/10`,
    ``,
    `ORIGINAL PROMPT: ${prompt}`,
  ];

  return lines.join('\n');
}

// ── Main Engine ────────────────────────────────────────────────────────────────

export function runBackendArchitect(
  prompt:      string,
  productPlan: ProductPlan,
): BackendArchitectOutput {
  const t0 = Date.now();

  const productGoal = productPlan.productGoal;
  const features    = productPlan.plannedFeatures;

  // Phase 1 — Classification
  const { type: backendType, confidence: backendTypeConfidence } = classifyBackendType(prompt, productGoal);

  // Phases 2-18 — All Planners
  const databaseArchitecture    = planDatabaseArchitecture(backendType, features);
  const apiArchitecture         = planAPIArchitecture(backendType, features);
  const authArchitecture        = planAuthArchitecture(backendType, features);
  const permissionArchitecture  = planPermissionArchitecture(backendType, features, authArchitecture.roles);
  const serviceArchitecture     = planServiceLayer(backendType, features);
  const repositoryArchitecture  = planRepositoryLayer(backendType, features);
  const controllerArchitecture  = planControllerArchitecture(backendType, features);
  const middlewareArchitecture  = planMiddlewareArchitecture(backendType);
  const validationArchitecture  = planValidationArchitecture(backendType);
  const cacheArchitecture       = planCacheArchitecture(backendType, features);
  const queueArchitecture       = planQueueArchitecture(backendType, features);
  const eventArchitecture       = planEventArchitecture(backendType, features);
  const storageArchitecture     = planStorageArchitecture(backendType, features);
  const loggingArchitecture     = planLoggingArchitecture(backendType);
  const monitoringArchitecture  = planMonitoringArchitecture(backendType);
  const securityArchitecture    = planSecurityArchitecture(backendType);
  const deploymentArchitecture  = planDeploymentArchitecture(backendType);
  const testingArchitecture     = planTestingArchitecture(backendType);
  const performanceArchitecture = planPerformanceArchitecture(backendType, features);
  const folderStructure         = planFolderStructure(serviceArchitecture, isEnterpriseBackend(backendType));

  // Assemble pre-validation blueprint
  const blueprint: BackendArchitectureBlueprint = {
    backendType,
    backendTypeConfidence,
    databaseArchitecture,
    apiArchitecture,
    authArchitecture,
    permissionArchitecture,
    serviceArchitecture,
    repositoryArchitecture,
    controllerArchitecture,
    middlewareArchitecture,
    validationArchitecture,
    cacheArchitecture,
    queueArchitecture,
    eventArchitecture,
    storageArchitecture,
    loggingArchitecture,
    monitoringArchitecture,
    securityArchitecture,
    deploymentArchitecture,
    testingArchitecture,
    performanceArchitecture,
    folderStructure,
    overallScore:   0,
    qualityScores:  [],
  };

  // Phase 19 — Validate + Score
  const { qualityScores, overallScore } = validateBackendBlueprint(blueprint);
  blueprint.qualityScores = qualityScores;
  blueprint.overallScore  = overallScore;

  // Phase 20 — Record metrics (sync)
  recordBackendBuild(backendType, qualityScores, overallScore);

  // Build enriched context string for downstream agents
  const enrichedPromptWithArchitecture = buildBackendContext(blueprint, prompt);

  return {
    blueprint,
    overallScore,
    enrichedPromptWithArchitecture,
    processingTimeMs: Date.now() - t0,
  };
}
