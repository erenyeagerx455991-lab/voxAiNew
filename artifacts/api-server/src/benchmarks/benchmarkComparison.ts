// ── V7.2.1 Benchmark Comparison Engine ───────────────────────────────────────
// Phase 6: Per-provider averages
// Phase 7: Quality deltas (VoxAI vs competitors)
// Phase 8: Weakness detection (top-10)

import {
  type Provider,
  type BenchmarkResult,
  type ProviderAverage,
  type CategoryScore,
  type QualityDelta,
  type Weakness,
  type WeaknessDimension,
  type BenchmarkReport,
  type BenchmarkCategory,
  ALL_PROVIDERS,
  BENCHMARK_CATEGORIES,
} from './benchmarkSchema.js';

// ── Phase 6: Compute per-provider averages ────────────────────────────────────

export function computeProviderAverage(
  results: BenchmarkResult[],
  provider: Provider,
): ProviderAverage {
  const filtered = results.filter(r => r.provider === provider);
  const n = filtered.length;

  if (n === 0) {
    return {
      provider,
      sampleCount: 0,
      evaluator: { hero: 0, layout: 0, cta: 0, accessibility: 0, shadcn: 0, consistency: 0, overall: 0 },
      lighthouse: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0, captured: false },
      repairRate: 0,
    };
  }

  const sum = <K extends string>(key: K, get: (r: BenchmarkResult) => number) =>
    filtered.reduce((acc, r) => acc + get(r), 0) / n;

  const capturedLH = filtered.filter(r => r.lighthouseScores.captured);
  const lhN = capturedLH.length;

  return {
    provider,
    sampleCount: n,
    evaluator: {
      hero:          sum('hero',          r => r.evaluatorScores.hero),
      layout:        sum('layout',        r => r.evaluatorScores.layout),
      cta:           sum('cta',           r => r.evaluatorScores.cta),
      accessibility: sum('accessibility', r => r.evaluatorScores.accessibility),
      shadcn:        sum('shadcn',        r => r.evaluatorScores.shadcn),
      consistency:   sum('consistency',   r => r.evaluatorScores.consistency),
      overall:       sum('overall',       r => r.evaluatorScores.overall),
    },
    lighthouse: {
      performance:   lhN > 0 ? capturedLH.reduce((a, r) => a + r.lighthouseScores.performance,   0) / lhN : 0,
      accessibility: lhN > 0 ? capturedLH.reduce((a, r) => a + r.lighthouseScores.accessibility, 0) / lhN : 0,
      bestPractices: lhN > 0 ? capturedLH.reduce((a, r) => a + r.lighthouseScores.bestPractices, 0) / lhN : 0,
      seo:           lhN > 0 ? capturedLH.reduce((a, r) => a + r.lighthouseScores.seo,           0) / lhN : 0,
      captured:      lhN > 0,
    },
    repairRate: sum('repairRate', r => r.repairRequired ? 1 : 0),
  };
}

export function computeAllAverages(
  results: BenchmarkResult[],
): Record<Provider, ProviderAverage> {
  return Object.fromEntries(
    ALL_PROVIDERS.map(p => [p, computeProviderAverage(results, p)]),
  ) as Record<Provider, ProviderAverage>;
}

// ── Phase 6: Per-category scores ──────────────────────────────────────────────

export function computeCategoryScores(
  results: BenchmarkResult[],
): CategoryScore[] {
  const scores: CategoryScore[] = [];

  for (const category of BENCHMARK_CATEGORIES) {
    for (const provider of ALL_PROVIDERS) {
      const filtered = results.filter(
        r => r.category === category && r.provider === provider,
      );
      if (filtered.length === 0) continue;
      const n = filtered.length;
      scores.push({
        category,
        provider,
        sampleCount: n,
        avgOverall: filtered.reduce((a, r) => a + r.evaluatorScores.overall, 0) / n,
        avgHero:    filtered.reduce((a, r) => a + r.evaluatorScores.hero, 0) / n,
        avgLayout:  filtered.reduce((a, r) => a + r.evaluatorScores.layout, 0) / n,
      });
    }
  }

  return scores;
}

