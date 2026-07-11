// ── V8.7 DevOps Architect — DevOps Deployment Strategy Planner ───────────────
//
// Plans the *deployment workflow* strategy (blue-green, canary, rolling, etc).
// Distinct from backend-architect/deploymentPlanner.ts which plans app infra topology.
import type { BackendType, DevOpsDeploymentBlueprint, DeploymentStrategy } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

function chooseStrategy(t: BackendType): DeploymentStrategy {
  if (isEnterprise(t) || t === 'Finance' || t === 'Healthcare') return 'BlueGreen';
  if (isHighTraffic(t)) return 'Canary';
  if (isSimple(t)) return 'Recreate';
  return 'Rolling';
}

function rollbackMinutes(t: BackendType): number {
  if (t === 'Finance' || t === 'Healthcare') return 1;
  if (isEnterprise(t)) return 2;
  return 5;
}

export function planDevOpsDeployment(t: BackendType): DevOpsDeploymentBlueprint {
  const strategy = chooseStrategy(t);

  return {
    strategy,
    hasBlueGreen:      strategy === 'BlueGreen',
    hasCanary:         strategy === 'Canary',
    hasRolling:        strategy === 'Rolling',
    hasZeroDowntime:   strategy !== 'Recreate',
    hasAutomatedTests: !isSimple(t),
    rollbackTimeMin:   rollbackMinutes(t),
  };
}
