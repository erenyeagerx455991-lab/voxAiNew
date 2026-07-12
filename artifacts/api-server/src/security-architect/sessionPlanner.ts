// ── V8.9 Security Architect — Phase 8: Session Planner ───────────────────────
import type { BackendType }    from '../backend-architect/backendTypes.js';
import type { SessionBlueprint } from './securityTypes.js';

export function planSession(t: BackendType): SessionBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend'].includes(t);

  // Stricter timeouts for regulated/enterprise apps
  const idleTimeout     = isRegulated ? 15 : isEnterprise ? 30 : 60;
  const absoluteTimeout = isRegulated ? 8  : isEnterprise ? 12 : 24;
  const accessTokenTTL  = isRegulated ? 5  : isEnterprise ? 15 : 60;

  return {
    hasAccessToken:       true,
    hasRefreshToken:      true,
    hasTokenRotation:     true,
    idleTimeoutMinutes:   idleTimeout,
    absoluteTimeoutHours: absoluteTimeout,
    hasLogout:            true,
    hasDeviceSessions:    isEnterprise || t === 'SaaSBackend',
    hasSessionRevocation: isRegulated || isEnterprise,
    accessTokenTTLMinutes:accessTokenTTL,
  };
}
