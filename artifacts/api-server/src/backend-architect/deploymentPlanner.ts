// ── V8.6 Backend Architect — Deployment Architecture Planner ──────────────────
import type { BackendType, DeploymentArchitecture, DeploymentStrategy, ScalingStrategy } from './backendTypes.js';
import { isEnterpriseBackend, isHighTrafficBackend } from './backendPlanner.js';

function chooseStrategy(type: BackendType): DeploymentStrategy {
  if (type === 'ServerlessCandidate') return 'Serverless';
  if (type === 'MicroserviceCandidate') return 'Kubernetes';
  if (isEnterpriseBackend(type)) return 'DockerCompose';
  if (['LandingAPI', 'Documentation'].includes(type)) return 'PaaS';
  return 'Docker';
}

function chooseScaling(type: BackendType): ScalingStrategy {
  if (type === 'ServerlessCandidate') return 'Auto';
  if (isHighTrafficBackend(type) || type === 'MicroserviceCandidate') return 'Horizontal';
  if (['LandingAPI', 'Documentation'].includes(type)) return 'Vertical';
  return 'Horizontal';
}

function getEnvironments(type: BackendType): string[] {
  const base = ['development', 'production'];
  if (!['LandingAPI', 'Documentation'].includes(type)) base.splice(1, 0, 'staging');
  if (isEnterpriseBackend(type)) base.push('qa');
  return base;
}

export function planDeploymentArchitecture(type: BackendType): DeploymentArchitecture {
  const strategy      = chooseStrategy(type);
  const isEnterprise  = isEnterpriseBackend(type);
  const isHighTraffic = isHighTrafficBackend(type);
  const isSimple      = ['LandingAPI', 'Documentation'].includes(type);

  return {
    strategy,
    hasDocker:          strategy !== 'PaaS',
    hasDockerCompose:   strategy === 'DockerCompose' || isEnterprise,
    hasKubernetes:      strategy === 'Kubernetes' || (isEnterprise && isHighTraffic),
    hasCICD:            !isSimple,
    environments:       getEnvironments(type),
    scalingStrategy:    chooseScaling(type),
    hasBlueGreen:       isEnterprise || isHighTraffic,
    hasRollback:        !isSimple,
    hasHealthChecks:    true,
  };
}
