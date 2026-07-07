// ── V8.5 Frontend Architect — Component Ownership ────────────────────────────

import type { ProjectType, ComponentOwnership, ComponentGroup, ComponentOwnershipLevel } from './frontendTypes.js';
import type { ProductFeature } from '../product-manager/productTypes.js';

export function planComponentOwnership(
  projectType: ProjectType,
  features: ProductFeature[],
): ComponentOwnership {
  const groups = buildGroups(projectType, features);
  const sharedCount = groups.find(g => g.level === 'Shared')?.examples.length ?? 0;
  const totalEstimate = groups.reduce((acc, g) => acc + g.examples.length, 0);

  return { groups, sharedCount, totalEstimate };
}

function buildGroups(projectType: ProjectType, features: ProductFeature[]): ComponentGroup[] {
  const groups: ComponentGroup[] = [];

  groups.push({
    level: 'Shared',
    path: 'src/components/ui/',
    reusable: true,
    examples: ['Button', 'Input', 'Card', 'Badge', 'Avatar', 'Spinner', 'Tooltip', 'Dialog', 'Alert'],
  });

  groups.push({
    level: 'Navigation',
    path: 'src/components/navigation/',
    reusable: true,
    examples: buildNavComponents(projectType, features),
  });

  const isApp = !['LandingPage', 'Portfolio', 'Blog'].includes(projectType);
  if (isApp || features.includes('Dashboard')) {
    groups.push({
      level: 'Layout',
      path: 'src/layouts/',
      reusable: true,
      examples: buildLayoutComponents(projectType, features),
    });
  }

  groups.push({
    level: 'Feature',
    path: 'src/features/',
    reusable: false,
    examples: buildFeatureComponents(projectType, features),
  });

  groups.push({
    level: 'Page',
    path: 'src/pages/',
    reusable: false,
    examples: buildPageComponents(projectType, features),
  });

  if (features.includes('Authentication') || features.includes('Profile') || features.includes('Settings')) {
    groups.push({
      level: 'Form',
      path: 'src/components/forms/',
      reusable: true,
      examples: buildFormComponents(features),
    });
  }

  if (features.includes('Analytics') || features.includes('Reports') || features.includes('Dashboard')) {
    groups.push({
      level: 'Chart',
      path: 'src/components/charts/',
      reusable: true,
      examples: ['LineChart', 'BarChart', 'PieChart', 'AreaChart', 'MetricCard', 'DataTable', 'Sparkline'],
    });
  }

  groups.push({
    level: 'Modal',
    path: 'src/components/modals/',
    reusable: true,
    examples: buildModalComponents(features),
  });

  groups.push({
    level: 'UI',
    path: 'src/components/',
    reusable: true,
    examples: ['EmptyState', 'ErrorBoundary', 'LoadingSkeleton', 'ConfirmDialog', 'NotificationToast'],
  });

  return groups;
}

function buildNavComponents(projectType: ProjectType, features: ProductFeature[]): string[] {
  const comps = ['Navbar', 'Footer', 'MobileMenu'];
  if (features.includes('Dashboard') || ['Dashboard', 'AdminPanel', 'SaaS', 'CRM', 'Analytics'].includes(projectType)) {
    comps.push('Sidebar', 'SidebarItem', 'SidebarGroup');
  }
  if (features.includes('Search')) comps.push('SearchBar', 'CommandPalette');
  if (features.includes('Notifications')) comps.push('NotificationBell');
  return comps;
}

function buildLayoutComponents(projectType: ProjectType, features: ProductFeature[]): string[] {
  const comps = ['DashboardLayout', 'AuthLayout', 'MarketingLayout'];
  if (['AdminPanel', 'ERP'].includes(projectType)) comps.push('AdminLayout');
  if (features.includes('Settings')) comps.push('SettingsLayout');
  if (['Documentation', 'DeveloperTool'].includes(projectType)) comps.push('DocsLayout');
  return comps;
}

function buildFeatureComponents(projectType: ProjectType, features: ProductFeature[]): string[] {
  const comps: string[] = [];
  if (features.includes('Billing'))       comps.push('PricingTable', 'PlanCard', 'BillingHistory');
  if (features.includes('Teams'))         comps.push('TeamMemberCard', 'InviteForm', 'TeamSettings');
  if (features.includes('Kanban'))        comps.push('KanbanBoard', 'KanbanCard', 'KanbanColumn');
  if (features.includes('Calendar'))      comps.push('CalendarView', 'EventCard');
  if (features.includes('Chat'))          comps.push('ChatWindow', 'MessageBubble', 'ChatInput');
  if (features.includes('CRM'))           comps.push('ContactCard', 'DealPipeline', 'ActivityFeed');
  if (features.includes('Analytics'))     comps.push('MetricsDashboard', 'ChartGrid', 'FilterPanel');
  if (features.includes('AIAssistant'))   comps.push('AIChat', 'PromptInput', 'ResponseStream');
  if (features.includes('Notifications')) comps.push('NotificationList', 'NotificationItem');
  if (comps.length === 0) comps.push('HeroSection', 'FeatureCard', 'TestimonialCard');
  return comps;
}

function buildPageComponents(projectType: ProjectType, features: ProductFeature[]): string[] {
  const pages = ['HomePage'];
  if (['SaaS', 'LandingPage', 'AIApplication'].includes(projectType)) {
    pages.push('LandingPage', 'PricingPage', 'FeaturesPage');
  }
  if (features.includes('Authentication')) pages.push('LoginPage', 'SignupPage');
  if (features.includes('Dashboard')) pages.push('DashboardPage');
  if (features.includes('Settings')) pages.push('SettingsPage');
  if (features.includes('Profile')) pages.push('ProfilePage');
  return pages;
}

function buildFormComponents(features: ProductFeature[]): string[] {
  const forms = ['FormField', 'FormLabel', 'FormError'];
  if (features.includes('Authentication')) forms.push('LoginForm', 'SignupForm');
  if (features.includes('Profile')) forms.push('ProfileForm');
  if (features.includes('Settings')) forms.push('SettingsForm');
  if (features.includes('Billing')) forms.push('PaymentForm');
  if (features.includes('Teams')) forms.push('InviteMemberForm');
  return forms;
}

function buildModalComponents(features: ProductFeature[]): string[] {
  const modals = ['ConfirmModal', 'AlertModal'];
  if (features.includes('Teams')) modals.push('InviteModal');
  if (features.includes('Billing')) modals.push('UpgradeModal');
  if (features.includes('Projects')) modals.push('CreateProjectModal');
  if (features.includes('CRM')) modals.push('AddContactModal');
  return modals;
}
