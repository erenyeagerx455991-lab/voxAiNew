// ── V9.0 Runtime Intelligence — Telemetry Metrics ────────────────────────────
import type { RuntimeDimension, RuntimeQualityScore, GenerationMode } from './runtimeTypes.js';

interface BuildRecord {
  mode:       GenerationMode;
  scores:     Partial<Record<RuntimeDimension, number>>;
  overallScore: number;
  buildTimeMs:  number;
}

const state: { records: BuildRecord[]; learnCount: number } = { records: [], learnCount: 0 };

// ── V9.1 Runtime Intelligence Activation — evaluator weight usage telemetry ──
interface WeightUsageEvent {
  profile:  string;
  weights:  Record<string, number>;
  dynamic:  boolean;
  recordedAt: number;
}
const weightUsageState: { events: WeightUsageEvent[] } = { events: [] };

/** Called by the Design Evaluator step every time it scores a build. */
export function recordEvaluatorWeightUsage(
  profile:  string,
  weights:  Record<string, number>,
  dynamic:  boolean,
): void {
  weightUsageState.events.push({ profile, weights, dynamic, recordedAt: Date.now() });
  if (weightUsageState.events.length > 500) weightUsageState.events.shift();
}

export function getEvaluatorWeightStats(): {
  totalEvaluations:          number;
  dynamicWeightUsage:        number;    // count of evaluations scored with dynamic (runtime) weights
  weightActivationRate:      number;    // 0–1
  weightOverrides:           number;    // alias of dynamicWeightUsage — times the static default was overridden
  projectTypeDistribution:   Record<string, number>;
  averageWeightsUsed:        Record<string, number>; // averaged across dynamic evaluations, per category
} {
  const events = weightUsageState.events;
  const n = events.length;
  if (n === 0) {
    return {
      totalEvaluations: 0, dynamicWeightUsage: 0, weightActivationRate: 0,
      weightOverrides: 0, projectTypeDistribution: {}, averageWeightsUsed: {},
    };
  }

  const projectTypeDistribution: Record<string, number> = {};
  const weightSums = new Map<string, number>();
  const weightCounts = new Map<string, number>();
  let dynamicCount = 0;

  for (const ev of events) {
    projectTypeDistribution[ev.profile] = (projectTypeDistribution[ev.profile] ?? 0) + 1;
    if (ev.dynamic) {
      dynamicCount++;
      for (const [cat, w] of Object.entries(ev.weights)) {
        weightSums.set(cat, (weightSums.get(cat) ?? 0) + w);
        weightCounts.set(cat, (weightCounts.get(cat) ?? 0) + 1);
      }
    }
  }

  const averageWeightsUsed: Record<string, number> = {};
  for (const [cat, sum] of weightSums) {
    averageWeightsUsed[cat] = parseFloat((sum / (weightCounts.get(cat) ?? 1)).toFixed(4));
  }

  return {
    totalEvaluations:        n,
    dynamicWeightUsage:      dynamicCount,
    weightActivationRate:    parseFloat((dynamicCount / n).toFixed(3)),
    weightOverrides:         dynamicCount,
    projectTypeDistribution,
    averageWeightsUsed,
  };
}

export function resetEvaluatorWeightUsage(): void {
  weightUsageState.events.length = 0;
}

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
  weightUsageState.events.length = 0;
}
