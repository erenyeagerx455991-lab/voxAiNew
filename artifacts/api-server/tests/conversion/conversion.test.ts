// ── V7.3.1 Conversion Intelligence Engine — Tests ────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeConversion,
  CONVERSION_REPAIR_THRESHOLD,
} from '../../src/agents/conversion/conversionAnalyzer.js';
import {
  recordConversionRun,
  getConversionQualityMetrics,
  resetConversionMetrics,
} from '../../src/telemetry/conversionMetrics.js';
import {
  recordConversionOutcome,
  getConversionLearningMetrics,
  getFixWeights,
  getHighPriorityFixes,
  getLowPriorityFixes,
  resetConversionLearning,
} from '../../src/agents/conversion/conversionLearning.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_DNA = {
  designLanguage: 'monochrome-dark', layoutStyle: 'centered', typographySystem: 'sans-modern',
  spacingSystem: '8pt', colorSystem: { primary: '#fff', background: '#000', surface: '#111', accent: '#3b82f6', border: '#222', textMuted: '#888' },
  animationPersonality: 'subtle' as const, decorationLevel: 'minimal', componentPreferences: [],
  heroStyle: 'centered-minimal', cardStyle: 'flat-bordered', visualDensity: 'balanced',
  theme: 'dark', primaryColor: '#fff', secondaryColor: '#888', accentColor: '#3b82f6',
  bgColor: '#000', bgGradient: '', headingGradient: '', buttonStyle: 'rounded-lg',
  buttonColors: '', cardStyleTokens: '', mood: 'professional',
};

const MOCK_EVAL = {
  overallScore: 8.2, heroScore: 8.0, layoutScore: 8.5, ctaScore: 8.0,
  accessibilityScore: 9.0, shadcnScore: 8.5, coverageScore: 7.0,
  navigationScore: 8.0, accountMenuScore: 7.5, authNavbarAlignmentScore: 8.0,
  consistencyScore: 8.5, dashboardScore: 6.0, formScore: 6.0, motionScore: 7.0,
  coveragePercent: 75, componentUsage: {}, issues: [],
} as any;

const HIGH_CONVERSION_CODE = `
function Hero() {
  return (
    <section className="py-24">
      <h1 className="text-6xl font-bold">Reduce support tickets by 42% using AI workflows</h1>
      <p>Used by 12,000+ engineering teams to automate customer support.</p>
      <Button variant="default">Start free 14-day trial</Button>
      <Button variant="outline">Watch 3-min demo</Button>
      <div className="flex items-center gap-2 mt-4">
        <span className="text-yellow-400">★★★★★</span>
        <span>4.9 / 5 · 2,400 reviews</span>
        <span>Trusted by Stripe, Vercel, Linear</span>
      </div>
    </section>
  );
}
function LogoBand() { return <section className="py-8"><p>Trusted by 500+ companies</p></section>; }
function Features() { return <section className="py-20"><h2>Cut onboarding time by 60%</h2></section>; }
function Testimonials() { return <section className="py-20"><blockquote>Best tool we use — Sarah, CTO</blockquote></section>; }
function Pricing() {
  return (
    <section className="py-20">
      <h2>Simple pricing</h2>
      <Card><CardContent>Starter — $0/mo</CardContent></Card>
      <Card className="ring-2 ring-blue-500"><CardContent>Pro — $49/mo<Badge>Most Popular</Badge></CardContent></Card>
      <Card><CardContent>Enterprise — Custom</CardContent></Card>
      <p>30-day money-back guarantee · Cancel anytime · No credit card required</p>
    </section>
  );
}
function CTA() { return <section className="py-24"><Button variant="default">Get started free</Button></section>; }
function App() { return <main><Hero /><LogoBand /><Features /><Testimonials /><Pricing /><CTA /></main>; }
`;

const LOW_CONVERSION_CODE = `
function Hero() {
  return (
    <div>
      <h1>Transform your business with our revolutionary platform</h1>
      <Button>Get Started</Button>
      <Button>Learn More</Button>
      <Button>Sign Up</Button>
      <Button>Try Now</Button>
    </div>
  );
}
function Features() { return <section><h2>Powerful and intuitive features</h2></section>; }
function Pricing() {
  return (
    <section>
      <Card><CardContent>Basic — $10</CardContent></Card>
      <Card><CardContent>Pro — $30</CardContent></Card>
      <Card><CardContent>Business — $60</CardContent></Card>
    </section>
  );
}
function App() { return <main><Pricing /><Hero /><Features /></main>; }
`;

