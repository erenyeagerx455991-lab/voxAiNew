// ── V8.9 Security Architect — Phase 10: Privacy Planner ──────────────────────
import type { BackendType }    from '../backend-architect/backendTypes.js';
import type { PrivacyBlueprint } from './securityTypes.js';

export function planPrivacy(t: BackendType): PrivacyBlueprint {
  const isRegulated   = ['Finance','Healthcare'].includes(t);
  const isConsumer    = ['ECommerce','SocialPlatform','Marketplace','BookingPlatform'].includes(t);
  const isEnterprise  = ['Enterprise','ERPBackend','CRMBackend','MultiTenant'].includes(t);
  const isSimple      = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  const needsPrivacy  = isRegulated || isConsumer || isEnterprise;
  const retentionDays = isRegulated ? 2555 : isEnterprise ? 365 : 90;

  return {
    hasGDPR:               needsPrivacy,
    hasCCPA:               isConsumer || isRegulated,
    hasDataRetentionPolicy:!isSimple,
    hasConsentManagement:  needsPrivacy,
    hasCookiePolicy:       !isSimple,
    hasDataExport:         needsPrivacy,
    hasRightToDelete:      needsPrivacy,
    hasRightToAccess:      needsPrivacy,
    hasDataResidency:      isRegulated || isEnterprise,
    retentionDays,
  };
}
