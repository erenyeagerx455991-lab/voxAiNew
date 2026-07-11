// ── V8.6 Backend Architect — Type Definitions ─────────────────────────────────

export const ALL_BACKEND_TYPES = [
  'LandingAPI', 'SaaSBackend', 'CRMBackend', 'ERPBackend', 'Marketplace',
  'ECommerce', 'Dashboard', 'InternalTool', 'BookingPlatform', 'Healthcare',
  'Finance', 'Education', 'DeveloperPlatform', 'Analytics', 'AIPlatform',
  'SocialPlatform', 'CMS', 'Documentation', 'Enterprise', 'MultiTenant',
  'MicroserviceCandidate', 'MonolithCandidate', 'ServerlessCandidate', 'APIGateway',
] as const;

export type BackendType = typeof ALL_BACKEND_TYPES[number];

export type DatabaseType =
  | 'PostgreSQL' | 'MySQL' | 'MongoDB' | 'Redis' | 'SQLite'
  | 'VectorDB'  | 'TimeSeries' | 'ObjectStorage' | 'Hybrid';

export type APIStyle = 'REST' | 'GraphQL' | 'tRPC' | 'WebSocket' | 'SSE' | 'Streaming' | 'Hybrid';

export type AuthStrategy = 'JWT' | 'Session' | 'OAuth' | 'MagicLink' | 'APIKey' | 'ServiceToken' | 'None';

export type AuthRole = 'Guest' | 'User' | 'Admin' | 'SuperAdmin' | 'Workspace' | 'Organization' | 'Team';

export type PermissionModel = 'RBAC' | 'ABAC' | 'Hybrid' | 'Simple';

export type CacheLayer = 'Redis' | 'Memory' | 'Edge' | 'Query' | 'Response' | 'CDN';

export type QueueType =
  | 'Email' | 'ImageProcessing' | 'AI' | 'Webhook'
  | 'Retry' | 'DeadLetter' | 'Priority' | 'Background';

export type StorageProvider = 'S3' | 'Cloudinary' | 'SupabaseStorage' | 'Local' | 'Blob';

export type ValidationLibrary = 'Zod' | 'Valibot' | 'Yup';

export type DeploymentStrategy = 'Docker' | 'DockerCompose' | 'Kubernetes' | 'Serverless' | 'PaaS';

export type ScalingStrategy = 'Horizontal' | 'Vertical' | 'Auto';

export type RepositoryPattern = 'Repository' | 'ActiveRecord' | 'QueryBuilder';

// ── Sub-Architecture Interfaces ────────────────────────────────────────────────

export interface DatabaseArchitecture {
  primary:            DatabaseType;
  secondary:          DatabaseType[];
  hasCache:           boolean;
  cacheType:          DatabaseType;
  hasMigrations:      boolean;
  hasSeeding:         boolean;
  hasIndexing:        boolean;
  hasPartitioning:    boolean;
  hasReplication:     boolean;
  connectionPooling:  boolean;
  ormChoice:          string;
  estimatedTables:    number;
}

export interface APIArchitecture {
  primaryStyle:      APIStyle;
  hasREST:           boolean;
  hasGraphQL:        boolean;
  hasTRPC:           boolean;
  hasWebSocket:      boolean;
  hasSSE:            boolean;
  hasStreaming:       boolean;
  hasPagination:     boolean;
  hasFiltering:      boolean;
  hasSorting:        boolean;
  hasSearch:         boolean;
  hasBulkAPIs:       boolean;
  hasHealthAPI:      boolean;
  hasVersioning:     boolean;
  hasRateLimiting:   boolean;
  apiPrefix:         string;
  versionPrefix:     string;
}

export interface AuthArchitecture {
  primaryStrategy:    AuthStrategy;
  strategies:         AuthStrategy[];
  roles:              AuthRole[];
  hasRefreshToken:    boolean;
  hasMultiTenant:     boolean;
  hasOrganizations:   boolean;
  hasWorkspaces:      boolean;
  hasAPIKeys:         boolean;
  hasOAuth:           boolean;
  oAuthProviders:     string[];
  sessionDuration:    string;
}

export interface PermissionArchitecture {
  model:                 PermissionModel;
  hasRBAC:               boolean;
  hasABAC:               boolean;
  hasFeatureFlags:       boolean;
  hasWorkspaceIsolation: boolean;
  hasTenantIsolation:    boolean;
  roleHierarchy:         string[];
  permissionCategories:  string[];
}