// ── Phase 7: Quality deltas ───────────────────────────────────────────────────

export function computeQualityDelta(
  voxai:      ProviderAverage,
  competitor: ProviderAverage,
): QualityDelta {
  const ev = voxai.evaluator;
  const ce = competitor.evaluator;
  const lv = voxai.lighthouse;
  const lc = competitor.lighthouse;

  return {
    competitor: competitor.provider,
    evaluator: {
      hero:          round2(ev.hero          - ce.hero),
      layout:        round2(ev.layout        - ce.layout),
      cta:           round2(ev.cta           - ce.cta),
      accessibility: round2(ev.accessibility - ce.accessibility),
      shadcn:        round2(ev.shadcn        - ce.shadcn),
      consistency:   round2(ev.consistency   - ce.consistency),
      overall:       round2(ev.overall       - ce.overall),
    },
    lighthouse: {
      performance:   round2(lv.performance   - lc.performance),
      accessibility: round2(lv.accessibility - lc.accessibility),
      bestPractices: round2(lv.bestPractices - lc.bestPractices),
      seo:           round2(lv.seo           - lc.seo),
    },
    repairRateDelta: round2(competitor.repairRate - voxai.repairRate),
  };
}

export function computeAllDeltas(
  averages: Record<Provider, ProviderAverage>,
): Record<Provider, QualityDelta> {
  const voxai = averages['voxai'];
  const competitors: Provider[] = ['lovable', 'bolt', 'v0'];
  return Object.fromEntries(
    competitors.map(p => [p, computeQualityDelta(voxai, averages[p])]),
  ) as Record<Provider, QualityDelta>;
}

// ── Phase 8: Weakness detection ───────────────────────────────────────────────

const RECOMMENDATIONS: Record<WeaknessDimension, string> = {
  'hero':                    'Improve hero variant diversity and headline impact; add more split/full-viewport options',
  'layout':                  'Strengthen section alternation and bento-grid layouts; add more layout templates',
  'cta':                     'Add multi-CTA funnels, urgency signals, and primary/secondary CTA hierarchy',
  'accessibility':           'Improve focus-visible styles, aria-labels on interactive elements, and color contrast',
  'shadcn':                  'Increase shadcn component coverage in templates; replace raw HTML inputs with shadcn equivalents',
  'consistency':             'Enforce uniform spacing scale, color palette, and typography hierarchy across sections',
  'lighthouse.performance':  'Minimize bundle size, lazy-load images, and reduce render-blocking scripts',
  'lighthouse.accessibility':'Audit WCAG 2.1 AA compliance; add skip-nav, landmark roles, and proper heading order',
  'lighthouse.bestPractices':'Eliminate deprecated APIs, missing HTTPS, and console errors',
  'lighthouse.seo':          'Add meta descriptions, structured data, canonical URLs, and semantic HTML',
  'repairRate':              'Reduce codegen errors via stricter prompt rules and pre-flight validation',
};

function getSeverity(gap: number): Weakness['severity'] {
  if (gap >= 1.5) return 'critical';
  if (gap >= 0.5) return 'moderate';
  return 'minor';
}

