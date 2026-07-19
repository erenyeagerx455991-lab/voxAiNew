// ── V9.6 Execution Time Planner ───────────────────────────────────────────────
import type { TimeEstimate } from './executionTypes.js';

export function estimateExecutionTime(
  tasks: { estimatedTimeMs: number; parallelizable: boolean }[],
  criticalPathDurationMs: number,
  parallelSavingsMs: number,
): TimeEstimate {
  const sequentialMs = tasks.reduce((s, t) => s + t.estimatedTimeMs, 0);
  const averageMs = Math.max(criticalPathDurationMs, sequentialMs - parallelSavingsMs);
  const minimumMs = Math.round(averageMs * 0.7);   // optimistic
  const worstCaseMs = Math.round(averageMs * 1.6); // with retries + slow providers

  return {
    minimumMs,
    averageMs: Math.round(averageMs),
    worstCaseMs,
    criticalPathMs: criticalPathDurationMs,
    parallelSavingsMs,
  };
}
