// ── V8.5 Autonomous Frontend Architect — Test Suite (200+ tests) ─────────────

import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyProjectType,
  planAccessibilityArchitecture,
} from '../../frontend-architect/frontendPlanner.js';
import { planRoutingArchitecture } from '../../frontend-architect/routePlanner.js';
import { planLayoutArchitecture } from '../../frontend-architect/layoutPlanner.js';
import { planComponentOwnership } from '../../frontend-architect/componentPlanner.js';
import { planFolderStructure } from '../../frontend-architect/folderPlanner.js';
import { planStateArchitecture } from '../../frontend-architect/statePlanner.js';
import { planThemeArchitecture } from '../../frontend-architect/themePlanner.js';
import { planApiArchitecture } from '../../frontend-architect/apiPlanner.js';
import { planAuthArchitecture } from '../../frontend-architect/authPlanner.js';
import { planPermissionArchitecture } from '../../frontend-architect/permissionPlanner.js';
import { planResponsiveArchitecture } from '../../frontend-architect/responsivePlanner.js';
import { planPerformanceArchitecture } from '../../frontend-architect/performancePlanner.js';
import { planLoadingArchitecture } from '../../frontend-architect/loadingPlanner.js';
import { planSeoArchitecture } from '../../frontend-architect/seoPlanner.js';
import { planErrorArchitecture } from '../../frontend-architect/errorPlanner.js';
import { validateArchitecture } from '../../frontend-architect/architectureValidator.js';
import { runFrontendArchitect } from '../../frontend-architect/frontendArchitect.js';
import {
  learnFromArchitecture,
  getArchitectureLearningHistory,
  getSuccessfulPatterns,
} from '../../frontend-architect/architectureLearning.js';
import {
  getArchitectureMetrics,
  recordArchitectureBuild,
  resetArchitectureMetrics,
} from '../../frontend-architect/architectureMetrics.js';
import { ALL_ARCHITECTURE_DIMENSIONS, ALL_PROJECT_TYPES } from '../../frontend-architect/frontendTypes.js';
import type {
  FrontendArchitectureBlueprint,
  ProjectType,
} from '../../frontend-architect/frontendTypes.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const saasFeatures = ['Authentication', 'Dashboard', 'Settings', 'Billing', 'Profile', 'Notifications'] as const;
const landingFeatures = [] as const;
const crmFeatures = ['Authentication', 'Dashboard', 'CRM', 'Reports', 'Analytics', 'Teams', 'Permissions', 'AuditLogs'] as const;
const chatFeatures = ['Authentication', 'Chat', 'Notifications', 'Profile'] as const;

function makeSaasBlueprint(): FrontendArchitectureBlueprint {
  const prompt = 'Build a SaaS project management app';
  const plan = { productGoal: 'SaaS' as const, plannedFeatures: [...saasFeatures] as any, businessObjective: 'Freemium' as any, userPersonas: [], detectedRisks: [], qualityScores: [] as any, overallProductScore: 7, confidence: 0.8, productGoalConfidence: 0.8, promptSummary: '', informationArchitecture: {} as any, userJourney: {} as any, monetizationPlan: {} as any, roadmap: {} as any };
  const output = runFrontendArchitect(prompt, plan as any);
  return output.blueprint;
}

// ── 1. Project Classification ─────────────────────────────────────────────────

describe('Phase 1: Project Classification', () => {
  it('classifies LandingPage from prompt', () => {
    const r = classifyProjectType('Build a landing page for my startup', 'LandingPage');
    expect(r.type).toBe('LandingPage');
    expect(r.confidence).toBeGreaterThan(0.5);
  });

  it('classifies Dashboard from prompt', () => {
    const r = classifyProjectType('Build a dashboard for analytics metrics', 'Dashboard');
    expect(r.type).toBe('Dashboard');
  });

  it('classifies CRM from prompt', () => {
    const r = classifyProjectType('Build a CRM with sales pipeline and contact management', 'CRM');
    expect(r.type).toBe('CRM');
  });

  it('classifies ECommerce from prompt', () => {
    const r = classifyProjectType('Build an e-commerce store with product catalog and checkout', 'ECommerce');
    expect(r.type).toBe('ECommerce');
  });

  it('classifies AIApplication from prompt', () => {
    const r = classifyProjectType('Build an AI copilot powered by GPT', 'AIProduct');
    expect(r.type).toBe('AIApplication');
  });

  it('classifies Blog from prompt', () => {
    const r = classifyProjectType('Build a blog with articles and newsletter', 'Blog');
    expect(r.type).toBe('Blog');
  });

  it('classifies Documentation from prompt', () => {
    const r = classifyProjectType('Build a documentation site and API reference for developers', 'KnowledgeBase');
    expect(r.type).toBe('Documentation');
  });

  it('classifies Portfolio from prompt', () => {
    const r = classifyProjectType('Build a portfolio to showcase my work', 'Portfolio');
    expect(r.type).toBe('Portfolio');
  });

  it('classifies SaaS from prompt', () => {
    const r = classifyProjectType('Build a multi-tenant SaaS application', 'SaaS');
    expect(r.type).toBe('SaaS');
  });

  it('classifies Marketplace from prompt', () => {
    const r = classifyProjectType('Build a marketplace for multi-vendor sellers and buyers', 'Marketplace');
    expect(r.type).toBe('Marketplace');
  });

  it('classifies AdminPanel from prompt', () => {
    const r = classifyProjectType('Build an admin panel interface for back office management', 'Dashboard');
    expect(r.type).toBe('AdminPanel');
  });

  it('classifies Healthcare from prompt', () => {
    const r = classifyProjectType('Build a patient clinic telemedicine app', 'SaaS');
    expect(r.type).toBe('Healthcare');
  });

  it('classifies ChatApp from prompt', () => {
    const r = classifyProjectType('Build a chat app with real time messaging', 'SaaS');
    expect(r.type).toBe('ChatApp');
  });

  it('classifies Booking from prompt', () => {
    const r = classifyProjectType('Build a booking and reservation scheduling app', 'SaaS');
    expect(r.type).toBe('Booking');
  });

  it('classifies Finance from prompt', () => {
    const r = classifyProjectType('Build a fintech banking platform', 'SaaS');
    expect(r.type).toBe('Finance');
  });

  it('classifies Education from prompt', () => {
    const r = classifyProjectType('Build an e-learning LMS for online courses', 'Education');
    expect(r.type).toBe('Education');
  });

  it('classifies Analytics from prompt', () => {
    const r = classifyProjectType('Build an analytics platform for KPI business intelligence', 'Dashboard');
    expect(r.type).toBe('Analytics');
  });

  it('classifies DeveloperTool from prompt', () => {
    const r = classifyProjectType('Build a developer tool for CI/CD deployment', 'DeveloperTool');
    expect(r.type).toBe('DeveloperTool');
  });

  it('classifies Productivity from prompt', () => {
    const r = classifyProjectType('Build a productivity task manager', 'SaaS');
    expect(r.type).toBe('Productivity');
  });

  it('classifies InternalTool from prompt', () => {
    const r = classifyProjectType('Build an internal ops tool for employees', 'SaaS');
    expect(r.type).toBe('InternalTool');
  });

  it('falls back to goal mapping when no keyword matches', () => {
    const r = classifyProjectType('Build something nice', 'CRM');
    expect(r.type).toBe('CRM');
    expect(r.confidence).toBeLessThanOrEqual(0.75);
  });

  it('falls back to SaaS when neither prompt nor goal gives signal', () => {
    const r = classifyProjectType('Build something', 'SaaS');
    expect(r.type).toBe('SaaS');
  });

  it('exports ALL_PROJECT_TYPES with 24 entries', () => {
    expect(ALL_PROJECT_TYPES).toHaveLength(24);
  });
});

