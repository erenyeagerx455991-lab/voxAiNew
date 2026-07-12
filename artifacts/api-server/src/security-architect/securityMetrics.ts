// ── V8.9 Security Architecture Integration — Telemetry Metrics ───────────────
import type { SecurityIntelligenceDimension, SecurityIntelligenceQualityScore } from './securityTypes.js';

interface BuildRecord {
  backendType:  string;
  scores:       Partial<Record<SecurityIntelligenceDimension, number>>;
  overallScore: number;
}

const state: { records: BuildRecord[]; learnCount: number } = { records: [], learnCount: 0 };

export function recordSecurityArchitectBuild(
  backendType:   string,
  qualityScores: SecurityIntelligenceQualityScore[],
  overallScore:  number,
): void {
  const scores: Partial<Record<SecurityIntelligenceDimension, number>> = {};
  for (const qs of qualityScores) scores[qs.dimension] = qs.score;
  state.records.push({ backendType, scores, overallScore });
  if (state.records.length > 500) state.records.shift();
}

export function recordSecurityArchitectLearning(): void {
  state.learnCount++;
}

export function getSecurityArchitectMetrics(): {
  totalBuilds:         number;
  averageScore:        number;
  scoreByDimension:    Partial<Record<SecurityIntelligenceDimension, number>>;
  topBackendTypes:     Array<{ type: string; count: number }>;
  learningRecordCount: number;
  lastUpdated:         number;
} {
  const records = state.records;
  const n = records.length;

  if (n === 0) {
    return {
      totalBuilds: 0,
      averageScore: 0,
      scoreByDimension: {},
      topBackendTypes: [],
      learningRecordCount: state.learnCount,
      lastUpdated: Date.now(),
    };
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const dimTotals = new Map<SecurityIntelligenceDimension, number[]>();
  const typeCounts = new Map<string, number>();

  for (const rec of records) {
    typeCounts.set(rec.backendType, (typeCounts.get(rec.backendType) ?? 0) + 1);
    for (const [dim, score] of Object.entries(rec.scores) as [SecurityIntelligenceDimension, number][]) {
      if (!dimTotals.has(dim)) dimTotals.set(dim, []);
      dimTotals.get(dim)!.push(score);
    }
  }

  const scoreByDimension: Partial<Record<SecurityIntelligenceDimension, number>> = {};
  for (const [dim, scores] of dimTotals) {
    scoreByDimension[dim] = parseFloat(avg(scores).toFixed(2));
  }

  const topBackendTypes = [...typeCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return {
    totalBuilds:         n,
    averageScore:        parseFloat(avg(records.map(r => r.overallScore)).toFixed(2)),
    scoreByDimension,
    topBackendTypes,
    learningRecordCount: state.learnCount,
    lastUpdated:         Date.now(),
  };
}

export function resetSecurityArchitectMetrics(): void {
  state.records = [];
  state.learnCount = 0;
}
