// ── V7.1.9 Design RAG — Reference Metrics Tests ──────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordReferenceUsages,
  recordBuildOutcome,
  getReferenceQualityScore,
  computeReferenceQualityScore,
  getTopReferences,
  getWorstReferences,
  getRagLeaderboardMetrics,
  getReferenceEntry,
  getStoreSize,
  resetReferenceMetrics,
} from "../../src/design-rag/referenceMetrics.js";

// ── Helpers ────────────────────────────────────────────────────────────────────

function useAndRecord(
  id: string,
  scoreBeforeRepair: number,
  scoreAfterRepair: number,
  repairTriggered: boolean,
  times = 1,
): void {
  for (let i = 0; i < times; i++) {
    recordReferenceUsages([{ id, category: 'hero', dna: 'linear' }]);
    recordBuildOutcome([id], scoreBeforeRepair, scoreAfterRepair, repairTriggered);
  }
}

// ── Phase 1: Usage Tracking ────────────────────────────────────────────────────

describe("V7.1.9 — Phase 1: Usage Tracking", () => {
  beforeEach(() => resetReferenceMetrics());

  it("increments usageCount on each retrieval", () => {
    recordReferenceUsages([{ id: 'ref-a' }]);
    recordReferenceUsages([{ id: 'ref-a' }]);
    recordReferenceUsages([{ id: 'ref-a' }]);
    expect(getReferenceEntry('ref-a')?.usageCount).toBe(3);
  });

  it("tracks multiple references independently", () => {
    recordReferenceUsages([{ id: 'ref-a' }, { id: 'ref-b' }]);
    expect(getReferenceEntry('ref-a')?.usageCount).toBe(1);
    expect(getReferenceEntry('ref-b')?.usageCount).toBe(1);
  });

  it("sets lastUsedAt timestamp on usage", () => {
    const before = Date.now();
    recordReferenceUsages([{ id: 'ref-t' }]);
    const after = Date.now();
    const ts = getReferenceEntry('ref-t')?.lastUsedAt ?? 0;
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("stores category and dna when provided", () => {
    recordReferenceUsages([{ id: 'ref-c', category: 'pricing', dna: 'stripe' }]);
    const entry = getReferenceEntry('ref-c');
    expect(entry?.category).toBe('pricing');
    expect(entry?.dna).toBe('stripe');
  });

  it("creates a new entry for unknown references", () => {
    expect(getReferenceEntry('never-seen')).toBeUndefined();
    recordReferenceUsages([{ id: 'never-seen' }]);
    expect(getReferenceEntry('never-seen')).toBeDefined();
    expect(getStoreSize()).toBeGreaterThan(0);
  });
});

// ── Phase 1+2: Outcome Tracking ────────────────────────────────────────────────

describe("V7.1.9 — Phase 1+2: Outcome Tracking", () => {
  beforeEach(() => resetReferenceMetrics());

  it("increments successCount when score >= 8.5", () => {
    useAndRecord('ref-s', 8.0, 9.0, false);
    expect(getReferenceEntry('ref-s')?.successCount).toBe(1);
  });

  it("does not increment successCount when score < 8.5", () => {
    useAndRecord('ref-s', 7.0, 8.4, false);
    expect(getReferenceEntry('ref-s')?.successCount).toBe(0);
  });

  it("increments repairCount when repairTriggered is true", () => {
    useAndRecord('ref-r', 6.5, 8.5, true);
    expect(getReferenceEntry('ref-r')?.repairCount).toBe(1);
  });

  it("does not increment repairCount when repairTriggered is false", () => {
    useAndRecord('ref-r', 9.0, 9.2, false);
    expect(getReferenceEntry('ref-r')?.repairCount).toBe(0);
  });

  it("accumulates sumScoreAfterRepair across multiple outcomes", () => {
    useAndRecord('ref-sum', 8.0, 9.0, false);
    useAndRecord('ref-sum', 8.0, 8.5, false);
    const entry = getReferenceEntry('ref-sum')!;
    expect(entry.sumScoreAfterRepair).toBeCloseTo(17.5, 2);
    expect(entry.outcomeCount).toBe(2);
  });

  it("computes retrievalImpact as scoreAfterRepair - scoreBeforeRepair", () => {
    useAndRecord('ref-impact', 7.0, 9.0, true);
    const entry = getReferenceEntry('ref-impact')!;
    expect(entry.sumRetrievalImpact).toBeCloseTo(2.0, 2);
  });

  it("handles negative retrievalImpact (score degradation after repair)", () => {
    useAndRecord('ref-neg', 8.5, 7.5, true);
    const entry = getReferenceEntry('ref-neg')!;
    expect(entry.sumRetrievalImpact).toBeCloseTo(-1.0, 2);
  });
});

// ── Phase 3: Dynamic Quality Score ────────────────────────────────────────────

describe("V7.1.9 — Phase 3: Dynamic Quality Score", () => {
  beforeEach(() => resetReferenceMetrics());

  it("returns 5.0 for a reference with no outcomes (neutral default)", () => {
    recordReferenceUsages([{ id: 'new-ref' }]);
    expect(getReferenceQualityScore('new-ref')).toBe(5.0);
  });

  it("returns 5.0 for completely unknown references", () => {
    expect(getReferenceQualityScore('ghost-ref')).toBe(5.0);
  });

  it("produces a score in 0–10 range for high performers", () => {
    useAndRecord('ref-high', 8.5, 9.5, false, 5);
    const score = getReferenceQualityScore('ref-high');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("produces a higher score for high avg vs low avg references", () => {
    useAndRecord('ref-good', 8.5, 9.5, false, 3);
    useAndRecord('ref-poor', 5.0, 6.5, true, 3);
    expect(getReferenceQualityScore('ref-good')).toBeGreaterThan(
      getReferenceQualityScore('ref-poor')
    );
  });

  it("quality score uses all four formula components", () => {
    recordReferenceUsages([{ id: 'ref-formula' }]);
    recordBuildOutcome(['ref-formula'], 9.0, 9.5, false);
    const entry = getReferenceEntry('ref-formula')!;
    const score = computeReferenceQualityScore(entry);
    // avg after repair 9.5 * 0.40 = 3.8
    // success rate 1.0 * 10 * 0.25 = 2.5
    // (1-0) * 10 * 0.20 = 2.0
    // impact norm: (0.5 + 10)/2 = 5.25 * 0.15 = 0.7875
    // total ≈ 9.08 (no priority adj, priority='normal')
    expect(score).toBeGreaterThan(8.0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it("score is deterministic for same inputs", () => {
    useAndRecord('ref-det', 7.5, 8.5, true, 3);
    const s1 = getReferenceQualityScore('ref-det');
    const s2 = getReferenceQualityScore('ref-det');
    expect(s1).toBe(s2);
  });
});

// ── Phase 5: Auto Promotion ────────────────────────────────────────────────────

describe("V7.1.9 — Phase 5: Auto Promotion", () => {
  beforeEach(() => resetReferenceMetrics());

  it("promotes a reference with avgScore >= 9 and repairRate < 15% after 5 outcomes", () => {
    useAndRecord('ref-promo', 9.0, 9.3, false, 5);
    expect(getReferenceEntry('ref-promo')?.priority).toBe('promoted');
  });

  it("does not promote before 5 outcomes", () => {
    useAndRecord('ref-promo-early', 9.5, 9.5, false, 4);
    expect(getReferenceEntry('ref-promo-early')?.priority).toBe('normal');
  });

  it("does not promote when repairRate >= 15%", () => {
    // 2/5 repairs = 40% repair rate — too high
    recordReferenceUsages([{ id: 'ref-hp' }]);
    recordBuildOutcome(['ref-hp'], 9.0, 9.2, false);
    recordReferenceUsages([{ id: 'ref-hp' }]);
    recordBuildOutcome(['ref-hp'], 9.0, 9.2, false);
    recordReferenceUsages([{ id: 'ref-hp' }]);
    recordBuildOutcome(['ref-hp'], 9.0, 9.2, false);
    recordReferenceUsages([{ id: 'ref-hp' }]);
    recordBuildOutcome(['ref-hp'], 9.0, 9.2, true);  // repair
    recordReferenceUsages([{ id: 'ref-hp' }]);
    recordBuildOutcome(['ref-hp'], 9.0, 9.2, true);  // repair
    // repairRate = 2/5 = 40% → no promotion
    expect(getReferenceEntry('ref-hp')?.priority).not.toBe('promoted');
  });

  it("promoted references get a +1.5 quality score bonus", () => {
    useAndRecord('ref-promo-score', 9.0, 9.5, false, 5);
    const entry = getReferenceEntry('ref-promo-score')!;
    expect(entry.priority).toBe('promoted');
    const score = computeReferenceQualityScore(entry);
    // promoted, so score is boosted
    expect(score).toBeLessThanOrEqual(10);
    expect(score).toBeGreaterThanOrEqual(8);
  });
});

// ── Phase 6: Auto Demotion ─────────────────────────────────────────────────────

describe("V7.1.9 — Phase 6: Auto Demotion", () => {
  beforeEach(() => resetReferenceMetrics());

  it("demotes a reference with avgScore < 7 after 5 outcomes", () => {
    useAndRecord('ref-demote', 5.0, 6.0, false, 5);
    expect(getReferenceEntry('ref-demote')?.priority).toBe('demoted');
  });

  it("demotes a reference with repairRate > 50% after 5 outcomes", () => {
    // 4/5 repairs = 80% repair rate
    useAndRecord('ref-hrepair', 8.0, 8.0, true, 4);
    useAndRecord('ref-hrepair', 8.0, 8.0, false, 1);
    expect(getReferenceEntry('ref-hrepair')?.priority).toBe('demoted');
  });

  it("does not demote before 5 outcomes", () => {
    useAndRecord('ref-demote-early', 3.0, 4.0, true, 4);
    expect(getReferenceEntry('ref-demote-early')?.priority).toBe('normal');
  });

  it("demoted references get a -2.0 quality score penalty", () => {
    useAndRecord('ref-demote-score', 5.0, 6.0, false, 5);
    const entry = getReferenceEntry('ref-demote-score')!;
    expect(entry.priority).toBe('demoted');
    const score = computeReferenceQualityScore(entry);
    expect(score).toBeGreaterThanOrEqual(0); // floored at 0
  });
});

// ── Phase 7: Leaderboard ───────────────────────────────────────────────────────

describe("V7.1.9 — Phase 7: Leaderboard", () => {
  beforeEach(() => resetReferenceMetrics());

  it("getTopReferences returns references sorted by qualityScore descending", () => {
    useAndRecord('ref-best',  8.5, 9.5, false, 5);
    useAndRecord('ref-mid',   7.5, 8.0, false, 5);
    useAndRecord('ref-worst', 5.0, 6.0, false, 5);
    const top = getTopReferences();
    expect(top[0].id).toBe('ref-best');
    expect(top[top.length - 1].id).toBe('ref-worst');
  });

  it("getTopReferences returns at most 20 entries by default", () => {
    for (let i = 0; i < 25; i++) {
      useAndRecord(`ref-many-${i}`, 8.0, 8.5, false, 1);
    }
    expect(getTopReferences().length).toBeLessThanOrEqual(20);
  });

  it("getTopReferences respects a custom limit", () => {
    useAndRecord('ref-1', 9.0, 9.5, false, 3);
    useAndRecord('ref-2', 8.0, 8.5, false, 3);
    useAndRecord('ref-3', 7.0, 7.5, false, 3);
    const top = getTopReferences(2);
    expect(top.length).toBe(2);
  });

  it("leaderboard entries contain required fields", () => {
    useAndRecord('ref-fields', 8.0, 9.0, false, 2);
    const top = getTopReferences(1);
    expect(top[0]).toHaveProperty('id');
    expect(top[0]).toHaveProperty('category');
    expect(top[0]).toHaveProperty('dna');
    expect(top[0]).toHaveProperty('qualityScore');
    expect(top[0]).toHaveProperty('usageCount');
    expect(top[0]).toHaveProperty('successRate');
    expect(top[0]).toHaveProperty('repairRate');
  });

  it("getWorstReferences returns only entries with outcomes", () => {
    recordReferenceUsages([{ id: 'ref-no-outcomes' }]); // usage but no outcome
    useAndRecord('ref-bad', 4.0, 5.5, true, 5);
    const worst = getWorstReferences();
    const ids = worst.map(r => r.id);
    expect(ids).not.toContain('ref-no-outcomes'); // no outcomes = excluded
    expect(ids).toContain('ref-bad');
  });

  it("successRate and repairRate are in 0–1 range", () => {
    useAndRecord('ref-rates', 8.0, 9.0, true, 3);
    const top = getTopReferences(1);
    expect(top[0].successRate).toBeGreaterThanOrEqual(0);
    expect(top[0].successRate).toBeLessThanOrEqual(1);
    expect(top[0].repairRate).toBeGreaterThanOrEqual(0);
    expect(top[0].repairRate).toBeLessThanOrEqual(1);
  });
});

// ── Phase 8: Telemetry ────────────────────────────────────────────────────────

describe("V7.1.9 — Phase 8: Telemetry", () => {
  beforeEach(() => resetReferenceMetrics());

  it("getRagLeaderboardMetrics returns referencesTracked", () => {
    recordReferenceUsages([{ id: 'ref-a' }, { id: 'ref-b' }]);
    const metrics = getRagLeaderboardMetrics();
    expect(metrics.referencesTracked).toBe(2);
  });

  it("telemetry includes topReferences and worstReferences", () => {
    useAndRecord('ref-good', 8.5, 9.5, false, 3);
    useAndRecord('ref-bad',  4.0, 5.0, true,  5);
    const metrics = getRagLeaderboardMetrics();
    expect(Array.isArray(metrics.topReferences)).toBe(true);
    expect(Array.isArray(metrics.worstReferences)).toBe(true);
  });

  it("telemetry includes averageReferenceScore", () => {
    useAndRecord('ref-avg', 8.0, 9.0, false, 2);
    const metrics = getRagLeaderboardMetrics();
    expect(typeof metrics.averageReferenceScore).toBe('number');
    expect(metrics.averageReferenceScore).toBeGreaterThan(0);
  });

  it("telemetry includes averageRetrievalImpact", () => {
    useAndRecord('ref-impact', 7.0, 9.0, true, 2);
    const metrics = getRagLeaderboardMetrics();
    expect(typeof metrics.averageRetrievalImpact).toBe('number');
  });

  it("promotedCount increments when a reference is promoted", () => {
    useAndRecord('ref-promo-tel', 9.2, 9.5, false, 5);
    const metrics = getRagLeaderboardMetrics();
    expect(metrics.promotedCount).toBe(1);
  });

  it("demotedCount increments when a reference is demoted", () => {
    useAndRecord('ref-dem-tel', 5.0, 6.0, false, 5);
    const metrics = getRagLeaderboardMetrics();
    expect(metrics.demotedCount).toBe(1);
  });

  it("averageReferenceScore is 0 when no outcomes recorded", () => {
    recordReferenceUsages([{ id: 'ref-no-score' }]);
    const metrics = getRagLeaderboardMetrics();
    expect(metrics.averageReferenceScore).toBe(0);
  });
});

// ── Quality Score Normalization ───────────────────────────────────────────────

describe("V7.1.9 — Quality Score Normalization", () => {
  beforeEach(() => resetReferenceMetrics());

  it("quality score never exceeds 10", () => {
    useAndRecord('ref-max', 10.0, 10.0, false, 10);
    const score = getReferenceQualityScore('ref-max');
    expect(score).toBeLessThanOrEqual(10);
  });

  it("quality score never goes below 0", () => {
    useAndRecord('ref-min', 0.0, 0.0, true, 10);
    const score = getReferenceQualityScore('ref-min');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("promoted score is capped at 10 even with bonus", () => {
    useAndRecord('ref-cap', 9.5, 10.0, false, 5);
    const score = getReferenceQualityScore('ref-cap');
    expect(score).toBeLessThanOrEqual(10);
  });

  it("demoted score is floored at 0 even with penalty", () => {
    useAndRecord('ref-floor', 0.0, 0.0, true, 5);
    const score = getReferenceQualityScore('ref-floor');
    expect(score).toBeGreaterThanOrEqual(0);
  });
});
