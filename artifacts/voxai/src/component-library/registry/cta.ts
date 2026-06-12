import type { ComponentDef } from '../types';

export const ctaComponents: ComponentDef[] = [
  {
    id: 'cta-gradient-v1',
    name: 'CTA Gradient V1',
    category: 'cta',
    style: 'bold',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'fintech', 'generic'],
    tags: ['gradient', 'full-width', 'bold', 'dark', 'glow'],
    description: 'Full-width gradient CTA banner with bold headline and two action buttons',
    priority: 10,
    standaloneCode: `function CtaGradientV1() {
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 p-12 md:p-16 overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <span className="inline-block bg-white/15 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              Get started today
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Ready to build something<br />extraordinary?
            </h2>
            <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Join 50,000+ teams already using our platform. Start for free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-violet-700 font-bold px-8 py-4 rounded-full hover:bg-gray-100 transition-all text-base shadow-xl">
                Start building for free →
              </button>
              <button className="border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/10 transition-all text-base">
                Schedule a demo
              </button>
            </div>
            <p className="text-white/50 text-sm mt-6">Free plan available · No credit card required · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'cta-split-v2',
    name: 'CTA Split V2',
    category: 'cta',
    style: 'modern',
    theme: 'dark',
    industries: ['saas', 'startup', 'agency'],
    tags: ['split', 'email-signup', 'form', 'dark'],
    description: 'Split CTA with text on left and email signup form on right',
    priority: 8,
    standaloneCode: `function CtaSplitV2() {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d1a] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center bg-white/5 border border-white/10 rounded-3xl p-10 md:p-14">
          <div>
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Early access</span>
            <h2 className="text-4xl font-black text-white mt-3 mb-4 leading-tight">
              Be the first to<br />experience the future
            </h2>
            <p className="text-gray-400 leading-relaxed mb-6">
              Join our waitlist and get exclusive early access, lifetime discounts, and founder-level support.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {['from-violet-400 to-purple-500','from-blue-400 to-cyan-500','from-emerald-400 to-teal-500'].map((c,i) => (
                  <div key={i} className={\`w-8 h-8 rounded-full bg-gradient-to-br \${c} border-2 border-[#0d0d1a]\`} />
                ))}
              </div>
              <span>2,500+ people already on the list</span>
            </div>
          </div>
          <div>
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="text-white font-bold text-xl mb-2">You're on the list!</h3>
                <p className="text-gray-400 text-sm">We'll notify you when early access opens.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-white/5 border border-white/15 text-white placeholder-gray-500 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  onClick={() => email && setSubmitted(true)}
                  className="bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all text-sm"
                >
                  Join the waitlist →
                </button>
                <p className="text-gray-600 text-xs text-center">No spam, ever. Unsubscribe at any time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
];
