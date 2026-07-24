// ── V10.1 — Meta Learning ──────────────────────────────────────────────────────
// Fire-and-forget async learning. 500-record rolling history. Never blocks pipeline.
import type { MetaLearningRecord, MetaLearningStats } from './metaTypes.js';

const MAX_RECORDS = 500;
const _records: MetaLearningRecord[] = [];

export async function learnFromMeta(record: MetaLearningRecord): Promise<void> {
  try {
    _records.push(record);
    if (_records.length > MAX_RECORDS) _records.splice(0, _records.length - MAX_RECORDS);
  } catch { /* never throws into pipeline */ }
}

export function getMetaLearningStats(): MetaLearningStats {
  if (_records.length === 0) {
    return {
      totalRecords:       0,
      averageMetaScore:   0,
      buildSuccessRate:   0,
      averageBuildTimeMs: 0,
      predictionAccuracy: 0,
      byComplexity:       {},
      byHealthStatus:     {},
    };
  }

  const n = _records.length;
  const avg = (fn: (r: MetaLearningRecord) => number) =>
    Math.round(_records.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const successCount = _records.filter(r => r.buildSucceeded).length;

  // Prediction accuracy: how close predicted quality was to actual
  const accuracyVals = _records
    .filter(r => r.predictedQuality > 0)
    .map(r => 1 - Math.min(1, Math.abs(r.actualQuality - r.predictedQuality) / 10));
  const predictionAccuracy = accuracyVals.length > 0
    ? Math.round(accuracyVals.reduce((a, b) => a + b, 0) / accuracyVals.length * 100) / 100
    : 0;

  const byComplexity: Record<string, { count: number; avgScore: number }> = {};
  for (const c of ['simple', 'standard', 'enterprise']) {
    const recs = _records.filter(r => r.complexity === c);
    if (recs.length > 0) {
      byComplexity[c] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((s, r) => s + r.overallMetaScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  const byHealthStatus: Record<string, { count: number; avgScore: number }> = {};
  for (const status of ['critical', 'degraded', 'healthy', 'optimal']) {
    const recs = _records.filter(r => r.healthStatus === status);
    if (recs.length > 0) {
      byHealthStatus[status] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((s, r) => s + r.overallMetaScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  return {
    totalRecords:       n,
    averageMetaScore:   avg(r => r.overallMetaScore),
    buildSuccessRate:   Math.round(successCount / n * 100) / 100,
    averageBuildTimeMs: avg(r => r.buildTimeMs),
    predictionAccuracy,
    byComplexity,
    byHealthStatus,
  };
}

export function hydrateMetaLearning(records: MetaLearningRecord[]): void {
  _records.length = 0;
  for (const r of records.slice(-MAX_RECORDS)) _records.push(r);
}

export function resetMetaLearning(): void {
  _records.length = 0;
}
