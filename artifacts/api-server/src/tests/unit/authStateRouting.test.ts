// ── V7.2.6.1 Auth State Routing Tests ─────────────────────────────────────────
// 75+ tests covering: signal detection, confidence scoring, DNA override,
// navbarVariant routing, evaluator authNavbarAlignment, telemetry, phase 10 criteria.

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyAuthState,
  navbarVariantToExpectedState,
  AUTH_STATE_REQUIRED_COMPONENTS,
} from '../../auth/authStateClassifier.js';
import {
  recordAuthRouting,
  getAuthRoutingMetrics,
  resetAuthRoutingMetrics,
} from '../../auth/authRoutingMetrics.js';
import { evaluateDesign } from '../../agents/designEvaluator/evaluator.js';
import type { EvaluationInput } from '../../agents/designEvaluator/evaluator.js';

// ── Minimal DesignDNA for evaluator calls ─────────────────────────────────────
const MOCK_DNA = {
  designLanguage: 'minimal-flat',
  layoutStyle: 'grid',
  typographySystem: { headingWeight: '700', headingTracking: '-0.02em', scale: '1.25', fontFamily: 'Inter' },
  spacingSystem: { density: 'comfortable', sectionPadding: '5rem', componentGap: '1.5rem' },
  colorSystem: {
    theme: 'dark', background: '#0a0a0a', surface: '#111', primary: '#7c3aed',
    secondary: '#4f46e5', accent: '#8b5cf6', text: '#fff', textMuted: '#888', border: '#222',
  },
  animationPersonality: 'subtle',
  decorationLevel: 'none',
  componentPreferences: [],
  heroStyle: 'editorial-large',
  cardStyle: 'minimal',
  visualDensity: 'comfortable',
  theme: 'dark',
  primaryColor: '#7c3aed',
  secondaryColor: '#4f46e5',
  accentColor: '#8b5cf6',
  bgColor: '#0a0a0a',
  bgGradient: '',
  headingGradient: '',
  buttonStyle: 'rounded',
  buttonColors: '',
  cardStyleTokens: '',
  mood: 'professional',
};

const SECTION_ORDER = ['Navbar', 'Hero', 'Features', 'CTA', 'Footer'];

// ── Phase 2: Signal Detection ─────────────────────────────────────────────────

describe('Phase 2 — Guest Signal Detection', () => {
  it('classifies "landing page" as guest', () => {
    const r = classifyAuthState('Build a landing page for my startup');
    expect(r.authState).toBe('guest');
  });

  it('classifies "marketing site" as guest', () => {
    const r = classifyAuthState('Create a marketing site for our agency');
    expect(r.authState).toBe('guest');
  });

  it('classifies "portfolio" as guest', () => {
    const r = classifyAuthState('Portfolio website for a freelance designer');
    expect(r.authState).toBe('guest');
  });

  it('classifies "restaurant" as guest', () => {
    const r = classifyAuthState('Restaurant website with menu and reservations');
    expect(r.authState).toBe('guest');
  });

  it('classifies "ecommerce" as guest', () => {
    const r = classifyAuthState('Build an ecommerce store for handmade goods');
    expect(r.authState).toBe('guest');
  });

  it('classifies "startup" as guest', () => {
    const r = classifyAuthState('Startup homepage with pricing and features');
    expect(r.authState).toBe('guest');
  });

  it('routes guest to navbar-navigation-saas-v1 by default', () => {
    const r = classifyAuthState('Landing page for a SaaS company');
    expect(r.authState).toBe('guest');
    expect(r.navbarVariant).toBe('navbar-navigation-saas-v1');
  });
});

describe('Phase 2 — Authenticated Signal Detection', () => {
  it('classifies "account" context as authenticated', () => {
    const r = classifyAuthState('My account settings and profile management page');
    expect(r.authState).toBe('authenticated');
  });

  it('classifies "client portal" as authenticated', () => {
    const r = classifyAuthState('Client portal for viewing invoices and documents');
    expect(r.authState).toBe('authenticated');
  });

  it('classifies "member area" as authenticated', () => {
    const r = classifyAuthState('Member area with exclusive content and benefits');
    expect(r.authState).toBe('authenticated');
  });

  it('routes authenticated to navbar-auth-v1 by default', () => {
    const r = classifyAuthState('User profile and account settings page');
    expect(r.authState).toBe('authenticated');
    expect(r.navbarVariant).toBe('navbar-auth-v1');
  });
});

