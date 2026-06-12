import type { ComponentDef } from '../types';

export const navbarComponents: ComponentDef[] = [
  {
    id: 'navbar-modern-v1',
    name: 'Navbar Modern V1',
    category: 'navbar',
    style: 'modern',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'agency', 'generic'],
    tags: ['sticky', 'blur', 'gradient-cta', 'dark', 'minimal'],
    description: 'Dark sticky navbar with blur, centered links, gradient CTA button',
    priority: 9,
    standaloneCode: `function NavbarModernV1() {
  const links = ['Features', 'Pricing', 'Docs', 'Blog'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">NexoGen</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="#" className="hidden md:block text-gray-400 hover:text-white text-sm font-medium transition-colors">Sign in</a>
          <button className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Get Started →
          </button>
        </div>
      </div>
    </nav>
  );
}`,
  },
  {
    id: 'navbar-startup-v2',
    name: 'Navbar Startup V2',
    category: 'navbar',
    style: 'bold',
    theme: 'dark',
    industries: ['startup', 'saas', 'fintech', 'ai'],
    tags: ['badge', 'announcement', 'gradient-border', 'dark'],
    description: 'Startup navbar with top announcement bar, logo, nav links, CTA',
    priority: 8,
    standaloneCode: `function NavbarStartupV2() {
  const [announcementVisible, setAnnouncementVisible] = React.useState(true);
  const links = ['Product', 'Solutions', 'Pricing', 'Company'];
  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {announcementVisible && (
        <div className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2">
          <span>Introducing AI v2.0 — 10x faster generation</span>
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</span>
          <button onClick={() => setAnnouncementVisible(false)} className="absolute right-4 text-white/60 hover:text-white text-lg leading-none">×</button>
        </div>
      )}
      <nav className="bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <span className="text-white font-black text-xl">NexoGen</span>
            <div className="hidden md:flex items-center gap-6">
              {links.map(l => (
                <a key={l} href="#" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Log in</button>
            <button className="border border-white/20 hover:border-violet-500/60 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all hover:bg-violet-500/10">
              Start free trial
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}`,
  },
  {
    id: 'navbar-minimal-v3',
    name: 'Navbar Minimal V3',
    category: 'navbar',
    style: 'minimal',
    theme: 'light',
    industries: ['portfolio', 'agency', 'restaurant', 'generic'],
    tags: ['light', 'clean', 'minimal', 'centered-logo'],
    description: 'Light minimal navbar with centered logo, simple links, no CTA box',
    priority: 7,
    standaloneCode: `function NavbarMinimalV3() {
  const links = ['Work', 'About', 'Services', 'Contact'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          <span className="text-gray-900 font-bold text-xl">Studio</span>
          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <a key={l} href="#" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <button className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors">
          Get in touch
        </button>
      </div>
    </nav>
  );
}`,
  },
];
