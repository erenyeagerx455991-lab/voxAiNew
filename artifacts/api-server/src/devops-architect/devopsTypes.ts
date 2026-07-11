// ── V8.7 DevOps & Infrastructure Architect — Type Definitions ─────────────────

import type { BackendType } from '../backend-architect/backendTypes.js';
export type { BackendType };

// ── Primitive enumerations ────────────────────────────────────────────────────

export type InfrastructureType =
  | 'SingleServer' | 'Docker' | 'DockerCompose' | 'Kubernetes'
  | 'Serverless' | 'Edge' | 'Hybrid' | 'MultiCloud';

export type CloudProvider =
  | 'AWS' | 'Azure' | 'GCP' | 'Cloudflare' | 'DigitalOcean'
  | 'Railway' | 'FlyIo' | 'Vercel' | 'SelfHosted';

export type CICDProvider = 'GitHubActions' | 'GitLabCI' | 'CircleCI' | 'Jenkins';

export type LoadBalancingStrategy =
  | 'RoundRobin' | 'LeastConnections' | 'GeoRouting' | 'StickySessions';

export type ScalingType = 'Horizontal' | 'Vertical' | 'Queue' | 'AIWorker';

export type EnvironmentName = 'local' | 'development' | 'staging' | 'production';

export type LogFormat = 'JSON' | 'Text' | 'Structured';

export type BackupFrequency = 'Continuous' | 'Hourly' | 'Daily' | 'Weekly';

export type RecoveryTier = 'Hot' | 'Warm' | 'Cold';

export type ContainerRegistry = 'DockerHub' | 'ECR' | 'GCR' | 'GHCR' | 'ACR';

export type DeploymentStrategy = 'Rolling' | 'BlueGreen' | 'Canary' | 'Recreate';

export type ReverseProxyType = 'Nginx' | 'Caddy' | 'Traefik' | 'CloudFront' | 'None';

export type SecretProvider =
  | 'Vault' | 'AWSSecretsManager' | 'GCPSecretManager'
  | 'AzureKeyVault' | 'EnvFile' | 'Kubernetes';

export type LogAggregator =
  | 'CloudWatch' | 'ELK' | 'Loki' | 'Datadog' | 'Stdout';

// ── Sub-Blueprint Interfaces ───────────────────────────────────────────────────

export interface InfrastructureBlueprint {
  type:               InfrastructureType;
  confidence:         number;
  hasContainers:      boolean;
  hasOrchestration:   boolean;
  hasServiceMesh:     boolean;
  hasLoadBalancer:    boolean;
  hasCDN:             boolean;
  regions:            string[];
  replicaCount:       number;
}

export interface ContainerBlueprint {
  hasDockerfile:        boolean;
  hasMultiStage:        boolean;
  hasDistroless:        boolean;
  hasHealthCheck:       boolean;
  hasImageOptimization: boolean;
  baseImage:            string;
  registry:             ContainerRegistry;
  imageTag:             string;
  buildTarget:          string;
}

export interface DockerBlueprint {
  dockerfileStrategy: 'Single' | 'MultiStage' | 'Distroless';
  composeServices:    string[];
  hasDockerCompose:   boolean;
  hasNetworks:        boolean;
  hasVolumes:         boolean;
  hasHealthChecks:    boolean;
  exposedPorts:       number[];
  hasEnvFile:         boolean;
}

export interface KubernetesBlueprint {
  hasDeployment:          boolean;
  hasService:             boolean;
  hasIngress:             boolean;
  hasConfigMap:           boolean;
  hasSecret:              boolean;
  hasHPA:                 boolean;
  hasPVC:                 boolean;
  hasPodDisruptionBudget: boolean;
  namespace:              string;
  replicaCount:           number;
  resources: {
    requests: { cpu: string; memory: string };
    limits:   { cpu: string; memory: string };
  };
}

export interface CloudBlueprint {
  provider:            CloudProvider;
  region:              string;
  secondaryRegions:    string[];
  hasMultiRegion:      boolean;
  hasAutoScaling:      boolean;
  hasManagedDatabase:  boolean;
  hasManagedCache:     boolean;
  hasObjectStorage:    boolean;
  hasCDN:              boolean;
  rationale:           string;
}

