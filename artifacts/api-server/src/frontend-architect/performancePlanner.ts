// ── V8.5 Frontend Architect — Performance Architecture ───────────────────────

import type { ProjectType, PerformanceArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planPerformanceArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
): PerformanceArchitecture {
  const isLargeApp  = features.length > 8 || isEnterpriseType(projectType);
  const hasCharts   = features.includes('Analytics') || features.includes('Reports');
  const hasTables   = features.includes('CRM') || features.includes('Dashboard') || features.includes('Reports');

  return {
    hasLazyLoading:       true, // always on
    hasRouteSplitting:    true, // always on for any multi-page app
    hasMemoization:       isLargeApp || hasCharts,
    hasVirtualization:    hasTables || features.includes('Search'),
    hasSuspense:          true,
    hasImageOptimization: projectType === 'ECommerce' || projectType === 'Marketplace' || projectType === 'Blog' || projectType === 'Portfolio',
    bundleStrategy:       resolveBundleStrategy(projectType, features),
    estimatedBundleSize:  estimateBundleSize(projectType, features),
  };
}

function isEnterpriseType(projectType: ProjectType): boolean {
  return ['ERP', 'EnterprisePlatform', 'CRM', 'Analytics'].includes(projectType);
}

function resolveBundleStrategy(projectType: ProjectType, features: ProductFeature[]): PerformanceArchitecture['bundleStrategy'] {
  if (['LandingPage', 'Portfolio', 'Blog'].includes(projectType)) return 'minimal';
  if (isEnterpriseType(projectType) || features.length > 10) return 'aggressive';
  return 'balanced';
}

function estimateBundleSize(projectType: ProjectType, features: ProductFeature[]): PerformanceArchitecture['estimatedBundleSize'] {
  if (['LandingPage', 'Portfolio'].includes(projectType)) return 'small';
  if (features.length > 8 || isEnterpriseType(projectType)) return 'large';
  return 'medium';
}
