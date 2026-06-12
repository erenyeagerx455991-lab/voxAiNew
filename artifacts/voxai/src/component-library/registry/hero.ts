import type { ComponentDef } from '../types';

export const heroComponents: ComponentDef[] = [
  {
    id: 'hero-saas-v1',
    name: 'Hero SaaS V1',
    category: 'hero',
    style: 'glassmorphism',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'],
    tags: ['gradient', 'glassmorphism', 'stats', 'badge', 'dark', 'premium'],
    description: 'Dark SaaS hero with badge pill, gradient headline, dual CTAs, stats row',
    priority: 10,
    standaloneCode: `function HeroSaasV1() {
  const stats = [
    { value: '50K+', label: 'Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '4.9★', label: 'Rating' },
  ];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0d0d1a] pt-20">
      <div className="inline-flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold px-4 py-2 rounded-full mb-8">
        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
        Powered by Advanced AI
      </div>
      <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6 max-w-5xl">
        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">
          Build Smarter
        </span>
        <br />
        <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Ship Faster
        </span>
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
        The all-in-one platform that turns your ideas into production-ready products. No code required.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold px-8 py-4 rounded-full hover:opacity-90 transition-all text-base">
          Start for free →
        </button>
        <button className="border border-white/20 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">
          Watch demo
        </button>
      </div>
      <div className="flex items-center gap-12">
        {stats.map(s => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-ai-v2',
    name: 'Hero AI V2',
    category: 'hero',
    style: 'modern',
    theme: 'dark',
    industries: ['ai', 'saas', 'startup'],
    tags: ['ai', 'typewriter', 'gradient', 'dark', 'animated'],
    description: 'AI-focused hero with animated gradient orbs, feature chips, bold CTA',
    priority: 9,
    standaloneCode: `function HeroAiV2() {
  const [wordIdx, setWordIdx] = React.useState(0);
  const words = ['Websites', 'Dashboards', 'Landing Pages', 'Portfolios'];
  React.useEffect(() => {
    const t = setInterval(() => setWordIdx(i => (i + 1) % words.length), 2500);
    return () => clearInterval(t);
  }, []);
  const chips = ['GPT-4 Powered', 'No-Code', 'Deploy in Seconds', 'Custom Domains'];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#050510] relative overflow-hidden pt-16">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-gray-300 text-xs font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
          <span className="text-emerald-400">◆</span>
          AI-Native Website Builder — Try it free
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl">
          <span className="text-white">Generate </span>
          <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 bg-clip-text text-transparent">
            {words[wordIdx]}
          </span>
          <br />
          <span className="text-white">with AI</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
          Describe your vision in plain English. Our AI builds a complete, beautiful website in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {chips.map(c => (
            <span key={c} className="bg-white/5 border border-white/10 text-gray-300 text-xs font-medium px-4 py-2 rounded-full">
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition-all text-base">
            Build my website →
          </button>
          <button className="border border-white/15 text-gray-300 font-medium px-8 py-4 rounded-2xl hover:border-white/30 transition-all text-base">
            See examples
          </button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-minimal-v3',
    name: 'Hero Minimal V3',
    category: 'hero',
    style: 'minimal',
    theme: 'light',
    industries: ['portfolio', 'agency', 'restaurant', 'ecommerce'],
    tags: ['light', 'clean', 'minimal', 'centered'],
    description: 'Light minimal hero with clean typography, simple CTA, subtle gradient',
    priority: 8,
    standaloneCode: `function HeroMinimalV3() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-b from-gray-50 to-white pt-16">
      <span className="text-violet-600 text-sm font-semibold uppercase tracking-widest mb-4">Design Studio</span>
      <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6 max-w-3xl">
        We craft digital experiences that
        <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent"> matter</span>
      </h1>
      <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
        Award-winning design studio specializing in brand identity, web design, and digital strategy for forward-thinking companies.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-8 py-4 rounded-full transition-colors text-base">
          View our work →
        </button>
        <button className="border border-gray-300 text-gray-700 font-semibold px-8 py-4 rounded-full hover:border-gray-400 transition-all text-base">
          Get in touch
        </button>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <div className="flex -space-x-2">
          {['bg-violet-400','bg-blue-400','bg-emerald-400','bg-pink-400'].map((c,i) => (
            <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white`} />
          ))}
        </div>
        <span>Trusted by 200+ clients worldwide</span>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'hero-ecommerce-v4',
    name: 'Hero Ecommerce V4',
    category: 'hero',
    style: 'bold',
    theme: 'dark',
    industries: ['ecommerce', 'startup', 'generic'],
    tags: ['ecommerce', 'product', 'bold', 'split-layout', 'dark'],
    description: 'Bold ecommerce hero with product showcase, discount badge, urgency CTA',
    priority: 7,
    standaloneCode: `function HeroEcommerceV4() {
  return (
    <section className="min-h-screen flex items-center bg-gradient-to-br from-[#0f0a1e] via-[#1a0f2e] to-[#0a0a1e] px-6 pt-20">
      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold px-4 py-2 rounded-full mb-6">
            LIMITED OFFER — 40% OFF
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
            Premium Quality<br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Delivered Fast
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Shop the latest collection with free shipping, easy returns, and 24/7 support.
          </p>
          <div className="flex gap-3 mb-8">
            <button className="bg-gradient-to-r from-orange-500 to-pink-600 text-white font-bold px-8 py-4 rounded-2xl hover:opacity-90 transition-all text-base">
              Shop Now →
            </button>
            <button className="border border-white/15 text-white font-medium px-8 py-4 rounded-2xl hover:border-white/30 transition-all">
              Browse catalog
            </button>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span>Free Shipping</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>30-Day Returns</span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span>Secure Payment</span>
          </div>
        </div>
        <div className="hidden md:flex items-center justify-center">
          <div className="w-80 h-80 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-3xl border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <div className="w-48 h-48 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl shadow-2xl shadow-orange-500/30" />
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
