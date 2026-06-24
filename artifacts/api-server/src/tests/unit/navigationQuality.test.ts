// ── V7.2.5 Navigation Quality Tests ───────────────────────────────────────────
// 60+ tests covering: scoreNavigation, templates, Sheet mobile, a11y,
// recommendation engine, telemetry navigationQuality.

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateDesign } from '../../agents/designEvaluator/evaluator.js';
import type { EvaluationInput } from '../../agents/designEvaluator/evaluator.js';
import { recommendBestComponents } from '../../quality/componentRecommendations.js';
import {
  recordNavigationScore,
  getNavigationQualityMetrics,
  resetNavigationQualityMetrics,
} from '../../telemetry/navigationMetrics.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_DNA = { linear: 60, vercel: 20, stripe: 20 };

const SECTION_ORDER = ['Navbar', 'Hero', 'Features', 'Pricing', 'FAQ', 'CTA', 'Footer'];

/** Full NavigationMenu navbar — all V7.2.5 requirements satisfied */
const NAV_MENU_CODE = `
function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <span className="text-white font-bold">SITE_NAME</span>
          <div className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-gray-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Product</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink href="#" className="focus-visible:ring-2 focus-visible:ring-white/40">Feature 1</NavigationMenuLink>
                    <NavigationMenuLink href="#" className="focus-visible:ring-2 focus-visible:ring-white/40">Feature 2</NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink href="#" className="focus-visible:ring-2 focus-visible:ring-white/40">Pricing</NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" className="focus-visible:ring-2 focus-visible:ring-white">Get Started</Button>
          <button type="button" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(o => !o)} className="md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">☰</button>
        </div>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-[#111] border-r border-white/10 w-72">
          <div className="flex flex-col gap-2 mt-8">
            <a href="#" className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Product</a>
            <a href="#" className="px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">Pricing</a>
            <Button type="button" className="w-full focus-visible:ring-2 focus-visible:ring-white">Get Started</Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
function Hero() {
  return (
    <section className="bg-[#0a0a0a] pt-24 pb-20 text-center">
      <Badge>Now in beta</Badge>
      <h1 className="text-5xl font-black text-white mt-4">The Future of Work</h1>
      <p className="text-gray-400 mt-4">Unlock your team's potential with AI-powered tools.</p>
      <div className="flex gap-4 justify-center mt-8">
        <Button type="button">Start Free Trial</Button>
        <Button type="button" variant="outline">See How It Works</Button>
      </div>
      <p className="text-gray-500 mt-6">★★★★★ 4.9 — Trusted by 50,000+ teams</p>
    </section>
  );
}
`;

/** Old-style navbar — no NavigationMenu, no Sheet, no aria-label */
const OLD_NAV_CODE = `
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <span className="text-white font-bold">SITE_NAME</span>
        <div className="hidden md:flex items-center gap-6">
          <a href="#" className="text-gray-400 hover:text-white text-sm">Product</a>
          <a href="#" className="text-gray-400 hover:text-white text-sm">Pricing</a>
          <a href="#" className="text-gray-400 hover:text-white text-sm">Docs</a>
        </div>
        <button type="button" className="bg-white text-black px-4 py-2 rounded">Get Started</button>
      </div>
    </nav>
  );
}
function Hero() {
  return (
    <section className="bg-[#0a0a0a] pt-24 pb-20 text-center">
      <Badge>Now in beta</Badge>
      <h1 className="text-5xl font-black text-white mt-4">The Future of Work</h1>
      <p className="text-gray-400 mt-4">Unlock your team's potential with AI-powered tools.</p>
      <div className="flex gap-4 justify-center mt-8">
        <Button type="button">Start Free Trial</Button>
        <Button type="button" variant="outline">See How It Works</Button>
      </div>
      <p className="text-gray-500 mt-6">★★★★★ 4.9 — Trusted by 50,000+ teams</p>
    </section>
  );
}
`;

function makeInput(code: string): EvaluationInput {
  return { code, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA };
}

// ── Phase 7 — scoreNavigation() via evaluateDesign ────────────────────────────

