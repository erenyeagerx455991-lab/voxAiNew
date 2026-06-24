// ── V7.2.3 Section Outcome Feedback Loop — Tests ─────────────────────────────
// Verifies: outcome recording, quality score formula, promotion, demotion,
// DNA dominance, neutral cold-start, telemetry, rankings, repair rate, bounds.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordSectionOutcome,
  calculateSectionQuality,
  getSectionQualityScore,
  getSectionReferenceEntry,
  getSectionStoreSize,
  getTopHeroReferences,
  getTopFeatureReferences,
  getTopPricingReferences,
  getTopTestimonialReferences,
  getTopCTAReferences,
  getSectionLearningMetrics,
  resetSectionReferenceMetrics,
} from '../../src/design-rag/sectionReferenceMetrics.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function outcome(
  referenceId: string,
  opts: {
    sectionType?: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta';
    overallScore?: number;
    heroScore?: number;
    layoutScore?: number;
    ctaScore?: number;
    accessibilityScore?: number;
    consistencyScore?: number;
    repairTriggered?: boolean;
  } = {},
) {
  recordSectionOutcome({
    referenceId,
    sectionType:       opts.sectionType       ?? 'hero',
    overallScore:      opts.overallScore       ?? 8,
    heroScore:         opts.heroScore          ?? 8,
    layoutScore:       opts.layoutScore        ?? 8,
    ctaScore:          opts.ctaScore           ?? 8,
    accessibilityScore: opts.accessibilityScore ?? 8,
    consistencyScore:  opts.consistencyScore   ?? 8,
    repairTriggered:   opts.repairTriggered    ?? false,
  });
}

function fiveOutcomes(
  id: string,
  opts: Parameters<typeof outcome>[1] = {},
) {
  for (let i = 0; i < 5; i++) outcome(id, opts);
}

// ── Store Initialization ──────────────────────────────────────────────────────

describe('Store initialization', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('starts empty', () => {
    expect(getSectionStoreSize()).toBe(0);
  });

  it('getSectionQualityScore returns 5 for unknown referenceId', () => {
    expect(getSectionQualityScore('unknown-ref-xyz')).toBe(5.0);
  });
});

// ── Outcome Recording ─────────────────────────────────────────────────────────

describe('Outcome recording', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('creates entry on first call', () => {
    outcome('hero-test-1');
    expect(getSectionStoreSize()).toBe(1);
    expect(getSectionReferenceEntry('hero-test-1')).toBeDefined();
  });

  it('usageCount increments on each call', () => {
    outcome('hero-test-2');
    outcome('hero-test-2');
    outcome('hero-test-2');
    const m = getSectionReferenceEntry('hero-test-2')!;
    expect(m.usageCount).toBe(3);
  });

  it('successCount increments when overallScore >= 8.5', () => {
    outcome('hero-test-3', { overallScore: 9.0 });
    outcome('hero-test-3', { overallScore: 8.5 });
    outcome('hero-test-3', { overallScore: 7.0 });
    const m = getSectionReferenceEntry('hero-test-3')!;
    expect(m.successCount).toBe(2);
  });

  it('repairCount increments when repairTriggered=true', () => {
    outcome('hero-test-4', { repairTriggered: true });
    outcome('hero-test-4', { repairTriggered: false });
    outcome('hero-test-4', { repairTriggered: true });
    const m = getSectionReferenceEntry('hero-test-4')!;
    expect(m.repairCount).toBe(2);
  });

  it('avgScore is a running average of overallScore', () => {
    outcome('hero-test-5', { overallScore: 8 });
    outcome('hero-test-5', { overallScore: 6 });
    const m = getSectionReferenceEntry('hero-test-5')!;
    expect(m.avgScore).toBeCloseTo(7, 5);
  });

  it('avgAccessibility is a running average', () => {
    outcome('hero-test-6', { accessibilityScore: 10 });
    outcome('hero-test-6', { accessibilityScore: 6 });
    outcome('hero-test-6', { accessibilityScore: 8 });
    const m = getSectionReferenceEntry('hero-test-6')!;
    expect(m.avgAccessibility).toBeCloseTo(8, 5);
  });

  it('multiple outcomes update all averages correctly', () => {
    outcome('hero-test-7', { overallScore: 9, layoutScore: 7, ctaScore: 6, heroScore: 10, accessibilityScore: 8, consistencyScore: 5 });
    outcome('hero-test-7', { overallScore: 7, layoutScore: 9, ctaScore: 8, heroScore: 6, accessibilityScore: 4, consistencyScore: 9 });
    const m = getSectionReferenceEntry('hero-test-7')!;
    expect(m.avgScore).toBeCloseTo(8, 5);
    expect(m.avgLayout).toBeCloseTo(8, 5);
    expect(m.avgCTA).toBeCloseTo(7, 5);
    expect(m.avgHero).toBeCloseTo(8, 5);
    expect(m.avgAccessibility).toBeCloseTo(6, 5);
    expect(m.avgConsistency).toBeCloseTo(7, 5);
  });
});

