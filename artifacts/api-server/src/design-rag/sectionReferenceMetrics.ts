// ── V7.2.3 Section Reference Metrics Store ───────────────────────────────────
// Self-improving section retrieval: tracks per-reference outcomes and feeds
// quality scores back into ranking. No database required.

import type { SectionType } from './sectionCorpus.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SectionReferenceMetrics {
  referenceId:     string;
  sectionType:     SectionType;
  usageCount:      number;
  successCount:    number;     // overallScore >= 8.5
  repairCount:     number;     // repairTriggered = true
  avgScore:        number;
  avgAccessibility: number;
  avgLayout:       number;
  avgCTA:          number;
  avgHero:         number;
  avgConsistency:  number;
  lastUsedAt:      number;
  qualityScore:    number;     // computed; default 5 (cold-start neutral)
  priority:        'promoted' | 'normal' | 'demoted';
  // Private accumulators
  _outcomeCount:   number;
  _sumScore:       number;
  _sumAccessibility: number;
  _sumLayout:      number;
  _sumCTA:         number;
  _sumHero:        number;
  _sumConsistency: number;
}

export interface SectionOutcomeInput {
  referenceId:       string;
  sectionType:       SectionType;
  overallScore:      number;
  heroScore:         number;
  layoutScore:       number;
  ctaScore:          number;
  accessibilityScore: number;
  consistencyScore:  number;
  repairTriggered:   boolean;
}

export interface SectionReferenceSummary {
  referenceId:  string;
  sectionType:  SectionType;
  qualityScore: number;
  usageCount:   number;
  successRate:  number;
  repairRate:   number;
  priority:     'promoted' | 'normal' | 'demoted';
}

// ── In-memory store ───────────────────────────────────────────────────────────

const _store = new Map<string, SectionReferenceMetrics>();
let _promotedCount = 0;
let _demotedCount  = 0;

// ── Phase 3 — Quality Score Formula ──────────────────────────────────────────
//
// qualityScore =
//   overallScore       × 0.40
//   accessibilityScore × 0.20
//   layoutScore        × 0.15
//   ctaScore           × 0.10
//   heroScore          × 0.10
//   (1 − repairRate)×10 × 0.05
//
// Promotion adds +1.5 (cap 10). Demotion subtracts −2.0 (floor 0).
// New references with no outcomes return a neutral 5.0.

export function calculateSectionQuality(m: SectionReferenceMetrics): number {
  if (m._outcomeCount === 0) return 5.0;

  const repairRate = m.repairCount / m._outcomeCount;

  let score =
    m.avgScore         * 0.40 +
    m.avgAccessibility * 0.20 +
    m.avgLayout        * 0.15 +
    m.avgCTA           * 0.10 +
    m.avgHero          * 0.10 +
    (1 - repairRate) * 10 * 0.05;

  if (m.priority === 'promoted') score = Math.min(10, score + 1.5);
  if (m.priority === 'demoted')  score = Math.max(0,  score - 2.0);

  return Math.round(Math.max(0, Math.min(10, score)) * 100) / 100;
}

// ── Phases 5–6 — Auto Promotion / Demotion ───────────────────────────────────

function applyPromotionDemotion(m: SectionReferenceMetrics): void {
  if (m._outcomeCount < 5) return;

  const repairRate  = m.repairCount / m._outcomeCount;
  const wasPromoted = m.priority === 'promoted';
  const wasDemoted  = m.priority === 'demoted';

  if (m.avgScore >= 9 && repairRate < 0.15) {
    m.priority = 'promoted';
    if (!wasPromoted) _promotedCount++;
  } else if (m.avgScore < 7 || repairRate > 0.50) {
    m.priority = 'demoted';
    if (!wasDemoted) _demotedCount++;
  } else {
    m.priority = 'normal';
  }
}

// ── Phase 2 — Outcome Recording ───────────────────────────────────────────────

export function recordSectionOutcome(input: SectionOutcomeInput): void {
  let m = _store.get(input.referenceId);
  if (!m) {
    m = {
      referenceId:      input.referenceId,
      sectionType:      input.sectionType,
      usageCount:       0,
      successCount:     0,
      repairCount:      0,
      avgScore:         0,
      avgAccessibility: 0,
      avgLayout:        0,
      avgCTA:           0,
      avgHero:          0,
      avgConsistency:   0,
      lastUsedAt:       0,
      qualityScore:     5.0,
      priority:         'normal',
      _outcomeCount:    0,
      _sumScore:        0,
      _sumAccessibility: 0,
      _sumLayout:       0,
      _sumCTA:          0,
      _sumHero:         0,
      _sumConsistency:  0,
    };
    _store.set(input.referenceId, m);
  }

  m.usageCount++;
  m._outcomeCount++;
  m.lastUsedAt = Date.now();

  m._sumScore         += input.overallScore;
  m._sumAccessibility += input.accessibilityScore;
  m._sumLayout        += input.layoutScore;
  m._sumCTA           += input.ctaScore;
  m._sumHero          += input.heroScore;
  m._sumConsistency   += input.consistencyScore;

  m.avgScore         = m._sumScore         / m._outcomeCount;
  m.avgAccessibility = m._sumAccessibility / m._outcomeCount;
  m.avgLayout        = m._sumLayout        / m._outcomeCount;
  m.avgCTA           = m._sumCTA           / m._outcomeCount;
  m.avgHero          = m._sumHero          / m._outcomeCount;
  m.avgConsistency   = m._sumConsistency   / m._outcomeCount;

  if (input.overallScore >= 8.5) m.successCount++;
  if (input.repairTriggered)     m.repairCount++;

  m.qualityScore = calculateSectionQuality(m);
  applyPromotionDemotion(m);
  m.qualityScore = calculateSectionQuality(m); // recompute after priority change
}

