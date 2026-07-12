// ── V9.0 Runtime Intelligence — Optimization Strategy Planner ────────────────
import type { GenerationMode, OptimizationStrategy, BundleSizeTarget, RuntimeIntelligenceInput } from './runtimeTypes.js';

const BUNDLE_MAP: Record<GenerationMode, BundleSizeTarget> = {
  Fast:         'minimal',
  Balanced:     'standard',
  Quality:      'feature-rich',
  Enterprise:   'feature-rich',
  Creative:     'feature-rich',
  Strict:       'standard',
  Experimental: 'feature-rich',
  Safe:         'minimal',
};

export function planOptimizationStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): OptimizationStrategy {
  const isEnterprise  = mode === 'Enterprise' || input.hasCompliance;
  const isLanding     = input.productGoal.toLowerCase().includes('landing')
                     || input.backendType === 'LandingAPI';
  const isDashboard   = input.backendType === 'Dashboard'
                     || input.productGoal.toLowerCase().includes('dashboard');

  // SEO over motion: landing pages, marketing sites
  const seoOverMotion = isLanding;
  // Performance over animation: dashboards, enterprise, data-heavy apps
  const performanceOverAnimation = isDashboard || isEnterprise || mode === 'Strict';
  // Design quality over speed: Quality, Creative modes
  const designQualityOverSpeed = mode === 'Quality' || mode === 'Creative' || mode === 'Enterprise';
  // Accessibility priority: Enterprise, Strict, Healthcare
  const accessibilityPriority = isEnterprise || mode === 'Strict'
    || input.backendType === 'Healthcare';

  const signals: string[] = [];
  if (seoOverMotion)             signals.push('SEO>motion');
  if (performanceOverAnimation)  signals.push('perf>animation');
  if (accessibilityPriority)     signals.push('a11y-priority');
  if (designQualityOverSpeed)    signals.push('quality>speed');

  return {
    performanceOverAnimation,
    seoOverMotion,
    designQualityOverSpeed,
    accessibilityPriority,
    bundleSizeTarget: BUNDLE_MAP[mode],
    rationale: signals.length
      ? `${mode} optimization: ${signals.join(', ')}`
      : `${mode} optimization: balanced defaults`,
  };
}