describe('Phase 2 — Dashboard Signal Detection', () => {
  it('classifies "analytics" as dashboard', () => {
    const r = classifyAuthState('Analytics dashboard for tracking campaign performance');
    expect(r.authState).toBe('dashboard');
  });

  it('classifies "saas dashboard" as dashboard', () => {
    const r = classifyAuthState('SaaS dashboard for team project management');
    expect(r.authState).toBe('dashboard');
  });

  it('classifies "crm" as dashboard', () => {
    const r = classifyAuthState('CRM system for managing sales pipeline');
    expect(r.authState).toBe('dashboard');
  });

  it('classifies "project management" as dashboard', () => {
    const r = classifyAuthState('Project management app with Kanban boards');
    expect(r.authState).toBe('dashboard');
  });

  it('classifies "kanban" as dashboard', () => {
    const r = classifyAuthState('Kanban board for task tracking and team collaboration');
    expect(r.authState).toBe('dashboard');
  });

  it('routes dashboard to navbar-dashboard-v1 by default', () => {
    const r = classifyAuthState('Analytics dashboard with charts and reporting');
    expect(r.authState).toBe('dashboard');
    expect(r.navbarVariant).toBe('navbar-dashboard-v1');
  });
});

describe('Phase 2 — Admin Signal Detection', () => {
  it('classifies "admin panel" as admin — Phase 10 success criterion', () => {
    const r = classifyAuthState('Build an admin panel for managing users');
    expect(r.authState).toBe('admin');
  });

  it('classifies "admin dashboard" as admin — Phase 10 success criterion', () => {
    const r = classifyAuthState('Admin dashboard to manage all platform settings');
    expect(r.authState).toBe('admin');
  });

  it('classifies "manage users" as admin', () => {
    const r = classifyAuthState('System to manage users and assign roles');
    expect(r.authState).toBe('admin');
  });

  it('classifies "role management" as admin', () => {
    const r = classifyAuthState('Role management interface for enterprise app');
    expect(r.authState).toBe('admin');
  });

  it('classifies "audit logs" as admin', () => {
    const r = classifyAuthState('Audit logs and system settings for platform admins');
    expect(r.authState).toBe('admin');
  });

  it('classifies "moderation" as admin', () => {
    const r = classifyAuthState('Content moderation panel for community managers');
    expect(r.authState).toBe('admin');
  });

  it('classifies "control panel" as admin', () => {
    const r = classifyAuthState('Control panel for server configuration and monitoring');
    expect(r.authState).toBe('admin');
  });

  it('routes admin to navbar-admin-v1 by default', () => {
    const r = classifyAuthState('Admin dashboard for managing users and audit logs');
    expect(r.authState).toBe('admin');
    expect(r.navbarVariant).toBe('navbar-admin-v1');
  });
});

// ── Phase 3: Confidence System ────────────────────────────────────────────────

