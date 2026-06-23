import type { ComponentDef } from '../../types';

export const premiumTestimonialsComponents: ComponentDef[] = [
  {
    id: 'testimonials-marquee-v1', name: 'Testimonials Marquee V1', category: 'testimonials', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['marquee', 'scroll', 'dark', 'infinite', 'premium'],
    description: 'Infinite horizontal marquee of testimonial cards, two rows opposite direction', priority: 10,
    standaloneCode: `function TestimonialsMarqueeV1() {
  const reviews = [
    {name:'Sarah C.',role:'CTO, Flowbase',q:'We shipped our entire dashboard in 48h. This is magic.',c:'from-violet-500 to-purple-600'},
    {name:'Marcus R.',role:'Founder, Launchpad',q:'Conversion up 40% after switching. My designer was shocked.',c:'from-blue-500 to-cyan-500'},
    {name:'Priya P.',role:'Head of Design',q:'The component quality rivals what top agencies charge $50K for.',c:'from-emerald-500 to-teal-500'},
    {name:'David K.',role:'Solo Developer',q:'I replaced my Figma + Webflow + code workflow with just this.',c:'from-pink-500 to-rose-500'},
    {name:'Lisa T.',role:'Growth Lead',q:'Our dev team now ships landing pages in 20 minutes, not 2 weeks.',c:'from-amber-500 to-orange-500'},
    {name:'James W.',role:'Product Manager',q:'The AI understands what I want even when I can\'t describe it perfectly.',c:'from-indigo-500 to-violet-500'},
  ];
  const TCard = ({r}) => (
    <div className="shrink-0 w-72 bg-white/[0.04] border border-white/8 rounded-2xl p-6 mx-2">
      <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
      <p className="text-white/70 text-sm leading-relaxed mb-4">"{r.q}"</p>
      <div className="flex items-center gap-2.5">
        <div className={"w-8 h-8 rounded-full bg-gradient-to-br " + r.c + " flex items-center justify-center text-white text-xs font-bold shrink-0"}>{r.name[0]}</div>
        <div><div className="text-white text-sm font-semibold">{r.name}</div><div className="text-white/30 text-xs">{r.role}</div></div>
      </div>
    </div>
  );
  return (
    <section className="py-24 bg-[#060609] overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-14 text-center">
        <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>Teams that move faster</h2>
        <p className="text-white/40 text-lg">Trusted by 50,000+ builders worldwide.</p>
      </div>
      <div className="relative">
        <div className="flex" style={{animation:'scroll-left 30s linear infinite'}}>
          {[...reviews,...reviews].map((r,i) => <TCard key={i} r={r} />)}
        </div>
        <div className="flex mt-4" style={{animation:'scroll-right 25s linear infinite'}}>
          {[...reviews.slice(3),...reviews.slice(0,3),...reviews].map((r,i) => <TCard key={i} r={r} />)}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html:'@keyframes scroll-left{from{transform:translateX(0)}to{transform:translateX(-50%)}}@keyframes scroll-right{from{transform:translateX(-50%)}to{transform:translateX(0)}}'}} />
    </section>
  );
}`,
  },
  {
    id: 'testimonials-large-quote-v1', name: 'Testimonials Large Quote V1', category: 'testimonials', style: 'bold', theme: 'dark',
    industries: ['saas', 'agency', 'startup'], tags: ['large-quote', 'featured', 'dark', 'minimal', 'impact'],
    description: 'Single featured large quote with company logo, author, and social proof strip', priority: 9,
    standaloneCode: `function TestimonialsLargeQuoteV1() {
  const [active, setActive] = React.useState(0);
  const quotes = [
    {q:"NexoGen didn't just save us time — it fundamentally changed how we think about building for the web. Our go-to-market is now 10× faster.",name:'Alex Chen',role:'CEO, Flowbase',company:'Flowbase'},
    {q:"I've evaluated every AI builder on the market. NexoGen is in a different league. The component quality and AI understanding are unmatched.",name:'Maria Santos',role:'CTO, StartupOS',company:'StartupOS'},
    {q:"We replaced our entire frontend agency with NexoGen. Saved $180K in the first year while shipping better work, faster.",name:'Ryan Mitchell',role:'Head of Growth, Ramp',company:'Ramp'},
  ];
  const q = quotes[active];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="text-white/20 text-xs uppercase tracking-widest font-semibold mb-2">Customer stories</div>
          <h2 className="font-black text-white mb-2" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>In their own words</h2>
        </div>
        <div className="mb-12">
          <div className="text-white/10 text-8xl font-black leading-none mb-2" style={{fontFamily:'Georgia,serif'}}>"</div>
          <blockquote className="text-white text-2xl md:text-3xl font-medium leading-relaxed mb-8 -mt-8">
            {q.q}
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold">{q.name[0]}</div>
            <div>
              <div className="text-white font-bold">{q.name}</div>
              <div className="text-white/40 text-sm">{q.role}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-16">{quotes.map((_,i) => <button key={i} onClick={() => setActive(i)} className={"h-1 rounded-full flex-1 transition-all " + (i===active?"bg-white":"bg-white/15 hover:bg-white/25")} />)}</div>
        <div className="border-t border-white/5 pt-10 flex items-center justify-center gap-10 flex-wrap">
          {['Stripe','Linear','Vercel','Notion','Figma','Loom'].map(c => <div key={c} className="text-white/20 font-bold text-sm hover:text-white/40 transition-colors cursor-default">{c}</div>)}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'testimonials-stats-v1', name: 'Testimonials Stats V1', category: 'testimonials', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['stats', 'numbers', 'combined', 'dark', 'premium'],
    description: 'Stats + testimonials combined: impact numbers above, quotes below', priority: 9,
    standaloneCode: `function TestimonialsStatsV1() {
  const stats = [{v:'50K+',l:'Active teams'},{v:'10M+',l:'Websites generated'},{v:'4.9/5',l:'Average rating'},{v:'< 60s',l:'Generation time'}];
  const reviews = [
    {name:'Jordan K.',role:'Solo founder',q:'I launched 3 client websites in one week. It used to take me a month.',c:'from-violet-500 to-purple-600'},
    {name:'Emma L.',role:'Product Lead',q:'Our conversion rate jumped 34% after NexoGen redesigned our landing page.',c:'from-blue-500 to-cyan-500'},
    {name:'Carlos M.',role:'Agency Owner',q:'I scaled my agency from 2 to 12 clients without hiring more developers.',c:'from-emerald-500 to-teal-500'},
  ];
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>Real impact, real numbers</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((s,i) => <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 text-center hover:border-white/12 transition-all">
            <div className="text-3xl font-black text-white mb-1">{s.v}</div>
            <div className="text-white/30 text-xs font-medium">{s.l}</div>
          </div>)}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reviews.map((r,i) => <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-7 hover:border-white/12 transition-all">
            <div className="flex gap-1 mb-4">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
            <p className="text-white/65 leading-relaxed mb-5 text-sm">"{r.q}"</p>
            <div className="flex items-center gap-3">
              <div className={"w-9 h-9 rounded-full bg-gradient-to-br " + r.c + " flex items-center justify-center text-white text-sm font-bold shrink-0"}>{r.name[0]}</div>
              <div><div className="text-white font-semibold text-sm">{r.name}</div><div className="text-white/30 text-xs">{r.role}</div></div>
            </div>
          </div>)}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'testimonials-twitter-v1', name: 'Testimonials Twitter V1', category: 'testimonials', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'], tags: ['twitter', 'x', 'social', 'dark', 'authentic'],
    description: 'Twitter/X post style testimonials: verified badges, hearts, retweets', priority: 8,
    standaloneCode: `function TestimonialsTwitterV1() {
  const tweets = [
    {handle:'@sarahbuilds',name:'Sarah Chen',q:'Just shipped my client\'s entire rebrand with NexoGen in 2 hours. What used to take 3 weeks. Absolutely unreal quality.',likes:'2.4K',rt:'847',time:'2h',c:'from-violet-500 to-purple-600'},
    {handle:'@marcuscode',name:'Marcus Rivera',q:'stopped using webflow, stopped using framer, stopped hiring designers. nexogen does it all and the code it outputs is actually clean',likes:'1.8K',rt:'612',time:'5h',c:'from-blue-500 to-cyan-500'},
    {handle:'@priyadesigns',name:'Priya Patel',q:'Hot take: NexoGen is to websites what Figma was to design. In 2 years, everyone will use it. Getting in early.',likes:'4.1K',rt:'1.3K',time:'1d',c:'from-emerald-500 to-teal-500'},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>What people are saying</h2>
          <p className="text-white/40 text-lg">Real reactions from real builders</p>
        </div>
        <div className="flex flex-col gap-4">
          {tweets.map((t,i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-3xl p-6 hover:border-white/12 transition-all">
              <div className="flex items-start gap-4">
                <div className={"w-11 h-11 rounded-full bg-gradient-to-br " + t.c + " flex items-center justify-center text-white font-bold text-sm shrink-0"}>{t.name[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-sm">{t.name}</span>
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91-1.01-1.01-2.52-1.27-3.91-.81-.67-1.31-1.91-2.19-3.34-2.19-1.43 0-2.67.88-3.34 2.19-1.39-.46-2.9-.2-3.91.81-1.01 1.01-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12c0 1.43.88 2.67 2.19 3.34-.46 1.39-.2 2.9.81 3.91 1.01 1.01 2.52 1.27 3.91.81.67 1.31 1.91 2.19 3.34 2.19 1.43 0 2.67-.88 3.34-2.19 1.39.46 2.9.2 3.91-.81 1.01-1.01 1.27-2.52.81-3.91 1.31-.67 2.19-1.91 2.19-3.34z"/></svg>
                    <span className="text-white/30 text-sm">{t.handle}</span>
                    <span className="text-white/20 text-xs ml-auto">{t.time}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-4">{t.q}</p>
                  <div className="flex gap-6 text-white/25 text-xs">
                    <span className="hover:text-pink-400 transition-colors cursor-pointer">♡ {t.likes}</span>
                    <span className="hover:text-emerald-400 transition-colors cursor-pointer">↺ {t.rt}</span>
                  </div>
                </div>
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
    id: 'testimonials-grid-wall-v1', name: 'Testimonials Grid Wall V1', category: 'testimonials', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'agency'], tags: ['grid-wall', 'masonry', 'many', 'dark', 'premium'],
    description: 'Dense masonry wall of testimonials, varied card heights, glass style', priority: 8,
    standaloneCode: `function TestimonialsGridWallV1() {
  const reviews = [
    {n:'Alex K.',r:'Lead Dev',q:'The output quality is indistinguishable from hand-crafted code. I\'ve been burned by AI tools before but this one is genuinely production-ready.',stars:5,c:'from-violet-500/15 to-purple-500/10',border:'border-violet-500/20'},
    {n:'Sofia L.',r:'Design Lead',q:'Replaced Webflow.',stars:5,c:'from-blue-500/15 to-cyan-500/10',border:'border-blue-500/20'},
    {n:'James T.',r:'Startup Founder',q:'Went from idea to live in 48 hours. My investors were impressed. Closed a seed round 2 weeks later.',stars:5,c:'from-emerald-500/15 to-teal-500/10',border:'border-emerald-500/20'},
    {n:'Nina P.',r:'Freelancer',q:'3× my income, same hours.',stars:5,c:'from-pink-500/15 to-rose-500/10',border:'border-pink-500/20'},
    {n:'Ryan M.',r:'Engineer',q:'I was ready to write it off as another ChatGPT wrapper. Then I saw the actual code it generates. Zero imports, clean hooks, proper types. Actually impressive.',stars:5,c:'from-amber-500/15 to-orange-500/10',border:'border-amber-500/20'},
    {n:'Chen W.',r:'PM',q:'Our team ships landing pages in 20 minutes.',stars:5,c:'from-indigo-500/15 to-violet-500/10',border:'border-indigo-500/20'},
  ];
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>The internet loves NexoGen</h2>
          <div className="flex justify-center gap-1 mb-3">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400">★</span>)}</div>
          <p className="text-white/40">4.9/5 from 3,200 reviews</p>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
          {reviews.map((r,i) => (
            <div key={i} className={"bg-gradient-to-br " + r.c + " border " + r.border + " rounded-2xl p-6 break-inside-avoid"}>
              <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].slice(0,r.stars).map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">"{r.q}"</p>
              <div><div className="text-white font-semibold text-sm">{r.n}</div><div className="text-white/30 text-xs">{r.r}</div></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'testimonials-companies-v1', name: 'Testimonials Companies V1', category: 'testimonials', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'enterprise'], tags: ['logos', 'companies', 'b2b', 'dark', 'enterprise'],
    description: 'B2B-focused: company logos + executive quotes, enterprise trust signals', priority: 8,
    standaloneCode: `function TestimonialsCompaniesV1() {
  const testimonials = [
    {company:'Stripe',person:'Patrick C.',title:'CEO',q:'NexoGen is the tool we recommend to every startup building their first web presence.',c:'from-indigo-500 to-blue-600'},
    {company:'Linear',person:'Karri S.',title:'CEO',q:'The design quality is genuinely remarkable. This is the future of how websites get built.',c:'from-violet-500 to-purple-600'},
    {company:'Vercel',person:'Guillermo R.',title:'CEO',q:'Deploying AI-generated websites to the edge has never been this seamless.',c:'from-gray-600 to-gray-800'},
  ];
  const logos = ['Stripe','Linear','Vercel','Notion','Figma','Raycast','Loom','Retool','Supabase','Planetscale'];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-white/30 text-xs uppercase tracking-widest mb-4 font-semibold">Trusted by the best</div>
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {logos.map(l => <div key={l} className="text-white/20 font-bold text-sm hover:text-white/40 transition-colors">{l}</div>)}
          </div>
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>What leaders say</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/8 rounded-3xl p-8 hover:border-white/12 transition-all">
              <div className={"w-12 h-8 bg-gradient-to-r " + t.c + " rounded-lg mb-6 flex items-center justify-center"}>
                <span className="text-white font-black text-xs">{t.company[0]}</span>
              </div>
              <blockquote className="text-white/65 text-sm leading-relaxed mb-6">"{t.q}"</blockquote>
              <div>
                <div className="text-white font-bold text-sm">{t.person}</div>
                <div className="text-white/30 text-xs">{t.title}, {t.company}</div>
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
    id: 'testimonials-video-v1', name: 'Testimonials Video V1', category: 'testimonials', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'agency'], tags: ['video', 'cards', 'play-button', 'dark', 'premium'],
    description: 'Video testimonial cards with play button, gradient thumbnails, metrics overlay', priority: 7,
    standaloneCode: `function TestimonialsVideoV1() {
  const [playing, setPlaying] = React.useState(null);
  const videos = [
    {name:'Sarah Chen',role:'CTO, Flowbase',duration:'2:34',metric:'40% CVR increase',thumb:'from-violet-800 to-purple-900'},
    {name:'Marcus Rivera',role:'Founder, Launchpad',duration:'1:48',metric:'10× faster delivery',thumb:'from-blue-800 to-cyan-900'},
    {name:'Priya Patel',role:'Head of Design',duration:'3:12',metric:'$180K agency replaced',thumb:'from-emerald-800 to-teal-900'},
  ];
  return (
    <section className="py-24 bg-[#030303]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>See the impact firsthand</h2>
          <p className="text-white/40 text-lg">Real builders, real results.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {videos.map((v,i) => (
            <div key={i} className="group cursor-pointer" onClick={() => setPlaying(playing === i ? null : i)}>
              <div className={"relative bg-gradient-to-br " + v.thumb + " rounded-3xl overflow-hidden aspect-video mb-4"}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {playing === i ? (
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-3 h-3 border-l-2 border-r-2 border-white" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-gray-900 ml-1" style={{borderLeftWidth:14,borderTopWidth:8,borderBottomWidth:8}} />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between">
                  <span className="bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">{v.duration}</span>
                  <span className="bg-emerald-500/80 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm font-semibold">{v.metric}</span>
                </div>
              </div>
              <div className="text-white font-semibold">{v.name}</div>
              <div className="text-white/40 text-sm">{v.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'testimonials-split-v1', name: 'Testimonials Split V1', category: 'testimonials', style: 'elegant', theme: 'dark',
    industries: ['saas', 'agency', 'portfolio'], tags: ['split', 'featured', 'dark', 'elegant', 'sidebar'],
    description: 'Split layout: featured large testimonial left, 3 compact quotes right', priority: 8,
    standaloneCode: `function TestimonialsSplitV1() {
  const featured = {name:'James Wilson',role:'CTO, Acme Corp',q:'We evaluated every AI website builder available. NexoGen is in a completely different category. The component quality, the code output, the design intelligence — it\'s like having a senior team working 24/7.',stars:5,c:'from-violet-600 to-indigo-700'};
  const side = [
    {name:'Emma R.',role:'Freelance Designer',q:'Tripled my capacity overnight. My clients can\'t tell the difference from hand-built.'},
    {name:'Tom K.',role:'Product Manager',q:'Our landing page A/B test showed +52% conversion with NexoGen\'s design.'},
    {name:'Lisa M.',role:'Solo Founder',q:'Built and launched in a weekend. $40K in sales in month one.'},
  ];
  return (
    <section className="py-24 bg-[#060609]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)'}}>Builders who believe</h2>
        </div>
        <div className="grid md:grid-cols-5 gap-5">
          <div className={"md:col-span-3 bg-gradient-to-br " + featured.c + " rounded-3xl p-10 flex flex-col justify-between"}>
            <div>
              <div className="flex gap-1 mb-8">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-300 text-lg">★</span>)}</div>
              <blockquote className="text-white text-xl md:text-2xl font-medium leading-relaxed mb-8">"{featured.q}"</blockquote>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">{featured.name[0]}</div>
              <div><div className="text-white font-bold">{featured.name}</div><div className="text-white/70 text-sm">{featured.role}</div></div>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-4">
            {side.map((s,i) => (
              <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 flex-1 hover:border-white/12 transition-all">
                <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}</div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">"{s.q}"</p>
                <div className="text-white font-semibold text-sm">{s.name}</div>
                <div className="text-white/30 text-xs">{s.role}</div>
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
    id: 'testimonials-minimal-v1', name: 'Testimonials Minimal V1', category: 'testimonials', style: 'minimal', theme: 'light',
    industries: ['portfolio', 'agency', 'saas'], tags: ['minimal', 'light', 'clean', 'simple', 'elegant'],
    description: 'Clean light testimonials: large serif quote text, minimal attribution', priority: 7,
    standaloneCode: `function TestimonialsMinimalV1() {
  const [active, setActive] = React.useState(0);
  const quotes = [
    {q:"The most impressive AI tool I've used in 10 years of building software. The quality of output makes our team look like geniuses.",name:'David Park',role:'CTO'},
    {q:"I was skeptical. Then I generated my first site. Then I cancelled every other design subscription I had.",name:'Nina Torres',role:'Designer'},
    {q:"Our agency revenue doubled in 6 months because we can now serve 4× as many clients with the same team.",name:'Marco Silva',role:'Agency Owner'},
  ];
  const q = quotes[active];
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="text-gray-200 text-9xl font-black leading-none -mb-8" style={{fontFamily:'Georgia,serif'}}>"</div>
        <blockquote className="text-gray-900 text-2xl md:text-3xl font-medium leading-relaxed mb-8">{q.q}</blockquote>
        <div className="mb-10">
          <div className="text-gray-900 font-bold">{q.name}</div>
          <div className="text-gray-400 text-sm">{q.role}</div>
        </div>
        <div className="flex gap-2 justify-center">
          {quotes.map((_,i) => <button key={i} onClick={() => setActive(i)} className={"h-1.5 rounded-full transition-all " + (i===active?"bg-gray-900 w-6":"bg-gray-200 w-3 hover:bg-gray-300")} />)}
        </div>
      </div>
    </section>
  );
}`,
  },
];
