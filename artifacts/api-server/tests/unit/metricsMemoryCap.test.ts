import { describe, it, expect, beforeEach } from "vitest";
import { MemoryMetricsProvider } from "../../src/telemetry/metricsProvider.js";
import { MAX_DURATION_SAMPLES, MAX_REPAIR_SAMPLES, MAX_TOKEN_SAMPLES } from "../../src/telemetry/constants.js";

describe("Metrics Memory Cap — bounded storage", () => {
  let provider: MemoryMetricsProvider;

  beforeEach(() => {
    provider = new MemoryMetricsProvider();
  });

  it("histogram never exceeds MAX_DURATION_SAMPLES after 10,000 inserts", () => {
    for (let i = 0; i < 10_000; i++) {
      provider.recordDuration("test.histogram", i);
    }
    const snap = provider.snapshot();
    expect(snap.histograms["test.histogram"].values.length).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
    expect(snap.histograms["test.histogram"].count).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
  });

  it("oldest samples are evicted when cap is reached", () => {
    for (let i = 1; i <= MAX_DURATION_SAMPLES + 100; i++) {
      provider.recordDuration("eviction.test", i);
    }
    const snap = provider.snapshot();
    const values = snap.histograms["eviction.test"].values;
    expect(values.length).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
    const maxValue = Math.max(...values);
    expect(maxValue).toBe(MAX_DURATION_SAMPLES + 100);
  });

  it("p50/p95/p99 calculations work correctly after cap", () => {
    for (let i = 1; i <= 10_000; i++) {
      provider.recordDuration("percentile.test", i);
    }
    const snap = provider.snapshot();
    const h = snap.histograms["percentile.test"];
    expect(h.p50).toBeGreaterThan(0);
    expect(h.p95).toBeGreaterThanOrEqual(h.p50);
    expect(h.p99).toBeGreaterThanOrEqual(h.p95);
    expect(h.min).toBeGreaterThan(0);
    expect(h.max).toBeGreaterThan(h.min);
  });

  it("multiple histograms each capped independently", () => {
    for (let i = 0; i < 5_000; i++) {
      provider.recordDuration("hist.a", i);
      provider.recordDuration("hist.b", i * 2);
    }
    const snap = provider.snapshot();
    expect(snap.histograms["hist.a"].count).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
    expect(snap.histograms["hist.b"].count).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
  });

  it("constants are correctly defined", () => {
    expect(MAX_DURATION_SAMPLES).toBe(1000);
    expect(MAX_TOKEN_SAMPLES).toBe(1000);
    expect(MAX_REPAIR_SAMPLES).toBe(1000);
  });

  it("counters and gauges are not affected by sample cap", () => {
    for (let i = 0; i < 10_000; i++) {
      provider.increment("counter.test");
    }
    provider.setGauge("gauge.test", 42);
    const snap = provider.snapshot();
    expect(snap.counters["counter.test"]).toBe(10_000);
    expect(snap.gauges["gauge.test"]).toBe(42);
  });

  it("sum field reflects actual capped samples only", () => {
    for (let i = 1; i <= MAX_DURATION_SAMPLES + 10; i++) {
      provider.recordDuration("sum.test", 100);
    }
    const snap = provider.snapshot();
    const h = snap.histograms["sum.test"];
    expect(h.count).toBeLessThanOrEqual(MAX_DURATION_SAMPLES);
    expect(h.sum).toBe(h.count * 100);
  });
});