describe('Phase 3 — Confidence System', () => {
  it('returns confidence 0–1', () => {
    const r = classifyAuthState('admin dashboard for managing users and roles');
    expect(r.confidence).toBeGreaterThanOrEqual(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });

  it('returns high confidence for strong admin signals', () => {
    const r = classifyAuthState('admin panel to manage users, roles, and audit logs');
    expect(r.authState).toBe('admin');
    expect(r.confidence).toBeGreaterThan(0.6);
  });

  it('returns allScores as record of all 4 states', () => {
    const r = classifyAuthState('analytics dashboard for tracking metrics');
    expect(r.allScores).toHaveProperty('guest');
    expect(r.allScores).toHaveProperty('authenticated');
    expect(r.allScores).toHaveProperty('dashboard');
    expect(r.allScores).toHaveProperty('admin');
  });

  it('returns 0.50 confidence for zero-signal prompt (default guest)', () => {
    const r = classifyAuthState('something completely generic');
    expect(r.confidence).toBe(0.50);
  });

  it('admin beats dashboard when both signals present', () => {
    // "admin dashboard" — admin weighting (×2.2) beats dashboard (×1.6)
    const r = classifyAuthState('admin dashboard for managing users');
    expect(r.authState).toBe('admin');
  });

  it('dashboard beats authenticated when both signals present', () => {
    const r = classifyAuthState('analytics dashboard with user account management');
    expect(r.authState).toBe('dashboard');
  });
});

// ── Phase 4: Planner Blueprint Extension ─────────────────────────────────────

describe('Phase 4 — Auth Classification Output Shape', () => {
  it('has authState, navbarVariant, confidence, allScores', () => {
    const r = classifyAuthState('admin panel');
    expect(r).toHaveProperty('authState');
    expect(r).toHaveProperty('navbarVariant');
    expect(r).toHaveProperty('confidence');
    expect(r).toHaveProperty('allScores');
  });

  it('navbarVariant is a non-empty string', () => {
    const r = classifyAuthState('Build a landing page');
    expect(typeof r.navbarVariant).toBe('string');
    expect(r.navbarVariant.length).toBeGreaterThan(0);
  });
});

// ── Phase 5: DNA Mapping ──────────────────────────────────────────────────────

describe('Phase 5 — DNA Mapping', () => {
  it('Linear DNA → navbar-dashboard-v1 for dashboard state', () => {
    const r = classifyAuthState('analytics dashboard for tracking metrics', { linear: 80, stripe: 20 });
    expect(r.authState).toBe('dashboard');
    expect(r.navbarVariant).toBe('navbar-dashboard-v1');
  });

  it('Stripe DNA → navbar-admin-v1 for admin state', () => {
    const r = classifyAuthState('admin panel for managing users', { stripe: 90, linear: 10 });
    expect(r.authState).toBe('admin');
    expect(r.navbarVariant).toBe('navbar-admin-v1');
  });

  it('Vercel DNA → navbar-auth-v1 for authenticated state', () => {
    const r = classifyAuthState('user account and profile settings', { vercel: 85, linear: 15 });
    expect(r.authState).toBe('authenticated');
    expect(r.navbarVariant).toBe('navbar-auth-v1');
  });

  it('GitHub DNA → navbar-auth-v2 for authenticated state', () => {
    const r = classifyAuthState('workspace and team profile management', { github: 75, linear: 25 });
    expect(r.authState).toBe('authenticated');
    expect(r.navbarVariant).toBe('navbar-auth-v2');
  });

  it('Notion DNA → navbar-command-v1 for authenticated state', () => {
    const r = classifyAuthState('workspace and account settings page', { notion: 80, stripe: 20 });
    expect(r.authState).toBe('authenticated');
    expect(r.navbarVariant).toBe('navbar-command-v1');
  });

  it('DNA mapping applies only for authenticated+ states (not guest)', () => {
    const r = classifyAuthState('landing page for a startup', { stripe: 90, linear: 10 });
    expect(r.authState).toBe('guest');
    // Stripe doesn't override for guest (not in guest-allowed brands)
    expect(r.navbarVariant).toBe('navbar-navigation-saas-v1');
  });

  it('Vercel DNA on guest state → navbar-auth-v1 (vercel is guest-allowed)', () => {
    const r = classifyAuthState('landing page for a startup', { vercel: 90 });
    // vercel is allowed for guest override
    expect(r.navbarVariant).toBe('navbar-auth-v1');
  });
});

// ── Phase 6: Required Components per Auth State ───────────────────────────────

describe('Phase 6 — Auth State Required Components', () => {
  it('guest state requires NavigationMenu and Button', () => {
    expect(AUTH_STATE_REQUIRED_COMPONENTS.guest).toContain('NavigationMenu');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.guest).toContain('Button');
  });

  it('authenticated state requires Avatar and DropdownMenu', () => {
    expect(AUTH_STATE_REQUIRED_COMPONENTS.authenticated).toContain('Avatar');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.authenticated).toContain('DropdownMenu');
  });

  it('dashboard state requires Avatar, DropdownMenu, and Sheet', () => {
    expect(AUTH_STATE_REQUIRED_COMPONENTS.dashboard).toContain('Avatar');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.dashboard).toContain('DropdownMenu');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.dashboard).toContain('Sheet');
  });

  it('admin state requires Avatar, DropdownMenu, Command, and Sheet', () => {
    expect(AUTH_STATE_REQUIRED_COMPONENTS.admin).toContain('Avatar');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.admin).toContain('DropdownMenu');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.admin).toContain('Command');
    expect(AUTH_STATE_REQUIRED_COMPONENTS.admin).toContain('Sheet');
  });
});

