// ── V8.7 DevOps Architect — Validator (9 dimensions, 0–10 each) ──────────────
import type {
  DevOpsBlueprint, DevOpsDimension, DevOpsQualityScore,
} from './devopsTypes.js';
import { ALL_DEVOPS_DIMENSIONS } from './devopsTypes.js';

function clamp(n: number): number { return Math.min(10, Math.max(0, Math.round(n * 10) / 10)); }
function score(cond: boolean, pts: number): number { return cond ? pts : 0; }

function scoreInfrastructure(bp: DevOpsBlueprint): number {
  let s = 2;
  s += score(bp.infrastructure.hasContainers, 1.5);
  s += score(bp.infrastructure.hasOrchestration, 1.5);
  s += score(bp.infrastructure.hasLoadBalancer, 1);
  s += score(bp.infrastructure.hasCDN, 0.5);
  s += score(bp.infrastructure.hasServiceMesh, 0.5);
  s += score(bp.infrastructure.regions.length > 1, 1);
  s += score(bp.infrastructure.replicaCount >= 2, 1);
  s += score(bp.kubernetes.hasHPA, 0.5);
  return clamp(s);
}

function scoreSecurity(bp: DevOpsBlueprint): number {
  let s = 1;
  s += score(bp.security.hasIAM, 1.5);
  s += score(bp.security.hasKMS, 1);
  s += score(bp.security.hasEncryption, 1);
  s += score(bp.security.hasWAF, 1);
  s += score(bp.security.hasDDoSProtection, 0.5);
  s += score(bp.security.hasRateLimiting, 0.5);
  s += score(bp.security.hasVulnerabilityScanning, 1);
  s += score(bp.security.hasImageScanning, 0.5);
  s += score(bp.security.hasSecretRotation, 0.5);
  s += score(bp.secrets.hasRotation, 0.5);
  s += score(bp.secrets.hasAuditLog, 0.5);
  return clamp(s);
}

function scorePerformance(bp: DevOpsBlueprint): number {
  let s = 2;
  s += score(bp.performance.hasHTTP2, 1);
  s += score(bp.performance.hasHTTP3, 0.5);
  s += score(bp.performance.hasRedis, 1.5);
  s += score(bp.performance.hasCDNCache, 1);
  s += score(bp.performance.hasCompression, 1);
  s += score(bp.performance.hasImageOptimization, 0.5);
  s += score(bp.performance.targetP99LatencyMs <= 200, 1.5);
  s += score(bp.cdn.enabled, 0.5);
  return clamp(s);
}

function scoreReliability(bp: DevOpsBlueprint): number {
  let s = 2;
  s += score(bp.monitoring.hasPrometheus, 1);
  s += score(bp.monitoring.hasGrafana, 0.5);
  s += score(bp.monitoring.hasOpenTelemetry, 0.5);
  s += score(bp.alerts.hasCPUAlert, 0.5);
  s += score(bp.alerts.hasErrorRateAlert, 0.5);
  s += score(bp.alerts.oncallRotation, 0.5);
  s += score(bp.loadBalancer.hasHealthChecks, 1);
  s += score(bp.cicd.hasRollback, 1);
  s += score(bp.deployment.hasZeroDowntime, 1.5);
  s += score(bp.kubernetes.hasPodDisruptionBudget, 0.5);
  return clamp(s);
}

function scoreScalability(bp: DevOpsBlueprint): number {
  let s = 2;
  s += score(bp.autoScaling.types.includes('Horizontal'), 2);
  s += score(bp.autoScaling.types.includes('Queue'), 1);
  s += score(bp.autoScaling.types.includes('AIWorker'), 0.5);
  s += score(bp.autoScaling.maxReplicas >= 5, 1);
  s += score(bp.cloud.hasMultiRegion, 1);
  s += score(bp.cloud.hasManagedDatabase, 0.5);
  s += score(bp.cloud.hasManagedCache, 0.5);
  s += score(bp.kubernetes.hasHPA, 1.5);
  return clamp(s);
}

function scoreCost(bp: DevOpsBlueprint): number {
  let s = 3;
  s += score(bp.cost.optimizationSuggestions.length >= 2, 2);
  s += score(bp.cost.savingsOpportunities.length >= 1, 1);
  s += score(bp.autoScaling.types.includes('Horizontal'), 1.5); // auto-scaling saves cost
  s += score(bp.cost.monitoring > 0 && bp.cost.monitoring < 50, 1); // monitoring proportional
  s += score(bp.cost.estimatedMonthlyUSD < 200, 0.5); // cost-effective
  return clamp(s);
}

