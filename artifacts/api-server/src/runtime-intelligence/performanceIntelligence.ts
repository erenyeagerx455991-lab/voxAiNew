// ── V9.0 Runtime Intelligence — Performance Intelligence ─────────────────────
//
// Deterministically predicts build characteristics before generation starts.
// All predictions are estimates based on historical patterns and project signals.
import type { GenerationMode, PerformancePrediction, RuntimeIntelligenceInput } from './runtimeTypes.js';

// ── Base timing estimates (ms) per mode ──────────────────────────────────────
const BASE_BUILD_MS: Record<GenerationMode, number> = {
  Fast:         30_000,   // ~30s
  Balanced:     75_000,   // ~75s
  Quality:      120_000,  // ~120s
  Enterprise:   180_000,  // ~180s
  Creative:     130_000,
  Strict:       110_000,
  Experimental: 150_000,
  Safe:         80_000,
};

const BASE_REPAIR_COUNT: Record<GenerationMode, number> = {
  Fast:         0,
  Balanced:     1,
  Quality:      2,
  Enterprise:   3,
  Creative:     2,
  Strict:       2,
  Experimental: 3,
  Safe:         1,
};

const BASE_TOKEN_USAGE: Record<GenerationMode, number> = {
  Fast:         12_000,
  Balanced:     25_000,
  Quality:      45_000,
  Enterprise:   65_000,
  Creative:     50_000,
  Strict:       40_000,
  Experimental: 55_000,
  Safe:         30_000,
};

const BASE_BUNDLE_KB: Record<GenerationMode, number> = {
  Fast:         180,
  Balanced:     350,
  Quality:      500,
  Enterprise:   600,
  Creative:     550,
  Strict:       450,
  Experimental: 700,
  Safe:         400,
};

/** Completion probability based on mode and project signals */
function estimateCompletionProbability(mode: GenerationMode, input: RuntimeIntelligenceInput): number {
  const BASE: Record<GenerationMode, number> = {
    Fast:         0.97,
    Balanced:     0.94,
    Quality:      0.91,
    Enterprise:   0.88,
    Creative:     0.89,
    Strict:       0.92,
    Experimental: 0.82,
    Safe:         0.96,
  };
  let p = BASE[mode];
  // Penalize for high complexity
  if (input.serviceCount > 5)    p -= 0.03;
  if (input.hasCompliance)       p -= 0.02;
  if (input.hasRealtime)         p -= 0.02;
  return Math.max(0.70, Math.min(0.99, parseFloat(p.toFixed(2))));
}

/** Scale build time by feature/service count */
function scaleBuildTime(base: number, input: RuntimeIntelligenceInput): number {
  const scale = 1
    + (input.serviceCount > 3 ? 0.2 : 0)
    + (input.productFeatures.length > 6 ? 0.15 : 0)
    + (input.hasRealtime ? 0.1 : 0)
    + (input.hasCompliance ? 0.1 : 0);
  return Math.round(base * scale);
}

export function predictPerformance(mode: GenerationMode, input: RuntimeIntelligenceInput): PerformancePrediction {
  const baseTime = scaleBuildTime(BASE_BUILD_MS[mode], input);
  const tokenUsage = BASE_TOKEN_USAGE[mode]
    + (input.serviceCount * 2000)
    + (input.productFeatures.length * 500);
  const bundleKB = BASE_BUNDLE_KB[mode]
    + (input.productFeatures.length > 4 ? 100 : 0);

  return {
    estimatedBuildTimeMs:             baseTime,
    estimatedRepairCount:             BASE_REPAIR_COUNT[mode],
    estimatedTokenUsage:              tokenUsage,
    estimatedRuntimeCostUnits:        parseFloat((tokenUsage / 1000 * 0.002).toFixed(4)),
    estimatedMemoryMB:                mode === 'Enterprise' ? 512 : mode === 'Fast' ? 128 : 256,
    estimatedBundleSizeKB:            bundleKB,
    estimatedCompletionProbability:   estimateCompletionProbability(mode, input),
  };
}
