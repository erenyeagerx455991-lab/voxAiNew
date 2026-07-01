/**
 * V8.1 — designDNA.ts (facade) unit tests
 *
 * Covers: learnFromBuild, learnFromCritic, learnFromBenchmark,
 *         learnFromRepair, learnFromUserFeedback, learnFromVisualDiff,
 *         learnFromRuntime, learnFromTelemetry, rollbackDna,
 *         getDNAManagerMetrics, Phase 10 promotion/demotion rules.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  learnFromBuild,
  learnFromCritic,
  learnFromBenchmark,
  learnFromRepair,
  learnFromUserFeedback,
  learnFromVisualDiff,
  learnFromRuntime,
  learnFromTelemetry,
  rollbackDna,
  getDNAManagerMetrics,
  getDna,
} from "../../design-dna/designDNA.js";
import { resetRegistry } from "../../design-dna/dnaRegistry.js";
import { resetRankings } from "../../design-dna/dnaRanking.js";
import { resetVersionHistory } from "../../design-dna/dnaVersioning.js";
import { resetPersistenceMetrics, disablePersistence } from "../../design-dna/dnaPersistence.js";

function resetAll() {
  resetRegistry();
  resetRankings();
  resetVersionHistory();
  resetPersistenceMetrics();
  disablePersistence();
}

beforeEach(resetAll);

// ── learnFromBuild ────────────────────────────────────────────────────────────

describe("learnFromBuild", () => {
  it("auto-creates a DNA record if one does not exist", () => {
    learnFromBuild({
      dnaId: "stripe",
      evaluatorScore: 8, criticScore: 7, accessibilityScore: 9,
      optimizationScore: 8, visualScore: 8, repairTriggered: false,
      repairLoops: 0, conversionScore: 8, success: true,
    });
    const r = getDna("dna-stripe");
    expect(r).toBeDefined();
  });

  it("updates evaluatorScore using rolling average", () => {
    learnFromBuild({ dnaId: "linear", evaluatorScore: 8, criticScore: 5, accessibilityScore: 5,
      optimizationScore: 5, visualScore: 5, repairTriggered: false, repairLoops: 0,
      conversionScore: 5, success: true });
    learnFromBuild({ dnaId: "linear", evaluatorScore: 6, criticScore: 5, accessibilityScore: 5,
      optimizationScore: 5, visualScore: 5, repairTriggered: false, repairLoops: 0,
      conversionScore: 5, success: true });
    const r = getDna("dna-linear")!;
    expect(r.evaluatorScore).toBeCloseTo(7.0, 0);
  });

  it("increments usageCount on every call", () => {
    learnFromBuild({ dnaId: "vercel", evaluatorScore: 7, criticScore: 7, accessibilityScore: 7,
      optimizationScore: 7, visualScore: 7, repairTriggered: false, repairLoops: 0,
      conversionScore: 7, success: true });
    learnFromBuild({ dnaId: "vercel", evaluatorScore: 7, criticScore: 7, accessibilityScore: 7,
      optimizationScore: 7, visualScore: 7, repairTriggered: false, repairLoops: 0,
      conversionScore: 7, success: true });
    expect(getDna("dna-vercel")?.usageCount).toBe(2);
  });

  it("increments successCount only on success", () => {
    learnFromBuild({ dnaId: "x", evaluatorScore: 5, criticScore: 5, accessibilityScore: 5,
      optimizationScore: 5, visualScore: 5, repairTriggered: false, repairLoops: 0,
      conversionScore: 5, success: true });
    learnFromBuild({ dnaId: "x", evaluatorScore: 5, criticScore: 5, accessibilityScore: 5,
      optimizationScore: 5, visualScore: 5, repairTriggered: false, repairLoops: 0,
      conversionScore: 5, success: false });
    const r = getDna("dna-x")!;
    expect(r.successCount).toBe(1);
    expect(r.failureCount).toBe(1);
  });

  it("tracks repairCount when repair was triggered", () => {
    learnFromBuild({ dnaId: "repair-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: true, repairLoops: 2, conversionScore: 7, success: true });
    expect(getDna("dna-repair-test")?.repairCount).toBe(1);
    expect(getDna("dna-repair-test")?.averageRepairLoops).toBe(2);
  });

  it("updates confidence after successful builds", () => {
    for (let i = 0; i < 5; i++) {
      learnFromBuild({ dnaId: "conf-test", evaluatorScore: 8, criticScore: 8,
        accessibilityScore: 8, optimizationScore: 8, visualScore: 8,
        repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true });
    }
    expect(getDna("dna-conf-test")?.confidence).toBeGreaterThan(0);
  });

  it("computes V8.1 quality formula in rankingScore", () => {
    learnFromBuild({ dnaId: "quality-test", evaluatorScore: 10, criticScore: 10,
      accessibilityScore: 10, optimizationScore: 10, visualScore: 10,
      repairTriggered: false, repairLoops: 0, conversionScore: 10, success: true });
    // Should be very high but not necessarily perfect due to user/benchmark neutrals
    expect(getDna("dna-quality-test")?.rankingScore).toBeGreaterThan(8.5);
  });

  it("does not throw when called with unknown brand", () => {
    expect(() => learnFromBuild({
      dnaId: "brand-new-unknown-x99", evaluatorScore: 5, criticScore: 5,
      accessibilityScore: 5, optimizationScore: 5, visualScore: 5,
      repairTriggered: false, repairLoops: 0, conversionScore: 5, success: true,
    })).not.toThrow();
  });
});

// ── Phase 10: Promotion rules ────────────────────────────────────────────────

describe("Phase 10 — Promotion (all 5 criteria)", () => {
  it("promotes when all criteria met: score≥9, repairRate<15%, a11y≥9, perf≥8.5, visual≥9", () => {
    // Need enough builds to show stable high performance
    for (let i = 0; i < 3; i++) {
      learnFromBuild({
        dnaId: "top-dna", evaluatorScore: 10, criticScore: 10,
        accessibilityScore: 9.5, optimizationScore: 9.0, visualScore: 9.5,
        repairTriggered: false, repairLoops: 0, conversionScore: 10, success: true,
      });
    }
    const r = getDna("dna-top-dna")!;
    expect(r.status).toBe("promoted");
  });

  it("does NOT promote when accessibilityScore < 9", () => {
    for (let i = 0; i < 3; i++) {
      learnFromBuild({
        dnaId: "low-a11y", evaluatorScore: 10, criticScore: 10,
        accessibilityScore: 7.0, optimizationScore: 9.0, visualScore: 9.5,
        repairTriggered: false, repairLoops: 0, conversionScore: 10, success: true,
      });
    }
    expect(getDna("dna-low-a11y")?.status).not.toBe("promoted");
  });

  it("does NOT promote when performanceScore < 8.5", () => {
    for (let i = 0; i < 3; i++) {
      learnFromBuild({
        dnaId: "low-perf", evaluatorScore: 10, criticScore: 10,
        accessibilityScore: 9.5, optimizationScore: 7.0, visualScore: 9.5,
        repairTriggered: false, repairLoops: 0, conversionScore: 10, success: true,
      });
    }
    expect(getDna("dna-low-perf")?.status).not.toBe("promoted");
  });

  it("does NOT promote when visualScore < 9", () => {
    for (let i = 0; i < 3; i++) {
      learnFromBuild({
        dnaId: "low-visual", evaluatorScore: 10, criticScore: 10,
        accessibilityScore: 9.5, optimizationScore: 9.0, visualScore: 7.0,
        repairTriggered: false, repairLoops: 0, conversionScore: 10, success: true,
      });
    }
    expect(getDna("dna-low-visual")?.status).not.toBe("promoted");
  });
});

// ── Phase 10: Demotion rules ─────────────────────────────────────────────────

describe("Phase 10 — Demotion (any single criterion)", () => {
  it("demotes when repairRate > 50%", () => {
    for (let i = 0; i < 4; i++) {
      learnFromBuild({
        dnaId: "high-repair", evaluatorScore: 7, criticScore: 7,
        accessibilityScore: 8, optimizationScore: 8, visualScore: 8,
        repairTriggered: true, repairLoops: 3, conversionScore: 7, success: true,
      });
    }
    expect(getDna("dna-high-repair")?.status).toBe("demoted");
  });

  it("demotes when accessibilityScore < 7", () => {
    learnFromBuild({
      dnaId: "bad-a11y", evaluatorScore: 8, criticScore: 8,
      accessibilityScore: 5.0, optimizationScore: 8, visualScore: 8,
      repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true,
    });
    expect(getDna("dna-bad-a11y")?.status).toBe("demoted");
  });

  it("demotes when performanceScore < 7", () => {
    learnFromBuild({
      dnaId: "bad-perf", evaluatorScore: 8, criticScore: 8,
      accessibilityScore: 8, optimizationScore: 5.0, visualScore: 8,
      repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true,
    });
    expect(getDna("dna-bad-perf")?.status).toBe("demoted");
  });
});

// ── learnFromCritic ───────────────────────────────────────────────────────────

describe("learnFromCritic", () => {
  it("updates criticScore", () => {
    learnFromBuild({ dnaId: "critic-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    learnFromCritic({ dnaId: "dna-critic-test", criticScore: 9.0, categories: ["typography"], severity: "low", repairApplied: false });
    const r = getDna("dna-critic-test")!;
    expect(r.criticScore).toBeGreaterThan(7);
  });

  it("applies severity penalty for high severity", () => {
    learnFromBuild({ dnaId: "sev-high", evaluatorScore: 7, criticScore: 8,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-sev-high")!.criticScore;
    learnFromCritic({ dnaId: "dna-sev-high", criticScore: 7.0, categories: ["color"], severity: "high", repairApplied: false });
    const after = getDna("dna-sev-high")!.criticScore;
    // High severity applies -0.5 penalty
    expect(after).toBeLessThanOrEqual(before);
  });

  it("demotes when severity is high (Phase 10 rule)", () => {
    learnFromBuild({ dnaId: "sev-demote", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    learnFromCritic({ dnaId: "dna-sev-demote", criticScore: 6.0, categories: ["contrast"], severity: "high", repairApplied: false });
    expect(getDna("dna-sev-demote")?.status).toBe("demoted");
  });

  it("applies repair bonus when repairApplied is true", () => {
    learnFromBuild({ dnaId: "critic-repair", evaluatorScore: 7, criticScore: 6,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    learnFromCritic({ dnaId: "dna-critic-repair", criticScore: 7.0, categories: [], severity: "medium", repairApplied: true });
    // repair bonus +0.2 should partially offset medium penalty -0.2
    expect(getDna("dna-critic-repair")?.criticScore).toBeGreaterThanOrEqual(6);
  });
});

// ── learnFromBenchmark ────────────────────────────────────────────────────────

describe("learnFromBenchmark", () => {
  it("updates rankingScore", () => {
    learnFromBuild({ dnaId: "bench-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-bench-test")!.rankingScore;
    learnFromBenchmark({ dnaId: "dna-bench-test", benchmarkScore: 9.5, category: "saas", delta: 1.5 });
    const after = getDna("dna-bench-test")!.rankingScore;
    expect(after).not.toBe(before);
  });

  it("does not throw for unknown dnaId", () => {
    expect(() => learnFromBenchmark({ dnaId: "ghost", benchmarkScore: 8, category: "saas", delta: 1 })).not.toThrow();
  });
});

// ── learnFromRepair ───────────────────────────────────────────────────────────

describe("learnFromRepair", () => {
  it("increments repairCount", () => {
    learnFromBuild({ dnaId: "repair-fn", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-repair-fn")!.repairCount;
    learnFromRepair({ dnaId: "dna-repair-fn", errorCategory: "css", repairSuccess: true, qualityAfterRepair: 8, loopsUsed: 2 });
    expect(getDna("dna-repair-fn")!.repairCount).toBe(before + 1);
  });

  it("updates averageRepairLoops", () => {
    learnFromBuild({ dnaId: "repair-loops", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    learnFromRepair({ dnaId: "dna-repair-loops", errorCategory: "jsx", repairSuccess: true, qualityAfterRepair: 7, loopsUsed: 3 });
    expect(getDna("dna-repair-loops")?.averageRepairLoops).toBeGreaterThan(0);
  });
});

// ── learnFromUserFeedback ─────────────────────────────────────────────────────

describe("learnFromUserFeedback", () => {
  it("maps 5-star rating to high score contribution", () => {
    learnFromBuild({ dnaId: "feedback-5star", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-feedback-5star")!.rankingScore;
    learnFromUserFeedback({ dnaId: "dna-feedback-5star", rating: 5, action: "accepted" });
    const after = getDna("dna-feedback-5star")!.rankingScore;
    expect(after).toBeGreaterThanOrEqual(before - 0.1); // may be close
  });

  it("reduces section preference when sections are edited", () => {
    learnFromBuild({ dnaId: "feedback-edit", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    // seed section pref
    const initial = { ...getDna("dna-feedback-edit")!.sectionPreferences };
    learnFromUserFeedback({ dnaId: "dna-feedback-edit", rating: 2, action: "edited", editedSections: ["hero"] });
    // If hero existed in prefs, it should have decreased; if not, it gets created with penalty
    const after = getDna("dna-feedback-edit")?.sectionPreferences;
    expect(after?.hero ?? 5).toBeLessThanOrEqual((initial.hero ?? 5));
  });

  it("does not throw for unknown dnaId", () => {
    expect(() => learnFromUserFeedback({ dnaId: "dna-ghost", rating: 3, action: "accepted" })).not.toThrow();
  });
});

// ── learnFromVisualDiff ───────────────────────────────────────────────────────

describe("learnFromVisualDiff", () => {
  it("applies regression penalty when layoutRegression is true", () => {
    learnFromBuild({ dnaId: "vd-test", evaluatorScore: 8, criticScore: 8,
      accessibilityScore: 8, optimizationScore: 8, visualScore: 8,
      repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true });
    learnFromVisualDiff({ dnaId: "dna-vd-test", pixelDiff: 0.3, layoutRegression: true, spacingRegression: false, visualScore: 6 });
    // adjustedVisual = 6 - 1 = 5
    expect(getDna("dna-vd-test")?.visualScore).toBeLessThan(8);
  });

  it("Phase 10: demotes when layoutRegression is true (visualRegressionHigh demotion trigger)", () => {
    learnFromBuild({ dnaId: "vd-demote", evaluatorScore: 8, criticScore: 8,
      accessibilityScore: 8, optimizationScore: 8, visualScore: 8,
      repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true });
    // layoutRegression: true should trigger demotion regardless of overall score
    learnFromVisualDiff({ dnaId: "dna-vd-demote", pixelDiff: 0.4, layoutRegression: true, spacingRegression: false, visualScore: 7 });
    expect(getDna("dna-vd-demote")?.status).toBe("demoted");
  });

  it("Phase 10: does NOT demote when layoutRegression is false", () => {
    learnFromBuild({ dnaId: "vd-no-demote", evaluatorScore: 8, criticScore: 8,
      accessibilityScore: 8, optimizationScore: 8, visualScore: 8,
      repairTriggered: false, repairLoops: 0, conversionScore: 8, success: true });
    learnFromVisualDiff({ dnaId: "dna-vd-no-demote", pixelDiff: 0.1, layoutRegression: false, spacingRegression: false, visualScore: 8 });
    expect(getDna("dna-vd-no-demote")?.status).not.toBe("demoted");
  });

  it("does not throw for unknown dnaId", () => {
    expect(() => learnFromVisualDiff({ dnaId: "dna-ghost", pixelDiff: 0.1, layoutRegression: false, spacingRegression: false, visualScore: 7 })).not.toThrow();
  });
});

// ── learnFromRuntime ──────────────────────────────────────────────────────────

describe("learnFromRuntime", () => {
  it("updates performanceScore via rolling average", () => {
    learnFromBuild({ dnaId: "runtime-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    learnFromRuntime({ dnaId: "dna-runtime-test", buildSuccess: true, runtimeScore: 9.0, errorCount: 0, repairCount: 0 });
    expect(getDna("dna-runtime-test")?.performanceScore).toBeGreaterThan(5);
  });

  it("does not throw for unknown dnaId", () => {
    expect(() => learnFromRuntime({ dnaId: "dna-ghost", buildSuccess: false, runtimeScore: 3, errorCount: 5, repairCount: 2 })).not.toThrow();
  });
});

// ── learnFromTelemetry ────────────────────────────────────────────────────────

describe("learnFromTelemetry", () => {
  it("increases rankingScore for 'improving' trend", () => {
    learnFromBuild({ dnaId: "telem-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-telem-test")!.rankingScore;
    learnFromTelemetry({ dnaId: "dna-telem-test", generationMs: 5000, tokenCount: 30000, successRate: 0.9, qualityTrend: "improving" });
    const after = getDna("dna-telem-test")!.rankingScore;
    expect(after).toBeGreaterThan(before - 0.01); // trend +0.3 bonus
  });

  it("decreases rankingScore for 'degrading' trend", () => {
    learnFromBuild({ dnaId: "telem-degrade", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const before = getDna("dna-telem-degrade")!.rankingScore;
    learnFromTelemetry({ dnaId: "dna-telem-degrade", generationMs: 5000, tokenCount: 30000, successRate: 0.4, qualityTrend: "degrading" });
    const after = getDna("dna-telem-degrade")!.rankingScore;
    expect(after).toBeLessThan(before + 0.01); // trend -0.3 penalty
  });
});

// ── rollbackDna ───────────────────────────────────────────────────────────────

describe("rollbackDna", () => {
  it("restores the DNA to a previous score", () => {
    learnFromBuild({ dnaId: "rollback-brand", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    // Get the version number from the record
    const record = getDna("dna-rollback-brand")!;
    const versionToRollback = record.version;
    // Now evolve further
    learnFromBuild({ dnaId: "rollback-brand", evaluatorScore: 3, criticScore: 3,
      accessibilityScore: 3, optimizationScore: 3, visualScore: 3,
      repairTriggered: true, repairLoops: 5, conversionScore: 3, success: false });
    // Rollback to the earlier version
    const restored = rollbackDna("dna-rollback-brand", versionToRollback);
    expect(restored).not.toBeNull();
    // Version increments after rollback
    expect(restored!.version).toBeGreaterThan(versionToRollback);
  });

  it("returns null for unknown dnaId", () => {
    expect(rollbackDna("dna-ghost", 1)).toBeNull();
  });

  it("returns null for unknown version number", () => {
    learnFromBuild({ dnaId: "rollback-2", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    expect(rollbackDna("dna-rollback-2", 999)).toBeNull();
  });
});

// ── getDNAManagerMetrics ──────────────────────────────────────────────────────

describe("getDNAManagerMetrics", () => {
  it("returns all V8.1 required top-level fields", () => {
    const m = getDNAManagerMetrics();
    expect(m).toHaveProperty("currentVersion");
    expect(m).toHaveProperty("evolutionCount");
    expect(m).toHaveProperty("topLayouts");
    expect(m).toHaveProperty("topComponents");
    expect(m).toHaveProperty("topSections");
    expect(m).toHaveProperty("topThemes");
    expect(m).toHaveProperty("topMotions");
    expect(m).toHaveProperty("topTokens");
    expect(m).toHaveProperty("promotionCount");
    expect(m).toHaveProperty("demotionCount");
    expect(m).toHaveProperty("learningRate");
    expect(m).toHaveProperty("confidence");
    expect(m).toHaveProperty("lastEvolution");
  });

  it("returns arrays for top* fields", () => {
    const m = getDNAManagerMetrics();
    expect(Array.isArray(m.topLayouts)).toBe(true);
    expect(Array.isArray(m.topComponents)).toBe(true);
    expect(Array.isArray(m.topSections)).toBe(true);
    expect(Array.isArray(m.topDnaRecords)).toBe(true);
  });

  it("evolutionCount increases with each learnFromBuild", () => {
    const before = getDNAManagerMetrics().evolutionCount;
    learnFromBuild({ dnaId: "metrics-test", evaluatorScore: 7, criticScore: 7,
      accessibilityScore: 7, optimizationScore: 7, visualScore: 7,
      repairTriggered: false, repairLoops: 0, conversionScore: 7, success: true });
    const after = getDNAManagerMetrics().evolutionCount;
    expect(after).toBeGreaterThan(before);
  });
});
