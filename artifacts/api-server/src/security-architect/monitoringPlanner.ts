// ── V8.9 Security Architect — Phase 17: Security Monitoring Planner ──────────
// NOTE: function is planSecurityMonitoring to avoid collision with devops-architect/monitoringPlanner.ts
import type { BackendType }              from '../backend-architect/backendTypes.js';
import type { SecurityMonitoringBlueprint } from './securityTypes.js';

export function planSecurityMonitoring(t: BackendType): SecurityMonitoringBlueprint {
  const isEnterprise  = ['Enterprise','Finance','Healthcare','ERPBackend','CRMBackend'].includes(t);
  const isHighTraffic = ['Marketplace','SocialPlatform','ECommerce'].includes(t);
  const isSimple      = ['LandingAPI','Documentation'].includes(t);

  const alertChannels = ['email'];
  if (isEnterprise)  alertChannels.push('slack','pagerduty');
  if (isHighTraffic) alertChannels.push('slack');

  const retentionDays = isEnterprise ? 365 : isSimple ? 30 : 90;

  return {
    hasSecurityEvents:    true,
    hasAnomalyDetection:  !isSimple,
    hasLoginMonitoring:   true,
    hasThreatDetection:   !isSimple,
    hasBehaviorAnalytics: isEnterprise,
    hasSIEM:              isEnterprise,
    alertChannels:        [...new Set(alertChannels)],
    retentionDays,
  };
}
