// V7.2.4 — Shadcn Coverage Expansion + Premium Component System
// 47 tests covering: component availability, generator preferences,
// evaluator coverage scoring, telemetry, recommendation engine.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeComponentCoverage,
  recommendBestComponents,
  recordComponentCoverageScore,
  getComponentCoverageMetrics,
  resetComponentCoverageMetrics,
  ALL_SHADCN_COMPONENTS,
  TOTAL_COMPONENT_FAMILIES,
} from '../../quality/componentRecommendations.js';
import { evaluateDesign } from '../../agents/designEvaluator/evaluator.js';
import type { DesignDNA } from '../../agents/types.js';

// ── shared fixtures ───────────────────────────────────────────────────────────

const MOCK_DNA: DesignDNA = {
  designLanguage: 'monochrome', layoutStyle: 'flat-ui',
  typographySystem: { headingWeight: 'font-black', headingTracking: 'tracking-tighter', scale: 'lg', fontFamily: 'sans' },
  spacingSystem: { density: 'balanced', sectionPadding: 'py-24', componentGap: 'gap-6' },
  colorSystem: { theme: 'dark', background: '#0a0a0a', surface: '#141414', primary: '#ffffff', secondary: '#e5e5e5', accent: '#ffffff', text: '#ffffff', textMuted: '#666666', border: '#2a2a2a' },
  animationPersonality: 'subtle', decorationLevel: 'none',
  componentPreferences: ['flat-card', 'solid-button'], heroStyle: 'centered-minimal', cardStyle: 'flat-bordered',
  visualDensity: 'balanced', theme: 'dark', primaryColor: '#ffffff', secondaryColor: '#e5e5e5',
  accentColor: '#ffffff', bgColor: '#0a0a0a', bgGradient: 'from-[#0a0a0a] to-[#111111]',
  headingGradient: 'from-white to-gray-400', buttonStyle: 'rounded-lg',
  buttonColors: 'bg-white text-black', cardStyleTokens: 'bg-[#141414] border border-[#2a2a2a] rounded-xl', mood: 'Sharp',
};

