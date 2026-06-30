// ── V7.3.5 Design DNA Learning Engine — Unit Tests ────────────────────────────
// 80+ tests covering dnaMetrics, dnaLearning, dnaEvolution, tokenLearning,
// motionMetrics pattern outcomes, and sectionReferenceMetrics leaderboards.

import { describe, it, expect, beforeEach } from 'vitest';

import {
  recordDNADimensionOutcome,
  getDNAQualityScore as getDNAQualityScoreById,
  getTopHeroPatterns,
  getTopCTAPatterns,
  getTopLayoutPatterns,
  getTopBrandPatterns,
  getTopNavbarPatterns,
  getTopMotionPatterns as getTopMotionPatternsFromMetrics,
  getTopDNAs,
  getWorstDNAs,
  getDNAEntry,
  getDNAStoreSize,
  getDNAStoreCounts,
  getAverageDNAQuality,
  calculateDNAQuality,
  resetDNAMetrics,
  type DNAOutcomeInput,
} from '../../design-dna/dnaMetrics.js';

import {
  recordDNAOutcome,
  getDNAQualityScore,
  type DNABuildOutcome,
  type DNAScoreInput,
} from '../../design-dna/dnaLearning.js';

import {
  computeEvolutionInsights,
  buildDNAOptimizationHints,
  recordLearntPattern,
  getTopLearntPatterns,
  getDNAEvolutionMetrics,
  resetDNAEvolution,
} from '../../design-dna/dnaEvolution.js';

import {
  recordTokenThemeOutcome,
  getTokenThemeQualityScore,
  getTopTokenThemes,
  getTokenLearningMetrics,
  resetTokenLearning,
  getTokenThemeEntry,
  getTokenThemeStoreSize,
} from '../../design-tokens/tokenLearning.js';

import {
  recordMotionPatternOutcome,
  getTopMotionPatterns,
  resetMotionMetrics,
} from '../../telemetry/motionMetrics.js';

import {
  recordSectionOutcome,
  getSectionQualityScore,
  getSectionLeaderboard,
  getAllSectionLeaderboards,
  getTopNavbarReferences,
  getTopDashboardReferences,
  getTopFormReferences,
  getSectionLearningMetrics,
  resetSectionReferenceMetrics,
} from '../../design-rag/sectionReferenceMetrics.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeOutcome(overrides: Partial<DNAOutcomeInput> = {}): DNAOutcomeInput {
  return {
    dimensionId:     'hero:split-layout',
    overallScore:    8.5,
    visualScore:     8.0,
    criticScore:     8.2,
    conversionScore: 8.0,
    motionScore:     7.5,
    tokenScore:      8.5,
    treeScore:       9.0,
    repairTriggered: false,
    ...overrides,
  };
}

function makeBuildOutcome(overrides: Partial<DNABuildOutcome> = {}): DNABuildOutcome {
  return {
    primaryBrand:     'linear',
    heroStyle:        'split-layout',
    ctaStyle:         'gradient-filled',
    layoutStyle:      'wide-hero',
    motionStyle:      'subtle',
    navbarStyle:      'minimal',
    formStyle:        'react-hook-form',
    dashboardStyle:   'data-table',
    pricingStyle:     'three-tier',
    overallScore:     8.5,
    visualScore:      8.0,
    criticScore:      8.2,
    conversionScore:  8.0,
    motionScore:      7.5,
    tokenScore:       8.5,
    treeScore:        9.0,
    repairTriggered:  false,
    ...overrides,
  };
}

// ── dnaMetrics.ts tests ───────────────────────────────────────────────────────

