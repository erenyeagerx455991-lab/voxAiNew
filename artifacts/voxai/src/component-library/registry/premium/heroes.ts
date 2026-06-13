import type { ComponentDef } from '../../types';

export const premiumHeroComponents: ComponentDef[] = [
  {
    id: 'hero-linear-v1', name: 'Hero Linear V1', category: 'hero', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'productivity', 'ai'],
    tags: ['linear', 'dark', 'grid', 'violet', 'startup', 'minimal', 'premium'],
    description: 'Linear.app-inspired hero: pure black, dot grid, violet gradient heading, dual CTA', priority: 10,
    standaloneCode: `function HeroLinearV1() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',backgroundSize:'32px 32px'}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{background:'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 border border-white/10 text-white/40 text-xs px-4 py-1.5 rounded-full mb-10 bg-white/[0.03] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-300 font-semibold">New:</span>
          AI-powered component generation is here
          <span className="text-white/20 ml-1">→</span>
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          The only tool you need<br />
          <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#818cf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            to ship websites
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          Describe your vision. NexoGen builds it. Deploy in seconds. No code required, but code quality guaranteed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
          <button className="bg-white hover:bg-gray-100 text-black font-bold px-8 py-3.5 rounded-full text-sm transition-colors">
            Start building free
          </button>
          <button className="text-white/40 text-sm font-medium hover:text-white/70 transition-colors flex items-center gap-1.5">
            Watch demo <span className="text-lg">›</span>
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {['Stripe','Vercel','Linear','Notion','Figma'].map(b => <span key={b} className="text-white/15 font-semibold text-sm hover:text-white/30 transition-colors">{b}</span>)}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-vercel-v1', name: 'Hero Vercel V1', category: 'hero', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'developer', 'ai'],
    tags: ['vercel', 'dark', 'deploy', 'developer', 'terminal', 'green'],
    description: 'Vercel.com-inspired hero: black, deploy metaphor, terminal element, green live status', priority: 10,
    standaloneCode: `function HeroVercelV1() {
  const [step, setStep] = React.useState(0);
  const steps = [{t:'$ nexogen build',c:'text-white/50',s:0},{t:'✓ Analyzing prompt...',c:'text-white/70',s:600},{t:'✓ Generating components...',c:'text-white/70',s:1200},{t:'✓ Optimizing output...',c:'text-white/70',s:1800},{t:'🚀 Ready! https://mysite.nexogen.app',c:'text-emerald-400',s:2400}];
  React.useEffect(() => {
    steps.forEach(s => setTimeout(() => setStep(p => p+1), s.s));
  }, []);
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',backgroundSize:'50px 50px'}} />
      <div className="relative z-10 text-center max-w-4xl w-full">
        <div className="inline-flex items-center gap-2 mb-10 text-xs font-mono bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 px-4 py-2 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          All systems operational
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6.5rem)',letterSpacing:'-0.05em'}}>
          Build. Generate.
          <br />
          <span className="text-white/25">Deploy.</span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-lg mx-auto">The fastest way from idea to live website. Zero config, maximum quality.</p>
        <div className="bg-black border border-white/10 rounded-2xl p-6 mb-10 font-mono text-left max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4"><div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" /></div>
          {steps.slice(0, step+1).map((s,i) => <div key={i} className={"text-sm mb-1 " + s.c}>{s.t}</div>)}
        </div>
        <button onClick={() => setStep(0)} className="bg-white text-black font-bold px-8 py-4 rounded-full text-sm hover:bg-gray-100 transition-colors">
          Deploy my website free →
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-stripe-v1', name: 'Hero Stripe V1', category: 'hero', style: 'bold', theme: 'dark',
    industries: ['saas', 'fintech', 'startup'],
    tags: ['stripe', 'blue', 'gradient', 'card-mockup', 'premium', 'bold'],
    description: 'Stripe-inspired hero: deep blue gradient, floating payment card mockup, financial metrics', priority: 10,
    standaloneCode: `function HeroStripeV1() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-20" style={{background:'linear-gradient(135deg, #0a2540 0%, #0d1b4b 40%, #1a0a3d 100%)'}}>
      <div className="absolute inset-0 opacity-50" style={{backgroundImage:'radial-gradient(ellipse at 20% 30%, rgba(99,91,255,0.2) 0%, transparent 40%), radial-gradient(ellipse at 80% 70%, rgba(0,112,243,0.15) 0%, transparent 40%)'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,7vw,5.5rem)',letterSpacing:'-0.04em'}}>
          The infrastructure for<br />
          <span style={{backgroundImage:'linear-gradient(135deg,#60a5fa,#a78bfa 50%,#f472b6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            the modern internet
          </span>
        </h1>
        <p className="text-blue-200/60 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Millions of businesses use NexoGen to build, launch, and scale their web presence. Join them.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <button className="font-bold px-10 py-4 rounded-full text-base text-white transition-all" style={{background:'#635bff'}}>
            Start building now
          </button>
          <button className="border-2 border-white/15 text-white font-semibold px-10 py-4 rounded-full hover:bg-white/5 transition-all">
            Contact sales
          </button>
        </div>
        <div className="flex items-center justify-center gap-8 flex-wrap">
          {[['$0','Setup fee'],['99.99%','Uptime SLA'],['60s','Generation time'],['150+','Components']].map(([v,l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black text-white mb-1">{v}</div>
              <div className="text-blue-200/30 text-xs">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-framer-v1', name: 'Hero Framer V1', category: 'hero', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'design', 'ai'],
    tags: ['framer', 'gradient', 'bold', 'experimental', 'colorful', 'modern'],
    description: 'Framer-inspired bold hero: vivid gradient, large experimental typography, playful feel', priority: 9,
    standaloneCode: `function HeroFramerV1() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
      <div className="absolute inset-0" style={{background:'linear-gradient(135deg, #0f0f0f 0%, #1a0a2e 40%, #0a1628 100%)'}} />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-30" style={{background:'linear-gradient(135deg, #ff6b35, #f7c59f)'}} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-3xl opacity-20" style={{background:'linear-gradient(135deg, #9b59b6, #3498db)'}} />
      </div>
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-block mb-6">
          <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full" style={{background:'rgba(255,107,53,0.15)',border:'1px solid rgba(255,107,53,0.3)',color:'#ff9a6c'}}>
            Introducing AI Website Builder
          </span>
        </div>
        <h1 className="font-black text-white mb-8 leading-none" style={{fontSize:'clamp(3rem,9vw,7rem)',letterSpacing:'-0.05em'}}>
          Design at the
          <br />
          <span style={{backgroundImage:'linear-gradient(135deg,#ff6b35 0%,#f7c59f 30%,#e056fd 60%,#48c6ef 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            speed of thought
          </span>
        </h1>
        <p className="text-white/50 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          From blank canvas to live website in under a minute. The creative AI that doesn't compromise on quality.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="font-bold px-10 py-4 rounded-2xl text-base text-black transition-all hover:opacity-90" style={{background:'linear-gradient(135deg,#ff6b35,#f7c59f)'}}>
            Start creating free
          </button>
          <button className="border border-white/15 text-white font-medium px-10 py-4 rounded-2xl hover:bg-white/5 transition-all">
            Browse gallery →
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-raycast-v1', name: 'Hero Raycast V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'developer', 'productivity'],
    tags: ['raycast', 'command', 'dark', 'keyboard', 'developer', 'shortcuts'],
    description: 'Raycast-inspired hero: dark bg, command palette UI mockup, keyboard shortcut chips', priority: 9,
    standaloneCode: `function HeroRaycastV1() {
  const results = [
    {icon:'🌐',title:'Build SaaS landing page',sub:'Generate website'},
    {icon:'🎨',title:'Create portfolio site',sub:'Generate website'},
    {icon:'🛒',title:'E-commerce storefront',sub:'Generate website'},
    {icon:'📊',title:'Dashboard & analytics',sub:'Generate website'},
  ];
  const [sel, setSel] = React.useState(0);
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)',backgroundSize:'24px 24px'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <h1 className="font-black text-white mb-4 leading-none" style={{fontSize:'clamp(2.5rem,7vw,5.5rem)',letterSpacing:'-0.05em'}}>
          Your AI website builder.<br />
          <span className="text-white/20">Supercharged.</span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-lg mx-auto">Press <kbd className="bg-white/10 border border-white/15 text-white/60 text-xs px-2 py-0.5 rounded font-mono">⌘</kbd> <kbd className="bg-white/10 border border-white/15 text-white/60 text-xs px-2 py-0.5 rounded font-mono">K</kbd> to build anything.</p>
        <div className="max-w-xl mx-auto bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-12">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
            <span className="text-white/25">🔍</span>
            <span className="text-white/30 text-sm font-mono">Describe the website you want to build...</span>
            <div className="ml-auto flex gap-1"><kbd className="bg-white/8 text-white/30 text-xs px-2 py-0.5 rounded font-mono">⌘K</kbd></div>
          </div>
          {results.map((r,i) => (
            <div key={i} onClick={() => setSel(i)} className={"flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all " + (i===sel?"bg-white/8":"hover:bg-white/4")}>
              <span className="text-xl">{r.icon}</span>
              <div className="flex-1 text-left"><div className={"font-medium text-sm " + (i===sel?"text-white":"text-white/60")}>{r.title}</div><div className="text-white/25 text-xs">{r.sub}</div></div>
              {i===sel && <kbd className="bg-white/10 text-white/40 text-xs px-2 py-0.5 rounded font-mono">↵</kbd>}
            </div>
          ))}
        </div>
        <button className="bg-white text-black font-bold px-8 py-3.5 rounded-full text-sm hover:bg-gray-100 transition-colors">
          Try it now — it's free
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-cursor-v1', name: 'Hero Cursor V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'ai', 'startup'],
    tags: ['cursor', 'ai', 'code-editor', 'dark', 'developer', 'autocomplete'],
    description: 'Cursor.sh-inspired hero: dark, code editor mockup with AI autocomplete highlight', priority: 9,
    standaloneCode: `function HeroCursorV1() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
      <div className="absolute inset-0 opacity-30" style={{backgroundImage:'linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)',backgroundSize:'40px 40px'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-blue-300/60 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-10">
          AI that understands design
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          The AI that writes<br />
          <span style={{backgroundImage:'linear-gradient(135deg,#3b82f6,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>beautiful websites</span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-lg mx-auto leading-relaxed">Built from the ground up to understand design. Not just code — craft.</p>
        <div className="max-w-2xl mx-auto bg-[#161616] border border-white/8 rounded-2xl overflow-hidden mb-12 text-left font-mono shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
            <span className="text-white/20 text-xs ml-2">website.jsx</span>
          </div>
          <div className="p-5 text-sm">
            <div className="text-blue-400/70">function <span className="text-white/70">LandingPage</span>() {'{'}</div>
            <div className="text-white/40 pl-4">return (</div>
            <div className="text-white/40 pl-8">&lt;<span className="text-blue-300/70">HeroSection</span></div>
            <div className="pl-12 text-white/40">title=<span className="text-emerald-300/70">"Your amazing product"</span></div>
            <div className="bg-blue-500/15 border-l-2 border-blue-400 -mx-5 px-5 py-1 my-1">
              <span className="text-blue-300/80 pl-12">cta=</span><span className="text-blue-200/60 bg-blue-500/20 px-2 py-0.5 rounded text-xs">Tab to accept: "Get started free"</span>
            </div>
            <div className="text-white/40 pl-8">/&gt;</div>
            <div className="text-white/40 pl-4">)</div>
            <div className="text-blue-400/70">{'}'}</div>
          </div>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity">
          Try NexoGen AI free →
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-perplexity-v1', name: 'Hero Perplexity V1', category: 'hero', style: 'minimal', theme: 'dark',
    industries: ['saas', 'ai', 'startup'],
    tags: ['perplexity', 'search', 'ai', 'dark', 'teal', 'research'],
    description: 'Perplexity-inspired hero: search-first, AI answer streaming effect, clean dark', priority: 9,
    standaloneCode: `function HeroPerplexityV1() {
  const [query, setQuery] = React.useState('');
  const examples = ['Build me a SaaS landing page for my AI product','Create a portfolio for a freelance photographer','Make an e-commerce site for handmade jewelry'];
  const [exI, setExI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setExI(i => (i+1)%examples.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="min-h-screen bg-[#111118] flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.08) 0%, transparent 50%)'}} />
      <div className="relative z-10 text-center max-w-3xl w-full">
        <div className="text-white/20 text-xs uppercase tracking-widest font-semibold mb-6">NexoGen AI</div>
        <h1 className="font-black text-white mb-4 leading-tight" style={{fontSize:'clamp(2.5rem,6vw,4.5rem)',letterSpacing:'-0.04em'}}>
          Ask. Build. Ship.
        </h1>
        <p className="text-white/40 text-xl mb-10 leading-relaxed">
          Describe any website. Get production-ready code and a live preview in under 60 seconds.
        </p>
        <div className="relative mb-4">
          <div className="bg-[#1c1c24] border border-white/10 rounded-2xl overflow-hidden focus-within:border-teal-500/40 transition-all">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 text-left">
              <span className="text-teal-400 text-lg">✦</span>
              <span className="text-white/20 text-sm flex-1">{examples[exI]}</span>
              <kbd className="text-white/15 text-xs border border-white/10 px-2 py-1 rounded font-mono">↵</kbd>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Or type your own..." className="flex-1 bg-transparent text-white/70 placeholder-white/20 text-sm outline-none" />
              <button className="bg-teal-500 hover:bg-teal-400 text-black font-bold px-5 py-2 rounded-lg text-xs transition-colors">Generate</button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {['SaaS landing','Portfolio','E-commerce','Agency','Restaurant'].map(t => <button key={t} onClick={() => setQuery(t)} className="text-xs bg-white/5 border border-white/8 text-white/35 hover:text-teal-300 hover:border-teal-500/30 px-3 py-1.5 rounded-full transition-all">{t}</button>)}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-ramp-v1', name: 'Hero Ramp V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['fintech', 'saas', 'startup', 'business'],
    tags: ['ramp', 'fintech', 'green', 'card', 'metrics', 'business'],
    description: 'Ramp-inspired fintech hero: clean dark, green metrics, expense card mockup', priority: 8,
    standaloneCode: `function HeroRampV1() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden px-6 py-20">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 20%, rgba(22,163,74,0.07) 0%, transparent 50%)'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-300/70 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-10">
          <span className="text-emerald-400">↑</span> Average 3.5% cashback earned by customers
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          Build smarter.<br />
          <span style={{backgroundImage:'linear-gradient(135deg,#4ade80,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            Ship faster.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">The AI website builder that helps businesses move faster and look better. No dev team needed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-full text-sm transition-colors">
            Request early access
          </button>
          <button className="border border-white/10 text-white/50 font-medium px-8 py-4 rounded-full text-sm hover:border-white/20 hover:text-white/70 transition-all">
            See how it works →
          </button>
        </div>
        <div className="inline-flex items-center gap-6 bg-white/[0.03] border border-white/8 rounded-2xl px-8 py-5 flex-wrap justify-center">
          {[['50K+','Active users'],['$12M','Websites deployed'],['4.9★','Rating'],['< 60s','Generation']].map(([v,l]) => <div key={l} className="text-center px-4"><div className="text-xl font-black text-white">{v}</div><div className="text-white/25 text-xs mt-0.5">{l}</div></div>)}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-notion-v1', name: 'Hero Notion V1', category: 'hero', style: 'minimal', theme: 'light',
    industries: ['saas', 'productivity', 'startup'],
    tags: ['notion', 'minimal', 'light', 'clean', 'document', 'emoji'],
    description: 'Notion-inspired hero: clean white background, large emoji, document-like minimal layout', priority: 8,
    standaloneCode: `function HeroNotionV1() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="relative z-10 text-center max-w-3xl w-full">
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="font-black text-gray-950 mb-4 leading-tight" style={{fontSize:'clamp(2.5rem,6vw,4.5rem)',letterSpacing:'-0.04em'}}>
          Write, plan, and ship.
          <br />
          All in one place.
        </h1>
        <p className="text-gray-400 text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          The connected workspace where better, faster websites happen. AI-powered. Design-obsessed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-12">
          <button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-3.5 rounded-lg text-sm transition-colors">
            Get NexoGen free →
          </button>
          <button className="text-gray-400 text-sm font-medium hover:text-gray-700 transition-colors">
            Request a demo
          </button>
        </div>
        <div className="border border-gray-100 rounded-2xl p-6 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-5 h-5 rounded bg-black" />
            <div className="text-gray-400 text-xs font-medium">NexoGen workspace</div>
          </div>
          <div className="space-y-2 text-left">
            {['🌐 Generate landing page for SaaS startup','📊 Add pricing section with 3 tiers','🎨 Apply Stripe-inspired design system'].map(t => <div key={t} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 hover:border-gray-200 transition-colors cursor-pointer">{t}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-bento-v1', name: 'Hero Bento V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['bento', 'grid', 'dark', 'cards', 'premium', 'layout'],
    description: 'Bento-grid hero: text + asymmetric bento cards showing product features below fold', priority: 9,
    standaloneCode: `function HeroBentoV1() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 border border-white/10 text-white/40 text-xs px-4 py-1.5 rounded-full mb-8 bg-white/[0.03]">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Powered by GPT-4 Vision + Claude
          </div>
          <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,5.5rem)',letterSpacing:'-0.05em'}}>
            One prompt.<br />
            <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              Infinite possibilities.
            </span>
          </h1>
          <p className="text-white/40 text-xl max-w-xl mx-auto">The AI website builder that turns ideas into stunning, deployable websites.</p>
        </div>
        <div className="grid grid-cols-6 gap-3">
          <div className="col-span-6 md:col-span-4 bg-gradient-to-br from-violet-950 to-indigo-950 border border-violet-500/25 rounded-3xl p-8 h-48 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 80% 50%, rgba(139,92,246,0.5), transparent 50%)'}} />
            <div className="text-violet-300 font-bold mb-2 text-sm">AI Generation</div>
            <div className="text-white text-2xl font-black mb-2">Describe → Build</div>
            <div className="text-white/40 text-sm">Natural language to production website in under 60s</div>
          </div>
          <div className="col-span-6 md:col-span-2 bg-white/[0.03] border border-white/8 rounded-3xl p-6 h-48 flex flex-col justify-between">
            <div className="text-emerald-400 text-2xl font-black">50K+</div>
            <div className="text-white/40 text-sm">Teams using NexoGen today</div>
          </div>
          <div className="col-span-6 md:col-span-2 bg-white/[0.03] border border-white/8 rounded-3xl p-6 h-48 flex flex-col justify-between">
            <div className="text-3xl">⚡</div>
            <div><div className="text-white font-bold">60 seconds</div><div className="text-white/30 text-xs">Average generation time</div></div>
          </div>
          <div className="col-span-6 md:col-span-4 bg-gradient-to-br from-blue-950 to-cyan-950 border border-blue-500/20 rounded-3xl p-8 h-48 relative overflow-hidden">
            <div className="text-blue-300 font-bold mb-2 text-sm">Deploy anywhere</div>
            <div className="text-white text-2xl font-black mb-2">One click to live</div>
            <div className="text-blue-200/40 text-sm">Vercel, Netlify, custom domain</div>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors">Start building free</button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">See examples</button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-metrics-v1', name: 'Hero Metrics V1', category: 'hero', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['metrics', 'counters', 'dark', 'stats', 'premium', 'bold'],
    description: 'Metrics-forward hero: large animated counters, numbers as the hero visual', priority: 8,
    standaloneCode: `function HeroMetricsV1() {
  const [counts, setCounts] = React.useState([0,0,0,0]);
  const targets = [50000, 10000000, 99, 60];
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const interval = duration / steps;
      let step = 0;
      const t = setInterval(() => {
        step++;
        const progress = step/steps;
        const eased = 1-Math.pow(1-progress,3);
        setCounts(targets.map(v => Math.floor(v*eased)));
        if(step>=steps) clearInterval(t);
      }, interval);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  const metrics = [
    {v:counts[0].toLocaleString()+'+',l:'Teams worldwide',color:'text-violet-400'},
    {v:counts[1].toLocaleString()+'+',l:'Websites generated',color:'text-blue-400'},
    {v:counts[2]+'%',l:'Uptime SLA',color:'text-emerald-400'},
    {v:counts[3]+'s',l:'Avg. generation',color:'text-amber-400'},
  ];
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-20">
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="mb-6 text-white/20 text-xs uppercase tracking-[0.3em] font-semibold">NexoGen Platform</div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          Numbers don't lie.
        </h1>
        <p className="text-white/40 text-xl mb-16 max-w-lg mx-auto">The world's most-used AI website builder. Here's why.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {metrics.map((m,i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 hover:border-white/12 transition-all">
              <div className={"text-4xl font-black mb-2 " + m.color}>{m.v}</div>
              <div className="text-white/30 text-sm">{m.l}</div>
            </div>
          ))}
        </div>
        <button className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors">
          Join them — it's free →
        </button>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-waitlist-v1', name: 'Hero Waitlist V1', category: 'hero', style: 'minimal', theme: 'dark',
    industries: ['startup', 'saas', 'ai'],
    tags: ['waitlist', 'email', 'dark', 'minimal', 'launch', 'exclusive'],
    description: 'Pre-launch waitlist hero: email input as primary focus, position counter, social proof', priority: 8,
    standaloneCode: `function HeroWaitlistV1() {
  const [email, setEmail] = React.useState('');
  const [joined, setJoined] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const handleJoin = () => {
    if(!email) return;
    setPosition(Math.floor(Math.random()*500)+5200);
    setJoined(true);
  };
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 60%)'}} />
      <div className="relative z-10 text-center max-w-2xl w-full">
        <div className="inline-flex items-center gap-2 text-white/40 text-xs mb-10 font-mono bg-white/5 px-4 py-2 rounded-full border border-white/8">
          🔐 Private beta · Limited access
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,5.5rem)',letterSpacing:'-0.05em'}}>
          The waitlist
          <br />
          <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#c084fc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            is open.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-10 leading-relaxed">
          NexoGen is invite-only right now. Join 5,000+ builders waiting for access.
        </p>
        {!joined ? (
          <div>
            <div className="flex gap-2 mb-4">
              <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && handleJoin()} type="email" placeholder="your@email.com" className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-5 py-4 text-sm outline-none focus:border-violet-500/50 transition-colors" />
              <button onClick={handleJoin} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-7 py-4 rounded-xl text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                Join waitlist
              </button>
            </div>
            <div className="flex -space-x-2 justify-center mb-3">{['bg-violet-400','bg-blue-400','bg-pink-400','bg-emerald-400','bg-amber-400'].map((c,i) => <div key={i} className={"w-7 h-7 rounded-full " + c + " border-2 border-black"} />)}</div>
            <p className="text-white/25 text-xs">5,247 people on the waitlist · No spam ever</p>
          </div>
        ) : (
          <div className="bg-violet-500/10 border border-violet-500/25 rounded-2xl p-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-white font-black text-2xl mb-2">You're on the list!</div>
            <div className="text-white/40 mb-2">Your position: <span className="text-violet-400 font-bold">#{position.toLocaleString()}</span></div>
            <div className="text-white/25 text-sm">Refer friends to move up the list faster.</div>
          </div>
        )}
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-split-v1', name: 'Hero Split V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['split', 'asymmetric', 'dark', 'product-preview', 'premium'],
    description: 'Split-layout hero: left text + CTA, right animated product dashboard mockup', priority: 9,
    standaloneCode: `function HeroSplitV1() {
  return (
    <div className="min-h-screen bg-[#060609] flex items-center overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center w-full">
        <div>
          <div className="inline-flex items-center gap-2 text-xs text-violet-300/60 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-full mb-8 font-medium">
            ✦ AI-powered website generation
          </div>
          <h1 className="font-black text-white leading-none mb-6" style={{fontSize:'clamp(2.5rem,5vw,4rem)',letterSpacing:'-0.05em'}}>
            Build websites
            <br />that convert,
            <br />
            <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              in 60 seconds.
            </span>
          </h1>
          <p className="text-white/40 text-lg mb-10 leading-relaxed max-w-sm">Describe your vision in plain English. Get a production-ready website instantly.</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-10">
            <button className="bg-white text-black font-bold px-7 py-3.5 rounded-full text-sm hover:bg-gray-100 transition-colors">
              Start for free →
            </button>
            <button className="border border-white/10 text-white/50 px-7 py-3.5 rounded-full text-sm hover:border-white/20 hover:text-white/70 transition-all font-medium">
              Watch demo
            </button>
          </div>
          <div className="flex items-center gap-4 text-white/25 text-sm">
            <span>✓ Free forever plan</span>
            <span>✓ No credit card</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-blue-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-[#111118] border border-white/8 rounded-3xl overflow-hidden">
            <div className="bg-[#0a0a10] border-b border-white/5 px-4 py-3 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              <div className="flex-1 text-center text-xs text-white/20 font-mono">nexogen.app/preview</div>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gradient-to-r from-violet-900/50 to-indigo-900/50 border border-violet-500/20 rounded-2xl p-6">
                <div className="h-3 bg-white/20 rounded w-2/3 mb-2" /><div className="h-2 bg-white/10 rounded w-full mb-1" /><div className="h-2 bg-white/10 rounded w-4/5" />
                <div className="mt-4 flex gap-2"><div className="bg-violet-500 rounded-full px-3 py-1 text-xs text-white font-bold">CTA</div><div className="border border-white/15 rounded-full px-3 py-1 text-xs text-white/40">Learn more</div></div>
              </div>
              <div className="grid grid-cols-3 gap-2">{['from-blue-900/40 to-cyan-900/40','from-emerald-900/40 to-teal-900/40','from-pink-900/40 to-rose-900/40'].map((g,i) => <div key={i} className={"bg-gradient-to-br " + g + " rounded-xl p-3 border border-white/8"}><div className="h-2 bg-white/15 rounded mb-1.5 w-3/4" /><div className="h-2 bg-white/8 rounded w-full" /></div>)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-terminal-v1', name: 'Hero Terminal V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['terminal', 'cli', 'developer', 'dark', 'monospace', 'code'],
    description: 'Developer-focused terminal hero: CLI install command, output animation, dark', priority: 7,
    standaloneCode: `function HeroTerminalV1() {
  const lines = [
    {t:'$ npx create-nexogen@latest my-website', c:'text-white/70'},
    {t:'✓ Installing packages...', c:'text-white/40'},
    {t:'✓ Setting up AI pipeline...', c:'text-white/40'},
    {t:'✓ Generating components...', c:'text-white/40'},
    {t:'', c:''},
    {t:'🚀 Your website is ready!', c:'text-emerald-400'},
    {t:'   → Local:   http://localhost:3000', c:'text-white/40'},
    {t:'   → Preview: https://abc.nexogen.app', c:'text-blue-400'},
  ];
  const [visible, setVisible] = React.useState(1);
  React.useEffect(() => {
    if(visible<lines.length) {
      const t = setTimeout(() => setVisible(v=>v+1), visible===0?500:350);
      return () => clearTimeout(t);
    }
  }, [visible]);
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center px-6 py-20">
      <div className="relative z-10 text-center max-w-4xl w-full">
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,5.5rem)',letterSpacing:'-0.05em'}}>
          For developers who<br />
          <span className="text-white/20">don't want to wait.</span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-lg mx-auto">One command. A complete website. No configuration, no fuss.</p>
        <div className="max-w-xl mx-auto bg-[#111] border border-white/8 rounded-2xl overflow-hidden text-left shadow-2xl mb-10">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a0a0a]">
            <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="text-white/20 text-xs ml-2 font-mono">bash</span>
          </div>
          <div className="p-6 font-mono space-y-1.5 min-h-[180px]">
            {lines.slice(0, visible).map((l, i) => l.t ? <div key={i} className={"text-sm " + l.c}>{l.t}</div> : <div key={i} className="h-2" />)}
            {visible < lines.length && <span className="inline-block w-2 h-4 bg-white/60 animate-pulse" />}
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <button className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors">
            Get started free
          </button>
          <button className="border border-white/10 text-white/50 px-8 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            View docs →
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-gradient-v1', name: 'Hero Gradient V1', category: 'hero', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'design'],
    tags: ['gradient', 'bold', 'full-bleed', 'vivid', 'colorful', 'premium'],
    description: 'Full-bleed vivid gradient hero: bold type, high-energy colors, premium feel', priority: 8,
    standaloneCode: `function HeroGradientV1() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden" style={{background:'linear-gradient(135deg, #1a0533 0%, #0a0a2e 30%, #001a4d 60%, #0a2440 100%)'}}>
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.25) 0%, transparent 40%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.2) 0%, transparent 40%), radial-gradient(ellipse at 80% 10%, rgba(236,72,153,0.15) 0%, transparent 35%)'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 mb-10 text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full" style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(196,181,253,0.9)'}}>
          🏆 #1 AI Website Builder 2024
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,9vw,7rem)',letterSpacing:'-0.05em',textShadow:'0 0 120px rgba(139,92,246,0.3)'}}>
          Websites that
          <br />
          <span style={{backgroundImage:'linear-gradient(90deg,#e879f9,#a78bfa,#60a5fa,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            stop the scroll.
          </span>
        </h1>
        <p className="text-white/50 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
          AI-generated websites so good, your visitors won't believe a human didn't design them.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <button className="font-black px-12 py-5 rounded-full text-base text-black transition-all hover:scale-105" style={{background:'linear-gradient(135deg,#a78bfa,#60a5fa)'}}>
            Start creating free →
          </button>
          <button className="border border-white/15 text-white font-semibold px-12 py-5 rounded-full hover:bg-white/5 transition-all">
            Browse showcase
          </button>
        </div>
        <p className="text-white/20 text-sm">No credit card · 10,000+ websites built this week</p>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-announcement-v1', name: 'Hero Announcement V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['startup', 'saas', 'ai'],
    tags: ['announcement', 'launch', 'product-hunt', 'dark', 'celebration', 'badge'],
    description: 'Product launch hero: PH #1 badge, celebration, launch metrics, viral-ready design', priority: 7,
    standaloneCode: `function HeroAnnouncementV1() {
  return (
    <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 30%, rgba(251,146,60,0.07) 0%, transparent 50%)'}} />
      <div className="relative z-10 text-center max-w-4xl w-full">
        <div className="inline-flex items-center gap-3 mb-10 px-5 py-3 rounded-2xl text-sm font-bold" style={{background:'linear-gradient(135deg,rgba(251,146,60,0.15),rgba(239,68,68,0.10))',border:'1px solid rgba(251,146,60,0.25)',color:'#fb923c'}}>
          🏆 #1 Product of the Day on Product Hunt
          <div className="flex -space-x-1">{[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          NexoGen 2.0
          <br />
          <span style={{backgroundImage:'linear-gradient(135deg,#fb923c,#f472b6)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            is officially live.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          After 8 months in private beta, the most powerful AI website builder is open to everyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <button className="font-bold px-10 py-4 rounded-full text-black hover:opacity-90 transition-opacity" style={{background:'linear-gradient(135deg,#fb923c,#f472b6)'}}>
            Try it free now →
          </button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            Read the launch post
          </button>
        </div>
        <div className="flex justify-center gap-8 flex-wrap">
          {[['847','Product Hunt votes'],['10K+','Day 1 signups'],['4.9/5','App Store rating']].map(([v,l]) => <div key={l} className="text-center"><div className="text-white font-black text-2xl">{v}</div><div className="text-white/25 text-xs mt-1">{l}</div></div>)}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-api-v1', name: 'Hero API V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['api', 'developer', 'dark', 'code', 'json', 'technical'],
    description: 'API-focused developer hero: JSON payload preview, endpoint examples, developer tone', priority: 7,
    standaloneCode: `function HeroApiV1() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center px-6 py-20">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-full mb-8">
            <span className="text-emerald-400">●</span> REST API · GraphQL · SDK
          </div>
          <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(2.5rem,5vw,4rem)',letterSpacing:'-0.05em'}}>
            The website generation
            <br />
            <span style={{backgroundImage:'linear-gradient(135deg,#4ade80,#22d3ee)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              API for developers.
            </span>
          </h1>
          <p className="text-white/40 text-lg mb-10 leading-relaxed">One API call. A complete, styled, and deployable website. Built for teams who need speed at scale.</p>
          <div className="flex gap-3">
            <button className="bg-white text-black font-bold px-7 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors">Get API key free</button>
            <button className="border border-white/10 text-white/50 px-7 py-3.5 rounded-xl text-sm hover:border-white/20 transition-all font-medium">View docs →</button>
          </div>
        </div>
        <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden font-mono text-xs">
          <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
            <span className="text-white/30">POST /api/v1/generate</span>
            <span className="text-emerald-400 text-xs">200 OK</span>
          </div>
          <div className="p-5 space-y-1 text-white/50">
            <div><span className="text-blue-400">{'{'}</span></div>
            <div className="pl-4"><span className="text-violet-300">"prompt"</span><span className="text-white/30">: </span><span className="text-emerald-300">"SaaS landing page for AI startup"</span><span className="text-white/30">,</span></div>
            <div className="pl-4"><span className="text-violet-300">"style"</span><span className="text-white/30">: </span><span className="text-emerald-300">"modern"</span><span className="text-white/30">,</span></div>
            <div className="pl-4"><span className="text-violet-300">"sections"</span><span className="text-white/30">: [</span><span className="text-amber-300">"hero"</span><span className="text-white/30">, </span><span className="text-amber-300">"features"</span><span className="text-white/30">, </span><span className="text-amber-300">"pricing"</span><span className="text-white/30">]</span></div>
            <div><span className="text-blue-400">{'}'}</span></div>
            <div className="my-3 border-t border-white/5 pt-3 text-emerald-400/70">// Response:</div>
            <div><span className="text-blue-400">{'{'}</span></div>
            <div className="pl-4"><span className="text-violet-300">"status"</span><span className="text-white/30">: </span><span className="text-emerald-300">"success"</span><span className="text-white/30">,</span></div>
            <div className="pl-4"><span className="text-violet-300">"url"</span><span className="text-white/30">: </span><span className="text-emerald-300">"https://ai-startup.nexogen.app"</span><span className="text-white/30">,</span></div>
            <div className="pl-4"><span className="text-violet-300">"time_ms"</span><span className="text-white/30">: </span><span className="text-amber-300">1847</span></div>
            <div><span className="text-blue-400">{'}'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-floating-v1', name: 'Hero Floating V1', category: 'hero', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['floating', 'glass', 'cards', 'dark', 'premium', 'notifications'],
    description: 'Floating UI elements hero: multiple notification/metric cards orbit central heading', priority: 9,
    standaloneCode: `function HeroFloatingV1() {
  return (
    <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center px-6 relative overflow-hidden py-20">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)'}} />
      <div className="absolute left-[5%] top-[20%] bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 hidden md:flex items-center gap-3 shadow-lg" style={{transform:'rotate(-3deg)'}}>
        <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-400 text-sm">↑</div>
        <div><div className="text-white text-xs font-bold">+127% conversions</div><div className="text-white/30 text-xs">after redesign</div></div>
      </div>
      <div className="absolute right-[5%] top-[25%] bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 hidden md:flex items-center gap-3 shadow-lg" style={{transform:'rotate(2deg)'}}>
        <span className="text-xl">🚀</span>
        <div><div className="text-white text-xs font-bold">Site deployed</div><div className="text-white/30 text-xs">2 seconds ago</div></div>
      </div>
      <div className="absolute left-[8%] bottom-[25%] bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 hidden md:block shadow-lg" style={{transform:'rotate(1deg)'}}>
        <div className="flex gap-0.5 mb-1">{[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-xs">★</span>)}</div>
        <div className="text-white text-xs font-bold">"Insane product quality"</div>
        <div className="text-white/30 text-xs">@devbuilder on X</div>
      </div>
      <div className="absolute right-[8%] bottom-[30%] bg-gradient-to-br from-violet-500/15 to-indigo-500/10 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-4 hidden md:block shadow-lg" style={{transform:'rotate(-2deg)'}}>
        <div className="text-white/40 text-xs mb-1">Generation time</div>
        <div className="text-white font-black text-2xl">47s</div>
      </div>
      <div className="relative z-10 text-center max-w-4xl w-full">
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,9vw,7rem)',letterSpacing:'-0.05em'}}>
          Websites that
          <br />
          <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#818cf8,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            wow clients.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">Generate stunning, production-ready websites in seconds. No design skills needed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors">
            Start building free
          </button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            See examples
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-product-v1', name: 'Hero Product V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['product', 'screenshot', 'dark', 'premium', 'showcase', 'dashboard'],
    description: 'Product showcase hero: text above with product UI screenshot below as hero element', priority: 9,
    standaloneCode: `function HeroProductV1() {
  return (
    <div className="min-h-screen bg-black px-6 py-20 flex flex-col">
      <div className="max-w-5xl mx-auto w-full flex flex-col flex-1">
        <div className="text-center mb-16 flex-shrink-0">
          <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(2.5rem,7vw,5rem)',letterSpacing:'-0.05em'}}>
            Your website, perfected
            <br />
            <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#60a5fa)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
              by AI.
            </span>
          </h1>
          <p className="text-white/40 text-xl mb-8 max-w-xl mx-auto">Built for founders, designers, and developers who want to move at the speed of thought.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-black font-bold px-8 py-3.5 rounded-full text-sm hover:bg-gray-100 transition-colors">Start building free</button>
            <button className="border border-white/10 text-white/50 px-8 py-3.5 rounded-full text-sm hover:border-white/20 transition-all font-medium">Watch 90s demo →</button>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-0 -top-4 bg-gradient-to-b from-transparent to-violet-900/5 pointer-events-none" />
          <div className="bg-[#0d0d12] border border-white/8 rounded-3xl overflow-hidden shadow-2xl" style={{boxShadow:'0 40px 120px rgba(139,92,246,0.12)'}}>
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5 bg-[#080810]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="flex-1 text-center"><div className="inline-block bg-white/5 border border-white/8 text-white/30 text-xs px-6 py-1 rounded-full font-mono">nexogen.app/builder</div></div>
            </div>
            <div className="p-5 grid grid-cols-4 gap-3 min-h-[220px]">
              <div className="col-span-1 bg-white/[0.02] border border-white/6 rounded-xl p-3 space-y-2">
                {['Hero','Features','Pricing','Testimonials','Footer'].map(s => <div key={s} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400/50 shrink-0" /><div className="text-white/30 text-xs">{s}</div></div>)}
              </div>
              <div className="col-span-3 space-y-3">
                <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/30 border border-violet-500/15 rounded-xl p-5">
                  <div className="h-3 bg-white/20 rounded w-1/2 mb-2" /><div className="h-2 bg-white/10 rounded w-3/4 mb-1" /><div className="h-2 bg-white/10 rounded w-2/3" />
                  <div className="flex gap-2 mt-3"><div className="bg-violet-500/70 rounded-full h-2 w-12" /><div className="bg-white/10 rounded-full h-2 w-8" /></div>
                </div>
                <div className="grid grid-cols-3 gap-2">{['from-blue-900/30 to-cyan-900/20','from-emerald-900/30 to-teal-900/20','from-pink-900/30 to-rose-900/20'].map((g,i) => <div key={i} className={"bg-gradient-to-br " + g + " border border-white/6 rounded-xl p-3"}><div className="h-2 bg-white/15 rounded mb-1 w-3/4" /><div className="h-2 bg-white/8 rounded w-full" /></div>)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-globe-v1', name: 'Hero Globe V1', category: 'hero', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'global', 'enterprise'],
    tags: ['globe', 'world', 'dark', 'network', 'global', 'enterprise'],
    description: 'Global reach hero: animated dot-grid world map, worldwide team focus, dark premium', priority: 7,
    standaloneCode: `function HeroGlobeV1() {
  const dots = [];
  const rows = 10; const cols = 24;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) {
    const active = Math.random()>0.45;
    dots.push({r,c,active,highlight:Math.random()>0.88});
  }
  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="grid gap-2" style={{gridTemplateColumns:\`repeat(\${cols}, 1fr)\`}}>
          {dots.map((d,i) => <div key={i} className={"w-1.5 h-1.5 rounded-full transition-all " + (d.highlight?"bg-violet-400 animate-pulse":d.active?"bg-white/25":"bg-white/5")} />)}
        </div>
      </div>
      <div className="relative z-10 text-center max-w-4xl w-full">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-white/40 bg-white/5 border border-white/8 px-4 py-2 rounded-full mb-10">
          🌍 Used in 140+ countries
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,8vw,6rem)',letterSpacing:'-0.05em'}}>
          Built for teams<br />
          <span style={{backgroundImage:'linear-gradient(135deg,#a78bfa,#60a5fa,#34d399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            across the globe.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
          From solo founders in Berlin to enterprise teams in Singapore. NexoGen works for everyone, everywhere.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <button className="bg-white text-black font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-colors">
            Get started globally
          </button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            View all regions
          </button>
        </div>
        <div className="flex justify-center gap-8 flex-wrap text-sm">
          {[['50K+','Teams'],['140+','Countries'],['99.9%','Uptime'],['24/7','Support']].map(([v,l]) => <div key={l} className="text-center"><div className="text-white font-black">{v}</div><div className="text-white/25 text-xs">{l}</div></div>)}
        </div>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'hero-product-hunt-v1', name: 'Hero Product Hunt V1', category: 'hero', style: 'modern', theme: 'dark',
    industries: ['startup', 'saas', 'ai'],
    tags: ['dark', 'glassmorphism', 'floating', 'premium', 'saas'],
    description: 'Dark glassmorphism hero: floating glass cards with metrics, violet glow, premium SaaS', priority: 8,
    standaloneCode: `function HeroProductHuntV1() {
  const features = [
    {icon:'⚡',title:'Lightning fast',desc:'< 60s to live'},
    {icon:'🎨',title:'Design-perfect',desc:'100+ components'},
    {icon:'🚀',title:'One-click deploy',desc:'Go live instantly'},
    {icon:'🤖',title:'AI-powered',desc:'GPT-4 + Claude'},
  ];
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(88,28,135,0.15) 0%, transparent 60%)'}} />
      <div className="absolute inset-0" style={{backgroundImage:'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',backgroundSize:'60px 60px'}} />
      <div className="relative z-10 text-center max-w-5xl w-full">
        <div className="inline-flex items-center gap-2 mb-10 text-sm font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-5 py-2.5 rounded-full">
          <span className="text-lg">✦</span>
          Backed by Y Combinator
        </div>
        <h1 className="font-black text-white mb-6 leading-none" style={{fontSize:'clamp(3rem,9vw,6.5rem)',letterSpacing:'-0.05em'}}>
          The AI that builds
          <br />
          <span style={{backgroundImage:'linear-gradient(135deg,#c084fc,#a78bfa,#818cf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            beautiful websites.
          </span>
        </h1>
        <p className="text-white/40 text-xl mb-14 max-w-2xl mx-auto leading-relaxed">Describe it. Generate it. Deploy it. The complete AI website builder trusted by 50,000+ teams.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {features.map((f,i) => (
            <div key={i} className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-violet-500/30 hover:bg-white/[0.06] transition-all cursor-default">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{f.title}</div>
              <div className="text-white/30 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-10 py-4 rounded-full hover:opacity-90 transition-opacity">
            Start building free →
          </button>
          <button className="border border-white/10 text-white/50 px-10 py-4 rounded-full hover:border-white/20 transition-all font-medium">
            See live examples
          </button>
        </div>
      </div>
    </div>
  );
}`,
  },
];
