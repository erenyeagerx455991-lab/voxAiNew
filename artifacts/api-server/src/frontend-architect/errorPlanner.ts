// ── V8.5 Frontend Architect — Error Architecture ──────────────────────────────

import type { ProjectType, ErrorArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planErrorArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
): ErrorArchitecture {
  const isApp = !['LandingPage', 'Portfolio'].includes(projectType);
  const isComplex = features.length > 5;

  return {
    hasErrorBoundaries: true, // always
    hasFallbackUI:      true, // always
    hasRetry:           isApp,
    hasRecovery:        isComplex,
    hasOfflineState:    projectType === 'Productivity' || projectType === 'ChatApp' || features.includes('Projects'),
    hasNetworkFailure:  isApp,
    hasApiFailure:      isApp,
  };
}
