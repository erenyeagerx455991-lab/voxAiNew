// ── V8.9 Security Architect — Phase 15: Network Security Planner ─────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { NetworkSecurityBlueprint } from './securityTypes.js';

export function planNetworkSecurity(t: BackendType): NetworkSecurityBlueprint {
  const isEnterprise = ['Enterprise','Finance','Healthcare','ERPBackend'].includes(t);
  const isSimple     = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  const networkSegments = [
    'Public DMZ',
    'Application tier',
    'Database tier',
    ...(isEnterprise ? ['Management network','Monitoring network'] : []),
  ];

  return {
    hasFirewall:              true,
    hasPrivateNetwork:        !isSimple,
    hasPublicNetworkControls: true,
    hasIngressControl:        !isSimple,
    hasEgressControl:         isEnterprise,
    hasVPN:                   isEnterprise,
    hasZeroTrust:             isEnterprise,
    networkSegments,
  };
}
