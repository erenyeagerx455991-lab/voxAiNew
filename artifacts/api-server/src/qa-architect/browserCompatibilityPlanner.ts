// ── V8.8 QA Architect — Phase 9: Browser Compatibility Planner ───────────────
import type { BackendType }               from '../backend-architect/backendTypes.js';
import type { BrowserCompatibilityBlueprint, BrowserName } from './qaTypes.js';

const ALL_BROWSERS: BrowserName[] = ['Chrome','Firefox','Safari','Edge','Brave','MobileChrome','MobileSafari'];

export function planBrowserCompatibility(t: BackendType): BrowserCompatibilityBlueprint {
  const isMobileFirst = ['ECommerce','SocialPlatform','BookingPlatform','Marketplace'].includes(t);
  const isEnterprise  = ['Enterprise','ERPBackend','Finance'].includes(t);

  const criticalBrowsers: BrowserName[] = isEnterprise
    ? ['Chrome','Firefox','Edge','Safari']
    : isMobileFirst
      ? ['Chrome','Safari','MobileChrome','MobileSafari']
      : ['Chrome','Firefox','Safari','Edge'];

  const matrix = {} as Record<BrowserName, { support: boolean; minVersion: string }>;
  const MIN_VERSIONS: Record<BrowserName, string> = {
    Chrome: '110', Firefox: '109', Safari: '16', Edge: '110',
    Brave: '1.50', MobileChrome: '110', MobileSafari: '16',
  };
  for (const b of ALL_BROWSERS) {
    matrix[b] = { support: true, minVersion: MIN_VERSIONS[b] };
  }

  return {
    browsers:        ALL_BROWSERS,
    hasAutomation:   true,
    matrix,
    tools:           ['Playwright','BrowserStack'],
    criticalBrowsers,
  };
}
