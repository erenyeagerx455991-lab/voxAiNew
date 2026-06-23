import { globalMetrics } from "./metricsProvider.js";
import { MAX_DURATION_SAMPLES } from "./constants.js";

export interface EvaluatorScoreInput {
  buildId: string;
  overallScore: number;
  heroScore: number;
  layoutScore: number;
  ctaScore: number;
  accessibilityScore: number;
  shadcnScore: number;
  consistencyScore: number;
  repairCount: number;
  repairApplied: boolean;
}

interface EvaluatorRecord extends EvaluatorScoreInput {
  recordedAt: number;
}

const records: EvaluatorRecord[] = [];
let totalRecorded = 0;
let sumOverall = 0;
let sumHero = 0;
let sumLayout = 0;
let sumCta = 0;
let sumAccessibility = 0;
let sumShadcn = 0;
let sumConsistency = 0;
let totalRepairPasses = 0;
let buildsRepaired = 0;

const scoreDistribution = {
  excellent: 0,
  productionReady: 0,
  good: 0,
  needsImprovement: 0,
  repairRequired: 0,
};

function cappedPush<T>(arr: T[], value: T): void {
  arr.push(value);
  if (arr.length > MAX_DURATION_SAMPLES) arr.shift();
}

export function recordEvaluatorScore(input: EvaluatorScoreInput): void {
  cappedPush(records, { ...input, recordedAt: Date.now() });
  totalRecorded++;

  sumOverall += input.overallScore;
  sumHero += input.heroScore;
  sumLayout += input.layoutScore;
  sumCta += input.ctaScore;
  sumAccessibility += input.accessibilityScore;
  sumShadcn += input.shadcnScore;
  sumConsistency += input.consistencyScore;
  totalRepairPasses += input.repairCount;
  if (input.repairApplied) buildsRepaired++;

  if (input.overallScore >= 9.0) scoreDistribution.excellent++;
  else if (input.overallScore >= 8.5) scoreDistribution.productionReady++;
  else if (input.overallScore >= 8.0) scoreDistribution.good++;
  else if (input.overallScore >= 7.0) scoreDistribution.needsImprovement++;
  else scoreDistribution.repairRequired++;

  globalMetrics.increment("evaluator.total");
  if (input.overallScore >= 8.0) globalMetrics.increment("evaluator.passed");
  if (input.repairApplied) globalMetrics.increment("evaluator.repaired");

  syncSnapshot();
}

function avg(sum: number): number {
  return totalRecorded > 0 ? Math.round((sum / totalRecorded) * 100) / 100 : 0;
}

function syncSnapshot(): void {
  globalMetrics.setSection('runtime', {
    evaluator: {
      totalEvaluated: totalRecorded,
      averages: {
        overallScore: avg(sumOverall),
        heroScore: avg(sumHero),
        layoutScore: avg(sumLayout),
        ctaScore: avg(sumCta),
        accessibilityScore: avg(sumAccessibility),
        shadcnScore: avg(sumShadcn),
        consistencyScore: avg(sumConsistency),
      },
      repairStats: {
        totalRepairPasses,
        buildsRepaired,
        repairRate: totalRecorded > 0
          ? ((buildsRepaired / totalRecorded) * 100).toFixed(1) + '%'
          : 'n/a',
        avgRepairPassesPerBuild: totalRecorded > 0
          ? Math.round((totalRepairPasses / totalRecorded) * 10) / 10
          : 0,
      },
      thresholds: {
        repairThreshold: 8.0,
        excellent: '≥ 9.0',
        productionReady: '8.5–8.9',
        good: '8.0–8.4',
        needsImprovement: '7.0–7.9',
        repairRequired: '< 7.0',
      },
      scoreDistribution,
      recent: records.slice(-20).map(r => ({
        buildId: r.buildId,
        overallScore: r.overallScore,
        heroScore: r.heroScore,
        repairCount: r.repairCount,
        repairApplied: r.repairApplied,
        recordedAt: r.recordedAt,
      })),
    },
  });
}

export function getEvaluatorMetrics(): Record<string, unknown> {
  syncSnapshot();
  const snap = globalMetrics.snapshot();
  return (snap.runtime as Record<string, unknown>).evaluator as Record<string, unknown> ?? {};
}

export function resetEvaluatorMetrics(): void {
  records.length = 0;
  totalRecorded = 0;
  sumOverall = sumHero = sumLayout = sumCta = sumAccessibility = sumShadcn = sumConsistency = 0;
  totalRepairPasses = 0;
  buildsRepaired = 0;
  scoreDistribution.excellent = scoreDistribution.productionReady = scoreDistribution.good =
    scoreDistribution.needsImprovement = scoreDistribution.repairRequired = 0;
}
