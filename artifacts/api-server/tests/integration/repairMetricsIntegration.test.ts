import { describe, it, expect, beforeEach } from "vitest";
import { globalMetrics } from "../../src/telemetry/metricsProvider.js";
import {
  recordRepairAttempt,
  recordRepairSuccess,
  recordRepairFailure,
  getRepairSnapshot,
  resetRepairMetrics,
} from "../../src/telemetry/repairMetrics.js";

describe("Repair Metrics Integration", () => {
  beforeEach(() => {
    resetRepairMetrics();
  });

  it("records a successful repair and reflects in snapshot", () => {
    recordRepairAttempt("build-001", "src/App.tsx");
    recordRepairSuccess("build-001", "src/App.tsx", 1);

    const snap = getRepairSnapshot();
    expect(snap.totalAttempts).toBeGreaterThanOrEqual(1);
    expect(snap.successfulRepairs).toBeGreaterThanOrEqual(1);
    expect(snap.failedRepairs).toBe(0);
    expect(snap.successRate).toMatch(/\d+\.\d+%/);
  });

  it("records a failed repair and reflects in snapshot", () => {
    recordRepairAttempt("build-002", "src/Dashboard.tsx");
    recordRepairFailure("build-002", "src/Dashboard.tsx");

    const snap = getRepairSnapshot();
    expect(snap.totalAttempts).toBeGreaterThanOrEqual(1);
    expect(snap.failedRepairs).toBeGreaterThanOrEqual(1);
  });

  it("increments counters in globalMetrics", () => {
    recordRepairAttempt("build-003", "src/Header.tsx");
    recordRepairSuccess("build-003", "src/Header.tsx", 2);

    const counters = globalMetrics.snapshot().counters;
    expect(counters["repairs.attempts"]).toBeGreaterThanOrEqual(1);
    expect(counters["repairs.successes"]).toBeGreaterThanOrEqual(1);
  });

  it("repairs.failures counter increments on failure", () => {
    recordRepairAttempt("build-004", "src/Footer.tsx");
    recordRepairFailure("build-004", "src/Footer.tsx");

    const counters = globalMetrics.snapshot().counters;
    expect(counters["repairs.failures"]).toBeGreaterThanOrEqual(1);
  });

  it("successRate is n/a when no repairs completed", () => {
    const snap = getRepairSnapshot();
    expect(snap.successRate).toBe("n/a");
  });

  it("tracks multiple files for the same build", () => {
    recordRepairAttempt("build-005", "src/A.tsx");
    recordRepairAttempt("build-005", "src/B.tsx");
    recordRepairSuccess("build-005", "src/A.tsx", 1);
    recordRepairFailure("build-005", "src/B.tsx");

    const snap = getRepairSnapshot();
    expect(snap.totalAttempts).toBeGreaterThanOrEqual(2);
    expect(snap.successfulRepairs).toBeGreaterThanOrEqual(1);
    expect(snap.failedRepairs).toBeGreaterThanOrEqual(1);
  });

  it("telemetry endpoint shape has all required repair fields", () => {
    recordRepairAttempt("build-006", "src/X.tsx");
    recordRepairSuccess("build-006", "src/X.tsx", 3);

    const full = globalMetrics.snapshot();
    expect(full).toHaveProperty("builds");
    expect(full).toHaveProperty("agents");
    expect(full).toHaveProperty("tokens");
    expect(full).toHaveProperty("repairs");
    expect(full).toHaveProperty("runtime");
    expect(full).toHaveProperty("counters");
    expect(full).toHaveProperty("gauges");
    expect(full).toHaveProperty("histograms");

    const repairs = full.repairs as Record<string, unknown>;
    expect(repairs).toHaveProperty("totalAttempts");
    expect(repairs).toHaveProperty("successfulRepairs");
    expect(repairs).toHaveProperty("failedRepairs");
    expect(repairs).toHaveProperty("successRate");
    expect(repairs).toHaveProperty("averageRepairPasses");
    expect(repairs).toHaveProperty("recentRepairs");
  });

  it("averageRepairPasses reflects actual pass counts", () => {
    recordRepairAttempt("build-007", "src/Y.tsx");
    recordRepairSuccess("build-007", "src/Y.tsx", 2);
    recordRepairAttempt("build-007", "src/Z.tsx");
    recordRepairSuccess("build-007", "src/Z.tsx", 4);

    const snap = getRepairSnapshot();
    expect(snap.averageRepairPasses).toBe(3);
  });
});
