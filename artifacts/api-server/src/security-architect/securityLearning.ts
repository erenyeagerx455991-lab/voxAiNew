// ── V8.9 Security Architecture Integration — Learning Engine ─────────────────
//
// Mirrors the backend/devops/qa architect learning pattern (in-memory, capped,
// fire-and-forget, never throws into the pipeline). Not a new learning system —
// same shape, scoped to security intelligence outcomes (including runtime and
// QA security findings fed in via `evaluatorScore`/external callers).
import type {
  SecurityIntelligenceLearningInput,
  SecurityIntelligenceLearningRecord,
} from './securityTypes.js';
import { recordSecurityArchitectLearning } from './securityMetrics.js';

const MAX_RECORDS = 200;
let inMemoryStore: SecurityIntelligenceLearningRecord[] = [];

function findScore(blueprint: SecurityIntelligenceLearningInput['blueprint'], dim: string): number {
  return blueprint.qualityScores.find(q => q.dimension === dim)?.score ?? 0;
}

function hasPreviousImproved(store: SecurityIntelligenceLearningRecord[], backendType: string): boolean {
  const prev = store.filter(r => r.backendType === backendType);
  if (prev.length < 2) return false;
  return prev[prev.length - 1].overallScore > prev[prev.length - 2].overallScore;
}

export async function learnFromSecurityBuild(input: SecurityIntelligenceLearningInput): Promise<void> {
  try {
    const { buildId, backendType, blueprint } = input;

    const record: SecurityIntelligenceLearningRecord = {
      buildId,
      backendType,
      overallScore:    blueprint.overallScore,
      privacyScore:    findScore(blueprint, 'privacy'),
      complianceScore: findScore(blueprint, 'compliance'),
      threatScore:     findScore(blueprint, 'threatModel'),
      improved:        hasPreviousImproved(inMemoryStore, backendType),
      recordedAt:      Date.now(),
    };

    inMemoryStore.push(record);
    if (inMemoryStore.length > MAX_RECORDS) inMemoryStore.shift();

    recordSecurityArchitectLearning();
  } catch {
    // Learning never stops builds
  }
}

export function getSecurityLearningRecords(): SecurityIntelligenceLearningRecord[] {
  return [...inMemoryStore];
}

export function getSecurityLearningStats(): {
  totalRecords:  number;
  improvedCount: number;
  averageScore:  number;
  byType:        Record<string, number>;
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

export function resetSecurityLearning(): void {
  inMemoryStore = [];
}
