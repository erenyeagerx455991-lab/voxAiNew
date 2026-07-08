// ── V8.6 Backend Architect — Project Type Classifier ──────────────────────────
import type { ProductGoal } from '../product-manager/productTypes.js';
import type { BackendType } from './backendTypes.js';
import { ALL_BACKEND_TYPES } from './backendTypes.js';

interface ClassifierRule {
  keywords: RegExp;
  type:     BackendType;
  weight:   number;
}

const CLASSIFIER_RULES: ClassifierRule[] = [
  { keywords: /landing.*page|marketing.*site|brochure|waitlist|coming.*soon/i,                type: 'LandingAPI',            weight: 4 },
  { keywords: /saas|software.*as.*service|subscription.*platform|multi.*tenant.*app/i,        type: 'SaaSBackend',           weight: 4 },
  { keywords: /crm|customer.*relation|sales.*pipeline|lead.*management|contact.*manage/i,     type: 'CRMBackend',            weight: 4 },
  { keywords: /erp|enterprise.*resource|supply.*chain|inventory.*manage|manufacturing/i,      type: 'ERPBackend',            weight: 4 },
  { keywords: /marketplace|multi.*vendor|seller.*platform|buyer.*seller|listing.*platform/i,  type: 'Marketplace',           weight: 4 },
  { keywords: /e.?commerce|online.*shop|product.*catalog|checkout|shopping.*cart/i,           type: 'ECommerce',             weight: 4 },
  { keywords: /dashboard|analytics.*app|data.*visualization|metrics.*platform|reporting/i,    type: 'Dashboard',             weight: 3 },
  { keywords: /internal.*tool|employee.*portal|ops.*tool|back.*office|admin.*panel/i,         type: 'InternalTool',          weight: 3 },
  { keywords: /booking|reservation|appointment|scheduling.*platform|calendar.*booking/i,      type: 'BookingPlatform',       weight: 4 },
  { keywords: /healthcare|medical|patient|ehr|clinical|health.*record|telemedicine/i,         type: 'Healthcare',            weight: 4 },
  { keywords: /finance|fintech|banking|investment|trading|payment.*platform|crypto/i,         type: 'Finance',               weight: 4 },
  { keywords: /education|lms|learning.*management|e.?learning|course.*platform|tutoring/i,   type: 'Education',             weight: 4 },
  { keywords: /developer.*tool|devtool|cli.*tool|sdk|api.*platform|developer.*platform/i,    type: 'DeveloperPlatform',     weight: 4 },
  { keywords: /analytics|data.*platform|bi.*tool|business.*intelligence|data.*warehouse/i,    type: 'Analytics',             weight: 3 },
  { keywords: /ai.*platform|ml.*platform|llm|gpt|openai|langchain|vector.*search/i,           type: 'AIPlatform',            weight: 4 },
  { keywords: /social.*network|community|forum|feed|follow|post|like|comment.*platform/i,     type: 'SocialPlatform',        weight: 3 },
  { keywords: /cms|content.*manage|headless.*cms|blog.*platform|editorial/i,                  type: 'CMS',                   weight: 4 },
  { keywords: /documentation|docs.*site|knowledge.*base|wiki|technical.*docs/i,               type: 'Documentation',         weight: 4 },
  { keywords: /enterprise.*software|large.*organization|corporate.*platform|b2b.*enterprise/i, type: 'Enterprise',           weight: 3 },
  { keywords: /multi.*tenant|tenant.*isolation|workspace.*isolation|org.*isolation/i,          type: 'MultiTenant',           weight: 4 },
  { keywords: /microservice|micro.*service|distributed.*service|service.*mesh/i,               type: 'MicroserviceCandidate', weight: 4 },
  { keywords: /serverless|lambda|edge.*function|function.*as.*service|faas/i,                  type: 'ServerlessCandidate',   weight: 4 },
  { keywords: /api.*gateway|gateway.*service|reverse.*proxy|bff/i,                             type: 'APIGateway',            weight: 4 },
];

const GOAL_TO_BACKEND_TYPE: Partial<Record<ProductGoal, BackendType>> = {
  LandingPage:       'LandingAPI',
  Dashboard:         'Dashboard',
  SaaS:              'SaaSBackend',
  CRM:               'CRMBackend',
  ECommerce:         'ECommerce',
  Marketplace:       'Marketplace',
  AdminPanel:        'InternalTool',
  AIProduct:         'AIPlatform',
  AnalyticsPlatform: 'Analytics',
  DeveloperTool:     'DeveloperPlatform',
  Education:         'Education',
  Healthcare:        'Healthcare',
  Finance:           'Finance',
  BookingPlatform:   'BookingPlatform',
  CommunityPlatform: 'SocialPlatform',
  InternalTool:      'InternalTool',
  EnterpriseSoftware:'Enterprise',
  KnowledgeBase:     'Documentation',
  Blog:              'CMS',
  Portfolio:         'LandingAPI',
};

export function classifyBackendType(
  prompt:      string,
  productGoal: ProductGoal,
): { type: BackendType; confidence: number } {
  const scores = new Map<BackendType, number>();

  for (const rule of CLASSIFIER_RULES) {
    if (rule.keywords.test(prompt)) {
      scores.set(rule.type, (scores.get(rule.type) ?? 0) + rule.weight);
    }
  }

  const goalType = GOAL_TO_BACKEND_TYPE[productGoal];
  if (goalType) {
    scores.set(goalType, (scores.get(goalType) ?? 0) + 5);
  }

  if (scores.size === 0) {
    return { type: goalType ?? 'SaaSBackend', confidence: 0.5 };
  }

  let best: BackendType = 'SaaSBackend';
  let bestScore = 0;
  let totalScore = 0;

  for (const [type, score] of scores) {
    totalScore += score;
    if (score > bestScore) {
      bestScore  = score;
      best       = type;
    }
  }

  const confidence = Math.min(0.99, bestScore / Math.max(totalScore, 1) + 0.2);
  return { type: best, confidence };
}

export function isEnterpriseBackend(type: BackendType): boolean {
  return ['Enterprise', 'MultiTenant', 'ERPBackend', 'MicroserviceCandidate', 'Healthcare', 'Finance'].includes(type);
}

export function isHighTrafficBackend(type: BackendType): boolean {
  return ['Marketplace', 'SocialPlatform', 'Analytics', 'AIPlatform', 'MicroserviceCandidate', 'APIGateway'].includes(type);
}

export function isSimpleBackend(type: BackendType): boolean {
  return ['LandingAPI', 'Documentation', 'ServerlessCandidate'].includes(type);
}

export { ALL_BACKEND_TYPES };