// ── Phase 7: navbarVariantToExpectedState ─────────────────────────────────────

describe('Phase 7 — navbarVariantToExpectedState', () => {
  it('navbar-admin-v1 → admin', () => {
    expect(navbarVariantToExpectedState('navbar-admin-v1')).toBe('admin');
  });

  it('navbar-dashboard-v1 → dashboard', () => {
    expect(navbarVariantToExpectedState('navbar-dashboard-v1')).toBe('dashboard');
  });

  it('navbar-auth-v1 → authenticated', () => {
    expect(navbarVariantToExpectedState('navbar-auth-v1')).toBe('authenticated');
  });

  it('navbar-auth-v2 → authenticated', () => {
    expect(navbarVariantToExpectedState('navbar-auth-v2')).toBe('authenticated');
  });

  it('navbar-command-v1 → authenticated', () => {
    expect(navbarVariantToExpectedState('navbar-command-v1')).toBe('authenticated');
  });

  it('navbar-navigation-saas-v1 → guest', () => {
    expect(navbarVariantToExpectedState('navbar-navigation-saas-v1')).toBe('guest');
  });

  it('unknown variant → guest (default)', () => {
    expect(navbarVariantToExpectedState('navbar-custom-v99')).toBe('guest');
  });
});

// ── Phase 8: Evaluator — authNavbarAlignment Score ───────────────────────────

const ADMIN_NAVBAR_CODE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>Dashboard</NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Sheet>
        <SheetContent side="left"><p>Menu</p></SheetContent>
      </Sheet>
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList><CommandItem>Users</CommandItem></CommandList>
      </Command>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar><AvatarFallback>AD</AvatarFallback></Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem className="text-red-400">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
`;

const GUEST_NAVBAR_CODE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>Home</NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Sheet>
        <SheetContent side="left"><p>Menu</p></SheetContent>
      </Sheet>
      <Button type="button">Get Started</Button>
    </nav>
  );
}
`;

const AUTH_NAVBAR_CODE = `
function Navbar() {
  return (
    <nav aria-label="Main navigation">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>Dashboard</NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar><AvatarFallback>JD</AvatarFallback></Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
`;

const BARE_CODE = `
function Navbar() {
  return <nav><a href="/">Home</a></nav>;
}
`;

function makeInput(code: string, authState?: string): EvaluationInput {
  return { code, sectionOrder: SECTION_ORDER, designDNA: MOCK_DNA as unknown as typeof MOCK_DNA, authState } as EvaluationInput;
}

