export type ComponentCategory =
  | 'navbar' | 'hero' | 'features' | 'pricing'
  | 'testimonials' | 'cta' | 'footer' | 'gallery' | 'faq' | 'contact';

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
  {
    id: 'navbar-modern-v1', name: 'Navbar Modern V1', category: 'navbar',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['sticky', 'blur', 'dark'],
    description: 'Dark sticky navbar with blur, links, gradient CTA', priority: 9,
    standaloneCode: `function NavbarModernV1() {
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
    id: 'hero-saas-v1', name: 'Hero SaaS V1', category: 'hero',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'], tags: ['gradient', 'glassmorphism', 'stats', 'badge', 'dark'],
    description: 'Dark hero with badge, gradient headline, dual CTAs, stats row', priority: 10,
    standaloneCode: `function HeroSaasV1() {
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
    id: 'hero-ai-v2', name: 'Hero AI V2', category: 'hero',
    industries: ['ai', 'saas', 'startup'], tags: ['ai', 'animated', 'gradient', 'dark'],
    description: 'AI-focused hero with animated gradient orbs, feature chips', priority: 9,
    standaloneCode: `function HeroAiV2() {
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
  {
    id: 'features-grid-v1', name: 'Features Grid V1', category: 'features',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['grid', '3-col', 'glassmorphism', 'dark'],
    description: 'Dark 3-column feature cards grid with glass effect', priority: 10,
    standaloneCode: `function FeaturesGridV1() {
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
  {
    id: 'pricing-cards-v1', name: 'Pricing Cards V1', category: 'pricing',
    industries: ['saas', 'ai', 'startup', 'fintech'], tags: ['3-tier', 'toggle', 'dark'],
    description: 'Dark 3-tier pricing with toggle, popular card highlighted', priority: 10,
    standaloneCode: `function PricingCardsV1() {
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
  {
    id: 'testimonials-cards-v1', name: 'Testimonials Cards V1', category: 'testimonials',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['cards', '3-col', 'dark'],
    description: 'Dark 3-column testimonial cards with star ratings', priority: 9,
    standaloneCode: `function TestimonialsCardsV1() {
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
  {
    id: 'cta-gradient-v1', name: 'CTA Gradient V1', category: 'cta',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['gradient', 'full-width', 'dark'],
    description: 'Full-width gradient CTA with bold headline and action buttons', priority: 10,
    standaloneCode: `function CtaGradientV1() {
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
  {
    id: 'faq-accordion-v1', name: 'FAQ Accordion V1', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['accordion', 'dark', 'animated'],
    description: 'Dark animated FAQ accordion', priority: 9,
    standaloneCode: `function FaqAccordionV1() {
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
  {
    id: 'footer-startup-v1', name: 'Footer Startup V1', category: 'footer',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['4-col', 'dark', 'social'],
    description: 'Dark 4-column footer with links and copyright bar', priority: 10,
    standaloneCode: `function FooterStartupV1() {
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
];

export function getTemplatesByCategory(category: ComponentCategory): ComponentTemplate[] {
  return COMPONENT_TEMPLATES.filter(c => c.category === category).sort((a, b) => b.priority - a.priority);
}

export function selectTemplatesForPrompt(prompt: string): ComponentTemplate[] {
  const lower = prompt.toLowerCase();
  const detected: string[] = [];
  for (const [ind, kws] of Object.entries(INDUSTRY_MAP)) {
    if (kws.some(kw => lower.includes(kw))) detected.push(ind);
  }
  if (detected.length === 0) detected.push('generic');

  const requiredCats: ComponentCategory[] = ['navbar', 'hero', 'features', 'testimonials', 'cta', 'footer'];
  const optCats: ComponentCategory[] = [];
  if (needsPricing(prompt)) optCats.push('pricing');
  if (needsFaq(prompt)) optCats.push('faq');
  if (needsContact(prompt)) optCats.push('contact');

  const allCats = [...requiredCats, ...optCats];
  const result: ComponentTemplate[] = [];

  for (const cat of allCats) {
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
