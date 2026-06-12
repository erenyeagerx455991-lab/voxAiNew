import type { ComponentDef } from '../types';

export const footerComponents: ComponentDef[] = [
  {
    id: 'footer-startup-v1',
    name: 'Footer Startup V1',
    category: 'footer',
    style: 'modern',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'],
    tags: ['4-col', 'dark', 'social-links', 'newsletter', 'comprehensive'],
    description: 'Dark 4-column footer with logo, links, social icons, copyright bar',
    priority: 10,
    standaloneCode: `function FooterStartupV1() {
  const cols = [
    { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Contact'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
  ];
  return (
    <footer className="bg-[#050508] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-sm" />
              </div>
              <span className="text-white font-bold text-lg">NexoGen</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              The AI-powered platform for building beautiful websites in minutes.
            </p>
            <div className="flex gap-3">
              {['X', 'GH', 'LI', 'YT'].map(s => (
                <button key={s} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all text-xs font-bold">
                  {s}
                </button>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-gray-600 text-sm">© 2025 NexoGen Inc. All rights reserved.</p>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}`,
  },
  {
    id: 'footer-minimal-v2',
    name: 'Footer Minimal V2',
    category: 'footer',
    style: 'minimal',
    theme: 'light',
    industries: ['portfolio', 'agency', 'restaurant', 'generic'],
    tags: ['minimal', 'light', 'simple', 'single-row'],
    description: 'Light minimal footer with logo, nav links, and copyright in single row',
    priority: 7,
    standaloneCode: `function FooterMinimalV2() {
  const links = ['Work', 'About', 'Services', 'Contact', 'Privacy'];
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-gray-900 font-bold text-lg">NexoGen</span>
        <div className="flex items-center gap-6">
          {links.map(l => (
            <a key={l} href="#" className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-gray-400 text-sm">© 2025 NexoGen. All rights reserved.</p>
      </div>
    </footer>
  );
}`,
  },
];
