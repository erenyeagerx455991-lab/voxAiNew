// ── V8.7 DevOps & Infrastructure Architect — Main Orchestrator ───────────────
//
// Produces an immutable DevOpsBlueprint in < 10ms with zero LLM calls.
// 22 sequential planning phases; all planners are pure functions.

import type {
  BackendType, DevOpsBlueprint, DevOpsArchitectOutput,
} from './devopsTypes.js';
import type { ProductManagerOutput } from '../product-manager/productTypes.js';
import type { BackendArchitectOutput } from '../backend-architect/backendTypes.js';

import { detectInfrastructure }      from './infrastructurePlanner.js';
import { planCloud }                  from './cloudPlanner.js';
import { planContainer }              from './containerPlanner.js';
import { planDocker }                 from './dockerPlanner.js';
import { planKubernetes }             from './kubernetesPlanner.js';
import { planNetwork }                from './networkPlanner.js';
import { planCDN }                    from './cdnPlanner.js';
import { planLoadBalancer }           from './loadBalancerPlanner.js';
import { planAutoScaling }            from './autoscalingPlanner.js';
import { planCICD }                   from './cicdPlanner.js';
import { planEnvironments }           from './environmentPlanner.js';
import { planSecrets }                from './secretPlanner.js';
import { planDevOpsDeployment }       from './deploymentPlanner.js';
import { planMonitoring }             from './monitoringPlanner.js';
import { planLogging }                from './loggingPlanner.js';
import { planAlerts }                 from './alertPlanner.js';
import { planBackup }                 from './backupPlanner.js';
import { planRecovery }               from './recoveryPlanner.js';
import { planCost }                   from './costPlanner.js';
import { planDevOpsSecurity }         from './securityPlanner.js';
import { planDevOpsPerformance }      from './performancePlanner.js';
import { validateDevOpsBlueprint }    from './devopsValidator.js';
import { recordDevOpsBuild }          from './devopsMetrics.js';
import { learnFromDevOpsBuild }       from './devopsLearning.js';
import { saveDevOpsBlueprint }        from './devopsPersistence.js';

function buildEnrichedPrompt(bp: DevOpsBlueprint): string {
  return [
    'DEVOPS ARCHITECTURE (V8.7):',
    `INFRASTRUCTURE: ${bp.infrastructureType} (confidence ${(bp.infrastructureConfidence * 100).toFixed(0)}%)`,
    `CLOUD: ${bp.cloud.provider} / ${bp.cloud.region}${bp.cloud.hasMultiRegion ? ' (multi-region)' : ''}`,
    `CONTAINERS: ${bp.container.hasDockerfile ? `Dockerfile (${bp.docker.dockerfileStrategy})` : 'none'}`,
    `KUBERNETES: ${bp.kubernetes.hasDeployment ? `enabled (HPA: ${bp.kubernetes.hasHPA})` : 'disabled'}`,
    `CICD: ${bp.cicd.provider} — ${bp.cicd.stages.join(' → ')}`,
    `DEPLOY_STRATEGY: ${bp.deployment.strategy} (zero-downtime: ${bp.deployment.hasZeroDowntime})`,
    `ENVIRONMENTS: ${bp.environments.environments.join(', ')}`,
    `MONITORING: Prometheus=${bp.monitoring.hasPrometheus} Grafana=${bp.monitoring.hasGrafana} OTel=${bp.monitoring.hasOpenTelemetry}`,
    `SCALING: ${bp.autoScaling.types.join('/')} (${bp.autoScaling.minReplicas}–${bp.autoScaling.maxReplicas} replicas)`,
    `BACKUP: ${bp.backup.frequency} (${bp.backup.retentionDays}d retention${bp.backup.crossRegion ? ', cross-region' : ''})`,
    `RECOVERY: RTO=${bp.recovery.rtoMinutes}m RPO=${bp.recovery.rpoMinutes}m tier=${bp.recovery.tier}`,
    `COST_ESTIMATE: $${bp.cost.estimatedMonthlyUSD}/month`,
    `SECURITY: WAF=${bp.security.hasWAF} KMS=${bp.security.hasKMS} IAM=${bp.security.hasIAM} compliance=${bp.security.complianceLevel}`,
    `DEVOPS_SCORE: ${bp.overallScore}/10`,
  ].join('\n');
}