describe('Phase 7 — scoreNavigation() via evaluateDesign', () => {
  it('result includes navigationScore field', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    expect(r).toHaveProperty('navigationScore');
  });

  it('navigationScore is in range 0–10', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    expect(r.navigationScore).toBeGreaterThanOrEqual(0);
    expect(r.navigationScore).toBeLessThanOrEqual(10);
  });

  it('NavigationMenu code gets high navigationScore (≥7)', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    expect(r.navigationScore).toBeGreaterThanOrEqual(7);
  });

  it('old-style navbar gets low navigationScore (≤3)', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    expect(r.navigationScore).toBeLessThanOrEqual(3);
  });

  it('NavigationMenu code scores higher than old-style navbar', () => {
    const good = evaluateDesign(makeInput(NAV_MENU_CODE));
    const old  = evaluateDesign(makeInput(OLD_NAV_CODE));
    expect(good.navigationScore).toBeGreaterThan(old.navigationScore);
  });

  it('old-style navbar emits navigation issues', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    const navIssues = r.issues.filter(i => i.category === 'navigation');
    expect(navIssues.length).toBeGreaterThan(0);
  });

  it('old-style navbar emits NavigationMenu critical issue', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    const critical = r.issues.find(i => i.category === 'navigation' && i.severity === 'critical');
    expect(critical).toBeDefined();
    expect(critical!.message).toContain('NavigationMenu');
  });

  it('old-style navbar emits Sheet mobile menu major issue', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    const sheetIssue = r.issues.find(i => i.category === 'navigation' && i.message.includes('Sheet'));
    expect(sheetIssue).toBeDefined();
  });

  it('old-style navbar emits aria-label major issue', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    const ariaIssue = r.issues.find(i => i.category === 'navigation' && i.message.includes('aria-label'));
    expect(ariaIssue).toBeDefined();
  });

  it('NavigationMenu code has no navigation critical issues', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    const criticals = r.issues.filter(i => i.category === 'navigation' && i.severity === 'critical');
    expect(criticals.length).toBe(0);
  });

  it('navigation issues are sorted before minor issues', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    const sev: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    for (let i = 1; i < r.issues.length; i++) {
      expect(sev[r.issues[i].severity]).toBeGreaterThanOrEqual(sev[r.issues[i - 1].severity]);
    }
  });

  it('overall score is higher for NavigationMenu code vs old-style', () => {
    const good = evaluateDesign(makeInput(NAV_MENU_CODE));
    const old  = evaluateDesign(makeInput(OLD_NAV_CODE));
    expect(good.overallScore).toBeGreaterThan(old.overallScore);
  });

  it('overallScore is still 0–10 after navigation weight added', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(10);
  });
});

// ── NavigationMenu detection sub-checks ──────────────────────────────────────

describe('Phase 7 — NavigationMenu sub-component detection', () => {
  it('code with <NavigationMenu> gets +3 points from NavigationMenu check', () => {
    const r = evaluateDesign(makeInput(NAV_MENU_CODE));
    expect(r.navigationScore).toBeGreaterThanOrEqual(3);
  });

  it('code with aria-label="Main navigation" scores higher than without', () => {
    const withAria = evaluateDesign(makeInput(NAV_MENU_CODE));
    const noAria   = evaluateDesign(makeInput(OLD_NAV_CODE));
    expect(withAria.navigationScore).toBeGreaterThan(noAria.navigationScore);
  });

  it('code with Sheet scores higher than code without', () => {
    const withSheet = evaluateDesign(makeInput(NAV_MENU_CODE));
    const noSheet   = evaluateDesign(makeInput(OLD_NAV_CODE));
    expect(withSheet.navigationScore).toBeGreaterThan(noSheet.navigationScore);
  });

  it('partial nav code (only NavigationMenu, no aria-label, no Sheet) gets mid-range score', () => {
    const partial = `
function Navbar() {
  return (
    <nav className="fixed top-0 z-50">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#" className="focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-1">Home</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button type="button">CTA</Button>
    </nav>
  );
}`;
    const r = evaluateDesign({ code: partial, sectionOrder: ['Navbar'], designDNA: MOCK_DNA });
    expect(r.navigationScore).toBeGreaterThanOrEqual(3);
    expect(r.navigationScore).toBeLessThanOrEqual(8);
  });

  it('NavigationMenuTrigger presence does not break scoring', () => {
    const code = `
function Navbar() {
  return (
    <nav aria-label="Main navigation">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="focus-visible:ring-2 focus-visible:ring-white/40">Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#" className="focus-visible:ring-2">Item</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Sheet><SheetContent side="left"><a href="#">Link</a></SheetContent></Sheet>
    </nav>
  );
}`;
    const r = evaluateDesign({ code, sectionOrder: ['Navbar'], designDNA: MOCK_DNA });
    expect(r.navigationScore).toBeGreaterThanOrEqual(5);
  });

  it('navigation issue messages are longer than 30 chars', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    for (const issue of r.issues.filter(i => i.category === 'navigation')) {
      expect(issue.message.length).toBeGreaterThan(30);
    }
  });

  it('navigation issue category is exactly "navigation"', () => {
    const r = evaluateDesign(makeInput(OLD_NAV_CODE));
    for (const issue of r.issues.filter(i => i.category === 'navigation')) {
      expect(issue.category).toBe('navigation');
    }
  });
});