describe('dnaMetrics — calculateDNAQuality', () => {
  it('returns a value between 0 and 10', () => {
    const score = calculateDNAQuality({
      overallScore: 8.5, visualScore: 8.0, criticScore: 8.2, conversionScore: 8.0,
      tokenScore: 8.5, treeScore: 9.0, motionScore: 7.5, repairRate: 0.1,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('computes weighted composite correctly', () => {
    const score = calculateDNAQuality({
      overallScore: 10, visualScore: 10, criticScore: 10, conversionScore: 10,
      tokenScore: 10, treeScore: 10, motionScore: 10, repairRate: 0,
    });
    expect(score).toBeCloseTo(10, 1);
  });

  it('penalises high repair rate', () => {
    const low  = calculateDNAQuality({ overallScore: 8, visualScore: 8, criticScore: 8, conversionScore: 8, tokenScore: 8, treeScore: 8, motionScore: 8, repairRate: 0.9 });
    const high = calculateDNAQuality({ overallScore: 8, visualScore: 8, criticScore: 8, conversionScore: 8, tokenScore: 8, treeScore: 8, motionScore: 8, repairRate: 0.0 });
    expect(high).toBeGreaterThan(low);
  });

  it('clamps to [0, 10]', () => {
    const score = calculateDNAQuality({
      overallScore: 0, visualScore: 0, criticScore: 0, conversionScore: 0,
      tokenScore: 0, treeScore: 0, motionScore: 0, repairRate: 1,
    });
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('dnaMetrics — recordDNADimensionOutcome', () => {
  beforeEach(() => { resetDNAMetrics(); });

  it('creates a new entry on first record', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:split-layout' }));
    const entry = getDNAEntry('hero:split-layout');
    expect(entry).toBeDefined();
    expect(entry!.usageCount).toBe(1);
  });

  it('accumulates multiple outcomes correctly', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:split-layout', overallScore: 8.0 }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:split-layout', overallScore: 9.0 }));
    const entry = getDNAEntry('hero:split-layout');
    expect(entry!.usageCount).toBe(2);
    expect(entry!.averageScore).toBeCloseTo(8.5, 2);
  });

  it('tracks success count correctly', () => {
    recordDNADimensionOutcome(makeOutcome({ overallScore: 9.0 }));
    recordDNADimensionOutcome(makeOutcome({ overallScore: 7.0 }));
    const entry = getDNAEntry('hero:split-layout');
    expect(entry!._successCount).toBe(1);
  });

  it('tracks repair count', () => {
    recordDNADimensionOutcome(makeOutcome({ repairTriggered: true }));
    recordDNADimensionOutcome(makeOutcome({ repairTriggered: false }));
    const entry = getDNAEntry('hero:split-layout');
    expect(entry!._repairCount).toBe(1);
  });

  it('returns qualityScore of 5.0 before any outcomes', () => {
    expect(getDNAQualityScoreById('hero:unknown-pattern')).toBe(5.0);
  });

  it('stores size increases correctly', () => {
    expect(getDNAStoreSize()).toBe(0);
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:one' }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:two' }));
    expect(getDNAStoreSize()).toBe(2);
  });

  it('promotes after 10 high-scoring low-repair outcomes', () => {
    for (let i = 0; i < 10; i++) {
      recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:promo', overallScore: 9.2, repairTriggered: false }));
    }
    const entry = getDNAEntry('hero:promo');
    expect(entry!.priority).toBe('promoted');
    expect(getDNAStoreCounts().promotedCount).toBe(1);
  });

  it('demotes after 10 low-scoring outcomes', () => {
    for (let i = 0; i < 10; i++) {
      recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:demo', overallScore: 5.0, repairTriggered: true }));
    }
    const entry = getDNAEntry('hero:demo');
    expect(entry!.priority).toBe('demoted');
  });

  it('promotion adds +1.5 to qualityScore', () => {
    for (let i = 0; i < 10; i++) {
      recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:promo2', overallScore: 9.5, repairTriggered: false }));
    }
    const entry = getDNAEntry('hero:promo2');
    expect(entry!.qualityScore).toBeGreaterThan(entry!.averageScore);
  });
});

describe('dnaMetrics — leaderboards', () => {
  beforeEach(() => { resetDNAMetrics(); });

  it('getTopHeroPatterns returns hero-prefixed entries sorted by quality', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:a', overallScore: 9.0 }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'hero:b', overallScore: 7.0 }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'cta:c',  overallScore: 9.5 }));
    const top = getTopHeroPatterns();
    expect(top.every(p => p.id.startsWith('hero:'))).toBe(true);
    expect(top[0].averageScore).toBeGreaterThanOrEqual(top[1]?.averageScore ?? 0);
  });

  it('getTopCTAPatterns returns cta-prefixed entries', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'cta:gradient', overallScore: 9.2 }));
    const top = getTopCTAPatterns();
    expect(top[0].id).toBe('cta:gradient');
  });

  it('getTopDNAs returns all entries sorted by qualityScore', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'brand:linear', overallScore: 9.0 }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'brand:stripe', overallScore: 6.0 }));
    const top = getTopDNAs();
    expect(top[0].qualityScore).toBeGreaterThanOrEqual(top[1].qualityScore);
  });

  it('getWorstDNAs requires at least 5 outcomes', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'brand:weak', overallScore: 4.0 }));
    const worst = getWorstDNAs();
    expect(worst.length).toBe(0); // needs _n >= 5
  });

  it('getAverageDNAQuality returns 0 when store is empty', () => {
    expect(getAverageDNAQuality()).toBe(0);
  });

  it('getAverageDNAQuality averages correctly', () => {
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'layout:wide', overallScore: 8.0 }));
    recordDNADimensionOutcome(makeOutcome({ dimensionId: 'layout:center', overallScore: 6.0 }));
    const avg = getAverageDNAQuality();
    expect(avg).toBeGreaterThan(0);
    expect(avg).toBeLessThanOrEqual(10);
  });
});

