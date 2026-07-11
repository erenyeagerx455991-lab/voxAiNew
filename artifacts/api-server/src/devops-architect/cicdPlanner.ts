// ── V8.7 DevOps Architect — CI/CD Planner ────────────────────────────────────
import type {
  BackendType, CICDBlueprint, CICDProvider, DeploymentStrategy,
} from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

function chooseProvider(t: BackendType): CICDProvider {
  if (t === 'ERPBackend' || t === 'Enterprise') return 'Jenkins';
  return 'GitHubActions';
}

function chooseDeployStrategy(t: BackendType): DeploymentStrategy {
  if (isEnterprise(t) || t === 'Finance' || t === 'Healthcare') return 'BlueGreen';
  if (isHighTraffic(t)) return 'Canary';
  if (isSimple(t)) return 'Recreate';
  return 'Rolling';
}

function buildStages(t: BackendType): string[] {
  const stages = ['lint', 'test', 'build'];
  if (!isSimple(t)) stages.push('security-scan');
  stages.push('deploy');
  if (!isSimple(t)) stages.push('smoke-test', 'rollback');
  return stages;
}

export function planCICD(t: BackendType): CICDBlueprint {
  const stages = buildStages(t);
  return {
    provider:       chooseProvider(t),
    stages,
    hasLint:        true,
    hasTests:       true,
    hasBuild:       true,
    hasSecurityScan:!isSimple(t),
    hasDeploy:      true,
    hasRollback:    !isSimple(t),
    hasCaching:     true,
    hasParallelJobs:isEnterprise(t) || isHighTraffic(t),
    branchStrategy: isEnterprise(t) ? 'GitFlow' : 'Trunk',
    deployStrategy: chooseDeployStrategy(t),
  };
}
