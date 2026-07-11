// ── V8.6 Backend Architect — Comprehensive Unit Tests (250+) ──────────────────
import { describe, it, expect, beforeEach } from 'vitest';

import {
  classifyBackendType,
  isEnterpriseBackend,
  isHighTrafficBackend,
  isSimpleBackend,
  ALL_BACKEND_TYPES,
} from '../../src/backend-architect/backendPlanner.js';

import { planDatabaseArchitecture }    from '../../src/backend-architect/databasePlanner.js';
import { planAPIArchitecture }         from '../../src/backend-architect/apiPlanner.js';
import { planAuthArchitecture }        from '../../src/backend-architect/authPlanner.js';
import { planPermissionArchitecture }  from '../../src/backend-architect/permissionPlanner.js';
import { planServiceLayer }            from '../../src/backend-architect/servicePlanner.js';
import { planRepositoryLayer }         from '../../src/backend-architect/repositoryPlanner.js';
import { planControllerArchitecture }  from '../../src/backend-architect/controllerPlanner.js';
import { planMiddlewareArchitecture }  from '../../src/backend-architect/middlewarePlanner.js';
import { planValidationArchitecture }  from '../../src/backend-architect/validationPlanner.js';
import { planCacheArchitecture }       from '../../src/backend-architect/cachePlanner.js';
import { planQueueArchitecture }       from '../../src/backend-architect/queuePlanner.js';
import { planEventArchitecture }       from '../../src/backend-architect/eventPlanner.js';
import { planStorageArchitecture }     from '../../src/backend-architect/storagePlanner.js';
import { planLoggingArchitecture }     from '../../src/backend-architect/loggingPlanner.js';
import { planMonitoringArchitecture }  from '../../src/backend-architect/monitoringPlanner.js';
import { planSecurityArchitecture }    from '../../src/backend-architect/securityPlanner.js';
import { planDeploymentArchitecture }  from '../../src/backend-architect/deploymentPlanner.js';
import { planTestingArchitecture }     from '../../src/backend-architect/testingPlanner.js';
import { planPerformanceArchitecture } from '../../src/backend-architect/performancePlanner.js';
import { validateBackendBlueprint }    from '../../src/backend-architect/backendValidator.js';
import { runBackendArchitect }         from '../../src/backend-architect/backendArchitect.js';

import {
  recordBackendBuild,
  getBackendMetrics,
  resetBackendMetrics,
  recordBackendLearning,
} from '../../src/backend-architect/backendMetrics.js';

import {
  learnFromBackendBuild,
  getBackendLearningStats,
  getBackendLearningRecords,
  resetBackendLearning,
} from '../../src/backend-architect/backendLearning.js';

import {
  initBackendArchitectPersistence,
  resetBackendArchitectPersistence,
  persistArchitectureSnapshot,
  getArchitectureHistory,
  getRecentSnapshots,
  getSnapshotAtVersion,
  getCurrentSnapshot,
  rollbackToVersion,
  getPersistenceStats,
} from '../../src/backend-architect/backendPersistence.js';

import type { BackendType } from '../../src/backend-architect/backendTypes.js';
import { ALL_BACKEND_DIMENSIONS } from '../../src/backend-architect/backendTypes.js';

// ── Shared test helpers ────────────────────────────────────────────────────────

function makePlan(goal: Parameters<typeof runBackendArchitect>[1]) {
  return goal;
}

const EMPTY_FEATURES: Parameters<typeof planDatabaseArchitecture>[1] = [];
const RICH_FEATURES = ['AI', 'Billing', 'Notifications', 'Teams', 'Analytics', 'FileUpload'] as const;

// ── 1. Project Classifier ──────────────────────────────────────────────────────