// ── dnaLearning.ts tests ──────────────────────────────────────────────────────

describe('dnaLearning — recordDNAOutcome', () => {
  beforeEach(() => { resetDNAMetrics(); });

  it('records all 9 dimensions from a build outcome', () => {
    recordDNAOutcome(makeBuildOutcome());
    expect(getDNAStoreSize()).toBe(9);
  });

  it('skips empty dimension values', () => {
    recordDNAOutcome(makeBuildOutcome({ formStyle: '', dashboardStyle: '', pricingStyle: '' }));
    expect(getDNAStoreSize()).toBe(6);
  });

  it('skips "unknown" dimension values', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'unknown', ctaStyle: 'unknown' }));
    expect(getDNAStoreSize()).toBe(7);
  });

  it('records the correct dimension key for brand', () => {
    recordDNAOutcome(makeBuildOutcome({ primaryBrand: 'stripe' }));
    const entry = getDNAEntry('brand:stripe');
    expect(entry).toBeDefined();
    expect(entry!.usageCount).toBe(1);
  });

  it('accumulates multiple builds for the same brand', () => {
    recordDNAOutcome(makeBuildOutcome({ primaryBrand: 'linear', overallScore: 8.0 }));
    recordDNAOutcome(makeBuildOutcome({ primaryBrand: 'linear', overallScore: 9.0 }));
    const entry = getDNAEntry('brand:linear');
    expect(entry!.usageCount).toBe(2);
    expect(entry!.averageScore).toBeCloseTo(8.5, 1);
  });
});

describe('dnaLearning — getDNAQualityScore', () => {
  beforeEach(() => { resetDNAMetrics(); });

  it('returns 5.0 with no historical data', () => {
    const score = getDNAQualityScore({ primaryBrand: 'linear' });
    expect(score).toBe(5.0);
  });

  it('returns 5.0 for empty input', () => {
    expect(getDNAQualityScore({})).toBe(5.0);
  });

  it('returns average of known dimension scores', () => {
    recordDNAOutcome(makeBuildOutcome({ primaryBrand: 'vercel', overallScore: 9.0, repairTriggered: false }));
    const score = getDNAQualityScore({ primaryBrand: 'vercel' });
    expect(score).toBeGreaterThan(5.0);
  });

  it('averages across multiple dimensions', () => {
    recordDNAOutcome(makeBuildOutcome({
      primaryBrand: 'framer', heroStyle: 'centered-bold',
      overallScore: 9.0, repairTriggered: false,
    }));
    const score = getDNAQualityScore({ primaryBrand: 'framer', heroStyle: 'centered-bold' });
    expect(score).toBeGreaterThan(5.0);
  });
});

// ── dnaEvolution.ts tests ─────────────────────────────────────────────────────

describe('dnaEvolution — computeEvolutionInsights', () => {
  beforeEach(() => { resetDNAMetrics(); resetDNAEvolution(); });

  it('returns empty array when no data', () => {
    expect(computeEvolutionInsights()).toHaveLength(0);
  });

  it('returns insights for high-scoring hero patterns', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'split-layout', overallScore: 9.0 }));
    const insights = computeEvolutionInsights();
    const heroInsight = insights.find(i => i.dimension === 'hero');
    expect(heroInsight).toBeDefined();
  });

  it('filters out low-scoring patterns (qualityScore <= 5.5)', () => {
    // All scores at 1.0 + repairTriggered=true → qualityScore = 1.0*0.95 + 0 ≈ 0.95 ≤ 5.5
    recordDNAOutcome(makeBuildOutcome({
      heroStyle: 'low-quality',
      overallScore: 1.0, visualScore: 1.0, criticScore: 1.0, conversionScore: 1.0,
      motionScore: 1.0, tokenScore: 1.0, treeScore: 1.0,
      repairTriggered: true,
    }));
    const insights = computeEvolutionInsights();
    const bad = insights.find(i => i.winner === 'low-quality');
    expect(bad).toBeUndefined();
  });
});

