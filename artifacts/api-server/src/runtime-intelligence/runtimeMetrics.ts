// ── V9.0 Runtime Intelligence — Telemetry Metrics ────────────────────────────
import type { RuntimeDimension, RuntimeQualityScore, GenerationMode } from './runtimeTypes.js';

interface BuildRecord {
  mode:       GenerationMode;
  scores:     Partial<Record<RuntimeDimension, number>>;
  overallScore: number;
  buildTimeMs:  number;
}

const state: { records: BuildRecord[]; learnCount: number } = { records: [], learnCount: 0 };

export function recordRuntimeBuild(
  mode:          GenerationMode,
  qualityScores: RuntimeQualityScore[],
  overallScore:  number,
  buildTimeMs:   number,
): void {
  const scores: Partial<Record<RuntimeDimension, number>> = {};
  for (const qs of qualityScores) scores[qs.dimension] = qs.score;
  state.records.push({ mode, scores, overallScore, buildTimeMs });
  if (state.records.length > 500) state.records.shift();
}

export function recordRuntimeLearning(): void {
  state.learnCount++;
}

export function getRuntimeMetrics(): {
  totalBuilds:             number;
  averageScore:            number;
  averageGenerationTime:   number;
  repairEfficiency:        number;
  evaluationEfficiency:    number;
  optimizationEfficiency:  number;
  tokenEfficiency:         number;
  candidateEfficiency:     number;
  cacheHitRate:            number;
  scoreByDimension:        Partial<Record<RuntimeDimension, number>>;
  strategyDistribution:    Partial<Record<GenerationMode, number>>;
  learningRecordCount:     number;
  lastUpdated:             number;
} {
  const records = state.records;
  const n = records.length;

  if (n === 0) {
    return {
      totalBuilds: 0, averageScore: 0, averageGenerationTime: 0,
      repairEfficiency: 0, evaluationEfficiency: 0, optimizationEfficiency: 0,
      tokenEfficiency: 0, candidateEfficiency: 0, cacheHitRate: 0,
      scoreByDimension: {}, strategyDistribution: {},
      learningRecordCount: state.learnCount, lastUpdated: Date.now(),
    };
  }

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const dimTotals = new Map<RuntimeDimension, number[]>();
  const modeCounts = new Map<GenerationMode, number>();

  for (const rec of records) {
    modeCounts.set(rec.mode, (modeCounts.get(rec.mode) ?? 0) + 1);
    for (const [dim, score] of Object.entries(rec.scores) as [RuntimeDimension, number][]) {
      if (!dimTotals.has(dim)) dimTotals.set(dim, []);
      dimTotals.get(dim)!.push(score);
    }
  }

  const scoreByDimension: Partial<Record<RuntimeDimension, number>> = {};
  for (const [dim, scores] of dimTotals) {
    scoreByDimension[dim] = parseFloat(avg(scores).toFixed(2));
  }

  const strategyDistribution: Partial<Record<GenerationMode, number>> = {};
  for (const [mode, count] of modeCounts) {
    strategyDistribution[mode] = count;
  }

  const allScores = records.map(r => r.overallScore);
  const allTimes  = records.map(r => r.buildTimeMs);

  return {
    totalBuilds:             n,
    averageScore:            parseFloat(avg(allScores).toFixed(2)),
    averageGenerationTime:   parseFloat(avg(allTimes).toFixed(0)),
    // Efficiency metrics derived from scored sub-dimensions
    repairEfficiency:        parseFloat((scoreByDimension.repair ?? 0).toFixed(2)),
    evaluationEfficiency:    parseFloat((scoreByDimension.evaluation ?? 0).toFixed(2)),
    optimizationEfficiency:  parseFloat((scoreByDimension.optimization ?? 0).toFixed(2)),
    tokenEfficiency:         parseFloat((scoreByDimension.context ?? 0).toFixed(2)),
    candidateEfficiency:     parseFloat((scoreByDimension.candidate ?? 0).toFixed(2)),
    cacheHitRate:            parseFloat((scoreByDimension.caching ?? 0).toFixed(2)),
    scoreByDimension,
    strategyDistribution,
    learningRecordCount:     state.learnCount,
    lastUpdated:             Date.now(),
  };
}

export function resetRuntimeMetrics(): void {
  state.records = [];
  state.learnCount = 0;
}