export function runDevOpsArchitect(
  _prompt: string,
  productManagerOutput: ProductManagerOutput,
  backendOutput: BackendArchitectOutput,
): DevOpsArchitectOutput {
  const start = Date.now();
  const t: BackendType = backendOutput.blueprint.backendType;

  // Phase 1 — Infrastructure Detection
  const infrastructure = detectInfrastructure(t);
  const infra          = infrastructure.type;

  // Phase 2 — Cloud Planner
  const cloud = planCloud(t, infra);

  // Phase 3 — Container Planner
  const container = planContainer(t, infra);

  // Docker & Kubernetes
  const docker     = planDocker(t, infra);
  const kubernetes = planKubernetes(t, infra);

  // Phase 7 — Networking
  const network = planNetwork(t, cloud.provider);
  const cdn     = planCDN(t, cloud.provider);

  // Phase 8 — Load Balancing
  const loadBalancer = planLoadBalancer(t, infra);

  // Phase 9 — Auto Scaling
  const autoScaling = planAutoScaling(t, infra);

  // Phase 5 — CI/CD Planner
  const cicd = planCICD(t);

  // Phase 6 — Environments
  const environments = planEnvironments(t);
  const secrets      = planSecrets(t, cloud.provider);

  // Deployment strategy
  const deployment = planDevOpsDeployment(t);

  // Phase 10 — Monitoring
  const monitoring = planMonitoring(t);

  // Phase 11 — Logging
  const logging = planLogging(t);

  // Phase 12 — Alerts
  const alerts = planAlerts(t);

  // Phase 13 — Backup
  const backup = planBackup(t);

  // Phase 14 — Recovery
  const recovery = planRecovery(t);

  // Phase 15 — Cost
  const cost = planCost(t, cloud.provider, infra);

  // Phase 16 — Security
  const security = planDevOpsSecurity(t, cloud.provider);

  // Phase 17 — Performance
  const performance = planDevOpsPerformance(t, cloud.provider);

  // Assemble preliminary blueprint for validation
  const partial: DevOpsBlueprint = {
    infrastructureType:       infra,
    infrastructureConfidence: infrastructure.confidence,
    infrastructure,
    container,
    docker,
    kubernetes,
    cloud,
    network,
    cdn,
    loadBalancer,
    autoScaling,
    cicd,
    environments,
    secrets,
    deployment,
    monitoring,
    logging,
    alerts,
    backup,
    recovery,
    cost,
    security,
    performance,
    qualityScores: [],
    overallScore:  0,
  };

  // Phase 18 — Validation
  const { qualityScores, overallScore, scoreMap } = validateDevOpsBlueprint(partial);

  const blueprint: DevOpsBlueprint = Object.freeze({
    ...partial,
    qualityScores,
    overallScore,
  });

  // Phase 20 — Record telemetry (non-blocking)
  recordDevOpsBuild(infra, cloud.provider, overallScore, scoreMap);

  // Phase 21 — Persistence (debounced, non-blocking)
  saveDevOpsBlueprint(blueprint);

  // Phase 19 — Learning (always async)
  learnFromDevOpsBuild({
    buildId:  `${Date.now()}-${t}`,
    blueprint,
    evaluatorScore: undefined,
  }).catch(() => {/* silent */});

  const processingTimeMs = Date.now() - start;

  return {
    blueprint,
    overallScore,
    enrichedPromptWithDevOps: buildEnrichedPrompt(blueprint),
    processingTimeMs,
  };
}
