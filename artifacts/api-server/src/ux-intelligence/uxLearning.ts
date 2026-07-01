/**
 * V8.2 — UX Learning Engine (Phase 11)
 *
 * Maintains learned offsets for each UX dimension based on actual build outcomes.
 * Offsets are applied at prediction time by uxPrediction.ts.
 *
 * Learning sources:
 *   - Build outcomes (primary)
 *   - Repair signals
 *   - User feedback (rating 1–5)
 *   - Benchmark results
 *   - Visual diff analysis
 */

import type { UXDimensions, UXBuildLearningInput, UXFeedbackInput, UXBenchmarkInput, UXVisualDiffInput } from "./uxTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("UxLearning");

// ── Offset store ──────────────────────────────────────────────────────────────
// Each dimension gets a small running offset (clamped ±2.0)
// that nudges future heuristic scores toward observed reality.

type DimOffsets = Partial<Record<keyof UXDimensions, number>>;

const _offsets: DimOffsets = {};
let _learningCycles = 0;
let _totalFeedbackScore = 0;
let _feedbackCount = 0;
let _trend: "improving" | "stable" | "degrading" = "stable";

// Running weighted average for each dimension
const _dimSums: Partial<Record<keyof UXDimensions, { sum: number; n: number }>> = {};

const MAX_OFFSET = 2.0;
const LEARNING_RATE = 0.05; // per cycle

function updateOffset(dim: keyof UXDimensions, delta: number): void {
  const current = _offsets[dim] ?? 0;
  _offsets[dim] = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, current + delta * LEARNING_RATE));
}

function recordDimOutcome(dim: keyof UXDimensions, observedScore: number): void {
  if (!_dimSums[dim]) _dimSums[dim] = { sum: 0, n: 0 };
  const entry = _dimSums[dim]!;
  entry.sum += observedScore;
  entry.n   += 1;
  // Bias: if observed avg is much higher than heuristic baseline (5.0),
  // nudge offset up; if lower, nudge down
  const avg = entry.sum / entry.n;
  updateOffset(dim, avg - 5.0);
}

// ── Learning from build outcomes (Phase 11) ───────────────────────────────────

export function learnFromBuildOutcome(input: UXBuildLearningInput): void {
  _learningCycles++;

  for (const [key, val] of Object.entries(input.dimensions)) {
    if (typeof val === "number") {
      recordDimOutcome(key as keyof UXDimensions, val);
    }
  }

  // Track trend based on success rate
  const prevTrend = _trend;
  if (input.success && input.uxScore >= 7.5)      _trend = "improving";
  else if (!input.success || input.uxScore < 5.0) _trend = "degrading";
  else                                              _trend = "stable";

  log.info("UX_LEARNED_FROM_BUILD", {
    buildId:   input.buildId,
    uxScore:   input.uxScore,
    prevTrend, trend: _trend,
  });
}

/** Learn from repair: if code was repaired, UX likely had issues */
export function learnFromRepair(buildId: string, repairLoops: number, qualityAfter: number): void {
  // More repair loops = harder code quality problems → lower density/hierarchy expected
  const penalty = Math.min(repairLoops * 0.5, 2.0);
  updateOffset("cognitiveLoad", -penalty * 0.2);
  updateOffset("hierarchy",     -penalty * 0.1);

  log.info("UX_LEARNED_FROM_REPAIR", { buildId, repairLoops, qualityAfter });
}

/** Learn from user feedback (explicit 1–5 rating) */
export function learnFromUserFeedback(input: UXFeedbackInput): void {
  const ratingScore = ((input.rating - 1) / 4) * 10; // normalize to 0–10
  _totalFeedbackScore += ratingScore;
  _feedbackCount++;

  // Rejected → poor CTA/trust probably
  if (input.action === "rejected") {
    updateOffset("ctaDiscoverability", -0.5);
    updateOffset("trust",             -0.3);
  } else if (input.action === "accepted") {
    updateOffset("ctaDiscoverability",  0.2);
    updateOffset("trust",               0.1);
  }

  // If edited sections, those areas had friction
  if (input.editedSections) {
    for (const section of input.editedSections) {
      if (/form|input/i.test(section))  updateOffset("formFriction",      -0.3);
      if (/nav|header/i.test(section))  updateOffset("navigationSimplicity", -0.2);
      if (/hero|headline/i.test(section)) updateOffset("hierarchy",        -0.2);
    }
  }

  log.info("UX_LEARNED_FROM_FEEDBACK", { buildId: input.buildId, rating: input.rating, action: input.action });
}

/** Learn from benchmark results */
export function learnFromBenchmark(input: UXBenchmarkInput): void {
  const direction = input.delta > 0 ? 1 : -1;
  // Benchmark category maps to dimensions
  const catMap: Record<string, (keyof UXDimensions)[]> = {
    conversion: ["ctaDiscoverability", "trust", "overallConversionProbability"],
    ux:         ["hierarchy", "cognitiveLoad", "whitespaceBalance"],
    form:       ["formFriction"],
    nav:        ["navigationSimplicity"],
    perf:       ["perceivedPerformance"],
  };
  const dims = catMap[input.category] ?? ["overallConversionProbability"];
  for (const dim of dims) {
    updateOffset(dim, direction * Math.abs(input.delta) * 0.1);
  }
  log.info("UX_LEARNED_FROM_BENCHMARK", { buildId: input.buildId, category: input.category, delta: input.delta });
}

/** Learn from visual diff: if layout regressed, visual dims need recalibration */
export function learnFromVisualDiff(input: UXVisualDiffInput): void {
  if (input.layoutRegression) {
    updateOffset("hierarchy",        -0.3);
    updateOffset("whitespaceBalance",-0.2);
  }
  if (input.spacingRegression) {
    updateOffset("whitespaceBalance", -0.3);
    updateOffset("informationDensity", -0.2);
  }
  // Adjust based on UX score change
  const delta = input.uxScoreAfter - input.uxScoreBefore;
  if (Math.abs(delta) > 1.0) {
    updateOffset("visualClarity", delta * 0.1);
  }
  log.info("UX_LEARNED_FROM_VISUAL_DIFF", { buildId: input.buildId, layout: input.layoutRegression, delta });
}

// ── Public reads ──────────────────────────────────────────────────────────────

export function getLearnedOffsets(): DimOffsets {
  return { ..._offsets };
}

export function getLearningTrend(): "improving" | "stable" | "degrading" {
  return _trend;
}

export function getLearningMetrics() {
  return {
    learningCycles:       _learningCycles,
    feedbackCount:        _feedbackCount,
    averageFeedbackScore: _feedbackCount > 0
      ? Math.round(_totalFeedbackScore / _feedbackCount * 100) / 100
      : null,
    trend:                _trend,
    offsetCount:          Object.keys(_offsets).length,
    offsets:              { ..._offsets },
  };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetLearning(): void {
  for (const k of Object.keys(_offsets)) delete (_offsets as Record<string, unknown>)[k];
  for (const k of Object.keys(_dimSums)) delete (_dimSums as Record<string, unknown>)[k];
  _learningCycles = 0;
  _totalFeedbackScore = 0;
  _feedbackCount = 0;
  _trend = "stable";
}
