// ── V9.0 Runtime Intelligence — Parallelization Strategy Planner ─────────────
import type { GenerationMode, ParallelizationStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

const CONCURRENCY: Record<GenerationMode, number> = {
  Fast:         1,
  Balanced:     2,
  Quality:      3,
  Enterprise:   3,
  Creative:     4,
  Strict:       2,
  Experimental: 5,
  Safe:         1,
};

export function planParallelizationStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): ParallelizationStrategy {
  const maxConcurrency       = CONCURRENCY[mode];
  const parallelizeArchitects = mode !== 'Fast' && mode !== 'Safe';
  const parallelizeCandidates = maxConcurrency >= 2;
  const parallelizeRAG        = mode === 'Quality' || mode === 'Enterprise' || mode === 'Experimental';

  return {
    parallelizeArchitects,
    parallelizeCandidates,
    parallelizeRAG,
    maxConcurrency,
    rationale: `${mode} parallelization: max_concurrency=${maxConcurrency}, candidates=${parallelizeCandidates}, rag=${parallelizeRAG}`,
  };
}