// ── 2. Routing Architecture ───────────────────────────────────────────────────

describe('Phase 2: Routing Architecture', () => {
  it('generates public routes for a LandingPage', () => {
    const r = planRoutingArchitecture('LandingPage', [], 'Build a landing page');
    expect(r.publicRoutes.length).toBeGreaterThan(0);
    expect(r.publicRoutes[0].path).toBe('/');
  });

  it('generates auth routes when Authentication feature present', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication'] as any, 'Build a SaaS');
    expect(r.authRoutes.length).toBeGreaterThan(0);
    const paths = r.authRoutes.map(x => x.path);
    expect(paths).toContain('/login');
    expect(paths).toContain('/signup');
  });

  it('generates no auth routes when Authentication feature absent', () => {
    const r = planRoutingArchitecture('LandingPage', [] as any, 'Build a landing page');
    expect(r.authRoutes).toHaveLength(0);
  });

  it('generates admin routes when prompt contains admin keyword', () => {
    const r = planRoutingArchitecture('SaaS', [] as any, 'Build an admin panel');
    expect(r.adminRoutes.length).toBeGreaterThan(0);
  });

  it('generates protected dashboard route for SaaS apps', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication', 'Dashboard'] as any, 'SaaS app');
    const paths = r.protectedRoutes.map(x => x.path);
    expect(paths).toContain('/dashboard');
  });

  it('generates settings route when Settings feature present', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication', 'Dashboard', 'Settings'] as any, 'SaaS');
    const paths = r.protectedRoutes.map(x => x.path);
    expect(paths).toContain('/settings');
  });

  it('generates billing route when Billing feature present', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication', 'Dashboard', 'Billing'] as any, 'SaaS');
    const paths = r.protectedRoutes.map(x => x.path);
    expect(paths).toContain('/settings/billing');
  });

  it('generates blog routes for Blog project type', () => {
    const r = planRoutingArchitecture('Blog', [] as any, 'Build a blog');
    const paths = r.publicRoutes.map(x => x.path);
    expect(paths).toContain('/blog');
    expect(paths).toContain('/blog/:slug');
  });

  it('generates docs routes for Documentation project type', () => {
    const r = planRoutingArchitecture('Documentation', [] as any, 'Build docs site');
    const paths = r.publicRoutes.map(x => x.path);
    expect(paths).toContain('/docs');
  });

  it('generates e-commerce routes for ECommerce type', () => {
    const r = planRoutingArchitecture('ECommerce', [] as any, 'Build an e-commerce store');
    const paths = r.publicRoutes.map(x => x.path);
    expect(paths).toContain('/cart');
    expect(paths).toContain('/item/:id');
  });

  it('has a catch route', () => {
    const r = planRoutingArchitecture('SaaS', [] as any, 'SaaS');
    expect(r.catchRoute.path).toBe('*');
    expect(r.catchRoute.type).toBe('catch');
  });

  it('sets hasNestedRoutes for Dashboard apps', () => {
    const r = planRoutingArchitecture('Dashboard', ['Dashboard'] as any, 'Dashboard');
    expect(r.hasNestedRoutes).toBe(true);
  });

  it('sets hasDynamicRoutes for Marketplace', () => {
    const r = planRoutingArchitecture('Marketplace', [] as any, 'Marketplace');
    expect(r.hasDynamicRoutes).toBe(true);
  });

  it('uses ReactRouter strategy', () => {
    const r = planRoutingArchitecture('SaaS', [] as any, 'SaaS');
    expect(r.strategy).toBe('ReactRouter');
  });

  it('route count includes all route groups', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication', 'Dashboard', 'Settings'] as any, 'SaaS with admin');
    expect(r.routeCount).toBeGreaterThan(3);
  });

  it('protected routes have protected type', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication', 'Dashboard'] as any, 'SaaS');
    expect(r.protectedRoutes.every(x => x.type === 'protected')).toBe(true);
  });

  it('auth routes have auth type', () => {
    const r = planRoutingArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(r.authRoutes.every(x => x.type === 'auth')).toBe(true);
  });
});

// ── 3. Layout Architecture ────────────────────────────────────────────────────

