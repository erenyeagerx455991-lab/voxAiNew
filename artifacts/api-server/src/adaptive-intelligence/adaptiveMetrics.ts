// ── V9.9 Adaptive Intelligence — Phase 11: Metrics ────────────────────────────
import type { AdaptiveMetricRecord, AdaptiveMetricsSnapshot, AdaptiveStrategy } from './adaptiveTypes.js';
import { getAdaptiveLearningStats } from './adaptiveLearning.js';
import { getAdaptivePersistenceStats } from './adaptivePersistence.js';

const MAX_RECORDS = 500;
const _metrics: AdaptiveMetricRecord[] = [];

export function recordAdaptiveMetric(record: AdaptiveMetricRecord): void {
  _metrics.push(record);
  if (_metrics.length > MAX_RECORDS) _metrics.splice(0, _metrics.length - MAX_RECORDS);
}

export function getAdaptiveMetricsSnapshot(): AdaptiveMetricsSnapshot {
  if (_metrics.length === 0) {
    return {
      adaptiveScore: 0,
      runtimeOptimizationScore: 0,
      costOptimizationScore: 0,
      qualityOptimizationScore: 0,
      performanceGain: 0,
      failureReduction: 0,
      adaptationSuccessRate: 0,
      learningStatistics: getAdaptiveLearningStats(),
      plannerDistribution: { speed: 0, cost: 0, quality: 0, balanced: 0, enterprise: 0 },
      persistenceHealth: getAdaptivePersistenceStats(),
    };
  }

  const n = _metrics.length;
  const avg = (fn: (r: AdaptiveMetricRecord) => number) =>
    Math.round(_metrics.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const dist: Record<string, number> = { speed: 0, cost: 0, quality: 0, balanced: 0, enterprise: 0 };
  for (const r of _metrics) {
    dist[r.strategy] = (dist[r.strategy] ?? 0) + 1;
  }

  const successfulAdaptations = _metrics.filter(r => r.adaptiveScore >= 6).length;

  return {
    adaptiveScore:            avg(r => r.adaptiveScore),
    runtimeOptimizationScore: avg(r => r.runtimeOptimizationScore),
    costOptimizationScore:    avg(r => r.costOptimizationScore),
    qualityOptimizationScore: avg(r => r.qualityOptimizationScore),
    performanceGain:          avg(r => r.performanceGain),
    failureReduction:         avg(r => r.failureReduction),
    adaptationSuccessRate:    Math.round(successfulAdaptations / n * 100) / 100,
    learningStatistics:       getAdaptiveLearningStats(),
    plannerDistribution:      dist,
    persistenceHealth:        getAdaptivePersistenceStats(),
  };
}

export function resetAdaptiveMetrics(): void {
  _metrics.length = 0;
}
