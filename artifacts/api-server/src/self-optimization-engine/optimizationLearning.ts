// ── V10.0 — Optimization Learning ─────────────────────────────────────────────
// Fire-and-forget only. Never blocks the pipeline.
import type { OptimizationLearningRecord, OptimizationLearningStats } from './optimizationTypes.js';

const MAX_RECORDS = 500;
const _records: OptimizationLearningRecord[] = [];

export async function learnFromOptimization(record: OptimizationLearningRecord): Promise<void> {
  try {
    _records.push(record);
    if (_records.length > MAX_RECORDS) _records.splice(0, _records.length - MAX_RECORDS);
  } catch { /* never throws into pipeline */ }
}

export function getOptimizationLearningStats(): OptimizationLearningStats {
  if (_records.length === 0) {
    return {
      totalRecords: 0,
      averageOptimizationScore: 0,
      buildSuccessRate: 0,
      averageBuildTimeMs: 0,
      timeAccuracy: 0,
      costAccuracy: 0,
      byComplexity: {},
      byModelTier: {},
    };
  }

  const n = _records.length;
  const avg = (fn: (r: OptimizationLearningRecord) => number) =>
    Math.round(_records.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const successCount = _records.filter(r => r.buildSucceeded).length;

  const timeAccuracyVals = _records
    .filter(r => r.estimatedBuildTimeMs > 0)
    .map(r => 1 - Math.min(1, Math.abs(r.buildTimeMs - r.estimatedBuildTimeMs) / r.estimatedBuildTimeMs));
  const timeAccuracy = timeAccuracyVals.length > 0
    ? Math.round(timeAccuracyVals.reduce((a, b) => a + b, 0) / timeAccuracyVals.length * 100) / 100
    : 0;

  const costAccuracyVals = _records
    .filter(r => r.totalCostEstimated > 0)
    .map(r => 1 - Math.min(1, Math.abs(r.totalCostActual - r.totalCostEstimated) / r.totalCostEstimated));
  const costAccuracy = costAccuracyVals.length > 0
    ? Math.round(costAccuracyVals.reduce((a, b) => a + b, 0) / costAccuracyVals.length * 100) / 100
    : 0;

  const byComplexity: Record<string, { count: number; avgScore: number }> = {};
  for (const c of ['simple', 'standard', 'enterprise']) {
    const recs = _records.filter(r => r.complexity === c);
    if (recs.length > 0) {
      byComplexity[c] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((sum, r) => sum + r.overallOptimizationScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  const byModelTier: Record<string, { count: number; avgScore: number }> = {};
  for (const tier of ['fast', 'standard', 'quality', 'premium']) {
    const recs = _records.filter(r => r.modelTier === tier);
    if (recs.length > 0) {
      byModelTier[tier] = {
        count: recs.length,
        avgScore: Math.round(recs.reduce((sum, r) => sum + r.overallOptimizationScore, 0) / recs.length * 10) / 10,
      };
    }
  }

  return {
    totalRecords: n,
    averageOptimizationScore: avg(r => r.overallOptimizationScore),
    buildSuccessRate: Math.round(successCount / n * 100) / 100,
    averageBuildTimeMs: avg(r => r.buildTimeMs),
    timeAccuracy,
    costAccuracy,
    byComplexity,
    byModelTier,
  };
}

export function hydrateOptimizationLearning(records: OptimizationLearningRecord[]): void {
  _records.length = 0;
  for (const r of records.slice(-MAX_RECORDS)) _records.push(r);
}

export function resetOptimizationLearning(): void {
  _records.length = 0;
}
