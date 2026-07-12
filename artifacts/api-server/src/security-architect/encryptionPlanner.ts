// ── V8.9 Security Architect — Phase 5: Encryption Planner ────────────────────
import type { BackendType }       from '../backend-architect/backendTypes.js';
import type { EncryptionBlueprint } from './securityTypes.js';

export function planEncryption(t: BackendType): EncryptionBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend','MultiTenant'].includes(t);
  const isSimple    = ['LandingAPI','Documentation'].includes(t);

  return {
    algorithm:                'AES-256-GCM',
    tlsVersion:               '1.3',
    hasHTTPS:                 true,
    hasEncryptionAtRest:      !isSimple,
    hasEncryptionInTransit:   true,
    hasDatabaseEncryption:    !isSimple,
    hasObjectStorageEncryption:!isSimple,
    hasFieldEncryption:       isRegulated || isEnterprise,
  };
}
