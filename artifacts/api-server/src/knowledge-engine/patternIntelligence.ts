// ── V9.4 Knowledge Engine — Pattern Intelligence ──────────────────────────────
//
// Tracks reusable patterns (component shapes, layouts, API designs, etc.)
// with the 13 spec fields: Quality/Performance/Accessibility/Conversion/
// Maintainability scores, Popularity, UsageCount, ProductionSuccess,
// FailureRate, RepairRate, Confidence, Freshness, Version.
import type { KnowledgeDomain, PatternRecord } from './types.js';

const MAX_PATTERNS = 1000;
let patterns = new Map<string, PatternRecord>();

export interface PatternUpdateInput {
  id:                 string;
  domain:             KnowledgeDomain;
  name:               string;
  qualityScore?:       number;
  performanceScore?:   number;
  accessibilityScore?: number;
  conversionScore?:    number;
  maintainabilityScore?: number;
  productionSuccess?:  boolean;
  failed?:             boolean;
  repaired?:           boolean;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function registerPattern(input: PatternUpdateInput): PatternRecord {
  const now = Date.now();
  const existing = patterns.get(input.id);

  if (!existing) {
    const record: PatternRecord = {
      id:                   input.id,
      domain:               input.domain,
      name:                 input.name,
      qualityScore:         input.qualityScore ?? 5,
      performanceScore:     input.performanceScore ?? 5,
      accessibilityScore:   input.accessibilityScore ?? 5,
      conversionScore:      input.conversionScore ?? 5,
      maintainabilityScore: input.maintainabilityScore ?? 5,
      popularity:           0.01,
      usageCount:           1,
      productionSuccess:    input.productionSuccess ? 1 : 0.5,
      failureRate:          input.failed ? 1 : 0,
      repairRate:           input.repaired ? 1 : 0,
      confidence:           0.3,
      freshness:            1,
      version:              1,
      updatedAt:            now,
    };
    try {
      patterns.set(input.id, record);
      if (patterns.size > MAX_PATTERNS) {
        const oldestKey = [...patterns.values()].sort((a, b) => a.updatedAt - b.updatedAt)[0]?.id;
        if (oldestKey) patterns.delete(oldestKey);
      }
    } catch { /* pattern registration must never stop a build */ }
    return record;
  }

  const usageCount = existing.usageCount + 1;
  const blend = (prev: number, next: number | undefined) =>
    next === undefined ? prev : parseFloat(((prev * existing.usageCount + next) / usageCount).toFixed(3));

  const updated: PatternRecord = {
    ...existing,
    qualityScore:         blend(existing.qualityScore, input.qualityScore),
    performanceScore:     blend(existing.performanceScore, input.performanceScore),
    accessibilityScore:   blend(existing.accessibilityScore, input.accessibilityScore),
    conversionScore:      blend(existing.conversionScore, input.conversionScore),
    maintainabilityScore: blend(existing.maintainabilityScore, input.maintainabilityScore),
    usageCount,
    popularity:           clamp01(Math.min(1, usageCount / 100)),
    productionSuccess:    clamp01(
      (existing.productionSuccess * existing.usageCount + (input.productionSuccess ? 1 : 0)) / usageCount,
    ),
    failureRate: clamp01(
      (existing.failureRate * existing.usageCount + (input.failed ? 1 : 0)) / usageCount,
    ),
    repairRate: clamp01(
      (existing.repairRate * existing.usageCount + (input.repaired ? 1 : 0)) / usageCount,
    ),
    confidence: clamp01(Math.min(1, 0.3 + usageCount * 0.02)),
    freshness:  1,
    version:    existing.version + 1,
    updatedAt:  now,
  };

  try {
    patterns.set(input.id, updated);
  } catch { /* pattern registration must never stop a build */ }
  return updated;
}

export function getPattern(id: string): PatternRecord | undefined {
  return patterns.get(id);
}

export function listPatterns(domain?: KnowledgeDomain): PatternRecord[] {
  const all = [...patterns.values()];
  return domain ? all.filter(p => p.domain === domain) : all;
}

export function getTopPatterns(domain?: KnowledgeDomain, limit = 5): PatternRecord[] {
  return listPatterns(domain)
    .sort((a, b) =>
      (b.qualityScore + b.performanceScore + b.accessibilityScore + b.conversionScore + b.maintainabilityScore) -
      (a.qualityScore + a.performanceScore + a.accessibilityScore + a.conversionScore + a.maintainabilityScore),
    )
    .slice(0, limit);
}

export function resetPatternIntelligence(): void {
  patterns = new Map();
}
