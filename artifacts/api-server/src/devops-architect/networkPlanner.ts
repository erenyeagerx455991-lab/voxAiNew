// ── V8.7 DevOps Architect — Network Planner ──────────────────────────────────
import type { BackendType, CloudProvider, NetworkBlueprint, ReverseProxyType } from './devopsTypes.js';
import { isEnterprise, isHighTraffic } from './infrastructurePlanner.js';

function chooseProxy(provider: CloudProvider): ReverseProxyType {
  if (provider === 'Cloudflare') return 'CloudFront';
  if (provider === 'Vercel')     return 'None';
  return 'Nginx';
}

export function planNetwork(t: BackendType, provider: CloudProvider): NetworkBlueprint {
  const isProtected = isEnterprise(t) || t === 'Finance' || t === 'Healthcare';

  return {
    hasCDN:            isHighTraffic(t) || isEnterprise(t),
    hasDNS:            true,
    hasHTTPS:          true,
    hasTLS:            true,
    tlsVersion:        '1.3',
    hasFirewall:       !['Railway', 'Vercel'].includes(provider),
    hasReverseProxy:   provider !== 'Vercel' && provider !== 'Railway',
    reverseProxyType:  chooseProxy(provider),
    hasDDoSProtection: isProtected || provider === 'Cloudflare',
    hasWAF:            isProtected || isEnterprise(t),
  };
}