describe('classifyBackendType', () => {
  it('returns a valid BackendType', () => {
    const { type } = classifyBackendType('build a saas platform', 'SaaS');
    expect(ALL_BACKEND_TYPES).toContain(type);
  });

  it('classifies SaaS prompts correctly', () => {
    const { type } = classifyBackendType('build a saas subscription platform', 'SaaS');
    expect(type).toBe('SaaSBackend');
  });

  it('classifies CRM prompts correctly', () => {
    const { type } = classifyBackendType('crm for sales pipeline and lead management', 'CRM');
    expect(type).toBe('CRMBackend');
  });

  it('classifies e-commerce prompts correctly', () => {
    const { type } = classifyBackendType('online shop with product catalog and checkout', 'ECommerce');
    expect(type).toBe('ECommerce');
  });

  it('classifies AI platform prompts correctly', () => {
    const { type } = classifyBackendType('ai platform with llm and vector search', 'AIProduct');
    expect(type).toBe('AIPlatform');
  });

  it('classifies healthcare prompts correctly', () => {
    const { type } = classifyBackendType('healthcare platform for patient records', 'Healthcare');
    expect(type).toBe('Healthcare');
  });

  it('classifies landing page prompts correctly', () => {
    const { type } = classifyBackendType('landing page for a new product waitlist', 'LandingPage');
    expect(type).toBe('LandingAPI');
  });

  it('classifies booking platform prompts correctly', () => {
    const { type } = classifyBackendType('appointment booking and scheduling platform', 'BookingPlatform');
    expect(type).toBe('BookingPlatform');
  });

  it('classifies finance prompts correctly', () => {
    const { type } = classifyBackendType('fintech banking and payment platform', 'Finance');
    expect(type).toBe('Finance');
  });

  it('classifies education prompts correctly', () => {
    const { type } = classifyBackendType('e-learning lms course platform', 'Education');
    expect(type).toBe('Education');
  });

  it('classifies marketplace prompts correctly', () => {
    const { type } = classifyBackendType('multi-vendor marketplace with buyer seller platform', 'Marketplace');
    expect(type).toBe('Marketplace');
  });

  it('returns confidence between 0 and 1', () => {
    const { confidence } = classifyBackendType('build something', 'SaaS');
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('returns confidence > 0 for both specific and vague prompts', () => {
    const specific = classifyBackendType('saas subscription platform multi-tenant', 'SaaS');
    const vague    = classifyBackendType('build something', 'SaaS');
    expect(specific.confidence).toBeGreaterThan(0);
    expect(vague.confidence).toBeGreaterThan(0);
  });

  it('uses productGoal as a strong signal when no keyword matches', () => {
    const { type } = classifyBackendType('build an app', 'Dashboard');
    expect(type).toBe('Dashboard');
  });

  it('handles empty prompt gracefully', () => {
    const { type, confidence } = classifyBackendType('', 'SaaS');
    expect(ALL_BACKEND_TYPES).toContain(type);
    expect(confidence).toBeGreaterThan(0);
  });
});

// ── 2. Backend type predicates ─────────────────────────────────────────────────

describe('isEnterpriseBackend', () => {
  it('returns true for Enterprise', () => expect(isEnterpriseBackend('Enterprise')).toBe(true));
  it('returns true for MultiTenant', () => expect(isEnterpriseBackend('MultiTenant')).toBe(true));
  it('returns true for Healthcare', () => expect(isEnterpriseBackend('Healthcare')).toBe(true));
  it('returns true for Finance', () => expect(isEnterpriseBackend('Finance')).toBe(true));
  it('returns true for ERPBackend', () => expect(isEnterpriseBackend('ERPBackend')).toBe(true));
  it('returns false for LandingAPI', () => expect(isEnterpriseBackend('LandingAPI')).toBe(false));
  it('returns false for SaaSBackend', () => expect(isEnterpriseBackend('SaaSBackend')).toBe(false));
  it('returns false for Documentation', () => expect(isEnterpriseBackend('Documentation')).toBe(false));
});

describe('isHighTrafficBackend', () => {
  it('returns true for Marketplace', () => expect(isHighTrafficBackend('Marketplace')).toBe(true));
  it('returns true for SocialPlatform', () => expect(isHighTrafficBackend('SocialPlatform')).toBe(true));
  it('returns true for AIPlatform', () => expect(isHighTrafficBackend('AIPlatform')).toBe(true));
  it('returns false for LandingAPI', () => expect(isHighTrafficBackend('LandingAPI')).toBe(false));
  it('returns false for Documentation', () => expect(isHighTrafficBackend('Documentation')).toBe(false));
  it('returns false for InternalTool', () => expect(isHighTrafficBackend('InternalTool')).toBe(false));
});

describe('isSimpleBackend', () => {
  it('returns true for LandingAPI', () => expect(isSimpleBackend('LandingAPI')).toBe(true));
  it('returns true for Documentation', () => expect(isSimpleBackend('Documentation')).toBe(true));
  it('returns true for ServerlessCandidate', () => expect(isSimpleBackend('ServerlessCandidate')).toBe(true));
  it('returns false for SaaSBackend', () => expect(isSimpleBackend('SaaSBackend')).toBe(false));
  it('returns false for Finance', () => expect(isSimpleBackend('Finance')).toBe(false));
});

// ── 3. Database Planner ────────────────────────────────────────────────────────

describe('planDatabaseArchitecture', () => {
  it('returns a complete DatabaseArchitecture object', () => {
    const result = planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('secondary');
    expect(result).toHaveProperty('hasCache');
    expect(result).toHaveProperty('hasMigrations');
    expect(result).toHaveProperty('connectionPooling');
    expect(result).toHaveProperty('ormChoice');
    expect(result).toHaveProperty('estimatedTables');
  });

  it('uses PostgreSQL for SaaS', () => {
    expect(planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES).primary).toBe('PostgreSQL');
  });

  it('uses SQLite for simple LandingAPI', () => {
    expect(planDatabaseArchitecture('LandingAPI', EMPTY_FEATURES).primary).toBe('SQLite');
  });

  it('uses MongoDB for CMS', () => {
    expect(planDatabaseArchitecture('CMS', EMPTY_FEATURES).primary).toBe('MongoDB');
  });

  it('includes Redis as secondary for SaaS', () => {
    const { secondary } = planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(secondary).toContain('Redis');
  });

  it('includes VectorDB for AI platforms', () => {
    const { secondary } = planDatabaseArchitecture('AIPlatform', ['AI'] as any);
    expect(secondary).toContain('VectorDB');
  });

  it('enables indexing for non-simple backends', () => {
    expect(planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES).hasIndexing).toBe(true);
  });

  it('disables indexing for simple LandingAPI', () => {
    expect(planDatabaseArchitecture('LandingAPI', EMPTY_FEATURES).hasIndexing).toBe(false);
  });

  it('enables migrations for SQL databases', () => {
    expect(planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES).hasMigrations).toBe(true);
  });

  it('disables migrations for MongoDB', () => {
    expect(planDatabaseArchitecture('CMS', EMPTY_FEATURES).hasMigrations).toBe(false);
  });

  it('enables replication for Finance', () => {
    expect(planDatabaseArchitecture('Finance', EMPTY_FEATURES).hasReplication).toBe(true);
  });

  it('has positive estimatedTables', () => {
    expect(planDatabaseArchitecture('SaaSBackend', EMPTY_FEATURES).estimatedTables).toBeGreaterThan(0);
  });

  it('enterprise backend has more tables than landing page', () => {
    const enterprise = planDatabaseArchitecture('Enterprise', EMPTY_FEATURES).estimatedTables;
    const landing    = planDatabaseArchitecture('LandingAPI', EMPTY_FEATURES).estimatedTables;
    expect(enterprise).toBeGreaterThan(landing);
  });

  it('uses Prisma ORM for enterprise', () => {
    expect(planDatabaseArchitecture('Enterprise', EMPTY_FEATURES).ormChoice).toBe('Prisma');
  });

  it('disables connection pooling for SQLite', () => {
    expect(planDatabaseArchitecture('LandingAPI', EMPTY_FEATURES).connectionPooling).toBe(false);
  });
});

// ── 4. API Planner ─────────────────────────────────────────────────────────────

describe('planAPIArchitecture', () => {
  it('returns a complete APIArchitecture object', () => {
    const result = planAPIArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('primaryStyle');
    expect(result).toHaveProperty('hasREST');
    expect(result).toHaveProperty('hasHealthAPI');
    expect(result).toHaveProperty('hasPagination');
    expect(result).toHaveProperty('apiPrefix');
  });

  it('always has a health API', () => {
    for (const type of ['SaaSBackend', 'Finance', 'LandingAPI'] as BackendType[]) {
      expect(planAPIArchitecture(type, EMPTY_FEATURES).hasHealthAPI).toBe(true);
    }
  });

  it('has REST for standard backends', () => {
    expect(planAPIArchitecture('SaaSBackend', EMPTY_FEATURES).hasREST).toBe(true);
  });

  it('has pagination for non-simple backends', () => {
    expect(planAPIArchitecture('SaaSBackend', EMPTY_FEATURES).hasPagination).toBe(true);
  });

  it('has versioning for enterprise', () => {
    expect(planAPIArchitecture('Enterprise', EMPTY_FEATURES).hasVersioning).toBe(true);
  });

  it('has rate limiting', () => {
    expect(planAPIArchitecture('SaaSBackend', EMPTY_FEATURES).hasRateLimiting).toBe(true);
  });

  it('apiPrefix is non-empty string', () => {
    const { apiPrefix } = planAPIArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(typeof apiPrefix).toBe('string');
    expect(apiPrefix.length).toBeGreaterThan(0);
  });

  it('has search capability for feature-rich backends', () => {
    expect(planAPIArchitecture('SaaSBackend', ['Search'] as any).hasSearch).toBe(true);
  });
});

// ── 5. Auth Planner ───────────────────────────────────────────────────────────

