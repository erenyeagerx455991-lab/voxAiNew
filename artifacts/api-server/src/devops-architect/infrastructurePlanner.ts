// ── V8.7 DevOps Architect — Infrastructure Detection Planner ──────────────────
import type {
  BackendType, InfrastructureType, InfrastructureBlueprint,
} from './devopsTypes.js';

const HIGH_TRAFFIC: BackendType[] = [
  'Marketplace', 'SocialPlatform', 'AIPlatform', 'MicroserviceCandidate',
  'APIGateway', 'Analytics', 'ECommerce',
];
const ENTERPRISE: BackendType[] = [
  'Enterprise', 'MultiTenant', 'Healthcare', 'Finance', 'ERPBackend',
];
const SIMPLE: BackendType[] = ['LandingAPI', 'Documentation', 'ServerlessCandidate'];

export function isHighTraffic(t: BackendType): boolean { return HIGH_TRAFFIC.includes(t); }
export function isEnterprise(t: BackendType): boolean  { return ENTERPRISE.includes(t); }
export function isSimple(t: BackendType): boolean      { return SIMPLE.includes(t); }

function chooseType(t: BackendType): { type: InfrastructureType; confidence: number } {
  if (t === 'ServerlessCandidate') return { type: 'Serverless',    confidence: 0.95 };
  if (t === 'MicroserviceCandidate') return { type: 'Kubernetes',   confidence: 0.92 };
  if (t === 'APIGateway')           return { type: 'Kubernetes',   confidence: 0.88 };
  if (t === 'Cloudflare' as any || t === 'DeveloperPlatform') return { type: 'Edge', confidence: 0.85 };
  if (isEnterprise(t))             return { type: 'Kubernetes',   confidence: 0.82 };
  if (isHighTraffic(t))            return { type: 'DockerCompose', confidence: 0.78 };
  if (isSimple(t))                 return { type: 'Docker',       confidence: 0.90 };
  return { type: 'DockerCompose', confidence: 0.75 };
}

function chooseRegions(t: BackendType): string[] {
  if (isEnterprise(t) || isHighTraffic(t)) return ['us-east-1', 'eu-west-1'];
  if (isSimple(t)) return ['us-east-1'];
  return ['us-east-1'];
}

function chooseReplicas(t: BackendType): number {
  if (t === 'MicroserviceCandidate' || isEnterprise(t)) return 3;
  if (isHighTraffic(t)) return 2;
  if (isSimple(t)) return 1;
  return 2;
}

export function detectInfrastructure(t: BackendType): InfrastructureBlueprint {
  const { type, confidence } = chooseType(t);
  const regions = chooseRegions(t);

  return {
    type,
    confidence,
    hasContainers:    type !== 'Serverless' && type !== 'Edge',
    hasOrchestration: type === 'Kubernetes',
    hasServiceMesh:   type === 'Kubernetes' && isEnterprise(t),
    hasLoadBalancer:  type !== 'SingleServer' && type !== 'Docker',
    hasCDN:           isHighTraffic(t) || isEnterprise(t),
    regions,
    replicaCount:     chooseReplicas(t),
  };
}
