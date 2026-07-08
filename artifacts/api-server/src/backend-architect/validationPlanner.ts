// ── V8.6 Backend Architect — Validation Architecture Planner ──────────────────
import type { BackendType, ValidationArchitecture, ValidationLibrary } from './backendTypes.js';

function chooseValidationLibrary(type: BackendType): ValidationLibrary {
  if (['Healthcare', 'Finance', 'Enterprise'].includes(type)) return 'Zod';
  return 'Zod';
}

function getValidationScopes(type: BackendType): string[] {
  const scopes = ['body', 'query', 'params', 'headers'];
  if (['Finance', 'Healthcare', 'Enterprise', 'ERPBackend'].includes(type)) {
    scopes.push('response', 'env');
  }
  return scopes;
}

export function planValidationArchitecture(type: BackendType): ValidationArchitecture {
  const isSimple = ['LandingAPI', 'Documentation'].includes(type);

  return {
    library:              chooseValidationLibrary(type),
    hasSchemaValidation:  true,
    hasDTOValidation:     !isSimple,
    hasRuntimeValidation: !isSimple,
    hasInputSanitization: true,
    validationScopes:     getValidationScopes(type),
  };
}
