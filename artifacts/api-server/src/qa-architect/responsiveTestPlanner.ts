// ── V8.8 QA Architect — Phase 8: Responsive Test Planner ─────────────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { ResponsiveTestBlueprint, Viewport } from './qaTypes.js';

const ALL_VIEWPORTS: Viewport[] = ['Desktop','Laptop','Tablet','Mobile','Landscape','Portrait'];

export function planResponsiveTests(t: BackendType): ResponsiveTestBlueprint {
  const isMobileFirst = ['ECommerce','SocialPlatform','BookingPlatform','Marketplace'].includes(t);
  const viewports: Viewport[] = isMobileFirst ? ALL_VIEWPORTS : ['Desktop','Laptop','Tablet','Mobile'];

  return {
    viewports,
    breakpoints:          ['320px','768px','1024px','1280px','1440px'],
    hasOrientationTests:  isMobileFirst,
    tools:                ['Playwright','BrowserStack'],
    snapshotPerViewport:  true,
  };
}
