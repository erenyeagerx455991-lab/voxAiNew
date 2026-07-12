// ── V8.9 Security Architect — Phase 7: Key Management Planner ────────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { KeyManagementBlueprint } from './securityTypes.js';

export function planKeyManagement(t: BackendType): KeyManagementBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend','MultiTenant','Finance','Healthcare'].includes(t);
  const isSimple    = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  const provider = isRegulated ? 'AWS KMS / HSM' : isEnterprise ? 'AWS KMS' : isSimple ? 'None' : 'Managed KMS';
  const rotationDays = isRegulated ? 90 : isEnterprise ? 180 : 365;

  return {
    hasKMS:            !isSimple,
    provider,
    hasKeyRotation:    !isSimple,
    rotationPeriodDays:rotationDays,
    hasBackupKeys:     isEnterprise,
    hasRecoveryKeys:   isEnterprise,
    hasSigningKeys:    true,
    hasEncryptionKeys: !isSimple,
  };
}
