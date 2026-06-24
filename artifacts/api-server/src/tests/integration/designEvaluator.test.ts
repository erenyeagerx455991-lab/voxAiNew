import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateDesign } from '../../agents/designEvaluator/evaluator.js';
import { recordEvaluatorScore, getEvaluatorMetrics, resetEvaluatorMetrics } from '../../telemetry/evaluatorMetrics.js';
import { REPAIR_THRESHOLD, MAX_DESIGN_REPAIR_PASSES } from '../../agents/pipeline/designEvaluatorStep.js';
import type { DesignDNA } from '../../agents/types.js';

const MOCK_DNA: DesignDNA = {
  designLanguage: 'monochrome',
  layoutStyle: 'flat-ui',
  typographySystem: { headingWeight: 'font-black', headingTracking: 'tracking-tighter', scale: 'lg', fontFamily: 'sans' },
  spacingSystem: { density: 'balanced', sectionPadding: 'py-24', componentGap: 'gap-6' },
  colorSystem: { theme: 'dark', background: '#0a0a0a', surface: '#141414', primary: '#ffffff', secondary: '#e5e5e5', accent: '#ffffff', text: '#ffffff', textMuted: '#666666', border: '#2a2a2a' },
  animationPersonality: 'subtle',
  decorationLevel: 'none',
  componentPreferences: ['flat-card', 'solid-button'],
  heroStyle: 'centered-minimal',
  cardStyle: 'flat-bordered',
  visualDensity: 'balanced',
  theme: 'dark',
  primaryColor: '#ffffff',
  secondaryColor: '#e5e5e5',
  accentColor: '#ffffff',
  bgColor: '#0a0a0a',
  bgGradient: 'from-[#0a0a0a] to-[#111111]',
  headingGradient: 'from-white to-gray-400',
  buttonStyle: 'rounded-lg',
  buttonColors: 'bg-white text-black',
  cardStyleTokens: 'bg-[#141414] border border-[#2a2a2a] rounded-xl',
  mood: 'Sharp',
};

