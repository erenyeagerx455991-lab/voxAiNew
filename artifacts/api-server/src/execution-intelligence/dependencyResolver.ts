// ── V9.6 Dependency Resolver ───────────────────────────────────────────────────
import type { DependencyAnalysis, ExecutionTask, TaskId } from './executionTypes.js';

/** DFS-based cycle detection. Returns all cycles found. */
function detectCycles(tasks: ExecutionTask[]): TaskId[][] {
  const adj: Record<TaskId, TaskId[]> = {};
  for (const t of tasks) adj[t.id] = [...t.dependsOn];

  const visited = new Set<TaskId>();
  const inStack = new Set<TaskId>();
  const cycles: TaskId[][] = [];

  function dfs(node: TaskId, stack: TaskId[]): void {
    visited.add(node);
    inStack.add(node);
    for (const dep of (adj[node] ?? [])) {
      if (!visited.has(dep)) {
        dfs(dep, [...stack, node]);
      } else if (inStack.has(dep)) {
        const cycleStart = stack.indexOf(dep);
        if (cycleStart !== -1) cycles.push([...stack.slice(cycleStart), node, dep]);
      }
    }
    inStack.delete(node);
  }

  for (const t of tasks) {
    if (!visited.has(t.id)) dfs(t.id, []);
  }
  return cycles;
}

/** Finds transitive dependencies to detect redundant ones. */
function transitiveReach(id: TaskId, taskMap: Record<TaskId, ExecutionTask>): Set<TaskId> {
  const reach = new Set<TaskId>();
  const stack = [...(taskMap[id]?.dependsOn ?? [])];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (!reach.has(cur)) {
      reach.add(cur);
      for (const dep of (taskMap[cur]?.dependsOn ?? [])) stack.push(dep);
    }
  }
  return reach;
}

/** Groups tasks with no shared ancestors into independent branches. */
function findIndependentBranches(tasks: ExecutionTask[]): TaskId[][] {
  const roots = tasks.filter(t => t.dependsOn.length === 0).map(t => t.id);
  if (roots.length <= 1) return [roots];
  // Simple heuristic: each root starts an independent branch until they merge
  return roots.map(r => [r]);
}

export function resolveDependencies(tasks: ExecutionTask[]): DependencyAnalysis {
  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  const definedIds = new Set(tasks.map(t => t.id));

  // Missing dependencies
  const missingDependencies: DependencyAnalysis['missingDependencies'] = [];
  for (const t of tasks) {
    const missing = t.dependsOn.filter(d => !definedIds.has(d));
    if (missing.length > 0) missingDependencies.push({ taskId: t.id, missing });
  }

  // Circular dependencies
  const circularDependencies = detectCycles(tasks);
  const hasCycle = circularDependencies.length > 0;

  // Redundant dependencies: a dep is redundant if it's reachable transitively
  const redundantDependencies: DependencyAnalysis['redundantDependencies'] = [];
  for (const t of tasks) {
    const redundant: TaskId[] = [];
    for (const dep of t.dependsOn) {
      // Check if dep is reachable through another dep's transitive closure
      const otherDeps = t.dependsOn.filter(d => d !== dep);
      for (const other of otherDeps) {
        const reach = transitiveReach(other, taskMap);
        if (reach.has(dep)) { redundant.push(dep); break; }
      }
    }
    if (redundant.length > 0) redundantDependencies.push({ taskId: t.id, redundant });
  }

  // Independent branches
  const independentBranches = findIndependentBranches(tasks);

  // Blocking chains: tasks that block ≥2 downstream tasks
  const blockingChains: TaskId[][] = [];
  for (const t of tasks) {
    const directDependents = tasks.filter(other => other.dependsOn.includes(t.id));
    if (directDependents.length >= 2) {
      blockingChains.push([t.id, ...directDependents.map(d => d.id)]);
    }
  }

  return {
    missingDependencies,
    circularDependencies,
    redundantDependencies,
    independentBranches,
    blockingChains,
    hasCycle,
    isValid: missingDependencies.length === 0 && !hasCycle,
  };
}
