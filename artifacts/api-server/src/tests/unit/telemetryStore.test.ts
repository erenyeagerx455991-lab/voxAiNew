import { describe, it, expect, beforeEach } from "vitest";
import { MemoryMetricsProvider } from "../../telemetry/metricsProvider.js";

describe("MemoryMetricsProvider", () => {
  let store: MemoryMetricsProvider;

  beforeEach(() => { store = new MemoryMetricsProvider(); });

  it("increment adds to counter", () => {
    store.increment("foo");
    store.increment("foo");
    expect(store.snapshot().counters["foo"]).toBe(2);
  });

  it("increment with by parameter", () => {
    store.increment("bar", 5);
    expect(store.snapshot().counters["bar"]).toBe(5);
  });

  it("setGauge stores value", () => {
    store.setGauge("cpu", 87.4);
    expect(store.snapshot().gauges["cpu"]).toBe(87.4);
  });

  it("recordDuration stores and computes histogram", () => {
    store.recordDuration("latency", 100);
    store.recordDuration("latency", 200);
    store.recordDuration("latency", 300);
    const h = store.snapshot().histograms["latency"];
    expect(h.count).toBe(3);
    expect(h.min).toBe(100);
    expect(h.max).toBe(300);
    expect(h.p50).toBeGreaterThanOrEqual(100);
    expect(h.p95).toBeGreaterThanOrEqual(200);
  });

  it("reset clears all state", () => {
    store.increment("x");
    store.setGauge("y", 1);
    store.recordDuration("z", 50);
    store.reset();
    const snap = store.snapshot();
    expect(Object.keys(snap.counters)).toHaveLength(0);
    expect(Object.keys(snap.gauges)).toHaveLength(0);
    expect(Object.keys(snap.histograms)).toHaveLength(0);
  });

  it("setSection merges data", () => {
    store.setSection("builds", { totalBuilds: 5 });
    store.setSection("builds", { successfulBuilds: 3 });
    const snap = store.snapshot();
    expect(snap.builds["totalBuilds"]).toBe(5);
    expect(snap.builds["successfulBuilds"]).toBe(3);
  });

  it("snapshot returns all sections", () => {
    const snap = store.snapshot();
    expect(snap).toHaveProperty("builds");
    expect(snap).toHaveProperty("agents");
    expect(snap).toHaveProperty("tokens");
    expect(snap).toHaveProperty("repairs");
    expect(snap).toHaveProperty("runtime");
    expect(snap).toHaveProperty("counters");
    expect(snap).toHaveProperty("gauges");
    expect(snap).toHaveProperty("histograms");
  });

  it("percentile p99 on single value", () => {
    store.recordDuration("single", 42);
    const h = store.snapshot().histograms["single"];
    expect(h.p99).toBe(42);
    expect(h.p50).toBe(42);
    expect(h.p95).toBe(42);
  });

  it("multiple keys do not bleed into each other", () => {
    store.increment("a", 3);
    store.increment("b", 7);
    const snap = store.snapshot();
    expect(snap.counters["a"]).toBe(3);
    expect(snap.counters["b"]).toBe(7);
  });
});
