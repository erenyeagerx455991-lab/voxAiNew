// ── V8.9 Security Architect — Phase 16: Rate Limit Planner ───────────────────
import type { BackendType }     from '../backend-architect/backendTypes.js';
import type { RateLimitBlueprint } from './securityTypes.js';

export function planRateLimiting(t: BackendType): RateLimitBlueprint {
  const isHighTraffic = ['Marketplace','SocialPlatform','ECommerce','Analytics'].includes(t);
  const isAI          = t === 'AIPlatform';
  const isRegulated   = ['Finance','Healthcare'].includes(t);

  const perIPReqMin  = isHighTraffic ? 200 : isRegulated ? 60 : 100;
  const perUserReqMin= isHighTraffic ? 300 : isRegulated ? 120 : 200;

  return {
    hasPerUserLimit:      true,
    hasPerIPLimit:        true,
    hasPerAPILimit:       true,
    hasBurstProtection:   true,
    hasSlidingWindow:     true,
    hasAdaptiveLimits:    isHighTraffic || isAI,
    hasBotProtection:     !['LandingAPI'].includes(t),
    perIPRequestsPerMin:  perIPReqMin,
    perUserRequestsPerMin:perUserReqMin,
  };
}
