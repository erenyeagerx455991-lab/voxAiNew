// ── V9.6 Execution Metrics ────────────────────────────────────────────────────
import type { ExecutionIntelligenceTelemetrySnapshot, ExecutionMode } from './executionTypes.js';
import { getExecutionLearningStats } from './executionLearning.js';
import { getExecutionPersistenceStats } from './executionPersistence.js';

const MAX_RECORDS = 500;

interface MetricRecord {
  executionScore:     number;
  parallelEfficiency: number;
  actualDurationMs:   number;
  actualRetries:      number;
  failed:             boolean;
  recovered:          boolean;
  executionMode:      ExecutionMode;
  estimatedCost:      number;
  estimatedTimeMs:    number;
  recordedAt:         number;
}

let records: MetricRecord[] = [];

export function recordExecutionMetric(r: MetricRecord): void {
  records.push(r);
  if (records.length > MAX_RECORDS) records = records.slice(records.length - MAX_RECORDS);
}

export function getExecutionIntelligenceSnapshot(): ExecutionIntelligenceTelemetrySnapshot {
  const learningStatistics = getExecutionLearningStats();
  const persistenceHealth = getExecutionPersistenceStats();

  const plannerDistribution: Record<ExecutionMode, number> = {
    sequential: 0, parallel: 0, hybrid: 0, 'critical-path-first': 0, 'cost-optimized': 0,
  };

  if (records.length === 0) {
    return {
      executionScore: 0, parallelEfficiency: 0, averageDuration: 0,
      averageRetries: 0, failureRate: 0, recoveryRate: 0,
      learningStatistics, plannerDistribution, persistenceHealth,
      estimatedCost: 0, estimatedTime: 0,
    };
  }

  const n = records.length;
  const avg = (fn: (r: MetricRecord) => number) => records.reduce((s, r) => s + fn(r), 0) / n;

  const executionScore = avg(r => r.executionScore);
  const parallelEfficiency = avg(r => r.parallelEfficiency);
  const averageDuration = avg(r => r.actualDurationMs);
  const averageRetries = avg(r => r.actualRetries);
  const failureRate = records.filter(r => r.failed).length / n;
  const failedCount = records.filter(r => r.failed).length;
  const recoveryRate = failedCount > 0 ? records.filter(r => r.recovered).length / failedCount : 0;
  const estimatedCost = avg(r => r.estimatedCost);
  const estimatedTime = avg(r => r.estimatedTimeMs);

  for (const r of records) {
    plannerDistribution[r.executionMode] = (plannerDistribution[r.executionMode] ?? 0) + 1;
  }

  return {
    executionScore:     Number(executionScore.toFixed(2)),
    parallelEfficiency: Number(parallelEfficiency.toFixed(3)),
    averageDuration:    Number(averageDuration.toFixed(0)),
    averageRetries:     Number(averageRetries.toFixed(2)),
    failureRate:        Number(failureRate.toFixed(3)),
    recoveryRate:       Number(recoveryRate.toFixed(3)),
    learningStatistics,
    plannerDistribution,
    persistenceHealth,
    estimatedCost:      Number(estimatedCost.toFixed(4)),
    estimatedTime:      Number(estimatedTime.toFixed(0)),
  };
}

export function resetExecutionMetrics(): void {
  records = [];
}
