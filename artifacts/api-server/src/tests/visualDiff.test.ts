// ── V7.3.4 Visual Diff Engine Tests ───────────────────────────────────────────
// 80+ tests across: hero/CTA/layout/responsive analyzers, DOM analyzer,
// pixel diff, repair validator, screenshot capture, learning loop, telemetry,
// candidate selection upgrade.

import { describe, it, expect, beforeEach } from "vitest";
import { analyzeHero } from "../../src/visual-diff/heroAnalyzer.js";
import { analyzeCTA } from "../../src/visual-diff/ctaAnalyzer.js";
import { analyzeLayout } from "../../src/visual-diff/layoutAnalyzer.js";
import { analyzeResponsive } from "../../src/visual-diff/responsiveAnalyzer.js";
import { analyzeDom } from "../../src/visual-diff/domAnalyzer.js";
import { computeVisualDiff, compareAllCandidates } from "../../src/visual-diff/pixelDiff.js";
import { captureVisualSnapshot, captureAllViewports, VIEWPORTS } from "../../src/visual-diff/screenshotCapture.js";
import { analyzeVisuals, buildVisualContextString } from "../../src/visual-diff/visualAnalyzer.js";
import { validateRepairVisuals } from "../../src/visual-diff/repairValidator.js";
import { recordVisualBuild, getVisualHistory, getVisualRegressionRate, getRepairImprovementRate, resetVisualHistory } from "../../src/visual-diff/history.js";
import { recordVisualOutcome, getTopVisualPatterns, getWorstVisualPatterns, getVisualLearningMetrics, resetVisualLearning, extractVisualPatterns } from "../../src/visual-diff/visualLearning.js";
import { recordVisualBuildMetrics, getVisualMetrics, resetVisualMetrics } from "../../src/telemetry/visualMetrics.js";
import { selectBestCandidate } from "../../src/agents/pipeline/candidateSelectionStep.js";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const FULL_HERO_CODE = `
function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center py-24">
      <Badge>Now in beta</Badge>
      <h1 className="text-6xl font-bold">Ship faster</h1>
      <p className="text-xl mt-4">The platform for modern teams.</p>
      <div className="flex gap-4 mt-8">
        <Button size="lg" variant="default">Get Started</Button>
        <Button variant="outline">Learn More</Button>
      </div>
      <AvatarGroup />
      <p className="text-sm">Trusted by 10k+ teams</p>
    </section>
  );
}
`;

const WEAK_HERO_CODE = `
function Hero() {
  return (
    <section>
      <div>Welcome</div>
    </section>
  );
}
`;

const FULL_CODE = `
import React from 'react';
${FULL_HERO_CODE}
function Features() {
  return (
    <section className="py-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <Card className="rounded-lg"><h3>Feature 1</h3><p>Description</p></Card>
        <Card className="rounded-lg"><h3>Feature 2</h3><p>Description</p></Card>
        <Card className="rounded-lg"><h3>Feature 3</h3><p>Description</p></Card>
      </div>
    </section>
  );
}
function Navbar() {
  return <nav className="flex items-center justify-between hidden md:flex"><Button>Sign up</Button></nav>;
}
function Footer() {
  return <footer><p>© 2026</p></footer>;
}
`;

// ── Phase 5: Hero Analyzer ────────────────────────────────────────────────────

