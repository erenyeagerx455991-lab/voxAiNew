// Section Architecture V2 — Features, Dashboard, Pricing Templates
// 16 templates with genuinely different DOM architectures

export const SECTION_TEMPLATES: any[] = [

  // ══════════════════════════════════════════════════════════════════
  // FEATURES V2 — 6 templates
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'features-stripe-v1', name: 'Features Stripe Panel', category: 'features',
    industries: ['saas', 'fintech', 'startup', 'generic'], tags: ['stripe-style', 'two-panel', 'feature-list', 'tiles'],
    description: 'Two-column: left = feature list with horizontal dividers, right = 2×2 capability tiles. Stripe DNA.',
    priority: 12,
    standaloneCode: `function Features() {
  const feats = [
    { title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC' },
    { title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC' },
    { title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC' },
    { title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC' },
  ];
  const tiles = [
    { icon: '◆', label: 'TILE_1_LABEL', sub: 'TILE_1_VALUE', grad: 'from-[#635BFF] to-[#00D4FF]' },
    { icon: '↗', label: 'TILE_2_LABEL', sub: 'TILE_2_VALUE', grad: 'from-[#00D4FF] to-emerald-400' },
    { icon: '◈', label: 'TILE_3_LABEL', sub: 'TILE_3_VALUE', grad: 'from-violet-500 to-[#635BFF]' },
    { icon: '◉', label: 'TILE_4_LABEL', sub: 'TILE_4_VALUE', grad: 'from-[#635BFF] to-pink-500' },
  ];
  return (
    <section className="py-24 bg-[#0A2540]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="text-[#635BFF] text-xs font-semibold tracking-widest uppercase mb-3">FEATURES_EYEBROW</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-10">FEATURES_HEADING</h2>
          {feats.map((f, i) => (
            <div key={i} className="border-t border-white/10 py-6 group hover:border-[#635BFF]/40 transition-colors">
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#A8B4C0] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
          <div className="border-t border-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-20">
          {tiles.map((t, i) => (
            <div key={i} className="bg-[#0F3460]/40 border border-white/10 rounded-2xl p-6 hover:border-[#635BFF]/40 transition-all group">
              <div className={\`w-10 h-10 rounded-xl bg-gradient-to-br \${t.grad} flex items-center justify-center text-white font-bold text-lg mb-4\`}>{t.icon}</div>
              <div className="text-white font-semibold text-sm mb-1">{t.label}</div>
              <div className="text-[#A8B4C0] text-xs">{t.sub}</div>
            </div>
          ))}
          <div className="col-span-2 bg-gradient-to-r from-[#635BFF]/15 to-[#00D4FF]/10 border border-[#635BFF]/30 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-white font-semibold text-sm">FEATURES_CTA_TEXT</div>
              <div className="text-[#A8B4C0] text-xs mt-0.5">FEATURES_CTA_SUB</div>
            </div>
            <Button type="button" className="bg-gradient-to-r from-[#635BFF] to-[#00D4FF] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:opacity-90 transition-all shrink-0">CTA_PRIMARY →</Button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'features-framer-v1', name: 'Features Framer Magazine', category: 'features',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['framer-style', 'magazine-grid', 'bold-motion', 'asymmetric'],
    description: 'Full-width magazine asymmetric grid: oversized title + 4 non-uniform bold cards. Framer DNA.',
    priority: 12,
    standaloneCode: `function Features() {
  const cards = [
    { title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC', tag: 'FEATURE_1_TAG', big: true },
    { title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC', tag: 'FEATURE_2_TAG', big: false },
    { title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC', tag: 'FEATURE_3_TAG', big: false },
    { title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC', tag: 'FEATURE_4_TAG', big: false },
  ];
  return (
    <section className="py-24 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <h2 className="font-black text-white leading-none tracking-tighter" style={{fontSize:'clamp(40px,5vw,72px)'}}>FEATURES_HEADING</h2>
          <p className="text-white/65 text-base max-w-xs md:text-right">FEATURES_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-10 relative overflow-hidden min-h-[280px] flex flex-col justify-between hover:scale-[1.01] transition-transform">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" aria-hidden="true" />
            <div>
              <span className="bg-black/20 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{cards[0].tag}</span>
              <h3 className="text-white text-3xl font-black mt-5 leading-tight">{cards[0].title}</h3>
            </div>
            <p className="text-white/80 text-base leading-relaxed max-w-md">{cards[0].desc}</p>
          </div>
          <div className="col-span-12 md:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between min-h-[280px] hover:border-white/20 transition-colors">
            <span className="bg-white/8 text-white/70 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-fit">{cards[1].tag}</span>
            <div>
              <h3 className="text-white text-2xl font-black mb-3">{cards[1].title}</h3>
              <p className="text-white/70 text-base leading-relaxed">{cards[1].desc}</p>
            </div>
          </div>
          {cards.slice(2).map((c, i) => (
            <div key={i} className="col-span-12 md:col-span-6 bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-colors">
              <span className="bg-white/8 text-white/70 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">{c.tag}</span>
              <h3 className="text-white text-xl font-black mt-4 mb-2">{c.title}</h3>
              <p className="text-white/70 text-base leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'features-editorial-v1', name: 'Features Editorial Numbered', category: 'features',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['linear-style', 'numbered-list', 'editorial', 'minimal-flat'],
    description: 'Numbered vertical feature list (01, 02, 03, 04) with horizontal dividers. Linear/Notion DNA — no icons, no cards.',
    priority: 12,
    standaloneCode: `function Features() {
  const feats = [
    { n: '01', title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC', tag: 'FEATURE_1_TAG' },
    { n: '02', title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC', tag: 'FEATURE_2_TAG' },
    { n: '03', title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC', tag: 'FEATURE_3_TAG' },
    { n: '04', title: 'FEATURE_4_TITLE', desc: 'FEATURE_4_DESC', tag: 'FEATURE_4_TAG' },
  ];
  return (
    <section className="py-24 bg-[#0F0F0F]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-end justify-between mb-16 border-b border-white/8 pb-10">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight max-w-lg">FEATURES_HEADING</h2>
          <p className="text-white/65 text-sm max-w-xs text-right hidden md:block">FEATURES_SUBHEADING</p>
        </div>
        {feats.map((f, i) => (
          <div key={i} className="group grid grid-cols-12 gap-6 border-b border-white/8 py-8 hover:border-[#5E6AD2]/40 transition-colors cursor-default">
            <div className="col-span-2 md:col-span-1">
              <span className="text-white/60 font-black text-5xl leading-none select-none group-hover:text-white/80 transition-colors" aria-hidden="true">{f.n}</span>
            </div>
            <div className="col-span-10 md:col-span-5 flex flex-col justify-center">
              <h3 className="text-white font-bold text-xl mb-1">{f.title}</h3>
              <span className="text-white/60 text-xs font-semibold tracking-wider uppercase">{f.tag}</span>
            </div>
            <div className="col-span-12 md:col-span-6 flex items-center">
              <p className="text-white/70 text-base leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },

  {
    id: 'features-split-v1', name: 'Features Alternating Split', category: 'features',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['vercel-style', 'split-rows', 'monochrome', 'developer'],
    description: 'Three alternating feature rows: text | code/terminal mockup, sides swap each row. Vercel DNA.',
    priority: 12,
    standaloneCode: `function Features() {
  const rows = [
    {
      eyebrow: 'FEATURE_1_EYEBROW', title: 'FEATURE_1_TITLE', desc: 'FEATURE_1_DESC',
      visual: (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8 bg-[#0a0a0a]">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/></div>
          </div>
          <div className="p-5 font-mono text-xs space-y-2">
            <div className="text-[#00FFF0]">$ COMMAND_LINE_1</div>
            <div className="text-white/70">✓ COMMAND_OUTPUT_1</div>
            <div className="text-white/70">✓ COMMAND_OUTPUT_2</div>
            <div className="text-white/60">◆ COMMAND_OUTPUT_3</div>
            <div className="text-green-400">✓ COMMAND_OUTPUT_4</div>
          </div>
        </div>
      )
    },
    {
      eyebrow: 'FEATURE_2_EYEBROW', title: 'FEATURE_2_TITLE', desc: 'FEATURE_2_DESC',
      visual: (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5 space-y-3">
          {['METRIC_1', 'METRIC_2', 'METRIC_3'].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white/70 text-xs">{m}</span>
              <div className="flex items-center gap-3">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden w-24"><div className="h-full bg-white/60 rounded-full" style={{width: \`\${[78,92,61][i]}%\`}}/></div>
                <span className="text-white/60 text-xs font-mono">{['78%','92%','61%'][i]}</span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      eyebrow: 'FEATURE_3_EYEBROW', title: 'FEATURE_3_TITLE', desc: 'FEATURE_3_DESC',
      visual: (
        <div className="bg-[#111] border border-white/10 rounded-xl p-5">
          <div className="text-white/65 text-xs mb-3 font-semibold uppercase tracking-wider">PREVIEW_LABEL</div>
          <div className="space-y-2">
            {['STATUS_1','STATUS_2','STATUS_3','STATUS_4'].map((s,i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5">
                <div className={\`w-2 h-2 rounded-full \${['bg-green-400','bg-green-400','bg-yellow-400','bg-white/20'][i]}\`}/>
                <span className="text-white/60 text-xs">{s}</span>
                <span className="ml-auto text-white/65 text-xs font-mono">{'just now'}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];
  return (
    <section className="bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center py-20 border-b border-white/8">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">FEATURES_HEADING</h2>
          <p className="text-white/65 text-base max-w-lg mx-auto">FEATURES_SUBHEADING</p>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={\`grid md:grid-cols-2 gap-0 border-b border-white/8 \${i % 2 === 1 ? 'md:flex-row-reverse' : ''}\`}>
            <div className={\`p-12 flex flex-col justify-center \${i % 2 === 1 ? 'md:order-2' : ''}\`}>
              <p className="text-white/65 text-xs font-semibold tracking-widest uppercase mb-3">{row.eyebrow}</p>
              <h3 className="text-white text-2xl md:text-3xl font-black mb-4 tracking-tight">{row.title}</h3>
              <p className="text-white/65 text-sm leading-relaxed">{row.desc}</p>
            </div>
            <div className={\`p-12 flex items-center border-white/8 \${i % 2 === 1 ? 'md:order-1 md:border-r' : 'md:border-l'}\`}>
              {row.visual}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
  },

  {
    id: 'features-timeline-v1', name: 'Features Timeline', category: 'features',
    industries: ['saas', 'ai', 'startup', 'generic'], tags: ['timeline', 'process', 'vertical', 'alternating'],
    description: 'Vertical center-line timeline with 4 alternating left/right nodes. Shows workflow/process.',
    priority: 11,
    standaloneCode: `function Features() {
  const steps = [
    { n: '1', title: 'STEP_1_TITLE', desc: 'STEP_1_DESC', icon: '◆', color: 'from-indigo-500 to-violet-600' },
    { n: '2', title: 'STEP_2_TITLE', desc: 'STEP_2_DESC', icon: '↗', color: 'from-indigo-500 to-violet-600' },
    { n: '3', title: 'STEP_3_TITLE', desc: 'STEP_3_DESC', icon: '◈', color: 'from-indigo-500 to-violet-600' },
    { n: '4', title: 'STEP_4_TITLE', desc: 'STEP_4_DESC', icon: '◉', color: 'from-indigo-500 to-violet-600' },
  ];
  return (
    <section className="py-24 bg-[#07070a]">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">FEATURES_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">FEATURES_SUBHEADING</p>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/50 via-white/10 to-transparent" />
          {steps.map((s, i) => {
            const left = i % 2 === 0;
            return (
              <div key={i} className={\`relative flex items-center mb-16 last:mb-0 \${left ? 'flex-row' : 'flex-row-reverse'}\`}>
                <div className={\`w-[calc(50%-36px)] \${left ? 'text-right pr-8' : 'text-left pl-8'}\`}>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-violet-500/30 transition-all">
                    <h3 className="text-white font-bold text-lg mb-2">{s.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                <div className="relative z-10 shrink-0">
                  <div className={\`w-16 h-16 rounded-2xl bg-gradient-to-br \${s.color} flex items-center justify-center shadow-lg\`}>
                    <span className="text-white text-2xl">{s.icon}</span>
                  </div>
                </div>
                <div className="w-[calc(50%-36px)]" />
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
    id: 'features-dashboard-v1', name: 'Features with Dashboard', category: 'features',
    industries: ['saas', 'ai', 'fintech', 'startup'], tags: ['checklist', 'product-preview', 'split', 'feature-with-visual'],
    description: 'Left feature checklist + right embedded product dashboard preview showing features in action.',
    priority: 11,
    standaloneCode: `function Features() {
  const checks = ['CHECK_1', 'CHECK_2', 'CHECK_3', 'CHECK_4', 'CHECK_5', 'CHECK_6'];
  const metrics = [['METRIC_1_VAL', 'METRIC_1_LABEL'], ['METRIC_2_VAL', 'METRIC_2_LABEL'], ['METRIC_3_VAL', 'METRIC_3_LABEL']];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d14]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-violet-400 text-xs font-semibold tracking-widest uppercase mb-3">FEATURES_EYEBROW</p>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-6">FEATURES_HEADING</h2>
            <p className="text-gray-400 text-base leading-relaxed mb-10">FEATURES_SUBHEADING</p>
            <div className="flex flex-col gap-4">
              {checks.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                  </div>
                  <span className="text-gray-300 text-sm leading-relaxed">{c}</span>
                </div>
              ))}
            </div>
            <Button type="button" className="mt-10 bg-white text-black font-bold px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all text-sm">CTA_PRIMARY →</Button>
          </div>
          <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0d0d14] border-b border-white/5">
              <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"/><div className="w-2.5 h-2.5 rounded-full bg-green-500/50"/></div>
              <div className="flex-1 bg-white/5 rounded h-4 mx-2 max-w-36"/>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {metrics.map(([v, l], i) => (
                  <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-4">
                    <div className="text-white/65 text-xs mb-1">{l}</div>
                    <div className="text-white font-black text-xl">{v}</div>
                    <div className="text-emerald-400 text-xs mt-1">↑ METRIC_CHANGE</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3"><span className="text-white/60 text-xs">CHART_LABEL</span><span className="text-white/65 text-xs">This month</span></div>
                <svg viewBox="0 0 300 60" className="w-full h-12" preserveAspectRatio="none">
                  <defs><linearGradient id="fg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient></defs>
                  <path d="M0,50 L40,42 L80,38 L120,28 L160,32 L200,18 L240,12 L300,5" fill="none" stroke="#7c3aed" strokeWidth="2"/>
                  <path d="M0,50 L40,42 L80,38 L120,28 L160,32 L200,18 L240,12 L300,5 L300,60 L0,60Z" fill="url(#fg1)"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ══════════════════════════════════════════════════════════════════
  // DASHBOARD PREVIEW V2 — 4 new templates
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'dashboard-vercel-v1', name: 'Dashboard Vercel Deployment', category: 'dashboard-preview',
    industries: ['saas', 'ai', 'startup'], tags: ['vercel-style', 'deployment', 'terminal', 'monochrome'],
    description: 'Black split-panel: left = project deployment list, right = live terminal log. Vercel DNA.',
    priority: 12,
    standaloneCode: `function DashboardPreview() {
  const projects = [
    { name: 'PROJ_1_NAME', branch: 'main', status: 'Ready', time: '2m ago', dot: 'bg-green-400' },
    { name: 'PROJ_2_NAME', branch: 'feat/dashboard', status: 'Building', time: '1m ago', dot: 'bg-yellow-400 animate-pulse' },
    { name: 'PROJ_3_NAME', branch: 'fix/auth', status: 'Ready', time: '18m ago', dot: 'bg-green-400' },
    { name: 'PROJ_4_NAME', branch: 'main', status: 'Error', time: '2h ago', dot: 'bg-red-400' },
  ];
  const logs = [
    { t: '00:01', c: 'text-white/65', m: 'Cloning repository...' },
    { t: '00:02', c: 'text-white/65', m: 'Installing dependencies' },
    { t: '00:04', c: 'text-white/70', m: 'Running build command' },
    { t: '00:05', c: 'text-[#00FFF0]', m: '$ npm run build' },
    { t: '00:08', c: 'text-white/70', m: 'Compiling 47 modules...' },
    { t: '00:11', c: 'text-white/70', m: 'Optimizing assets' },
    { t: '00:12', c: 'text-green-400', m: '✓ Build complete (12.4s)' },
    { t: '00:13', c: 'text-green-400', m: '✓ Deployed to production' },
  ];
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">PREVIEW_HEADING</h2>
          <p className="text-white/65 text-base max-w-xl mx-auto">PREVIEW_SUBHEADING</p>
        </div>
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#111] shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] border-b border-white/8">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/50"/><div className="w-3 h-3 rounded-full bg-yellow-500/50"/><div className="w-3 h-3 rounded-full bg-green-500/50"/></div>
            <span className="text-white/65 text-xs ml-3">SITE_NAME · Deployments</span>
          </div>
          <div className="flex">
            <div className="w-64 border-r border-white/8 shrink-0">
              <div className="px-4 py-3 border-b border-white/5"><span className="text-white/65 text-xs font-semibold uppercase tracking-wider">Projects</span></div>
              {projects.map((p, i) => (
                <div key={i} className={\`px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors \${i === 1 ? 'bg-white/5' : ''}\`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={\`w-2 h-2 rounded-full \${p.dot}\`}/>
                    <span className="text-white/70 text-xs font-medium truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span className="text-white/65 text-xs font-mono">{p.branch}</span>
                    <span className="text-white/60 text-xs">{p.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 bg-[#0a0a0a] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-white/60 text-sm font-semibold">PROJ_2_NAME</span>
                  <span className="ml-3 bg-yellow-400/15 text-yellow-400 text-xs px-2 py-0.5 rounded-full font-semibold">Building</span>
                </div>
                <span className="text-white/60 text-xs font-mono">feat/dashboard</span>
              </div>
              <div className="bg-black/50 rounded-xl border border-white/8 p-4 font-mono text-xs space-y-1.5 min-h-[200px]">
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-white/60 shrink-0">{l.t}</span>
                    <span className={l.c}>{l.m}</span>
                  </div>
                ))}
                <div className="text-white/60 animate-pulse">_</div>
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
    id: 'dashboard-kanban-v1', name: 'Dashboard Linear Kanban', category: 'dashboard-preview',
    industries: ['saas', 'ai', 'startup'], tags: ['linear-style', 'kanban', 'project-management', 'minimal-flat'],
    description: 'Dark minimal (#0F0F0F) kanban board: 3 columns (Todo, In Progress, Done) with issue cards. Linear DNA.',
    priority: 12,
    standaloneCode: `function DashboardPreview() {
  const cols = [
    {
      name: 'Todo', count: 4, color: 'text-white/70',
      items: [
        { title: 'ISSUE_1_TITLE', label: 'ISSUE_1_LABEL', priority: '●', pColor: 'text-red-400', avatar: 'A' },
        { title: 'ISSUE_2_TITLE', label: 'ISSUE_2_LABEL', priority: '●', pColor: 'text-orange-400', avatar: 'B' },
        { title: 'ISSUE_3_TITLE', label: 'ISSUE_3_LABEL', priority: '●', pColor: 'text-white/60', avatar: 'C' },
      ]
    },
    {
      name: 'In Progress', count: 2, color: 'text-[#5E6AD2]',
      items: [
        { title: 'ISSUE_4_TITLE', label: 'ISSUE_4_LABEL', priority: '●', pColor: 'text-orange-400', avatar: 'D' },
        { title: 'ISSUE_5_TITLE', label: 'ISSUE_5_LABEL', priority: '●', pColor: 'text-red-400', avatar: 'A' },
      ]
    },
    {
      name: 'Done', count: 6, color: 'text-emerald-400',
      items: [
        { title: 'ISSUE_6_TITLE', label: 'ISSUE_6_LABEL', priority: '●', pColor: 'text-white/60', avatar: 'B' },
        { title: 'ISSUE_7_TITLE', label: 'ISSUE_7_LABEL', priority: '●', pColor: 'text-white/60', avatar: 'C' },
      ]
    },
  ];
  return (
    <section className="py-20 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <p className="text-[#5E6AD2] text-xs font-semibold tracking-widest uppercase mb-3">PREVIEW_EYEBROW</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">PREVIEW_HEADING</h2>
          <p className="text-white/65 text-base max-w-xl">PREVIEW_SUBHEADING</p>
        </div>
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-white/8 bg-[#0d0d0d]">
            <span className="text-white/60 text-sm font-semibold">TEAM_NAME</span>
            <div className="flex gap-1 ml-auto">
              {['Board','List','Timeline'].map(v => <Button type="button" key={v} className={\`text-xs px-3 py-1.5 rounded-md \${v==='Board'?'bg-white/10 text-white':'text-white/65 hover:text-white/60'} transition-colors\`}>{v}</Button>)}
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/8 min-h-[320px]">
            {cols.map((col, ci) => (
              <div key={ci} className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={col.color + ' font-semibold text-xs'}>{col.name}</span>
                  <span className="text-white/60 text-xs ml-auto">{col.count}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {col.items.map((item, ii) => (
                    <div key={ii} className="bg-[#1a1a1a] border border-white/8 rounded-lg p-3 hover:border-white/15 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={item.pColor + ' text-[10px] mt-0.5 shrink-0'}>{item.priority}</span>
                        <span className="text-white/70 text-xs leading-relaxed">{item.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="bg-[#5E6AD2]/15 text-[#5E6AD2] text-[10px] px-2 py-0.5 rounded-full font-medium">{item.label}</span>
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold">{item.avatar}</div>
                      </div>
                    </div>
                  ))}
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
    id: 'dashboard-revenue-v1', name: 'Dashboard Revenue Analytics', category: 'dashboard-preview',
    industries: ['saas', 'fintech', 'startup'], tags: ['stripe-style', 'analytics', 'revenue', 'chart', 'premium-gradient'],
    description: 'Navy revenue dashboard: 4 KPI cards + SVG line chart + transactions table. Stripe DNA.',
    priority: 12,
    standaloneCode: `function DashboardPreview() {
  const kpis = [
    { label: 'MRR', value: '$48,290', change: '+12.4%', up: true },
    { label: 'ARR', value: '$579K', change: '+18.2%', up: true },
    { label: 'LTV', value: '$2,840', change: '+6.1%', up: true },
    { label: 'Churn', value: '1.8%', change: '-0.3%', up: false },
  ];
  const txns = [
    { name: 'TXN_1_NAME', amount: '+$TXN_1_AMOUNT', time: '2 min ago', status: 'Paid' },
    { name: 'TXN_2_NAME', amount: '+$TXN_2_AMOUNT', time: '14 min ago', status: 'Paid' },
    { name: 'TXN_3_NAME', amount: '+$TXN_3_AMOUNT', time: '1h ago', status: 'Processing' },
    { name: 'TXN_4_NAME', amount: '+$TXN_4_AMOUNT', time: '3h ago', status: 'Paid' },
  ];
  return (
    <section className="py-20 bg-[#0A2540]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-3">PREVIEW_HEADING</h2>
          <p className="text-[#A8B4C0] text-base max-w-xl mx-auto">PREVIEW_SUBHEADING</p>
        </div>
        <div className="bg-[#0D1E35] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3 bg-[#091726] border-b border-white/8">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/40"/><div className="w-3 h-3 rounded-full bg-yellow-500/40"/><div className="w-3 h-3 rounded-full bg-green-500/40"/></div>
            <span className="text-white/60 text-xs ml-3">app.SITE_NAME.com/dashboard</span>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map((k, i) => (
                <div key={i} className="bg-[#0F3460]/60 border border-white/10 rounded-xl p-4">
                  <div className="text-[#A8B4C0] text-xs mb-1">{k.label}</div>
                  <div className="text-white font-black text-2xl mb-1">{k.value}</div>
                  <div className={k.up ? 'text-emerald-400 text-xs font-medium' : 'text-rose-400 text-xs font-medium'}>{k.change}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#0F3460]/40 border border-white/8 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/60 text-sm font-semibold">Revenue over time</span>
                <span className="text-white/65 text-xs">Last 12 months</span>
              </div>
              <svg viewBox="0 0 500 80" className="w-full h-16" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#635BFF" stopOpacity="0.4"/>
                    <stop offset="100%" stopColor="#635BFF" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,72 L45,65 L90,60 L135,52 L180,55 L225,42 L270,35 L315,28 L360,20 L405,14 L450,8 L500,4" fill="none" stroke="#635BFF" strokeWidth="2.5"/>
                <path d="M0,72 L45,65 L90,60 L135,52 L180,55 L225,42 L270,35 L315,28 L360,20 L405,14 L450,8 L500,4 L500,80 L0,80Z" fill="url(#rg1)"/>
                <circle cx="500" cy="4" r="4" fill="#635BFF"/>
              </svg>
            </div>
            <div className="bg-[#0F3460]/40 border border-white/8 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <span className="text-white/60 text-sm font-semibold">Recent transactions</span>
                <span className="text-[#635BFF] text-xs cursor-pointer hover:underline">View all →</span>
              </div>
              {txns.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#635BFF] to-[#00D4FF] flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</div>
                    <div>
                      <div className="text-white/70 text-sm">{t.name}</div>
                      <div className="text-white/65 text-xs">{t.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 text-sm font-semibold">{t.amount}</div>
                    <div className={t.status === 'Paid' ? 'text-emerald-400/60 text-xs' : 'text-yellow-400/60 text-xs'}>{t.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'dashboard-aiflow-v1', name: 'Dashboard AI Workflow', category: 'dashboard-preview',
    industries: ['ai', 'saas', 'startup'], tags: ['framer-style', 'ai-workflow', 'pipeline', 'nodes', 'bold-motion'],
    description: 'Dramatic dark AI pipeline visualization: 5 horizontal nodes with live status indicators. Framer DNA.',
    priority: 12,
    standaloneCode: `function DashboardPreview() {
  const nodes = [
    { label: 'DATA_NODE_1', icon: '⬆', status: 'done', stat: 'NODE_1_STAT', color: 'from-emerald-500 to-teal-500' },
    { label: 'DATA_NODE_2', icon: '◈', status: 'done', stat: 'NODE_2_STAT', color: 'from-blue-500 to-cyan-400' },
    { label: 'DATA_NODE_3', icon: '◆', status: 'active', stat: 'NODE_3_STAT', color: 'from-[#FF3D57] to-[#FF6B35]' },
    { label: 'DATA_NODE_4', icon: '✓', status: 'pending', stat: '—', color: 'from-white/10 to-white/5' },
    { label: 'DATA_NODE_5', icon: '↗', status: 'pending', stat: '—', color: 'from-white/10 to-white/5' },
  ];
  const logs = ['LOG_ENTRY_1','LOG_ENTRY_2','LOG_ENTRY_3','LOG_ENTRY_4'];
  return (
    <section className="py-20 bg-[#0B0B0B]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">PREVIEW_HEADING</h2>
          <p className="text-white/65 text-base max-w-xl mx-auto">PREVIEW_SUBHEADING</p>
        </div>
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-5 py-3 bg-[#0a0a0a] border-b border-white/8">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/40"/><div className="w-3 h-3 rounded-full bg-yellow-500/40"/><div className="w-3 h-3 rounded-full bg-green-500/40"/></div>
            <span className="text-white/65 text-xs ml-3">AI Pipeline · Run #247</span>
            <span className="ml-auto flex items-center gap-1.5 bg-[#FF3D57]/15 text-[#FF3D57] text-xs px-3 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF3D57] animate-pulse"/>Processing
            </span>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between gap-2 mb-8 overflow-x-auto">
              {nodes.map((n, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className={\`relative w-16 h-16 rounded-2xl bg-gradient-to-br \${n.color} flex items-center justify-center shadow-lg\`}>
                      <span className="text-white text-2xl">{n.icon}</span>
                      {n.status === 'active' && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3D57] animate-ping opacity-75"/>}
                      {n.status === 'active' && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3D57]"/>}
                      {n.status === 'done' && <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center"><span className="text-white text-[8px] font-bold">✓</span></div>}
                    </div>
                    <div className="text-center">
                      <div className="text-white/60 text-xs font-semibold">{n.label}</div>
                      <div className={\`text-xs mt-0.5 \${n.status==='done'?'text-emerald-400':n.status==='active'?'text-[#FF3D57]':'text-white/60'}\`}>{n.stat}</div>
                    </div>
                  </div>
                  {i < nodes.length - 1 && (
                    <div className={\`flex-1 h-px \${i<2?'bg-gradient-to-r from-emerald-500/50 to-blue-500/50':i===2?'bg-gradient-to-r from-blue-500/50 to-[#FF3D57]/50':'bg-white/10'}\`}/>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="bg-black/40 border border-white/8 rounded-xl p-5 font-mono text-xs space-y-1.5">
              <div className="text-white/65 mb-3 font-sans text-[11px] uppercase tracking-wider">Live Output</div>
              {logs.map((l, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[#FF3D57]/50 shrink-0">[AI]</span>
                  <span className="text-white/70">{l}</span>
                </div>
              ))}
              <div className="text-white/60 animate-pulse">▋</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  // ══════════════════════════════════════════════════════════════════
  // PRICING V2 — 5 templates
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'pricing-minimal-v1', name: 'Pricing Minimal Linear', category: 'pricing',
    industries: ['saas', 'ai', 'startup'], tags: ['linear-style', 'minimal-flat', 'no-cards', 'typographic'],
    description: 'Dark flat (#0F0F0F) typography-only pricing. Feature matrix rows + two plans side by side — no card borders, no gradients. Linear DNA.',
    priority: 12,
    standaloneCode: `function Pricing() {
  const plans = [
    { name: 'Starter', price: '$0', period: 'forever', cta: 'Start free', active: false },
    { name: 'Pro', price: '$24', period: 'per month', cta: 'Start trial', active: true },
  ];
  const features = [
    { label: 'FEATURE_1', starter: '5', pro: 'Unlimited' },
    { label: 'FEATURE_2', starter: '10K/mo', pro: '500K/mo' },
    { label: 'FEATURE_3', starter: false, pro: true },
    { label: 'FEATURE_4', starter: false, pro: true },
    { label: 'FEATURE_5', starter: '1', pro: 'Unlimited' },
    { label: 'FEATURE_6', starter: false, pro: true },
  ];
  return (
    <section className="py-24 bg-[#0F0F0F]">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">PRICING_HEADING</h2>
          <p className="text-white/65 text-base">PRICING_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-3 gap-0 border border-white/8 rounded-2xl overflow-hidden">
          <div className="border-r border-white/8 p-6">
            <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-16">Plan</div>
          </div>
          {plans.map((p, i) => (
            <div key={i} className={\`p-6 \${i===0?'border-r border-white/8':''} \${p.active?'bg-white/3':''}\`}>
              <div className="text-white/65 text-xs font-semibold uppercase tracking-wider mb-4">{p.name}</div>
              <div className="mb-4">
                <span className="text-white font-black text-4xl">{p.price}</span>
                <span className="text-white/65 text-xs ml-2">{p.period}</span>
              </div>
              <Button type="button" className={\`w-full py-2.5 rounded-lg text-sm font-semibold transition-all \${p.active?'bg-[#5E6AD2] text-white hover:bg-[#7B83E0]':'border border-white/15 text-white/60 hover:border-white/30'}\`}>{p.cta}</Button>
            </div>
          ))}
          {features.map((f, i) => (
            <React.Fragment key={i}>
              <div className="border-t border-white/8 border-r border-r-white/8 px-6 py-4 flex items-center">
                <span className="text-white/70 text-sm">{f.label}</span>
              </div>
              {[f.starter, f.pro].map((val, j) => (
                <div key={j} className={\`border-t border-white/8 px-6 py-4 flex items-center \${j===0?'border-r border-r-white/8':''} \${plans[j].active?'bg-white/3':''}\`}>
                  {typeof val === 'boolean' ? (
                    val
                      ? <div className="w-4 h-4 rounded-full bg-[#5E6AD2]/20 border border-[#5E6AD2]/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2]"/></div>
                      : <div className="w-1 h-px bg-white/15 mx-1.5"/>
                  ) : (
                    <span className="text-white/60 text-sm">{val}</span>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'pricing-comparison-v1', name: 'Pricing Comparison Table', category: 'pricing',
    industries: ['saas', 'ai', 'fintech', 'startup'], tags: ['stripe-style', 'comparison-table', 'premium-gradient', 'detailed'],
    description: 'Feature comparison table with 3 tiers, check marks, and highlighted popular column. Stripe DNA.',
    priority: 12,
    standaloneCode: `function Pricing() {
  const tiers = [
    { name: 'Starter', price: '$0', cta: 'Start free', popular: false },
    { name: 'Pro', price: '$49', cta: 'Start trial', popular: true },
    { name: 'Enterprise', price: 'Custom', cta: 'Contact us', popular: false },
  ];
  const groups = [
    {
      label: 'FEATURE_GROUP_1',
      features: [
        { name: 'FEATURE_1', vals: ['5', 'Unlimited', 'Unlimited'] },
        { name: 'FEATURE_2', vals: ['10K', '500K', 'Unlimited'] },
        { name: 'FEATURE_3', vals: [false, true, true] },
        { name: 'FEATURE_4', vals: [false, true, true] },
      ]
    },
    {
      label: 'FEATURE_GROUP_2',
      features: [
        { name: 'FEATURE_5', vals: [false, true, true] },
        { name: 'FEATURE_6', vals: [false, false, true] },
        { name: 'FEATURE_7', vals: ['Email', 'Priority', 'Dedicated'] },
      ]
    },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0A2540] to-[#061628]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">PRICING_HEADING</h2>
          <p className="text-[#A8B4C0] text-base">PRICING_SUBHEADING</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 text-[#A8B4C0] text-sm font-normal w-52"/>
                {tiers.map((t, i) => (
                  <th key={i} className={\`p-4 text-center rounded-t-2xl \${t.popular?'bg-[#635BFF]/20 border border-[#635BFF]/30 border-b-0':''}\`}>
                    {t.popular && <div className="bg-gradient-to-r from-[#635BFF] to-[#00D4FF] text-white text-xs font-bold px-4 py-1 rounded-full mb-3 inline-block">Most Popular</div>}
                    <div className="text-white font-bold text-lg">{t.name}</div>
                    <div className="mt-2 mb-4"><span className="text-white font-black text-3xl">{t.price}</span>{t.price!=='Custom'&&<span className="text-[#A8B4C0] text-xs ml-1">/mo</span>}</div>
                    <Button type="button" className={\`w-full py-2.5 rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black \${t.popular?'bg-gradient-to-r from-[#635BFF] to-[#00D4FF] text-white':'border border-white/20 text-white hover:bg-white/8'}\`}>{t.cta}</Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g, gi) => (
                <React.Fragment key={gi}>
                  <tr><td colSpan={4} className="pt-8 pb-2 px-4 text-[#635BFF] text-xs font-semibold uppercase tracking-wider">{g.label}</td></tr>
                  {g.features.map((f, fi) => (
                    <tr key={fi} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                      <td className="p-4 text-[#A8B4C0] text-sm">{f.name}</td>
                      {f.vals.map((v, vi) => (
                        <td key={vi} className={\`p-4 text-center \${tiers[vi].popular?'bg-[#635BFF]/10':''}\`}>
                          {typeof v === 'boolean'
                            ? v
                              ? <div className="w-5 h-5 rounded-full bg-[#635BFF]/20 border border-[#635BFF]/50 flex items-center justify-center mx-auto"><div className="w-2 h-2 rounded-full bg-[#635BFF]"/></div>
                              : <div className="w-1 h-px bg-white/15 mx-auto"/>
                            : <span className="text-white/60 text-sm">{v}</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
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
    id: 'pricing-enterprise-v1', name: 'Pricing Enterprise', category: 'pricing',
    industries: ['saas', 'ai', 'fintech', 'enterprise'], tags: ['enterprise', 'trust-signals', 'split', 'custom-quote'],
    description: 'Enterprise-focused split: left checklist with trust signals, right contact/custom quote CTA.',
    priority: 11,
    standaloneCode: `function Pricing() {
  const features = ['ENTERPRISE_1','ENTERPRISE_2','ENTERPRISE_3','ENTERPRISE_4','ENTERPRISE_5','ENTERPRISE_6'];
  const trust = [
    { icon: '🔒', label: 'SOC 2 Type II' },
    { icon: '🛡', label: 'GDPR Compliant' },
    { icon: '⬆', label: '99.99% Uptime SLA' },
    { icon: '◆', label: 'SSO & SAML' },
  ];
  return (
    <section className="py-24 bg-[#07070a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">PRICING_HEADING</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">PRICING_SUBHEADING</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10">
            <div className="mb-8">
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">Enterprise</span>
              <div className="mt-5 text-5xl font-black text-white">Custom</div>
              <div className="text-gray-400 text-sm mt-1">Volume pricing, tailored to your team</div>
            </div>
            <div className="flex flex-col gap-3.5 mb-10">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400"/>
                  </div>
                  <span className="text-gray-300 text-sm">{f}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {trust.map((t, i) => (
                <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-base">{t.icon}</span>
                  <span className="text-gray-400 text-xs font-medium">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/30 border border-violet-500/30 rounded-3xl p-10 flex flex-col justify-between">
            <div>
              <h3 className="text-white font-bold text-2xl mb-3">Talk to our team</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">ENTERPRISE_CTA_DESC</p>
              <div className="flex flex-col gap-3">
                <Input className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500 placeholder-gray-600 transition-colors" placeholder="Work email"/>
                <Input className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500 placeholder-gray-600 transition-colors" placeholder="Company name"/>
                <Input className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500 placeholder-gray-600 transition-colors" placeholder="Team size"/>
              </div>
            </div>
            <Button type="button" className="mt-8 w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity">Contact sales →</Button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'pricing-cardstack-v1', name: 'Pricing Card Stack 3D', category: 'pricing',
    industries: ['saas', 'ai', 'startup', 'agency'], tags: ['framer-style', '3d-perspective', 'stacked', 'bold-motion', 'dramatic'],
    description: 'Three 3D perspective-stacked pricing cards with CSS transforms. Dramatic Framer-style bold typography.',
    priority: 12,
    standaloneCode: `function Pricing() {
  const plans = [
    { name: 'Starter', price: '$0', desc: 'STARTER_DESC', cta: 'Get started free', features: ['FEATURE_1','FEATURE_2','FEATURE_3'], rot: '-4deg', y: '32px', z: 0, opacity: '0.5', blur: 'blur-[1px]', scale: '0.95' },
    { name: 'Pro', price: '$29', desc: 'PRO_DESC', cta: 'Start free trial', features: ['FEATURE_4','FEATURE_5','FEATURE_6','FEATURE_7'], rot: '-1.5deg', y: '16px', z: 1, opacity: '0.75', blur: 'blur-[0.5px]', scale: '0.975' },
    { name: 'Team', price: '$99', desc: 'TEAM_DESC', cta: 'Start free trial', features: ['FEATURE_8','FEATURE_9','FEATURE_10','FEATURE_11','FEATURE_12'], rot: '0deg', y: '0px', z: 2, opacity: '1', blur: '', scale: '1' },
  ];
  return (
    <section className="py-24 bg-[#0B0B0B] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <h2 className="font-black text-white tracking-tighter leading-none" style={{fontSize:'clamp(40px,5vw,72px)'}}>PRICING_HEADING</h2>
          <p className="text-white/65 text-base max-w-xs">PRICING_SUBHEADING</p>
        </div>
        <div className="relative flex justify-center" style={{height: '480px'}}>
          {plans.map((p, i) => (
            <div
              key={i}
              className={\`absolute w-full max-w-md bg-[#141414] border border-white/10 rounded-3xl p-8 flex flex-col \${p.blur}\`}
              style={{
                transform: \`rotate(\${p.rot}) translateY(\${p.y}) scale(\${p.scale})\`,
                zIndex: p.z + 1,
                opacity: p.opacity,
                top: 0,
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">{p.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-5xl">{p.price}</span>
                    {p.price !== '$0' && <span className="text-white/65 text-sm">/mo</span>}
                  </div>
                </div>
                {i === 2 && <span className="bg-gradient-to-r from-[#FF3D57] to-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>}
              </div>
              <p className="text-white/65 text-sm mb-6 leading-relaxed">{p.desc}</p>
              <div className="flex flex-col gap-2 flex-1">
                {p.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF3D57] shrink-0"/>
                    <span className="text-white/60 text-sm">{f}</span>
                  </div>
                ))}
              </div>
              {i === 2 && (
                <Button type="button" className="mt-6 w-full bg-gradient-to-r from-[#FF3D57] to-[#FF6B35] text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-all">{p.cta} →</Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'pricing-horizontal-v1', name: 'Pricing Horizontal Vercel', category: 'pricing',
    industries: ['saas', 'ai', 'startup'], tags: ['vercel-style', 'horizontal', 'monochrome', 'developer', 'flat'],
    description: 'Black monochrome horizontal tier comparison — 3 plan columns in a flat row, no cards, sharp borders. Vercel DNA.',
    priority: 12,
    standaloneCode: `function Pricing() {
  const tiers = [
    { name: 'Hobby', price: '$0', period: 'Free forever', cta: 'Deploy now', features: ['HOBBY_1','HOBBY_2','HOBBY_3','HOBBY_4'], primary: false },
    { name: 'Pro', price: '$20', period: 'per user / month', cta: 'Start trial', features: ['PRO_1','PRO_2','PRO_3','PRO_4','PRO_5'], primary: true },
    { name: 'Enterprise', price: 'Custom', period: 'volume pricing', cta: 'Contact sales', features: ['ENT_1','ENT_2','ENT_3','ENT_4','ENT_5','ENT_6'], primary: false },
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-b border-white/8 pb-12 mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">PRICING_HEADING</h2>
          <p className="text-white/65 text-base">PRICING_SUBHEADING</p>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/8 border border-white/8 rounded-2xl overflow-hidden">
          {tiers.map((t, i) => (
            <div key={i} className={\`p-8 flex flex-col gap-8 \${t.primary?'bg-white/3':''}\`}>
              <div>
                <div className={\`text-xs font-semibold uppercase tracking-widest mb-4 \${t.primary?'text-white':'text-white/65'}\`}>{t.name}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white font-black text-4xl">{t.price}</span>
                </div>
                <div className="text-white/65 text-xs">{t.period}</div>
              </div>
              <Button type="button" className={\`w-full py-3 rounded-lg text-sm font-bold transition-all \${t.primary?'bg-white text-black hover:bg-white/90':'border border-white/15 text-white/60 hover:border-white/30 hover:text-white/70'}\`}>{t.cta}</Button>
              <div className="flex flex-col gap-3">
                <div className="text-white/60 text-xs uppercase tracking-wider font-semibold">Included</div>
                {t.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2.5">
                    <div className={\`w-1.5 h-1.5 rounded-full shrink-0 \${t.primary?'bg-white':'bg-white/25'}\`}/>
                    <span className={\`text-sm \${t.primary?'text-white/60':'text-white/65'}\`}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },

  // ══════════════════════════════════════════════════════════════════
  // PREMIUM DASHBOARD TEMPLATES V7.2.4 — shadcn-first (Tabs/DataTable/Command/Progress/Skeleton)
  // ══════════════════════════════════════════════════════════════════

  {
    id: 'dashboard-shadcn-analytics-v1', name: 'Dashboard Analytics (shadcn-first)', category: 'dashboard-preview',
    industries: ['saas', 'fintech', 'ai', 'startup'], tags: ['analytics', 'tabs', 'datatable', 'progress', 'skeleton', 'shadcn'],
    description: 'Premium analytics dashboard using <Tabs> for views, <DataTable> for records, <Progress> for KPIs, <Skeleton> loading states. V7.2.4 reference.',
    priority: 15,
    standaloneCode: `function DashboardPreview() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);
  const kpis = [
    { label: 'Monthly Revenue', value: '$METRIC_1_VALUE', pct: 78, delta: '+METRIC_1_DELTA', up: true },
    { label: 'Active Users', value: 'METRIC_2_VALUE', pct: 62, delta: '+METRIC_2_DELTA', up: true },
    { label: 'Conversion Rate', value: 'METRIC_3_VALUE%', pct: 45, delta: 'METRIC_3_DELTA', up: false },
    { label: 'Churn Rate', value: 'METRIC_4_VALUE%', pct: 12, delta: '-METRIC_4_DELTA', up: false },
  ];
  const cols = [
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Plan', accessorKey: 'plan' },
    { header: 'MRR', accessorKey: 'mrr' },
    { header: 'Status', accessorKey: 'status' },
  ];
  const rows = [
    { customer: 'TXN_1_NAME', plan: 'Pro', mrr: '$TXN_1_AMOUNT/mo', status: 'Active' },
    { customer: 'TXN_2_NAME', plan: 'Enterprise', mrr: '$TXN_2_AMOUNT/mo', status: 'Active' },
    { customer: 'TXN_3_NAME', plan: 'Starter', mrr: '$TXN_3_AMOUNT/mo', status: 'Trial' },
    { customer: 'TXN_4_NAME', plan: 'Pro', mrr: '$TXN_4_AMOUNT/mo', status: 'Active' },
  ];
  return (
    <section className="py-20 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">PREVIEW_EYEBROW</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">PREVIEW_HEADING</h2>
          <p className="text-white/65 text-base max-w-xl mx-auto">PREVIEW_SUBHEADING</p>
        </div>
        <Card className="bg-[#111] border-white/10 shadow-2xl">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-white/8 px-4">
                <TabsList className="bg-transparent h-12 gap-1">
                  <TabsTrigger value="overview" className="text-white/65 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg">Overview</TabsTrigger>
                  <TabsTrigger value="customers" className="text-white/65 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg">Customers</TabsTrigger>
                  <TabsTrigger value="revenue" className="text-white/65 data-[state=active]:text-white data-[state=active]:bg-white/10 rounded-lg">Revenue</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="overview" className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {kpis.map((k, i) => (
                    <Card key={i} className="bg-white/3 border-white/8">
                      <CardContent className="p-4">
                        {loading ? <Skeleton className="h-4 w-20 mb-2" /> : <p className="text-white/65 text-xs mb-1">{k.label}</p>}
                        {loading ? <Skeleton className="h-8 w-24 mb-2" /> : <p className="text-white text-2xl font-black mb-2">{k.value}</p>}
                        <Progress value={k.pct} className="h-1 mb-1" />
                        {loading ? <Skeleton className="h-3 w-12" /> : <p className={k.up ? 'text-emerald-400 text-xs' : 'text-rose-400 text-xs'}>{k.delta}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="customers" className="p-6">
                <DataTable columns={cols} data={rows} />
              </TabsContent>
              <TabsContent value="revenue" className="p-6">
                <div className="flex flex-col gap-3">
                  {kpis.map((k, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-white/65 text-sm w-36 shrink-0">{k.label}</span>
                      <Progress value={k.pct} className="flex-1 h-2" />
                      <span className="text-white/60 text-sm w-16 text-right">{k.value}</span>
                      <Badge variant={k.up ? 'default' : 'destructive'} className="text-xs">{k.delta}</Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'dashboard-shadcn-command-v1', name: 'Dashboard with Command Search (shadcn-first)', category: 'dashboard-preview',
    industries: ['saas', 'ai', 'developer', 'devtools'], tags: ['command', 'search', 'datatable', 'badge', 'shadcn'],
    description: 'SaaS app dashboard with <Command> search palette, <DataTable> records, <Badge> statuses. Linear/Vercel DNA. V7.2.4.',
    priority: 15,
    standaloneCode: `function DashboardPreview() {
  const [query, setQuery] = React.useState('');
  const items = [
    { id: 'ITEM_1_ID', name: 'ITEM_1_NAME', status: 'Active', type: 'ITEM_1_TYPE', updated: 'ITEM_1_DATE' },
    { id: 'ITEM_2_ID', name: 'ITEM_2_NAME', status: 'Draft', type: 'ITEM_2_TYPE', updated: 'ITEM_2_DATE' },
    { id: 'ITEM_3_ID', name: 'ITEM_3_NAME', status: 'Active', type: 'ITEM_3_TYPE', updated: 'ITEM_3_DATE' },
    { id: 'ITEM_4_ID', name: 'ITEM_4_NAME', status: 'Archived', type: 'ITEM_4_TYPE', updated: 'ITEM_4_DATE' },
  ];
  const filtered = items.filter(it => !query || it.name.toLowerCase().includes(query.toLowerCase()));
  const cols = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Type', accessorKey: 'type' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Updated', accessorKey: 'updated' },
  ];
  return (
    <section className="py-20 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-10">
          <Badge variant="outline" className="mb-4 border-white/20 text-white/65">PREVIEW_EYEBROW</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-3">PREVIEW_HEADING</h2>
          <p className="text-white/65 text-base max-w-xl">PREVIEW_SUBHEADING</p>
        </div>
        <Card className="bg-[#111] border-white/10 shadow-2xl">
          <CardHeader className="border-b border-white/8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg font-semibold">DASHBOARD_TITLE</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">DASHBOARD_BADGE_1</Badge>
                <Badge variant="outline" className="border-white/20">DASHBOARD_BADGE_2</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <Command className="mb-4 border border-white/8">
              <CommandInput placeholder="Search DASHBOARD_ENTITY..." value={query} onValueChange={setQuery} />
              {query && (
                <CommandList>
                  {filtered.map(it => (
                    <CommandItem key={it.id} onSelect={() => setQuery('')}>
                      <span className="text-white/70">{it.name}</span>
                      <Badge variant="outline" className="ml-auto text-xs border-white/20">{it.status}</Badge>
                    </CommandItem>
                  ))}
                </CommandList>
              )}
            </Command>
            <DataTable columns={cols} data={filtered} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}`,
  },

  {
    id: 'dashboard-activity-v1', name: 'Dashboard Activity Timeline', category: 'dashboard-preview',
    industries: ['saas', 'startup', 'ai', 'fintech', 'generic'], tags: ['timeline', 'activity', 'log'],
    description: 'Real-time activity/audit log timeline with status badges and timestamps', priority: 7,
    standaloneCode: `function DashboardPreview() {
  const events = [
    { type: 'success', icon: '✓', user: 'ACTIVITY_USER_1', action: 'ACTIVITY_ACTION_1', time: 'ACTIVITY_TIME_1' },
    { type: 'info',    icon: '·', user: 'ACTIVITY_USER_2', action: 'ACTIVITY_ACTION_2', time: 'ACTIVITY_TIME_2' },
    { type: 'success', icon: '✓', user: 'ACTIVITY_USER_3', action: 'ACTIVITY_ACTION_3', time: 'ACTIVITY_TIME_3' },
    { type: 'warning', icon: '!', user: 'ACTIVITY_USER_4', action: 'ACTIVITY_ACTION_4', time: 'ACTIVITY_TIME_4' },
    { type: 'info',    icon: '·', user: 'ACTIVITY_USER_5', action: 'ACTIVITY_ACTION_5', time: 'ACTIVITY_TIME_5' },
    { type: 'success', icon: '✓', user: 'ACTIVITY_USER_6', action: 'ACTIVITY_ACTION_6', time: 'ACTIVITY_TIME_6' },
  ];
  const color = { success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', info: 'text-blue-400 bg-blue-400/10 border-blue-400/20', warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20' };
  const stats = [
    { label: 'STAT_1_LABEL', value: 'STAT_1_VALUE', delta: 'STAT_1_DELTA' },
    { label: 'STAT_2_LABEL', value: 'STAT_2_VALUE', delta: 'STAT_2_DELTA' },
    { label: 'STAT_3_LABEL', value: 'STAT_3_VALUE', delta: 'STAT_3_DELTA' },
  ];
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white tracking-tight mb-3">DASHBOARD_HEADING</h2>
          <p className="text-gray-400">DASHBOARD_SUBHEADING</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"/>
              </div>
              <span className="text-gray-500 text-xs font-mono">DASHBOARD_TAB_LABEL</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-emerald-400 text-xs">live</span>
              </div>
            </div>
            <div className="p-5 space-y-1">
              {events.map((e, i) => (
                <div key={i} className="flex items-start gap-4 py-3 border-b border-white/4 last:border-0">
                  <span className={\`w-6 h-6 rounded-full border text-xs flex items-center justify-center shrink-0 mt-0.5 \${color[e.type]}\`}>{e.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm"><span className="font-semibold">{e.user}</span> <span className="text-gray-400">{e.action}</span></p>
                  </div>
                  <span className="text-gray-600 text-xs shrink-0 font-mono">{e.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-[#111] border border-white/8 rounded-xl p-5 flex-1">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{s.label}</p>
                <p className="text-3xl font-black text-white tracking-tighter mb-1">{s.value}</p>
                <p className="text-emerald-400 text-xs font-semibold">{s.delta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
