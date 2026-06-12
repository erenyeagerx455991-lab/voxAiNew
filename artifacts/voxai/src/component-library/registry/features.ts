import type { ComponentDef } from '../types';

export const featuresComponents: ComponentDef[] = [
  {
    id: 'features-grid-v1',
    name: 'Features Grid V1',
    category: 'features',
    style: 'glassmorphism',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'],
    tags: ['grid', '3-col', 'glassmorphism', 'icons', 'dark'],
    description: 'Dark 3-column feature cards grid with glass effect, icon divs, hover animations',
    priority: 10,
    standaloneCode: `function FeaturesGridV1() {
  const features = [
    { icon: '◆', color: 'from-violet-500 to-purple-600', title: 'AI-Powered', desc: 'Smart automation that learns from your workflow and adapts in real-time.' },
    { icon: '↗', color: 'from-blue-500 to-cyan-500', title: 'Lightning Fast', desc: 'Built on edge infrastructure with sub-50ms response times globally.' },
    { icon: '▸', color: 'from-emerald-500 to-teal-500', title: 'Secure by Default', desc: 'End-to-end encryption, SOC 2 compliant, with zero data retention.' },
    { icon: '◈', color: 'from-pink-500 to-rose-500', title: 'One-Click Deploy', desc: 'Ship to production instantly with our automated CI/CD pipeline.' },
    { icon: '◉', color: 'from-amber-500 to-orange-500', title: 'Real-time Sync', desc: 'Changes propagate instantly across all connected clients and devices.' },
    { icon: '◐', color: 'from-indigo-500 to-violet-500', title: 'Infinite Scale', desc: 'Auto-scales from 1 to 10 million users without configuration.' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d1a] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Features</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Everything you need to ship
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            A complete toolkit for modern teams who want to move fast without breaking things.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 hover:bg-white/8 transition-all duration-300 group">
              <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${f.color} flex items-center justify-center text-white font-bold text-lg mb-4 group-hover:scale-110 transition-transform\`}>
                {f.icon}
              </div>
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
    id: 'features-bento-v2',
    name: 'Features Bento V2',
    category: 'features',
    style: 'modern',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup'],
    tags: ['bento', 'grid', 'large-cards', 'mixed-layout', 'dark'],
    description: 'Bento-style grid with varying card sizes, featured card + supporting cards',
    priority: 9,
    standaloneCode: `function FeaturesBentoV2() {
  return (
    <section className="py-24 bg-[#09090f]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built different.<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Works better.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Every feature is crafted to maximize your team's output without the complexity.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-500/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Core Feature</span>
            <h3 className="text-white text-3xl font-bold mt-3 mb-3">AI Code Generation</h3>
            <p className="text-gray-400 leading-relaxed max-w-md">
              Our AI understands your intent and writes production-ready code in React, Vue, or plain HTML — with tests included.
            </p>
            <div className="mt-6 flex gap-2">
              {['React', 'Vue', 'TypeScript', 'Tailwind'].map(t => (
                <span key={t} className="bg-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-3xl p-6">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 text-lg font-bold mb-4">↗</div>
            <h3 className="text-white text-xl font-bold mb-2">One-click Deploy</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Push to production in under 10 seconds. No config needed.</p>
          </div>
          <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 border border-pink-500/20 rounded-3xl p-6">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 text-lg font-bold mb-4">◆</div>
            <h3 className="text-white text-xl font-bold mb-2">Smart Templates</h3>
            <p className="text-gray-400 text-sm leading-relaxed">500+ premium templates for every industry and use case.</p>
          </div>
          <div className="md:col-span-2 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/20 rounded-3xl p-6">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 text-lg font-bold mb-4">◉</div>
            <h3 className="text-white text-xl font-bold mb-2">Real-time Collaboration</h3>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">Work together with your team in real-time — see cursors, edits, and comments live.</p>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-list-v3',
    name: 'Features List V3',
    category: 'features',
    style: 'minimal',
    theme: 'light',
    industries: ['agency', 'portfolio', 'restaurant', 'healthcare', 'education'],
    tags: ['list', 'light', 'minimal', 'checkmarks', 'split-layout'],
    description: 'Light split-layout with feature list, checkmarks, and side visual',
    priority: 7,
    standaloneCode: `function FeaturesListV3() {
  const features = [
    'Fully responsive on all devices and screen sizes',
    'SEO optimized with semantic HTML structure',
    'Lightning-fast load times under 2 seconds',
    'Accessible design meeting WCAG 2.1 AA standards',
    'Integrated analytics and conversion tracking',
    'A/B testing and personalization built-in',
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-violet-600 text-sm font-bold uppercase tracking-widest">Why choose us</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
              Everything your business needs to grow online
            </h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed">
              We've built every feature you need to attract customers, convert visitors, and retain clients.
            </p>
            <div className="flex flex-col gap-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-gray-700 text-sm leading-relaxed">{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-violet-500 to-blue-500 rounded-2xl shadow-xl shadow-violet-200 opacity-80" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
