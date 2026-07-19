// ── V9.6 Checkpoint Planner ───────────────────────────────────────────────────
import type { Checkpoint, ExecutionTask, TaskId } from './executionTypes.js';

// Always insert a checkpoint after these tasks (major milestones)
const MILESTONE_IDS = new Set<TaskId>(['planning', 'frontend', 'repair', 'scaffold']);

// Insert checkpoint after critical-path tasks that block everything downstream
const COST_THRESHOLD_TOKENS = 3000;

export function planCheckpoints(tasks: ExecutionTask[]): Checkpoint[] {
  const checkpoints: Checkpoint[] = [];
  let cpIdx = 0;

  for (const task of tasks) {
    const isMilestone = MILESTONE_IDS.has(task.id);
    const isCostThreshold = task.estimatedCostTokens >= COST_THRESHOLD_TOKENS;
    const isCriticalBoundary = task.isCritical && task.isBlocking;
    const needsCheckpoint = isMilestone || isCostThreshold || isCriticalBoundary;

    if (needsCheckpoint) {
      const reason: Checkpoint['reason'] = isMilestone
        ? 'milestone'
        : isCostThreshold ? 'cost-threshold'
        : isCriticalBoundary ? 'critical-boundary'
        : 'recovery-point';

      checkpoints.push({
        id: `cp-${++cpIdx}`,
        afterTaskId: task.id,
        reason,
        supportsResume: true,
        supportsRollback: task.rollbackRequired,
      });
    }
  }

  return checkpoints;
}
