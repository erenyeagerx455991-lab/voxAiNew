// ── V8.5 Frontend Architect — Project Classification & Accessibility ──────────

import type { ProjectType, AccessibilityArchitecture } from './frontendTypes.js';
import type { ProductGoal } from '../product-manager/productTypes.js';

const PROJECT_TYPE_SIGNALS: Array<{ keywords: RegExp; type: ProjectType; weight: number }> = [
  { keywords: /landing.*page|waitlist|coming.*soon|hero.*section|get.*early.*access/i, type: 'LandingPage',       weight: 3 },
  { keywords: /\bdashboard\b|control.*panel|metrics.*overview|analytics.*dashboard/i,   type: 'Dashboard',         weight: 3 },
  { keywords: /admin.*panel|admin.*interface|back.*office|internal.*admin|\badmin\b.*tool/i, type: 'AdminPanel',   weight: 4 },
  { keywords: /marketplace|multi.*vendor|seller.*buyer|listing.*platform/i,            type: 'Marketplace',       weight: 3 },
  { keywords: /portfolio|personal.*site|showcase.*work|my.*projects/i,                 type: 'Portfolio',         weight: 3 },
  { keywords: /\bsaas\b|software.*service|multi.*tenant|subscription.*app/i,          type: 'SaaS',              weight: 2 },
  { keywords: /\bcrm\b|customer.*relationship|sales.*pipeline|contact.*management/i,  type: 'CRM',               weight: 3 },
  { keywords: /\berp\b|enterprise.*resource|inventory.*management|supply.*chain/i,    type: 'ERP',               weight: 3 },
  { keywords: /analytics.*platform|data.*visualization|business.*intelligence|kpi/i,  type: 'Analytics',         weight: 3 },
  { keywords: /documentation|developer.*guide|api.*reference|\bdocs\b.*site/i,        type: 'Documentation',     weight: 3 },
  { keywords: /ai.*tool|ai.*assistant|llm.*app|copilot|gpt.*powered|chatgpt/i,        type: 'AIApplication',     weight: 3 },
  { keywords: /e.?commerce|online.*store|shop|product.*catalog|checkout/i,            type: 'ECommerce',         weight: 3 },
  { keywords: /healthcare|medical|patient|clinic|telemedicine|ehr/i,                  type: 'Healthcare',        weight: 3 },
  { keywords: /fintech|finance|banking|investment|trading|payment.*platform/i,        type: 'Finance',           weight: 3 },
  { keywords: /education|learning.*management|course|lms|tutoring|e.?learning/i,      type: 'Education',         weight: 3 },
  { keywords: /booking|reservation|appointment|scheduling.*app|calendar.*booking/i,   type: 'Booking',           weight: 3 },
  { keywords: /social.*platform|social.*network|community|feed|followers/i,           type: 'SocialPlatform',    weight: 3 },
  { keywords: /developer.*tool|cli.*dashboard|devops|deployment.*tool|ci.*cd/i,       type: 'DeveloperTool',     weight: 3 },
  { keywords: /\bcms\b|content.*management|blog.*editor|headless.*cms/i,              type: 'CMS',               weight: 3 },
  { keywords: /\bblog\b|article.*site|publication|newsletter/i,                       type: 'Blog',              weight: 3 },
  { keywords: /chat.*app|messaging.*app|real.*time.*chat|instant.*messaging/i,        type: 'ChatApp',           weight: 3 },
  { keywords: /productivity|task.*manager|to.*do|project.*management|kanban/i,        type: 'Productivity',      weight: 2 },
  { keywords: /internal.*tool|intranet|employee.*portal|ops.*tool/i,                  type: 'InternalTool',      weight: 3 },
  { keywords: /enterprise.*platform|b2b.*platform|corporate.*software/i,              type: 'EnterprisePlatform', weight: 3 },
];

const GOAL_TO_PROJECT_TYPE: Partial<Record<ProductGoal, ProjectType>> = {
  LandingPage:       'LandingPage',
  Dashboard:         'Dashboard',
  Portfolio:         'Portfolio',
  SaaS:              'SaaS',
  CRM:               'CRM',
  ECommerce:         'ECommerce',
  Blog:              'Blog',
  KnowledgeBase:     'Documentation',
  Marketplace:       'Marketplace',
  AdminPanel:        'AdminPanel',
  AIProduct:         'AIApplication',
  AnalyticsPlatform: 'Analytics',
  DeveloperTool:     'DeveloperTool',
  Education:         'Education',
  Healthcare:        'Healthcare',
  Finance:           'Finance',
  BookingPlatform:   'Booking',
  CommunityPlatform: 'SocialPlatform',
  InternalTool:      'InternalTool',
  EnterpriseSoftware:'EnterprisePlatform',
};

export function classifyProjectType(prompt: string, productGoal: ProductGoal): { type: ProjectType; confidence: number } {
  const scores = new Map<ProjectType, number>();

  for (const signal of PROJECT_TYPE_SIGNALS) {
    if (signal.keywords.test(prompt)) {
      scores.set(signal.type, (scores.get(signal.type) ?? 0) + signal.weight);
    }
  }

  if (scores.size > 0) {
    const sorted = [...scores.entries()].sort(([, a], [, b]) => b - a);
    const topScore = sorted[0][1];
    const maxPossible = 3;
    return { type: sorted[0][0], confidence: Math.min(1, topScore / maxPossible) };
  }

  // Fallback: map from ProductGoal
  const mapped = GOAL_TO_PROJECT_TYPE[productGoal];
  if (mapped) return { type: mapped, confidence: 0.7 };

  return { type: 'SaaS', confidence: 0.4 };
}

export function planAccessibilityArchitecture(
  projectType: ProjectType,
): AccessibilityArchitecture {
  const isPublic = ['LandingPage', 'ECommerce', 'Blog', 'Documentation', 'Education', 'Healthcare', 'Booking'].includes(projectType);
  const isApp    = ['SaaS', 'Dashboard', 'CRM', 'Analytics', 'AIApplication', 'Productivity', 'InternalTool', 'EnterprisePlatform'].includes(projectType);
  const needsAA  = isPublic || isApp;

  return {
    hasKeyboardNav:        true, // always
    hasFocusManagement:    needsAA,
    hasARIA:               needsAA,
    hasColorContrast:      true, // always
    hasReducedMotion:      true, // always — prefers-reduced-motion media query
    hasSemanticHTML:       true, // always
    hasScreenReaders:      isPublic,
    hasErrorAnnouncements: needsAA,
    hasSkipLinks:          isPublic,
    level:                 isPublic ? 'AA' : needsAA ? 'AA' : 'A',
  };
}
