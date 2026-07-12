// ── V9.4 Knowledge Ranking — 10-factor weighted composite score ───────────────

import type { KnowledgeRecord, KnowledgeRankingFactors } from './types.js';

// Weights sum to 1.00
export const RANKING_WEIGHTS: Record<keyof KnowledgeRankingFactors, number> = {
  quality:          0.20,
  confidence:       0.12,
  freshness:        0.10,
  productionSuccess: 0.15,
  popularity:       0.08,
  repairFrequency:  0.08,
  runtimePerf:      0.10,
  accessibility:    0.07,
  security:         0.05,
  businessSuccess:  0.05,
};

export interface RankedKnowledgeRecord extends KnowledgeRecord {
  compositeScore: number; // 0-10
  rankFactors:    KnowledgeRankingFactors;
}

function normalizeRepairFrequency(freq: number): number {
  // Lower repair frequency is better — invert it
  return Math.max(0, 1 - freq);
}

export function computeRankingFactors(record: KnowledgeRecord): KnowledgeRankingFactors {
  return {
    quality:          record.quality / 10,
    confidence:       record.confidence,
    freshness:        record.freshness,
    productionSuccess: record.productionSuccess,
    popularity:       record.popularity,
    repairFrequency:  normalizeRepairFrequency(record.repairFrequency),
    runtimePerf:      record.runtimePerf / 10,
    accessibility:    record.accessibility / 10,
    security:         record.security / 10,
    businessSuccess:  record.businessSuccess / 10,
  };
}

export function computeCompositeScore(factors: KnowledgeRankingFactors): number {
  let score = 0;
  for (const [k, weight] of Object.entries(RANKING_WEIGHTS) as [keyof KnowledgeRankingFactors, number][]) {
    score += weight * (factors[k] ?? 0);
  }
  // Normalize to 0-10
  return parseFloat((score * 10).toFixed(3));
}

export function rankKnowledge(records: KnowledgeRecord[]): RankedKnowledgeRecord[] {
  return records
    .map(record => {
      const rankFactors    = computeRankingFactors(record);
      const compositeScore = computeCompositeScore(rankFactors);
      return { ...record, compositeScore, rankFactors };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);
}

export function getRankingWeightsSum(): number {
  return Object.values(RANKING_WEIGHTS).reduce((s, w) => s + w, 0);
}