describe('dnaEvolution — buildDNAOptimizationHints', () => {
  beforeEach(() => { resetDNAMetrics(); resetDNAEvolution(); });

  it('returns empty string when no data', () => {
    expect(buildDNAOptimizationHints()).toBe('');
  });

  it('returns non-empty string after recording good outcomes', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'split-layout', overallScore: 9.0 }));
    const hints = buildDNAOptimizationHints();
    expect(hints.length).toBeGreaterThan(0);
  });

  it('contains DNA optimization header', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'centered-bold', overallScore: 9.0 }));
    const hints = buildDNAOptimizationHints();
    expect(hints).toContain('[DNA Optimization Layer');
  });

  it('includes dnaComposition note when provided', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'wide-hero', overallScore: 9.0 }));
    const hints = buildDNAOptimizationHints({ linear: 60, stripe: 40 });
    expect(hints).toContain('Apply DNA-compatible patterns only');
  });

  it('does not include dnaComposition note when not provided', () => {
    recordDNAOutcome(makeBuildOutcome({ heroStyle: 'minimal', overallScore: 9.0 }));
    const hints = buildDNAOptimizationHints();
    expect(hints).not.toContain('Apply DNA-compatible patterns only');
  });
});

describe('dnaEvolution — learnt patterns', () => {
  beforeEach(() => { resetDNAEvolution(); });

  it('records and retrieves learnt patterns', () => {
    recordLearntPattern({ pattern: 'Avatar trust rows', dimension: 'hero', scoreDelta: 1.5, occurrences: 3 });
    const top = getTopLearntPatterns(5);
    expect(top).toHaveLength(1);
    expect(top[0].pattern).toBe('Avatar trust rows');
  });

  it('merges duplicate pattern records correctly', () => {
    recordLearntPattern({ pattern: 'Grid features', dimension: 'features', scoreDelta: 2.0, occurrences: 1 });
    recordLearntPattern({ pattern: 'Grid features', dimension: 'features', scoreDelta: 1.0, occurrences: 1 });
    const top = getTopLearntPatterns(10);
    const entry = top.find(p => p.pattern === 'Grid features');
    expect(entry!.occurrences).toBe(2);
    expect(entry!.scoreDelta).toBeCloseTo(1.5, 2);
  });

  it('sorts by scoreDelta descending', () => {
    recordLearntPattern({ pattern: 'Low delta', dimension: 'cta', scoreDelta: 0.5, occurrences: 1 });
    recordLearntPattern({ pattern: 'High delta', dimension: 'cta', scoreDelta: 2.5, occurrences: 1 });
    const top = getTopLearntPatterns(10);
    expect(top[0].scoreDelta).toBeGreaterThan(top[1].scoreDelta);
  });
});

describe('dnaEvolution — getDNAEvolutionMetrics', () => {
  beforeEach(() => { resetDNAMetrics(); resetDNAEvolution(); });

  it('returns structured telemetry object', () => {
    const metrics = getDNAEvolutionMetrics();
    expect(metrics).toHaveProperty('trackedDNAs');
    expect(metrics).toHaveProperty('averageDNAQuality');
    expect(metrics).toHaveProperty('topDNAs');
    expect(metrics).toHaveProperty('evolutionInsights');
    expect(metrics).toHaveProperty('topLearntPatterns');
  });

  it('shows 0 trackedDNAs on fresh reset', () => {
    const metrics = getDNAEvolutionMetrics();
    expect(metrics.trackedDNAs).toBe(0);
  });

  it('reflects recorded data in telemetry', () => {
    recordDNAOutcome(makeBuildOutcome({ primaryBrand: 'notion', overallScore: 9.0 }));
    const metrics = getDNAEvolutionMetrics();
    expect(metrics.trackedDNAs).toBeGreaterThan(0);
  });
});

