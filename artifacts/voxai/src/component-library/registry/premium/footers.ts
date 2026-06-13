import type { ComponentDef } from '../../types';

export const premiumFooterComponents: ComponentDef[] = [
  {
    id: 'footer-linear-v1', name: 'Footer Linear V1', category: 'footer', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'productivity'],
    tags: ['linear', 'minimal', 'dark', 'clean', 'grid', 'premium'],
    description: 'Linear.app-style footer: dark, minimal grid, logo left, links in columns, status badge', priority: 10,
    standaloneCode: `function FooterLinearV1() {
  const cols = [
    {h:'Product',links:['Features','Pricing','Changelog','Roadmap','API Docs']},
    {h:'Company',links:['About','Blog','Careers','Press','Contact']},
    {h:'Legal',links:['Privacy','Terms','Security','GDPR','Cookies']},
    {h:'Developers',links:['API Reference','SDKs','Webhooks','Status','GitHub']},
  ];
  return (
    <footer className="bg-black border-t border-white/8 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2">
            <div className="font-black text-white text-2xl mb-4">NexoGen</div>
            <p className="text-white/30 text-sm leading-relaxed mb-6 max-w-xs">The AI website builder trusted by 50,000+ teams worldwide.</p>
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />All systems operational
            </div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-white/25 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-3">
                {col.links.map(l => <li key={l}><a className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/20 text-sm">© 2025 NexoGen Inc. All rights reserved.</div>
          <div className="flex items-center gap-4 text-white/20 text-sm">
            {['Twitter','GitHub','Discord','LinkedIn'].map(s => <a key={s} className="hover:text-white/50 transition-colors cursor-pointer">{s}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-vercel-v1', name: 'Footer Vercel V1', category: 'footer', style: 'minimal', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['vercel', 'dark', 'developer', 'compact', 'clean', 'border'],
    description: 'Vercel.com-style footer: compact, dark, minimal links, deployment status indicator', priority: 9,
    standaloneCode: `function FooterVercelV1() {
  const links = [
    {h:'Platform',ls:['AI Generation','Components','Deploy','Analytics','Edge Network']},
    {h:'Resources',ls:['Docs','Changelog','Blog','Examples','Community']},
    {h:'Company',ls:['About','Careers','Blog','Contact','Security']},
  ];
  return (
    <footer className="bg-[#111] border-t border-white/8 py-14 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="text-white font-black text-xl mb-3">▲ NexoGen</div>
            <p className="text-white/25 text-sm leading-relaxed">The platform for frontend builders.</p>
          </div>
          {links.map(col => (
            <div key={col.h}>
              <div className="text-white/20 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-2.5">
                {col.ls.map(l => <li key={l}><a className="text-white/40 hover:text-white/70 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-8">
          <div className="text-white/15 text-xs">© 2025 NexoGen, Inc.</div>
          <div className="flex gap-5">
            {['Privacy','Terms','Cookie Preferences'].map(l => <a key={l} className="text-white/20 hover:text-white/50 text-xs transition-colors cursor-pointer">{l}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-dark-premium-v1', name: 'Footer Dark Premium V1', category: 'footer', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['dark', 'premium', 'newsletter', 'large', 'bold', 'gradient'],
    description: 'Premium dark footer: large heading, newsletter sign-up, social proof, full links grid', priority: 9,
    standaloneCode: `function FooterDarkPremiumV1() {
  const [email, setEmail] = React.useState('');
  const cols = [
    {h:'Product',ls:['Features','Pricing','Docs','API','Changelog']},
    {h:'Company',ls:['About','Blog','Careers','Press']},
    {h:'Legal',ls:['Privacy','Terms','Security']},
  ];
  return (
    <footer className="bg-[#050508] pt-20 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="border-b border-white/8 pb-16 mb-14 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-black text-white mb-3" style={{fontSize:'clamp(2rem,4vw,3rem)',letterSpacing:'-0.04em'}}>
              Ready to build something great?
            </h2>
            <p className="text-white/40 leading-relaxed">Join 50,000+ teams building faster with NexoGen.</p>
          </div>
          <div className="flex gap-3">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500/50 transition-colors" />
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity whitespace-nowrap">Get started →</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-14">
          <div>
            <div className="font-black text-white text-2xl mb-4">NexoGen</div>
            <p className="text-white/25 text-sm leading-relaxed mb-5">The AI website builder teams love.</p>
            <div className="flex gap-3">
              {['𝕏','in','GH','DC'].map(s => <div key={s} className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/30 text-xs hover:bg-white/12 hover:text-white/60 cursor-pointer transition-all">{s}</div>)}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-white/25 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-3">
                {col.ls.map(l => <li key={l}><a className="text-white/35 hover:text-white/70 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between gap-3 text-white/15 text-xs">
          <span>© 2025 NexoGen Inc.</span>
          <span>Built with ⚡ by NexoGen AI</span>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-minimal-v1', name: 'Footer Minimal V1', category: 'footer', style: 'minimal', theme: 'dark',
    industries: ['startup', 'portfolio', 'agency'],
    tags: ['minimal', 'ultra-clean', 'dark', 'single-row', 'small', 'simple'],
    description: 'Ultra-minimal single-row footer: logo, copyright, 4 links — nothing more', priority: 7,
    standaloneCode: `function FooterMinimalV1() {
  return (
    <footer className="bg-black border-t border-white/5 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-black text-white/40 text-lg">NexoGen</div>
        <div className="flex gap-6">
          {['Privacy','Terms','Blog','GitHub'].map(l => <a key={l} className="text-white/25 hover:text-white/60 text-sm transition-colors cursor-pointer">{l}</a>)}
        </div>
        <div className="text-white/15 text-sm">© 2025 NexoGen</div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-gradient-v1', name: 'Footer Gradient V1', category: 'footer', style: 'bold', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['gradient', 'dark', 'bottom-cta', 'vivid', 'bold', 'final-call'],
    description: 'Gradient-bottom footer: full CTA section with gradient, then compact dark links below', priority: 8,
    standaloneCode: `function FooterGradientV1() {
  return (
    <footer>
      <div className="relative py-20 px-6 overflow-hidden" style={{background:'linear-gradient(135deg,#0a0a2e,#1a0a3d,#0a1628)'}}>
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.2) 0%, transparent 60%)'}} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="font-black text-white mb-4" style={{fontSize:'clamp(2rem,4vw,3.5rem)',letterSpacing:'-0.04em'}}>Start building today.</h2>
          <p className="text-white/40 text-lg mb-8">Join 50,000+ teams who've already shipped better websites faster.</p>
          <button className="bg-white text-black font-black px-10 py-4 rounded-full hover:bg-gray-100 transition-colors text-base">
            Get started free →
          </button>
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-white/20 text-sm">
            {['Features','Pricing','Docs','Blog','Careers'].map(l => <a key={l} className="hover:text-white/50 transition-colors cursor-pointer">{l}</a>)}
          </div>
        </div>
      </div>
      <div className="bg-black border-t border-white/5 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-white/15 text-xs">
          <span>© 2025 NexoGen Inc. All rights reserved.</span>
          <div className="flex gap-4">{['Privacy','Terms','Security'].map(l => <a key={l} className="hover:text-white/40 transition-colors cursor-pointer">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-newsletter-v1', name: 'Footer Newsletter V1', category: 'footer', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'media'],
    tags: ['newsletter', 'email', 'dark', 'subscription', 'social', 'comprehensive'],
    description: 'Newsletter footer: prominent email sign-up, social links, full column links', priority: 8,
    standaloneCode: `function FooterNewsletterV1() {
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(false);
  const cols = [
    {h:'Product',ls:['Features','Pricing','API','Changelog']},
    {h:'Company',ls:['About','Blog','Careers','Contact']},
    {h:'Support',ls:['Docs','Status','Community','Security']},
  ];
  return (
    <footer className="bg-[#06060a] border-t border-white/6 pt-16 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12 mb-14">
          <div className="md:col-span-2">
            <div className="font-black text-white text-2xl mb-3">NexoGen</div>
            <p className="text-white/30 text-sm leading-relaxed mb-6">Stay in the loop. Product updates, design tips, and AI news every week.</p>
            {done ? (
              <div className="text-emerald-400 text-sm font-semibold">✓ You're subscribed!</div>
            ) : (
              <div className="flex gap-2">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" className="flex-1 bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 rounded-lg px-3 py-2.5 outline-none focus:border-violet-500/40 transition-colors" />
                <button onClick={() => email && setDone(true)} className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap">Subscribe</button>
              </div>
            )}
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-white/20 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-3">
                {col.ls.map(l => <li key={l}><a className="text-white/35 hover:text-white/70 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/15 text-xs">© 2025 NexoGen Inc.</div>
          <div className="flex gap-4">
            {['Twitter / X','GitHub','Discord','LinkedIn'].map(s => <a key={s} className="text-white/20 hover:text-white/50 text-xs transition-colors cursor-pointer">{s}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-developer-v1', name: 'Footer Developer V1', category: 'footer', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['developer', 'dark', 'api', 'docs', 'technical', 'code'],
    description: 'Developer-focused footer: API status, CLI snippet, docs links, dark monospace styling', priority: 7,
    standaloneCode: `function FooterDeveloperV1() {
  const cols = [
    {h:'Developers',ls:['API Reference','TypeScript SDK','CLI','Webhooks','Rate Limits','Changelog']},
    {h:'Resources',ls:['Documentation','Examples','Tutorials','Status Page','Community','GitHub']},
    {h:'Company',ls:['About','Blog','Careers','Security','Privacy','Terms']},
  ];
  return (
    <footer className="bg-[#0d0d0d] border-t border-white/6 pt-14 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#111] border border-white/6 rounded-2xl p-5 mb-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/40 text-sm">All systems operational</span>
          </div>
          <div className="flex items-center gap-3 bg-black/50 border border-white/8 rounded-lg px-4 py-2 font-mono text-xs text-emerald-300/70">
            <span className="text-white/25">$</span> npx create-nexogen@latest
          </div>
        </div>
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="font-black text-white text-xl mb-3">NexoGen</div>
            <p className="text-white/25 text-sm leading-relaxed mb-4">AI website generation API and platform for developers.</p>
            <div className="text-white/15 text-xs font-mono">v2.1.0</div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-white/20 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-2.5">
                {col.ls.map(l => <li key={l}><a className="text-white/35 hover:text-white/70 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-7 flex flex-col sm:flex-row justify-between gap-3 text-white/15 text-xs">
          <span>© 2025 NexoGen Inc.</span>
          <span>MIT License · <a className="hover:text-white/35 transition-colors cursor-pointer">Open Source</a></span>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-split-v1', name: 'Footer Split V1', category: 'footer', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'agency'],
    tags: ['split', 'two-column', 'dark', 'large-logo', 'social', 'premium'],
    description: 'Split footer: left large brand + tagline + social, right full navigation columns', priority: 8,
    standaloneCode: `function FooterSplitV1() {
  const links = [
    {h:'Platform',ls:['AI Generation','Components','Deployments','Analytics']},
    {h:'Resources',ls:['Documentation','Blog','Changelog','Community']},
    {h:'Company',ls:['About','Careers','Press','Contact']},
  ];
  return (
    <footer className="bg-[#050505] border-t border-white/8 py-16 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 mb-12">
        <div className="flex flex-col justify-between">
          <div>
            <div className="font-black text-white text-4xl mb-4" style={{letterSpacing:'-0.04em'}}>NexoGen</div>
            <p className="text-white/30 text-lg leading-relaxed mb-8 max-w-xs">The AI that builds websites as good as the world's best design teams.</p>
          </div>
          <div>
            <div className="text-white/20 text-xs uppercase tracking-widest font-semibold mb-4">Follow us</div>
            <div className="flex gap-3">
              {[{s:'𝕏',l:'Twitter'},{s:'in',l:'LinkedIn'},{s:'GH',l:'GitHub'},{s:'DC',l:'Discord'}].map(({s,l}) => (
                <button key={l} title={l} className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white/60 transition-all text-sm font-bold">{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {links.map(col => (
            <div key={col.h}>
              <div className="text-white/20 text-xs font-bold uppercase tracking-wider mb-5">{col.h}</div>
              <ul className="space-y-3">
                {col.ls.map(l => <li key={l}><a className="text-white/35 hover:text-white/70 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between gap-3 text-white/15 text-xs">
        <span>© 2025 NexoGen Inc. All rights reserved.</span>
        <div className="flex gap-4">{['Privacy Policy','Terms of Service','Cookie Settings'].map(l => <a key={l} className="hover:text-white/40 transition-colors cursor-pointer">{l}</a>)}</div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-light-v1', name: 'Footer Light V1', category: 'footer', style: 'minimal', theme: 'light',
    industries: ['startup', 'portfolio', 'agency'],
    tags: ['light', 'white', 'clean', 'minimal', 'professional', 'simple'],
    description: 'Clean light footer: white background, gray text, simple navigation, professional', priority: 7,
    standaloneCode: `function FooterLightV1() {
  const cols = [
    {h:'Product',ls:['Features','Pricing','Changelog','Docs']},
    {h:'Company',ls:['About','Blog','Careers','Press']},
    {h:'Legal',ls:['Privacy','Terms','Security']},
  ];
  return (
    <footer className="bg-white border-t border-gray-100 pt-14 pb-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-black text-gray-900 text-2xl mb-3">NexoGen</div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-xs">The AI website builder for modern teams.</p>
            <div className="flex gap-2">
              {['𝕏','GH','DC'].map(s => <div key={s} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-300 hover:text-gray-600 cursor-pointer transition-all text-xs font-bold">{s}</div>)}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-2.5">
                {col.ls.map(l => <li key={l}><a className="text-gray-500 hover:text-gray-900 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-7 flex flex-col sm:flex-row justify-between gap-3 text-gray-300 text-xs">
          <span>© 2025 NexoGen Inc.</span>
          <div className="flex gap-4">{['Privacy','Terms'].map(l => <a key={l} className="hover:text-gray-500 transition-colors cursor-pointer">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-enterprise-v1', name: 'Footer Enterprise V1', category: 'footer', style: 'corporate', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['enterprise', 'dark', 'comprehensive', 'b2b', 'trust', 'certifications'],
    description: 'Enterprise footer: certifications row, compliance badges, extensive navigation columns', priority: 8,
    standaloneCode: `function FooterEnterpriseV1() {
  const cols = [
    {h:'Product',ls:['AI Generation','Component Library','Deploy','Analytics','API','Enterprise']},
    {h:'Solutions',ls:['For Startups','For Agencies','For Enterprises','For Developers','Case Studies']},
    {h:'Resources',ls:['Documentation','API Reference','Blog','Community','Status','Partners']},
    {h:'Company',ls:['About','Careers','Press','Legal','Security','Contact']},
  ];
  return (
    <footer className="bg-[#05050a] border-t border-white/6 pt-16 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-3 items-center pb-10 mb-10 border-b border-white/5">
          <div className="text-white/20 text-xs font-semibold mr-2">Compliance & Certifications:</div>
          {['SOC 2 Type II','GDPR Compliant','ISO 27001','CCPA Ready','HIPAA Available'].map(c => (
            <span key={c} className="bg-white/5 border border-white/8 text-white/30 text-xs px-3 py-1.5 rounded-full">{c}</span>
          ))}
        </div>
        <div className="grid md:grid-cols-5 gap-10 mb-14">
          <div>
            <div className="font-black text-white text-2xl mb-4">NexoGen</div>
            <p className="text-white/25 text-sm leading-relaxed mb-5">Enterprise-grade AI website generation for teams that demand reliability.</p>
            <div className="text-white/15 text-xs">NexoGen Inc.<br />123 Market St<br />San Francisco, CA</div>
          </div>
          {cols.map(col => (
            <div key={col.h}>
              <div className="text-white/20 text-xs font-bold uppercase tracking-wider mb-4">{col.h}</div>
              <ul className="space-y-2.5">
                {col.ls.map(l => <li key={l}><a className="text-white/30 hover:text-white/60 text-sm transition-colors cursor-pointer">{l}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between gap-3 text-white/15 text-xs">
          <span>© 2025 NexoGen Inc. All rights reserved.</span>
          <div className="flex gap-4 flex-wrap">{['Privacy','Terms','Accessibility','Cookie Policy','Do Not Sell'].map(l => <a key={l} className="hover:text-white/35 transition-colors cursor-pointer">{l}</a>)}</div>
        </div>
      </div>
    </footer>
  );
}`,
  },
];
