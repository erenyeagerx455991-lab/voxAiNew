import type { ComponentDef } from '../../types';

export const premiumCtaComponents: ComponentDef[] = [
  {
    id: 'cta-linear-v1', name: 'CTA Linear V1', category: 'cta', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['linear', 'minimal', 'dark', 'clean', 'white-bg'],
    description: 'Linear.app-style CTA: minimal dark, centered text, white CTA button, no frills', priority: 10,
    standaloneCode: `function CtaLinearV1() {
  return (
    <section className="py-32 bg-black">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-black text-white mb-6" style={{fontSize:'clamp(2.5rem,5vw,4.5rem)',letterSpacing:'-0.04em'}}>
          Start building today.
          <br />
          <span className="text-white/30">It's free.</span>
        </h2>
        <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
          Join 50,000+ teams who have already switched to NexoGen. No credit card required. No setup fees. Just build.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button className="bg-white text-black font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-colors text-sm">
            Get started for free →
          </button>
          <span className="text-white/20 text-xs">or</span>
          <button className="text-white/40 hover:text-white/70 text-sm font-medium transition-colors">
            Book a demo
          </button>
        </div>
        <p className="text-white/15 text-xs mt-8">No credit card · No setup · Cancel anytime</p>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-vercel-v1', name: 'CTA Vercel V1', category: 'cta', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['vercel', 'deploy', 'dark', 'gradient', 'developer'],
    description: 'Vercel-style deploy CTA: dark with gradient glow, deploy-focused messaging', priority: 9,
    standaloneCode: `function CtaVercelV1() {
  return (
    <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.15) 0%, transparent 60%)'}}>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <div className="border border-white/10 rounded-3xl p-12 md:p-16 bg-white/[0.02] backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-white/40 text-xs font-mono mb-8 bg-white/5 px-4 py-2 rounded-lg border border-white/8">
              <span className="text-emerald-400">$</span> npx create-nexogen@latest
            </div>
            <h2 className="font-black text-white mb-6" style={{fontSize:'clamp(2rem,5vw,4rem)',letterSpacing:'-0.04em'}}>
              Your website, deployed in 60 seconds.
            </h2>
            <p className="text-white/40 text-lg mb-10 max-w-lg mx-auto">No configuration. No DevOps. No waiting. Just ship.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm hover:bg-gray-100 transition-colors">
                Deploy now →
              </button>
              <button className="border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium px-8 py-4 rounded-xl transition-all">
                Read the docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-stripe-v1', name: 'CTA Stripe V1', category: 'cta', style: 'bold', theme: 'dark',
    industries: ['saas', 'fintech', 'startup'], tags: ['stripe', 'gradient-bg', 'dark', 'premium', 'trust'],
    description: 'Stripe-style CTA: deep blue gradient bg, trust signals, prominent conversion', priority: 9,
    standaloneCode: `function CtaStripeV1() {
  return (
    <section className="py-24 relative overflow-hidden" style={{background:'linear-gradient(135deg, #0a2540 0%, #1a1a6e 40%, #2d1b69 100%)'}}>
      <div className="absolute inset-0 opacity-40" style={{backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(99,91,255,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(0,112,243,0.15) 0%, transparent 50%)'}}>
      </div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-blue-200 text-xs px-4 py-2 rounded-full mb-10 font-medium">
          🔒 SOC 2 · GDPR · ISO 27001
        </div>
        <h2 className="font-black text-white mb-6" style={{fontSize:'clamp(2rem,5vw,4rem)',letterSpacing:'-0.03em'}}>
          The infrastructure that
          <br />powers the internet.
        </h2>
        <p className="text-blue-200/60 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
          Millions of builders trust NexoGen to power their web presence. Join them and build something the world will use.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <button className="bg-[#635bff] hover:bg-[#5549e8] text-white font-bold px-10 py-4 rounded-full text-base transition-colors shadow-xl shadow-[#635bff]/30">
            Start building now →
          </button>
          <button className="border-2 border-white/15 text-white font-semibold px-10 py-4 rounded-full hover:bg-white/10 transition-all">
            Contact sales
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-blue-200/40 text-sm">
          <span>✓ No setup fees</span>
          <span>✓ Cancel anytime</span>
          <span>✓ 14-day free trial</span>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-newsletter-v1', name: 'CTA Newsletter V1', category: 'cta', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['newsletter', 'email', 'subscribe', 'dark', 'social-proof'],
    description: 'Newsletter subscription CTA: social proof, reader count, email input', priority: 7,
    standaloneCode: `function CtaNewsletterV1() {
  const [email, setEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="flex -space-x-2">{['bg-violet-400','bg-blue-400','bg-pink-400','bg-emerald-400'].map((c,i) => <div key={i} className={"w-8 h-8 rounded-full " + c + " border-2 border-[#060609]"} />)}</div>
          <span className="text-white/40 text-sm">14,200+ readers</span>
        </div>
        <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-0.03em'}}>
          The weekly newsletter for AI builders
        </h2>
        <p className="text-white/40 text-lg mb-10">Component tips, AI design patterns, and early access to new features. Every Thursday.</p>
        {subscribed ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <div className="text-white font-bold text-xl mb-2">You're in! 🎉</div>
            <div className="text-white/40 text-sm">Check your inbox for a welcome email.</div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/25 rounded-xl px-5 py-4 text-sm outline-none focus:border-violet-500/50 transition-colors" />
            <button onClick={() => email && setSubscribed(true)} className="bg-white text-black font-bold px-8 py-4 rounded-xl text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
              Subscribe →
            </button>
          </div>
        )}
        <p className="text-white/20 text-xs mt-4">No spam. Unsubscribe anytime. Read by teams at Stripe, Vercel, and Linear.</p>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-demo-v1', name: 'CTA Demo V1', category: 'cta', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['demo', 'sales', 'dark', 'calendar', 'b2b'],
    description: 'Book a demo CTA: benefits of the call, calendar scheduling, social proof', priority: 8,
    standaloneCode: `function CtaDemoV1() {
  const benefits = ['See a live AI website generation','Get a custom plan recommendation','Meet your dedicated account manager','30-minute, no-pressure call'];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center bg-white/[0.02] border border-white/8 rounded-3xl p-10 md:p-14">
          <div>
            <div className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-4">Book a demo</div>
            <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,2.5rem)',letterSpacing:'-0.03em'}}>
              See NexoGen build your website live
            </h2>
            <p className="text-white/40 leading-relaxed mb-8">Schedule a 30-minute demo with a product expert. We'll generate a website for your specific use case in real time.</p>
            <div className="space-y-3 mb-8">
              {benefits.map(b => <div key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-violet-400" /></div>
                <span className="text-white/60 text-sm">{b}</span>
              </div>)}
            </div>
            <div className="flex items-center gap-3 text-white/30 text-sm">
              <div className="flex -space-x-2">{['bg-violet-500','bg-blue-500','bg-pink-500'].map((c,i) => <div key={i} className={"w-7 h-7 rounded-full " + c + " border-2 border-[#050508]"} />)}</div>
              <span>Avg. response time: 2 hours</span>
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-8">
            <div className="text-white font-bold mb-6">Choose a time that works</div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['Mon 9am','Mon 2pm','Tue 10am','Tue 3pm','Wed 11am','Wed 4pm'].map(t => <button key={t} className="border border-white/10 text-white/40 text-xs py-2.5 rounded-lg hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all">{t}</button>)}
            </div>
            <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 rounded-xl text-sm hover:opacity-90 transition-opacity">
              Schedule demo →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-countdown-v1', name: 'CTA Countdown V1', category: 'cta', style: 'bold', theme: 'dark',
    industries: ['startup', 'ecommerce', 'saas'], tags: ['countdown', 'urgency', 'launch', 'dark', 'animated'],
    description: 'Urgency CTA with live countdown timer, limited spots, launch deadline', priority: 7,
    standaloneCode: `function CtaCountdownV1() {
  const [time, setTime] = React.useState({h:23,m:47,s:33});
  React.useEffect(() => {
    const t = setInterval(() => setTime(({h,m,s}) => {
      if(s>0) return {h,m,s:s-1};
      if(m>0) return {h,m:m-1,s:59};
      if(h>0) return {h:h-1,m:59,s:59};
      return {h:23,m:59,s:59};
    }), 1000);
    return () => clearInterval(t);
  }, []);
  const pad = n => String(n).padStart(2,'0');
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.08) 0%, transparent 60%)'}}>
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-4 py-2 rounded-full mb-10 font-semibold">
          🔥 Launch pricing ends soon
        </div>
        <h2 className="font-black text-white mb-8" style={{fontSize:'clamp(2rem,5vw,3.5rem)',letterSpacing:'-0.04em'}}>
          Lock in 60% off before it's gone
        </h2>
        <div className="flex items-center justify-center gap-4 mb-12">
          {[{v:pad(time.h),l:'Hours'},{v:pad(time.m),l:'Minutes'},{v:pad(time.s),l:'Seconds'}].map((t,i) => <React.Fragment key={i}><div className="text-center"><div className="bg-white/10 border border-white/15 rounded-2xl px-6 py-4 mb-2"><div className="text-4xl font-black text-white font-mono">{t.v}</div></div><div className="text-white/30 text-xs">{t.l}</div></div>{i<2&&<div className="text-white/20 text-3xl font-black mb-6">:</div>}</React.Fragment>)}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between text-sm mb-3"><span className="text-white/50">Spots remaining</span><span className="text-red-400 font-bold">3 left</span></div>
          <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-red-400 h-2 rounded-full" style={{width:'94%'}} /></div>
          <div className="text-white/30 text-xs mt-2">47 of 50 spots taken</div>
        </div>
        <button className="w-full md:w-auto bg-gradient-to-r from-red-600 to-orange-600 text-white font-black px-12 py-5 rounded-full text-base hover:opacity-90 transition-opacity">
          Claim my spot at 60% off →
        </button>
        <p className="text-white/20 text-sm mt-4">Price goes to $99/mo after launch. Lock in $29/mo forever.</p>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-social-proof-v1', name: 'CTA Social Proof V1', category: 'cta', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['social-proof', 'testimonial', 'dark', 'trust', 'combined'],
    description: 'CTA with embedded testimonial: quote + metrics + action button in one section', priority: 8,
    standaloneCode: `function CtaSocialProofV1() {
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-500/25 rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-white/10 text-8xl font-black leading-none mb-2" style={{fontFamily:'Georgia,serif'}}>"</div>
              <blockquote className="text-white text-xl font-medium leading-relaxed -mt-6 mb-6">
                NexoGen saved our agency $200K in developer costs and helped us deliver 3× more projects. It's not a nice-to-have — it's core infrastructure now.
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">J</div>
                <div><div className="text-white font-bold text-sm">Jordan Martinez</div><div className="text-white/40 text-xs">CEO, DigitalFirst Agency</div></div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-center">
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                {[['3×','More projects'],['$200K','Saved/year'],['14d','→ 2h timeline'],['100%','Client retention']].map(([v,l]) => <div key={l} className="bg-white/5 border border-white/8 rounded-xl p-4 text-center"><div className="text-white font-black text-2xl">{v}</div><div className="text-white/30 text-xs mt-1">{l}</div></div>)}
              </div>
              <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity text-sm">
                Get similar results →
              </button>
              <p className="text-white/20 text-xs mt-3 text-center">Free trial · No credit card</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-product-trial-v1', name: 'CTA Product Trial V1', category: 'cta', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['trial', 'interactive', 'dark', 'prompt', 'try-now'],
    description: 'Interactive trial CTA: mini prompt input, shows what AI can build right in the CTA', priority: 9,
    standaloneCode: `function CtaProductTrialV1() {
  const [prompt, setPrompt] = React.useState('');
  const [building, setBuilding] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const examples = ['SaaS landing page for my AI startup','Restaurant website for Biryani House','Portfolio for a freelance designer'];
  const handleBuild = () => {
    if (!prompt) return;
    setBuilding(true);
    setTimeout(() => { setBuilding(false); setDone(true); }, 2500);
  };
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.03em'}}>Try it right now. Free.</h2>
        <p className="text-white/40 text-lg mb-10">No signup. No credit card. Just describe what you want to build.</p>
        {!done ? (
          <div>
            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 focus-within:border-violet-500/40 transition-all">
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the website you want..." rows={3} className="w-full bg-transparent text-white placeholder-white/25 text-base outline-none resize-none" />
              <div className="flex justify-end mt-2">
                <button onClick={handleBuild} disabled={!prompt || building} className={"px-6 py-2.5 rounded-xl font-bold text-sm transition-all " + (prompt && !building?"bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90":"bg-white/5 text-white/25 cursor-not-allowed")}>
                  {building ? "Building..." : "Build website →"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {examples.map(e => <button key={e} onClick={() => setPrompt(e)} className="text-xs bg-white/5 border border-white/8 text-white/40 hover:text-white/70 px-3 py-1.5 rounded-full transition-all">{e}</button>)}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10">
            <div className="text-5xl mb-4">🚀</div>
            <div className="text-white font-black text-2xl mb-2">Ready to see it live?</div>
            <div className="text-white/40 mb-8">Your website was generated. Sign up to see the full result and deploy it.</div>
            <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-10 py-4 rounded-full hover:opacity-90 transition-opacity">Create free account →</button>
          </div>
        )}
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-floating-v1', name: 'CTA Floating V1', category: 'cta', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['floating', 'glassmorphism', 'dark', 'elegant', 'cards'],
    description: 'Glassmorphism CTA: floating card with blur, gradient border, premium aesthetic', priority: 8,
    standaloneCode: `function CtaFloatingV1() {
  return (
    <section className="py-32 bg-[#050508] relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.12) 0%, transparent 60%)'}}>
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" />
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-white/[0.05] backdrop-blur-2xl border border-white/15 rounded-3xl p-12 text-center">
            <div className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-6">Get started</div>
            <h2 className="font-black text-white mb-5" style={{fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-0.03em'}}>
              The future of building
              <br />websites is here
            </h2>
            <p className="text-white/40 text-lg mb-10 leading-relaxed">
              50,000+ teams are already building faster with NexoGen. It's your turn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8 py-4 rounded-full hover:opacity-90 transition-opacity">
                Start building free →
              </button>
              <button className="border border-white/15 text-white/60 hover:text-white hover:border-white/25 text-sm font-medium px-8 py-4 rounded-full transition-all">
                See examples
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-white/25 text-xs font-medium">
              <span>✓ Free plan</span>
              <span>✓ No card needed</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