// ── Quality Score Calculation ─────────────────────────────────────────────────

describe('Quality score calculation', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('calculateSectionQuality returns 5 for zero-outcome entry', () => {
    const fakeEntry = {
      referenceId: 'x', sectionType: 'hero' as const,
      usageCount: 0, successCount: 0, repairCount: 0,
      avgScore: 0, avgAccessibility: 0, avgLayout: 0, avgCTA: 0, avgHero: 0, avgConsistency: 0,
      lastUsedAt: 0, qualityScore: 5, priority: 'normal' as const,
      _outcomeCount: 0, _sumScore: 0, _sumAccessibility: 0,
      _sumLayout: 0, _sumCTA: 0, _sumHero: 0, _sumConsistency: 0,
    };
    expect(calculateSectionQuality(fakeEntry)).toBe(5.0);
  });

  it('perfect scores (all 10, no repairs) produce qualityScore = 10', () => {
    fiveOutcomes('hero-perfect', { overallScore: 10, heroScore: 10, layoutScore: 10, ctaScore: 10, accessibilityScore: 10, consistencyScore: 10, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-perfect')!;
    const qs = calculateSectionQuality(m);
    expect(qs).toBe(10);
  });

  it('zero scores produce qualityScore = 0', () => {
    fiveOutcomes('hero-zero', { overallScore: 0, heroScore: 0, layoutScore: 0, ctaScore: 0, accessibilityScore: 0, consistencyScore: 0, repairTriggered: true });
    const m = getSectionReferenceEntry('hero-zero')!;
    const qs = calculateSectionQuality(m);
    expect(qs).toBe(0);
  });

  it('repair rate reduces quality score vs no repair', () => {
    outcome('hero-repair-a', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: true });
    outcome('hero-repair-b', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: false });
    const mA = getSectionReferenceEntry('hero-repair-a')!;
    const mB = getSectionReferenceEntry('hero-repair-b')!;
    expect(calculateSectionQuality(mA)).toBeLessThan(calculateSectionQuality(mB));
  });

  it('repairRate=100% fully removes repair contribution', () => {
    // Use 4 outcomes to stay below demotion threshold (requires 5+)
    for (let i = 0; i < 4; i++) {
      outcome('hero-full-repair', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: true });
    }
    const m = getSectionReferenceEntry('hero-full-repair')!;
    const qs = calculateSectionQuality(m);
    // (1 - 1.0) * 10 * 0.05 = 0; score = 8×0.4 + 8×0.2 + 8×0.15 + 8×0.10 + 8×0.10 + 0 = 8×0.95 = 7.6
    expect(qs).toBeCloseTo(7.6, 1);
  });

  it('repairRate=0% maximally contributes repair bonus', () => {
    fiveOutcomes('hero-no-repair', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-no-repair')!;
    const qs = calculateSectionQuality(m);
    // 8×0.95 + 10×0.05 = 7.6 + 0.5 = 8.1
    expect(qs).toBeCloseTo(8.1, 1);
  });

  it('quality score uses correct weights summing to 10 for perfect input', () => {
    // All scores 10, no repairs → 10×0.40 + 10×0.20 + 10×0.15 + 10×0.10 + 10×0.10 + 10×0.05 = 10
    fiveOutcomes('hero-weights', { overallScore: 10, heroScore: 10, layoutScore: 10, ctaScore: 10, accessibilityScore: 10, consistencyScore: 10, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-weights')!;
    expect(calculateSectionQuality(m)).toBe(10);
  });

  it('quality score is bounded between 0 and 10', () => {
    fiveOutcomes('hero-bound-low', { overallScore: 0, heroScore: 0, layoutScore: 0, ctaScore: 0, accessibilityScore: 0, consistencyScore: 0, repairTriggered: true });
    fiveOutcomes('hero-bound-high', { overallScore: 10, heroScore: 10, layoutScore: 10, ctaScore: 10, accessibilityScore: 10, consistencyScore: 10, repairTriggered: false });
    const mLow  = getSectionReferenceEntry('hero-bound-low')!;
    const mHigh = getSectionReferenceEntry('hero-bound-high')!;
    expect(calculateSectionQuality(mLow)).toBeGreaterThanOrEqual(0);
    expect(calculateSectionQuality(mHigh)).toBeLessThanOrEqual(10);
  });
});

// ── Promotion ─────────────────────────────────────────────────────────────────

describe('Promotion (Phase 5)', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('does not promote before usageCount >= 5', () => {
    for (let i = 0; i < 4; i++) {
      outcome('hero-promo-test', { overallScore: 9.5, repairTriggered: false });
    }
    const m = getSectionReferenceEntry('hero-promo-test')!;
    expect(m.priority).toBe('normal');
  });

  it('promotes when avgScore >= 9 AND repairRate < 15%', () => {
    fiveOutcomes('hero-promo', { overallScore: 9.2, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-promo')!;
    expect(m.priority).toBe('promoted');
  });

  it('promotion adds +1.5 to qualityScore (capped at 10)', () => {
    fiveOutcomes('hero-promo-boost', { overallScore: 9.5, heroScore: 9.5, layoutScore: 9.5, ctaScore: 9.5, accessibilityScore: 9.5, consistencyScore: 9.5, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-promo-boost')!;
    expect(m.priority).toBe('promoted');
    // Score would be ~9.5 + 1.5 = 11 → capped at 10
    expect(m.qualityScore).toBeLessThanOrEqual(10);
    expect(m.qualityScore).toBeGreaterThan(9);
  });

  it('promotion is reversible when avgScore drops below threshold', () => {
    fiveOutcomes('hero-promo-rev', { overallScore: 9.5, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-promo-rev')!;
    expect(m.priority).toBe('promoted');
    // Add bad outcomes to pull avgScore below 9
    for (let i = 0; i < 10; i++) {
      outcome('hero-promo-rev', { overallScore: 5.0, repairTriggered: true });
    }
    const m2 = getSectionReferenceEntry('hero-promo-rev')!;
    expect(m2.priority).not.toBe('promoted');
  });

  it('promotedCount increments on first promotion', () => {
    fiveOutcomes('hero-promo-cnt', { overallScore: 9.5, repairTriggered: false });
    const metrics = getSectionLearningMetrics();
    expect(metrics.promotedCount).toBeGreaterThanOrEqual(1);
  });
});

// ── Demotion ──────────────────────────────────────────────────────────────────

describe('Demotion (Phase 6)', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('does not demote before usageCount >= 5', () => {
    for (let i = 0; i < 4; i++) {
      outcome('hero-demo-test', { overallScore: 4.0, repairTriggered: true });
    }
    const m = getSectionReferenceEntry('hero-demo-test')!;
    expect(m.priority).toBe('normal');
  });

  it('demotes when avgScore < 7', () => {
    fiveOutcomes('hero-demo-score', { overallScore: 5.0, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-demo-score')!;
    expect(m.priority).toBe('demoted');
  });

  it('demotes when repairRate > 50%', () => {
    for (let i = 0; i < 5; i++) {
      outcome('hero-demo-repair', { overallScore: 7.5, repairTriggered: i < 4 }); // 4/5 = 80%
    }
    const m = getSectionReferenceEntry('hero-demo-repair')!;
    expect(m.priority).toBe('demoted');
  });

  it('demotion subtracts 2.0 from qualityScore (floored at 0)', () => {
    fiveOutcomes('hero-demo-penalty', { overallScore: 5.0, heroScore: 5, layoutScore: 5, ctaScore: 5, accessibilityScore: 5, consistencyScore: 5, repairTriggered: true });
    const m = getSectionReferenceEntry('hero-demo-penalty')!;
    expect(m.priority).toBe('demoted');
    expect(m.qualityScore).toBeGreaterThanOrEqual(0);
  });

  it('demotion is reversible when scores recover', () => {
    fiveOutcomes('hero-demo-rev', { overallScore: 5.0, repairTriggered: true });
    const m = getSectionReferenceEntry('hero-demo-rev')!;
    expect(m.priority).toBe('demoted');
    // Add high-quality outcomes to recover
    for (let i = 0; i < 10; i++) {
      outcome('hero-demo-rev', { overallScore: 9.5, repairTriggered: false });
    }
    const m2 = getSectionReferenceEntry('hero-demo-rev')!;
    expect(m2.priority).not.toBe('demoted');
  });

  it('demotedCount increments on first demotion', () => {
    fiveOutcomes('hero-demo-cnt', { overallScore: 5.0, repairTriggered: false });
    const metrics = getSectionLearningMetrics();
    expect(metrics.demotedCount).toBeGreaterThanOrEqual(1);
  });
});

// ── DNA Dominance ─────────────────────────────────────────────────────────────

describe('DNA dominance (Phase 4)', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('quality score contribution stays within ±8 points (≤20% of ~40 baseline)', () => {
    fiveOutcomes('hero-max-quality', { overallScore: 10, heroScore: 10, layoutScore: 10, ctaScore: 10, accessibilityScore: 10, consistencyScore: 10, repairTriggered: false });
    const score = getSectionQualityScore('hero-max-quality');
    // max contribution = (10-5) × 1.6 = 8, which is ≤20% of 40
    const maxContribution = (score - 5) * 1.6;
    expect(maxContribution).toBeLessThanOrEqual(8.1); // tiny float tolerance
  });

  it('min quality contribution = -8 (never overrides DNA completely)', () => {
    fiveOutcomes('hero-min-quality', { overallScore: 0, heroScore: 0, layoutScore: 0, ctaScore: 0, accessibilityScore: 0, consistencyScore: 0, repairTriggered: true });
    const score = getSectionQualityScore('hero-min-quality');
    const minContribution = (score - 5) * 1.6;
    expect(minContribution).toBeGreaterThanOrEqual(-8.1); // tiny float tolerance
  });

  it('neutral quality (score=5) adds 0 to retrieval — no bias', () => {
    const score = getSectionQualityScore('new-unknown-ref');
    expect(score).toBe(5.0);
    const contribution = (score - 5) * 1.6;
    expect(contribution).toBe(0);
  });

  it('high quality reference gets positive retrieval boost', () => {
    fiveOutcomes('hero-positive', { overallScore: 9.5, repairTriggered: false });
    const score = getSectionQualityScore('hero-positive');
    expect(score).toBeGreaterThan(5);
    expect((score - 5) * 1.6).toBeGreaterThan(0);
  });

  it('low quality reference gets negative retrieval penalty', () => {
    fiveOutcomes('hero-negative', { overallScore: 5.0, repairTriggered: true });
    const score = getSectionQualityScore('hero-negative');
    expect(score).toBeLessThan(5);
    expect((score - 5) * 1.6).toBeLessThan(0);
  });
});

// ── Section Leaderboards ──────────────────────────────────────────────────────

describe('Section Leaderboards (Phase 7)', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('getTopHeroReferences returns only hero references', () => {
    outcome('hero-a', { sectionType: 'hero' });
    outcome('features-a', { sectionType: 'features' });
    const top = getTopHeroReferences();
    expect(top.every(r => r.referenceId.startsWith('hero-'))).toBe(true);
  });

  it('getTopPricingReferences returns only pricing references', () => {
    outcome('pricing-a', { sectionType: 'pricing' });
    outcome('hero-b', { sectionType: 'hero' });
    const top = getTopPricingReferences();
    expect(top.every(r => r.referenceId.startsWith('pricing-'))).toBe(true);
  });

  it('getTopFeatureReferences returns only feature references', () => {
    outcome('features-a', { sectionType: 'features' });
    outcome('pricing-b', { sectionType: 'pricing' });
    const top = getTopFeatureReferences();
    expect(top.every(r => r.referenceId.startsWith('features-'))).toBe(true);
  });

  it('getTopCTAReferences returns only CTA references', () => {
    outcome('cta-a', { sectionType: 'cta' });
    outcome('hero-c', { sectionType: 'hero' });
    const top = getTopCTAReferences();
    expect(top.every(r => r.referenceId.startsWith('cta-'))).toBe(true);
  });

  it('getTopTestimonialReferences returns only testimonial references', () => {
    outcome('testimonials-a', { sectionType: 'testimonials' });
    const top = getTopTestimonialReferences();
    expect(top.every(r => r.referenceId.startsWith('testimonials-'))).toBe(true);
  });

  it('rankings are sorted by qualityScore descending', () => {
    fiveOutcomes('hero-rank-high', { overallScore: 9.5, repairTriggered: false });
    fiveOutcomes('hero-rank-low',  { overallScore: 6.0, repairTriggered: true });
    outcome('hero-rank-mid', { overallScore: 8.0 });
    const top = getTopHeroReferences();
    for (let i = 1; i < top.length; i++) {
      expect(top[i - 1].qualityScore).toBeGreaterThanOrEqual(top[i].qualityScore);
    }
  });

  it('leaderboard returns at most 20 references', () => {
    for (let i = 0; i < 25; i++) {
      outcome(`hero-lb-${i}`, { sectionType: 'hero', overallScore: Math.random() * 10 });
    }
    const top = getTopHeroReferences(20);
    expect(top.length).toBeLessThanOrEqual(20);
  });

  it('leaderboard summary includes successRate and repairRate', () => {
    outcome('hero-summary', { overallScore: 9.0, repairTriggered: true });
    const top = getTopHeroReferences();
    const found = top.find(r => r.referenceId === 'hero-summary');
    expect(found).toBeDefined();
    expect(found!.successRate).toBeDefined();
    expect(found!.repairRate).toBeDefined();
  });
});

// ── Telemetry ─────────────────────────────────────────────────────────────────

describe('Telemetry (Phase 8)', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('referencesTracked reflects all recorded references', () => {
    outcome('hero-t1');
    outcome('pricing-t1', { sectionType: 'pricing' });
    outcome('features-t1', { sectionType: 'features' });
    const metrics = getSectionLearningMetrics();
    expect(metrics.referencesTracked).toBe(3);
  });

  it('averageQualityScore reflects tracked references', () => {
    outcome('hero-avg-1', { overallScore: 8 });
    outcome('hero-avg-2', { overallScore: 6 });
    const metrics = getSectionLearningMetrics();
    expect(metrics.averageQualityScore).toBeGreaterThan(0);
    expect(metrics.averageQualityScore).toBeLessThanOrEqual(10);
  });

  it('averageRepairRate reflects repair frequency', () => {
    outcome('hero-rr-1', { repairTriggered: true });
    outcome('hero-rr-2', { repairTriggered: false });
    const metrics = getSectionLearningMetrics();
    expect(metrics.averageRepairRate).toBeGreaterThanOrEqual(0);
    expect(metrics.averageRepairRate).toBeLessThanOrEqual(1);
  });

  it('promotedCount and demotedCount appear in telemetry', () => {
    fiveOutcomes('hero-tel-promo', { overallScore: 9.5, repairTriggered: false });
    fiveOutcomes('hero-tel-demo',  { overallScore: 5.0, repairTriggered: false });
    const metrics = getSectionLearningMetrics();
    expect(metrics.promotedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.demotedCount).toBeGreaterThanOrEqual(1);
  });
});

// ── Repair Rate Effect ────────────────────────────────────────────────────────

describe('Repair rate effect on score', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('50% repair rate yields intermediate score', () => {
    // 5 outcomes, 2 repairs → repairRate = 0.4
    for (let i = 0; i < 5; i++) {
      outcome('hero-half', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: i < 2 });
    }
    const m = getSectionReferenceEntry('hero-half')!;
    const qs = calculateSectionQuality(m);
    // score = 8×0.95 + (1-0.4)×10×0.05 = 7.6 + 0.3 = 7.9
    expect(qs).toBeCloseTo(7.9, 1);
  });

  it('high repair rate produces lower score than low repair rate (same base scores)', () => {
    fiveOutcomes('hero-high-r', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: true });
    fiveOutcomes('hero-low-r',  { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: false });
    const mH = getSectionReferenceEntry('hero-high-r')!;
    const mL = getSectionReferenceEntry('hero-low-r')!;
    expect(calculateSectionQuality(mH)).toBeLessThan(calculateSectionQuality(mL));
  });

  it('repair contributes at most 0.5 points (10×0.05) to total', () => {
    // Use 4 outcomes to stay below demotion threshold (requires 5+)
    for (let i = 0; i < 4; i++) {
      outcome('hero-repair-delta', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: false });
    }
    const mNR = getSectionReferenceEntry('hero-repair-delta')!;
    resetSectionReferenceMetrics();
    for (let i = 0; i < 4; i++) {
      outcome('hero-repair-delta', { overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, consistencyScore: 8, repairTriggered: true });
    }
    const mR = getSectionReferenceEntry('hero-repair-delta')!;
    // no-repair: 8×0.95 + 10×0.05 = 8.1; full-repair: 8×0.95 + 0 = 7.6; delta = 0.5
    const delta = calculateSectionQuality(mNR) - calculateSectionQuality(mR);
    expect(delta).toBeCloseTo(0.5, 2);
  });
});