export function detectWeaknesses(
  voxai:       ProviderAverage,
  competitors: ProviderAverage[],
  limit = 10,
): Weakness[] {
  if (competitors.length === 0) return [];

  const dimensions: Array<{
    dim: WeaknessDimension;
    voxaiScore: number;
    getCompScore: (c: ProviderAverage) => number;
  }> = [
    { dim: 'hero',          voxaiScore: voxai.evaluator.hero,          getCompScore: c => c.evaluator.hero },
    { dim: 'layout',        voxaiScore: voxai.evaluator.layout,        getCompScore: c => c.evaluator.layout },
    { dim: 'cta',           voxaiScore: voxai.evaluator.cta,           getCompScore: c => c.evaluator.cta },
    { dim: 'accessibility', voxaiScore: voxai.evaluator.accessibility, getCompScore: c => c.evaluator.accessibility },
    { dim: 'shadcn',        voxaiScore: voxai.evaluator.shadcn,        getCompScore: c => c.evaluator.shadcn },
    { dim: 'consistency',   voxaiScore: voxai.evaluator.consistency,   getCompScore: c => c.evaluator.consistency },
    ...(voxai.lighthouse.captured ? [
      { dim: 'lighthouse.performance'   as WeaknessDimension, voxaiScore: voxai.lighthouse.performance,   getCompScore: (c: ProviderAverage) => c.lighthouse.performance },
      { dim: 'lighthouse.accessibility' as WeaknessDimension, voxaiScore: voxai.lighthouse.accessibility, getCompScore: (c: ProviderAverage) => c.lighthouse.accessibility },
      { dim: 'lighthouse.bestPractices' as WeaknessDimension, voxaiScore: voxai.lighthouse.bestPractices, getCompScore: (c: ProviderAverage) => c.lighthouse.bestPractices },
      { dim: 'lighthouse.seo'           as WeaknessDimension, voxaiScore: voxai.lighthouse.seo,           getCompScore: (c: ProviderAverage) => c.lighthouse.seo },
    ] : []),
    { dim: 'repairRate', voxaiScore: 1 - voxai.repairRate, getCompScore: c => 1 - c.repairRate },
  ];

  const weaknesses: Weakness[] = [];

  for (const { dim, voxaiScore, getCompScore } of dimensions) {
    const competitorEntries = competitors
      .map(c => ({ provider: c.provider, score: getCompScore(c) }))
      .filter(e => e.score > voxaiScore);

    if (competitorEntries.length === 0) continue;

    const best = competitorEntries.reduce((a, b) => b.score > a.score ? b : a);
    const gap  = round2(best.score - voxaiScore);
    if (gap < 0.1) continue;

    weaknesses.push({
      rank:                0,
      dimension:           dim,
      voxaiScore:          round2(voxaiScore),
      bestCompetitorScore: round2(best.score),
      bestCompetitor:      best.provider as Provider,
      gap,
      severity:            getSeverity(gap),
      recommendation:      RECOMMENDATIONS[dim] ?? 'No recommendation available',
    });
  }

  weaknesses.sort((a, b) => b.gap - a.gap);
  weaknesses.slice(0, limit).forEach((w, i) => { w.rank = i + 1; });

  return weaknesses.slice(0, limit);
}

// ── Phase 6+7+8: Full report ──────────────────────────────────────────────────

export function runBenchmarkComparison(
  allResults: BenchmarkResult[],
): BenchmarkReport {
  const averages       = computeAllAverages(allResults);
  const categoryScores = computeCategoryScores(allResults);
  const deltas         = computeAllDeltas(averages);

  const competitors = (['lovable', 'bolt', 'v0'] as Provider[])
    .map(p => averages[p])
    .filter(a => a.sampleCount > 0);

  const weaknesses = detectWeaknesses(averages['voxai'], competitors);

  const counts = Object.fromEntries(
    ALL_PROVIDERS.map(p => [p, allResults.filter(r => r.provider === p).length]),
  );

  return {
    generatedAt:    Date.now(),
    totalRuns:      allResults.length,
    providers:      ALL_PROVIDERS.filter(p => counts[p] > 0),
    averageScores:  averages,
    categoryScores,
    deltas,
    weaknesses,
    dataQuality: {
      voxaiRuns:      counts['voxai'],
      lovableRuns:    counts['lovable'],
      boltRuns:       counts['bolt'],
      v0Runs:         counts['v0'],
      isBaselineData: counts['lovable'] === 0 || counts['bolt'] === 0 || counts['v0'] === 0,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
