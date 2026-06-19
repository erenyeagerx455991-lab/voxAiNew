import { describe, it, expect } from "vitest";
import { recordRepairAttempt, recordRepairSuccess, recordRepairFailure, getRepairSnapshot } from "../../telemetry/repairMetrics.js";

describe("repairMetrics", () => {
  const BUILD = "repair-test-build";
  const FILE  = "src/App.tsx";

  it("recordRepairAttempt increments attempts", () => {
    const before = (getRepairSnapshot() as Record<string, number>)["totalAttempts"] ?? 0;
    recordRepairAttempt(BUILD, FILE);
    const snap = getRepairSnapshot() as Record<string, number>;
    expect(snap["totalAttempts"]).toBe(before + 1);
  });

  it("recordRepairSuccess increments successfulRepairs", () => {
    const before = (getRepairSnapshot() as Record<string, number>)["successfulRepairs"] ?? 0;
    recordRepairSuccess(BUILD, FILE, 2);
    const snap = getRepairSnapshot() as Record<string, number>;
    expect(snap["successfulRepairs"]).toBe(before + 1);
  });

  it("recordRepairFailure increments failedRepairs", () => {
    recordRepairAttempt(BUILD, "src/Other.tsx");
    const before = (getRepairSnapshot() as Record<string, number>)["failedRepairs"] ?? 0;
    recordRepairFailure(BUILD, "src/Other.tsx");
    const snap = getRepairSnapshot() as Record<string, number>;
    expect(snap["failedRepairs"]).toBe(before + 1);
  });

  it("getRepairSnapshot returns successRate string", () => {
    const snap = getRepairSnapshot() as Record<string, unknown>;
    expect(typeof snap["successRate"]).toBe("string");
  });

  it("getRepairSnapshot returns averageRepairPasses", () => {
    const snap = getRepairSnapshot() as Record<string, unknown>;
    expect(typeof snap["averageRepairPasses"]).toBe("number");
  });

  it("getRepairSnapshot has recentRepairs array", () => {
    const snap = getRepairSnapshot() as Record<string, unknown>;
    expect(Array.isArray(snap["recentRepairs"])).toBe(true);
  });
});
