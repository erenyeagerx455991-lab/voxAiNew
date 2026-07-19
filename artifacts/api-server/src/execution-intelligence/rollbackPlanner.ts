// ── V9.6 Rollback Planner ─────────────────────────────────────────────────────
import type { ExecutionTask, RollbackPlan, TaskId } from './executionTypes.js';

export function planRollback(tasks: ExecutionTask[], failedTaskId: TaskId): RollbackPlan {
  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Find tasks that transitively depend on the failed task
  function collectAffected(id: TaskId, visited: Set<TaskId>): TaskId[] {
    if (visited.has(id)) return [];
    visited.add(id);
    const downstream = tasks.filter(t => t.dependsOn.includes(id));
    const all: TaskId[] = [id];
    for (const d of downstream) all.push(...collectAffected(d.id, visited));
    return all;
  }

  const affectedSet = new Set(collectAffected(failedTaskId, new Set()));
  const rollbackTasks = tasks.filter(t => affectedSet.has(t.id) && t.rollbackRequired).map(t => t.id);

  // Full pipeline restart only if the failed task is a root (no deps)
  const failed = taskMap[failedTaskId];
  const fullPipelineRestart = !failed || failed.dependsOn.length === 0;

  // Rollback in reverse topological order (latest first)
  const rollbackOrder = [...rollbackTasks].reverse();

  const estimatedRollbackMs = rollbackTasks.reduce((s, id) => s + (taskMap[id]?.estimatedTimeMs ?? 0) * 0.3, 0);

  return {
    rollbackTasks,
    fullPipelineRestart: fullPipelineRestart && rollbackTasks.length > 3,
    rollbackOrder,
    estimatedRollbackMs: Math.round(estimatedRollbackMs),
  };
}
