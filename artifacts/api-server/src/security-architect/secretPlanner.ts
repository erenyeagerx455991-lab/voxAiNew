// ── V8.9 Security Architect — Phase 6: Secrets Planner ───────────────────────
// NOTE: function is planSecuritySecrets to avoid collision with devops-architect/secretPlanner.ts
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { SecretsPlannerBlueprint } from './securityTypes.js';

export function planSecuritySecrets(t: BackendType): SecretsPlannerBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend'].includes(t);
  const isSimple    = ['LandingAPI','Documentation'].includes(t);

  const provider = isRegulated ? 'HashiCorp Vault' : isEnterprise ? 'AWS Secrets Manager' : 'Doppler / env';
  const rotationDays = isRegulated ? 30 : isEnterprise ? 60 : 90;

  return {
    hasSecretRotation:  !isSimple,
    vaultStrategy:      provider,
    hasEnvSecrets:      true,
    hasAPIKeyManagement:!isSimple,
    hasOAuthSecrets:    true,
    hasSigningKeys:     true,
    hasWebhookSecrets:  !isSimple,
    rotationPeriodDays: rotationDays,
    provider,
  };
}