// ── Phase 3 — Template presence in registry ───────────────────────────────────

describe('Phase 3 — NavigationMenu navbar template registration', () => {
  it('navbar-navigation-v1 template code contains NavigationMenu', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v1');
    expect(t).toBeDefined();
    expect(t!.standaloneCode).toContain('NavigationMenu');
  });

  it('navbar-navigation-v1 has priority 15', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v1');
    expect(t!.priority).toBe(15);
  });

  it('navbar-navigation-v2 template code contains NavigationMenu', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v2');
    expect(t).toBeDefined();
    expect(t!.standaloneCode).toContain('NavigationMenu');
  });

  it('navbar-navigation-v3 template code contains NavigationMenu', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v3');
    expect(t).toBeDefined();
    expect(t!.standaloneCode).toContain('NavigationMenu');
  });

  it('navbar-navigation-enterprise-v1 template code contains NavigationMenu', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-enterprise-v1');
    expect(t).toBeDefined();
    expect(t!.standaloneCode).toContain('NavigationMenu');
  });

  it('navbar-navigation-saas-v1 template code contains NavigationMenu', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-saas-v1');
    expect(t).toBeDefined();
    expect(t!.standaloneCode).toContain('NavigationMenu');
  });

  it('all 5 V7.2.5 navbar templates have priority 15', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id);
      expect(t, `${id} missing`).toBeDefined();
      expect(t!.priority).toBe(15);
    }
  });

  it('all V7.2.5 navbar templates are higher priority than V2 navbar templates', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const v3Ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    const v2Ids = ['navbar-minimal-v2','navbar-editorial-v2','navbar-enterprise-v2','navbar-dashboard-v2','navbar-floating-v2','navbar-centered-v2'];
    const v3Min = Math.min(...v3Ids.map(id => DIVERSITY_TEMPLATES.find(t => t.id === id)?.priority ?? 0));
    const v2Max = Math.max(...v2Ids.map(id => DIVERSITY_TEMPLATES.find(t => t.id === id)?.priority ?? 0));
    expect(v3Min).toBeGreaterThan(v2Max);
  });
});

// ── Phase 4 — Sheet mobile menu ───────────────────────────────────────────────

describe('Phase 4 — Sheet mobile menu in templates', () => {
  it('navbar-navigation-v1 uses Sheet for mobile', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v1');
    expect(t!.standaloneCode).toContain('Sheet');
    expect(t!.standaloneCode).toContain('SheetContent');
  });

  it('navbar-navigation-v2 uses Sheet for mobile', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v2');
    expect(t!.standaloneCode).toContain('Sheet');
    expect(t!.standaloneCode).toContain('SheetContent');
  });

  it('navbar-navigation-v3 uses Sheet for mobile', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v3');
    expect(t!.standaloneCode).toContain('Sheet');
    expect(t!.standaloneCode).toContain('SheetContent');
  });

  it('navbar-navigation-enterprise-v1 uses Sheet for mobile', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-enterprise-v1');
    expect(t!.standaloneCode).toContain('Sheet');
  });

  it('navbar-navigation-saas-v1 uses Sheet for mobile', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-saas-v1');
    expect(t!.standaloneCode).toContain('Sheet');
  });

  it('all V7.2.5 navbar templates include SheetContent side="left"', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing side="left"`).toContain('side="left"');
    }
  });

  it('all V7.2.5 navbar templates include mobile toggle button', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing mobile toggle`).toMatch(/md:hidden/);
    }
  });
});