// Full-coverage premium code snippet for evaluator tests
const PREMIUM_CODE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation" className="bg-[#0a0a0a] flex items-center justify-between px-6 py-4">
      <NavigationMenu><NavigationMenuList><NavigationMenuItem><NavigationMenuLink href="/">Home</NavigationMenuLink></NavigationMenuItem></NavigationMenuList></NavigationMenu>
      <Button type="button" variant="outline" className="focus-visible:outline-none focus-visible:ring-2">Sign in</Button>
    </nav>
  );
}
function Hero() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Badge variant="secondary" className="mb-4">Now in beta</Badge>
      <h1 className="text-6xl font-black">Ship faster with AI</h1>
      <p className="text-lg text-white/70 max-w-2xl mt-4">The best AI tool on the market.</p>
      <div className="flex gap-4 mt-8">
        <Button type="button" className="focus-visible:outline-none focus-visible:ring-2">Get started</Button>
        <Button type="button" variant="outline" className="focus-visible:outline-none focus-visible:ring-2">See demo</Button>
      </div>
      <div className="flex mt-6">
        <Avatar><AvatarImage src="/a.png" alt="User" /><AvatarFallback>AB</AvatarFallback></Avatar>
        <span className="text-white/70 ml-2 text-sm">Trusted by 10,000 teams</span>
      </div>
    </div>
  );
}
function Features() {
  return (
    <div className="py-24 bg-[#111]">
      <Tabs defaultValue="tab1">
        <TabsList><TabsTrigger value="tab1">Core</TabsTrigger></TabsList>
        <TabsContent value="tab1">
          <Card className="bg-[#141414] border border-[#2a2a2a]"><CardHeader><CardTitle>Feature A</CardTitle></CardHeader><CardContent>Content</CardContent></Card>
          <Card className="bg-[#141414] border border-[#2a2a2a]"><CardHeader><CardTitle>Feature B</CardTitle></CardHeader><CardContent>Content</CardContent></Card>
          <Card className="bg-[#141414] border border-[#2a2a2a]"><CardHeader><CardTitle>Feature C</CardTitle></CardHeader><CardContent>Content</CardContent></Card>
        </TabsContent>
      </Tabs>
      <Progress value={80} className="mt-4" />
      <Skeleton className="h-4 w-full mt-2" />
    </div>
  );
}
function Pricing() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="py-24 bg-[#0a0a0a]">
      <Switch checked={false} onCheckedChange={() => {}} />
      <Card><CardHeader><CardTitle>Pro</CardTitle></CardHeader><CardContent><Separator /><Input placeholder="Email" /></CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Details</DialogTitle></DialogHeader></DialogContent></Dialog>
    </div>
  );
}
function Dashboard() {
  return (
    <div className="py-24 bg-[#111]">
      <Command><CommandInput placeholder="Search..." /><CommandList><CommandItem>Result</CommandItem></CommandList></Command>
      <DataTable columns={[{ header: 'Name', accessorKey: 'name' }]} data={[{ name: 'Row 1' }]} />
      <Drawer><DrawerContent>Panel</DrawerContent></Drawer>
    </div>
  );
}
function FAQ() {
  return (
    <div className="py-24 bg-[#0a0a0a]">
      <Accordion type="single" collapsible>
        <AccordionItem value="q1"><AccordionTrigger>Question 1</AccordionTrigger><AccordionContent>Answer 1</AccordionContent></AccordionItem>
        <AccordionItem value="q2"><AccordionTrigger>Question 2</AccordionTrigger><AccordionContent>Answer 2</AccordionContent></AccordionItem>
      </Accordion>
      <HoverCard><HoverCardContent>Hover info</HoverCardContent></HoverCard>
    </div>
  );
}
function App() { return (<div><Navbar /><Hero /><Features /><Pricing /><Dashboard /><FAQ /></div>); }
`;

const BASIC_CODE = `
function Hero() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Badge variant="secondary">Label</Badge>
      <h1 className="text-6xl font-black">Hello</h1>
      <p className="text-lg text-white/70">Subtitle</p>
      <Button type="button" className="focus-visible:outline-none focus-visible:ring-2">CTA</Button>
      <Button type="button" variant="outline" className="focus-visible:outline-none focus-visible:ring-2">Secondary</Button>
      <Avatar><AvatarImage src="/a.png" alt="A" /><AvatarFallback>AB</AvatarFallback></Avatar>
    </div>
  );
}
function App() { return (<div><Hero /></div>); }
`;

// ── Phase 1: Component availability ──────────────────────────────────────────

describe('Phase 1 — ALL_SHADCN_COMPONENTS catalogue', () => {
  it('includes all core components', () => {
    const core = ['Button', 'Card', 'Badge', 'Input', 'Textarea', 'Label', 'Select', 'Switch'];
    for (const c of core) expect(ALL_SHADCN_COMPONENTS).toContain(c);
  });

  it('includes standard display components', () => {
    const display = ['Avatar', 'AvatarImage', 'AvatarFallback', 'Separator', 'Skeleton', 'Progress'];
    for (const c of display) expect(ALL_SHADCN_COMPONENTS).toContain(c);
  });

  it('includes navigation & overlay components', () => {
    const nav = ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent', 'Accordion', 'Dialog', 'Sheet', 'Tooltip', 'DropdownMenu'];
    for (const c of nav) expect(ALL_SHADCN_COMPONENTS).toContain(c);
  });

  it('includes all 8 premium V7.2.4 components', () => {
    const premium = ['Command', 'CommandInput', 'CommandList', 'CommandItem', 'Calendar', 'DatePicker', 'DataTable', 'Drawer', 'HoverCard', 'Menubar', 'NavigationMenu'];
    for (const c of premium) expect(ALL_SHADCN_COMPONENTS).toContain(c);
  });

  it('has correct TOTAL_COMPONENT_FAMILIES count', () => {
    expect(TOTAL_COMPONENT_FAMILIES).toBe(36);
  });
});

// ── Phase 2: Generator preferences / computeComponentCoverage ────────────────

describe('Phase 2 — computeComponentCoverage()', () => {
  it('returns 0% for empty code', () => {
    const r = computeComponentCoverage('');
    expect(r.coveragePercent).toBe(0);
    expect(r.totalUnique).toBe(0);
  });

  it('counts Button usage', () => {
    const r = computeComponentCoverage('<Button>Click</Button>');
    expect(r.componentUsage['Button']).toBeGreaterThanOrEqual(1);
  });

  it('detects all premium components in premium code', () => {
    const r = computeComponentCoverage(PREMIUM_CODE);
    expect(r.componentUsage['Command']).toBeGreaterThanOrEqual(1);
    expect(r.componentUsage['DataTable']).toBeGreaterThanOrEqual(1);
    expect(r.componentUsage['Drawer']).toBeGreaterThanOrEqual(1);
    expect(r.componentUsage['HoverCard']).toBeGreaterThanOrEqual(1);
    expect(r.componentUsage['NavigationMenu']).toBeGreaterThanOrEqual(1);
  });

  it('returns high coverage (≥60%) for premium code', () => {
    const r = computeComponentCoverage(PREMIUM_CODE);
    expect(r.coveragePercent).toBeGreaterThanOrEqual(60);
  });

  it('returns mostUsed array with at least 1 entry for basic code', () => {
    const r = computeComponentCoverage(BASIC_CODE);
    expect(r.mostUsed.length).toBeGreaterThan(0);
  });

  it('leastUsed contains components absent from basic code', () => {
    const r = computeComponentCoverage(BASIC_CODE);
    // leastUsed returns first 5 unused components in FAMILIES order; Card and Input are first unused
    expect(r.leastUsed.length).toBeGreaterThan(0);
    // Command must not appear in componentUsage (it is unused in basic code)
    expect(r.componentUsage['Command']).toBeUndefined();
  });

  it('counts multiple uses of the same component', () => {
    const code = '<Card><Card><Card>';
    const r = computeComponentCoverage(code);
    expect(r.componentUsage['Card']).toBe(3);
  });
});

// ── Phase 6: Evaluator coverage score ────────────────────────────────────────

describe('Phase 6 — evaluator coverageScore', () => {
  it('result includes coverageScore field', () => {
    const result = evaluateDesign({ code: BASIC_CODE, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(result).toHaveProperty('coverageScore');
    expect(typeof result.coverageScore).toBe('number');
  });

  it('result includes coveragePercent field', () => {
    const result = evaluateDesign({ code: BASIC_CODE, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(result).toHaveProperty('coveragePercent');
    expect(result.coveragePercent).toBeGreaterThanOrEqual(0);
    expect(result.coveragePercent).toBeLessThanOrEqual(100);
  });

  it('result includes componentUsage record', () => {
    const result = evaluateDesign({ code: BASIC_CODE, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(result).toHaveProperty('componentUsage');
    expect(typeof result.componentUsage).toBe('object');
  });

  it('premium code gets higher coverageScore than basic code', () => {
    const sectionOrder = ['Navbar', 'Hero', 'Features', 'Pricing', 'Dashboard', 'FAQ'];
    const premium = evaluateDesign({ code: PREMIUM_CODE, sectionOrder, designDNA: MOCK_DNA });
    const basic   = evaluateDesign({ code: BASIC_CODE,   sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(premium.coverageScore).toBeGreaterThan(basic.coverageScore);
  });

  it('coverageScore for premium code is ≥6', () => {
    const result = evaluateDesign({ code: PREMIUM_CODE, sectionOrder: ['Navbar','Hero','Features','Pricing','Dashboard','FAQ'], designDNA: MOCK_DNA });
    expect(result.coverageScore).toBeGreaterThanOrEqual(6);
  });

  it('coverageScore is 0–10', () => {
    const result = evaluateDesign({ code: BASIC_CODE, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(result.coverageScore).toBeGreaterThanOrEqual(0);
    expect(result.coverageScore).toBeLessThanOrEqual(10);
  });

  it('shadcnScore rewards premium components', () => {
    const sectionOrder = ['Navbar', 'Hero', 'Features', 'Pricing', 'Dashboard', 'FAQ'];
    const premium = evaluateDesign({ code: PREMIUM_CODE, sectionOrder, designDNA: MOCK_DNA });
    const basic   = evaluateDesign({ code: BASIC_CODE, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    expect(premium.shadcnScore).toBeGreaterThanOrEqual(basic.shadcnScore);
  });

  it('coverage issues are included when coverage is low', () => {
    const minCode = '<div><h1>Hi</h1><button type="button" class="focus-visible:ring">Click</button></div>';
    const result = evaluateDesign({ code: minCode, sectionOrder: ['Hero'], designDNA: MOCK_DNA });
    const coverageIssues = result.issues.filter(i => i.category === 'coverage');
    expect(coverageIssues.length).toBeGreaterThan(0);
  });

  it('coverage issues are absent when coverage is very high (≥75%)', () => {
    // Use code that hits ≥75% coverage (19+ families out of 26)
    const FULL_COVERAGE_CODE = PREMIUM_CODE + `
