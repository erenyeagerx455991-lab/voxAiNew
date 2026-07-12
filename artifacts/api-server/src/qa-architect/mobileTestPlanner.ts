// ── V8.8 QA Architect — Phase 10: Mobile Test Planner ────────────────────────
import type { BackendType }      from '../backend-architect/backendTypes.js';
import type { MobileTestBlueprint } from './qaTypes.js';

const MOBILE_HEAVY: BackendType[] = ['ECommerce','SocialPlatform','BookingPlatform','Marketplace'];

export function planMobileTests(t: BackendType): MobileTestBlueprint {
  const isMobileHeavy = MOBILE_HEAVY.includes(t);

  return {
    hasTouchTests:       true,
    hasGestureTests:     isMobileHeavy,
    hasViewportTests:    true,
    hasKeyboardTests:    true,
    hasSafeAreaTests:    true,
    hasOrientationTests: isMobileHeavy,
    hasPerformanceTests: true,
    devices:             ['iPhone 14','Pixel 7','Samsung Galaxy S23','iPad Pro'],
  };
}
