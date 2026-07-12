// ── V9.0 Runtime Intelligence — Generation Strategy Planner ──────────────────
import type { GenerationMode, GenerationStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';
import { getModeRationale } from './generationModeClassifier.js';

const STRATEGY_MAP: Record<GenerationMode, Omit<GenerationStrategy, 'rationale'>> = {
  Fast:         { mode: 'Fast',         isIncremental: false, isParallel: false, isDeterministic: true,  maxIterations: 1, contextDepth: 'minimal'  },
  Balanced:     { mode: 'Balanced',     isIncremental: false, isParallel: true,  isDeterministic: true,  maxIterations: 2, contextDepth: 'standard' },
  Quality:      { mode: 'Quality',      isIncremental: true,  isParallel: true,  isDeterministic: true,  maxIterations: 3, contextDepth: 'deep'     },
  Enterprise:   { mode: 'Enterprise',   isIncremental: true,  isParallel: true,  isDeterministic: true,  maxIterations: 4, contextDepth: 'deep'     },
  Creative:     { mode: 'Creative',     isIncremental: false, isParallel: true,  isDeterministic: false, maxIterations: 3, contextDepth: 'deep'     },
  Strict:       { mode: 'Strict',       isIncremental: true,  isParallel: false, isDeterministic: true,  maxIterations: 3, contextDepth: 'deep'     },
  Experimental: { mode: 'Experimental', isIncremental: false, isParallel: true,  isDeterministic: false, maxIterations: 5, contextDepth: 'deep'     },
  Safe:         { mode: 'Safe',         isIncremental: false, isParallel: false, isDeterministic: true,  maxIterations: 1, contextDepth: 'standard' },
};

export function planGenerationStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): GenerationStrategy {
  return {
    ...STRATEGY_MAP[mode],
    rationale: getModeRationale(mode, input),
  };
}
