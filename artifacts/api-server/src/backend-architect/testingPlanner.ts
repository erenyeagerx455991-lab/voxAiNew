// ── V8.6 Backend Architect — Testing Architecture Planner ─────────────────────
import type { BackendType, TestingArchitecture } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function deriveTestTypes(type: BackendType): string[] {
  const types = ['unit', 'integration', 'api'];
  if (!['LandingAPI', 'Documentation'].includes(type)) types.push('repository');
  if (['Finance', 'Healthcare', 'Enterprise', 'ERPBackend'].includes(type)) {
    types.push('security', 'regression');
  }
  if (isEnterpriseBackend(type)) types.push('performance', 'load');
  types.push('smoke');
  return [...new Set(types)];
}

function targetCoverage(type: BackendType): number {
  if (['Finance', 'Healthcare'].includes(type)) return 90;
  if (isEnterpriseBackend(type)) return 80;
  if (['LandingAPI', 'Documentation'].includes(type)) return 50;
  return 70;
}

export function planTestingArchitecture(type: BackendType): TestingArchitecture {
  const testTypes      = deriveTestTypes(type);
  const isEnterprise   = isEnterpriseBackend(type);
  const isRegulated    = ['Finance', 'Healthcare'].includes(type);
  const isSimple       = ['LandingAPI', 'Documentation'].includes(type);

  return {
    testTypes,
    hasUnitTests:         true,
    hasIntegrationTests:  !isSimple,
    hasAPITests:          !isSimple,
    hasRepositoryTests:   !isSimple,
    hasSecurityTests:     isEnterprise || isRegulated,
    hasPerformanceTests:  isEnterprise || !isSimple,
    hasLoadTests:         isEnterprise,
    hasSmokeTests:        true,
    hasRegressionTests:   isEnterprise || isRegulated,
    targetCoverage:       targetCoverage(type),
    testingFramework:     'Vitest',
  };
}
