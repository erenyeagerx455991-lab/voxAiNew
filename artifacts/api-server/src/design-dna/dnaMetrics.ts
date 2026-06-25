// ── V7.3.5 Design DNA Metrics Store ──────────────────────────────────────────
// Tracks per-dimension performance for all DNA design decisions.
// Keyed by "{dimension}:{value}", e.g. "hero:split-layout", "brand:linear".
// Deterministic — no LLM calls. All data is in-memory, reset between tests.

export interface DesignDNAMetrics {
  id: string;
  usageCount: number;
  averageScore: number;
  averageVisualScore: number;
  averageCriticScore: number;
  averageConversionScore: number;
  averageMotionScore: number;
  averageTokenScore: number;
  averageTreeScore: number;
  successRate: number;
  repairRate: number;
  lastUsedAt: string;
  qualityScore: number;
  priority: 'promoted' | 'normal' | 'demoted';
  promotionHistory: Array<{ action: 'promoted' | 'demoted' | 'reset'; at: string; reason: string }>;
  // Private accumulators
  _n: number;
  _sumScore: number;
  _sumVisual: number;
  _sumCritic: number;
  _sumConversion: number;
  _sumMotion: number;
  _sumToken: number;
  _sumTree: number;
  _successCount: number;
  _repairCount: number;
}

// ── In-memory store ───────────────────────────────────────────────────────────

const _store = new Map<string, DesignDNAMetrics>();
let _totalPromoted = 0;
let _totalDemoted  = 0;

// ── Phase 3 — DNA Quality Formula ────────────────────────────────────────────
//
// qualityScore =
//   overallScore      × 0.35
// + visualScore       × 0.15
// + criticScore       × 0.15
// + conversionScore   × 0.15
// + tokenScore        × 0.05
// + treeScore         × 0.05
// + motionScore       × 0.05
// + (1 - repairRate) × 10 × 0.05
//
// New entries start at 5.0 (neutral, no cold-start penalty).

export interface DNAQualityInput {
  overallScore:     number;
  visualScore:      number;
  criticScore:      number;
  conversionScore:  number;
  tokenScore:       number;
  treeScore:        number;
  motionScore:      number;
  repairRate:       number;
}

export function calculateDNAQuality(input: DNAQualityInput): number {
  const {
    overallScore, visualScore, criticScore, conversionScore,
    tokenScore, treeScore, motionScore, repairRate,
  } = input;

  const raw =
    overallScore    * 0.35 +
    visualScore     * 0.15 +
    criticScore     * 0.15 +
    conversionScore * 0.15 +
    tokenScore      * 0.05 +
    treeScore       * 0.05 +
    motionScore     * 0.05 +
    (1 - Math.min(1, repairRate)) * 10 * 0.05;

  return Math.round(Math.max(0, Math.min(10, raw)) * 100) / 100;
}

// ── Phase 4 — Promotion Engine ────────────────────────────────────────────────
// usageCount >= 10 AND averageScore >= 9 AND repairRate < 15% → +1.5 bonus

function applyPromotionDemotion(m: DesignDNAMetrics): void {
  if (m._n < 10) return;

  const repairRate = m._n > 0 ? m._repairCount / m._n : 0;
  const wasPromoted = m.priority === 'promoted';
  const wasDemoted  = m.priority === 'demoted';
  const now = new Date().toISOString();

  if (m.averageScore >= 9 && repairRate < 0.15) {
    if (!wasPromoted) {
      m.priority = 'promoted';
      _totalPromoted++;
      m.promotionHistory.push({ action: 'promoted', at: now, reason: `avgScore=${m.averageScore.toFixed(2)} repairRate=${(repairRate * 100).toFixed(1)}%` });
    }
  } else if (m.averageScore < 7 || repairRate > 0.50) {
    if (!wasDemoted) {
      m.priority = 'demoted';
      _totalDemoted++;
      m.promotionHistory.push({ action: 'demoted', at: now, reason: `avgScore=${m.averageScore.toFixed(2)} repairRate=${(repairRate * 100).toFixed(1)}%` });
    }
  } else {
    if (wasPromoted || wasDemoted) {
      m.priority = 'normal';
      m.promotionHistory.push({ action: 'reset', at: now, reason: 'conditions no longer met' });
    }
  }
}

// ── Phase 2 — Outcome Recording ───────────────────────────────────────────────

export interface DNAOutcomeInput {
  dimensionId: string;   // e.g. "hero:split-layout"
  overallScore:     number;
  visualScore:      number;
  criticScore:      number;
  conversionScore:  number;
  motionScore:      number;
  tokenScore:       number;
  treeScore:        number;
  repairTriggered:  boolean;
}

