// ── V9.0 Runtime Intelligence — Prompt Strategy Planner ──────────────────────
import type { GenerationMode, PromptStrategy, PromptDepth, RuntimeIntelligenceInput } from './runtimeTypes.js';

const DEPTH_MAP: Record<GenerationMode, PromptDepth> = {
  Fast:         'minimal',
  Balanced:     'standard',
  Quality:      'deep',
  Enterprise:   'expert',
  Creative:     'deep',
  Strict:       'expert',
  Experimental: 'deep',
  Safe:         'standard',
};

const MAX_TOKENS: Record<PromptDepth, number> = {
  minimal:  2048,
  standard: 4096,
  deep:     8192,
  expert:   12288,
};

export function planPromptStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): PromptStrategy {
  const depth = DEPTH_MAP[mode];
  const includeExamples    = depth === 'deep' || depth === 'expert';
  const includeConstraints = mode !== 'Fast' && mode !== 'Experimental';
  const includeArchitecture = mode !== 'Fast';

  // Enterprise / compliance projects always include architecture context
  const includeArchFinal = includeArchitecture || input.hasCompliance;

  return {
    depth,
    includeExamples,
    includeConstraints,
    includeArchitecture: includeArchFinal,
    maxSystemTokens: MAX_TOKENS[depth],
    rationale: `${mode} prompt: depth=${depth}, examples=${includeExamples}, constraints=${includeConstraints}, max=${MAX_TOKENS[depth]} tokens`,
  };
}
