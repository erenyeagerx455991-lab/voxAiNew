// ── V8.8 QA Architect — Phase 5: Contract Test Planner ───────────────────────
import type { BackendType }        from '../backend-architect/backendTypes.js';
import type { ContractTestBlueprint } from './qaTypes.js';

export function planContractTests(t: BackendType): ContractTestBlueprint {
  const hasPublicAPI  = !['LandingAPI','Documentation'].includes(t);
  const isMicroservice= t === 'MicroserviceCandidate' || t === 'APIGateway';

  return {
    hasContractTests:           hasPublicAPI,
    checkedAspects:             ['schema', 'version', 'breaking changes', 'response shape', 'error format'],
    hasVersioning:              hasPublicAPI,
    hasBreakingChangeDetection: hasPublicAPI,
    hasResponseShape:           true,
    hasErrorFormat:             true,
    providerTestCount:          isMicroservice ? 12 : hasPublicAPI ? 6 : 2,
    consumerTestCount:          isMicroservice ? 8  : hasPublicAPI ? 4 : 1,
  };
}
