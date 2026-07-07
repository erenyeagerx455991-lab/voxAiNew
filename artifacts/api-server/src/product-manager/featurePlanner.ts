// ── V8.4 Product Manager — Feature Planning ────────────────────────────────────
// Maps product goals and business objectives to intelligent feature sets.
// Weights optional features by persona and prompt keywords.

import type { ProductGoal, BusinessObjective, UserPersona, ProductFeature } from './productTypes.js';

// ── Base feature sets per product goal ───────────────────────────────────────

const GOAL_BASE_FEATURES: Record<ProductGoal, ProductFeature[]> = {
  LandingPage:         [],
  MarketingWebsite:    [],
  SaaS:                ['Authentication', 'Dashboard', 'Settings', 'Billing', 'Profile'],
  Dashboard:           ['Authentication', 'Dashboard', 'Analytics', 'Reports', 'Settings'],
  CRM:                 ['Authentication', 'CRM', 'Contacts', 'Dashboard', 'Reports'] as unknown as ProductFeature[],
  AdminPanel:          ['Authentication', 'Dashboard', 'Settings', 'AuditLogs', 'Permissions'],
  Marketplace:         ['Authentication', 'Payments', 'Search', 'Profile', 'Settings'],
  Portfolio:           [],
  Agency:              [],
  Blog:                [],
  AIProduct:           ['Authentication', 'AIAssistant', 'Dashboard', 'Settings', 'Billing'],
  ECommerce:           ['Authentication', 'Payments', 'Search', 'Profile', 'History'],
  Education:           ['Authentication', 'Dashboard', 'Calendar', 'Profile', 'Settings'],
  Healthcare:          ['Authentication', 'Calendar', 'Bookings', 'Profile', 'Settings'],
  Finance:             ['Authentication', 'Dashboard', 'Analytics', 'Reports', 'Billing'],
  DeveloperTool:       ['Authentication', 'Dashboard', 'Settings', 'AuditLogs'],
  EnterpriseSoftware:  ['Authentication', 'Dashboard', 'Teams', 'Permissions', 'AuditLogs'],
  BookingPlatform:     ['Authentication', 'Bookings', 'Calendar', 'Payments', 'Notifications'],
  InternalTool:        ['Authentication', 'Dashboard', 'Settings', 'Permissions'],
  AnalyticsPlatform:   ['Authentication', 'Dashboard', 'Analytics', 'Reports', 'Exports'],
  CommunityPlatform:   ['Authentication', 'Profile', 'Comments', 'Search', 'Notifications'],
  KnowledgeBase:       ['Search', 'Settings'],
} as Record<ProductGoal, ProductFeature[]>;

// ── Objective-based feature additions ─────────────────────────────────────────

const OBJECTIVE_FEATURES: Record<BusinessObjective, ProductFeature[]> = {
  LeadGeneration:    [],
  Sales:             ['Payments', 'Billing', 'Invoices'],
  Subscriptions:     ['Billing', 'Payments', 'Notifications'],
  Freemium:          ['Billing', 'Payments'],
  PaidSaaS:          ['Billing', 'Payments', 'Teams'],
  Downloads:         [],
  Appointments:      ['Calendar', 'Bookings', 'Notifications'],
  Bookings:          ['Bookings', 'Calendar', 'Payments'],
  DemoRequests:      [],
  Contact:           [],
  Newsletter:        [],
  CommunityGrowth:   ['Comments', 'Chat', 'Notifications'],
  UserActivation:    ['Notifications', 'Dashboard'],
  Retention:         ['Notifications', 'Analytics'],
  Upselling:         ['Billing', 'Notifications'],
  CrossSelling:      ['Search', 'Notifications'],
  BrandAwareness:    [],
  Hiring:            [],
  Support:           [],
  Documentation:     ['Search'],
};

// ── Prompt-keyword additional features ────────────────────────────────────────

