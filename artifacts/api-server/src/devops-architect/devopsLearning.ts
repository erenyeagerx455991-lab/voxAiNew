// ── V8.7 DevOps Architect — Async Learning Engine ────────────────────────────
import type {
  DevOpsLearningRecord, DevOpsLearningInput,
  InfrastructureType, CloudProvider,
} from './devopsTypes.js';

const MAX_RECORDS = 200;

interface LearningState {
  records:    DevOpsLearningRecord[];
  learnCount: number;
}

const state: LearningState = { records: [], learnCount: 0 };

function hasPreviousImproved(
  records: DevOpsLearningRecord[],
  infra: InfrastructureType,
  provider: CloudProvider,
): boolean {
  const relevant = records.filter(
    r => r.infrastructureType === infra && r.cloudProvider === provider
  );
  if (relevant.length < 2) return false;
  const last = relevant[relevant.length - 1];
  const prev = relevant[relevant.length - 2];
  return last.overallScore > prev.overallScore;
}

export async function learnFromDevOpsBuild(input: DevOpsLearningInput): Promise<void> {
  const bp = input.blueprint;
  const infra = bp.infrastructureType;
  const provider = bp.cloud.provider;

  const security = bp.qualityScores.find(q => q.dimension === 'security')?.score ?? 0;
  const reliability = bp.qualityScores.find(q => q.dimension === 'reliability')?.score ?? 0;

  const record: DevOpsLearningRecord = {
    buildId:            input.buildId,
    infrastructureType: infra,
    cloudProvider:      provider,
    overallScore:       input.evaluatorScore ?? bp.overallScore,
    securityScore:      security,
    reliabilityScore:   reliability,
    improved:           hasPreviousImproved(state.records, infra, provider),
    recordedAt:         Date.now(),
  };

  state.records.push(record);
  if (state.records.length > MAX_RECORDS) {
    state.records.splice(0, state.records.length - MAX_RECORDS);
  }
  state.learnCount++;
}

export function getDevOpsLearningStats(): {
  totalRecords:  number;
  improvedCount: number;
  averageScore:  number;
  byInfra:       Record<string, number>;
  byProvider:    Record<string, number>;
} {
  const { records } = state;
  const n = records.length;
  if (n === 0) {
    return { totalRecords: 0, improvedCount: 0, averageScore: 0, byInfra: {}, byProvider: {} };
  }

  const avg = records.reduce((s, r) => s + r.overallScore, 0) / n;
  const improved = records.filter(r => r.improved).length;

  const byInfra: Record<string, number> = {};
  const byProvider: Record<string, number> = {};
  for (const r of records) {
    byInfra[r.infrastructureType] = (byInfra[r.infrastructureType] ?? 0) + 1;
    byProvider[r.cloudProvider]   = (byProvider[r.cloudProvider] ?? 0) + 1;
  }

  return {
    totalRecords:  n,
    improvedCount: improved,
    averageScore:  parseFloat(avg.toFixed(2)),
    byInfra,
    byProvider,
  };
}

export function getDevOpsLearnCount(): number { return state.learnCount; }

export function resetDevOpsLearning(): void {
  state.records.length = 0;
  state.learnCount = 0;
}
