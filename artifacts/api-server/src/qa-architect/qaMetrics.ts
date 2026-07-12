// ── V8.8 QA Architect — Phase 21: Metrics ────────────────────────────────────
import type { QAMetricsSnapshot, QAStrategy, QADimensionScores } from './qaTypes.js';

const MAX_RECORDS = 500;

interface MetricsRecord {
  strategy:   QAStrategy;
  score:      number;
  dimensions: Partial<QADimensionScores>;
}

interface MetricsState {
  records: MetricsRecord[];
}

const state: MetricsState = { records: [] };

export function resetQAMetrics(): void { state.records.length = 0; }

export function recordQABuild(
  strategy:   QAStrategy,
  score:      number,
  dimensions: Partial<QADimensionScores>,
): void {
  state.records.push({ strategy, score, dimensions });
  if (state.records.length > MAX_RECORDS) {
    state.records.splice(0, state.records.length - MAX_RECORDS);
  }
}

function avg(vals: number[]): number {
  if (vals.length === 0) return 0;
  return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
}

export function getQAMetrics(): QAMetricsSnapshot {
  const n = state.records.length;
  if (n === 0) {
    return {
      totalBuilds: 0, averageScore: 0, averageTestingScore: 0,
      averageCoverageScore: 0, averageReliabilityScore: 0, averageA11yScore: 0,
      averagePerfScore: 0, averageSecurityScore: 0, averageRiskScore: 0,
      scoreByDimension: {}, topStrategies: [], learningRecordCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  const scoreByDimension: Partial<QADimensionScores> = {};
  const dims: Array<keyof QADimensionScores> = [
    'testing','coverage','reliability','accessibility',
    'performance','security','responsiveness','compatibility','risk','maintainability',
  ];
  for (const d of dims) {
    const vals = state.records.map(r => r.dimensions[d]).filter((v): v is number => v !== undefined);
    if (vals.length > 0) scoreByDimension[d] = avg(vals);
  }

  const strategyMap = new Map<QAStrategy, number>();
  for (const r of state.records) strategyMap.set(r.strategy, (strategyMap.get(r.strategy) ?? 0) + 1);
  const topStrategies = [...strategyMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([strategy, count]) => ({ strategy, count }));

  return {
    totalBuilds:            n,
    averageScore:           avg(state.records.map(r => r.score)),
    averageTestingScore:    scoreByDimension.testing       ?? 0,
    averageCoverageScore:   scoreByDimension.coverage      ?? 0,
    averageReliabilityScore:scoreByDimension.reliability   ?? 0,
    averageA11yScore:       scoreByDimension.accessibility ?? 0,
    averagePerfScore:       scoreByDimension.performance   ?? 0,
    averageSecurityScore:   scoreByDimension.security      ?? 0,
    averageRiskScore:       scoreByDimension.risk          ?? 0,
    scoreByDimension,
    topStrategies,
    learningRecordCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}
