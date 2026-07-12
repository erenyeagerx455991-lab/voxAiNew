// ── V8.9 Security Architect — Phase 1: Authentication Planner ────────────────
import type { BackendType }           from '../backend-architect/backendTypes.js';
import type { AuthenticationBlueprint, AuthStrategy } from './securityTypes.js';

const ENTERPRISE_TYPES: BackendType[] = ['Enterprise','ERPBackend','CRMBackend','MultiTenant','Finance','Healthcare'];
const SOCIAL_TYPES:     BackendType[] = ['SocialPlatform','ECommerce','Marketplace','BookingPlatform'];
const API_TYPES:        BackendType[] = ['APIGateway','LandingAPI'];

export function planAuthentication(t: BackendType): AuthenticationBlueprint {
  const isEnterprise = ENTERPRISE_TYPES.includes(t);
  const isSocial     = SOCIAL_TYPES.includes(t);
  const isAPI        = API_TYPES.includes(t);
  const isAI         = t === 'AIPlatform';

  let primaryStrategy: AuthStrategy = 'JWT';
  if (isEnterprise) primaryStrategy = 'SSO';
  else if (isAPI)   primaryStrategy = 'JWT';
  else if (isSocial)primaryStrategy = 'OAuthPKCE';

  const strategies: AuthStrategy[] = ['JWT'];
  if (isEnterprise)             strategies.push('SSO', 'MFA', 'Passkeys');
  if (isSocial)                 strategies.push('OAuthPKCE', 'SocialLogin', 'MagicLink');
  if (!isAPI && !isSocial)      strategies.push('OAuth');
  if (t === 'Finance' || t === 'Healthcare') strategies.push('MFA', 'Passkeys');
  if (t === 'SaaSBackend')      strategies.push('MagicLink', 'MFA');

  const unique = [...new Set([primaryStrategy, ...strategies])] as AuthStrategy[];

  return {
    primaryStrategy,
    strategies:     unique,
    hasMFA:         isEnterprise || t === 'Finance' || t === 'Healthcare' || t === 'SaaSBackend',
    hasPasswordless:isSocial || t === 'SaaSBackend',
    hasSSO:         isEnterprise,
    hasSocialLogin: isSocial,
    hasPasskeys:    isEnterprise || t === 'Finance' || t === 'Healthcare',
    confidence:     isEnterprise ? 0.94 : isSocial ? 0.88 : 0.85,
    rationale:      isEnterprise
      ? 'Enterprise apps require SSO with MFA for compliance and zero-trust posture'
      : isSocial
        ? 'Consumer apps maximize conversion with social login and passwordless flows'
        : 'API-centric apps rely on JWT for stateless authentication',
  };
}
