// ── V9.0 Runtime Intelligence — Caching Strategy Planner ─────────────────────
import type { GenerationMode, CachingStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

const CACHE_TTL: Record<GenerationMode, number> = {
  Fast:         3600,   // 1 hour — aggressively cache
  Balanced:     1800,   // 30 min
  Quality:      900,    // 15 min — fresher context for quality
  Enterprise:   1800,   // 30 min
  Creative:     600,    // 10 min — fresh context for creativity
  Strict:       3600,   // 1 hour — deterministic, cache-friendly
  Experimental: 300,    // 5 min — minimal cache for novelty
  Safe:         7200,   // 2 hours — maximum cache for safety
};

export function planCachingStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): CachingStrategy {
  const ttl = CACHE_TTL[mode];
  const useCache       = mode !== 'Experimental' && mode !== 'Creative';
  const reuseRetrieval = mode === 'Fast' || mode === 'Safe' || mode === 'Strict';

  return {
    useCache,
    reuseRetrieval,
    cacheTTLSeconds: ttl,
    rationale: `${mode} caching: TTL ${ttl}s, cache=${useCache}, reuse-retrieval=${reuseRetrieval}`,
  };
}
