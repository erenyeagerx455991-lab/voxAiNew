// ── V9.6 Parallel Planner ─────────────────────────────────────────────────────
import type { ExecutionTask, ParallelGroup, ParallelPlan, TaskId } from './executionTypes.js';

/** Groups tasks by their dependency wave — tasks in the same wave have no
 *  dependency on each other and can run in parallel. */
export function planParallelExecution(tasks: ExecutionTask[], topologicalOrder: TaskId[]): ParallelPlan {
  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  // Compute "wave" (level) for each task
  const level: Record<TaskId, number> = {};
  for (const id of topologicalOrder) {
    const deps = taskMap[id]?.dependsOn ?? [];
    level[id] = deps.length === 0 ? 0 : Math.max(...deps.map(d => (level[d] ?? 0) + 1));
  }

  // Group by level
  const byLevel: Record<number, TaskId[]> = {};
  for (const id of topologicalOrder) {
    const l = level[id] ?? 0;
    (byLevel[l] ??= []).push(id);
  }

  const parallelGroups: TaskId[][] = Object.keys(byLevel)
    .sort((a, b) => Number(a) - Number(b))
    .map(l => byLevel[Number(l)]);

  // Only actually parallel if the group has >1 task AND all are parallelizable
  const groups: ParallelGroup[] = parallelGroups.map((wave, idx) => {
    const estimatedMs = Math.max(...wave.map(id => taskMap[id]?.estimatedTimeMs ?? 0), 0);
    return {
      groupId: `wave-${idx}`,
      tasks: wave,
      canRunWith: [],   // same-wave tasks run together; inter-wave is sequential
      estimatedMs,
    };
  });

  // Mark groups that contain genuinely parallelizable tasks
  for (const g of groups) {
    if (g.tasks.length > 1) {
      g.canRunWith = g.tasks.filter(id => taskMap[id]?.parallelizable);
    }
  }

  // Sequential wall-clock time (all waves sequential, max within each wave)
  const sequentialTotalMs = groups.reduce((s, g) => s + g.estimatedMs, 0);

  // Actual time with parallelism = sum of each wave's max (already captured above)
  const parallelTotalMs = groups.reduce((s, g) => s + g.estimatedMs, 0);

  // Savings from parallelism: tasks that could run concurrently save their min time
  let idleTimePrediction = 0;
  for (const g of groups) {
    if (g.tasks.length > 1) {
      const times = g.tasks.map(id => taskMap[id]?.estimatedTimeMs ?? 0);
      const maxT = Math.max(...times);
      idleTimePrediction += times.reduce((s, t) => s + (maxT - t), 0);
    }
  }

  const parallelEfficiency = sequentialTotalMs > 0
    ? Math.min(1, idleTimePrediction / sequentialTotalMs)
    : 0;

  const sequentialFallback = topologicalOrder;

  return {
    groups,
    parallelGroups,
    parallelEfficiency: Number(parallelEfficiency.toFixed(3)),
    idleTimePrediction,
    sequentialFallback,
  };
}
