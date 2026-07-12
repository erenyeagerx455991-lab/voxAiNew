// ── V8.8 QA Architect — Phase 12: Security Test Planner ──────────────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { SecurityTestBlueprint } from './qaTypes.js';

export function planSecurityTests(t: BackendType): SecurityTestBlueprint {
  const isFinancial = ['Finance','ECommerce','Marketplace'].includes(t);
  const isAI        = t === 'AIPlatform';
  const isRegulated = isFinancial || t === 'Healthcare';

  return {
    hasAuthTests:            true,
    hasAuthzTests:           true,
    hasJWTTests:             true,
    hasCSRFTests:            true,
    hasXSSTests:             true,
    hasSQLInjectionTests:    true,
    hasPromptInjectionTests: isAI,
    hasRateLimitTests:       true,
    hasSecretsTests:         true,
    tools:                   ['OWASP ZAP', 'Snyk', 'Semgrep', ...(isAI ? ['Garak'] : [])],
    penetrationTestSchedule: isRegulated ? 'Quarterly' : 'Bi-annually',
  };
}
