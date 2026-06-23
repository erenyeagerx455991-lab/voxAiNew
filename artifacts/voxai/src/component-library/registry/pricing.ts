import type { ComponentDef } from '../types';

export const pricingComponents: ComponentDef[] = [
  {
    id: 'pricing-cards-v1',
    name: 'Pricing Cards V1',
    category: 'pricing',
    style: 'glassmorphism',
    theme: 'dark',
    industries: ['saas', 'ai', 'startup', 'fintech'],
    tags: ['3-tier', 'toggle', 'popular-badge', 'dark', 'glassmorphism', 'shadcn'],
    description: 'Dark 3-tier pricing with shadcn Card/Badge/Button, monthly/yearly toggle',
    priority: 10,
    standaloneCode: `function PricingCardsV1() {
  const [yearly, setYearly] = React.useState(false);
  const plans = [
    { name: 'Starter', price: yearly ? 0 : 0, desc: 'Perfect for side projects', features: ['5 projects', '10K requests/mo', 'Community support', 'Basic analytics'], cta: 'Start free' },
    { name: 'Pro', price: yearly ? 19 : 29, desc: 'For growing teams', popular: true, features: ['Unlimited projects', '500K requests/mo', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], cta: 'Start free trial' },
    { name: 'Enterprise', price: yearly ? 79 : 99, desc: 'For large organizations', features: ['Unlimited everything', 'SLA guarantee', 'Dedicated support', 'Custom contracts', 'SSO & SAML', 'Audit logs'], cta: 'Contact sales' },
  ];
  return (
    <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <Badge className="mb-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full h-auto">
            Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400 text-lg mb-8">Start free, scale as you grow. No hidden fees.</p>
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
            <button type="button" onClick={() => setYearly(false)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${!yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>Monthly</button>
            <button type="button" onClick={() => setYearly(true)} className={\`px-4 py-2 rounded-full text-sm font-medium transition-all \${yearly ? 'bg-white text-black' : 'text-gray-400'}\`}>
              Yearly <span className="text-emerald-400 text-xs ml-1">-35%</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <Card key={plan.name} className={\`relative rounded-2xl transition-all duration-300 \${plan.popular ? 'bg-gradient-to-b from-violet-900/60 to-blue-900/40 border-violet-500 scale-105 shadow-2xl shadow-violet-500/20' : 'bg-white/5 border-white/10 hover:border-white/20'}\`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full h-auto border-0">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-white font-bold text-xl mb-1">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400 text-sm">{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">\${plan.price}</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <Button className={\`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-6 h-auto \${plan.popular ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:opacity-90 border-0' : 'border border-white/20 text-white hover:bg-white/10 bg-transparent'}\`}>
                  {plan.cta}
                </Button>
                <Separator className="mb-5" />
                <div className="flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
  {
    id: 'pricing-simple-v2',
    name: 'Pricing Simple V2',
    category: 'pricing',
    style: 'minimal',
    theme: 'light',
    industries: ['saas', 'agency', 'generic'],
    tags: ['2-tier', 'light', 'minimal', 'clean', 'shadcn'],
    description: 'Light minimal 2-tier pricing with shadcn Card/Button/Separator',
    priority: 7,
    standaloneCode: `function PricingSimpleV2() {
  const plans = [
    { name: 'Free', price: 0, desc: 'Get started today', cta: 'Get started', features: ['Up to 3 projects', '1,000 monthly visits', 'Basic templates', 'Email support'] },
    { name: 'Pro', price: 29, desc: 'Everything you need', cta: 'Start 14-day trial', highlight: true, features: ['Unlimited projects', '100K monthly visits', 'Premium templates', 'Priority support', 'Custom domain', 'Analytics dashboard'] },
  ];
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose your plan</h2>
          <p className="text-gray-500 text-lg">No contracts. Cancel anytime. Free forever plan available.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map(plan => (
            <Card key={plan.name} className={\`rounded-2xl border-2 \${plan.highlight ? 'bg-gray-900 border-gray-900 shadow-xl shadow-gray-900/20' : 'bg-white border-gray-200'}\`}>
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <CardTitle className={\`font-bold text-2xl \${plan.highlight ? 'text-white' : 'text-gray-900'}\`}>{plan.name}</CardTitle>
                  {plan.highlight && <Badge className="bg-violet-600 text-white border-0 text-xs">Popular</Badge>}
                </div>
                <CardDescription className={\`text-sm \${plan.highlight ? 'text-gray-400' : 'text-gray-500'}\`}>{plan.desc}</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8 pt-4">
                <div className="mb-6">
                  <span className={\`text-5xl font-black \${plan.highlight ? 'text-white' : 'text-gray-900'}\`}>\${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500 text-sm">/mo</span>}
                </div>
                <Button className={\`w-full py-3.5 rounded-xl font-semibold text-sm transition-all mb-6 h-auto \${plan.highlight ? 'bg-violet-600 hover:bg-violet-500 text-white border-0' : 'border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white bg-transparent'}\`}>
                  {plan.cta}
                </Button>
                <Separator className={\`mb-6 \${plan.highlight ? 'bg-white/10' : 'bg-gray-100'}\`} />
                <div className="flex flex-col gap-3.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className={\`w-5 h-5 rounded-full flex items-center justify-center shrink-0 \${plan.highlight ? 'bg-violet-500/20' : 'bg-gray-100'}\`}>
                        <svg className={\`w-3 h-3 \${plan.highlight ? 'text-violet-400' : 'text-gray-600'}\`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <span className={\`text-sm \${plan.highlight ? 'text-gray-300' : 'text-gray-700'}\`}>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}`,
  },
];
