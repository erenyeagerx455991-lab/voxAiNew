import { SECTION_TEMPLATES } from './section-templates';
import { DIVERSITY_TEMPLATES } from './diversity-templates';

export type ComponentCategory =
  | 'navbar' | 'hero' | 'features' | 'pricing'
  | 'testimonials' | 'cta' | 'footer' | 'gallery' | 'faq' | 'contact'
  | 'logo-cloud' | 'bento' | 'dashboard-preview'
  | 'menu-section' | 'chef-story' | 'reservation'
  | 'projects' | 'case-studies';

export interface ComponentTemplate {
  id: string;
  name: string;
  category: ComponentCategory;
  industries: string[];
  tags: string[];
  description: string;
  priority: number;
  standaloneCode: string;
}

const SECTION_TO_CATEGORY: Record<string, ComponentCategory> = {
  'navbar':          'navbar',
  'hero':            'hero',
  'logocloud':       'logo-cloud',
  'logo-cloud':      'logo-cloud',
  'logostrip':       'logo-cloud',
  'featuresbento':   'bento',
  'bento':           'bento',
  'features':        'features',
  'dashboardpreview':'dashboard-preview',
  'productpreview':  'dashboard-preview',
  'testimonials':    'testimonials',
  'socialproof':     'testimonials',
  'pricing':         'pricing',
  'cta':             'cta',
  'ctabanner':       'cta',
  'footer':          'footer',
  'gallery':         'gallery',
  'menu':            'menu-section',
  'menusection':     'menu-section',
  'chefstory':       'chef-story',
  'reservation':     'reservation',
  'projects':        'projects',
  'casestudies':     'case-studies',
  'contact':         'contact',
  'faq':             'faq',
};

const INDUSTRY_MAP: Record<string, string[]> = {
  saas:        ['saas', 'software', 'platform', 'tool', 'app', 'subscription', 'cloud'],
  ai:          ['ai', 'artificial intelligence', 'machine learning', 'chatbot', 'neural', 'gpt'],
  startup:     ['startup', 'launch', 'mvp', 'product', 'founder'],
  ecommerce:   ['shop', 'store', 'ecommerce', 'sell', 'buy', 'cart'],
  restaurant:  ['restaurant', 'food', 'cafe', 'menu', 'dining', 'eat'],
  portfolio:   ['portfolio', 'personal', 'freelance', 'showcase', 'work'],
  agency:      ['agency', 'studio', 'creative', 'design', 'marketing', 'branding'],
  fintech:     ['fintech', 'finance', 'bank', 'payment', 'crypto', 'trading'],
  healthcare:  ['health', 'medical', 'clinic', 'doctor', 'wellness'],
  education:   ['education', 'course', 'learning', 'school', 'teach', 'tutor'],
  fitness:     ['fitness', 'gym', 'workout', 'yoga', 'sport'],
  generic:     [],
};

function detectIndustries(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const matched: string[] = [];
  for (const [ind, kws] of Object.entries(INDUSTRY_MAP)) {
    if (kws.some(kw => lower.includes(kw))) matched.push(ind);
  }
  return matched.length > 0 ? matched : ['generic'];
}

function needsPricing(prompt: string): boolean {
  return ['pricing', 'plan', 'subscription', 'saas', 'tier'].some(k => prompt.toLowerCase().includes(k));
}

function needsFaq(prompt: string): boolean {
  return ['faq', 'question', 'support', 'saas', 'startup'].some(k => prompt.toLowerCase().includes(k));
}

