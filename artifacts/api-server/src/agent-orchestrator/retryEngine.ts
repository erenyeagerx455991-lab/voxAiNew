// ── V9.2 Orchestrator — Dynamic Retry Engine ─────────────────────────────────
//
// Wraps any async task with the agent's declared retry policy. Deterministic
// delay computation (no jitter) so it stays testable; never introduces LLM
// calls itself — it just re-invokes the caller-supplied task function.
import type { RetryPolicy } from './types.js';

export interface RetryOutcome<T> {
  result?:    T;
  success:    boolean;
  attempts:   number;
  timedOut:   boolean;
  error?:     string;
}

function computeDelay(policy: RetryPolicy, attempt: number): number {
  if (policy.backoffStrategy === 'none') return 0;
  if (policy.backoffStrategy === 'linear') return policy.retryDelayMs * attempt;
  return policy.retryDelayMs * Math.pow(2, attempt - 1); // exponential
}

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve();
}

async function withTimeout<T>(task: () => Promise<T>, timeoutMs: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return task();
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('ORCHESTRATOR_TIMEOUT')), timeoutMs);
  });
  try {
    return await Promise.race([task(), timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Executes `task` up to `policy.retryCount + 1` times. Never throws —
 * failures are reported in the returned outcome so callers (the scheduler)
 * can apply the agent's failureStrategy/recoveryMode.
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  policy: RetryPolicy,
  timeoutMs = 0,
): Promise<RetryOutcome<T>> {
  let attempts = 0;
  let lastError: string | undefined;
  let timedOut = false;

  const maxAttempts = policy.retryCount + 1;
  for (let i = 0; i < maxAttempts; i++) {
    attempts++;
    try {
      const result = timeoutMs > 0 ? await withTimeout(task, timeoutMs) : await task();
      return { result, success: true, attempts, timedOut: false };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (lastError === 'ORCHESTRATOR_TIMEOUT') timedOut = true;
      if (i < maxAttempts - 1) {
        await sleep(computeDelay(policy, i + 1));
      }
    }
  }

  return { success: false, attempts, timedOut, error: lastError };
}
