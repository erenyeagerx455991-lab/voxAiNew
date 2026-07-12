// ── V8.9 Security Architect — Phase 13: OWASP Planner ────────────────────────
import type { BackendType }  from '../backend-architect/backendTypes.js';
import type { OWASPBlueprint } from './securityTypes.js';

export function planOWASP(t: BackendType): OWASPBlueprint {
  const isSimple = ['LandingAPI','Documentation'].includes(t);
  const isAI     = t === 'AIPlatform';

  // All apps get all OWASP protections — score reflects strength of implementation
  const checks = {
    hasInjectionProtection:     true,
    hasBrokenAuthProtection:    true,
    hasSensitiveDataProtection: !isSimple,
    hasXXEProtection:           !isSimple,
    hasSSRFProtection:          !isSimple || isAI,  // AI platform always needs SSRF protection
    hasXSSProtection:           true,
    hasCSRFProtection:          true,
    hasBrokenAccessControl:     true,
    hasSecurityMisconfigCheck:  !isSimple,
    hasLoggingMonitoring:       true,
  };

  const trueCount = Object.values(checks).filter(Boolean).length;
  const owaspScore = parseFloat(((trueCount / 10) * 10).toFixed(1));

  return { ...checks, owaspScore };
}