export interface NetworkBlueprint {
  hasCDN:            boolean;
  hasDNS:            boolean;
  hasHTTPS:          boolean;
  hasTLS:            boolean;
  tlsVersion:        '1.2' | '1.3';
  hasFirewall:       boolean;
  hasReverseProxy:   boolean;
  reverseProxyType:  ReverseProxyType;
  hasDDoSProtection: boolean;
  hasWAF:            boolean;
}

export interface CDNBlueprint {
  enabled:           boolean;
  provider:          'CloudFront' | 'Cloudflare' | 'Fastly' | 'Akamai' | 'None';
  hasEdgeCaching:    boolean;
  hasImageOptimize:  boolean;
  hasCompression:    boolean;
  cacheTTLSeconds:   number;
  rules:             string[];
}

export interface LoadBalancerBlueprint {
  strategy:            LoadBalancingStrategy;
  hasHealthChecks:     boolean;
  hasSSLTermination:   boolean;
  hasStickySession:    boolean;
  hasGeoRouting:       boolean;
  healthCheckPath:     string;
  healthCheckInterval: number;
}

export interface AutoScalingBlueprint {
  types:                ScalingType[];
  minReplicas:          number;
  maxReplicas:          number;
  targetCPUPercent:     number;
  targetMemoryPercent:  number;
  hasQueueScaling:      boolean;
  hasAIWorkerScaling:   boolean;
  cooldownSeconds:      number;
}

export interface CICDBlueprint {
  provider:        CICDProvider;
  stages:          string[];
  hasLint:         boolean;
  hasTests:        boolean;
  hasBuild:        boolean;
  hasSecurityScan: boolean;
  hasDeploy:       boolean;
  hasRollback:     boolean;
  hasCaching:      boolean;
  hasParallelJobs: boolean;
  branchStrategy:  'GitFlow' | 'Trunk' | 'FeatureBranch';
  deployStrategy:  DeploymentStrategy;
}

export interface EnvironmentBlueprint {
  environments:        EnvironmentName[];
  hasFeatureFlags:     boolean;
  hasSecretManagement: boolean;
  hasEnvValidation:    boolean;
  variables:           string[];
  secretCount:         number;
}

export interface SecretBlueprint {
  provider:             SecretProvider;
  hasRotation:          boolean;
  hasAuditLog:          boolean;
  hasEncryptionAtRest:  boolean;
  secretCategories:     string[];
}

export interface DevOpsDeploymentBlueprint {
  strategy:          DeploymentStrategy;
  hasBlueGreen:      boolean;
  hasCanary:         boolean;
  hasRolling:        boolean;
  hasZeroDowntime:   boolean;
  hasAutomatedTests: boolean;
  rollbackTimeMin:   number;
}

export interface MonitoringBlueprint {
  hasPrometheus:        boolean;
  hasGrafana:           boolean;
  hasOpenTelemetry:     boolean;
  hasMetrics:           boolean;
  hasTracing:           boolean;
  hasLogs:              boolean;
  metricsRetentionDays: number;
  tracingSampleRate:    number;
  dashboards:           string[];
}

export interface LoggingBlueprint {
  format:          LogFormat;
  hasJSONLogs:     boolean;
  hasRequestLogs:  boolean;
  hasAuditLogs:    boolean;
  hasErrorLogs:    boolean;
  hasAILogs:       boolean;
  retentionDays:   number;
  aggregator:      LogAggregator;
}

export interface AlertBlueprint {
  alerts:               string[];
  hasCPUAlert:          boolean;
  hasMemoryAlert:       boolean;
  hasLatencyAlert:      boolean;
  hasErrorRateAlert:    boolean;
  hasQueueBacklogAlert: boolean;
  hasDatabaseAlert:     boolean;
  hasAPIAlert:          boolean;
  channels:             string[];
  oncallRotation:       boolean;
}

