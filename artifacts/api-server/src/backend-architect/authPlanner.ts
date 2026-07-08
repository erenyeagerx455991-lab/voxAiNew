// ── V8.6 Backend Architect — Authentication Architecture Planner ───────────────
import type { ProductFeature } from '../product-manager/productTypes.js';
import type { BackendType, AuthArchitecture, AuthStrategy, AuthRole } from './backendTypes.js';
import { isEnterpriseBackend } from './backendPlanner.js';

function chooseAuthStrategy(type: BackendType, features: ProductFeature[]): AuthStrategy {
  if (type === 'LandingAPI' || type === 'Documentation') return 'None';
  if (type === 'DeveloperPlatform') return 'APIKey';
  if (features.includes('Authentication')) return 'JWT';
  if (type === 'SocialPlatform') return 'OAuth';
  if (type === 'Enterprise' || isEnterpriseBackend(type)) return 'JWT';
  return 'JWT';
}

function chooseRoles(type: BackendType, features: ProductFeature[]): AuthRole[] {
  const roles: AuthRole[] = ['User'];
  if (type === 'LandingAPI') return ['Guest'];

  roles.push('Admin');

  if (isEnterpriseBackend(type) || type === 'MultiTenant') {
    roles.push('SuperAdmin', 'Organization', 'Workspace', 'Team');
  }
  if (features.includes('Teams') || features.includes('Permissions')) {
    if (!roles.includes('Team')) roles.push('Team');
  }
  if (['Marketplace', 'ECommerce'].includes(type)) {
    roles.push('Guest');
  }
  return [...new Set(roles)];
}

function chooseOAuthProviders(type: BackendType, features: ProductFeature[]): string[] {
  if (type === 'LandingAPI') return [];
  if (type === 'DeveloperPlatform') return ['GitHub', 'Google'];
  if (type === 'SocialPlatform') return ['Google', 'Facebook', 'Twitter'];
  if (features.includes('Authentication')) return ['Google', 'GitHub'];
  return ['Google'];
}

export function planAuthArchitecture(
  type:     BackendType,
  features: ProductFeature[],
): AuthArchitecture {
  const primaryStrategy = chooseAuthStrategy(type, features);
  const hasAuth         = primaryStrategy !== 'None';
  const isEnterprise    = isEnterpriseBackend(type);
  const hasMultiTenant  = type === 'MultiTenant' || isEnterprise;

  const strategies: AuthStrategy[] = hasAuth ? [primaryStrategy] : ['None'];
  if (hasAuth && primaryStrategy !== 'OAuth' && type !== 'LandingAPI') {
    strategies.push('OAuth');
  }
  if (type === 'DeveloperPlatform') {
    if (!strategies.includes('APIKey')) strategies.push('APIKey');
  }

  return {
    primaryStrategy,
    strategies:      [...new Set(strategies)],
    roles:           chooseRoles(type, features),
    hasRefreshToken: hasAuth && primaryStrategy === 'JWT',
    hasMultiTenant,
    hasOrganizations:isEnterprise || type === 'MultiTenant',
    hasWorkspaces:   isEnterprise || features.includes('Teams'),
    hasAPIKeys:      type === 'DeveloperPlatform' || isEnterprise,
    hasOAuth:        hasAuth && type !== 'LandingAPI',
    oAuthProviders:  chooseOAuthProviders(type, features),
    sessionDuration: isEnterprise ? '8h' : '24h',
  };
}
