/**
 * V8.1 — dnaTypes.ts unit tests
 * Tests: computeV81Quality (Phase 9 formula) and computeConfidence
 */

import { describe, it, expect } from "vitest";
import { computeV81Quality, computeConfidence } from "../../design-dna/dnaTypes.js";
import type { V81QualityInput } from "../../design-dna/dnaTypes.js";

const perfectInput: V81QualityInput = {
  evaluatorScore:    10,
  criticScore:       10,
  accessibilityScore: 10,
  performanceScore:  10,
  visualScore:       10,
  runtimeStability:  10,
  userFeedbackScore: 10,
  benchmarkScore:    10,
};

const zeroInput: V81QualityInput = {
  evaluatorScore:    0,
  criticScore:       0,
  accessibilityScore: 0,
  performanceScore:  0,
  visualScore:       0,
  runtimeStability:  0,
  userFeedbackScore: 0,
  benchmarkScore:    0,
};

const neutralInput: V81QualityInput = {
  evaluatorScore:    5,
  criticScore:       5,
  accessibilityScore: 5,
  performanceScore:  5,
  visualScore:       5,
  runtimeStability:  5,
  userFeedbackScore: 5,
  benchmarkScore:    5,
};

describe("computeV81Quality", () => {
  it("returns 10 for perfect scores", () => {
    expect(computeV81Quality(perfectInput)).toBe(10);
  });

  it("returns 0 for all-zero scores", () => {
    expect(computeV81Quality(zeroInput)).toBe(0);
  });

  it("returns 5 for all-neutral scores", () => {
    expect(computeV81Quality(neutralInput)).toBe(5);
  });

  it("weights evaluator at 35%", () => {
    const result = computeV81Quality({ ...zeroInput, evaluatorScore: 10 });
    expect(result).toBeCloseTo(3.5, 1);
  });

  it("weights critic at 20%", () => {
    const result = computeV81Quality({ ...zeroInput, criticScore: 10 });
    expect(result).toBeCloseTo(2.0, 1);
  });

  it("weights accessibility at 10%", () => {
    const result = computeV81Quality({ ...zeroInput, accessibilityScore: 10 });
    expect(result).toBeCloseTo(1.0, 1);
  });

  it("weights performance at 10%", () => {
    const result = computeV81Quality({ ...zeroInput, performanceScore: 10 });
    expect(result).toBeCloseTo(1.0, 1);
  });

  it("weights visual at 10%", () => {
    const result = computeV81Quality({ ...zeroInput, visualScore: 10 });
    expect(result).toBeCloseTo(1.0, 1);
  });

  it("weights runtimeStability at 5%", () => {
    const result = computeV81Quality({ ...zeroInput, runtimeStability: 10 });
    expect(result).toBeCloseTo(0.5, 1);
  });

  it("weights userFeedback at 5%", () => {
    const result = computeV81Quality({ ...zeroInput, userFeedbackScore: 10 });
    expect(result).toBeCloseTo(0.5, 1);
  });

  it("weights benchmark at 5%", () => {
    const result = computeV81Quality({ ...zeroInput, benchmarkScore: 10 });
    expect(result).toBeCloseTo(0.5, 1);
  });

  it("all weights sum to 100% (score 10 for all-10)", () => {
    // 35+20+10+10+10+5+5+5 = 100
    expect(computeV81Quality(perfectInput)).toBe(10);
  });

  it("clamps result above 10 to 10", () => {
    const over: V81QualityInput = { ...perfectInput, evaluatorScore: 15 };
    expect(computeV81Quality(over)).toBe(10);
  });

  it("clamps negative inputs to 0", () => {
    const under: V81QualityInput = { ...zeroInput, evaluatorScore: -5 };
    expect(computeV81Quality(under)).toBe(0);
  });

  it("rounds to 2 decimal places", () => {
    const result = computeV81Quality({ ...zeroInput, evaluatorScore: 7 });
    const str = result.toString();
    const decimals = str.includes(".") ? str.split(".")[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(2);
  });

  it("realistic build: 8.5 evaluator + 7.5 critic = expected composite", () => {
    const result = computeV81Quality({
      evaluatorScore:    8.5,
      criticScore:       7.5,
      accessibilityScore: 9.0,
      performanceScore:  8.0,
      visualScore:       8.0,
      runtimeStability:  8.0,
      userFeedbackScore: 7.0,
      benchmarkScore:    7.5,
    });
    // 8.5*0.35 + 7.5*0.20 + 9*0.10 + 8*0.10 + 8*0.10 + 8*0.05 + 7*0.05 + 7.5*0.05
    // = 2.975 + 1.5 + 0.9 + 0.8 + 0.8 + 0.4 + 0.35 + 0.375 = 8.1
    expect(result).toBeCloseTo(8.1, 1);
  });
});

describe("computeConfidence", () => {
  it("returns 0 when usageCount is 0", () => {
    expect(computeConfidence(0, 0)).toBe(0);
  });

  it("returns 0 when successCount is 0 and usageCount > 0", () => {
    expect(computeConfidence(10, 0)).toBe(0);
  });

  it("grows with more successful builds", () => {
    const c5  = computeConfidence(5, 5);
    const c20 = computeConfidence(20, 20);
    const c50 = computeConfidence(50, 50);
    expect(c20).toBeGreaterThan(c5);
    expect(c50).toBeGreaterThan(c20);
  });

  it("never exceeds 1", () => {
    expect(computeConfidence(1000, 1000)).toBeLessThanOrEqual(1);
  });

  it("is lower when success rate is partial", () => {
    const full = computeConfidence(10, 10);
    const half = computeConfidence(10, 5);
    expect(full).toBeGreaterThan(half);
  });

  it("rounds to 3 decimal places", () => {
    const c = computeConfidence(10, 8);
    const str = c.toString();
    const decimals = str.includes(".") ? str.split(".")[1].length : 0;
    expect(decimals).toBeLessThanOrEqual(3);
  });
});