export interface ServiceArchitecture {
  services:                  string[];
  hasBusinessServices:       boolean;
  hasDomainServices:         boolean;
  hasUtilityServices:        boolean;
  hasIntegrationServices:    boolean;
  hasNotificationServices:   boolean;
  hasPaymentServices:        boolean;
  hasAIServices:             boolean;
  hasAnalyticsServices:      boolean;
  serviceCount:              number;
}

export interface RepositoryArchitecture {
  pattern:                RepositoryPattern;
  hasUnitOfWork:          boolean;
  hasTransactions:        boolean;
  hasDatabaseAbstraction: boolean;
  hasConnectionPooling:   boolean;
  repositories:           string[];
}

export interface ControllerArchitecture {
  controllers:               string[];
  hasValidation:             boolean;
  hasErrorHandling:          boolean;
  hasResponseNormalization:  boolean;
  controllerCount:           number;
}

export interface MiddlewareArchitecture {
  middlewares:    string[];
  hasAuth:        boolean;
  hasAuthZ:       boolean;
  hasLogging:     boolean;
  hasRateLimit:   boolean;
  hasCompression: boolean;
  hasCORS:        boolean;
  hasHelmet:      boolean;
  hasValidation:  boolean;
  hasRequestID:   boolean;
  hasTracing:     boolean;
  hasMetrics:     boolean;
}

export interface ValidationArchitecture {
  library:              ValidationLibrary;
  hasSchemaValidation:  boolean;
  hasDTOValidation:     boolean;
  hasRuntimeValidation: boolean;
  hasInputSanitization: boolean;
  validationScopes:     string[];
}

export interface CacheArchitecture {
  layers:               CacheLayer[];
  primaryLayer:         CacheLayer;
  hasRedis:             boolean;
  hasMemoryCache:       boolean;
  hasEdgeCache:         boolean;
  hasQueryCache:        boolean;
  hasResponseCache:     boolean;
  hasCDNCache:          boolean;
  hasCacheInvalidation: boolean;
  defaultTTL:           number;
  ttlStrategy:          'Fixed' | 'Sliding' | 'Dynamic';
}

export interface QueueArchitecture {
  hasQueues:           boolean;
  queues:              QueueType[];
  hasBackgroundJobs:   boolean;
  hasEmailQueue:       boolean;
  hasImageProcessing:  boolean;
  hasAIQueue:          boolean;
  hasWebhookQueue:     boolean;
  hasRetryQueue:       boolean;
  hasDeadLetterQueue:  boolean;
  hasPriorityQueue:    boolean;
  queueProvider:       'BullMQ' | 'Redis' | 'InMemory' | 'None';
}

export interface EventArchitecture {
  hasEvents:       boolean;
  patterns:        string[];
  hasEventSourcing:boolean;
  hasCQRS:         boolean;
  hasDomainEvents: boolean;
  eventTypes:      string[];
}

export interface StorageArchitecture {
  providers:          StorageProvider[];
  primaryProvider:    StorageProvider;
  hasS3:              boolean;
  hasCloudinary:      boolean;
  hasLocalStorage:    boolean;
  hasBackups:         boolean;
  hasImageProcessing: boolean;
  hasFileValidation:  boolean;
  maxFileSizeMB:      number;
}

export interface LoggingArchitecture {
  hasApplicationLogs:  boolean;
  hasAuditLogs:        boolean;
  hasSecurityLogs:     boolean;
  hasRequestLogs:      boolean;
  hasPerformanceLogs:  boolean;
  hasStructuredJSON:   boolean;
  logLevel:            'debug' | 'info' | 'warn' | 'error';
  logRetentionDays:    number;
  provider:            string;
}

export interface MonitoringArchitecture {
  hasHealthChecks:      boolean;
  hasMetrics:           boolean;
  hasTracing:           boolean;
  hasOpenTelemetry:     boolean;
  hasAlerts:            boolean;
  hasCrashReports:      boolean;
  hasSlowQueryDetection:boolean;
  healthEndpoints:      string[];
}

