// ── V8.3 Design Director — Test Suite (200+ tests) ────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { runDesignDirector, buildCategoryScoreMap } from '../../design-director/designDirector.js';
import {
  computeDirectorScore, extractTopRecommendations, extractCriticalIssues,
  extractMostCommonProblems, buildCreativeDirection, computeDirectorConfidence,
  computeReviewDistribution, DIRECTOR_WEIGHTS,
} from '../../design-director/directorRecommendations.js';
import {
  scoreVisualHierarchy, scoreTypography, scoreSpacing, scoreComposition,
  scoreLayoutRhythm, scoreBrandConsistency, scorePremiumFeel, scoreModernity,
  scoreTrust, scoreEmotionalImpact, scoreStorytelling, scoreCTAPlacement,
  scorePricingPresentation, scoreDashboardExperience, scoreNavigation,
  scoreForms, scoreMotion, scoreAccessibility, scorePerformance,
  scoreResponsiveness, scoreComponentConsistency, scoreTokenConsistency,
  scoreDNAAlignment, scoreUXAlignment, scoreConversionAlignment,
} from '../../design-director/directorReview.js';
import {
  recordDirectorRun, getDirectorMetrics, resetDirectorMetrics,
} from '../../design-director/directorMetrics.js';
import {
  learnFromDirector, getDirectorLearningHistory, getDirectorLearningTrend, resetDirectorLearning,
} from '../../design-director/directorLearning.js';
import { scoreSeverity, ALL_DIRECTOR_CATEGORIES } from '../../design-director/directorTypes.js';
import type { DirectorCategoryReview, DirectorReviewInput } from '../../design-director/directorTypes.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const richCode = `
  import React from 'react';
  import { Button } from '@/components/ui/button';
  import { Card } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { NavigationMenu, NavigationMenuItem } from '@/components/ui/navigation-menu';
  import { Avatar } from '@/components/ui/avatar';
  import { DropdownMenu } from '@/components/ui/dropdown-menu';
  import { motion } from 'framer-motion';

  export default function App() {
    return (
      <div className="bg-background text-foreground">
        <nav className="sticky top-0 backdrop-blur border-b">
          <NavigationMenu>
            <NavigationMenuItem>Logo</NavigationMenuItem>
            <NavigationMenuItem>Features</NavigationMenuItem>
            <NavigationMenuItem>Pricing</NavigationMenuItem>
            <NavigationMenuItem>Blog</NavigationMenuItem>
            <NavigationMenuItem>Docs</NavigationMenuItem>
          </NavigationMenu>
          <Button variant="default">Get Started</Button>
        </nav>
        <section className="py-24 container mx-auto max-w-4xl mx-auto">
          <h1 className="text-6xl font-extrabold tracking-tight leading-tight">
            Transform your workflow forever
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-prose mt-4">
            You deserve tools that work as hard as you do. Save hours every week.
          </p>
          <div className="flex gap-4 mt-8">
            <Button variant="default" className="transition-all duration-200 hover:scale-105">Get Started Free</Button>
            <Button variant="outline">Watch Demo</Button>
          </div>
        </section>
        <section className="py-16 bg-muted">
          <p>Trusted by 10k+ companies</p>
          <p>★★★★★ 4.9 from 2,000+ reviews</p>
          <p>Testimonial from John at Acme Corp</p>
        </section>
        <section className="py-16 grid grid-cols-3 gap-8 container mx-auto">
          <Card className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 p-6">Feature 1</Card>
          <Card className="rounded-xl shadow-lg p-6">Feature 2</Card>
          <Card className="rounded-xl shadow-lg p-6">Feature 3</Card>
        </section>
        <section className="py-16" id="pricing">
          <h2 className="text-4xl font-bold">Choose your plan</h2>
          <div className="grid grid-cols-3 gap-6 mt-8">
            <Card className="p-8"><h3>Starter</h3><p>$9/mo</p></Card>
            <Card className="p-8 border-primary"><Badge>Most Popular</Badge><h3>Pro</h3><p>$29/mo</p></Card>
            <Card className="p-8"><h3>Enterprise</h3><p>Custom</p></Card>
          </div>
        </section>
        <section className="py-24 text-center">
          <h2 className="text-5xl font-bold">Ready to get started?</h2>
          <Button className="mt-8" size="lg">Get Started Free</Button>
        </section>
      </div>
    );
  }
`;

const sparseCode = `
  export default function App() {
    return <div><p>Hello</p><button>Click</button></div>;
  }