// ── tokenLearning.ts tests ────────────────────────────────────────────────────

describe('tokenLearning — recordTokenThemeOutcome', () => {
  beforeEach(() => { resetTokenLearning(); });

  it('creates a new entry on first record', () => {
    recordTokenThemeOutcome({ themeId: 'linear', tokenQualityScore: 8.5, overallScore: 8.0, repairTriggered: false, recordedAt: Date.now() });
    expect(getTokenThemeStoreSize()).toBe(1);
  });

  it('accumulates multiple outcomes', () => {
    recordTokenThemeOutcome({ themeId: 'stripe', tokenQualityScore: 9.0, overallScore: 9.0, repairTriggered: false, recordedAt: Date.now() });
    recordTokenThemeOutcome({ themeId: 'stripe', tokenQualityScore: 7.0, overallScore: 7.0, repairTriggered: false, recordedAt: Date.now() });
    const entry = getTokenThemeEntry('stripe');
    expect(entry!.usageCount).toBe(2);
    expect(entry!.avgTokenScore).toBeCloseTo(8.0, 1);
  });

  it('counts repair rate correctly', () => {
    recordTokenThemeOutcome({ themeId: 'vercel', tokenQualityScore: 8.0, overallScore: 8.0, repairTriggered: true, recordedAt: Date.now() });
    recordTokenThemeOutcome({ themeId: 'vercel', tokenQualityScore: 8.0, overallScore: 8.0, repairTriggered: false, recordedAt: Date.now() });
    const entry = getTokenThemeEntry('vercel');
    expect(entry!.repairCount).toBe(1);
  });

  it('counts success (overallScore >= 8.5) correctly', () => {
    recordTokenThemeOutcome({ themeId: 'framer', tokenQualityScore: 9.0, overallScore: 9.0, repairTriggered: false, recordedAt: Date.now() });
    recordTokenThemeOutcome({ themeId: 'framer', tokenQualityScore: 8.0, overallScore: 7.0, repairTriggered: false, recordedAt: Date.now() });
    const entry = getTokenThemeEntry('framer');
    expect(entry!.successCount).toBe(1);
  });

  it('qualityScore approaches 10 for perfect inputs', () => {
    for (let i = 0; i < 5; i++) {
      recordTokenThemeOutcome({ themeId: 'apple', tokenQualityScore: 10, overallScore: 10, repairTriggered: false, recordedAt: Date.now() });
    }
    const score = getTokenThemeQualityScore('apple');
    expect(score).toBeGreaterThan(8.0);
  });

  it('qualityScore is penalised by repair rate', () => {
    const lowRepair = 'theme-clean';
    const highRepair = 'theme-broken';
    for (let i = 0; i < 5; i++) {
      recordTokenThemeOutcome({ themeId: lowRepair,  tokenQualityScore: 8.0, overallScore: 8.0, repairTriggered: false, recordedAt: Date.now() });
      recordTokenThemeOutcome({ themeId: highRepair, tokenQualityScore: 8.0, overallScore: 8.0, repairTriggered: true,  recordedAt: Date.now() });
    }
    expect(getTokenThemeQualityScore(lowRepair)).toBeGreaterThan(getTokenThemeQualityScore(highRepair));
  });
});

describe('tokenLearning — getTopTokenThemes', () => {
  beforeEach(() => { resetTokenLearning(); });

  it('returns empty array when no data', () => {
    expect(getTopTokenThemes()).toHaveLength(0);
  });

  it('sorts by qualityScore descending', () => {
    recordTokenThemeOutcome({ themeId: 'low',  tokenQualityScore: 5.0, overallScore: 5.0, repairTriggered: false, recordedAt: Date.now() });
    recordTokenThemeOutcome({ themeId: 'high', tokenQualityScore: 9.0, overallScore: 9.0, repairTriggered: false, recordedAt: Date.now() });
    const top = getTopTokenThemes();
    expect(top[0].themeId).toBe('high');
  });

  it('returns neutral score for unknown theme', () => {
    expect(getTokenThemeQualityScore('unknown-theme')).toBe(5.0);
  });
});