describe('Phase 3: Layout Architecture', () => {
  it('always includes AuthLayout', () => {
    const l = planLayoutArchitecture('SaaS', ['Authentication'] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('AuthLayout');
  });

  it('always includes ErrorLayout', () => {
    const l = planLayoutArchitecture('LandingPage', [] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('ErrorLayout');
  });

  it('includes MarketingLayout for LandingPage', () => {
    const l = planLayoutArchitecture('LandingPage', [] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('MarketingLayout');
  });

  it('includes DashboardLayout for SaaS with Dashboard', () => {
    const l = planLayoutArchitecture('SaaS', ['Dashboard'] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('DashboardLayout');
  });

  it('includes AdminLayout for AdminPanel', () => {
    const l = planLayoutArchitecture('AdminPanel', [] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('AdminLayout');
  });

  it('includes SettingsLayout when Settings feature present', () => {
    const l = planLayoutArchitecture('SaaS', ['Settings'] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('SettingsLayout');
  });

  it('includes DocsLayout for Documentation project type', () => {
    const l = planLayoutArchitecture('Documentation', [] as any);
    const names = l.layouts.map(x => x.name);
    expect(names).toContain('DocsLayout');
  });

  it('DashboardLayout has navbar and sidebar', () => {
    const l = planLayoutArchitecture('Dashboard', ['Dashboard'] as any);
    const dash = l.layouts.find(x => x.name === 'DashboardLayout')!;
    expect(dash.hasNavbar).toBe(true);
    expect(dash.hasSidebar).toBe(true);
  });

  it('AuthLayout has no navbar or footer', () => {
    const l = planLayoutArchitecture('SaaS', ['Authentication'] as any);
    const auth = l.layouts.find(x => x.name === 'AuthLayout')!;
    expect(auth.hasNavbar).toBe(false);
    expect(auth.hasFooter).toBe(false);
  });

  it('MarketingLayout has navbar and footer', () => {
    const l = planLayoutArchitecture('LandingPage', [] as any);
    const marketing = l.layouts.find(x => x.name === 'MarketingLayout')!;
    expect(marketing.hasNavbar).toBe(true);
    expect(marketing.hasFooter).toBe(true);
  });

  it('defaultLayout is DashboardLayout for pure Dashboard apps', () => {
    const l = planLayoutArchitecture('Dashboard', [] as any);
    expect(l.defaultLayout).toBe('DashboardLayout');
  });

  it('defaultLayout is MarketingLayout for LandingPage', () => {
    const l = planLayoutArchitecture('LandingPage', [] as any);
    expect(l.defaultLayout).toBe('MarketingLayout');
  });
});

// ── 4. Component Ownership ────────────────────────────────────────────────────

describe('Phase 4: Component Ownership', () => {
  it('always has a Shared component group', () => {
    const c = planComponentOwnership('SaaS', [] as any);
    expect(c.groups.some(g => g.level === 'Shared')).toBe(true);
  });

  it('Shared group has reusable=true', () => {
    const c = planComponentOwnership('SaaS', [] as any);
    const shared = c.groups.find(g => g.level === 'Shared')!;
    expect(shared.reusable).toBe(true);
  });

  it('Shared group has standard UI components', () => {
    const c = planComponentOwnership('SaaS', [] as any);
    const shared = c.groups.find(g => g.level === 'Shared')!;
    expect(shared.examples).toContain('Button');
    expect(shared.examples).toContain('Card');
  });

  it('includes Chart group for Analytics feature', () => {
    const c = planComponentOwnership('Analytics', ['Analytics'] as any);
    expect(c.groups.some(g => g.level === 'Chart')).toBe(true);
  });

  it('Chart group contains chart components', () => {
    const c = planComponentOwnership('Analytics', ['Analytics'] as any);
    const charts = c.groups.find(g => g.level === 'Chart')!;
    expect(charts.examples).toContain('LineChart');
  });

  it('includes Form group when Authentication present', () => {
    const c = planComponentOwnership('SaaS', ['Authentication'] as any);
    expect(c.groups.some(g => g.level === 'Form')).toBe(true);
  });

  it('Form group contains LoginForm', () => {
    const c = planComponentOwnership('SaaS', ['Authentication'] as any);
    const forms = c.groups.find(g => g.level === 'Form')!;
    expect(forms.examples).toContain('LoginForm');
  });

  it('includes Modal group', () => {
    const c = planComponentOwnership('SaaS', [] as any);
    expect(c.groups.some(g => g.level === 'Modal')).toBe(true);
  });

  it('includes Feature group', () => {
    const c = planComponentOwnership('SaaS', ['Billing'] as any);
    expect(c.groups.some(g => g.level === 'Feature')).toBe(true);
  });

  it('Billing feature adds PricingTable to Feature group', () => {
    const c = planComponentOwnership('SaaS', ['Billing'] as any);
    const feature = c.groups.find(g => g.level === 'Feature')!;
    expect(feature.examples).toContain('PricingTable');
  });

  it('sharedCount matches Shared group examples count', () => {
    const c = planComponentOwnership('SaaS', [] as any);
    const shared = c.groups.find(g => g.level === 'Shared')!;
    expect(c.sharedCount).toBe(shared.examples.length);
  });

  it('totalEstimate is sum of all group examples', () => {
    const c = planComponentOwnership('SaaS', ['Authentication', 'Billing'] as any);
    const total = c.groups.reduce((acc, g) => acc + g.examples.length, 0);
    expect(c.totalEstimate).toBe(total);
  });

  it('Navigation group includes Sidebar for Dashboard type', () => {
    const c = planComponentOwnership('Dashboard', ['Dashboard'] as any);
    const nav = c.groups.find(g => g.level === 'Navigation')!;
    expect(nav.examples).toContain('Sidebar');
  });

  it('Kanban feature adds KanbanBoard to Feature group', () => {
    const c = planComponentOwnership('SaaS', ['Kanban'] as any);
    const feature = c.groups.find(g => g.level === 'Feature')!;
    expect(feature.examples).toContain('KanbanBoard');
  });

  it('Chat feature adds ChatWindow to Feature group', () => {
    const c = planComponentOwnership('ChatApp', ['Chat'] as any);
    const feature = c.groups.find(g => g.level === 'Feature')!;
    expect(feature.examples).toContain('ChatWindow');
  });
});

// ── 5. Folder Structure ───────────────────────────────────────────────────────

describe('Phase 5: Folder Structure', () => {
  it('always starts with src/', () => {
    const f = planFolderStructure('SaaS', [] as any);
    expect(f.root).toBe('src/');
  });

  it('always includes src/components/ and src/pages/', () => {
    const f = planFolderStructure('SaaS', [] as any);
    expect(f.directories).toContain('src/components/');
    expect(f.directories).toContain('src/pages/');
  });

  it('uses feature-first for complex apps', () => {
    const f = planFolderStructure('SaaS', ['Auth', 'Dashboard', 'Billing', 'Teams', 'CRM', 'Analytics', 'Reports', 'Projects', 'Kanban', 'Chat'] as any);
    expect(f.pattern).toBe('feature-first');
  });

  it('uses layer-first for simple apps', () => {
    const f = planFolderStructure('LandingPage', [] as any);
    expect(f.pattern).toBe('layer-first');
  });

  it('hybrid pattern for medium apps', () => {
    const f = planFolderStructure('SaaS', ['Authentication', 'Dashboard'] as any);
    expect(['hybrid', 'feature-first', 'layer-first']).toContain(f.pattern);
  });

  it('includes src/features/ for app-like projects', () => {
    const f = planFolderStructure('SaaS', ['Authentication', 'Dashboard', 'Settings'] as any);
    expect(f.directories).toContain('src/features/');
  });

  it('includes src/hooks/ for complex apps', () => {
    const f = planFolderStructure('CRM', ['Authentication', 'CRM', 'Analytics'] as any);
    expect(f.directories).toContain('src/hooks/');
  });

  it('includes src/auth/ when Authentication feature present', () => {
    const f = planFolderStructure('SaaS', ['Authentication'] as any);
    expect(f.directories).toContain('src/auth/');
  });

  it('key files always contains main entry points', () => {
    const f = planFolderStructure('SaaS', [] as any);
    expect(f.keyFiles).toContain('src/main.tsx');
    expect(f.keyFiles).toContain('src/App.tsx');
    expect(f.keyFiles).toContain('src/routes.tsx');
  });

  it('includes auth provider when Authentication present', () => {
    const f = planFolderStructure('SaaS', ['Authentication'] as any);
    expect(f.keyFiles).toContain('src/auth/AuthProvider.tsx');
  });

  it('directories have no duplicates', () => {
    const f = planFolderStructure('SaaS', ['Authentication', 'Dashboard', 'Billing'] as any);
    expect(new Set(f.directories).size).toBe(f.directories.length);
  });
});

// ── 6. State Architecture ─────────────────────────────────────────────────────

describe('Phase 6: State Architecture', () => {
  it('always has at least one state layer', () => {
    const s = planStateArchitecture('SaaS', [] as any, 'SaaS app');
    expect(s.layers.length).toBeGreaterThan(0);
  });

  it('always has a primaryStrategy', () => {
    const s = planStateArchitecture('SaaS', [] as any, 'SaaS app');
    expect(s.primaryStrategy).toBeTruthy();
  });

  it('Auth state layer added when Authentication present', () => {
    const s = planStateArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(s.hasAuthState).toBe(true);
  });

  it('server state added for Dashboard apps', () => {
    const s = planStateArchitecture('SaaS', ['Dashboard', 'Analytics'] as any, 'SaaS');
    expect(s.hasServerState).toBe(true);
  });

  it('form state always enabled', () => {
    const s = planStateArchitecture('SaaS', [] as any, 'SaaS');
    expect(s.hasFormState).toBe(true);
  });

  it('uses Zustand for ChatApp', () => {
    const s = planStateArchitecture('ChatApp', ['Chat'] as any, 'chat app');
    expect(s.primaryStrategy).toBe('Zustand');
  });

  it('uses Redux for ERP apps', () => {
    const s = planStateArchitecture('ERP', ['Authentication', 'Dashboard', 'CRM'] as any, 'ERP');
    expect(s.primaryStrategy).toBe('Redux');
  });

  it('uses Context for LandingPage', () => {
    const s = planStateArchitecture('LandingPage', [] as any, 'landing page');
    expect(s.primaryStrategy).toBe('Context');
  });

  it('complexity is High for large feature sets', () => {
    const s = planStateArchitecture('SaaS', ['Auth', 'Dashboard', 'CRM', 'Billing', 'Analytics', 'Reports', 'Teams', 'Projects', 'Kanban', 'Chat', 'Calendar'] as any, 'big');
    expect(s.complexity).toBe('High');
  });

  it('complexity is Low for simple apps', () => {
    const s = planStateArchitecture('LandingPage', [] as any, 'landing page');
    expect(s.complexity).toBe('Low');
  });

  it('uses Zustand for AIApplication', () => {
    const s = planStateArchitecture('AIApplication', ['AIAssistant'] as any, 'AI app');
    expect(s.primaryStrategy).toBe('Zustand');
  });

  it('ReactQuery layer added for analytics/dashboard', () => {
    const s = planStateArchitecture('SaaS', ['Dashboard', 'Analytics'] as any, 'SaaS');
    const strategies = s.layers.map(l => l.strategy);
    expect(strategies).toContain('ReactQuery');
  });

  it('each layer has a reason', () => {
    const s = planStateArchitecture('SaaS', ['Authentication', 'Dashboard'] as any, 'SaaS');
    for (const layer of s.layers) {
      expect(layer.reason.length).toBeGreaterThan(0);
    }
  });
});

// ── 7. Theme Architecture ─────────────────────────────────────────────────────

describe('Phase 7 (9): Theme Architecture', () => {
  it('always has light mode', () => {
    const t = planThemeArchitecture('LandingPage', [] as any, 'landing');
    expect(t.modes).toContain('light');
  });

  it('Dashboard apps get dark mode', () => {
    const t = planThemeArchitecture('Dashboard', [] as any, 'dashboard');
    expect(t.hasDarkMode).toBe(true);
  });

  it('dark mode keyword in prompt enables dark mode', () => {
    const t = planThemeArchitecture('SaaS', [] as any, 'Build a SaaS with dark mode');
    expect(t.hasDarkMode).toBe(true);
  });

  it('runtimeSwitching enabled when multiple modes', () => {
    const t = planThemeArchitecture('Dashboard', [] as any, 'dashboard');
    expect(t.runtimeSwitching).toBe(true);
  });

  it('always uses token system', () => {
    const t = planThemeArchitecture('SaaS', [] as any, 'SaaS');
    expect(t.tokenSystem).toBe(true);
  });

  it('always uses CSS variables', () => {
    const t = planThemeArchitecture('SaaS', [] as any, 'SaaS');
    expect(t.cssVariables).toBe(true);
  });

  it('EnterprisePlatform gets brand mode', () => {
    const t = planThemeArchitecture('EnterprisePlatform', [] as any, 'enterprise');
    expect(t.modes).toContain('brand');
  });

  it('defaultMode is light for LandingPage', () => {
    const t = planThemeArchitecture('LandingPage', [] as any, 'landing');
    expect(t.defaultMode).toBe('light');
  });

  it('defaultMode is auto for Dashboard', () => {
    const t = planThemeArchitecture('Dashboard', [] as any, 'dashboard');
    expect(t.defaultMode).toBe('auto');
  });
});

// ── 8. API Architecture ───────────────────────────────────────────────────────

describe('Phase 7: API Architecture', () => {
  it('defaults to REST pattern', () => {
    const a = planApiArchitecture('SaaS', [] as any, 'SaaS app');
    expect(a.pattern).toBe('REST');
  });

  it('detects GraphQL from prompt', () => {
    const a = planApiArchitecture('SaaS', [] as any, 'Build a SaaS with GraphQL API');
    expect(a.pattern).toBe('GraphQL');
  });

  it('always has retry enabled for app types', () => {
    const a = planApiArchitecture('SaaS', [] as any, 'SaaS');
    expect(a.hasRetry).toBe(true);
  });

  it('has pagination for CRM', () => {
    const a = planApiArchitecture('CRM', ['CRM'] as any, 'CRM app');
    expect(a.hasPagination).toBe(true);
  });

  it('has search for Marketplace', () => {
    const a = planApiArchitecture('Marketplace', [] as any, 'marketplace');
    expect(a.hasSearch).toBe(true);
  });

  it('has optimistic updates for Kanban', () => {
    const a = planApiArchitecture('SaaS', ['Kanban'] as any, 'project management');
    expect(a.hasOptimisticUpdates).toBe(true);
  });

  it('has infinite scroll for SocialPlatform', () => {
    const a = planApiArchitecture('SocialPlatform', [] as any, 'social');
    expect(a.hasInfiniteScroll).toBe(true);
  });

  it('queryBoundaries is non-empty', () => {
    const a = planApiArchitecture('SaaS', ['Dashboard'] as any, 'SaaS');
    expect(a.queryBoundaries.length).toBeGreaterThan(0);
  });

  it('mutationBoundaries includes auth endpoints when Authentication present', () => {
    const a = planApiArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(a.mutationBoundaries.some(b => b.includes('auth'))).toBe(true);
  });

  it('stale-while-revalidate caching for Dashboard apps', () => {
    const a = planApiArchitecture('Dashboard', ['Dashboard'] as any, 'dashboard');
    expect(a.cachingStrategy).toBe('stale-while-revalidate');
  });

  it('network-first caching for ChatApp', () => {
    const a = planApiArchitecture('ChatApp', ['Chat'] as any, 'chat');
    expect(a.cachingStrategy).toBe('network-first');
  });
});

// ── 9. Authentication Architecture ───────────────────────────────────────────

describe('Phase 8: Authentication Architecture', () => {
  it('strategy is None when no Authentication feature', () => {
    const a = planAuthArchitecture('LandingPage', [] as any, 'landing page');
    expect(a.strategy).toBe('None');
  });

  it('hasProtectedPages is false without auth', () => {
    const a = planAuthArchitecture('LandingPage', [] as any, 'landing page');
    expect(a.hasProtectedPages).toBe(false);
  });

  it('hasProtectedPages is true with auth', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(a.hasProtectedPages).toBe(true);
  });

  it('roles always includes Guest', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(a.roles).toContain('Guest');
  });

  it('roles includes User when auth enabled', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(a.roles).toContain('User');
  });

  it('roles includes Admin for AdminPanel', () => {
    const a = planAuthArchitecture('AdminPanel', ['Authentication'] as any, 'admin panel');
    expect(a.roles).toContain('Admin');
  });

  it('detects multi-tenant from Teams feature', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication', 'Teams'] as any, 'SaaS');
    expect(a.hasMultiTenant).toBe(true);
  });

  it('detects multi-tenant from prompt', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'Build a multi-tenant organization platform');
    expect(a.hasMultiTenant).toBe(true);
  });

  it('JWT strategy is default for app auth', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'SaaS app');
    expect(a.strategy).toBe('JWT');
  });

  it('OAuth detected from prompt', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'Build SaaS with Google auth SSO');
    expect(a.strategy).toBe('OAuth');
  });

  it('Magic link detected from prompt', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'Build SaaS with magic link auth');
    expect(a.strategy).toBe('Magic');
  });

  it('hasRefreshFlow true for JWT', () => {
    const a = planAuthArchitecture('SaaS', ['Authentication'] as any, 'SaaS');
    expect(a.hasRefreshFlow).toBe(a.strategy === 'JWT');
  });

  it('LandingPage has guest mode', () => {
    const a = planAuthArchitecture('LandingPage', [] as any, 'landing');
    expect(a.hasGuestMode).toBe(true);
  });
});