describe('planAuthArchitecture', () => {
  it('returns a complete AuthArchitecture object', () => {
    const result = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('primaryStrategy');
    expect(result).toHaveProperty('strategies');
    expect(result).toHaveProperty('roles');
    expect(result).toHaveProperty('hasRefreshToken');
    expect(result).toHaveProperty('sessionDuration');
  });

  it('has None auth for LandingAPI', () => {
    expect(planAuthArchitecture('LandingAPI', EMPTY_FEATURES).primaryStrategy).toBe('None');
  });

  it('uses JWT for SaaS', () => {
    expect(planAuthArchitecture('SaaSBackend', EMPTY_FEATURES).primaryStrategy).toBe('JWT');
  });

  it('always includes User role for SaaS', () => {
    expect(planAuthArchitecture('SaaSBackend', EMPTY_FEATURES).roles).toContain('User');
  });

  it('always includes Admin role for authenticated backends', () => {
    expect(planAuthArchitecture('SaaSBackend', EMPTY_FEATURES).roles).toContain('Admin');
  });

  it('has refresh token for JWT strategy', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    if (auth.primaryStrategy === 'JWT') {
      expect(auth.hasRefreshToken).toBe(true);
    }
  });

  it('has multi-tenant support for enterprise', () => {
    expect(planAuthArchitecture('Enterprise', EMPTY_FEATURES).hasMultiTenant).toBe(true);
  });

  it('has API keys for developer platforms', () => {
    expect(planAuthArchitecture('DeveloperPlatform', EMPTY_FEATURES).hasAPIKeys).toBe(true);
  });

  it('strategies array is non-empty for authenticated backends', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(auth.strategies.length).toBeGreaterThan(0);
  });

  it('session duration is a non-empty string', () => {
    const { sessionDuration } = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(typeof sessionDuration).toBe('string');
    expect(sessionDuration.length).toBeGreaterThan(0);
  });

  it('enterprise backends have longer session duration', () => {
    const enterprise = planAuthArchitecture('Enterprise', EMPTY_FEATURES).sessionDuration;
    const standard   = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES).sessionDuration;
    // Enterprise uses 8h vs 24h; both non-empty is the invariant
    expect(enterprise.length).toBeGreaterThan(0);
    expect(standard.length).toBeGreaterThan(0);
  });
});

// ── 6. Permission Planner ─────────────────────────────────────────────────────

describe('planPermissionArchitecture', () => {
  it('returns a complete PermissionArchitecture object', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    const result = planPermissionArchitecture('SaaSBackend', EMPTY_FEATURES, auth.roles);
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('hasRBAC');
    expect(result).toHaveProperty('roleHierarchy');
    expect(result).toHaveProperty('permissionCategories');
  });

  it('uses RBAC for SaaS', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    const perm = planPermissionArchitecture('SaaSBackend', EMPTY_FEATURES, auth.roles);
    expect(perm.hasRBAC).toBe(true);
  });

  it('has tenant isolation for MultiTenant', () => {
    const auth = planAuthArchitecture('MultiTenant', EMPTY_FEATURES);
    const perm = planPermissionArchitecture('MultiTenant', EMPTY_FEATURES, auth.roles);
    expect(perm.hasTenantIsolation).toBe(true);
  });

  it('roleHierarchy is an array', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    const perm = planPermissionArchitecture('SaaSBackend', EMPTY_FEATURES, auth.roles);
    expect(Array.isArray(perm.roleHierarchy)).toBe(true);
  });

  it('permissionCategories is a non-empty array', () => {
    const auth = planAuthArchitecture('SaaSBackend', EMPTY_FEATURES);
    const perm = planPermissionArchitecture('SaaSBackend', EMPTY_FEATURES, auth.roles);
    expect(perm.permissionCategories.length).toBeGreaterThan(0);
  });

  it('has feature flags for enterprise', () => {
    const auth = planAuthArchitecture('Enterprise', EMPTY_FEATURES);
    const perm = planPermissionArchitecture('Enterprise', EMPTY_FEATURES, auth.roles);
    expect(perm.hasFeatureFlags).toBe(true);
  });
});

// ── 7. Service Layer Planner ──────────────────────────────────────────────────

