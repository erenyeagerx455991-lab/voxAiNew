// ── V8.4 Product Manager — Telemetry Metrics ──────────────────────────────────
// Tracks product plan quality across builds for GET /api/telemetry/quality.

import type { ProductGoal, BusinessObjective, UserPersona, ProductLearningRecord } from './productTypes.js';
import { getProductLearningTrend } from './productLearning.js';

// ── Run Record ────────────────────────────────────────────────────────────────

interface ProductRunRecord {
  buildId:           string;
  productGoal:       ProductGoal;
  businessObjective: BusinessObjective;
  overallScore:      number;
  featureCount:      number;
  riskCount:         number;
  personaCount:      number;
  confidence:        number;
  recordedAt:        number;
}

// ── In-memory State ───────────────────────────────────────────────────────────

const _history: ProductRunRecord[] = [];
const MAX_HISTORY = 100;

const _goalFrequency = new Map<ProductGoal, number>();
const _personaFrequency = new Map<UserPersona, number>();
const _featureSuccess = new Map<string, { used: number; successful: number }>();

// ── Record API ─────────────────────────────────────────────────────────────────

export interface RecordProductRunInput {
  buildId:           string;
  productGoal:       ProductGoal;
  businessObjective: BusinessObjective;
  overallScore:      number;
  featureCount:      number;
  riskCount:         number;
  personaCount:      number;
  confidence:        number;
  personas:          UserPersona[];
  features:          string[];
}

export function recordProductRun(input: RecordProductRunInput): void {
  const { buildId, productGoal, businessObjective, overallScore, featureCount, riskCount, personaCount, confidence, personas, features } = input;

  _history.push({ buildId, productGoal, businessObjective, overallScore, featureCount, riskCount, personaCount, confidence, recordedAt: Date.now() });
  if (_history.length > MAX_HISTORY) _history.shift();

  _goalFrequency.set(productGoal, (_goalFrequency.get(productGoal) ?? 0) + 1);

  for (const p of personas) {
    _personaFrequency.set(p, (_personaFrequency.get(p) ?? 0) + 1);
  }

  for (const f of features) {
    const existing = _featureSuccess.get(f) ?? { used: 0, successful: 0 };
    existing.used += 1;
    if (overallScore >= 7) existing.successful += 1;
    _featureSuccess.set(f, existing);
  }
}

// ── Telemetry Snapshot ─────────────────────────────────────────────────────────

export function getProductMetrics() {
  const recent = _history.slice(-20);
  const total  = recent.length;

  if (total === 0) {
    return {
      runsTracked:           0,
      averageProductScore:   0,
      averageFeatureCount:   0,
      averageRiskCount:      0,
      businessGoalDistribution: {} as Record<string, number>,
      mostCommonPersonas:    [] as string[],
      topPlannedFeatures:    [] as string[],
      planningAccuracy:      0,
      learningTrend:         'stable',
      roadmapStatistics:     { avgMvpSize: 0, avgPhase2Size: 0 },
      featureSuccessRate:    {} as Record<string, number>,
      recentScores:          [] as object[],
    };
  }

  const avg = (key: keyof ProductRunRecord) =>
    Math.round(recent.reduce((s, r) => s + (r[key] as number), 0) / total * 10) / 10;

  // Goal distribution
  const businessGoalDistribution: Record<string, number> = {};
  for (const [goal, count] of _goalFrequency.entries()) {
    businessGoalDistribution[goal] = count;
  }

  // Most common personas
  const mostCommonPersonas = [..._personaFrequency.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([p]) => p);

  // Top planned features
  const topPlannedFeatures = [..._featureSuccess.entries()]
    .sort(([, a], [, b]) => b.used - a.used)
    .slice(0, 10)
    .map(([f]) => f);

  // Planning accuracy (score >= 7 = accurate plan)
  const successCount = recent.filter(r => r.overallScore >= 7).length;
  const planningAccuracy = Math.round((successCount / total) * 100);

  // Feature success rates
  const featureSuccessRate: Record<string, number> = {};
  for (const [feat, { used, successful }] of _featureSuccess.entries()) {
    featureSuccessRate[feat] = Math.round((successful / used) * 100);
  }

  return {
    runsTracked:             total,
    averageProductScore:     avg('overallScore'),
    averageFeatureCount:     avg('featureCount'),
    averageRiskCount:        avg('riskCount'),
    businessGoalDistribution,
    mostCommonPersonas,
    topPlannedFeatures,
    planningAccuracy,
    learningTrend:           getProductLearningTrend(),
    roadmapStatistics:       { avgMvpSize: avg('featureCount'), avgPhase2Size: 3 },
    featureSuccessRate,
    recentScores: recent.slice(-5).map(r => ({
      overallScore:      r.overallScore,
      productGoal:       r.productGoal,
      businessObjective: r.businessObjective,
      riskCount:         r.riskCount,
    })),
  };
}

export function resetProductMetrics(): void {
  _history.length = 0;
  _goalFrequency.clear();
  _personaFrequency.clear();
  _featureSuccess.clear();
}
