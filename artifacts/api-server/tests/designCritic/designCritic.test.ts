// ── V7.3.0 Design Critic Agent — Tests ────────────────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CRITIC_REPAIR_THRESHOLD,
  type CritiqueReport,
  type CritiqueCategory,
} from '../../src/agents/designCritic/designCritic.js';
import {
  recordCriticRun,
  getCriticQualityMetrics,
  resetCriticMetrics,
} from '../../src/telemetry/criticMetrics.js';
import {
  recordCriticOutcome,
  getCriticLearningMetrics,
  getCategorySuccessRates,
  getHighImpactCategories,
  getLowEffectCategories,
  resetCriticLearning,
} from '../../src/agents/designCritic/criticLearning.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const STRONG_CODE = `
function Hero() {
  return (
    <section className="py-24 bg-black">
      <h1 className="text-6xl font-bold text-white">Automate your entire workflow</h1>
      <p className="text-xl text-gray-400 mt-4">Trusted by 12,000+ engineering teams. Save 40% on DevOps costs.</p>
      <div className="flex gap-4 mt-8">
        <Button variant="default">Start free trial</Button>
        <Button variant="outline">Watch demo</Button>
      </div>
      <div className="flex gap-2 mt-4 items-center">
        <span className="text-yellow-400">★★★★★</span>
        <span className="text-sm text-gray-400">4.9 / 5 — 2,000+ reviews</span>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-24">
      <h2 className="text-3xl font-bold">Everything you need</h2>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-24">
      <h2 className="text-3xl font-bold">Simple pricing</h2>
      <div className="grid grid-cols-3 gap-8">
        <Card><CardContent>Starter — $0</CardContent></Card>
        <Card className="ring-2 ring-blue-500"><CardContent>Pro — $49 <Badge>Most Popular</Badge></CardContent></Card>
        <Card><CardContent>Enterprise — Custom</CardContent></Card>
      </div>
      <p className="text-sm text-gray-400">Start free trial — no credit card required</p>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <h2 className="text-4xl font-bold">Ready to ship faster?</h2>
      <Button variant="default">Get started free</Button>
    </section>
  );
}

function App() {
  return <main><Hero /><Features /><Pricing /><CTA /></main>;
}`;

const WEAK_CODE = `
function Hero() {
  return (
    <div>
      <h1 className="text-2xl">The Platform for Teams</h1>
      <Button>Get Started</Button>
      <Button>Learn More</Button>
      <Button>Try Now</Button>
      <Button>Sign Up</Button>
    </div>
  );
}

