// ── V8.6 Backend Architect — Logging Architecture Planner ─────────────────────
import type { BackendType, LoggingArchitecture } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

export function planLoggingArchitecture(type: BackendType): LoggingArchitecture {
  const isEnterprise  = isEnterpriseBackend(type);
  const isRegulated   = ['Finance', 'Healthcare'].includes(type);
  const isSimple      = ['LandingAPI', 'Documentation'].includes(type);

  return {
    hasApplicationLogs:  true,
    hasAuditLogs:        isEnterprise || isRegulated || type === 'CRMBackend',
    hasSecurityLogs:     !isSimple,
    hasRequestLogs:      !isSimple,
    hasPerformanceLogs:  isEnterprise || type === 'Analytics',
    hasStructuredJSON:   true,
    logLevel:            isSimple ? 'warn' : 'info',
    logRetentionDays:    isRegulated ? 365 : isEnterprise ? 90 : 30,
    provider:            'winston',
  };
}
