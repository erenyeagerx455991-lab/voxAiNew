// ── V8.7 DevOps Architect — Cloud Provider Planner ────────────────────────────
import type { BackendType, InfrastructureType, CloudProvider, CloudBlueprint } from './devopsTypes.js';
import { isHighTraffic, isEnterprise, isSimple } from './infrastructurePlanner.js';

const RATIONALE: Record<CloudProvider, string> = {
  AWS:          'Broadest service portfolio, best for regulated and enterprise workloads',
  GCP:          'Best-in-class ML/AI infrastructure and global networking',
  Azure:        'Optimal for enterprise Microsoft/Active Directory environments',
  Cloudflare:   'Edge-first, ultra-low latency, global CDN and Workers platform',
  DigitalOcean: 'Simple pricing, developer-friendly, cost-effective for SMBs',
  Railway:      'Frictionless deployment for startup MVPs, instant Postgres/Redis',
  FlyIo:        'Global edge deployment with minimal ops overhead',
  Vercel:       'Best for JAMstack frontends and serverless backends',
  SelfHosted:   'Full control, on-premise or private cloud for regulated data',
};

function chooseProvider(
  t: BackendType,
  infra: InfrastructureType,
): CloudProvider {
  if (infra === 'Serverless') return 'Vercel';
  if (infra === 'Edge') return 'Cloudflare';
  if (t === 'Healthcare' || t === 'Finance') return 'AWS';
  if (t === 'AIPlatform') return 'GCP';
  if (t === 'ERPBackend' || t === 'Enterprise') return 'Azure';
  if (isEnterprise(t)) return 'AWS';
  if (isHighTraffic(t)) return 'AWS';
  if (isSimple(t)) return 'Railway';
  return 'AWS';
}

function chooseRegion(provider: CloudProvider): string {
  const primary: Record<CloudProvider, string> = {
    AWS: 'us-east-1', GCP: 'us-central1', Azure: 'eastus',
    Cloudflare: 'global', DigitalOcean: 'nyc3', Railway: 'us-east',
    FlyIo: 'iad', Vercel: 'iad1', SelfHosted: 'on-premise',
  };
  return primary[provider] ?? 'us-east-1';
}

export function planCloud(t: BackendType, infra: InfrastructureType): CloudBlueprint {
  const provider = chooseProvider(t, infra);
  const region   = chooseRegion(provider);
  const secondary = isEnterprise(t) || isHighTraffic(t)
    ? provider === 'AWS' ? ['eu-west-1'] : ['us-east1'] : [];

  return {
    provider,
    region,
    secondaryRegions:   secondary,
    hasMultiRegion:     secondary.length > 0,
    hasAutoScaling:     infra !== 'SingleServer',
    hasManagedDatabase: provider !== 'SelfHosted',
    hasManagedCache:    !isSimple(t),
    hasObjectStorage:   true,
    hasCDN:             isHighTraffic(t) || isEnterprise(t),
    rationale:          RATIONALE[provider],
  };
}