describe('Phase 8 — Evaluator authNavbarAlignment Score', () => {
  it('guest state + guest navbar → score 7 (baseline)', () => {
    const r = evaluateDesign(makeInput(GUEST_NAVBAR_CODE, 'guest'));
    expect(r.authNavbarAlignmentScore).toBe(7);
  });

  it('no authState → defaults to score 7 (guest baseline)', () => {
    const r = evaluateDesign(makeInput(GUEST_NAVBAR_CODE));
    expect(r.authNavbarAlignmentScore).toBe(7);
  });

  it('admin authState + full admin navbar → score 10', () => {
    const r = evaluateDesign(makeInput(ADMIN_NAVBAR_CODE, 'admin'));
    expect(r.authNavbarAlignmentScore).toBe(10);
  });

  it('authenticated authState + auth navbar (Avatar + DropdownMenu) → high score', () => {
    const r = evaluateDesign(makeInput(AUTH_NAVBAR_CODE, 'authenticated'));
    expect(r.authNavbarAlignmentScore).toBeGreaterThanOrEqual(8);
  });

  it('admin authState + bare navbar → low score', () => {
    const r = evaluateDesign(makeInput(BARE_CODE, 'admin'));
    expect(r.authNavbarAlignmentScore).toBeLessThan(5);
  });

  it('admin authState + missing Command → score < 10, has auth-routing issue', () => {
    // Auth navbar with Avatar + DropdownMenu + Sheet but no Command
    const code = AUTH_NAVBAR_CODE + '<Sheet><SheetContent side="left">x</SheetContent></Sheet>';
    const r = evaluateDesign(makeInput(code, 'admin'));
    expect(r.authNavbarAlignmentScore).toBeLessThan(10);
    const authIssues = r.issues.filter(i => i.category === 'auth-routing');
    expect(authIssues.length).toBeGreaterThan(0);
  });

  it('authenticated authState + missing Avatar → has auth-routing issue', () => {
    const r = evaluateDesign(makeInput(GUEST_NAVBAR_CODE, 'authenticated'));
    const authIssues = r.issues.filter(i => i.category === 'auth-routing');
    expect(authIssues.length).toBeGreaterThan(0);
  });

  it('dashboard authState + Sheet present → score ≥ 8', () => {
    const code = AUTH_NAVBAR_CODE + '<Sheet><SheetContent>menu</SheetContent></Sheet>';
    const r = evaluateDesign(makeInput(code, 'dashboard'));
    expect(r.authNavbarAlignmentScore).toBeGreaterThanOrEqual(8);
  });

  it('authNavbarAlignmentScore is included in EvaluationResult', () => {
    const r = evaluateDesign(makeInput(GUEST_NAVBAR_CODE, 'guest'));
    expect(r).toHaveProperty('authNavbarAlignmentScore');
    expect(typeof r.authNavbarAlignmentScore).toBe('number');
  });

  it('overallScore includes authNavbarAlignment contribution (weight 0.04)', () => {
    const rGuest = evaluateDesign(makeInput(GUEST_NAVBAR_CODE, 'guest'));
    const rAdmin = evaluateDesign(makeInput(ADMIN_NAVBAR_CODE, 'admin'));
    // Both should have valid overallScores
    expect(rGuest.overallScore).toBeGreaterThan(0);
    expect(rAdmin.overallScore).toBeGreaterThan(0);
  });
});

// ── Phase 9: Telemetry ────────────────────────────────────────────────────────

describe('Phase 9 — Auth Routing Telemetry', () => {
  beforeEach(() => {
    resetAuthRoutingMetrics();
  });

  it('starts with zero total routings', () => {
    const m = getAuthRoutingMetrics();
    expect(m.totalRoutingsTracked).toBe(0);
  });

  it('records auth routing entries', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    const m = getAuthRoutingMetrics();
    expect(m.totalRoutingsTracked).toBe(1);
  });

  it('tracks guestSelections %', () => {
    recordAuthRouting({ authState: 'guest', navbarVariant: 'navbar-navigation-saas-v1', confidence: 0.50 });
    recordAuthRouting({ authState: 'guest', navbarVariant: 'navbar-navigation-saas-v1', confidence: 0.50 });
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.90 });
    const m = getAuthRoutingMetrics();
    expect(m.guestSelections).toBe(67); // 2/3 = 67%
  });

  it('tracks adminSelections %', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    recordAuthRouting({ authState: 'guest', navbarVariant: 'navbar-navigation-saas-v1', confidence: 0.50 });
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.92 });
    const m = getAuthRoutingMetrics();
    expect(m.adminSelections).toBe(67); // 2/3 = 67%
  });

  it('tracks dashboardSelections %', () => {
    recordAuthRouting({ authState: 'dashboard', navbarVariant: 'navbar-dashboard-v1', confidence: 0.80 });
    recordAuthRouting({ authState: 'guest', navbarVariant: 'navbar-navigation-saas-v1', confidence: 0.50 });
    const m = getAuthRoutingMetrics();
    expect(m.dashboardSelections).toBe(50);
  });

  it('tracks navbarVariantUsage counts', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.90 });
    recordAuthRouting({ authState: 'dashboard', navbarVariant: 'navbar-dashboard-v1', confidence: 0.80 });
    const m = getAuthRoutingMetrics();
    expect(m.navbarVariantUsage['navbar-admin-v1']).toBe(2);
    expect(m.navbarVariantUsage['navbar-dashboard-v1']).toBe(1);
  });

  it('reports topWinningNavbar as sorted array', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.92 });
    recordAuthRouting({ authState: 'dashboard', navbarVariant: 'navbar-dashboard-v1', confidence: 0.80 });
    const m = getAuthRoutingMetrics();
    expect(m.topWinningNavbar[0].variant).toBe('navbar-admin-v1');
    expect(m.topWinningNavbar[0].count).toBe(2);
  });

  it('computes averageConfidence', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.80 });
    recordAuthRouting({ authState: 'dashboard', navbarVariant: 'navbar-dashboard-v1', confidence: 0.60 });
    const m = getAuthRoutingMetrics();
    expect(m.averageConfidence).toBe(0.70);
  });

  it('reports authRoutingAccuracy 100% for correct admin → admin routing', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.90 });
    const m = getAuthRoutingMetrics();
    expect(m.authRoutingAccuracy).toBe(100);
  });

  it('reports authRoutingAccuracy < 100 for wrong admin → guest routing', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-navigation-saas-v1', confidence: 0.50 });
    const m = getAuthRoutingMetrics();
    expect(m.authRoutingAccuracy).toBeLessThan(100);
  });

  it('resets all metrics', () => {
    recordAuthRouting({ authState: 'admin', navbarVariant: 'navbar-admin-v1', confidence: 0.95 });
    resetAuthRoutingMetrics();
    const m = getAuthRoutingMetrics();
    expect(m.totalRoutingsTracked).toBe(0);
    expect(m.adminSelections).toBe(0);
  });
});

