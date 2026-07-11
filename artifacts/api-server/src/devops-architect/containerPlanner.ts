// ── V8.7 DevOps Architect — Container Planner ────────────────────────────────
import type { BackendType, ContainerBlueprint, ContainerRegistry, InfrastructureType } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

function chooseRegistry(t: BackendType, infra: InfrastructureType): ContainerRegistry {
  if (infra === 'Kubernetes' && isEnterprise(t)) return 'ECR';
  if (t === 'AIPlatform') return 'GCR';
  return 'GHCR';
}

function chooseBaseImage(t: BackendType): string {
  if (isSimple(t)) return 'node:20-alpine';
  if (isEnterprise(t)) return 'node:20-slim';
  return 'node:20-alpine';
}

export function planContainer(t: BackendType, infra: InfrastructureType): ContainerBlueprint {
  const needsDistroless = isEnterprise(t) || t === 'Finance' || t === 'Healthcare';
  const needsMultiStage = infra !== 'SingleServer';

  return {
    hasDockerfile:        infra !== 'Serverless' && infra !== 'Edge',
    hasMultiStage:        needsMultiStage,
    hasDistroless:        needsDistroless,
    hasHealthCheck:       true,
    hasImageOptimization: true,
    baseImage:            chooseBaseImage(t),
    registry:             chooseRegistry(t, infra),
    imageTag:             'sha-${GITHUB_SHA}',
    buildTarget:          needsMultiStage ? 'production' : 'default',
  };
}
