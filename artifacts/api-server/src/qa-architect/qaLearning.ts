// ── V8.8 QA Architect — Phase 20: Learning Engine ────────────────────────────
import type { QABlueprint, QAStrategy } from './qaTypes.js';

const MAX_RECORDS = 200;

interface LearningRecord {
  buildId:   string;
  strategy:  QAStrategy;
  score:     number;
  improved:  boolean;
  timestamp: string;
}

interface LearningState {
  records: LearningRecord[];
}

const state: LearningState = { records: [] };

export function resetQALearning(): void { state.records.length = 0; }

export async function learnFromQABuild(input: {
  buildId:   string;
  blueprint: QABlueprint;
}): Promise<void> {
  const { buildId, blueprint } = input;
  const score    = blueprint.overallScore;
  const strategy = blueprint.strategy.strategy;

  const prev = [...state.records].reverse().find(r => r.strategy === strategy);
  const improved = prev ? score > prev.score : false;

  state.records.push({ buildId, strategy, score, improved, timestamp: new Date().toISOString() });
  if (state.records.length > MAX_RECORDS) {
    state.records.splice(0, state.records.length - MAX_RECORDS);
  }
}

export interface QALearningStats {
  totalRecords:   number;
  improvedCount:  number;
  averageScore:   number;
  byStrategy:     Partial<Record<QAStrategy, number>>;
}

export function getQALearningStats(): QALearningStats {
  const n = state.records.length;
  if (n === 0) return { totalRecords: 0, improvedCount: 0, averageScore: 0, byStrategy: {} };

  const improvedCount = state.records.filter(r => r.improved).length;
  const averageScore  = parseFloat((state.records.reduce((s, r) => s + r.score, 0) / n).toFixed(2));

  const byStrategy: Partial<Record<QAStrategy, number>> = {};
  for (const r of state.records) {
    byStrategy[r.strategy] = (byStrategy[r.strategy] ?? 0) + 1;
  }

  return { totalRecords: n, improvedCount, averageScore, byStrategy };
}
