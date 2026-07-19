// ── V9.6 Failure Recovery Planner ─────────────────────────────────────────────
import type { ExecutionTask, FailureRecoveryPlan, FailureStrategy, TaskId } from './executionTypes.js';

export function planFailureRecovery(tasks: ExecutionTask[], failedTaskId: TaskId): FailureRecoveryPlan {
  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Affected: failed task + all tasks that (transitively) depend on it
  const affectedIds = new Set<TaskId>();
  function markAffected(id: TaskId): void {
    if (affectedIds.has(id)) return;
    affectedIds.add(id);
    for (const t of tasks) {
      if (t.dependsOn.includes(id)) markAffected(t.id);
    }
  }
  markAffected(failedTaskId);

  const affectedTasks = tasks.filter(t => affectedIds.has(t.id) && t.id !== failedTaskId).map(t => t.id);
  const unaffectedTasks = tasks.filter(t => !affectedIds.has(t.id)).map(t => t.id);

  // Recovery path: start from the failed task
  const recoveryPath: TaskId[] = [failedTaskId, ...affectedTasks];

  // Tasks we can skip on recovery: unaffected tasks already completed
  const skipOnRecovery: TaskId[] = unaffectedTasks;

  // Determine strategy
  const failed = taskMap[failedTaskId];
  let strategy: FailureStrategy = 'recover';
  if (!failed) {
    strategy = 'abort';
  } else if (failed.retryable) {
    strategy = 'retry';
  } else if (!failed.rollbackRequired && affectedTasks.length === 0) {
    strategy = 'skip';
  } else if (failed.dependsOn.length === 0 && affectedTasks.length > 5) {
    strategy = 'abort';
  }

  const estimatedRecoveryMs = [failedTaskId, ...affectedTasks].reduce(
    (s, id) => s + (taskMap[id]?.estimatedTimeMs ?? 0),
    0,
  );

  return {
    failedTaskId,
    affectedTasks,
    unaffectedTasks,
    recoveryPath,
    skipOnRecovery,
    strategy,
    estimatedRecoveryMs,
  };
}