export function recordDNADimensionOutcome(input: DNAOutcomeInput): void {
  let m = _store.get(input.dimensionId);
  if (!m) {
    m = createEntry(input.dimensionId);
    _store.set(input.dimensionId, m);
  }

  m.usageCount++;
  m._n++;
  m.lastUsedAt = new Date().toISOString();

  m._sumScore      += input.overallScore;
  m._sumVisual     += input.visualScore;
  m._sumCritic     += input.criticScore;
  m._sumConversion += input.conversionScore;
  m._sumMotion     += input.motionScore;
  m._sumToken      += input.tokenScore;
  m._sumTree       += input.treeScore;

  if (input.overallScore >= 8.5) m._successCount++;
  if (input.repairTriggered)     m._repairCount++;

  const n = m._n;
  m.averageScore      = m._sumScore      / n;
  m.averageVisualScore      = m._sumVisual     / n;
  m.averageCriticScore      = m._sumCritic     / n;
  m.averageConversionScore  = m._sumConversion / n;
  m.averageMotionScore      = m._sumMotion     / n;
  m.averageTokenScore       = m._sumToken      / n;
  m.averageTreeScore        = m._sumTree       / n;
  m.successRate = m._successCount / n;
  m.repairRate  = m._repairCount  / n;

  m.qualityScore = applyPriority(m, calculateDNAQuality({
    overallScore:    m.averageScore,
    visualScore:     m.averageVisualScore,
    criticScore:     m.averageCriticScore,
    conversionScore: m.averageConversionScore,
    tokenScore:      m.averageTokenScore,
    treeScore:       m.averageTreeScore,
    motionScore:     m.averageMotionScore,
    repairRate:      m.repairRate,
  }));

  applyPromotionDemotion(m);

  m.qualityScore = applyPriority(m, calculateDNAQuality({
    overallScore:    m.averageScore,
    visualScore:     m.averageVisualScore,
    criticScore:     m.averageCriticScore,
    conversionScore: m.averageConversionScore,
    tokenScore:      m.averageTokenScore,
    treeScore:       m.averageTreeScore,
    motionScore:     m.averageMotionScore,
    repairRate:      m.repairRate,
  }));
}

function applyPriority(m: DesignDNAMetrics, base: number): number {
  let s = base;
  if (m.priority === 'promoted') s = Math.min(10, s + 1.5);
  if (m.priority === 'demoted')  s = Math.max(0,  s - 2.0);
  return Math.round(Math.max(0, Math.min(10, s)) * 100) / 100;
}

function createEntry(id: string): DesignDNAMetrics {
  return {
    id,
    usageCount: 0,
    averageScore: 0,
    averageVisualScore: 0,
    averageCriticScore: 0,
    averageConversionScore: 0,
    averageMotionScore: 0,
    averageTokenScore: 0,
    averageTreeScore: 0,
    successRate: 0,
    repairRate: 0,
    lastUsedAt: new Date().toISOString(),
    qualityScore: 5.0,
    priority: 'normal',
    promotionHistory: [],
    _n: 0,
    _sumScore: 0,
    _sumVisual: 0,
    _sumCritic: 0,
    _sumConversion: 0,
    _sumMotion: 0,
    _sumToken: 0,
    _sumTree: 0,
    _successCount: 0,
    _repairCount: 0,
  };
}

// ── Phase 14 — DNA Leaderboards ───────────────────────────────────────────────

export type DNASummary = Pick<DesignDNAMetrics,
  'id' | 'usageCount' | 'averageScore' | 'qualityScore' | 'successRate' | 'repairRate' | 'priority'
>;

function toSummary(m: DesignDNAMetrics): DNASummary {
  return {
    id: m.id,
    usageCount: m.usageCount,
    averageScore: Math.round(m.averageScore * 100) / 100,
    qualityScore: m.qualityScore,
    successRate: Math.round(m.successRate * 1000) / 1000,
    repairRate: Math.round(m.repairRate * 1000) / 1000,
    priority: m.priority,
  };
}

function topByPrefix(prefix: string, limit = 20): DNASummary[] {
  return [..._store.values()]
    .filter(m => m.id.startsWith(prefix) && m._n > 0)
    .sort((a, b) => b.qualityScore - a.qualityScore || b.usageCount - a.usageCount)
    .slice(0, limit)
    .map(toSummary);
}

export function getTopDNAs(limit = 20): DNASummary[] {
  return [..._store.values()]
    .filter(m => m._n > 0)
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, limit)
    .map(toSummary);
}

export function getWorstDNAs(limit = 20): DNASummary[] {
  return [..._store.values()]
    .filter(m => m._n >= 5)
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, limit)
    .map(toSummary);
}

export function getTopHeroPatterns(limit = 20): DNASummary[] { return topByPrefix('hero:', limit); }
export function getTopCTAPatterns(limit = 20):  DNASummary[] { return topByPrefix('cta:', limit); }
export function getTopLayoutPatterns(limit = 20): DNASummary[] { return topByPrefix('layout:', limit); }
export function getTopMotionPatterns(limit = 20): DNASummary[] { return topByPrefix('motion:', limit); }
export function getTopNavbarPatterns(limit = 20): DNASummary[] { return topByPrefix('navbar:', limit); }
export function getTopBrandPatterns(limit = 20):  DNASummary[] { return topByPrefix('brand:', limit); }

export function getDNAEntry(id: string): DesignDNAMetrics | undefined {
  return _store.get(id);
}

export function getDNAQualityScore(id: string): number {
  return _store.get(id)?.qualityScore ?? 5.0;
}

export function getDNAStoreSize(): number {
  return _store.size;
}

export function getDNAStoreCounts(): { promotedCount: number; demotedCount: number } {
  return { promotedCount: _totalPromoted, demotedCount: _totalDemoted };
}

export function getAverageDNAQuality(): number {
  const entries = [..._store.values()].filter(m => m._n > 0);
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((s, m) => s + m.qualityScore, 0) / entries.length * 100) / 100;
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetDNAMetrics(): void {
  _store.clear();
  _totalPromoted = 0;
  _totalDemoted  = 0;
}
