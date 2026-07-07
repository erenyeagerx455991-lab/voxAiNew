// ── V8.5 Frontend Architect — Authentication Architecture ─────────────────────

import type { ProjectType, AuthArchitecture, AuthStrategy } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planAuthArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): AuthArchitecture {
  const hasAuth = features.includes('Authentication');
  if (!hasAuth) {
    return {
      strategy: 'None', roles: ['Guest'], hasRefreshFlow: false,
      hasProtectedPages: false, hasGuestMode: true, hasMultiTenant: false,
      sessionStrategy: 'none',
    };
  }

  const strategy = resolveAuthStrategy(projectType, prompt);
  const roles = resolveRoles(projectType, features);
  const hasMultiTenant = features.includes('Workspace') || features.includes('Teams') ||
                         /multi.?tenant|organization|org.*switch/i.test(prompt);

  return {
    strategy,
    roles,
    hasRefreshFlow: strategy === 'JWT',
    hasProtectedPages: true,
    hasGuestMode: isPublicFacing(projectType),
    hasMultiTenant,
    sessionStrategy: resolveSessionStrategy(strategy),
  };
}

function resolveAuthStrategy(projectType: ProjectType, prompt: string): AuthStrategy {
  if (/passkey|webauthn/i.test(prompt)) return 'Passkey';
  if (/magic.*link|passwordless/i.test(prompt)) return 'Magic';
  if (/oauth|google.*auth|github.*auth|sso/i.test(prompt)) return 'OAuth';
  if (/session|cookie.*auth/i.test(prompt)) return 'Session';
  return 'JWT';
}

function resolveRoles(projectType: ProjectType, features: ProductFeature[]): string[] {
  const roles = ['User'];
  const hasPermissions = features.includes('Permissions');
  const hasTeams = features.includes('Teams');
  const hasAdmin = ['AdminPanel', 'ERP', 'EnterprisePlatform', 'CMS'].includes(projectType);

  if (hasAdmin || hasPermissions) roles.push('Admin');
  if (hasAdmin) roles.push('SuperAdmin');
  if (hasTeams) roles.push('TeamOwner', 'TeamMember');
  if (features.includes('Workspace')) roles.push('WorkspaceOwner');

  return ['Guest', ...roles];
}

function resolveSessionStrategy(strategy: AuthStrategy): AuthArchitecture['sessionStrategy'] {
  if (strategy === 'Session') return 'cookie';
  if (strategy === 'JWT') return 'localStorage';
  if (strategy === 'None') return 'none';
  return 'cookie';
}

function isPublicFacing(projectType: ProjectType): boolean {
  const publicTypes: ProjectType[] = ['LandingPage', 'Blog', 'Documentation', 'Portfolio', 'Marketplace', 'ECommerce'];
  return publicTypes.includes(projectType);
}