export interface BackupBlueprint {
  hasDatabaseBackup:       boolean;
  hasObjectStorageBackup:  boolean;
  hasSnapshotStrategy:     boolean;
  hasRetentionPolicy:      boolean;
  frequency:               BackupFrequency;
  retentionDays:           number;
  crossRegion:             boolean;
  encryption:              boolean;
}

export interface RecoveryBlueprint {
  rtoMinutes:           number;
  rpoMinutes:           number;
  tier:                 RecoveryTier;
  hasFailover:          boolean;
  hasMultiRegion:       boolean;
  hasRunbook:           boolean;
  hasGameDay:           boolean;
  hasAutomatedFailover: boolean;
}

export interface CostBlueprint {
  estimatedMonthlyUSD:    number;
  compute:                number;
  storage:                number;
  bandwidth:              number;
  aiInference:            number;
  cache:                  number;
  monitoring:             number;
  optimizationSuggestions:string[];
  savingsOpportunities:   string[];
}

export interface DevOpsSecurityBlueprint {
  hasSecretRotation:       boolean;
  hasIAM:                  boolean;
  hasKMS:                  boolean;
  hasEncryption:           boolean;
  hasWAF:                  boolean;
  hasDDoSProtection:       boolean;
  hasRateLimiting:         boolean;
  hasVulnerabilityScanning:boolean;
  hasImageScanning:        boolean;
  complianceLevel:         'Basic' | 'Standard' | 'Enterprise';
}

export interface DevOpsPerformanceBlueprint {
  hasCDNCache:         boolean;
  hasRedis:            boolean;
  hasCompression:      boolean;
  hasImageOptimization:boolean;
  hasHTTP2:            boolean;
  hasHTTP3:            boolean;
  edgeCaching:         boolean;
  targetP99LatencyMs:  number;
}

// ── Quality Scoring ────────────────────────────────────────────────────────────

export const ALL_DEVOPS_DIMENSIONS = [
  'infrastructure', 'security', 'performance', 'reliability',
  'scalability', 'cost', 'monitoring', 'deployment', 'recovery',
] as const;

export type DevOpsDimension = typeof ALL_DEVOPS_DIMENSIONS[number];

export interface DevOpsQualityScore {
  dimension: DevOpsDimension;
  score:     number;
  rationale: string;
}

// ── Main DevOps Blueprint ──────────────────────────────────────────────────────

export interface DevOpsBlueprint {
  infrastructureType:       InfrastructureType;
  infrastructureConfidence: number;
  infrastructure:           InfrastructureBlueprint;
  container:                ContainerBlueprint;
  docker:                   DockerBlueprint;
  kubernetes:               KubernetesBlueprint;
  cloud:                    CloudBlueprint;
  network:                  NetworkBlueprint;
  cdn:                      CDNBlueprint;
  loadBalancer:             LoadBalancerBlueprint;
  autoScaling:              AutoScalingBlueprint;
  cicd:                     CICDBlueprint;
  environments:             EnvironmentBlueprint;
  secrets:                  SecretBlueprint;
  deployment:               DevOpsDeploymentBlueprint;
  monitoring:               MonitoringBlueprint;
  logging:                  LoggingBlueprint;
  alerts:                   AlertBlueprint;
  backup:                   BackupBlueprint;
  recovery:                 RecoveryBlueprint;
  cost:                     CostBlueprint;
  security:                 DevOpsSecurityBlueprint;
  performance:              DevOpsPerformanceBlueprint;
  qualityScores:            DevOpsQualityScore[];
  overallScore:             number;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface DevOpsArchitectOutput {
  blueprint:                DevOpsBlueprint;
  overallScore:             number;
  enrichedPromptWithDevOps: string;
  processingTimeMs:         number;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface DevOpsLearningRecord {
  buildId:            string;
  infrastructureType: InfrastructureType;
  cloudProvider:      CloudProvider;
  overallScore:       number;
  securityScore:      number;
  reliabilityScore:   number;
  improved:           boolean;
  recordedAt:         number;
}

export interface DevOpsLearningInput {
  buildId:         string;
  blueprint:       DevOpsBlueprint;
  evaluatorScore?: number;
}
