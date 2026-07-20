// ── V9.7 Planning Intelligence — Phase 4: Milestone Planning ──────────────────
import type { RequirementBlueprint, DependencyBlueprint, MilestoneBlueprint, Milestone } from './planningTypes.js';

export function planMilestones(
  req: RequirementBlueprint,
  deps: DependencyBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
): MilestoneBlueprint {
  const milestones: Milestone[] = [];
  const mult = complexity === 'enterprise' ? 1.5 : complexity === 'simple' ? 0.7 : 1;

  // M1: Foundation — always present
  milestones.push({
    id: 'm1-foundation',
    name: 'Foundation',
    features: ['database', 'core-api'],
    estimatedDays: Math.round(2 * mult),
    criticalPath: true,
    deliverable: 'Project scaffolding, DB schema, base API routes',
  });

  // M2: Authentication — if auth detected
  if (req.authentication) {
    milestones.push({
      id: 'm2-auth',
      name: 'Authentication',
      features: ['auth', ...(req.authorization ? ['rbac'] : [])],
      estimatedDays: Math.round(3 * mult),
      criticalPath: true,
      deliverable: 'Login, registration, session management' + (req.authorization ? ', RBAC' : ''),
    });
  }

  // M3: Core Features — pages, dashboard, main components
  const coreFeatures = ['profile', 'settings', ...(req.dashboard ? ['dashboard'] : [])];
  if (coreFeatures.length) {
    milestones.push({
      id: 'm3-core',
      name: 'Core Features',
      features: coreFeatures,
      estimatedDays: Math.round(5 * mult),
      criticalPath: true,
      deliverable: 'Main application features: ' + coreFeatures.join(', '),
    });
  }

  // M4: Backend & Integrations — payments, notifications, CMS
  const backendFeatures: string[] = [];
  if (req.payments) backendFeatures.push('payments');
  if (req.notifications) backendFeatures.push('notifications');
  if (req.cms) backendFeatures.push('cms');
  if (req.analytics) backendFeatures.push('analytics');
  if (req.search) backendFeatures.push('search');
  if (backendFeatures.length) {
    milestones.push({
      id: 'm4-backend',
      name: 'Backend & Integrations',
      features: backendFeatures,
      estimatedDays: Math.round(4 * mult),
      criticalPath: false,
      deliverable: 'Integrations: ' + backendFeatures.join(', '),
    });
  }

  // M5: Admin & Reports
  const adminFeatures: string[] = [];
  if (req.adminPanel) adminFeatures.push('admin-panel');
  if (req.reports) adminFeatures.push('reports');
  if (req.featureFlags) adminFeatures.push('feature-flags');
  if (adminFeatures.length) {
    milestones.push({
      id: 'm5-admin',
      name: 'Admin & Management',
      features: adminFeatures,
      estimatedDays: Math.round(3 * mult),
      criticalPath: false,
      deliverable: 'Admin panel, reports, management features',
    });
  }

  // Enterprise adds M6: Scale & Deploy
  if (complexity === 'enterprise') {
    milestones.push({
      id: 'm6-deploy',
      name: 'Scale & Deployment',
      features: ['monitoring', 'ci-cd', 'load-balancing'],
      estimatedDays: Math.round(4 * mult),
      criticalPath: true,
      deliverable: 'Production infrastructure, monitoring, CI/CD pipeline',
    });
  } else {
    milestones.push({
      id: 'm-deploy',
      name: 'Deployment',
      features: ['ci-cd', 'monitoring'],
      estimatedDays: Math.round(1 * mult),
      criticalPath: false,
      deliverable: 'Deploy to production, basic monitoring',
    });
  }

  const criticalMilestones = milestones.filter(m => m.criticalPath).map(m => m.id);
  const totalDays = milestones.reduce((s, m) => s + m.estimatedDays, 0);

  return { milestones, totalMilestones: milestones.length, totalDays, criticalMilestones };
}
