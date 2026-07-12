// ── V9.0 Runtime Intelligence — Candidate Strategy Planner ───────────────────
//
// Decides how many candidates to generate and what type.
// Instead of always generating A/B/C, the Runtime chooses dynamically.
import type { GenerationMode, CandidateStrategy, CandidateCount, CandidateType, RuntimeIntelligenceInput } from './runtimeTypes.js';

interface CandidateConfig { count: CandidateCount; type: CandidateType; parallelGeneration: boolean }

const CANDIDATE_MAP: Record<GenerationMode, CandidateConfig> = {
  Fast:         { count: 1, type: 'full',           parallelGeneration: false },
  Balanced:     { count: 2, type: 'full',           parallelGeneration: true  },
  Quality:      { count: 3, type: 'full',           parallelGeneration: true  },
  Enterprise:   { count: 3, type: 'full',           parallelGeneration: true  },
  Creative:     { count: 3, type: 'full',           parallelGeneration: true  },
  Strict:       { count: 3, type: 'full',           parallelGeneration: true  },
  Experimental: { count: 5, type: 'full',           parallelGeneration: true  },
  Safe:         { count: 1, type: 'full',           parallelGeneration: false },
};

function candidateRationale(mode: GenerationMode, count: CandidateCount): string {
  if (count === 1) return `Single candidate for ${mode} mode — speed prioritized over variety`;
  if (count === 2) return `Dual candidates for ${mode} mode — balanced exploration vs speed`;
  if (count === 3) return `Three candidates (A/B/C) for ${mode} mode — standard quality exploration`;
  return `Five candidates for ${mode} mode — maximum exploration for experimental generation`;
}

export function planCandidateStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): CandidateStrategy {
  const config = { ...CANDIDATE_MAP[mode] };

  // Complexity overrides: very simple landing pages get 1 candidate even in Quality mode
  const isSimpleLanding = input.productFeatures.length <= 1
    && (input.productGoal.toLowerCase().includes('landing') || input.serviceCount === 0);
  if (isSimpleLanding && config.count > 1) {
    config.count = 1;
    config.parallelGeneration = false;
  }

  // AIPlatform / DeveloperPlatform benefit from maximum exploration in Quality mode
  if (mode === 'Quality' && ['AIPlatform', 'DeveloperPlatform'].includes(input.backendType)) {
    config.count = 3;
  }

  return {
    count:              config.count,
    type:               config.type,
    parallelGeneration: config.parallelGeneration,
    rationale:          candidateRationale(mode, config.count),
  };
}
