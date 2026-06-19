export interface TemplateEntry {
  id: string;
  name: string;
  category: string;
  icon: string;
  qualityScore: number;
  projectType: string;
  pages: string[];
  routes: string[];
  databaseTables: string[];
  apis: string[];
  features: string[];
  authRequired: boolean;
  tags: string[];
  description: string;
}

export const TEMPLATE_LIBRARY_SERVER: TemplateEntry[] = [
  { id: 'ai-saas', name: 'AI SaaS', category: 'SaaS', icon: '🤖', qualityScore: 97, projectType: 'SaaS', pages: ['Landing', 'Dashboard', 'Projects', 'Workspace', 'Settings', 'Billing', 'Login', 'Signup', 'API Keys'], routes: ['/', '/dashboard', '/projects', '/workspace/:id', '/settings', '/billing', '/login', '/signup', '/api-keys'], databaseTables: ['users', 'projects', 'generations', 'subscriptions', 'api_keys', 'usage_logs'], apis: ['auth', 'projects', 'generate', 'billing', 'api-keys', 'usage'], features: ['AI Generation', 'Project Workspace', 'API Key Management', 'Usage Metering', 'Stripe Billing', 'Team Collaboration'], authRequired: true, tags: ['ai', 'saas', 'billing', 'stripe'], description: 'Full-stack AI-powered SaaS with billing, projects workspace, and API key management.' },
  { id: 'crm', name: 'CRM', category: 'Business', icon: '📊', qualityScore: 95, projectType: 'CRM', pages: ['Landing', 'Dashboard', 'Customers', 'Deals', 'Pipeline', 'Tasks', 'Reports', 'Settings', 'Login', 'Signup'], routes: ['/', '/dashboard', '/customers', '/customers/:id', '/deals', '/pipeline', '/tasks', '/reports', '/settings', '/login'], databaseTables: ['users', 'customers', 'deals', 'tasks', 'activities', 'pipelines', 'tags'], apis: ['auth', 'customers', 'deals', 'tasks', 'activities', 'pipelines', 'reports'], features: ['Deal Pipeline', 'Customer Profiles', 'Activity Timeline', 'Revenue Analytics', 'Task Management', 'CSV Import/Export'], authRequired: true, tags: ['crm', 'sales', 'customers'], description: 'Customer Relationship Management platform with pipeline, deals, and analytics.' },
  { id: 'lms', name: 'LMS', category: 'Education', icon: '🎓', qualityScore: 94, projectType: 'SaaS', pages: ['Landing', 'Dashboard', 'Courses', 'Course Detail', 'Lesson', 'Quiz', 'Progress', 'Certificates', 'Settings', 'Login', 'Signup'], routes: ['/', '/dashboard', '/courses', '/courses/:id', '/courses/:id/lessons/:lessonId', '/quiz/:id', '/progress', '/certificates', '/settings', '/login'], databaseTables: ['users', 'courses', 'lessons', 'quizzes', 'enrollments', 'progress', 'certificates', 'assignments'], apis: ['auth', 'courses', 'lessons', 'quizzes', 'enrollments', 'progress', 'certificates'], features: ['Video Lessons', 'Interactive Quizzes', 'Progress Tracking', 'Certificates', 'Course Catalog', 'Assignments'], authRequired: true, tags: ['lms', 'learning', 'courses', 'education'], description: 'Learning Management System with courses, lessons, video, quizzes, and progress tracking.' },
  { id: 'ecommerce', name: 'E-Commerce', category: 'Commerce', icon: '🛒', qualityScore: 96, projectType: 'E-commerce', pages: ['Landing', 'Products', 'Product Detail', 'Cart', 'Checkout', 'Order Confirmation', 'Orders', 'Account', 'Admin Dashboard', 'Login', 'Signup'], routes: ['/', '/products', '/products/:slug', '/cart', '/checkout', '/orders/:id/confirmation', '/orders', '/account', '/admin', '/login'], databaseTables: ['users', 'products', 'categories', 'orders', 'order_items', 'cart_items', 'reviews', 'inventory'], apis: ['auth', 'products', 'categories', 'cart', 'orders', 'payments', 'reviews', 'inventory'], features: ['Product Catalog', 'Shopping Cart', 'Stripe Checkout', 'Order Tracking', 'Reviews', 'Inventory Management', 'Admin Dashboard'], authRequired: true, tags: ['ecommerce', 'shop', 'store'], description: 'Full e-commerce store with products, cart, checkout, orders, and admin panel.' },
  { id: 'agency', name: 'Agency', category: 'Marketing', icon: '🎨', qualityScore: 91, projectType: 'Agency', pages: ['Landing', 'Services', 'Portfolio', 'Case Studies', 'Case Study Detail', 'About', 'Team', 'Blog', 'Contact'], routes: ['/', '/services', '/portfolio', '/work', '/work/:slug', '/about', '/team', '/blog', '/contact'], databaseTables: ['projects', 'services', 'team_members', 'blog_posts', 'inquiries'], apis: ['projects', 'services', 'team', 'blog', 'contact'], features: ['Portfolio Gallery', 'Case Studies', 'Team Profiles', 'Blog', 'Contact Form', 'Service Packages'], authRequired: false, tags: ['agency', 'portfolio', 'creative'], description: 'Creative agency website with services, portfolio, case studies, and contact forms.' },
  { id: 'portfolio', name: 'Portfolio', category: 'Personal', icon: '💼', qualityScore: 88, projectType: 'Portfolio', pages: ['Home', 'Projects', 'Project Detail', 'About', 'Blog', 'Contact'], routes: ['/', '/projects', '/projects/:slug', '/about', '/blog', '/contact'], databaseTables: ['projects', 'skills', 'experiences', 'blog_posts'], apis: ['projects', 'blog', 'contact'], features: ['Projects Showcase', 'Skills Matrix', 'Work Experience Timeline', 'Blog', 'Contact Form', 'Resume Download'], authRequired: false, tags: ['portfolio', 'personal', 'developer'], description: 'Developer or designer portfolio with projects showcase, skills, and contact.' },
  { id: 'analytics-dashboard', name: 'Analytics Platform', category: 'Analytics', icon: '📈', qualityScore: 95, projectType: 'Dashboard App', pages: ['Landing', 'Dashboard', 'Reports', 'Data Explorer', 'Alerts', 'Integrations', 'Settings', 'Login', 'Signup'], routes: ['/', '/dashboard', '/reports', '/reports/:id', '/explorer', '/alerts', '/integrations', '/settings', '/login'], databaseTables: ['users', 'dashboards', 'reports', 'widgets', 'alerts', 'data_sources', 'events'], apis: ['auth', 'dashboards', 'reports', 'widgets', 'alerts', 'events', 'data-sources'], features: ['Real-time Charts', 'Custom Dashboards', 'Report Builder', 'Alert Rules', 'Data Source Integrations', 'Scheduled Reports'], authRequired: true, tags: ['analytics', 'dashboard', 'charts', 'metrics'], description: 'Data analytics platform with real-time charts, reports, and alert management.' },
  { id: 'project-management', name: 'Project Management', category: 'Productivity', icon: '📋', qualityScore: 96, projectType: 'Dashboard App', pages: ['Dashboard', 'Projects', 'Project Board', 'Tasks', 'Sprints', 'Team', 'Calendar', 'Reports', 'Settings', 'Login', 'Signup'], routes: ['/dashboard', '/projects', '/projects/:id/board', '/tasks', '/sprints', '/team', '/calendar', '/reports', '/settings', '/login'], databaseTables: ['users', 'projects', 'tasks', 'sprints', 'labels', 'comments', 'attachments', 'team_members'], apis: ['auth', 'projects', 'tasks', 'sprints', 'team', 'comments', 'attachments'], features: ['Kanban Board', 'Sprint Planning', 'Task Assignment', 'Time Tracking', 'File Attachments', 'Comments', 'Gantt View'], authRequired: true, tags: ['project management', 'kanban', 'tasks', 'agile'], description: 'Project management tool with kanban boards, tasks, sprints, and team collaboration.' },
  { id: 'internal-admin', name: 'Admin Panel', category: 'Internal', icon: '⚙️', qualityScore: 93, projectType: 'Dashboard App', pages: ['Dashboard', 'Users', 'Content', 'Analytics', 'Roles & Permissions', 'Settings', 'Logs', 'Login'], routes: ['/dashboard', '/users', '/users/:id', '/content', '/analytics', '/roles', '/settings', '/logs', '/login'], databaseTables: ['users', 'roles', 'permissions', 'content', 'audit_logs', 'system_settings'], apis: ['auth', 'users', 'roles', 'content', 'audit-logs', 'settings'], features: ['User Management', 'Role-Based Access', 'Content CRUD', 'Audit Logs', 'System Settings', 'Data Tables', 'Bulk Actions'], authRequired: true, tags: ['admin', 'internal', 'cms'], description: 'Internal admin panel with user management, content control, and system logs.' },
  { id: 'social-community', name: 'Social Community', category: 'Social', icon: '👥', qualityScore: 94, projectType: 'SaaS', pages: ['Landing', 'Feed', 'Profile', 'Messages', 'Communities', 'Events', 'Notifications', 'Settings', 'Login', 'Signup'], routes: ['/', '/feed', '/profile/:username', '/messages', '/messages/:id', '/communities', '/communities/:id', '/events', '/notifications', '/settings', '/login'], databaseTables: ['users', 'posts', 'comments', 'likes', 'follows', 'messages', 'communities', 'events', 'notifications'], apis: ['auth', 'posts', 'comments', 'likes', 'follows', 'messages', 'communities', 'events', 'notifications'], features: ['Social Feed', 'User Profiles', 'Real-time Messaging', 'Community Groups', 'Events', 'Likes & Comments', 'Follow System'], authRequired: true, tags: ['social', 'community', 'messaging'], description: 'Social community platform with feed, profiles, messaging, and community groups.' },
];