function scoreMonitoring(bp: DevOpsBlueprint): number {
  let s = 1;
  s += score(bp.monitoring.hasPrometheus, 1.5);
  s += score(bp.monitoring.hasGrafana, 1);
  s += score(bp.monitoring.hasOpenTelemetry, 1.5);
  s += score(bp.monitoring.hasMetrics, 0.5);
  s += score(bp.monitoring.hasTracing, 1);
  s += score(bp.monitoring.hasLogs, 0.5);
  s += score(bp.logging.hasJSONLogs, 0.5);
  s += score(bp.logging.hasRequestLogs, 0.5);
  s += score(bp.logging.hasAuditLogs, 0.5);
  s += score(bp.alerts.alerts.length >= 4, 1);
  return clamp(s);
}

function scoreDeployment(bp: DevOpsBlueprint): number {
  let s = 2;
  s += score(bp.cicd.hasLint, 0.5);
  s += score(bp.cicd.hasTests, 1);
  s += score(bp.cicd.hasBuild, 0.5);
  s += score(bp.cicd.hasSecurityScan, 1);
  s += score(bp.cicd.hasDeploy, 0.5);
  s += score(bp.cicd.hasRollback, 1);
  s += score(bp.cicd.hasCaching, 0.5);
  s += score(bp.deployment.hasZeroDowntime, 1);
  s += score(bp.deployment.hasBlueGreen || bp.deployment.hasCanary, 1);
  s += score(bp.cicd.hasParallelJobs, 0.5);
  return clamp(s);
}

function scoreRecovery(bp: DevOpsBlueprint): number {
  let s = 1;
  s += score(bp.backup.hasDatabaseBackup, 1.5);
  s += score(bp.backup.hasSnapshotStrategy, 1);
  s += score(bp.backup.encryption, 0.5);
  s += score(bp.backup.crossRegion, 1);
  s += score(bp.recovery.hasFailover, 1);
  s += score(bp.recovery.hasRunbook, 0.5);
  s += score(bp.recovery.hasAutomatedFailover, 1);
  s += score(bp.recovery.rtoMinutes <= 60, 1);
  s += score(bp.recovery.hasGameDay, 0.5);
  return clamp(s);
}

const SCORERS: Record<DevOpsDimension, (bp: DevOpsBlueprint) => number> = {
  infrastructure: scoreInfrastructure,
  security:       scoreSecurity,
  performance:    scorePerformance,
  reliability:    scoreReliability,
  scalability:    scoreScalability,
  cost:           scoreCost,
  monitoring:     scoreMonitoring,
  deployment:     scoreDeployment,
  recovery:       scoreRecovery,
};

const RATIONALES: Record<DevOpsDimension, string> = {
  infrastructure: 'Container strategy, orchestration, replicas, CDN, load balancing',
  security:       'IAM, KMS, WAF, DDoS protection, image scanning, secret rotation',
  performance:    'HTTP/3, Redis, CDN cache, compression, P99 latency target',
  reliability:    'Health checks, alerts, zero-downtime deploy, PDB, on-call rotation',
  scalability:    'Horizontal/queue/AI-worker autoscaling, HPA, multi-region, managed DB',
  cost:           'Right-sizing, optimisation suggestions, autoscaling cost control',
  monitoring:     'Prometheus, Grafana, OpenTelemetry, traces, structured logs, alerts',
  deployment:     'CI/CD stages, blue-green/canary, rollback, security scan, caching',
  recovery:       'Backup strategy, RTO/RPO, automated failover, runbook, game days',
};

export interface DevOpsValidationResult {
  qualityScores: DevOpsQualityScore[];
  overallScore:  number;
  scoreMap:      Record<DevOpsDimension, number>;
}

export function validateDevOpsBlueprint(bp: DevOpsBlueprint): DevOpsValidationResult {
  const qualityScores: DevOpsQualityScore[] = ALL_DEVOPS_DIMENSIONS.map(dim => ({
    dimension: dim,
    score:     SCORERS[dim](bp),
    rationale: RATIONALES[dim],
  }));

  const total = qualityScores.reduce((sum, qs) => sum + qs.score, 0);
  const overallScore = parseFloat((total / qualityScores.length).toFixed(2));

  const scoreMap = Object.fromEntries(
    qualityScores.map(qs => [qs.dimension, qs.score])
  ) as Record<DevOpsDimension, number>;

  return { qualityScores, overallScore, scoreMap };
}