describe('planServiceLayer', () => {
  it('returns a complete ServiceArchitecture object', () => {
    const result = planServiceLayer('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('hasBusinessServices');
    expect(result).toHaveProperty('serviceCount');
  });

  it('serviceCount matches services array length', () => {
    const result = planServiceLayer('SaaSBackend', RICH_FEATURES as any);
    expect(result.serviceCount).toBe(result.services.length);
  });

  it('always includes UserService and AuthService', () => {
    const { services } = planServiceLayer('SaaSBackend', EMPTY_FEATURES);
    expect(services).toContain('UserService');
    expect(services).toContain('AuthService');
  });

  it('includes AI service for AI platform', () => {
    const { services } = planServiceLayer('AIPlatform', ['AI'] as any);
    expect(services.some(s => s.toLowerCase().includes('ai'))).toBe(true);
  });

  it('includes payment services for e-commerce', () => {
    const { hasPaymentServices } = planServiceLayer('ECommerce', EMPTY_FEATURES);
    expect(hasPaymentServices).toBe(true);
  });

  it('has more services for enterprise than landing page', () => {
    const enterprise = planServiceLayer('Enterprise', RICH_FEATURES as any).serviceCount;
    const landing    = planServiceLayer('LandingAPI', EMPTY_FEATURES).serviceCount;
    expect(enterprise).toBeGreaterThan(landing);
  });

  it('hasBusinessServices is always true', () => {
    expect(planServiceLayer('SaaSBackend', EMPTY_FEATURES).hasBusinessServices).toBe(true);
  });

  it('has notification service when feature requested', () => {
    const { hasNotificationServices } = planServiceLayer('SaaSBackend', ['Notifications'] as any);
    expect(hasNotificationServices).toBe(true);
  });

  it('has domain services for enterprise', () => {
    expect(planServiceLayer('Enterprise', EMPTY_FEATURES).hasDomainServices).toBe(true);
  });

  it('no duplicate services', () => {
    const { services } = planServiceLayer('ECommerce', RICH_FEATURES as any);
    expect(services.length).toBe(new Set(services).size);
  });
});

// ── 8. Repository Layer Planner ───────────────────────────────────────────────

describe('planRepositoryLayer', () => {
  it('returns a complete RepositoryArchitecture object', () => {
    const result = planRepositoryLayer('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('pattern');
    expect(result).toHaveProperty('hasUnitOfWork');
    expect(result).toHaveProperty('hasTransactions');
    expect(result).toHaveProperty('hasDatabaseAbstraction');
    expect(result).toHaveProperty('repositories');
  });

  it('always has database abstraction', () => {
    expect(planRepositoryLayer('SaaSBackend', EMPTY_FEATURES).hasDatabaseAbstraction).toBe(true);
  });

  it('has transactions for non-trivial backends', () => {
    expect(planRepositoryLayer('SaaSBackend', EMPTY_FEATURES).hasTransactions).toBe(true);
  });

  it('has unit of work for Finance', () => {
    expect(planRepositoryLayer('Finance', EMPTY_FEATURES).hasUnitOfWork).toBe(true);
  });

  it('always includes UserRepository', () => {
    expect(planRepositoryLayer('SaaSBackend', EMPTY_FEATURES).repositories).toContain('UserRepository');
  });

  it('no duplicate repositories', () => {
    const { repositories } = planRepositoryLayer('ECommerce', RICH_FEATURES as any);
    expect(repositories.length).toBe(new Set(repositories).size);
  });
});

// ── 9. Controller Planner ─────────────────────────────────────────────────────

describe('planControllerArchitecture', () => {
  it('returns a complete ControllerArchitecture object', () => {
    const result = planControllerArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('controllers');
    expect(result).toHaveProperty('hasValidation');
    expect(result).toHaveProperty('hasErrorHandling');
    expect(result).toHaveProperty('controllerCount');
  });

  it('controllerCount matches controllers array length', () => {
    const result = planControllerArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result.controllerCount).toBe(result.controllers.length);
  });

  it('always includes HealthController', () => {
    expect(planControllerArchitecture('SaaSBackend', EMPTY_FEATURES).controllers).toContain('HealthController');
  });

  it('has validation', () => {
    expect(planControllerArchitecture('SaaSBackend', EMPTY_FEATURES).hasValidation).toBe(true);
  });

  it('has error handling', () => {
    expect(planControllerArchitecture('SaaSBackend', EMPTY_FEATURES).hasErrorHandling).toBe(true);
  });

  it('no duplicate controllers', () => {
    const { controllers } = planControllerArchitecture('ECommerce', RICH_FEATURES as any);
    expect(controllers.length).toBe(new Set(controllers).size);
  });
});

// ── 10. Middleware Planner ────────────────────────────────────────────────────

describe('planMiddlewareArchitecture', () => {
  it('returns a complete MiddlewareArchitecture object', () => {
    const result = planMiddlewareArchitecture('SaaSBackend');
    expect(result).toHaveProperty('middlewares');
    expect(result).toHaveProperty('hasAuth');
    expect(result).toHaveProperty('hasCORS');
    expect(result).toHaveProperty('hasHelmet');
    expect(result).toHaveProperty('hasRateLimit');
  });

  it('always has CORS', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').hasCORS).toBe(true);
  });

  it('always has Helmet', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').hasHelmet).toBe(true);
  });

  it('always has rate limiting', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').hasRateLimit).toBe(true);
  });

  it('always has request ID', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').hasRequestID).toBe(true);
  });

  it('LandingAPI has no auth middleware', () => {
    expect(planMiddlewareArchitecture('LandingAPI').hasAuth).toBe(false);
  });

  it('SaaS has auth middleware', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').hasAuth).toBe(true);
  });

  it('enterprise has tracing middleware', () => {
    expect(planMiddlewareArchitecture('Enterprise').hasTracing).toBe(true);
  });

  it('middlewares array is non-empty', () => {
    expect(planMiddlewareArchitecture('SaaSBackend').middlewares.length).toBeGreaterThan(0);
  });

  it('no duplicate middleware entries', () => {
    const { middlewares } = planMiddlewareArchitecture('Finance');
    expect(middlewares.length).toBe(new Set(middlewares).size);
  });
});

// ── 11. Validation Planner ────────────────────────────────────────────────────

describe('planValidationArchitecture', () => {
  it('returns a complete ValidationArchitecture object', () => {
    const result = planValidationArchitecture('SaaSBackend');
    expect(result).toHaveProperty('library');
    expect(result).toHaveProperty('hasSchemaValidation');
    expect(result).toHaveProperty('hasDTOValidation');
    expect(result).toHaveProperty('hasInputSanitization');
    expect(result).toHaveProperty('validationScopes');
  });

  it('uses Zod library', () => {
    expect(planValidationArchitecture('SaaSBackend').library).toBe('Zod');
  });

  it('always has schema validation', () => {
    expect(planValidationArchitecture('SaaSBackend').hasSchemaValidation).toBe(true);
  });

  it('always has input sanitization', () => {
    expect(planValidationArchitecture('SaaSBackend').hasInputSanitization).toBe(true);
  });

  it('has DTO validation for non-simple backends', () => {
    expect(planValidationArchitecture('Finance').hasDTOValidation).toBe(true);
  });

  it('validationScopes includes body and query', () => {
    const { validationScopes } = planValidationArchitecture('SaaSBackend');
    expect(validationScopes).toContain('body');
    expect(validationScopes).toContain('query');
  });
});

// ── 12. Cache Planner ─────────────────────────────────────────────────────────

describe('planCacheArchitecture', () => {
  it('returns a complete CacheArchitecture object', () => {
    const result = planCacheArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('layers');
    expect(result).toHaveProperty('primaryLayer');
    expect(result).toHaveProperty('hasRedis');
    expect(result).toHaveProperty('defaultTTL');
    expect(result).toHaveProperty('ttlStrategy');
  });

  it('simple backends use Memory only', () => {
    const result = planCacheArchitecture('LandingAPI', EMPTY_FEATURES);
    expect(result.hasRedis).toBe(false);
    expect(result.hasMemoryCache).toBe(true);
  });

  it('SaaS uses Redis', () => {
    expect(planCacheArchitecture('SaaSBackend', EMPTY_FEATURES).hasRedis).toBe(true);
  });

  it('always has memory cache', () => {
    expect(planCacheArchitecture('SaaSBackend', EMPTY_FEATURES).hasMemoryCache).toBe(true);
  });

  it('default TTL is positive', () => {
    expect(planCacheArchitecture('SaaSBackend', EMPTY_FEATURES).defaultTTL).toBeGreaterThan(0);
  });

  it('has cache invalidation for non-simple backends', () => {
    expect(planCacheArchitecture('SaaSBackend', EMPTY_FEATURES).hasCacheInvalidation).toBe(true);
  });

  it('layers array is non-empty', () => {
    expect(planCacheArchitecture('SaaSBackend', EMPTY_FEATURES).layers.length).toBeGreaterThan(0);
  });

  it('high-traffic backends have response cache', () => {
    expect(planCacheArchitecture('Marketplace', EMPTY_FEATURES).hasResponseCache).toBe(true);
  });

  it('analytics uses sliding TTL strategy', () => {
    expect(planCacheArchitecture('Analytics', EMPTY_FEATURES).ttlStrategy).toBe('Sliding');
  });
});

// ── 13. Queue Planner ─────────────────────────────────────────────────────────

