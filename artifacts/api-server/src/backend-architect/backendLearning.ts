// ── V8.6 Backend Architect — Learning Engine ──────────────────────────────────
import type { BackendLearningInput, BackendLearningRecord, BackendType } from './backendTypes.js';
import { recordBackendLearning } from './backendMetrics.js';

const STORE_KEY   = 'voxai_backend_architect_learning_v1';
const MAX_RECORDS = 200;

let inMemoryStore: BackendLearningRecord[] = [];

function findScore(qualityScores: { dimension: string; score: number }[], dim: string): number {
  return qualityScores.find(q => q.dimension === dim)?.score ?? 0;
}

function hasPreviousImproved(store: BackendLearningRecord[], type: BackendType): boolean {
  const prev = store.filter(r => r.backendType === type);
  if (prev.length < 2) return false;
  const last   = prev[prev.length - 1].overallScore;
  const second = prev[prev.length - 2].overallScore;
  return last > second;
}

export async function learnFromBackendBuild(input: BackendLearningInput): Promise<void> {
  try {
    const { buildId, blueprint, evaluatorScore } = input;

    const record: BackendLearningRecord = {
      buildId,
      backendType:   blueprint.backendType,
      overallScore:  evaluatorScore ?? blueprint.overallScore,
      securityScore: findScore(blueprint.qualityScores, 'security'),
      databaseScore: findScore(blueprint.qualityScores, 'database'),
      apiScore:      findScore(blueprint.qualityScores, 'api'),
      improved:      hasPreviousImproved(inMemoryStore, blueprint.backendType),
      recordedAt:    Date.now(),
    };

    inMemoryStore.push(record);
    if (inMemoryStore.length > MAX_RECORDS) inMemoryStore.shift();

    recordBackendLearning();
  } catch {
    // Learning never stops builds
  }
}

export function getBackendLearningRecords(): BackendLearningRecord[] {
  return [...inMemoryStore];
}

export function getBackendLearningStats(): {
  totalRecords:    number;
  improvedCount:   number;
  averageScore:    number;
  byType:          Record<string, number>;
} {
  const records = inMemoryStore;
  if (records.length === 0) {
    return { totalRecords: 0, improvedCount: 0, averageScore: 0, byType: {} };
  }

  const byType: Record<string, number> = {};
  let totalScore = 0;
  let improvedCount = 0;

  for (const r of records) {
    byType[r.backendType] = (byType[r.backendType] ?? 0) + 1;
    totalScore += r.overallScore;
    if (r.improved) improvedCount++;
  }

  return {
    totalRecords:  records.length,
    improvedCount,
    averageScore:  parseFloat((totalScore / records.length).toFixed(2)),
    byType,
  };
}

export function resetBackendLearning(): void {
  inMemoryStore = [];
}

export function initBackendPersistence(_storageKey = STORE_KEY): void {
  // No-op in server context; in-memory store is the source of truth
}
