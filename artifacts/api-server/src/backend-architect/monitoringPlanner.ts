// ── V8.6 Backend Architect — Monitoring Architecture Planner ──────────────────
import type { BackendType, MonitoringArchitecture } from './backendTypes.js';
import { isEnterpriseBackend, isHighTrafficBackend } from './backendPlanner.js';

function getHealthEndpoints(type: BackendType): string[] {
  const base = ['/health', '/health/live', '/health/ready'];
  if (isEnterpriseBackend(type) || isHighTrafficBackend(type)) {
    base.push('/health/db', '/health/cache', '/metrics');
  }
  return base;
}

export function planMonitoringArchitecture(type: BackendType): MonitoringArchitecture {
  const isEnterprise  = isEnterpriseBackend(type);
  const isHighTraffic = isHighTrafficBackend(type);
  const needsDeep     = isEnterprise || isHighTraffic || ['Finance', 'Healthcare'].includes(type);

  return {
    hasHealthChecks:       true,
    hasMetrics:            needsDeep,
    hasTracing:            needsDeep,
    hasOpenTelemetry:      isEnterprise || isHighTraffic,
    hasAlerts:             needsDeep,
    hasCrashReports:       !['LandingAPI', 'Documentation'].includes(type),
    hasSlowQueryDetection: needsDeep,
    healthEndpoints:       getHealthEndpoints(type),
  };
}
