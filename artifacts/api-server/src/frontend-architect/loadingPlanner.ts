// ── V8.5 Frontend Architect — Loading Architecture ───────────────────────────

import type { ProjectType, LoadingArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planLoadingArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
): LoadingArchitecture {
  const isDataDriven = features.includes('Dashboard') || features.includes('Analytics') || features.includes('CRM') || features.includes('Reports');
  const isRealTime   = features.includes('Chat') || projectType === 'ChatApp';
  const isApp        = !['LandingPage', 'Portfolio', 'Blog'].includes(projectType);

  return {
    hasSkeletons:          isDataDriven || isApp,
    hasProgressBars:       features.includes('Billing') || features.includes('Analytics') || isApp,
    hasOptimisticUI:       features.includes('Kanban') || features.includes('Chat') || projectType === 'Productivity',
    hasEmptyStates:        isDataDriven || features.includes('CRM') || features.includes('Projects'),
    hasLoadingIndicators:  true, // always
    hasStreaming:          features.includes('AIAssistant') || projectType === 'AIApplication',
    hasPartialRendering:   isDataDriven || isRealTime,
  };
}