export interface SecurityArchitecture {
  hasEncryption:             boolean;
  hasHashing:                boolean;
  hasSecretManagement:       boolean;
  hasEnvValidation:          boolean;
  hasSQLInjectionProtection: boolean;
  hasXSSProtection:          boolean;
  hasCSRFProtection:         boolean;
  hasCORSConfig:             boolean;
  hasHelmet:                 boolean;
  hasRateLimiting:           boolean;
  hasInputSanitization:      boolean;
  hasOWASPCompliance:        boolean;
  complianceLevel:           'Basic' | 'Standard' | 'Enterprise';
}

export interface DeploymentArchitecture {
  strategy:           DeploymentStrategy;
  hasDocker:          boolean;
  hasDockerCompose:   boolean;
  hasKubernetes:      boolean;
  hasCICD:            boolean;
  environments:       string[];
  scalingStrategy:    ScalingStrategy;
  hasBlueGreen:       boolean;
  hasRollback:        boolean;
  hasHealthChecks:    boolean;
}

export interface TestingArchitecture {
  testTypes:             string[];
  hasUnitTests:          boolean;
  hasIntegrationTests:   boolean;
  hasAPITests:           boolean;
  hasRepositoryTests:    boolean;
  hasSecurityTests:      boolean;
  hasPerformanceTests:   boolean;
  hasLoadTests:          boolean;
  hasSmokeTests:         boolean;
  hasRegressionTests:    boolean;
  targetCoverage:        number;
  testingFramework:      string;
}

export interface BackendPerformanceArchitecture {
  hasConnectionPooling:    boolean;
  hasQueryOptimization:    boolean;
  hasNPlusOneProtection:   boolean;
  hasResponseCompression:  boolean;
  hasHTTP2:                boolean;
  estimatedRPS:            number;
  scalingStrategy:         ScalingStrategy;
  hasCDN:                  boolean;
}

export interface BackendFolderStructure {
  root:         string;
  directories:  string[];
  keyFiles:     string[];
  pattern:      'layered' | 'feature-first' | 'domain-driven' | 'microservice';
}

// ── Quality Scoring ────────────────────────────────────────────────────────────

export const ALL_BACKEND_DIMENSIONS = [
  'architecture', 'database', 'api', 'authentication', 'authorization',
  'security', 'performance', 'scalability', 'reliability',
  'maintainability', 'developerExperience', 'testability',
] as const;

export type BackendArchitectureDimension = typeof ALL_BACKEND_DIMENSIONS[number];

export interface BackendQualityScore {
  dimension: BackendArchitectureDimension;
  score:     number;
  rationale: string;
}

// ── Main Blueprint ─────────────────────────────────────────────────────────────

export interface BackendArchitectureBlueprint {
  backendType:              BackendType;
  backendTypeConfidence:    number;
  databaseArchitecture:     DatabaseArchitecture;
  apiArchitecture:          APIArchitecture;
  authArchitecture:         AuthArchitecture;
  permissionArchitecture:   PermissionArchitecture;
  serviceArchitecture:      ServiceArchitecture;
  repositoryArchitecture:   RepositoryArchitecture;
  controllerArchitecture:   ControllerArchitecture;
  middlewareArchitecture:   MiddlewareArchitecture;
  validationArchitecture:   ValidationArchitecture;
  cacheArchitecture:        CacheArchitecture;
  queueArchitecture:        QueueArchitecture;
  eventArchitecture:        EventArchitecture;
  storageArchitecture:      StorageArchitecture;
  loggingArchitecture:      LoggingArchitecture;
  monitoringArchitecture:   MonitoringArchitecture;
  securityArchitecture:     SecurityArchitecture;
  deploymentArchitecture:   DeploymentArchitecture;
  testingArchitecture:      TestingArchitecture;
  performanceArchitecture:  BackendPerformanceArchitecture;
  folderStructure:          BackendFolderStructure;
  overallScore:             number;
  qualityScores:            BackendQualityScore[];
}

export interface BackendArchitectOutput {
  blueprint:                     BackendArchitectureBlueprint;
  overallScore:                  number;
  enrichedPromptWithArchitecture: string;
  processingTimeMs:              number;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface BackendLearningRecord {
  buildId:       string;
  backendType:   BackendType;
  overallScore:  number;
  securityScore: number;
  databaseScore: number;
  apiScore:      number;
  improved:      boolean;
  recordedAt:    number;
}

export interface BackendLearningInput {
  buildId:        string;
  blueprint:      BackendArchitectureBlueprint;
  evaluatorScore?: number;
}