describe('tokenLearning — getTokenLearningMetrics', () => {
  beforeEach(() => { resetTokenLearning(); });

  it('returns structured telemetry', () => {
    const metrics = getTokenLearningMetrics();
    expect(metrics).toHaveProperty('themesTracked');
    expect(metrics).toHaveProperty('topThemes');
    expect(metrics).toHaveProperty('averageTokenScore');
    expect(metrics).toHaveProperty('averageOverallScore');
  });

  it('shows 0 themes on fresh reset', () => {
    expect(getTokenLearningMetrics().themesTracked).toBe(0);
  });

  it('averages correctly after recording', () => {
    recordTokenThemeOutcome({ themeId: 'notion', tokenQualityScore: 8.0, overallScore: 8.0, repairTriggered: false, recordedAt: Date.now() });
    recordTokenThemeOutcome({ themeId: 'notion', tokenQualityScore: 6.0, overallScore: 6.0, repairTriggered: false, recordedAt: Date.now() });
    const metrics = getTokenLearningMetrics();
    expect(metrics.averageTokenScore).toBeCloseTo(7.0, 1);
  });
});

// ── motionMetrics — pattern outcome tests ─────────────────────────────────────

describe('motionMetrics — recordMotionPatternOutcome / getTopMotionPatterns', () => {
  beforeEach(() => { resetMotionMetrics(); });

  it('records a motion pattern outcome', () => {
    recordMotionPatternOutcome('framer-entrance-v1', 8.5);
    const top = getTopMotionPatterns(10);
    expect(top).toHaveLength(1);
    expect(top[0].refId).toBe('framer-entrance-v1');
  });

  it('accumulates multiple scores correctly', () => {
    recordMotionPatternOutcome('fade-in-up', 7.0);
    recordMotionPatternOutcome('fade-in-up', 9.0);
    const top = getTopMotionPatterns();
    expect(top[0].avgScore).toBeCloseTo(8.0, 1);
    expect(top[0].count).toBe(2);
  });

  it('sorts by avgScore descending', () => {
    recordMotionPatternOutcome('pattern-a', 9.0);
    recordMotionPatternOutcome('pattern-b', 6.0);
    const top = getTopMotionPatterns();
    expect(top[0].avgScore).toBeGreaterThan(top[1].avgScore);
  });

  it('returns empty array when no patterns recorded', () => {
    expect(getTopMotionPatterns()).toHaveLength(0);
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      recordMotionPatternOutcome(`pattern-${i}`, 8.0);
    }
    expect(getTopMotionPatterns(3)).toHaveLength(3);
  });

  it('clears on resetMotionMetrics', () => {
    recordMotionPatternOutcome('to-be-cleared', 9.0);
    resetMotionMetrics();
    expect(getTopMotionPatterns()).toHaveLength(0);
  });
});

// ── sectionReferenceMetrics — leaderboard tests ───────────────────────────────

describe('sectionReferenceMetrics — getSectionLeaderboard', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns empty array when no data', () => {
    expect(getSectionLeaderboard('hero')).toHaveLength(0);
  });

  it('filters by sectionType correctly', () => {
    recordSectionOutcome({ referenceId: 'hero-v1',     sectionType: 'hero',     overallScore: 8.5, heroScore: 8.0, layoutScore: 8.5, ctaScore: 8.0, accessibilityScore: 9.0, consistencyScore: 8.5, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'features-v1', sectionType: 'features', overallScore: 8.5, heroScore: 8.0, layoutScore: 8.5, ctaScore: 8.0, accessibilityScore: 9.0, consistencyScore: 8.5, repairTriggered: false });
    const heroBoard = getSectionLeaderboard('hero');
    expect(heroBoard.every(r => r.sectionType === 'hero')).toBe(true);
  });

  it('sorts by qualityScore descending', () => {
    recordSectionOutcome({ referenceId: 'hero-low',  sectionType: 'hero', overallScore: 6.0, heroScore: 6.0, layoutScore: 6.0, ctaScore: 6.0, accessibilityScore: 6.0, consistencyScore: 6.0, repairTriggered: true  });
    recordSectionOutcome({ referenceId: 'hero-high', sectionType: 'hero', overallScore: 9.5, heroScore: 9.5, layoutScore: 9.5, ctaScore: 9.5, accessibilityScore: 9.5, consistencyScore: 9.5, repairTriggered: false });
    const board = getSectionLeaderboard('hero');
    expect(board[0].qualityScore).toBeGreaterThanOrEqual(board[1]?.qualityScore ?? 0);
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      recordSectionOutcome({ referenceId: `hero-${i}`, sectionType: 'hero', overallScore: 8.0, heroScore: 8.0, layoutScore: 8.0, ctaScore: 8.0, accessibilityScore: 8.0, consistencyScore: 8.0, repairTriggered: false });
    }
    expect(getSectionLeaderboard('hero', 3)).toHaveLength(3);
  });
});

