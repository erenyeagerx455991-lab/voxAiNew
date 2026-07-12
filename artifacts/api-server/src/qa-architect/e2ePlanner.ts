// ── V8.8 QA Architect — Phase 6: End-to-End Planner ─────────────────────────
import type { BackendType }   from '../backend-architect/backendTypes.js';
import type { E2ETestBlueprint, E2EJourney } from './qaTypes.js';

const COMMERCE_JOURNEYS: E2EJourney[]  = ['Login','Signup','Dashboard','Checkout','Profile','Settings','Logout'];
const REGULATED_JOURNEYS: E2EJourney[] = ['Login','Signup','Dashboard','Profile','Admin','Settings','Logout','Recovery','Onboarding'];
const DEFAULT_JOURNEYS: E2EJourney[]   = ['Login','Signup','Dashboard','Profile','Settings','Logout'];

export function planE2ETests(t: BackendType): E2ETestBlueprint {
  const isCommerce  = ['ECommerce','Marketplace','BookingPlatform'].includes(t);
  const isRegulated = ['Finance','Healthcare','Enterprise'].includes(t);

  const journeys: E2EJourney[] = isRegulated ? REGULATED_JOURNEYS :
                                  isCommerce  ? COMMERCE_JOURNEYS  :
                                                DEFAULT_JOURNEYS;

  const estimatedTests = journeys.length * 4 + (isRegulated ? 10 : 0);

  return {
    estimatedTests,
    journeys,
    framework:        'Playwright',
    hasRecording:     true,
    hasRetry:         true,
    hasParallelExec:  isRegulated || isCommerce,
    ciIntegration:    true,
  };
}
