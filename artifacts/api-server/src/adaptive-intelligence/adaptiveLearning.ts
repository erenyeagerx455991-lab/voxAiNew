// ── V9.9 Adaptive Intelligence — Phase 10: Learning ───────────────────────────
// Fire-and-forget only. Never blocks the pipeline.
import type { AdaptiveLearningRecord, AdaptiveLearningStats, AdaptiveStrategy } from './adaptiveTypes.js';

const MAX_RECORDS = 500;
const _records: AdaptiveLearningRecord[] = [];

export async function learnFromAdaptive(record: AdaptiveLearningRecord): Promise<void> {
  // Fire-and-forget — absorb and never throw
  try {
    _records.push(record);
    if (_records.length > MAX_RECORDS) _records.splice(0, _records.length - MAX_RECORDS);
  } catch { /* never throws into pipeline */ }
}

export function getAdaptiveLearningStats(): AdaptiveLearningStats {
  if (_records.length === 0) {
    return {
      totalRecords: 0,
      averageAdaptiveScore: 0,
      buildSuccessRate: 0,
      averageBuildTimeMs: 0,
      timeAccuracy: 0,
      costAccuracy: 0,
      byStrategy: {},
      byComplexity: {},
    };
  }

  const n = _records.length;
  const avg = (fn: (r: AdaptiveLearningRecord) => number) =>
    Math.round(_records.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const successCount = _records.filter(r => r.buildSucceeded).length;

  // Time accuracy: how close estimated was to actual
  const timeAccuracyVals = _records
    .filter(r => r.estimatedBuildTimeMs > 0)
    .map(r => 1 - Math.min(1, Math.abs(r.buildTimeMs - r.estimatedBuildTimeMs) / r.estimatedBuildTimeMs));
  const timeAccuracy = timeAccuracyVals.length > 0
    ? Math.round(timeAccuracyVals.reduce((a, b) => a + b, 0) / timeAccuracyVals.length * 100) / 100
    : 0;

  // Cost accuracy
  const costAccuracyVals = _records
    .filter(r => r.costEstimated > 0)
    .map(r => 1 - Math.min(1, Math.abs(r.costActual - r.costEstimated) / r.costEstimated));
  const costAccuracy = costAccuracyVals.length > 0
    ? Math.round(costAccuracyVals.reduce((a, b) => a + b, 0) / costAccuracyVals.length * 100) / 100
    : 0;

  // By strategy
  const byStrategy: Record<string, { count: number; avgScore: number }> = {};
  const strategies: AdaptiveStrategy[] = ['speed', 'cost', 'quality', 'balanced', 'enterprise'];
  for (const s of strategies) {
    const recs = _records.filter(r => r.strategy === s);
    if (recs.length > 0) {
      byStrategy[s] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((sum, r) => sum + r.adaptiveScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  // By complexity
  const byComplexity: Record<string, { count: number; avgScore: number }> = {};
  for (const c of ['simple', 'standard', 'enterprise']) {
    const recs = _records.filter(r => r.complexity === c);
    if (recs.length > 0) {
      byComplexity[c] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((sum, r) => sum + r.adaptiveScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  return {
    totalRecords: n,
    averageAdaptiveScore: avg(r => r.adaptiveScore),
    buildSuccessRate: Math.round(successCount / n * 100) / 100,
    averageBuildTimeMs: avg(r => r.buildTimeMs),
    timeAccuracy,
    costAccuracy,
    byStrategy,
    byComplexity,
  };
}

export function hydrateAdaptiveLearning(records: AdaptiveLearningRecord[]): void {
  _records.length = 0;
  for (const r of records.slice(-MAX_RECORDS)) _records.push(r);
}

export function resetAdaptiveLearning(): void {
  _records.length = 0;
}