export const TEMPLATE_MATCH_KEYWORDS: Record<string, string[]> = {
  'ai-saas': ['ai', 'artificial intelligence', 'llm', 'gpt', 'openai', 'saas', 'api', 'generation', 'assistant', 'chatbot', 'writing assistant', 'code assistant', 'image generation', 'machine learning', 'copilot'],
  'crm': ['crm', 'customer', 'clients', 'sales', 'deals', 'leads', 'pipeline', 'relationship', 'contact management'],
  'lms': ['lms', 'learning', 'courses', 'education', 'lessons', 'students', 'teachers', 'quiz', 'e-learning', 'online course', 'training', 'academy'],
  'ecommerce': ['ecommerce', 'e-commerce', 'shop', 'store', 'products', 'cart', 'checkout', 'buy', 'sell', 'marketplace'],
  'agency': ['agency', 'creative', 'design studio', 'branding', 'marketing agency', 'digital agency', 'web agency'],
  'portfolio': ['portfolio', 'personal', 'resume', 'showcase', 'my work', 'my projects', 'developer portfolio'],
  'analytics-dashboard': ['analytics', 'metrics', 'kpi', 'data visualization', 'charts', 'reports', 'reporting', 'business intelligence', 'data platform', 'tracking'],
  'project-management': ['project management', 'kanban', 'tasks', 'todo', 'agile', 'scrum', 'sprints', 'jira', 'asana', 'trello', 'linear', 'team collaboration'],
  'internal-admin': ['admin', 'admin panel', 'backoffice', 'internal tool', 'content management', 'cms', 'user management'],
  'social-community': ['social', 'community', 'social network', 'forum', 'feed', 'posts', 'followers', 'messaging', 'groups'],
};

export function serverMatchTemplate(prompt: string): { templateId: string; confidence: number; template: TemplateEntry } {
  const lower = prompt.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [id, keywords] of Object.entries(TEMPLATE_MATCH_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) { if (lower.includes(kw)) score += kw.split(' ').length > 1 ? 20 : 10; }
    scores[id] = score;
  }
  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const [templateId, rawScore] = topId;
  const template = TEMPLATE_LIBRARY_SERVER.find(t => t.id === templateId)!;
  const confidence = Math.min(99, Math.max(45, rawScore > 0 ? 50 + rawScore * 3 : 45));
  return { templateId, confidence, template };
}

export function buildTemplateContextServer(template: TemplateEntry): string {
  return `TEMPLATE CONTEXT: ${template.name} (${template.category})
Use this as the starting architecture blueprint — expand based on the user's specific requirements:
- Pages: ${template.pages.join(', ')}
- Routes: ${template.routes.join(', ')}
- APIs: ${template.apis.join(', ')}
- Database Tables: ${template.databaseTables.join(', ')}
- Features: ${template.features.join(', ')}
- Auth Required: ${template.authRequired}`;
}
