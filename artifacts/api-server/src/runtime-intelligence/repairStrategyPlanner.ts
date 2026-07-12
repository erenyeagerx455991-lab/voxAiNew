// ── V9.0 Runtime Intelligence — Repair Strategy Planner ──────────────────────
import type { GenerationMode, RepairStrategy, RepairPolicy, RuntimeIntelligenceInput } from './runtimeTypes.js';

interface RepairConfig { policy: RepairPolicy; maxPasses: number; threshold: number; isConservative: boolean }

const REPAIR_MAP: Record<GenerationMode, RepairConfig> = {
  Fast:         { policy: 'skip',        maxPasses: 0, threshold: 0,   isConservative: false },
  Balanced:     { policy: 'single',      maxPasses: 1, threshold: 6.0, isConservative: false },
  Quality:      { policy: 'multi',       maxPasses: 3, threshold: 8.0, isConservative: false },
  Enterprise:   { policy: 'aggressive',  maxPasses: 5, threshold: 8.5, isConservative: false },
  Creative:     { policy: 'multi',       maxPasses: 3, threshold: 7.5, isConservative: false },
  Strict:       { policy: 'safe',        maxPasses: 3, threshold: 8.0, isConservative: true  },
  Experimental: { policy: 'aggressive',  maxPasses: 5, threshold: 7.0, isConservative: false },
  Safe:         { policy: 'safe',        maxPasses: 2, threshold: 7.0, isConservative: true  },
};

function repairRationale(mode: GenerationMode, config: RepairConfig): string {
  if (config.policy === 'skip')       return `${mode} mode skips repair to maximize generation speed`;
  if (config.policy === 'aggressive') return `${mode} mode uses aggressive repair (${config.maxPasses} passes, threshold ${config.threshold}) for highest quality output`;
  if (config.policy === 'safe')       return `${mode} mode uses safe/conservative repair to avoid regressions`;
  if (config.policy === 'multi')      return `${mode} mode uses multi-pass repair (${config.maxPasses} passes) for quality refinement`;
  return `${mode} mode uses single-pass repair as a quality gate`;
}

export function planRepairStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): RepairStrategy {
  const config = REPAIR_MAP[mode];
  return {
    ...config,
    rationale: repairRationale(mode, config),
  };
}
