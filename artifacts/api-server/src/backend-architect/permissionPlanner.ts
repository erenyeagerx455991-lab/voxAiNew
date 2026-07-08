// ── V8.6 Backend Architect — Permission Architecture Planner ──────────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, PermissionArchitecture, PermissionModel, AuthRole } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function choosePermissionModel(type: BackendType, features: ProductFeature[]): PermissionModel {
  if (['LandingAPI', 'Documentation', 'ServerlessCandidate'].includes(type)) return 'Simple';
  if (isEnterpriseBackend(type) || type === 'MultiTenant') return 'ABAC';
  if (features.includes('Permissions') || features.includes('Teams')) return 'RBAC';
  return 'RBAC';
}

function buildRoleHierarchy(roles: AuthRole[]): string[] {
  const order: AuthRole[] = ['Guest', 'User', 'Team', 'Workspace', 'Organization', 'Admin', 'SuperAdmin'];
  return order.filter(r => roles.includes(r));
}

function getPermissionCategories(type: BackendType, features: ProductFeature[]): string[] {
  const base = ['read', 'write', 'delete', 'admin'];
  if (['CRMBackend', 'ERPBackend', 'Enterprise'].includes(type)) {
    base.push('export', 'import', 'audit', 'manage');
  }
  if (features.includes('Billing')) {
    base.push('billing', 'subscription');
  }
  if (type === 'Healthcare' || type === 'Finance') {
    base.push('compliance', 'audit', 'report');
  }
  return [...new Set(base)];
}

export function planPermissionArchitecture(
  type:     BackendType,
  features: ProductFeature[],
  roles:    AuthRole[],
): PermissionArchitecture {
  const model        = choosePermissionModel(type, features);
  const isEnterprise = isEnterpriseBackend(type);

  return {
    model,
    hasRBAC:               model === 'RBAC' || model === 'Hybrid',
    hasABAC:               model === 'ABAC' || model === 'Hybrid' || isEnterprise,
    hasFeatureFlags:       !['LandingAPI', 'Documentation'].includes(type),
    hasWorkspaceIsolation: type === 'MultiTenant' || isEnterprise,
    hasTenantIsolation:    type === 'MultiTenant',
    roleHierarchy:         buildRoleHierarchy(roles),
    permissionCategories:  getPermissionCategories(type, features),
  };
}
