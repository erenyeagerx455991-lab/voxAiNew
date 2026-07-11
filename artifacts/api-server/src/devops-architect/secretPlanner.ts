// ── V8.7 DevOps Architect — Secret Management Planner ───────────────────────
import type { BackendType, CloudProvider, SecretBlueprint, SecretProvider } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

const CATEGORIES = ['database', 'auth', 'api-keys', 'encryption'];
const ENTERPRISE_CATEGORIES = [...CATEGORIES, 'certificates', 'service-accounts', 'rotation-keys'];

function chooseProvider(t: BackendType, cloud: CloudProvider): SecretProvider {
  if (isSimple(t)) return 'EnvFile';
  if (cloud === 'AWS') return 'AWSSecretsManager';
  if (cloud === 'GCP') return 'GCPSecretManager';
  if (cloud === 'Azure') return 'AzureKeyVault';
  if (isEnterprise(t)) return 'Vault';
  return 'Kubernetes';
}

export function planSecrets(t: BackendType, cloud: CloudProvider): SecretBlueprint {
  const isRegulated = t === 'Finance' || t === 'Healthcare';

  return {
    provider:            chooseProvider(t, cloud),
    hasRotation:         isEnterprise(t) || isRegulated,
    hasAuditLog:         isEnterprise(t) || isRegulated,
    hasEncryptionAtRest: !isSimple(t),
    secretCategories:    isEnterprise(t) ? ENTERPRISE_CATEGORIES : CATEGORIES,
  };
}
