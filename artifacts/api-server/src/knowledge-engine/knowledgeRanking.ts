// ── V9.4 Knowledge Engine — Ranking ────────────────────────────────────────────
//
// Composite 0-10 ranking across the 10 spec factors. Weights sum to 1.00,
// following the same convention as DIRECTOR_WEIGHTS / QUALITY_WEIGHTS in
// other V8.x static engines.
import type { KnowledgeRecord, RankedKnowledgeRecord, KnowledgeRankingFactors } from './types.js';

export const RANKING_WEIGHTS: Record<keyof KnowledgeRankingFactors, number> = {
  quality:            0.16,
  confidence:         0.10,
  freshness:          0.08,
  productionSuccess:  0.14,
  popularity:         0.08,
  repairFrequency:    0.10,
  runtimePerformance: 0.10,
  accessibility:      0.08,
  security:           0.08,
  businessSuccess:    0.08,
};

function assertWeightsSumTo1(): void {
  const sum = Object.values(RANKING_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 0.001) {
    throw new Error(`RANKING_WEIGHTS must sum to 1.00, got ${sum}`);
  }
}
assertWeightsSumTo1();

/** Freshness: 10 = created within the last hour, decaying to 0 over ~30 days. */
function freshnessScore(createdAt: number, now: number): number {
  const ageMs = Math.max(0, now - createdAt);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const decay = Math.max(0, 1 - ageDays / 30);
  return parseFloat((decay * 10).toFixed(2));
}

/** Popularity: normalized against a soft cap of 100 uses -> 10. */
function popularityScore(popularity: number): number {
  return parseFloat(Math.min(10, (popularity / 100) * 10).toFixed(2));
}

export function computeFactors(record: KnowledgeRecord, now = Date.now()): KnowledgeRankingFactors {
  return {
    quality:            record.quality,
    confidence:         record.confidence * 10,
    freshness:          freshnessScore(record.createdAt, now),
    productionSuccess:  record.productionSuccess * 10,
    popularity:         popularityScore(record.popularity),
    repairFrequency:    (1 - record.repairRate) * 10, // inverted — fewer repairs is better
    runtimePerformance: record.runtimePerformance,
    accessibility:      record.accessibilityScore,
    security:           record.securityScore,
    businessSuccess:    record.businessSuccess,
  };
}

export function compositeScore(factors: KnowledgeRankingFactors): number {
  let score = 0;
  for (const key of Object.keys(RANKING_WEIGHTS) as (keyof KnowledgeRankingFactors)[]) {
    score += factors[key] * RANKING_WEIGHTS[key];
  }
  return parseFloat(score.toFixed(2));
}

export function rankKnowledge(records: KnowledgeRecord[], now = Date.now()): RankedKnowledgeRecord[] {
  return records
    .map(r => {
      const factorBreakdown = computeFactors(r, now);
      return { ...r, factorBreakdown, compositeScore: compositeScore(factorBreakdown) };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}