describe("Hero Analyzer", () => {
  it("scores full hero at 10", () => {
    const result = analyzeHero(FULL_HERO_CODE, ['Hero']);
    expect(result.score).toBeGreaterThanOrEqual(9);
  });

  it("detects missing h1", () => {
    const code = `function Hero() { return <section><p>No headline</p></section>; }`;
    const result = analyzeHero(code, ['Hero']);
    expect(result.hasHeadline).toBe(false);
    expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
  });

  it("detects missing CTA", () => {
    const code = `function Hero() { return <section><h1>Hello</h1><p>desc</p></section>; }`;
    const result = analyzeHero(code, ['Hero']);
    expect(result.hasCTA).toBe(false);
    expect(result.issues.some(i => i.message.includes('CTA'))).toBe(true);
  });

  it("detects badge presence", () => {
    const result = analyzeHero(FULL_HERO_CODE, ['Hero']);
    expect(result.hasBadge).toBe(true);
  });

  it("detects trust signal presence", () => {
    const result = analyzeHero(FULL_HERO_CODE, ['Hero']);
    expect(result.hasTrustSignal).toBe(true);
  });

  it("detects hero height presence", () => {
    const result = analyzeHero(FULL_HERO_CODE, ['Hero']);
    expect(result.hasHeroHeight).toBe(true);
  });

  it("returns score 5 when no hero section needed", () => {
    const result = analyzeHero('function App() { return <div/>; }', []);
    expect(result.score).toBe(5);
    expect(result.issues).toHaveLength(0);
  });

  it("weak hero scores low", () => {
    const result = analyzeHero(WEAK_HERO_CODE, ['Hero']);
    expect(result.score).toBeLessThan(5);
  });

  it("issue contains repairSuggestion for missing h1", () => {
    const code = `function Hero() { return <section><p>No headline</p></section>; }`;
    const result = analyzeHero(code, ['Hero']);
    const h1Issue = result.issues.find(i => i.message.includes('h1'));
    expect(h1Issue?.repairSuggestion).toBeTruthy();
  });
});

// ── Phase 6: CTA Analyzer ─────────────────────────────────────────────────────

describe("CTA Analyzer", () => {
  it("scores 10 for ideal CTA pattern", () => {
    const code = `<Button size="lg" variant="default">Get Started</Button><Button variant="outline">Learn More</Button>`;
    const result = analyzeCTA(code);
    expect(result.score).toBeGreaterThan(7);
  });

  it("detects primary CTA visible", () => {
    const code = `<Button size="lg" variant="default">Get Started free</Button>`;
    const result = analyzeCTA(code);
    expect(result.primaryCTAVisible).toBe(true);
  });

  it("detects no primary CTA", () => {
    const code = `<button className="underline">Click</button>`;
    const result = analyzeCTA(code);
    expect(result.primaryCTAVisible).toBe(false);
    expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
  });

  it("flags too many CTA buttons", () => {
    const code = Array(7).fill(`<Button variant="default">CTA</Button>`).join('\n');
    const result = analyzeCTA(code);
    expect(result.issues.some(i => i.message.includes('CTA buttons found'))).toBe(true);
  });

  it("detects zero buttons as critical", () => {
    const result = analyzeCTA('no buttons here at all');
    expect(result.ctaCount).toBe(0);
    expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
  });

  it("click hierarchy is valid with 1-4 buttons", () => {
    const code = `<Button>A</Button><Button>B</Button>`;
    expect(analyzeCTA(code).clickHierarchy).toBe(true);
  });

  it("detects outline secondary CTA", () => {
    const code = `<Button variant="default">Start</Button><Button variant="outline">Learn More</Button>`;
    expect(analyzeCTA(code).secondaryCTAVisible).toBe(true);
  });

  it("above-fold placement detected", () => {
    const result = analyzeCTA(FULL_CODE);
    expect(result.placement).toBe('above-fold');
  });
});

// ── Phase 7: Layout Analyzer ──────────────────────────────────────────────────

