// ── V9.2 Orchestrator — Runtime Learning ─────────────────────────────────────
//
// Learns which execution graphs/orderings/parallelization/retry/model/
// timeout/cost/quality profiles correlate with the best outcomes. Fire-and-
// forget, in-memory, capped at 500 records, async and never throws into the
// pipeline (mirrors runtimeLearning.ts's pattern).
import type { OrchestratorLearningRecord, OrchestratorLearningStats, ProjectComplexity } from './types.js';

const MAX_RECORDS = 500;
let store: OrchestratorLearningRecord[] = [];

export async function learnFromExecution(record: OrchestratorLearningRecord): Promise<void> {
  try {
    store.push(record);
    if (store.length > MAX_RECORDS) store.shift();
  } catch { /* learning never stops builds */ }
}

export function getOrchestratorLearningRecords(): OrchestratorLearningRecord[] {
  return [...store];
}

export function getOrchestratorLearningStats(): OrchestratorLearningStats {
  const n = store.length;
  if (n === 0) {
    return {
      totalRecords: 0, averageScore: 0, averageDurationMs: 0,
      durationAccuracy: 0, bestExecutionGraph: null, byComplexity: {},
    };
  }

  const byComplexityMap = new Map<ProjectComplexity, { count: number; scoreSum: number; durationSum: number }>();
  let scoreSum = 0;
  let durationSum = 0;
  let durationErrorSum = 0;

  for (const r of store) {
    scoreSum += r.overallScore;
    durationSum += r.actualDurationMs;
    const err = Math.abs(r.actualDurationMs - r.estimatedDurationMs) / Math.max(r.estimatedDurationMs, 1);
    durationErrorSum += Math.min(err, 1);

    const bucket = byComplexityMap.get(r.complexity) ?? { count: 0, scoreSum: 0, durationSum: 0 };
    bucket.count++;
    bucket.scoreSum += r.overallScore;
    bucket.durationSum += r.actualDurationMs;
    byComplexityMap.set(r.complexity, bucket);
  }

  const byComplexity: OrchestratorLearningStats['byComplexity'] = {};
  for (const [complexity, bucket] of byComplexityMap) {
    byComplexity[complexity] = {
      count: bucket.count,
      averageScore: parseFloat((bucket.scoreSum / bucket.count).toFixed(2)),
      averageDurationMs: Math.round(bucket.durationSum / bucket.count),
    };
  }

  // Best execution graph signature: highest-average-score (complexity, parallelGroupCount) pairing.
  const bySignature = new Map<string, { complexity: ProjectComplexity; parallelGroupCount: number; scoreSum: number; count: number }>();
  for (const r of store) {
    const key = `${r.complexity}:${r.parallelGroupCount}`;
    const bucket = bySignature.get(key) ?? { complexity: r.complexity, parallelGroupCount: r.parallelGroupCount, scoreSum: 0, count: 0 };
    bucket.scoreSum += r.overallScore;
    bucket.count++;
    bySignature.set(key, bucket);
  }
  let best: { complexity: ProjectComplexity; parallelGroupCount: number; averageScore: number } | null = null;
  for (const bucket of bySignature.values()) {
    const avg = bucket.scoreSum / bucket.count;
    if (!best || avg > best.averageScore) {
      best = { complexity: bucket.complexity, parallelGroupCount: bucket.parallelGroupCount, averageScore: parseFloat(avg.toFixed(2)) };
    }
  }

  return {
    totalRecords: n,
    averageScore: parseFloat((scoreSum / n).toFixed(2)),
    averageDurationMs: Math.round(durationSum / n),
    durationAccuracy: parseFloat((1 - durationErrorSum / n).toFixed(3)),
    bestExecutionGraph: best,
    byComplexity,
  };
}

export function resetOrchestratorLearning(): void {
  store = [];
}
