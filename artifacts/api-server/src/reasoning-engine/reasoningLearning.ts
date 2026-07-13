// ── V9.5 Decision Learning ─────────────────────────────────────────────────────
// Fire-and-forget async learning — never blocks a build.
import type { ReasoningLearningRecord, ReasoningLearningStats } from './types.js';

const MAX_RECORDS = 500;
let records: ReasoningLearningRecord[] = [];

export async function learnFromDecision(record: ReasoningLearningRecord): Promise<void> {
  await Promise.resolve(); // preserves async/fire-and-forget contract
  records.push(record);
  if (records.length > MAX_RECORDS) records = records.slice(records.length - MAX_RECORDS);
}

export function getReasoningLearningStats(): ReasoningLearningStats {
  if (records.length === 0) {
    return { totalRecords: 0, averageConfidence: 0, averageScore: 0, productionSuccessRate: 0, byPath: {} };
  }

  const totalRecords = records.length;
  const averageConfidence = records.reduce((s, r) => s + r.confidenceScore, 0) / totalRecords;
  const averageScore = records.reduce((s, r) => s + r.overallScore, 0) / totalRecords;
  const productionSuccessRate = records.filter(r => r.productionSuccess).length / totalRecords;

  const byPath: Record<string, { count: number; averageScore: number }> = {};
  for (const r of records) {
    const bucket = byPath[r.chosenPathId] ?? { count: 0, averageScore: 0 };
    bucket.averageScore = (bucket.averageScore * bucket.count + r.overallScore) / (bucket.count + 1);
    bucket.count += 1;
    byPath[r.chosenPathId] = bucket;
  }

  return {
    totalRecords,
    averageConfidence: Number(averageConfidence.toFixed(2)),
    averageScore: Number(averageScore.toFixed(2)),
    productionSuccessRate: Number(productionSuccessRate.toFixed(2)),
    byPath,
  };
}

export function resetReasoningLearning(): void {
  records = [];
}
