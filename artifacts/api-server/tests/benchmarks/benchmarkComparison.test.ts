// ── V7.2.1 Benchmark Comparison — Tests ──────────────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import {
  computeProviderAverage,
  computeAllAverages,
  computeCategoryScores,
  computeQualityDelta,
  computeAllDeltas,
  detectWeaknesses,
  runBenchmarkComparison,
} from "../../src/benchmarks/benchmarkComparison.js";
import {
  getBenchmarkMetrics,
  resetBenchmarkMetrics,
  recordBenchmarkResult,
} from "../../src/benchmarks/benchmarkMetrics.js";
import type { BenchmarkResult, ProviderAverage } from "../../src/benchmarks/benchmarkSchema.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeResult(
  provider: BenchmarkResult["provider"],
  overrides: Partial<BenchmarkResult["evaluatorScores"]> = {},
  category: BenchmarkResult["category"] = "SaaS",
): BenchmarkResult {
  const scores = {
    hero: 8.0, layout: 8.0, cta: 7.5, accessibility: 7.5,
    shadcn: 8.0, consistency: 8.0, overall: 7.83, ...overrides,
  };
  return {
    provider,
    promptId: `${category.toLowerCase()}-001`,
    category,
    timestamp: Date.now(),
    evaluatorScores: scores,
    lighthouseScores: { performance: 75, accessibility: 80, bestPractices: 85, seo: 85, captured: true },
    repairPasses: 1,
    repairRequired: false,
    buildDurationMs: 45000,
    metadata: { isBaselineData: false },
  };
}

function makeAverage(
  provider: BenchmarkResult["provider"],
  overrides: Partial<ProviderAverage["evaluator"]> = {},
  repairRate = 0.2,
): ProviderAverage {
  return {
    provider,
    sampleCount: 10,
    evaluator: {
      hero: 8.0, layout: 8.0, cta: 7.5, accessibility: 7.5,
      shadcn: 8.0, consistency: 8.0, overall: 7.83, ...overrides,
    },
    lighthouse: { performance: 75, accessibility: 80, bestPractices: 85, seo: 85, captured: true },
    repairRate,
  };
}

// ── Phase 6: Provider Averages ────────────────────────────────────────────────

describe("V7.2.1 — Phase 6: Provider Averages", () => {
  it("computes zero average for provider with no results", () => {
    const avg = computeProviderAverage([], "voxai");
    expect(avg.sampleCount).toBe(0);
    expect(avg.evaluator.overall).toBe(0);
  });

  it("computes correct average for single result", () => {
    const results = [makeResult("voxai", { overall: 8.5 })];
    const avg = computeProviderAverage(results, "voxai");
    expect(avg.sampleCount).toBe(1);
    expect(avg.evaluator.overall).toBeCloseTo(8.5, 1);
  });

  it("averages multiple results correctly", () => {
    const results = [
      makeResult("voxai", { overall: 8.0 }),
      makeResult("voxai", { overall: 9.0 }),
    ];
    const avg = computeProviderAverage(results, "voxai");
    expect(avg.sampleCount).toBe(2);
    expect(avg.evaluator.overall).toBeCloseTo(8.5, 1);
  });

  it("ignores other providers when computing for one provider", () => {
    const results = [
      makeResult("voxai",   { overall: 9.0 }),
      makeResult("lovable", { overall: 6.0 }),
    ];
    const avg = computeProviderAverage(results, "voxai");
    expect(avg.sampleCount).toBe(1);
    expect(avg.evaluator.overall).toBeCloseTo(9.0, 1);
  });

  it("computeAllAverages returns entry for all 4 providers", () => {
    const results = [makeResult("voxai"), makeResult("lovable"), makeResult("bolt"), makeResult("v0")];
    const averages = computeAllAverages(results);
    expect(Object.keys(averages)).toHaveLength(4);
    expect(averages["voxai"].sampleCount).toBe(1);
    expect(averages["lovable"].sampleCount).toBe(1);
  });

  it("repairRate reflects proportion of builds requiring repair", () => {
    const r1 = makeResult("voxai"); r1.repairRequired = true;
    const r2 = makeResult("voxai"); r2.repairRequired = false;
    const avg = computeProviderAverage([r1, r2], "voxai");
    expect(avg.repairRate).toBeCloseTo(0.5, 2);
  });
});

