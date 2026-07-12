// ── V9.0 Runtime Intelligence — Retry Strategy Planner ───────────────────────
import type { GenerationMode, RetryStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

interface RetryConfig { maxRetries: number; backoffMs: number; retryOnQualityFail: boolean }

const RETRY_MAP: Record<GenerationMode, RetryConfig> = {
  Fast:         { maxRetries: 1, backoffMs: 500,  retryOnQualityFail: false },
  Balanced:     { maxRetries: 2, backoffMs: 1000, retryOnQualityFail: false },
  Quality:      { maxRetries: 3, backoffMs: 2000, retryOnQualityFail: true  },
  Enterprise:   { maxRetries: 5, backoffMs: 2000, retryOnQualityFail: true  },
  Creative:     { maxRetries: 2, backoffMs: 1000, retryOnQualityFail: true  },
  Strict:       { maxRetries: 3, backoffMs: 2000, retryOnQualityFail: true  },
  Experimental: { maxRetries: 2, backoffMs: 500,  retryOnQualityFail: false },
  Safe:         { maxRetries: 3, backoffMs: 3000, retryOnQualityFail: false },
};

export function planRetryStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): RetryStrategy {
  const config = RETRY_MAP[mode];
  return {
    ...config,
    rationale: `${mode} retry: max=${config.maxRetries}, backoff=${config.backoffMs}ms, quality-fail=${config.retryOnQualityFail}`,
  };
}
