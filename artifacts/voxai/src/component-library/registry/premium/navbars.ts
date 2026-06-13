import type { ComponentDef } from '../../types';

export const premiumNavbarComponents: ComponentDef[] = [
  {
    id: 'navbar-linear-v1', name: 'Navbar Linear V1', category: 'navbar', style: 'minimal', theme: 'dark',
    industries: ['saas', 'startup', 'productivity'],
    tags: ['linear', 'minimal', 'dark', 'clean', 'scroll-aware', 'premium'],
    description: 'Linear.app-style navbar: ultra minimal, dark, scroll-aware blur, keyboard shortcut chip', priority: 10,
    standaloneCode: `function NavbarLinearV1() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  const links = ['Product','Docs','Changelog','Pricing'];
  return (
    <div className="min-h-screen bg-black">
      <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + (scrolled?"border-b border-white/8 bg-black/90 backdrop-blur-xl":"bg-transparent")}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-white font-black text-lg">NexoGen</div>
            <div className="hidden md:flex gap-6">
              {links.map(l => <a key={l} className="text-white/40 hover:text-white/80 text-sm font-medium transition-colors cursor-pointer">{l}</a>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-md px-2.5 py-1 text-white/25 text-xs font-mono">⌘K</div>
            <a className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">Log in</a>
            <button className="bg-white text-black font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Get started</button>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Navbar preview — scroll to see effect</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-vercel-v1', name: 'Navbar Vercel V1', category: 'navbar', style: 'minimal', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['vercel', 'dark', 'clean', 'dark-glass', 'border', 'premium'],
    description: 'Vercel.com-style navbar: dark, glass backdrop, full-width border-bottom on scroll', priority: 9,
    standaloneCode: `function NavbarVercelV1() {
  const [open, setOpen] = React.useState(false);
  const links = [
    {l:'Products',sub:['AI Generation','Component Library','Deployments','Analytics']},
    {l:'Docs',sub:[]},{l:'Pricing',sub:[]},{l:'Blog',sub:[]},
  ];
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="text-white font-black text-xl">▲ NexoGen</div>
            <div className="hidden md:flex gap-1">
              {links.map(l => (
                <div key={l.l} className="relative group">
                  <button className="text-white/50 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1">
                    {l.l}{l.sub.length>0&&<span className="text-white/25 text-xs">⌄</span>}
                  </button>
                  {l.sub.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 bg-[#111] border border-white/10 rounded-xl p-2 min-w-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
                      {l.sub.map(s => <div key={s} className="px-3 py-2 text-white/50 hover:text-white text-sm rounded-lg hover:bg-white/5 cursor-pointer transition-all">{s}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-white/40 hover:text-white text-sm px-4 py-1.5 transition-colors">Log in</button>
            <button className="bg-white text-black font-bold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition-colors">Deploy now</button>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Vercel-style navbar preview</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-glass-v1', name: 'Navbar Glass V1', category: 'navbar', style: 'glassmorphism', theme: 'dark',
    industries: ['saas', 'startup', 'design'],
    tags: ['glass', 'floating', 'dark', 'blur', 'centered', 'premium'],
    description: 'Floating glassmorphism navbar: centered, floating pill shape, backdrop blur, gradient border', priority: 9,
    standaloneCode: `function NavbarGlassV1() {
  const links = ['Features','Pricing','Docs','Blog'];
  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#0a0a1a,#0d0d20,#1a0a2e)'}}>
      <div className="flex justify-center pt-6 px-6">
        <nav className="flex items-center gap-2 bg-white/[0.07] backdrop-blur-2xl border border-white/15 rounded-full px-3 py-2 shadow-2xl">
          <div className="text-white font-black px-3 mr-2">NexoGen</div>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex gap-1">
            {links.map(l => <a key={l} className="text-white/50 hover:text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-white/8 transition-all cursor-pointer">{l}</a>)}
          </div>
          <div className="w-px h-5 bg-white/10" />
          <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
            Get started
          </button>
        </nav>
      </div>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Glassmorphism floating navbar preview</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-mega-menu-v1', name: 'Navbar Mega Menu V1', category: 'navbar', style: 'modern', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['mega-menu', 'dropdown', 'dark', 'enterprise', 'comprehensive', 'navigation'],
    description: 'Enterprise mega-menu navbar: full-width dropdown with sections, icons, descriptions', priority: 8,
    standaloneCode: `function NavbarMegaMenuV1() {
  const [open, setOpen] = React.useState(null);
  const menus = {
    Products:[
      {icon:'⚡',t:'AI Generation',d:'Build websites in 60s'},
      {icon:'🎨',t:'Component Library',d:'100+ premium sections'},
      {icon:'🚀',t:'Deployments',d:'One-click to live'},
      {icon:'📊',t:'Analytics',d:'Track performance'},
    ],
    Company:[
      {icon:'👋',t:'About',d:'Our mission'},
      {icon:'💼',t:'Careers',d:'Join the team'},
      {icon:'📰',t:'Blog',d:'News & updates'},
      {icon:'📞',t:'Contact',d:'Talk to us'},
    ],
  };
  return (
    <div className="min-h-screen bg-[#050508]">
      <nav className="relative z-50 bg-[#050508]/95 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-white font-black text-xl">NexoGen</div>
            <div className="hidden md:flex gap-0">
              {['Products','Solutions','Company','Pricing'].map(label => (
                <div key={label} className="relative" onMouseEnter={() => setOpen(label)} onMouseLeave={() => setOpen(null)}>
                  <button className={"text-sm font-medium px-4 py-5 transition-colors " + (open===label?"text-white":"text-white/50 hover:text-white")}>
                    {label}
                  </button>
                  {menus[label] && open === label && (
                    <div className="absolute top-full left-0 mt-0 bg-[#0d0d12] border border-white/10 rounded-2xl p-4 grid grid-cols-2 gap-2 w-80 shadow-2xl">
                      {menus[label].map(item => (
                        <div key={item.t} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all">
                          <span className="text-lg">{item.icon}</span>
                          <div><div className="text-white text-sm font-medium">{item.t}</div><div className="text-white/30 text-xs">{item.d}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-white/40 hover:text-white text-sm transition-colors">Log in</button>
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity">Start free</button>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Mega menu navbar — hover Products or Company</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-transparent-v1', name: 'Navbar Transparent V1', category: 'navbar', style: 'bold', theme: 'dark',
    industries: ['startup', 'portfolio', 'agency'],
    tags: ['transparent', 'overlay', 'dark', 'hero', 'bold', 'full-bleed'],
    description: 'Transparent navbar for full-bleed hero pages: no background, white text, fades in on scroll', priority: 8,
    standaloneCode: `function NavbarTransparentV1() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <div className="min-h-screen" style={{background:'linear-gradient(135deg,#0a001a,#001a3d)'}}>
      <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-500 " + (scrolled?"bg-black/80 backdrop-blur-xl border-b border-white/8":"bg-transparent")}>
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-white font-black text-2xl">NexoGen</div>
          <div className="hidden md:flex gap-8">
            {['Product','Pricing','Docs','Company'].map(l => <a key={l} className="text-white/60 hover:text-white text-sm font-medium transition-colors cursor-pointer">{l}</a>)}
          </div>
          <button className="border-2 border-white/30 text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-white/10 hover:border-white/50 transition-all">
            Get started
          </button>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center h-screen text-center px-6">
        <h1 className="font-black text-white text-6xl mb-4" style={{letterSpacing:'-0.04em'}}>Your next website</h1>
        <p className="text-white/40 text-xl">Built by AI. Loved by users.</p>
        <div className="mt-8 text-white/20 text-sm">↓ Scroll to see navbar transition</div>
      </div>
      <div className="h-screen flex items-center justify-center bg-black"><div className="text-white/10">Second section</div></div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-stripe-v1', name: 'Navbar Stripe V1', category: 'navbar', style: 'modern', theme: 'light',
    industries: ['saas', 'fintech', 'startup'],
    tags: ['stripe', 'light', 'clean', 'white', 'enterprise', 'professional'],
    description: 'Stripe.com-style navbar: clean white, professional, product mega-menu on hover', priority: 8,
    standaloneCode: `function NavbarStripeV1() {
  const [hovering, setHovering] = React.useState(null);
  const items = ['Products','Solutions','Developers','Pricing'];
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="font-black text-gray-900 text-xl" style={{letterSpacing:'-0.04em'}}>NexoGen</div>
            <div className="hidden md:flex gap-1">
              {items.map(item => (
                <div key={item} className="relative" onMouseEnter={() => setHovering(item)} onMouseLeave={() => setHovering(null)}>
                  <button className={"flex items-center gap-1 text-sm font-medium px-3.5 py-2 rounded-lg transition-colors " + (hovering===item?"text-gray-900 bg-gray-50":"text-gray-500 hover:text-gray-900")}>
                    {item}
                    {hovering===item && <span className="text-gray-400 text-xs">⌄</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">Sign in</button>
            <button className="bg-[#635bff] hover:bg-[#5549e8] text-white font-bold text-sm px-5 py-2.5 rounded-full transition-colors">
              Start now →
            </button>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="font-black text-gray-900 text-5xl mb-4" style={{letterSpacing:'-0.04em'}}>Stripe-style navbar</h1>
        <p className="text-gray-400 text-xl">Clean, professional, enterprise-ready.</p>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-command-v1', name: 'Navbar Command V1', category: 'navbar', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'productivity'],
    tags: ['command', 'search', 'dark', 'developer', 'power-user', 'keyboard'],
    description: 'Command-bar navbar: center search/command input, minimal links, dark premium', priority: 8,
    standaloneCode: `function NavbarCommandV1() {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#060609]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060609]/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">
          <div className="text-white font-black text-lg shrink-0">NexoGen</div>
          <div className={"flex-1 max-w-sm mx-auto flex items-center gap-2.5 border rounded-xl px-3.5 py-2 transition-all " + (focused?"border-violet-500/50 bg-violet-500/5":"border-white/10 bg-white/[0.03]")}>
            <span className="text-white/25 text-sm">🔍</span>
            <input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search or type a command..." className="flex-1 bg-transparent text-white/50 text-sm outline-none placeholder-white/20" />
            <kbd className="bg-white/8 text-white/25 text-xs px-1.5 py-0.5 rounded font-mono shrink-0">⌘K</kbd>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a className="text-white/35 hover:text-white/70 text-sm font-medium transition-colors cursor-pointer">Docs</a>
            <a className="text-white/35 hover:text-white/70 text-sm font-medium transition-colors cursor-pointer">GitHub</a>
            <button className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors">Sign up</button>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Command-bar navbar — click the search to focus</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-notion-v1', name: 'Navbar Notion V1', category: 'navbar', style: 'minimal', theme: 'light',
    industries: ['saas', 'productivity', 'startup'],
    tags: ['notion', 'light', 'minimal', 'clean', 'simple', 'white'],
    description: 'Notion.so-style navbar: ultra clean white, simple links, emoji favicon, no fluff', priority: 7,
    standaloneCode: `function NavbarNotionV1() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="font-bold text-gray-900">NexoGen</span>
            </div>
            <div className="hidden md:flex gap-6">
              {['Product','Download','Enterprise','Pricing','Blog'].map(l => <a key={l} className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors cursor-pointer">{l}</a>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">Log in</button>
            <button className="bg-black text-white font-bold text-sm px-5 py-2 rounded-md hover:bg-gray-800 transition-colors">Get NexoGen free</button>
          </div>
        </div>
      </nav>
      <div className="flex flex-col items-center justify-center h-screen text-center px-6">
        <div className="text-5xl mb-4">⚡</div>
        <h1 className="font-black text-gray-900 text-5xl mb-4" style={{letterSpacing:'-0.04em'}}>Notion-style navbar</h1>
        <p className="text-gray-400 text-xl">Clean. Simple. Professional.</p>
      </div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-product-v1', name: 'Navbar Product V1', category: 'navbar', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['product', 'dark', 'announcement', 'badge', 'cta', 'prominent'],
    description: 'Product-first navbar: announcement badge, prominent CTA, product-focused links', priority: 8,
    standaloneCode: `function NavbarProductV1() {
  const [dismissed, setDismissed] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#050508]">
      {!dismissed && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold text-center py-2 px-4 relative">
          🚀 NexoGen 2.0 is live — New components, faster AI, better deploys.
          <a className="underline ml-2 cursor-pointer hover:opacity-80">See what's new →</a>
          <button onClick={() => setDismissed(true)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}
      <nav className="sticky top-0 z-50 bg-[#050508]/95 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-white font-black text-xl flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">N</div>
              NexoGen
            </div>
            <div className="hidden md:flex gap-6">
              {['Features','Templates','Pricing','Changelog'].map(l => <a key={l} className="text-white/40 hover:text-white text-sm font-medium transition-colors cursor-pointer">{l}</a>)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a className="text-white/40 hover:text-white text-sm transition-colors cursor-pointer">Log in</a>
            <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Try for free →
            </button>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">Product navbar with announcement banner</div>
    </div>
  );
}`,
  },
  {
    id: 'navbar-dark-split-v1', name: 'Navbar Dark Split V1', category: 'navbar', style: 'corporate', theme: 'dark',
    industries: ['saas', 'enterprise', 'startup'],
    tags: ['split', 'enterprise', 'dark', 'avatar', 'user-menu', 'app'],
    description: 'App-shell navbar: left brand + nav, right user avatar + notifications, app-like feel', priority: 7,
    standaloneCode: `function NavbarDarkSplitV1() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0d]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d12] border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm">N</div>
              <span className="text-white font-bold">NexoGen</span>
            </div>
            <div className="hidden md:flex gap-1">
              {['Dashboard','Build','Components','Deployments'].map((l,i) => (
                <a key={l} className={"text-sm font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-all " + (i===0?"bg-white/8 text-white":"text-white/40 hover:text-white hover:bg-white/5")}>{l}</a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors">🔔</button>
            <div className="relative">
              <button onClick={() => setMenuOpen(o=>!o)} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">JD</button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-[#111] border border-white/10 rounded-xl p-2 w-44 shadow-2xl">
                  {['Profile','Settings','Team','Billing','Logout'].map(item => <div key={item} className="px-3 py-2 text-white/50 hover:text-white text-sm rounded-lg hover:bg-white/5 cursor-pointer transition-all">{item}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="flex items-center justify-center h-screen text-white/10 text-sm">App-shell navbar — click avatar for menu</div>
    </div>
  );
}`,
  },
];
