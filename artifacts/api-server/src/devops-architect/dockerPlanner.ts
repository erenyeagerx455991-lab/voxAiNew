// ── V8.7 DevOps Architect — Docker Planner ───────────────────────────────────
import type { BackendType, DockerBlueprint, InfrastructureType } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

function deriveServices(t: BackendType): string[] {
  const base = ['app'];
  if (!isSimple(t)) base.push('postgres', 'redis');
  if (t === 'AIPlatform') base.push('weaviate');
  if (t === 'Analytics') base.push('clickhouse');
  if (t === 'ECommerce' || t === 'Marketplace') base.push('meilisearch');
  return base;
}

export function planDocker(t: BackendType, infra: InfrastructureType): DockerBlueprint {
  const isCompose = infra === 'DockerCompose';
  const services  = deriveServices(t);

  return {
    dockerfileStrategy: isEnterprise(t) ? 'Distroless' : isSimple(t) ? 'Single' : 'MultiStage',
    composeServices:    services,
    hasDockerCompose:   isCompose,
    hasNetworks:        isCompose,
    hasVolumes:         isCompose && !isSimple(t),
    hasHealthChecks:    true,
    exposedPorts:       [8080],
    hasEnvFile:         true,
  };
}
