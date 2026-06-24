// ── V7.2.6.1 Auth State Classifier ────────────────────────────────────────────
// Detects user intent from prompt + DNA composition to route to the correct
// navbar variant before code generation. Pure deterministic logic — no LLM.

export type AuthState = 'guest' | 'authenticated' | 'dashboard' | 'admin';

export interface AuthClassification {
  authState: AuthState;
  navbarVariant: string;
  confidence: number;
  allScores: Record<AuthState, number>;
}

// ── Signal dictionaries ───────────────────────────────────────────────────────

const GUEST_SIGNALS = [
  'landing page', 'marketing site', 'marketing page', 'startup', 'agency',
  'portfolio', 'restaurant', 'cafe', 'ecommerce', 'e-commerce', 'shop', 'store',
  'home page', 'homepage', 'brand site', 'product page', 'waitlist',
  'coming soon', 'brochure', 'showcase', 'saas landing', 'pricing page only',
];

const AUTHENTICATED_SIGNALS = [
  'account', 'my account', 'profile', 'user profile', 'workspace', 'team',
  'member area', 'client portal', 'user dashboard', 'after login', 'logged in',
  'sign in page', 'post-login', 'onboarding', 'settings page', 'billing page',
];

const DASHBOARD_SIGNALS = [
  'analytics', 'saas dashboard', 'crm', 'erp', 'project management',
  'productivity app', 'task management', 'kanban', 'issue tracker',
  'reporting', 'metrics dashboard', 'monitoring', 'data dashboard',
  'operations', 'app dashboard', 'user dashboard', 'work management',
  'social media dashboard', 'email dashboard', 'inbox',
];

const ADMIN_SIGNALS = [
  'admin panel', 'admin dashboard', 'admin page', 'admin area',
  'manage users', 'user management', 'role management', 'roles',
  'audit logs', 'audit trail', 'system settings', 'moderation',
  'backoffice', 'back office', 'control panel', 'cms', 'content management',
  'super admin', 'staff panel', 'operator', 'site admin',
];

// ── DNA → navbar variant (authenticated states only) ─────────────────────────

const DNA_NAVBAR_MAP: Record<string, string> = {
  linear:  'navbar-dashboard-v1',
  stripe:  'navbar-admin-v1',
  vercel:  'navbar-auth-v1',
  github:  'navbar-auth-v2',
  notion:  'navbar-command-v1',
};

const AUTH_STATE_NAVBAR_DEFAULT: Record<AuthState, string> = {
  guest:         'navbar-navigation-saas-v1',
  authenticated: 'navbar-auth-v1',
  dashboard:     'navbar-dashboard-v1',
  admin:         'navbar-admin-v1',
};

// ── Core classifier ───────────────────────────────────────────────────────────

function countSignals(prompt: string, signals: string[]): number {
  const lower = prompt.toLowerCase();
  let score = 0;
  for (const signal of signals) {
    if (lower.includes(signal)) score++;
  }
  return score;
}

function getDominantBrand(dna: Record<string, number>): string {
  let best = '';
  let bestPct = 0;
  for (const [brand, pct] of Object.entries(dna)) {
    if (pct > bestPct) { bestPct = pct; best = brand.toLowerCase(); }
  }
  return best;
}

export function classifyAuthState(
  prompt: string,
  dnaComposition?: Record<string, number>,
): AuthClassification {
  const raw: Record<AuthState, number> = {
    guest:         countSignals(prompt, GUEST_SIGNALS),
    authenticated: countSignals(prompt, AUTHENTICATED_SIGNALS),
    dashboard:     countSignals(prompt, DASHBOARD_SIGNALS),
    admin:         countSignals(prompt, ADMIN_SIGNALS),
  };

  // Admin + dashboard signals are weighted heavier (they are more specific intent)
  const weighted: Record<AuthState, number> = {
    guest:         raw.guest,
    authenticated: raw.authenticated * 1.3,
    dashboard:     raw.dashboard * 1.6,
    admin:         raw.admin * 2.2,
  };

  let winner: AuthState = 'guest';
  let winnerScore = 0;
  for (const [state, score] of Object.entries(weighted) as [AuthState, number][]) {
    if (score > winnerScore) { winner = state; winnerScore = score; }
  }

  const total = Object.values(weighted).reduce((s, v) => s + v, 0);
  const confidence = total > 0
    ? Math.min(0.99, winnerScore / total)
    : 0.50; // default guest confidence

  // Resolve navbar variant
  let navbarVariant = AUTH_STATE_NAVBAR_DEFAULT[winner];

  if (dnaComposition) {
    const dominantBrand = getDominantBrand(dnaComposition);
    if (dominantBrand && DNA_NAVBAR_MAP[dominantBrand]) {
      if (winner !== 'guest') {
        // Authenticated states: DNA always wins
        navbarVariant = DNA_NAVBAR_MAP[dominantBrand];
      } else if (dominantBrand === 'vercel' || dominantBrand === 'notion') {
        // Guest state: only override for brands that have appropriate guest templates
        navbarVariant = DNA_NAVBAR_MAP[dominantBrand];
      }
    }
  }

  return {
    authState: winner,
    navbarVariant,
    confidence: Math.round(confidence * 100) / 100,
    allScores: raw,
  };
}

// ── Navbar variant → auth state (for evaluator alignment check) ───────────────

export function navbarVariantToExpectedState(navbarVariant: string): AuthState {
  if (navbarVariant.includes('admin'))      return 'admin';
  if (navbarVariant.includes('dashboard'))  return 'dashboard';
  if (navbarVariant.includes('auth') || navbarVariant.includes('command')) return 'authenticated';
  return 'guest';
}

// ── Auth state → required components ─────────────────────────────────────────

export const AUTH_STATE_REQUIRED_COMPONENTS: Record<AuthState, string[]> = {
  guest:         ['NavigationMenu', 'Button', 'Sheet'],
  authenticated: ['NavigationMenu', 'Avatar', 'DropdownMenu', 'Sheet'],
  dashboard:     ['NavigationMenu', 'Avatar', 'DropdownMenu', 'Sheet'],
  admin:         ['NavigationMenu', 'Avatar', 'DropdownMenu', 'Command', 'Sheet'],
};
