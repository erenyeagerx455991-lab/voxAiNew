// ── V8.9 Security Architect — Phase 3: Identity Planner ──────────────────────
import type { BackendType }    from '../backend-architect/backendTypes.js';
import type { IdentityBlueprint } from './securityTypes.js';

export function planIdentity(t: BackendType): IdentityBlueprint {
  const isEnterprise  = ['Enterprise','ERPBackend','CRMBackend','Finance','Healthcare'].includes(t);
  const isMultiTenant = ['MultiTenant','SaaSBackend','Marketplace'].includes(t);
  const isAI          = t === 'AIPlatform';

  return {
    hasUserIdentity:     true,
    hasOrgIdentity:      isEnterprise || isMultiTenant,
    hasWorkspaceIdentity:isMultiTenant || t === 'SaaSBackend',
    hasTeamIdentity:     isEnterprise || isMultiTenant,
    hasAPIIdentity:      true,
    hasServiceIdentity:  isEnterprise || isAI,
    hasMachineIdentity:  isEnterprise,
    identityProvider:    isEnterprise ? 'Okta / Azure AD' : 'Custom JWT + OAuth2',
  };
}
