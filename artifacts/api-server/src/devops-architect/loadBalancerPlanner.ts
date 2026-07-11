// ── V8.7 DevOps Architect — Load Balancer Planner ────────────────────────────
import type { BackendType, InfrastructureType, LoadBalancerBlueprint, LoadBalancingStrategy } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

function chooseStrategy(t: BackendType): LoadBalancingStrategy {
  if (t === 'SocialPlatform' || isHighTraffic(t)) return 'LeastConnections';
  if (isEnterprise(t)) return 'GeoRouting';
  if (t === 'BookingPlatform' || t === 'CRMBackend') return 'StickySessions';
  return 'RoundRobin';
}

export function planLoadBalancer(t: BackendType, infra: InfrastructureType): LoadBalancerBlueprint {
  const needsLB = infra !== 'SingleServer' && infra !== 'Serverless' && infra !== 'Edge';

  return {
    strategy:            needsLB ? chooseStrategy(t) : 'RoundRobin',
    hasHealthChecks:     true,
    hasSSLTermination:   true,
    hasStickySession:    chooseStrategy(t) === 'StickySessions',
    hasGeoRouting:       isEnterprise(t) || t === 'Marketplace',
    healthCheckPath:     '/health',
    healthCheckInterval: isHighTraffic(t) ? 5 : 10,
  };
}
