// ── V8.9 Security Architect — Phase 2: Authorization Planner ─────────────────
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { AuthorizationBlueprint, AuthzModel } from './securityTypes.js';

export function planAuthorization(t: BackendType): AuthorizationBlueprint {
  const isMultiTenant = ['MultiTenant','SaaSBackend','ERPBackend','CRMBackend','Marketplace'].includes(t);
  const isEnterprise  = ['Enterprise','Finance','Healthcare','ERPBackend'].includes(t);
  const isSimple      = ['LandingAPI','Documentation','ServerlessCandidate'].includes(t);

  let model: AuthzModel = 'RBAC';
  if (isEnterprise && isMultiTenant) model = 'PBAC';
  else if (isEnterprise)             model = 'ABAC';
  else if (isMultiTenant)            model = 'Hierarchical';

  const baseRoles = ['user', 'admin'];
  const extraRoles = isMultiTenant
    ? ['owner', 'member', 'viewer', 'billing-admin']
    : isEnterprise
      ? ['superadmin', 'auditor', 'readonly']
      : [];

  return {
    model,
    hasRBAC:              true,
    hasABAC:              isEnterprise || isMultiTenant,
    hasPBAC:              isEnterprise && isMultiTenant,
    hasHierarchicalRoles: isMultiTenant || isEnterprise,
    roles:                [...new Set([...baseRoles, ...extraRoles])],
    hasPermissionMatrix:  !isSimple,
    hasTenantRoles:       isMultiTenant,
    hasResourcePolicies:  isEnterprise || isMultiTenant,
  };
}