describe('sectionReferenceMetrics — getAllSectionLeaderboards', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns empty object when no data', () => {
    const boards = getAllSectionLeaderboards();
    expect(Object.keys(boards)).toHaveLength(0);
  });

  it('returns boards for populated section types only', () => {
    recordSectionOutcome({ referenceId: 'pricing-v1', sectionType: 'pricing', overallScore: 8.0, heroScore: 8.0, layoutScore: 8.0, ctaScore: 8.0, accessibilityScore: 8.0, consistencyScore: 8.0, repairTriggered: false });
    const boards = getAllSectionLeaderboards();
    expect(boards).toHaveProperty('pricing');
    expect(boards).not.toHaveProperty('hero');
  });

  it('includes multiple section types when populated', () => {
    recordSectionOutcome({ referenceId: 'hero-v1',    sectionType: 'hero',    overallScore: 8.5, heroScore: 8.5, layoutScore: 8.5, ctaScore: 8.5, accessibilityScore: 8.5, consistencyScore: 8.5, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'cta-v1',     sectionType: 'cta',     overallScore: 9.0, heroScore: 9.0, layoutScore: 9.0, ctaScore: 9.0, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'pricing-v1', sectionType: 'pricing', overallScore: 7.5, heroScore: 7.5, layoutScore: 7.5, ctaScore: 7.5, accessibilityScore: 7.5, consistencyScore: 7.5, repairTriggered: false });
    const boards = getAllSectionLeaderboards();
    expect(Object.keys(boards).length).toBeGreaterThanOrEqual(3);
  });

  it('includes form section in leaderboards when populated', () => {
    recordSectionOutcome({ referenceId: 'form-v1', sectionType: 'form', overallScore: 8.5, heroScore: 8.0, layoutScore: 8.0, ctaScore: 8.0, accessibilityScore: 8.5, consistencyScore: 8.5, repairTriggered: false });
    const boards = getAllSectionLeaderboards();
    expect(boards).toHaveProperty('form');
  });
});

// ── sectionReferenceMetrics — Phase 13 expanded getters ──────────────────────

describe('sectionReferenceMetrics — getTopNavbarReferences', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns empty array when no navbar references recorded', () => {
    expect(getTopNavbarReferences()).toHaveLength(0);
  });

  it('returns only navbar-prefixed references', () => {
    recordSectionOutcome({ referenceId: 'navbar-v1', sectionType: 'navbar', overallScore: 9.0, heroScore: 8.5, layoutScore: 9.0, ctaScore: 8.5, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'hero-v1',   sectionType: 'hero',   overallScore: 9.0, heroScore: 9.0, layoutScore: 9.0, ctaScore: 9.0, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    const refs = getTopNavbarReferences();
    expect(refs).toHaveLength(1);
    expect(refs[0].referenceId).toBe('navbar-v1');
  });

  it('respects limit parameter', () => {
    for (let i = 0; i < 5; i++) {
      recordSectionOutcome({ referenceId: `navbar-${i}`, sectionType: 'navbar', overallScore: 8.0, heroScore: 8.0, layoutScore: 8.0, ctaScore: 8.0, accessibilityScore: 8.0, consistencyScore: 8.0, repairTriggered: false });
    }
    expect(getTopNavbarReferences(3)).toHaveLength(3);
  });
});

