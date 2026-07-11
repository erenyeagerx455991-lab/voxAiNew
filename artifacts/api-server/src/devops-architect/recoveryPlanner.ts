// ── V8.7 DevOps Architect — Disaster Recovery Planner ────────────────────────
import type { BackendType, RecoveryBlueprint, RecoveryTier } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

function chooseTier(t: BackendType): RecoveryTier {
  if (t === 'Finance' || t === 'Healthcare') return 'Hot';
  if (isEnterprise(t)) return 'Warm';
  return 'Cold';
}

function rto(t: BackendType): number {
  if (t === 'Finance' || t === 'Healthcare') return 1;
  if (isEnterprise(t)) return 15;
  if (isSimple(t)) return 240;
  return 60;
}

function rpo(t: BackendType): number {
  if (t === 'Finance' || t === 'Healthcare') return 0;
  if (isEnterprise(t)) return 5;
  if (isSimple(t)) return 60;
  return 15;
}

export function planRecovery(t: BackendType): RecoveryBlueprint {
  const tier = chooseTier(t);

  return {
    rtoMinutes:           rto(t),
    rpoMinutes:           rpo(t),
    tier,
    hasFailover:          tier !== 'Cold',
    hasMultiRegion:       tier === 'Hot',
    hasRunbook:           isEnterprise(t) || tier !== 'Cold',
    hasGameDay:           isEnterprise(t),
    hasAutomatedFailover: tier === 'Hot',
  };
}