// ── Phase 5 — Accessibility compliance ───────────────────────────────────────

describe('Phase 5 — Accessibility in V7.2.5 templates', () => {
  it('navbar-navigation-v1 has aria-label="Main navigation"', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const t = DIVERSITY_TEMPLATES.find(t => t.id === 'navbar-navigation-v1')!;
    expect(t.standaloneCode).toContain('aria-label="Main navigation"');
  });

  it('all V7.2.5 navbar templates have aria-label="Main navigation"', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing aria-label`).toContain('aria-label="Main navigation"');
    }
  });

  it('all V7.2.5 navbar templates include type="button" on mobile toggle', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing type="button"`).toContain('type="button"');
    }
  });

  it('all V7.2.5 navbar templates include focus-visible:ring on nav elements', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing focus-visible:ring`).toContain('focus-visible:ring');
    }
  });

  it('all V7.2.5 navbar templates have aria-hidden="true" on icons', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing aria-hidden`).toContain('aria-hidden="true"');
    }
  });

  it('all V7.2.5 navbar templates have aria-expanded on mobile toggle', async () => {
    const { DIVERSITY_TEMPLATES } = await import('../../components/diversity-templates.js');
    const ids = ['navbar-navigation-v1','navbar-navigation-v2','navbar-navigation-v3','navbar-navigation-enterprise-v1','navbar-navigation-saas-v1'];
    for (const id of ids) {
      const t = DIVERSITY_TEMPLATES.find(t => t.id === id)!;
      expect(t.standaloneCode, `${id} missing aria-expanded`).toContain('aria-expanded');
    }
  });
});

// ── Phase 8 — Recommendation engine ──────────────────────────────────────────

describe('Phase 8 — recommendBestComponents navbar upgrade', () => {
  it('navbar section primary includes NavigationMenu', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.primary).toContain('NavigationMenu');
  });

  it('navbar section primary includes Sheet', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.primary).toContain('Sheet');
  });

  it('navbar section primary includes NavigationMenuList', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.primary).toContain('NavigationMenuList');
  });

  it('navbar section primary includes Button', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.primary).toContain('Button');
  });

  it('navbar section secondary includes NavigationMenuTrigger', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.secondary).toContain('NavigationMenuTrigger');
  });

  it('navbar section secondary includes NavigationMenuContent', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.secondary).toContain('NavigationMenuContent');
  });

  it('navbar rationale mentions NavigationMenu', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.rationale).toContain('NavigationMenu');
  });

  it('navbar rationale mentions Sheet', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.rationale).toContain('Sheet');
  });

  it('navbar rationale mentions aria-label', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    expect(r.rationale).toContain('aria-label');
  });

  it('linear DNA adds NavigationMenu to secondary for non-navbar sections', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'features', dna: { linear: 100 } });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('NavigationMenu');
  });

  it('vercel DNA adds NavigationMenu to non-navbar sections', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'pricing', dna: { vercel: 100 } });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('NavigationMenu');
  });

  it('stripe DNA adds NavigationMenu to non-navbar sections', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'features', dna: { stripe: 100 } });
    const all = [...r.primary, ...r.secondary];
    expect(all).toContain('NavigationMenu');
  });

  it('no component appears in both primary and secondary for navbar', () => {
    const r = recommendBestComponents({ industry: [], sectionType: 'navbar', dna: {} });
    const primarySet = new Set(r.primary);
    for (const c of r.secondary) {
      expect(primarySet.has(c)).toBe(false);
    }
  });
});

// ── Phase 9 — Telemetry: navigationQuality ───────────────────────────────────

