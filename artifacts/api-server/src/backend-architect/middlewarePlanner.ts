// ── V8.6 Backend Architect — Middleware Architecture Planner ──────────────────
import type { BackendType, MiddlewareArchitecture } from './backendTypes.js';
import { isEnterpriseBackend, isHighTrafficBackend } from './backendPlanner.js';

export function planMiddlewareArchitecture(type: BackendType): MiddlewareArchitecture {
  const hasAuth     = !['LandingAPI', 'Documentation'].includes(type);
  const isEnterprise = isEnterpriseBackend(type);
  const isHighTraffic = isHighTrafficBackend(type);

  const middlewares: string[] = ['cors', 'helmet', 'compression', 'requestId', 'requestLogger'];
  if (hasAuth) middlewares.push('authenticate', 'authorize');
  middlewares.push('rateLimiter', 'validate', 'errorHandler');
  if (isEnterprise || isHighTraffic) middlewares.push('tracing', 'metrics');
  if (type === 'Healthcare' || type === 'Finance') middlewares.push('auditLog', 'ipWhitelist');

  return {
    middlewares: [...new Set(middlewares)],
    hasAuth,
    hasAuthZ:       hasAuth,
    hasLogging:     true,
    hasRateLimit:   true,
    hasCompression: true,
    hasCORS:        true,
    hasHelmet:      true,
    hasValidation:  true,
    hasRequestID:   true,
    hasTracing:     isEnterprise || isHighTraffic,
    hasMetrics:     isEnterprise || isHighTraffic,
  };
}
