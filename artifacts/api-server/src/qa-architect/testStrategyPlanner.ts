// ── V8.8 QA Architect — Phase 1: Test Strategy Planner ───────────────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { TestStrategyBlueprint, QAStrategy } from './qaTypes.js';

const API_FIRST:   BackendType[] = ['APIGateway', 'LandingAPI'];
const UI_FIRST:    BackendType[] = ['ECommerce', 'SocialPlatform', 'BookingPlatform'];
const INTEG_FIRST: BackendType[] = ['Marketplace', 'Marketplace', 'ERPBackend', 'CRMBackend'];
const E2E_FIRST:   BackendType[] = ['Finance', 'Healthcare'];

export function planTestStrategy(t: BackendType): TestStrategyBlueprint {
  let strategy: QAStrategy = 'unit-first';
  if (E2E_FIRST.includes(t))    strategy = 'e2e-first';
  else if (API_FIRST.includes(t))  strategy = 'api-first';
  else if (UI_FIRST.includes(t))   strategy = 'ui-first';
  else if (INTEG_FIRST.includes(t))strategy = 'integration-first';

  const confidence =
    strategy === 'e2e-first'          ? 0.91 :
    strategy === 'api-first'          ? 0.88 :
    strategy === 'ui-first'           ? 0.85 :
    strategy === 'integration-first'  ? 0.84 :
                                        0.87;

  const RATIONALES: Record<QAStrategy, string> = {
    'unit-first':         'Foundational business logic must be bullet-proof before integration.',
    'integration-first':  'Complex service integrations are the highest failure surface.',
    'api-first':          'Public API contracts are the primary consumer interface.',
    'ui-first':           'User-facing UI is critical for conversion; visual regressions cause churn.',
    'e2e-first':          'Regulated workflows require full end-to-end coverage before release.',
  };

  const ALL: QAStrategy[] = ['unit-first', 'integration-first', 'api-first', 'ui-first', 'e2e-first'];
  const priorityOrder = [strategy, ...ALL.filter(s => s !== strategy)];

  const PYRAMIDS: Record<QAStrategy, { unit: number; integration: number; e2e: number }> = {
    'unit-first':         { unit: 70, integration: 20, e2e: 10 },
    'integration-first':  { unit: 40, integration: 45, e2e: 15 },
    'api-first':          { unit: 30, integration: 50, e2e: 20 },
    'ui-first':           { unit: 30, integration: 30, e2e: 40 },
    'e2e-first':          { unit: 25, integration: 25, e2e: 50 },
  };

  return {
    strategy,
    confidence,
    rationale:        RATIONALES[strategy],
    priorityOrder,
    automationTarget: strategy === 'e2e-first' ? 85 : strategy === 'unit-first' ? 95 : 90,
    testPyramidRatios:PYRAMIDS[strategy],
  };
}
