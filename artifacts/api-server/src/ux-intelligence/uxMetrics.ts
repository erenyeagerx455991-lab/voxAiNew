/**
 * V8.2 — UX Telemetry Metrics Store (Phase 9)
 *
 * Tracks rolling averages, distribution, and trend for all UX dimensions.
 * Feeds the /api/telemetry/quality → uxQuality endpoint.
 */

import type { UXDimensions, UXPredictionResult, UXQualitySnapshot, ConversionLevel } from "./uxTypes.js";

// ── Running accumulator ───────────────────────────────────────────────────────

interface RunningAvg { sum: number; n: number }

const _dims: Partial<Record<keyof UXDimensions, RunningAvg>> = {};
const _overallScores:   number[] = [];
const _conversionLevels: Record<ConversionLevel, number> = {
  very_low: 0, low: 0, medium: 0, high: 0, very_high: 0,
};

let _totalPredictions = 0;
let _lastPredictionAt: string | null = null;

const MAX_RECENT = 100; // capped for memory safety

// ── Record a prediction result ────────────────────────────────────────────────

export function recordUXPrediction(result: UXPredictionResult): void {
  _totalPredictions++;
  _lastPredictionAt = result.analyzedAt;

  // Overall score — capped ring buffer
  if (_overallScores.length >= MAX_RECENT) _overallScores.shift();
  _overallScores.push(result.overallUXScore);

  // Dimension averages
  for (const [key, val] of Object.entries(result.dimensions) as [keyof UXDimensions, number][]) {
    if (!_dims[key]) _dims[key] = { sum: 0, n: 0 };
    _dims[key]!.sum += val;
    _dims[key]!.n   += 1;
  }

  // Conversion level distribution
  _conversionLevels[result.conversionPrediction.level]++;
}

// ── Read metrics ──────────────────────────────────────────────────────────────

function dimAvg(key: keyof UXDimensions): number {
  const r = _dims[key];
  if (!r || r.n === 0) return 0;
  return Math.round(r.sum / r.n * 100) / 100;
}

function overallAvg(): number {
  if (_overallScores.length === 0) return 0;
  return Math.round(
    _overallScores.reduce((s, v) => s + v, 0) / _overallScores.length * 100,
  ) / 100;
}

function conversionAvg(): number {
  const levelValues: Record<ConversionLevel, number> = {
    very_low: 1, low: 3, medium: 5, high: 7, very_high: 9,
  };
  const total = Object.values(_conversionLevels).reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  const weighted = (Object.entries(_conversionLevels) as [ConversionLevel, number][])
    .reduce((s, [level, count]) => s + levelValues[level] * count, 0);
  return Math.round(weighted / total * 100) / 100;
}

function learningTrend(): "improving" | "stable" | "degrading" {
  if (_overallScores.length < 10) return "stable";
  const half     = Math.floor(_overallScores.length / 2);
  const firstAvg = _overallScores.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const lastAvg  = _overallScores.slice(half).reduce((s, v) => s + v, 0) / (_overallScores.length - half);
  if (lastAvg > firstAvg + 0.3)  return "improving";
  if (lastAvg < firstAvg - 0.3)  return "degrading";
  return "stable";
}

function predictionConfidence(): number {
  return Math.round(Math.min(0.95, 1 - Math.exp(-_totalPredictions / 50)) * 1000) / 1000;
}

export function getUXQualitySnapshot(): UXQualitySnapshot {
  return {
    averageUXScore:           overallAvg(),
    averageConversionPrediction: conversionAvg(),
    averageTrustScore:        dimAvg("trust"),
    averageCTA:               dimAvg("ctaDiscoverability"),
    averageForms:             dimAvg("formFriction"),
    averageNavigation:        dimAvg("navigationSimplicity"),
    averageDensity:           dimAvg("informationDensity"),
    averageHierarchy:         dimAvg("hierarchy"),
    topPerformingPatterns:    [],  // populated by uxFacade via uxRanking
    lowestPatterns:           [],
    learningTrend:            learningTrend(),
    predictionConfidence:     predictionConfidence(),
    totalPredictions:         _totalPredictions,
    lastPredictionAt:         _lastPredictionAt,
  };
}

export function getUXDimAverages(): Partial<Record<keyof UXDimensions, number>> {
  const result: Partial<Record<keyof UXDimensions, number>> = {};
  for (const key of Object.keys(_dims) as (keyof UXDimensions)[]) {
    result[key] = dimAvg(key);
  }
  return result;
}

export function getTotalPredictions(): number {
  return _totalPredictions;
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetUXMetrics(): void {
  for (const k of Object.keys(_dims)) delete (_dims as Record<string, unknown>)[k];
  _overallScores.length = 0;
  for (const k of Object.keys(_conversionLevels)) {
    (_conversionLevels as Record<string, number>)[k] = 0;
  }
  _totalPredictions = 0;
  _lastPredictionAt = null;
}
