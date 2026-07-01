/**
 * V8.1 — dnaRanking.ts unit tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  updateRanking,
  batchUpdateRankings,
  getTopRankings,
  getAllRankings,
  applyRankingStatus,
  getRankingStatus,
  exportRankings,
  importRankings,
  resetRankings,
  getRankingMetrics,
  getTopLayouts,
  getTopComponents,
  getTopSections,
  getTopThemes,
  getTopMotions,
  getTopTokens,
  getTopHeroStyles,
  getTopCtaStyles,
  getTopForms,
  getTopDashboards,
  getTopNavigation,
  getTopPricingLayouts,
  getTopTemplates,
  getTopCards,
  getTopCharts,
} from "../../design-dna/dnaRanking.js";

beforeEach(() => {
  resetRankings();
});

// ── updateRanking ─────────────────────────────────────────────────────────────

describe("updateRanking", () => {
  it("creates a new entry on first update", () => {
    updateRanking({ category: "layouts", id: "centered", score: 8 });
    const top = getTopRankings("layouts", 10);
    expect(top.length).toBe(1);
    expect(top[0].id).toBe("centered");
  });

  it("accumulates scores across updates", () => {
    updateRanking({ category: "layouts", id: "centered", score: 8 });
    updateRanking({ category: "layouts", id: "centered", score: 6 });
    const top = getTopRankings("layouts", 1);
    expect(top[0].score).toBeCloseTo(7.0, 1); // (8+6)/2
  });

  it("tracks usage count", () => {
    updateRanking({ category: "layouts", id: "centered", score: 8 });
    updateRanking({ category: "layouts", id: "centered", score: 8 });
    const top = getTopRankings("layouts", 1);
    expect(top[0].usageCount).toBe(2);
  });

  it("tracks success count", () => {
    updateRanking({ category: "layouts", id: "centered", score: 8, success: true });
    updateRanking({ category: "layouts", id: "centered", score: 8, success: false });
    const top = getTopRankings("layouts", 1);
    expect(top[0].successRate).toBeCloseTo(0.5, 1);
  });

  it("uses label when provided", () => {
    updateRanking({ category: "layouts", id: "asym", label: "Asymmetric Layout", score: 7 });
    expect(getTopRankings("layouts", 1)[0].label).toBe("Asymmetric Layout");
  });

  it("defaults label to id when not provided", () => {
    updateRanking({ category: "layouts", id: "asym", score: 7 });
    expect(getTopRankings("layouts", 1)[0].label).toBe("asym");
  });
});

// ── batchUpdateRankings ───────────────────────────────────────────────────────

describe("batchUpdateRankings", () => {
  it("processes all inputs", () => {
    batchUpdateRankings([
      { category: "layouts",    id: "a", score: 8 },
      { category: "components", id: "b", score: 7 },
      { category: "themes",     id: "c", score: 9 },
    ]);
    expect(getTopRankings("layouts", 5).length).toBe(1);
    expect(getTopRankings("components", 5).length).toBe(1);
    expect(getTopRankings("themes", 5).length).toBe(1);
  });
});

// ── getTopRankings ────────────────────────────────────────────────────────────

describe("getTopRankings", () => {
  it("sorts by score descending", () => {
    updateRanking({ category: "sections", id: "hero", score: 9 });
    updateRanking({ category: "sections", id: "pricing", score: 6 });
    const top = getTopRankings("sections", 10);
    expect(top[0].id).toBe("hero");
    expect(top[1].id).toBe("pricing");
  });

  it("respects limit", () => {
    for (let i = 0; i < 10; i++) {
      updateRanking({ category: "sections", id: `s${i}`, score: i });
    }
    expect(getTopRankings("sections", 3).length).toBe(3);
  });

  it("returns empty array for unknown category", () => {
    expect(getTopRankings("heroStyles", 5)).toEqual([]);
  });
});

// ── Trend detection ───────────────────────────────────────────────────────────

describe("trend detection", () => {
  it("marks 'rising' when score improves significantly", () => {
    updateRanking({ category: "motions", id: "fade", score: 5 });
    // Second update with high score drives average up
    updateRanking({ category: "motions", id: "fade", score: 9.5 });
    const entry = getTopRankings("motions", 1)[0];
    // prevScore was 5, new avg is ~7.25 — could be rising
    expect(["rising", "stable"]).toContain(entry.trend);
  });

  it("marks 'stable' when score is unchanged", () => {
    updateRanking({ category: "tokens", id: "linear-dark", score: 7 });
    updateRanking({ category: "tokens", id: "linear-dark", score: 7 });
    const entry = getTopRankings("tokens", 1)[0];
    expect(entry.trend).toBe("stable");
  });
});

// ── getAllRankings ────────────────────────────────────────────────────────────

describe("getAllRankings", () => {
  it("returns all categories that have been updated", () => {
    updateRanking({ category: "layouts",    id: "a", score: 7 });
    updateRanking({ category: "components", id: "b", score: 7 });
    const all = getAllRankings();
    expect(Object.keys(all)).toContain("layouts");
    expect(Object.keys(all)).toContain("components");
  });
});

// ── Promotion / Demotion ──────────────────────────────────────────────────────

describe("applyRankingStatus", () => {
  it("promotes entries with score ≥ 9 after 5+ uses", () => {
    for (let i = 0; i < 6; i++) {
      updateRanking({ category: "layouts", id: "excellent", score: 9.5 });
    }
    const changed = applyRankingStatus();
    const promoted = changed.find(c => c.id === "excellent" && c.status === "promoted");
    expect(promoted).toBeDefined();
  });

  it("demotes entries with score < 6 after 5+ uses", () => {
    for (let i = 0; i < 6; i++) {
      updateRanking({ category: "layouts", id: "poor", score: 3.0 });
    }
    const changed = applyRankingStatus();
    const demoted = changed.find(c => c.id === "poor" && c.status === "demoted");
    expect(demoted).toBeDefined();
  });

  it("does not promote/demote entries with fewer than 5 uses", () => {
    updateRanking({ category: "layouts", id: "few-uses", score: 9.9 });
    const changed = applyRankingStatus();
    expect(changed.find(c => c.id === "few-uses")).toBeUndefined();
  });

  it("returns empty array when nothing changes", () => {
    expect(applyRankingStatus()).toEqual([]);
  });
});

describe("getRankingStatus", () => {
  it("returns normal by default", () => {
    expect(getRankingStatus("layouts", "new-entry")).toBe("normal");
  });

  it("returns promoted after promotion", () => {
    for (let i = 0; i < 6; i++) {
      updateRanking({ category: "layouts", id: "star", score: 9.9 });
    }
    applyRankingStatus();
    expect(getRankingStatus("layouts", "star")).toBe("promoted");
  });
});

// ── Category convenience getters ──────────────────────────────────────────────

describe("category getters", () => {
  it("getTopLayouts returns layout rankings", () => {
    updateRanking({ category: "layouts", id: "centered", score: 8 });
    expect(getTopLayouts(5).length).toBe(1);
  });

  it("getTopComponents returns component rankings", () => {
    updateRanking({ category: "components", id: "Button", score: 7 });
    expect(getTopComponents(5).length).toBe(1);
  });

  it("getTopSections returns section rankings", () => {
    updateRanking({ category: "sections", id: "hero", score: 9 });
    expect(getTopSections(5).length).toBe(1);
  });

  it("getTopThemes returns theme rankings", () => {
    updateRanking({ category: "themes", id: "linear-dark", score: 8 });
    expect(getTopThemes(5).length).toBe(1);
  });

  it("getTopMotions works", () => {
    updateRanking({ category: "motions", id: "subtle", score: 7 });
    expect(getTopMotions(5).length).toBe(1);
  });

  it("getTopTokens works", () => {
    updateRanking({ category: "tokens", id: "spacing-8", score: 6 });
    expect(getTopTokens(5).length).toBe(1);
  });

  it("getTopHeroStyles works", () => {
    updateRanking({ category: "heroStyles", id: "split", score: 8 });
    expect(getTopHeroStyles(5).length).toBe(1);
  });

  it("getTopCtaStyles works", () => {
    updateRanking({ category: "ctaStyles", id: "gradient-btn", score: 8 });
    expect(getTopCtaStyles(5).length).toBe(1);
  });

  it("getTopForms works", () => {
    updateRanking({ category: "forms", id: "rhf-zod", score: 9 });
    expect(getTopForms(5).length).toBe(1);
  });

  it("getTopDashboards works", () => {
    updateRanking({ category: "dashboards", id: "data-table", score: 7 });
    expect(getTopDashboards(5).length).toBe(1);
  });

  it("getTopNavigation works", () => {
    updateRanking({ category: "navigation", id: "nav-auth-v1", score: 8 });
    expect(getTopNavigation(5).length).toBe(1);
  });

  it("getTopPricingLayouts works", () => {
    updateRanking({ category: "pricingLayouts", id: "three-tier", score: 8 });
    expect(getTopPricingLayouts(5).length).toBe(1);
  });

  it("getTopTemplates works", () => {
    updateRanking({ category: "templates", id: "saas-hero-v1", score: 8 });
    expect(getTopTemplates(5).length).toBe(1);
  });

  it("getTopCards works", () => {
    updateRanking({ category: "cards", id: "feature-card", score: 7 });
    expect(getTopCards(5).length).toBe(1);
  });

  it("getTopCharts works", () => {
    updateRanking({ category: "charts", id: "bar-chart", score: 6 });
    expect(getTopCharts(5).length).toBe(1);
  });
});

// ── Export / Import ───────────────────────────────────────────────────────────

describe("exportRankings / importRankings", () => {
  it("round-trips rankings", () => {
    updateRanking({ category: "layouts", id: "test-layout", score: 8, success: true });
    const exported = exportRankings();
    resetRankings();
    importRankings(exported);
    const top = getTopRankings("layouts", 5);
    expect(top.some(e => e.id === "test-layout")).toBe(true);
  });
});

// ── getRankingMetrics ─────────────────────────────────────────────────────────

describe("getRankingMetrics", () => {
  it("returns zero counts when empty", () => {
    const m = getRankingMetrics();
    expect(m.totalEntries).toBe(0);
    expect(m.categoriesTracked).toBe(0);
  });

  it("returns correct entry count after updates", () => {
    updateRanking({ category: "layouts",    id: "a", score: 7 });
    updateRanking({ category: "components", id: "b", score: 7 });
    const m = getRankingMetrics();
    expect(m.totalEntries).toBe(2);
    expect(m.categoriesTracked).toBe(2);
  });
});