const KEYWORD_FEATURES: Array<{ keywords: RegExp; feature: ProductFeature }> = [
  { keywords: /auth|login|sign.?in|sign.?up|register|account/i,   feature: 'Authentication'  },
  { keywords: /workspace|org|organization/i,                        feature: 'Workspace'       },
  { keywords: /project|task|issue/i,                                feature: 'Projects'        },
  { keywords: /billing|invoice|payment|stripe|checkout/i,          feature: 'Billing'         },
  { keywords: /notification|alert|email.*send|push/i,              feature: 'Notifications'   },
  { keywords: /search|filter|find|query/i,                          feature: 'Search'          },
  { keywords: /analytic|metric|track|insight|report/i,             feature: 'Analytics'       },
  { keywords: /dashboard|overview|home.*screen|main.*panel/i,      feature: 'Dashboard'       },
  { keywords: /profile|account.*setting|user.*page/i,              feature: 'Profile'         },
  { keywords: /setting|preference|configuration|config/i,          feature: 'Settings'        },
  { keywords: /team|member|org|organization|collaborate/i,         feature: 'Teams'           },
  { keywords: /permission|role|access.*control|rbac/i,             feature: 'Permissions'     },
  { keywords: /comment|discuss|thread|feedback/i,                  feature: 'Comments'        },
  { keywords: /chat|message|real.?time|instant.*message/i,         feature: 'Chat'            },
  { keywords: /report|csv|export|download.*data/i,                 feature: 'Reports'         },
  { keywords: /payment|stripe|billing|checkout|pay/i,             feature: 'Payments'        },
  { keywords: /calendar|schedule|event|meeting/i,                  feature: 'Calendar'        },
  { keywords: /booking|appointment|reservation|slot/i,             feature: 'Bookings'        },
  { keywords: /invoice|receipt|bill|quote/i,                       feature: 'Invoices'        },
  { keywords: /crm|customer.*relationship|lead|deal|pipeline/i,   feature: 'CRM'             },
  { keywords: /kanban|board|column|drag.*drop|scrum/i,             feature: 'Kanban'          },
  { keywords: /ai|gpt|llm|openai|copilot|assistant/i,             feature: 'AIAssistant'     },
  { keywords: /export|csv|pdf|download|extract/i,                  feature: 'Exports'         },
  { keywords: /import|upload|bulk.*upload|csv.*import/i,           feature: 'Imports'         },
  { keywords: /history|log|audit|version|timeline/i,              feature: 'History'         },
  { keywords: /audit.*log|compliance|soc2|gdpr|access.*log/i,     feature: 'AuditLogs'       },
];

// ── Persona-based feature additions ───────────────────────────────────────────

const PERSONA_FEATURES: Record<UserPersona, ProductFeature[]> = {
  Founder:       ['Billing', 'Analytics'],
  Developer:     ['AuditLogs', 'Exports'],
  Designer:      ['Settings'],
  Agency:        ['Teams', 'Workspace'],
  Startup:       ['Billing', 'Notifications'],
  Enterprise:    ['Teams', 'Permissions', 'AuditLogs'],
  Student:       ['Profile', 'History'],
  Teacher:       ['Calendar', 'Settings'],
  Doctor:        ['Calendar', 'Bookings'],
  Lawyer:        ['History', 'AuditLogs'],
  Creator:       ['Analytics', 'Exports'],
  Freelancer:    ['Invoices', 'Billing'],
  Recruiter:     ['CRM', 'Settings'],
  SalesTeam:     ['CRM', 'Analytics'],
  MarketingTeam: ['Analytics', 'Reports'],
  OperationsTeam:['Reports', 'AuditLogs'],
  HR:            ['Teams', 'History'],
  FinanceTeam:   ['Invoices', 'Reports'],
};

// ── Feature Planner ───────────────────────────────────────────────────────────

export function planFeatures(
  goal: ProductGoal,
  objective: BusinessObjective,
  personas: UserPersona[],
  prompt: string,
): ProductFeature[] {
  const featureSet = new Set<ProductFeature>((GOAL_BASE_FEATURES[goal] ?? []) as ProductFeature[]);

  // Add objective-driven features
  for (const f of OBJECTIVE_FEATURES[objective] ?? []) {
    featureSet.add(f);
  }

  // Add keyword-driven features
  for (const { keywords, feature } of KEYWORD_FEATURES) {
    if (keywords.test(prompt)) featureSet.add(feature);
  }

  // Add persona-driven features (max 2 per persona to prevent bloat)
  for (const persona of personas.slice(0, 3)) {
    for (const f of (PERSONA_FEATURES[persona] ?? []).slice(0, 2)) {
      featureSet.add(f);
    }
  }

  // Prevent landing pages from getting app features (they are marketing only)
  if (goal === 'LandingPage' || goal === 'MarketingWebsite' || goal === 'Portfolio') {
    featureSet.delete('Workspace');
    featureSet.delete('Projects');
    featureSet.delete('Teams');
    featureSet.delete('AuditLogs');
    featureSet.delete('Permissions');
    featureSet.delete('Kanban');
  }

  return [...featureSet] as ProductFeature[];
}

// ── Feature overload risk ─────────────────────────────────────────────────────

export function isFeatureOverloaded(features: ProductFeature[]): boolean {
  // More than 10 features for a non-enterprise product is risky
  return features.length > 10;
}
