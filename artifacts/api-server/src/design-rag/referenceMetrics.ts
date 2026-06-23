// ── V7.1.9 Design RAG — Reference Performance Store ──────────────────────────
// Self-learning metrics: real evaluator outcomes drive ranking.
// No estimates. Only actual build results.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReferenceMetrics {
  id: string;
  category: string;
  dna: string;
  usageCount: number;
  outcomeCount: number;    // may lag usageCount (recorded after build)
  successCount: number;   // final score >= 8.5
  repairCount: number;    // repair loop triggered
  sumScore: number;
  sumScoreAfterRepair: number;
  sumRetrievalImpact: number; // sum(scoreAfterRepair - scoreBeforeRepair)
  lastUsedAt: number;
  priority: 'promoted' | 'normal' | 'demoted';
}

export interface ReferenceSummary {
  id: string;
  category: string;
  dna: string;
  qualityScore: number;
  usageCount: number;
  successRate: number;
  repairRate: number;
}

// ── In-memory store ────────────────────────────────────────────────────────────

const store = new Map<string, ReferenceMetrics>();
let promotedCount = 0;
let demotedCount = 0;

function ensureEntry(id: string, category = 'unknown', dna = 'unknown'): ReferenceMetrics {
  if (!store.has(id)) {
    store.set(id, {
      id,
      category,
      dna,
      usageCount: 0,
      outcomeCount: 0,
      successCount: 0,
      repairCount: 0,
      sumScore: 0,
      sumScoreAfterRepair: 0,
      sumRetrievalImpact: 0,
      lastUsedAt: 0,
      priority: 'normal',
    });
  }
  return store.get(id)!;
}

// ── Phase 3: Dynamic Quality Score ────────────────────────────────────────────
//
// Formula (all sub-scores normalised 0–10):
//   averageScoreAfterRepair  * 0.40
//   successRate (×10)        * 0.25
//   (1 – repairRate) (×10)   * 0.20
//   retrievalImpact (0–10)   * 0.15
//
// Promotion adds +1.5 (cap 10). Demotion subtracts −2.0 (floor 0).
// New references with no outcomes return a neutral 5.0.

export function computeReferenceQualityScore(m: ReferenceMetrics): number {
  if (m.outcomeCount === 0) return 5.0;

  const avgAfter    = m.sumScoreAfterRepair / m.outcomeCount;
  const successRate = m.successCount / m.outcomeCount;
  const repairRate  = m.repairCount / m.outcomeCount;
  const avgImpact   = m.sumRetrievalImpact / m.outcomeCount;

  // Impact: clamp to [-10, +10] then map to [0, 10]
  const impactNorm  = (Math.max(-10, Math.min(10, avgImpact)) + 10) / 2;

  let score =
    avgAfter        * 0.40 +
    successRate * 10 * 0.25 +
    (1 - repairRate) * 10 * 0.20 +
    impactNorm       * 0.15;

  // Priority adjustment
  if (m.priority === 'promoted') score = Math.min(10, score + 1.5);
  if (m.priority === 'demoted')  score = Math.max(0,  score - 2.0);

  return Math.round(score * 100) / 100;
}

export function getReferenceQualityScore(id: string): number {
  const m = store.get(id);
  return m ? computeReferenceQualityScore(m) : 5.0;
}

// ── Phase 5–6: Auto Promotion / Demotion ─────────────────────────────────────

function applyPromotionDemotion(m: ReferenceMetrics): void {
  if (m.outcomeCount < 5) return;

  const avgAfter   = m.outcomeCount > 0 ? m.sumScoreAfterRepair / m.outcomeCount : 0;
  const repairRate = m.repairCount / m.outcomeCount;

  const wasPromoted = m.priority === 'promoted';
  const wasDemoted  = m.priority === 'demoted';

  if (avgAfter >= 9 && repairRate < 0.15) {
    m.priority = 'promoted';
    if (!wasPromoted) promotedCount++;
  } else if (avgAfter < 7 || repairRate > 0.50) {
    m.priority = 'demoted';
    if (!wasDemoted) demotedCount++;
  } else {
    m.priority = 'normal';
  }
}

