// ── V9.0 Runtime Intelligence — Learning Engine ───────────────────────────────
//
// Learns from build outcomes (repair failures, evaluation scores, timing
// accuracy) to improve future runtime decisions. Fire-and-forget, never
// throws into the pipeline. In-memory, capped at 200 records.
import type {
  RuntimeLearningInput,
  RuntimeLearningRecord,
  GenerationMode,
  CandidateCount,
} from './runtimeTypes.js';
import { recordRuntimeLearning } from './runtimeMetrics.js';

const MAX_RECORDS = 200;
let inMemoryStore: RuntimeLearningRecord[] = [];

function hasPreviousImproved(store: RuntimeLearningRecord[], mode: GenerationMode): boolean {
  const prev = store.filter(r => r.mode === mode);
  if (prev.length < 2) return false;
  return prev[prev.length - 1].overallScore > prev[prev.length - 2].overallScore;
}

function findDimScore(blueprint: RuntimeLearningInput['blueprint'], dim: string): number {
  return blueprint.qualityScores.find(q => q.dimension === dim)?.score ?? 0;
}

export async function learnFromRuntimeBuild(input: RuntimeLearningInput): Promise<void> {
  try {
    const { buildId, blueprint, actualBuildTimeMs, actualRepairCount, overallBuildScore } = input;
    const { mode, candidateStrategy, performancePrediction } = blueprint;

    const record: RuntimeLearningRecord = {
      buildId,
      mode,
      overallScore:            overallBuildScore,
      actualBuildTimeMs,
      estimatedBuildTimeMs:    performancePrediction.estimatedBuildTimeMs,
      actualRepairCount,
      estimatedRepairCount:    performancePrediction.estimatedRepairCount,
      candidateCount:          candidateStrategy.count as CandidateCount,
      generationScore:         findDimScore(blueprint, 'generation'),
      repairScore:             findDimScore(blueprint, 'repair'),
      evaluationScore:         findDimScore(blueprint, 'evaluation'),
      improved:                hasPreviousImproved(inMemoryStore, mode),
      recordedAt:              Date.now(),
      // V9.1: track which evaluator weight profile scored this build, so we
      // can later tell which profiles correlate with higher overall scores.
      weightProfile:           blueprint.evaluationStrategy?.profile ?? 'unknown',
    };

    inMemoryStore.push(record);
    if (inMemoryStore.length > MAX_RECORDS) inMemoryStore.shift();

    recordRuntimeLearning();
  } catch {
    // Learning never stops builds
  }
}

export function getRuntimeLearningRecords(): RuntimeLearningRecord[] {
  return [...inMemoryStore];
}

export function getRuntimeLearningStats(): {
  totalRecords:       number;
  improvedCount:      number;
  averageScore:       number;
  averageBuildTimeMs: number;
  timeAccuracy:       number;   // 0–1: how close estimates were to actuals
  repairAccuracy:     number;   // 0–1: how close repair estimates were
  byMode:             Partial<Record<GenerationMode, number>>;
  /** V9.1: average overall score per evaluator weight profile — which
   *  profiles correlate with better builds. */
  byWeightProfile:    Record<string, { count: number; averageScore: number }>;
} {
  const records = inMemoryStore;
  if (records.length === 0) {
    return {
      totalRecords: 0, improvedCount: 0, averageScore: 0,
      averageBuildTimeMs: 0, timeAccuracy: 0, repairAccuracy: 0, byMode: {},
      byWeightProfile: {},
    };
  }

  const byMode: Partial<Record<GenerationMode, number>> = {};
  const profileTotals = new Map<string, { count: number; scoreSum: number }>();
  let totalScore = 0;
  let totalBuildTime = 0;
  let improvedCount = 0;
  let timeErrorSum = 0;
  let repairErrorSum = 0;

  for (const r of records) {
    byMode[r.mode] = (byMode[r.mode] ?? 0) + 1;
    totalScore    += r.overallScore;
    totalBuildTime += r.actualBuildTimeMs;
    if (r.improved) improvedCount++;

    const profile = r.weightProfile ?? 'unknown';
    const bucket = profileTotals.get(profile) ?? { count: 0, scoreSum: 0 };
    bucket.count++;
    bucket.scoreSum += r.overallScore;
    profileTotals.set(profile, bucket);

    // Time accuracy: 1 - relative error (capped at 0)
    const timeError = Math.abs(r.actualBuildTimeMs - r.estimatedBuildTimeMs)
      / Math.max(r.estimatedBuildTimeMs, 1);
    timeErrorSum += Math.min(timeError, 1);

    const repairError = Math.abs(r.actualRepairCount - r.estimatedRepairCount)
      / Math.max(r.estimatedRepairCount, 1);
    repairErrorSum += Math.min(repairError, 1);
  }

  const byWeightProfile: Record<string, { count: number; averageScore: number }> = {};
  for (const [profile, bucket] of profileTotals) {
    byWeightProfile[profile] = {
      count:        bucket.count,
      averageScore: parseFloat((bucket.scoreSum / bucket.count).toFixed(2)),
    };
  }

  const n = records.length;
  return {
    totalRecords:       n,
    improvedCount,
    averageScore:       parseFloat((totalScore / n).toFixed(2)),
    averageBuildTimeMs: Math.round(totalBuildTime / n),
    timeAccuracy:       parseFloat((1 - timeErrorSum / n).toFixed(3)),
    repairAccuracy:     parseFloat((1 - repairErrorSum / n).toFixed(3)),
    byMode,
    byWeightProfile,
  };
}

export function resetRuntimeLearning(): void {
  inMemoryStore = [];
}
