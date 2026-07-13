// ── V9.4 Knowledge Engine — Semantic Retrieval ────────────────────────────────
//
// Deterministic "semantic" retrieval via weighted tag/category/keyword
// overlap scoring — NOT real embeddings (no vector DB / embedding API
// configured). Mirrors the scoring-heuristic style used by design-rag's
// retriever.ts and costIntelligence.ts.
import type { KnowledgeRecord, SemanticQuery, SemanticRetrievalResult, RetrievedKnowledge } from './types.js';
import { getAllKnowledgeRecords } from './knowledgeCollector.js';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'is', 'are', 'be', 'this', 'that', 'like',
]);

export function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function overlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const hits = a.filter(t => setB.has(t)).length;
  return hits / Math.max(a.length, 1);
}

export function scoreRecord(query: SemanticQuery, record: KnowledgeRecord): number {
  const queryTerms = extractTerms(query.text);
  const recordTerms = [...extractTerms(record.title), ...extractTerms(record.summary), ...record.tags.map(t => t.toLowerCase())];

  const textScore = overlapScore(queryTerms, recordTerms);
  const tagScore = query.tags && query.tags.length > 0
    ? overlapScore(query.tags.map(t => t.toLowerCase()), record.tags.map(t => t.toLowerCase()))
    : 0;
  const domainScore = query.domain ? (query.domain === record.domain ? 1 : 0) : 0.5;

  // Weighted blend: text relevance dominates, domain match and tag overlap refine it.
  const raw = textScore * 0.5 + tagScore * 0.3 + domainScore * 0.2;
  // Quality/confidence act as a mild tiebreaker boost, never overriding relevance.
  const qualityBoost = (record.quality / 10) * 0.1;
  return Math.min(1, raw * 0.9 + qualityBoost);
}

export function retrieveKnowledge(query: SemanticQuery, records?: KnowledgeRecord[]): SemanticRetrievalResult {
  const pool = records ?? getAllKnowledgeRecords();
  const filtered = query.domain ? pool.filter(r => r.domain === query.domain) : pool;

  const scored: RetrievedKnowledge[] = filtered
    .map(r => ({ ...r, relevanceScore: scoreRecord(query, r) }))
    .filter(r => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const limit = query.limit ?? 10;
  return {
    query,
    results: scored.slice(0, limit),
    totalScanned: pool.length,
  };
}

/** Coverage = fraction of known domains that currently have >= 1 record. */
export function getSemanticCoverage(totalDomains: number, records?: KnowledgeRecord[]): number {
  const pool = records ?? getAllKnowledgeRecords();
  const covered = new Set(pool.map(r => r.domain)).size;
  return totalDomains > 0 ? parseFloat((covered / totalDomains).toFixed(3)) : 0;
}
