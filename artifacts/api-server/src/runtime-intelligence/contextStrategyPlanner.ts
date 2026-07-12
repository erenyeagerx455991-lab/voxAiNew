// ── V9.0 Runtime Intelligence — Context Strategy Planner ─────────────────────
import type { GenerationMode, ContextStrategy, CompressionLevel, RuntimeIntelligenceInput } from './runtimeTypes.js';

const MAX_TOKENS: Record<GenerationMode, number> = {
  Fast:         4096,
  Balanced:     8192,
  Quality:      16384,
  Enterprise:   24576,
  Creative:     16384,
  Strict:       12288,
  Experimental: 16384,
  Safe:         8192,
};

const COMPRESSION: Record<GenerationMode, CompressionLevel> = {
  Fast:         'aggressive',
  Balanced:     'light',
  Quality:      'none',
  Enterprise:   'none',
  Creative:     'light',
  Strict:       'light',
  Experimental: 'none',
  Safe:         'light',
};

export function planContextStrategy(mode: GenerationMode, _input: RuntimeIntelligenceInput): ContextStrategy {
  const maxTokens       = MAX_TOKENS[mode];
  const compressionLevel = COMPRESSION[mode];
  const includeHistory  = mode !== 'Fast' && mode !== 'Safe';
  const prioritizeRecent = mode === 'Quality' || mode === 'Enterprise' || mode === 'Experimental';

  return {
    maxTokens,
    compressionLevel,
    prioritizeRecent,
    includeHistory,
    rationale: `${mode} context: ${maxTokens} max tokens, compression=${compressionLevel}, history=${includeHistory}`,
  };
}