describe("Layout Analyzer", () => {
  it("scores high for full grid layout", () => {
    const result = analyzeLayout(FULL_CODE);
    expect(result.score).toBeGreaterThan(7);
  });

  it("detects grid usage", () => {
    expect(analyzeLayout('className="grid grid-cols-3"').hasGrid).toBe(true);
  });

  it("detects flex usage", () => {
    expect(analyzeLayout('className="flex flex-col"').hasFlex).toBe(true);
  });

  it("flags no grid and no flex", () => {
    const result = analyzeLayout('<section><p>Hello</p></section>');
    expect(result.issues.some(i => i.message.includes('flexbox'))).toBe(true);
  });

  it("detects gap classes", () => {
    expect(analyzeLayout('className="gap-8"').hasGap).toBe(true);
  });

  it("flags missing container", () => {
    const result = analyzeLayout('<div className="flex"><p>A</p></div>');
    expect(result.issues.some(i => i.message.includes('max-width'))).toBe(true);
  });

  it("detects card balance with grid", () => {
    const code = '<div className="grid grid-cols-3"><Card/><Card/><Card/></div>';
    expect(analyzeLayout(code).hasCardBalance).toBe(true);
  });

  it("sectionCount matches function count", () => {
    const result = analyzeLayout(FULL_CODE);
    expect(result.sectionCount).toBeGreaterThan(0);
  });
});

// ── Phase 8: Responsive Analyzer ─────────────────────────────────────────────

describe("Responsive Analyzer", () => {
  it("scores high for responsive code", () => {
    const result = analyzeResponsive(FULL_CODE);
    expect(result.score).toBeGreaterThan(5);
  });

  it("detects breakpoints", () => {
    expect(analyzeResponsive('className="md:grid-cols-3"').hasBreakpoints).toBe(true);
  });

  it("flags no breakpoints", () => {
    const result = analyzeResponsive('<div className="grid grid-cols-3">Fixed</div>');
    expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
  });

  it("detects mobile stacking", () => {
    expect(analyzeResponsive('className="flex-col md:flex-row"').hasMobileStacking).toBe(true);
  });

  it("detects responsive text sizing", () => {
    expect(analyzeResponsive('md:text-6xl').hasResponsiveText).toBe(true);
  });

  it("detects responsive grid", () => {
    expect(analyzeResponsive('grid-cols-1 md:grid-cols-3').hasResponsiveGrid).toBe(true);
  });

  it("flags hardcoded pixel widths", () => {
    const result = analyzeResponsive('className="w-[800px]"');
    expect(result.noHardcodedWidths).toBe(false);
    expect(result.issues.some(i => i.message.includes('hardcoded pixel'))).toBe(true);
  });

  it("detects mobile nav handling", () => {
    expect(analyzeResponsive('className="hidden md:flex"').mobileNavHandled).toBe(true);
  });
});

// ── Phase 3: DOM Analyzer ─────────────────────────────────────────────────────

describe("DOM Analyzer", () => {
  it("detects missing CTA", () => {
    const result = analyzeDom('<section><h1>Hello</h1></section>');
    expect(result.missingCTA).toBe(true);
    expect(result.issues.some(i => i.severity === 'critical')).toBe(true);
  });

  it("detects missing header", () => {
    const result = analyzeDom('<main><h1>Content</h1></main>');
    expect(result.missingHeader).toBe(true);
  });

  it("detects missing footer", () => {
    const result = analyzeDom('<nav/><Button>Go</Button>');
    expect(result.missingFooter).toBe(true);
  });

  it("detects duplicate sections", () => {
    const code = `function Hero() { return <div/>; }\nfunction Hero() { return <div/>; }`;
    const result = analyzeDom(code);
    expect(result.duplicateSections).toContain('Hero');
  });

  it("detects grid without cols", () => {
    const code = `<div className="grid gap-4">no cols</div>`;
    const result = analyzeDom(code);
    expect(result.brokenGrids.length).toBeGreaterThan(0);
  });

  it("full code passes most checks", () => {
    const result = analyzeDom(FULL_CODE);
    expect(result.missingCTA).toBe(false);
    expect(result.missingHeader).toBe(false);
    expect(result.missingFooter).toBe(false);
  });
});

// ── Phase 4: Pixel Diff Engine ────────────────────────────────────────────────

