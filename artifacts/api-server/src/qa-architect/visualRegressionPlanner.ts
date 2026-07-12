// ── V8.8 QA Architect — Phase 13: Visual Regression Planner ──────────────────
import type { BackendType }            from '../backend-architect/backendTypes.js';
import type { VisualRegressionBlueprint } from './qaTypes.js';

export function planVisualRegression(t: BackendType): VisualRegressionBlueprint {
  const isUIHeavy   = ['ECommerce','SocialPlatform','Marketplace','BookingPlatform'].includes(t);
  const isEnterprise= ['Enterprise','Finance','ERPBackend'].includes(t);
  const snapshotCount = isUIHeavy ? 80 : isEnterprise ? 50 : 30;

  return {
    hasScreenshotComparison:    true,
    hasLayoutDriftDetection:    true,
    hasSpacingDriftDetection:   true,
    hasTypographyDriftDetection:true,
    hasThemeDriftDetection:     isUIHeavy || isEnterprise,
    hasMotionDriftDetection:    isUIHeavy,
    tools:                      ['Playwright','Percy','Chromatic'],
    snapshotCount,
    diffThresholdPercent:       isUIHeavy ? 1 : 2,
  };
}
