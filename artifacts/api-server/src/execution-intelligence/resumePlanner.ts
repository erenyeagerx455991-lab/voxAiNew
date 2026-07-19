// ── V9.6 Resume Planner ───────────────────────────────────────────────────────
import type { Checkpoint, ExecutionTask, ResumePlan, ResumeReason, TaskId } from './executionTypes.js';

const ALL_RESUME_REASONS: ResumeReason[] = [
  'crash', 'restart', 'timeout', 'user-pause', 'deployment-interrupt',
];

export function planResume(tasks: ExecutionTask[], checkpoints: Checkpoint[]): ResumePlan {
  if (checkpoints.length === 0) {
    return {
      resumable: false,
      lastCheckpoint: null,
      resumeFromTaskId: null,
      skippableOnResume: [],
      resumeReasons: ALL_RESUME_REASONS,
      estimatedResumeMs: tasks.reduce((s, t) => s + t.estimatedTimeMs, 0),
    };
  }

  const lastCheckpoint = checkpoints[checkpoints.length - 1];
  const taskIds = tasks.map(t => t.id);
  const afterIdx = taskIds.indexOf(lastCheckpoint.afterTaskId);

  // Tasks before the last checkpoint can be skipped on resume
  const skippableOnResume: TaskId[] = afterIdx >= 0 ? taskIds.slice(0, afterIdx + 1) : [];
  const resumeFromTaskId = afterIdx >= 0 && afterIdx + 1 < taskIds.length
    ? taskIds[afterIdx + 1]
    : null;

  const remainingTasks = tasks.filter(t => !skippableOnResume.includes(t.id));
  const estimatedResumeMs = remainingTasks.reduce((s, t) => s + t.estimatedTimeMs, 0);

  return {
    resumable: true,
    lastCheckpoint: lastCheckpoint.id,
    resumeFromTaskId,
    skippableOnResume,
    resumeReasons: ALL_RESUME_REASONS,
    estimatedResumeMs,
  };
}