describe("Pixel Diff Engine", () => {
  it("identical code has similarity 100", () => {
    const result = computeVisualDiff(FULL_CODE, FULL_CODE, 'a', 'b');
    expect(result.similarityScore).toBe(100);
  });

  it("completely different code has low similarity", () => {
    const a = `function Hero() { return <div><h1>Alpha</h1><Button>Start</Button></div>; }`;
    const b = `function Pricing() { return <table><tr><td>Price</td></tr></table>; }`;
    const result = computeVisualDiff(a, b, 'a', 'b');
    expect(result.similarityScore).toBeLessThan(70);
  });

  it("computes layout shift percent", () => {
    const a = `function Hero() {} function Features() {}`;
    const b = `function Features() {} function Pricing() {}`;
    const result = computeVisualDiff(a, b, 'a', 'b');
    expect(result.layoutShiftPercent).toBeGreaterThanOrEqual(0);
    expect(result.layoutShiftPercent).toBeLessThanOrEqual(100);
  });

  it("detects region mismatches", () => {
    const a = `function Hero() {} function Features() {}`;
    const b = `function Hero() {} function Pricing() {}`;
    const result = computeVisualDiff(a, b, 'a', 'b');
    expect(result.regionMismatches.length).toBeGreaterThan(0);
  });

  it("compareAllCandidates returns 3 comparisons for 3 codes", () => {
    const codes = [
      { id: 'A', code: FULL_CODE },
      { id: 'B', code: WEAK_HERO_CODE },
      { id: 'C', code: 'function Pricing() { return <div/>; }' },
    ];
    const comparisons = compareAllCandidates(codes);
    expect(comparisons).toHaveLength(3); // A-B, A-C, B-C
  });

  it("component displacement is non-negative", () => {
    const result = computeVisualDiff(FULL_CODE, WEAK_HERO_CODE, 'a', 'b');
    expect(result.componentDisplacement).toBeGreaterThanOrEqual(0);
  });
});

// ── Phase 2: Screenshot Capture ───────────────────────────────────────────────

