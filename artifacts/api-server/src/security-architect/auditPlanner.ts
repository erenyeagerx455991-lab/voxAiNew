// ── V8.9 Security Architect — Phase 9: Audit Planner ─────────────────────────
import type { BackendType }  from '../backend-architect/backendTypes.js';
import type { AuditBlueprint } from './securityTypes.js';

export function planAudit(t: BackendType): AuditBlueprint {
  const isRegulated = ['Finance','Healthcare'].includes(t);
  const isEnterprise= ['Enterprise','ERPBackend','CRMBackend','MultiTenant'].includes(t);
  const isSimple    = ['LandingAPI','Documentation'].includes(t);

  const retentionDays = isRegulated ? 2555 : isEnterprise ? 365 : isSimple ? 30 : 90;

  return {
    hasAuditLogs:           !isSimple,
    hasSecurityLogs:        true,
    hasAuthLogs:            true,
    hasPermissionChangeLogs:!isSimple,
    hasRoleChangeLogs:      !isSimple,
    hasAPIAccessLogs:       true,
    hasAdminActionLogs:     !isSimple,
    hasComplianceLogs:      isRegulated || isEnterprise,
    retentionDays,
    logFormat:              'JSON',
  };
}
