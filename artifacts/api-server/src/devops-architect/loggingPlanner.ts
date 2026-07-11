// ── V8.7 DevOps Architect — Logging Planner ──────────────────────────────────
import type { BackendType, LoggingBlueprint, LogAggregator } from './devopsTypes.js';
import { isEnterprise, isSimple } from './infrastructurePlanner.js';

function chooseAggregator(t: BackendType): LogAggregator {
  if (isSimple(t)) return 'Stdout';
  if (t === 'Finance' || t === 'Healthcare' || t === 'Enterprise') return 'ELK';
  if (t === 'AIPlatform' || t === 'Analytics') return 'Datadog';
  return 'Loki';
}

export function planLogging(t: BackendType): LoggingBlueprint {
  const isRegulated = t === 'Finance' || t === 'Healthcare';

  return {
    format:         'JSON',
    hasJSONLogs:    true,
    hasRequestLogs: true,
    hasAuditLogs:   isEnterprise(t) || isRegulated,
    hasErrorLogs:   true,
    hasAILogs:      t === 'AIPlatform' || t === 'Analytics',
    retentionDays:  isEnterprise(t) ? 365 : isRegulated ? 730 : 30,
    aggregator:     chooseAggregator(t),
  };
}