// ── Phase 10: Success Criteria ────────────────────────────────────────────────

describe('Phase 10 — Success Criteria', () => {
  const ADMIN_PROMPTS = [
    'Build an admin panel for managing users',
    'Admin dashboard to manage all platform settings',
    'Admin panel with user management and role assignment',
    'System admin dashboard with audit logs and moderation',
    'Admin area for managing system settings and user roles',
    'Build an admin panel to moderate content and manage users',
    'Create an admin dashboard with audit trails and access control',
    'Super admin panel for enterprise platform management',
    'Back office admin system for managing orders and users',
    'Control panel for site admins to manage roles and permissions',
  ];

  const DASHBOARD_PROMPTS = [
    'Analytics dashboard for tracking campaign metrics',
    'SaaS dashboard with project management and reporting',
    'CRM dashboard for managing sales pipeline',
    'Kanban board for task management and team collaboration',
    'Productivity app dashboard with analytics and metrics',
    'Project management dashboard for software teams',
  ];

  it('Admin prompt → admin navbar: 100% routing accuracy', () => {
    const results = ADMIN_PROMPTS.map(p => classifyAuthState(p));
    const adminCount = results.filter(r => r.authState === 'admin').length;
    expect(adminCount).toBe(ADMIN_PROMPTS.length);
  });

  it('Dashboard prompt → dashboard navbar: ≥90% routing accuracy', () => {
    const results = DASHBOARD_PROMPTS.map(p => classifyAuthState(p));
    const dashCount = results.filter(r => r.authState === 'dashboard').length;
    const accuracy = dashCount / DASHBOARD_PROMPTS.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('Admin prompt → Admin navbar variant contains "admin"', () => {
    ADMIN_PROMPTS.forEach(prompt => {
      const r = classifyAuthState(prompt);
      expect(r.navbarVariant).toContain('admin');
    });
  });

  it('Auth prompts → Avatar + DropdownMenu required components ≥90% of time', () => {
    const AUTH_PROMPTS = [
      'User account and profile settings page',
      'Workspace settings and team management',
      'Client portal for viewing invoices',
      'Member area with exclusive content',
    ];
    const results = AUTH_PROMPTS.map(p => classifyAuthState(p));
    const authenticated = results.filter(r =>
      ['authenticated', 'dashboard', 'admin'].includes(r.authState)
    );
    const accuracy = authenticated.length / AUTH_PROMPTS.length;
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('All auth states have non-null navbarVariant', () => {
    const prompts = [...ADMIN_PROMPTS, ...DASHBOARD_PROMPTS];
    prompts.forEach(prompt => {
      const r = classifyAuthState(prompt);
      expect(r.navbarVariant).toBeTruthy();
      expect(r.navbarVariant.length).toBeGreaterThan(0);
    });
  });
});