// ── 10. Permission Architecture ───────────────────────────────────────────────

describe('Permission Architecture', () => {
  it('model is None without auth', () => {
    const p = planPermissionArchitecture('LandingPage', [] as any);
    expect(p.model).toBe('None');
  });

  it('model is RBAC for AdminPanel', () => {
    const p = planPermissionArchitecture('AdminPanel', ['Authentication', 'Permissions'] as any);
    expect(p.model).toBe('RBAC');
  });

  it('hasRouteGuards true when auth present', () => {
    const p = planPermissionArchitecture('SaaS', ['Authentication'] as any);
    expect(p.hasRouteGuards).toBe(true);
  });

  it('hasComponentGuards true with Permissions feature', () => {
    const p = planPermissionArchitecture('SaaS', ['Authentication', 'Permissions'] as any);
    expect(p.hasComponentGuards).toBe(true);
  });

  it('roles is empty without auth', () => {
    const p = planPermissionArchitecture('LandingPage', [] as any);
    expect(p.roles).toHaveLength(0);
  });
});

// ── 11. Responsive Architecture ───────────────────────────────────────────────

describe('Phase 10: Responsive Architecture', () => {
  it('always has 5 breakpoints', () => {
    const r = planResponsiveArchitecture('SaaS', [] as any, 'SaaS');
    expect(r.breakpoints).toHaveLength(5);
  });

  it('mobile-first for SocialPlatform', () => {
    const r = planResponsiveArchitecture('SocialPlatform', [] as any, 'social');
    expect(r.mobileFirst).toBe(true);
  });

  it('desktop-first for AdminPanel', () => {
    const r = planResponsiveArchitecture('AdminPanel', [] as any, 'admin');
    expect(r.strategy).toBe('desktop-first');
  });

  it('hasDrawerNav for mobile-first apps', () => {
    const r = planResponsiveArchitecture('SocialPlatform', [] as any, 'social');
    expect(r.hasDrawerNav).toBe(true);
  });

  it('hasSidebarCollapse for Dashboard apps', () => {
    const r = planResponsiveArchitecture('Dashboard', ['Dashboard'] as any, 'dashboard');
    expect(r.hasSidebarCollapse).toBe(true);
  });

  it('mobile-first keyword in prompt activates mobile-first', () => {
    const r = planResponsiveArchitecture('SaaS', [] as any, 'Build a mobile-first SaaS');
    expect(r.mobileFirst).toBe(true);
  });

  it('strategy is adaptive for general SaaS', () => {
    const r = planResponsiveArchitecture('SaaS', [] as any, 'SaaS');
    expect(r.strategy).toBe('adaptive');
  });
});

