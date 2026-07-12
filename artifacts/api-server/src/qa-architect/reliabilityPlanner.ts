// ── V8.8 QA Architect — Phase 15: Reliability Planner ───────────────────────
import type { BackendType }       from '../backend-architect/backendTypes.js';
import type { ReliabilityBlueprint } from './qaTypes.js';

export function planReliability(t: BackendType): ReliabilityBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend'].includes(t);
  const isHighTraffic = ['Marketplace','SocialPlatform','ECommerce'].includes(t);

  const availability = isRegulated ? 99.99 : isEnterprise ? 99.95 : isHighTraffic ? 99.9 : 99.5;
  const sloTarget    = `${availability}% monthly uptime`;

  return {
    predictedAvailabilityPercent: availability,
    hasFailover:             isRegulated || isEnterprise || isHighTraffic,
    hasRetryPolicy:          true,
    hasCircuitBreaker:       !['LandingAPI','Documentation'].includes(t),
    hasGracefulDegradation:  true,
    retryMaxAttempts:        isRegulated ? 5 : 3,
    retryBackoffMs:          isRegulated ? 200 : 500,
    mttrMinutes:             isRegulated ? 5 : isEnterprise ? 15 : 30,
    sloTarget,
  };
}
