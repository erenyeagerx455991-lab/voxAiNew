import React from 'react';

function Navbar() {
  const links = ['Products', 'Solutions', 'Developers', 'Pricing'];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#333333]">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-sm" />
          </div>
          <span className="text-white font-bold text-lg">NeuralCore</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => <a key={l} href="#" className="text-[#888888] hover:text-white text-sm font-medium transition-colors">{l}</a>)}
        </div>
        <button className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm">
          Get Started
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  const stats = [{ value: '10K+', label: 'Developers' }, { value: '99.9%', label: 'Uptime' }, { value: '50ms', label: 'Response Time' }];
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-black pt-20">
      <div className="inline-flex items-center gap-2 border border-[#333333] bg-[#111111] text-[#888888] text-xs font-semibold px-4 py-2 rounded-full mb-8">
        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        AI Infrastructure for the Future
      </div>
      <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter mb-6 max-w-5xl">
        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Build AI Applications</span>
        <br />
        <span className="bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">Without Infrastructure</span>
      </h1>
      <p className="text-lg md:text-xl text-[#888888] max-w-2xl mx-auto mb-10 leading-relaxed">Deploy AI models with a single API call. Scale from prototype to production instantly.</p>
      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <button className="bg-white text-black font-semibold px-8 py-4 rounded-lg hover:opacity-90 transition-all text-base">Start Building →</button>
        <button className="border border-[#333333] text-white font-semibold px-8 py-4 rounded-lg hover:border-white transition-all text-base">View Documentation</button>
      </div>
      <div className="flex items-center gap-12">
        {stats.map(s => <div key={s.label} className="text-center"><div className="text-2xl font-black text-white">{s.value}</div><div className="text-xs text-[#888888] mt-1">{s.label}</div></div>)}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: '◆', title: 'Instant Deployment', desc: 'Deploy AI models with a single API call. No infrastructure management required.' },
    { icon: '▸', title: 'Automatic Scaling', desc: 'Our platform handles scaling automatically based on your application demand.' },
    { icon: '◈', title: 'Enterprise Security', desc: 'SOC 2 compliant infrastructure with end-to-end encryption and access controls.' },
    { icon: '◉', title: 'Model Marketplace', desc: 'Access and deploy from hundreds of pre-trained models with one click.' },
    { icon: '◐', title: 'Real-time Analytics', desc: 'Monitor model performance, latency, and usage with detailed dashboards.' },
    { icon: '✦', title: 'Custom Training', desc: 'Bring your own data and train custom models with our infrastructure.' },
  ];
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">AI Infrastructure Done Right</h2>
          <p className="text-[#888888] text-lg max-w-xl mx-auto">Everything you need to deploy AI at scale</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-[#111111] border border-[#333333] rounded-xl p-6 hover:border-white/50 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center text-white font-bold text-lg mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-[#888888] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    { name: 'Alex Chen', role: 'CTO at DeepMind', stars: 5, quote: 'NeuralCore reduced our model deployment time from weeks to minutes. Their infrastructure is rock solid.' },
    { name: 'Maria Rodriguez', role: 'AI Lead, Fortune 500', stars: 5, quote: 'The automatic scaling saved us millions in infrastructure costs while maintaining performance.' },
    { name: 'James Wilson', role: 'Founder, AI Startup', stars: 5, quote: 'Their API is so simple yet powerful. We went from prototype to production in one afternoon.' },
  ];
  const initials = name => name.split(' ').map(n => n[0]).join('');
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Trusted by AI Teams</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-[#111111] border border-[#333333] rounded-xl p-6 flex flex-col">
              <div className="flex gap-1 mb-4">{[...Array(r.stars)].map((_, j) => <span key={j} className="text-white text-sm">★</span>)}</div>
              <p className="text-[#888888] text-sm leading-relaxed flex-1 mb-6">"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#333333] flex items-center justify-center text-white text-sm font-bold">{initials(r.name)}</div>
                <div><div className="text-white font-semibold text-sm">{r.name}</div><div className="text-[#888888] text-xs">{r.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-xl bg-[#111111] border border-[#333333] p-12 md:p-16 overflow-hidden text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">Ready to Build the Future?</h2>
          <p className="text-[#888888] text-lg mb-10 max-w-2xl mx-auto">Join thousands of developers building the next generation of AI applications.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-black font-bold px-8 py-4 rounded-lg hover:opacity-90 transition-all">Get Started Free</button>
            <button className="border border-[#333333] text-white font-semibold px-8 py-4 rounded-lg hover:border-white transition-all">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Product', links: ['Features', 'Solutions', 'Pricing', 'Changelog'] },
    { title: 'Resources', links: ['Documentation', 'Tutorials', 'Blog', 'Community'] },
    { title: 'Company', links: ['About', 'Careers', 'Legal', 'Contact'] },
  ];
  return (
    <footer className="bg-[#050505] border-t border-[#333333]">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <span className="text-white font-bold text-lg block mb-4">NeuralCore</span>
            <p className="text-[#888888] text-sm leading-relaxed mb-4">The complete AI infrastructure platform for developers and enterprises.</p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
              <ul className="flex flex-col gap-2.5">{col.links.map(l => <li key={l}><a href="#" className="text-[#888888] hover:text-white text-sm transition-colors">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[#333333] pt-6 flex items-center justify-between">
          <p className="text-[#888888] text-sm"> 2025 NeuralCore. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[#888888] text-xs"><div className="w-2 h-2 rounded-full bg-white animate-pulse" />All systems operational</div>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <div className="bg-black text-white font-sans">
      <Navbar/>
      <Hero/>
      <Features/>
      <Testimonials/>
      <CTA/>
      <Footer/>
    </div>
  );
}

export default App;
