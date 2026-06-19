import { describe, it, expect } from "vitest";
import { MemoryMetricsProvider } from "../../telemetry/metricsProvider.js";
import { createTraceContext } from "../../telemetry/traceContext.js";

describe("buildMetrics (shape & contract)", () => {
  it("MemoryMetricsProvider builds section correctly", () => {
    const store = new MemoryMetricsProvider();
    store.setSection("builds", { totalBuilds: 3, successfulBuilds: 2, failedBuilds: 1 });
    const snap = store.snapshot();
    expect(snap.builds["totalBuilds"]).toBe(3);
    expect(snap.builds["successfulBuilds"]).toBe(2);
    expect(snap.builds["failedBuilds"]).toBe(1);
  });

  it("createTraceContext generates valid trace IDs", () => {
    const ctx = createTraceContext();
    expect(typeof ctx.traceId).toBe("string");
    expect(ctx.traceId.length).toBeGreaterThan(10);
    expect(typeof ctx.requestId).toBe("string");
    expect(ctx.spanId).not.toBe(ctx.traceId);
  });

  it("createTraceContext accepts buildId override", () => {
    const ctx = createTraceContext({ buildId: "build-xyz" });
    expect(ctx.buildId).toBe("build-xyz");
  });

  it("buildMetrics exports recordBuildStart", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    expect(typeof mod.recordBuildStart).toBe("function");
  });

  it("buildMetrics exports recordBuildSuccess", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    expect(typeof mod.recordBuildSuccess).toBe("function");
  });

  it("buildMetrics exports recordBuildFailure", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    expect(typeof mod.recordBuildFailure).toBe("function");
  });

  it("getBuildSnapshot returns required shape", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    const snap = mod.getBuildSnapshot() as Record<string, unknown>;
    expect(snap).toHaveProperty("totalBuilds");
    expect(snap).toHaveProperty("successfulBuilds");
    expect(snap).toHaveProperty("failedBuilds");
    expect(snap).toHaveProperty("successRate");
    expect(snap).toHaveProperty("avgBuildTimeMs");
    expect(snap).toHaveProperty("p95BuildTimeMs");
    expect(snap).toHaveProperty("recentBuilds");
  });

  it("recordBuildStart + Success increases successfulBuilds", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    const before = (mod.getBuildSnapshot() as Record<string, number>)["successfulBuilds"] ?? 0;
    const id = `bm-test-${Date.now()}`;
    mod.recordBuildStart(id, createTraceContext({ buildId: id }));
    mod.recordBuildSuccess(id);
    const after = (mod.getBuildSnapshot() as Record<string, number>)["successfulBuilds"];
    expect(after).toBe(before + 1);
  });

  it("recordBuildFailure increases failedBuilds", async () => {
    const mod = await import("../../telemetry/buildMetrics.js");
    const before = (mod.getBuildSnapshot() as Record<string, number>)["failedBuilds"] ?? 0;
    const id = `bm-fail-${Date.now()}`;
    mod.recordBuildStart(id, createTraceContext({ buildId: id }));
    mod.recordBuildFailure(id, "test-error");
    const after = (mod.getBuildSnapshot() as Record<string, number>)["failedBuilds"];
    expect(after).toBe(before + 1);
  });
});
