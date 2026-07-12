// ── V8.8 QA Architect — Phase 16: Coverage Planner ───────────────────────────
import type { BackendType }     from '../backend-architect/backendTypes.js';
import type { CoverageBlueprint } from './qaTypes.js';

export function planCoverage(t: BackendType): CoverageBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isComplex   = ['Enterprise','AIPlatform','ERPBackend','MultiTenant'].includes(t);
  const isSimple    = ['LandingAPI','Documentation'].includes(t);

  const unit        = isRegulated ? 90 : isComplex ? 85 : isSimple ? 70 : 80;
  const integration = isRegulated ? 80 : isComplex ? 75 : isSimple ? 50 : 65;
  const e2e         = isRegulated ? 70 : isComplex ? 60 : isSimple ? 30 : 50;
  const api         = isRegulated ? 85 : isComplex ? 80 : isSimple ? 60 : 75;
  const critPath    = isRegulated ? 95 : isComplex ? 90 : 80;
  const overall     = Math.round((unit + integration + e2e + api + critPath) / 5);

  return {
    unitPercent:         unit,
    integrationPercent:  integration,
    e2ePercent:          e2e,
    apiPercent:          api,
    criticalPathPercent: critPath,
    overallQualityScore: overall,
    hasThresholdEnforcement: true,
    reportingTool:       'Istanbul / c8',
  };
}