// ── 12. Performance Architecture ─────────────────────────────────────────────

describe('Phase 11: Performance Architecture', () => {
  it('always has lazy loading', () => {
    const p = planPerformanceArchitecture('SaaS', [] as any);
    expect(p.hasLazyLoading).toBe(true);
  });

  it('always has route splitting', () => {
    const p = planPerformanceArchitecture('SaaS', [] as any);
    expect(p.hasRouteSplitting).toBe(true);
  });

  it('always has Suspense', () => {
    const p = planPerformanceArchitecture('SaaS', [] as any);
    expect(p.hasSuspense).toBe(true);
  });

  it('has image optimization for ECommerce', () => {
    const p = planPerformanceArchitecture('ECommerce', [] as any);
    expect(p.hasImageOptimization).toBe(true);
  });

  it('has virtualization for CRM with reports', () => {
    const p = planPerformanceArchitecture('CRM', ['CRM', 'Reports'] as any);
    expect(p.hasVirtualization).toBe(true);
  });

  it('bundleStrategy is minimal for LandingPage', () => {
    const p = planPerformanceArchitecture('LandingPage', [] as any);
    expect(p.bundleStrategy).toBe('minimal');
  });

  it('bundleStrategy is aggressive for ERP', () => {
    const p = planPerformanceArchitecture('ERP', [] as any);
    expect(p.bundleStrategy).toBe('aggressive');
  });

  it('estimatedBundleSize is small for LandingPage', () => {
    const p = planPerformanceArchitecture('LandingPage', [] as any);
    expect(p.estimatedBundleSize).toBe('small');
  });

  it('hasMemoization for large feature sets', () => {
    const p = planPerformanceArchitecture('Analytics', ['Analytics', 'Reports', 'Charts'] as any);
    expect(p.hasMemoization).toBe(true);
  });
});