// ── Phase 1: Record retrieval usage ──────────────────────────────────────────

export function recordReferenceUsages(
  refs: Array<{ id: string; category?: string; dna?: string }>,
): void {
  const now = Date.now();
  for (const ref of refs) {
    const m = ensureEntry(ref.id, ref.category ?? 'unknown', ref.dna ?? 'unknown');
    m.usageCount++;
    m.lastUsedAt = now;
  }
}

// ── Phase 1+2: Record build outcome ──────────────────────────────────────────

export function recordBuildOutcome(
  referenceIds: string[],
  scoreBeforeRepair: number,
  scoreAfterRepair: number,
  repairTriggered: boolean,
): void {
  for (const id of referenceIds) {
    const m = ensureEntry(id);

    m.outcomeCount++;
    m.sumScore            += scoreBeforeRepair;
    m.sumScoreAfterRepair += scoreAfterRepair;
    m.sumRetrievalImpact  += scoreAfterRepair - scoreBeforeRepair;

    if (scoreAfterRepair >= 8.5)  m.successCount++;
    if (repairTriggered)          m.repairCount++;

    applyPromotionDemotion(m);
  }
}

// ── Phase 7: Leaderboard ──────────────────────────────────────────────────────

export function getTopReferences(limit = 20): ReferenceSummary[] {
  const all: ReferenceSummary[] = [];

  for (const m of store.values()) {
    all.push({
      id:          m.id,
      category:    m.category,
      dna:         m.dna,
      qualityScore: computeReferenceQualityScore(m),
      usageCount:  m.usageCount,
      successRate: m.outcomeCount > 0 ? Math.round((m.successCount / m.outcomeCount) * 1000) / 1000 : 0,
      repairRate:  m.outcomeCount > 0 ? Math.round((m.repairCount  / m.outcomeCount) * 1000) / 1000 : 0,
    });
  }

  return all
    .sort((a, b) => b.qualityScore - a.qualityScore || b.usageCount - a.usageCount)
    .slice(0, limit);
}

export function getWorstReferences(limit = 5): ReferenceSummary[] {
  const all: ReferenceSummary[] = [];
  for (const m of store.values()) {
    if (m.outcomeCount === 0) continue;
    all.push({
      id:          m.id,
      category:    m.category,
      dna:         m.dna,
      qualityScore: computeReferenceQualityScore(m),
      usageCount:  m.usageCount,
      successRate: Math.round((m.successCount / m.outcomeCount) * 1000) / 1000,
      repairRate:  Math.round((m.repairCount  / m.outcomeCount) * 1000) / 1000,
    });
  }
  return all
    .sort((a, b) => a.qualityScore - b.qualityScore)
    .slice(0, limit);
}

// ── Phase 8: Telemetry ────────────────────────────────────────────────────────

export function getRagLeaderboardMetrics() {
  const all = [...store.values()];
  const withOutcomes = all.filter(m => m.outcomeCount > 0);

  const averageReferenceScore =
    withOutcomes.length > 0
      ? Math.round(
          (withOutcomes.reduce((s, m) => s + computeReferenceQualityScore(m), 0) / withOutcomes.length) * 100
        ) / 100
      : 0;

  const averageRetrievalImpact =
    withOutcomes.length > 0
      ? Math.round(
          (withOutcomes.reduce((s, m) => s + m.sumRetrievalImpact / m.outcomeCount, 0) / withOutcomes.length) * 100
        ) / 100
      : 0;

  return {
    referencesTracked:      all.length,
    topReferences:          getTopReferences(5),
    worstReferences:        getWorstReferences(5),
    averageReferenceScore,
    averageRetrievalImpact,
    promotedCount,
    demotedCount,
  };
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export function resetReferenceMetrics(): void {
  store.clear();
  promotedCount = 0;
  demotedCount  = 0;
}

export function getReferenceEntry(id: string): ReferenceMetrics | undefined {
  return store.get(id);
}

export function getStoreSize(): number {
  return store.size;
}
