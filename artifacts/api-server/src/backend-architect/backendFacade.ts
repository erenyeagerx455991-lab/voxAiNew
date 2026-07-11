// ── V8.6 Backend Architect — Public API Facade ────────────────────────────────

export type {
  BackendType,
  DatabaseType,
  APIStyle,
  AuthStrategy,
  AuthRole,
  PermissionModel,
  CacheLayer,
  QueueType,
  StorageProvider,
  ValidationLibrary,
  DeploymentStrategy,
  ScalingStrategy,
  RepositoryPattern,
  DatabaseArchitecture,
  APIArchitecture,
  AuthArchitecture,
  PermissionArchitecture,
  ServiceArchitecture,
  RepositoryArchitecture,
  ControllerArchitecture,
  MiddlewareArchitecture,
  ValidationArchitecture,
  CacheArchitecture,
  QueueArchitecture,
  EventArchitecture,
  StorageArchitecture,
  LoggingArchitecture,
  MonitoringArchitecture,
  SecurityArchitecture,
  DeploymentArchitecture,
  TestingArchitecture,
  BackendPerformanceArchitecture,
  BackendFolderStructure,
  BackendArchitectureDimension,
  BackendQualityScore,
  BackendArchitectureBlueprint,
  BackendArchitectOutput,
  BackendLearningRecord,
  BackendLearningInput,
} from './backendTypes.js';

export { ALL_BACKEND_TYPES, ALL_BACKEND_DIMENSIONS } from './backendTypes.js';

export { classifyBackendType, isEnterpriseBackend, isHighTrafficBackend, isSimpleBackend } from './backendPlanner.js';
export { planDatabaseArchitecture }    from './databasePlanner.js';
export { planAPIArchitecture }         from './apiPlanner.js';
export { planAuthArchitecture }                          from './authPlanner.js';
export { planAuthenticationArchitecture }                from './authenticationPlanner.js';
export { planPermissionArchitecture }                    from './permissionPlanner.js';
export { planAuthorizationArchitecture }                 from './authorizationPlanner.js';
export { planServiceLayer }            from './servicePlanner.js';
export { planRepositoryLayer }         from './repositoryPlanner.js';
export { planControllerArchitecture }  from './controllerPlanner.js';
export { planMiddlewareArchitecture }  from './middlewarePlanner.js';
export { planValidationArchitecture }  from './validationPlanner.js';
export { planCacheArchitecture }       from './cachePlanner.js';
export { planQueueArchitecture }       from './queuePlanner.js';
export { planEventArchitecture }       from './eventPlanner.js';
export { planStorageArchitecture }     from './storagePlanner.js';
export { planLoggingArchitecture }     from './loggingPlanner.js';
export { planMonitoringArchitecture }  from './monitoringPlanner.js';
export { planSecurityArchitecture }    from './securityPlanner.js';
export { planDeploymentArchitecture }  from './deploymentPlanner.js';
export { planTestingArchitecture }     from './testingPlanner.js';
export { planPerformanceArchitecture } from './performancePlanner.js';
export { validateBackendBlueprint }    from './backendValidator.js';
export { getBackendMetrics, recordBackendBuild, recordBackendLearning, resetBackendMetrics } from './backendMetrics.js';
export { learnFromBackendBuild, getBackendLearningStats, getBackendLearningRecords, resetBackendLearning } from './backendLearning.js';
export {
  initBackendArchitectPersistence,
  resetBackendArchitectPersistence,
  persistArchitectureSnapshot,
  getArchitectureHistory,
  getRecentSnapshots,
  getSnapshotAtVersion,
  getCurrentSnapshot,
  rollbackToVersion,
  getPersistenceStats,
} from './backendPersistence.js';
export type { ArchitectureSnapshot } from './backendPersistence.js';
export { runBackendArchitect }         from './backendArchitect.js';
