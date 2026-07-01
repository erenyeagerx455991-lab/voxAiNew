/**
 * V8.1 — dnaVersioning.ts unit tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createVersion,
  getVersionHistory,
  getVersion,
  getLatestVersion,
  getVersionCount,
  getRollbackSnapshot,
  getVersioningMetrics,
  exportVersionHistory,
  importVersionHistory,
  resetVersionHistory,
} from "../../design-dna/dnaVersioning.js";
import { createDnaRecord } from "../../design-dna/dnaRegistry.js";
import type { DesignDNARecord } from "../../design-dna/dnaTypes.js";

function makeRecord(id: string, version = 1, score = 7.0): DesignDNARecord {
  return createDnaRecord({
    id,
    brand: "testbrand",
    industry: "saas",
    name: "Test DNA",
    version,
    rankingScore: score,
  });
}

beforeEach(() => {
  resetVersionHistory();
});

// ── createVersion ─────────────────────────────────────────────────────────────

describe("createVersion", () => {
  it("stores a version snapshot", () => {
    const r = makeRecord("dna-test", 1, 7.0);
    createVersion(r, ["evaluator:7.0"], "build outcome", 5.0);
    const history = getVersionHistory("dna-test");
    expect(history.length).toBe(1);
  });

  it("captures the version number", () => {
    const r = makeRecord("dna-test", 3, 8.0);
    createVersion(r, ["critic:8.0"], "critic update", 7.5);
    const v = getVersionHistory("dna-test")[0];
    expect(v.version).toBe(3);
  });

  it("captures previous and new score", () => {
    const r = makeRecord("dna-test", 1, 8.5);
    createVersion(r, [], "test", 6.0);
    const v = getVersionHistory("dna-test")[0];
    expect(v.previousScore).toBe(6.0);
    expect(v.newScore).toBe(8.5);
  });

  it("captures the reason", () => {
    const r = makeRecord("dna-test", 1);
    createVersion(r, [], "benchmark update", 5.0);
    expect(getVersionHistory("dna-test")[0].reason).toBe("benchmark update");
  });

  it("captures changes list", () => {
    const r = makeRecord("dna-test", 1);
    createVersion(r, ["a11y:9.0", "perf:8.5"], "pipeline", 5.0);
    const v = getVersionHistory("dna-test")[0];
    expect(v.changes).toContain("a11y:9.0");
    expect(v.changes).toContain("perf:8.5");
  });

  it("snapshot is frozen (immutable)", () => {
    const r = makeRecord("dna-test", 1);
    createVersion(r, [], "test", 5.0);
    const v = getVersionHistory("dna-test")[0];
    expect(() => {
      // @ts-expect-error testing immutability
      v.snapshot.evaluatorScore = 99;
    }).toThrow();
  });

  it("creates unique version IDs", () => {
    const r1 = makeRecord("dna-test", 1, 7.0);
    const r2 = makeRecord("dna-test", 2, 8.0);
    createVersion(r1, [], "v1", 5.0);
    createVersion(r2, [], "v2", 7.0);
    const history = getVersionHistory("dna-test");
    expect(history[0].versionId).not.toBe(history[1].versionId);
  });

  it("appends multiple versions in order", () => {
    for (let i = 1; i <= 5; i++) {
      createVersion(makeRecord("dna-test", i, i), [], `v${i}`, i - 1);
    }
    const history = getVersionHistory("dna-test");
    expect(history.map(v => v.version)).toEqual([1, 2, 3, 4, 5]);
  });
});

// ── getVersion ────────────────────────────────────────────────────────────────

describe("getVersion", () => {
  it("retrieves a specific version", () => {
    createVersion(makeRecord("dna-v", 1, 7.0), [], "r1", 5.0);
    createVersion(makeRecord("dna-v", 2, 8.0), [], "r2", 7.0);
    const v2 = getVersion("dna-v", 2);
    expect(v2?.version).toBe(2);
    expect(v2?.newScore).toBe(8.0);
  });

  it("returns undefined for missing version", () => {
    expect(getVersion("dna-v", 99)).toBeUndefined();
  });
});

// ── getLatestVersion ──────────────────────────────────────────────────────────

describe("getLatestVersion", () => {
  it("returns the most recent version", () => {
    createVersion(makeRecord("dna-l", 1, 6.0), [], "r1", 5.0);
    createVersion(makeRecord("dna-l", 2, 7.0), [], "r2", 6.0);
    createVersion(makeRecord("dna-l", 3, 8.0), [], "r3", 7.0);
    const latest = getLatestVersion("dna-l");
    expect(latest?.version).toBe(3);
  });

  it("returns undefined for unknown dnaId", () => {
    expect(getLatestVersion("nobody")).toBeUndefined();
  });
});

// ── getVersionCount ───────────────────────────────────────────────────────────

describe("getVersionCount", () => {
  it("returns 0 for unknown dnaId", () => {
    expect(getVersionCount("nobody")).toBe(0);
  });

  it("counts stored versions", () => {
    createVersion(makeRecord("dna-c", 1), [], "r", 5.0);
    createVersion(makeRecord("dna-c", 2), [], "r", 5.0);
    expect(getVersionCount("dna-c")).toBe(2);
  });
});

// ── getRollbackSnapshot ───────────────────────────────────────────────────────

describe("getRollbackSnapshot", () => {
  it("returns the snapshot for a given version", () => {
    const r = makeRecord("dna-rb", 1, 6.5);
    createVersion(r, [], "v1", 5.0);
    const snap = getRollbackSnapshot("dna-rb", 1);
    expect(snap?.rankingScore).toBe(6.5);
    expect(snap?.id).toBe("dna-rb");
  });

  it("returns null for unknown dnaId", () => {
    expect(getRollbackSnapshot("nobody", 1)).toBeNull();
  });

  it("returns null for unknown version", () => {
    createVersion(makeRecord("dna-rb2", 1), [], "v1", 5.0);
    expect(getRollbackSnapshot("dna-rb2", 99)).toBeNull();
  });

  it("returns a copy (mutation-safe)", () => {
    const r = makeRecord("dna-rb3", 1, 7.0);
    createVersion(r, [], "v1", 5.0);
    const snap = getRollbackSnapshot("dna-rb3", 1)!;
    snap.evaluatorScore = 99;
    expect(getRollbackSnapshot("dna-rb3", 1)?.evaluatorScore).toBe(5.0);
  });
});

// ── getVersioningMetrics ──────────────────────────────────────────────────────

describe("getVersioningMetrics", () => {
  it("returns zeros when empty", () => {
    const m = getVersioningMetrics();
    expect(m.trackedDnas).toBe(0);
    expect(m.totalVersions).toBe(0);
  });

  it("returns correct counts", () => {
    createVersion(makeRecord("dna-a", 1), [], "r", 5.0);
    createVersion(makeRecord("dna-a", 2), [], "r", 5.0);
    createVersion(makeRecord("dna-b", 1), [], "r", 5.0);
    const m = getVersioningMetrics();
    expect(m.trackedDnas).toBe(2);
    expect(m.totalVersions).toBe(3);
    expect(m.maxVersionsPerDna).toBe(2);
  });

  it("calculates avgVersionsPerDna", () => {
    createVersion(makeRecord("dna-avg-a", 1), [], "r", 5.0);
    createVersion(makeRecord("dna-avg-a", 2), [], "r", 5.0);
    createVersion(makeRecord("dna-avg-b", 1), [], "r", 5.0);
    const m = getVersioningMetrics();
    expect(m.avgVersionsPerDna).toBeCloseTo(1.5, 1);
  });
});

// ── Export / Import ───────────────────────────────────────────────────────────

describe("exportVersionHistory / importVersionHistory", () => {
  it("round-trips version history", () => {
    createVersion(makeRecord("dna-export", 1, 7.0), ["test"], "export test", 5.0);
    const exported = exportVersionHistory();
    resetVersionHistory();
    importVersionHistory(exported);
    const history = getVersionHistory("dna-export");
    expect(history.length).toBe(1);
    expect(history[0].newScore).toBe(7.0);
  });
});
