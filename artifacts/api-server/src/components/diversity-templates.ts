// NexoGen Diversity Templates — Phases 2–5
// 23 new templates: Bento×6, Navbar×6, CTA×6, FAQ×5
// Every template has a UNIQUE DOM structure — NOT color variations.
// All content uses PLACEHOLDER tokens for dynamic replacement by codegen.

export const DIVERSITY_TEMPLATES: any[] = [

  // ══════════════════════════════════════════════════════════════════
  // BENTO V2 — 6 architecturally distinct bento layouts
  // category: 'bento'
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'bento-minimal-v1', name: 'Bento Minimal Grid', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['minimal', 'monochrome', 'numbered', 'no-icons'],
    description: '2×2 monochrome numbered grid — no icons, no gradients, pure typography. Linear/Vercel DNA.',
    priority: 12,
    standaloneCode: `function FeaturesBento() {
  const cells = [
    { n: '01', title: 'BENTO_FEAT_1_TITLE', desc: 'BENTO_FEAT_1_DESC' },
    { n: '02', title: 'BENTO_FEAT_2_TITLE', desc: 'BENTO_FEAT_2_DESC' },
    { n: '03', title: 'BENTO_FEAT_3_TITLE', desc: 'BENTO_FEAT_3_DESC' },
    { n: '04', title: 'BENTO_FEAT_4_TITLE', desc: 'BENTO_FEAT_4_DESC' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 flex items-end justify-between">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">BENTO_HEADING</h2>
          <p className="text-gray-400 max-w-xs text-sm text-right pb-1 hidden md:block">BENTO_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/8">
          {cells.map((c, i) => (
            <div key={i} className="bg-[#0a0a0a] p-10 group hover:bg-white/3 transition-colors cursor-default">
              <span className="text-[11px] font-mono text-gray-600 mb-8 block tracking-widest">{c.n}</span>
              <h3 className="text-2xl font-bold text-white mb-3 leading-snug">{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-px bg-white/5 px-10 py-6 flex items-center justify-between">
          <span className="text-gray-600 text-xs font-mono tracking-widest uppercase">BENTO_BOTTOM_LABEL</span>
          <a href="#" className="text-white text-xs font-semibold hover:text-gray-400 transition-colors">BENTO_CTA_TEXT →</a>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'bento-editorial-v1', name: 'Bento Editorial Hero', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['editorial', 'hero-row', 'magazine', 'full-width-top'],
    description: 'Full-width hero row (stat + heading) + 3 equal cells below. Magazine-editorial DOM.',
    priority: 12,
    standaloneCode: `function FeaturesBento() {
  const sub = [
    { title: 'BENTO_FEAT_2_TITLE', desc: 'BENTO_FEAT_2_DESC', tag: 'BENTO_TAG_2' },
    { title: 'BENTO_FEAT_3_TITLE', desc: 'BENTO_FEAT_3_DESC', tag: 'BENTO_TAG_3' },
    { title: 'BENTO_FEAT_4_TITLE', desc: 'BENTO_FEAT_4_DESC', tag: 'BENTO_TAG_4' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4">
        <div className="border border-white/10 p-12 flex flex-col md:flex-row items-start justify-between gap-8 hover:border-white/20 transition-colors">
          <div className="flex-1">
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4 block">BENTO_EYEBROW</span>
            <h2 className="text-4xl md:text-6xl font-black leading-none tracking-tight text-white mb-4">BENTO_HERO_HEADING</h2>
            <p className="text-gray-400 max-w-lg leading-relaxed">BENTO_HERO_DESC</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-6xl font-black text-white leading-none">BENTO_STAT_VALUE</span>
            <span className="text-gray-500 text-sm">BENTO_STAT_LABEL</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sub.map((f, i) => (
            <div key={i} className="border border-white/10 p-8 flex flex-col gap-4 hover:border-white/20 transition-colors group">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-600 border border-white/10 rounded px-2 py-1 self-start">{f.tag}</span>
              <h3 className="text-xl font-bold text-white leading-snug">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">{f.desc}</p>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-white transition-colors">Explore →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'bento-dashboard-v1', name: 'Bento Dashboard Split', category: 'bento',
    industries: ['saas', 'ai', 'fintech', 'startup'], tags: ['dashboard', 'metrics-sidebar', 'split-layout'],
    description: 'Left: 3 live metric cards stacked. Right: large feature + code/UI region. Dashboard DNA.',
    priority: 12,
    standaloneCode: `function FeaturesBento() {
  const metrics = [
    { label: 'METRIC_1_LABEL', value: 'METRIC_1_VALUE', delta: 'METRIC_1_DELTA', up: true },
    { label: 'METRIC_2_LABEL', value: 'METRIC_2_VALUE', delta: 'METRIC_2_DELTA', up: true },
    { label: 'METRIC_3_LABEL', value: 'METRIC_3_VALUE', delta: 'METRIC_3_DELTA', up: false },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">BENTO_HEADING</h2>
          <p className="text-gray-400 mt-3">BENTO_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3 flex flex-col gap-4">
            {metrics.map((m, i) => (
              <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-5">
                <p className="text-gray-500 text-xs mb-2">{m.label}</p>
                <p className="text-white text-2xl font-black">{m.value}</p>
                <p className={\`text-xs mt-1 \${m.up ? 'text-emerald-400' : 'text-red-400'}\`}>{m.delta}</p>
              </div>
            ))}
          </div>
          <div className="md:col-span-9 bg-white/4 border border-white/8 rounded-xl p-8 flex flex-col justify-between min-h-[320px]">
            <div>
              <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-3 block">BENTO_MAIN_TAG</span>
              <h3 className="text-3xl font-black text-white mb-3">BENTO_MAIN_TITLE</h3>
              <p className="text-gray-400 leading-relaxed max-w-xl">BENTO_MAIN_DESC</p>
            </div>
            <div className="mt-8 bg-black/40 border border-white/8 rounded-lg p-4 font-mono text-xs text-green-400 leading-relaxed">
              <p><span className="text-gray-600">$</span> BENTO_CODE_LINE_1</p>
              <p><span className="text-gray-600">$</span> BENTO_CODE_LINE_2</p>
              <p className="text-gray-600">✓ BENTO_CODE_SUCCESS</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'bento-magazine-v1', name: 'Bento Magazine Layout', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['magazine', '7-5-split', 'stacked-right', 'bold'],
    description: '7/5 asymmetric split: large left feature + two stacked right cells + full-width bottom strip.',
    priority: 12,
    standaloneCode: `function FeaturesBento() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white flex-1">BENTO_HEADING</h2>
          <p className="text-gray-500 text-sm max-w-xs hidden md:block">BENTO_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-7 bg-white/4 border border-white/10 rounded-2xl p-10 flex flex-col justify-between min-h-[360px] group hover:border-white/20 transition-colors">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-2xl mb-6">BENTO_ICON_1</div>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4 leading-tight">BENTO_FEAT_1_TITLE</h3>
              <p className="text-gray-400 leading-relaxed">BENTO_FEAT_1_DESC</p>
            </div>
            <span className="text-xs font-semibold text-gray-600 group-hover:text-white transition-colors mt-8 block">BENTO_FEAT_1_CTA →</span>
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
            <div className="bg-white/4 border border-white/10 rounded-2xl p-8 flex-1 group hover:border-white/20 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">BENTO_FEAT_2_TITLE</h3>
              <p className="text-gray-500 text-sm leading-relaxed">BENTO_FEAT_2_DESC</p>
            </div>
            <div className="bg-white/4 border border-white/10 rounded-2xl p-8 flex-1 group hover:border-white/20 transition-colors">
              <h3 className="text-xl font-bold text-white mb-3">BENTO_FEAT_3_TITLE</h3>
              <p className="text-gray-500 text-sm leading-relaxed">BENTO_FEAT_3_DESC</p>
            </div>
          </div>
          <div className="col-span-12 border border-white/10 rounded-2xl px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/2">
            <div className="flex items-center gap-6">
              {['BENTO_STRIP_ITEM_1', 'BENTO_STRIP_ITEM_2', 'BENTO_STRIP_ITEM_3'].map((item, i) => (
                <span key={i} className="text-gray-400 text-sm font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{item}</span>
              ))}
            </div>
            <button className="border border-white/20 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-white/5 transition-colors shrink-0">BENTO_STRIP_CTA →</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'bento-asymmetric-v1', name: 'Bento Asymmetric Reversed', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['asymmetric', '5-7-reversed', 'triple-bottom'],
    description: '5/7 reversed top (small-left + large-right) + 3×4col middle row + CTA strip. Distinct from magazine.',
    priority: 12,
    standaloneCode: `function FeaturesBento() {
  const row2 = [
    { icon: 'ICON_2A', title: 'FEAT_2A_TITLE', desc: 'FEAT_2A_DESC' },
    { icon: 'ICON_2B', title: 'FEAT_2B_TITLE', desc: 'FEAT_2B_DESC' },
    { icon: 'ICON_2C', title: 'FEAT_2C_TITLE', desc: 'FEAT_2C_DESC' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5 border border-white/10 rounded-2xl p-8 flex flex-col gap-6 hover:border-white/20 transition-colors">
            <span className="text-xs font-mono text-gray-600 tracking-widest uppercase">FEAT_1_TAG</span>
            <div>
              <h3 className="text-2xl font-black text-white mb-2">FEAT_1_TITLE</h3>
              <p className="text-gray-500 text-sm leading-relaxed">FEAT_1_DESC</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="text-white font-bold">FEAT_1_STAT_VALUE</span>
              <span className="text-gray-500">FEAT_1_STAT_LABEL</span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-7 border border-white/10 rounded-2xl p-10 flex flex-col justify-between min-h-[300px] hover:border-white/20 transition-colors bg-white/3">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-6">BENTO_MAIN_HEADING</h2>
              <p className="text-gray-400 leading-relaxed max-w-lg">BENTO_MAIN_DESC</p>
            </div>
            <a href="#" className="text-sm font-semibold text-gray-500 hover:text-white transition-colors">BENTO_MAIN_CTA →</a>
          </div>
          {row2.map((f, i) => (
            <div key={i} className="col-span-12 md:col-span-4 border border-white/10 rounded-xl p-7 hover:border-white/20 transition-colors group">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h4 className="text-lg font-bold text-white mb-2">{f.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'bento-mosaic-v1', name: 'Bento Mosaic Row-Span', category: 'bento',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['mosaic', 'row-span', 'pinterest', 'variable-height'],
    description: 'CSS grid row-span mosaic: tall cells + wide cells. Variable heights create Pinterest-style layout.',
    priority: 11,
    standaloneCode: `function FeaturesBento() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">BENTO_HEADING</h2>
          <p className="text-gray-400 mt-3 max-w-xl">BENTO_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-12 grid-rows-2 gap-4" style={{gridTemplateRows:'repeat(2, minmax(200px, auto))'}}>
          <div className="col-span-12 md:col-span-5 row-span-2 bg-white/4 border border-white/10 rounded-2xl p-10 flex flex-col justify-between hover:border-white/20 transition-colors">
            <div>
              <div className="text-4xl mb-6">MOSAIC_ICON_1</div>
              <h3 className="text-2xl font-black text-white mb-4">MOSAIC_FEAT_1_TITLE</h3>
              <p className="text-gray-400 leading-relaxed">MOSAIC_FEAT_1_DESC</p>
            </div>
            <div className="border-t border-white/10 pt-6 mt-6 flex items-center justify-between">
              <span className="text-gray-500 text-xs">MOSAIC_FEAT_1_META</span>
              <span className="text-white text-sm font-semibold">MOSAIC_FEAT_1_STAT</span>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 bg-white/4 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors">
            <h3 className="text-xl font-bold text-white mb-3">MOSAIC_FEAT_2_TITLE</h3>
            <p className="text-gray-500 text-sm leading-relaxed">MOSAIC_FEAT_2_DESC</p>
          </div>
          <div className="col-span-12 md:col-span-3 bg-white/4 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-colors flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black text-white">MOSAIC_STAT_VALUE</span>
            <span className="text-gray-500 text-xs mt-2">MOSAIC_STAT_LABEL</span>
          </div>
          <div className="col-span-12 md:col-span-7 bg-white/2 border border-white/10 rounded-2xl p-8 flex items-center gap-8 hover:border-white/20 transition-colors">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">MOSAIC_FEAT_3_TITLE</h3>
              <p className="text-gray-500 text-sm leading-relaxed">MOSAIC_FEAT_3_DESC</p>
            </div>
            <button className="shrink-0 border border-white/20 text-white text-sm px-6 py-3 rounded-lg hover:bg-white/5 transition-colors font-semibold">MOSAIC_CTA →</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },


  // ══════════════════════════════════════════════════════════════════
  // NAVBAR V2 — 6 architecturally distinct navbar layouts
  // category: 'navbar'
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'navbar-minimal-v2', name: 'Navbar Minimal Transparent', category: 'navbar',
    industries: ['saas', 'ai', 'startup'], tags: ['transparent', 'no-blur', 'ghost-cta', 'linear-style'],
    description: 'No backdrop blur, transparent bg, thin bottom border, ghost CTA button. Linear/Vercel DNA.',
    priority: 12,
    standaloneCode: `function Navbar() {
  const links = ['NAV_LINK_1', 'NAV_LINK_2', 'NAV_LINK_3', 'NAV_LINK_4'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-8">
          <span className="text-white font-bold text-base tracking-tight">SITE_NAME</span>
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => <a key={l} href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{l}</a>)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors hidden md:block">NAV_LOGIN</a>
          <button className="border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-white/5 transition-colors">NAV_CTA</button>
        </div>
      </div>
    </nav>
  );
}`,
  },

  {
    id: 'navbar-editorial-v2', name: 'Navbar Editorial Bold', category: 'navbar',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['editorial', 'bold-brand', 'tagline', 'framer-style'],
    description: 'Large brand + tagline left. Compact links right. Taller height. Bold editorial feel.',
    priority: 11,
    standaloneCode: `function Navbar() {
  const links = ['NAV_LINK_1', 'NAV_LINK_2', 'NAV_LINK_3'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-20">
        <div>
          <div className="text-white font-black text-xl tracking-tight leading-none">SITE_NAME</div>
          <div className="text-gray-600 text-[10px] tracking-widest uppercase mt-0.5">SITE_TAGLINE</div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-xs font-semibold tracking-wide uppercase transition-colors">{l}</a>)}
          <button className="text-black bg-white text-xs font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity">NAV_CTA →</button>
        </div>
      </div>
    </nav>
  );
}`,
  },

  {
    id: 'navbar-enterprise-v2', name: 'Navbar Enterprise Double Row', category: 'navbar',
    industries: ['saas', 'fintech', 'startup'], tags: ['enterprise', 'double-row', 'utility-bar', 'b2b'],
    description: 'Two-tier navigation: top utility bar (Login/Status/Docs) + bottom main nav with logo and CTA.',
    priority: 11,
    standaloneCode: `function Navbar() {
  const mainLinks = ['NAV_PRODUCT', 'NAV_SOLUTIONS', 'NAV_PRICING', 'NAV_RESOURCES'];
  const utilLinks = ['NAV_LOGIN', 'NAV_DOCS', 'NAV_STATUS'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 flex flex-col">
      <div className="bg-white/3 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-end h-8 gap-6">
          {utilLinks.map(l => <a key={l} href="#" className="text-gray-600 hover:text-gray-300 text-[11px] transition-colors">{l}</a>)}
        </div>
      </div>
      <div className="bg-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center h-14 gap-10">
          <span className="text-white font-bold text-base shrink-0">SITE_NAME</span>
          <div className="hidden md:flex items-center gap-8 flex-1">
            {mainLinks.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{l}</a>)}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="border border-white/15 text-white text-sm px-4 py-2 rounded hover:bg-white/5 transition-colors">NAV_DEMO</button>
            <button className="bg-white text-black text-sm font-semibold px-4 py-2 rounded hover:bg-gray-100 transition-colors">NAV_CTA</button>
          </div>
        </div>
      </div>
    </nav>
  );
}`,
  },

  {
    id: 'navbar-dashboard-v2', name: 'Navbar Dashboard App Bar', category: 'navbar',
    industries: ['saas', 'ai', 'fintech'], tags: ['dashboard', 'app-bar', 'compact', 'search', 'avatar'],
    description: 'Dashboard app-style top bar: icon logo + search input + notification + user avatar.',
    priority: 10,
    standaloneCode: `function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/8 h-12 flex items-center px-4 gap-4">
      <div className="flex items-center gap-3 shrink-0 mr-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black">S</div>
        <span className="text-white font-semibold text-sm hidden md:block">SITE_NAME</span>
      </div>
      <div className="flex-1 hidden md:block max-w-xs">
        <input className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-gray-400 placeholder-gray-600 outline-none focus:border-white/20" placeholder="NAV_SEARCH_PLACEHOLDER" readOnly />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 text-xs hover:bg-white/10 transition-colors">◆</button>
        <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 text-xs hover:bg-white/10 transition-colors">◉</button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">U</div>
      </div>
    </nav>
  );
}`,
  },

  {
    id: 'navbar-floating-v2', name: 'Navbar Floating Island', category: 'navbar',
    industries: ['agency', 'portfolio', 'startup', 'ai'], tags: ['floating', 'island', 'pill', 'centered', 'agency'],
    description: 'Centered floating island/pill at top. Does not span full width. Agency/creative DNA.',
    priority: 11,
    standaloneCode: `function Navbar() {
  const links = ['NAV_LINK_1', 'NAV_LINK_2', 'NAV_LINK_3'];
  return (
    <nav className="fixed top-5 left-0 right-0 z-50 flex justify-center px-4">
      <div className="flex items-center gap-6 bg-black/80 backdrop-blur-xl border border-white/15 rounded-full px-6 py-3 shadow-2xl">
        <span className="text-white font-bold text-sm shrink-0">SITE_NAME</span>
        <div className="w-px h-4 bg-white/15" />
        <div className="hidden md:flex items-center gap-5">
          {links.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-xs font-medium transition-colors">{l}</a>)}
        </div>
        <div className="w-px h-4 bg-white/15 hidden md:block" />
        <button className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity shrink-0">NAV_CTA</button>
      </div>
    </nav>
  );
}`,
  },

  {
    id: 'navbar-centered-v2', name: 'Navbar Centered Logo', category: 'navbar',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['centered-logo', 'symmetric', 'split-links'],
    description: '3 links left + centered logo + 3 links right + CTA. Symmetrical brand-forward layout.',
    priority: 10,
    standaloneCode: `function Navbar() {
  const leftLinks = ['NAV_LEFT_1', 'NAV_LEFT_2', 'NAV_LEFT_3'];
  const rightLinks = ['NAV_RIGHT_1', 'NAV_RIGHT_2', 'NAV_RIGHT_3'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/85 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center h-16">
        <div className="flex items-center gap-8 flex-1">
          {leftLinks.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-sm transition-colors hidden md:block">{l}</a>)}
        </div>
        <div className="flex flex-col items-center px-8">
          <span className="text-white font-black text-xl tracking-tight leading-none">SITE_NAME</span>
        </div>
        <div className="flex items-center gap-8 flex-1 justify-end">
          {rightLinks.map(l => <a key={l} href="#" className="text-gray-400 hover:text-white text-sm transition-colors hidden md:block">{l}</a>)}
          <button className="border border-white/20 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-white/5 transition-colors">NAV_CTA</button>
        </div>
      </div>
    </nav>
  );
}`,
  },


  // ══════════════════════════════════════════════════════════════════
  // CTA V2 — 6 architecturally distinct CTA layouts
  // category: 'cta'
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'cta-editorial-v1', name: 'CTA Editorial Oversized', category: 'cta',
    industries: ['saas', 'ai', 'startup'], tags: ['editorial', 'oversized-text', 'no-box', 'left-aligned', 'linear-style'],
    description: 'Huge left-aligned heading, no card/box, thin rule, single text-link CTA. Pure typography.',
    priority: 12,
    standaloneCode: `function CTA() {
  return (
    <section className="py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-16">
        <div className="border-t border-white/10 pt-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-8">CTA_EYEBROW</p>
          <h2 className="text-5xl md:text-8xl font-black text-white leading-none tracking-tighter mb-12 max-w-5xl">CTA_HEADLINE_LINE1<br/><span className="text-gray-500">CTA_HEADLINE_LINE2</span></h2>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <p className="text-gray-400 max-w-md leading-relaxed">CTA_SUBTEXT</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white text-xl font-black hover:text-gray-400 transition-colors">CTA_PRIMARY →</a>
              <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors">CTA_SECONDARY</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'cta-minimal-v1', name: 'CTA Minimal Centered', category: 'cta',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['minimal', 'centered', 'single-button', 'vercel-style'],
    description: 'Single centered heading + one paragraph + outlined button. No box. Monochrome clean.',
    priority: 12,
    standaloneCode: `function CTA() {
  return (
    <section className="py-24 border-t border-white/8">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">CTA_HEADLINE</h2>
        <p className="text-gray-400 mb-10 leading-relaxed">CTA_SUBTEXT</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="border border-white/25 text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/5 transition-colors text-sm">CTA_PRIMARY</button>
          <button className="text-gray-500 hover:text-white font-medium px-6 py-3 text-sm transition-colors">CTA_SECONDARY →</button>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'cta-dashboard-v1', name: 'CTA Dashboard Split', category: 'cta',
    industries: ['saas', 'ai', 'fintech', 'startup'], tags: ['dashboard', 'split', 'product-preview', 'saas'],
    description: 'Left: headline + benefits list + CTA. Right: mini dashboard UI mockup preview.',
    priority: 11,
    standaloneCode: `function CTA() {
  const benefits = ['CTA_BENEFIT_1', 'CTA_BENEFIT_2', 'CTA_BENEFIT_3', 'CTA_BENEFIT_4'];
  return (
    <section className="py-24 bg-white/2 border-t border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">CTA_HEADLINE</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">CTA_SUBTEXT</p>
          <ul className="space-y-3 mb-10">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[10px]">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <div className="flex gap-4">
            <button className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm">CTA_PRIMARY</button>
            <button className="text-gray-400 hover:text-white text-sm py-3 transition-colors">CTA_SECONDARY →</button>
          </div>
        </div>
        <div className="bg-white/4 border border-white/10 rounded-2xl p-6 hidden md:block">
          <div className="flex items-center gap-2 mb-4">
            {['bg-red-500','bg-yellow-500','bg-green-500'].map((c,i) => <div key={i} className={\`w-3 h-3 rounded-full \${c}\`} />)}
            <div className="flex-1 bg-white/5 rounded h-5 ml-2" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {['CTA_METRIC_1_LABEL','CTA_METRIC_2_LABEL'].map((m,i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{m}</div>
                <div className="text-white font-black text-xl">{i===0?'CTA_METRIC_1_VAL':'CTA_METRIC_2_VAL'}</div>
              </div>
            ))}
          </div>
          <div className="bg-white/5 rounded-lg h-24 flex items-end px-4 pb-4 gap-2">
            {[40,65,45,80,55,90,70].map((h,i) => <div key={i} className="flex-1 bg-indigo-500/50 rounded-sm" style={{height:\`\${h}%\`}} />)}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'cta-enterprise-v1', name: 'CTA Enterprise Contact', category: 'cta',
    industries: ['saas', 'fintech', 'startup'], tags: ['enterprise', 'b2b', 'form', 'trust-checklist'],
    description: 'Left: enterprise trust checklist. Right: contact/demo request form.',
    priority: 10,
    standaloneCode: `function CTA() {
  const trust = ['CTA_TRUST_1', 'CTA_TRUST_2', 'CTA_TRUST_3', 'CTA_TRUST_4', 'CTA_TRUST_5', 'CTA_TRUST_6'];
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-4">CTA_EYEBROW</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">CTA_HEADLINE</h2>
          <p className="text-gray-400 mb-10 leading-relaxed">CTA_SUBTEXT</p>
          <div className="grid grid-cols-2 gap-3">
            {trust.map((t, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-emerald-400 text-xs">◆</span>
                <span className="text-gray-300 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/3 border border-white/10 rounded-2xl p-8">
          <h3 className="text-white font-bold text-xl mb-6">CTA_FORM_TITLE</h3>
          <div className="flex flex-col gap-4">
            {['CTA_FIELD_NAME','CTA_FIELD_EMAIL','CTA_FIELD_COMPANY'].map((f, i) => (
              <div key={i}>
                <label className="text-gray-400 text-xs mb-1.5 block">{f}</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-lg h-10" />
              </div>
            ))}
            <div>
              <label className="text-gray-400 text-xs mb-1.5 block">CTA_FIELD_MESSAGE</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-lg h-20" />
            </div>
            <button className="w-full bg-white text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity text-sm mt-2">CTA_FORM_SUBMIT →</button>
            <p className="text-gray-600 text-xs text-center">CTA_FORM_NOTE</p>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'cta-story-v1', name: 'CTA Story Pullquote', category: 'cta',
    industries: ['agency', 'portfolio', 'startup', 'ai'], tags: ['story', 'pullquote', 'narrative', 'testimonial-cta'],
    description: 'Full-width narrative: decorative quote mark + large italic quote + attribution + CTA.',
    priority: 10,
    standaloneCode: `function CTA() {
  return (
    <section className="py-32 overflow-hidden relative">
      <div className="absolute top-0 left-0 text-[240px] font-black text-white/3 leading-none select-none pointer-events-none">"</div>
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <blockquote className="text-2xl md:text-4xl font-bold text-white leading-relaxed italic mb-12">
          "CTA_QUOTE_TEXT"
        </blockquote>
        <div className="flex items-center justify-center gap-4 mb-16">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">CTA_ATTRIBUTION_INITIAL</div>
          <div className="text-left">
            <div className="text-white font-semibold text-sm">CTA_ATTRIBUTION_NAME</div>
            <div className="text-gray-500 text-xs">CTA_ATTRIBUTION_ROLE</div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-12">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-4">CTA_HEADLINE</h3>
          <div className="flex gap-4 justify-center">
            <button className="bg-white text-black font-bold px-8 py-3 rounded-full hover:opacity-90 transition-opacity text-sm">CTA_PRIMARY</button>
            <button className="border border-white/20 text-white font-medium px-8 py-3 rounded-full hover:bg-white/5 transition-colors text-sm">CTA_SECONDARY</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'cta-split-v1', name: 'CTA Split Persona', category: 'cta',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['split', 'dual-persona', 'two-panels'],
    description: 'Two equal panels targeting different user personas. Distinct color/message per panel.',
    priority: 11,
    standaloneCode: `function CTA() {
  const panels = [
    { tag: 'CTA_PERSONA_1_TAG', heading: 'CTA_PERSONA_1_HEADING', desc: 'CTA_PERSONA_1_DESC', cta: 'CTA_PERSONA_1_CTA', accent: 'indigo' },
    { tag: 'CTA_PERSONA_2_TAG', heading: 'CTA_PERSONA_2_HEADING', desc: 'CTA_PERSONA_2_DESC', cta: 'CTA_PERSONA_2_CTA', accent: 'emerald' },
  ];
  return (
    <section className="py-0 border-t border-white/10">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {panels.map((p, i) => (
          <div key={i} className={\`py-24 px-12 md:px-16 flex flex-col gap-8 \${i===0 ? 'md:border-r border-white/10' : ''} bg-white/\${i===0?'0':'2'} group hover:bg-white/5 transition-colors\`}>
            <span className={\`text-xs font-semibold tracking-widest uppercase \${p.accent==='indigo'?'text-indigo-400':'text-emerald-400'}\`}>{p.tag}</span>
            <div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">{p.heading}</h3>
              <p className="text-gray-400 leading-relaxed">{p.desc}</p>
            </div>
            <button className={\`self-start border font-bold px-6 py-3 rounded-lg text-sm transition-colors hover:bg-white/5 \${p.accent==='indigo'?'border-indigo-500/40 text-indigo-300':'border-emerald-500/40 text-emerald-300'}\`}>{p.cta} →</button>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },


  // ══════════════════════════════════════════════════════════════════
  // FAQ V2 — 5 architecturally distinct FAQ layouts
  // category: 'faq'
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'faq-minimal-v1', name: 'FAQ Minimal Numbered', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['minimal', 'numbered', 'no-accordion', 'typography'],
    description: 'Numbered Q&A list. No toggle interaction. Everything visible. Pure typographic structure.',
    priority: 12,
    standaloneCode: `function FAQ() {
  const faqs = [
    { q: 'FAQ_Q1', a: 'FAQ_A1' },
    { q: 'FAQ_Q2', a: 'FAQ_A2' },
    { q: 'FAQ_Q3', a: 'FAQ_A3' },
    { q: 'FAQ_Q4', a: 'FAQ_A4' },
    { q: 'FAQ_Q5', a: 'FAQ_A5' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16 flex items-end gap-8">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight flex-1">FAQ_HEADING</h2>
          <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors pb-1 shrink-0 hidden md:block">FAQ_MORE_LINK →</a>
        </div>
        <div className="flex flex-col">
          {faqs.map((f, i) => (
            <div key={i} className="border-t border-white/8 py-8 grid grid-cols-12 gap-6">
              <span className="text-gray-700 font-mono text-xs mt-1 col-span-1">0{i+1}</span>
              <div className="col-span-11">
                <h3 className="text-white font-semibold text-lg mb-3">{f.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            </div>
          ))}
          <div className="border-t border-white/8" />
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'faq-grid-v1', name: 'FAQ Static Card Grid', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['grid', 'cards', 'no-accordion', 'static'],
    description: '2×3 static card grid with small icon + bold Q + answer text. No interaction required.',
    priority: 11,
    standaloneCode: `function FAQ() {
  const faqs = [
    { icon: 'FAQ_ICON_1', q: 'FAQ_Q1', a: 'FAQ_A1' },
    { icon: 'FAQ_ICON_2', q: 'FAQ_Q2', a: 'FAQ_A2' },
    { icon: 'FAQ_ICON_3', q: 'FAQ_Q3', a: 'FAQ_A3' },
    { icon: 'FAQ_ICON_4', q: 'FAQ_Q4', a: 'FAQ_A4' },
    { icon: 'FAQ_ICON_5', q: 'FAQ_Q5', a: 'FAQ_A5' },
    { icon: 'FAQ_ICON_6', q: 'FAQ_Q6', a: 'FAQ_A6' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-white mb-3">FAQ_HEADING</h2>
          <p className="text-gray-400">FAQ_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-xl p-7 hover:border-white/15 transition-colors">
              <div className="text-xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-base mb-3 leading-snug">{f.q}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ_CONTACT_LINK →</a>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'faq-sidebar-v1', name: 'FAQ Sidebar Categories', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'fintech'], tags: ['sidebar', 'categories', 'tabbed', 'filtered'],
    description: 'Left: vertical category buttons. Right: filtered Q&A for selected category. Interactive.',
    priority: 11,
    standaloneCode: `function FAQ() {
  const cats = ['FAQ_CAT_1', 'FAQ_CAT_2', 'FAQ_CAT_3', 'FAQ_CAT_4'];
  const all = {
    'FAQ_CAT_1': [{ q: 'FAQ_C1_Q1', a: 'FAQ_C1_A1' }, { q: 'FAQ_C1_Q2', a: 'FAQ_C1_A2' }, { q: 'FAQ_C1_Q3', a: 'FAQ_C1_A3' }],
    'FAQ_CAT_2': [{ q: 'FAQ_C2_Q1', a: 'FAQ_C2_A1' }, { q: 'FAQ_C2_Q2', a: 'FAQ_C2_A2' }],
    'FAQ_CAT_3': [{ q: 'FAQ_C3_Q1', a: 'FAQ_C3_A1' }, { q: 'FAQ_C3_Q2', a: 'FAQ_C3_A2' }],
    'FAQ_CAT_4': [{ q: 'FAQ_C4_Q1', a: 'FAQ_C4_A1' }, { q: 'FAQ_C4_Q2', a: 'FAQ_C4_A2' }],
  };
  const [cat, setCat] = React.useState(cats[0]);
  const [open, setOpen] = React.useState(null);
  const items = all[cat] || [];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-black text-white mb-12 tracking-tight">FAQ_HEADING</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-1">
            {cats.map(c => (
              <button key={c} onClick={() => { setCat(c); setOpen(null); }}
                className={\`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors \${cat===c ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-white'}\`}>
                {c}
              </button>
            ))}
          </div>
          <div className="md:col-span-3 flex flex-col gap-2">
            {items.map((f, i) => (
              <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
                <button className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/3 transition-colors" onClick={() => setOpen(open===i?null:i)}>
                  <span className="text-white font-medium text-sm pr-4">{f.q}</span>
                  <span className={\`text-gray-500 text-lg shrink-0 transition-transform duration-200 \${open===i?'rotate-45':''}\`}>+</span>
                </button>
                {open===i && <div className="px-6 pb-5 border-t border-white/5"><p className="text-gray-400 text-sm leading-relaxed pt-4">{f.a}</p></div>}
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
    id: 'faq-columns-v1', name: 'FAQ Two-Column Editorial', category: 'faq',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['columns', 'newspaper', 'two-col', 'editorial', 'no-interaction'],
    description: 'Two newspaper-style columns of Q&A pairs. No accordion, no interaction. Editorial layout.',
    priority: 10,
    standaloneCode: `function FAQ() {
  const col1 = [
    { q: 'FAQ_Q1', a: 'FAQ_A1' },
    { q: 'FAQ_Q2', a: 'FAQ_A2' },
    { q: 'FAQ_Q3', a: 'FAQ_A3' },
  ];
  const col2 = [
    { q: 'FAQ_Q4', a: 'FAQ_A4' },
    { q: 'FAQ_Q5', a: 'FAQ_A5' },
    { q: 'FAQ_Q6', a: 'FAQ_A6' },
  ];
  const Col = ({ items }) => (
    <div className="flex flex-col divide-y divide-white/8">
      {items.map((f, i) => (
        <div key={i} className="py-8">
          <h3 className="text-white font-semibold text-base mb-3">{f.q}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
        </div>
      ))}
    </div>
  );
  return (
    <section className="py-24 border-t border-white/8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">FAQ_HEADING</h2>
          <p className="text-gray-400 text-sm leading-relaxed md:text-right">FAQ_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
          <Col items={col1} />
          <Col items={col2} />
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'faq-enterprise-v1', name: 'FAQ Enterprise Tabbed', category: 'faq',
    industries: ['saas', 'fintech', 'startup'], tags: ['enterprise', 'tabbed', 'categories', 'b2b'],
    description: 'Enterprise tabbed FAQ: 4 tabs (General/Billing/Security/Integration) with accordion per tab.',
    priority: 10,
    standaloneCode: `function FAQ() {
  const tabs = ['FAQ_TAB_GENERAL', 'FAQ_TAB_BILLING', 'FAQ_TAB_SECURITY', 'FAQ_TAB_INTEGRATION'];
  const data = {
    'FAQ_TAB_GENERAL': [{ q: 'FAQ_G_Q1', a: 'FAQ_G_A1' }, { q: 'FAQ_G_Q2', a: 'FAQ_G_A2' }, { q: 'FAQ_G_Q3', a: 'FAQ_G_A3' }],
    'FAQ_TAB_BILLING': [{ q: 'FAQ_B_Q1', a: 'FAQ_B_A1' }, { q: 'FAQ_B_Q2', a: 'FAQ_B_A2' }],
    'FAQ_TAB_SECURITY': [{ q: 'FAQ_S_Q1', a: 'FAQ_S_A1' }, { q: 'FAQ_S_Q2', a: 'FAQ_S_A2' }],
    'FAQ_TAB_INTEGRATION': [{ q: 'FAQ_I_Q1', a: 'FAQ_I_A1' }, { q: 'FAQ_I_Q2', a: 'FAQ_I_A2' }],
  };
  const [tab, setTab] = React.useState(tabs[0]);
  const [open, setOpen] = React.useState(null);
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white mb-3 tracking-tight">FAQ_HEADING</h2>
          <p className="text-gray-400">FAQ_SUBHEADING</p>
        </div>
        <div className="flex gap-1 p-1 bg-white/4 border border-white/8 rounded-xl mb-8">
          {tabs.map(t => (
            <button key={t} onClick={() => { setTab(t); setOpen(null); }}
              className={\`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all \${tab===t ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}\`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {(data[tab]||[]).map((f, i) => (
            <div key={i} className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors" onClick={() => setOpen(open===i?null:i)}>
                <span className="text-white font-medium text-sm pr-4">{f.q}</span>
                <span className={\`text-gray-500 text-xl shrink-0 transition-transform duration-200 \${open===i?'rotate-45':''}\`}>+</span>
              </button>
              {open===i && <div className="px-6 pb-5 border-t border-white/5"><p className="text-gray-400 text-sm leading-relaxed pt-4">{f.a}</p></div>}
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <p className="text-gray-500 text-sm">FAQ_STILL_QUESTION <a href="#" className="text-white underline underline-offset-4">FAQ_CONTACT_LINK</a></p>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ── TESTIMONIALS DIVERSITY V2 ────────────────────────────────────────────

  {
    id: 'testimonials-wall-v1', name: 'Testimonials Masonry Wall', category: 'testimonials',
    industries: ['saas', 'startup', 'ai', 'agency', 'generic'], tags: ['masonry', 'wall', 'multi'],
    description: 'Masonry-column quote wall — 3-col desktop, varied card heights, avatar initials', priority: 8,
    standaloneCode: `function Testimonials() {
  const quotes = [
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', company: 'TESTIMONIAL_1_COMPANY', text: 'TESTIMONIAL_1_QUOTE' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', company: 'TESTIMONIAL_2_COMPANY', text: 'TESTIMONIAL_2_QUOTE' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', company: 'TESTIMONIAL_3_COMPANY', text: 'TESTIMONIAL_3_QUOTE' },
    { name: 'TESTIMONIAL_4_NAME', role: 'TESTIMONIAL_4_ROLE', company: 'TESTIMONIAL_4_COMPANY', text: 'TESTIMONIAL_4_QUOTE' },
    { name: 'TESTIMONIAL_5_NAME', role: 'TESTIMONIAL_5_ROLE', company: 'TESTIMONIAL_5_COMPANY', text: 'TESTIMONIAL_5_QUOTE' },
    { name: 'TESTIMONIAL_6_NAME', role: 'TESTIMONIAL_6_ROLE', company: 'TESTIMONIAL_6_COMPANY', text: 'TESTIMONIAL_6_QUOTE' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 block mb-3">TESTIMONIALS_LABEL</span>
          <h2 className="text-4xl font-black text-white tracking-tight">TESTIMONIALS_HEADING</h2>
        </div>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {quotes.map((q, i) => (
            <div key={i} className="break-inside-avoid mb-5 bg-white/3 border border-white/8 rounded-2xl p-6">
              <p className="text-white/80 text-sm leading-relaxed mb-5">"{q.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {q.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{q.name}</p>
                  <p className="text-gray-500 text-xs">{q.role} · {q.company}</p>
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
    id: 'testimonials-featured-v1', name: 'Testimonials Featured + Grid', category: 'testimonials',
    industries: ['saas', 'enterprise', 'fintech', 'ai', 'generic'], tags: ['featured', 'hero-quote', 'asymmetric'],
    description: 'Large featured quote (3/5 col) + 3 smaller quotes stacked (2/5 col)', priority: 8,
    standaloneCode: `function Testimonials() {
  const featured = { name: 'FEATURED_NAME', role: 'FEATURED_ROLE', company: 'FEATURED_COMPANY', quote: 'FEATURED_QUOTE_LONG' };
  const others = [
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', quote: 'TESTIMONIAL_1_QUOTE' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', quote: 'TESTIMONIAL_2_QUOTE' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', quote: 'TESTIMONIAL_3_QUOTE' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">TESTIMONIALS_LABEL</span>
          <h2 className="text-4xl font-black text-white mt-2 tracking-tight">TESTIMONIALS_HEADING</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 bg-white/4 border border-white/10 rounded-3xl p-10 flex flex-col justify-between min-h-64">
            <p className="text-white text-2xl font-light leading-relaxed tracking-tight mb-10">"{featured.quote}"</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/15 flex items-center justify-center text-white font-bold">
                {featured.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-white font-semibold">{featured.name}</p>
                <p className="text-gray-400 text-sm">{featured.role}, {featured.company}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            {others.map((o, i) => (
              <div key={i} className="bg-white/2 border border-white/6 rounded-2xl p-5 flex-1">
                <p className="text-gray-300 text-sm leading-relaxed mb-4">"{o.quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">{o.name[0]}</div>
                  <div>
                    <p className="text-white text-xs font-semibold">{o.name}</p>
                    <p className="text-gray-500 text-xs">{o.role}</p>
                  </div>
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
    id: 'testimonials-minimal-v1', name: 'Testimonials Single Rotating', category: 'testimonials',
    industries: ['agency', 'portfolio', 'luxury', 'editorial', 'generic'], tags: ['minimal', 'rotating', 'large-type'],
    description: 'Single large quote with dot-navigation — editorial, minimal, large typography', priority: 7,
    standaloneCode: `function Testimonials() {
  const quotes = [
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', quote: 'TESTIMONIAL_1_QUOTE' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', quote: 'TESTIMONIAL_2_QUOTE' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', quote: 'TESTIMONIAL_3_QUOTE' },
  ];
  const [idx, setIdx] = React.useState(0);
  const q = quotes[idx];
  return (
    <section className="py-32 border-y border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 block mb-12">TESTIMONIALS_LABEL</span>
        <p className="text-3xl md:text-5xl font-light text-white leading-tight tracking-tight mb-12">"{q.quote}"</p>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-bold">
            {q.name[0]}
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{q.name}</p>
            <p className="text-gray-500 text-xs">{q.role}</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {quotes.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={\`h-1.5 rounded-full transition-all \${i===idx ? 'bg-white w-8' : 'bg-white/20 w-2'}\`}/>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'testimonials-ticker-v1', name: 'Testimonials Auto-Scroll Ticker', category: 'testimonials',
    industries: ['saas', 'startup', 'ai', 'fintech', 'generic'], tags: ['ticker', 'animated', 'scroll'],
    description: 'Horizontally auto-scrolling ticker of testimonial cards with fade masks', priority: 7,
    standaloneCode: `function Testimonials() {
  const quotes = [
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', text: 'TESTIMONIAL_1_QUOTE' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', text: 'TESTIMONIAL_2_QUOTE' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', text: 'TESTIMONIAL_3_QUOTE' },
    { name: 'TESTIMONIAL_4_NAME', role: 'TESTIMONIAL_4_ROLE', text: 'TESTIMONIAL_4_QUOTE' },
    { name: 'TESTIMONIAL_5_NAME', role: 'TESTIMONIAL_5_ROLE', text: 'TESTIMONIAL_5_QUOTE' },
  ];
  const doubled = [...quotes, ...quotes];
  const [offset, setOffset] = React.useState(0);
  const cardW = 296;
  React.useEffect(() => {
    const id = setInterval(() => setOffset(x => (x + 0.4) % (quotes.length * cardW)), 16);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-10 text-center">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-500 block mb-3">TESTIMONIALS_LABEL</span>
        <h2 className="text-4xl font-black text-white tracking-tight">TESTIMONIALS_HEADING</h2>
      </div>
      <div className="relative">
        <div className="flex gap-4" style={{transform: \`translateX(-\${offset}px)\`, width: 'max-content'}}>
          {doubled.map((q, i) => (
            <div key={i} className="w-72 shrink-0 bg-white/3 border border-white/8 rounded-2xl p-6">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">"{q.text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white text-xs font-bold shrink-0">{q.name[0]}</div>
                <div>
                  <p className="text-white text-xs font-semibold">{q.name}</p>
                  <p className="text-gray-500 text-xs">{q.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent pointer-events-none"/>
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent pointer-events-none"/>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'testimonials-data-v1', name: 'Testimonials Metrics + Social Proof', category: 'testimonials',
    industries: ['saas', 'enterprise', 'fintech', 'ai', 'startup'], tags: ['metrics', 'data', 'social-proof'],
    description: 'Key metrics bar above 4-quote grid — combines quantitative + qualitative proof', priority: 8,
    standaloneCode: `function Testimonials() {
  const metrics = [
    { value: 'METRIC_1_VALUE', label: 'METRIC_1_LABEL' },
    { value: 'METRIC_2_VALUE', label: 'METRIC_2_LABEL' },
    { value: 'METRIC_3_VALUE', label: 'METRIC_3_LABEL' },
  ];
  const quotes = [
    { name: 'TESTIMONIAL_1_NAME', role: 'TESTIMONIAL_1_ROLE', text: 'TESTIMONIAL_1_QUOTE', platform: 'PLATFORM_1' },
    { name: 'TESTIMONIAL_2_NAME', role: 'TESTIMONIAL_2_ROLE', text: 'TESTIMONIAL_2_QUOTE', platform: 'PLATFORM_2' },
    { name: 'TESTIMONIAL_3_NAME', role: 'TESTIMONIAL_3_ROLE', text: 'TESTIMONIAL_3_QUOTE', platform: 'PLATFORM_3' },
    { name: 'TESTIMONIAL_4_NAME', role: 'TESTIMONIAL_4_ROLE', text: 'TESTIMONIAL_4_QUOTE', platform: 'PLATFORM_4' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-8 mb-16 pb-16 border-b border-white/8">
          {metrics.map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-5xl font-black text-white tracking-tighter mb-1">{m.value}</p>
              <p className="text-gray-400 text-sm">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">TESTIMONIALS_HEADING</h2>
          <span className="text-xs text-gray-500 tracking-wider uppercase">TESTIMONIALS_LABEL</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotes.map((q, i) => (
            <div key={i} className="bg-white/2 border border-white/6 rounded-xl p-5 flex gap-4">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">{q.name[0]}</div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-sm font-semibold">{q.name}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{q.platform}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{q.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

];
