// ── V9.7 Planning Intelligence — Phase 6: Feature Planning ────────────────────
import type { RequirementBlueprint, FeatureBlueprint, PlannedFeature, FeatureComplexity } from './planningTypes.js';

const FEATURE_COMPLEXITY: Record<string, FeatureComplexity> = {
  auth:         'high',
  rbac:         'high',
  payments:     'very-high',
  cms:          'very-high',
  analytics:    'high',
  search:       'medium',
  notifications: 'medium',
  dashboard:    'medium',
  'admin-panel': 'high',
  reports:      'medium',
  'feature-flags': 'low',
  profile:      'low',
  settings:     'low',
  'file-upload': 'medium',
  'real-time':  'very-high',
};

const FEATURE_HOURS: Record<string, number> = {
  auth:         16,
  rbac:         12,
  payments:     24,
  cms:          20,
  analytics:    12,
  search:       10,
  notifications: 8,
  dashboard:    14,
  'admin-panel': 18,
  reports:      10,
  'feature-flags': 6,
  profile:      8,
  settings:     6,
  'file-upload': 8,
  'real-time':  20,
};

export function planFeatures(
  req: RequirementBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
): FeatureBlueprint {
  const mult = complexity === 'enterprise' ? 1.4 : complexity === 'simple' ? 0.8 : 1;

  function make(id: string, name: string, detected: boolean, blocked = false): PlannedFeature {
    const cplx = FEATURE_COMPLEXITY[id] ?? 'medium';
    const hrs = Math.round((FEATURE_HOURS[id] ?? 8) * mult);
    return {
      id, name,
      status: blocked ? 'blocked' : !detected ? 'optional' : 'core',
      complexity: cplx,
      dependencies: [],
      estimatedHours: hrs,
    };
  }

  // Core — always included
  const coreFeatures: PlannedFeature[] = [
    make('foundation', 'Foundation & Setup', true),
    make('ui-components', 'UI Component Library', true),
    make('routing', 'Page Routing', true),
  ];

  if (req.authentication)  coreFeatures.push(make('auth', 'Authentication', true));
  if (req.authorization)   coreFeatures.push(make('rbac', 'Authorization/RBAC', true));
  if (req.dashboard)       coreFeatures.push(make('dashboard', 'Dashboard', true));
  if (req.payments)        coreFeatures.push(make('payments', 'Payments', true));
  if (req.notifications)   coreFeatures.push(make('notifications', 'Notifications', true));
  if (req.adminPanel)      coreFeatures.push(make('admin-panel', 'Admin Panel', true));
  if (req.cms)             coreFeatures.push(make('cms', 'CMS', true));

  // Optional — detected but lower priority
  const optionalFeatures: PlannedFeature[] = [];
  if (req.analytics)    optionalFeatures.push(make('analytics', 'Analytics', req.analytics));
  if (req.search)       optionalFeatures.push(make('search', 'Search', req.search));
  if (req.reports)      optionalFeatures.push(make('reports', 'Reports & Exports', req.reports));
  if (req.featureFlags) optionalFeatures.push(make('feature-flags', 'Feature Flags', req.featureFlags));

  // Future — enterprise or not yet detected
  const futureFeatures: PlannedFeature[] = [];
  if (complexity === 'enterprise') {
    futureFeatures.push(make('real-time', 'Real-time Collaboration', false));
    futureFeatures.push(make('ai-integration', 'AI Integration', false));
    futureFeatures.push(make('multi-tenant', 'Multi-tenancy', false));
  }
  if (!req.analytics) futureFeatures.push(make('analytics', 'Analytics', false));
  if (!req.search)    futureFeatures.push(make('search', 'Advanced Search', false));

  // Blocked — depends on undetected features
  const blockedFeatures: PlannedFeature[] = [];
  if (req.reports && !req.analytics) {
    blockedFeatures.push(make('advanced-reports', 'Advanced Reports', false, true));
  }
  if (req.cms && !req.authentication) {
    blockedFeatures.push(make('cms-auth', 'CMS Authentication', false, true));
  }

  const totalFeatures = coreFeatures.length + optionalFeatures.length + futureFeatures.length + blockedFeatures.length;
  const totalCoreHours = coreFeatures.reduce((s, f) => s + f.estimatedHours, 0);

  return { coreFeatures, optionalFeatures, futureFeatures, blockedFeatures, totalFeatures, totalCoreHours };
}