// ── Phase 6: Category Scores ──────────────────────────────────────────────────

describe("V7.2.1 — Phase 6: Category Scores", () => {
  it("groups scores by category and provider", () => {
    const results = [
      makeResult("voxai", { overall: 8.5 }, "SaaS"),
      makeResult("lovable", { overall: 7.0 }, "SaaS"),
      makeResult("voxai", { overall: 9.0 }, "AI"),
    ];
    const scores = computeCategoryScores(results);
    const voxaiSaaS = scores.find(s => s.provider === "voxai" && s.category === "SaaS");
    expect(voxaiSaaS).toBeDefined();
    expect(voxaiSaaS?.avgOverall).toBeCloseTo(8.5, 1);
  });

  it("returns no entry for empty provider+category combination", () => {
    const results = [makeResult("voxai", {}, "SaaS")];
    const scores = computeCategoryScores(results);
    const missing = scores.find(s => s.provider === "bolt" && s.category === "SaaS");
    expect(missing).toBeUndefined();
  });

  it("averages correctly when multiple results for same category+provider", () => {
    const results = [
      makeResult("voxai", { overall: 8.0 }, "Fintech"),
      makeResult("voxai", { overall: 9.0 }, "Fintech"),
    ];
    const scores = computeCategoryScores(results);
    const entry = scores.find(s => s.provider === "voxai" && s.category === "Fintech");
    expect(entry?.avgOverall).toBeCloseTo(8.5, 1);
    expect(entry?.sampleCount).toBe(2);
  });
});

// ── Phase 7: Quality Deltas ───────────────────────────────────────────────────

describe("V7.2.1 — Phase 7: Quality Deltas", () => {
  it("positive delta means VoxAI wins on that dimension", () => {
    const voxai    = makeAverage("voxai",   { overall: 8.5 });
    const lovable  = makeAverage("lovable", { overall: 7.5 });
    const delta    = computeQualityDelta(voxai, lovable);
    expect(delta.evaluator.overall).toBeCloseTo(1.0, 1);
  });

  it("negative delta means VoxAI loses on that dimension", () => {
    const voxai    = makeAverage("voxai",   { shadcn: 8.0 });
    const v0       = makeAverage("v0",      { shadcn: 9.5 });
    const delta    = computeQualityDelta(voxai, v0);
    expect(delta.evaluator.shadcn).toBeCloseTo(-1.5, 1);
  });

  it("competitor is identified correctly in delta", () => {
    const voxai    = makeAverage("voxai");
    const bolt     = makeAverage("bolt");
    const delta    = computeQualityDelta(voxai, bolt);
    expect(delta.competitor).toBe("bolt");
  });

  it("positive repairRateDelta means competitor repairs more than VoxAI", () => {
    const voxai    = makeAverage("voxai",   {}, 0.1);
    const lovable  = makeAverage("lovable", {}, 0.4);
    const delta    = computeQualityDelta(voxai, lovable);
    expect(delta.repairRateDelta).toBeCloseTo(0.3, 1); // competitor repairs more → positive
  });

  it("computeAllDeltas returns deltas for lovable, bolt, and v0", () => {
    const averages = computeAllAverages([
      makeResult("voxai"), makeResult("lovable"), makeResult("bolt"), makeResult("v0"),
    ]);
    const deltas = computeAllDeltas(averages);
    expect(Object.keys(deltas)).toContain("lovable");
    expect(Object.keys(deltas)).toContain("bolt");
    expect(Object.keys(deltas)).toContain("v0");
    expect(Object.keys(deltas)).not.toContain("voxai");
  });
});

// ── Phase 8: Weakness Detection ───────────────────────────────────────────────

