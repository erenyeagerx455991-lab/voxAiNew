// ── V10.0 — Optimization Metrics ──────────────────────────────────────────────
import type { OptimizationMetricRecord, OptimizationMetricsSnapshot } from './optimizationTypes.js';
import { getOptimizationLearningStats } from './optimizationLearning.js';
import { getOptimizationPersistenceStats } from './optimizationPersistence.js';

const MAX_RECORDS = 500;
const _metrics: OptimizationMetricRecord[] = [];

export function recordOptimizationMetric(record: OptimizationMetricRecord): void {
  _metrics.push(record);
  if (_metrics.length > MAX_RECORDS) _metrics.splice(0, _metrics.length - MAX_RECORDS);
}

export function getOptimizationMetricsSnapshot(): OptimizationMetricsSnapshot {
  if (_metrics.length === 0) {
    return {
      overallOptimizationScore: 0,
      performanceScore:         0,
      latencyScore:             0,
      costScore:                0,
      qualityScore:             0,
      workflowScore:            0,
      parallelScore:            0,
      resourceScore:            0,
      tokenScore:               0,
      repairScore:              0,
      retryScore:               0,
      modelScore:               0,
      adaptationSuccessRate:    0,
      learningStatistics:       getOptimizationLearningStats(),
      plannerDistribution:      { fast: 0, standard: 0, quality: 0, premium: 0 },
      persistenceHealth:        getOptimizationPersistenceStats(),
    };
  }

  const n = _metrics.length;
  const avg = (fn: (r: OptimizationMetricRecord) => number) =>
    Math.round(_metrics.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  // plannerDistribution keyed by complexity
  const dist: Record<string, number> = { simple: 0, standard: 0, enterprise: 0 };
  for (const r of _metrics) dist[r.complexity] = (dist[r.complexity] ?? 0) + 1;

  const successfulCount = _metrics.filter(r => r.overallOptimizationScore >= 6).length;

  return {
    overallOptimizationScore: avg(r => r.overallOptimizationScore),
    performanceScore:         avg(r => r.performanceScore),
    latencyScore:             avg(r => r.latencyScore),
    costScore:                avg(r => r.costScore),
    qualityScore:             avg(r => r.qualityScore),
    workflowScore:            avg(r => r.workflowScore),
    parallelScore:            avg(r => r.parallelScore),
    resourceScore:            avg(r => r.resourceScore),
    tokenScore:               avg(r => r.tokenScore),
    repairScore:              avg(r => r.repairScore),
    retryScore:               avg(r => r.retryScore),
    modelScore:               avg(r => r.modelScore),
    adaptationSuccessRate:    Math.round(successfulCount / n * 100) / 100,
    learningStatistics:       getOptimizationLearningStats(),
    plannerDistribution:      dist,
    persistenceHealth:        getOptimizationPersistenceStats(),
  };
}

export function resetOptimizationMetrics(): void {
  _metrics.length = 0;
}
