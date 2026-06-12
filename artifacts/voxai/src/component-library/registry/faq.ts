import type { ComponentDef } from '../types';

export const faqComponents: ComponentDef[] = [
  {
    id: 'faq-accordion-v1',
    name: 'FAQ Accordion V1',
    category: 'faq',
    style: 'modern',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'generic'],
    tags: ['accordion', 'dark', 'animated', 'clean'],
    description: 'Dark animated FAQ accordion with smooth open/close transitions',
    priority: 9,
    standaloneCode: `function FaqAccordionV1() {
  const [open, setOpen] = React.useState(null);
  const faqs = [
    { q: 'How does the AI website builder work?', a: 'Simply describe your website in plain English. Our AI analyzes your prompt, selects the best components, generates custom content, and assembles a complete, responsive website in seconds.' },
    { q: 'Do I need coding knowledge?', a: 'No coding required. Our platform is designed for everyone. If you can describe what you want, we can build it. However, developers can also access the generated code directly.' },
    { q: 'Can I customize the generated website?', a: 'Absolutely. Every generated website can be fully customized through our visual editor or by editing the code directly. Export to any framework or host anywhere.' },
    { q: 'What technologies does it use?', a: 'Generated websites use React + Tailwind CSS by default. We support export to Next.js, Vue, plain HTML/CSS, and more. All code is production-ready and clean.' },
    { q: 'Is there a free plan?', a: 'Yes! Our free plan lets you generate up to 5 websites per month with full access to all features. No credit card required to get started.' },
    { q: 'Can I use my own domain?', a: 'Yes. You can connect your custom domain on any paid plan. We handle the SSL certificates and deployment automatically.' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0d0d1a] to-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Frequently asked questions
          </h2>
          <p className="text-gray-400 text-lg">Everything you need to know. Can't find an answer? Ask us.</p>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/15 transition-colors">
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-white font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                <span className={\`text-gray-400 text-xl font-light transition-transform duration-200 shrink-0 \${open === i ? 'rotate-45' : 'rotate-0'}\`}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
];
