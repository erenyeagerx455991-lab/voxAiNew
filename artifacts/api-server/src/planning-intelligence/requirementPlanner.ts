// ── V9.7 Planning Intelligence — Phase 2: Requirement Extraction ──────────────
import type { RequirementBlueprint, DetectedFeature } from './planningTypes.js';

function detect(lower: string, ...terms: string[]): boolean {
  return terms.some(t => lower.includes(t));
}

function conf(lower: string, terms: string[]): number {
  return Math.min(1, terms.filter(t => lower.includes(t)).length / Math.max(1, terms.length) * 3);
}

function feature(id: string, name: string, lower: string, terms: string[]): DetectedFeature {
  const detected = detect(lower, ...terms);
  return { id, name, detected, confidence: detected ? conf(lower, terms) : 0, source: terms[0] };
}

export function extractRequirements(
  prompt: string,
  complexity: 'simple' | 'standard' | 'enterprise',
): RequirementBlueprint {
  const lower = prompt.toLowerCase();

  // ── Pages ──────────────────────────────────────────────────────────────────
  const pages: string[] = ['landing'];
  if (detect(lower, 'dashboard')) pages.push('dashboard');
  if (detect(lower, 'profile', 'account', 'user.?page')) pages.push('profile');
  if (detect(lower, 'setting', 'preference')) pages.push('settings');
  if (detect(lower, 'admin', 'administration')) pages.push('admin');
  if (detect(lower, 'pricing', 'plan', 'subscription')) pages.push('pricing');
  if (detect(lower, 'blog', 'article', 'post', 'cms')) pages.push('blog');
  if (detect(lower, 'about')) pages.push('about');
  if (detect(lower, 'contact', 'support', 'help')) pages.push('contact');
  if (detect(lower, 'auth', 'login', 'register', 'sign')) pages.push('auth');
  if (detect(lower, 'checkout', 'cart', 'order')) pages.push('checkout');
  if (detect(lower, 'report', 'analytics.?page')) pages.push('reports');
  if (complexity === 'enterprise') pages.push('audit-log', 'team-management');

  // ── Layouts ────────────────────────────────────────────────────────────────
  const layouts: string[] = ['root'];
  if (detect(lower, 'dashboard', 'admin', 'sidebar')) layouts.push('app-shell');
  if (detect(lower, 'landing', 'marketing', 'public')) layouts.push('marketing');
  if (detect(lower, 'auth', 'login')) layouts.push('auth');
  if (detect(lower, 'docs', 'documentation')) layouts.push('docs');

  // ── Components ────────────────────────────────────────────────────────────
  const components: string[] = ['navbar', 'footer'];
  if (detect(lower, 'dashboard', 'sidebar', 'drawer')) components.push('sidebar');
  if (detect(lower, 'modal', 'dialog', 'popup')) components.push('modal');
  if (detect(lower, 'table', 'list', 'grid', 'data.?table')) components.push('data-table');
  if (detect(lower, 'chart', 'graph', 'analytic', 'visualiz')) components.push('chart');
  if (detect(lower, 'card', 'tile', 'widget')) components.push('card');
  if (detect(lower, 'form', 'input', 'field')) components.push('form');
  if (detect(lower, 'button', 'cta', 'action')) components.push('button');
  if (detect(lower, 'notification', 'alert', 'toast')) components.push('notification');
  if (detect(lower, 'upload', 'file', 'attachment', 'image')) components.push('file-upload');
  if (detect(lower, 'search', 'filter', 'query')) components.push('search');
  if (detect(lower, 'pricing', 'plan', 'tier')) components.push('pricing-table');
  if (detect(lower, 'testimonial', 'review', 'feedback')) components.push('testimonial');
  if (detect(lower, 'hero', 'banner', 'headline')) components.push('hero');

  // ── APIs ──────────────────────────────────────────────────────────────────
  const apis: string[] = [];
  if (detect(lower, 'auth', 'login', 'register', 'sign')) apis.push('auth-api');
  if (detect(lower, 'user', 'profile', 'account')) apis.push('users-api');
  if (detect(lower, 'product', 'item', 'catalog', 'listing')) apis.push('products-api');
  if (detect(lower, 'order', 'cart', 'checkout', 'purchase')) apis.push('orders-api');
  if (detect(lower, 'payment', 'billing', 'stripe', 'paypal')) apis.push('payments-api');
  if (detect(lower, 'notification', 'email', 'alert')) apis.push('notifications-api');
  if (detect(lower, 'search', 'filter', 'query')) apis.push('search-api');
  if (detect(lower, 'analytic', 'metric', 'event')) apis.push('analytics-api');
  if (detect(lower, 'file', 'upload', 'media', 'storage')) apis.push('upload-api');
  if (detect(lower, 'webhook', 'event', 'integration')) apis.push('webhooks-api');
  if (detect(lower, 'admin', 'moderat')) apis.push('admin-api');
  if (!apis.length) apis.push('core-api');

  // ── Database ──────────────────────────────────────────────────────────────
  const database: string[] = ['users'];
  if (detect(lower, 'session', 'auth', 'token')) database.push('sessions');
  if (detect(lower, 'product', 'item', 'listing')) database.push('products');
  if (detect(lower, 'order', 'purchase', 'checkout')) database.push('orders');
  if (detect(lower, 'payment', 'billing', 'invoice')) database.push('payments');
  if (detect(lower, 'notification', 'message')) database.push('notifications');
  if (detect(lower, 'analytics', 'event', 'track')) database.push('events');
  if (detect(lower, 'content', 'blog', 'post', 'cms')) database.push('content');
  if (detect(lower, 'setting', 'config', 'preference')) database.push('settings');
  if (detect(lower, 'team', 'organization', 'workspace')) database.push('teams');
  if (detect(lower, 'role', 'permission', 'rbac')) database.push('roles');

  // ── Boolean flags ─────────────────────────────────────────────────────────
  const authentication = detect(lower, 'auth', 'login', 'register', 'sign.?in', 'sign.?up', 'user');
  const authorization  = detect(lower, 'role', 'permission', 'rbac', 'admin', 'access.?control', 'policy');
  const dashboard      = detect(lower, 'dashboard', 'analytics.?page', 'admin.?panel', 'overview');
  const adminPanel     = detect(lower, 'admin', 'administration', 'manage', 'moderate', 'cms');
  const cms            = detect(lower, 'cms', 'content.?management', 'blog', 'article', 'editor', 'rich.?text');
  const payments       = detect(lower, 'payment', 'billing', 'subscription', 'stripe', 'paypal', 'checkout', 'invoice');
  const notifications  = detect(lower, 'notification', 'email', 'push', 'alert', 'sms', 'message');
  const analytics      = detect(lower, 'analytic', 'tracking', 'metric', 'report', 'kpi', 'chart', 'insight');
  const search         = detect(lower, 'search', 'filter', 'query', 'find', 'explore', 'discover');
  const settings       = detect(lower, 'setting', 'preference', 'configuration', 'profile');
  const reports        = detect(lower, 'report', 'export', 'pdf', 'csv', 'data.?export');
  const featureFlags   = detect(lower, 'feature.?flag', 'a/b.?test', 'experiment', 'toggle', 'rollout');

  // ── Forms ─────────────────────────────────────────────────────────────────
  const forms: string[] = [];
  if (detect(lower, 'login', 'sign.?in')) forms.push('login-form');
  if (detect(lower, 'register', 'sign.?up')) forms.push('registration-form');
  if (detect(lower, 'contact', 'enquir', 'inquiry', 'message')) forms.push('contact-form');
  if (detect(lower, 'profile', 'account', 'edit')) forms.push('profile-form');
  if (detect(lower, 'payment', 'checkout', 'billing')) forms.push('payment-form');
  if (detect(lower, 'search', 'filter')) forms.push('search-form');
  if (detect(lower, 'upload', 'file', 'media')) forms.push('upload-form');
  if (detect(lower, 'setting', 'preference')) forms.push('settings-form');

  // ── User Roles ────────────────────────────────────────────────────────────
  const userRoles: string[] = ['user'];
  if (detect(lower, 'admin')) userRoles.push('admin');
  if (detect(lower, 'moderator', 'moderat')) userRoles.push('moderator');
  if (detect(lower, 'super.?admin', 'root')) userRoles.push('super-admin');
  if (detect(lower, 'member', 'subscriber')) userRoles.push('member');
  if (detect(lower, 'guest', 'visitor', 'public')) userRoles.push('guest');
  if (complexity === 'enterprise' && !detect(lower, 'manager')) userRoles.push('manager');

  // ── Detected features list ────────────────────────────────────────────────
  const detectedFeatures: DetectedFeature[] = [
    feature('auth',    'Authentication',    lower, ['auth', 'login', 'register', 'jwt', 'oauth']),
    feature('rbac',    'Authorization',     lower, ['role', 'permission', 'rbac', 'access.control']),
    feature('dash',    'Dashboard',         lower, ['dashboard', 'analytics.page', 'overview']),
    feature('pay',     'Payments',          lower, ['payment', 'stripe', 'billing', 'subscription']),
    feature('notif',   'Notifications',     lower, ['notification', 'email', 'push', 'alert']),
    feature('search',  'Search',            lower, ['search', 'filter', 'query', 'find']),
    feature('analytics','Analytics',        lower, ['analytic', 'tracking', 'metric', 'kpi']),
    feature('admin',   'Admin Panel',       lower, ['admin', 'moderat', 'manage']),
    feature('cms',     'CMS',               lower, ['cms', 'blog', 'content', 'editor']),
    feature('reports', 'Reports',           lower, ['report', 'export', 'csv', 'pdf']),
    feature('realtime','Real-time',         lower, ['websocket', 'real.time', 'live', 'socket.io']),
    feature('upload',  'File Upload',       lower, ['upload', 'file', 'media', 'attachment']),
  ];

  const totalRequirements = pages.length + apis.length + database.length + forms.length +
    [authentication, authorization, dashboard, adminPanel, cms, payments, notifications, analytics,
      search, settings, reports, featureFlags].filter(Boolean).length;

  // Complexity score: 0-10
  const complexityScore = Math.min(10, Math.round(
    (pages.length * 0.3 + apis.length * 0.4 + database.length * 0.2 +
      detectedFeatures.filter(f => f.detected).length * 0.5) / 1.5
  ));

  return {
    pages, layouts, components, apis, database,
    authentication, authorization, dashboard, adminPanel, forms, cms,
    payments, notifications, analytics, search, settings, reports,
    userRoles, featureFlags,
    detectedFeatures, totalRequirements, complexityScore,
  };
}
