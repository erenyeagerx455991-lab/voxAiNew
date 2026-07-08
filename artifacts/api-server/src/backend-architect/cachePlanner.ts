// ── V8.6 Backend Architect — Cache Architecture Planner ───────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, CacheArchitecture, CacheLayer } from './backendTypes.js';
import { isEnterpriseBackend, isHighTrafficBackend, isSimpleBackend } from './backendPlanner.js';

function chooseLayers(type: BackendType, features: ProductFeature[]): CacheLayer[] {
  if (isSimpleBackend(type)) return ['Memory'];

  const layers: CacheLayer[] = ['Redis', 'Memory'];
  if (type === 'Analytics' || features.includes('Analytics')) layers.push('Query');
  if (isHighTrafficBackend(type)) layers.push('Response', 'CDN');
  if (type === 'AIPlatform') layers.push('Response');
  if (['ECommerce', 'Marketplace'].includes(type)) layers.push('CDN');
  return [...new Set(layers)] as CacheLayer[];
}

function chooseTTL(type: BackendType): number {
  if (isSimpleBackend(type)) return 300;
  if (type === 'Analytics') return 60;
  if (type === 'AIPlatform') return 3600;
  if (isEnterpriseBackend(type)) return 900;
  return 300;
}

export function planCacheArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): CacheArchitecture {
  const layers      = chooseLayers(type, features);
  const hasRedis    = layers.includes('Redis');
  const isSimple    = isSimpleBackend(type);
  const isHighTraffic = isHighTrafficBackend(type);

  return {
    layers,
    primaryLayer:         hasRedis ? 'Redis' : 'Memory',
    hasRedis,
    hasMemoryCache:       true,
    hasEdgeCache:         layers.includes('Edge'),
    hasQueryCache:        layers.includes('Query') || type === 'Analytics',
    hasResponseCache:     layers.includes('Response') || isHighTraffic,
    hasCDNCache:          layers.includes('CDN'),
    hasCacheInvalidation: !isSimple,
    defaultTTL:           chooseTTL(type),
    ttlStrategy:          type === 'Analytics' ? 'Sliding' : isEnterpriseBackend(type) ? 'Dynamic' : 'Fixed',
  };
}