const makeSectionOrder = (sections: string[]) => sections;

// ── Phase 1: ConversionReport Structure ───────────────────────────────────────

describe("V7.3.1 — Phase 1: ConversionReport Structure", () => {
  it("analyzeConversion returns all required fields", () => {
    const result = analyzeConversion({ code: HIGH_CONVERSION_CODE, sectionOrder: ['Hero', 'LogoBand', 'Features', 'Testimonials', 'Pricing', 'CTA'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result).toHaveProperty('conversionScore');
    expect(result).toHaveProperty('trustScore');
    expect(result).toHaveProperty('ctaScore');
    expect(result).toHaveProperty('pricingScore');
    expect(result).toHaveProperty('offerClarityScore');
    expect(result).toHaveProperty('funnelScore');
    expect(result).toHaveProperty('issues');
    expect(result).toHaveProperty('funnelAnalysis');
    expect(result).toHaveProperty('repairRequired');
  });

  it("conversionScore is a number 0-10", () => {
    const result = analyzeConversion({ code: HIGH_CONVERSION_CODE, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result.conversionScore).toBeGreaterThanOrEqual(0);
    expect(result.conversionScore).toBeLessThanOrEqual(10);
  });

  it("repairRequired is true when conversionScore < 8.5", () => {
    const result = analyzeConversion({ code: LOW_CONVERSION_CODE, sectionOrder: ['Pricing', 'Hero', 'Features'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    if (result.conversionScore < CONVERSION_REPAIR_THRESHOLD) {
      expect(result.repairRequired).toBe(true);
    }
  });

  it("CONVERSION_REPAIR_THRESHOLD is 8.5", () => {
    expect(CONVERSION_REPAIR_THRESHOLD).toBe(8.5);
  });
});

// ── Phase 2: Trust Signal Intelligence ────────────────────────────────────────

describe("V7.3.1 — Phase 2: Trust Signal Intelligence", () => {
  it("high-conversion code scores trust > low-conversion code", () => {
    const high = analyzeConversion({ code: HIGH_CONVERSION_CODE, sectionOrder: ['Hero', 'Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const low  = analyzeConversion({ code: LOW_CONVERSION_CODE, sectionOrder: ['Hero', 'Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(high.trustScore).toBeGreaterThan(low.trustScore);
  });

  it("detects hero CTA without trust signal and adds issue", () => {
    const code = `function Hero() { return <div><h1>Our Platform</h1><Button variant="default">Get Started</Button></div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const trustIssues = result.issues.filter(i => i.category === 'trust');
    const heroTrustIssue = trustIssues.find(i => i.fixKey === 'trust_signal_hero');
    expect(heroTrustIssue).toBeDefined();
    expect(heroTrustIssue?.severity).toBe('critical');
  });

  it("code with reviews+ratings passes trust check", () => {
    const code = `function Hero() { return <div><span>4.9/5</span><span>2,400 reviews</span><Button variant="default">Start</Button></div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const heroTrustIssue = result.issues.find(i => i.fixKey === 'trust_signal_hero');
    expect(heroTrustIssue).toBeUndefined();
  });

  it("detects missing pricing trust signal", () => {
    const code = `
      function Hero() { return <div><span>Trusted by 1000 users</span><Button variant="default">Go</Button></div>; }
      function Pricing() { return <section><Card>$49</Card></section>; }
    `;
    const result = analyzeConversion({ code, sectionOrder: ['Hero', 'Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const pricingTrust = result.issues.find(i => i.fixKey === 'trust_signal_pricing');
    expect(pricingTrust).toBeDefined();
  });

  it("detects missing social proof entirely", () => {
    const code = `function Hero() { return <div><Button>Start</Button></div>; } function Features() { return <div></div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero', 'Features'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const proofIssue = result.issues.find(i => i.fixKey === 'social_proof_placement');
    expect(proofIssue).toBeDefined();
  });
});

// ── Phase 3: CTA Intelligence ─────────────────────────────────────────────────

describe("V7.3.1 — Phase 3: CTA Intelligence", () => {
  it("detects missing primary CTA in hero", () => {
    const code = `function Hero() { return <div><h1>Hello</h1><Button variant="outline">Demo</Button></div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const ctaIssue = result.issues.find(i => i.category === 'cta' && i.fixKey === 'cta_hierarchy' && i.severity === 'critical');
    expect(ctaIssue).toBeDefined();
  });

  it("detects competing primary CTAs", () => {
    const code = `function Hero() { return <div>
      <Button variant="default">Get Started</Button>
      <Button variant="default">Sign Up Free</Button>
      <Button variant="default">Try Now</Button>
    </div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const competingIssue = result.issues.find(i => i.category === 'cta' && i.severity === 'major');
    expect(competingIssue).toBeDefined();
  });

  it("primary + secondary CTA structure scores higher than overloaded CTAs", () => {
    const good = `function Hero() { return <div><Button variant="default">Start Free</Button><Button variant="outline">Demo</Button></div>; }`;
    const bad  = `function Hero() { return <div>
      <Button variant="default">Start Free</Button>
      <Button variant="default">Sign Up</Button>
      <Button variant="default">Try Now</Button>
    </div>; }`;
    const goodResult = analyzeConversion({ code: good, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const badResult  = analyzeConversion({ code: bad,  sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(goodResult.ctaScore).toBeGreaterThan(badResult.ctaScore);
  });
});

// ── Phase 4: Pricing Psychology ───────────────────────────────────────────────

describe("V7.3.1 — Phase 4: Pricing Psychology", () => {
  it("returns pricingScore=8 when no pricing section", () => {
    const code = `function Hero() { return <div></div>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result.pricingScore).toBe(8);
  });

  it("detects missing Most Popular highlight", () => {
    const code = `function Pricing() { return <section><Card>$10</Card><Card>$30</Card></section>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const issue = result.issues.find(i => i.fixKey === 'pricing_highlight');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('major');
  });

  it("detects missing risk reversal", () => {
    const code = `function Pricing() { return <section><Card className="ring-2">Most Popular $49</Card></section>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const issue = result.issues.find(i => i.fixKey === 'pricing_risk_reversal');
    expect(issue).toBeDefined();
  });

  it("well-formed pricing section scores higher", () => {
    const goodPricing = `function Pricing() {
      return <section>
        <Card>Starter $0</Card>
        <Card className="ring-2 ring-blue-500"><Badge>Most Popular</Badge> Pro $49
          <p>30-day money-back guarantee · Cancel anytime</p>
        </Card>
        <Card>Enterprise</Card>
      </section>;
    }`;
    const poorPricing = `function Pricing() {
      return <section><Card>$10</Card><Card>$30</Card></section>;
    }`;
    const good = analyzeConversion({ code: goodPricing, sectionOrder: ['Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const poor = analyzeConversion({ code: poorPricing, sectionOrder: ['Pricing'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(good.pricingScore).toBeGreaterThan(poor.pricingScore);
  });
});

// ── Phase 5: Offer Clarity ────────────────────────────────────────────────────

describe("V7.3.1 — Phase 5: Offer Clarity", () => {
  it("detects vague transformation language", () => {
    const code = `function Hero() { return <h1>Transform your business with our revolutionary platform</h1>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const issue = result.issues.find(i => i.fixKey === 'offer_clarity_hero');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('major');
  });

  it("detects missing value proposition entirely", () => {
    const code = `function Hero() { return <h1>The Platform for Teams</h1>; }`;
    const result = analyzeConversion({ code, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const issue = result.issues.find(i => i.fixKey === 'value_prop_specificity');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('critical');
  });

  it("quantified outcome scores highest", () => {
    const quantified = `function Hero() { return <h1>Reduce support tickets by 42% using AI</h1>; }`;
    const generic    = `function Hero() { return <h1>The Platform for Teams</h1>; }`;
    const q = analyzeConversion({ code: quantified, sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const g = analyzeConversion({ code: generic,    sectionOrder: ['Hero'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(q.offerClarityScore).toBeGreaterThan(g.offerClarityScore);
  });
});

// ── Phase 6: Funnel Sequencing ────────────────────────────────────────────────

describe("V7.3.1 — Phase 6: Funnel Sequencing", () => {
  it("ideal section order scores higher than reversed order", () => {
    const ideal   = ['Hero', 'LogoBand', 'Features', 'Testimonials', 'Pricing', 'CTA'];
    const reversed = ['Pricing', 'Features', 'Hero', 'CTA'];
    const goodResult = analyzeConversion({ code: HIGH_CONVERSION_CODE, sectionOrder: ideal,    evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    const badResult  = analyzeConversion({ code: LOW_CONVERSION_CODE,  sectionOrder: reversed, evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(goodResult.funnelScore).toBeGreaterThan(badResult.funnelScore);
  });

  it("detects pricing-before-features ordering issue", () => {
    const badOrder = ['Hero', 'Pricing', 'Features', 'CTA'];
    const result   = analyzeConversion({ code: LOW_CONVERSION_CODE, sectionOrder: badOrder, evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result.funnelAnalysis.outOfOrder).toContain('pricing-before-features');
  });

  it("funnelAnalysis contains sections, idealFlow, missingStages, outOfOrder", () => {
    const result = analyzeConversion({ code: LOW_CONVERSION_CODE, sectionOrder: ['Hero', 'Features'], evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result.funnelAnalysis.sections).toBeDefined();
    expect(result.funnelAnalysis.idealFlow).toBeDefined();
    expect(result.funnelAnalysis.missingStages).toBeDefined();
    expect(result.funnelAnalysis.outOfOrder).toBeDefined();
    expect(result.funnelAnalysis.score).toBeGreaterThanOrEqual(0);
  });

  it("CTA before pricing is detected as out-of-order", () => {
    const badOrder = ['Hero', 'CTA', 'Pricing', 'Features'];
    const result   = analyzeConversion({ code: LOW_CONVERSION_CODE, sectionOrder: badOrder, evaluationResult: MOCK_EVAL, critiqueReport: null, designDNA: MOCK_DNA });
    expect(result.funnelAnalysis.outOfOrder).toContain('cta-before-pricing');
  });
});

// ── Phase 9: Conversion Telemetry ─────────────────────────────────────────────

describe("V7.3.1 — Phase 9: Conversion Telemetry", () => {
  beforeEach(() => resetConversionMetrics());

  it("returns empty metrics when no runs recorded", () => {
    const m = getConversionQualityMetrics();
    expect(m.runsTracked).toBe(0);
    expect(m.averageConversionScore).toBe(0);
    expect(m.repairRate).toBe('0%');
  });

  it("recordConversionRun increments runsTracked", () => {
    recordConversionRun({ buildId: 'b1', conversionScore: 8.5, trustScore: 8.0, ctaScore: 9.0, pricingScore: 7.5, funnelScore: 8.0, offerClarityScore: 8.5, repairTriggered: false, repairImproved: false, issuesDetected: 2 });
    expect(getConversionQualityMetrics().runsTracked).toBe(1);
  });

  it("averageConversionScore is computed correctly", () => {
    recordConversionRun({ buildId: 'b1', conversionScore: 8.0, trustScore: 8, ctaScore: 8, pricingScore: 8, funnelScore: 8, offerClarityScore: 8, repairTriggered: false, repairImproved: false, issuesDetected: 1 });
    recordConversionRun({ buildId: 'b2', conversionScore: 9.0, trustScore: 9, ctaScore: 9, pricingScore: 9, funnelScore: 9, offerClarityScore: 9, repairTriggered: false, repairImproved: false, issuesDetected: 0 });
    expect(getConversionQualityMetrics().averageConversionScore).toBe(8.5);
  });

  it("repairRate reflects triggered repairs correctly", () => {
    recordConversionRun({ buildId: 'b1', conversionScore: 7.5, trustScore: 7, ctaScore: 7, pricingScore: 7, funnelScore: 7, offerClarityScore: 7, repairTriggered: true, repairImproved: true, issuesDetected: 3 });
    recordConversionRun({ buildId: 'b2', conversionScore: 9.0, trustScore: 9, ctaScore: 9, pricingScore: 9, funnelScore: 9, offerClarityScore: 9, repairTriggered: false, repairImproved: false, issuesDetected: 0 });
    expect(getConversionQualityMetrics().repairRate).toBe('50%');
  });

  it("recentScores returns last 5 entries", () => {
    for (let i = 0; i < 7; i++) {
      recordConversionRun({ buildId: `b${i}`, conversionScore: 7 + i * 0.2, trustScore: 7, ctaScore: 7, pricingScore: 7, funnelScore: 7, offerClarityScore: 7, repairTriggered: false, repairImproved: false, issuesDetected: i });
    }
    expect(getConversionQualityMetrics().recentScores).toHaveLength(5);
  });

  it("resetConversionMetrics clears all data", () => {
    recordConversionRun({ buildId: 'b1', conversionScore: 9, trustScore: 9, ctaScore: 9, pricingScore: 9, funnelScore: 9, offerClarityScore: 9, repairTriggered: false, repairImproved: false, issuesDetected: 0 });
    resetConversionMetrics();
    expect(getConversionQualityMetrics().runsTracked).toBe(0);
  });
});

// ── Phase 10: Conversion Learning Loop ───────────────────────────────────────

describe("V7.3.1 — Phase 10: Conversion Learning Loop", () => {
  beforeEach(() => resetConversionLearning());

  it("getCriticLearningMetrics returns N/A when empty", () => {
    expect(getConversionLearningMetrics().overallSuccessRate).toBe('N/A');
  });

  it("recordConversionOutcome increments totalOutcomes", () => {
    recordConversionOutcome({ fixCategory: 'trust_signal_hero', applied: true, scoreBefore: 7, scoreAfter: 8.5, improved: true });
    expect(getConversionLearningMetrics().totalOutcomes).toBe(1);
  });

  it("successful outcomes update fix category success rate", () => {
    for (let i = 0; i < 3; i++) {
      recordConversionOutcome({ fixCategory: 'cta_hierarchy', applied: true, scoreBefore: 7, scoreAfter: 8.5, improved: true });
    }
    const weights = getFixWeights();
    const ctaWeight = weights.find(w => w.category === 'cta_hierarchy');
    expect(ctaWeight?.successes).toBe(3);
    expect(ctaWeight?.successRate).toBe(100);
    expect(ctaWeight?.priority).toBe('high');
  });

  it("getHighPriorityFixes requires ≥3 attempts", () => {
    recordConversionOutcome({ fixCategory: 'pricing_highlight', applied: true, scoreBefore: 7, scoreAfter: 9, improved: true });
    recordConversionOutcome({ fixCategory: 'pricing_highlight', applied: true, scoreBefore: 7, scoreAfter: 9, improved: true });
    expect(getHighPriorityFixes()).not.toContain('pricing_highlight');
    recordConversionOutcome({ fixCategory: 'pricing_highlight', applied: true, scoreBefore: 7, scoreAfter: 9, improved: true });
    expect(getHighPriorityFixes()).toContain('pricing_highlight');
  });

  it("getLowPriorityFixes returns categories with <30% success", () => {
    for (let i = 0; i < 4; i++) {
      recordConversionOutcome({ fixCategory: 'offer_clarity_feature', applied: true, scoreBefore: 7, scoreAfter: 7.1, improved: false });
    }
    expect(getLowPriorityFixes()).toContain('offer_clarity_feature');
  });

  it("all 12 fix categories are present in weights", () => {
    const categories = getFixWeights().map(w => w.category);
    expect(categories).toContain('trust_signal_hero');
    expect(categories).toContain('cta_hierarchy');
    expect(categories).toContain('pricing_highlight');
    expect(categories).toContain('pricing_risk_reversal');
    expect(categories).toContain('funnel_sequencing');
    expect(categories).toContain('social_proof_placement');
    expect(categories).toContain('value_prop_specificity');
    expect(getFixWeights()).toHaveLength(12);
  });

  it("resetConversionLearning clears all data", () => {
    recordConversionOutcome({ fixCategory: 'cta_overload', applied: true, scoreBefore: 7, scoreAfter: 8, improved: true });
    resetConversionLearning();
    expect(getConversionLearningMetrics().totalOutcomes).toBe(0);
    expect(getFixWeights().every(w => w.attempts === 0)).toBe(true);
  });
});
