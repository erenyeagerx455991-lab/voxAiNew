// ── V8.7 DevOps Architect — Auto Scaling Planner ─────────────────────────────
import type { BackendType, AutoScalingBlueprint, ScalingType, InfrastructureType } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

function chooseTypes(t: BackendType): ScalingType[] {
  if (isSimple(t)) return ['Vertical'];
  const types: ScalingType[] = ['Horizontal'];
  if (isHighTraffic(t) || isEnterprise(t)) types.push('Queue');
  if (t === 'AIPlatform' || t === 'Analytics') types.push('AIWorker');
  return types;
}

export function planAutoScaling(t: BackendType, infra: InfrastructureType): AutoScalingBlueprint {
  const types    = chooseTypes(t);
  const canScale = infra !== 'SingleServer' && infra !== 'Docker';

  return {
    types,
    minReplicas:         canScale ? (isSimple(t) ? 1 : 2) : 1,
    maxReplicas:         canScale ? (isEnterprise(t) || isHighTraffic(t) ? 20 : 5) : 1,
    targetCPUPercent:    isHighTraffic(t) ? 60 : 70,
    targetMemoryPercent: isHighTraffic(t) ? 70 : 80,
    hasQueueScaling:     types.includes('Queue'),
    hasAIWorkerScaling:  types.includes('AIWorker'),
    cooldownSeconds:     isHighTraffic(t) ? 30 : 60,
  };
}
