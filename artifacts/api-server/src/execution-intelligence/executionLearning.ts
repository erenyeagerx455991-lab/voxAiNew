// ── V9.6 Execution Learning ───────────────────────────────────────────────────
// Fire-and-forget async learning. Never blocks the pipeline.
import type { ExecutionLearningRecord, ExecutionLearningStats, ExecutionMode } from './executionTypes.js';

const MAX_RECORDS = 500;
let records: ExecutionLearningRecord[] = [];

export async function learnFromExecution(record: ExecutionLearningRecord): Promise<void> {
  await Promise.resolve(); // preserves async/fire-and-forget contract
  records.push(record);
  if (records.length > MAX_RECORDS) records = records.slice(records.length - MAX_RECORDS);
}

export function getExecutionLearningStats(): ExecutionLearningStats {
  if (records.length === 0) {
    return {
      totalRecords: 0, averageDurationMs: 0, averageRetries: 0,
      failureRate: 0, recoveryRate: 0, parallelEfficiency: 0,
      costPredictionAccuracy: 0, executionSuccessRate: 0, byMode: {},
    };
  }

  const n = records.length;
  const avg = (fn: (r: ExecutionLearningRecord) => number) => records.reduce((s, r) => s + fn(r), 0) / n;

  const averageDurationMs = avg(r => r.actualDurationMs);
  const averageRetries = avg(r => r.actualRetries);
  const failureRate = records.filter(r => r.failed).length / n;
  const recoveryRate = records.filter(r => r.recovered).length / Math.max(1, records.filter(r => r.failed).length);
  const parallelEfficiency = avg(r => r.parallelEfficiency);

  // Cost prediction accuracy: 1 - |actual - estimated| / estimated
  const durationAccuracies = records.map(r => {
    if (r.estimatedDurationMs <= 0) return 0.5;
    return Math.max(0, 1 - Math.abs(r.actualDurationMs - r.estimatedDurationMs) / r.estimatedDurationMs);
  });
  const costPredictionAccuracy = durationAccuracies.reduce((s, v) => s + v, 0) / n;
  const executionSuccessRate = 1 - failureRate;

  // By mode
  const byMode: ExecutionLearningStats['byMode'] = {};
  for (const r of records) {
    const bucket = byMode[r.executionMode] ?? { count: 0, averageScore: 0, avgDurationMs: 0 };
    bucket.averageScore = (bucket.averageScore * bucket.count + r.executionScore) / (bucket.count + 1);
    bucket.avgDurationMs = (bucket.avgDurationMs * bucket.count + r.actualDurationMs) / (bucket.count + 1);
    bucket.count += 1;
    byMode[r.executionMode] = bucket;
  }

  return {
    totalRecords: n,
    averageDurationMs: Number(averageDurationMs.toFixed(0)),
    averageRetries: Number(averageRetries.toFixed(2)),
    failureRate: Number(failureRate.toFixed(3)),
    recoveryRate: Number(recoveryRate.toFixed(3)),
    parallelEfficiency: Number(parallelEfficiency.toFixed(3)),
    costPredictionAccuracy: Number(costPredictionAccuracy.toFixed(3)),
    executionSuccessRate: Number(executionSuccessRate.toFixed(3)),
    byMode,
  };
}

export function getExecutionLearningRecords(): ExecutionLearningRecord[] {
  return [...records];
}

export function resetExecutionLearning(): void {
  records = [];
}