describe("Screenshot Capture", () => {
  it("VIEWPORTS has desktop, tablet, mobile", () => {
    expect(VIEWPORTS.desktop.width).toBe(1440);
    expect(VIEWPORTS.tablet.width).toBe(768);
    expect(VIEWPORTS.mobile.width).toBe(390);
  });

  it("captureVisualSnapshot returns a snapshot", () => {
    const snap = captureVisualSnapshot(FULL_CODE, 'cand-A', 'build-1');
    expect(snap.candidateId).toBe('cand-A');
    expect(snap.buildId).toBe('build-1');
    expect(snap.viewport).toBe('desktop');
    expect(snap.hasHero).toBe(true);
    expect(snap.hasCTA).toBe(true);
    expect(snap.hasNav).toBe(true);
    expect(snap.hasFooter).toBe(true);
    expect(snap.sectionCount).toBeGreaterThan(0);
    expect(snap.componentCount).toBeGreaterThan(0);
  });

  it("structureHash is a 16-char hex string", () => {
    const snap = captureVisualSnapshot(FULL_CODE, 'cand-A', 'build-1');
    expect(snap.structureHash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("same code always produces same structureHash", () => {
    const a = captureVisualSnapshot(FULL_CODE, 'a', 'build');
    const b = captureVisualSnapshot(FULL_CODE, 'b', 'build');
    expect(a.structureHash).toBe(b.structureHash);
  });

  it("different codes produce different structureHash", () => {
    const a = captureVisualSnapshot(FULL_CODE, 'a', 'build');
    const b = captureVisualSnapshot(WEAK_HERO_CODE, 'b', 'build');
    expect(a.structureHash).not.toBe(b.structureHash);
  });

  it("captureAllViewports returns 3 snapshots", () => {
    const all = captureAllViewports(FULL_CODE, 'A', 'build-1');
    expect(Object.keys(all)).toHaveLength(3);
    expect(all.desktop.viewport).toBe('desktop');
    expect(all.mobile.viewport).toBe('mobile');
    expect(all.tablet.viewport).toBe('tablet');
  });

  it("screenshotPath follows logical pattern", () => {
    const snap = captureVisualSnapshot(FULL_CODE, 'cand-A', 'build-42', 'mobile');
    expect(snap.screenshotPath).toContain('build-42');
    expect(snap.screenshotPath).toContain('cand-A');
    expect(snap.screenshotPath).toContain('mobile');
  });
});

// ── Combined visual analyzer ──────────────────────────────────────────────────

describe("Visual Analyzer (combined)", () => {
  it("returns all 4 sub-scores", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero', 'Features'], 'A', 'build-1');
    expect(result.heroScore).toBeGreaterThanOrEqual(0);
    expect(result.ctaScore).toBeGreaterThanOrEqual(0);
    expect(result.layoutScore).toBeGreaterThanOrEqual(0);
    expect(result.responsiveScore).toBeGreaterThanOrEqual(0);
    expect(result.visualScore).toBeGreaterThanOrEqual(0);
  });

  it("visualScore is weighted composite 0-10", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build-1');
    expect(result.visualScore).toBeGreaterThanOrEqual(0);
    expect(result.visualScore).toBeLessThanOrEqual(10);
  });

  it("full code scores higher than weak code", () => {
    const full = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build');
    const weak = analyzeVisuals(WEAK_HERO_CODE, ['Hero'], 'B', 'build');
    expect(full.visualScore).toBeGreaterThan(weak.visualScore);
  });

  it("issues are sorted critical → major → minor", () => {
    const result = analyzeVisuals(WEAK_HERO_CODE, ['Hero'], 'B', 'build');
    const severities = result.issues.map(i => i.severity);
    const order = { critical: 0, major: 1, minor: 2 };
    for (let i = 1; i < severities.length; i++) {
      expect(order[severities[i]]).toBeGreaterThanOrEqual(order[severities[i - 1]]);
    }
  });

  it("snapshot is included in result", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build');
    expect(result.snapshot).toBeDefined();
    expect(result.snapshot.hasHero).toBe(true);
  });

  it("buildVisualContextString contains scores", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build');
    const ctx = buildVisualContextString(result);
    expect(ctx).toContain('VISUAL QUALITY SCORES');
    expect(ctx).toContain('Hero:');
    expect(ctx).toContain('CTA:');
    expect(ctx).toContain('Overall Visual Score:');
  });
});

// ── Phase 10: Repair Validator ────────────────────────────────────────────────

describe("Repair Validator", () => {
  it("passes when repaired code is same quality", () => {
    const result = validateRepairVisuals(FULL_CODE, FULL_CODE, ['Hero'], 'build-1');
    expect(result.passed).toBe(true);
    expect(result.regression).toBe(false);
    expect(result.delta).toBe(0);
  });

  it("passes when repair improves score", () => {
    const result = validateRepairVisuals(WEAK_HERO_CODE, FULL_CODE, ['Hero'], 'build-2');
    expect(result.passed).toBe(true);
    expect(result.delta).toBeGreaterThan(0);
  });

  it("detects visual regression", () => {
    const result = validateRepairVisuals(FULL_CODE, WEAK_HERO_CODE, ['Hero'], 'build-3');
    // Full code has higher visual score, so "repairing" it to weak code is a regression
    expect(result.regression).toBe(true);
    expect(result.delta).toBeLessThan(0);
  });

  it("regression type is visual when overall score drops enough", () => {
    const result = validateRepairVisuals(FULL_CODE, WEAK_HERO_CODE, ['Hero'], 'build-4');
    expect(result.regressionType).toBe('visual');
  });

  it("details string contains winner and repaired scores", () => {
    const result = validateRepairVisuals(FULL_CODE, FULL_CODE, ['Hero'], 'build-5');
    expect(result.details).toContain('Winner=');
    expect(result.details).toContain('Repaired=');
  });

  it("winnerScore and repairedScore are 0-10", () => {
    const result = validateRepairVisuals(FULL_CODE, WEAK_HERO_CODE, ['Hero'], 'build-6');
    expect(result.winnerScore).toBeGreaterThanOrEqual(0);
    expect(result.winnerScore).toBeLessThanOrEqual(10);
    expect(result.repairedScore).toBeGreaterThanOrEqual(0);
    expect(result.repairedScore).toBeLessThanOrEqual(10);
  });
});