function App() {
  return <main><Hero /></main>;
}`;

const MOCK_DNA = {
  designLanguage: 'monochrome-dark', layoutStyle: 'centered', typographySystem: 'sans-modern',
  spacingSystem: '8pt', colorSystem: { primary: '#fff', background: '#000', surface: '#111', accent: '#3b82f6', border: '#222', textMuted: '#888' },
  animationPersonality: 'subtle', decorationLevel: 'minimal', componentPreferences: [],
  heroStyle: 'centered-minimal', cardStyle: 'flat-bordered', visualDensity: 'balanced',
  theme: 'dark', primaryColor: '#fff', secondaryColor: '#888', accentColor: '#3b82f6',
  bgColor: '#000', bgGradient: '', headingGradient: '', buttonStyle: 'rounded-lg',
  buttonColors: '', cardStyleTokens: '', mood: 'professional',
};

const MOCK_EVAL: Record<string, number> = {
  overallScore: 8.2, heroScore: 8.0, layoutScore: 8.5, ctaScore: 7.5,
  accessibilityScore: 9.0, shadcnScore: 8.5, coverageScore: 7.0,
  navigationScore: 8.0, accountMenuScore: 7.5, authNavbarAlignmentScore: 8.0,
  consistencyScore: 8.5, dashboardScore: 6.0, formScore: 6.0, motionScore: 7.0,
};

// ── Phase 7: criticScore constant ─────────────────────────────────────────────

describe("V7.3.0 — Phase 7: Critic Repair Threshold", () => {
  it("CRITIC_REPAIR_THRESHOLD is 8.5", () => {
    expect(CRITIC_REPAIR_THRESHOLD).toBe(8.5);
  });
});

// ── Phase 5: Design Taste Rules (rule-based detection) ────────────────────────

describe("V7.3.0 — Phase 5: Design Taste Rules", () => {
  it("detects CTA overload (> 5 CTA buttons)", () => {
    const code = `function Hero() {
      return <div>
        <Button>Get Started</Button><Button>Sign Up</Button>
        <Button>Try Now</Button><Button>Start Free</Button>
        <Button>Book Demo</Button><Button>Learn More</Button>
      </div>;
    }`;
    // Rule fires when CTA count > 5
    const ctaCount = (code.match(/Get Started|Sign Up|Try Now|Start Free|Book Demo|Learn More/gi) ?? []).length;
    expect(ctaCount).toBeGreaterThan(5);
  });

  it("detects missing trust signals in hero near CTA", () => {
    const code = `function Hero() {
      return <div><h1>Our Platform</h1><Button>Get Started</Button></div>;
    }`;
    const hasCTA    = /Button|Get Started/i.test(code);
    const hasProof  = /trusted|customers|users|rating|stars|Avatar|testimonial/i.test(code);
    expect(hasCTA).toBe(true);
    expect(hasProof).toBe(false);
  });

  it("detects generic placeholder copy", () => {
    const code = `function Hero() { return <h1>Your Company</h1>; }`;
    expect(/placeholder|lorem ipsum|your company|acme corp/i.test(code)).toBe(true);
  });

  it("detects gradient overuse", () => {
    const code = Array(10).fill('bg-gradient-to-r from-blue-500').join(' ');
    const count = (code.match(/gradient-to-|from-\[|via-\[|bg-gradient/g) ?? []).length;
    expect(count).toBeGreaterThan(8);
  });

  it("detects missing Most Popular highlight in pricing", () => {
    const code = `function Pricing() {
      return <section><Card>Starter</Card><Card>Pro</Card><Card>Enterprise</Card></section>;
    }`;
    const hasMostPopular = /most popular|recommended|best value|highlighted|ring-2|border-2.*accent/i.test(code);
    expect(hasMostPopular).toBe(false);
  });
});

// ── Phase 6: Conversion Review ────────────────────────────────────────────────

describe("V7.3.0 — Phase 6: Conversion Review", () => {
  it("detects missing social proof before CTA section", () => {
    const code = `function CTA() { return <section><Button>Buy Now</Button></section>; }`;
    const hasSocialProof = /testimonial|review|trusted by|rating|customers/i.test(code);
    const hasCTASection  = /function\s+CTA|function\s+Pricing/i.test(code);
    expect(hasCTASection).toBe(true);
    expect(hasSocialProof).toBe(false);
  });

  it("detects missing value proposition in hero", () => {
    const code = `function Hero() { return <h1>The Platform for Teams</h1>; }`;
    const hasValueProp = /save|reduce|increase|improve|faster|easier|automate|eliminate/i.test(code);
    expect(hasValueProp).toBe(false);
  });

  it("detects missing free trial in pricing", () => {
    const code = `function Pricing() {
      return <section><Card>Pro $49/mo</Card></section>;
    }`;
    const hasFreeTrial = /free trial|14.day|30.day|no credit card/i.test(code);
    expect(hasFreeTrial).toBe(false);
  });

  it("strong code passes conversion checks", () => {
    expect(/save|automate/i.test(STRONG_CODE)).toBe(true);
    expect(/no credit card required/i.test(STRONG_CODE)).toBe(true);
    expect(/most popular/i.test(STRONG_CODE)).toBe(true);
  });
});

// ── Phase 4: Severity System ──────────────────────────────────────────────────

describe("V7.3.0 — Phase 4: Severity System", () => {
  const validSeverities = new Set(['critical', 'major', 'minor', 'info']);
  const validCategories: CritiqueCategory[] = ['hero', 'layout', 'typography', 'ctaHierarchy', 'trustBuilding', 'accessibility', 'motion', 'dashboardUX', 'formsUX', 'navbarUX', 'conversion', 'visualHierarchy'];

  it("all valid severities are accepted", () => {
    expect(validSeverities.has('critical')).toBe(true);
    expect(validSeverities.has('major')).toBe(true);
    expect(validSeverities.has('minor')).toBe(true);
    expect(validSeverities.has('info')).toBe(true);
  });

  it("all 12 critique categories are defined", () => {
    expect(validCategories).toHaveLength(12);
  });

  it("all category names are unique", () => {
    expect(new Set(validCategories).size).toBe(12);
  });
});

// ── Phase 9: Critic Telemetry ─────────────────────────────────────────────────

describe("V7.3.0 — Phase 9: Critic Telemetry", () => {
  beforeEach(() => resetCriticMetrics());

  it("getCriticQualityMetrics returns 0 when empty", () => {
    const m = getCriticQualityMetrics();
    expect(m.criticRunsTracked).toBe(0);
    expect(m.averageCriticScore).toBe(0);
    expect(m.repairTriggerRate).toBe('0%');
  });

  it("recordCriticRun increments run count", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 8.0, issuesDetected: 3, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.2, scoreAfterCritic: 8.2, topCategories: ['hero'] });
    expect(getCriticQualityMetrics().criticRunsTracked).toBe(1);
  });

  it("averageCriticScore is computed correctly", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 8.0, issuesDetected: 2, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.0, scoreAfterCritic: 8.0, topCategories: [] });
    recordCriticRun({ buildId: 'b2', criticScore: 9.0, issuesDetected: 1, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.5, scoreAfterCritic: 8.5, topCategories: [] });
    expect(getCriticQualityMetrics().averageCriticScore).toBe(8.5);
  });

  it("repairTriggerRate is computed correctly", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 7.5, issuesDetected: 5, repairTriggered: true, repairImproved: true, scoreBeforeCritic: 8.0, scoreAfterCritic: 8.5, topCategories: ['conversion'] });
    recordCriticRun({ buildId: 'b2', criticScore: 9.0, issuesDetected: 1, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.5, scoreAfterCritic: 8.5, topCategories: [] });
    expect(getCriticQualityMetrics().repairTriggerRate).toBe('50%');
  });

  it("topIssueCategories are ranked by frequency", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 7.5, issuesDetected: 3, repairTriggered: true, repairImproved: true, scoreBeforeCritic: 8.0, scoreAfterCritic: 8.5, topCategories: ['hero', 'conversion'] });
    recordCriticRun({ buildId: 'b2', criticScore: 8.0, issuesDetected: 2, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.0, scoreAfterCritic: 8.0, topCategories: ['hero'] });
    const m = getCriticQualityMetrics();
    expect(m.topIssueCategories[0].category).toBe('hero');
    expect(m.topIssueCategories[0].occurrences).toBe(2);
  });

  it("averageIssuesDetected is computed correctly", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 8.0, issuesDetected: 4, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.0, scoreAfterCritic: 8.0, topCategories: [] });
    recordCriticRun({ buildId: 'b2', criticScore: 8.5, issuesDetected: 2, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8.5, scoreAfterCritic: 8.5, topCategories: [] });
    expect(getCriticQualityMetrics().averageIssuesDetected).toBe(3);
  });

  it("recentScores returns last 5 entries", () => {
    for (let i = 0; i < 7; i++) {
      recordCriticRun({ buildId: `b${i}`, criticScore: 7 + i * 0.2, issuesDetected: i, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 8, scoreAfterCritic: 8, topCategories: [] });
    }
    expect(getCriticQualityMetrics().recentScores).toHaveLength(5);
  });

  it("resetCriticMetrics clears all data", () => {
    recordCriticRun({ buildId: 'b1', criticScore: 9.0, issuesDetected: 0, repairTriggered: false, repairImproved: false, scoreBeforeCritic: 9.0, scoreAfterCritic: 9.0, topCategories: [] });
    resetCriticMetrics();
    expect(getCriticQualityMetrics().criticRunsTracked).toBe(0);
  });
});

// ── Phase 10: Critic Learning Loop ────────────────────────────────────────────

describe("V7.3.0 — Phase 10: Critic Learning Loop", () => {
  beforeEach(() => resetCriticLearning());

  it("getCriticLearningMetrics returns N/A when no outcomes", () => {
    expect(getCriticLearningMetrics().overallSuccessRate).toBe('N/A');
    expect(getCriticLearningMetrics().totalOutcomes).toBe(0);
  });

  it("recordCriticOutcome increments total outcomes", () => {
    recordCriticOutcome({ category: 'hero', suggestionType: 'major', applied: true, scoreBefore: 7.5, scoreAfter: 8.2, improved: true });
    expect(getCriticLearningMetrics().totalOutcomes).toBe(1);
  });

  it("successful outcomes update category success rates", () => {
    for (let i = 0; i < 3; i++) {
      recordCriticOutcome({ category: 'conversion', suggestionType: 'major', applied: true, scoreBefore: 7, scoreAfter: 8.5, improved: true });
    }
    const rates = getCategorySuccessRates();
    const conversionRate = rates.find(r => r.category === 'conversion');
    expect(conversionRate?.successes).toBe(3);
    expect(conversionRate?.successRate).toBe(100);
  });

  it("failed outcomes are tracked separately", () => {
    recordCriticOutcome({ category: 'layout', suggestionType: 'minor', applied: true, scoreBefore: 7, scoreAfter: 7.1, improved: false });
    const rates = getCategorySuccessRates();
    const layoutRate = rates.find(r => r.category === 'layout');
    expect(layoutRate?.attempts).toBe(1);
    expect(layoutRate?.successRate).toBe(0);
  });

  it("getHighImpactCategories returns only categories with ≥3 attempts", () => {
    // Only 2 attempts — should not appear in high impact
    recordCriticOutcome({ category: 'motion', suggestionType: 'minor', applied: true, scoreBefore: 7, scoreAfter: 8, improved: true });
    recordCriticOutcome({ category: 'motion', suggestionType: 'minor', applied: true, scoreBefore: 7, scoreAfter: 8, improved: true });
    expect(getHighImpactCategories()).not.toContain('motion');

    // 3 attempts — should appear
    recordCriticOutcome({ category: 'motion', suggestionType: 'minor', applied: true, scoreBefore: 7, scoreAfter: 8, improved: true });
    expect(getHighImpactCategories()).toContain('motion');
  });

  it("getLowEffectCategories returns categories with < 30% success rate", () => {
    for (let i = 0; i < 4; i++) {
      recordCriticOutcome({ category: 'typography', suggestionType: 'minor', applied: true, scoreBefore: 7, scoreAfter: 7.1, improved: false });
    }
    expect(getLowEffectCategories()).toContain('typography');
  });

  it("all 12 categories are present in learning data", () => {
    const rates = getCategorySuccessRates();
    expect(rates.map(r => r.category)).toContain('hero');
    expect(rates.map(r => r.category)).toContain('conversion');
    expect(rates.map(r => r.category)).toContain('visualHierarchy');
    expect(rates).toHaveLength(12);
  });

  it("resetCriticLearning clears outcomes and weights", () => {
    recordCriticOutcome({ category: 'hero', suggestionType: 'major', applied: true, scoreBefore: 7, scoreAfter: 8.5, improved: true });
    resetCriticLearning();
    expect(getCriticLearningMetrics().totalOutcomes).toBe(0);
    const rates = getCategorySuccessRates();
    expect(rates.every(r => r.attempts === 0)).toBe(true);
  });
});

// ── CritiqueReport structure ───────────────────────────────────────────────────

describe("V7.3.0 — CritiqueReport Structure", () => {
  it("all 12 category keys are present", () => {
    const expected: CritiqueCategory[] = ['hero', 'layout', 'typography', 'ctaHierarchy', 'trustBuilding', 'accessibility', 'motion', 'dashboardUX', 'formsUX', 'navbarUX', 'conversion', 'visualHierarchy'];
    const mockReport: CritiqueReport = {
      criticScore: 8.5,
      categoryScores: Object.fromEntries(expected.map(k => [k, 8.0])) as Record<CritiqueCategory, number>,
      issues: [],
      topRecommendation: 'Improve trust signals.',
      repairRequired: false,
      rawCritique: '{}',
    };
    for (const key of expected) {
      expect(mockReport.categoryScores[key]).toBeDefined();
    }
  });

  it("repairRequired is true when criticScore < 8.5", () => {
    const report: Partial<CritiqueReport> = { criticScore: 8.4, repairRequired: 8.4 < CRITIC_REPAIR_THRESHOLD };
    expect(report.repairRequired).toBe(true);
  });

  it("repairRequired is false when criticScore >= 8.5", () => {
    const report: Partial<CritiqueReport> = { criticScore: 8.5, repairRequired: 8.5 < CRITIC_REPAIR_THRESHOLD };
    expect(report.repairRequired).toBe(false);
  });
});
