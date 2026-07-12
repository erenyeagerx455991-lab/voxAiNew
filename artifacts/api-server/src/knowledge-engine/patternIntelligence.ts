// ── V9.4 Pattern Intelligence — component/layout/API pattern registry ─────────

import type { KnowledgeDomain } from './types.js';

export interface PatternRecord {
  id:                string;
  domain:            KnowledgeDomain;
  name:              string;
  description:       string;
  tags:              string[];
  // Quality dimensions (0-10)
  qualityScore:      number;
  performanceScore:  number;
  accessibilityScore: number;
  conversionScore:   number;
  maintainabilityScore: number;
  // Usage statistics
  popularity:        number;  // 0-1
  usageCount:        number;
  productionSuccess: number;  // 0-1
  failureRate:       number;  // 0-1
  repairRate:        number;  // 0-1
  // Metadata
  confidence:        number;  // 0-1
  freshness:         number;  // 0-1
  version:           number;
  registeredAt:      number;
  updatedAt:         number;
}

const MAX_PATTERNS = 500;
let patternStore: PatternRecord[] = [];
let _patSeq = 0;

export function registerPattern(
  domain: KnowledgeDomain,
  name: string,
  description: string,
  tags: string[],
  scores: Partial<Pick<PatternRecord,
    'qualityScore' | 'performanceScore' | 'accessibilityScore' |
    'conversionScore' | 'maintainabilityScore'>>,
): PatternRecord {
  const existing = patternStore.find(p => p.domain === domain && p.name === name);
  if (existing) {
    return updatePattern(existing.id, scores);
  }

  const record: PatternRecord = {
    id:                   `pat-${domain.toLowerCase()}-${++_patSeq}`,
    domain,
    name,
    description,
    tags,
    qualityScore:         scores.qualityScore         ?? 5,
    performanceScore:     scores.performanceScore     ?? 5,
    accessibilityScore:   scores.accessibilityScore   ?? 5,
    conversionScore:      scores.conversionScore      ?? 5,
    maintainabilityScore: scores.maintainabilityScore ?? 5,
    popularity:           0.5,
    usageCount:           1,
    productionSuccess:    0.8,
    failureRate:          0.05,
    repairRate:           0.1,
    confidence:           0.7,
    freshness:            1.0,
    version:              1,
    registeredAt:         Date.now(),
    updatedAt:            Date.now(),
  };

  patternStore.push(record);
  if (patternStore.length > MAX_PATTERNS) patternStore = patternStore.slice(-MAX_PATTERNS);
  return record;
}

export function updatePattern(
  id: string,
  updates: Partial<Pick<PatternRecord,
    'qualityScore' | 'performanceScore' | 'accessibilityScore' |
    'conversionScore' | 'maintainabilityScore' | 'usageCount' |
    'productionSuccess' | 'failureRate' | 'repairRate' | 'popularity'>>,
): PatternRecord {
  const idx = patternStore.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Pattern not found: ${id}`);
  const old = patternStore[idx];
  const updated: PatternRecord = {
    ...old,
    ...updates,
    version:   old.version + 1,
    updatedAt: Date.now(),
    freshness: 1.0,
  };
  patternStore[idx] = updated;
  return updated;
}

export function queryPatterns(domain?: KnowledgeDomain, tags?: string[]): PatternRecord[] {
  let results = domain ? patternStore.filter(p => p.domain === domain) : [...patternStore];
  if (tags && tags.length > 0) {
    const tagSet = new Set(tags.map(t => t.toLowerCase()));
    results = results.filter(p => p.tags.some(t => tagSet.has(t.toLowerCase())));
  }
  return results.sort((a, b) => b.qualityScore - a.qualityScore);
}

export function getTopPatterns(domain?: KnowledgeDomain, topK = 5): PatternRecord[] {
  return queryPatterns(domain).slice(0, topK);
}

export function getAllPatterns(): PatternRecord[] {
  return [...patternStore];
}

export function resetPatternIntelligence(): void {
  patternStore = [];
  _patSeq = 0;
}