describe("V7.2.1 — Phase 8: Weakness Detection", () => {
  it("returns empty list when VoxAI beats all competitors on all dimensions", () => {
    const voxai = makeAverage("voxai", { hero: 9.5, layout: 9.5, cta: 9.5, accessibility: 9.5, shadcn: 9.5, consistency: 9.5, overall: 9.5 });
    const competitors = [
      makeAverage("lovable", { hero: 7.0, layout: 7.0, cta: 7.0, accessibility: 7.0, shadcn: 7.0, consistency: 7.0, overall: 7.0 }),
    ];
    const weaknesses = detectWeaknesses(voxai, competitors);
    expect(weaknesses).toHaveLength(0);
  });

  it("detects a weakness when a competitor scores higher", () => {
    const voxai = makeAverage("voxai",  { shadcn: 7.0 });
    const v0    = makeAverage("v0",     { shadcn: 9.5 });
    const weaknesses = detectWeaknesses(voxai, [v0]);
    const shadcnWeak = weaknesses.find(w => w.dimension === "shadcn");
    expect(shadcnWeak).toBeDefined();
    expect(shadcnWeak?.gap).toBeCloseTo(2.5, 1);
  });

  it("assigns correct severity levels", () => {
    const voxai   = makeAverage("voxai",   { hero: 7.0, layout: 8.0, cta: 8.4 });
    const lovable = makeAverage("lovable", { hero: 9.0, layout: 8.8, cta: 8.6 });
    const weaknesses = detectWeaknesses(voxai, [lovable]);
    const hero = weaknesses.find(w => w.dimension === "hero");
    expect(hero?.severity).toBe("critical"); // gap = 2.0 >= 1.5
    const layout = weaknesses.find(w => w.dimension === "layout");
    expect(layout?.severity).toBe("moderate"); // gap = 0.8
  });

  it("ranks weaknesses by gap descending", () => {
    const voxai   = makeAverage("voxai",   { hero: 6.0, shadcn: 7.0, cta: 8.0 });
    const lovable = makeAverage("lovable", { hero: 9.0, shadcn: 9.0, cta: 8.5 });
    const weaknesses = detectWeaknesses(voxai, [lovable]);
    expect(weaknesses[0].gap).toBeGreaterThanOrEqual(weaknesses[1]?.gap ?? 0);
  });

  it("limits output to requested count", () => {
    const voxai   = makeAverage("voxai",   { hero: 5, layout: 5, cta: 5, accessibility: 5, shadcn: 5, consistency: 5, overall: 5 });
    const lovable = makeAverage("lovable", { hero: 9, layout: 9, cta: 9, accessibility: 9, shadcn: 9, consistency: 9, overall: 9 });
    const weaknesses = detectWeaknesses(voxai, [lovable], 3);
    expect(weaknesses.length).toBeLessThanOrEqual(3);
  });

  it("assigns rank field starting at 1", () => {
    const voxai   = makeAverage("voxai",   { hero: 6.0, shadcn: 7.0 });
    const lovable = makeAverage("lovable", { hero: 9.0, shadcn: 9.0 });
    const weaknesses = detectWeaknesses(voxai, [lovable]);
    if (weaknesses.length > 0) {
      expect(weaknesses[0].rank).toBe(1);
    }
  });

  it("identifies correct bestCompetitor for each weakness", () => {
    const voxai   = makeAverage("voxai",   { shadcn: 7.0 });
    const lovable = makeAverage("lovable", { shadcn: 8.0 });
    const v0      = makeAverage("v0",      { shadcn: 9.5 }); // best competitor for shadcn
    const weaknesses = detectWeaknesses(voxai, [lovable, v0]);
    const shadcnWeak = weaknesses.find(w => w.dimension === "shadcn");
    expect(shadcnWeak?.bestCompetitor).toBe("v0");
  });

  it("returns at most 10 weaknesses by default", () => {
    const voxai   = makeAverage("voxai",   { hero: 1, layout: 1, cta: 1, accessibility: 1, shadcn: 1, consistency: 1, overall: 1 });
    const lovable = makeAverage("lovable", { hero: 9, layout: 9, cta: 9, accessibility: 9, shadcn: 9, consistency: 9, overall: 9 });
    const weaknesses = detectWeaknesses(voxai, [lovable]);
    expect(weaknesses.length).toBeLessThanOrEqual(10);
  });

  it("skips gaps smaller than 0.1", () => {
    const voxai   = makeAverage("voxai",   { hero: 8.0 });
    const lovable = makeAverage("lovable", { hero: 8.05 });
    const weaknesses = detectWeaknesses(voxai, [lovable]);
    const hero = weaknesses.find(w => w.dimension === "hero");
    expect(hero).toBeUndefined();
  });
});

// ── Phase 6+7+8: Full Report ──────────────────────────────────────────────────

