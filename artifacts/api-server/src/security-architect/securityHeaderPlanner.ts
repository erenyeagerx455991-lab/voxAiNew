// ── V8.9 Security Architect — Phase 14: Security Header Planner ──────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { SecurityHeaderBlueprint } from './securityTypes.js';

export function planSecurityHeaders(t: BackendType): SecurityHeaderBlueprint {
  const isStrict = ['Finance','Healthcare','Enterprise','ERPBackend'].includes(t);

  const cspPolicy = isStrict
    ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://api.openrouter.ai"
    : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src *";

  return {
    hasCSP:                 true,
    cspPolicy,
    hasHSTS:                true,
    hstsMaxAge:             isStrict ? 63072000 : 31536000,   // 2yr vs 1yr
    hasXFrameOptions:       true,
    hasXContentTypeOptions: true,
    hasPermissionsPolicy:   true,
    hasReferrerPolicy:      true,
    hasCrossOriginPolicies: !['LandingAPI','Documentation'].includes(t),
  };
}
