// ── V8.6 Backend Architect — API Architecture Planner ─────────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, APIArchitecture, APIStyle } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function choosePrimaryStyle(type: BackendType, features: ProductFeature[]): APIStyle {
  if (features.includes('Chat') || features.includes('Notifications')) return 'REST';
  if (type === 'AIPlatform') return 'Streaming';
  if (type === 'SocialPlatform') return 'REST';
  if (type === 'DeveloperPlatform') return 'REST';
  if (isEnterpriseBackend(type) && features.length > 10) return 'GraphQL';
  if (type === 'Analytics') return 'REST';
  return 'REST';
}

export function planAPIArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): APIArchitecture {
  const primaryStyle  = choosePrimaryStyle(type, features);
  const hasRealtime   = features.includes('Chat') || features.includes('Notifications') || type === 'SocialPlatform';
  const hasAI         = features.includes('AI') || type === 'AIPlatform';
  const isEnterprise  = isEnterpriseBackend(type);
  const isSimple      = ['LandingAPI', 'Documentation'].includes(type);
  const hasEcommerce  = ['ECommerce', 'Marketplace'].includes(type);

  return {
    primaryStyle,
    hasREST:         true,
    hasGraphQL:      isEnterprise && features.length > 8,
    hasTRPC:         false,
    hasWebSocket:    hasRealtime,
    hasSSE:          hasAI || hasRealtime,
    hasStreaming:     hasAI,
    hasPagination:   !isSimple,
    hasFiltering:    !isSimple,
    hasSorting:      !isSimple,
    hasSearch:       features.includes('Search') || ['CRM', 'CMS', 'Marketplace', 'ECommerce'].includes(type) ||
                     features.some(f => ['CRM', 'Dashboard'].includes(f)),
    hasBulkAPIs:     isEnterprise || hasEcommerce,
    hasHealthAPI:    true,
    hasVersioning:   !isSimple,
    hasRateLimiting: true,
    apiPrefix:       '/api',
    versionPrefix:   '/v1',
  };
}
