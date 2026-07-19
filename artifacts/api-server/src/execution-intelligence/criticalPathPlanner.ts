// ── V9.6 Critical Path Planner ────────────────────────────────────────────────
// Implements the classic CPM (Critical Path Method) — longest weighted path
// through the DAG where the weight is estimatedTimeMs.
import type { CriticalPathResult, ExecutionTask, TaskId } from './executionTypes.js';

export function computeCriticalPath(tasks: ExecutionTask[], topologicalOrder: TaskId[]): CriticalPathResult {
  if (tasks.length === 0) {
    return { path: [], criticalTasks: [], blockingTasks: [], bottlenecks: [], estimatedCompletionMs: 0, criticalPathDurationMs: 0 };
  }

  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Forward pass: earliest finish time
  const earliest: Record<TaskId, number> = {};
  for (const id of topologicalOrder) {
    const t = taskMap[id];
    if (!t) continue;
    const depMax = t.dependsOn.length === 0
      ? 0
      : Math.max(...t.dependsOn.map(d => earliest[d] ?? 0));
    earliest[id] = depMax + t.estimatedTimeMs;
  }

  // Latest finish time (backward pass)
  const projectEnd = Math.max(...Object.values(earliest), 0);
  const latest: Record<TaskId, number> = {};
  for (const id of [...topologicalOrder].reverse()) {
    const t = taskMap[id];
    if (!t) continue;
    // Successors: tasks that depend on this one
    const successors = tasks.filter(s => s.dependsOn.includes(id));
    if (successors.length === 0) {
      latest[id] = projectEnd;
    } else {
      latest[id] = Math.min(...successors.map(s => (latest[s.id] ?? projectEnd) - s.estimatedTimeMs));
    }
  }

  // Critical tasks: those where earliest[id] === latest[id] (zero slack)
  const criticalTasks: TaskId[] = topologicalOrder.filter(id => {
    const slack = (latest[id] ?? 0) - (earliest[id] ?? 0);
    return Math.abs(slack) < 1;  // floating point tolerance
  });

  // Reconstruct critical path by following earliest-finish chain
  const path: TaskId[] = [];
  if (criticalTasks.length > 0) {
    // Start from tasks with no dependencies on the critical path
    let cur: TaskId | undefined = criticalTasks.find(id => {
      const t = taskMap[id];
      return t && t.dependsOn.every(d => !criticalTasks.includes(d));
    }) ?? criticalTasks[0];

    const visited = new Set<TaskId>();
    while (cur && !visited.has(cur)) {
      path.push(cur);
      visited.add(cur);
      // Next: critical task that depends on cur
      cur = criticalTasks.find(id => taskMap[id]?.dependsOn.includes(cur!) && !visited.has(id));
    }
  }

  // Blocking tasks: critical tasks that are blocking (have multiple dependents)
  const blockingTasks = criticalTasks.filter(id => taskMap[id]?.isBlocking);

  // Bottlenecks: critical tasks with the highest time
  const sortedByCost = [...criticalTasks].sort((a, b) => (taskMap[b]?.estimatedTimeMs ?? 0) - (taskMap[a]?.estimatedTimeMs ?? 0));
  const bottlenecks = sortedByCost.slice(0, 3);

  return {
    path: path.length > 0 ? path : criticalTasks.slice(0, 5),
    criticalTasks,
    blockingTasks,
    bottlenecks,
    estimatedCompletionMs: projectEnd,
    criticalPathDurationMs: criticalTasks.reduce((s, id) => s + (taskMap[id]?.estimatedTimeMs ?? 0), 0),
  };
}