function needsContact(prompt: string): boolean {
  return ['contact', 'agency', 'studio', 'portfolio', 'restaurant'].some(k => prompt.toLowerCase().includes(k));
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  // ── DIVERSITY TEMPLATES (Bento V2×6, Navbar V2×6, CTA V2×6, FAQ V2×5) ─────
  ...(DIVERSITY_TEMPLATES as ComponentTemplate[]),
  // ── SECTION V2 TEMPLATES (features/dashboard/pricing V2) ────────────────────
  ...(SECTION_TEMPLATES as ComponentTemplate[]),

  // ── NAVBAR ────────────────────────────────────────────────────────────────
  {
    id: 'navbar-modern-v1', name: 'Navbar Modern', category: 'navbar',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['sticky', 'blur', 'dark'],
    description: 'Dark sticky navbar with blur, links, gradient CTA', priority: 9,
    standaloneCode: `function Navbar() {
  const links = ['Features', 'Pricing', 'Docs', 'Blog'];
  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center" aria-hidden="true">
            <div className="w-3 h-3 bg-black rounded-sm" />
          </div>
          <span className="text-white font-bold text-lg">SITE_NAME</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href="#" className="text-white/65 hover:text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-sm px-1">{l}</a>
          ))}
        </div>
        <Button type="button" aria-label="Get started with SITE_NAME" className="bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-white/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">
          Get Started →
        </Button>
      </div>
    </nav>
  );
}`,
  },
  {
    id: 'navbar-minimal-v1', name: 'Navbar Minimal', category: 'navbar',
    industries: ['portfolio', 'agency', 'restaurant'], tags: ['minimal', 'light-compatible', 'clean'],
    description: 'Minimal navbar, no heavy blur, text links only, no CTA pill', priority: 8,
    standaloneCode: `function Navbar() {
  const links = ['Work', 'About', 'Services', 'Contact'];
  return (
    <nav aria-label="Main navigation" className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-6xl mx-auto px-8 flex items-center justify-between h-20">
        <span className="font-bold text-xl tracking-tight">SITE_NAME</span>
        <div className="hidden md:flex items-center gap-10">
          {links.map(l => (
            <a key={l} href="#" className="text-sm font-medium opacity-65 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-sm px-1">{l}</a>
          ))}
        </div>
        <a href="#contact" className="text-sm font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-sm">Let's talk →</a>
      </div>
    </nav>
  );
}`,
  },

  // ── HERO ──────────────────────────────────────────────────────────────────
  {
    id: 'hero-saas-v1', name: 'Hero SaaS', category: 'hero',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'], tags: ['gradient', 'glassmorphism', 'stats', 'badge', 'dark'],
    description: 'Dark hero with badge, gradient headline, dual CTAs, stats row', priority: 10,
    standaloneCode: `function Hero() {
  const stats = [{ value: '50K+', label: 'Active users' }, { value: '99.9%', label: 'Uptime SLA' }, { value: '4.9★', label: 'Avg rating' }];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#0a0a0a] pt-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent)]" aria-hidden="true" />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 text-white/70 text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" aria-hidden="true" />
          HEADLINE_BADGE
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
          <span className="text-white">HEADLINE_LINE1</span>
          <br />
          <span className="bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">HEADLINE_LINE2</span>
        </h1>
        <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-10 leading-relaxed">SUBHEADLINE</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button type="button" className="bg-white text-black font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-all text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_PRIMARY →</Button>
          <Button type="button" className="border border-white/20 text-white font-medium px-8 py-4 rounded-full hover:bg-white/8 transition-all text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_SECONDARY</Button>
        </div>
        <div className="flex items-center justify-center gap-12 border-t border-white/8 pt-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-restaurant-v1', name: 'Hero Restaurant', category: 'hero',
    industries: ['restaurant'], tags: ['full-bleed', 'overlay', 'minimal', 'elegant'],
    description: 'Full-bleed dark overlay hero for restaurants with tagline and reservation CTA', priority: 10,
    standaloneCode: `function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 relative overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(180,120,60,0.15)_0%,_transparent_70%)]" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-6">Est. 2018 · Fine Dining</p>
        <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tight text-white mb-6">RESTAURANT_NAME</h1>
        <p className="text-stone-300 text-xl max-w-xl mx-auto mb-12 leading-relaxed italic">TAGLINE</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button type="button" className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-sm transition-all text-sm tracking-wider uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900">Reserve a Table</Button>
          <Button type="button" className="border border-stone-500 text-stone-300 font-medium px-10 py-4 rounded-sm hover:border-stone-300 transition-all text-sm tracking-wider uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900">View Menu</Button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-portfolio-v1', name: 'Hero Portfolio', category: 'hero',
    industries: ['portfolio', 'agency'], tags: ['split', 'minimal', 'text-heavy'],
    description: 'Split-layout portfolio hero with large name, role tag, and scroll indicator', priority: 10,
    standaloneCode: `function Hero() {
  return (
    <section className="min-h-screen flex flex-col justify-center px-8 md:px-16 pt-24 bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-sm font-medium">Available for work</span>
        </div>
        <h1 className="text-7xl md:text-9xl font-black leading-none tracking-tighter text-white mb-6">
          YOUR<br /><span className="text-transparent" style={{WebkitTextStroke: '1px rgba(255,255,255,0.3)'}}>NAME</span>
        </h1>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">ROLE_DESCRIPTION</p>
          <div className="flex gap-6">
            <Button type="button" className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">View Work</Button>
            <Button type="button" className="border border-white/20 text-white font-medium px-8 py-4 rounded-full hover:bg-white/5 transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">Contact</Button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-ai-v2', name: 'Hero AI Animated', category: 'hero',
    industries: ['ai', 'saas', 'startup'], tags: ['ai', 'animated', 'gradient', 'dark'],
    description: 'AI-focused hero with animated word cycling, gradient orbs, feature chips', priority: 9,
    standaloneCode: `function Hero() {
  const [wordIdx, setWordIdx] = React.useState(0);
  const words = ['Websites', 'Dashboards', 'Landing Pages', 'Portfolios'];
  React.useEffect(() => { const t = setInterval(() => setWordIdx(i => (i + 1) % words.length), 2500); return () => clearInterval(t); }, []);
  const chips = ['GPT-4 Powered', 'No-Code', 'Deploy in Seconds'];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#050510] relative overflow-hidden pt-16">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="relative z-10">
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl">
          <span className="text-white">Generate </span>
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">{words[wordIdx]}</span>
          <br /><span className="text-white">with AI</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">SUBHEADLINE</p>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {chips.map(c => <span key={c} className="bg-white/5 border border-white/10 text-gray-300 text-xs font-medium px-4 py-2 rounded-full">{c}</span>)}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button type="button" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_PRIMARY</Button>
          <Button type="button" className="border border-white/15 text-gray-300 font-medium px-8 py-4 rounded-2xl hover:border-white/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_SECONDARY</Button>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── HERO SYSTEM V2 ─────────────────────────────────────────────────────────
  {
    id: 'hero-centered-v1', name: 'Hero Centered Premium', category: 'hero',
    industries: ['saas', 'fintech', 'ai', 'startup'], tags: ['centered', 'gradient-orbs', 'pill-cta', 'stripe-style'],
    description: 'Centered hero with layered gradient background orbs, gradient heading two-tone, pill CTAs, stat divider row. Stripe/premium-gradient DNA.',
    priority: 11,
    standaloneCode: `function Hero() {
  const stats = [{ value: '99.99%', label: 'Uptime SLA' }, { value: '$0', label: 'Setup fee' }, { value: '135+', label: 'Countries' }];
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[#0A2540]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-[#635BFF]/25 via-[#00D4FF]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00D4FF]/8 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#635BFF]/8 rounded-full blur-3xl" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 border border-[#635BFF]/40 bg-[#635BFF]/15 text-[#a9a4ff] text-xs font-semibold px-4 py-2 rounded-full mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-[#635BFF] animate-pulse" />
          HEADLINE_BADGE
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6">
          <span className="text-white">HEADLINE_LINE1</span>
          <br />
          <span className="bg-gradient-to-r from-[#635BFF] via-[#00D4FF] to-white bg-clip-text text-transparent">HEADLINE_LINE2</span>
        </h1>
        <p className="text-lg text-[#A8B4C0] max-w-2xl mx-auto mb-10 leading-relaxed">SUBHEADLINE</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button type="button" className="bg-gradient-to-r from-[#635BFF] to-[#00D4FF] text-white font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2540]">CTA_PRIMARY</Button>
          <Button type="button" className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/8 transition-all text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A2540]">CTA_SECONDARY</Button>
        </div>
        <div className="flex items-center justify-center gap-12 border-t border-white/8 pt-8">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-[#A8B4C0] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-asymmetric-v1', name: 'Hero Asymmetric Split', category: 'hero',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['asymmetric', 'two-column', 'product-mockup', 'vercel-style', 'monochrome'],
    description: 'Two-column grid: left text block (left-aligned heading + CTA), right product terminal/code mockup. Vercel/monochrome DNA. Fundamentally different from centered heroes.',
    priority: 11,
    standaloneCode: `function Hero() {
  const cmdLines = [
    { color: 'text-[#00FFF0]', text: '$ PRODUCT_COMMAND' },
    { color: 'text-white/70',  text: '✓ Connected to runtime' },
    { color: 'text-white/70',  text: '✓ Dependencies resolved' },
    { color: 'text-white/60',  text: '◆ Deploying to production...' },
    { color: 'text-green-400', text: '✓ Build complete in 0.8s' },
  ];
  const metaStats = [['10K+', 'Developers'], ['99.9%', 'Uptime'], ['50ms', 'P99 latency']];
  return (
    <section className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center min-h-[calc(100vh-80px)]">
        <div className="flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 border border-white/15 text-white/60 text-xs font-medium px-3 py-1.5 rounded-full mb-8 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FFF0]" />
            HEADLINE_BADGE
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.92] mb-6">
            <span className="text-white">HEADLINE_LINE1</span>
            <br />
            <span className="text-white/65">HEADLINE_LINE2</span>
          </h1>
          <p className="text-white/70 text-lg mb-10 max-w-md leading-relaxed">SUBHEADLINE</p>
          <div className="flex gap-3">
            <Button type="button" className="bg-white text-black font-bold px-7 py-3.5 rounded-lg hover:bg-white/90 transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_PRIMARY →</Button>
            <Button type="button" className="border border-white/15 text-white/70 font-medium px-7 py-3.5 rounded-lg hover:border-white/30 transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_SECONDARY</Button>
          </div>
          <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/8">
            {metaStats.map(([v, l]) => (
              <div key={l}>
                <div className="text-xl font-black text-white">{v}</div>
                <div className="text-xs text-white/65 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:block">
          <div className="rounded-2xl border border-white/10 bg-[#111111] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#0a0a0a]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              <div className="flex-1 bg-white/5 rounded-md h-5 mx-2" />
            </div>
            <div className="p-6 space-y-3 font-mono text-sm min-h-[220px]">
              {cmdLines.map((line, i) => (
                <div key={i} className={line.color}>{line.text}</div>
              ))}
              <div className="text-white/60 pt-2 animate-pulse">_</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-editorial-v1', name: 'Hero Editorial Typography', category: 'hero',
    industries: ['saas', 'ai', 'startup'], tags: ['editorial', 'oversized-type', 'linear-style', 'minimal', 'bottom-bar'],
    description: 'Oversized editorial heading fills the viewport as the primary visual. Subtext and CTA in a bottom bar separated by a divider. No badge, no stats block — typography IS the hero. Linear/minimal-flat DNA.',
    priority: 11,
    standaloneCode: `function Hero() {
  return (
    <section className="min-h-screen bg-[#0F0F0F] flex flex-col pt-28 pb-16 px-8 md:px-16 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center">
        <h1 className="font-bold leading-[0.90] tracking-[-0.04em] text-white mb-0"
          style={{fontSize: 'clamp(52px, 9vw, 128px)'}}>
          HEADLINE_LINE1
          <br />
          <span className="bg-gradient-to-r from-[#5E6AD2] via-[#a78bfa] to-[#ec4899] bg-clip-text text-transparent">
            HEADLINE_LINE2
          </span>
        </h1>
      </div>
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-8 pt-10 border-t border-white/8">
        <div className="max-w-xs">
          <p className="text-white/65 text-base leading-relaxed">SUBHEADLINE</p>
        </div>
        <div className="flex items-center gap-5">
          <Button type="button" className="bg-[#5E6AD2] text-white font-semibold px-7 py-3.5 rounded-full hover:bg-[#7B83E0] transition-all text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F0F0F]">CTA_PRIMARY</Button>
          <Button type="button" className="text-white/70 hover:text-white text-sm font-medium transition-colors tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 rounded-sm">CTA_SECONDARY →</Button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-dashboard-v1', name: 'Hero Dashboard Preview', category: 'hero',
    industries: ['saas', 'ai', 'startup'], tags: ['dashboard', 'product-screenshot', 'app-preview', 'bottom-mockup'],
    description: 'Compact top text block + full-width dashboard product mockup below the fold. Product UI dominates the hero. For analytics/infra/SaaS where the product IS the headline.',
    priority: 10,
    standaloneCode: `function Hero() {
  const kpis = [['2.4M', 'Requests/min'], ['99.9%', 'Success rate'], ['1.2ms', 'Avg latency']];
  const navItems = ['Dashboard', 'Analytics', 'Projects', 'Team', 'Settings'];
  const barHeights = [28, 44, 36, 52, 38, 60, 42, 56, 34, 48, 40, 64, 46, 54, 38, 50, 42, 58, 36, 52, 44, 62, 48, 38];
  return (
    <section className="min-h-screen bg-[#09090b] pt-20 pb-0 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 text-center pt-16 pb-10">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 text-xs px-4 py-2 rounded-full mb-6">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          HEADLINE_BADGE
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-none">HEADLINE_LINE1</h1>
        <p className="text-white/65 text-lg max-w-xl mx-auto mb-8">SUBHEADLINE</p>
        <div className="flex gap-3 justify-center">
          <Button type="button" className="bg-white text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-white/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_PRIMARY →</Button>
          <Button type="button" className="border border-white/10 text-white/70 font-medium px-6 py-3 rounded-xl text-sm hover:border-white/25 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_SECONDARY</Button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-t-2xl border border-white/10 border-b-0 bg-[#111113] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/8 bg-[#0d0d0f]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
            </div>
            <div className="flex-1 bg-white/5 rounded-md h-4 mx-2 max-w-48" />
          </div>
          <div className="flex h-[300px]">
            <div className="w-44 border-r border-white/8 p-4 space-y-1 shrink-0">
              {navItems.map(item => (
                <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                  <div className="w-3 h-3 rounded bg-white/10 shrink-0" />
                  <span className="text-white/65 text-xs">{item}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 p-5 space-y-3 overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                {kpis.map(([v, l]) => (
                  <div key={l} className="bg-white/5 rounded-xl p-4 border border-white/8">
                    <div className="text-xs text-white/60 mb-1">{l}</div>
                    <div className="text-2xl font-black text-white">{v}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/8 flex items-end gap-0.5">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-white/15 hover:bg-white/30 transition-colors"
                    style={{height: h + 'px'}} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-bento-v1', name: 'Hero Bento Grid', category: 'hero',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['bento', 'grid', 'framer-style', 'card-mosaic', 'magazine'],
    description: 'Bento grid layout where the hero IS a mosaic of cards — headline card, feature card, stats card, integration card, CTA card. No traditional centered block. Framer/expressive DNA.',
    priority: 10,
    standaloneCode: `function Hero() {
  const integrations = ['Figma', 'React', 'GitHub', 'Vercel', 'Slack'];
  const stats = [['10K+', 'Teams'], ['99.9%', 'SLA'], ['4.9★', 'Rating']];
  return (
    <section className="min-h-screen bg-[#0c0c0f] pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-none mb-3">HEADLINE_LINE1</h1>
          <p className="text-white/65 text-base max-w-lg mx-auto">SUBHEADLINE</p>
        </div>
        <div className="grid grid-cols-12 gap-3" style={{gridTemplateRows: 'repeat(3, auto)'}}>
          <div className="col-span-12 md:col-span-5 row-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden min-h-[260px] hover:scale-[1.01] transition-transform">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/15 rounded-full blur-2xl -translate-y-12 translate-x-12" aria-hidden="true" />
            <div>
              <div className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">FEATURE_LABEL</div>
              <p className="text-white text-2xl font-bold leading-tight">HEADLINE_LINE2</p>
            </div>
            <Button type="button" className="bg-white text-violet-700 font-bold text-sm px-6 py-3 rounded-2xl w-fit hover:bg-white/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-600">CTA_PRIMARY →</Button>
          </div>
          <div className="col-span-12 md:col-span-4 bg-[#18181b] border border-white/10 rounded-3xl p-6 flex items-center gap-4 hover:border-white/20 transition-colors">
            {stats.map(([v, l]) => (
              <div key={l} className="text-center flex-1">
                <div className="text-xl font-black text-white">{v}</div>
                <div className="text-white/60 text-xs mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="col-span-12 md:col-span-3 bg-[#18181b] border border-white/10 rounded-3xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors min-h-[120px]">
            <div className="text-white/65 text-xs font-semibold uppercase tracking-widest">Integrations</div>
            <div className="flex flex-wrap gap-1.5">
              {integrations.map(i => (
                <span key={i} className="bg-white/8 text-white/70 text-xs px-2.5 py-1 rounded-lg">{i}</span>
              ))}
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 bg-[#18181b] border border-white/10 rounded-3xl p-6 flex items-center justify-between gap-4 hover:border-white/20 transition-colors">
            <div>
              <div className="text-white font-semibold text-sm mb-1">Ready to ship faster?</div>
              <div className="text-white/60 text-xs">No setup required. Free plan forever.</div>
            </div>
            <Button type="button" className="border border-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-2xl hover:bg-white/8 transition-all shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black">CTA_SECONDARY →</Button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-story-v1', name: 'Hero Narrative Story', category: 'hero',
    industries: ['agency', 'portfolio', 'startup'], tags: ['narrative', 'editorial', 'light-bg', 'agency-style', 'service-tags'],
    description: 'Light-background agency/narrative hero. Eyebrow label + rule, oversized editorial heading, bottom divider bar with subtext left / service tags center / CTA right. No badge, no stats grid.',
    priority: 10,
    standaloneCode: `function Hero() {
  const services = ['Brand Strategy', 'Web Design', 'Motion', 'Development'];
  return (
    <section className="min-h-screen bg-[#f5f5f0] flex flex-col pt-28 px-8 md:px-20">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-px bg-gray-800" />
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">TAGLINE</span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="font-black leading-[0.88] tracking-[-0.04em] text-gray-900 max-w-5xl mb-12"
            style={{fontSize: 'clamp(44px, 7.5vw, 112px)'}}>
            HEADLINE_LINE1
            <br />
            <span className="text-gray-300">HEADLINE_LINE2</span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-end gap-8 border-t-2 border-gray-900 pt-8">
            <p className="text-gray-500 text-base leading-relaxed max-w-xs">SUBHEADLINE</p>
            <div className="flex gap-2 flex-wrap md:mx-auto">
              {services.map(s => (
                <span key={s} className="text-xs font-semibold tracking-widest uppercase text-gray-400 border border-gray-200 px-4 py-2 rounded-full">{s}</span>
              ))}
            </div>
            <div className="md:ml-auto shrink-0">
              <Button type="button" className="bg-gray-900 text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-gray-700 transition-all">CTA_PRIMARY →</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── LOGO CLOUD ─────────────────────────────────────────────────────────────
  {
    id: 'logo-cloud-v1', name: 'Logo Cloud', category: 'logo-cloud',
    industries: ['saas', 'ai', 'startup', 'agency', 'generic'], tags: ['social-proof', 'brands', 'minimal'],
    description: 'Trusted-by logo strip with company name pills', priority: 9,
    standaloneCode: `function LogoCloud() {
  // REQUIRED: Replace each LOGO_COMPANY_N with a real company name that would actually use this product.
  // Match the industry — a restaurant SaaS shows restaurant chains; a DevOps tool shows tech companies.
  const logos = ['LOGO_COMPANY_1', 'LOGO_COMPANY_2', 'LOGO_COMPANY_3', 'LOGO_COMPANY_4', 'LOGO_COMPANY_5', 'LOGO_COMPANY_6', 'LOGO_COMPANY_7', 'LOGO_COMPANY_8'];
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-gray-500 text-xs font-semibold tracking-widest uppercase mb-10">LOGO_CLOUD_LABEL</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map(logo => (
            <span key={logo} className="text-gray-600 hover:text-gray-400 font-semibold text-sm tracking-wide transition-colors select-none">{logo}</span>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── FEATURES BENTO ────────────────────────────────────────────────────────
  {
    id: 'features-bento-v1', name: 'Features Bento Grid', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['bento', 'asymmetric', 'dark', 'modern'],
    description: 'Asymmetric bento grid layout for features — like Linear/Vercel', priority: 10,
    standaloneCode: `function FeaturesBento() {
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">BENTO_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">BENTO_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 bg-white/5 border border-white/8 rounded-2xl p-8 hover:border-white/20 transition-all group min-h-[260px] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 mb-5 flex items-center justify-center text-white font-bold" aria-hidden="true">✦</div>
              <h3 className="text-white font-bold text-2xl mb-2">FEATURE_LARGE_1_TITLE</h3>
              <p className="text-gray-400 text-base leading-relaxed max-w-sm">FEATURE_LARGE_1_DESC</p>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-semibold mt-6 group-hover:gap-3 transition-all">Learn more →</div>
          </div>
          <div className="md:col-span-5 bg-white/5 border border-white/8 rounded-2xl p-8 hover:border-white/20 transition-all group min-h-[260px] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 mb-5 flex items-center justify-center text-white font-bold" aria-hidden="true">◈</div>
              <h3 className="text-white font-bold text-2xl mb-2">FEATURE_LARGE_2_TITLE</h3>
              <p className="text-gray-400 text-base leading-relaxed">FEATURE_LARGE_2_DESC</p>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm font-semibold mt-6 group-hover:gap-3 transition-all">Learn more →</div>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/8 rounded-2xl p-8 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 mb-5 flex items-center justify-center text-white font-bold" aria-hidden="true">▸</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_1_TITLE</h3>
            <p className="text-gray-400 text-base leading-relaxed">FEATURE_SMALL_1_DESC</p>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/8 rounded-2xl p-8 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 mb-5 flex items-center justify-center text-white font-bold" aria-hidden="true">◆</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_2_TITLE</h3>
            <p className="text-gray-400 text-base leading-relaxed">FEATURE_SMALL_2_DESC</p>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/8 rounded-2xl p-8 hover:border-white/20 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 mb-5 flex items-center justify-center text-white font-bold" aria-hidden="true">◉</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_3_TITLE</h3>
            <p className="text-gray-400 text-base leading-relaxed">FEATURE_SMALL_3_DESC</p>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── FEATURES GRID ─────────────────────────────────────────────────────────
  {
    id: 'features-grid-v1', name: 'Features Grid', category: 'features',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['grid', '3-col', 'glassmorphism', 'dark'],
    description: 'Dark 3-column feature cards grid with glass effect', priority: 10,
    standaloneCode: `function Features() {
  const features = [
    { icon: '◆', title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC' },
    { icon: '↗', title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC' },
    { icon: '▸', title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC' },
    { icon: '◈', title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC' },
    { icon: '◉', title: 'FEATURE_5_TITLE', desc: 'FEATURE_5_DESC' },
    { icon: '◐', title: 'FEATURE_6_TITLE', desc: 'FEATURE_6_DESC' },
  ];
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">FEATURES_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">FEATURES_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/8 rounded-2xl p-6 hover:border-white/20 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white font-bold text-lg mb-4" aria-hidden="true">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-base leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── DASHBOARD PREVIEW ─────────────────────────────────────────────────────
  {
    id: 'dashboard-preview-v1', name: 'Dashboard Preview', category: 'dashboard-preview',
    industries: ['saas', 'ai', 'fintech', 'startup'], tags: ['product-shot', 'mockup', 'dark'],
    description: 'Product/dashboard UI mockup section with decorative browser frame', priority: 9,
    standaloneCode: `function DashboardPreview() {
  const metrics = [{ label: 'Revenue', value: '$124K', change: '+18%', up: true }, { label: 'Users', value: '8,402', change: '+32%', up: true }, { label: 'Churn', value: '1.2%', change: '-0.4%', up: false }];
  const rows = ['ITEM_1', 'ITEM_2', 'ITEM_3', 'ITEM_4'];
  return (
    <section className="py-24 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">PREVIEW_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">PREVIEW_SUBHEADING</p>
        </div>
        <div className="relative rounded-2xl border border-white/10 bg-[#111118] overflow-hidden shadow-2xl shadow-black/60">
          <div className="bg-[#0d0d14] border-b border-white/5 px-5 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <div className="ml-4 bg-white/5 rounded-md px-4 py-1 text-gray-500 text-xs">app.SITE_NAME.com/dashboard</div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {metrics.map((m, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-gray-500 text-xs mb-1">{m.label}</p>
                  <p className="text-white font-black text-2xl">{m.value}</p>
                  <p className={\`text-xs mt-1 font-medium \${m.up ? 'text-emerald-400' : 'text-rose-400'}\`}>{m.change} vs last month</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">Recent Activity</span>
                <span className="text-gray-500 text-xs">View all →</span>
              </div>
              {rows.map((row, i) => (
                <div key={i} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
                    <span className="text-gray-300 text-sm">{row}</span>
                  </div>
                  <span className="text-gray-600 text-xs">Just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── GALLERY ────────────────────────────────────────────────────────────────
  {
    id: 'gallery-v1', name: 'Photo Gallery', category: 'gallery',
    industries: ['restaurant', 'portfolio', 'agency'], tags: ['masonry', 'visual', 'grid'],
    description: 'Masonry-style photo gallery with colored placeholder tiles', priority: 9,
    standaloneCode: `function Gallery() {
  const items = [
    { color: 'from-amber-900 to-stone-800', span: 'md:col-span-2 md:row-span-2', label: 'GALLERY_ITEM_1' },
    { color: 'from-stone-700 to-stone-900', span: '', label: 'GALLERY_ITEM_2' },
    { color: 'from-amber-800 to-stone-700', span: '', label: 'GALLERY_ITEM_3' },
    { color: 'from-stone-800 to-amber-900', span: '', label: 'GALLERY_ITEM_4' },
    { color: 'from-stone-700 to-amber-800', span: '', label: 'GALLERY_ITEM_5' },
    { color: 'from-amber-700 to-stone-800', span: 'md:col-span-2', label: 'GALLERY_ITEM_6' },
  ];
  return (
    <section className="py-24 bg-stone-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">GALLERY_HEADING</h2>
          <p className="text-stone-400 text-lg">GALLERY_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[200px]">
          {items.map((item, i) => (
            <div key={i} className={\`bg-gradient-to-br \${item.color} \${item.span} rounded-2xl overflow-hidden relative group cursor-pointer\`}>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── MENU SECTION ──────────────────────────────────────────────────────────
  {
    id: 'menu-section-v1', name: 'Restaurant Menu', category: 'menu-section',
    industries: ['restaurant'], tags: ['menu', 'food', 'categories'],
    description: 'Tabbed restaurant menu with category filters and dish cards', priority: 10,
    standaloneCode: `function MenuSection() {
  const [tab, setTab] = React.useState(0);
  const categories = ['Starters', 'Mains', 'Desserts', 'Drinks'];
  const items = [
    [
      { name: 'STARTER_1', price: '$14', desc: 'STARTER_1_DESC' },
      { name: 'STARTER_2', price: '$12', desc: 'STARTER_2_DESC' },
      { name: 'STARTER_3', price: '$16', desc: 'STARTER_3_DESC' },
      { name: 'STARTER_4', price: '$11', desc: 'STARTER_4_DESC' },
    ],
    [
      { name: 'MAIN_1', price: '$32', desc: 'MAIN_1_DESC' },
      { name: 'MAIN_2', price: '$28', desc: 'MAIN_2_DESC' },
      { name: 'MAIN_3', price: '$36', desc: 'MAIN_3_DESC' },
      { name: 'MAIN_4', price: '$24', desc: 'MAIN_4_DESC' },
    ],
    [
      { name: 'DESSERT_1', price: '$10', desc: 'DESSERT_1_DESC' },
      { name: 'DESSERT_2', price: '$9', desc: 'DESSERT_2_DESC' },
    ],
    [
      { name: 'DRINK_1', price: '$8', desc: 'DRINK_1_DESC' },
      { name: 'DRINK_2', price: '$12', desc: 'DRINK_2_DESC' },
    ],
  ];
  return (
    <section className="py-24 bg-stone-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Our Menu</h2>
          <p className="text-stone-400">Crafted with seasonal ingredients</p>
        </div>
        <div className="flex justify-center gap-2 mb-12">
          {categories.map((cat, i) => (
            <Button type="button" key={cat} onClick={() => setTab(i)} className={\`px-6 py-2.5 rounded-full text-sm font-semibold transition-all \${tab === i ? 'bg-amber-500 text-black' : 'border border-stone-600 text-stone-400 hover:border-stone-400'}\`}>{cat}</Button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items[tab].map((item, i) => (
            <div key={i} className="flex items-start justify-between p-5 border border-stone-700 rounded-xl hover:border-amber-500/50 transition-all">
              <div>
                <h3 className="text-white font-semibold text-base mb-1">{item.name}</h3>
                <p className="text-stone-400 text-sm">{item.desc}</p>
              </div>
              <span className="text-amber-400 font-bold text-lg ml-4 shrink-0">{item.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── CHEF STORY ────────────────────────────────────────────────────────────
  {
    id: 'chef-story-v1', name: 'Chef Story', category: 'chef-story',
    industries: ['restaurant'], tags: ['story', 'about', 'split-layout'],
    description: 'Split-layout chef story / about section with credentials', priority: 9,
    standaloneCode: `function ChefStory() {
  const credentials = ['CREDENTIAL_1', 'CREDENTIAL_2', 'CREDENTIAL_3'];
  return (
    <section className="py-24 bg-stone-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="bg-gradient-to-br from-amber-900/60 to-stone-900 rounded-3xl aspect-square flex items-center justify-center border border-amber-500/20">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-600 to-stone-600 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-4xl font-black">C</span>
              </div>
              <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase">Head Chef</p>
            </div>
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4">The Story</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">CHEF_NAME</h2>
            <p className="text-stone-300 text-lg leading-relaxed mb-8">CHEF_BIO</p>
            <div className="flex flex-col gap-3">
              {credentials.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-stone-300 text-sm">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── RESERVATION ───────────────────────────────────────────────────────────
  {
    id: 'reservation-v1', name: 'Reservation Form', category: 'reservation',
    industries: ['restaurant'], tags: ['form', 'booking', 'dark'],
    description: 'Restaurant table reservation form with date, time, guests', priority: 10,
    standaloneCode: `function Reservation() {
  const times = ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM'];
  const [guests, setGuests] = React.useState(2);
  return (
    <section className="py-24 bg-stone-900">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-3">Reserve Your Table</h2>
          <p className="text-stone-400">We look forward to welcoming you</p>
        </div>
        <div className="bg-stone-800 border border-stone-700 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Your Name</label>
              <Input className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" placeholder="Full name" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Email</label>
              <Input className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Date</label>
              <Input type="date" className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Guests: {guests}</label>
              <div className="flex items-center gap-3">
                <Button type="button" onClick={() => setGuests(Math.max(1,guests-1))} className="w-10 h-10 rounded-xl bg-stone-700 text-white font-bold hover:bg-stone-600 transition-colors flex items-center justify-center">-</Button>
                <div className="flex-1 bg-stone-900 border border-stone-600 rounded-xl py-3 text-center text-white text-sm">{guests} {guests === 1 ? 'guest' : 'guests'}</div>
                <Button type="button" onClick={() => setGuests(Math.min(12,guests+1))} className="w-10 h-10 rounded-xl bg-stone-700 text-white font-bold hover:bg-stone-600 transition-colors flex items-center justify-center">+</Button>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <label className="text-stone-300 text-sm font-medium block mb-3">Preferred Time</label>
            <div className="flex flex-wrap gap-2">
              {times.map(t => <Button type="button" key={t} className="px-4 py-2 rounded-xl border border-stone-600 text-stone-300 text-sm hover:border-amber-500 hover:text-amber-400 transition-all">{t}</Button>)}
            </div>
          </div>
          <Button type="button" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-colors text-sm tracking-wider uppercase">Confirm Reservation</Button>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  {
    id: 'projects-v1', name: 'Projects Grid', category: 'projects',
    industries: ['portfolio', 'agency'], tags: ['portfolio', 'work', 'hover-reveal'],
    description: 'Dark portfolio project grid with hover-reveal overlay', priority: 10,
    standaloneCode: `function Projects() {
  const projects = [
    { title: 'PROJECT_1_TITLE', tags: ['Branding', 'Web'], color: 'from-violet-900 to-indigo-900' },
    { title: 'PROJECT_2_TITLE', tags: ['UI/UX', 'Mobile'], color: 'from-blue-900 to-cyan-900' },
    { title: 'PROJECT_3_TITLE', tags: ['Full-Stack'], color: 'from-emerald-900 to-teal-900' },
    { title: 'PROJECT_4_TITLE', tags: ['Motion', 'Brand'], color: 'from-pink-900 to-rose-900' },
    { title: 'PROJECT_5_TITLE', tags: ['Web', 'Design'], color: 'from-amber-900 to-orange-900' },
    { title: 'PROJECT_6_TITLE', tags: ['Product'], color: 'from-purple-900 to-violet-900' },
  ];
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">Selected Work</h2>
            <p className="text-gray-400 mt-2">A collection of recent projects</p>
          </div>
          <a href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors hidden md:block">View all →</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((p, i) => (
            <div key={i} className={\`bg-gradient-to-br \${p.color} rounded-2xl aspect-video relative overflow-hidden group cursor-pointer border border-white/5 hover:border-white/20 transition-all\`}>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-all" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex gap-2 mb-3 translate-y-2 group-hover:translate-y-0 transition-transform">
                  {p.tags.map(tag => <span key={tag} className="bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">{tag}</span>)}
                </div>
                <h3 className="text-white font-bold text-xl">{p.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── CASE STUDIES ──────────────────────────────────────────────────────────
  {
    id: 'case-studies-v1', name: 'Case Studies', category: 'case-studies',
    industries: ['agency', 'portfolio'], tags: ['results', 'metrics', 'split'],
    description: 'Agency case study section with metrics and client results', priority: 9,
    standaloneCode: `function CaseStudies() {
  const cases = [
    { client: 'CLIENT_1', industry: 'SaaS', result: 'RESULT_1', metric: '+240%', metricLabel: 'Revenue Growth' },
    { client: 'CLIENT_2', industry: 'E-commerce', result: 'RESULT_2', metric: '3.2x', metricLabel: 'Conversion Rate' },
    { client: 'CLIENT_3', industry: 'FinTech', result: 'RESULT_3', metric: '-60%', metricLabel: 'Load Time' },
  ];
  return (
    <section className="py-24 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Results We've Delivered</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Real outcomes for real businesses</p>
        </div>
        <div className="flex flex-col gap-4">
          {cases.map((c, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row md:items-center gap-8 hover:border-white/20 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-black text-xl shrink-0">{i + 1}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-bold text-xl">{c.client}</h3>
                  <span className="bg-white/10 text-gray-400 text-xs px-3 py-1 rounded-full">{c.industry}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{c.result}</p>
              </div>
              <div className="text-center shrink-0">
                <div className="text-4xl font-black text-transparent bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text">{c.metric}</div>
                <div className="text-gray-500 text-xs mt-1">{c.metricLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── CONTACT ───────────────────────────────────────────────────────────────
  {
    id: 'contact-v1', name: 'Contact Section', category: 'contact',
    industries: ['portfolio', 'agency', 'generic'], tags: ['form', 'contact', 'split'],
    description: 'Split-layout contact section with form and contact info', priority: 9,
    standaloneCode: `function Contact() {
  return (
    <section className="py-24 bg-[#0c0c0c]" id="contact">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="text-violet-400 text-xs font-semibold tracking-widest uppercase mb-4">Get in Touch</p>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Let's work<br />together.</h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-10">CONTACT_DESCRIPTION</p>
            <div className="flex flex-col gap-4">
              <a href="mailto:hello@SITE_NAME.com" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs">@</div>
                hello@SITE_NAME.com
              </a>
              <a href="#" className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors text-sm">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs">in</div>
                LinkedIn
              </a>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Name</label>
                <Input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600" placeholder="Your name" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Email</label>
                <Input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600" placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Message</label>
                <Textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600 resize-none h-32" placeholder="Tell me about your project..." />
              </div>
              <Button type="button" className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity text-sm">Send Message</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── PRICING ───────────────────────────────────────────────────────────────
  {
    id: 'pricing-cards-v1', name: 'Pricing Cards', category: 'pricing',
    industries: ['saas', 'ai', 'startup', 'fintech'], tags: ['3-tier', 'toggle', 'dark'],
    description: 'Dark 3-tier pricing with toggle, popular card highlighted', priority: 10,
    standaloneCode: `function Pricing() {
  const [yearly, setYearly] = React.useState(false);
  const plans = [
    { name: 'Starter', price: yearly ? 0 : 0, features: ['5 projects', '10K req/mo', 'Community support'], cta: 'Start free' },
    { name: 'Pro', price: yearly ? 19 : 29, popular: true, features: ['Unlimited projects', '500K req/mo', 'Priority support', 'Custom domains', 'Analytics'], cta: 'Start free trial' },
    { name: 'Enterprise', price: yearly ? 79 : 99, features: ['Unlimited everything', 'SLA', 'Dedicated support', 'SSO & SAML'], cta: 'Contact sales' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Simple, transparent pricing</h2>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1 mt-6">
            <Button type="button" onClick={() => setYearly(false)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${!yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>Monthly</Button>
            <Button type="button" onClick={() => setYearly(true)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>Yearly <span className="text-emerald-400 text-xs">-35%</span></Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <div key={plan.name} className={\`rounded-2xl p-6 border \${plan.popular ? 'bg-gradient-to-b from-violet-900/60 to-blue-900/40 border-violet-500 scale-105 shadow-2xl shadow-violet-500/20' : 'bg-white/5 border-white/10'}\`}>
              {plan.popular && <div className="text-center mb-4"><span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span></div>}
              <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
              <div className="mb-6 mt-3"><span className="text-4xl font-black text-white">\${plan.price}</span><span className="text-gray-500 text-sm">/mo</span></div>
              <Button type="button" className={\`w-full py-3 rounded-xl font-semibold text-sm mb-6 \${plan.popular ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white' : 'border border-white/20 text-white hover:bg-white/10'}\`}>{plan.cta}</Button>
              <div className="flex flex-col gap-2.5">
                {plan.features.map((f, j) => <div key={j} className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /></div><span className="text-gray-300 text-sm">{f}</span></div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── TESTIMONIALS ──────────────────────────────────────────────────────────
  {
    id: 'testimonials-cards-v1', name: 'Testimonials Cards', category: 'testimonials',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['cards', '3-col', 'dark'],
    description: 'Dark 3-column testimonial cards with star ratings', priority: 9,
    standaloneCode: `function Testimonials() {
  const reviews = [
    // REQUIRED: Replace each TESTIMONIAL_N_* with real names, roles, and quotes specific to this product.
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', stars: 5, quote: 'TESTIMONIAL_1_QUOTE' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', stars: 5, quote: 'TESTIMONIAL_2_QUOTE' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', stars: 5, quote: 'TESTIMONIAL_3_QUOTE' },
  ];
  const colors = ['from-violet-500 to-purple-600','from-blue-500 to-cyan-500','from-emerald-500 to-teal-500'];
  const initials = name => name.split(' ').map(n => n[0]).join('');
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">TESTIMONIALS_HEADING</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex flex-col">
              <div className="flex gap-1 mb-4">{[...Array(r.stars)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}</div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={\`w-10 h-10 rounded-full bg-gradient-to-br \${colors[i]} flex items-center justify-center text-white text-sm font-bold\`}>{initials(r.name)}</div>
                <div><div className="text-white font-semibold text-sm">{r.name}</div><div className="text-gray-500 text-xs">{r.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── CTA ───────────────────────────────────────────────────────────────────
  {
    id: 'cta-gradient-v1', name: 'CTA Gradient', category: 'cta',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['gradient', 'full-width', 'dark'],
    description: 'Full-width gradient CTA with bold headline and action buttons', priority: 10,
    standaloneCode: `function CTA() {
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 p-12 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4">CTA_HEADLINE</h2>
            <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">CTA_SUBHEADLINE</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button type="button" className="bg-white text-violet-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all">CTA_PRIMARY</Button>
              <Button type="button" className="border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all">CTA_SECONDARY</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    id: 'faq-accordion-v1', name: 'FAQ Accordion', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['accordion', 'dark', 'animated'],
    description: 'Dark animated FAQ accordion', priority: 9,
    standaloneCode: `function FAQ() {
  const [open, setOpen] = React.useState(null);
  const faqs = [
    { q: 'FAQ_Q1', a: 'FAQ_A1' },
    { q: 'FAQ_Q2', a: 'FAQ_A2' },
    { q: 'FAQ_Q3', a: 'FAQ_A3' },
    { q: 'FAQ_Q4', a: 'FAQ_A4' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d1a] to-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Frequently asked questions</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <Button type="button" className="w-full flex items-center justify-between px-6 py-5 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-white font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                <span className={\`text-gray-400 text-xl transition-transform duration-200 \${open === i ? 'rotate-45' : ''}\`}>+</span>
              </Button>
              {open === i && <div className="px-6 pb-5"><p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── FOOTER ────────────────────────────────────────────────────────────────
  {
    id: 'footer-startup-v1', name: 'Footer Startup', category: 'footer',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['4-col', 'dark', 'social'],
    description: 'Dark 4-column footer with links and copyright bar', priority: 10,
    standaloneCode: `function Footer() {
  const cols = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms', 'Cookie Policy'] },
  ];
  return (
    <footer className="bg-[#050508] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="text-white font-bold text-lg block mb-4">SITE_NAME</span>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">FOOTER_TAGLINE</p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">{col.links.map(l => <li key={l}><a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
          <p className="text-gray-600 text-sm">© 2025 SITE_NAME. All rights reserved.</p>
          <div className="flex items-center gap-2 text-gray-600 text-xs"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />All systems operational</div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-minimal-v1', name: 'Footer Minimal', category: 'footer',
    industries: ['portfolio', 'agency', 'restaurant'], tags: ['minimal', 'one-row', 'dark'],
    description: 'Minimal single-row footer for portfolio and restaurant sites', priority: 8,
    standaloneCode: `function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-white font-bold text-lg">SITE_NAME</span>
        <div className="flex items-center gap-8">
          {['Work', 'About', 'Contact'].map(l => <a key={l} href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{l}</a>)}
        </div>
        <p className="text-gray-600 text-sm">© 2025 SITE_NAME</p>
      </div>
    </footer>
  );
}`,
  },
];

export function getTemplatesByCategory(category: ComponentCategory): ComponentTemplate[] {
  return COMPONENT_TEMPLATES.filter(c => c.category === category).sort((a, b) => b.priority - a.priority);
}

// Maps reference site keywords to specific hero variant IDs
const HERO_REFERENCE_MAP: Record<string, string> = {
  'stripe':   'hero-centered-v1',
  'paypal':   'hero-centered-v1',
  'square':   'hero-centered-v1',
  'braintree':'hero-centered-v1',
  'vercel':   'hero-asymmetric-v1',
  'netlify':  'hero-asymmetric-v1',
  'railway':  'hero-asymmetric-v1',
  'linear':   'hero-editorial-v1',
  'notion':   'hero-editorial-v1',
  'craft':    'hero-editorial-v1',
  'framer':   'hero-bento-v1',
  'webflow':  'hero-bento-v1',
  'figma':    'hero-bento-v1',
  'cursor':   'hero-asymmetric-v1',
  'perplexity':'hero-centered-v1',
};

// Maps reference site keywords to features section IDs (V2)
const FEATURES_REFERENCE_MAP: Record<string, string> = {
  'stripe':   'features-stripe-v1',
  'paypal':   'features-stripe-v1',
  'square':   'features-stripe-v1',
  'linear':   'features-editorial-v1',
  'notion':   'features-editorial-v1',
  'craft':    'features-editorial-v1',
  'vercel':   'features-split-v1',
  'netlify':  'features-split-v1',
  'railway':  'features-split-v1',
  'framer':   'features-framer-v1',
  'webflow':  'features-framer-v1',
  'figma':    'features-framer-v1',
};

// Maps reference site keywords to dashboard-preview section IDs (V2)
const DASHBOARD_REFERENCE_MAP: Record<string, string> = {
  'stripe':   'dashboard-revenue-v1',
  'paypal':   'dashboard-revenue-v1',
  'square':   'dashboard-revenue-v1',
  'linear':   'dashboard-kanban-v1',
  'notion':   'dashboard-kanban-v1',
  'vercel':   'dashboard-vercel-v1',
  'netlify':  'dashboard-vercel-v1',
  'railway':  'dashboard-vercel-v1',
  'framer':   'dashboard-aiflow-v1',
  'webflow':  'dashboard-aiflow-v1',
  'figma':    'dashboard-aiflow-v1',
};

// Maps reference site keywords to pricing section IDs (V2)
const PRICING_REFERENCE_MAP: Record<string, string> = {
  'stripe':   'pricing-comparison-v1',
  'paypal':   'pricing-comparison-v1',
  'square':   'pricing-comparison-v1',
  'linear':   'pricing-minimal-v1',
  'notion':   'pricing-minimal-v1',
  'craft':    'pricing-minimal-v1',
  'vercel':   'pricing-horizontal-v1',
  'netlify':  'pricing-horizontal-v1',
  'railway':  'pricing-horizontal-v1',
  'framer':   'pricing-cardstack-v1',
  'webflow':  'pricing-cardstack-v1',
  'figma':    'pricing-cardstack-v1',
};

// Phase 3 + V7.2.5 — Maps reference site keywords to navbar template IDs
// V7.2.5: All major DNA brands now route to NavigationMenu-based templates (priority 15)
const NAVBAR_REFERENCE_MAP: Record<string, string> = {
  'linear':      'navbar-navigation-v1',     // Clean SaaS NavigationMenu (Linear DNA)
  'vercel':      'navbar-navigation-v1',     // Clean SaaS NavigationMenu (Vercel DNA)
  'cursor':      'navbar-navigation-v1',     // Clean SaaS NavigationMenu
  'notion':      'navbar-navigation-saas-v1', // Badge CTA + NavigationMenu links (Notion DNA)
  'framer':      'navbar-navigation-v2',     // Mega menu 2-trigger (Framer DNA)
  'webflow':     'navbar-navigation-v2',     // Mega menu (Webflow DNA)
  'stripe':      'navbar-navigation-enterprise-v1', // Wide mega menu (Stripe DNA)
  'paypal':      'navbar-navigation-enterprise-v1', // Wide mega menu (Fintech DNA)
  'apple':       'navbar-navigation-v3',     // Enterprise 3-trigger (Apple DNA)
};

// V7.2.5 — Navbar routing by industry (when no primaryReference)
// All default to NavigationMenu-based templates
const NAVBAR_INDUSTRY_MAP: Record<string, string> = {
  'agency':     'navbar-navigation-v2',        // Mega menu creative DNA
  'portfolio':  'navbar-navigation-v1',        // Clean SaaS NavigationMenu
  'restaurant': 'navbar-navigation-saas-v1',  // Simple links NavigationMenu
  'fintech':    'navbar-navigation-enterprise-v1', // Wide mega menu
  'saas':       'navbar-navigation-v1',        // Default SaaS
  'ai':         'navbar-navigation-v1',        // Default AI
  'startup':    'navbar-navigation-saas-v1',  // Announcement badge CTA
};

// Phase 2 — Maps reference site keywords to bento template IDs (V2)
const BENTO_REFERENCE_MAP: Record<string, string> = {
  'linear':   'bento-minimal-v1',
  'vercel':   'bento-editorial-v1',
  'notion':   'bento-editorial-v1',
  'stripe':   'bento-dashboard-v1',
  'framer':   'bento-magazine-v1',
  'webflow':  'bento-magazine-v1',
  'figma':    'bento-asymmetric-v1',
};

// Phase 4 — Maps design language to CTA template IDs
const CTA_DNA_MAP: Record<string, string> = {
  'minimal-flat':     'cta-editorial-v1',
  'monochrome':       'cta-minimal-v1',
  'editorial':        'cta-editorial-v1',
  'premium-gradient': 'cta-gradient-v1',
  'bold-motion':      'cta-split-v1',
  'dev-minimal':      'cta-minimal-v1',
  'warm-organic':     'cta-story-v1',
  'luxury-editorial': 'cta-story-v1',
};

// Phase 5 — Maps design language to FAQ template IDs
const FAQ_DNA_MAP: Record<string, string> = {
  'minimal-flat':     'faq-minimal-v1',
  'monochrome':       'faq-columns-v1',
  'editorial':        'faq-columns-v1',
  'premium-gradient': 'faq-grid-v1',
  'bold-motion':      'faq-grid-v1',
  'dev-minimal':      'faq-minimal-v1',
  'warm-organic':     'faq-sidebar-v1',
  'luxury-editorial': 'faq-columns-v1',
};

// Category-aware reference lookup — routes by reference, DNA, and industry
function selectSectionByReference(
  category: ComponentCategory,
  primaryReference?: string,
  designLanguage?: string,
  detected?: string[],
): ComponentTemplate | undefined {
  const key = (primaryReference ?? '').toLowerCase().trim();
  const hasRef = key && key !== 'none';

  // Reference-based routing (highest priority)
  let id: string | undefined;
  if (hasRef) {
    if (category === 'features') id = FEATURES_REFERENCE_MAP[key];
    else if (category === 'dashboard-preview') id = DASHBOARD_REFERENCE_MAP[key];
    else if (category === 'pricing') id = PRICING_REFERENCE_MAP[key];
    else if (category === 'bento') id = BENTO_REFERENCE_MAP[key];
    else if (category === 'navbar') id = NAVBAR_REFERENCE_MAP[key];
    if (id) return COMPONENT_TEMPLATES.find(t => t.id === id && t.category === category);
  }

  // DNA-based routing for CTA and FAQ (regardless of reference)
  if (category === 'cta' && designLanguage) {
    const dnaId = CTA_DNA_MAP[designLanguage];
    if (dnaId) return COMPONENT_TEMPLATES.find(t => t.id === dnaId && t.category === category);
  }
  if (category === 'faq' && designLanguage) {
    const dnaId = FAQ_DNA_MAP[designLanguage];
    if (dnaId) return COMPONENT_TEMPLATES.find(t => t.id === dnaId && t.category === category);
  }

  // Industry-based navbar routing (when no reference match)
  if (category === 'navbar' && detected) {
    for (const ind of detected) {
      const indId = NAVBAR_INDUSTRY_MAP[ind];
      if (indId) return COMPONENT_TEMPLATES.find(t => t.id === indId && t.category === category);
    }
  }

  return undefined;
}

function selectHeroVariant(
  detected: string[],
  referenceSites: string,
  design?: HeroSelectorInput,
  primaryReference?: string,
): ComponentTemplate | undefined {

  // 0. Primary reference — direct exact lookup (HIGHEST PRIORITY, deterministic)
  if (primaryReference && primaryReference !== 'none' && primaryReference.trim() !== '') {
    const primKey = primaryReference.toLowerCase().trim();
    if (HERO_REFERENCE_MAP[primKey]) {
      const found = COMPONENT_TEMPLATES.find(t => t.id === HERO_REFERENCE_MAP[primKey]);
      if (found) return found;
    }
  }

  // 1. Industry keyword fallback (before DNA — agency/portfolio always get story hero)
  if (detected.includes('agency') || detected.includes('portfolio')) {
    const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-story-v1');
    if (t) return t;
  }

  // 2. Design DNA fallback (only reached when no primaryReference and not agency/portfolio)
  if (design) {
    const { heroStyle, designLanguage, layoutStyle, animationPersonality, decorationLevel } = design;

    // Split-layout → asymmetric two-column (Vercel-style)
    if (heroStyle === 'split-layout') {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-asymmetric-v1');
      if (t) return t;
    }

    // Bold-motion + editorial-large → bento grid (Framer-style) — check BEFORE general editorial-large
    if (heroStyle === 'editorial-large' && (designLanguage === 'bold-motion' || animationPersonality === 'expressive')) {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-bento-v1');
      if (t) return t;
    }

    // Editorial-large → oversized typography (Linear-style)
    if (heroStyle === 'editorial-large') {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-editorial-v1');
      if (t) return t;
    }

    // Premium-gradient + expressive → centered with gradient orbs (Stripe-style)
    if (heroStyle === 'centered-gradient' ||
        (designLanguage === 'premium-gradient' && animationPersonality === 'expressive')) {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-centered-v1');
      if (t) return t;
    }

    // Minimal-flat + no decoration → editorial typography
    if (designLanguage === 'minimal-flat' && decorationLevel === 'none') {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-editorial-v1');
      if (t) return t;
    }

    // Monochrome + no decoration → asymmetric
    if (designLanguage === 'monochrome' && decorationLevel === 'none') {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-asymmetric-v1');
      if (t) return t;
    }

    // Expressive + rich decoration → bento grid
    if (animationPersonality === 'expressive' && decorationLevel === 'rich' &&
        layoutStyle !== 'layered-depth') {
      const t = COMPONENT_TEMPLATES.find(t => t.id === 'hero-bento-v1');
      if (t) return t;
    }
  }

  // 3. No override — let normal scoring select
  return undefined;
}

export interface HeroSelectorInput {
  heroStyle?: string;
  designLanguage?: string;
  layoutStyle?: string;
  animationPersonality?: string;
  decorationLevel?: string;
}

export function selectTemplatesForPrompt(
  prompt: string,
  sectionOrder?: string[],
  design?: HeroSelectorInput,
  referenceSites?: string,
  primaryReference?: string,
): ComponentTemplate[] {
  const lower = prompt.toLowerCase();
  const detected: string[] = [];
  for (const [ind, kws] of Object.entries(INDUSTRY_MAP)) {
    if (kws.some(kw => lower.includes(kw))) detected.push(ind);
  }
  if (detected.length === 0) detected.push('generic');

  // Phase 8: deterministic tiebreaker seed per prompt — breaks array-position bias
  const seed = prompt.split('').reduce((a: number, c: string) => (a * 31 + c.charCodeAt(0)) & 0xffff, 0);

  // Phase 6: extract designLanguage for DNA-based routing
  const designLanguage = (design as any)?.designLanguage as string | undefined;

  let categories: ComponentCategory[];

  if (sectionOrder && sectionOrder.length > 0) {
    categories = sectionOrder
      .map(s => SECTION_TO_CATEGORY[s.toLowerCase().replace(/[^a-z]/g, '')])
      .filter((c): c is ComponentCategory => !!c);
    const seen = new Set<string>();
    categories = categories.filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
  } else {
    const requiredCats: ComponentCategory[] = ['navbar', 'hero', 'features', 'testimonials', 'cta', 'footer'];
    const optCats: ComponentCategory[] = [];
    if (needsPricing(prompt)) optCats.push('pricing');
    if (needsFaq(prompt)) optCats.push('faq');
    if (needsContact(prompt)) optCats.push('contact');
    categories = [...requiredCats, ...optCats];
  }

  // Pre-compute hero variant override (primaryReference → deterministic direct lookup)
  const heroOverride = selectHeroVariant(detected, referenceSites ?? 'none', design, primaryReference);

  const result: ComponentTemplate[] = [];
  for (const cat of categories) {
    if (cat === 'hero' && heroOverride) {
      result.push(heroOverride);
      continue;
    }

    // Phase 2-5: Reference + DNA + Industry routing for all major section categories
    if (cat === 'features' || cat === 'dashboard-preview' || cat === 'pricing' ||
        cat === 'bento' || cat === 'navbar' || cat === 'cta' || cat === 'faq') {
      const sectionOverride = selectSectionByReference(cat, primaryReference, designLanguage, detected);
      if (sectionOverride) {
        result.push(sectionOverride);
        continue;
      }
    }

    const candidates = getTemplatesByCategory(cat);
    if (candidates.length === 0) continue;
    const scored = candidates.map(c => ({
      c,
      score: c.priority + c.industries.filter(i => detected.includes(i)).length * 3,
    }));
    scored.sort((a, b) => b.score - a.score);

    // Phase 8: Break scoring ties with deterministic seed — avoids always-first-in-array bias
    const topScore = scored[0].score;
    const tied = scored.filter(s => s.score === topScore);
    const winner = tied.length > 1 ? tied[seed % tied.length] : scored[0];
    result.push(winner.c);
  }

  return result;
}

export function buildContextFromTemplates(templates: ComponentTemplate[]): string {
  return templates.map(t =>
    `### ${t.name} (${t.id})\nDescription: ${t.description}\n\nCode template:\n\`\`\`jsx\n${t.standaloneCode}\n\`\`\``
  ).join('\n\n---\n\n');
}

// ── V5.1 Named Component Aliases ──────────────────────────────────────────────
// Maps human-readable canonical names to registry template IDs.
// Used by codegen context injection so the LLM can reference components by name.
export const NAMED_COMPONENTS: Record<string, string> = {
  HeroLinear:          'hero-asymmetric-v1',   // Asymmetric split — Linear/monochrome DNA
  HeroStripe:          'hero-saas-v1',          // Centered gradient — Stripe DNA
  HeroFramer:          'hero-editorial-v1',     // Editorial bold type — Framer DNA
  PricingStripe:       'pricing-horizontal-v1', // Horizontal cards — Stripe/Vercel DNA
  PricingLinear:       'pricing-minimal-v1',    // Minimal clean — Linear DNA
  NavbarMinimal:       'navbar-minimal-v1',     // Ultra-minimal, no bg
  NavbarFloating:      'navbar-modern-v1',      // Floating pill / frosted
  DashboardAnalytics:  'dashboard-revenue-v1', // Revenue + chart metrics
  DashboardSaaS:       'dashboard-kanban-v1',  // Kanban board — Linear/SaaS DNA
};

/**
 * Returns a compact component catalogue string for injection into codegen prompts.
 * Tells the LLM which named components are available so it references them
 * rather than generating from scratch.
 */
export function getRegistryCatalogue(): string {
  const lines = Object.entries(NAMED_COMPONENTS).map(([name, id]) => {
    const tpl = COMPONENT_TEMPLATES.find(t => t.id === id);
    return tpl
      ? `• ${name} — ${tpl.description.slice(0, 80)}`
      : `• ${name} — registry alias: ${id}`;
  });
  return `## Available Component Registry (prefer these over generating from scratch)\n${lines.join('\n')}`;
}

/**
 * Resolves a named component (e.g. "HeroLinear") to its full template, or null.
 */
export function getNamedComponent(name: string): ComponentTemplate | null {
  const id = NAMED_COMPONENTS[name];
  if (!id) return null;
  return COMPONENT_TEMPLATES.find(t => t.id === id) ?? null;
}

export { COMPONENT_TEMPLATES };