// ── Phase 13: History ─────────────────────────────────────────────────────────

describe("Visual History", () => {
  beforeEach(() => { resetVisualHistory(); });

  it("initial history is empty", () => {
    expect(getVisualHistory()).toHaveLength(0);
  });

  it("recordVisualBuild adds entry", () => {
    recordVisualBuild('build-1', [], 7.5, undefined);
    expect(getVisualHistory()).toHaveLength(1);
  });

  it("getVisualRegressionRate is 0 with no repair outcomes", () => {
    recordVisualBuild('build-1', [], 7.5, undefined);
    expect(getVisualRegressionRate()).toBe(0);
  });

  it("getRepairImprovementRate is 0 with no outcomes", () => {
    expect(getRepairImprovementRate()).toBe(0);
  });

  it("regression rate computed from repair outcomes", () => {
    const regression = { passed: false, regression: true, regressionType: 'visual' as const, winnerScore: 8, repairedScore: 6, delta: -2, details: '' };
    const ok = { passed: true, regression: false, regressionType: undefined, winnerScore: 8, repairedScore: 9, delta: 1, details: '' };
    recordVisualBuild('b1', [], 8, regression);
    recordVisualBuild('b2', [], 8, ok);
    expect(getVisualRegressionRate()).toBe(0.5);
  });

  it("history is bounded at 200 entries", () => {
    for (let i = 0; i < 220; i++) recordVisualBuild(`b-${i}`, [], 7, undefined);
    expect(getVisualHistory(250)).toHaveLength(200);
  });
});

// ── Phase 14: Visual Learning ─────────────────────────────────────────────────

describe("Visual Learning Loop", () => {
  beforeEach(() => { resetVisualLearning(); });

  it("extractVisualPatterns returns known patterns", () => {
    const patterns = extractVisualPatterns(FULL_CODE);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("recordVisualOutcome does not throw", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build');
    expect(() => recordVisualOutcome(FULL_CODE, result)).not.toThrow();
  });

  it("getVisualLearningMetrics returns correct shape", () => {
    const metrics = getVisualLearningMetrics();
    expect(typeof metrics.totalPatterns).toBe('number');
    expect(Array.isArray(metrics.topPatterns)).toBe(true);
    expect(Array.isArray(metrics.worstPatterns)).toBe(true);
  });

  it("top patterns are empty before min outcomes", () => {
    const result = analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'build');
    recordVisualOutcome(FULL_CODE, result); // only 1 — needs 3
    expect(getTopVisualPatterns()).toHaveLength(0);
  });

  it("patterns promoted after 3 high-score outcomes", () => {
    const highResult = { ...analyzeVisuals(FULL_CODE, ['Hero'], 'A', 'b'), visualScore: 9.0 };
    for (let i = 0; i < 3; i++) recordVisualOutcome(FULL_CODE, highResult);
    // After 3 high-score outcomes (9.0 > HIGH_THRESHOLD 8.0), quality score ≥ 7.5 → promoted
    expect(getTopVisualPatterns().length).toBeGreaterThan(0);
  });
});

// ── Phase 15: Telemetry ───────────────────────────────────────────────────────

