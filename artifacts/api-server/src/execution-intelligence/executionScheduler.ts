// ── V9.6 Execution Scheduler ──────────────────────────────────────────────────
// Produces the final execution order from topological sort + priorities.
import type { ExecutionTask, ExecutionMode, TaskId } from './executionTypes.js';

export function scheduleExecution(
  tasks: ExecutionTask[],
  topologicalOrder: TaskId[],
  chosenPath: string,
): { executionOrder: TaskId[]; executionMode: ExecutionMode } {
  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Determine execution mode from reasoning path
  let executionMode: ExecutionMode;
  if (chosenPath === 'A') {
    executionMode = 'critical-path-first';
  } else if (chosenPath === 'C') {
    executionMode = 'cost-optimized';
  } else {
    // Check if any parallel work exists
    const hasParallel = tasks.some(t => t.parallelizable);
    executionMode = hasParallel ? 'hybrid' : 'sequential';
  }

  // Sort within each "wave" by priority score (highest first)
  // Waves are defined by topological level — tasks in the same level can be reordered
  const level: Record<TaskId, number> = {};
  for (const id of topologicalOrder) {
    const deps = taskMap[id]?.dependsOn ?? [];
    level[id] = deps.length === 0 ? 0 : Math.max(...deps.map(d => (level[d] ?? 0) + 1));
  }

  const byLevel: Record<number, TaskId[]> = {};
  for (const id of topologicalOrder) {
    const l = level[id] ?? 0;
    (byLevel[l] ??= []).push(id);
  }

  const executionOrder: TaskId[] = [];
  for (const l of Object.keys(byLevel).map(Number).sort((a, b) => a - b)) {
    const waveIds = byLevel[l].sort((a, b) => (taskMap[b]?.priorityScore ?? 0) - (taskMap[a]?.priorityScore ?? 0));
    executionOrder.push(...waveIds);
  }

  return { executionOrder, executionMode };
}
