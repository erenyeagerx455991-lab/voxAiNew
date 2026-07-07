// ── V8.2 UX Intelligence — Telemetry Metrics ──────────────────────────────────
// Tracks UX prediction quality per build for GET /api/telemetry/quality → uxQuality.
// Follows the standard VoxAI metrics module pattern:
//   recordUXRun() / getUXQualityMetrics() / resetUXMetrics()

import type { UXReport } from './uxTypes.js';
import { getUXLearningHistory, getUXLearningTrend } from './uxLearning.js';

// ── Record Type ───────────────────────────────────────────────────────────────

export interface UXRunRecord {
  buildId:              string;
  overallUXScore:       number;
  conversionPrediction: string;
  confidence:           number;
  trustScore:           number;
  ctaScore:             number;
  formScore:            number;
  navigationScore:      number;
  densityScore:         number;
  hierarchyScore:       number;
  repairTriggered:      boolean;
  recordedAt:           number;
}

// ── State ─────────────────────────────────────────────────────────────────────

const _history: UXRunRecord[] = [];
const MAX_HISTORY = 100;

// ── Record API ────────────────────────────────────────────────────────────────

export interface RecordUXRunInput {
  buildId:         string;
  uxReport:        UXReport;
  repairTriggered: boolean;
}

export function recordUXRun(input: RecordUXRunInput): void {
  const { buildId, uxReport, repairTriggered } = input;
  _history.push({
    buildId,
    overallUXScore:       uxReport.overallUXScore,
    conversionPrediction: uxReport.conversionPrediction,
    confidence:           uxReport.confidence,
    trustScore:           uxReport.metrics.trust,
    ctaScore:             uxReport.metrics.ctaDiscoverability,
    formScore:            uxReport.metrics.formFriction,
    navigationScore:      uxReport.metrics.navigationSimplicity,
    densityScore:         uxReport.metrics.informationDensity,
    hierarchyScore:       uxReport.metrics.hierarchy,
    repairTriggered,
    recordedAt:           Date.now(),
  });
  if (_history.length > MAX_HISTORY) _history.shift();
}

// ── Get API ───────────────────────────────────────────────────────────────────

export function getUXQualityMetrics() {
  const recent = _history.slice(-20);
  const total  = recent.length;

  if (total === 0) {
    return {
      runsTracked:                0,
      averageUXScore:             0,
      averageConversionPrediction: 'N/A',
      averageTrustScore:          0,
      averageCTA:                 0,
      averageForms:               0,
      averageNavigation:          0,
      averageDensity:             0,
      averageHierarchy:           0,
      topPerformingPatterns:      [] as string[],
      lowestPatterns:             [] as string[],
      learningTrend:              'stable',
      predictionConfidence:       0,
      recentScores:               [] as object[],
    };
  }

  const avg = (key: keyof UXRunRecord) =>
    Math.round(recent.reduce((s, r) => s + (r[key] as number), 0) / total * 10) / 10;

  // Conversion prediction distribution
  const predCounts: Record<string, number> = {};
  for (const r of recent) {
    predCounts[r.conversionPrediction] = (predCounts[r.conversionPrediction] ?? 0) + 1;
  }
  const topPrediction = Object.entries(predCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'Medium';

  // Top/worst patterns from learning history
  const learningHistory = getUXLearningHistory();
  const patternScores: Record<string, number[]> = {};
  for (const r of learningHistory) {
    const key = r.conversionPrediction;
    if (!patternScores[key]) patternScores[key] = [];
    patternScores[key].push(r.overallUXScore);
  }
  const patternAvgs = Object.entries(patternScores).map(([k, vs]) => ({
    pattern: k,
    avg: vs.reduce((s, v) => s + v, 0) / vs.length,
  })).sort((a, b) => b.avg - a.avg);

  const avgConfidence = Math.round(recent.reduce((s, r) => s + r.confidence, 0) / total * 100) / 100;
  const repairCount   = recent.filter(r => r.repairTriggered).length;

  return {
    runsTracked:                total,
    averageUXScore:             avg('overallUXScore'),
    averageConversionPrediction: topPrediction,
    averageTrustScore:          avg('trustScore'),
    averageCTA:                 avg('ctaScore'),
    averageForms:               avg('formScore'),
    averageNavigation:          avg('navigationScore'),
    averageDensity:             avg('densityScore'),
    averageHierarchy:           avg('hierarchyScore'),
    topPerformingPatterns:      patternAvgs.slice(0, 3).map(p => p.pattern),
    lowestPatterns:             patternAvgs.slice(-3).map(p => p.pattern),
    learningTrend:              getUXLearningTrend(),
    predictionConfidence:       avgConfidence,
    repairRate:                 `${Math.round(repairCount / total * 100)}%`,
    recentScores: recent.slice(-5).map(r => ({
      overallUXScore:       r.overallUXScore,
      conversionPrediction: r.conversionPrediction,
      trustScore:           r.trustScore,
      ctaScore:             r.ctaScore,
      repairTriggered:      r.repairTriggered,
    })),
  };
}

export function resetUXMetrics(): void {
  _history.length = 0;
}