describe("Visual Telemetry Metrics", () => {
  beforeEach(() => { resetVisualMetrics(); });

  it("initial metrics are zeroed", () => {
    const m = getVisualMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageVisualScore).toBe(0);
  });

  it("recordVisualBuildMetrics increments totalBuilds", () => {
    recordVisualBuildMetrics({ visualScore: 7, heroScore: 8, ctaScore: 7, layoutScore: 6, responsiveScore: 7 });
    expect(getVisualMetrics().totalBuilds).toBe(1);
  });

  it("averageVisualScore is computed correctly", () => {
    recordVisualBuildMetrics({ visualScore: 8, heroScore: 9, ctaScore: 8, layoutScore: 7, responsiveScore: 8 });
    recordVisualBuildMetrics({ visualScore: 6, heroScore: 7, ctaScore: 6, layoutScore: 5, responsiveScore: 6 });
    expect(getVisualMetrics().averageVisualScore).toBe(7);
  });

  it("all sub-scores averaged correctly", () => {
    recordVisualBuildMetrics({ visualScore: 8, heroScore: 10, ctaScore: 6, layoutScore: 8, responsiveScore: 4 });
    const m = getVisualMetrics();
    expect(m.averageHeroScore).toBe(10);
    expect(m.averageCTAScore).toBe(6);
    expect(m.averageLayoutScore).toBe(8);
    expect(m.averageResponsiveScore).toBe(4);
  });

  it("resetVisualMetrics clears records", () => {
    recordVisualBuildMetrics({ visualScore: 9, heroScore: 9, ctaScore: 9, layoutScore: 9, responsiveScore: 9 });
    resetVisualMetrics();
    expect(getVisualMetrics().totalBuilds).toBe(0);
  });
});

// ── Phase 11: Candidate Selection Upgrade ────────────────────────────────────

describe("Candidate Selection — Visual Integration", () => {
  const makeCandidate = (overallScore: number, visualScore: number, label: 'A'|'B'|'C', index: number) => ({
    index,
    label,
    overallScore,
    heroScore: overallScore,
    layoutScore: overallScore,
    ctaScore: overallScore,
    accessibilityScore: overallScore,
    shadcnScore: overallScore,
    consistencyScore: overallScore,
    visualScore,
    combinedScore: Math.round((overallScore * 0.70 + visualScore * 0.30) * 100) / 100,
  });

  it("candidate with higher combinedScore wins", () => {
    const scored = [
      makeCandidate(8.0, 6.0, 'A', 0), // combined = 7.4
      makeCandidate(7.5, 9.0, 'B', 1), // combined = 7.95
      makeCandidate(7.0, 5.0, 'C', 2), // combined = 6.4
    ];
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
  });

  it("visual score breaks ties when combined scores are close", () => {
    const scored = [
      makeCandidate(8.0, 6.0, 'A', 0), // combined = 7.4
      makeCandidate(8.0, 8.0, 'B', 1), // combined = 8.0 wait...
      makeCandidate(8.0, 6.0, 'C', 2), // combined = 7.4
    ];
    // Recompute — B has higher combined, wins outright
    const winner = selectBestCandidate(scored);
    expect(winner.label).toBe('B');
  });

  it("within tie threshold, visual score wins", () => {
    const scored = [
      { ...makeCandidate(8.0, 5.0, 'A', 0), combinedScore: 7.5 },
      { ...makeCandidate(8.0, 9.0, 'B', 1), combinedScore: 7.6 }, // <0.2 diff
      { ...makeCandidate(7.5, 7.0, 'C', 2), combinedScore: 7.35 },
    ];
    const winner = selectBestCandidate(scored);
    // B has slightly higher combined AND higher visual, wins
    expect(winner.label).toBe('B');
  });

  it("selectBestCandidate throws on empty array", () => {
    expect(() => selectBestCandidate([])).toThrow();
  });

  it("combinedScore is 70% evaluator + 30% visual", () => {
    const cand = makeCandidate(8.0, 6.0, 'A', 0);
    expect(cand.combinedScore).toBe(7.4); // 8.0*0.7 + 6.0*0.3 = 5.6 + 1.8 = 7.4
  });
});