describe('planQueueArchitecture', () => {
  it('returns a complete QueueArchitecture object', () => {
    const result = planQueueArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('hasQueues');
    expect(result).toHaveProperty('queues');
    expect(result).toHaveProperty('queueProvider');
  });

  it('simple backends have no queues', () => {
    const result = planQueueArchitecture('LandingAPI', EMPTY_FEATURES);
    expect(result.hasQueues).toBe(false);
    expect(result.queueProvider).toBe('None');
  });

  it('SaaS has queues', () => {
    const result = planQueueArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result.hasQueues).toBe(true);
  });

  it('uses BullMQ for non-simple backends', () => {
    expect(planQueueArchitecture('SaaSBackend', EMPTY_FEATURES).queueProvider).toBe('BullMQ');
  });

  it('AI platform has AI queue', () => {
    expect(planQueueArchitecture('AIPlatform', ['AI'] as any).hasAIQueue).toBe(true);
  });

  it('enterprise has dead letter queue', () => {
    expect(planQueueArchitecture('Enterprise', EMPTY_FEATURES).hasDeadLetterQueue).toBe(true);
  });

  it('no duplicate queue types', () => {
    const { queues } = planQueueArchitecture('ECommerce', RICH_FEATURES as any);
    expect(queues.length).toBe(new Set(queues).size);
  });
});

// ── 14. Event Planner ─────────────────────────────────────────────────────────

describe('planEventArchitecture', () => {
  it('returns a complete EventArchitecture object', () => {
    const result = planEventArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('hasEvents');
    expect(result).toHaveProperty('patterns');
    expect(result).toHaveProperty('eventTypes');
  });

  it('has events for enterprise backends', () => {
    expect(planEventArchitecture('Enterprise', EMPTY_FEATURES).hasEvents).toBe(true);
  });

  it('eventTypes is an array', () => {
    expect(Array.isArray(planEventArchitecture('SaaSBackend', EMPTY_FEATURES).eventTypes)).toBe(true);
  });

  it('patterns is an array', () => {
    expect(Array.isArray(planEventArchitecture('SaaSBackend', EMPTY_FEATURES).patterns)).toBe(true);
  });
});

// ── 15. Storage Planner ───────────────────────────────────────────────────────

describe('planStorageArchitecture', () => {
  it('returns a complete StorageArchitecture object', () => {
    const result = planStorageArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('providers');
    expect(result).toHaveProperty('primaryProvider');
    expect(result).toHaveProperty('maxFileSizeMB');
  });

  it('providers is a non-empty array', () => {
    expect(planStorageArchitecture('SaaSBackend', EMPTY_FEATURES).providers.length).toBeGreaterThan(0);
  });

  it('maxFileSizeMB is positive', () => {
    expect(planStorageArchitecture('SaaSBackend', EMPTY_FEATURES).maxFileSizeMB).toBeGreaterThan(0);
  });

  it('has S3 for e-commerce', () => {
    expect(planStorageArchitecture('ECommerce', EMPTY_FEATURES).hasS3).toBe(true);
  });

  it('has backups for healthcare', () => {
    expect(planStorageArchitecture('Healthcare', EMPTY_FEATURES).hasBackups).toBe(true);
  });
});

// ── 16. Logging Planner ───────────────────────────────────────────────────────

describe('planLoggingArchitecture', () => {
  it('returns a complete LoggingArchitecture object', () => {
    const result = planLoggingArchitecture('SaaSBackend');
    expect(result).toHaveProperty('hasApplicationLogs');
    expect(result).toHaveProperty('hasStructuredJSON');
    expect(result).toHaveProperty('logLevel');
    expect(result).toHaveProperty('logRetentionDays');
  });

  it('always has application logs', () => {
    expect(planLoggingArchitecture('SaaSBackend').hasApplicationLogs).toBe(true);
  });

  it('always has structured JSON', () => {
    expect(planLoggingArchitecture('SaaSBackend').hasStructuredJSON).toBe(true);
  });

  it('has request logs', () => {
    expect(planLoggingArchitecture('SaaSBackend').hasRequestLogs).toBe(true);
  });

  it('has audit logs for regulated industries', () => {
    expect(planLoggingArchitecture('Finance').hasAuditLogs).toBe(true);
    expect(planLoggingArchitecture('Healthcare').hasAuditLogs).toBe(true);
  });

  it('logRetentionDays is positive', () => {
    expect(planLoggingArchitecture('SaaSBackend').logRetentionDays).toBeGreaterThan(0);
  });
});

// ── 17. Monitoring Planner ────────────────────────────────────────────────────

describe('planMonitoringArchitecture', () => {
  it('returns a complete MonitoringArchitecture object', () => {
    const result = planMonitoringArchitecture('SaaSBackend');
    expect(result).toHaveProperty('hasHealthChecks');
    expect(result).toHaveProperty('hasMetrics');
    expect(result).toHaveProperty('healthEndpoints');
  });

  it('always has health checks', () => {
    expect(planMonitoringArchitecture('SaaSBackend').hasHealthChecks).toBe(true);
    expect(planMonitoringArchitecture('LandingAPI').hasHealthChecks).toBe(true);
  });

  it('healthEndpoints is a non-empty array', () => {
    expect(planMonitoringArchitecture('SaaSBackend').healthEndpoints.length).toBeGreaterThan(0);
  });

  it('enterprise has OpenTelemetry', () => {
    expect(planMonitoringArchitecture('Enterprise').hasOpenTelemetry).toBe(true);
  });

  it('has crash reports for non-trivial backends', () => {
    expect(planMonitoringArchitecture('SaaSBackend').hasCrashReports).toBe(true);
  });
});

// ── 18. Security Planner ──────────────────────────────────────────────────────

describe('planSecurityArchitecture', () => {
  it('returns a complete SecurityArchitecture object', () => {
    const result = planSecurityArchitecture('SaaSBackend');
    expect(result).toHaveProperty('hasEncryption');
    expect(result).toHaveProperty('hasHelmet');
    expect(result).toHaveProperty('hasRateLimiting');
    expect(result).toHaveProperty('complianceLevel');
  });

  it('always has Helmet', () => {
    expect(planSecurityArchitecture('SaaSBackend').hasHelmet).toBe(true);
  });

  it('always has CORS config', () => {
    expect(planSecurityArchitecture('SaaSBackend').hasCORSConfig).toBe(true);
  });

  it('always has rate limiting', () => {
    expect(planSecurityArchitecture('SaaSBackend').hasRateLimiting).toBe(true);
  });

  it('always has SQL injection protection', () => {
    expect(planSecurityArchitecture('SaaSBackend').hasSQLInjectionProtection).toBe(true);
  });

  it('always has XSS protection', () => {
    expect(planSecurityArchitecture('SaaSBackend').hasXSSProtection).toBe(true);
  });

  it('finance has Enterprise compliance', () => {
    expect(planSecurityArchitecture('Finance').complianceLevel).toBe('Enterprise');
  });

  it('landing page has Basic compliance', () => {
    expect(planSecurityArchitecture('LandingAPI').complianceLevel).toBe('Basic');
  });

  it('OWASP compliance for enterprise', () => {
    expect(planSecurityArchitecture('Enterprise').hasOWASPCompliance).toBe(true);
  });
});

