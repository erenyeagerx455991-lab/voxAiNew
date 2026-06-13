import type { ComponentDef } from '../../types';

export const premiumPricingComponents: ComponentDef[] = [
  {
    id: 'pricing-triple-v1', name: 'Pricing Triple V1', category: 'pricing', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['three-tier', 'dark', 'recommended', 'premium', 'monthly', 'saas'],
    description: 'Three-tier pricing: Free/Pro/Enterprise, recommended highlight, feature list per tier', priority: 10,
    standaloneCode: `function PricingTripleV1() {
  const plans = [
    {name:'Starter',price:'$0',period:'/mo',desc:'For individuals getting started',features:['5 website generations/mo','50 components','1 custom domain','Community support'],cta:'Get started',highlight:false},
    {name:'Pro',price:'$29',period:'/mo',desc:'For serious builders and teams',features:['Unlimited generations','100+ premium components','5 custom domains','Priority support','API access (1K req/mo)','Team (up to 5)'],cta:'Start free trial',highlight:true},
    {name:'Enterprise',price:'Custom',period:'',desc:'For agencies and large teams',features:['Everything in Pro','Unlimited API access','Custom components','SSO / SAML','Dedicated success manager','SLA guarantee'],cta:'Contact sales',highlight:false},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Simple, transparent pricing</h2>
          <p className="text-white/40 text-lg">Start free. Scale as you grow. No surprises.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p,i) => (
            <div key={i} className={"relative border rounded-3xl p-8 flex flex-col " + (p.highlight?"bg-gradient-to-b from-violet-950/80 to-indigo-950/60 border-violet-500/40":"bg-white/[0.02] border-white/8 hover:border-white/12 transition-all")}>
              {p.highlight && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">Most Popular</div>}
              <div className="mb-6">
                <div className="text-white/60 text-sm font-semibold mb-1">{p.name}</div>
                <div className="flex items-end gap-1 mb-2"><span className="text-white font-black text-4xl">{p.price}</span><span className="text-white/30 text-sm mb-1">{p.period}</span></div>
                <div className="text-white/30 text-xs">{p.desc}</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map(f => <li key={f} className="flex items-start gap-2.5 text-white/50 text-sm"><span className={"mt-0.5 shrink-0 " + (p.highlight?"text-violet-400":"text-white/30")}>✓</span>{f}</li>)}
              </ul>
              <button className={"w-full py-3.5 rounded-full text-sm font-bold transition-all " + (p.highlight?"bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90":"bg-white/8 text-white hover:bg-white/12 border border-white/10")}>{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-annual-toggle-v1', name: 'Pricing Annual Toggle V1', category: 'pricing', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['annual', 'toggle', 'dark', 'savings', 'monthly', 'switch'],
    description: 'Pricing with monthly/annual toggle: shows savings percentage on annual, vivid highlight', priority: 9,
    standaloneCode: `function PricingAnnualToggleV1() {
  const [annual, setAnnual] = React.useState(true);
  const plans = [
    {name:'Starter',m:0,a:0,desc:'Perfect for solo builders',features:['5 generations/mo','50 components','1 domain'],highlight:false},
    {name:'Pro',m:29,a:19,desc:'For serious creators',features:['Unlimited generations','100+ components','5 domains','API access','Team of 5'],highlight:true},
    {name:'Scale',m:99,a:69,desc:'For growing teams',features:['Everything in Pro','Unlimited API','20 team members','Custom components','Priority SLA'],highlight:false},
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Pricing that scales with you</h2>
          <div className="flex items-center gap-3 justify-center mt-6">
            <span className={"text-sm " + (!annual?"text-white":"text-white/30")}>Monthly</span>
            <button onClick={() => setAnnual(a=>!a)} className={"relative w-12 h-6 rounded-full transition-colors " + (annual?"bg-violet-600":"bg-white/15")}>
              <div className={"absolute top-1 w-4 h-4 rounded-full bg-white transition-transform " + (annual?"translate-x-7":"translate-x-1")} />
            </button>
            <span className={"text-sm " + (annual?"text-white":"text-white/30")}>Annual</span>
            {annual && <span className="bg-emerald-500/15 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">Save up to 35%</span>}
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((p,i) => {
            const price = annual ? p.a : p.m;
            return (
              <div key={i} className={"relative border rounded-3xl p-8 flex flex-col " + (p.highlight?"border-violet-500/30 bg-violet-950/30":"border-white/8 bg-white/[0.02] hover:border-white/12 transition-all")}>
                {p.highlight && annual && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-black px-3 py-1 rounded-full">Best value</div>}
                <div className="mb-6">
                  <div className="text-white/50 text-sm font-semibold mb-1">{p.name}</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-white font-black text-4xl">{price===0?'Free':'$'+price}</span>
                    {price>0 && <span className="text-white/30 text-sm mb-1">/mo</span>}
                  </div>
                  {annual && price>0 && <div className="text-emerald-400 text-xs font-medium">Save ${(p.m-p.a)*12}/yr</div>}
                  <div className="text-white/25 text-xs mt-1">{p.desc}</div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-white/45 text-sm"><span className="text-violet-400 text-xs shrink-0">✓</span>{f}</li>)}
                </ul>
                <button className={"w-full py-3.5 rounded-full text-sm font-bold " + (p.highlight?"bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity":"bg-white/8 border border-white/10 text-white hover:bg-white/12 transition-colors")}>
                  {price===0?'Get started free':'Start free trial'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-minimal-v1', name: 'Pricing Minimal V1', category: 'pricing', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'portfolio'],
    tags: ['minimal', 'two-tier', 'dark', 'clean', 'simple', 'elegant'],
    description: 'Ultra-minimal pricing: 2 tiers, clean typography, no visual clutter — dark', priority: 8,
    standaloneCode: `function PricingMinimalV1() {
  return (
    <section className="py-24 bg-[#050505]">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Two plans. Zero confusion.</h2>
        </div>
        <div className="space-y-4">
          <div className="border border-white/8 rounded-3xl p-10 bg-white/[0.02] hover:border-white/12 transition-all">
            <div className="flex items-start justify-between mb-6">
              <div><div className="text-white/40 text-xs uppercase tracking-widest font-bold mb-2">Free</div><div className="text-white font-black text-4xl">$0</div><div className="text-white/25 text-sm mt-1">Forever free</div></div>
              <button className="border border-white/15 text-white/50 hover:text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all hover:border-white/25">Get started</button>
            </div>
            <div className="w-full h-px bg-white/5 mb-6" />
            <div className="grid grid-cols-2 gap-2">
              {['5 builds/month','50 components','1 domain','Community support'].map(f => <div key={f} className="flex items-center gap-2 text-white/35 text-sm"><span className="text-white/20">·</span>{f}</div>)}
            </div>
          </div>
          <div className="border border-violet-500/40 rounded-3xl p-10 bg-gradient-to-b from-violet-950/60 to-indigo-950/40">
            <div className="flex items-start justify-between mb-6">
              <div><div className="text-violet-300 text-xs uppercase tracking-widest font-bold mb-2">Pro</div><div className="text-white font-black text-4xl">$29<span className="text-white/25 text-base font-normal">/mo</span></div><div className="text-white/25 text-sm mt-1">Billed monthly</div></div>
              <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity text-sm">Start free trial</button>
            </div>
            <div className="w-full h-px bg-violet-500/15 mb-6" />
            <div className="grid grid-cols-2 gap-2">
              {['Unlimited builds','100+ components','5 domains','Priority support','API access','Team of 5'].map(f => <div key={f} className="flex items-center gap-2 text-white/50 text-sm"><span className="text-violet-400">✓</span>{f}</div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-usage-v1', name: 'Pricing Usage V1', category: 'pricing', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['usage', 'pay-per-use', 'dark', 'api', 'metered', 'developer'],
    description: 'Usage-based pricing: pay-per-generation model with volume tiers and calculator', priority: 8,
    standaloneCode: `function PricingUsageV1() {
  const [volume, setVolume] = React.useState(100);
  const tiers = [{max:10,price:0.5},{max:100,price:0.3},{max:1000,price:0.15},{max:Infinity,price:0.05}];
  const calcCost = (n) => {
    let cost=0, rem=n;
    const breaks=[10,90,900,Infinity];
    const prices=[0.5,0.3,0.15,0.05];
    for(let i=0;i<breaks.length&&rem>0;i++){const use=Math.min(rem,breaks[i]);cost+=use*prices[i];rem-=use;}
    return cost.toFixed(2);
  };
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/15 px-4 py-2 rounded-full mb-6">Pay only for what you use</div>
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Usage-based pricing</h2>
          <p className="text-white/40 text-lg">Perfect for developers and agencies with variable needs.</p>
        </div>
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-10 mb-8">
          <div className="grid md:grid-cols-4 gap-4 mb-10">
            {[['1–10','$0.50 each'],['11–100','$0.30 each'],['101–1K','$0.15 each'],['1K+','$0.05 each']].map(([r,p]) => (
              <div key={r} className="text-center border border-white/8 rounded-2xl p-5">
                <div className="text-white/30 text-xs mb-1">{r} generations</div>
                <div className="text-white font-black text-lg">{p}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm">Estimate: {volume} generations/mo</span>
              <span className="text-white font-black text-2xl">${calcCost(volume)}<span className="text-white/30 text-sm font-normal">/mo</span></span>
            </div>
            <input type="range" min={1} max={500} value={volume} onChange={e=>setVolume(Number(e.target.value))} className="w-full accent-violet-500" />
            <div className="flex justify-between text-white/20 text-xs mt-1"><span>1</span><span>500</span></div>
          </div>
        </div>
        <div className="text-center">
          <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-10 py-4 rounded-full hover:opacity-90 transition-opacity">Get started — free for 10 generates</button>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-enterprise-v1', name: 'Pricing Enterprise V1', category: 'pricing', style: 'corporate', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['enterprise', 'b2b', 'dark', 'custom', 'sales', 'contact'],
    description: 'Enterprise-focused pricing: self-serve tiers on left, enterprise custom on right with benefits', priority: 8,
    standaloneCode: `function PricingEnterpriseV1() {
  const benefits = ['Dedicated implementation engineer','Custom AI model fine-tuning','Unlimited team seats','On-premise deployment option','Custom SLA (99.99% uptime)','Priority phone support 24/7','Custom component development'];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Plans for every team size</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="space-y-4">
            {[{n:'Starter',p:'Free',f:'5 gen/mo · 50 components · 1 domain'},{n:'Pro',p:'$29/mo',f:'Unlimited · 100+ components · API · Teams'},{n:'Scale',p:'$99/mo',f:'Everything + 20 seats · Custom components'}].map((t,i) => (
              <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 hover:border-white/12 transition-all flex items-center justify-between">
                <div>
                  <div className="text-white font-bold mb-0.5">{t.n}</div>
                  <div className="text-white/30 text-xs">{t.f}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-black">{t.p}</div>
                  <button className="text-violet-400 text-xs hover:text-violet-300 transition-colors mt-1">Get started →</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-br from-indigo-950 to-violet-950 border border-indigo-500/30 rounded-3xl p-8">
            <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2">Enterprise</div>
            <div className="text-white font-black text-3xl mb-2">Custom pricing</div>
            <div className="text-white/40 text-sm mb-8 leading-relaxed">Tailored for organizations that need maximum flexibility, security, and dedicated support.</div>
            <ul className="space-y-3 mb-8">
              {benefits.map(b => <li key={b} className="flex items-center gap-3 text-white/60 text-sm"><span className="text-indigo-400 text-xs shrink-0">✓</span>{b}</li>)}
            </ul>
            <button className="w-full bg-white text-black font-bold py-4 rounded-full hover:bg-gray-100 transition-colors text-sm">Talk to sales →</button>
            <div className="text-white/25 text-xs text-center mt-3">Avg. response time: 2 hours</div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-freemium-v1', name: 'Pricing Freemium V1', category: 'pricing', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['freemium', 'dark', 'generous-free', 'upgrade', 'conversion', 'soft'],
    description: 'Freemium pricing: generous free tier, soft upgrade prompt, focus on conversion', priority: 7,
    standaloneCode: `function PricingFreemiumV1() {
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-3" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Start free, upgrade when ready</h2>
          <p className="text-white/40 text-lg">No credit card. No time limit. Just build.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white font-black text-4xl">Free</div>
                <div className="text-white/30 text-sm mt-1">No credit card</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center text-2xl">🎁</div>
            </div>
            <div className="space-y-3 mb-8">
              {['5 AI generations per month','50 premium components','1 published website','Live preview included','Community support'].map(f => <div key={f} className="flex items-center gap-3 text-white/50 text-sm"><span className="text-white/25 text-xs">✓</span>{f}</div>)}
            </div>
            <button className="w-full bg-white/8 border border-white/10 text-white font-bold py-3.5 rounded-full hover:bg-white/12 transition-colors text-sm">
              Start building free
            </button>
          </div>
          <div>
            <div className="bg-gradient-to-br from-violet-950/70 to-indigo-950/50 border border-violet-500/30 rounded-3xl p-8 mb-4">
              <div className="text-violet-300 text-xs font-bold uppercase tracking-widest mb-2">When you're ready to scale</div>
              <div className="text-white font-black text-3xl mb-1">$29<span className="text-white/30 font-normal text-base">/mo</span></div>
              <div className="text-white/30 text-sm mb-6">Everything in free, plus:</div>
              <div className="space-y-2.5 mb-8">
                {['Unlimited generations','All 100+ components','Unlimited domains','Team collaboration (5 seats)','API access','Priority support'].map(f => <div key={f} className="flex items-center gap-3 text-white/60 text-sm"><span className="text-violet-400 text-xs">✓</span>{f}</div>)}
              </div>
              <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-4 rounded-full hover:opacity-90 transition-opacity text-sm">
                Upgrade to Pro →
              </button>
            </div>
            <div className="text-center text-white/25 text-xs">14-day free trial · Cancel anytime</div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-stacked-v1', name: 'Pricing Stacked V1', category: 'pricing', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['stacked', 'centered', 'dark', 'single-focus', 'bold', 'conversion'],
    description: 'Single-focus stacked pricing: one primary plan, bold conversion focused, all in center', priority: 8,
    standaloneCode: `function PricingStackedV1() {
  const [annual, setAnnual] = React.useState(false);
  const features = ['Unlimited website generations','All 100+ premium components','5 custom domains + SSL','Team collaboration (5 seats)','API access (1K req/mo)','Version history','Priority email support'];
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 60%, rgba(139,92,246,0.08) 0%, transparent 60%)'}} />
      <div className="relative z-10 max-w-md mx-auto px-6 text-center">
        <h2 className="font-black text-white mb-3" style={{fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-0.04em'}}>One plan. Everything included.</h2>
        <p className="text-white/40 mb-8">No tiers. No upsells. Just the full product.</p>
        <div className="flex items-center gap-3 justify-center mb-8">
          <span className={"text-sm " + (!annual?"text-white":"text-white/30")}>Monthly</span>
          <button onClick={() => setAnnual(a=>!a)} className={"relative w-12 h-6 rounded-full transition-colors " + (annual?"bg-violet-600":"bg-white/15")}>
            <div className={"absolute top-1 w-4 h-4 bg-white rounded-full transition-transform " + (annual?"translate-x-7":"translate-x-1")} />
          </button>
          <span className={"text-sm " + (annual?"text-white":"text-white/30")}>Annual</span>
          {annual && <span className="text-emerald-400 text-xs font-bold">–35%</span>}
        </div>
        <div className="bg-gradient-to-b from-violet-950/80 to-indigo-950/60 border border-violet-500/30 rounded-3xl p-10 mb-4">
          <div className="text-white font-black text-6xl mb-1">{annual?'$19':'$29'}</div>
          <div className="text-white/30 mb-8">per month {annual?"· billed annually":""}</div>
          <ul className="space-y-3 text-left mb-8">
            {features.map(f => <li key={f} className="flex items-center gap-3 text-white/60 text-sm"><span className="text-violet-400 text-xs shrink-0">✓</span>{f}</li>)}
          </ul>
          <button className="w-full bg-white text-black font-black py-4 rounded-full hover:bg-gray-100 transition-colors">
            Start 14-day free trial →
          </button>
          <div className="text-white/25 text-xs mt-3">No credit card required</div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-light-v1', name: 'Pricing Light V1', category: 'pricing', style: 'minimal', theme: 'light',
    industries: ['saas', 'startup', 'portfolio'],
    tags: ['light', 'clean', 'white', 'minimal', 'elegant', 'three-tier'],
    description: 'Clean light-theme pricing: white background, subtle shadows, elegant 3-tier layout', priority: 7,
    standaloneCode: `function PricingLightV1() {
  const plans = [
    {name:'Free',price:'$0',features:['5 builds/mo','50 components','1 domain'],cta:'Get started',border:'border-gray-200'},
    {name:'Pro',price:'$29',badge:'Most Popular',features:['Unlimited builds','100+ components','5 domains','API access','Teams'],cta:'Start free trial',border:'border-violet-300',shadow:true},
    {name:'Enterprise',price:'Custom',features:['All in Pro','Unlimited seats','SSO','Custom AI','SLA'],cta:'Contact us',border:'border-gray-200'},
  ];
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-gray-900 mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Pick your plan</h2>
          <p className="text-gray-400 text-lg">Start free, scale anytime. No surprises on your bill.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((p,i) => (
            <div key={i} className={"relative border-2 " + p.border + " rounded-3xl p-8 flex flex-col " + (p.shadow?"shadow-xl shadow-violet-100":"")} >
              {p.badge && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">{p.badge}</div>}
              <div className="mb-6">
                <div className="text-gray-400 text-sm font-semibold mb-1">{p.name}</div>
                <div className="text-gray-900 font-black text-4xl mb-1">{p.price}{p.price!=='Custom'&&<span className="text-gray-300 font-normal text-base">/mo</span>}</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map(f => <li key={f} className="flex items-center gap-2.5 text-gray-500 text-sm"><span className="text-violet-500 text-xs">✓</span>{f}</li>)}
              </ul>
              <button className={"w-full py-3.5 rounded-full text-sm font-bold transition-all " + (p.shadow?"bg-violet-600 text-white hover:bg-violet-700":"border-2 border-gray-200 text-gray-600 hover:border-gray-300")}>{p.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-dark-cards-v1', name: 'Pricing Dark Cards V1', category: 'pricing', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['dark', 'glass', 'horizontal', 'bold', 'premium', 'gradient'],
    description: 'Premium glassmorphism pricing cards: horizontal layout, gradient accents, bold numbers', priority: 8,
    standaloneCode: `function PricingDarkCardsV1() {
  return (
    <section className="py-24 bg-[#060606] relative overflow-hidden">
      <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.07) 0%, transparent 40%), radial-gradient(ellipse at 80% 50%, rgba(59,130,246,0.07) 0%, transparent 40%)'}} />
      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Invest in quality</h2>
          <p className="text-white/40 text-lg">Every plan includes the full design system and AI generation.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {name:'Starter',price:'Free',badge:null,desc:'For hobbyists',grad:'from-white/[0.03] to-white/[0.01]',border:'border-white/8',btn:'bg-white/8 text-white border border-white/10 hover:bg-white/12',features:['5 generations/month','Community components','1 website']},
            {name:'Creator',price:'$19',badge:'Best Value',desc:'For serious builders',grad:'from-violet-900/40 to-indigo-900/30',border:'border-violet-500/35',btn:'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90',features:['Unlimited generations','100+ components','Unlimited websites','API access','Teams']},
            {name:'Studio',price:'$79',badge:null,desc:'For agencies',grad:'from-blue-900/30 to-cyan-900/20',border:'border-blue-500/25',btn:'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-90',features:['Everything in Creator','Custom components','White-label','Priority SLA','20 team seats']},
          ].map((p,i) => (
            <div key={i} className={"relative border bg-gradient-to-b " + p.grad + " " + p.border + " rounded-3xl p-8 flex flex-col backdrop-blur-sm"}>
              {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">{p.badge}</div>}
              <div className="mb-6">
                <div className="text-white/40 text-xs font-bold uppercase tracking-wider mb-1">{p.name}</div>
                <div className="text-white font-black text-4xl">{p.price}{p.price!=='Free'&&<span className="text-white/30 font-normal text-sm">/mo</span>}</div>
                <div className="text-white/25 text-xs mt-1">{p.desc}</div>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map(f => <li key={f} className="flex items-center gap-2.5 text-white/50 text-sm"><span className="text-white/25 text-xs">✓</span>{f}</li>)}
              </ul>
              <button className={"w-full py-3.5 rounded-full text-sm font-bold transition-all " + p.btn}>Get started</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-comparison-v1', name: 'Pricing Comparison V1', category: 'pricing', style: 'modern', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['comparison', 'table', 'dark', 'detailed', 'feature-matrix', 'enterprise'],
    description: 'Detailed feature comparison table across 3 pricing tiers, sticky header, grouped rows', priority: 8,
    standaloneCode: `function PricingComparisonV1() {
  const groups = [
    {label:'Core',rows:[{f:'AI Generations',vals:['5/mo','Unlimited','Unlimited']},{f:'Component Library',vals:['50','100+','Custom']},{f:'Custom Domains',vals:['1','5','Unlimited']}]},
    {label:'Team',rows:[{f:'Team Members',vals:['1','5','Unlimited']},{f:'Role Permissions',vals:['—','Basic','Advanced']},{f:'SSO / SAML',vals:['—','—','✓']}]},
    {label:'Platform',rows:[{f:'API Access',vals:['—','1K req/mo','Unlimited']},{f:'Webhook Events',vals:['—','✓','✓']},{f:'Priority Support',vals:['Community','Email','24/7 Phone']}]},
  ];
  const plans = ['Free','Pro · $29/mo','Enterprise'];
  return (
    <section className="py-24 bg-[#050508]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Compare plans</h2>
        </div>
        <div className="bg-[#0a0a0e] border border-white/8 rounded-3xl overflow-hidden">
          <div className="grid grid-cols-4 border-b border-white/8">
            <div className="p-5" />
            {plans.map((p,i) => <div key={i} className={"p-5 text-center text-sm font-bold border-l border-white/5 " + (i===1?"text-violet-300":"text-white/40")}>{p}</div>)}
          </div>
          {groups.map((g, gi) => (
            <div key={gi}>
              <div className="grid grid-cols-4 bg-white/[0.015] border-y border-white/5">
                <div className="px-5 py-3 text-white/25 text-xs font-bold uppercase tracking-wider col-span-4">{g.label}</div>
              </div>
              {g.rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-4 border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <div className="px-5 py-4 text-white/50 text-sm">{row.f}</div>
                  {row.vals.map((v, vi) => <div key={vi} className={"px-5 py-4 text-center text-sm border-l border-white/5 " + (vi===1?"text-violet-300 font-medium":v==='✓'?"text-emerald-400":v==='—'?"text-white/15":"text-white/35")}>{v}</div>)}
                </div>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-4 p-4 gap-3">
            <div />
            <button className="col-span-1 bg-white/8 text-white text-xs font-bold py-3 rounded-xl hover:bg-white/12 transition-colors">Free</button>
            <button className="col-span-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">Start trial</button>
            <button className="col-span-1 bg-white/8 text-white text-xs font-bold py-3 rounded-xl hover:bg-white/12 transition-colors">Contact</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
