import { describe, it, expect } from "vitest";
import { withAgentMetrics, getAgentSnapshot, recordAgentRetry } from "../../telemetry/agentMetrics.js";

describe("agentMetrics", () => {
  it("withAgentMetrics resolves the inner function", async () => {
    const result = await withAgentMetrics("Planner", async () => "done");
    expect(result).toBe("done");
  });

  it("tracks call count per agent", async () => {
    await withAgentMetrics("Architecture", async () => 42);
    await withAgentMetrics("Architecture", async () => 43);
    const snap = getAgentSnapshot() as Record<string, Record<string, unknown>>;
    expect(snap["Architecture"]).toBeDefined();
    expect((snap["Architecture"]["calls"] as number)).toBeGreaterThanOrEqual(2);
  });

  it("tracks failure on thrown error", async () => {
    await withAgentMetrics("Design", async () => { throw new Error("fail"); }).catch(() => {});
    const snap = getAgentSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["Design"]?.["failures"] as number)).toBeGreaterThanOrEqual(1);
  });

  it("re-throws the error from inner fn", async () => {
    await expect(
      withAgentMetrics("Frontend", async () => { throw new Error("test-error"); })
    ).rejects.toThrow("test-error");
  });

  it("getAgentSnapshot includes successRate", async () => {
    await withAgentMetrics("Scaffold", async () => {});
    const snap = getAgentSnapshot() as Record<string, Record<string, unknown>>;
    expect(typeof snap["Scaffold"]["successRate"]).toBe("string");
  });

  it("recordAgentRetry increments retry count", () => {
    recordAgentRetry("Repair");
    const snap = getAgentSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["Repair"]?.["retries"] as number ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it("withAgentMetrics records avgLatencyMs", async () => {
    await withAgentMetrics("RuntimeValidation", async () => { await new Promise(r => setTimeout(r, 5)); });
    const snap = getAgentSnapshot() as Record<string, Record<string, unknown>>;
    expect((snap["RuntimeValidation"]["avgLatencyMs"] as number)).toBeGreaterThanOrEqual(0);
  });
});
