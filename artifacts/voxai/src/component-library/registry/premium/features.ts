import type { ComponentDef } from '../../types';

export const premiumFeaturesComponents: ComponentDef[] = [
  {
    id: 'features-bento-v1', name: 'Features Bento V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['bento', 'grid', 'dark', 'asymmetric', 'premium', 'cards'],
    description: 'Asymmetric bento-grid feature layout: 5 cards with varied sizes like Linear.app', priority: 10,
    standaloneCode: `function FeaturesBentoV1() {
  const cells = [
    {title:'AI Generation',desc:'Describe any website in plain English and watch NexoGen build it live in under 60 seconds.',icon:'⚡',span:'md:col-span-2',grad:'from-violet-950/80 to-indigo-950/60',border:'border-violet-500/20',accent:'text-violet-300'},
    {title:'100+ Components',desc:'Premium, battle-tested sections inspired by the world\'s top startups.',icon:'🎨',span:'md:col-span-1',grad:'from-blue-950/80 to-cyan-950/60',border:'border-blue-500/20',accent:'text-blue-300'},
    {title:'One-Click Deploy',desc:'Ship to Vercel, Netlify, or any CDN instantly.',icon:'🚀',span:'md:col-span-1',grad:'from-emerald-950/80 to-teal-950/60',border:'border-emerald-500/20',accent:'text-emerald-300'},
    {title:'Live Preview',desc:'See your website render in real time as the AI generates each section.',icon:'👁',span:'md:col-span-2',grad:'from-pink-950/80 to-rose-950/60',border:'border-pink-500/20',accent:'text-pink-300'},
    {title:'Version History',desc:'Every generation is saved. Roll back to any version.',icon:'📜',span:'md:col-span-1',grad:'from-amber-950/80 to-orange-950/60',border:'border-amber-500/20',accent:'text-amber-300'},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Everything you need to ship</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">One platform. Every tool. No compromises.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cells.map((c,i) => (
            <div key={i} className={"bg-gradient-to-br " + c.grad + " border " + c.border + " rounded-3xl p-8 hover:scale-[1.01] transition-transform cursor-default " + c.span}>
              <div className="text-3xl mb-4">{c.icon}</div>
              <div className={"font-bold mb-2 " + c.accent}>{c.title}</div>
              <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-command-v1', name: 'Features Command V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'developer'],
    tags: ['command', 'palette', 'dark', 'developer', 'interactive', 'keyboard'],
    description: 'Raycast-style feature showcase: features displayed as command palette items', priority: 9,
    standaloneCode: `function FeaturesCommandV1() {
  const commands = [
    {key:'⌘G',label:'Generate website',desc:'Create full website from prompt',cat:'AI'},
    {key:'⌘S',label:'Select style',desc:'Choose from 20+ design themes',cat:'Design'},
    {key:'⌘D',label:'Deploy to cloud',desc:'One-click Vercel/Netlify deploy',cat:'Deploy'},
    {key:'⌘E',label:'Edit sections',desc:'Drag, reorder, and customize',cat:'Editor'},
    {key:'⌘C',label:'Component library',desc:'100+ premium components',cat:'Library'},
    {key:'⌘H',label:'Version history',desc:'Roll back to any generation',cat:'History'},
  ];
  const [active, setActive] = React.useState(0);
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>
            Every feature at your fingertips
          </h2>
          <p className="text-white/40 text-lg">Designed for keyboard-first power users.</p>
        </div>
        <div className="max-w-2xl mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 bg-[#0a0a0a]">
            <span className="text-white/20">🔍</span>
            <input placeholder="Search features..." className="bg-transparent text-white/50 text-sm outline-none flex-1 placeholder-white/20" readOnly />
            <kbd className="bg-white/8 text-white/30 text-xs px-2 py-1 rounded font-mono">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-auto">
            {commands.map((cmd, i) => (
              <div key={i} onMouseEnter={() => setActive(i)} className={"flex items-center gap-4 px-5 py-4 cursor-pointer transition-all " + (i===active?"bg-white/8":"hover:bg-white/4")}>
                <kbd className={"text-xs px-2 py-1 rounded font-mono " + (i===active?"bg-white/15 text-white/60":"bg-white/5 text-white/25")}>{cmd.key}</kbd>
                <div className="flex-1">
                  <div className={"font-medium text-sm " + (i===active?"text-white":"text-white/60")}>{cmd.label}</div>
                  <div className="text-white/25 text-xs">{cmd.desc}</div>
                </div>
                <span className={"text-xs px-2 py-0.5 rounded font-medium " + (i===active?"bg-violet-500/20 text-violet-300":"bg-white/5 text-white/20")}>{cmd.cat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-split-tabs-v1', name: 'Features Split Tabs V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['tabs', 'split', 'dark', 'interactive', 'animated', 'premium'],
    description: 'Interactive tabs feature section: left tabs, right product preview changes per tab', priority: 9,
    standaloneCode: `function FeaturesSplitTabsV1() {
  const tabs = [
    {id:'gen',label:'AI Generation',icon:'⚡',title:'From prompt to website in 60 seconds',desc:'Describe your vision in plain English. Our multi-agent AI pipeline — Planner, Designer, Coder, and Optimizer — turns it into a production-ready website.',preview:'from-violet-900/50 to-indigo-900/50'},
    {id:'lib',label:'Component Library',icon:'🎨',title:'100+ premium components',desc:'Every section is hand-crafted and inspired by top startups like Linear, Vercel, and Stripe. Mix, match, and customize to your brand.',preview:'from-blue-900/50 to-cyan-900/50'},
    {id:'dep',label:'Deploy',icon:'🚀',title:'Live on the internet in seconds',desc:'One click to deploy to Vercel, Netlify, or any CDN. Custom domains, SSL, and edge caching included. No DevOps required.',preview:'from-emerald-900/50 to-teal-900/50'},
  ];
  const [active, setActive] = React.useState(0);
  const t = tabs[active];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>How NexoGen works</h2>
        </div>
        <div className="grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-2 flex flex-col gap-2">
            {tabs.map((tab, i) => (
              <button key={tab.id} onClick={() => setActive(i)} className={"text-left rounded-2xl p-5 transition-all " + (i===active?"bg-white/8 border border-white/12":"hover:bg-white/4 border border-transparent")}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span className={"font-bold text-sm " + (i===active?"text-white":"text-white/50")}>{tab.label}</span>
                </div>
                {i===active && <p className="text-white/40 text-xs leading-relaxed mt-2 pl-8">{tab.desc}</p>}
              </button>
            ))}
          </div>
          <div className="md:col-span-3">
            <div className={"bg-gradient-to-br " + t.preview + " border border-white/10 rounded-3xl p-8 h-64 relative overflow-hidden transition-all"}>
              <div className="absolute inset-0 opacity-30" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',backgroundSize:'20px 20px'}} />
              <div className="relative z-10">
                <div className="text-white font-black text-xl mb-2">{t.title}</div>
                <div className="text-white/40 text-sm leading-relaxed max-w-sm">{t.desc}</div>
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
    id: 'features-metrics-v1', name: 'Features Metrics V1', category: 'features', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['metrics', 'numbers', 'stats', 'dark', 'proof', 'bold'],
    description: 'Metrics-driven feature section: large impact numbers with feature context cards', priority: 8,
    standaloneCode: `function FeaturesMetricsV1() {
  const stats = [
    {v:'10×',l:'Faster than traditional development',sub:'from 2 weeks to 60 seconds',c:'text-violet-400'},
    {v:'40%',l:'Higher conversion rates on average',sub:'compared to template-built sites',c:'text-blue-400'},
    {v:'$80K',l:'Saved annually vs hiring designers',sub:'average agency cost replaced',c:'text-emerald-400'},
    {v:'4.9★',l:'Customer satisfaction score',sub:'from 3,200+ verified reviews',c:'text-amber-400'},
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Results that matter</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Data from 50,000+ teams using NexoGen in production.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {stats.map((s,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/8 rounded-3xl p-10 hover:border-white/12 transition-all group">
              <div className={"text-6xl font-black mb-3 " + s.c}>{s.v}</div>
              <div className="text-white font-bold text-xl mb-2">{s.l}</div>
              <div className="text-white/30 text-sm">{s.sub}</div>
              <div className={"mt-6 h-1 rounded-full bg-gradient-to-r w-0 group-hover:w-full transition-all duration-700 opacity-40 " + (i%2===0?"from-violet-500 to-blue-500":"from-emerald-500 to-teal-500")} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-comparison-v1', name: 'Features Comparison V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['comparison', 'vs', 'dark', 'table', 'competitive', 'premium'],
    description: 'Competitive comparison: NexoGen vs Traditional vs Template — feature matrix', priority: 9,
    standaloneCode: `function FeaturesComparisonV1() {
  const rows = [
    {f:'Generation time','nexogen':'< 60 seconds','trad':'2–4 weeks','template':'30 minutes'},
    {f:'Design quality','nexogen':'★★★★★','trad':'★★★★★','template':'★★☆☆☆'},
    {f:'Custom code','nexogen':'Yes','trad':'Yes','template':'Limited'},
    {f:'AI-powered','nexogen':'Yes','trad':'No','template':'No'},
    {f:'Component library','nexogen':'100+ premium','trad':'Custom','template':'20–50 basic'},
    {f:'Cost / project','nexogen':'$0–29/mo','trad':'$5,000–50,000','template':'$29–99/mo'},
    {f:'Deploy','nexogen':'1 click','trad':'DevOps required','template':'1 click'},
  ];
  const cols = [{key:'nexogen',label:'NexoGen',highlight:true},{key:'trad',label:'Traditional Dev',highlight:false},{key:'template',label:'Template Builders',highlight:false}];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Why teams choose NexoGen</h2>
        </div>
        <div className="bg-[#0a0a0e] border border-white/8 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-6 py-5 text-white/30 text-sm font-medium">Feature</th>
                {cols.map(c => <th key={c.key} className={"px-5 py-5 text-center text-sm font-bold " + (c.highlight?"text-violet-300":"text-white/30")}>{c.label}{c.highlight && <div className="text-xs font-normal text-violet-400/60 mt-0.5">Recommended</div>}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={"border-b border-white/5 hover:bg-white/[0.02] transition-colors " + (i===rows.length-1?"border-b-0":"")}>
                  <td className="px-6 py-4 text-white/60 text-sm">{row.f}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="bg-violet-500/15 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-full">{row.nexogen}</span>
                  </td>
                  <td className="px-5 py-4 text-center text-white/30 text-xs">{row.trad}</td>
                  <td className="px-5 py-4 text-center text-white/30 text-xs">{row.template}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-code-v1', name: 'Features Code V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['code', 'developer', 'dark', 'syntax', 'technical', 'api'],
    description: 'Code-first feature showcase: each feature highlighted with a code snippet', priority: 8,
    standaloneCode: `function FeaturesCodeV1() {
  const features = [
    {title:'Simple API', code:'const site = await nexogen.generate({\n  prompt: "SaaS landing page",\n  style: "modern"\n});'},
    {title:'React Components', code:'import { HeroSection } from\n  "@nexogen/components";\n\n<HeroSection theme="dark" />'},
    {title:'Deploy anywhere', code:'// nexogen.config.ts\nexport default {\n  deploy: "vercel",\n  domain: "mysite.com"\n};'},
  ];
  const [active, setActive] = React.useState(0);
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Built for developers</h2>
          <p className="text-white/40 text-lg">Clean API. Great DX. Production-ready code output.</p>
        </div>
        <div className="grid md:grid-cols-5 gap-6 items-start">
          <div className="md:col-span-2 space-y-2">
            {features.map((f,i) => (
              <button key={i} onClick={() => setActive(i)} className={"w-full text-left p-5 rounded-2xl transition-all border " + (i===active?"bg-white/8 border-white/12 text-white":"border-transparent text-white/40 hover:bg-white/4 hover:text-white/60")}>
                <div className="font-bold">{f.title}</div>
              </button>
            ))}
          </div>
          <div className="md:col-span-3 bg-[#111] border border-white/8 rounded-2xl overflow-hidden font-mono text-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              <span className="text-white/20 text-xs ml-2">index.ts</span>
            </div>
            <pre className="p-6 text-emerald-300/80 text-xs leading-relaxed overflow-auto">{features[active].code}</pre>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-timeline-v1', name: 'Features Timeline V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['timeline', 'steps', 'process', 'dark', 'sequential', 'flow'],
    description: 'Timeline/process feature layout: numbered steps with connecting line, dark premium', priority: 8,
    standaloneCode: `function FeaturesTimelineV1() {
  const steps = [
    {n:'01',title:'Describe your vision',desc:'Type what you want to build in plain English. Be as vague or specific as you like — our AI figures it out.',accent:'text-violet-400',border:'border-violet-500/30',bg:'bg-violet-500/10'},
    {n:'02',title:'AI builds your website',desc:'Our 4-agent pipeline plans, designs, codes, and optimizes your site simultaneously. Watch it happen live.',accent:'text-blue-400',border:'border-blue-500/30',bg:'bg-blue-500/10'},
    {n:'03',title:'Review and refine',desc:'See your website in real time. Request changes in plain English. Iterate until it\'s perfect.',accent:'text-emerald-400',border:'border-emerald-500/30',bg:'bg-emerald-500/10'},
    {n:'04',title:'Deploy to production',desc:'One click and your site is live. Custom domain, SSL, CDN — all included. No DevOps, no config.',accent:'text-amber-400',border:'border-amber-500/30',bg:'bg-amber-500/10'},
  ];
  return (
    <section className="py-24 bg-[#060606]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>From idea to live in 4 steps</h2>
        </div>
        <div className="relative">
          <div className="absolute left-8 top-10 bottom-10 w-px bg-gradient-to-b from-violet-500/30 via-blue-500/30 to-amber-500/30 hidden md:block" />
          <div className="space-y-6">
            {steps.map((s,i) => (
              <div key={i} className={"relative flex gap-6 bg-white/[0.02] border border-white/8 rounded-3xl p-8 hover:border-white/12 transition-all"}>
                <div className={"w-12 h-12 rounded-2xl " + s.bg + " border " + s.border + " flex items-center justify-center shrink-0 relative z-10 bg-[#060606]"}>
                  <span className={"font-black text-sm " + s.accent}>{s.n}</span>
                </div>
                <div>
                  <div className={"font-bold text-lg text-white mb-2"}>{s.title}</div>
                  <div className="text-white/40 leading-relaxed text-sm">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-cards-dark-v1', name: 'Features Cards Dark V1', category: 'features', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['cards', 'dark', 'glassmorphism', 'premium', 'grid', 'hover'],
    description: 'Premium dark feature cards: glassmorphism style with gradient borders on hover', priority: 9,
    standaloneCode: `function FeaturesCardsDarkV1() {
  const features = [
    {icon:'🤖',title:'Multi-agent AI',desc:'Planner, Designer, Coder, and Optimizer agents work in parallel to build your site.',grad:'from-violet-500/10 to-purple-500/5',border:'hover:border-violet-500/30'},
    {icon:'⚡',title:'Real-time preview',desc:'Watch your website build live. See every section render as the AI creates it.',grad:'from-blue-500/10 to-cyan-500/5',border:'hover:border-blue-500/30'},
    {icon:'🎨',title:'Brand system',desc:'NexoGen learns your brand colors, typography, and style. Every output stays on-brand.',grad:'from-emerald-500/10 to-teal-500/5',border:'hover:border-emerald-500/30'},
    {icon:'📱',title:'Mobile-first',desc:'Every generated website is fully responsive. Looks perfect on any screen.',grad:'from-pink-500/10 to-rose-500/5',border:'hover:border-pink-500/30'},
    {icon:'🔒',title:'Enterprise security',desc:'SOC 2 Type II, GDPR-compliant. Your data and code are always private.',grad:'from-amber-500/10 to-orange-500/5',border:'hover:border-amber-500/30'},
    {icon:'🚀',title:'One-click deploy',desc:'Ship to Vercel, Netlify, or any CDN with zero configuration required.',grad:'from-indigo-500/10 to-violet-500/5',border:'hover:border-indigo-500/30'},
  ];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Features that set us apart</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Not just a website builder. A complete AI-powered web development platform.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map((f,i) => (
            <div key={i} className={"bg-gradient-to-br " + f.grad + " bg-white/[0.02] border border-white/8 " + f.border + " rounded-3xl p-8 transition-all hover:scale-[1.02] cursor-default"}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <div className="text-white font-bold mb-2">{f.title}</div>
              <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-alternating-v1', name: 'Features Alternating V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['alternating', 'left-right', 'dark', 'detail', 'premium', 'sections'],
    description: 'Alternating left/right feature sections: each feature gets a full layout with mockup', priority: 9,
    standaloneCode: `function FeaturesAlternatingV1() {
  const items = [
    {title:'Describe in plain English',desc:'No design vocabulary needed. Say "I want a professional dark website for my AI startup" and NexoGen understands every word. The more context you give, the better the output.',visual:'from-violet-900/50 to-indigo-900/40',accent:'border-violet-500/20',flip:false},
    {title:'Watch it build in real time',desc:'See your website appear section by section as the AI works. The live preview updates instantly. You\'re not waiting — you\'re watching magic happen.',visual:'from-blue-900/50 to-cyan-900/40',accent:'border-blue-500/20',flip:true},
    {title:'Refine with conversation',desc:'Not quite right? Just tell NexoGen what to change in plain English. "Make the hero darker" or "add a pricing section" works perfectly.',visual:'from-emerald-900/50 to-teal-900/40',accent:'border-emerald-500/20',flip:false},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-5xl mx-auto px-6 space-y-20">
        {items.map((item, i) => (
          <div key={i} className={"grid md:grid-cols-2 gap-12 items-center " + (item.flip?"direction-rtl":"")}>
            <div className={item.flip?"md:order-2":""}>
              <div className="text-white/20 text-xs uppercase tracking-widest font-semibold mb-3">0{i+1}</div>
              <h3 className="font-black text-white text-3xl mb-4 leading-tight" style={{letterSpacing:'-0.03em'}}>{item.title}</h3>
              <p className="text-white/50 leading-relaxed">{item.desc}</p>
            </div>
            <div className={item.flip?"md:order-1":""}>
              <div className={"bg-gradient-to-br " + item.visual + " border " + item.accent + " rounded-3xl h-56 relative overflow-hidden"}>
                <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',backgroundSize:'20px 20px'}} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2/3 space-y-2">
                    <div className="h-3 bg-white/15 rounded w-2/3" />
                    <div className="h-2 bg-white/8 rounded" />
                    <div className="h-2 bg-white/8 rounded w-4/5" />
                    <div className="h-8 bg-white/10 rounded-xl mt-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-icon-grid-v1', name: 'Features Icon Grid V1', category: 'features', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['icons', 'grid', 'dark', 'minimal', 'list', 'comprehensive'],
    description: 'Icon grid feature list: 12 features in compact 4-col grid, icon + title + short desc', priority: 7,
    standaloneCode: `function FeaturesIconGridV1() {
  const features = [
    {e:'⚡',t:'AI Generation'},{e:'🎨',t:'100+ Components'},{e:'🚀',t:'One-Click Deploy'},{e:'📱',t:'Mobile First'},
    {e:'🔒',t:'Enterprise Security'},{e:'📊',t:'Analytics'},{e:'🤝',t:'Team Collab'},{e:'🌐',t:'Custom Domains'},
    {e:'🔄',t:'Version Control'},{e:'🎯',t:'SEO Optimized'},{e:'⚙️',t:'API Access'},{e:'💬',t:'24/7 Support'},
  ];
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Everything included</h2>
          <p className="text-white/40 text-lg">No hidden features. No upsells. Everything you need, from day one.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((f,i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5 text-center hover:border-white/15 hover:bg-white/[0.05] transition-all cursor-default group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{f.e}</div>
              <div className="text-white/60 text-sm font-medium">{f.t}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-enterprise-v1', name: 'Features Enterprise V1', category: 'features', style: 'corporate', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['enterprise', 'b2b', 'dark', 'corporate', 'trust', 'security'],
    description: 'Enterprise feature section: security, compliance, scale, and team features for B2B', priority: 8,
    standaloneCode: `function FeaturesEnterpriseV1() {
  const sections = [
    {title:'Security & Compliance',icon:'🔒',features:['SOC 2 Type II certified','GDPR & CCPA compliant','End-to-end encryption','Custom data retention'],color:'text-blue-400'},
    {title:'Scale & Performance',icon:'⚡',features:['99.99% uptime SLA','Global CDN edge network','Auto-scaling infrastructure','DDoS protection built-in'],color:'text-violet-400'},
    {title:'Team & Collaboration',icon:'🤝',features:['Unlimited team seats','Role-based access control','Audit logs & compliance','SSO / SAML integration'],color:'text-emerald-400'},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-3">Enterprise</div>
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Built for teams that demand more</h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">Enterprise-grade infrastructure, security, and support for your team.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {sections.map((s,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 hover:border-white/12 transition-all">
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className={"font-bold mb-4 " + s.color}>{s.title}</div>
              <ul className="space-y-3">
                {s.features.map((f,j) => <li key={j} className="flex items-center gap-3 text-white/50 text-sm">
                  <span className={"text-xs " + s.color}>✓</span>{f}
                </li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors mr-4">
            Talk to enterprise sales
          </button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            Download security brief
          </button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-gradient-cards-v1', name: 'Features Gradient Cards V1', category: 'features', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['gradient', 'cards', 'dark', 'colorful', 'bold', 'premium'],
    description: 'Vivid gradient cards: each feature has its own bold color gradient card', priority: 8,
    standaloneCode: `function FeaturesGradientCardsV1() {
  const features = [
    {icon:'⚡',title:'60-second generation',desc:'The fastest AI website builder in the world. From prompt to live preview in under a minute.',grad:'from-violet-600/30 to-purple-800/20',border:'border-violet-500/30'},
    {icon:'🧠',title:'Understands context',desc:'NexoGen reads between the lines. Mention your industry and it applies relevant design patterns automatically.',grad:'from-blue-600/30 to-cyan-800/20',border:'border-blue-500/30'},
    {icon:'🎭',title:'Multiple design systems',desc:'Linear dark, Stripe blue, Framer bold, Notion minimal — choose your aesthetic or create your own.',grad:'from-emerald-600/30 to-teal-800/20',border:'border-emerald-500/30'},
    {icon:'🔁',title:'Infinite iterations',desc:'Every generation is free to iterate on. Refine, remix, and regenerate until it\'s exactly right.',grad:'from-pink-600/30 to-rose-800/20',border:'border-pink-500/30'},
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>What makes us different</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f,i) => (
            <div key={i} className={"bg-gradient-to-br " + f.grad + " border " + f.border + " rounded-3xl p-10 hover:scale-[1.02] transition-all cursor-default"}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <div className="text-white font-black text-xl mb-3">{f.title}</div>
              <p className="text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-developer-v1', name: 'Features Developer V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['developer', 'dx', 'dark', 'technical', 'api', 'sdk'],
    description: 'Developer experience section: API, SDK, CLI, webhooks, type-safe code features', priority: 7,
    standaloneCode: `function FeaturesDeveloperV1() {
  const devFeatures = [
    {tag:'REST API',title:'Full REST API',desc:'Every feature accessible via API. Generate, deploy, manage — programmatically.',code:'POST /v1/generate\n{\n  prompt: "SaaS landing page"\n}'},
    {tag:'TypeScript SDK',title:'Type-safe SDK',desc:'First-class TypeScript support with full auto-complete and type safety.',code:'import { NexoGen } from\n  "@nexogen/sdk";\nconst n = new NexoGen();'},
    {tag:'Webhooks',title:'Event webhooks',desc:'Get notified when generation completes, deploys succeed, or errors occur.',code:'nexogen.on("generated",\n  async (site) => {\n    await deploy(site);\n  });'},
  ];
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/15 px-4 py-2 rounded-full mb-6">Built for developers first</div>
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Superb developer experience</h2>
        </div>
        <div className="space-y-4">
          {devFeatures.map((f,i) => (
            <div key={i} className="bg-[#111] border border-white/8 rounded-3xl p-8 grid md:grid-cols-2 gap-8 items-center hover:border-white/12 transition-all">
              <div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full mb-3 inline-block">{f.tag}</span>
                <div className="text-white font-bold text-xl mb-2">{f.title}</div>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
              <pre className="bg-[#0a0a0a] border border-white/6 rounded-xl p-4 font-mono text-xs text-emerald-300/70 overflow-auto">{f.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-mockup-v1', name: 'Features Mockup V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['mockup', 'product', 'dark', 'showcase', 'detail', 'screen'],
    description: 'Feature showcase with browser-frame product mockup: tabs switching UI previews', priority: 9,
    standaloneCode: `function FeaturesMockupV1() {
  const tabs = ['Generate','Preview','Deploy'];
  const [active, setActive] = React.useState(0);
  const colors = [
    {preview:'from-violet-900/60 to-indigo-900/40',accent:'bg-violet-500'},
    {preview:'from-blue-900/60 to-cyan-900/40',accent:'bg-blue-500'},
    {preview:'from-emerald-900/60 to-teal-900/40',accent:'bg-emerald-500'},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>See it in action</h2>
          <p className="text-white/40 text-lg">Three steps. One platform. Infinite websites.</p>
        </div>
        <div className="flex gap-2 justify-center mb-6">
          {tabs.map((t,i) => <button key={t} onClick={() => setActive(i)} className={"px-6 py-2.5 rounded-full text-sm font-semibold transition-all " + (i===active?"bg-white text-black":"text-white/40 hover:text-white/70 border border-transparent hover:border-white/10")}>{t}</button>)}
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#060609] pointer-events-none z-10 bottom-0 top-auto h-16" />
          <div className="bg-[#0d0d12] border border-white/8 rounded-3xl overflow-hidden" style={{boxShadow:'0 40px 80px rgba(0,0,0,0.5)'}}>
            <div className="flex items-center gap-2 px-5 py-4 bg-[#080810] border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" /><div className="w-3 h-3 rounded-full bg-yellow-500/50" /><div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              <div className="flex-1 text-center"><div className="inline-flex bg-white/5 border border-white/8 text-white/25 text-xs px-8 py-1 rounded-full font-mono">nexogen.app</div></div>
            </div>
            <div className={"min-h-64 bg-gradient-to-br " + colors[active].preview + " p-8 relative overflow-hidden"}>
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',backgroundSize:'24px 24px'}} />
              <div className="relative z-10 space-y-3">
                <div className="h-4 bg-white/20 rounded w-1/3" />
                <div className="h-3 bg-white/12 rounded w-2/3" />
                <div className="h-3 bg-white/12 rounded w-1/2" />
                <div className="flex gap-2 mt-4"><div className={"h-8 rounded-full w-24 " + colors[active].accent + " opacity-80"} /><div className="h-8 rounded-full w-20 bg-white/10" /></div>
                <div className="grid grid-cols-3 gap-2 mt-4">{[1,2,3].map(j => <div key={j} className="h-16 bg-white/8 rounded-xl" />)}</div>
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
    id: 'features-visual-v1', name: 'Features Visual V1', category: 'features', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['visual', 'showcase', 'dark', 'premium', 'bold', 'colorful'],
    description: 'Visual-first features: large colorful icons, bold typography, vibrant backgrounds', priority: 7,
    standaloneCode: `function FeaturesVisualV1() {
  const features = [
    {e:'⚡',t:'60-second builds',d:'The fastest path from idea to live website.',c:'bg-violet-500/20 border-violet-500/30'},
    {e:'🎨',t:'Premium design',d:'Hand-crafted components from top design teams.',c:'bg-blue-500/20 border-blue-500/30'},
    {e:'🤖',t:'True AI',d:'Not templates — genuinely intelligent generation.',c:'bg-emerald-500/20 border-emerald-500/30'},
    {e:'🚀',t:'Instant deploy',d:'From build to live URL in under 10 seconds.',c:'bg-pink-500/20 border-pink-500/30'},
    {e:'📊',t:'Built-in analytics',d:'Know who visits, what converts, and why.',c:'bg-amber-500/20 border-amber-500/30'},
    {e:'🌐',t:'Global CDN',d:'Edge-cached for fast loads everywhere on Earth.',c:'bg-cyan-500/20 border-cyan-500/30'},
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>The complete toolkit</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f,i) => (
            <div key={i} className={"border rounded-3xl p-7 " + f.c + " hover:scale-[1.03] transition-transform cursor-default"}>
              <div className="text-4xl mb-4">{f.e}</div>
              <div className="text-white font-bold text-base mb-2">{f.t}</div>
              <div className="text-white/40 text-sm leading-relaxed">{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-highlight-v1', name: 'Features Highlight V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['spotlight', 'highlight', 'dark', 'animated-line', 'centered', 'emphasis'],
    description: 'Spotlight feature section: one feature center-stage with side navigation and glow', priority: 8,
    standaloneCode: `function FeaturesHighlightV1() {
  const features = [
    {title:'Multi-agent AI pipeline',desc:'Four specialized AI agents work simultaneously: the Planner understands your intent, the Designer picks the perfect aesthetic, the Coder writes clean JSX, and the Optimizer ensures quality. Your website is done before you finish reading this.',icon:'🤖',color:'from-violet-600/20 to-indigo-600/10'},
    {title:'100+ Premium Components',desc:'Every hero, feature section, pricing table, and footer was hand-designed by our team, inspired by Linear, Vercel, Stripe, and other world-class products. No generic templates — only premium quality.',icon:'🎨',color:'from-blue-600/20 to-cyan-600/10'},
    {title:'Zero-config deployment',desc:'Click deploy and it\'s live. We handle SSL, CDN, routing, and performance. Connect your custom domain in 30 seconds. No DevOps, no YAML, no pain.',icon:'🚀',color:'from-emerald-600/20 to-teal-600/10'},
  ];
  const [active, setActive] = React.useState(0);
  const f = features[active];
  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>The NexoGen difference</h2>
        </div>
        <div className="flex gap-2 justify-center mb-10">
          {features.map((f,i) => <button key={i} onClick={() => setActive(i)} className={"px-5 py-2.5 rounded-full text-sm font-medium transition-all border " + (i===active?"bg-white text-black border-white":"text-white/40 border-white/10 hover:border-white/20 hover:text-white/60")}>{f.icon}</button>)}
        </div>
        <div className={"bg-gradient-to-br " + f.color + " border border-white/10 rounded-3xl p-12 text-center transition-all"}>
          <div className="text-5xl mb-6">{f.icon}</div>
          <h3 className="text-white font-black text-2xl mb-4">{f.title}</h3>
          <p className="text-white/50 text-lg leading-relaxed max-w-2xl mx-auto">{f.desc}</p>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-scroll-v1', name: 'Features Scroll V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['scroll', 'horizontal', 'dark', 'wide', 'premium', 'overflow'],
    description: 'Horizontally scrollable feature cards: wide format, scrolls left/right on mobile', priority: 7,
    standaloneCode: `function FeaturesScrollV1() {
  const features = [
    {e:'⚡',t:'AI Generation',d:'60-second builds',c:'from-violet-800/40 to-purple-900/30',brd:'border-violet-500/20'},
    {e:'🎨',t:'100+ Components',d:'Premium library',c:'from-blue-800/40 to-cyan-900/30',brd:'border-blue-500/20'},
    {e:'🚀',t:'Deploy',d:'One click live',c:'from-emerald-800/40 to-teal-900/30',brd:'border-emerald-500/20'},
    {e:'🤖',t:'Multi-agent AI',d:'4 agents working',c:'from-pink-800/40 to-rose-900/30',brd:'border-pink-500/20'},
    {e:'📱',t:'Mobile First',d:'Every breakpoint',c:'from-amber-800/40 to-orange-900/30',brd:'border-amber-500/20'},
    {e:'🔒',t:'Enterprise',d:'SOC 2 / GDPR',c:'from-indigo-800/40 to-violet-900/30',brd:'border-indigo-500/20'},
    {e:'📊',t:'Analytics',d:'Built-in tracking',c:'from-teal-800/40 to-cyan-900/30',brd:'border-teal-500/20'},
  ];
  return (
    <section className="py-24 bg-[#060609] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Everything you need</h2>
        <p className="text-white/40 text-lg">One platform, complete capability.</p>
      </div>
      <div className="flex gap-4 px-6 overflow-x-auto pb-4 scrollbar-hide" style={{scrollbarWidth:'none'}}>
        {features.map((f,i) => (
          <div key={i} className={"shrink-0 w-52 bg-gradient-to-br " + f.c + " border " + f.brd + " rounded-3xl p-6 hover:scale-105 transition-transform"}>
            <div className="text-3xl mb-4">{f.e}</div>
            <div className="text-white font-bold mb-1">{f.t}</div>
            <div className="text-white/40 text-sm">{f.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },
  {
    id: 'features-minimal-v1', name: 'Features Minimal V1', category: 'features', style: 'minimal', theme: 'light',
    industries: ['saas', 'startup', 'portfolio'],
    tags: ['minimal', 'light', 'clean', 'simple', 'list', 'typography'],
    description: 'Clean minimal features: white background, large typography, simple numbered list style', priority: 7,
    standaloneCode: `function FeaturesMinimalV1() {
  const features = [
    {n:'01',title:'Describe it, don\'t build it',desc:'Write what you want in plain English. NexoGen\'s AI reads intent, not instructions.'},
    {n:'02',title:'See it come alive',desc:'Watch your website build in real time. No waiting, no black boxes, no surprises.'},
    {n:'03',title:'Ship it instantly',desc:'One click and you\'re live. Custom domain, SSL, CDN — everything handled automatically.'},
    {n:'04',title:'Iterate endlessly',desc:'Every change is a conversation. Just tell NexoGen what to refine — it never gets tired.'},
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-16">
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">How it works</div>
          <h2 className="font-black text-gray-900 mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Simple by design.</h2>
        </div>
        <div className="space-y-0">
          {features.map((f,i) => (
            <div key={i} className={"border-t border-gray-100 py-8 flex gap-8 items-start hover:bg-gray-50/50 transition-colors -mx-6 px-6 " + (i===features.length-1?"border-b":"")}>
              <div className="text-gray-200 font-black text-2xl w-12 shrink-0">{f.n}</div>
              <div>
                <div className="text-gray-900 font-bold text-xl mb-2">{f.title}</div>
                <div className="text-gray-400 leading-relaxed">{f.desc}</div>
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
    id: 'features-table-v1', name: 'Features Table V1', category: 'features', style: 'modern', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['table', 'checklist', 'dark', 'comprehensive', 'b2b', 'tiers'],
    description: 'Feature availability table: rows of features, columns for plans, checkmarks/labels', priority: 7,
    standaloneCode: `function FeaturesTableV1() {
  const rows = [
    {f:'AI website generation',free:'5/mo',pro:'Unlimited',ent:'Unlimited'},
    {f:'Component library',free:'50 components',pro:'100+ components',ent:'Custom'},
    {f:'Custom domain',free:'✗',pro:'✓',ent:'✓'},
    {f:'Team members',free:'1',pro:'5',ent:'Unlimited'},
    {f:'Version history',free:'3 versions',pro:'Unlimited',ent:'Unlimited'},
    {f:'API access',free:'✗',pro:'1000 req/mo',ent:'Unlimited'},
    {f:'Priority support',free:'✗',pro:'✗',ent:'✓'},
    {f:'SSO / SAML',free:'✗',pro:'✗',ent:'✓'},
  ];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>What's included</h2>
        </div>
        <div className="bg-[#0a0a0e] border border-white/8 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-6 py-5 text-white/30 text-sm w-1/2">Feature</th>
                <th className="px-4 py-5 text-center text-white/30 text-sm">Free</th>
                <th className="px-4 py-5 text-center text-violet-300 text-sm font-bold">Pro</th>
                <th className="px-4 py-5 text-center text-blue-300 text-sm font-bold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={i} className={"border-b border-white/5 hover:bg-white/[0.015] " + (i===rows.length-1?"border-0":"")}>
                  <td className="px-6 py-4 text-white/60 text-sm">{r.f}</td>
                  <td className="px-4 py-4 text-center text-white/25 text-xs">{r.free}</td>
                  <td className="px-4 py-4 text-center"><span className={"text-xs font-medium " + (r.pro==='✓'?"text-violet-400":r.pro==='✗'?"text-white/20":"text-violet-300")}>{r.pro}</span></td>
                  <td className="px-4 py-4 text-center"><span className={"text-xs font-medium " + (r.ent==='✓'?"text-blue-400":r.ent==='✗'?"text-white/20":"text-blue-300")}>{r.ent}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}`,
  },
];
