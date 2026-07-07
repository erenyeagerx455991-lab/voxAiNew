// ── V8.5 Frontend Architect — Layout Architecture ─────────────────────────────

import type { ProjectType, LayoutArchitecture, LayoutDefinition, LayoutType } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planLayoutArchitecture(
  projectType: ProjectType,
  features: ProductFeature[],
): LayoutArchitecture {
  const layouts: LayoutDefinition[] = buildLayouts(projectType, features);
  const defaultLayout = resolveDefaultLayout(projectType);
  const authLayout: LayoutType = 'AuthLayout';
  const errorLayout: LayoutType = 'ErrorLayout';

  return { layouts, defaultLayout, authLayout, errorLayout };
}

function buildLayouts(projectType: ProjectType, features: ProductFeature[]): LayoutDefinition[] {
  const layouts: LayoutDefinition[] = [];
  const appTypes: ProjectType[] = ['SaaS', 'Dashboard', 'CRM', 'AdminPanel', 'Analytics', 'ERP', 'AIApplication', 'Productivity', 'InternalTool', 'EnterprisePlatform', 'Healthcare', 'Finance', 'ChatApp'];
  const isApp = appTypes.includes(projectType);
  const marketingTypes: ProjectType[] = ['LandingPage', 'SaaS', 'Portfolio', 'Blog', 'Documentation', 'DeveloperTool', 'Marketplace', 'ECommerce', 'Education', 'Booking'];
  const hasMarketing = marketingTypes.includes(projectType);

  // Always include auth + error
  layouts.push({
    name: 'AuthLayout',
    hasNavbar: false, hasSidebar: false, hasFooter: false,
    pages: ['LoginPage', 'SignupPage', 'ForgotPasswordPage', 'ResetPasswordPage'],
  });

  layouts.push({
    name: 'ErrorLayout',
    hasNavbar: false, hasSidebar: false, hasFooter: false,
    pages: ['NotFoundPage', 'ErrorPage'],
  });

  if (hasMarketing) {
    layouts.push({
      name: 'MarketingLayout',
      hasNavbar: true, hasSidebar: false, hasFooter: true,
      pages: ['HomePage', 'FeaturesPage', 'PricingPage', 'AboutPage', 'ContactPage', 'BlogPage'],
    });
  }

  if (isApp || features.includes('Dashboard')) {
    layouts.push({
      name: 'DashboardLayout',
      hasNavbar: true, hasSidebar: true, hasFooter: false,
      pages: ['DashboardPage', 'AnalyticsPage', 'ReportsPage', 'ProfilePage', 'ProjectsPage'],
    });
  }

  if (projectType === 'AdminPanel' || projectType === 'ERP' || features.includes('AuditLogs')) {
    layouts.push({
      name: 'AdminLayout',
      hasNavbar: true, hasSidebar: true, hasFooter: false,
      pages: ['AdminDashboardPage', 'AdminUsersPage', 'AdminContentPage', 'AdminSettingsPage', 'AdminLogsPage'],
    });
  }

  if (features.includes('Settings') || features.includes('Billing')) {
    layouts.push({
      name: 'SettingsLayout',
      hasNavbar: true, hasSidebar: true, hasFooter: false,
      pages: ['SettingsPage', 'BillingPage', 'TeamPage', 'ProfilePage'],
    });
  }

  if (projectType === 'Documentation' || projectType === 'DeveloperTool') {
    layouts.push({
      name: 'DocsLayout',
      hasNavbar: true, hasSidebar: true, hasFooter: true,
      pages: ['DocsPage', 'DocsSectionPage', 'ApiReferencePage'],
    });
  }

  if (features.includes('Workspace') || projectType === 'Productivity' || projectType === 'CMS') {
    layouts.push({
      name: 'WorkspaceLayout',
      hasNavbar: false, hasSidebar: true, hasFooter: false,
      pages: ['WorkspacePage', 'EditorPage', 'CanvasPage'],
    });
  }

  layouts.push({
    name: 'BlankLayout',
    hasNavbar: false, hasSidebar: false, hasFooter: false,
    pages: ['PrintPage', 'EmbedPage'],
  });

  return layouts;
}

function resolveDefaultLayout(projectType: ProjectType): LayoutType {
  const appTypes: ProjectType[] = ['Dashboard', 'CRM', 'AdminPanel', 'Analytics', 'ERP', 'InternalTool', 'EnterprisePlatform', 'ChatApp', 'Productivity'];
  if (appTypes.includes(projectType)) return 'DashboardLayout';
  if (projectType === 'Documentation') return 'DocsLayout';
  if (projectType === 'AdminPanel') return 'AdminLayout';
  return 'MarketingLayout';
}