const GOOD_PAGE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation" className="bg-[#0a0a0a] flex items-center justify-between px-6 py-4">
      <a href="/" className="font-bold focus-visible:outline-none focus-visible:ring-2">BuildAI</a>
      <Button variant="outline" type="button" className="focus-visible:outline-none focus-visible:ring-2">Sign in</Button>
    </nav>
  );
}
function Hero() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Badge variant="secondary" className="mb-4">Trusted by 10,000 engineering teams</Badge>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter">Ship code 10x faster with AI-powered review</h1>
      <p className="text-lg text-white/70 max-w-2xl mt-6">BuildAI catches bugs before they reach production. Real-time analysis, one-click fixes, zero config.</p>
      <div className="flex flex-row gap-4 mt-8">
        <Button className="bg-white text-black rounded-lg px-8 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" type="button">Start building free →</Button>
        <Button variant="outline" className="border-white/20 text-white rounded-lg px-8 py-3 focus-visible:outline-none focus-visible:ring-2" type="button">See how it works</Button>
      </div>
      <div className="flex items-center gap-2 mt-8 text-white/60">
        <span>★★★★★</span>
        <span>4.9/5 from 2,340 reviews on G2</span>
      </div>
    </div>
  );
}
function Features() {
  return (
    <div className="bg-[#141414] py-24 px-6">
      <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-12">Everything your team needs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <CardHeader><CardTitle className="text-white">Instant PR analysis</CardTitle></CardHeader>
          <CardContent className="text-white/70">Catch security vulnerabilities, performance issues, and style violations in under 30 seconds.</CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <CardHeader><CardTitle className="text-white">One-click fixes</CardTitle></CardHeader>
          <CardContent className="text-white/70">Accept AI-generated patches directly in your editor — no copy-paste, no context switching.</CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
          <CardHeader><CardTitle className="text-white">Team analytics</CardTitle></CardHeader>
          <CardContent className="text-white/70">Track code quality trends, review velocity, and bug escape rate across every repository.</CardContent>
        </Card>
      </div>
    </div>
  );
}
function Testimonials() {
  return (
    <div className="bg-[#0a0a0a] py-24 px-6">
      <h2 className="text-3xl font-black text-white text-center mb-12">Loved by engineering teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="bg-[#141414] border border-[#2a2a2a] rounded-xl">
          <CardContent className="pt-6">
            <Avatar className="mb-4"><AvatarFallback>SC</AvatarFallback></Avatar>
            <p className="text-white/80 mb-3">"BuildAI cut our code review time by 60%. Our team ships with more confidence."</p>
            <p className="text-white/60 text-sm">Sarah Chen, VP Engineering at Veritas AI</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border border-[#2a2a2a] rounded-xl">
          <CardContent className="pt-6">
            <Avatar className="mb-4"><AvatarFallback>MR</AvatarFallback></Avatar>
            <p className="text-white/80 mb-3">"Onboarded in 5 minutes. Caught a SQL injection bug on day one."</p>
            <p className="text-white/60 text-sm">Marcus Reid, Lead Engineer at DataStream</p>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border border-[#2a2a2a] rounded-xl">
          <CardContent className="pt-6">
            <Avatar className="mb-4"><AvatarFallback>AK</AvatarFallback></Avatar>
            <p className="text-white/80 mb-3">"The AI catches what code review misses. Worth every penny."</p>
            <p className="text-white/60 text-sm">Aria Kim, CTO at Stackify</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
function CTA() {
  return (
    <div className="bg-[#141414] py-24 text-center px-6">
      <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Ready to ship with confidence?</h2>
      <p className="text-white/70 mb-8">Join 10,000+ engineering teams who ship 60% faster with BuildAI.</p>
      <Button className="bg-white text-black rounded-lg px-10 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" type="button">Start your free 14-day trial →</Button>
    </div>
  );
}
function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] py-12 px-6" aria-label="Site footer">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div><p className="text-white font-bold">BuildAI</p><p className="text-white/60 text-sm mt-2">AI-powered code review for modern engineering teams.</p></div>
        <div><p className="text-white/80 font-semibold mb-3">Product</p><ul className="space-y-2 text-white/60 text-sm"><li>Features</li><li>Pricing</li><li>Changelog</li></ul></div>
        <div><p className="text-white/80 font-semibold mb-3">Company</p><ul className="space-y-2 text-white/60 text-sm"><li>About</li><li>Blog</li><li>Careers</li></ul></div>
        <div><p className="text-white/80 font-semibold mb-3">Legal</p><ul className="space-y-2 text-white/60 text-sm"><li>Privacy</li><li>Terms</li></ul></div>
      </div>
    </footer>
  );
}
function App() {
  return (<div><Navbar/><Hero/><Features/><Testimonials/><CTA/><Footer/></div>);
}
`;

const WEAK_PAGE = `
function Hero() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <h1>Welcome to Acme Corp</h1>
      <button>Get Started</button>
    </div>
  );
}
function Features() {
  return (
    <div className="bg-[#0a0a0a] py-24">
      <h2>Features</h2>
      <div className="grid grid-cols-3">
        <div>Lorem ipsum dolor sit amet feature one</div>
        <div>Feature two lorem ipsum content</div>
        <div>Feature three lorem ipsum text</div>
      </div>
    </div>
  );
}
function App() {
  return (<div><Hero/><Features/></div>);
}
`;

const SECTION_ORDER_GOOD = ['Navbar', 'Hero', 'Features', 'Testimonials', 'CTA', 'Footer'];
const SECTION_ORDER_WEAK = ['Hero', 'Features'];

describe('Design Evaluator — Unit Tests', () => {
  beforeEach(() => {
    resetEvaluatorMetrics();
  });

  it('1. Good page scores higher than weak page', () => {
    const good = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    const weak = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    expect(good.overallScore).toBeGreaterThan(weak.overallScore);
  });

  it('2. Missing CTA reduces ctaScore', () => {
    const withCTA = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    const noCTACode = GOOD_PAGE.replace(/<Button[\s\S]*?<\/Button>/g, '');
    const withoutCTA = evaluateDesign({ code: noCTACode, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    expect(withCTA.ctaScore).toBeGreaterThan(withoutCTA.ctaScore);
  });

  it('3. Missing hero reduces heroScore', () => {
    const withHero = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    const noHeroCode = GOOD_PAGE.replace(/function Hero\(\)[\s\S]*?^}/m, '');
    const noHeroOrder = SECTION_ORDER_GOOD.filter(s => s !== 'Hero');
    const withoutHero = evaluateDesign({ code: noHeroCode, sectionOrder: noHeroOrder, designDNA: MOCK_DNA });
    expect(withHero.heroScore).toBeGreaterThanOrEqual(withoutHero.heroScore);
  });

  it('4. Missing focus-visible reduces accessibilityScore', () => {
    const withFocus = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    const noFocusCode = GOOD_PAGE.replace(/\bfocus-visible:[^\s"']*/g, '');
    const withoutFocus = evaluateDesign({ code: noFocusCode, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    expect(withFocus.accessibilityScore).toBeGreaterThan(withoutFocus.accessibilityScore);
  });

  it('5. All issues are actionable — non-vague messages and valid types', () => {
    const result = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    expect(result.issues.length).toBeGreaterThan(0);
    for (const issue of result.issues) {
      expect(issue.message.length).toBeGreaterThan(30);
      expect(['hero', 'layout', 'cta', 'accessibility', 'shadcn', 'consistency', 'coverage']).toContain(issue.category);
      expect(['critical', 'major', 'minor']).toContain(issue.severity);
    }
  });

  it('6. Repair limit is MAX_DESIGN_REPAIR_PASSES = 2', () => {
    expect(MAX_DESIGN_REPAIR_PASSES).toBe(2);
  });

  it('7. Infinite loop impossible — evaluateDesign is pure (same input → same output)', () => {
    const r1 = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    const r2 = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.issues.length).toBe(r2.issues.length);
  });

  it('8. Telemetry records evaluator score correctly', () => {
    const result = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    recordEvaluatorScore({ buildId: 'test-001', ...result, repairCount: 0, repairApplied: false });
    const metrics = getEvaluatorMetrics();
    expect(metrics).toBeDefined();
    const averages = (metrics as Record<string, unknown>).averages as Record<string, number>;
    expect(averages.overallScore).toBeGreaterThan(0);
    const repairStats = (metrics as Record<string, unknown>).repairStats as Record<string, unknown>;
    expect(repairStats.totalRepairPasses).toBe(0);
    expect(repairStats.buildsRepaired).toBe(0);
  });

  it('All dimension scores stay within 0–10 range', () => {
    const good = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    const weak = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    for (const result of [good, weak]) {
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(10);
      expect(result.heroScore).toBeGreaterThanOrEqual(0);
      expect(result.heroScore).toBeLessThanOrEqual(10);
      expect(result.layoutScore).toBeGreaterThanOrEqual(0);
      expect(result.layoutScore).toBeLessThanOrEqual(10);
      expect(result.ctaScore).toBeGreaterThanOrEqual(0);
      expect(result.ctaScore).toBeLessThanOrEqual(10);
      expect(result.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.accessibilityScore).toBeLessThanOrEqual(10);
      expect(result.shadcnScore).toBeGreaterThanOrEqual(0);
      expect(result.shadcnScore).toBeLessThanOrEqual(10);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.consistencyScore).toBeLessThanOrEqual(10);
    }
  });

  it('Weak page triggers repair threshold (score < 8.0)', () => {
    const weak = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    expect(weak.overallScore).toBeLessThan(REPAIR_THRESHOLD);
  });

  it('Good page meets or approaches production-ready threshold', () => {
    const good = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    expect(good.overallScore).toBeGreaterThanOrEqual(7.0);
  });

  it('Hero issues are specific and reference actual elements', () => {
    const result = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    const heroIssues = result.issues.filter(i => i.category === 'hero');
    expect(heroIssues.length).toBeGreaterThan(0);
    for (const issue of heroIssues) {
      expect(issue.message).not.toBe('Layout weak');
      expect(issue.message).not.toBe('Hero problem');
    }
  });

  it('Lorem ipsum detected and flagged as critical consistency issue', () => {
    const result = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    const loremIssue = result.issues.find(i => /lorem ipsum/i.test(i.message));
    expect(loremIssue).toBeDefined();
    expect(loremIssue?.severity).toBe('critical');
    expect(loremIssue?.category).toBe('consistency');
  });

  it('Placeholder names (Acme Corp) detected and flagged', () => {
    const result = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    const placeholderIssue = result.issues.find(i => /acme corp|placeholder/i.test(i.message));
    expect(placeholderIssue).toBeDefined();
    expect(placeholderIssue?.category).toBe('consistency');
  });

  it('Missing shadcn components flagged', () => {
    const result = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    const shadcnIssues = result.issues.filter(i => i.category === 'shadcn');
    expect(shadcnIssues.length).toBeGreaterThan(0);
  });

  it('Telemetry scoreDistribution tracks correctly', () => {
    const weak = evaluateDesign({ code: WEAK_PAGE, sectionOrder: SECTION_ORDER_WEAK, designDNA: MOCK_DNA });
    recordEvaluatorScore({ buildId: 'test-002', ...weak, repairCount: 1, repairApplied: true });
    const metrics = getEvaluatorMetrics() as Record<string, unknown>;
    const dist = metrics.scoreDistribution as Record<string, number>;
    expect(dist.repairRequired + dist.needsImprovement).toBeGreaterThan(0);
    const repairStats = metrics.repairStats as Record<string, unknown>;
    expect(repairStats.buildsRepaired).toBe(1);
    expect(repairStats.totalRepairPasses).toBe(1);
  });

  it('resetEvaluatorMetrics clears all state', () => {
    const result = evaluateDesign({ code: GOOD_PAGE, sectionOrder: SECTION_ORDER_GOOD, designDNA: MOCK_DNA });
    recordEvaluatorScore({ buildId: 'test-003', ...result, repairCount: 0, repairApplied: false });
    resetEvaluatorMetrics();
    const metrics = getEvaluatorMetrics() as Record<string, unknown>;
    expect(metrics.totalEvaluated).toBe(0);
    const averages = metrics.averages as Record<string, number>;
    expect(averages.overallScore).toBe(0);
  });
});