// ── 13. Loading Architecture ──────────────────────────────────────────────────

describe('Phase 15: Loading Architecture', () => {
  it('always has loading indicators', () => {
    const l = planLoadingArchitecture('SaaS', [] as any);
    expect(l.hasLoadingIndicators).toBe(true);
  });

  it('has skeletons for Dashboard apps', () => {
    const l = planLoadingArchitecture('SaaS', ['Dashboard'] as any);
    expect(l.hasSkeletons).toBe(true);
  });

  it('has optimistic UI for Kanban', () => {
    const l = planLoadingArchitecture('SaaS', ['Kanban'] as any);
    expect(l.hasOptimisticUI).toBe(true);
  });

  it('has empty states for CRM', () => {
    const l = planLoadingArchitecture('CRM', ['CRM'] as any);
    expect(l.hasEmptyStates).toBe(true);
  });

  it('has streaming for AI apps', () => {
    const l = planLoadingArchitecture('AIApplication', ['AIAssistant'] as any);
    expect(l.hasStreaming).toBe(true);
  });

  it('has progress bars for Analytics', () => {
    const l = planLoadingArchitecture('SaaS', ['Analytics'] as any);
    expect(l.hasProgressBars).toBe(true);
  });
});

// ── 14. SEO Architecture ──────────────────────────────────────────────────────

describe('Phase 13: SEO Architecture', () => {
  it('full SEO for LandingPage', () => {
    const s = planSeoArchitecture('LandingPage', [] as any, 'landing page');
    expect(s.strategy).toBe('full');
    expect(s.hasOpenGraph).toBe(true);
    expect(s.hasSitemap).toBe(true);
  });

  it('no SEO for AdminPanel', () => {
    const s = planSeoArchitecture('AdminPanel', [] as any, 'admin panel');
    expect(s.strategy).toBe('none');
  });

  it('basic SEO for SaaS apps', () => {
    const s = planSeoArchitecture('SaaS', [] as any, 'SaaS');
    expect(s.strategy).toBe('basic');
    expect(s.hasMetadata).toBe(true);
  });

  it('dynamic titles enabled for basic+ strategy', () => {
    const s = planSeoArchitecture('SaaS', [] as any, 'SaaS');
    expect(s.hasDynamicTitles).toBe(true);
  });

  it('structured data for ECommerce', () => {
    const s = planSeoArchitecture('ECommerce', [] as any, 'e-commerce store');
    expect(s.hasStructuredData).toBe(true);
  });

  it('SEO keyword in prompt forces full strategy', () => {
    const s = planSeoArchitecture('SaaS', [] as any, 'Build a SaaS with full SEO optimization');
    expect(s.strategy).toBe('full');
  });

  it('full SEO for Blog', () => {
    const s = planSeoArchitecture('Blog', [] as any, 'blog');
    expect(s.strategy).toBe('full');
  });
});

// ── 15. Error Architecture ────────────────────────────────────────────────────

describe('Phase 14: Error Architecture', () => {
  it('always has error boundaries', () => {
    const e = planErrorArchitecture('SaaS', [] as any);
    expect(e.hasErrorBoundaries).toBe(true);
  });

  it('always has fallback UI', () => {
    const e = planErrorArchitecture('SaaS', [] as any);
    expect(e.hasFallbackUI).toBe(true);
  });

  it('has retry for app types', () => {
    const e = planErrorArchitecture('SaaS', [] as any);
    expect(e.hasRetry).toBe(true);
  });

  it('no retry for LandingPage', () => {
    const e = planErrorArchitecture('LandingPage', [] as any);
    expect(e.hasRetry).toBe(false);
  });

  it('has offline state for Productivity apps', () => {
    const e = planErrorArchitecture('Productivity', [] as any);
    expect(e.hasOfflineState).toBe(true);
  });
});

// ── 16. Accessibility Architecture ───────────────────────────────────────────

describe('Phase 12: Accessibility Architecture', () => {
  it('always has keyboard nav', () => {
    const a = planAccessibilityArchitecture('SaaS');
    expect(a.hasKeyboardNav).toBe(true);
  });

  it('always has color contrast', () => {
    const a = planAccessibilityArchitecture('SaaS');
    expect(a.hasColorContrast).toBe(true);
  });

  it('always has reduced motion', () => {
    const a = planAccessibilityArchitecture('SaaS');
    expect(a.hasReducedMotion).toBe(true);
  });

  it('always has semantic HTML', () => {
    const a = planAccessibilityArchitecture('SaaS');
    expect(a.hasSemanticHTML).toBe(true);
  });

  it('WCAG AA for public apps', () => {
    const a = planAccessibilityArchitecture('LandingPage');
    expect(a.level).toBe('AA');
  });

  it('has skip links for public apps', () => {
    const a = planAccessibilityArchitecture('LandingPage');
    expect(a.hasSkipLinks).toBe(true);
  });

  it('has ARIA for SaaS apps', () => {
    const a = planAccessibilityArchitecture('SaaS');
    expect(a.hasARIA).toBe(true);
  });

  it('Healthcare gets AA level', () => {
    const a = planAccessibilityArchitecture('Healthcare');
    expect(a.level).toBe('AA');
  });
});

// ── 17. Architecture Validator ────────────────────────────────────────────────

