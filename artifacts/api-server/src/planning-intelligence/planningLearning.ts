// ── V9.7 Planning Intelligence — Phase 15: Learning Engine ────────────────────
// Fire-and-forget async learning. Never blocks the pipeline.
import type { PlanningLearningRecord, PlanningLearningStats } from './planningTypes.js';

const MAX_RECORDS = 500;
const _records: PlanningLearningRecord[] = [];

export async function learnFromPlanning(record: PlanningLearningRecord): Promise<void> {
  try {
    _records.push(record);
    if (_records.length > MAX_RECORDS) _records.splice(0, _records.length - MAX_RECORDS);
  } catch { /* never throw */ }
}

export function getPlanningLearningStats(): PlanningLearningStats {
  if (_records.length === 0) {
    return {
      totalRecords: 0, averagePlanningScore: 0, averagePlanningTimeMs: 0,
      buildSuccessRate: 0, averageRoadmapAccuracy: 0, averageDependencyAccuracy: 0,
      byComplexity: {},
    };
  }

  const n = _records.length;
  const avg = (fn: (r: PlanningLearningRecord) => number) =>
    _records.reduce((s, r) => s + fn(r), 0) / n;

  const byComplexity: Record<string, { count: number; avgScore: number }> = {};
  for (const r of _records) {
    const k = r.complexity;
    if (!byComplexity[k]) byComplexity[k] = { count: 0, avgScore: 0 };
    byComplexity[k].count++;
    byComplexity[k].avgScore += r.planningScore;
  }
  for (const k of Object.keys(byComplexity)) {
    byComplexity[k].avgScore = Math.round(byComplexity[k].avgScore / byComplexity[k].count * 10) / 10;
  }

  return {
    totalRecords:              n,
    averagePlanningScore:      Math.round(avg(r => r.planningScore) * 10) / 10,
    averagePlanningTimeMs:     Math.round(avg(r => r.planningTimeMs)),
    buildSuccessRate:          Math.round(_records.filter(r => r.buildSucceeded).length / n * 100) / 100,
    averageRoadmapAccuracy:    Math.round(avg(r => r.roadmapAccuracy) * 100) / 100,
    averageDependencyAccuracy: Math.round(avg(r => r.dependencyAccuracy) * 100) / 100,
    byComplexity,
  };
}

export function resetPlanningLearning(): void { _records.length = 0; }
