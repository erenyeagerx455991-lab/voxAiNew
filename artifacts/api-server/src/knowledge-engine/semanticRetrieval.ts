// ── V9.4 Semantic Retrieval — deterministic keyword/tag overlap scoring ────────

import type { KnowledgeRecord, KnowledgeDomain } from './types.js';

export interface SemanticQuery {
  text:    string;
  domain?: KnowledgeDomain;
  tags?:   string[];
}

export interface ScoredKnowledgeRecord extends KnowledgeRecord {
  relevanceScore: number;
  scoreBreakdown: {
    tagOverlap:     number;
    categoryMatch:  number;
    keywordMatch:   number;
    domainBonus:    number;
    qualityBoost:   number;
  };
}

// Weights for relevance scoring components (sum = 1.00)
const RELEVANCE_WEIGHTS = {
  tagOverlap:    0.30,
  categoryMatch: 0.20,
  keywordMatch:  0.30,
  domainBonus:   0.10,
  qualityBoost:  0.10,
} as const;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function overlapScore(queryTokens: string[], recordTokens: string[]): number {
  if (queryTokens.length === 0 || recordTokens.length === 0) return 0;
  const querySet = new Set(queryTokens);
  const recordSet = new Set(recordTokens);
  let matches = 0;
  for (const t of querySet) {
    if (recordSet.has(t)) matches++;
  }
  // Jaccard similarity
  const union = new Set([...querySet, ...recordSet]).size;
  return union === 0 ? 0 : matches / union;
}

function tagOverlapScore(queryTags: string[], recordTags: string[]): number {
  if (queryTags.length === 0 || recordTags.length === 0) return 0;
  const querySet = new Set(queryTags.map(t => t.toLowerCase()));
  let hits = 0;
  for (const t of recordTags) {
    if (querySet.has(t.toLowerCase())) hits++;
  }
  return Math.min(1, hits / Math.max(queryTags.length, 1));
}

export function retrieveKnowledge(
  query: SemanticQuery,
  corpus: KnowledgeRecord[],
  topK = 10,
): ScoredKnowledgeRecord[] {
  const queryTokens = tokenize(query.text);
  const queryTags   = (query.tags ?? []).map(t => t.toLowerCase());
  const queryDomain = query.domain;

  const scored: ScoredKnowledgeRecord[] = corpus.map(record => {
    // Tag overlap
    const tagOverlap = tagOverlapScore(
      [...queryTags, ...queryTokens],
      record.tags,
    );

    // Category match (exact domain match in categories)
    const categoryMatch = record.categories
      .map(c => c.toLowerCase())
      .some(c => queryTokens.includes(c) || (queryDomain && c === queryDomain.toLowerCase()))
      ? 1.0
      : tagOverlapScore(queryTokens, record.categories);

    // Keyword match (token overlap with record keywords)
    const keywordMatch = overlapScore(queryTokens, record.keywords);

    // Domain bonus
    const domainBonus = queryDomain && record.domain === queryDomain ? 1.0 : 0.0;

    // Quality boost (normalized 0-1)
    const qualityBoost = record.quality / 10;

    const relevanceScore =
      RELEVANCE_WEIGHTS.tagOverlap    * tagOverlap    +
      RELEVANCE_WEIGHTS.categoryMatch * categoryMatch +
      RELEVANCE_WEIGHTS.keywordMatch  * keywordMatch  +
      RELEVANCE_WEIGHTS.domainBonus   * domainBonus   +
      RELEVANCE_WEIGHTS.qualityBoost  * qualityBoost;

    return {
      ...record,
      relevanceScore: parseFloat(relevanceScore.toFixed(4)),
      scoreBreakdown: { tagOverlap, categoryMatch, keywordMatch, domainBonus, qualityBoost },
    };
  });

  return scored
    .filter(r => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}