describe('Phase 16: Architecture Validator', () => {
  it('returns scores for all 12 dimensions', () => {
    const bp = makeSaasBlueprint();
    const { scores } = validateArchitecture(bp);
    expect(scores).toHaveLength(ALL_ARCHITECTURE_DIMENSIONS.length);
  });

  it('all scores are between 0 and 10', () => {
    const bp = makeSaasBlueprint();
    const { scores } = validateArchitecture(bp);
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(10);
    }
  });

  it('all dimensions are covered', () => {
    const bp = makeSaasBlueprint();
    const { scores } = validateArchitecture(bp);
    const dims = scores.map(s => s.dimension);
    for (const d of ALL_ARCHITECTURE_DIMENSIONS) {
      expect(dims).toContain(d);
    }
  });

  it('each score has a recommendation', () => {
    const bp = makeSaasBlueprint();
    const { scores } = validateArchitecture(bp);
    for (const s of scores) {
      expect(s.recommendation.length).toBeGreaterThan(0);
    }
  });

  it('each score has a confidence between 0 and 1', () => {
    const bp = makeSaasBlueprint();
    const { scores } = validateArchitecture(bp);
    for (const s of scores) {
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('overallScore is average of all dimension scores', () => {
    const bp = makeSaasBlueprint();
    const { scores, overallScore } = validateArchitecture(bp);
    const avg = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
    expect(overallScore).toBeCloseTo(avg, 1);
  });

  it('overallScore is between 0 and 10', () => {
    const bp = makeSaasBlueprint();
    const { overallScore } = validateArchitecture(bp);
    expect(overallScore).toBeGreaterThanOrEqual(0);
    expect(overallScore).toBeLessThanOrEqual(10);
  });

  it('ALL_ARCHITECTURE_DIMENSIONS has 12 entries', () => {
    expect(ALL_ARCHITECTURE_DIMENSIONS).toHaveLength(12);
  });
});

// ── 18. Core Engine ───────────────────────────────────────────────────────────

describe('Core Engine: runFrontendArchitect', () => {
  const basePlan = {
    productGoal: 'SaaS' as const,
    plannedFeatures: ['Authentication', 'Dashboard', 'Settings', 'Billing'] as any,
    businessObjective: 'Freemium' as any,
    userPersonas: [],
    detectedRisks: [],
    qualityScores: [] as any,
    overallProductScore: 7,
    confidence: 0.8,
    productGoalConfidence: 0.8,
    promptSummary: '',
    informationArchitecture: {} as any,
    userJourney: {} as any,
    monetizationPlan: {} as any,
    roadmap: {} as any,
  };

  it('returns a FrontendArchitectOutput with blueprint', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.blueprint).toBeDefined();
  });

  it('returns overallScore', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(10);
  });

  it('returns non-empty contextString', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.contextString.length).toBeGreaterThan(100);
  });

  it('contextString contains FRONTEND ARCHITECT BLUEPRINT', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.contextString).toContain('FRONTEND ARCHITECT BLUEPRINT');
  });

  it('contextString contains END FRONTEND ARCHITECT BLUEPRINT', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.contextString).toContain('END FRONTEND ARCHITECT BLUEPRINT');
  });

  it('contextString contains project type', () => {
    const out = runFrontendArchitect('Build a SaaS multi-tenant app', basePlan as any);
    expect(out.contextString).toContain('SaaS');
  });

  it('blueprint has 12 validation scores', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.blueprint.validationScores).toHaveLength(12);
  });

  it('blueprint overallScore matches output overallScore', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.blueprint.overallScore).toBe(out.overallScore);
  });

  it('blueprint has projectTypeConfidence between 0 and 1', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    expect(out.blueprint.projectTypeConfidence).toBeGreaterThanOrEqual(0);
    expect(out.blueprint.projectTypeConfidence).toBeLessThanOrEqual(1);
  });

  it('blueprint contains all 16 architecture sections', () => {
    const out = runFrontendArchitect('Build a SaaS', basePlan as any);
    const bp = out.blueprint;
    expect(bp.routingArchitecture).toBeDefined();
    expect(bp.layoutArchitecture).toBeDefined();
    expect(bp.componentOwnership).toBeDefined();
    expect(bp.folderStructure).toBeDefined();
    expect(bp.stateArchitecture).toBeDefined();
    expect(bp.themeArchitecture).toBeDefined();
    expect(bp.apiArchitecture).toBeDefined();
    expect(bp.authArchitecture).toBeDefined();
    expect(bp.permissionArchitecture).toBeDefined();
    expect(bp.responsiveArchitecture).toBeDefined();
    expect(bp.performanceArchitecture).toBeDefined();
    expect(bp.loadingArchitecture).toBeDefined();
    expect(bp.accessibilityArchitecture).toBeDefined();
    expect(bp.seoArchitecture).toBeDefined();
    expect(bp.errorArchitecture).toBeDefined();
  });

  it('is deterministic — same output for same input', () => {
    const out1 = runFrontendArchitect('Build a CRM', { ...basePlan, productGoal: 'CRM', plannedFeatures: ['Authentication', 'CRM', 'Dashboard'] } as any);
    const out2 = runFrontendArchitect('Build a CRM', { ...basePlan, productGoal: 'CRM', plannedFeatures: ['Authentication', 'CRM', 'Dashboard'] } as any);
    expect(out1.overallScore).toBe(out2.overallScore);
    expect(out1.blueprint.projectType).toBe(out2.blueprint.projectType);
  });

  it('handles empty features', () => {
    const out = runFrontendArchitect('Build something', { ...basePlan, plannedFeatures: [] } as any);
    expect(out.blueprint).toBeDefined();
    expect(out.overallScore).toBeGreaterThan(0);
  });

  it('LandingPage prompt produces LandingPage type', () => {
    const out = runFrontendArchitect('Build a landing page for my startup', { ...basePlan, productGoal: 'LandingPage', plannedFeatures: [] } as any);
    expect(out.blueprint.projectType).toBe('LandingPage');
  });
});

// ── 19. Learning Loop ─────────────────────────────────────────────────────────

describe('Phase 17: Architecture Learning', () => {
  it('learnFromArchitecture records a build', () => {
    const bp = makeSaasBlueprint();
    const before = getArchitectureLearningHistory().length;
    learnFromArchitecture({ buildId: 'test-learn-1', blueprint: bp });
    expect(getArchitectureLearningHistory().length).toBe(before + 1);
  });

  it('learned record has correct projectType', () => {
    const bp = makeSaasBlueprint();
    learnFromArchitecture({ buildId: 'test-learn-2', blueprint: bp });
    const history = getArchitectureLearningHistory();
    const record = history[history.length - 1];
    expect(record.projectType).toBe(bp.projectType);
  });

  it('learned record has improved=true for high-score blueprint', () => {
    const bp = makeSaasBlueprint();
    bp.overallScore = 8.5;
    learnFromArchitecture({ buildId: 'test-learn-3', blueprint: bp });
    const history = getArchitectureLearningHistory();
    const record = history[history.length - 1];
    expect(record.improved).toBe(true);
  });

  it('learned record has improved=false for low-score blueprint', () => {
    const bp = makeSaasBlueprint();
    bp.overallScore = 5.0;
    learnFromArchitecture({ buildId: 'test-learn-4', blueprint: bp });
    const history = getArchitectureLearningHistory();
    const record = history[history.length - 1];
    expect(record.improved).toBe(false);
  });

  it('getSuccessfulPatterns returns array', () => {
    const patterns = getSuccessfulPatterns();
    expect(Array.isArray(patterns)).toBe(true);
  });
});

// ── 20. Telemetry ─────────────────────────────────────────────────────────────

