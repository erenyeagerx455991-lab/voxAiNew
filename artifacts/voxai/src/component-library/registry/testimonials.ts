import type { ComponentDef } from '../types';

export const testimonialsComponents: ComponentDef[] = [
  {
    id: 'testimonials-cards-v1',
    name: 'Testimonials Cards V1',
    category: 'testimonials',
    style: 'glassmorphism',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'agency', 'generic'],
    tags: ['cards', '3-col', 'stars', 'dark', 'glassmorphism'],
    description: 'Dark 3-column testimonial cards with star ratings and avatars',
    priority: 9,
    standaloneCode: `function TestimonialsCardsV1() {
  const reviews = [
    { name: 'Sarah Chen', role: 'CTO at Flowbase', stars: 5, quote: "This tool completely transformed how we build products. We shipped our entire dashboard in a weekend — something that used to take months." },
    { name: 'Marcus Rivera', role: 'Founder, Launchpad', stars: 5, quote: "I was skeptical at first, but the quality of the output is genuinely impressive. Our landing page conversion went up 40% after switching." },
    { name: 'Priya Patel', role: 'Head of Design at Notion', stars: 5, quote: "The design system it generates is consistent and professional. It's like having a senior designer and developer in one tool." },
  ];
  const initials = (name) => name.split(' ').map(n => n[0]).join('');
  const avatarColors = ['from-violet-500 to-purple-600', 'from-blue-500 to-cyan-500', 'from-emerald-500 to-teal-500'];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-violet-400 text-xs font-bold uppercase tracking-widest">Social Proof</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Loved by 50,000+ teams
          </h2>
          <p className="text-gray-400 text-lg">Don't take our word for it — hear from our customers.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 flex flex-col">
              <div className="flex gap-1 mb-4">
                {[...Array(r.stars)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-6">"{r.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={\`w-10 h-10 rounded-full bg-gradient-to-br \${avatarColors[i]} flex items-center justify-center text-white text-sm font-bold shrink-0\`}>
                  {initials(r.name)}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{r.name}</div>
                  <div className="text-gray-500 text-xs">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-6 text-gray-500 text-sm">
            <span>4.9/5 average rating</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>50,000+ happy customers</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>98% would recommend</span>
          </div>
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'testimonials-wall-v2',
    name: 'Testimonials Wall V2',
    category: 'testimonials',
    style: 'bold',
    theme: 'dark',
    industries: ['saas', 'agency', 'ecommerce'],
    tags: ['wall', 'masonry', 'many-reviews', 'dark'],
    description: 'Masonry-style testimonial wall with many compact review cards',
    priority: 7,
    standaloneCode: `function TestimonialsWallV2() {
  const reviews = [
    { name: 'Alex K.', role: 'Developer', quote: 'Best tool I have used this year. Period.' },
    { name: 'Maria S.', role: 'Designer', quote: 'The design quality is absolutely unreal. My clients love it.' },
    { name: 'James T.', role: 'Startup Founder', quote: 'Went from idea to launched in 48 hours. Unbelievable.' },
    { name: 'Chen W.', role: 'Product Manager', quote: 'Our team productivity tripled in the first month.' },
    { name: 'Sofia L.', role: 'Marketing Lead', quote: 'Conversions are up 60%. This tool pays for itself 10x over.' },
    { name: 'Ryan M.', role: 'Engineer', quote: 'The code it generates is actually clean and maintainable. Shocked.' },
  ];
  const colors = ['from-violet-500/20 to-purple-500/20', 'from-blue-500/20 to-cyan-500/20', 'from-emerald-500/20 to-teal-500/20', 'from-pink-500/20 to-rose-500/20', 'from-amber-500/20 to-orange-500/20', 'from-indigo-500/20 to-violet-500/20'];
  return (
    <section className="py-24 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Real results, real customers</h2>
          <p className="text-gray-400 text-lg">Join thousands of teams who trust us every day.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <div key={i} className={\`bg-gradient-to-br \${colors[i]} border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all\`}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-xs">★</span>)}
              </div>
              <p className="text-gray-200 text-sm leading-relaxed mb-4">"{r.quote}"</p>
              <div>
                <div className="text-white font-semibold text-sm">{r.name}</div>
                <div className="text-gray-500 text-xs">{r.role}</div>
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
