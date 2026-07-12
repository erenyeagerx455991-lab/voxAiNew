// ── V9.0 Runtime Intelligence — Deployment Strategy Planner ──────────────────
import type { GenerationMode, DeploymentStrategy, DeploymentType, RuntimeIntelligenceInput } from './runtimeTypes.js';

function selectDeploymentType(mode: GenerationMode, input: RuntimeIntelligenceInput): DeploymentType {
  // ECommerce → canary (safe gradual rollout to protect revenue)
  if (input.backendType === 'ECommerce' || input.hasPayments) return 'canary';
  // Enterprise / compliance → blue-green (zero-downtime)
  if (mode === 'Enterprise' || input.hasCompliance) return 'blue-green';
  // Safe mode → rolling (gradual, low risk)
  if (mode === 'Safe') return 'rolling';
  // Fast / Experimental → immediate (speed matters)
  if (mode === 'Fast' || mode === 'Experimental') return 'immediate';
  return 'standard';
}

export function planDeploymentStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): DeploymentStrategy {
  const strategy = selectDeploymentType(mode, input);
  const cdnEnabled = mode !== 'Fast' && mode !== 'Experimental';

  return {
    strategy,
    cdnEnabled,
    rationale: `${mode} deployment: ${strategy}, cdn=${cdnEnabled}`,
  };
}
