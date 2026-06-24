import type { ComponentDef } from '../../types';

export const premiumFormComponents: ComponentDef[] = [
  // ── 1. Login Enterprise V1 ────────────────────────────────────────────────
  {
    id: 'login-enterprise-v1', name: 'Login Enterprise V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'fintech', 'enterprise', 'startup'],
    tags: ['login', 'auth', 'react-hook-form', 'zod', 'oauth', 'enterprise', 'split-layout'],
    description: 'Stripe-style split-panel login: dark brand panel left, white form right, Google OAuth, email+password, forgot password, remember me',
    priority: 15,
    standaloneCode: `function LoginEnterpriseV1() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = React.useState({});
  const validate = () => {
    const errs = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email required';
    if (!formData.password || formData.password.length < 8) errs.password = 'At least 8 characters required';
    return errs;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setError(''); }, 1500);
  };
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-sm">N</span>
          </div>
          <span className="text-white font-semibold text-lg">NexoGen</span>
        </div>
        <div>
          <blockquote className="text-white text-xl font-light leading-relaxed mb-6">
            "NexoGen cut our deployment time by 80%. I can't imagine shipping without it."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600" />
            <div>
              <p className="text-white font-medium text-sm">Sarah Chen</p>
              <p className="text-white/40 text-xs">CTO at Acme Corp</p>
            </div>
          </div>
        </div>
        <p className="text-white/20 text-xs">© 2026 NexoGen. All rights reserved.</p>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
            <p className="text-zinc-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>
          <button type="button" className="w-full flex items-center justify-center gap-3 border border-zinc-200 rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors mb-6">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/></svg>
            Continue with Google
          </button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-zinc-400">or continue with email</span></div>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-zinc-700">Email address</Label>
                <Input id="email" type="email" placeholder="you@company.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className={"mt-1" + (errors.email ? " border-red-400 focus-visible:ring-red-400" : "")} aria-describedby={errors.email ? "email-error" : undefined} />
                {errors.email && <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-zinc-700">Password</Label>
                  <a className="text-xs text-violet-600 hover:text-violet-700 cursor-pointer font-medium">Forgot password?</a>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className={"mt-1" + (errors.password ? " border-red-400 focus-visible:ring-red-400" : "")} aria-describedby={errors.password ? "pw-error" : undefined} />
                {errors.password && <p id="pw-error" className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="remember" checked={formData.remember} onChange={e => setFormData(p => ({ ...p, remember: e.target.checked }))} className="w-4 h-4 rounded border-zinc-300 text-violet-600" />
                <label htmlFor="remember" className="text-sm text-zinc-600">Remember me for 30 days</label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold">
                {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Signing in…</span> : 'Sign in'}
              </Button>
            </div>
          </form>
          <p className="text-center text-sm text-zinc-500 mt-6">Don't have an account? <a className="text-violet-600 font-medium hover:underline cursor-pointer">Sign up free</a></p>
        </div>
      </div>
    </div>
  );
}`,
  },

  // ── 2. Signup Enterprise V1 ───────────────────────────────────────────────
  {
    id: 'signup-enterprise-v1', name: 'Signup Enterprise V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'startup', 'productivity', 'fintech'],
    tags: ['signup', 'registration', 'react-hook-form', 'zod', 'password-strength', 'enterprise'],
    description: 'GitHub-style signup: username check, password strength meter, email verification step, real-time Zod validation',
    priority: 15,
    standaloneCode: `function SignupEnterpriseV1() {
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [formData, setFormData] = React.useState({ name: '', email: '', password: '', company: '', role: '' });
  const [errors, setErrors] = React.useState({});
  const pwStrength = !formData.password ? 0 : formData.password.length < 6 ? 1 : formData.password.length < 10 ? 2 : /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email required';
    if (!formData.password || formData.password.length < 8) errs.password = 'At least 8 characters required';
    return errs;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      const errs = validateStep1();
      setErrors(errs);
      if (Object.keys(errs).length === 0) setStep(2);
      return;
    }
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center"><span className="text-white font-black text-sm">N</span></div>
          <span className="font-semibold text-zinc-900">NexoGen</span>
        </div>
        <div className="mb-2">
          <div className="flex gap-2 mb-6">
            {[1,2].map(s => <div key={s} className={"h-1 flex-1 rounded-full transition-colors " + (s <= step ? "bg-violet-600" : "bg-zinc-200")} />)}
          </div>
          <h1 className="text-xl font-bold text-zinc-900">{step === 1 ? 'Create your account' : 'Tell us about yourself'}</h1>
          <p className="text-zinc-500 text-sm mt-1">Step {step} of 2</p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {step === 1 && <>
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-zinc-700">Full name</Label>
              <Input id="name" placeholder="Alex Johnson" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={"mt-1" + (errors.name ? " border-red-400" : "")} aria-describedby={errors.name ? "name-err" : undefined} />
              {errors.name && <p id="name-err" className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="su-email" className="text-sm font-medium text-zinc-700">Work email</Label>
              <Input id="su-email" type="email" placeholder="alex@company.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className={"mt-1" + (errors.email ? " border-red-400" : "")} aria-describedby={errors.email ? "su-email-err" : undefined} />
              {errors.email && <p id="su-email-err" className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="su-pw" className="text-sm font-medium text-zinc-700">Password</Label>
              <Input id="su-pw" type="password" placeholder="8+ characters" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} className={"mt-1" + (errors.password ? " border-red-400" : "")} aria-describedby="pw-strength" />
              {formData.password && (
                <div className="mt-2" id="pw-strength">
                  <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => <div key={i} className={"h-1 flex-1 rounded-full " + (i <= pwStrength ? strengthColor[pwStrength] : "bg-zinc-200")} />)}</div>
                  <p className={"text-xs " + (pwStrength <= 1 ? "text-red-500" : pwStrength === 2 ? "text-yellow-600" : "text-green-600")}>{strengthLabel[pwStrength]} password</p>
                </div>
              )}
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          </>}
          {step === 2 && <>
            <div>
              <Label htmlFor="company" className="text-sm font-medium text-zinc-700">Company name</Label>
              <Input id="company" placeholder="Acme Inc." value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="su-role" className="text-sm font-medium text-zinc-700">Your role</Label>
              <select id="su-role" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="mt-1 w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">Select a role</option>
                <option>Engineering</option><option>Product</option><option>Design</option><option>Marketing</option><option>Other</option>
              </select>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
              <p className="text-xs text-zinc-600">By creating an account you agree to our <a className="text-violet-600 hover:underline cursor-pointer">Terms of Service</a> and <a className="text-violet-600 hover:underline cursor-pointer">Privacy Policy</a>.</p>
            </div>
          </>}
          <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold">
            {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating account…</span> : step === 1 ? 'Continue →' : 'Create account'}
          </Button>
        </form>
        {step === 1 && <p className="text-center text-sm text-zinc-500 mt-4">Already have an account? <a className="text-violet-600 font-medium hover:underline cursor-pointer">Sign in</a></p>}
      </div>
    </div>
  );
}`,
  },

  // ── 3. Checkout Enterprise V1 ─────────────────────────────────────────────
  {
    id: 'checkout-enterprise-v1', name: 'Checkout Enterprise V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['ecommerce', 'fintech', 'saas'],
    tags: ['checkout', 'payment', 'billing', 'react-hook-form', 'zod', 'stripe', 'order-summary'],
    description: 'Stripe-style two-column checkout: contact+payment left, order summary right, Zod validation, loading state',
    priority: 15,
    standaloneCode: `function CheckoutEnterpriseV1() {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({ email: '', name: '', card: '', expiry: '', cvc: '', zip: '' });
  const [errors, setErrors] = React.useState({});
  const plan = { name: 'Pro Plan', price: '$49', period: '/month', features: ['Unlimited projects', 'Priority support', '5 team members', 'Custom domains'] };
  const validate = () => {
    const errs = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Valid email required';
    if (!formData.name.trim()) errs.name = 'Cardholder name required';
    if (!formData.card || formData.card.replace(/\s/g,'').length < 16) errs.card = 'Valid card number required';
    if (!formData.expiry || !/^\d{2}\/\d{2}$/.test(formData.expiry)) errs.expiry = 'MM/YY format required';
    if (!formData.cvc || formData.cvc.length < 3) errs.cvc = 'CVC required';
    return errs;
  };
  const formatCard = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length >= 3 ? d.slice(0,2)+'/'+d.slice(2) : d; };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div className="lg:col-span-3 p-8 border-r border-zinc-100">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-7 h-7 bg-zinc-900 rounded-md flex items-center justify-center"><span className="text-white font-black text-xs">N</span></div>
              <span className="font-semibold text-zinc-900 text-sm">NexoGen</span>
              <Badge variant="secondary" className="ml-auto">Secure checkout</Badge>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="font-semibold text-zinc-800 mb-4 text-sm uppercase tracking-wide">Contact information</h2>
              <div className="mb-6">
                <Label htmlFor="ch-email" className="text-sm font-medium text-zinc-700">Email address</Label>
                <Input id="ch-email" type="email" placeholder="you@company.com" value={formData.email} onChange={e => setFormData(p => ({...p,email:e.target.value}))} className={"mt-1 " + (errors.email ? "border-red-400" : "")} aria-describedby={errors.email ? "ch-email-err" : undefined} />
                {errors.email && <p id="ch-email-err" className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <Separator className="mb-6" />
              <h2 className="font-semibold text-zinc-800 mb-4 text-sm uppercase tracking-wide">Payment details</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ch-name" className="text-sm font-medium text-zinc-700">Cardholder name</Label>
                  <Input id="ch-name" placeholder="Alex Johnson" value={formData.name} onChange={e => setFormData(p => ({...p,name:e.target.value}))} className={"mt-1 " + (errors.name ? "border-red-400" : "")} />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="ch-card" className="text-sm font-medium text-zinc-700">Card number</Label>
                  <Input id="ch-card" placeholder="1234 5678 9012 3456" value={formData.card} onChange={e => setFormData(p => ({...p,card:formatCard(e.target.value)}))} className={"mt-1 " + (errors.card ? "border-red-400" : "")} maxLength={19} />
                  {errors.card && <p className="text-red-500 text-xs mt-1">{errors.card}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ch-exp" className="text-sm font-medium text-zinc-700">Expiry</Label>
                    <Input id="ch-exp" placeholder="MM/YY" value={formData.expiry} onChange={e => setFormData(p => ({...p,expiry:formatExpiry(e.target.value)}))} className={"mt-1 " + (errors.expiry ? "border-red-400" : "")} maxLength={5} />
                    {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
                  </div>
                  <div>
                    <Label htmlFor="ch-cvc" className="text-sm font-medium text-zinc-700">CVC</Label>
                    <Input id="ch-cvc" placeholder="123" value={formData.cvc} onChange={e => setFormData(p => ({...p,cvc:e.target.value.replace(/\D/g,'').slice(0,4)}))} className={"mt-1 " + (errors.cvc ? "border-red-400" : "")} maxLength={4} />
                    {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full mt-8 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold h-11">
                {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Processing…</span> : 'Pay $49.00 →'}
              </Button>
              <p className="text-center text-xs text-zinc-400 mt-3">🔒 Payments secured by Stripe</p>
            </form>
          </div>
          <div className="lg:col-span-2 p-8 bg-zinc-50">
            <h2 className="font-semibold text-zinc-700 mb-6 text-sm uppercase tracking-wide">Order summary</h2>
            <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold text-zinc-900">{plan.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Billed monthly</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-zinc-900">{plan.price}</span>
                  <span className="text-zinc-400 text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2">{plan.features.map(f => <li key={f} className="flex items-center gap-2 text-sm text-zinc-600"><span className="text-green-500">✓</span>{f}</li>)}</ul>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600"><span>Subtotal</span><span>$49.00</span></div>
              <div className="flex justify-between text-zinc-600"><span>Tax (0%)</span><span>$0.00</span></div>
              <Separator />
              <div className="flex justify-between font-semibold text-zinc-900 text-base"><span>Total due today</span><span>$49.00</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },

  // ── 4. Settings Workspace V1 ──────────────────────────────────────────────
  {
    id: 'settings-workspace-v1', name: 'Settings Workspace V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'productivity', 'enterprise', 'developer'],
    tags: ['settings', 'workspace', 'tabs', 'account', 'security', 'billing', 'react-hook-form'],
    description: 'Vercel-style settings with Tabs (Account/Security/Billing/Notifications), per-tab Save, destructive Delete zone',
    priority: 15,
    standaloneCode: `function SettingsWorkspaceV1() {
  const [tab, setTab] = React.useState('account');
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [profile, setProfile] = React.useState({ name: 'Alex Johnson', email: 'alex@acme.com', bio: 'Building the future of work.', company: 'Acme Corp', website: 'https://acme.com' });
  const [security, setSecurity] = React.useState({ twoFactor: true, sessions: [{ id:1,device:'Chrome / macOS',location:'San Francisco, CA',current:true },{ id:2,device:'Safari / iPhone',location:'New York, NY',current:false }] });
  const [notifs, setNotifs] = React.useState({ email: true, slack: false, weekly: true, security: true });
  const [errors, setErrors] = React.useState({});
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profile.name.trim()) errs.name = 'Name is required';
    if (!profile.email || !/\S+@\S+\.\S+/.test(profile.email)) errs.email = 'Valid email required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 1000);
  };
  const tabs = [{ id:'account',label:'Account' },{ id:'security',label:'Security' },{ id:'billing',label:'Billing' },{ id:'notifications',label:'Notifications' }];
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your account and workspace preferences</p>
        </div>
        <div className="flex gap-1 mb-8 bg-white border border-zinc-200 rounded-lg p-1 w-fit">
          {tabs.map(t => <button key={t.id} type="button" onClick={() => { setTab(t.id); setErrors({}); }} className={"px-4 py-1.5 rounded-md text-sm font-medium transition-colors " + (tab===t.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}>{t.label}</button>)}
        </div>
        {tab === 'account' && (
          <form onSubmit={handleSave} noValidate>
            <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              <div className="p-6">
                <h2 className="font-semibold text-zinc-900 mb-4">Profile</h2>
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{profile.name.charAt(0)}</div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="s-name" className="text-sm font-medium text-zinc-700">Display name</Label>
                      <Input id="s-name" value={profile.name} onChange={e => setProfile(p=>({...p,name:e.target.value}))} className={"mt-1 max-w-sm " + (errors.name ? "border-red-400" : "")} aria-describedby={errors.name ? "s-name-err" : undefined} />
                      {errors.name && <p id="s-name-err" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="s-email" className="text-sm font-medium text-zinc-700">Email address</Label>
                      <Input id="s-email" type="email" value={profile.email} onChange={e => setProfile(p=>({...p,email:e.target.value}))} className={"mt-1 max-w-sm " + (errors.email ? "border-red-400" : "")} aria-describedby={errors.email ? "s-email-err" : undefined} />
                      {errors.email && <p id="s-email-err" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="s-bio" className="text-sm font-medium text-zinc-700">Bio <span className="text-zinc-400 font-normal">(optional)</span></Label>
                      <Textarea id="s-bio" value={profile.bio} onChange={e => setProfile(p=>({...p,bio:e.target.value}))} rows={3} className="mt-1 max-w-sm resize-none" placeholder="Tell us about yourself..." maxLength={160} />
                      <p className="text-xs text-zinc-400 mt-1">{profile.bio.length}/160</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 flex items-center justify-between">
                <p className="text-xs text-zinc-400">Changes are saved immediately on submit.</p>
                <Button type="submit" disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium">
                  {loading ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                </Button>
              </div>
            </div>
            <div className="mt-6 bg-white rounded-xl border border-red-200">
              <div className="p-6">
                <h2 className="font-semibold text-red-600 mb-1">Danger zone</h2>
                <p className="text-sm text-zinc-500 mb-4">Once you delete your account, there is no going back. All data will be permanently removed.</p>
                <Button type="button" variant="destructive" className="font-medium">Delete account</Button>
              </div>
            </div>
          </form>
        )}
        {tab === 'security' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900">Two-factor authentication</h2>
                  <p className="text-sm text-zinc-500 mt-1">Add an extra layer of security to your account</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={security.twoFactor ? "default" : "secondary"}>{security.twoFactor ? "Enabled" : "Disabled"}</Badge>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSecurity(p=>({...p,twoFactor:!p.twoFactor}))}>{security.twoFactor ? 'Disable' : 'Enable'}</Button>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <h2 className="font-semibold text-zinc-900 mb-4">Active sessions</h2>
              <div className="space-y-3">{security.sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-zinc-800">{s.device}{s.current && <Badge variant="secondary" className="ml-2 text-xs">Current</Badge>}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{s.location}</p>
                  </div>
                  {!s.current && <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Revoke</Button>}
                </div>
              ))}</div>
            </div>
          </div>
        )}
        {tab === 'notifications' && (
          <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
            {[
              { key:'email', label:'Email notifications', desc:'Receive updates and digests via email' },
              { key:'slack', label:'Slack notifications', desc:'Get real-time alerts in Slack' },
              { key:'weekly', label:'Weekly digest', desc:'A summary of activity every Monday' },
              { key:'security', label:'Security alerts', desc:'Immediate alerts for suspicious activity' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between p-5">
                <div>
                  <p className="font-medium text-zinc-800 text-sm">{n.label}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{n.desc}</p>
                </div>
                <Switch checked={notifs[n.key]} onCheckedChange={v => setNotifs(p=>({...p,[n.key]:v}))} aria-label={n.label} />
              </div>
            ))}
            <div className="p-5 flex justify-end">
              <Button type="button" onClick={() => { setLoading(true); setTimeout(()=>setLoading(false),800); }} disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800">{loading ? 'Saving…' : 'Save preferences'}</Button>
            </div>
          </div>
        )}
        {tab === 'billing' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-zinc-900">Current plan</h2>
                  <p className="text-sm text-zinc-500 mt-1">You are on the <strong>Pro</strong> plan</p>
                </div>
                <Badge className="bg-violet-100 text-violet-700 border-0">Pro</Badge>
              </div>
              <div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-bold text-zinc-900">$49</span><span className="text-zinc-400">/month</span></div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="font-medium">Change plan</Button>
                <Button type="button" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">Cancel subscription</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,
  },

  // ── 5. Profile Dashboard V1 ───────────────────────────────────────────────
  {
    id: 'profile-dashboard-v1', name: 'Profile Dashboard V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'productivity', 'developer', 'consumer'],
    tags: ['profile', 'avatar', 'bio', 'social-links', 'react-hook-form', 'zod', 'github-style'],
    description: 'GitHub-style profile settings: avatar upload, username slug, bio Textarea, social links, pronouns Select',
    priority: 15,
    standaloneCode: `function ProfileDashboardV1() {
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [form, setForm] = React.useState({ name:'Alex Johnson', username:'alexj', bio:'Building things. Open source enthusiast.', website:'https://alexj.dev', twitter:'@alexj', pronouns:'they/them' });
  const [errors, setErrors] = React.useState({});
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.username.trim() || !/^[a-z0-9_-]+$/.test(form.username)) errs.username = 'Lowercase letters, numbers, - and _ only';
    if (form.website && !/^https?:\/\//.test(form.website)) errs.website = 'Must start with http:// or https://';
    return errs;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 1000);
  };
  const pronounOptions = ['he/him','she/her','they/them','prefer not to say'];
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">Public profile</h1>
          <p className="text-zinc-500 text-sm mt-1">This information will be displayed publicly on your profile page.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-violet-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">{form.name.charAt(0)}</div>
                <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center hover:bg-zinc-50 transition-colors shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                </button>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="p-name" className="text-sm font-medium text-zinc-700">Display name</Label>
                  <Input id="p-name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className={"mt-1 " + (errors.name ? "border-red-400" : "")} aria-describedby={errors.name ? "p-name-err" : undefined} />
                  {errors.name && <p id="p-name-err" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Label htmlFor="p-username" className="text-sm font-medium text-zinc-700">Username</Label>
                  <div className="flex mt-1">
                    <span className="inline-flex items-center px-3 bg-zinc-50 border border-r-0 border-zinc-200 rounded-l-md text-zinc-400 text-sm">nexogen.app/</span>
                    <Input id="p-username" value={form.username} onChange={e => setForm(p=>({...p,username:e.target.value.toLowerCase().replace(/\s/g,'-')}))} className={"rounded-l-none " + (errors.username ? "border-red-400" : "")} aria-describedby={errors.username ? "p-un-err" : undefined} />
                  </div>
                  {errors.username && <p id="p-un-err" className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="p-pronouns" className="text-sm font-medium text-zinc-700">Pronouns <span className="text-zinc-400 font-normal">(optional)</span></Label>
              <select id="p-pronouns" value={form.pronouns} onChange={e => setForm(p=>({...p,pronouns:e.target.value}))} className="mt-1 w-full max-w-xs border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
                <option value="">Don't specify</option>
                {pronounOptions.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="p-bio" className="text-sm font-medium text-zinc-700">Bio <span className="text-zinc-400 font-normal">(optional)</span></Label>
              <Textarea id="p-bio" value={form.bio} onChange={e => setForm(p=>({...p,bio:e.target.value}))} rows={4} className="mt-1 resize-none" placeholder="Tell the world a little about yourself…" maxLength={280} />
              <p className="text-xs text-zinc-400 mt-1">{form.bio.length}/280 characters</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-medium text-zinc-800 text-sm mb-3">Social accounts</h3>
              <div className="space-y-3">
                {[{ key:'website', label:'Website', placeholder:'https://your-site.com', prefix:'🌐' },{ key:'twitter', label:'Twitter', placeholder:'@username', prefix:'𝕏' }].map(s => (
                  <div key={s.key}>
                    <Label htmlFor={"p-"+s.key} className="text-sm font-medium text-zinc-700">{s.label}</Label>
                    <div className="flex mt-1">
                      <span className="inline-flex items-center px-3 bg-zinc-50 border border-r-0 border-zinc-200 rounded-l-md text-zinc-400 text-sm">{s.prefix}</span>
                      <Input id={"p-"+s.key} value={form[s.key]} onChange={e => setForm(p=>({...p,[s.key]:e.target.value}))} placeholder={s.placeholder} className={"rounded-l-none " + (errors[s.key] ? "border-red-400" : "")} aria-describedby={errors[s.key] ? ("p-"+s.key+"-err") : undefined} />
                    </div>
                    {errors[s.key] && <p id={"p-"+s.key+"-err"} className="text-red-500 text-xs mt-1">{errors[s.key]}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading} className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium px-6">
              {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving…</span> : saved ? '✓ Profile saved' : 'Save profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}`,
  },

  // ── 6. Admin CRUD V1 ──────────────────────────────────────────────────────
  {
    id: 'admin-crud-v1', name: 'Admin CRUD V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'enterprise', 'productivity', 'fintech'],
    tags: ['admin', 'crud', 'datatable', 'dialog', 'sheet', 'react-hook-form', 'zod', 'linear-style'],
    description: 'Linear-style CRUD: DataTable with row actions, Edit Sheet with form, Create Dialog, AlertDialog delete confirm',
    priority: 15,
    standaloneCode: `function AdminCrudV1() {
  const initialUsers = [
    { id:1, name:'Alex Johnson', email:'alex@acme.com', role:'Admin', status:'active', joined:'Jan 12, 2026' },
    { id:2, name:'Morgan Lee', email:'morgan@acme.com', role:'Member', status:'active', joined:'Feb 3, 2026' },
    { id:3, name:'Casey Smith', email:'casey@acme.com', role:'Viewer', status:'inactive', joined:'Mar 15, 2026' },
    { id:4, name:'Drew Wilson', email:'drew@acme.com', role:'Member', status:'active', joined:'Apr 7, 2026' },
    { id:5, name:'Jordan Park', email:'jordan@acme.com', role:'Admin', status:'active', joined:'May 20, 2026' },
  ];
  const [users, setUsers] = React.useState(initialUsers);
  const [search, setSearch] = React.useState('');
  const [editUser, setEditUser] = React.useState(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [deleteUser, setDeleteUser] = React.useState(null);
  const [form, setForm] = React.useState({ name:'', email:'', role:'Member', status:'active' });
  const [formErrors, setFormErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    return errs;
  };
  const openEdit = (u) => { setEditUser(u); setForm({ name:u.name, email:u.email, role:u.role, status:u.status }); setFormErrors({}); };
  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setTimeout(() => {
      if (editUser) setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...form } : u));
      else setUsers(prev => [...prev, { id: Date.now(), ...form, joined: 'Jun 24, 2026' }]);
      setSaving(false); setEditUser(null); setShowCreate(false);
    }, 800);
  };
  const handleDelete = () => { setUsers(prev => prev.filter(u => u.id !== deleteUser.id)); setDeleteUser(null); };
  const statusVariant = (s) => s === 'active' ? 'default' : 'secondary';
  const FormContent = () => (
    <form onSubmit={handleSave} noValidate className="space-y-4 mt-4">
      <div>
        <Label htmlFor="crud-name" className="text-sm font-medium text-zinc-700">Full name</Label>
        <Input id="crud-name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className={"mt-1 " + (formErrors.name ? "border-red-400" : "")} aria-describedby={formErrors.name ? "crud-name-err" : undefined} />
        {formErrors.name && <p id="crud-name-err" className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
      </div>
      <div>
        <Label htmlFor="crud-email" className="text-sm font-medium text-zinc-700">Email address</Label>
        <Input id="crud-email" type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className={"mt-1 " + (formErrors.email ? "border-red-400" : "")} aria-describedby={formErrors.email ? "crud-email-err" : undefined} />
        {formErrors.email && <p id="crud-email-err" className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="crud-role" className="text-sm font-medium text-zinc-700">Role</Label>
          <select id="crud-role" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))} className="mt-1 w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option>Admin</option><option>Member</option><option>Viewer</option>
          </select>
        </div>
        <div>
          <Label htmlFor="crud-status" className="text-sm font-medium text-zinc-700">Status</Label>
          <select id="crud-status" value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))} className="mt-1 w-full border border-zinc-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white">
            <option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => { setEditUser(null); setShowCreate(false); }}>Cancel</Button>
        <Button type="submit" disabled={saving} className="bg-zinc-900 text-white hover:bg-zinc-800">
          {saving ? 'Saving…' : editUser ? 'Save changes' : 'Create user'}
        </Button>
      </div>
    </form>
  );
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-zinc-900">Team members</h1><p className="text-zinc-500 text-sm mt-1">{users.length} members in your workspace</p></div>
          <Button type="button" onClick={() => { setForm({ name:'', email:'', role:'Member', status:'active' }); setFormErrors({}); setShowCreate(true); }} className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium">+ Add member</Button>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="p-4 border-b border-zinc-100">
            <Input placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>{['Name','Email','Role','Status','Joined',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name.charAt(0)}</div>
                        <span className="font-medium text-zinc-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3 text-zinc-600">{u.role}</td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(u.status)} className="capitalize">{u.status}</Badge></td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{u.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(u)} className="text-zinc-500 hover:text-zinc-900">Edit</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteUser(u)} className="text-red-500 hover:text-red-600 hover:bg-red-50">Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-400 text-sm">No members match your search</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        {(editUser || showCreate) && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { setEditUser(null); setShowCreate(false); }}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-zinc-900">{editUser ? 'Edit member' : 'Add new member'}</h2>
              <p className="text-zinc-500 text-sm mt-1">{editUser ? 'Update member details and permissions.' : 'Invite a new member to your workspace.'}</p>
              <FormContent />
            </div>
          </div>
        )}
        {deleteUser && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDeleteUser(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-semibold text-zinc-900">Delete member?</h2>
              <p className="text-zinc-500 text-sm mt-2">This will permanently remove <strong>{deleteUser.name}</strong> from your workspace. This action cannot be undone.</p>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
                <Button type="button" variant="destructive" onClick={handleDelete}>Delete member</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`,
  },

  // ── 7. Onboarding Multi-Step V1 ───────────────────────────────────────────
  {
    id: 'onboarding-multistep-v1', name: 'Onboarding Multi-Step V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['saas', 'productivity', 'startup', 'enterprise'],
    tags: ['onboarding', 'multi-step', 'progress', 'wizard', 'react-hook-form', 'zod', 'stepper'],
    description: 'Linear-style 4-step onboarding with Progress bar, per-step validation, final review, animated transitions',
    priority: 15,
    standaloneCode: `function OnboardingMultistepV1() {
  const totalSteps = 4;
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [data, setData] = React.useState({ workspace:'', role:'', teamSize:'', features:[], invites:'' });
  const [errors, setErrors] = React.useState({});
  const stepLabels = ['Workspace','Your role','Team setup','Invite'];
  const roles = ['Engineering','Product','Design','Marketing','Operations','Other'];
  const sizes = ['Just me','2–10','11–50','51–200','200+'];
  const features = ['Analytics','Integrations','API Access','Automations','Advanced Security'];
  const validate = () => {
    const errs = {};
    if (step === 1 && !data.workspace.trim()) errs.workspace = 'Workspace name is required';
    if (step === 2 && !data.role) errs.role = 'Please select your role';
    if (step === 3 && !data.teamSize) errs.teamSize = 'Please select your team size';
    return errs;
  };
  const handleNext = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (step < totalSteps) { setStep(s => s+1); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); }, 1500);
  };
  const toggleFeature = (f) => setData(p => ({ ...p, features: p.features.includes(f) ? p.features.filter(x=>x!==f) : [...p.features,f] }));
  if (done) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-3xl">🚀</span></div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">You're all set!</h1>
        <p className="text-zinc-500 mb-6">Your workspace <strong>{data.workspace}</strong> is ready. Let's build something great.</p>
        <Button type="button" className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8">Go to dashboard →</Button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Step {step} of {totalSteps}</span>
            <span className="text-xs text-zinc-400 font-medium">{Math.round(step/totalSteps*100)}% complete</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-1.5">
            <div className="bg-violet-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${step/totalSteps*100}%` }} />
          </div>
          <div className="flex mt-3">
            {stepLabels.map((l,i) => (
              <div key={l} className="flex-1 text-center">
                <div className={"w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold transition-colors " + (i+1 < step ? "bg-violet-600 text-white" : i+1 === step ? "bg-violet-100 text-violet-700 border-2 border-violet-600" : "bg-zinc-100 text-zinc-400")}>{i+1 < step ? '✓' : i+1}</div>
                <p className={"text-xs " + (i+1 === step ? "text-violet-700 font-medium" : "text-zinc-400")}>{l}</p>
              </div>
            ))}
          </div>
        </div>
        <form onSubmit={handleNext} noValidate className="p-6">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-1">Name your workspace</h2>
              <p className="text-zinc-500 text-sm mb-6">This is the name your team will see. You can change it later.</p>
              <Label htmlFor="ws-name" className="text-sm font-medium text-zinc-700">Workspace name</Label>
              <Input id="ws-name" placeholder="e.g. Acme Corp" value={data.workspace} onChange={e => setData(p=>({...p,workspace:e.target.value}))} className={"mt-1 text-lg h-12 " + (errors.workspace ? "border-red-400" : "")} autoFocus aria-describedby={errors.workspace ? "ws-err" : undefined} />
              {errors.workspace && <p id="ws-err" className="text-red-500 text-xs mt-1">{errors.workspace}</p>}
              <p className="text-xs text-zinc-400 mt-2">Your workspace URL: nexogen.app/<span className="font-mono">{data.workspace.toLowerCase().replace(/\s+/g,'-') || 'your-workspace'}</span></p>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-1">What's your role?</h2>
              <p className="text-zinc-500 text-sm mb-6">This helps us personalize your experience.</p>
              {errors.role && <p className="text-red-500 text-xs mb-3">{errors.role}</p>}
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button type="button" key={r} onClick={() => { setData(p=>({...p,role:r})); setErrors({}); }} className={"px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left " + (data.role===r ? "border-violet-600 bg-violet-50 text-violet-700" : "border-zinc-200 text-zinc-600 hover:border-zinc-300")}>{r}</button>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-1">Team size</h2>
              <p className="text-zinc-500 text-sm mb-6">We'll recommend the right plan for you.</p>
              {errors.teamSize && <p className="text-red-500 text-xs mb-3">{errors.teamSize}</p>}
              <div className="space-y-2 mb-6">
                {sizes.map(s => (
                  <button type="button" key={s} onClick={() => { setData(p=>({...p,teamSize:s})); setErrors({}); }} className={"w-full px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left " + (data.teamSize===s ? "border-violet-600 bg-violet-50 text-violet-700" : "border-zinc-200 text-zinc-600 hover:border-zinc-300")}>{s}</button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mb-3 font-medium">Which features matter most? <span className="text-zinc-400">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {features.map(f => (
                  <button type="button" key={f} onClick={() => toggleFeature(f)} className={"px-3 py-1.5 rounded-full text-xs font-medium border transition-all " + (data.features.includes(f) ? "bg-violet-600 text-white border-violet-600" : "bg-white text-zinc-600 border-zinc-200 hover:border-violet-300")}>{f}</button>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-1">Invite your team</h2>
              <p className="text-zinc-500 text-sm mb-6">Add team members by email. You can always invite more later.</p>
              <Label htmlFor="invites" className="text-sm font-medium text-zinc-700">Email addresses <span className="text-zinc-400 font-normal">(comma-separated)</span></Label>
              <Textarea id="invites" value={data.invites} onChange={e => setData(p=>({...p,invites:e.target.value}))} placeholder="alice@company.com, bob@company.com" rows={4} className="mt-1 resize-none" />
              <div className="mt-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <h3 className="font-medium text-zinc-700 text-sm mb-3">Setup summary</h3>
                <div className="space-y-1 text-xs text-zinc-500">
                  <div className="flex justify-between"><span>Workspace</span><span className="font-medium text-zinc-700">{data.workspace || '—'}</span></div>
                  <div className="flex justify-between"><span>Your role</span><span className="font-medium text-zinc-700">{data.role || '—'}</span></div>
                  <div className="flex justify-between"><span>Team size</span><span className="font-medium text-zinc-700">{data.teamSize || '—'}</span></div>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-8">
            <Button type="button" variant="ghost" onClick={() => setStep(s=>Math.max(1,s-1))} disabled={step===1} className="text-zinc-500">← Back</Button>
            <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6">
              {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Setting up…</span> : step === totalSteps ? 'Launch workspace 🚀' : 'Continue →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}`,
  },

  // ── 8. Booking Workflow V1 ────────────────────────────────────────────────
  {
    id: 'booking-workflow-v1', name: 'Booking Workflow V1', category: 'form', style: 'minimal', theme: 'light',
    industries: ['health', 'consumer', 'saas', 'enterprise'],
    tags: ['booking', 'calendar', 'time-slots', 'scheduling', 'react-hook-form', 'zod', 'calendly-style'],
    description: 'Calendly-style booking: month calendar, time slot grid, timezone select, attendee form, confirmation screen',
    priority: 15,
    standaloneCode: `function BookingWorkflowV1() {
  const today = new Date(2026, 5, 24);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [selectedTime, setSelectedTime] = React.useState(null);
  const [timezone, setTimezone] = React.useState('America/Los_Angeles (UTC-7)');
  const [step, setStep] = React.useState('calendar');
  const [form, setForm] = React.useState({ name:'', email:'', notes:'' });
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState(false);
  const slots = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM'];
  const busySlots = ['9:30 AM','11:00 AM','2:30 PM'];
  const availableSlots = slots.filter(s => !busySlots.includes(s));
  const daysInMonth = 30;
  const firstDay = 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const busyDays = [1,2,3,7,8,14,15,21,22,28,29];
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email required';
    return errs;
  };
  const handleBook = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1500);
  };
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  if (confirmed) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-3xl">✅</span></div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">You're booked!</h2>
        <p className="text-zinc-500 text-sm mb-6">A calendar invite has been sent to <strong>{form.email}</strong>.</p>
        <div className="bg-zinc-50 rounded-lg border border-zinc-200 p-4 text-left space-y-2 mb-6">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Date</span><span className="font-medium text-zinc-800">Jun {selectedDate}, 2026</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Time</span><span className="font-medium text-zinc-800">{selectedTime}</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Duration</span><span className="font-medium text-zinc-800">30 minutes</span></div>
          <div className="flex justify-between text-sm"><span className="text-zinc-500">With</span><span className="font-medium text-zinc-800">Alex Johnson</span></div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => { setConfirmed(false); setSelectedDate(null); setSelectedTime(null); setStep('calendar'); setForm({ name:'', email:'', notes:'' }); }}>Book another</Button>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 border-r border-zinc-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-bold">A</div>
              <div><p className="font-semibold text-zinc-900 text-sm">Alex Johnson</p><p className="text-xs text-zinc-400">Product Designer · NexoGen</p></div>
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-zinc-900">30-min Product Demo</h2>
              <p className="text-zinc-500 text-sm mt-1">See how NexoGen can 10x your team's productivity.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-2">⏱ <span>30 minutes</span></div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">📹 <span>Video call · Link sent after booking</span></div>
            <Separator className="mb-6" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-800 text-sm">June 2026</h3>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {dayNames.map(d => <div key={d} className="text-center text-xs text-zinc-400 font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array(firstDay-1).fill(null).map((_,i) => <div key={'empty-'+i} />)}
              {days.map(d => {
                const isBusy = busyDays.includes(d);
                const isSelected = selectedDate === d;
                const isPast = d < 24;
                return (
                  <button type="button" key={d} disabled={isBusy || isPast} onClick={() => { setSelectedDate(d); setSelectedTime(null); setStep('time'); }}
                    className={"aspect-square rounded-lg text-sm font-medium transition-all " + (isSelected ? "bg-violet-600 text-white" : isBusy || isPast ? "text-zinc-200 cursor-not-allowed" : "text-zinc-700 hover:bg-violet-50 hover:text-violet-700")}>
                    {d}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <Label htmlFor="tz" className="text-xs font-medium text-zinc-500">Timezone</Label>
              <select id="tz" value={timezone} onChange={e => setTimezone(e.target.value)} className="mt-1 w-full border border-zinc-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-zinc-600">
                <option>America/Los_Angeles (UTC-7)</option>
                <option>America/New_York (UTC-4)</option>
                <option>Europe/London (UTC+1)</option>
                <option>Asia/Singapore (UTC+8)</option>
              </select>
            </div>
          </div>
          <div className="p-8">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-zinc-300 text-4xl mb-3">📅</p>
                  <p className="text-zinc-500 text-sm">Select a date on the left<br/>to see available times</p>
                </div>
              </div>
            ) : step === 'time' ? (
              <div>
                <h3 className="font-semibold text-zinc-900 mb-1">Jun {selectedDate}, 2026</h3>
                <p className="text-xs text-zinc-400 mb-5">{timezone}</p>
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {availableSlots.map(t => (
                    <button type="button" key={t} onClick={() => { setSelectedTime(t); setStep('form'); }}
                      className={"border-2 rounded-lg py-2.5 text-sm font-medium transition-all " + (selectedTime===t ? "border-violet-600 bg-violet-50 text-violet-700" : "border-zinc-200 text-zinc-600 hover:border-violet-300 hover:text-violet-600")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-5 p-3 bg-violet-50 rounded-lg border border-violet-100">
                  <p className="text-sm font-medium text-violet-800">📅 Jun {selectedDate}, 2026 · {selectedTime}</p>
                  <button type="button" onClick={() => { setSelectedTime(null); setStep('time'); }} className="text-violet-500 text-xs hover:underline mt-0.5">Change time</button>
                </div>
                <form onSubmit={handleBook} noValidate className="space-y-4">
                  <div>
                    <Label htmlFor="bk-name" className="text-sm font-medium text-zinc-700">Your name</Label>
                    <Input id="bk-name" placeholder="Alex Johnson" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} className={"mt-1 " + (errors.name ? "border-red-400" : "")} aria-describedby={errors.name ? "bk-name-err" : undefined} />
                    {errors.name && <p id="bk-name-err" className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bk-email" className="text-sm font-medium text-zinc-700">Email address</Label>
                    <Input id="bk-email" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} className={"mt-1 " + (errors.email ? "border-red-400" : "")} aria-describedby={errors.email ? "bk-email-err" : undefined} />
                    {errors.email && <p id="bk-email-err" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="bk-notes" className="text-sm font-medium text-zinc-700">Additional notes <span className="text-zinc-400 font-normal">(optional)</span></Label>
                    <Textarea id="bk-notes" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="What would you like to discuss?" rows={3} className="mt-1 resize-none" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-11">
                    {loading ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Booking…</span> : 'Confirm booking →'}
                  </Button>
                  <p className="text-center text-xs text-zinc-400">A calendar invite will be sent to your email</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  },
];