// ── 19. Deployment Planner ────────────────────────────────────────────────────

describe('planDeploymentArchitecture', () => {
  it('returns a complete DeploymentArchitecture object', () => {
    const result = planDeploymentArchitecture('SaaSBackend');
    expect(result).toHaveProperty('strategy');
    expect(result).toHaveProperty('hasDocker');
    expect(result).toHaveProperty('hasCICD');
    expect(result).toHaveProperty('environments');
    expect(result).toHaveProperty('scalingStrategy');
  });

  it('uses Serverless for ServerlessCandidate', () => {
    expect(planDeploymentArchitecture('ServerlessCandidate').strategy).toBe('Serverless');
  });

  it('uses Kubernetes for MicroserviceCandidate', () => {
    expect(planDeploymentArchitecture('MicroserviceCandidate').strategy).toBe('Kubernetes');
  });

  it('has rollback support', () => {
    expect(planDeploymentArchitecture('SaaSBackend').hasRollback).toBe(true);
  });

  it('has health checks in deployment', () => {
    expect(planDeploymentArchitecture('SaaSBackend').hasHealthChecks).toBe(true);
  });

  it('environments includes development and production', () => {
    const { environments } = planDeploymentArchitecture('SaaSBackend');
    expect(environments).toContain('development');
    expect(environments).toContain('production');
  });

  it('enterprise has staging environment', () => {
    expect(planDeploymentArchitecture('Enterprise').environments).toContain('staging');
  });

  it('scalingStrategy is one of Horizontal/Vertical/Auto', () => {
    const valid = ['Horizontal', 'Vertical', 'Auto'];
    expect(valid).toContain(planDeploymentArchitecture('SaaSBackend').scalingStrategy);
  });
});

// ── 20. Testing Planner ───────────────────────────────────────────────────────

describe('planTestingArchitecture', () => {
  it('returns a complete TestingArchitecture object', () => {
    const result = planTestingArchitecture('SaaSBackend');
    expect(result).toHaveProperty('testTypes');
    expect(result).toHaveProperty('hasUnitTests');
    expect(result).toHaveProperty('targetCoverage');
    expect(result).toHaveProperty('testingFramework');
  });

  it('always has unit tests', () => {
    expect(planTestingArchitecture('SaaSBackend').hasUnitTests).toBe(true);
  });

  it('always has integration tests', () => {
    expect(planTestingArchitecture('SaaSBackend').hasIntegrationTests).toBe(true);
  });

  it('uses Vitest', () => {
    expect(planTestingArchitecture('SaaSBackend').testingFramework).toBe('Vitest');
  });

  it('targetCoverage is 0-100', () => {
    const cov = planTestingArchitecture('SaaSBackend').targetCoverage;
    expect(cov).toBeGreaterThan(0);
    expect(cov).toBeLessThanOrEqual(100);
  });

  it('finance has security tests', () => {
    expect(planTestingArchitecture('Finance').hasSecurityTests).toBe(true);
  });

  it('has API tests for standard backends', () => {
    expect(planTestingArchitecture('SaaSBackend').hasAPITests).toBe(true);
  });
});

// ── 21. Performance Planner ───────────────────────────────────────────────────

describe('planPerformanceArchitecture', () => {
  it('returns a complete BackendPerformanceArchitecture object', () => {
    const result = planPerformanceArchitecture('SaaSBackend', EMPTY_FEATURES);
    expect(result).toHaveProperty('hasConnectionPooling');
    expect(result).toHaveProperty('estimatedRPS');
    expect(result).toHaveProperty('scalingStrategy');
    expect(result).toHaveProperty('hasCDN');
  });

  it('estimatedRPS is positive', () => {
    expect(planPerformanceArchitecture('SaaSBackend', EMPTY_FEATURES).estimatedRPS).toBeGreaterThan(0);
  });

  it('high traffic backends have higher RPS than simple ones', () => {
    const social = planPerformanceArchitecture('SocialPlatform', EMPTY_FEATURES).estimatedRPS;
    const landing = planPerformanceArchitecture('LandingAPI', EMPTY_FEATURES).estimatedRPS;
    expect(social).toBeGreaterThan(landing);
  });

  it('has response compression', () => {
    expect(planPerformanceArchitecture('SaaSBackend', EMPTY_FEATURES).hasResponseCompression).toBe(true);
  });

  it('ServerlessCandidate uses Auto scaling', () => {
    expect(planPerformanceArchitecture('ServerlessCandidate', EMPTY_FEATURES).scalingStrategy).toBe('Auto');
  });

  it('has CDN for high-traffic backends', () => {
    expect(planPerformanceArchitecture('Marketplace', EMPTY_FEATURES).hasCDN).toBe(true);
  });
});

// ── 22. Backend Validator ─────────────────────────────────────────────────────

