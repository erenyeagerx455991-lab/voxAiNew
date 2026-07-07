// ── V8.2 UX Intelligence — Learning Loop ──────────────────────────────────────
// Records UX outcomes and feeds improvements into Design DNA.
// Every successful build, repair, visual diff, and benchmark update learning.

import type { UXLearningInput, UXLearningRecord, UXMetrics } from './uxTypes.js';
import { learnFromBuild } from '../design-dna/designDNA.js';
import { createLogger } from '../lib/structuredLogger.js';
import { saveUXSnapshot } from './uxPersistence.js';

const log = createLogger('UXLearning');

// ── In-memory learning history (last 500 records) ─────────────────────────────
const _learningHistory: UXLearningRecord[] = [];
const MAX_HISTORY = 500;

// ── Debounced persistence save ─────────────────────────────────────────────────
// Saves at most once per 30 seconds to avoid hammering disk on burst builds.
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
function _scheduleSave(): void {
  if (_saveTimer) return;
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    saveUXSnapshot([..._learningHistory]).catch(() => { /* already logged inside saveUXSnapshot */ });
  }, 30_000);
}

// ── Neutral UX metrics (all dimensions at midpoint 5) ─────────────────────────
const NEUTRAL_UX_METRICS: UXMetrics = {
  visualClarity:          5,
  cognitiveLoad:          5,
  ctaDiscoverability:     5,
  readingFlow:            5,
  trust:                  5,
  scanningEfficiency:     5,
  navigationSimplicity:   5,
  formFriction:           5,
  pricingClarity:         5,
  dashboardUsability:     5,
  informationDensity:     5,
  whitespaceBalance:      5,
  hierarchy:              5,
  accessibilityConfidence:5,
  motionComfort:          5,
  perceivedPerformance:   5,
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * learnFromUX — Phase 5: Integrate with Design DNA.
 * Every build updates DNA; good UX increases DNA quality, bad UX demotes patterns.
 * Also called after visual diff, repairs, benchmarks, and user feedback.
 */
export function learnFromUX(input: UXLearningInput): void {
  const { buildId, uxReport, evaluatorScore, repairTriggered, sectionOrder, dnaId } = input;

  // Store in local history
  const record: UXLearningRecord = {
    buildId,
    overallUXScore: uxReport.overallUXScore,
    conversionPrediction: uxReport.conversionPrediction,
    metrics: { ...uxReport.metrics },
    evaluatorScore,
    repairTriggered,
    sectionOrder,
    recordedAt: Date.now(),
  };
  _learningHistory.push(record);
  if (_learningHistory.length > MAX_HISTORY) _learningHistory.shift();

  // Best-effort debounced persistence save — never blocks the caller
  _scheduleSave();

  // Map conversion prediction to a 0–10 numeric score for DNA
  const conversionNumeric = conversionPredictionToScore(uxReport.conversionPrediction);

  // Feed into Design DNA learning
  const effectiveDnaId = dnaId ?? 'ux-default';
  try {
    learnFromBuild({
      dnaId: effectiveDnaId,
      evaluatorScore,
      criticScore: 5,                            // neutral — not from critic here
      accessibilityScore: uxReport.metrics.accessibilityConfidence,
      optimizationScore: uxReport.metrics.perceivedPerformance,
      visualScore: uxReport.metrics.visualClarity,
      repairTriggered,
      repairLoops: repairTriggered ? 1 : 0,
      conversionScore: conversionNumeric,
      success: uxReport.overallUXScore >= 6.0,
    });
    log.info('UX_LEARNING_DNA_UPDATED', {
      buildId,
      uxScore: uxReport.overallUXScore,
      conversionPrediction: uxReport.conversionPrediction,
      dnaId: effectiveDnaId,
    });
  } catch (err) {
    // DNA learning must never throw into the pipeline
    log.warn('UX_LEARNING_DNA_FAILED', { error: String(err) });
  }
}

/**
 * learnFromRepair — called when a repair pass improves UX.
 */
export function learnFromRepairUX(input: UXLearningInput & { improvedScore: number }): void {
  // Weight repair outcomes more heavily in learning
  learnFromUX({
    ...input,
    uxReport: {
      ...input.uxReport,
      overallUXScore: input.improvedScore,
    },
  });
}

/**
 * learnFromVisualDiff — called after visual diff analysis updates UX knowledge.
 */
export function learnFromVisualDiff(buildId: string, visualScore: number, uxScore: number, dnaId?: string): void {
  const syntheticInput: UXLearningInput = {
    buildId,
    uxReport: {
      metrics: { ...NEUTRAL_UX_METRICS }, // all dimensions at neutral midpoint; no code to analyze
      overallUXScore: uxScore,
      conversionPrediction: uxScore >= 7 ? 'High' : uxScore >= 5 ? 'Medium' : 'Low',
      confidence: 0.4,
      behaviorPredictions: { bounceRisk: 5, engagement: 5, scrollDepth: 5, ctaInteraction: 5, formCompletion: 5, trustLevel: 5 },
      topIssues: [],
      strengths: [],
    },
    evaluatorScore: visualScore,
    repairTriggered: false,
    sectionOrder: [],
    dnaId,
  };
  learnFromUX(syntheticInput);
}

/**
 * learnFromBenchmark — called after benchmark results update UX baselines.
 */
export function learnFromBenchmark(buildId: string, benchmarkScore: number, dnaId?: string): void {
  log.info('UX_BENCHMARK_LEARNING', { buildId, benchmarkScore, dnaId });
  // Benchmark learning updates the moving average through existing DNA system
  try {
    learnFromBuild({
      dnaId: dnaId ?? 'benchmark',
      evaluatorScore: benchmarkScore,
      criticScore: 5,
      accessibilityScore: 5,
      optimizationScore: 5,
      visualScore: benchmarkScore,
      repairTriggered: false,
      repairLoops: 0,
      conversionScore: benchmarkScore,
      success: benchmarkScore >= 7.0,
    });
  } catch { /* never throw */ }
}

// ── Accessors ─────────────────────────────────────────────────────────────────

export function getUXLearningHistory(): UXLearningRecord[] {
  return [..._learningHistory];
}

export function getUXLearningTrend(): 'rising' | 'stable' | 'falling' {
  const recent = _learningHistory.slice(-10);
  const older  = _learningHistory.slice(-20, -10);
  if (recent.length < 3 || older.length < 3) return 'stable';
  const avgRecent = recent.reduce((s, r) => s + r.overallUXScore, 0) / recent.length;
  const avgOlder  = older.reduce((s, r) => s + r.overallUXScore, 0) / older.length;
  const delta = avgRecent - avgOlder;
  if (delta > 0.3) return 'rising';
  if (delta < -0.3) return 'falling';
  return 'stable';
}

export function resetUXLearning(): void {
  _learningHistory.length = 0;
  // Clear any pending debounce timer so isolated tests start with a clean slate.
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
}

/**
 * hydrateUXLearning — called at startup to restore persisted history.
 * Replaces the in-memory store with records loaded from disk.
 */
export function hydrateUXLearning(records: UXLearningRecord[]): void {
  _learningHistory.length = 0;
  const hydrated = records.slice(-MAX_HISTORY);
  _learningHistory.push(...hydrated);
  log.info('UX_LEARNING_HYDRATED', { count: hydrated.length });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function conversionPredictionToScore(prediction: string): number {
  switch (prediction) {
    case 'Very High': return 9.5;
    case 'High':      return 7.5;
    case 'Medium':    return 5.5;
    case 'Low':       return 3.5;
    case 'Very Low':  return 1.5;
    default:          return 5.0;
  }
}
