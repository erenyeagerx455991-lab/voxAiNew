// ── V8.7 DevOps Architect — Infrastructure Performance Planner ────────────────
import type { BackendType, CloudProvider, DevOpsPerformanceBlueprint } from './devopsTypes.js';
import { isHighTraffic, isEnterprise, isSimple } from './infrastructurePlanner.js';

export function planDevOpsPerformance(t: BackendType, provider: CloudProvider): DevOpsPerformanceBlueprint {
  const advanced = isHighTraffic(t) || isEnterprise(t);

  return {
    hasCDNCache:          advanced || provider === 'Cloudflare',
    hasRedis:             !isSimple(t),
    hasCompression:       true,
    hasImageOptimization: t === 'ECommerce' || t === 'Marketplace' || t === 'SocialPlatform',
    hasHTTP2:             true,
    hasHTTP3:             advanced || provider === 'Cloudflare',
    edgeCaching:          provider === 'Cloudflare' || provider === 'Vercel',
    targetP99LatencyMs:   isSimple(t) ? 500 : isHighTraffic(t) ? 100 : 200,
  };
}