describe('Phase 9 — navigationQuality telemetry', () => {
  beforeEach(() => {
    resetNavigationQualityMetrics();
  });

  it('starts with zero tracked builds', () => {
    const m = getNavigationQualityMetrics();
    expect(m.totalBuildsTracked).toBe(0);
  });

  it('starts with averageNavbarScore 0', () => {
    const m = getNavigationQualityMetrics();
    expect(m.averageNavbarScore).toBe(0);
  });

  it('tracks a single recorded navigation score', () => {
    recordNavigationScore({ score: 8, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    const m = getNavigationQualityMetrics();
    expect(m.totalBuildsTracked).toBe(1);
    expect(m.averageNavbarScore).toBe(8);
  });

  it('averageNavbarScore is correct for multiple values', () => {
    recordNavigationScore({ score: 6, usesNavigationMenu: true, usesSheetMobile: false, hasAriaLabel: true, hasFocusVisible: false, hasMobileToggle: false });
    recordNavigationScore({ score: 8, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    const m = getNavigationQualityMetrics();
    expect(m.averageNavbarScore).toBe(7);
  });

  it('navigationMenuUsage is 100% when all builds use NavigationMenu', () => {
    for (let i = 0; i < 5; i++) {
      recordNavigationScore({ score: 9, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    }
    const m = getNavigationQualityMetrics();
    expect(m.navigationMenuUsage).toBe(100);
  });

  it('navigationMenuUsage is 0% when no builds use NavigationMenu', () => {
    for (let i = 0; i < 5; i++) {
      recordNavigationScore({ score: 2, usesNavigationMenu: false, usesSheetMobile: false, hasAriaLabel: false, hasFocusVisible: false, hasMobileToggle: false });
    }
    const m = getNavigationQualityMetrics();
    expect(m.navigationMenuUsage).toBe(0);
  });

  it('sheetUsage is 50% when half of builds use Sheet', () => {
    recordNavigationScore({ score: 8, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    recordNavigationScore({ score: 3, usesNavigationMenu: false, usesSheetMobile: false, hasAriaLabel: false, hasFocusVisible: false, hasMobileToggle: false });
    const m = getNavigationQualityMetrics();
    expect(m.sheetUsage).toBe(50);
  });

  it('accessibilityCompliance is 100% when all builds have aria-label', () => {
    for (let i = 0; i < 4; i++) {
      recordNavigationScore({ score: 8, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    }
    const m = getNavigationQualityMetrics();
    expect(m.accessibilityCompliance).toBe(100);
  });

  it('recentScores shows last 5 scores', () => {
    for (let i = 1; i <= 7; i++) {
      recordNavigationScore({ score: i, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    }
    const m = getNavigationQualityMetrics();
    expect(m.recentScores).toHaveLength(5);
    expect(m.recentScores[4]).toBe(7);
  });

  it('caps history at 100 entries', () => {
    for (let i = 0; i < 120; i++) {
      recordNavigationScore({ score: 5, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    }
    const m = getNavigationQualityMetrics();
    expect(m.totalBuildsTracked).toBeLessThanOrEqual(100);
  });

  it('resetNavigationQualityMetrics clears all state', () => {
    recordNavigationScore({ score: 9, usesNavigationMenu: true, usesSheetMobile: true, hasAriaLabel: true, hasFocusVisible: true, hasMobileToggle: true });
    resetNavigationQualityMetrics();
    const m = getNavigationQualityMetrics();
    expect(m.totalBuildsTracked).toBe(0);
    expect(m.averageNavbarScore).toBe(0);
    expect(m.navigationMenuUsage).toBe(0);
  });

  it('getNavigationQualityMetrics includes all expected keys', () => {
    const m = getNavigationQualityMetrics();
    expect(m).toHaveProperty('averageNavbarScore');
    expect(m).toHaveProperty('navigationMenuUsage');
    expect(m).toHaveProperty('sheetUsage');
    expect(m).toHaveProperty('accessibilityCompliance');
    expect(m).toHaveProperty('focusVisibleCompliance');
    expect(m).toHaveProperty('mobileToggleCompliance');
    expect(m).toHaveProperty('totalBuildsTracked');
    expect(m).toHaveProperty('recentScores');
  });
});
