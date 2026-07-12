// ── V9.0 Runtime Intelligence — Validation Strategy Planner ──────────────────
import type { GenerationMode, ValidationStrategy, ValidationLevel, RuntimeIntelligenceInput } from './runtimeTypes.js';

const VALIDATION_LEVEL: Record<GenerationMode, ValidationLevel> = {
  Fast:         'minimal',
  Balanced:     'standard',
  Quality:      'strict',
  Enterprise:   'enterprise',
  Creative:     'standard',
  Strict:       'strict',
  Experimental: 'standard',
  Safe:         'strict',
};

export function planValidationStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): ValidationStrategy {
  const level = input.hasCompliance
    ? 'enterprise'
    : VALIDATION_LEVEL[mode];

  const validateTypes        = level !== 'minimal';
  const validateRuntime      = level === 'strict' || level === 'enterprise';
  const validateAccessibility = level === 'enterprise' || mode === 'Strict'
    || input.backendType === 'Healthcare';
  const failFast             = mode === 'Fast' || mode === 'Safe';

  return {
    level,
    validateTypes,
    validateRuntime,
    validateAccessibility,
    failFast,
    rationale: `${mode} validation level ${level}: types=${validateTypes}, runtime=${validateRuntime}, a11y=${validateAccessibility}`,
  };
}
