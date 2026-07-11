// ── V8.7 DevOps Architect — Alert Planner ────────────────────────────────────
import type { BackendType, AlertBlueprint } from './devopsTypes.js';
import { isEnterprise, isHighTraffic, isSimple } from './infrastructurePlanner.js';

const BASE_ALERTS = ['cpu', 'memory', 'latency', 'error-rate'];
const FULL_ALERTS  = [...BASE_ALERTS, 'queue-backlog', 'database', 'api', 'disk'];
const ADVANCED     = [...FULL_ALERTS, 'cost-anomaly', 'security-event'];

function buildAlerts(t: BackendType): string[] {
  if (isSimple(t)) return BASE_ALERTS;
  if (isEnterprise(t) || isHighTraffic(t)) return ADVANCED;
  return FULL_ALERTS;
}

function buildChannels(t: BackendType): string[] {
  const channels = ['email'];
  if (!isSimple(t)) channels.push('slack');
  if (isEnterprise(t)) channels.push('pagerduty', 'opsgenie');
  return channels;
}

export function planAlerts(t: BackendType): AlertBlueprint {
  const alerts = buildAlerts(t);

  return {
    alerts,
    hasCPUAlert:          true,
    hasMemoryAlert:       true,
    hasLatencyAlert:      true,
    hasErrorRateAlert:    true,
    hasQueueBacklogAlert: alerts.includes('queue-backlog'),
    hasDatabaseAlert:     alerts.includes('database'),
    hasAPIAlert:          alerts.includes('api'),
    channels:             buildChannels(t),
    oncallRotation:       isEnterprise(t) || isHighTraffic(t),
  };
}
