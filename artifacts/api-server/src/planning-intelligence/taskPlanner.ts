// ── V9.7 Planning Intelligence — Phase 7: Task Planning ───────────────────────
import type { FeatureBlueprint, TaskBlueprint, PlanningTask, TaskOwner } from './planningTypes.js';

const FEATURE_TASKS: Record<string, Array<{ name: string; hours: number; owner: TaskOwner }>> = {
  foundation:    [{ name: 'Project scaffold', hours: 2, owner: 'fullstack' }, { name: 'DB schema init', hours: 2, owner: 'backend' }, { name: 'CI/CD setup', hours: 2, owner: 'devops' }],
  'ui-components':[{ name: 'Design system setup', hours: 3, owner: 'design' }, { name: 'Component library', hours: 4, owner: 'frontend' }],
  routing:       [{ name: 'Route configuration', hours: 2, owner: 'frontend' }, { name: 'Layout shells', hours: 2, owner: 'frontend' }],
  auth:          [{ name: 'Auth API routes', hours: 4, owner: 'backend' }, { name: 'Login/register UI', hours: 4, owner: 'frontend' }, { name: 'JWT/session', hours: 3, owner: 'backend' }, { name: 'Auth tests', hours: 3, owner: 'qa' }],
  rbac:          [{ name: 'Role schema', hours: 2, owner: 'backend' }, { name: 'Permission middleware', hours: 3, owner: 'backend' }, { name: 'RBAC UI', hours: 2, owner: 'frontend' }],
  dashboard:     [{ name: 'Dashboard layout', hours: 3, owner: 'frontend' }, { name: 'Metric cards', hours: 3, owner: 'frontend' }, { name: 'Dashboard API', hours: 3, owner: 'backend' }],
  payments:      [{ name: 'Payment provider setup', hours: 4, owner: 'backend' }, { name: 'Checkout UI', hours: 4, owner: 'frontend' }, { name: 'Webhook handler', hours: 3, owner: 'backend' }, { name: 'Payment tests', hours: 3, owner: 'qa' }],
  notifications: [{ name: 'Notification service', hours: 3, owner: 'backend' }, { name: 'Email templates', hours: 2, owner: 'fullstack' }, { name: 'Notification UI', hours: 2, owner: 'frontend' }],
  'admin-panel': [{ name: 'Admin layout', hours: 3, owner: 'frontend' }, { name: 'User management', hours: 4, owner: 'fullstack' }, { name: 'Admin API', hours: 3, owner: 'backend' }],
  cms:           [{ name: 'Content schema', hours: 3, owner: 'backend' }, { name: 'Rich text editor', hours: 4, owner: 'frontend' }, { name: 'Content API', hours: 3, owner: 'backend' }],
  analytics:     [{ name: 'Events schema', hours: 2, owner: 'backend' }, { name: 'Analytics charts', hours: 4, owner: 'frontend' }, { name: 'Analytics API', hours: 3, owner: 'backend' }],
  search:        [{ name: 'Search API', hours: 3, owner: 'backend' }, { name: 'Search UI', hours: 3, owner: 'frontend' }],
  reports:       [{ name: 'Report templates', hours: 3, owner: 'fullstack' }, { name: 'Export API', hours: 2, owner: 'backend' }],
  'feature-flags':[{ name: 'Flag management UI', hours: 2, owner: 'frontend' }, { name: 'Flag API', hours: 2, owner: 'backend' }],
};

export function planTasks(features: FeatureBlueprint): TaskBlueprint {
  const tasks: PlanningTask[] = [];
  let counter = 0;
  const parallelGroupMap: Map<string, number> = new Map([
    ['foundation', 0], ['ui-components', 0], ['routing', 0],
    ['auth', 1], ['rbac', 1],
    ['dashboard', 2], ['payments', 2], ['notifications', 2], ['cms', 2],
    ['admin-panel', 3], ['analytics', 3], ['search', 3], ['reports', 3],
    ['feature-flags', 4],
  ]);

  const allFeatures = [
    ...features.coreFeatures,
    ...features.optionalFeatures,
  ];

  for (const feat of allFeatures) {
    const defs = FEATURE_TASKS[feat.id] ?? [{ name: `${feat.name} implementation`, hours: feat.estimatedHours, owner: 'fullstack' as TaskOwner }];
    const group = parallelGroupMap.get(feat.id) ?? 2;
    for (const def of defs) {
      tasks.push({
        id: `t${++counter}-${feat.id}-${def.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: `[${feat.name}] ${def.name}`,
        featureId: feat.id,
        dependencies: [],
        estimatedHours: def.hours,
        priority: feat.status === 'core' ? 'high' : 'medium',
        owner: def.owner,
        parallelGroup: group,
      });
    }
  }

  // Build parallel groups
  const groupMap: Map<number, number[]> = new Map();
  tasks.forEach((t, idx) => {
    const g = t.parallelGroup;
    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push(idx);
  });
  const parallelGroups = Array.from(groupMap.values());

  // Critical tasks: auth, foundation, routing are critical
  const criticalTasks = tasks
    .filter(t => ['auth', 'foundation', 'routing'].includes(t.featureId))
    .map(t => t.id);

  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

  return { tasks, parallelGroups, totalTasks: tasks.length, totalHours, criticalTasks };
}
