/**
 * V8.1 — dnaRegistry.ts unit tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createDnaRecord,
  registerDna,
  getDna,
  updateDna,
  deleteDna,
  listDnas,
  getDnasByBrand,
  getDnasByIndustry,
  getTopDnaRecords,
  getRegistryStats,
  getPromotedDnas,
  getDemotedDnas,
  exportRegistry,
  importRegistry,
  resetRegistry,
  generateDnaId,
  getEvolutionCount,
} from "../../design-dna/dnaRegistry.js";

beforeEach(() => {
  resetRegistry();
});

// ── generateDnaId ─────────────────────────────────────────────────────────────

describe("generateDnaId", () => {
  it("generates an id starting with dna-", () => {
    const id = generateDnaId("linear", "saas");
    expect(id.startsWith("dna-")).toBe(true);
  });

  it("lowercases brand and industry in the id", () => {
    const id = generateDnaId("Linear", "SaaS");
    expect(id).toMatch(/linear/);
    expect(id).toMatch(/saas/);
  });

  it("replaces spaces with hyphens", () => {
    const id = generateDnaId("my brand", "fintech");
    expect(id).not.toContain(" ");
  });
});

// ── createDnaRecord ───────────────────────────────────────────────────────────

describe("createDnaRecord", () => {
  it("creates a record with required fields", () => {
    const r = createDnaRecord({ brand: "stripe", industry: "payments", name: "Stripe DNA" });
    expect(r.brand).toBe("stripe");
    expect(r.industry).toBe("payments");
    expect(r.name).toBe("Stripe DNA");
  });

  it("sets sensible defaults for scores", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X" });
    expect(r.evaluatorScore).toBe(5.0);
    expect(r.rankingScore).toBe(5.0);
  });

  it("sets version to 1 by default", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X" });
    expect(r.version).toBe(1);
  });

  it("sets confidence to 0 by default", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X" });
    expect(r.confidence).toBe(0);
  });

  it("sets status to active by default", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X" });
    expect(r.status).toBe("active");
  });

  it("accepts partial overrides", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X", evaluatorScore: 9.5 });
    expect(r.evaluatorScore).toBe(9.5);
  });

  it("always sets createdAt and lastUpdated", () => {
    const r = createDnaRecord({ brand: "x", industry: "saas", name: "X" });
    expect(r.createdAt).toBeTruthy();
    expect(r.lastUpdated).toBeTruthy();
  });
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

describe("registerDna + getDna", () => {
  it("registers and retrieves a record", () => {
    const r = createDnaRecord({ brand: "vercel", industry: "infra", name: "Vercel DNA" });
    registerDna(r);
    const found = getDna(r.id);
    expect(found?.brand).toBe("vercel");
  });

  it("getDna returns undefined for unknown id", () => {
    expect(getDna("not-a-real-id")).toBeUndefined();
  });

  it("getDna returns a copy (mutation-safe)", () => {
    const r = createDnaRecord({ brand: "v", industry: "saas", name: "V" });
    registerDna(r);
    const found = getDna(r.id)!;
    found.evaluatorScore = 99;
    expect(getDna(r.id)?.evaluatorScore).toBe(5.0);
  });
});

describe("updateDna", () => {
  it("increments version on update", () => {
    const r = createDnaRecord({ brand: "b", industry: "saas", name: "B" });
    registerDna(r);
    const updated = updateDna(r.id, { evaluatorScore: 8 });
    expect(updated?.version).toBe(2);
  });

  it("applies patch fields", () => {
    const r = createDnaRecord({ brand: "b", industry: "saas", name: "B" });
    registerDna(r);
    updateDna(r.id, { accessibilityScore: 9.5 });
    expect(getDna(r.id)?.accessibilityScore).toBe(9.5);
  });

  it("returns null for unknown id", () => {
    expect(updateDna("ghost", { evaluatorScore: 1 })).toBeNull();
  });

  it("recalculates confidence after update", () => {
    const r = createDnaRecord({ brand: "b", industry: "saas", name: "B", usageCount: 20, successCount: 18 });
    registerDna(r);
    const updated = updateDna(r.id, { usageCount: 25, successCount: 23 });
    expect(updated?.confidence).toBeGreaterThan(0);
  });

  it("increments evolutionCount", () => {
    const before = getEvolutionCount();
    const r = createDnaRecord({ brand: "b", industry: "saas", name: "B" });
    registerDna(r);
    updateDna(r.id, { evaluatorScore: 7 });
    expect(getEvolutionCount()).toBe(before + 1);
  });
});

describe("deleteDna", () => {
  it("removes a registered record", () => {
    const r = createDnaRecord({ brand: "d", industry: "saas", name: "D" });
    registerDna(r);
    expect(deleteDna(r.id)).toBe(true);
    expect(getDna(r.id)).toBeUndefined();
  });

  it("returns false for unknown id", () => {
    expect(deleteDna("nobody")).toBe(false);
  });
});

// ── Queries ───────────────────────────────────────────────────────────────────

describe("listDnas", () => {
  it("returns all registered records", () => {
    const r1 = createDnaRecord({ brand: "a", industry: "saas", name: "A" });
    const r2 = createDnaRecord({ brand: "b", industry: "saas", name: "B" });
    registerDna(r1);
    registerDna(r2);
    expect(listDnas().length).toBe(2);
  });

  it("returns empty array when empty", () => {
    expect(listDnas()).toEqual([]);
  });
});

describe("getDnasByBrand", () => {
  it("filters by brand case-insensitively", () => {
    const r = createDnaRecord({ brand: "Linear", industry: "saas", name: "L" });
    registerDna(r);
    expect(getDnasByBrand("linear").length).toBe(1);
    expect(getDnasByBrand("STRIPE").length).toBe(0);
  });
});

describe("getDnasByIndustry", () => {
  it("filters by industry", () => {
    const r = createDnaRecord({ brand: "x", industry: "fintech", name: "X" });
    registerDna(r);
    expect(getDnasByIndustry("fintech").length).toBe(1);
    expect(getDnasByIndustry("saas").length).toBe(0);
  });
});

describe("getTopDnaRecords", () => {
  it("returns only used records sorted by rankingScore", () => {
    const r1 = createDnaRecord({ brand: "a", industry: "saas", name: "A", rankingScore: 9, usageCount: 5 });
    const r2 = createDnaRecord({ brand: "b", industry: "saas", name: "B", rankingScore: 7, usageCount: 3 });
    const r3 = createDnaRecord({ brand: "c", industry: "saas", name: "C", usageCount: 0 });
    registerDna(r1); registerDna(r2); registerDna(r3);
    const top = getTopDnaRecords(10);
    expect(top[0].brand).toBe("a");
    expect(top[1].brand).toBe("b");
    expect(top.find(r => r.brand === "c")).toBeUndefined();
  });

  it("respects the limit parameter", () => {
    for (let i = 0; i < 5; i++) {
      const r = createDnaRecord({ brand: `brand${i}`, industry: "saas", name: `B${i}`, usageCount: i + 1 });
      registerDna(r);
    }
    expect(getTopDnaRecords(3).length).toBe(3);
  });
});

// ── Status filters ────────────────────────────────────────────────────────────

describe("getPromotedDnas / getDemotedDnas", () => {
  it("returns promoted records", () => {
    const r = createDnaRecord({ brand: "p", industry: "saas", name: "P", status: "promoted" });
    registerDna(r);
    expect(getPromotedDnas().some(d => d.brand === "p")).toBe(true);
  });

  it("returns demoted records", () => {
    const r = createDnaRecord({ brand: "d", industry: "saas", name: "D", status: "demoted" });
    registerDna(r);
    expect(getDemotedDnas().some(d => d.brand === "d")).toBe(true);
  });

  it("does not mix promoted and demoted", () => {
    const rp = createDnaRecord({ brand: "p", industry: "saas", name: "P", status: "promoted" });
    const rd = createDnaRecord({ brand: "d", industry: "saas", name: "D", status: "demoted" });
    registerDna(rp); registerDna(rd);
    expect(getPromotedDnas().every(r => r.status === "promoted")).toBe(true);
    expect(getDemotedDnas().every(r => r.status === "demoted")).toBe(true);
  });
});

// ── Export / Import ───────────────────────────────────────────────────────────

describe("exportRegistry / importRegistry", () => {
  it("round-trips all records", () => {
    const r = createDnaRecord({ brand: "rt", industry: "saas", name: "RT" });
    registerDna(r);
    const exported = exportRegistry();
    resetRegistry();
    expect(listDnas().length).toBe(0);
    importRegistry(exported);
    expect(getDna(r.id)?.brand).toBe("rt");
  });
});

// ── Stats ─────────────────────────────────────────────────────────────────────

describe("getRegistryStats", () => {
  it("returns correct totals", () => {
    const r = createDnaRecord({ brand: "s", industry: "saas", name: "S", usageCount: 1, status: "promoted" });
    registerDna(r);
    const stats = getRegistryStats();
    expect(stats.totalDnas).toBe(1);
    expect(stats.promotedDnas).toBe(1);
  });
});
