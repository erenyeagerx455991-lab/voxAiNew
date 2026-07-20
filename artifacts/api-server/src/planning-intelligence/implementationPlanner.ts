// ── V9.7 Planning Intelligence — Phase 12: Implementation Planning ─────────────
import type { TaskBlueprint, PriorityBlueprint, ImplementationBlueprint } from './planningTypes.js';

// Tasks in group 0 are always sequential (foundation)
const SEQUENTIAL_GROUPS = new Set([0, 1]); // foundation + auth always sequential

export function planImplementation(
  tasks: TaskBlueprint,
  priorities: PriorityBlueprint,
): ImplementationBlueprint {
  const prioritySet = new Set(priorities.topPriorities);
  const criticalSet = new Set(tasks.criticalTasks);

  // Sequential: group 0+1 tasks (foundation, auth) and critical tasks
  const sequentialTasks = tasks.tasks
    .filter(t => SEQUENTIAL_GROUPS.has(t.parallelGroup) || criticalSet.has(t.id))
    .map(t => t.id);

  // Parallel: group ≥ 2 tasks that aren't already sequential
  const seqSet = new Set(sequentialTasks);
  const parallelTasks: string[][] = [];
  const groupMap = new Map<number, string[]>();
  for (const t of tasks.tasks) {
    if (!seqSet.has(t.id)) {
      if (!groupMap.has(t.parallelGroup)) groupMap.set(t.parallelGroup, []);
      groupMap.get(t.parallelGroup)!.push(t.id);
    }
  }
  for (const group of groupMap.values()) parallelTasks.push(group);

  // Critical path: critical tasks in order + sequential
  const criticalPath = tasks.tasks
    .filter(t => criticalSet.has(t.id) || prioritySet.has(t.featureId))
    .map(t => t.id);

  // Blocked: tasks with dependencies not yet resolved (placeholder logic)
  const blockedTasks = tasks.tasks
    .filter(t => t.dependencies.length > 0 && !t.dependencies.every(d => seqSet.has(d)))
    .map(t => t.id);

  // Fast-track: high-priority tasks with no dependencies
  const fastTrackTasks = tasks.tasks
    .filter(t => t.dependencies.length === 0 && t.priority === 'high' && !seqSet.has(t.id))
    .map(t => t.id)
    .slice(0, 5);

  // Execution order: sequential first, then parallel waves
  const executionOrder = [
    ...sequentialTasks,
    ...parallelTasks.flat(),
  ];

  // Estimated total: sequential time + max of each parallel wave
  const seqMs = sequentialTasks.reduce((s, id) => {
    const t = tasks.tasks.find(t => t.id === id);
    return s + (t?.estimatedHours ?? 1) * 3600000;
  }, 0);
  const parallelMs = parallelTasks.reduce((max, group) => {
    const groupMax = group.reduce((m, id) => {
      const t = tasks.tasks.find(t => t.id === id);
      return Math.max(m, (t?.estimatedHours ?? 1) * 3600000);
    }, 0);
    return max + groupMax;
  }, 0);
  const estimatedTotalMs = seqMs + parallelMs;

  return {
    sequentialTasks, parallelTasks, criticalPath, blockedTasks,
    fastTrackTasks, executionOrder, estimatedTotalMs,
  };
}
