// ── V8.8 QA Architect — Phase 4: API Test Planner ────────────────────────────
import type { BackendType }     from '../backend-architect/backendTypes.js';
import type { APITestBlueprint } from './qaTypes.js';

export function planAPITests(t: BackendType): APITestBlueprint {
  const hasPublicAPI = !['LandingAPI','Documentation'].includes(t);
  const isFinancial  = t === 'Finance' || t === 'ECommerce';

  return {
    estimatedTests:     hasPublicAPI ? 80 : 20,
    verbs:              ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    hasHeaderTests:     true,
    hasAuthTests:       true,
    hasErrorTests:      true,
    hasValidationTests: true,
    hasRateLimitTests:  hasPublicAPI,
    hasTimeoutTests:    hasPublicAPI,
    frameworks:         ['Supertest', 'Vitest'],
  };
}
