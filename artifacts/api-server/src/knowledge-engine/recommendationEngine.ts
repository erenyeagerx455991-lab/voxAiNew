// ── V9.4 Knowledge Engine — Recommendation Engine ─────────────────────────────
//
// Recommends better components/layouts/APIs/architecture/deployment/testing/
// security/runtime/performance/UX/conversion choices based on accumulated
// pattern intelligence + knowledge ranking.
import type { KnowledgeDomain, RecommendationResult, RecommendationItem } from './types.js';
import { getTopPatterns } from './patternIntelligence.js';
import { rankKnowledge } from './knowledgeRanking.js';
import { getKnowledgeByDomain } from './knowledgeCollector.js';

export function recommend(domain: KnowledgeDomain, limit = 5): RecommendationResult {
  const topPatterns = getTopPatterns(domain, limit);
  const domainKnowledge = getKnowledgeByDomain(domain);
  const rankedKnowledge = rankKnowledge(domainKnowledge).slice(0, limit);

  const fromPatterns: RecommendationItem[] = topPatterns.map(p => ({
    title:  p.name,
    domain,
    score:  parseFloat(((p.qualityScore + p.performanceScore + p.accessibilityScore + p.conversionScore + p.maintainabilityScore) / 5).toFixed(2)),
    reason: `Pattern used ${p.usageCount}x, production success ${(p.productionSuccess * 100).toFixed(0)}%, repair rate ${(p.repairRate * 100).toFixed(0)}%`,
    patternId: p.id,
  }));

  const fromKnowledge: RecommendationItem[] = rankedKnowledge.map(r => ({
    title:  r.title,
    domain,
    score:  r.compositeScore,
    reason: `Composite score ${r.compositeScore}/10 across quality, production success, and accessibility signals`,
    patternId: null,
  }));

  const merged = [...fromPatterns, ...fromKnowledge]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { domain, suggestions: merged };
}

/** Approximate confidence that recommendations reflect real accumulated signal
 * (rises as more usage/production data accrues; 0 with no data). */
export function getRecommendationAccuracy(domain?: KnowledgeDomain): number {
  const patterns = domain ? getTopPatterns(domain, 1000) : getTopPatterns(undefined, 1000);
  if (patterns.length === 0) return 0;
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
  return parseFloat(avgConfidence.toFixed(3));
}
