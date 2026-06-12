import type { ComponentDef } from '../types';

export const contactComponents: ComponentDef[] = [
  {
    id: 'contact-form-v1',
    name: 'Contact Form V1',
    category: 'contact',
    style: 'modern',
    theme: 'dark',
    industries: ['agency', 'saas', 'portfolio', 'generic'],
    tags: ['form', 'dark', 'split-layout', 'contact-info'],
    description: 'Dark contact section with form on right and contact info on left',
    priority: 9,
    standaloneCode: `function ContactFormV1() {
  const [form, setForm] = React.useState({ name: '', email: '', message: '' });
  const [sent, setSent] = React.useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const info = [
    { label: 'Email', value: 'hello@nexogen.com' },
    { label: 'Response time', value: 'Within 24 hours' },
    { label: 'Location', value: 'San Francisco, CA' },
  ];
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Contact</span>
            <h2 className="text-4xl font-black text-white mt-3 mb-4 leading-tight">
              Let's build something great together
            </h2>
            <p className="text-gray-400 leading-relaxed mb-10">
              Have a project in mind? We'd love to hear about it. Send us a message and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col gap-6">
              {info.map(item => (
                <div key={item.label}>
                  <div className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-1">{item.label}</div>
                  <div className="text-white font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-3xl p-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3 className="text-white font-bold text-2xl mb-2">Message sent!</h3>
                <p className="text-gray-400">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1.5 block">Name</label>
                    <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="John Doe" className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs font-medium mb-1.5 block">Email</label>
                    <input value={form.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Message</label>
                  <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder="Tell us about your project..." rows={5} className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none" />
                </div>
                <button onClick={() => form.name && form.email && setSent(true)} className="bg-gradient-to-r from-violet-600 to-blue-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all text-sm">
                  Send message →
                </button>
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
