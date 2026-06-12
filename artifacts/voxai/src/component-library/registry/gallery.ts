import type { ComponentDef } from '../types';

export const galleryComponents: ComponentDef[] = [
  {
    id: 'gallery-grid-v1',
    name: 'Gallery Grid V1',
    category: 'gallery',
    style: 'modern',
    theme: 'dark',
    industries: ['portfolio', 'agency', 'restaurant', 'ecommerce'],
    tags: ['grid', 'hover', 'dark', 'masonry-like'],
    description: 'Dark portfolio gallery with hover overlays and filter tabs',
    priority: 8,
    standaloneCode: `function GalleryGridV1() {
  const [active, setActive] = React.useState('All');
  const tabs = ['All', 'Branding', 'Web', 'Mobile'];
  const items = [
    { label: 'Brand Identity', tag: 'Branding', span: 'md:col-span-2', color: 'from-violet-800 to-purple-900' },
    { label: 'SaaS Dashboard', tag: 'Web', span: '', color: 'from-blue-800 to-cyan-900' },
    { label: 'E-commerce App', tag: 'Mobile', span: '', color: 'from-emerald-800 to-teal-900' },
    { label: 'Marketing Site', tag: 'Web', span: '', color: 'from-pink-800 to-rose-900' },
    { label: 'Logo System', tag: 'Branding', span: 'md:col-span-2', color: 'from-amber-800 to-orange-900' },
  ];
  const filtered = active === 'All' ? items : items.filter(i => i.tag === active);
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Our Work
          </h2>
          <p className="text-gray-400 text-lg mb-8">A selection of our favourite projects</p>
          <div className="flex justify-center gap-2">
            {tabs.map(t => (
              <button key={t} onClick={() => setActive(t)} className={\`px-5 py-2 rounded-full text-sm font-medium transition-all \${active === t ? 'bg-white text-black' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'}\`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <div key={i} className={\`relative group rounded-2xl overflow-hidden aspect-video cursor-pointer \${item.span}\`}>
              <div className={\`absolute inset-0 bg-gradient-to-br \${item.color}\`} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{item.label}</p>
                  <p className="text-gray-300 text-sm mt-1">{item.tag}</p>
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
];
