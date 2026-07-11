// ── V8.6 Backend Architect — Telemetry Metrics ────────────────────────────────
import type { BackendType, BackendQualityScore, BackendArchitectureDimension } from './backendTypes.js';

interface BackendMetricsSnapshot {
  totalBuilds:              number;
  averageScore:             number;
  averageArchitectureScore: number;
  averageSecurityScore:     number;
  averageDatabaseScore:     number;
  averageAPIScore:          number;
  averageDeploymentScore:   number;
  averageTestingScore:      number;
  averageScalabilityScore:  number;
  scoreByDimension:         Record<BackendArchitectureDimension, number>;
  topBackendTypes:           Array<{ type: BackendType; count: number }>;
  learningRecordCount:      number;
  lastUpdated:              number;
}

interface BuildRecord {
  type:          BackendType;
  scores:        Record<BackendArchitectureDimension, number>;
  overallScore:  number;
}

const state: {
  records:     BuildRecord[];
  learnCount:  number;
} = { records: [], learnCount: 0 };

export function recordBackendBuild(
  type:          BackendType,
  qualityScores: BackendQualityScore[],
  overallScore:  number,
): void {
  const scoreMap = {} as Record<BackendArchitectureDimension, number>;
  for (const qs of qualityScores) {
    scoreMap[qs.dimension] = qs.score;
  }
  state.records.push({ type, scores: scoreMap, overallScore });
  if (state.records.length > 500) state.records.shift();
}

export function recordBackendLearning(): void {
  state.learnCount++;
}

export function getBackendMetrics(): BackendMetricsSnapshot {
  const records = state.records;
  const n       = records.length;

  if (n === 0) {
    return {
      totalBuilds:              0,
      averageScore:             0,
      averageArchitectureScore: 0,
      averageSecurityScore:     0,
      averageDatabaseScore:     0,
      averageAPIScore:          0,
      averageDeploymentScore:   0,
      averageTestingScore:      0,
      averageScalabilityScore:  0,
      scoreByDimension:         {} as Record<BackendArchitectureDimension, number>,
      topBackendTypes:          [],
      learningRecordCount:      state.learnCount,
      lastUpdated:              Date.now(),
    };
  }

  const avg       = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const dimTotals = new Map<BackendArchitectureDimension, number[]>();
  const typeCounts = new Map<BackendType, number>();

  for (const rec of records) {
    typeCounts.set(rec.type, (typeCounts.get(rec.type) ?? 0) + 1);
    for (const [dim, s] of Object.entries(rec.scores) as [BackendArchitectureDimension, number][]) {
      if (!dimTotals.has(dim)) dimTotals.set(dim, []);
      dimTotals.get(dim)!.push(s);
    }
  }

  const scoreByDimension = {} as Record<BackendArchitectureDimension, number>;
  for (const [dim, scores] of dimTotals) {
    scoreByDimension[dim] = parseFloat(avg(scores).toFixed(2));
  }

  const topBackendTypes = [...typeCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return {
    totalBuilds:              n,
    averageScore:             parseFloat(avg(records.map(r => r.overallScore)).toFixed(2)),
    averageArchitectureScore: parseFloat(avg(records.map(r => r.scores.architecture ?? 0)).toFixed(2)),
    averageSecurityScore:     parseFloat(avg(records.map(r => r.scores.security ?? 0)).toFixed(2)),
    averageDatabaseScore:     parseFloat(avg(records.map(r => r.scores.database ?? 0)).toFixed(2)),
    averageAPIScore:          parseFloat(avg(records.map(r => r.scores.api ?? 0)).toFixed(2)),
    averageDeploymentScore:   parseFloat(avg(records.map(r => r.scores.scalability ?? 0)).toFixed(2)),
    averageTestingScore:      parseFloat(avg(records.map(r => r.scores.testability ?? 0)).toFixed(2)),
    averageScalabilityScore:  parseFloat(avg(records.map(r => r.scores.scalability ?? 0)).toFixed(2)),
    scoreByDimension,
    topBackendTypes,
    learningRecordCount:      state.learnCount,
    lastUpdated:              Date.now(),
  };
}

export function resetBackendMetrics(): void {
  state.records   = [];
  state.learnCount = 0;
}
