// ── V8.5 Frontend Architect — Permission Architecture ─────────────────────────

import type { ProjectType, PermissionArchitecture } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planPermissionArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
): PermissionArchitecture {
  const hasAuth = features.includes('Authentication');
  if (!hasAuth) {
    return { model: 'None', roles: [], hasRouteGuards: false, hasComponentGuards: false, hasApiGuards: false };
  }

  const model = resolvePermissionModel(projectType, features);
  const roles = resolveRoles(projectType, features);

  return {
    model,
    roles,
    hasRouteGuards:     true,
    hasComponentGuards: model !== 'None' && features.includes('Permissions'),
    hasApiGuards:       features.includes('AuditLogs') || features.includes('Permissions'),
  };
}

function resolvePermissionModel(projectType: ProjectType, features: ProductFeature[]): PermissionArchitecture['model'] {
  if (!features.includes('Authentication')) return 'None';
  const rbacTypes: ProjectType[] = ['AdminPanel', 'ERP', 'EnterprisePlatform', 'CRM'];
  if (rbacTypes.includes(projectType) || features.includes('Permissions') || features.includes('AuditLogs')) return 'RBAC';
  if (features.includes('Teams')) return 'RBAC';
  return 'ACL';
}

function resolveRoles(projectType: ProjectType, features: ProductFeature[]): string[] {
  const roles = ['Guest', 'User'];
  if (features.includes('Permissions') || ['AdminPanel', 'ERP'].includes(projectType)) {
    roles.push('Admin', 'SuperAdmin');
  }
  if (features.includes('Teams')) roles.push('TeamOwner', 'TeamMember');
  if (features.includes('Workspace')) roles.push('WorkspaceOwner');
  return roles;
}
