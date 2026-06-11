const TEMPLATES: Record<string, string> = {
  default: `function App() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <header className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">YourBrand</span>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="hover:text-indigo-200 transition-colors">Features</a>
            <a href="#" className="hover:text-indigo-200 transition-colors">Pricing</a>
            <a href="#" className="hover:text-indigo-200 transition-colors">About</a>
          </nav>
          <button className="bg-white text-indigo-600 font-semibold text-sm px-5 py-2 rounded-full hover:bg-indigo-50 transition-colors">
            Get Started
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Build something<br />
            <span className="text-indigo-200">amazing today</span>
          </h1>
          <p className="text-lg text-indigo-100 mb-10 max-w-xl mx-auto">
            The fastest way to launch your idea. Powerful tools, beautiful design, zero friction.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="bg-white text-indigo-700 font-bold px-8 py-3.5 rounded-full text-base hover:bg-indigo-50 transition-colors shadow-lg">
              Start for free
            </button>
            <button className="border border-white/40 text-white font-semibold px-8 py-3.5 rounded-full text-base hover:bg-white/10 transition-colors">
              See how it works →
            </button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Everything you need</h2>
        <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
          Packed with features to help you move faster and build better products.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: "⚡", title: "Lightning Fast", desc: "Optimised for speed from day one. Sub-second load times guaranteed." },
            { icon: "🎨", title: "Beautiful UI", desc: "Crafted with care. Every pixel is deliberate and purposeful." },
            { icon: "🔒", title: "Secure by Default", desc: "Enterprise-grade security baked in, not bolted on." },
          ].map((f) => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-7 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">Join thousands of teams already building with us.</p>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-10 py-4 rounded-full text-base transition-colors">
            Create your free account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-sm text-gray-400">
        © 2026 YourBrand · Privacy · Terms
      </footer>
    </div>
  );
}`,

  saas: `function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-500 rounded-lg"></div>
            <span className="font-bold text-lg">SaasKit</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#" className="hover:text-white transition-colors">Product</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm text-slate-300 hover:text-white transition-colors">Sign in</button>
            <button className="bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Start free trial
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
          Now in public beta
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          Ship your SaaS<br />
          <span className="text-sky-400">10× faster</span>
        </h1>
        <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          Authentication, billing, teams, and more — all pre-built so you can focus on what makes your product unique.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors">
            Get started free →
          </button>
          <button className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/5 transition-colors">
            View demo
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-4">No credit card required · 14-day free trial</p>
      </main>

      <section className="border-t border-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-6 text-center">
          {[["10k+", "Developers"], ["99.9%", "Uptime"], ["< 50ms", "Response time"], ["24/7", "Support"]].map(([val, label]) => (
            <div key={label} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-black text-sky-400 mb-1">{val}</div>
              <div className="text-slate-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}`,

  agency: `function App() {
  return (
    <div className="min-h-screen bg-amber-50 font-sans">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <span className="text-xl font-black tracking-tighter text-gray-900">STUDIO</span>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#" className="hover:text-gray-900 transition-colors">Work</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Services</a>
          <a href="#" className="hover:text-gray-900 transition-colors">About</a>
        </nav>
        <button className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-gray-700 transition-colors">
          Let's talk
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-amber-600 uppercase tracking-widest mb-6">Creative Agency</p>
          <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter text-gray-900 mb-8">
            We make<br />
            brands that<br />
            <em className="italic text-amber-500 not-italic">people love</em>
          </h1>
          <p className="text-gray-600 text-xl max-w-xl leading-relaxed mb-10">
            Brand strategy, digital design, and content that connects. We help ambitious companies find their voice.
          </p>
          <button className="bg-gray-900 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-gray-700 transition-colors">
            See our work
          </button>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-4">
          {[
            { bg: "bg-gray-900", label: "Brand Identity", color: "text-white" },
            { bg: "bg-amber-400", label: "Web Design", color: "text-gray-900" },
            { bg: "bg-gray-200", label: "Content Strategy", color: "text-gray-900" },
          ].map((c) => (
            <div key={c.label} className={\`\${c.bg} rounded-3xl p-8 h-48 flex items-end\`}>
              <span className={\`\${c.color} font-bold text-lg\`}>{c.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}`,
};

function pickTemplate(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('saas') || lower.includes('software') || lower.includes('app') || lower.includes('platform') || lower.includes('tool')) {
    return TEMPLATES.saas;
  }
  if (lower.includes('agency') || lower.includes('studio') || lower.includes('creative') || lower.includes('design') || lower.includes('brand')) {
    return TEMPLATES.agency;
  }
  return TEMPLATES.default;
}

export async function generateWebsite(prompt: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 2200));
  return pickTemplate(prompt);
}

export function sanitizeCode(raw: string): string {
  return raw
    // Remove single-line import statements only (no multiline span)
    .replace(/^import\s[^\n]*from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
    // Remove export keywords
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '')
    // Strip markdown fences that slipped through
    .replace(/^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '')
    .trim();
}

export function buildPreviewHtml(code: string): string {
  const sanitized = sanitizeCode(code);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; }
    #__error {
      display: none;
      padding: 24px;
      font-family: monospace;
      font-size: 13px;
      background: #1a1a1a;
      color: #ff6b6b;
      white-space: pre-wrap;
      min-height: 100vh;
    }
  </style>
  <script>
    window.addEventListener('error', function(e) {
      document.getElementById('root').style.display = 'none';
      var el = document.getElementById('__error');
      el.style.display = 'block';
      el.textContent = '⚠ Render error:\\n\\n' + (e.error ? e.error.stack : e.message);
    });
  </script>
</head>
<body>
  <div id="root"></div>
  <div id="__error"></div>
  <script type="text/babel">
    ${sanitized}
    try {
      const rootEl = document.getElementById('root');
      const appRoot = ReactDOM.createRoot(rootEl);
      appRoot.render(React.createElement(App));
    } catch(e) {
      document.getElementById('root').style.display = 'none';
      var err = document.getElementById('__error');
      err.style.display = 'block';
      err.textContent = '⚠ Render error:\\n\\n' + e.stack;
    }
  </script>
</body>
</html>`;
}
