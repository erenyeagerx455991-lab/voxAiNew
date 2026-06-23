import { describe, it, expect, beforeEach } from "vitest";
import {
  recordComponentBuildResult,
  computeQualityScore,
  getCategoryRanking,
  getAllRankings,
  isComponentDeprecated,
  getBestAlternativeInCategory,
  getQualityScore,
  getComponentQualityMetrics,
  getComponentRecord,
  getAllComponentRecords,
  resetComponentMetrics,
  type ComponentBuildInput,
} from "../../src/quality/componentMetrics.js";

// ── helpers ───────────────────────────────────────────────────────────────────

function buildInput(overrides: Partial<ComponentBuildInput> = {}): ComponentBuildInput {
  return {
    componentsUsed: [{ componentId: "hero-bento-v1", category: "hero" }],
    overallScore: 8.5,
    designScore: 8.0,
    accessibilityScore: 8.0,
    repairApplied: false,
    ...overrides,
  };
}

// ── setup ─────────────────────────────────────────────────────────────────────

describe("V7.1.6 Component Quality Scoring Engine", () => {
  beforeEach(() => {
    resetComponentMetrics();
  });

  // ── Phase 1: Data model ───────────────────────────────────────────────────

  describe("Phase 1 — Data Model", () => {
    it("creates a record on first usage", () => {
      recordComponentBuildResult(buildInput());
      const rec = getComponentRecord("hero-bento-v1");
      expect(rec).toBeDefined();
      expect(rec!.componentId).toBe("hero-bento-v1");
      expect(rec!.category).toBe("hero");
      expect(rec!.usageCount).toBe(1);
    });

    it("increments usageCount on repeated calls", () => {
      recordComponentBuildResult(buildInput());
      recordComponentBuildResult(buildInput());
      const rec = getComponentRecord("hero-bento-v1");
      expect(rec!.usageCount).toBe(2);
    });

    it("tracks successCount and repairCount separately", () => {
      recordComponentBuildResult(buildInput({ repairApplied: false }));
      recordComponentBuildResult(buildInput({ repairApplied: true }));
      const rec = getComponentRecord("hero-bento-v1");
      expect(rec!.successCount).toBe(1);
      expect(rec!.repairCount).toBe(1);
    });

    it("tracks multiple components from a single build", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [
          { componentId: "hero-editorial-v1", category: "hero" },
          { componentId: "features-framer-v1", category: "features" },
          { componentId: "pricing-table-v1", category: "pricing" },
        ],
      }));
      const all = getAllComponentRecords();
      expect(all.length).toBe(3);
    });

    it("ignores components with empty componentId", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [{ componentId: "", category: "hero" }],
      }));
      expect(getAllComponentRecords().length).toBe(0);
    });
  });

  // ── Phase 3: Quality Score formula ───────────────────────────────────────

  describe("Phase 3 — Quality Score Formula", () => {
    it("returns 5.0 neutral for unused component record", () => {
      const rec = {
        componentId: "x", category: "hero",
        usageCount: 0, successCount: 0, repairCount: 0,
        sumDesignScore: 0, sumAccessibilityScore: 0, sumOverallScore: 0,
        lastUsedAt: 0, deprecated: false,
      };
      expect(computeQualityScore(rec)).toBe(5.0);
    });

    it("computes correct weighted formula for perfect record", () => {
      // 40%*10 + 25%*10 + 20%*10 + 15%*10 = 10
      const rec = {
        componentId: "x", category: "hero",
        usageCount: 5, successCount: 5, repairCount: 0,
        sumDesignScore: 50, sumAccessibilityScore: 50, sumOverallScore: 50,
        lastUsedAt: 0, deprecated: false,
      };
      expect(computeQualityScore(rec)).toBe(10);
    });

    it("penalizes high repair rate (repairs = 3 out of 5)", () => {
      const rec = {
        componentId: "x", category: "hero",
        usageCount: 5, successCount: 2, repairCount: 3,
        sumDesignScore: 40, sumAccessibilityScore: 40, sumOverallScore: 40,
        lastUsedAt: 0, deprecated: false,
      };
      // design=8, a11y=8, successRate=0.4, repairRate=0.6
      // 8*0.40 + 8*0.25 + (0.4*10)*0.20 + (0.4*10)*0.15
      // = 3.2 + 2.0 + 0.8 + 0.6 = 6.6
      expect(computeQualityScore(rec)).toBe(6.6);
    });

    it("qualityScore via getQualityScore defaults to 5 for unknown", () => {
      expect(getQualityScore("unknown-component")).toBe(5.0);
    });

    it("qualityScore via getQualityScore updates after recording", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [{ componentId: "hero-bento-v1", category: "hero" }],
        designScore: 9,
        accessibilityScore: 9,
        repairApplied: false,
      }));
      const qs = getQualityScore("hero-bento-v1");
      expect(qs).toBeGreaterThan(8);
    });
  });

  // ── Phase 5: Category Rankings ───────────────────────────────────────────

  describe("Phase 5 — Category Rankings", () => {
    it("ranks components by qualityScore descending", () => {
      // good component
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-bento-v1", category: "hero" }],
          designScore: 9, accessibilityScore: 9, repairApplied: false,
        }));
      }
      // worse component
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-editorial-v1", category: "hero" }],
          designScore: 6, accessibilityScore: 6, repairApplied: true,
        }));
      }

      const ranking = getCategoryRanking("hero");
      expect(ranking.length).toBe(2);
      expect(ranking[0].componentId).toBe("hero-bento-v1");
      expect(ranking[0].qualityScore).toBeGreaterThan(ranking[1].qualityScore);
    });

    it("getAllRankings returns all categories", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [
          { componentId: "hero-bento-v1", category: "hero" },
          { componentId: "features-framer-v1", category: "features" },
        ],
      }));
      const rankings = getAllRankings();
      expect(Object.keys(rankings)).toContain("hero");
      expect(Object.keys(rankings)).toContain("features");
    });

    it("getCategoryRanking returns empty array for unknown category", () => {
      expect(getCategoryRanking("nonexistent")).toEqual([]);
    });
  });

  // ── Phase 8: Auto-deprecation ────────────────────────────────────────────

  describe("Phase 8 — Auto-deprecation", () => {
    it("does not deprecate with fewer than 3 uses", () => {
      for (let i = 0; i < 2; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "bad-comp-v1", category: "hero" }],
          designScore: 3, accessibilityScore: 3, repairApplied: true,
        }));
      }
      expect(isComponentDeprecated("bad-comp-v1")).toBe(false);
    });

    it("deprecates when repairRate > 50% AND qualityScore < 6 after 3+ uses", () => {
      // 4/4 repairs, low design score → should deprecate
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "bad-comp-v1", category: "hero" }],
          designScore: 3, accessibilityScore: 3, repairApplied: true,
        }));
      }
      expect(isComponentDeprecated("bad-comp-v1")).toBe(true);
    });

    it("does not deprecate high-quality component even with repairs", () => {
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-good-v1", category: "hero" }],
          designScore: 9, accessibilityScore: 9, repairApplied: i < 2,
        }));
      }
      // 2/4 repairs (50%), qualityScore should be fine
      expect(isComponentDeprecated("hero-good-v1")).toBe(false);
    });

    it("rehabilitates a deprecated component if quality improves", () => {
      // First: drive to deprecated
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-rehab-v1", category: "hero" }],
          designScore: 2, accessibilityScore: 2, repairApplied: true,
        }));
      }
      expect(isComponentDeprecated("hero-rehab-v1")).toBe(true);

      // Then: many successful high-quality builds
      for (let i = 0; i < 10; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-rehab-v1", category: "hero" }],
          designScore: 9.5, accessibilityScore: 9.5, repairApplied: false,
        }));
      }
      expect(isComponentDeprecated("hero-rehab-v1")).toBe(false);
    });
  });

  // ── Phase 4: Planner Intelligence helpers ────────────────────────────────

  describe("Phase 4 — Planner Intelligence", () => {
    it("getBestAlternativeInCategory returns highest quality non-deprecated peer", () => {
      // seed two hero variants
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-good-v1", category: "hero" }],
          designScore: 9, accessibilityScore: 9, repairApplied: false,
        }));
      }
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-bad-v1", category: "hero" }],
          designScore: 2, accessibilityScore: 2, repairApplied: true,
        }));
      }

      const alt = getBestAlternativeInCategory("hero", "hero-bad-v1");
      expect(alt).toBe("hero-good-v1");
    });

    it("getBestAlternativeInCategory returns null if no alternatives exist", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [{ componentId: "hero-only-v1", category: "hero" }],
        designScore: 9, accessibilityScore: 9, repairApplied: false,
      }));
      const alt = getBestAlternativeInCategory("hero", "hero-only-v1");
      expect(alt).toBeNull();
    });

    it("getBestAlternativeInCategory skips deprecated alternatives", () => {
      // only alternative is deprecated
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-alt-v1", category: "hero" }],
          designScore: 2, accessibilityScore: 2, repairApplied: true,
        }));
      }
      expect(isComponentDeprecated("hero-alt-v1")).toBe(true);

      const alt = getBestAlternativeInCategory("hero", "hero-main-v1");
      expect(alt).toBeNull();
    });
  });

  // ── Phase 7: Telemetry export ─────────────────────────────────────────────

  describe("Phase 7 — Telemetry export (getComponentQualityMetrics)", () => {
    it("returns empty totals for fresh store", () => {
      const metrics = getComponentQualityMetrics();
      expect(metrics.totalTracked).toBe(0);
      expect(metrics.totalDeprecated).toBe(0);
      expect(metrics.topComponents).toEqual([]);
    });

    it("returns correct totalTracked after recording", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [
          { componentId: "hero-bento-v1", category: "hero" },
          { componentId: "features-grid-v1", category: "features" },
        ],
      }));
      const metrics = getComponentQualityMetrics();
      expect(metrics.totalTracked).toBe(2);
    });

    it("lists deprecated components correctly", () => {
      for (let i = 0; i < 4; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-bad-v1", category: "hero" }],
          designScore: 2, accessibilityScore: 2, repairApplied: true,
        }));
      }
      const metrics = getComponentQualityMetrics();
      expect(metrics.totalDeprecated).toBe(1);
      expect(metrics.deprecated[0].componentId).toBe("hero-bad-v1");
    });

    it("topComponents sorted by qualityScore descending", () => {
      for (let i = 0; i < 2; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-best-v1", category: "hero" }],
          designScore: 10, accessibilityScore: 10, repairApplied: false,
        }));
      }
      for (let i = 0; i < 2; i++) {
        recordComponentBuildResult(buildInput({
          componentsUsed: [{ componentId: "hero-ok-v1", category: "hero" }],
          designScore: 6, accessibilityScore: 6, repairApplied: false,
        }));
      }
      const metrics = getComponentQualityMetrics();
      expect(metrics.topComponents[0].componentId).toBe("hero-best-v1");
      expect(metrics.topComponents[0].qualityScore).toBeGreaterThan(
        metrics.topComponents[1].qualityScore
      );
    });

    it("categoryRankings groups components by category", () => {
      recordComponentBuildResult(buildInput({
        componentsUsed: [
          { componentId: "hero-bento-v1", category: "hero" },
          { componentId: "features-framer-v1", category: "features" },
        ],
      }));
      const metrics = getComponentQualityMetrics();
      expect(metrics.categoryRankings).toHaveProperty("hero");
      expect(metrics.categoryRankings).toHaveProperty("features");
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────────────

  describe("resetComponentMetrics", () => {
    it("clears all stored records", () => {
      recordComponentBuildResult(buildInput());
      resetComponentMetrics();
      expect(getAllComponentRecords().length).toBe(0);
      expect(getComponentQualityMetrics().totalTracked).toBe(0);
    });
  });
});
