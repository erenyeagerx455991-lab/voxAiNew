// ── V8.7 DevOps Architect — Kubernetes Planner ───────────────────────────────
import type { BackendType, KubernetesBlueprint, InfrastructureType } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

function chooseResources(t: BackendType) {
  if (isEnterprise(t) || isHighTraffic(t)) {
    return {
      requests: { cpu: '250m', memory: '512Mi' },
      limits:   { cpu: '1000m', memory: '2Gi' },
    };
  }
  if (isSimple(t)) {
    return {
      requests: { cpu: '50m',  memory: '128Mi' },
      limits:   { cpu: '200m', memory: '256Mi' },
    };
  }
  return {
    requests: { cpu: '100m', memory: '256Mi' },
    limits:   { cpu: '500m', memory: '1Gi' },
  };
}

export function planKubernetes(t: BackendType, infra: InfrastructureType): KubernetesBlueprint {
  const isK8s = infra === 'Kubernetes';

  return {
    hasDeployment:          isK8s,
    hasService:             isK8s,
    hasIngress:             isK8s,
    hasConfigMap:           isK8s,
    hasSecret:              isK8s,
    hasHPA:                 isK8s && !isSimple(t),
    hasPVC:                 isK8s && !isSimple(t),
    hasPodDisruptionBudget: isK8s && (isEnterprise(t) || isHighTraffic(t)),
    namespace:              'production',
    replicaCount:           isEnterprise(t) ? 3 : isHighTraffic(t) ? 2 : 1,
    resources:              chooseResources(t),
  };
}
