// ── V8.7 DevOps Architect — Cost Planner ─────────────────────────────────────
import type { BackendType, CloudProvider, CostBlueprint, InfrastructureType } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

const MULTIPLIER: Record<CloudProvider, number> = {
  AWS: 1.0, GCP: 0.92, Azure: 1.05, Cloudflare: 0.60,
  DigitalOcean: 0.55, Railway: 0.40, FlyIo: 0.45,
  Vercel: 0.35, SelfHosted: 0.80,
};

const BASE_COMPUTE: Record<string, number> = {
  SingleServer: 20, Docker: 30, DockerCompose: 60,
  Kubernetes: 200, Serverless: 10, Edge: 15, Hybrid: 150, MultiCloud: 300,
};

function baseCompute(infra: InfrastructureType): number {
  return BASE_COMPUTE[infra] ?? 60;
}

const SUGGESTIONS: Record<string, string[]> = {
  simple: ['Use Railway or Vercel free tier to minimise costs', 'Enable Vercel Analytics instead of Datadog'],
  standard: ['Use spot/preemptible instances for non-critical workers', 'Enable auto-scaling to avoid over-provisioning', 'Cache DB queries to reduce compute hours'],
  enterprise: ['Reserved instances can save 30–60% on compute', 'Use S3 Intelligent-Tiering for cold storage', 'Enable VPC endpoints to avoid NAT gateway data transfer fees', 'Right-size K8s node pools with Goldilocks'],
};

export function planCost(
  t: BackendType,
  provider: CloudProvider,
  infra: InfrastructureType,
): CostBlueprint {
  const mult    = MULTIPLIER[provider] ?? 1.0;
  const compute = Math.round(baseCompute(infra) * mult);
  const storage = isSimple(t) ? 2 : isEnterprise(t) ? 80 : 20;
  const bw      = isHighTraffic(t) ? 50 : isSimple(t) ? 2 : 15;
  const ai      = t === 'AIPlatform' ? 300 : t === 'Analytics' ? 50 : 0;
  const cache   = isSimple(t) ? 0 : isEnterprise(t) ? 30 : 10;
  const mon     = isSimple(t) ? 0 : isEnterprise(t) ? 40 : 15;
  const tier    = isSimple(t) ? 'simple' : isEnterprise(t) ? 'enterprise' : 'standard';

  return {
    estimatedMonthlyUSD: compute + storage + bw + ai + cache + mon,
    compute,
    storage,
    bandwidth:  bw,
    aiInference: ai,
    cache,
    monitoring: mon,
    optimizationSuggestions: SUGGESTIONS[tier] ?? SUGGESTIONS.standard,
    savingsOpportunities: isEnterprise(t)
      ? ['Reserved instances ~40% savings', 'Auto-scaling prevents idle waste']
      : ['Right-size to actual usage', 'Cache API responses at CDN layer'],
  };
}
