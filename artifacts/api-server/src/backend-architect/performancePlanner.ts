// ── V8.6 Backend Architect — Backend Performance Planner ──────────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, BackendPerformanceArchitecture, ScalingStrategy } from './backendTypes.js';
import { isEnterpriseBackend, isHighTrafficBackend, isSimpleBackend } from './backendPlanner.js';

function estimateRPS(type: BackendType): number {
  const rpsMap: Partial<Record<BackendType, number>> = {
    LandingAPI:            100,
    Documentation:          50,
    ServerlessCandidate:   500,
    Dashboard:             200,
    SaaSBackend:           500,
    CRMBackend:            300,
    Analytics:            1000,
    AIPlatform:            200,
    SocialPlatform:       5000,
    Marketplace:          2000,
    ECommerce:            1000,
    MicroserviceCandidate:5000,
    APIGateway:           10000,
    Finance:               500,
    Healthcare:            200,
    Education:             300,
    BookingPlatform:       200,
    ERPBackend:            300,
    Enterprise:            500,
    MultiTenant:          1000,
  };
  return rpsMap[type] ?? 500;
}

function chooseScaling(type: BackendType): ScalingStrategy {
  if (type === 'ServerlessCandidate') return 'Auto';
  if (isHighTrafficBackend(type)) return 'Horizontal';
  return 'Horizontal';
}

export function planPerformanceArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): BackendPerformanceArchitecture {
  const isSimple     = isSimpleBackend(type);
  const isEnterprise = isEnterpriseBackend(type);
  const isHighTraffic = isHighTrafficBackend(type);
  const hasMedia     = features.includes('Media') || features.includes('FileUpload') ||
                       ['Marketplace', 'ECommerce', 'CMS', 'SocialPlatform'].includes(type);

  return {
    hasConnectionPooling:   !isSimple,
    hasQueryOptimization:   !isSimple,
    hasNPlusOneProtection:  !isSimple,
    hasResponseCompression: true,
    hasHTTP2:               !isSimple,
    estimatedRPS:           estimateRPS(type),
    scalingStrategy:        chooseScaling(type),
    hasCDN:                 hasMedia || isHighTraffic || ['ECommerce', 'Marketplace'].includes(type),
  };
}