describe("V7.2.1 — runBenchmarkComparison: Full Report", () => {
  it("produces a report with all 4 providers represented", () => {
    const results = [
      makeResult("voxai"), makeResult("lovable"), makeResult("bolt"), makeResult("v0"),
    ];
    const report = runBenchmarkComparison(results);
    expect(report.providers).toContain("voxai");
    expect(Object.keys(report.averageScores)).toHaveLength(4);
  });

  it("totalRuns matches input result count", () => {
    const results = [makeResult("voxai"), makeResult("lovable")];
    const report = runBenchmarkComparison(results);
    expect(report.totalRuns).toBe(2);
  });

  it("report is marked isBaselineData when competitor results are missing", () => {
    const results = [makeResult("voxai")]; // no competitor results
    const report = runBenchmarkComparison(results);
    expect(report.dataQuality.isBaselineData).toBe(true);
  });

  it("report is NOT marked isBaselineData when all providers have results", () => {
    const results = [
      makeResult("voxai"), makeResult("lovable"), makeResult("bolt"), makeResult("v0"),
    ];
    const report = runBenchmarkComparison(results);
    expect(report.dataQuality.isBaselineData).toBe(false);
  });

  it("deltas are keyed by competitor not by voxai", () => {
    const results = [
      makeResult("voxai"), makeResult("lovable"), makeResult("bolt"), makeResult("v0"),
    ];
    const report = runBenchmarkComparison(results);
    expect(Object.keys(report.deltas)).not.toContain("voxai");
    expect(Object.keys(report.deltas)).toContain("lovable");
  });

  it("weaknesses array contains at least one entry when competitors score higher", () => {
    const results = [
      makeResult("voxai",   { shadcn: 6.0, hero: 6.0 }),
      makeResult("v0",      { shadcn: 9.5, hero: 8.5 }),
      makeResult("lovable", { shadcn: 7.0, hero: 7.5 }),
      makeResult("bolt",    { shadcn: 6.5, hero: 7.0 }),
    ];
    const report = runBenchmarkComparison(results);
    expect(report.weaknesses.length).toBeGreaterThan(0);
  });
});

// ── Phase 9: Telemetry ────────────────────────────────────────────────────────

describe("V7.2.1 — Phase 9: Benchmark Telemetry", () => {
  beforeEach(() => resetBenchmarkMetrics());

  it("getBenchmarkMetrics returns all 4 providers", () => {
    const metrics = getBenchmarkMetrics();
    expect(metrics.providers).toContain("voxai");
    expect(metrics.providers).toContain("lovable");
    expect(metrics.providers).toContain("bolt");
    expect(metrics.providers).toContain("v0");
  });

  it("runs count increases after recording a result", () => {
    const before = getBenchmarkMetrics().runs;
    recordBenchmarkResult(makeResult("voxai"));
    const after = getBenchmarkMetrics().runs;
    expect(after).toBe(before + 1);
  });

  it("isBaselineData is true when only seeded data is present", () => {
    const metrics = getBenchmarkMetrics();
    expect(metrics.isBaselineData).toBe(true);
  });

  it("weaknesses array is non-empty (seeded data has real competitor gaps)", () => {
    const metrics = getBenchmarkMetrics();
    expect(metrics.weaknesses.length).toBeGreaterThan(0);
  });

  it("categoryScores contains SaaS and AI entries", () => {
    const metrics = getBenchmarkMetrics();
    const cats = metrics.categoryScores.map(s => s.category);
    expect(cats).toContain("SaaS");
    expect(cats).toContain("AI");
  });

  it("reset restores baseline seeded data", () => {
    recordBenchmarkResult(makeResult("voxai", { overall: 9.9 }));
    resetBenchmarkMetrics();
    const metrics = getBenchmarkMetrics();
    expect(metrics.isBaselineData).toBe(true);
  });

  it("averageScores includes all 4 provider averages", () => {
    const metrics = getBenchmarkMetrics();
    expect(metrics.averageScores["voxai"]).toBeDefined();
    expect(metrics.averageScores["v0"]).toBeDefined();
    expect(metrics.averageScores["lovable"]).toBeDefined();
    expect(metrics.averageScores["bolt"]).toBeDefined();
  });

  it("lastUpdated is a recent timestamp", () => {
    const metrics = getBenchmarkMetrics();
    expect(metrics.lastUpdated).toBeGreaterThan(Date.now() - 5000);
  });
});