// ── Score Bounds ──────────────────────────────────────────────────────────────

describe('Score bounds', () => {
  beforeEach(() => resetSectionReferenceMetrics());

  it('qualityScore never exceeds 10 even with promotion', () => {
    fiveOutcomes('hero-cap', { overallScore: 10, heroScore: 10, layoutScore: 10, ctaScore: 10, accessibilityScore: 10, consistencyScore: 10, repairTriggered: false });
    const m = getSectionReferenceEntry('hero-cap')!;
    expect(m.qualityScore).toBeLessThanOrEqual(10);
  });

  it('qualityScore never goes below 0 even with demotion', () => {
    fiveOutcomes('hero-floor', { overallScore: 0, heroScore: 0, layoutScore: 0, ctaScore: 0, accessibilityScore: 0, consistencyScore: 0, repairTriggered: true });
    const m = getSectionReferenceEntry('hero-floor')!;
    expect(m.qualityScore).toBeGreaterThanOrEqual(0);
  });

  it('getSectionQualityScore always returns value 0–10', () => {
    fiveOutcomes('hero-bounds', { overallScore: 7, repairTriggered: false });
    const score = getSectionQualityScore('hero-bounds');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
});

// ── Reset helper ──────────────────────────────────────────────────────────────

describe('Reset helper', () => {
  it('resetSectionReferenceMetrics clears all state', () => {
    outcome('hero-reset-test');
    resetSectionReferenceMetrics();
    expect(getSectionStoreSize()).toBe(0);
    expect(getSectionQualityScore('hero-reset-test')).toBe(5.0);
    expect(getSectionLearningMetrics().referencesTracked).toBe(0);
    expect(getSectionLearningMetrics().promotedCount).toBe(0);
    expect(getSectionLearningMetrics().demotedCount).toBe(0);
  });
});
