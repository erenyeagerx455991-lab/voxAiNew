// ── V8.5 Frontend Architect — Routing Architecture ────────────────────────────

import type { ProjectType, RoutingArchitecture, RouteDefinition, RouteType } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planRoutingArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
  prompt: string,
): RoutingArchitecture {
  const hasAuth    = features.includes('Authentication');
  const hasDashboard = features.includes('Dashboard');
  const hasAdmin   = projectType === 'AdminPanel' || projectType === 'ERP' || prompt.includes('admin');
  const hasBilling = features.includes('Billing');
  const hasSettings = features.includes('Settings');
  const hasProfile  = features.includes('Profile');
  const hasSearch   = features.includes('Search');

  const publicRoutes = buildPublicRoutes(projectType, prompt);
  const protectedRoutes = buildProtectedRoutes(projectType, features, hasDashboard, hasBilling, hasSettings, hasProfile);
  const adminRoutes = hasAdmin ? buildAdminRoutes() : [];
  const authRoutes  = hasAuth ? buildAuthRoutes() : [];

  const allRoutes = [...publicRoutes, ...protectedRoutes, ...adminRoutes, ...authRoutes];

  return {
    strategy: 'ReactRouter',
    publicRoutes,
    protectedRoutes,
    adminRoutes,
    authRoutes,
    catchRoute: { path: '*', type: 'catch', layout: 'ErrorLayout', component: 'NotFoundPage', lazy: false },
    hasNestedRoutes: hasDashboard || hasAdmin,
    hasDynamicRoutes: projectType === 'Marketplace' || projectType === 'Blog' || projectType === 'ECommerce' || features.includes('Projects'),
    routeCount: allRoutes.length + 1,
  };
}

function buildPublicRoutes(projectType: ProjectType, prompt: string): RouteDefinition[] {
  const routes: RouteDefinition[] = [
    makeRoute('/', 'public', 'MarketingLayout', 'HomePage', false),
  ];

  const marketingTypes: ProjectType[] = ['LandingPage', 'SaaS', 'AIApplication', 'ECommerce', 'Education', 'Finance'];
  if (marketingTypes.includes(projectType)) {
    routes.push(makeRoute('/features', 'public', 'MarketingLayout', 'FeaturesPage', true));
    routes.push(makeRoute('/pricing', 'public', 'MarketingLayout', 'PricingPage', true));
  }

  if (projectType === 'Blog' || projectType === 'CMS') {
    routes.push(makeRoute('/blog', 'public', 'MarketingLayout', 'BlogPage', true));
    routes.push(makeRoute('/blog/:slug', 'dynamic', 'MarketingLayout', 'BlogPostPage', true));
  }

  if (projectType === 'Documentation' || projectType === 'DeveloperTool') {
    routes.push(makeRoute('/docs', 'public', 'DocsLayout', 'DocsPage', true));
    routes.push(makeRoute('/docs/:section', 'dynamic', 'DocsLayout', 'DocsSectionPage', true));
  }

  if (projectType === 'Portfolio') {
    routes.push(makeRoute('/work', 'public', 'MarketingLayout', 'WorkPage', true));
    routes.push(makeRoute('/work/:slug', 'dynamic', 'MarketingLayout', 'CaseStudyPage', true));
    routes.push(makeRoute('/about', 'public', 'MarketingLayout', 'AboutPage', true));
  }

  if (projectType === 'Marketplace' || projectType === 'ECommerce') {
    routes.push(makeRoute('/browse', 'public', 'MarketingLayout', 'BrowsePage', true));
    routes.push(makeRoute('/item/:id', 'dynamic', 'MarketingLayout', 'ItemDetailPage', true));
    routes.push(makeRoute('/cart', 'public', 'MarketingLayout', 'CartPage', true));
  }

  routes.push(makeRoute('/about', 'public', 'MarketingLayout', 'AboutPage', true));
  routes.push(makeRoute('/contact', 'public', 'MarketingLayout', 'ContactPage', true));

  return routes;
}

