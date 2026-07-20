// ── V9.7 Planning Intelligence — Phase 3: Feature Dependency Graph ─────────────
import type { RequirementBlueprint, DependencyBlueprint, FeatureNode } from './planningTypes.js';

// Static dependency rules: if feature A is present, it depends on feature B
const DEPENDENCY_RULES: Array<[string, string, string]> = [
  // [feature, depends-on, condition (feature that must be detected)]
  ['dashboard',     'auth',          'dashboard'],
  ['profile',       'auth',          'authentication'],
  ['admin-panel',   'auth',          'adminPanel'],
  ['admin-panel',   'rbac',          'authorization'],
  ['payments',      'auth',          'payments'],
  ['payments',      'profile',       'payments'],
  ['reports',       'dashboard',     'reports'],
  ['reports',       'analytics',     'analytics'],
  ['analytics',     'dashboard',     'analytics'],
  ['notifications', 'auth',          'authentication'],
  ['cms',           'admin-panel',   'cms'],
  ['cms',           'auth',          'cms'],
  ['search',        'database',      'search'],
  ['feature-flags', 'admin-panel',   'featureFlags'],
];

export function buildDependencyGraph(req: RequirementBlueprint): DependencyBlueprint {
  // Build the list of detected features
  const presentMap: Record<string, boolean> = {
    auth:         req.authentication,
    rbac:         req.authorization,
    dashboard:    req.dashboard,
    'admin-panel': req.adminPanel,
    payments:     req.payments,
    notifications: req.notifications,
    analytics:    req.analytics,
    search:       req.search,
    cms:          req.cms,
    reports:      req.reports,
    'feature-flags': req.featureFlags,
    database:     req.database.length > 1, // always present if DB tables exist
    profile:      req.pages.includes('profile'),
  };

  // Only include features that are actually detected
  const featureIds = Object.keys(presentMap).filter(k => presentMap[k]);

  // Build edges from rules
  const edges: Array<{ from: string; to: string }> = [];
  for (const [feat, dep] of DEPENDENCY_RULES) {
    if (presentMap[feat] && presentMap[dep]) {
      edges.push({ from: feat, to: dep });
    }
  }

  // Add implicit: every detected feature depends on 'database' if db present
  for (const id of featureIds) {
    if (id !== 'database' && presentMap['database']) {
      if (!edges.find(e => e.from === id && e.to === 'database')) {
        if (['auth', 'dashboard', 'analytics', 'payments', 'cms', 'reports'].includes(id)) {
          edges.push({ from: id, to: 'database' });
        }
      }
    }
  }

  // Build adjacency + reverse adjacency
  const deps: Record<string, Set<string>> = {};
  for (const id of featureIds) deps[id] = new Set<string>();
  for (const e of edges) {
    if (deps[e.from]) deps[e.from].add(e.to);
  }

  // Detect cycles via DFS
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]): void {
    if (stack.has(node)) {
      const start = path.indexOf(node);
      cycles.push(path.slice(start));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const dep of (deps[node] ?? new Set())) dfs(dep, [...path, dep]);
    stack.delete(node);
  }
  for (const id of featureIds) dfs(id, [id]);

  // Compute depth (distance from roots)
  const depth: Record<string, number> = {};
  const roots = featureIds.filter(id => edges.every(e => e.to !== id));
  const queue = roots.map(r => ({ id: r, d: 0 }));
  while (queue.length) {
    const { id, d } = queue.shift()!;
    if (depth[id] === undefined || d > depth[id]) depth[id] = d;
    for (const e of edges) {
      if (e.to === id) queue.push({ id: e.from, d: d + 1 });
    }
  }
  for (const id of featureIds) if (depth[id] === undefined) depth[id] = 0;

  // Detect independent branches (no shared edges)
  const independentBranches: string[][] = [];
  const visited2 = new Set<string>();
  const reverse: Record<string, string[]> = {};
  for (const id of featureIds) reverse[id] = [];
  for (const e of edges) (reverse[e.to] ??= []).push(e.from);

  for (const root of roots) {
    if (visited2.has(root)) continue;
    const branch: string[] = [];
    const bq = [root];
    while (bq.length) {
      const n = bq.shift()!;
      if (visited2.has(n)) continue;
      visited2.add(n);
      branch.push(n);
      for (const e of edges) if (e.to === n) bq.push(e.from);
    }
    if (branch.length) independentBranches.push(branch);
  }

  // Blocking chains: features with ≥ 2 direct dependents
  const dependentCount: Record<string, number> = {};
  for (const e of edges) dependentCount[e.to] = (dependentCount[e.to] ?? 0) + 1;
  const blockingChains = featureIds
    .filter(id => (dependentCount[id] ?? 0) >= 2)
    .map(id => [id, ...featureIds.filter(f => edges.find(e => e.from === f && e.to === id))]);

  // Missing dependencies: references to non-present features
  const missingDependencies: Array<{ feature: string; missing: string }> = [];
  for (const e of edges) {
    if (!featureIds.includes(e.to)) {
      missingDependencies.push({ feature: e.from, missing: e.to });
    }
  }

  // Build node objects
  const featureMap: Record<string, FeatureNode> = {};
  const features: FeatureNode[] = featureIds.map(id => {
    const node: FeatureNode = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' '),
      dependsOn: edges.filter(e => e.from === id).map(e => e.to),
      isRoot: roots.includes(id),
      isLeaf: !edges.find(e => e.to === id),
      depth: depth[id] ?? 0,
    };
    featureMap[id] = node;
    return node;
  });

  return {
    features, featureMap, edges, cycles, missingDependencies,
    independentBranches, blockingChains,
    hasCycle: cycles.length > 0,
    isValid: cycles.length === 0 && missingDependencies.length === 0,
    totalFeatures: featureIds.length,
    maxDepth: Math.max(0, ...Object.values(depth)),
  };
}
