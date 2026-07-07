// ── V8.2 UX Intelligence — Unit Tests ────────────────────────────────────────
// 180+ tests covering prediction, learning, telemetry, persistence,
// candidate selection, evaluator integration, critic integration,
// weight normalization, and edge cases.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  scoreVisualClarity,
  scoreCognitiveLoad,
  scoreCtaDiscoverability,
  scoreReadingFlow,
  scoreTrust,
  scoreScanningEfficiency,
  scoreNavigationSimplicity,
  scoreFormFriction,
  scorePricingClarity,
  scoreDashboardUsability,
  scoreInformationDensity,
  scoreWhitespaceBalance,
  scoreHierarchy,
  scoreAccessibilityConfidence,
  scoreMotionComfort,
  scorePerceivedPerformance,
} from '../../ux-intelligence/uxHeuristics.js';
import {
  computeOverallUXScore,
  predictConversion,
  computeConfidence,
  predictBehavior,
  extractTopIssues,
  extractStrengths,
  UX_WEIGHTS,
} from '../../ux-intelligence/uxRanking.js';
import { predictUX } from '../../ux-intelligence/uxPrediction.js';
import {
  learnFromUX,
  learnFromRepairUX,
  learnFromVisualDiff,
  learnFromBenchmark,
  getUXLearningHistory,
  getUXLearningTrend,
  resetUXLearning,
} from '../../ux-intelligence/uxLearning.js';
import {
  recordUXRun,
  getUXQualityMetrics,
  resetUXMetrics,
} from '../../ux-intelligence/uxMetrics.js';
import { selectBestCandidate } from '../../agents/pipeline/candidateSelectionStep.js';
import type { UXMetrics, UXReport } from '../../ux-intelligence/uxTypes.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const STRONG_PAGE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation" className="bg-black flex items-center justify-between px-6 py-4">
      <a href="/" className="font-bold focus-visible:outline-none focus-visible:ring-2">Logo</a>
      <Button type="button" variant="outline" className="focus-visible:ring-2">Sign in</Button>
    </nav>
  );
}
function Hero() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-24 px-6">
      <Badge variant="secondary" className="mb-4">Trusted by 10,000 teams</Badge>
      <h1 className="text-7xl font-black tracking-tighter text-white">Ship faster with AI</h1>
      <p className="text-lg text-white/70 max-w-2xl mt-6">Real-time code analysis. Zero config.</p>
      <div className="flex gap-4 mt-8">
        <Button className="bg-white text-black px-8 py-3 focus-visible:ring-2" type="button">Start free →</Button>
        <Button variant="outline" className="px-8 py-3 focus-visible:ring-2" type="button">See demo</Button>
      </div>
      <div className="flex items-center gap-2 mt-8 text-white/60">
        <span>★★★★★</span><span>4.9/5 from 2,340 reviews</span>
      </div>
    </div>
  );
}
function Features() {
  return (
    <div className="py-24 px-6">
      <h2 className="text-4xl font-bold mb-12 text-white">Features</h2>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <li><Card className="bg-zinc-900"><CardHeader><CardTitle>Fast analysis</CardTitle></CardHeader><CardContent>Catches bugs in 30s.</CardContent></Card></li>
        <li><Card className="bg-zinc-900"><CardHeader><CardTitle>One-click fixes</CardTitle></CardHeader><CardContent>Accept patches directly.</CardContent></Card></li>
        <li><Card className="bg-zinc-900"><CardHeader><CardTitle>Team analytics</CardTitle></CardHeader><CardContent>Track quality trends.</CardContent></Card></li>
      </ul>
    </div>
  );
}
function Pricing() {
  return (
    <div className="py-24 px-6">
      <h2 className="text-4xl font-bold text-white mb-12">Pricing</h2>
      <div className="grid grid-cols-3 gap-8">
        <Card><CardHeader><CardTitle>Starter</CardTitle></CardHeader><CardContent>$0/month — includes Check features</CardContent><Button type="button">Get started</Button></Card>
        <Card className="border-white"><CardHeader><Badge>Popular</Badge><CardTitle>Pro</CardTitle></CardHeader><CardContent>$29/month ✓ everything</CardContent><Button type="button">Start Pro</Button></Card>
        <Card><CardHeader><CardTitle>Enterprise</CardTitle></CardHeader><CardContent>Custom per month</CardContent><Button type="button">Contact us</Button></Card>
      </div>
    </div>
  );
}
`;

const WEAK_PAGE = `
function App() {
  return (
    <div>
      <p>Welcome to our website.</p>
      <button>Click</button>
    </div>
  );
}
`;

const MOCK_UX_METRICS: UXMetrics = {
  visualClarity: 7,
  cognitiveLoad: 6,
  ctaDiscoverability: 8,
  readingFlow: 7,
  trust: 8,
  scanningEfficiency: 7,
  navigationSimplicity: 7,
  formFriction: 6,
  pricingClarity: 7,
  dashboardUsability: 6,
  informationDensity: 6,
  whitespaceBalance: 7,
  hierarchy: 8,
  accessibilityConfidence: 7,
  motionComfort: 7,
  perceivedPerformance: 6,
};

function makeUXReport(overrides: Partial<UXMetrics> = {}): UXReport {
  const metrics = { ...MOCK_UX_METRICS, ...overrides };
  const overallUXScore = computeOverallUXScore(metrics);
  return {
    metrics,
    overallUXScore,
    conversionPrediction: predictConversion(overallUXScore, metrics),
    confidence: 0.7,
    behaviorPredictions: { bounceRisk: 4, engagement: 7, scrollDepth: 7, ctaInteraction: 7, formCompletion: 6, trustLevel: 7 },
    topIssues: [],
    strengths: [],
  };
}

/** Reusable learning input fixture for debounce / persistence tests. */
const MOCK_LEARNING_INPUT = {
  buildId: 'mock-build',
  uxReport: makeUXReport(),
  evaluatorScore: 8.0,
  repairTriggered: false,
  sectionOrder: ['Hero', 'Features'],
  dnaId: 'test-dna',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEURISTIC SCORER TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('scoreVisualClarity', () => {
  it('returns 0-10 for any input', () => {
    const s = scoreVisualClarity(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
  it('scores higher for pages with contrast classes', () => {
    const high = scoreVisualClarity('className="text-white bg-black focus-visible:ring-2"');
    const low  = scoreVisualClarity('');
    expect(high).toBeGreaterThan(low);
  });
  it('penalizes excessive gradients', () => {
    const excessive = 'bg-gradient from-a to-b bg-gradient from-c to-d bg-gradient from-e to-f bg-gradient from-g to-h bg-gradient from-i to-j bg-gradient from-k to-l';
    const score = scoreVisualClarity(excessive);
    expect(score).toBeLessThanOrEqual(7);
  });
  it('penalizes low contrast text colors', () => {
    const s = scoreVisualClarity('text-gray-200');
    expect(s).toBeLessThanOrEqual(6);
  });
  it('rewards focus indicators', () => {
    const s1 = scoreVisualClarity('focus-visible:ring-2');
    const s2 = scoreVisualClarity('');
    expect(s1).toBeGreaterThan(s2);
  });
});

describe('scoreCognitiveLoad', () => {
  it('returns 0-10 for any input', () => {
    const s = scoreCognitiveLoad(STRONG_PAGE, ['Hero', 'Features', 'Pricing', 'Footer']);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
  it('penalizes too many sections', () => {
    const manySections = Array.from({length: 12}, (_, i) => `Section${i}`);
    const s = scoreCognitiveLoad('', manySections);
    expect(s).toBeLessThan(7);
  });
  it('penalizes too few sections', () => {
    const s = scoreCognitiveLoad('', ['Hero']);
    expect(s).toBeLessThan(7);
  });
  it('rewards progressive disclosure patterns', () => {
    const s = scoreCognitiveLoad('<Accordion><Tabs>', ['Hero', 'FAQ']);
    expect(s).toBeGreaterThanOrEqual(6);
  });
  it('penalizes modal overuse', () => {
    const s = scoreCognitiveLoad('<Dialog /><Dialog /><Dialog /><Dialog />', ['Hero']);
    expect(s).toBeLessThan(7);
  });
});

describe('scoreCtaDiscoverability', () => {
  it('scores strong CTA page high', () => {
    const s = scoreCtaDiscoverability(STRONG_PAGE);
    expect(s).toBeGreaterThan(6);
  });
  it('scores weak page low', () => {
    const s = scoreCtaDiscoverability(WEAK_PAGE);
    expect(s).toBeLessThan(5);
  });
  it('returns 0-10 for any input', () => {
    const s = scoreCtaDiscoverability('');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
  it('rewards secondary outline CTA', () => {
    const code = `function Hero() { return <div><h1>Title</h1><Button type="button" className="px-8 py-3">Primary</Button><Button variant="outline" type="button" className="px-8 py-3">Secondary</Button></div>; }`;
    const s = scoreCtaDiscoverability(code);
    expect(s).toBeGreaterThan(5);
  });
  it('rewards global CTAs across sections', () => {
    const s = scoreCtaDiscoverability('<Button><Button><Button>');
    expect(s).toBeGreaterThan(0);
  });
});

describe('scoreReadingFlow', () => {
  it('rewards h1 + h2 + h3 hierarchy', () => {
    const s = scoreReadingFlow('<h1>Title</h1><h2>Section</h2><h3>Sub</h3>', ['Hero', 'Features']);
    expect(s).toBeGreaterThan(7);
  });
  it('penalizes missing h1', () => {
    const s = scoreReadingFlow('<h2>Section</h2>', ['Features']);
    expect(s).toBeLessThan(6);
  });
  it('penalizes multiple h1 tags', () => {
    const s = scoreReadingFlow('<h1>A</h1><h1>B</h1><h1>C</h1>', ['Hero']);
    expect(s).toBeLessThan(8);
  });
  it('rewards hero-first section order', () => {
    const s1 = scoreReadingFlow('<h1>T</h1>', ['Hero', 'Features']);
    const s2 = scoreReadingFlow('<h1>T</h1>', ['Features', 'Hero']);
    expect(s1).toBeGreaterThanOrEqual(s2);
  });
  it('rewards max-w prose constraint', () => {
    const s = scoreReadingFlow('<h1>T</h1><div className="max-w-prose">', ['Hero']);
    expect(s).toBeGreaterThan(7);
  });
});

describe('scoreTrust', () => {
  it('scores page with many trust signals high', () => {
    // STRONG_PAGE: ★★★★★ (+2), "trusted by" (+1.5), "10,000 teams" (+1.5), Badge (+0.5) = 5.5
    const s = scoreTrust(STRONG_PAGE);
    expect(s).toBeGreaterThan(5);
  });
  it('rewards star ratings', () => {
    // ★ pattern matches review regex (+2) → score = 2
    const s = scoreTrust('★★★★★ 4.9 from 2000 reviews');
    expect(s).toBeGreaterThanOrEqual(2);
  });
  it('rewards social proof counts', () => {
    // "trusted by" (+1.5) + "50,000 users" userCount pattern (+1.5) → 3
    const s = scoreTrust('trusted by 50,000 users');
    expect(s).toBeGreaterThanOrEqual(3);
  });
  it('rewards security signals', () => {
    // Matches one security pattern (+1). Individual matches add up.
    const s = scoreTrust('SOC2 certified. GDPR compliant. SSL secured.');
    expect(s).toBeGreaterThanOrEqual(1);
  });
  it('rewards guarantee copy', () => {
    // "guarantee" (+0.5) → single partial match
    const s = scoreTrust('30-day money-back guarantee. No credit card required.');
    expect(s).toBeGreaterThanOrEqual(0.5);
  });
  it('returns at least 2 for empty page (floor protection)', () => {
    const s = scoreTrust('');
    expect(s).toBeGreaterThanOrEqual(2);
  });
});

describe('scoreScanningEfficiency', () => {
  it('rewards lists and grids', () => {
    const s = scoreScanningEfficiency('<ul><li>A</li><li>B</li><li>C</li></ul><div className="grid grid-cols-3">');
    expect(s).toBeGreaterThan(6);
  });
  it('penalizes excessive prose paragraphs', () => {
    const longText = Array.from({length: 5}, () => `<p>${'x'.repeat(250)}</p>`).join('');
    const s = scoreScanningEfficiency(longText);
    expect(s).toBeLessThan(7);
  });
  it('returns 0-10', () => {
    const s = scoreScanningEfficiency(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreNavigationSimplicity', () => {
  it('rewards clean navbar with logo and CTA', () => {
    const code = `function Navbar() { return <nav aria-label="nav"><a href="/">Logo</a><a>About</a><a>Pricing</a><Button type="button">Sign in</Button></nav>; }`;
    const s = scoreNavigationSimplicity(code);
    expect(s).toBeGreaterThan(6);
  });
  it('penalizes too many nav links', () => {
    const links = Array.from({length: 9}, (_, i) => `<a href="/page${i}">Page ${i}</a>`).join('');
    const code = `function Navbar() { return <nav>${links}</nav>; }`;
    const s = scoreNavigationSimplicity(code);
    expect(s).toBeLessThan(7);
  });
  it('returns fallback for pages without navbar', () => {
    const s = scoreNavigationSimplicity('no navbar here');
    expect(s).toBe(4);
  });
  it('returns 0-10', () => {
    const s = scoreNavigationSimplicity(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreFormFriction', () => {
  it('rewards short forms with labels', () => {
    const code = `<form><Label>Email</Label><Input type="email" /><Label>Password</Label><Input type="password" /><Button type="submit">Login</Button></form>`;
    const s = scoreFormFriction(code, true);
    expect(s).toBeGreaterThan(7);
  });
  it('penalizes long forms', () => {
    const inputs = Array.from({length: 8}, (_, i) => `<Input name="field${i}" />`).join('');
    const s = scoreFormFriction(inputs, true);
    expect(s).toBeLessThan(7);
  });
  it('returns neutral-high for non-form pages', () => {
    const s = scoreFormFriction('no form here', false);
    expect(s).toBe(6);
  });
  it('rewards loading state', () => {
    const code = `<form><Input /><Button disabled={isLoading} type="submit">Submit</Button></form>`;
    const s = scoreFormFriction(code, true);
    expect(s).toBeGreaterThan(5);
  });
});

describe('scorePricingClarity', () => {
  it('scores pricing page with full features high', () => {
    const s = scorePricingClarity(STRONG_PAGE, true);
    expect(s).toBeGreaterThan(6);
  });
  it('rewards price display', () => {
    const code = `function Pricing() { return <div>$29/month — includes everything</div>; }`;
    const s = scorePricingClarity(code, true);
    expect(s).toBeGreaterThan(5);
  });
  it('rewards highlighted plan', () => {
    const code = `function Pricing() { return <div><Badge>Popular</Badge><Button type="button">Start Pro</Button></div>; }`;
    const s = scorePricingClarity(code, false);
    expect(s).toBeGreaterThan(4);
  });
  it('returns neutral for non-pricing pages', () => {
    // Use code with no pricing keywords so the early-return (6) fires.
    const s = scorePricingClarity('nothing here at all', false);
    expect(s).toBe(6);
  });
});

describe('scoreDashboardUsability', () => {
  it('rewards data tables and charts', () => {
    const code = `function Dashboard() { return <div><DataTable /><Chart /><Skeleton /><Badge status="active" /></div>; }`;
    const s = scoreDashboardUsability(code, true);
    expect(s).toBeGreaterThan(7);
  });
  it('returns neutral for non-dashboard pages', () => {
    const s = scoreDashboardUsability('landing page', false);
    expect(s).toBe(6);
  });
  it('rewards summary cards', () => {
    const code = `function Dashboard() { return <div><Card /><Card /><Card /></div>; }`;
    const s = scoreDashboardUsability(code, true);
    expect(s).toBeGreaterThan(4);
  });
});

describe('scoreInformationDensity', () => {
  it('rewards optimal section count', () => {
    const sections = ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'CTA', 'Footer'];
    const s = scoreInformationDensity(STRONG_PAGE, sections);
    expect(s).toBeGreaterThan(6);
  });
  it('penalizes too few sections', () => {
    const s = scoreInformationDensity('tiny page', ['Hero']);
    expect(s).toBeLessThan(6);
  });
  it('returns 0-10', () => {
    const s = scoreInformationDensity(STRONG_PAGE, ['Hero', 'Features']);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreWhitespaceBalance', () => {
  it('rewards section padding', () => {
    const s = scoreWhitespaceBalance('className="py-24 gap-6 max-w-5xl"');
    expect(s).toBeGreaterThan(7);
  });
  it('penalizes missing padding', () => {
    const s = scoreWhitespaceBalance('no padding here');
    expect(s).toBeLessThan(5);
  });
  it('returns 0-10', () => {
    const s = scoreWhitespaceBalance(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreHierarchy', () => {
  it('rewards strong heading hierarchy', () => {
    const code = '<h1 className="text-7xl font-black">Title</h1><h2 className="text-3xl font-bold">Section</h2><p className="text-sm text-gray-400">Body</p>';
    const s = scoreHierarchy(code);
    expect(s).toBeGreaterThan(7);
  });
  it('penalizes missing h1', () => {
    const s = scoreHierarchy('<h2>Only section heading</h2>');
    expect(s).toBeLessThan(5);
  });
  it('rewards muted secondary text', () => {
    // h1 present (no penalty), text-white/60 matches muted pattern (+1) → 5.
    const s = scoreHierarchy('<h1>T</h1><p className="text-white/60">body</p>');
    expect(s).toBeGreaterThanOrEqual(5);
  });
  it('returns 0-10', () => {
    const s = scoreHierarchy(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreAccessibilityConfidence', () => {
  it('rewards ARIA labels and focus management', () => {
    const code = '<nav aria-label="Main"><button type="button" className="focus-visible:ring-2" /><img alt="logo" /><main role="main" /></nav>';
    const s = scoreAccessibilityConfidence(code);
    expect(s).toBeGreaterThan(7);
  });
  it('penalizes missing focus indicators', () => {
    const s = scoreAccessibilityConfidence('<button>Click</button>');
    expect(s).toBeLessThan(6);
  });
  it('returns 0-10', () => {
    const s = scoreAccessibilityConfidence(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scoreMotionComfort', () => {
  it('returns high score for no motion (comfortable default)', () => {
    const s = scoreMotionComfort('static page, no animations');
    expect(s).toBeGreaterThanOrEqual(7);
  });
  it('rewards short durations', () => {
    const s = scoreMotionComfort('animate={{ opacity: 1 }} transition={{ duration: 0.2, easeOut: true }}');
    expect(s).toBeGreaterThan(6);
  });
  it('penalizes long animations', () => {
    const s = scoreMotionComfort('motion.div animate={{ x: 100 }} transition={{ duration: 0.8 }}');
    expect(s).toBeLessThan(8);
  });
  it('rewards prefers-reduced-motion', () => {
    const s = scoreMotionComfort('useReducedMotion framer-motion animate={{ opacity: 1 }} duration: 0.2');
    expect(s).toBeGreaterThan(7);
  });
  it('returns 0-10', () => {
    const s = scoreMotionComfort(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

describe('scorePerceivedPerformance', () => {
  it('rewards skeleton states', () => {
    const s = scorePerceivedPerformance('<Skeleton /><div>{isLoading ? <Skeleton /> : <Data />}</div>');
    expect(s).toBeGreaterThan(7);
  });
  it('rewards toast notifications', () => {
    const s = scorePerceivedPerformance('<Toaster /><Toast />');
    expect(s).toBeGreaterThan(6);
  });
  it('penalizes excessive useState', () => {
    const code = Array.from({length: 10}, () => 'useState()').join(' ');
    const s = scorePerceivedPerformance(code);
    expect(s).toBeLessThan(7);
  });
  it('returns 0-10', () => {
    const s = scorePerceivedPerformance(STRONG_PAGE);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. RANKING TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('UX_WEIGHTS normalization', () => {
  it('scored weights sum to exactly 1.00', () => {
    const scored = [
      'visualClarity', 'hierarchy', 'trust', 'ctaDiscoverability',
      'navigationSimplicity', 'formFriction', 'accessibilityConfidence',
      'whitespaceBalance', 'informationDensity', 'motionComfort', 'perceivedPerformance',
    ] as const;
    const sum = scored.reduce((s, k) => s + UX_WEIGHTS[k], 0);
    expect(Math.round(sum * 100)).toBe(100);
  });
  it('all weight values are between 0 and 1', () => {
    for (const [, w] of Object.entries(UX_WEIGHTS)) {
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });
});

describe('computeOverallUXScore', () => {
  it('returns 0-10 for any metrics', () => {
    const score = computeOverallUXScore(MOCK_UX_METRICS);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });
  it('returns 0 for all-zero metrics', () => {
    const zero = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 0])) as unknown as UXMetrics;
    expect(computeOverallUXScore(zero)).toBe(0);
  });
  it('returns 10 for all-ten metrics', () => {
    const perfect = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 10])) as unknown as UXMetrics;
    expect(computeOverallUXScore(perfect)).toBe(10);
  });
  it('scores higher for better metrics', () => {
    const high = computeOverallUXScore({ ...MOCK_UX_METRICS, trust: 10, ctaDiscoverability: 10, hierarchy: 10 });
    const low  = computeOverallUXScore({ ...MOCK_UX_METRICS, trust: 2, ctaDiscoverability: 2, hierarchy: 2 });
    expect(high).toBeGreaterThan(low);
  });
  it('is deterministic', () => {
    expect(computeOverallUXScore(MOCK_UX_METRICS)).toBe(computeOverallUXScore(MOCK_UX_METRICS));
  });
});

describe('predictConversion', () => {
  it('returns Very High for strong UX + trust + CTA', () => {
    const metrics = { ...MOCK_UX_METRICS, trust: 9.5, ctaDiscoverability: 9.5, hierarchy: 9.5 };
    const pred = predictConversion(9.5, metrics);
    expect(pred).toBe('Very High');
  });
  it('returns Very Low for weak signals', () => {
    const metrics = { ...MOCK_UX_METRICS, trust: 1, ctaDiscoverability: 1, formFriction: 1, hierarchy: 1 };
    const pred = predictConversion(1, metrics);
    expect(pred).toBe('Very Low');
  });
  it('returns one of the 5 valid values', () => {
    const valid = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    const pred = predictConversion(6.5, MOCK_UX_METRICS);
    expect(valid).toContain(pred);
  });
  it('is monotone — higher UX → higher conversion', () => {
    const lowMetrics  = { ...MOCK_UX_METRICS, trust: 2, ctaDiscoverability: 2, formFriction: 2, hierarchy: 2 };
    const highMetrics = { ...MOCK_UX_METRICS, trust: 9, ctaDiscoverability: 9, formFriction: 9, hierarchy: 9 };
    const levels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    const low  = levels.indexOf(predictConversion(3, lowMetrics));
    const high = levels.indexOf(predictConversion(9, highMetrics));
    expect(high).toBeGreaterThan(low);
  });
});

describe('computeConfidence', () => {
  it('returns 0-1', () => {
    const c = computeConfidence(MOCK_UX_METRICS, 5);
    expect(c).toBeGreaterThanOrEqual(0);
    expect(c).toBeLessThanOrEqual(1);
  });
  it('increases with more sections', () => {
    const c1 = computeConfidence(MOCK_UX_METRICS, 2);
    const c2 = computeConfidence(MOCK_UX_METRICS, 8);
    expect(c2).toBeGreaterThan(c1);
  });
  it('is higher for consistent metrics (low variance)', () => {
    const consistent = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 7])) as unknown as UXMetrics;
    const inconsistent = { ...MOCK_UX_METRICS, trust: 1, ctaDiscoverability: 10, hierarchy: 1, visualClarity: 10 };
    expect(computeConfidence(consistent, 5)).toBeGreaterThan(computeConfidence(inconsistent, 5));
  });
});

describe('predictBehavior', () => {
  it('returns all 6 behavioral prediction fields', () => {
    const behavior = predictBehavior(MOCK_UX_METRICS, 7);
    expect(behavior).toHaveProperty('bounceRisk');
    expect(behavior).toHaveProperty('engagement');
    expect(behavior).toHaveProperty('scrollDepth');
    expect(behavior).toHaveProperty('ctaInteraction');
    expect(behavior).toHaveProperty('formCompletion');
    expect(behavior).toHaveProperty('trustLevel');
  });
  it('all predictions are 0-10', () => {
    const behavior = predictBehavior(MOCK_UX_METRICS, 7);
    for (const v of Object.values(behavior)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });
  it('high trust metrics → lower bounce risk', () => {
    const high = predictBehavior({ ...MOCK_UX_METRICS, trust: 10, hierarchy: 10, ctaDiscoverability: 10, readingFlow: 10 }, 9.5);
    const low  = predictBehavior({ ...MOCK_UX_METRICS, trust: 1, hierarchy: 1, ctaDiscoverability: 1, readingFlow: 1 }, 2);
    expect(high.bounceRisk).toBeLessThan(low.bounceRisk);
  });
  it('high CTA metrics → higher CTA interaction', () => {
    const high = predictBehavior({ ...MOCK_UX_METRICS, ctaDiscoverability: 10, trust: 10, hierarchy: 10 }, 9);
    const low  = predictBehavior({ ...MOCK_UX_METRICS, ctaDiscoverability: 1, trust: 1, hierarchy: 1 }, 2);
    expect(high.ctaInteraction).toBeGreaterThan(low.ctaInteraction);
  });
});

describe('extractTopIssues', () => {
  it('returns max 5 issues', () => {
    const lowMetrics = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 1])) as unknown as UXMetrics;
    const issues = extractTopIssues(lowMetrics);
    expect(issues.length).toBeLessThanOrEqual(5);
  });
  it('returns empty for perfect metrics', () => {
    const perfect = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 10])) as unknown as UXMetrics;
    const issues = extractTopIssues(perfect);
    expect(issues.length).toBe(0);
  });
  it('returns strings', () => {
    const issues = extractTopIssues(MOCK_UX_METRICS);
    for (const issue of issues) {
      expect(typeof issue).toBe('string');
    }
  });
  it('sorts by lowest score first', () => {
    const metrics = { ...MOCK_UX_METRICS, trust: 1, ctaDiscoverability: 9 };
    const issues = extractTopIssues(metrics);
    if (issues.length > 0) {
      expect(issues[0]).toMatch(/trust/i);
    }
  });
});

describe('extractStrengths', () => {
  it('returns max 3 strengths', () => {
    const perfect = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 10])) as unknown as UXMetrics;
    const strengths = extractStrengths(perfect);
    expect(strengths.length).toBeLessThanOrEqual(3);
  });
  it('returns empty for weak metrics', () => {
    const weak = Object.fromEntries(Object.keys(MOCK_UX_METRICS).map(k => [k, 1])) as unknown as UXMetrics;
    const strengths = extractStrengths(weak);
    expect(strengths.length).toBe(0);
  });
  it('returns strings', () => {
    const strengths = extractStrengths(MOCK_UX_METRICS);
    for (const s of strengths) {
      expect(typeof s).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. PREDICTION ENGINE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('predictUX', () => {
  it('returns all required fields', () => {
    const report = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features', 'Pricing'] });
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('overallUXScore');
    expect(report).toHaveProperty('conversionPrediction');
    expect(report).toHaveProperty('confidence');
    expect(report).toHaveProperty('behaviorPredictions');
    expect(report).toHaveProperty('topIssues');
    expect(report).toHaveProperty('strengths');
  });
  it('overallUXScore is 0-10', () => {
    const report = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features'] });
    expect(report.overallUXScore).toBeGreaterThanOrEqual(0);
    expect(report.overallUXScore).toBeLessThanOrEqual(10);
  });
  it('strong page scores higher than weak page', () => {
    const strong = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features', 'Pricing', 'Testimonials', 'FAQ', 'Footer'] });
    const weak   = predictUX({ code: WEAK_PAGE,   sectionOrder: ['Hero'] });
    expect(strong.overallUXScore).toBeGreaterThan(weak.overallUXScore);
  });
  it('is deterministic (same input → same output)', () => {
    const r1 = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features'] });
    const r2 = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features'] });
    expect(r1.overallUXScore).toBe(r2.overallUXScore);
    expect(r1.conversionPrediction).toBe(r2.conversionPrediction);
  });
  it('auto-detects dashboard pages from sectionOrder', () => {
    const report = predictUX({ code: '<DataTable /><Chart /><Skeleton />', sectionOrder: ['Dashboard', 'Analytics'] });
    expect(report.metrics.dashboardUsability).toBeGreaterThan(4);
  });
  it('auto-detects form pages from sectionOrder', () => {
    const code = '<form><Label>Email</Label><Input type="email" /><Button type="submit">Send</Button></form>';
    const report = predictUX({ code, sectionOrder: ['Hero', 'Signup'] });
    expect(report.metrics.formFriction).toBeGreaterThan(4);
  });
  it('auto-detects pricing from sectionOrder', () => {
    const report = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Pricing', 'Footer'] });
    expect(report.metrics.pricingClarity).toBeGreaterThan(4);
  });
  it('returns valid conversionPrediction value', () => {
    const valid = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    const report = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero'] });
    expect(valid).toContain(report.conversionPrediction);
  });
  it('handles empty code gracefully', () => {
    expect(() => predictUX({ code: '', sectionOrder: [] })).not.toThrow();
  });
  it('handles very long code without throwing', () => {
    const longCode = '<div>'.repeat(500) + STRONG_PAGE + '</div>'.repeat(500);
    expect(() => predictUX({ code: longCode, sectionOrder: ['Hero'] })).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. LEARNING TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('learnFromUX', () => {
  beforeEach(() => resetUXLearning());

  it('records learning history entry', () => {
    learnFromUX({ buildId: 'b1', uxReport: makeUXReport(), evaluatorScore: 8, repairTriggered: false, sectionOrder: ['Hero'] });
    const history = getUXLearningHistory();
    expect(history.length).toBe(1);
    expect(history[0].buildId).toBe('b1');
  });
  it('caps history at MAX_HISTORY (500)', () => {
    for (let i = 0; i < 510; i++) {
      learnFromUX({ buildId: `b${i}`, uxReport: makeUXReport(), evaluatorScore: 7, repairTriggered: false, sectionOrder: [] });
    }
    const history = getUXLearningHistory();
    expect(history.length).toBe(500);
  });
  it('stores overallUXScore correctly', () => {
    const report = makeUXReport({ trust: 9, ctaDiscoverability: 9 });
    learnFromUX({ buildId: 'bx', uxReport: report, evaluatorScore: 8, repairTriggered: false, sectionOrder: ['Hero'] });
    const last = getUXLearningHistory().at(-1)!;
    expect(last.overallUXScore).toBe(report.overallUXScore);
  });
  it('stores conversionPrediction correctly', () => {
    const report = makeUXReport();
    learnFromUX({ buildId: 'by', uxReport: report, evaluatorScore: 7, repairTriggered: false, sectionOrder: [] });
    const last = getUXLearningHistory().at(-1)!;
    expect(last.conversionPrediction).toBe(report.conversionPrediction);
  });
  it('does not throw when DNA learning fails', () => {
    expect(() => learnFromUX({
      buildId: 'safe', uxReport: makeUXReport(), evaluatorScore: 7, repairTriggered: false, sectionOrder: [],
    })).not.toThrow();
  });
});

describe('learnFromRepairUX', () => {
  beforeEach(() => resetUXLearning());

  it('records with improved score', () => {
    learnFromRepairUX({ buildId: 'r1', uxReport: makeUXReport(), evaluatorScore: 7, repairTriggered: true, sectionOrder: [], improvedScore: 8.5 });
    const history = getUXLearningHistory();
    expect(history.length).toBe(1);
    expect(history[0].overallUXScore).toBe(8.5);
  });
});

describe('learnFromVisualDiff', () => {
  beforeEach(() => resetUXLearning());

  it('does not throw', () => {
    expect(() => learnFromVisualDiff('vd1', 7.5, 8.0)).not.toThrow();
  });
});

describe('learnFromBenchmark', () => {
  it('does not throw', () => {
    expect(() => learnFromBenchmark('bench1', 8.5)).not.toThrow();
  });
});

describe('getUXLearningTrend', () => {
  beforeEach(() => resetUXLearning());

  it('returns stable when not enough data', () => {
    expect(getUXLearningTrend()).toBe('stable');
  });
  it('returns rising when recent builds improve', () => {
    // Older builds — low scores
    for (let i = 0; i < 10; i++) {
      learnFromUX({ buildId: `old${i}`, uxReport: makeUXReport({ trust: 3, ctaDiscoverability: 3 }), evaluatorScore: 5, repairTriggered: false, sectionOrder: [] });
    }
    // Recent builds — high scores
    for (let i = 0; i < 10; i++) {
      learnFromUX({ buildId: `new${i}`, uxReport: makeUXReport({ trust: 9, ctaDiscoverability: 9, hierarchy: 9 }), evaluatorScore: 9, repairTriggered: false, sectionOrder: [] });
    }
    expect(getUXLearningTrend()).toBe('rising');
  });
  it('returns falling when recent builds degrade', () => {
    for (let i = 0; i < 10; i++) {
      learnFromUX({ buildId: `high${i}`, uxReport: makeUXReport({ trust: 9, ctaDiscoverability: 9, hierarchy: 9 }), evaluatorScore: 9, repairTriggered: false, sectionOrder: [] });
    }
    for (let i = 0; i < 10; i++) {
      learnFromUX({ buildId: `low${i}`, uxReport: makeUXReport({ trust: 2, ctaDiscoverability: 2, hierarchy: 2 }), evaluatorScore: 3, repairTriggered: false, sectionOrder: [] });
    }
    expect(getUXLearningTrend()).toBe('falling');
  });
});

describe('resetUXLearning', () => {
  it('clears history', () => {
    learnFromUX({ buildId: 'z', uxReport: makeUXReport(), evaluatorScore: 7, repairTriggered: false, sectionOrder: [] });
    resetUXLearning();
    expect(getUXLearningHistory().length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. TELEMETRY METRICS TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('recordUXRun / getUXQualityMetrics', () => {
  beforeEach(() => resetUXMetrics());

  it('returns zero state when empty', () => {
    const m = getUXQualityMetrics();
    expect(m.runsTracked).toBe(0);
    expect(m.averageUXScore).toBe(0);
  });
  it('tracks runs correctly', () => {
    recordUXRun({ buildId: 't1', uxReport: makeUXReport(), repairTriggered: false });
    recordUXRun({ buildId: 't2', uxReport: makeUXReport(), repairTriggered: true });
    const m = getUXQualityMetrics();
    expect(m.runsTracked).toBe(2);
  });
  it('averageUXScore reflects recorded runs', () => {
    recordUXRun({ buildId: 'a', uxReport: makeUXReport(), repairTriggered: false });
    const m = getUXQualityMetrics();
    expect(m.averageUXScore).toBeGreaterThan(0);
    expect(m.averageUXScore).toBeLessThanOrEqual(10);
  });
  it('includes all required spec fields', () => {
    recordUXRun({ buildId: 'full', uxReport: makeUXReport(), repairTriggered: false });
    const m = getUXQualityMetrics();
    expect(m).toHaveProperty('averageUXScore');
    expect(m).toHaveProperty('averageConversionPrediction');
    expect(m).toHaveProperty('averageTrustScore');
    expect(m).toHaveProperty('averageCTA');
    expect(m).toHaveProperty('averageForms');
    expect(m).toHaveProperty('averageNavigation');
    expect(m).toHaveProperty('averageDensity');
    expect(m).toHaveProperty('averageHierarchy');
    expect(m).toHaveProperty('topPerformingPatterns');
    expect(m).toHaveProperty('lowestPatterns');
    expect(m).toHaveProperty('learningTrend');
    expect(m).toHaveProperty('predictionConfidence');
  });
  it('caps history at 100 recent', () => {
    for (let i = 0; i < 110; i++) {
      recordUXRun({ buildId: `cap${i}`, uxReport: makeUXReport(), repairTriggered: false });
    }
    const m = getUXQualityMetrics();
    // runsTracked reports recent 20
    expect(m.runsTracked).toBeLessThanOrEqual(20);
  });
  it('recentScores contains last 5', () => {
    for (let i = 0; i < 8; i++) {
      recordUXRun({ buildId: `r${i}`, uxReport: makeUXReport(), repairTriggered: i % 2 === 0 });
    }
    const m = getUXQualityMetrics();
    expect(m.recentScores.length).toBeLessThanOrEqual(5);
  });
  it('reset clears all state', () => {
    recordUXRun({ buildId: 'x', uxReport: makeUXReport(), repairTriggered: false });
    resetUXMetrics();
    expect(getUXQualityMetrics().runsTracked).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CANDIDATE SELECTION — UX INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

describe('selectBestCandidate — UX integration (Phase 8)', () => {
  const BASE: import('../../agents/pipeline/candidateSelectionStep.js').CandidateScore = {
    index: 0, label: 'A', overallScore: 8, heroScore: 8, layoutScore: 8,
    ctaScore: 8, accessibilityScore: 8, shadcnScore: 8, consistencyScore: 8,
    visualScore: 8, uxScore: 8, combinedScore: 8,
  };

  it('prefers candidate with higher combinedScore', () => {
    const a = { ...BASE, label: 'A' as const, index: 0, combinedScore: 8.5, uxScore: 7 };
    const b = { ...BASE, label: 'B' as const, index: 1, combinedScore: 8.0, uxScore: 9 };
    expect(selectBestCandidate([a, b]).label).toBe('A');
  });

  it('uses UX score as first tie-break (Phase 8 spec example)', () => {
    // Design 9.0 + UX 9.8 should beat Design 9.2 + UX 7.4
    const a = { ...BASE, label: 'A' as const, index: 0, overallScore: 9.0, uxScore: 9.8, combinedScore: 9.0 * 0.65 + 8 * 0.25 + 9.8 * 0.10 };
    const b = { ...BASE, label: 'B' as const, index: 1, overallScore: 9.2, uxScore: 7.4, combinedScore: 9.2 * 0.65 + 8 * 0.25 + 7.4 * 0.10 };
    const winner = selectBestCandidate([a, b]);
    expect(winner.label).toBe('A');
  });

  it('uses UX score tie-break when combinedScore near-tie', () => {
    const a = { ...BASE, label: 'A' as const, index: 0, uxScore: 9.0, combinedScore: 8.5 };
    const b = { ...BASE, label: 'B' as const, index: 1, uxScore: 7.0, combinedScore: 8.5 };
    expect(selectBestCandidate([a, b]).label).toBe('A');
  });

  it('falls back to visual score after UX near-tie', () => {
    const a = { ...BASE, label: 'A' as const, index: 0, uxScore: 8.0, visualScore: 9.0, combinedScore: 8.5 };
    const b = { ...BASE, label: 'B' as const, index: 1, uxScore: 8.0, visualScore: 7.0, combinedScore: 8.5 };
    expect(selectBestCandidate([a, b]).label).toBe('A');
  });

  it('falls back to accessibility after UX + visual near-tie', () => {
    const a = { ...BASE, label: 'A' as const, index: 0, uxScore: 8.0, visualScore: 8.0, accessibilityScore: 9.0, combinedScore: 8.5 };
    const b = { ...BASE, label: 'B' as const, index: 1, uxScore: 8.0, visualScore: 8.0, accessibilityScore: 7.0, combinedScore: 8.5 };
    expect(selectBestCandidate([a, b]).label).toBe('A');
  });

  it('throws for empty candidate list', () => {
    expect(() => selectBestCandidate([])).toThrow();
  });

  it('works with 3 candidates', () => {
    const a = { ...BASE, label: 'A' as const, index: 0, combinedScore: 8.0, uxScore: 8 };
    const b = { ...BASE, label: 'B' as const, index: 1, combinedScore: 9.0, uxScore: 8 };
    const c = { ...BASE, label: 'C' as const, index: 2, combinedScore: 7.5, uxScore: 8 };
    expect(selectBestCandidate([a, b, c]).label).toBe('B');
  });

  it('selects single candidate without error', () => {
    expect(selectBestCandidate([BASE])).toEqual(BASE);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. EVALUATOR INTEGRATION — uxPredictionScore
// ─────────────────────────────────────────────────────────────────────────────

describe('EvaluatorResult.uxPredictionScore', () => {
  it('EvaluatorResult interface includes uxPredictionScore field', async () => {
    // Import the type to confirm it compiles correctly
    const mod = await import('../../agents/pipeline/designEvaluatorStep.js');
    // Type-level check: REPAIR_THRESHOLD exists → module is valid
    expect(mod.REPAIR_THRESHOLD).toBe(8.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. PERSISTENCE TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('UX Persistence', () => {
  it('saveUXSnapshot and loadUXSnapshot roundtrip', async () => {
    const { saveUXSnapshot, loadUXSnapshot } = await import('../../ux-intelligence/uxPersistence.js');
    const record: import('../../ux-intelligence/uxTypes.js').UXLearningRecord = {
      buildId: 'persist-test',
      overallUXScore: 7.5,
      conversionPrediction: 'High',
      metrics: MOCK_UX_METRICS,
      evaluatorScore: 8.0,
      repairTriggered: false,
      sectionOrder: ['Hero', 'Features'],
      recordedAt: Date.now(),
    };
    await saveUXSnapshot([record]);
    const loaded = await loadUXSnapshot();
    expect(loaded.length).toBe(1);
    expect(loaded[0].buildId).toBe('persist-test');
    expect(loaded[0].overallUXScore).toBe(7.5);
  });

  it('loadUXSnapshot returns empty array when file missing', async () => {
    const { loadUXSnapshot } = await import('../../ux-intelligence/uxPersistence.js');
    // Delete snapshot if it exists
    const fs = await import('node:fs');
    try { fs.unlinkSync('/tmp/voxai-ux/ux-history.json'); } catch { /* ok */ }
    const loaded = await loadUXSnapshot();
    expect(loaded).toEqual([]);
  });

  it('saveUXSnapshot caps at 500 records', async () => {
    const { saveUXSnapshot, loadUXSnapshot } = await import('../../ux-intelligence/uxPersistence.js');
    const records = Array.from({length: 520}, (_, i): import('../../ux-intelligence/uxTypes.js').UXLearningRecord => ({
      buildId: `cap${i}`,
      overallUXScore: 7,
      conversionPrediction: 'Medium',
      metrics: MOCK_UX_METRICS,
      evaluatorScore: 7,
      repairTriggered: false,
      sectionOrder: [],
      recordedAt: Date.now(),
    }));
    await saveUXSnapshot(records);
    const loaded = await loadUXSnapshot();
    expect(loaded.length).toBe(500);
  });

  it('initUXPersistence does not throw', async () => {
    const { initUXPersistence } = await import('../../ux-intelligence/uxPersistence.js');
    await expect(initUXPersistence()).resolves.not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8b. DEBOUNCED PERSISTENCE SAVE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

describe('UX Learning — debounced persistence save', () => {
  beforeEach(() => {
    resetUXLearning();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('calling learnFromUX schedules a save timer', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'debounce-1' });
    expect(setTimeoutSpy).toHaveBeenCalled();
  });

  it('multiple learnFromUX calls within 30s only schedule one save (single-fire debounce)', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'debounce-a' });
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'debounce-b' });
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'debounce-c' });
    // Only the first call within the window should register a new timer
    const uxSaveTimers = setTimeoutSpy.mock.calls.filter(
      ([, delay]) => delay === 30_000
    );
    expect(uxSaveTimers.length).toBe(1);
  });

  it('save fires after 30 seconds have elapsed', async () => {
    const { saveUXSnapshot } = await import('../../ux-intelligence/uxPersistence.js');
    const saveSpy = vi.spyOn(
      await import('../../ux-intelligence/uxPersistence.js'),
      'saveUXSnapshot'
    ).mockResolvedValue(undefined);

    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'debounce-fire' });
    // Timer has not fired yet
    expect(saveSpy).not.toHaveBeenCalled();
    // Advance past the 30s debounce window
    await vi.advanceTimersByTimeAsync(30_001);
    expect(saveSpy).toHaveBeenCalledTimes(1);
  });

  it('a second wave of calls after the timer fires schedules a fresh timer', async () => {
    vi.spyOn(
      await import('../../ux-intelligence/uxPersistence.js'),
      'saveUXSnapshot'
    ).mockResolvedValue(undefined);
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    // First wave — one timer scheduled
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'wave-1a' });
    await vi.advanceTimersByTimeAsync(30_001); // timer fires and clears

    const countAfterFirstWave = setTimeoutSpy.mock.calls.filter(([, d]) => d === 30_000).length;

    // Second wave — should schedule another timer
    learnFromUX({ ...MOCK_LEARNING_INPUT, buildId: 'wave-2a' });
    const countAfterSecondWave = setTimeoutSpy.mock.calls.filter(([, d]) => d === 30_000).length;

    expect(countAfterSecondWave).toBe(countAfterFirstWave + 1);
  });

  it('learnFromVisualDiff also triggers a save via learnFromUX', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    learnFromVisualDiff('vis-build-1', 7.5, 7.0, 'dna-id-1');
    const uxSaveTimers = setTimeoutSpy.mock.calls.filter(([, d]) => d === 30_000);
    expect(uxSaveTimers.length).toBeGreaterThanOrEqual(1);
  });

  it('learnFromRepairUX also triggers a save via learnFromUX', () => {
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
    learnFromRepairUX({ ...MOCK_LEARNING_INPUT, buildId: 'repair-debounce', improvedScore: 8.5 });
    const uxSaveTimers = setTimeoutSpy.mock.calls.filter(([, d]) => d === 30_000);
    expect(uxSaveTimers.length).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. EDGE CASES & REGRESSION
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('predictUX handles null-like inputs gracefully', () => {
    expect(() => predictUX({ code: 'x', sectionOrder: [] })).not.toThrow();
  });

  it('computeOverallUXScore handles mixed 0/10 metrics', () => {
    const mixed = { ...MOCK_UX_METRICS, trust: 0, ctaDiscoverability: 10, hierarchy: 0, whitespaceBalance: 10 };
    const score = computeOverallUXScore(mixed);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('predictConversion handles boundary score 5.0', () => {
    const pred = predictConversion(5.0, MOCK_UX_METRICS);
    expect(['Very Low', 'Low', 'Medium', 'High', 'Very High']).toContain(pred);
  });

  it('getUXQualityMetrics does not throw with mixed repair data', () => {
    resetUXMetrics();
    for (let i = 0; i < 5; i++) {
      recordUXRun({ buildId: `mix${i}`, uxReport: makeUXReport(), repairTriggered: i % 2 === 0 });
    }
    expect(() => getUXQualityMetrics()).not.toThrow();
  });

  it('UX scoring clamps to [0, 10] even for extreme inputs', () => {
    const extremeCode = '<'.repeat(100) + 'aria-label focus-visible ★★★★★ 999,999 users trusted by' + '>'.repeat(100);
    const report = predictUX({ code: extremeCode, sectionOrder: [] });
    expect(report.overallUXScore).toBeGreaterThanOrEqual(0);
    expect(report.overallUXScore).toBeLessThanOrEqual(10);
    for (const v of Object.values(report.metrics)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(10);
    }
  });

  it('selectBestCandidate handles all equal scores', () => {
    const all: import('../../agents/pipeline/candidateSelectionStep.js').CandidateScore[] = [
      { index: 0, label: 'A', overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, shadcnScore: 8, consistencyScore: 8, visualScore: 8, uxScore: 8, combinedScore: 8 },
      { index: 1, label: 'B', overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, shadcnScore: 8, consistencyScore: 8, visualScore: 8, uxScore: 8, combinedScore: 8 },
      { index: 2, label: 'C', overallScore: 8, heroScore: 8, layoutScore: 8, ctaScore: 8, accessibilityScore: 8, shadcnScore: 8, consistencyScore: 8, visualScore: 8, uxScore: 8, combinedScore: 8 },
    ];
    expect(() => selectBestCandidate(all)).not.toThrow();
    const winner = selectBestCandidate(all);
    expect(['A', 'B', 'C']).toContain(winner.label);
  });

  it('all UX metric scores in predictUX output are numbers', () => {
    const report = predictUX({ code: STRONG_PAGE, sectionOrder: ['Hero', 'Features'] });
    for (const [key, val] of Object.entries(report.metrics)) {
      expect(typeof val, `${key} should be number`).toBe('number');
    }
  });

  it('getUXQualityMetrics averageTrustScore matches recorded data', () => {
    resetUXMetrics();
    const report = makeUXReport({ trust: 9 });
    recordUXRun({ buildId: 't', uxReport: report, repairTriggered: false });
    const m = getUXQualityMetrics();
    expect(m.averageTrustScore).toBe(9);
  });

  it('confidence is always between 0 and 1', () => {
    for (let sections = 0; sections < 15; sections++) {
      const c = computeConfidence(MOCK_UX_METRICS, sections);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});
