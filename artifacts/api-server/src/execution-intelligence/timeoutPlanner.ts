// ── V9.6 Timeout Planner ──────────────────────────────────────────────────────
import type { FailureStrategy, TaskTimeoutConfig } from './executionTypes.js';

type Complexity = 'simple' | 'standard' | 'enterprise';

/** Map task base duration to a timeout category + ms ceiling. */
function categorize(baseDurationMs: number, complexity: Complexity): {
  category: TaskTimeoutConfig['category']; timeoutMs: number; onTimeout: FailureStrategy;
} {
  const multiplier = complexity === 'enterprise' ? 2 : complexity === 'simple' ? 0.8 : 1;

  if (baseDurationMs < 500) {
    return { category: 'small',      timeoutMs: 30_000 * multiplier,  onTimeout: 'skip' };
  }
  if (baseDurationMs < 5_000) {
    return { category: 'medium',     timeoutMs: 120_000 * multiplier, onTimeout: 'retry' };
  }
  if (baseDurationMs < 20_000) {
    return { category: 'large',      timeoutMs: 300_000 * multiplier, onTimeout: 'retry' };
  }
  return     { category: 'enterprise', timeoutMs: 600_000 * multiplier, onTimeout: 'abort' };
}

export function computeTimeoutConfig(
  taskId: string,
  baseDurationMs: number,
  complexity: Complexity,
): TaskTimeoutConfig {
  const { category, timeoutMs, onTimeout } = categorize(baseDurationMs, complexity);
  return { timeoutMs: Math.round(timeoutMs), onTimeout, category };
}
