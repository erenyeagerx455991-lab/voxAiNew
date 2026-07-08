// ── V8.6 Backend Architect — Security Architecture Planner ────────────────────
import type { BackendType, SecurityArchitecture } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

type ComplianceLevel = 'Basic' | 'Standard' | 'Enterprise';

function getComplianceLevel(type: BackendType): ComplianceLevel {
  if (['Finance', 'Healthcare', 'Enterprise', 'ERPBackend', 'MultiTenant'].includes(type)) return 'Enterprise';
  if (['SaaSBackend', 'CRMBackend', 'Marketplace', 'ECommerce', 'AIPlatform', 'DeveloperPlatform'].includes(type)) return 'Standard';
  return 'Basic';
}

export function planSecurityArchitecture(type: BackendType): SecurityArchitecture {
  const level        = getComplianceLevel(type);
  const isEnterprise = isEnterpriseBackend(type);
  const isRegulated  = ['Finance', 'Healthcare'].includes(type);
  const isSimple     = ['LandingAPI', 'Documentation'].includes(type);

  return {
    hasEncryption:             !isSimple,
    hasHashing:                !isSimple,
    hasSecretManagement:       true,
    hasEnvValidation:          true,
    hasSQLInjectionProtection: true,
    hasXSSProtection:          true,
    hasCSRFProtection:         !isSimple,
    hasCORSConfig:             true,
    hasHelmet:                 true,
    hasRateLimiting:           true,
    hasInputSanitization:      true,
    hasOWASPCompliance:        isEnterprise || isRegulated || level !== 'Basic',
    complianceLevel:           level,
  };
}
