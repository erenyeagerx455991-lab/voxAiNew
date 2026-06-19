import { describe, it, expect } from "vitest";
import {
  recordRuntimeCheck, recordViteBuildDuration, recordRepairLoopDuration,
  recordValidationDuration, getRuntimeSnapshot,
} from "../../telemetry/runtimeMetrics.js";

describe("runtimeMetrics", () => {
  it("recordRuntimeCheck(true) increments passes", () => {
    const before = (getRuntimeSnapshot() as Record<string, number>)["runtimePasses"] ?? 0;
    recordRuntimeCheck(true);
    expect((getRuntimeSnapshot() as Record<string, number>)["runtimePasses"]).toBe(before + 1);
  });

  it("recordRuntimeCheck(false) increments failures", () => {
    const before = (getRuntimeSnapshot() as Record<string, number>)["runtimeFailures"] ?? 0;
    recordRuntimeCheck(false);
    expect((getRuntimeSnapshot() as Record<string, number>)["runtimeFailures"]).toBe(before + 1);
  });

  it("getRuntimeSnapshot returns runtimePassRate string", () => {
    recordRuntimeCheck(true);
    const snap = getRuntimeSnapshot() as Record<string, unknown>;
    expect(typeof snap["runtimePassRate"]).toBe("string");
    expect(snap["runtimePassRate"] as string).toContain("%");
  });

  it("recordViteBuildDuration updates viteBuild avg", () => {
    recordViteBuildDuration(1000);
    recordViteBuildDuration(2000);
    const snap = getRuntimeSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["viteBuild"]["count"] as number)).toBeGreaterThanOrEqual(2);
    expect((snap["viteBuild"]["avgMs"] as number)).toBeGreaterThan(0);
  });

  it("recordRepairLoopDuration updates repairLoop", () => {
    recordRepairLoopDuration(500);
    const snap = getRuntimeSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["repairLoop"]["count"] as number)).toBeGreaterThanOrEqual(1);
  });

  it("recordValidationDuration updates validation", () => {
    recordValidationDuration(300);
    const snap = getRuntimeSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["validation"]["count"] as number)).toBeGreaterThanOrEqual(1);
  });
});
