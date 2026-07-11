// ── V8.7 DevOps Architect — CDN Planner ──────────────────────────────────────
import type { BackendType, CloudProvider, CDNBlueprint } from './devopsTypes.js';
import { isHighTraffic, isEnterprise, isSimple } from './infrastructurePlanner.js';

type CDNProvider = CDNBlueprint['provider'];

function chooseCDNProvider(provider: CloudProvider): CDNProvider {
  if (provider === 'AWS')          return 'CloudFront';
  if (provider === 'Cloudflare')   return 'Cloudflare';
  if (provider === 'GCP')          return 'Fastly';
  if (provider === 'Azure')        return 'Akamai';
  return 'None';
}

function deriveCDNRules(t: BackendType): string[] {
  const rules = ['Cache static assets (js/css/images) for 1 year'];
  if (!isSimple(t)) rules.push('Cache API responses (GET) for 60s');
  if (isHighTraffic(t)) rules.push('Serve stale-while-revalidate on cache miss');
  if (isEnterprise(t)) rules.push('Geo-routing to nearest PoP');
  if (t === 'ECommerce' || t === 'Marketplace') rules.push('Purge product pages on inventory change');
  return rules;
}

export function planCDN(t: BackendType, provider: CloudProvider): CDNBlueprint {
  const cdnNeeded = isHighTraffic(t) || isEnterprise(t);

  return {
    enabled:          cdnNeeded,
    provider:         cdnNeeded ? chooseCDNProvider(provider) : 'None',
    hasEdgeCaching:   cdnNeeded,
    hasImageOptimize: t === 'ECommerce' || t === 'Marketplace' || t === 'SocialPlatform',
    hasCompression:   true,
    cacheTTLSeconds:  isHighTraffic(t) ? 3600 : isSimple(t) ? 86400 : 3600,
    rules:            deriveCDNRules(t),
  };
}