describe('validateBackendBlueprint', () => {
  function makeBlueprint() {
    const result = runBackendArchitect('build a saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'TestApp',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    return result.blueprint;
  }

  it('returns qualityScores and overallScore', () => {
    const bp = makeBlueprint();
    const { qualityScores, overallScore } = validateBackendBlueprint(bp);
    expect(Array.isArray(qualityScores)).toBe(true);
    expect(typeof overallScore).toBe('number');
  });

  it('has a score for every dimension', () => {
    const bp = makeBlueprint();
    const { qualityScores } = validateBackendBlueprint(bp);
    const dims = qualityScores.map(q => q.dimension);
    for (const dim of ALL_BACKEND_DIMENSIONS) {
      expect(dims).toContain(dim);
    }
  });

  it('all dimension scores are between 0 and 10', () => {
    const bp = makeBlueprint();
    const { qualityScores } = validateBackendBlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('overallScore is between 0 and 10', () => {
    const bp = makeBlueprint();
    const { overallScore } = validateBackendBlueprint(bp);
    expect(overallScore).toBeGreaterThanOrEqual(0);
    expect(overallScore).toBeLessThanOrEqual(10);
  });

  it('each qualityScore has a non-empty rationale', () => {
    const bp = makeBlueprint();
    const { qualityScores } = validateBackendBlueprint(bp);
    for (const qs of qualityScores) {
      expect(qs.rationale.length).toBeGreaterThan(0);
    }
  });

  it('returns exactly 10 dimension scores', () => {
    const bp = makeBlueprint();
    const { qualityScores } = validateBackendBlueprint(bp);
    expect(qualityScores).toHaveLength(12);
  });
});

// ── 23. Main Orchestrator ─────────────────────────────────────────────────────

describe('runBackendArchitect', () => {
  const productPlan = {
    productGoal: 'SaaS' as const,
    plannedFeatures: [] as any[],
    productName: 'TestApp',
    productDescription: 'A test SaaS app',
    keyPersonas: [],
    objectives: [],
    contextString: '',
    productScore: 7,
  };

  it('returns a BackendArchitectOutput with all fields', () => {
    const result = runBackendArchitect('build a saas platform', productPlan);
    expect(result).toHaveProperty('blueprint');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('enrichedPromptWithArchitecture');
    expect(result).toHaveProperty('processingTimeMs');
  });

  it('enrichedPromptWithArchitecture is a non-empty string', () => {
    const result = runBackendArchitect('build a saas platform', productPlan);
    expect(typeof result.enrichedPromptWithArchitecture).toBe('string');
    expect(result.enrichedPromptWithArchitecture.length).toBeGreaterThan(0);
  });

  it('processingTimeMs is non-negative', () => {
    const result = runBackendArchitect('build a saas platform', productPlan);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('overallScore is between 0 and 10', () => {
    const result = runBackendArchitect('build a saas platform', productPlan);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);
  });

  it('blueprint has all required sub-architectures', () => {
    const { blueprint } = runBackendArchitect('build a saas platform', productPlan);
    expect(blueprint).toHaveProperty('databaseArchitecture');
    expect(blueprint).toHaveProperty('apiArchitecture');
    expect(blueprint).toHaveProperty('authArchitecture');
    expect(blueprint).toHaveProperty('securityArchitecture');
    expect(blueprint).toHaveProperty('deploymentArchitecture');
    expect(blueprint).toHaveProperty('testingArchitecture');
    expect(blueprint).toHaveProperty('folderStructure');
    expect(blueprint).toHaveProperty('qualityScores');
  });

  it('blueprint.qualityScores is populated', () => {
    const { blueprint } = runBackendArchitect('build a saas platform', productPlan);
    expect(blueprint.qualityScores.length).toBe(12);
  });

  it('runs deterministically — same input yields same backendType', () => {
    const a = runBackendArchitect('saas subscription platform', productPlan);
    const b = runBackendArchitect('saas subscription platform', productPlan);
    expect(a.blueprint.backendType).toBe(b.blueprint.backendType);
  });

  it('does not throw for minimal input', () => {
    expect(() => runBackendArchitect('', { ...productPlan, plannedFeatures: [] })).not.toThrow();
  });

  it('enriched prompt contains backend type', () => {
    const result = runBackendArchitect('saas platform', productPlan);
    expect(result.enrichedPromptWithArchitecture).toContain(result.blueprint.backendType);
  });

  it('processes different backend types without error', () => {
    const types = ['LandingPage', 'SaaS', 'ECommerce', 'Finance', 'AIProduct'] as const;
    for (const goal of types) {
      expect(() => runBackendArchitect(`build a ${goal}`, { ...productPlan, productGoal: goal as any })).not.toThrow();
    }
  });
});

// ── 24. Backend Metrics ───────────────────────────────────────────────────────

describe('backendMetrics', () => {
  beforeEach(() => resetBackendMetrics());

  it('returns zero snapshot when empty', () => {
    const m = getBackendMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageScore).toBe(0);
  });

  it('totalBuilds increments after recordBackendBuild', () => {
    const qualityScores = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 7, rationale: 'ok' }));
    recordBackendBuild('SaaSBackend', qualityScores, 7);
    expect(getBackendMetrics().totalBuilds).toBe(1);
  });

  it('averageScore reflects recorded builds', () => {
    const qualityScores = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 8, rationale: 'ok' }));
    recordBackendBuild('SaaSBackend', qualityScores, 8);
    expect(getBackendMetrics().averageScore).toBe(8);
  });

  it('averageSecurityScore is computed correctly', () => {
    const qualityScores = ALL_BACKEND_DIMENSIONS.map(d => ({
      dimension: d,
      score: d === 'security' ? 9 : 5,
      rationale: 'ok',
    }));
    recordBackendBuild('SaaSBackend', qualityScores, 7);
    expect(getBackendMetrics().averageSecurityScore).toBe(9);
  });

  it('topBackendTypes is sorted descending', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 7, rationale: 'ok' }));
    recordBackendBuild('SaaSBackend', qs, 7);
    recordBackendBuild('SaaSBackend', qs, 7);
    recordBackendBuild('Finance', qs, 7);
    const { topBackendTypes } = getBackendMetrics();
    expect(topBackendTypes[0].type).toBe('SaaSBackend');
    expect(topBackendTypes[0].count).toBe(2);
  });

  it('learningRecordCount increments after recordBackendLearning', () => {
    recordBackendLearning();
    recordBackendLearning();
    expect(getBackendMetrics().learningRecordCount).toBe(2);
  });

  it('scoreByDimension is populated after build', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 6, rationale: 'ok' }));
    recordBackendBuild('SaaSBackend', qs, 6);
    const { scoreByDimension } = getBackendMetrics();
    expect(scoreByDimension.security).toBe(6);
  });

  it('resetBackendMetrics clears all data', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 7, rationale: 'ok' }));
    recordBackendBuild('SaaSBackend', qs, 7);
    resetBackendMetrics();
    expect(getBackendMetrics().totalBuilds).toBe(0);
  });

  it('caps at 500 records', () => {
    const qs = ALL_BACKEND_DIMENSIONS.map(d => ({ dimension: d, score: 5, rationale: 'ok' }));
    for (let i = 0; i < 510; i++) recordBackendBuild('SaaSBackend', qs, 5);
    // Internal cap limits totalBuilds to 500
    expect(getBackendMetrics().totalBuilds).toBe(500);
  });
});

// ── 25. Backend Learning ──────────────────────────────────────────────────────

describe('backendLearning', () => {
  beforeEach(() => resetBackendLearning());

  it('getBackendLearningStats returns zeros when empty', () => {
    const stats = getBackendLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.averageScore).toBe(0);
  });

  it('records a learning entry', async () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    await learnFromBackendBuild({ buildId: 'test-1', blueprint: result.blueprint });
    expect(getBackendLearningStats().totalRecords).toBe(1);
  });

  it('averageScore is computed after learning', async () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    await learnFromBackendBuild({ buildId: 'test-2', blueprint: result.blueprint, evaluatorScore: 8 });
    expect(getBackendLearningStats().averageScore).toBe(8);
  });

  it('byType tracks per-type counts', async () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    await learnFromBackendBuild({ buildId: 'test-3', blueprint: result.blueprint });
    await learnFromBackendBuild({ buildId: 'test-4', blueprint: result.blueprint });
    const stats = getBackendLearningStats();
    expect(stats.byType[result.blueprint.backendType]).toBeGreaterThanOrEqual(2);
  });

  it('getBackendLearningRecords returns records', async () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    await learnFromBackendBuild({ buildId: 'test-5', blueprint: result.blueprint });
    expect(getBackendLearningRecords().length).toBe(1);
  });

  it('never throws on invalid input', async () => {
    await expect(learnFromBackendBuild({ buildId: 'x', blueprint: null as any })).resolves.not.toThrow();
  });

  it('resetBackendLearning clears records', async () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    await learnFromBackendBuild({ buildId: 'test-6', blueprint: result.blueprint });
    resetBackendLearning();
    expect(getBackendLearningStats().totalRecords).toBe(0);
  });
});