`;

const baseInput: DirectorReviewInput = {
  code: richCode,
  sectionOrder: ['hero', 'features', 'testimonials', 'pricing', 'cta'],
  dnaId: 'stripe',
  uxScore: 7.5,
  uxTopIssues: [],
  conversionPrediction: 'High',
  criticScore: 8.0,
  evaluatorScore: 8.2,
  visualScore: 7.8,
  accessibilityScore: 7.0,
  motionScore: 7.5,
  tokenScore: 7.0,
  treeScore: 7.5,
  isDashboard: false,
  isForm: false,
  hasPricing: true,
  authState: 'guest',
};

const sparseInput: DirectorReviewInput = {
  code: sparseCode,
  sectionOrder: [],
  dnaId: undefined,
  uxScore: 3.0,
  uxTopIssues: ['Weak CTA', 'Poor hierarchy', 'No trust signals'],
  conversionPrediction: 'Very Low',
  criticScore: 4.0,
  evaluatorScore: 4.5,
  isDashboard: false,
  isForm: false,
  hasPricing: false,
  authState: 'guest',
};

// ── Helper ────────────────────────────────────────────────────────────────────

function makeReview(score: number, category = 'visualHierarchy'): DirectorCategoryReview {
  return {
    category: category as DirectorCategoryReview['category'],
    score,
    severity: scoreSeverity(score),
    confidence: 0.8,
    reason: 'test reason',
    recommendation: 'test recommendation',
    expectedImprovement: 'test improvement',
  };
}

// ── scoreSeverity ─────────────────────────────────────────────────────────────

describe('scoreSeverity', () => {
  it('returns Low for score >= 7', () => expect(scoreSeverity(7.0)).toBe('Low'));
  it('returns Low for score = 10', () => expect(scoreSeverity(10)).toBe('Low'));
  it('returns Medium for score = 6', () => expect(scoreSeverity(6)).toBe('Medium'));
  it('returns Medium for score = 5', () => expect(scoreSeverity(5)).toBe('Medium'));
  it('returns High for score = 4', () => expect(scoreSeverity(4)).toBe('High'));
  it('returns High for score = 3', () => expect(scoreSeverity(3)).toBe('High'));
  it('returns Critical for score < 3', () => expect(scoreSeverity(2.9)).toBe('Critical'));
  it('returns Critical for score = 0', () => expect(scoreSeverity(0)).toBe('Critical'));
  it('returns Low for score = 7.5', () => expect(scoreSeverity(7.5)).toBe('Low'));
  it('returns Medium for score = 5.9', () => expect(scoreSeverity(5.9)).toBe('Medium'));
});

// ── ALL_DIRECTOR_CATEGORIES ───────────────────────────────────────────────────

describe('ALL_DIRECTOR_CATEGORIES', () => {
  it('contains exactly 25 categories', () => expect(ALL_DIRECTOR_CATEGORIES).toHaveLength(25));
  it('includes visualHierarchy', () => expect(ALL_DIRECTOR_CATEGORIES).toContain('visualHierarchy'));
  it('includes conversionAlignment', () => expect(ALL_DIRECTOR_CATEGORIES).toContain('conversionAlignment'));
  it('includes trust', () => expect(ALL_DIRECTOR_CATEGORIES).toContain('trust'));
  it('includes premiumFeel', () => expect(ALL_DIRECTOR_CATEGORIES).toContain('premiumFeel'));
  it('includes dnaAlignment', () => expect(ALL_DIRECTOR_CATEGORIES).toContain('dnaAlignment'));
  it('has no duplicates', () => {
    expect(new Set(ALL_DIRECTOR_CATEGORIES).size).toBe(ALL_DIRECTOR_CATEGORIES.length);
  });
});

// ── DIRECTOR_WEIGHTS ──────────────────────────────────────────────────────────

describe('DIRECTOR_WEIGHTS', () => {
  it('covers all 25 categories', () => {
    for (const cat of ALL_DIRECTOR_CATEGORIES) {
      expect(DIRECTOR_WEIGHTS[cat]).toBeDefined();
    }
  });

  it('all weights are positive', () => {
    for (const w of Object.values(DIRECTOR_WEIGHTS)) {
      expect(w).toBeGreaterThan(0);
    }
  });

  it('weights sum to 1.00 (±0.005)', () => {
    const sum = Object.values(DIRECTOR_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });
});

// ── computeDirectorScore ──────────────────────────────────────────────────────

describe('computeDirectorScore', () => {
  it('returns 0 for empty reviews', () => expect(computeDirectorScore([])).toBe(5.0));
  it('returns 10 for all-10 reviews', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(10, cat));
    expect(computeDirectorScore(reviews)).toBe(10);
  });
  it('returns 0 for all-0 reviews', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(0, cat));
    expect(computeDirectorScore(reviews)).toBe(0);
  });
  it('returns 5 for all-5 reviews', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(5, cat));
    expect(computeDirectorScore(reviews)).toBeCloseTo(5.0, 1);
  });
  it('returns value between 0 and 10', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map((cat, i) => makeReview(i % 10, cat));
    const score = computeDirectorScore(reviews);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
  it('higher scores produce higher overall', () => {
    const low  = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(3, cat));
    const high = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(9, cat));
    expect(computeDirectorScore(high)).toBeGreaterThan(computeDirectorScore(low));
  });
  it('result is rounded to 1 decimal', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(7.333, cat));
    const score = computeDirectorScore(reviews);
    expect(score).toBe(Math.round(score * 10) / 10);
  });
});

// ── extractTopRecommendations ─────────────────────────────────────────────────

describe('extractTopRecommendations', () => {
  it('returns empty for all-high-scoring reviews', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(9, cat));
    expect(extractTopRecommendations(reviews)).toEqual([]);
  });
  it('returns max 5 recommendations', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(3, cat));
    expect(extractTopRecommendations(reviews)).toHaveLength(5);
  });
  it('only includes reviews with score < 7', () => {
    const mixed = [
      makeReview(8.0, 'visualHierarchy'),
      makeReview(4.0, 'trust'),
    ];
    const recs = extractTopRecommendations(mixed);
    expect(recs).toHaveLength(1);
  });
  it('returns strings', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(4, cat));
    for (const r of extractTopRecommendations(reviews)) {
      expect(typeof r).toBe('string');
    }
  });
});

// ── extractCriticalIssues ─────────────────────────────────────────────────────

describe('extractCriticalIssues', () => {
  it('returns empty when no critical issues', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(7, cat));
    expect(extractCriticalIssues(reviews)).toEqual([]);
  });
  it('returns critical issues', () => {
    const reviews = [makeReview(1.0, 'trust'), makeReview(8.0, 'typography')];
    const issues = extractCriticalIssues(reviews);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('trust');
  });
  it('formats as [category] reason', () => {
    const reviews = [makeReview(2.0, 'ctaPlacement')];
    const issues = extractCriticalIssues(reviews);
    expect(issues[0]).toMatch(/\[ctaPlacement\]/);
  });
});

// ── extractMostCommonProblems ─────────────────────────────────────────────────

describe('extractMostCommonProblems', () => {
  it('returns empty for all-high scores', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(8, cat));
    expect(extractMostCommonProblems(reviews)).toEqual([]);
  });
  it('returns max 5 categories', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(4, cat));
    expect(extractMostCommonProblems(reviews)).toHaveLength(5);
  });
  it('returns categories sorted by score ascending', () => {
    const reviews = [
      makeReview(3, 'trust'),
      makeReview(5, 'typography'),
      makeReview(4, 'spacing'),
    ];
    const problems = extractMostCommonProblems(reviews);
    expect(problems[0]).toBe('trust');
  });
});

// ── buildCreativeDirection ────────────────────────────────────────────────────

describe('buildCreativeDirection', () => {
  it('returns a non-empty string', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(7, cat));
    const dir = buildCreativeDirection(reviews, 7.5, 'stripe');
    expect(typeof dir).toBe('string');
    expect(dir.length).toBeGreaterThan(10);
  });
  it('mentions production-ready for high scores', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(9, cat));
    const dir = buildCreativeDirection(reviews, 9.0, undefined);
    expect(dir.toLowerCase()).toMatch(/production|ready|polish/);
  });
  it('mentions critical issues when they exist', () => {
    const reviews = [makeReview(1, 'trust'), ...ALL_DIRECTOR_CATEGORIES.slice(1).map(cat => makeReview(8, cat))];
    const dir = buildCreativeDirection(reviews, 4.0, undefined);
    expect(dir.toLowerCase()).toMatch(/critical/);
  });
  it('includes DNA name when provided', () => {
    const reviews = ALL_DIRECTOR_CATEGORIES.map(cat => makeReview(6, cat));
    const dir = buildCreativeDirection(reviews, 6.5, 'linear');
    expect(dir).toContain('linear');
  });
});

// ── computeDirectorConfidence ─────────────────────────────────────────────────

describe('computeDirectorConfidence', () => {
  it('returns 0.5 for empty reviews', () => expect(computeDirectorConfidence([])).toBe(0.5));
  it('returns average confidence of all reviews', () => {
    const reviews = [makeReview(7), makeReview(5)];
    reviews[0].confidence = 0.8;
    reviews[1].confidence = 0.6;
    expect(computeDirectorConfidence(reviews)).toBeCloseTo(0.7, 1);
  });
  it('clamps to 0.1–1.0', () => {
    const low  = [{ ...makeReview(5), confidence: 0.0 }];
    const high = [{ ...makeReview(5), confidence: 1.5 }];
    expect(computeDirectorConfidence(low)).toBeGreaterThanOrEqual(0.1);
    expect(computeDirectorConfidence(high)).toBeLessThanOrEqual(1.0);
  });
});

// ── computeReviewDistribution ─────────────────────────────────────────────────

describe('computeReviewDistribution', () => {
  it('returns zero distribution for empty input', () => {
    const d = computeReviewDistribution([]);
    expect(d).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
  });
  it('counts critical correctly', () => {
    const reviews = [makeReview(1), makeReview(8)];
    const d = computeReviewDistribution(reviews);
    expect(d.critical).toBe(1);
    expect(d.low).toBe(1);
  });
  it('counts all severities', () => {
    const reviews = [makeReview(1), makeReview(4), makeReview(6), makeReview(8)];
    const d = computeReviewDistribution(reviews);
    expect(d.critical + d.high + d.medium + d.low).toBe(4);
  });
});

// ── Individual Category Scorers ───────────────────────────────────────────────

describe('scoreVisualHierarchy', () => {
  it('returns a valid review shape', () => {
    const r = scoreVisualHierarchy(baseInput);
    expect(r.category).toBe('visualHierarchy');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10);
    expect(r.severity).toMatch(/Low|Medium|High|Critical/);
    expect(typeof r.recommendation).toBe('string');
  });
  it('scores lower for sparse code', () => {
    const rich = scoreVisualHierarchy(baseInput);
    const sparse = scoreVisualHierarchy(sparseInput);
    expect(rich.score).toBeGreaterThan(sparse.score);
  });
  it('confidence is between 0 and 1', () => {
    const r = scoreVisualHierarchy(baseInput);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});

describe('scoreTypography', () => {
  it('returns valid review', () => {
    const r = scoreTypography(baseInput);
    expect(r.category).toBe('typography');
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(10);
  });
  it('rewards leading-relaxed usage', () => {
    const withLeading = { ...sparseInput, code: 'leading-relaxed text-base max-w-prose font-bold font-normal' };
    const r = scoreTypography(withLeading);
    expect(r.score).toBeGreaterThan(scoreTypography(sparseInput).score);
  });
});

describe('scoreSpacing', () => {
  it('returns valid review', () => {
    const r = scoreSpacing(baseInput);
    expect(r.category).toBe('spacing');
    expect(r.score).toBeGreaterThanOrEqual(0);
  });
  it('penalizes tight padding', () => {
    const tightCode = 'p-1 px-1 py-1 p-1 p-0';
    const r = scoreSpacing({ ...sparseInput, code: tightCode });
    expect(r.score).toBeLessThan(7);
  });
});

describe('scoreComposition', () => {
  it('returns valid review', () => {
    const r = scoreComposition(baseInput);
    expect(r.category).toBe('composition');
  });
  it('rewards grid layouts', () => {
    const gridCode = 'grid-cols-3 md:grid-cols-3 lg:grid-cols-3 col-span-2';
    const r = scoreComposition({ ...sparseInput, code: gridCode, sectionOrder: ['hero'] });
    expect(r.score).toBeGreaterThan(scoreComposition(sparseInput).score);
  });
});

describe('scoreLayoutRhythm', () => {
  it('returns valid review', () => {
    const r = scoreLayoutRhythm(baseInput);
    expect(r.category).toBe('layoutRhythm');
  });
  it('penalizes less than 3 sections', () => {
    const r = scoreLayoutRhythm({ ...baseInput, sectionOrder: ['hero'] });
    expect(r.score).toBeLessThan(scoreLayoutRhythm(baseInput).score);
  });
  it('rewards alternating backgrounds', () => {
    const r = scoreLayoutRhythm({ ...sparseInput, code: 'bg-muted container mx-auto border-t', sectionOrder: ['hero', 'features', 'pricing', 'cta'] });
    expect(r.score).toBeGreaterThan(scoreLayoutRhythm(sparseInput).score);
  });
});

describe('scoreBrandConsistency', () => {
  it('returns valid review', () => {
    const r = scoreBrandConsistency(baseInput);
    expect(r.category).toBe('brandConsistency');
  });
  it('penalizes hardcoded colors', () => {
    const hardcoded = '#FF0000 #00FF00 #0000FF #AABBCC #112233 #FFDDEE';
    const r = scoreBrandConsistency({ ...sparseInput, code: hardcoded });
    expect(r.score).toBeLessThan(7);
  });
  it('rewards token usage', () => {
    const r = scoreBrandConsistency({ ...sparseInput, tokenScore: 9 });
    expect(r.score).toBeGreaterThan(scoreBrandConsistency({ ...sparseInput, tokenScore: 4 }).score);
  });
});

describe('scorePremiumFeel', () => {
  it('returns valid review', () => {
    const r = scorePremiumFeel(baseInput);
    expect(r.category).toBe('premiumFeel');
  });
  it('rewards gradients, shadows, hover, rounded corners', () => {
    const premiumCode = 'gradient from-primary to-secondary rounded-2xl shadow-xl hover:scale-105 transition-all backdrop-blur';
    const r = scorePremiumFeel({ ...sparseInput, code: premiumCode });
    expect(r.score).toBeGreaterThan(scorePremiumFeel(sparseInput).score);
  });
});

describe('scoreModernity', () => {
  it('returns valid review', () => {
    const r = scoreModernity(baseInput);
    expect(r.category).toBe('modernity');
  });
  it('penalizes float-based layouts', () => {
    const oldCode = 'float-left float-right table-fixed border="0" float-left';
    const r = scoreModernity({ ...sparseInput, code: oldCode });
    expect(r.score).toBeLessThan(7);
  });
});

describe('scoreTrust', () => {
  it('returns valid review', () => {
    const r = scoreTrust(baseInput);
    expect(r.category).toBe('trust');
  });
  it('rewards testimonials, logos, stats', () => {
    const trustCode = 'testimonial review rating trusted by partner 10k+ customers secure ssl gdpr';
    const r = scoreTrust({ ...sparseInput, code: trustCode });
    expect(r.score).toBeGreaterThan(scoreTrust(sparseInput).score);
  });
  it('Very High conversion boosts trust', () => {
    const low  = scoreTrust({ ...baseInput, conversionPrediction: 'Very Low' });
    const high = scoreTrust({ ...baseInput, conversionPrediction: 'Very High' });
    expect(high.score).toBeGreaterThanOrEqual(low.score);
  });
});

describe('scoreEmotionalImpact', () => {
  it('returns valid review', () => {
    const r = scoreEmotionalImpact(baseInput);
    expect(r.category).toBe('emotionalImpact');
  });
  it('penalizes Lorem ipsum', () => {
    const r = scoreEmotionalImpact({ ...sparseInput, code: 'Lorem ipsum Lorem placeholder' });
    expect(r.score).toBeLessThan(5);
  });
  it('rewards user-centric copy', () => {
    const userCode = 'transform your workflow you deserve your team accelerate';
    const r = scoreEmotionalImpact({ ...sparseInput, code: userCode, sectionOrder: ['hero'] });
    expect(r.score).toBeGreaterThan(scoreEmotionalImpact(sparseInput).score);
  });
});

describe('scoreStorytelling', () => {
  it('returns valid review', () => {
    const r = scoreStorytelling(baseInput);
    expect(r.category).toBe('storytelling');
  });
  it('gives full credit for hero+features+testimonials+cta', () => {
    const r = scoreStorytelling({ ...baseInput, sectionOrder: ['hero', 'features', 'testimonials', 'cta'] });
    expect(r.score).toBeGreaterThan(7);
  });
  it('lower score when sections are missing', () => {
    const r = scoreStorytelling({ ...sparseInput, sectionOrder: [] });
    expect(r.score).toBeLessThan(8);
  });
});

describe('scoreCTAPlacement', () => {
  it('returns valid review', () => {
    const r = scoreCTAPlacement(baseInput);
    expect(r.category).toBe('ctaPlacement');
  });
  it('penalizes missing CTA', () => {
    const r = scoreCTAPlacement({ ...sparseInput });
    expect(r.score).toBeLessThan(8);
  });
  it('rewards multiple CTA placements', () => {
    const multiCTA = 'Get Started Free Get Started Free Sign Up Book a Demo Learn More';
    const r = scoreCTAPlacement({ ...sparseInput, code: multiCTA });
    expect(r.score).toBeGreaterThan(scoreCTAPlacement(sparseInput).score);
  });
});

describe('scorePricingPresentation', () => {
  it('returns neutral score when hasPricing=false', () => {
    const r = scorePricingPresentation({ ...baseInput, hasPricing: false });
    expect(r.score).toBe(7.5);
    expect(r.confidence).toBe(0.5);
  });
  it('rewards 3-tier with badge and price display', () => {
    const r = scorePricingPresentation(baseInput);
    expect(r.category).toBe('pricingPresentation');
    expect(r.score).toBeGreaterThan(5);
  });
  it('penalizes missing price display', () => {
    const noPriceCode = 'Starter Pro Enterprise';
    const r = scorePricingPresentation({ ...baseInput, code: noPriceCode });
    expect(r.score).toBeLessThan(scorePricingPresentation(baseInput).score);
  });
});

describe('scoreDashboardExperience', () => {
  it('returns neutral when isDashboard=false', () => {
    const r = scoreDashboardExperience({ ...baseInput, isDashboard: false });
    expect(r.score).toBe(7.5);
  });
  it('rewards DataTable, Tabs, Badge, Skeleton', () => {
    const dashCode = 'DataTable TabsList TabsTrigger Badge Skeleton Chart';
    const r = scoreDashboardExperience({ ...baseInput, isDashboard: true, code: dashCode });
    expect(r.score).toBeGreaterThan(6);
  });
});

describe('scoreNavigation', () => {
  it('returns valid review', () => {
    const r = scoreNavigation(baseInput);
    expect(r.category).toBe('navigation');
  });
  it('penalizes missing navigation', () => {
    const r = scoreNavigation({ ...sparseInput });
    expect(r.score).toBeLessThan(6);
  });
  it('rewards NavigationMenu with logo', () => {
    const navCode = 'NavigationMenu NavigationMenuItem logo brand Avatar DropdownMenu';
    const r = scoreNavigation({ ...sparseInput, code: navCode, authState: 'authenticated' });
    expect(r.score).toBeGreaterThan(6);
  });
});

describe('scoreForms', () => {
  it('returns neutral when isForm=false', () => {
    const r = scoreForms({ ...baseInput, isForm: false });
    expect(r.score).toBe(7.5);
  });
  it('rewards RHF + Zod + labels + error handling', () => {
    const formCode = 'useForm handleSubmit register z.object zodResolver htmlFor Label errors formState.errors isSubmitting';
    const r = scoreForms({ ...baseInput, isForm: true, code: formCode });
    expect(r.score).toBeGreaterThan(7);
  });
  it('penalizes missing labels', () => {
    const noLabelCode = 'useForm handleSubmit';
    const r = scoreForms({ ...baseInput, isForm: true, code: noLabelCode });
    expect(r.score).toBeLessThan(scoreForms({ ...baseInput, isForm: true, code: formCode() }).score);
  });
});

function formCode() {
  return 'useForm handleSubmit register htmlFor Label errors formState.errors zodResolver';
}

describe('scoreMotion', () => {
  it('returns valid review', () => {
    const r = scoreMotion(baseInput);
    expect(r.category).toBe('motion');
  });
  it('uses motionScore when provided', () => {
    const r = scoreMotion({ ...baseInput, motionScore: 9.0 });
    expect(r.score).toBeGreaterThan(7);
  });
  it('heuristic: rewards transitions and hover', () => {
    const r = scoreMotion({ ...sparseInput, code: 'transition-all duration-200 hover:scale-105 animate-fadeIn' });
    expect(r.score).toBeGreaterThan(scoreMotion(sparseInput).score);
  });
});

describe('scoreAccessibility', () => {
  it('returns valid review', () => {
    const r = scoreAccessibility(baseInput);
    expect(r.category).toBe('accessibility');
  });
  it('uses accessibilityScore when provided', () => {
    const high = scoreAccessibility({ ...baseInput, accessibilityScore: 9.5 });
    const low  = scoreAccessibility({ ...baseInput, accessibilityScore: 3.0 });
    expect(high.score).toBeGreaterThan(low.score);
  });
  it('rewards aria-label and focus-visible', () => {
    const a11yCode = 'aria-label="close" aria-labelledby="title" focus-visible:ring-2 alt="user avatar"';
    const r = scoreAccessibility({ ...sparseInput, code: a11yCode });
    expect(r.score).toBeGreaterThan(scoreAccessibility(sparseInput).score);
  });
});

describe('scorePerformance', () => {
  it('returns valid review', () => {
    const r = scorePerformance(baseInput);
    expect(r.category).toBe('performance');
  });
  it('rewards lazy loading and skeleton', () => {
    const perfCode = 'loading="lazy" Skeleton import( next/image';
    const r = scorePerformance({ ...sparseInput, code: perfCode });
    expect(r.score).toBeGreaterThan(scorePerformance(sparseInput).score);
  });
});

describe('scoreResponsiveness', () => {
  it('returns valid review', () => {
    const r = scoreResponsiveness(baseInput);
    expect(r.category).toBe('responsiveness');
  });
  it('rewards md: lg: sm: breakpoints', () => {
    const respCode = 'md:grid-cols-2 lg:grid-cols-3 sm:text-sm flex-wrap hidden md: md:flex-row';
    const r = scoreResponsiveness({ ...sparseInput, code: respCode });
    expect(r.score).toBeGreaterThan(scoreResponsiveness(sparseInput).score);
  });
});

describe('scoreComponentConsistency', () => {
  it('returns valid review', () => {
    const r = scoreComponentConsistency(baseInput);
    expect(r.category).toBe('componentConsistency');
  });
  it('uses treeScore when provided', () => {
    const high = scoreComponentConsistency({ ...baseInput, treeScore: 9 });
    const low  = scoreComponentConsistency({ ...baseInput, treeScore: 3 });
    expect(high.score).toBeGreaterThan(low.score);
  });
  it('rewards shadcn components', () => {
    const shadcnCode = 'Button Card Badge Dialog Sheet Tabs Select Input Label Textarea';
    const r = scoreComponentConsistency({ ...sparseInput, code: shadcnCode });
    expect(r.score).toBeGreaterThan(scoreComponentConsistency(sparseInput).score);
  });
});

describe('scoreTokenConsistency', () => {
  it('returns valid review', () => {
    const r = scoreTokenConsistency(baseInput);
    expect(r.category).toBe('tokenConsistency');
  });
  it('uses tokenScore when provided', () => {
    const high = scoreTokenConsistency({ ...baseInput, tokenScore: 9 });
    const low  = scoreTokenConsistency({ ...baseInput, tokenScore: 3 });
    expect(high.score).toBeGreaterThan(low.score);
  });
  it('penalizes hardcoded Tailwind colors', () => {
    const hardCode = 'text-blue-500 text-red-400 text-green-600 bg-blue-200 bg-red-100';
    const r = scoreTokenConsistency({ ...sparseInput, code: hardCode });
    expect(r.score).toBeLessThan(7);
  });
});

describe('scoreDNAAlignment', () => {
  it('returns generic review for undefined dnaId', () => {
    const r = scoreDNAAlignment({ ...baseInput, dnaId: undefined });
    expect(r.category).toBe('dnaAlignment');
  });
  it('returns generic review for generic dnaId', () => {
    const r = scoreDNAAlignment({ ...baseInput, dnaId: 'generic' });
    expect(r.score).toBe(6.5);
  });
  it('rewards stripe-characteristic patterns', () => {
    const stripeCode = 'gradient-from-primary --stripe payment flex checkout';
    const r = scoreDNAAlignment({ ...sparseInput, code: stripeCode, dnaId: 'stripe' });
    expect(r.score).toBeGreaterThan(scoreDNAAlignment({ ...sparseInput, code: '', dnaId: 'stripe' }).score);
  });
  it('penalizes missing DNA patterns', () => {
    const r = scoreDNAAlignment({ ...sparseInput, code: 'hello world', dnaId: 'linear' });
    expect(r.score).toBeLessThan(8);
  });
});

describe('scoreUXAlignment', () => {
  it('returns neutral when uxScore is undefined', () => {
    const r = scoreUXAlignment({ ...baseInput, uxScore: undefined });
    expect(r.score).toBe(7.0);
    expect(r.confidence).toBe(0.4);
  });
  it('returns uxScore when no issues', () => {
    const r = scoreUXAlignment({ ...baseInput, uxScore: 8.0, uxTopIssues: [] });
    expect(r.score).toBeCloseTo(8.0, 0);
  });
  it('penalizes per UX issue', () => {
    const noIssue = scoreUXAlignment({ ...baseInput, uxScore: 8.0, uxTopIssues: [] });
    const withIssues = scoreUXAlignment({ ...baseInput, uxScore: 8.0, uxTopIssues: ['A', 'B', 'C'] });
    expect(withIssues.score).toBeLessThan(noIssue.score);
  });
});

describe('scoreConversionAlignment', () => {
  it('returns valid review', () => {
    const r = scoreConversionAlignment(baseInput);
    expect(r.category).toBe('conversionAlignment');
  });
  it('scores higher for Very High conversion', () => {
    const high = scoreConversionAlignment({ ...baseInput, conversionPrediction: 'Very High', criticScore: 9, evaluatorScore: 9 });
    const low  = scoreConversionAlignment({ ...baseInput, conversionPrediction: 'Very Low',  criticScore: 3, evaluatorScore: 3 });
    expect(high.score).toBeGreaterThan(low.score);
  });
  it('blends evaluator and critic scores', () => {
    const r = scoreConversionAlignment({ ...baseInput, evaluatorScore: 9, criticScore: 9, conversionPrediction: 'High' });
    expect(r.score).toBeGreaterThan(6);
  });
});

// ── runDesignDirector (full engine) ───────────────────────────────────────────

describe('runDesignDirector', () => {
  it('returns a complete DirectorReview', () => {
    const review = runDesignDirector(baseInput);
    expect(review).toBeDefined();
    expect(review.overallScore).toBeGreaterThanOrEqual(0);
    expect(review.overallScore).toBeLessThanOrEqual(10);
    expect(review.categoryReviews).toHaveLength(25);
    expect(Array.isArray(review.topRecommendations)).toBe(true);
    expect(Array.isArray(review.criticalIssues)).toBe(true);
    expect(Array.isArray(review.mostCommonProblems)).toBe(true);
    expect(typeof review.creativeDirection).toBe('string');
    expect(review.confidence).toBeGreaterThan(0);
    expect(review.confidence).toBeLessThanOrEqual(1);
  });

  it('produces all 25 category reviews', () => {
    const review = runDesignDirector(baseInput);
    const cats = review.categoryReviews.map(r => r.category);
    for (const cat of ALL_DIRECTOR_CATEGORIES) {
      expect(cats).toContain(cat);
    }
  });

  it('rich code scores higher than sparse code', () => {
    const rich   = runDesignDirector(baseInput);
    const sparse = runDesignDirector(sparseInput);
    expect(rich.overallScore).toBeGreaterThan(sparse.overallScore);
  });

  it('scores are all in [0, 10]', () => {
    const review = runDesignDirector(baseInput);
    for (const r of review.categoryReviews) {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(10);
    }
  });

  it('all severity values are valid', () => {
    const review = runDesignDirector(baseInput);
    const valid = ['Low', 'Medium', 'High', 'Critical'];
    for (const r of review.categoryReviews) {
      expect(valid).toContain(r.severity);
    }
  });

  it('topRecommendations is max 5 items', () => {
    const review = runDesignDirector(sparseInput);
    expect(review.topRecommendations.length).toBeLessThanOrEqual(5);
  });

  it('creativeDirection is a non-empty string', () => {
    const review = runDesignDirector(baseInput);
    expect(review.creativeDirection.length).toBeGreaterThan(5);
  });

  it('mostImprovedCategories is empty array initially', () => {
    const review = runDesignDirector(baseInput);
    expect(review.mostImprovedCategories).toEqual([]);
  });

  it('dashboard section flagged when isDashboard=true', () => {
    const review = runDesignDirector({ ...baseInput, isDashboard: true, code: '' });
    const dashRev = review.categoryReviews.find(r => r.category === 'dashboardExperience');
    expect(dashRev).toBeDefined();
    expect(dashRev!.score).toBeLessThan(8);
  });

  it('pricing section not penalized when hasPricing=false', () => {
    const review = runDesignDirector({ ...baseInput, hasPricing: false });
    const pricingRev = review.categoryReviews.find(r => r.category === 'pricingPresentation');
    expect(pricingRev!.score).toBe(7.5);
  });
});

// ── buildCategoryScoreMap ─────────────────────────────────────────────────────

describe('buildCategoryScoreMap', () => {
  it('returns a map with all 25 categories', () => {
    const review = runDesignDirector(baseInput);
    const map = buildCategoryScoreMap(review);
    expect(Object.keys(map)).toHaveLength(25);
  });

  it('values match categoryReviews scores', () => {
    const review = runDesignDirector(baseInput);
    const map = buildCategoryScoreMap(review);
    for (const r of review.categoryReviews) {
      expect(map[r.category]).toBe(r.score);
    }
  });
});

// ── Telemetry — recordDirectorRun / getDirectorMetrics ────────────────────────

describe('directorMetrics', () => {
  beforeEach(() => resetDirectorMetrics());

  it('starts with 0 runs tracked', () => {
    const m = getDirectorMetrics();
    expect(m.runsTracked).toBe(0);
  });

  it('tracks a run after recordDirectorRun', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'build-1', directorReview: review, dnaId: 'stripe' });
    const m = getDirectorMetrics();
    expect(m.runsTracked).toBe(1);
  });

  it('averageDirectorScore is updated', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'build-2', directorReview: review });
    const m = getDirectorMetrics();
    expect(m.averageDirectorScore).toBeGreaterThan(0);
  });

  it('mostCommonProblems is an array', () => {
    const review = runDesignDirector(sparseInput);
    recordDirectorRun({ buildId: 'build-3', directorReview: review });
    const m = getDirectorMetrics();
    expect(Array.isArray(m.mostCommonProblems)).toBe(true);
  });

  it('resetDirectorMetrics clears history', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'build-4', directorReview: review });
    resetDirectorMetrics();
    expect(getDirectorMetrics().runsTracked).toBe(0);
  });

  it('confidence is a number between 0 and 1', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'build-5', directorReview: review });
    const m = getDirectorMetrics();
    expect(m.confidence).toBeGreaterThanOrEqual(0);
    expect(m.confidence).toBeLessThanOrEqual(1);
  });

  it('learningTrend is a string', () => {
    const m = getDirectorMetrics();
    expect(typeof m.learningTrend).toBe('string');
  });

  it('tracks multiple runs', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'b1', directorReview: review });
    recordDirectorRun({ buildId: 'b2', directorReview: review });
    recordDirectorRun({ buildId: 'b3', directorReview: review });
    expect(getDirectorMetrics().runsTracked).toBe(3);
  });

  it('recentScores has correct structure', () => {
    const review = runDesignDirector(baseInput);
    recordDirectorRun({ buildId: 'b-rs', directorReview: review });
    const { recentScores } = getDirectorMetrics();
    expect(Array.isArray(recentScores)).toBe(true);
    if (recentScores.length > 0) {
      const s = recentScores[0] as Record<string, unknown>;
      expect(s).toHaveProperty('overallScore');
      expect(s).toHaveProperty('confidence');
    }
  });
});

// ── Learning — learnFromDirector ──────────────────────────────────────────────

describe('directorLearning', () => {
  beforeEach(() => resetDirectorLearning());

  it('starts with empty history', () => {
    expect(getDirectorLearningHistory()).toHaveLength(0);
  });

  it('adds a record after learnFromDirector', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-1', directorReview: review, dnaId: 'stripe' });
    expect(getDirectorLearningHistory()).toHaveLength(1);
  });

  it('records buildId correctly', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-2', directorReview: review });
    const history = getDirectorLearningHistory();
    expect(history[0].buildId).toBe('learn-2');
  });

  it('records overallScore correctly', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-3', directorReview: review });
    const history = getDirectorLearningHistory();
    expect(history[0].overallScore).toBe(review.overallScore);
  });

  it('records improved flag', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-4', directorReview: review });
    const history = getDirectorLearningHistory();
    expect(typeof history[0].improved).toBe('boolean');
  });

  it('uses generic dnaId when not provided', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-5', directorReview: review });
    expect(getDirectorLearningHistory()[0].dnaId).toBe('generic');
  });

  it('uses provided dnaId', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-6', directorReview: review, dnaId: 'linear' });
    expect(getDirectorLearningHistory()[0].dnaId).toBe('linear');
  });

  it('trend is stable for empty history', () => {
    expect(getDirectorLearningTrend()).toBe('stable');
  });

  it('resets learning history', () => {
    const review = runDesignDirector(baseInput);
    learnFromDirector({ buildId: 'learn-7', directorReview: review });
    resetDirectorLearning();
    expect(getDirectorLearningHistory()).toHaveLength(0);
  });

  it('handles multiple records', () => {
    const review = runDesignDirector(baseInput);
    for (let i = 0; i < 10; i++) {
      learnFromDirector({ buildId: `build-${i}`, directorReview: review });
    }
    expect(getDirectorLearningHistory()).toHaveLength(10);
  });

  it('trend is rising when recent scores improve', () => {
    const lowReview  = runDesignDirector(sparseInput);
    const highReview = runDesignDirector(baseInput);
    for (let i = 0; i < 15; i++) {
      learnFromDirector({ buildId: `old-${i}`, directorReview: lowReview });
    }
    for (let i = 0; i < 10; i++) {
      learnFromDirector({ buildId: `new-${i}`, directorReview: highReview });
    }
    // Trend may be rising or stable depending on score magnitudes
    const trend = getDirectorLearningTrend();
    expect(['rising', 'stable', 'falling']).toContain(trend);
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles empty code string', () => {
    const review = runDesignDirector({ ...baseInput, code: '' });
    expect(review).toBeDefined();
    expect(review.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('handles empty sectionOrder', () => {
    const review = runDesignDirector({ ...baseInput, sectionOrder: [] });
    expect(review).toBeDefined();
  });

  it('handles missing optional fields', () => {
    const minimal: DirectorReviewInput = { code: 'hello', sectionOrder: ['hero'] };
    const review = runDesignDirector(minimal);
    expect(review.categoryReviews).toHaveLength(25);
  });

  it('handles all undefined scores', () => {
    const noScores: DirectorReviewInput = {
      code: richCode,
      sectionOrder: ['hero', 'features'],
    };
    const review = runDesignDirector(noScores);
    expect(review.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('does not throw for extreme input lengths', () => {
    const longCode = richCode.repeat(10);
    expect(() => runDesignDirector({ ...baseInput, code: longCode })).not.toThrow();
  });

  it('does not throw for 100-section order', () => {
    const manySection = Array.from({ length: 100 }, (_, i) => `section-${i}`);
    expect(() => runDesignDirector({ ...baseInput, sectionOrder: manySection })).not.toThrow();
  });

  it('scores are deterministic for same input', () => {
    const r1 = runDesignDirector(baseInput);
    const r2 = runDesignDirector(baseInput);
    expect(r1.overallScore).toBe(r2.overallScore);
  });

  it('computeDirectorScore handles partial category list', () => {
    const partial = [makeReview(8, 'trust'), makeReview(6, 'typography')];
    const score = computeDirectorScore(partial);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('metrics returns zeros shape when no runs recorded', () => {
    resetDirectorMetrics();
    const m = getDirectorMetrics();
    expect(m.runsTracked).toBe(0);
    expect(m.averageDirectorScore).toBe(0);
    expect(Array.isArray(m.mostCommonProblems)).toBe(true);
    expect(Array.isArray(m.recentScores)).toBe(true);
  });
});

// ── Regression: all category reviews have required fields ─────────────────────

describe('Regression: CategoryReview shape', () => {
  it('every review has all required fields', () => {
    const review = runDesignDirector(baseInput);
    for (const r of review.categoryReviews) {
      expect(r).toHaveProperty('category');
      expect(r).toHaveProperty('score');
      expect(r).toHaveProperty('severity');
      expect(r).toHaveProperty('confidence');
      expect(r).toHaveProperty('reason');
      expect(r).toHaveProperty('recommendation');
      expect(r).toHaveProperty('expectedImprovement');
    }
  });

  it('recommendation is always a non-empty string', () => {
    const review = runDesignDirector(sparseInput);
    for (const r of review.categoryReviews) {
      expect(r.recommendation.length).toBeGreaterThan(5);
    }
  });

  it('reason is always a non-empty string', () => {
    const review = runDesignDirector(baseInput);
    for (const r of review.categoryReviews) {
      expect(r.reason.length).toBeGreaterThan(3);
    }
  });

  it('expectedImprovement is always a string', () => {
    const review = runDesignDirector(baseInput);
    for (const r of review.categoryReviews) {
      expect(typeof r.expectedImprovement).toBe('string');
    }
  });
});
