// ── V10.1 — Meta Metrics ───────────────────────────────────────────────────────
// Rolling 500-record metrics store. Returns MetaMetricsSnapshot.
import type { MetaMetricRecord, MetaMetricsSnapshot } from './metaTypes.js';
import { getMetaLearningStats } from './metaLearning.js';
import { getMetaPersistenceStats } from './metaPersistence.js';

const MAX_RECORDS = 500;
const _metrics: MetaMetricRecord[] = [];

export function recordMetaMetric(record: MetaMetricRecord): void {
  _metrics.push(record);
  if (_metrics.length > MAX_RECORDS) _metrics.splice(0, _metrics.length - MAX_RECORDS);
}

export function getMetaMetricsSnapshot(): MetaMetricsSnapshot {
  if (_metrics.length === 0) {
    return {
      overallMetaScore:     0,
      architectureScore:    0,
      performanceScore:     0,
      learningScore:        0,
      optimizationScore:    0,
      healthScore:          0,
      confidenceScore:      0,
      diagnosticScore:      0,
      recommendationCount:  0,
      adaptationSuccessRate: 0,
      learningStatistics:   getMetaLearningStats(),
      plannerDistribution:  { simple: 0, standard: 0, enterprise: 0 },
      persistenceHealth:    getMetaPersistenceStats(),
    };
  }

  const n = _metrics.length;
  const avg = (fn: (r: MetaMetricRecord) => number) =>
    Math.round(_metrics.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const dist: Record<string, number> = { simple: 0, standard: 0, enterprise: 0 };
  for (const r of _metrics) dist[r.complexity] = (dist[r.complexity] ?? 0) + 1;

  const successfulCount = _metrics.filter(r => r.overallMetaScore >= 6).length;

  return {
    overallMetaScore:     avg(r => r.overallMetaScore),
    architectureScore:    avg(r => r.architectureScore),
    performanceScore:     avg(r => r.performanceScore),
    learningScore:        avg(r => r.learningScore),
    optimizationScore:    avg(r => r.optimizationScore),
    healthScore:          avg(r => r.healthScore),
    confidenceScore:      avg(r => r.confidenceScore),
    diagnosticScore:      avg(r => r.diagnosticScore),
    recommendationCount:  avg(r => r.recommendationCount),
    adaptationSuccessRate: Math.round(successfulCount / n * 100) / 100,
    learningStatistics:   getMetaLearningStats(),
    plannerDistribution:  dist,
    persistenceHealth:    getMetaPersistenceStats(),
  };
}

export function resetMetaMetrics(): void {
  _metrics.length = 0;
}
