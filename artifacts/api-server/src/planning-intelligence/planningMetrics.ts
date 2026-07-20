// ── V9.7 Planning Intelligence — Phase 16: Metrics ────────────────────────────
import type { PlanningMetricRecord, PlanningMetricsSnapshot } from './planningTypes.js';
import { getPlanningLearningStats } from './planningLearning.js';
import { getPlanningPersistenceStats } from './planningPersistence.js';

const MAX_RECORDS = 500;
const _metrics: PlanningMetricRecord[] = [];

export function recordPlanningMetric(record: PlanningMetricRecord): void {
  _metrics.push(record);
  if (_metrics.length > MAX_RECORDS) _metrics.splice(0, _metrics.length - MAX_RECORDS);
}

export function getPlanningMetricsSnapshot(): PlanningMetricsSnapshot {
  if (_metrics.length === 0) {
    return {
      planningScore: 0, roadmapScore: 0, dependencyScore: 0, estimationScore: 0,
      riskScore: 0, validationScore: 0, averagePlanningTime: 0,
      learningStatistics: getPlanningLearningStats(),
      plannerDistribution: { simple: 0, standard: 0, enterprise: 0 },
      persistenceHealth: getPlanningPersistenceStats(),
    };
  }

  const n = _metrics.length;
  const avg = (fn: (r: PlanningMetricRecord) => number) =>
    Math.round(_metrics.reduce((s, r) => s + fn(r), 0) / n * 10) / 10;

  const dist: Record<string, number> = { simple: 0, standard: 0, enterprise: 0 };
  for (const r of _metrics) dist[r.complexity] = (dist[r.complexity] ?? 0) + 1;

  return {
    planningScore:       avg(r => r.planningScore),
    roadmapScore:        avg(r => r.roadmapScore),
    dependencyScore:     avg(r => r.dependencyScore),
    estimationScore:     avg(r => r.estimationScore),
    riskScore:           avg(r => r.riskScore),
    validationScore:     avg(r => r.validationScore),
    averagePlanningTime: avg(r => r.planningTimeMs),
    learningStatistics:  getPlanningLearningStats(),
    plannerDistribution: dist,
    persistenceHealth:   getPlanningPersistenceStats(),
  };
}

export function resetPlanningMetrics(): void { _metrics.length = 0; }
