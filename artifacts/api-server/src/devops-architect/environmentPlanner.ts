// ── V8.7 DevOps Architect — Environment Planner ──────────────────────────────
import type { BackendType, EnvironmentBlueprint, EnvironmentName } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

const BASE_VARS = [
  'NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL',
  'API_KEY', 'SESSION_SECRET', 'LOG_LEVEL',
];

const ENTERPRISE_VARS = [
  'SENTRY_DSN', 'DATADOG_API_KEY', 'OTEL_EXPORTER_ENDPOINT',
  'FEATURE_FLAGS_URL', 'VAULT_ADDR', 'VAULT_TOKEN',
];

function buildEnvs(t: BackendType): EnvironmentName[] {
  if (isSimple(t)) return ['development', 'production'];
  if (isEnterprise(t)) return ['local', 'development', 'staging', 'production'];
  return ['local', 'development', 'staging', 'production'];
}

export function planEnvironments(t: BackendType): EnvironmentBlueprint {
  const envs = buildEnvs(t);
  const vars  = isEnterprise(t) ? [...BASE_VARS, ...ENTERPRISE_VARS] : BASE_VARS;

  return {
    environments:        envs,
    hasFeatureFlags:     isEnterprise(t) || t === 'SaaSBackend' || t === 'MultiTenant',
    hasSecretManagement: !isSimple(t),
    hasEnvValidation:    !isSimple(t),
    variables:           vars,
    secretCount:         isEnterprise(t) ? 12 : isSimple(t) ? 3 : 7,
  };
}
