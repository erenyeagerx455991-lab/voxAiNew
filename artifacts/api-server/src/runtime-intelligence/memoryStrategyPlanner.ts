// ── V9.0 Runtime Intelligence — Memory Strategy Planner ──────────────────────
import type { GenerationMode, MemoryStrategy, RuntimeIntelligenceInput } from './runtimeTypes.js';

const MAX_RECORDS: Record<GenerationMode, number> = {
  Fast:         50,
  Balanced:     100,
  Quality:      200,
  Enterprise:   500,
  Creative:     150,
  Strict:       300,
  Experimental: 100,
  Safe:         200,
};

export function planMemoryStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): MemoryStrategy {
  const maxContextRecords   = MAX_RECORDS[mode];
  const compressionEnabled  = mode === 'Fast' || mode === 'Balanced' || mode === 'Safe';
  const keepArchitectContext = mode !== 'Fast';

  return {
    maxContextRecords,
    compressionEnabled,
    keepArchitectContext,
    rationale: `${mode} memory: max=${maxContextRecords} records, compression=${compressionEnabled}, keep-arch=${keepArchitectContext}`,
  };
}