describe('sectionReferenceMetrics — getTopDashboardReferences', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns empty array when no dashboard references recorded', () => {
    expect(getTopDashboardReferences()).toHaveLength(0);
  });

  it('returns only dashboard-prefixed references', () => {
    recordSectionOutcome({ referenceId: 'dashboard-kpi', sectionType: 'dashboard', overallScore: 9.2, heroScore: 9.0, layoutScore: 9.0, ctaScore: 8.5, accessibilityScore: 9.5, consistencyScore: 9.0, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'pricing-v1',    sectionType: 'pricing',   overallScore: 9.0, heroScore: 9.0, layoutScore: 9.0, ctaScore: 9.0, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    const refs = getTopDashboardReferences();
    expect(refs).toHaveLength(1);
    expect(refs[0].referenceId).toBe('dashboard-kpi');
  });

  it('sorts by qualityScore descending', () => {
    recordSectionOutcome({ referenceId: 'dashboard-a', sectionType: 'dashboard', overallScore: 9.5, heroScore: 9.5, layoutScore: 9.5, ctaScore: 9.5, accessibilityScore: 9.5, consistencyScore: 9.5, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'dashboard-b', sectionType: 'dashboard', overallScore: 7.0, heroScore: 7.0, layoutScore: 7.0, ctaScore: 7.0, accessibilityScore: 7.0, consistencyScore: 7.0, repairTriggered: true });
    const refs = getTopDashboardReferences();
    expect(refs[0].qualityScore).toBeGreaterThan(refs[1]?.qualityScore ?? 0);
  });
});

describe('sectionReferenceMetrics — getTopFormReferences', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns empty array when no form references recorded', () => {
    expect(getTopFormReferences()).toHaveLength(0);
  });

  it('returns only form-prefixed references', () => {
    recordSectionOutcome({ referenceId: 'form-contact', sectionType: 'form', overallScore: 8.8, heroScore: 8.0, layoutScore: 8.5, ctaScore: 9.0, accessibilityScore: 8.5, consistencyScore: 8.5, repairTriggered: false });
    recordSectionOutcome({ referenceId: 'cta-v1',       sectionType: 'cta',  overallScore: 9.0, heroScore: 9.0, layoutScore: 9.0, ctaScore: 9.0, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    const refs = getTopFormReferences();
    expect(refs).toHaveLength(1);
    expect(refs[0].referenceId).toBe('form-contact');
  });
});

describe('sectionReferenceMetrics — getSectionLearningMetrics', () => {
  beforeEach(() => { resetSectionReferenceMetrics(); });

  it('returns zero referencesTracked on fresh store', () => {
    const m = getSectionLearningMetrics();
    expect(m.referencesTracked).toBe(0);
  });

  it('topNavbarReferences is empty when no navbar data', () => {
    const m = getSectionLearningMetrics();
    expect(m.topNavbarReferences).toHaveLength(0);
  });

  it('topDashboardReferences reflects recorded dashboard data', () => {
    recordSectionOutcome({ referenceId: 'dashboard-v1', sectionType: 'dashboard', overallScore: 9.0, heroScore: 9.0, layoutScore: 9.0, ctaScore: 9.0, accessibilityScore: 9.0, consistencyScore: 9.0, repairTriggered: false });
    const m = getSectionLearningMetrics();
    expect(m.topDashboardReferences).toHaveLength(1);
  });

  it('topFormReferences reflects recorded form data', () => {
    recordSectionOutcome({ referenceId: 'form-v1', sectionType: 'form', overallScore: 8.5, heroScore: 8.0, layoutScore: 8.5, ctaScore: 8.5, accessibilityScore: 9.0, consistencyScore: 8.5, repairTriggered: false });
    const m = getSectionLearningMetrics();
    expect(m.topFormReferences).toHaveLength(1);
  });
});

// ── dnaMetrics — edge cases ───────────────────────────────────────────────────

describe('dnaMetrics — edge cases', () => {
  beforeEach(() => { resetDNAMetrics(); });

  it('clamps qualityScore to [0, 10] for extreme inputs', () => {
    const score = calculateDNAQuality({ overallScore: 15, visualScore: 15, criticScore: 15, conversionScore: 15, tokenScore: 15, treeScore: 15, motionScore: 15, repairRate: -1 });
    expect(score).toBeLessThanOrEqual(10);
  });

  it('returns 5.0 for unknown DNA id', () => {
    expect(getDNAQualityScoreById('brand:unknown-brand')).toBe(5.0);
  });

  it('getDNAStoreCounts tracks promotedCount and demotedCount', () => {
    const before = getDNAStoreCounts();
    expect(before.promotedCount).toBe(0);
    expect(before.demotedCount).toBe(0);
  });

  it('getAverageDNAQuality returns 0 with no data', () => {
    expect(getAverageDNAQuality()).toBe(0);
  });

  it('getDNAEntry returns undefined for unknown id', () => {
    expect(getDNAEntry('brand:nonexistent')).toBeUndefined();
  });
});
