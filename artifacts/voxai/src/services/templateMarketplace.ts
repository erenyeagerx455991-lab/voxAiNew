// ── NexoGen V5.6 — Template Marketplace ──────────────────────────────────────

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  projectType: string;
  pages: string[];
  routes: string[];
  databaseTables: string[];
  apis: string[];
  features: string[];
  authRequired: boolean;
  recommendedRegistryComponents: {
    hero?: string;
    navbar?: string;
    pricing?: string;
    dashboard?: string;
    features?: string;
    cta?: string;
    footer?: string;
  };
  dependencies: string[];
  qualityScore: number;
  icon: string;
  color: string;
}

export interface TemplateMatch {
  templateId: string;
  confidence: number;
  template: ProjectTemplate;
}

export interface TemplateHealth {
  architectureCompleteness: number;
  apiCoverage: number;
  databaseCoverage: number;
  registryCoverage: number;
  editCompatibility: number;
  overallScore: number;
  passed: boolean;
  issues: string[];
}

export interface MergedTemplate {
  pages: string[];
  routes: string[];
  apis: string[];
  databaseTables: string[];
  features: string[];
  authRequired: boolean;
  templateDna: Record<string, number>;
}

// ── Template Library ─────────────────────────────────────────────────────────

export const TEMPLATE_LIBRARY: ProjectTemplate[] = [
  {
    id: 'ai-saas',
    name: 'AI SaaS',
    description: 'Full-stack AI-powered SaaS with billing, projects workspace, and API key management.',
    category: 'SaaS',
    tags: ['ai', 'saas', 'billing', 'stripe', 'api', 'workspace'],
    projectType: 'SaaS',
    pages: ['Landing', 'Dashboard', 'Projects', 'Workspace', 'Settings', 'Billing', 'Login', 'Signup', 'API Keys'],
    routes: ['/', '/dashboard', '/projects', '/workspace/:id', '/settings', '/billing', '/login', '/signup', '/api-keys'],
    databaseTables: ['users', 'projects', 'generations', 'subscriptions', 'api_keys', 'usage_logs'],
    apis: ['auth', 'projects', 'generate', 'billing', 'api-keys', 'usage'],
    features: ['AI Generation', 'Project Workspace', 'API Key Management', 'Usage Metering', 'Stripe Billing', 'Team Collaboration', 'Export Results'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Vercel Hero', navbar: 'Linear Nav', pricing: 'Stripe Pricing', dashboard: 'Linear Dashboard', features: 'Cursor Features', footer: 'Vercel Footer' },
    dependencies: ['stripe', 'openai', 'prisma', 'jsonwebtoken'],
    qualityScore: 97,
    icon: '🤖',
    color: 'from-violet-500/20 to-indigo-500/20',
  },
  {
    id: 'crm',
    name: 'CRM',
    description: 'Customer Relationship Management platform with pipeline, deals, and analytics.',
    category: 'Business',
    tags: ['crm', 'sales', 'customers', 'deals', 'pipeline', 'leads'],
    projectType: 'CRM',
    pages: ['Landing', 'Dashboard', 'Customers', 'Deals', 'Pipeline', 'Tasks', 'Reports', 'Settings', 'Login', 'Signup'],
    routes: ['/', '/dashboard', '/customers', '/customers/:id', '/deals', '/pipeline', '/tasks', '/reports', '/settings', '/login'],
    databaseTables: ['users', 'customers', 'deals', 'tasks', 'activities', 'pipelines', 'tags'],
    apis: ['auth', 'customers', 'deals', 'tasks', 'activities', 'pipelines', 'reports'],
    features: ['Deal Pipeline', 'Customer Profiles', 'Activity Timeline', 'Revenue Analytics', 'Task Management', 'CSV Import/Export', 'Email Integration', 'Custom Tags'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Linear Hero', navbar: 'Linear Nav', dashboard: 'Linear Dashboard', features: 'Notion Features', footer: 'Linear Footer' },
    dependencies: ['prisma', 'jsonwebtoken', 'nodemailer'],
    qualityScore: 95,
    icon: '📊',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    id: 'lms',
    name: 'LMS',
    description: 'Learning Management System with courses, lessons, video, quizzes, and progress tracking.',
    category: 'Education',
    tags: ['lms', 'courses', 'learning', 'education', 'video', 'quiz'],
    projectType: 'SaaS',
    pages: ['Landing', 'Dashboard', 'Courses', 'Course Detail', 'Lesson', 'Quiz', 'Progress', 'Certificates', 'Settings', 'Login', 'Signup'],
    routes: ['/', '/dashboard', '/courses', '/courses/:id', '/courses/:id/lessons/:lessonId', '/quiz/:id', '/progress', '/certificates', '/settings', '/login'],
    databaseTables: ['users', 'courses', 'lessons', 'quizzes', 'enrollments', 'progress', 'certificates', 'assignments'],
    apis: ['auth', 'courses', 'lessons', 'quizzes', 'enrollments', 'progress', 'certificates'],
    features: ['Video Lessons', 'Interactive Quizzes', 'Progress Tracking', 'Certificates', 'Course Catalog', 'Assignments', 'Student Dashboard', 'Instructor Portal'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Framer Hero', navbar: 'Notion Nav', pricing: 'Stripe Pricing', dashboard: 'Notion Dashboard', features: 'Notion Features' },
    dependencies: ['prisma', 'jsonwebtoken', 'multer', 'aws-sdk'],
    qualityScore: 94,
    icon: '🎓',
    color: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Full e-commerce store with products, cart, checkout, orders, and admin panel.',
    category: 'Commerce',
    tags: ['ecommerce', 'shop', 'store', 'products', 'cart', 'checkout', 'orders'],
    projectType: 'E-commerce',
    pages: ['Landing', 'Products', 'Product Detail', 'Cart', 'Checkout', 'Order Confirmation', 'Orders', 'Account', 'Admin Dashboard', 'Login', 'Signup'],
    routes: ['/', '/products', '/products/:slug', '/cart', '/checkout', '/orders/:id/confirmation', '/orders', '/account', '/admin', '/login'],
    databaseTables: ['users', 'products', 'categories', 'orders', 'order_items', 'cart_items', 'reviews', 'inventory'],
    apis: ['auth', 'products', 'categories', 'cart', 'orders', 'payments', 'reviews', 'inventory'],
    features: ['Product Catalog', 'Search & Filter', 'Shopping Cart', 'Stripe Checkout', 'Order Tracking', 'Reviews & Ratings', 'Inventory Management', 'Admin Dashboard'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Stripe Hero', navbar: 'Vercel Nav', pricing: 'Stripe Pricing', features: 'Stripe Features', footer: 'Vercel Footer' },
    dependencies: ['stripe', 'prisma', 'jsonwebtoken', 'sharp'],
    qualityScore: 96,
    icon: '🛒',
    color: 'from-orange-500/20 to-amber-500/20',
  },
  {
    id: 'agency',
    name: 'Agency',
    description: 'Creative agency website with services, portfolio, case studies, and contact forms.',
    category: 'Marketing',
    tags: ['agency', 'portfolio', 'services', 'creative', 'design', 'case-studies'],
    projectType: 'Agency',
    pages: ['Landing', 'Services', 'Portfolio', 'Case Studies', 'Case Study Detail', 'About', 'Team', 'Blog', 'Contact'],
    routes: ['/', '/services', '/portfolio', '/work', '/work/:slug', '/about', '/team', '/blog', '/contact'],
    databaseTables: ['projects', 'services', 'team_members', 'blog_posts', 'inquiries'],
    apis: ['projects', 'services', 'team', 'blog', 'contact'],
    features: ['Portfolio Gallery', 'Case Studies', 'Team Profiles', 'Blog/Insights', 'Contact Form', 'Service Packages', 'Client Logos', 'Awards Section'],
    authRequired: false,
    recommendedRegistryComponents: { hero: 'Framer Hero', navbar: 'Framer Nav', features: 'Framer Features', cta: 'Framer CTA', footer: 'Framer Footer' },
    dependencies: ['prisma', 'nodemailer', 'sharp'],
    qualityScore: 91,
    icon: '🎨',
    color: 'from-pink-500/20 to-rose-500/20',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Developer or designer portfolio with projects showcase, skills, and contact.',
    category: 'Personal',
    tags: ['portfolio', 'personal', 'developer', 'designer', 'projects', 'resume'],
    projectType: 'Portfolio',
    pages: ['Home', 'Projects', 'Project Detail', 'About', 'Blog', 'Contact'],
    routes: ['/', '/projects', '/projects/:slug', '/about', '/blog', '/contact'],
    databaseTables: ['projects', 'skills', 'experiences', 'blog_posts'],
    apis: ['projects', 'blog', 'contact'],
    features: ['Projects Showcase', 'Skills Matrix', 'Work Experience Timeline', 'Blog', 'Contact Form', 'Resume Download', 'Dark Mode', 'GitHub Integration'],
    authRequired: false,
    recommendedRegistryComponents: { hero: 'Linear Hero', navbar: 'Vercel Nav', features: 'Linear Features', cta: 'Vercel CTA', footer: 'Linear Footer' },
    dependencies: ['nodemailer'],
    qualityScore: 88,
    icon: '💼',
    color: 'from-slate-500/20 to-gray-500/20',
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Platform',
    description: 'Data analytics platform with real-time charts, reports, and alert management.',
    category: 'Analytics',
    tags: ['analytics', 'dashboard', 'charts', 'reports', 'data', 'metrics', 'kpi'],
    projectType: 'Dashboard App',
    pages: ['Landing', 'Dashboard', 'Reports', 'Data Explorer', 'Alerts', 'Integrations', 'Settings', 'Login', 'Signup'],
    routes: ['/', '/dashboard', '/reports', '/reports/:id', '/explorer', '/alerts', '/integrations', '/settings', '/login'],
    databaseTables: ['users', 'dashboards', 'reports', 'widgets', 'alerts', 'data_sources', 'events'],
    apis: ['auth', 'dashboards', 'reports', 'widgets', 'alerts', 'events', 'data-sources'],
    features: ['Real-time Charts', 'Custom Dashboards', 'Report Builder', 'Alert Rules', 'Data Source Integrations', 'CSV/PDF Export', 'Team Sharing', 'Scheduled Reports'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Vercel Hero', navbar: 'Raycast Nav', dashboard: 'Raycast Dashboard', features: 'Raycast Features', footer: 'Vercel Footer' },
    dependencies: ['prisma', 'jsonwebtoken', 'recharts', 'chart.js'],
    qualityScore: 95,
    icon: '📈',
    color: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project management tool with kanban boards, tasks, sprints, and team collaboration.',
    category: 'Productivity',
    tags: ['project management', 'kanban', 'tasks', 'sprints', 'agile', 'team', 'collaboration'],
    projectType: 'Dashboard App',
    pages: ['Dashboard', 'Projects', 'Project Board', 'Tasks', 'Sprints', 'Team', 'Calendar', 'Reports', 'Settings', 'Login', 'Signup'],
    routes: ['/dashboard', '/projects', '/projects/:id/board', '/tasks', '/sprints', '/team', '/calendar', '/reports', '/settings', '/login'],
    databaseTables: ['users', 'projects', 'tasks', 'sprints', 'labels', 'comments', 'attachments', 'team_members'],
    apis: ['auth', 'projects', 'tasks', 'sprints', 'team', 'comments', 'attachments'],
    features: ['Kanban Board', 'Sprint Planning', 'Task Assignment', 'Time Tracking', 'File Attachments', 'Comments', 'Notifications', 'Gantt View', 'Burndown Charts'],
    authRequired: true,
    recommendedRegistryComponents: { navbar: 'Linear Nav', dashboard: 'Linear Dashboard', features: 'Linear Features', footer: 'Linear Footer' },
    dependencies: ['prisma', 'jsonwebtoken', 'socket.io', 'multer'],
    qualityScore: 96,
    icon: '📋',
    color: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    id: 'internal-admin',
    name: 'Admin Panel',
    description: 'Internal admin panel with user management, content control, and system logs.',
    category: 'Internal',
    tags: ['admin', 'internal', 'dashboard', 'users', 'content', 'management'],
    projectType: 'Dashboard App',
    pages: ['Dashboard', 'Users', 'Content', 'Analytics', 'Roles & Permissions', 'Settings', 'Logs', 'Login'],
    routes: ['/dashboard', '/users', '/users/:id', '/content', '/analytics', '/roles', '/settings', '/logs', '/login'],
    databaseTables: ['users', 'roles', 'permissions', 'content', 'audit_logs', 'system_settings'],
    apis: ['auth', 'users', 'roles', 'content', 'audit-logs', 'settings'],
    features: ['User Management', 'Role-Based Access', 'Content CRUD', 'Audit Logs', 'System Settings', 'Data Tables', 'Bulk Actions', 'Permission Matrix'],
    authRequired: true,
    recommendedRegistryComponents: { navbar: 'Notion Nav', dashboard: 'Notion Dashboard', features: 'Notion Features', footer: 'Notion Footer' },
    dependencies: ['prisma', 'jsonwebtoken', 'bcrypt'],
    qualityScore: 93,
    icon: '⚙️',
    color: 'from-gray-500/20 to-zinc-500/20',
  },
  {
    id: 'social-community',
    name: 'Social Community',
    description: 'Social community platform with feed, profiles, messaging, and community groups.',
    category: 'Social',
    tags: ['social', 'community', 'feed', 'messaging', 'groups', 'posts', 'followers'],
    projectType: 'SaaS',
    pages: ['Landing', 'Feed', 'Profile', 'Messages', 'Communities', 'Events', 'Notifications', 'Settings', 'Login', 'Signup'],
    routes: ['/', '/feed', '/profile/:username', '/messages', '/messages/:id', '/communities', '/communities/:id', '/events', '/notifications', '/settings', '/login'],
    databaseTables: ['users', 'posts', 'comments', 'likes', 'follows', 'messages', 'communities', 'events', 'notifications'],
    apis: ['auth', 'posts', 'comments', 'likes', 'follows', 'messages', 'communities', 'events', 'notifications'],
    features: ['Social Feed', 'User Profiles', 'Real-time Messaging', 'Community Groups', 'Events', 'Likes & Comments', 'Follow System', 'Push Notifications', 'Media Upload'],
    authRequired: true,
    recommendedRegistryComponents: { hero: 'Framer Hero', navbar: 'Raycast Nav', features: 'Framer Features', cta: 'Framer CTA', footer: 'Framer Footer' },
    dependencies: ['prisma', 'jsonwebtoken', 'socket.io', 'multer', 'sharp'],
    qualityScore: 94,
    icon: '👥',
    color: 'from-fuchsia-500/20 to-pink-500/20',
  },
];

// ── Template Match Engine ─────────────────────────────────────────────────────

const TEMPLATE_KEYWORDS: Record<string, string[]> = {
  'ai-saas': ['ai', 'artificial intelligence', 'llm', 'gpt', 'openai', 'saas', 'api', 'generation', 'assistant', 'chatbot', 'writing', 'code assistant', 'image generation', 'machine learning'],
  'crm': ['crm', 'customer', 'clients', 'sales', 'deals', 'leads', 'pipeline', 'relationship', 'contact management', 'salesforce', 'hubspot'],
  'lms': ['lms', 'learning', 'courses', 'education', 'lessons', 'students', 'teachers', 'quiz', 'e-learning', 'online course', 'training', 'academy', 'school', 'udemy'],
  'ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'products', 'cart', 'checkout', 'buy', 'sell', 'marketplace', 'shopify', 'amazon'],
  'agency': ['agency', 'creative', 'design studio', 'branding', 'marketing agency', 'digital agency', 'web agency', 'creative studio'],
  'portfolio': ['portfolio', 'personal', 'resume', 'cv', 'showcase', 'my work', 'my projects', 'developer portfolio', 'designer portfolio'],
  'analytics-dashboard': ['analytics', 'metrics', 'kpi', 'data visualization', 'charts', 'reports', 'reporting', 'business intelligence', 'data platform', 'tracking'],
  'project-management': ['project management', 'kanban', 'tasks', 'todo', 'agile', 'scrum', 'sprints', 'jira', 'asana', 'trello', 'linear', 'team collaboration'],
  'internal-admin': ['admin', 'admin panel', 'backoffice', 'back-office', 'internal tool', 'content management', 'cms', 'user management'],
  'social-community': ['social', 'community', 'social network', 'forum', 'feed', 'posts', 'followers', 'messaging', 'chat', 'groups', 'reddit', 'twitter'],
};

export function matchProjectTemplate(prompt: string): TemplateMatch {
  const lower = prompt.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [id, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length > 1 ? 20 : 10;
      }
    }
    scores[id] = score;
  }

  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const [templateId, rawScore] = topId;
  const template = TEMPLATE_LIBRARY.find(t => t.id === templateId)!;
  const confidence = Math.min(99, Math.max(45, rawScore > 0 ? 50 + rawScore * 3 : 45));

  return { templateId, confidence, template };
}

export function matchProjectTemplateAll(prompt: string): TemplateMatch[] {
  const lower = prompt.toLowerCase();
  const results: TemplateMatch[] = [];

  for (const [id, keywords] of Object.entries(TEMPLATE_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.split(' ').length > 1 ? 20 : 10;
      }
    }
    if (score > 0) {
      const template = TEMPLATE_LIBRARY.find(t => t.id === id)!;
      const confidence = Math.min(99, Math.max(45, 50 + score * 3));
      results.push({ templateId: id, confidence, template });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

// ── Template Mixer (Hybrid System) ───────────────────────────────────────────

export function mergeTemplates(
  templateIds: string[],
  weights?: Record<string, number>
): MergedTemplate {
  const templates = templateIds.map(id => TEMPLATE_LIBRARY.find(t => t.id === id)).filter(Boolean) as ProjectTemplate[];
  if (templates.length === 0) {
    const fallback = TEMPLATE_LIBRARY[0];
    return { pages: fallback.pages, routes: fallback.routes, apis: fallback.apis, databaseTables: fallback.databaseTables, features: fallback.features, authRequired: fallback.authRequired, templateDna: { [fallback.id]: 100 } };
  }

  const totalWeight = templateIds.reduce((acc, id) => acc + (weights?.[id] ?? 50), 0);
  const templateDna: Record<string, number> = {};
  for (const id of templateIds) {
    templateDna[id] = Math.round(((weights?.[id] ?? 50) / totalWeight) * 100);
  }

  const pages = [...new Set(templates.flatMap(t => t.pages))];
  const routes = [...new Set(templates.flatMap(t => t.routes))];
  const apis = [...new Set(templates.flatMap(t => t.apis))];
  const databaseTables = [...new Set(templates.flatMap(t => t.databaseTables))];
  const features = [...new Set(templates.flatMap(t => t.features))];
  const authRequired = templates.some(t => t.authRequired);

  return { pages, routes, apis, databaseTables, features, authRequired, templateDna };
}

// ── Template Health Score ─────────────────────────────────────────────────────

export function computeTemplateHealth(template: ProjectTemplate): TemplateHealth {
  const issues: string[] = [];

  const architectureCompleteness = Math.min(100,
    (template.pages.length > 2 ? 25 : 10) +
    (template.routes.length > 2 ? 25 : 10) +
    (template.features.length > 3 ? 25 : 10) +
    (template.description.length > 20 ? 25 : 10)
  );

  const maxApis = 8;
  const apiCoverage = Math.min(100, Math.round((template.apis.length / maxApis) * 100));
  if (template.authRequired && !template.apis.includes('auth')) issues.push('Auth API missing');

  const maxTables = 8;
  const databaseCoverage = Math.min(100, Math.round((template.databaseTables.length / maxTables) * 100));
  if (template.databaseTables.length === 0 && template.authRequired) issues.push('No database tables for auth app');

  const regKeys = Object.keys(template.recommendedRegistryComponents).length;
  const registryCoverage = Math.min(100, Math.round((regKeys / 5) * 100));
  if (regKeys < 2) issues.push('Limited registry component mapping');

  const editCompatibility = Math.min(100,
    (template.databaseTables.length > 2 ? 30 : 15) +
    (template.apis.length > 3 ? 30 : 15) +
    (template.pages.length > 4 ? 20 : 10) +
    (template.features.length > 4 ? 20 : 10)
  );

  const overallScore = Math.round(
    (architectureCompleteness * 0.3) +
    (apiCoverage * 0.2) +
    (databaseCoverage * 0.2) +
    (registryCoverage * 0.15) +
    (editCompatibility * 0.15)
  );

  return {
    architectureCompleteness,
    apiCoverage,
    databaseCoverage,
    registryCoverage,
    editCompatibility,
    overallScore,
    passed: overallScore >= 85,
    issues,
  };
}

// ── Template Context String (for Architecture Agent injection) ────────────────

export function buildTemplateContext(template: ProjectTemplate): string {
  return `
TEMPLATE CONTEXT: ${template.name} (${template.category})
Use this as the starting architecture blueprint:
- Pages: ${template.pages.join(', ')}
- Routes: ${template.routes.join(', ')}
- APIs: ${template.apis.join(', ')}
- Database Tables: ${template.databaseTables.join(', ')}
- Features: ${template.features.join(', ')}
- Auth Required: ${template.authRequired}
Expand and adapt this architecture based on the user prompt. Add domain-specific details.`.trim();
}

export function buildMergedTemplateContext(merged: MergedTemplate): string {
  const dnaStr = Object.entries(merged.templateDna).map(([id, pct]) => `${id} (${pct}%)`).join(' + ');
  return `
HYBRID TEMPLATE DNA: ${dnaStr}
Merged architecture blueprint:
- Pages: ${merged.pages.join(', ')}
- Routes: ${merged.routes.join(', ')}
- APIs: ${merged.apis.join(', ')}
- Database Tables: ${merged.databaseTables.join(', ')}
- Features: ${merged.features.join(', ')}
- Auth Required: ${merged.authRequired}
Expand and adapt this merged architecture based on the user prompt.`.trim();
}

// ── localStorage persistence ──────────────────────────────────────────────────

const TEMPLATE_KEY = (chatId: string) => `voxai_template_${chatId}`;
const TEMPLATE_HISTORY_KEY = (chatId: string) => `voxai_template_history_${chatId}`;

export function saveSelectedTemplate(chatId: string, template: ProjectTemplate): void {
  try { localStorage.setItem(TEMPLATE_KEY(chatId), JSON.stringify(template)); } catch {}
}

export function loadSelectedTemplate(chatId: string): ProjectTemplate | null {
  try {
    const raw = localStorage.getItem(TEMPLATE_KEY(chatId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveTemplateHistory(chatId: string, history: ProjectTemplate[]): void {
  try { localStorage.setItem(TEMPLATE_HISTORY_KEY(chatId), JSON.stringify(history)); } catch {}
}

export function loadTemplateHistory(chatId: string): ProjectTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATE_HISTORY_KEY(chatId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function clearTemplateData(chatId: string): void {
  try {
    localStorage.removeItem(TEMPLATE_KEY(chatId));
    localStorage.removeItem(TEMPLATE_HISTORY_KEY(chatId));
  } catch {}
}