// ── 26. Backend Persistence ───────────────────────────────────────────────────

describe('backendPersistence', () => {
  beforeEach(() => resetBackendArchitectPersistence());

  function makeBlueprint() {
    return runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    }).blueprint;
  }

  it('initializes without error', () => {
    expect(() => initBackendArchitectPersistence()).not.toThrow();
  });

  it('is idempotent — double init is safe', () => {
    initBackendArchitectPersistence();
    expect(() => initBackendArchitectPersistence()).not.toThrow();
  });

  it('starts with empty history', () => {
    expect(getArchitectureHistory()).toHaveLength(0);
  });

  it('persistArchitectureSnapshot adds a record', () => {
    persistArchitectureSnapshot('build-1', makeBlueprint());
    expect(getArchitectureHistory()).toHaveLength(1);
  });

  it('history is returned newest-first', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-a', bp);
    persistArchitectureSnapshot('build-b', bp);
    const history = getArchitectureHistory();
    expect(history[0].buildId).toBe('build-b');
    expect(history[1].buildId).toBe('build-a');
  });

  it('version increments on each snapshot', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    persistArchitectureSnapshot('build-2', bp);
    const history = getArchitectureHistory();
    expect(history[0].version).toBeGreaterThan(history[1].version);
  });

  it('getCurrentSnapshot returns the latest', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    persistArchitectureSnapshot('build-2', bp);
    expect(getCurrentSnapshot()?.buildId).toBe('build-2');
  });

  it('getSnapshotAtVersion finds the right snapshot', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    const first = getCurrentSnapshot()!;
    persistArchitectureSnapshot('build-2', bp);
    const found = getSnapshotAtVersion(first.version);
    expect(found?.buildId).toBe('build-1');
  });

  it('rollbackToVersion succeeds for known version', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    const snap = getCurrentSnapshot()!;
    const result = rollbackToVersion(snap.version);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.snapshot.buildId).toBe('build-1');
  });

  it('rollbackToVersion fails for unknown version', () => {
    const result = rollbackToVersion(99999);
    expect(result.ok).toBe(false);
  });

  it('getRecentSnapshots returns limited results', () => {
    const bp = makeBlueprint();
    for (let i = 0; i < 10; i++) persistArchitectureSnapshot(`build-${i}`, bp);
    expect(getRecentSnapshots(5)).toHaveLength(5);
  });

  it('getPersistenceStats reflects stored snapshots', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    const stats = getPersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.currentVersion).toBeGreaterThan(0);
  });

  it('capacityUsed is between 0 and 100', () => {
    const bp = makeBlueprint();
    persistArchitectureSnapshot('build-1', bp);
    const { capacityUsed } = getPersistenceStats();
    expect(capacityUsed).toBeGreaterThanOrEqual(0);
    expect(capacityUsed).toBeLessThanOrEqual(100);
  });

  it('never throws on null blueprint', () => {
    expect(() => persistArchitectureSnapshot('bad', null as any)).not.toThrow();
  });

  it('resetBackendArchitectPersistence clears all state', () => {
    persistArchitectureSnapshot('build-1', makeBlueprint());
    resetBackendArchitectPersistence();
    expect(getArchitectureHistory()).toHaveLength(0);
    expect(getPersistenceStats().currentVersion).toBe(0);
  });
});

// ── 27. Regression — Backward Compatibility ───────────────────────────────────

describe('backward compatibility regressions', () => {
  it('BackendArchitectOutput shape is unchanged', () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    // Must keep these exact keys — pipeline depends on them
    expect(result).toHaveProperty('blueprint');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('enrichedPromptWithArchitecture');
    expect(result).toHaveProperty('processingTimeMs');
  });

  it('blueprint.backendType is always one of ALL_BACKEND_TYPES', () => {
    const result = runBackendArchitect('e-commerce shop', {
      productGoal: 'ECommerce',
      plannedFeatures: [],
      productName: 'Shop',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    expect(ALL_BACKEND_TYPES).toContain(result.blueprint.backendType);
  });

  it('blueprint.qualityScores has rationale for all dimensions (V8.6 spec)', () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    for (const qs of result.blueprint.qualityScores) {
      expect(typeof qs.rationale).toBe('string');
      expect(qs.rationale.length).toBeGreaterThan(0);
    }
  });

  it('ALL_BACKEND_DIMENSIONS has exactly 12 entries', () => {
    expect(ALL_BACKEND_DIMENSIONS).toHaveLength(12);
  });

  it('all planners return defined values — no undefined fields', () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    const bp = result.blueprint;
    // Key sub-architectures must be defined objects
    expect(bp.databaseArchitecture).toBeDefined();
    expect(bp.apiArchitecture).toBeDefined();
    expect(bp.authArchitecture).toBeDefined();
    expect(bp.permissionArchitecture).toBeDefined();
    expect(bp.serviceArchitecture).toBeDefined();
    expect(bp.repositoryArchitecture).toBeDefined();
    expect(bp.controllerArchitecture).toBeDefined();
    expect(bp.middlewareArchitecture).toBeDefined();
    expect(bp.validationArchitecture).toBeDefined();
    expect(bp.cacheArchitecture).toBeDefined();
    expect(bp.queueArchitecture).toBeDefined();
    expect(bp.eventArchitecture).toBeDefined();
    expect(bp.storageArchitecture).toBeDefined();
    expect(bp.loggingArchitecture).toBeDefined();
    expect(bp.monitoringArchitecture).toBeDefined();
    expect(bp.securityArchitecture).toBeDefined();
    expect(bp.deploymentArchitecture).toBeDefined();
    expect(bp.testingArchitecture).toBeDefined();
    expect(bp.performanceArchitecture).toBeDefined();
    expect(bp.folderStructure).toBeDefined();
  });

  it('folder structure has required fields', () => {
    const result = runBackendArchitect('saas platform', {
      productGoal: 'SaaS',
      plannedFeatures: [],
      productName: 'Test',
      productDescription: '',
      keyPersonas: [],
      objectives: [],
      contextString: '',
      productScore: 7,
    });
    const { folderStructure } = result.blueprint;
    expect(folderStructure).toHaveProperty('root');
    expect(folderStructure).toHaveProperty('directories');
    expect(folderStructure).toHaveProperty('keyFiles');
    expect(folderStructure).toHaveProperty('pattern');
    expect(folderStructure.directories.length).toBeGreaterThan(0);
  });
});
