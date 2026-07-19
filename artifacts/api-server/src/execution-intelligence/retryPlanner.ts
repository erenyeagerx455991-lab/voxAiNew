// ── V9.6 Retry Planner ────────────────────────────────────────────────────────
import type { RetryPolicy, BackoffStrategy, TaskRetryConfig } from './executionTypes.js';

// Tasks that should never be retried (user/validation/config failures)
const NEVER_RETRY_IDS = new Set(['component-tree', 'evaluator', 'director', 'ux-intel', 'conversion', 'accessibility', 'optimization']);

// Tasks retried with exponential backoff
const EXP_BACKOFF_IDS = new Set(['repair', 'runtime-val', 'scaffold']);

// Tasks retried with linear backoff
const LINEAR_BACKOFF_IDS = new Set(['planning', 'architecture', 'frontend', 'candidates']);

export function computeRetryConfig(taskId: string, retryable: boolean): TaskRetryConfig {
  if (!retryable || NEVER_RETRY_IDS.has(taskId)) {
    return { retryCount: 0, policy: 'never', backoff: 'none', retryWindowMs: 0, retryable: false };
  }

  if (EXP_BACKOFF_IDS.has(taskId)) {
    return { retryCount: 3, policy: 'exponential', backoff: 'exponential', retryWindowMs: 30_000, retryable: true };
  }
  if (LINEAR_BACKOFF_IDS.has(taskId)) {
    return { retryCount: 1, policy: 'linear', backoff: 'linear', retryWindowMs: 15_000, retryable: true };
  }
  return { retryCount: 1, policy: 'immediate', backoff: 'none', retryWindowMs: 5_000, retryable: true };
}

/** Determine whether a failure should be retried based on failure category. */
export function shouldRetry(
  taskId: string,
  failureReason: 'network' | 'timeout' | 'provider' | 'validation' | 'user' | 'config' | 'unknown',
): boolean {
  if (NEVER_RETRY_IDS.has(taskId)) return false;
  // Never retry these failure types
  if (failureReason === 'validation' || failureReason === 'user' || failureReason === 'config') return false;
  // Always retry these failure types
  if (failureReason === 'network' || failureReason === 'timeout' || failureReason === 'provider') return true;
  return false;
}
