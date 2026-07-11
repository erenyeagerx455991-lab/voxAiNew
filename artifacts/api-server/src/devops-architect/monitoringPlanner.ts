// ── V8.7 DevOps Architect — Monitoring Planner ───────────────────────────────
import type { BackendType, MonitoringBlueprint } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

const BASE_DASHBOARDS    = ['System Overview', 'API Latency', 'Error Rates'];
const ADVANCED_DASHBOARDS = [...BASE_DASHBOARDS, 'Business KPIs', 'Cost Analysis', 'Security Events'];

export function planMonitoring(t: BackendType): MonitoringBlueprint {
  const advanced = isEnterprise(t) || isHighTraffic(t);
  const needsDeep = advanced || t === 'AIPlatform' || t === 'Analytics';

  return {
    hasPrometheus:        !isSimple(t),
    hasGrafana:           !isSimple(t),
    hasOpenTelemetry:     advanced,
    hasMetrics:           true,
    hasTracing:           needsDeep,
    hasLogs:              true,
    metricsRetentionDays: isEnterprise(t) ? 90 : isSimple(t) ? 7 : 30,
    tracingSampleRate:    isHighTraffic(t) ? 0.01 : 0.1,
    dashboards:           advanced ? ADVANCED_DASHBOARDS : BASE_DASHBOARDS,
  };
}
