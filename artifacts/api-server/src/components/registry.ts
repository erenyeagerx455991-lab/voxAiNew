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
  // ── NAVBAR ────────────────────────────────────────────────────────────────
  {
    id: 'navbar-modern-v1', name: 'Navbar Modern', category: 'navbar',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['sticky', 'blur', 'dark'],
    description: 'Dark sticky navbar with blur, links, gradient CTA', priority: 9,
    standaloneCode: `function Navbar() {
  const links = ['Features', 'Pricing', 'Docs', 'Blog'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-white font-bold text-lg">SITE_NAME</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">{l}</a>)}
        </div>
        <button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
          Get Started →
        </button>
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-6xl mx-auto px-8 flex items-center justify-between h-20">
        <span className="font-bold text-xl tracking-tight">SITE_NAME</span>
        <div className="hidden md:flex items-center gap-10">
          {links.map(l => <a key={l} href="#" className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity">{l}</a>)}
        </div>
        <a href="#contact" className="text-sm font-semibold underline underline-offset-4">Let's talk →</a>
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
  const stats = [{ value: '50K+', label: 'Users' }, { value: '99.9%', label: 'Uptime' }, { value: '4.9★', label: 'Rating' }];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a] pt-20">
      <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-8">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        HEADLINE_BADGE
      </div>
      <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6 max-w-5xl">
        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">HEADLINE_LINE1</span>
        <br />
        <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">HEADLINE_LINE2</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">SUBHEADLINE</p>
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all text-base">CTA_PRIMARY</button>
        <button className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">CTA_SECONDARY</button>
      </div>
      <div className="flex items-center gap-12">
        {stats.map(s => <div key={s.label} className="text-center"><div className="text-2xl font-black text-white">{s.value}</div><div className="text-xs text-gray-500 mt-1">{s.label}</div></div>)}
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
          <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-10 py-4 rounded-sm transition-all text-sm tracking-wider uppercase">Reserve a Table</button>
          <button className="border border-stone-500 text-stone-300 font-medium px-10 py-4 rounded-sm hover:border-stone-300 transition-all text-sm tracking-wider uppercase">View Menu</button>
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
            <button className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all text-sm">View Work</button>
            <button className="border border-white/20 text-white font-medium px-8 py-4 rounded-full hover:bg-white/5 transition-all text-sm">Contact</button>
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
          <button className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition-all">CTA_PRIMARY</button>
          <button className="border border-white/15 text-gray-300 font-medium px-8 py-4 rounded-2xl hover:border-white/30 transition-all">CTA_SECONDARY</button>
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
  const logos = ['Vercel', 'Stripe', 'Linear', 'Notion', 'Figma', 'Loom', 'Raycast', 'Arc'];
  return (
    <section className="py-16 border-y border-white/5 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-gray-500 text-xs font-semibold tracking-widest uppercase mb-10">Trusted by teams at</p>
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
          <div className="md:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-violet-500/40 transition-all group min-h-[260px] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 mb-5 flex items-center justify-center text-white font-bold">✦</div>
              <h3 className="text-white font-bold text-2xl mb-2">FEATURE_LARGE_1_TITLE</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">FEATURE_LARGE_1_DESC</p>
            </div>
            <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold mt-6 group-hover:gap-3 transition-all">Learn more →</div>
          </div>
          <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-blue-500/40 transition-all group min-h-[260px] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-5 flex items-center justify-center text-white font-bold">◈</div>
              <h3 className="text-white font-bold text-2xl mb-2">FEATURE_LARGE_2_TITLE</h3>
              <p className="text-gray-400 text-sm leading-relaxed">FEATURE_LARGE_2_DESC</p>
            </div>
            <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mt-6 group-hover:gap-3 transition-all">Learn more →</div>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-emerald-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-5 flex items-center justify-center text-white font-bold">▸</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_1_TITLE</h3>
            <p className="text-gray-400 text-sm leading-relaxed">FEATURE_SMALL_1_DESC</p>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-pink-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 mb-5 flex items-center justify-center text-white font-bold">◆</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_2_TITLE</h3>
            <p className="text-gray-400 text-sm leading-relaxed">FEATURE_SMALL_2_DESC</p>
          </div>
          <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-amber-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 mb-5 flex items-center justify-center text-white font-bold">◉</div>
            <h3 className="text-white font-bold text-xl mb-2">FEATURE_SMALL_3_TITLE</h3>
            <p className="text-gray-400 text-sm leading-relaxed">FEATURE_SMALL_3_DESC</p>
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
    { icon: '◆', color: 'from-violet-500 to-purple-600', title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC' },
    { icon: '↗', color: 'from-blue-500 to-cyan-500', title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC' },
    { icon: '▸', color: 'from-emerald-500 to-teal-500', title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC' },
    { icon: '◈', color: 'from-pink-500 to-rose-500', title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC' },
    { icon: '◉', color: 'from-amber-500 to-orange-500', title: 'FEATURE_5_TITLE', desc: 'FEATURE_5_DESC' },
    { icon: '◐', color: 'from-indigo-500 to-violet-500', title: 'FEATURE_6_TITLE', desc: 'FEATURE_6_DESC' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d1a] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">FEATURES_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">FEATURES_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300 group">
              <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${f.color} flex items-center justify-center text-white font-bold text-lg mb-4\`}>{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
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
            <button key={cat} onClick={() => setTab(i)} className={\`px-6 py-2.5 rounded-full text-sm font-semibold transition-all \${tab === i ? 'bg-amber-500 text-black' : 'border border-stone-600 text-stone-400 hover:border-stone-400'}\`}>{cat}</button>
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
              <input className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" placeholder="Full name" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Email</label>
              <input className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Date</label>
              <input type="date" className="w-full bg-stone-900 border border-stone-600 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none transition-colors" />
            </div>
            <div>
              <label className="text-stone-300 text-sm font-medium block mb-2">Guests: {guests}</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setGuests(Math.max(1,guests-1))} className="w-10 h-10 rounded-xl bg-stone-700 text-white font-bold hover:bg-stone-600 transition-colors flex items-center justify-center">-</button>
                <div className="flex-1 bg-stone-900 border border-stone-600 rounded-xl py-3 text-center text-white text-sm">{guests} {guests === 1 ? 'guest' : 'guests'}</div>
                <button onClick={() => setGuests(Math.min(12,guests+1))} className="w-10 h-10 rounded-xl bg-stone-700 text-white font-bold hover:bg-stone-600 transition-colors flex items-center justify-center">+</button>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <label className="text-stone-300 text-sm font-medium block mb-3">Preferred Time</label>
            <div className="flex flex-wrap gap-2">
              {times.map(t => <button key={t} className="px-4 py-2 rounded-xl border border-stone-600 text-stone-300 text-sm hover:border-amber-500 hover:text-amber-400 transition-all">{t}</button>)}
            </div>
          </div>
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-colors text-sm tracking-wider uppercase">Confirm Reservation</button>
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
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600" placeholder="Your name" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Email</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600" placeholder="your@email.com" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Message</label>
                <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-violet-500 outline-none transition-colors placeholder-gray-600 resize-none h-32" placeholder="Tell me about your project..." />
              </div>
              <button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity text-sm">Send Message</button>
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
            <button onClick={() => setYearly(false)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${!yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>Monthly</button>
            <button onClick={() => setYearly(true)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>Yearly <span className="text-emerald-400 text-xs">-35%</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <div key={plan.name} className={\`rounded-2xl p-6 border \${plan.popular ? 'bg-gradient-to-b from-violet-900/60 to-blue-900/40 border-violet-500 scale-105 shadow-2xl shadow-violet-500/20' : 'bg-white/5 border-white/10'}\`}>
              {plan.popular && <div className="text-center mb-4"><span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span></div>}
              <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
              <div className="mb-6 mt-3"><span className="text-4xl font-black text-white">\${plan.price}</span><span className="text-gray-500 text-sm">/mo</span></div>
              <button className={\`w-full py-3 rounded-xl font-semibold text-sm mb-6 \${plan.popular ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white' : 'border border-white/20 text-white hover:bg-white/10'}\`}>{plan.cta}</button>
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
    { name: 'Sarah Chen', role: 'CTO at Flowbase', stars: 5, quote: 'TESTIMONIAL_1' },
    { name: 'Marcus Rivera', role: 'Founder, Launchpad', stars: 5, quote: 'TESTIMONIAL_2' },
    { name: 'Priya Patel', role: 'Head of Design', stars: 5, quote: 'TESTIMONIAL_3' },
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
              <button className="bg-white text-violet-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all">CTA_PRIMARY</button>
              <button className="border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all">CTA_SECONDARY</button>
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
              <button className="w-full flex items-center justify-between px-6 py-5 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-white font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                <span className={\`text-gray-400 text-xl transition-transform duration-200 \${open === i ? 'rotate-45' : ''}\`}>+</span>
              </button>
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

export function selectTemplatesForPrompt(prompt: string, sectionOrder?: string[]): ComponentTemplate[] {
  const lower = prompt.toLowerCase();
  const detected: string[] = [];
  for (const [ind, kws] of Object.entries(INDUSTRY_MAP)) {
    if (kws.some(kw => lower.includes(kw))) detected.push(ind);
  }
  if (detected.length === 0) detected.push('generic');

  let categories: ComponentCategory[];

  if (sectionOrder && sectionOrder.length > 0) {
    // Use the blueprint's section order to determine which templates to fetch
    categories = sectionOrder
      .map(s => SECTION_TO_CATEGORY[s.toLowerCase().replace(/[^a-z]/g, '')])
      .filter((c): c is ComponentCategory => !!c);
    // Deduplicate while preserving order
    const seen = new Set<string>();
    categories = categories.filter(c => { if (seen.has(c)) return false; seen.add(c); return true; });
  } else {
    // Fallback: use prompt-based detection
    const requiredCats: ComponentCategory[] = ['navbar', 'hero', 'features', 'testimonials', 'cta', 'footer'];
    const optCats: ComponentCategory[] = [];
    if (needsPricing(prompt)) optCats.push('pricing');
    if (needsFaq(prompt)) optCats.push('faq');
    if (needsContact(prompt)) optCats.push('contact');
    categories = [...requiredCats, ...optCats];
  }

  const result: ComponentTemplate[] = [];
  for (const cat of categories) {
    const candidates = getTemplatesByCategory(cat);
    if (candidates.length === 0) continue;
    const scored = candidates.map(c => ({
      c,
      score: c.priority + c.industries.filter(i => detected.includes(i)).length * 3,
    }));
    scored.sort((a, b) => b.score - a.score);
    result.push(scored[0].c);
  }

  return result;
}

export function buildContextFromTemplates(templates: ComponentTemplate[]): string {
  return templates.map(t =>
    `### ${t.name} (${t.id})\nDescription: ${t.description}\n\nCode template:\n\`\`\`jsx\n${t.standaloneCode}\n\`\`\``
  ).join('\n\n---\n\n');
}

export { COMPONENT_TEMPLATES };