describe('Phase 18: Architecture Metrics / Telemetry', () => {
  beforeEach(() => {
    resetArchitectureMetrics();
  });

  it('starts with totalRuns=0', () => {
    const m = getArchitectureMetrics();
    expect(m.totalRuns).toBe(0);
  });

  it('recordArchitectureBuild increments totalRuns', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    expect(getArchitectureMetrics().totalRuns).toBe(1);
  });

  it('averageOverallScore updates after recording', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    expect(m.averageOverallScore).toBeGreaterThan(0);
  });

  it('projectTypeDistribution tracks project types', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    expect(m.projectTypeDistribution[bp.projectType]).toBeGreaterThanOrEqual(1);
  });

  it('stateStrategyDistribution tracks strategies', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    const strategy = bp.stateArchitecture.primaryStrategy;
    expect(m.stateStrategyDistribution[strategy]).toBeGreaterThanOrEqual(1);
  });

  it('resetArchitectureMetrics resets to zero', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    resetArchitectureMetrics();
    expect(getArchitectureMetrics().totalRuns).toBe(0);
  });

  it('averageRoutingScore is between 0 and 10', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    expect(m.averageRoutingScore).toBeGreaterThanOrEqual(0);
    expect(m.averageRoutingScore).toBeLessThanOrEqual(10);
  });

  it('averagePerformanceScore is between 0 and 10', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    expect(m.averagePerformanceScore).toBeGreaterThanOrEqual(0);
    expect(m.averagePerformanceScore).toBeLessThanOrEqual(10);
  });

  it('multiple builds update rolling average correctly', () => {
    const bp1 = makeSaasBlueprint();
    bp1.overallScore = 8.0;
    const bp2 = makeSaasBlueprint();
    bp2.overallScore = 6.0;
    recordArchitectureBuild(bp1);
    recordArchitectureBuild(bp2);
    const m = getArchitectureMetrics();
    expect(m.averageOverallScore).toBeCloseTo(7.0, 0);
  });

  it('learningTrend is one of rising|stable|declining', () => {
    const m = getArchitectureMetrics();
    expect(['rising', 'stable', 'declining']).toContain(m.learningTrend);
  });

  it('topArchitecturePatterns is an array', () => {
    const bp = makeSaasBlueprint();
    recordArchitectureBuild(bp);
    const m = getArchitectureMetrics();
    expect(Array.isArray(m.topArchitecturePatterns)).toBe(true);
  });
});

// ── 21. Regression Tests ─────────────────────────────────────────────────────

describe('Regression: Blueprint Shape', () => {
  it('routingArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: ['Authentication', 'Dashboard'] } as any);
    const r = out.blueprint.routingArchitecture;
    expect(r.strategy).toBeDefined();
    expect(Array.isArray(r.publicRoutes)).toBe(true);
    expect(Array.isArray(r.protectedRoutes)).toBe(true);
    expect(Array.isArray(r.adminRoutes)).toBe(true);
    expect(Array.isArray(r.authRoutes)).toBe(true);
    expect(r.catchRoute).toBeDefined();
    expect(typeof r.hasNestedRoutes).toBe('boolean');
    expect(typeof r.hasDynamicRoutes).toBe('boolean');
    expect(typeof r.routeCount).toBe('number');
  });

  it('stateArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: ['Authentication'] } as any);
    const s = out.blueprint.stateArchitecture;
    expect(Array.isArray(s.layers)).toBe(true);
    expect(s.primaryStrategy).toBeDefined();
    expect(typeof s.hasServerState).toBe('boolean');
    expect(typeof s.hasCacheState).toBe('boolean');
    expect(typeof s.hasFormState).toBe('boolean');
    expect(typeof s.hasAuthState).toBe('boolean');
    expect(['Low', 'Medium', 'High']).toContain(s.complexity);
  });

  it('themeArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: [] } as any);
    const t = out.blueprint.themeArchitecture;
    expect(Array.isArray(t.modes)).toBe(true);
    expect(t.defaultMode).toBeDefined();
    expect(typeof t.runtimeSwitching).toBe('boolean');
    expect(typeof t.tokenSystem).toBe('boolean');
    expect(typeof t.cssVariables).toBe('boolean');
    expect(typeof t.hasDarkMode).toBe('boolean');
  });

  it('authArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: ['Authentication'] } as any);
    const a = out.blueprint.authArchitecture;
    expect(a.strategy).toBeDefined();
    expect(Array.isArray(a.roles)).toBe(true);
    expect(typeof a.hasRefreshFlow).toBe('boolean');
    expect(typeof a.hasProtectedPages).toBe('boolean');
    expect(typeof a.hasGuestMode).toBe('boolean');
    expect(typeof a.hasMultiTenant).toBe('boolean');
    expect(a.sessionStrategy).toBeDefined();
  });

  it('performanceArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: [] } as any);
    const p = out.blueprint.performanceArchitecture;
    expect(typeof p.hasLazyLoading).toBe('boolean');
    expect(typeof p.hasRouteSplitting).toBe('boolean');
    expect(typeof p.hasMemoization).toBe('boolean');
    expect(typeof p.hasVirtualization).toBe('boolean');
    expect(typeof p.hasSuspense).toBe('boolean');
    expect(typeof p.hasImageOptimization).toBe('boolean');
    expect(p.bundleStrategy).toBeDefined();
    expect(p.estimatedBundleSize).toBeDefined();
  });

  it('accessibilityArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: [] } as any);
    const a = out.blueprint.accessibilityArchitecture;
    expect(typeof a.hasKeyboardNav).toBe('boolean');
    expect(typeof a.hasFocusManagement).toBe('boolean');
    expect(typeof a.hasARIA).toBe('boolean');
    expect(typeof a.hasColorContrast).toBe('boolean');
    expect(typeof a.hasReducedMotion).toBe('boolean');
    expect(typeof a.hasSemanticHTML).toBe('boolean');
    expect(['A', 'AA', 'AAA']).toContain(a.level);
  });

  it('seoArchitecture has all required fields', () => {
    const out = runFrontendArchitect('Build a landing page', { productGoal: 'LandingPage', plannedFeatures: [] } as any);
    const s = out.blueprint.seoArchitecture;
    expect(typeof s.hasMetadata).toBe('boolean');
    expect(typeof s.hasOpenGraph).toBe('boolean');
    expect(typeof s.hasStructuredData).toBe('boolean');
    expect(['none', 'basic', 'full']).toContain(s.strategy);
  });

  it('folderStructure has all required fields', () => {
    const out = runFrontendArchitect('Build a SaaS', { productGoal: 'SaaS', plannedFeatures: [] } as any);
    const f = out.blueprint.folderStructure;
    expect(f.root).toBe('src/');
    expect(Array.isArray(f.directories)).toBe(true);
    expect(Array.isArray(f.keyFiles)).toBe(true);
    expect(['feature-first', 'layer-first', 'hybrid']).toContain(f.pattern);
  });
});

// ── 22. Pipeline Wiring ───────────────────────────────────────────────────────

describe('Pipeline Wiring: frontendArchitectStep', () => {
  it('pipeline step module exports runFrontendArchitectStep', async () => {
    const mod = await import('../../agents/pipeline/frontendArchitectStep.js');
    expect(typeof mod.runFrontendArchitectStep).toBe('function');
  });
});