function buildProtectedRoutes(
  projectType: ProjectType,
  features: ProductFeature[],
  hasDashboard: boolean,
  hasBilling: boolean,
  hasSettings: boolean,
  hasProfile: boolean,
): RouteDefinition[] {
  const routes: RouteDefinition[] = [];

  const appTypes: ProjectType[] = ['SaaS', 'Dashboard', 'CRM', 'AdminPanel', 'Analytics', 'ERP', 'AIApplication', 'Productivity', 'InternalTool', 'EnterprisePlatform', 'Healthcare', 'Finance'];
  if (!appTypes.includes(projectType) && !hasDashboard) return routes;

  routes.push(makeRoute('/dashboard', 'protected', 'DashboardLayout', 'DashboardPage', false));
  if (hasProfile) routes.push(makeRoute('/profile', 'protected', 'DashboardLayout', 'ProfilePage', true));
  if (hasSettings) routes.push(makeRoute('/settings', 'protected', 'SettingsLayout', 'SettingsPage', true));
  if (hasBilling) routes.push(makeRoute('/settings/billing', 'protected', 'SettingsLayout', 'BillingPage', true));
  if (features.includes('Teams')) routes.push(makeRoute('/settings/team', 'protected', 'SettingsLayout', 'TeamPage', true));
  if (features.includes('Analytics')) routes.push(makeRoute('/analytics', 'protected', 'DashboardLayout', 'AnalyticsPage', true));
  if (features.includes('Reports')) routes.push(makeRoute('/reports', 'protected', 'DashboardLayout', 'ReportsPage', true));
  if (features.includes('Projects')) {
    routes.push(makeRoute('/projects', 'protected', 'DashboardLayout', 'ProjectsPage', true));
    routes.push(makeRoute('/projects/:id', 'dynamic', 'DashboardLayout', 'ProjectDetailPage', true));
  }
  if (features.includes('Kanban')) routes.push(makeRoute('/board', 'protected', 'DashboardLayout', 'KanbanPage', true));
  if (features.includes('Calendar')) routes.push(makeRoute('/calendar', 'protected', 'DashboardLayout', 'CalendarPage', true));
  if (features.includes('Chat')) routes.push(makeRoute('/chat', 'protected', 'DashboardLayout', 'ChatPage', true));
  if (features.includes('CRM')) {
    routes.push(makeRoute('/contacts', 'protected', 'DashboardLayout', 'ContactsPage', true));
    routes.push(makeRoute('/contacts/:id', 'dynamic', 'DashboardLayout', 'ContactDetailPage', true));
  }
  if (features.includes('Invoices') || features.includes('Payments')) {
    routes.push(makeRoute('/invoices', 'protected', 'DashboardLayout', 'InvoicesPage', true));
  }

  return routes;
}

function buildAdminRoutes(): RouteDefinition[] {
  return [
    makeRoute('/admin', 'admin', 'AdminLayout', 'AdminDashboardPage', false),
    makeRoute('/admin/users', 'admin', 'AdminLayout', 'AdminUsersPage', true),
    makeRoute('/admin/content', 'admin', 'AdminLayout', 'AdminContentPage', true),
    makeRoute('/admin/settings', 'admin', 'AdminLayout', 'AdminSettingsPage', true),
    makeRoute('/admin/logs', 'admin', 'AdminLayout', 'AdminLogsPage', true),
  ];
}

function buildAuthRoutes(): RouteDefinition[] {
  return [
    makeRoute('/login', 'auth', 'AuthLayout', 'LoginPage', false),
    makeRoute('/signup', 'auth', 'AuthLayout', 'SignupPage', false),
    makeRoute('/forgot-password', 'auth', 'AuthLayout', 'ForgotPasswordPage', true),
    makeRoute('/reset-password', 'auth', 'AuthLayout', 'ResetPasswordPage', true),
  ];
}

function makeRoute(path: string, type: RouteType, layout: string, component: string, lazy: boolean): RouteDefinition {
  return { path, type, layout, component, lazy };
}
