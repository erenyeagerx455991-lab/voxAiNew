// ── V8.7 DevOps Architect — DevOps Security Planner ──────────────────────────
//
// Plans infrastructure-level security: IAM, KMS, WAF, DDoS, secret rotation.
// Distinct from backend-architect/securityPlanner.ts which plans app-level OWASP.
import type { BackendType, CloudProvider, DevOpsSecurityBlueprint } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

export function planDevOpsSecurity(t: BackendType, provider: CloudProvider): DevOpsSecurityBlueprint {
  const isRegulated = t === 'Finance' || t === 'Healthcare';
  const needsFull   = isEnterprise(t) || isRegulated;

  const complianceLevel: DevOpsSecurityBlueprint['complianceLevel'] =
    isRegulated ? 'Enterprise' : isEnterprise(t) ? 'Standard' : 'Basic';

  return {
    hasSecretRotation:        needsFull,
    hasIAM:                   provider !== 'SelfHosted',
    hasKMS:                   !isSimple(t),
    hasEncryption:            !isSimple(t),
    hasWAF:                   needsFull || provider === 'Cloudflare',
    hasDDoSProtection:        needsFull || provider === 'Cloudflare',
    hasRateLimiting:          true,
    hasVulnerabilityScanning: needsFull,
    hasImageScanning:         !isSimple(t),
    complianceLevel,
  };
}
