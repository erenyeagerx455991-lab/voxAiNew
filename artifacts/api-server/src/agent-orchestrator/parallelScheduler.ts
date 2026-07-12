// ── V9.2 Orchestrator — Parallel Execution Engine ────────────────────────────
//
// Executes a dependency-graph's waves in order; every agent within a wave
// runs concurrently. Supports barrier execution (a wave is a completion
// gate — the next wave never starts until the current one settles),
// per-agent retry/timeout via retryEngine, partial success (non-critical
// failures don't stop the run), and cancellation (a critical failure stops
// all subsequent waves — "deadlock prevention" by construction, since the
// graph is acyclic and each wave only depends on earlier, already-settled
// waves).
import type { AgentName, RetryPolicy, TimeoutPolicy } from './types.js';
import { withRetry } from './retryEngine.js';

export interface ScheduledTask<T = unknown> {
  agent:         AgentName;
  run:           () => Promise<T>;
  retryPolicy:   RetryPolicy;
  timeoutPolicy: TimeoutPolicy;
}

export interface TaskResult<T = unknown> {
  agent:      AgentName;
  success:    boolean;
  result?:    T;
  error?:     string;
  attempts:   number;
  timedOut:   boolean;
  durationMs: number;
  skipped:    boolean;
}

export interface ScheduleRunResult {
  results:   TaskResult[];
  cancelled: boolean;
  cancelledAt?: AgentName[];
}

/**
 * Runs `waves` (an array of parallel groups) in sequence. Each wave's tasks
 * run concurrently via Promise.allSettled. If any task in a wave is marked
 * `critical` and fails (after retries), the run cancels — remaining waves
 * are marked skipped rather than executed.
 */
export async function runSchedule(
  waves: ScheduledTask[][],
  onWaveStart?: (wave: AgentName[]) => void,
  onWaveDone?: (results: TaskResult[]) => void,
): Promise<ScheduleRunResult> {
  const results: TaskResult[] = [];
  let cancelled = false;
  const cancelledAt: AgentName[] = [];

  for (const wave of waves) {
    if (cancelled) {
      for (const t of wave) {
        results.push({ agent: t.agent, success: false, attempts: 0, timedOut: false, durationMs: 0, skipped: true });
        cancelledAt.push(t.agent);
      }
      continue;
    }

    onWaveStart?.(wave.map(t => t.agent));

    const waveResults = await Promise.allSettled(
      wave.map(async (task): Promise<TaskResult> => {
        const start = Date.now();
        const outcome = await withRetry(task.run, task.retryPolicy, task.timeoutPolicy.timeoutMs);
        return {
          agent: task.agent,
          success: outcome.success,
          result: outcome.result,
          error: outcome.error,
          attempts: outcome.attempts,
          timedOut: outcome.timedOut,
          durationMs: Date.now() - start,
          skipped: false,
        };
      }),
    );

    for (let i = 0; i < waveResults.length; i++) {
      const settled = waveResults[i];
      const task = wave[i];
      const taskResult: TaskResult = settled.status === 'fulfilled'
        ? settled.value
        : { agent: task.agent, success: false, error: String(settled.reason), attempts: 1, timedOut: false, durationMs: 0, skipped: false };

      results.push(taskResult);

      if (!taskResult.success && task.retryPolicy.critical && task.retryPolicy.recoveryMode === 'abort') {
        cancelled = true;
      }
    }

    onWaveDone?.(waveResults.map((r, i) => r.status === 'fulfilled' ? r.value : {
      agent: wave[i].agent, success: false, attempts: 1, timedOut: false, durationMs: 0, skipped: false,
    }));

    if (cancelled) continue;
  }

  return { results, cancelled, cancelledAt: cancelledAt.length > 0 ? cancelledAt : undefined };
}