// ── Public accessor — used by sectionRetriever.ts ────────────────────────────

export function getSectionQualityScore(referenceId: string): number {
  const m = _store.get(referenceId);
  return m ? m.qualityScore : 5.0;
}

// ── Phase 7 — Section Leaderboards ───────────────────────────────────────────

function toSummary(m: SectionReferenceMetrics): SectionReferenceSummary {
  return {
    referenceId:  m.referenceId,
    sectionType:  m.sectionType,
    qualityScore: m.qualityScore,
    usageCount:   m.usageCount,
    successRate:  m._outcomeCount > 0
      ? Math.round((m.successCount / m._outcomeCount) * 1000) / 1000
      : 0,
    repairRate:   m._outcomeCount > 0
      ? Math.round((m.repairCount  / m._outcomeCount) * 1000) / 1000
      : 0,
    priority:     m.priority,
  };
}

function topForPrefix(prefix: string, limit = 20): SectionReferenceSummary[] {
  return [..._store.values()]
    .filter(m => m.referenceId.startsWith(prefix))
    .sort((a, b) => b.qualityScore - a.qualityScore || b.usageCount - a.usageCount)
    .slice(0, limit)
    .map(toSummary);
}

export function getTopHeroReferences(limit = 20):        SectionReferenceSummary[] { return topForPrefix('hero-',         limit); }
export function getTopFeatureReferences(limit = 20):     SectionReferenceSummary[] { return topForPrefix('features-',     limit); }
export function getTopPricingReferences(limit = 20):     SectionReferenceSummary[] { return topForPrefix('pricing-',      limit); }
export function getTopTestimonialReferences(limit = 20): SectionReferenceSummary[] { return topForPrefix('testimonials-', limit); }
export function getTopCTAReferences(limit = 20):         SectionReferenceSummary[] { return topForPrefix('cta-',          limit); }

// ── V7.3.5 — Section Leaderboards ────────────────────────────────────────────

export function getSectionLeaderboard(sectionType: SectionType, limit = 10): SectionReferenceSummary[] {
  return [..._store.values()]
    .filter(m => m.sectionType === sectionType)
    .sort((a, b) => b.qualityScore - a.qualityScore || b.usageCount - a.usageCount)
    .slice(0, limit)
    .map(toSummary);
}

export function getAllSectionLeaderboards(limit = 5): Record<string, SectionReferenceSummary[]> {
  const ALL_TYPES: SectionType[] = ['hero', 'features', 'pricing', 'testimonials', 'cta', 'navbar', 'footer', 'dashboard', 'faq'];
  const result: Record<string, SectionReferenceSummary[]> = {};
  for (const type of ALL_TYPES) {
    const board = getSectionLeaderboard(type, limit);
    if (board.length > 0) result[type] = board;
  }
  return result;
}

// ── Phase 8 — Telemetry ───────────────────────────────────────────────────────

export function getSectionLearningMetrics() {
  const all          = [..._store.values()];
  const withOutcomes = all.filter(m => m._outcomeCount > 0);

  const averageQualityScore =
    withOutcomes.length > 0
      ? Math.round(
          (withOutcomes.reduce((s, m) => s + m.qualityScore, 0) / withOutcomes.length) * 100,
        ) / 100
      : 0;

  const averageRepairRate =
    withOutcomes.length > 0
      ? Math.round(
          (withOutcomes.reduce((s, m) => s + m.repairCount / m._outcomeCount, 0) / withOutcomes.length) * 1000,
        ) / 1000
      : 0;

  return {
    referencesTracked:    all.length,
    topHeroReferences:    getTopHeroReferences(5),
    topPricingReferences: getTopPricingReferences(5),
    topFeatureReferences: getTopFeatureReferences(5),
    topCTAReferences:     getTopCTAReferences(5),
    promotedCount:        _promotedCount,
    demotedCount:         _demotedCount,
    averageQualityScore,
    averageRepairRate,
  };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetSectionReferenceMetrics(): void {
  _store.clear();
  _promotedCount = 0;
  _demotedCount  = 0;
}

export function getSectionReferenceEntry(id: string): SectionReferenceMetrics | undefined {
  return _store.get(id);
}

export function getSectionStoreSize(): number {
  return _store.size;
}
