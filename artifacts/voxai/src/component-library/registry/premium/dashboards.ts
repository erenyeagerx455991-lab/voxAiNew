import type { ComponentDef } from '../../types';

export const premiumDashboardComponents: ComponentDef[] = [
  {
    id: 'dashboard-metrics-v1', name: 'Dashboard Metrics V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['metrics', 'kpi', 'dark', 'cards', 'stats', 'overview'],
    description: 'SaaS KPI dashboard: 4 metric cards + sparklines + trend indicators, dark premium', priority: 10,
    standaloneCode: `function DashboardMetricsV1() {
  const metrics = [
    {label:'Monthly Revenue',value:'$48,290',change:'+12.5%',up:true,spark:[30,45,28,60,50,70,65,80,72,90]},
    {label:'Active Users',value:'12,847',change:'+8.2%',up:true,spark:[50,55,48,65,60,75,70,80,75,88]},
    {label:'Churn Rate',value:'2.4%',change:'-0.8%',up:false,spark:[5,4.5,5.2,4.8,4.2,3.8,3.5,3.2,2.8,2.4]},
    {label:'Avg. Session',value:'4m 32s',change:'+23s',up:true,spark:[200,210,195,220,230,240,235,250,260,272]},
  ];
  const Spark = ({data, up}) => {
    const max = Math.max(...data), min = Math.min(...data);
    const points = data.map((v,i) => ((i/(data.length-1))*100) + ',' + (100-((v-min)/(max-min))*80)).join(' ');
    return (
      <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
        <polyline fill="none" stroke={up?"#4ade80":"#f87171"} strokeWidth="3" points={points} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };
  return (
    <section className="py-16 bg-[#0a0a0d] px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-black text-white text-2xl">Overview</h2>
            <div className="text-white/30 text-sm mt-1">Last 30 days · Compared to previous period</div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 text-white/40 text-xs cursor-pointer hover:bg-white/8 transition-colors">📅 Aug 2025</div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m,i) => (
            <div key={i} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-white/12 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="text-white/40 text-xs font-medium">{m.label}</div>
                <Spark data={m.spark} up={m.up} />
              </div>
              <div className="text-white font-black text-2xl mb-1.5">{m.value}</div>
              <div className={"text-xs font-semibold " + (m.up?"text-emerald-400":"text-red-400")}>{m.change} <span className="text-white/20 font-normal">vs last period</span></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'dashboard-chart-v1', name: 'Dashboard Chart V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'fintech'],
    tags: ['chart', 'revenue', 'bar', 'dark', 'graph', 'analytics'],
    description: 'Revenue chart dashboard: bar chart with hover tooltip, period toggle, dark premium', priority: 9,
    standaloneCode: `function DashboardChartV1() {
  const [period, setPeriod] = React.useState('monthly');
  const [hovered, setHovered] = React.useState(null);
  const data = [
    {l:'Jan',v:28},{l:'Feb',v:35},{l:'Mar',v:32},{l:'Apr',v:48},{l:'May',v:55},
    {l:'Jun',v:62},{l:'Jul',v:58},{l:'Aug',v:75},{l:'Sep',v:70},{l:'Oct',v:88},{l:'Nov',v:82},{l:'Dec',v:96},
  ];
  const max = Math.max(...data.map(d=>d.v));
  return (
    <section className="py-16 bg-[#060609] px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-white font-black text-2xl">Revenue</div>
              <div className="text-white/30 text-sm mt-1">$487,320 <span className="text-emerald-400 text-xs font-semibold ml-1">↑ +34.2%</span></div>
            </div>
            <Tabs defaultValue="monthly" className="inline-flex">
              <TabsList className="bg-white/5 border border-white/8 rounded-xl p-1 h-auto">
                {['weekly','monthly','yearly'].map(p => <TabsTrigger key={p} value={p} onClick={() => setPeriod(p)} className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize">{p}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-end gap-2 h-48 mb-4">
            {data.map((d,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group" onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                {hovered===i && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1a1a25] border border-white/15 rounded-lg px-2.5 py-1.5 whitespace-nowrap z-10">
                    <div className="text-white font-bold text-xs">\${d.v}K</div>
                  </div>
                )}
                <div className={"w-full rounded-t-lg transition-all " + (hovered===i?"bg-violet-400":"bg-violet-600/50 group-hover:bg-violet-500/70")} style={{height: (d.v/max*100)+'%'}} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {data.map((d,i) => <div key={i} className="flex-1 text-center text-white/20 text-xs">{d.l}</div>)}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'dashboard-activity-v1', name: 'Dashboard Activity V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'productivity'],
    tags: ['activity', 'feed', 'dark', 'timeline', 'events', 'log'],
    description: 'Activity feed dashboard: recent events timeline, user avatars, timestamps, dark', priority: 8,
    standaloneCode: `function DashboardActivityV1() {
  const events = [
    {type:'deploy',msg:'Website "TechStartup Landing" deployed to production',time:'2m ago',icon:'🚀',c:'text-emerald-400',dot:'bg-emerald-400'},
    {type:'generate',msg:'New website generated: "FinTech Dashboard"',time:'15m ago',icon:'⚡',c:'text-violet-400',dot:'bg-violet-400'},
    {type:'team',msg:'Sarah Chen joined your workspace',time:'1h ago',icon:'👋',c:'text-blue-400',dot:'bg-blue-400'},
    {type:'billing',msg:'Pro plan renewed · $29/mo',time:'2h ago',icon:'💳',c:'text-amber-400',dot:'bg-amber-400'},
    {type:'api',msg:'API rate limit reached · 1,000/1,000 requests',time:'3h ago',icon:'⚠️',c:'text-orange-400',dot:'bg-orange-400'},
    {type:'generate',msg:'Website "SaaS Product Page" generated',time:'5h ago',icon:'⚡',c:'text-violet-400',dot:'bg-violet-400'},
    {type:'deploy',msg:'"Portfolio" website deployed',time:'1d ago',icon:'🚀',c:'text-emerald-400',dot:'bg-emerald-400'},
  ];
  return (
    <section className="py-16 bg-[#050508] px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="font-black text-white text-xl">Activity</div>
            <button className="text-white/30 hover:text-white/60 text-xs font-medium transition-colors">View all →</button>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-4 w-px bg-white/5" />
            <div className="space-y-5">
              {events.map((e,i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className={"w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-sm shrink-0 relative z-10"}>{e.icon}</div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="text-white/60 text-sm leading-relaxed">{e.msg}</div>
                    <div className="text-white/20 text-xs mt-1">{e.time}</div>
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
    id: 'dashboard-table-v1', name: 'Dashboard Table V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['table', 'data', 'dark', 'sortable', 'rows', 'management'],
    description: 'Data table dashboard: website list with status badges, actions, search, dark premium', priority: 9,
    standaloneCode: `function DashboardTableV1() {
  const sites = [
    {name:'TechStartup Landing',domain:'techstartup.nexogen.app',status:'Live',views:'12,847',gen:'2h ago',badge:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'},
    {name:'FinTech Dashboard',domain:'fintech.nexogen.app',status:'Building',views:'—',gen:'5m ago',badge:'bg-amber-500/15 text-amber-400 border-amber-500/20'},
    {name:'Agency Portfolio',domain:'agencyport.nexogen.app',status:'Live',views:'3,421',gen:'1d ago',badge:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'},
    {name:'SaaS Product Page',domain:'saasproduct.nexogen.app',status:'Draft',views:'—',gen:'2d ago',badge:'bg-white/10 text-white/30 border-white/10'},
    {name:'E-commerce Store',domain:'custom.shop',status:'Live',views:'28,941',gen:'3d ago',badge:'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'},
  ];
  return (
    <section className="py-16 bg-[#0a0a0d] px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="font-black text-white text-2xl">Websites</div>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 h-auto border-0">+ New website</Button>
        </div>
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <span className="text-white/25 text-sm">🔍</span>
            <input placeholder="Search websites..." className="bg-transparent text-white/50 text-sm outline-none placeholder-white/20 flex-1" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-4 text-white/25 text-xs font-semibold uppercase tracking-wider">Website</th>
                <th className="text-left px-4 py-4 text-white/25 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-4 text-white/25 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Views</th>
                <th className="text-left px-4 py-4 text-white/25 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Generated</th>
                <th className="px-6 py-4 text-white/25 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((s,i) => (
                <tr key={i} className={"border-b border-white/5 hover:bg-white/[0.02] transition-colors " + (i===sites.length-1?"border-0":"")}>
                  <td className="px-6 py-4">
                    <div className="text-white text-sm font-semibold">{s.name}</div>
                    <div className="text-white/25 text-xs mt-0.5">{s.domain}</div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <Badge className={"text-xs font-semibold px-2.5 py-1 rounded-full border h-auto " + s.badge}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-white/40 text-sm hidden md:table-cell">{s.views}</td>
                  <td className="px-4 py-4 text-white/25 text-xs hidden md:table-cell">{s.gen}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" className="text-white/30 hover:text-white text-xs border border-white/8 hover:border-white/20 px-2.5 py-1.5 rounded-lg h-auto bg-transparent">Edit</Button>
                      <Button variant="outline" className="text-white/30 hover:text-white text-xs border border-white/8 hover:border-white/20 px-2.5 py-1.5 rounded-lg h-auto bg-transparent">View</Button>
                    </div>
                  </td>
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
    id: 'dashboard-analytics-v1', name: 'Dashboard Analytics V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['analytics', 'overview', 'dark', 'comprehensive', 'widgets', 'saas'],
    description: 'Full analytics overview: metrics + chart + top pages + traffic sources grid', priority: 9,
    standaloneCode: `function DashboardAnalyticsV1() {
  const sources = [{s:'Direct',v:42,c:'bg-violet-500'},{s:'Search',v:31,c:'bg-blue-500'},{s:'Social',v:18,c:'bg-pink-500'},{s:'Referral',v:9,c:'bg-amber-500'}];
  const pages = ['/home','/pricing','/features','/blog','/docs'];
  const pageViews = [4821,2347,1893,1204,987];
  return (
    <section className="py-10 bg-[#060609] px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="font-black text-white text-2xl">Analytics</div>
          <div className="text-white/30 text-sm">Last 30 days</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[['Visitors','24,391','↑ 18%','text-emerald-400'],['Pageviews','89,204','↑ 23%','text-emerald-400'],['Bounce Rate','38.2%','↓ 4.1%','text-emerald-400'],['Avg. Duration','3m 42s','↑ 28s','text-emerald-400']].map(([l,v,c,cc]) => (
            <div key={l} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
              <div className="text-white/30 text-xs mb-1">{l}</div>
              <div className="text-white font-black text-xl">{v}</div>
              <div className={"text-xs font-semibold mt-0.5 " + cc}>{c}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white/[0.02] border border-white/8 rounded-3xl p-6">
            <div className="text-white font-bold mb-4">Top Pages</div>
            <div className="space-y-3">
              {pages.map((p,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-white/40 text-sm font-mono w-24 shrink-0">{p}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5"><div className="bg-violet-500/70 h-1.5 rounded-full" style={{width:(pageViews[i]/pageViews[0]*100)+'%'}} /></div>
                  <div className="text-white/30 text-xs w-12 text-right shrink-0">{pageViews[i].toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-6">
            <div className="text-white font-bold mb-5">Traffic Sources</div>
            <div className="space-y-3">
              {sources.map(s => (
                <div key={s.s}>
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-white/50">{s.s}</span><span className="text-white/30">{s.v}%</span></div>
                  <div className="bg-white/5 rounded-full h-1.5"><div className={"h-1.5 rounded-full " + s.c} style={{width:s.v+'%'}} /></div>
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
    id: 'dashboard-command-v1', name: 'Dashboard Command V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'productivity'],
    tags: ['command', 'palette', 'dark', 'search', 'developer', 'power-user'],
    description: 'Command palette dashboard overlay: full search + recent items + keyboard navigation', priority: 8,
    standaloneCode: `function DashboardCommandV1() {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const recent = [
    {icon:'⚡',label:'Generate new website',shortcut:'⌘N',cat:'Actions'},
    {icon:'🚀',label:'Deploy TechStartup Landing',shortcut:'⌘D',cat:'Deploy'},
    {icon:'📊',label:'View analytics overview',shortcut:'⌘A',cat:'Navigate'},
    {icon:'🎨',label:'Open component library',shortcut:'⌘L',cat:'Navigate'},
    {icon:'⚙️',label:'Account settings',shortcut:'⌘,',cat:'Settings'},
    {icon:'💳',label:'Billing & subscription',shortcut:'',cat:'Settings'},
  ];
  const filtered = recent.filter(r => !query || r.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <section className="min-h-screen bg-[#050508] px-6 py-20 flex items-start justify-center">
      <div className="w-full max-w-xl">
        <div className="text-center mb-12 text-white/30 text-sm">Press <kbd className="bg-white/8 border border-white/12 text-white/40 px-2 py-0.5 rounded font-mono text-xs">⌘K</kbd> to open anywhere</div>
        <div className="bg-[#111118] border border-white/12 rounded-2xl overflow-hidden shadow-2xl" style={{boxShadow:'0 40px 80px rgba(0,0,0,0.6)'}}>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
            <span className="text-white/30 text-lg">🔍</span>
            <input value={query} onChange={e=>{setQuery(e.target.value);setSelected(0);}} placeholder="Search commands, pages, settings..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/20" autoFocus />
            <kbd className="bg-white/8 text-white/25 text-xs px-2 py-1 rounded font-mono shrink-0">ESC</kbd>
          </div>
          <div className="py-2">
            <div className="px-4 py-1.5 text-white/20 text-xs font-semibold uppercase tracking-wider">Recent</div>
            {filtered.map((item, i) => (
              <div key={i} onMouseEnter={() => setSelected(i)} className={"flex items-center gap-3.5 px-4 py-3 cursor-pointer transition-all " + (i===selected?"bg-white/8":"")}>
                <span className="text-lg w-7 text-center">{item.icon}</span>
                <div className="flex-1">
                  <span className={"text-sm font-medium " + (i===selected?"text-white":"text-white/60")}>{item.label}</span>
                </div>
                {item.shortcut && <kbd className={"text-xs px-2 py-0.5 rounded font-mono " + (i===selected?"bg-white/12 text-white/50":"bg-white/5 text-white/20")}>{item.shortcut}</kbd>}
                <span className="text-white/15 text-xs">{item.cat}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 px-4 py-3 flex items-center gap-4 text-white/15 text-xs">
            <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
            <span><kbd className="font-mono">ESC</kbd> Close</span>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'dashboard-deployment-v1', name: 'Dashboard Deployment V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['deployment', 'status', 'dark', 'vercel-style', 'developer', 'ci-cd'],
    description: 'Vercel-style deployment dashboard: recent deployments, status, branch info, dark', priority: 9,
    standaloneCode: `function DashboardDeploymentV1() {
  const deploys = [
    {name:'TechStartup Landing',status:'Ready',branch:'main',commit:'a3b4c5d',msg:'Update hero section',time:'2m ago',dur:'47s',color:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'},
    {name:'FinTech Dashboard',status:'Building',branch:'feat/pricing',commit:'e6f7g8h',msg:'Add pricing tiers',time:'5m ago',dur:'—',color:'text-amber-400 bg-amber-500/10 border-amber-500/20'},
    {name:'Agency Portfolio',status:'Ready',branch:'main',commit:'i9j0k1l',msg:'Fix mobile nav',time:'1h ago',dur:'52s',color:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'},
    {name:'E-commerce Store',status:'Error',branch:'main',commit:'m2n3o4p',msg:'Add product grid',time:'2h ago',dur:'1m 12s',color:'text-red-400 bg-red-500/10 border-red-500/20'},
    {name:'Blog Site',status:'Ready',branch:'main',commit:'q5r6s7t',msg:'Initial generation',time:'3h ago',dur:'38s',color:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'},
  ];
  return (
    <section className="py-10 bg-[#080810] px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="font-black text-white text-2xl">Deployments</div>
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm px-5 py-2 rounded-xl hover:opacity-90 h-auto border-0">Deploy now</Button>
        </div>
        <div className="bg-[#0d0d14] border border-white/8 rounded-3xl overflow-hidden">
          {deploys.map((d,i) => (
            <div key={i} className={"flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-5 hover:bg-white/[0.02] transition-colors " + (i<deploys.length-1?"border-b border-white/5":"")}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={"w-2.5 h-2.5 rounded-full shrink-0 " + (d.status==='Ready'?"bg-emerald-400":d.status==='Building'?"bg-amber-400 animate-pulse":"bg-red-400")} />
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate">{d.name}</div>
                  <div className="text-white/25 text-xs font-mono mt-0.5 truncate">{d.commit.slice(0,7)} · {d.msg}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <div className="bg-white/5 border border-white/8 text-white/30 text-xs px-2 py-0.5 rounded font-mono">{d.branch}</div>
                <Badge className={"text-xs font-semibold px-2.5 py-1 rounded-full border h-auto " + d.color}>{d.status}</Badge>
                <div className="text-white/20 text-xs">{d.dur}</div>
                <div className="text-white/20 text-xs">{d.time}</div>
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
    id: 'dashboard-editor-v1', name: 'Dashboard Editor V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'developer', 'startup'],
    tags: ['editor', 'code', 'dark', 'split-view', 'preview', 'dev-tool'],
    description: 'Code editor + live preview split panel dashboard: dark IDE-like interface', priority: 8,
    standaloneCode: `function DashboardEditorV1() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const lines = [
    {n:1,t:'function HeroSection() {',c:'text-blue-400/80'},
    {n:2,t:'  return (',c:'text-white/40'},
    {n:3,t:'    <div className="hero-container">',c:'text-white/40'},
    {n:4,t:'      <h1 className="headline">',c:'text-white/40'},
    {n:5,t:'        Your Amazing Product',c:'text-emerald-300/70'},
    {n:6,t:'      </h1>',c:'text-white/40'},
    {n:7,t:'      <CTAButton />',c:'text-violet-400/80'},
    {n:8,t:'    </div>',c:'text-white/40'},
    {n:9,t:'  );',c:'text-white/40'},
    {n:10,t:'}',c:'text-blue-400/80'},
  ];
  return (
    <section className="bg-[#0d0d0d] min-h-screen">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#080808] border-b border-white/6">
        <div className="w-3 h-3 rounded-full bg-red-500/60" /><div className="w-3 h-3 rounded-full bg-yellow-500/60" /><div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        <div className="flex ml-2 gap-1">
          {['website.jsx','styles.css','config.js'].map((f,i) => <div key={i} className={"px-4 py-1.5 rounded-t-lg text-xs font-mono cursor-pointer border-t border-l border-r " + (i===0?"bg-[#1a1a1a] text-white/60 border-white/8":"text-white/20 border-transparent hover:text-white/40")}>{f}</div>)}
        </div>
        <button onClick={()=>setSidebarOpen(o=>!o)} className="ml-auto text-white/20 hover:text-white/50 text-xs border border-white/8 px-3 py-1.5 rounded-lg transition-all">{sidebarOpen?'⊡ Hide':'⊟ Preview'}</button>
      </div>
      <div className="flex" style={{height:'calc(100vh - 44px)'}}>
        <div className={"flex-1 overflow-auto p-6 font-mono text-sm min-w-0"}>
          {lines.map(l => (
            <div key={l.n} className="flex gap-4 leading-6">
              <span className="text-white/15 select-none w-5 text-right shrink-0">{l.n}</span>
              <span className={l.c}>{l.t}</span>
            </div>
          ))}
        </div>
        {sidebarOpen && (
          <div className="w-80 border-l border-white/6 bg-[#0a0a10] p-4 shrink-0">
            <div className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Live Preview</div>
            <div className="bg-[#141420] border border-white/8 rounded-xl p-4 h-48 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-4 bg-white/15 rounded w-32 mx-auto mb-2" />
                  <div className="h-3 bg-white/8 rounded w-24 mx-auto mb-3" />
                  <div className="bg-violet-500/50 rounded-full h-7 w-20 mx-auto" />
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              {[['Bundle size','12.4 KB'],['Render time','< 1ms'],['Components','7']].map(([k,v]) => <div key={k} className="flex justify-between text-white/25"><span>{k}</span><span className="text-white/40">{v}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}`,
  },
  {
    id: 'dashboard-saas-v1', name: 'Dashboard SaaS V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['saas', 'startup', 'ai'],
    tags: ['saas', 'overview', 'dark', 'mrr', 'churn', 'growth'],
    description: 'SaaS metrics dashboard: MRR, ARR, churn, NPS, trial conversions, premium dark', priority: 9,
    standaloneCode: `function DashboardSaasV1() {
  const metrics = [
    {l:'MRR',v:'$48,291',c:'+12.5%',up:true,sub:'Monthly Recurring Revenue'},
    {l:'ARR',v:'$579,492',c:'+18.2%',up:true,sub:'Annualized Run Rate'},
    {l:'Churn Rate',v:'2.4%',c:'-0.8%',up:false,sub:'Monthly customer churn'},
    {l:'Trial → Paid',v:'34.2%',c:'+5.1%',up:true,sub:'Free to paid conversion'},
    {l:'NPS Score',v:'72',c:'+8',up:true,sub:'Net Promoter Score'},
    {l:'LTV',v:'$2,847',c:'+$340',up:true,sub:'Lifetime Value (avg)'},
  ];
  return (
    <section className="py-10 bg-[#060609] px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-black text-white text-2xl">SaaS Metrics</h2>
            <div className="text-white/25 text-sm mt-0.5">August 2025 · All plans</div>
          </div>
          <div className="flex gap-2">
            {['7d','30d','90d','1y'].map(p => <button key={p} className={"text-xs px-3 py-1.5 rounded-lg border transition-all " + (p==='30d'?"bg-violet-600/20 border-violet-500/30 text-violet-300":"border-white/8 text-white/25 hover:border-white/15")}>{p}</button>)}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {metrics.map((m,i) => (
            <div key={i} className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 hover:border-white/12 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="text-white/40 text-xs font-medium">{m.l}</div>
                <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (m.up?"bg-emerald-500/10 text-emerald-400":"bg-red-500/10 text-red-400")}>{m.c}</span>
              </div>
              <div className="text-white font-black text-2xl mb-1">{m.v}</div>
              <div className="text-white/20 text-xs">{m.sub}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl p-6">
          <div className="text-white font-bold mb-4">MRR Growth</div>
          <div className="flex items-end gap-2 h-24">
            {[38,42,44,48,45,52,55,58,62,67,70,74].map((v,i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-violet-600/60 to-violet-400/30 rounded-t-lg hover:from-violet-500/80 hover:to-violet-300/50 transition-all cursor-pointer" style={{height:(v/74*100)+'%'}} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'dashboard-finance-v1', name: 'Dashboard Finance V1', category: 'dashboard', style: 'modern', theme: 'dark',
    industries: ['fintech', 'saas', 'startup'],
    tags: ['finance', 'dark', 'ramp', 'transactions', 'spending', 'cards'],
    description: 'Ramp-style finance dashboard: spending overview, transaction feed, budget cards', priority: 8,
    standaloneCode: `function DashboardFinanceV1() {
  const txns = [
    {m:'AWS Cloud',amt:'-$2,847',cat:'Infrastructure',t:'Today',c:'text-red-400'},
    {m:'Google Workspace',amt:'-$189',cat:'Productivity',t:'Yesterday',c:'text-red-400'},
    {m:'Customer Payment',amt:'+$4,900',cat:'Revenue',t:'Yesterday',c:'text-emerald-400'},
    {m:'Figma Pro',amt:'-$45',cat:'Design',t:'Aug 12',c:'text-red-400'},
    {m:'Stripe Payout',amt:'+$12,450',cat:'Revenue',t:'Aug 11',c:'text-emerald-400'},
  ];
  return (
    <section className="py-10 bg-[#05050a] px-6 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {[{l:'Balance',v:'$84,291',c:'text-white'},{l:'This Month',v:'-$12,840',c:'text-red-400'},{l:'Revenue',v:'+$48,290',c:'text-emerald-400'}].map((s,i) => (
            <div key={i} className={"border rounded-2xl p-6 " + (i===0?"bg-gradient-to-br from-violet-900/50 to-indigo-900/40 border-violet-500/30":"bg-white/[0.02] border-white/8")}>
              <div className="text-white/40 text-xs mb-2">{s.l}</div>
              <div className={"font-black text-2xl " + s.c}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/[0.02] border border-white/8 rounded-3xl overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
            <div className="text-white font-bold">Recent Transactions</div>
            <button className="text-white/25 hover:text-white/60 text-xs transition-colors">View all →</button>
          </div>
          {txns.map((t,i) => (
            <div key={i} className={"flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors " + (i<txns.length-1?"border-b border-white/5":"")}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-white/30 text-sm font-bold">{t.m[0]}</div>
                <div><div className="text-white text-sm font-semibold">{t.m}</div><div className="text-white/25 text-xs">{t.cat} · {t.t}</div></div>
              </div>
              <div className={"font-bold text-sm " + t.c}>{t.amt}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
];