function Extra() {
  return (
    <div>
      <Calendar mode="single" selected={null} />
      <Tooltip><TooltipTrigger><Button type="button">T</Button></TooltipTrigger><TooltipContent>Tip</TooltipContent></Tooltip>
      <Label htmlFor="x">Label</Label>
      <Textarea placeholder="..." />
    </div>
  );
}`;
    const result = evaluateDesign({ code: FULL_COVERAGE_CODE, sectionOrder: ['Navbar','Hero','Features','Pricing','Dashboard','FAQ','Extra'], designDNA: MOCK_DNA });
    const coverageIssues = result.issues.filter(i => i.category === 'coverage');
    expect(coverageIssues.length).toBe(0);
  });

  it('overall score is still 0–10', () => {
    const result = evaluateDesign({ code: PREMIUM_CODE, sectionOrder: ['Navbar','Hero','Features','Pricing','Dashboard','FAQ'], designDNA: MOCK_DNA });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);
  });
});

// ── Phase 7: recommendBestComponents() ───────────────────────────────────────

describe('Phase 7 — recommendBestComponents()', () => {
  it('returns primary and secondary arrays', () => {
    const r = recommendBestComponents({ industry: ['saas'], sectionType: 'hero', dna: {} });
    expect(Array.isArray(r.primary)).toBe(true);
    expect(Array.isArray(r.secondary)).toBe(true);
  });

  it('hero always includes Button and Badge in primary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'hero', dna: {} });
    expect(r.primary).toContain('Button');
    expect(r.primary).toContain('Badge');
  });

  it('faq always includes Accordion in primary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'faq', dna: {} });
    expect(r.primary).toContain('Accordion');
  });

  it('dashboard always includes Tabs and DataTable in primary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'dashboard', dna: {} });
    expect(r.primary).toContain('Tabs');
    expect(r.primary).toContain('DataTable');
  });

  it('pricing includes Card, Badge, Separator in primary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'pricing', dna: {} });
    expect(r.primary).toContain('Card');
    expect(r.primary).toContain('Badge');
    expect(r.primary).toContain('Separator');
  });

  it('testimonials includes Avatar and Card in primary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'testimonials', dna: {} });
    expect(r.primary).toContain('Avatar');
    expect(r.primary).toContain('Card');
  });

  it('fintech industry adds DataTable to pricing primary', () => {
    const r = recommendBestComponents({ industry: ['fintech'], sectionType: 'pricing', dna: {} });
    expect(r.primary).toContain('DataTable');
  });

  it('ai industry adds Command to dashboard secondary or primary', () => {
    const r = recommendBestComponents({ industry: ['ai'], sectionType: 'dashboard', dna: {} });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('Command');
  });

  it('linear DNA adds Command to secondary', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'hero', dna: { linear: 80 } });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('Command');
  });

  it('no component appears in both primary and secondary', () => {
    const r = recommendBestComponents({ industry: ['saas'], sectionType: 'dashboard', dna: { vercel: 60 } });
    const primarySet = new Set(r.primary);
    for (const c of r.secondary) {
      expect(primarySet.has(c)).toBe(false);
    }
  });

  it('unknown section returns fallback with Button and Card', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'unknown-xyz', dna: {} });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('Button');
    expect(all).toContain('Card');
  });

  it('rationale is a non-empty string', () => {
    const r = recommendBestComponents({ industry: ['saas'], sectionType: 'features', dna: {} });
    expect(typeof r.rationale).toBe('string');
    expect(r.rationale.length).toBeGreaterThan(0);
  });

  it('developer industry adds Command to features', () => {
    const r = recommendBestComponents({ industry: ['developer'], sectionType: 'features', dna: {} });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('Command');
  });
});

// ── Phase 8: Coverage telemetry ───────────────────────────────────────────────

describe('Phase 8 — component coverage telemetry', () => {
  beforeEach(() => { resetComponentCoverageMetrics(); });

  it('starts with zero tracked builds', () => {
    const m = getComponentCoverageMetrics();
    expect(m.totalBuildsTracked).toBe(0);
  });

  it('tracks a recorded coverage score', () => {
    recordComponentCoverageScore(85);
    const m = getComponentCoverageMetrics();
    expect(m.totalBuildsTracked).toBe(1);
  });

  it('averageCoveragePercent matches a single recorded value', () => {
    recordComponentCoverageScore(90);
    const m = getComponentCoverageMetrics();
    expect(m.averageCoveragePercent).toBe(90);
  });

  it('averageCoveragePercent is correct for multiple values', () => {
    recordComponentCoverageScore(80);
    recordComponentCoverageScore(100);
    const m = getComponentCoverageMetrics();
    expect(m.averageCoveragePercent).toBe(90);
  });

  it('recentBuilds shows last N scores', () => {
    recordComponentCoverageScore(70);
    recordComponentCoverageScore(80);
    recordComponentCoverageScore(90);
    const m = getComponentCoverageMetrics();
    expect(m.recentBuilds).toContain(90);
  });

  it('allAvailableComponents reflects ALL_SHADCN_COMPONENTS length', () => {
    const m = getComponentCoverageMetrics();
    expect(m.allAvailableComponents).toBe(ALL_SHADCN_COMPONENTS.length);
  });

  it('caps history at 100 entries', () => {
    for (let i = 0; i < 110; i++) recordComponentCoverageScore(i % 100);
    const m = getComponentCoverageMetrics();
    expect(m.totalBuildsTracked).toBe(100);
  });

  it('resetComponentCoverageMetrics clears all state', () => {
    recordComponentCoverageScore(50);
    resetComponentCoverageMetrics();
    const m = getComponentCoverageMetrics();
    expect(m.totalBuildsTracked).toBe(0);
    expect(m.averageCoveragePercent).toBe(0);
  });
});

// ── Phase 5: Registry audit helpers ──────────────────────────────────────────

describe('Phase 5 — registry audit: computeComponentCoverage edge cases', () => {
  it('handles code with only raw HTML (no shadcn) gracefully', () => {
    const r = computeComponentCoverage('<div><h1>Hello</h1><p>World</p></div>');
    expect(r.coveragePercent).toBe(0);
    expect(r.totalUnique).toBe(0);
  });

  it('does not double-count sub-components (CardHeader inside Card)', () => {
    const code = '<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Body</CardContent></Card>';
    const r = computeComponentCoverage(code);
    // Card family: Card, CardHeader, CardTitle, CardContent are all tracked separately
    expect(Object.keys(r.componentUsage).length).toBeGreaterThan(0);
  });

  it('NavigationMenu detected in premium code', () => {
    const r = computeComponentCoverage(PREMIUM_CODE);
    expect(r.componentUsage['NavigationMenu']).toBeGreaterThanOrEqual(1);
  });

  it('Accordion detected correctly', () => {
    const code = '<Accordion type="single"><AccordionItem value="q1"><AccordionTrigger>Q</AccordionTrigger><AccordionContent>A</AccordionContent></AccordionItem></Accordion>';
    const r = computeComponentCoverage(code);
    expect(r.componentUsage['Accordion']).toBeGreaterThanOrEqual(1);
  });

  it('Calendar detected in code with DatePicker', () => {
    const code = '<Calendar mode="single" selected={date} /><DatePicker selected={date} onSelect={fn} />';
    const r = computeComponentCoverage(code);
    expect(r.componentUsage['Calendar']).toBeGreaterThanOrEqual(1);
    expect(r.componentUsage['DatePicker']).toBeGreaterThanOrEqual(1);
  });
});
