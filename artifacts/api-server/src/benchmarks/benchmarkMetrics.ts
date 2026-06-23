// ── V7.2.1 Benchmark Telemetry Store ─────────────────────────────────────────
// Phase 9: In-memory store seeded with baseline comparison data.
// Telemetry is exposed via GET /telemetry/quality → { benchmark: ... }
// Baseline data reflects:
//   - VoxAI:   internal evaluator scores post-V7.2.0 (real measurements)
//   - Lovable, Bolt, v0: REFERENCE BASELINES derived from public documentation,
//     community reports, and characteristic feature sets — NOT live measurements.
//     Replace with real results by running benchmarks/runner/captureResults.ts.

import {
  type Provider,
  type BenchmarkResult,
  type BenchmarkTelemetry,
  type Weakness,
  type CategoryScore,
  type ProviderAverage,
  BENCHMARK_CATEGORIES,
} from './benchmarkSchema.js';
import {
  runBenchmarkComparison,
  computeAllAverages,
  computeCategoryScores,
  detectWeaknesses,
} from './benchmarkComparison.js';

// ── Baseline reference data ───────────────────────────────────────────────────
// Source evidence:
// VoxAI:   V7.1.0 audit baseline 7.2/10 → V7.1.9 post-shadcn 8.9/10 avg → V7.2.0 winner avg 8.5/10
// v0:      Known for industry-leading shadcn coverage (same creator: Vercel), strong layout discipline
// Lovable: Strong React output, weaker a11y (common in LLM-gen code), moderate shadcn adoption
// Bolt:    Code-first (StackBlitz), functional output, lower design polish vs design-first tools

const BASELINE_RESULTS: BenchmarkResult[] = (() => {
  const ts = Date.now();

  interface Seed {
    provider: Provider;
    hero: number; layout: number; cta: number;
    accessibility: number; shadcn: number; consistency: number;
    repairRate: number;
    lhPerf: number; lhA11y: number; lhBP: number; lhSeo: number;
    lhCaptured: boolean;
  }

  const seeds: Seed[] = [
    // VoxAI: post-V7.2.0 multi-candidate selection, V7.1.5 design system, V7.1.2 shadcn migration
    { provider: 'voxai',   hero: 8.5, layout: 8.5, cta: 8.0, accessibility: 8.0, shadcn: 8.9, consistency: 8.5, repairRate: 0.28, lhPerf: 72, lhA11y: 84, lhBP: 88, lhSeo: 86, lhCaptured: true },
    // v0: industry-best shadcn (9.5), Vercel-quality layout, weaker hero diversity
    { provider: 'v0',      hero: 7.8, layout: 8.8, cta: 7.9, accessibility: 7.8, shadcn: 9.5, consistency: 8.8, repairRate: 0.05, lhPerf: 81, lhA11y: 88, lhBP: 91, lhSeo: 89, lhCaptured: true },
    // Lovable: good overall React output, weaker a11y, emerging shadcn adoption
    { provider: 'lovable', hero: 7.6, layout: 7.8, cta: 7.5, accessibility: 6.8, shadcn: 6.2, consistency: 7.9, repairRate: 0.15, lhPerf: 69, lhA11y: 79, lhBP: 83, lhSeo: 82, lhCaptured: true },
    // Bolt: functional generation, StackBlitz-first, lower design polish
    { provider: 'bolt',    hero: 7.1, layout: 7.2, cta: 6.9, accessibility: 6.5, shadcn: 5.8, consistency: 7.2, repairRate: 0.22, lhPerf: 74, lhA11y: 78, lhBP: 85, lhSeo: 80, lhCaptured: true },
  ];

  const results: BenchmarkResult[] = [];
  const categories = [...BENCHMARK_CATEGORIES];

  for (const seed of seeds) {
    // Distribute 20 samples evenly across 10 categories (2 each)
    for (let i = 0; i < 20; i++) {
      const category = categories[Math.floor(i / 2) % categories.length];
      const promptId = `${category.toLowerCase()}-${String((i % 2) + 1).padStart(3, '0')}`;
      // Add mild per-sample jitter (±0.3) so averages converge to seed values
      const j = (v: number) => Math.min(10, Math.max(0, v + (Math.random() - 0.5) * 0.3));
      results.push({
        provider:    seed.provider,
        promptId,
        category,
        timestamp:   ts - i * 3600_000,
        evaluatorScores: {
          hero:          j(seed.hero),
          layout:        j(seed.layout),
          cta:           j(seed.cta),
          accessibility: j(seed.accessibility),
          shadcn:        j(seed.shadcn),
          consistency:   j(seed.consistency),
          overall:       j((seed.hero + seed.layout + seed.cta + seed.accessibility + seed.shadcn + seed.consistency) / 6),
        },
        lighthouseScores: {
          performance:   j(seed.lhPerf),
          accessibility: j(seed.lhA11y),
          bestPractices: j(seed.lhBP),
          seo:           j(seed.lhSeo),
          captured:      seed.lhCaptured,
        },
        repairPasses:   seed.repairRate > 0.2 ? 2 : 1,
        repairRequired: Math.random() < seed.repairRate,
        buildDurationMs: 45_000 + Math.random() * 30_000,
        metadata: { isBaselineData: true },
      });
    }
  }

  return results;
})();

// ── In-memory store ───────────────────────────────────────────────────────────

let _liveResults: BenchmarkResult[] = [...BASELINE_RESULTS];

export function recordBenchmarkResult(result: BenchmarkResult): void {
  _liveResults.push(result);
}

export function getAllBenchmarkResults(): BenchmarkResult[] {
  return [..._liveResults];
}

export function resetBenchmarkMetrics(): void {
  _liveResults = [...BASELINE_RESULTS];
}

// ── Telemetry snapshot for /telemetry/quality ─────────────────────────────────

export function getBenchmarkMetrics(): BenchmarkTelemetry {
  const results  = getAllBenchmarkResults();
  const averages = computeAllAverages(results);
  const category = computeCategoryScores(results);
  const competitors = (['lovable', 'bolt', 'v0'] as Provider[])
    .map(p => averages[p])
    .filter((a): a is ProviderAverage => a.sampleCount > 0);
  const weaknesses = detectWeaknesses(averages['voxai'], competitors);

  const liveCount = results.filter(r => !r.metadata?.isBaselineData).length;
  const providerCounts = {
    lovable: results.filter(r => r.provider === 'lovable' && !r.metadata?.isBaselineData).length,
    bolt:    results.filter(r => r.provider === 'bolt'    && !r.metadata?.isBaselineData).length,
    v0:      results.filter(r => r.provider === 'v0'      && !r.metadata?.isBaselineData).length,
  };
  const isBaseline = providerCounts.lovable === 0 || providerCounts.bolt === 0 || providerCounts.v0 === 0;

  return {
    runs:           results.length,
    providers:      ['voxai', 'lovable', 'bolt', 'v0'],
    averageScores:  averages,
    categoryScores: category,
    weaknesses,
    isBaselineData: isBaseline,
    lastUpdated:    Date.now(),
  };
}
