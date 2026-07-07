// ── V8.4 Product Manager — Business Objective & Persona Detection ──────────────
// Pure heuristic keyword analysis of the prompt. No LLM, fast and deterministic.

import type { ProductGoal, BusinessObjective, UserPersona } from './productTypes.js';

// ── Business Objective Detection ─────────────────────────────────────────────

type ObjSignal = { keywords: RegExp; objective: BusinessObjective; weight: number };

const OBJECTIVE_SIGNALS: ObjSignal[] = [
  { keywords: /lead.*gen|capture.*lead|email.*capture|waiting.*list|waitlist/i,          objective: 'LeadGeneration',   weight: 3 },
  { keywords: /sell|e-?commerce|shop|store|cart|checkout|product.*listing/i,            objective: 'Sales',            weight: 3 },
  { keywords: /subscri|monthly.*plan|annual.*plan|subscription.*billing/i,              objective: 'Subscriptions',    weight: 3 },
  { keywords: /freemium|free.*plan|upgrade.*pro|free.*tier/i,                           objective: 'Freemium',         weight: 3 },
  { keywords: /paid.*saas|pay.*per.*use|saas.*pricing|software.*as.*service/i,          objective: 'PaidSaaS',         weight: 2 },
  { keywords: /download|app.*store|mobile.*app|install.*app/i,                          objective: 'Downloads',        weight: 2 },
  { keywords: /appointment|schedule.*consultation|book.*session|calendar.*booking/i,    objective: 'Appointments',     weight: 3 },
  { keywords: /booking.*platform|hotel|restaurant.*reservation|venue/i,                 objective: 'Bookings',         weight: 3 },
  { keywords: /book.*demo|request.*demo|schedule.*demo|get.*demo/i,                     objective: 'DemoRequests',     weight: 3 },
  { keywords: /contact.*us|get.*in.*touch|send.*message|reach.*out/i,                   objective: 'Contact',          weight: 2 },
  { keywords: /newsletter|email.*list|subscribe.*updates|weekly.*digest/i,              objective: 'Newsletter',       weight: 2 },
  { keywords: /community|forum|social|network|members/i,                                objective: 'CommunityGrowth',  weight: 2 },
  { keywords: /onboard|activate|get.*started|first.*value|aha.*moment/i,                objective: 'UserActivation',   weight: 2 },
  { keywords: /retention|churn|keep.*users|habit.*loop|engagement/i,                    objective: 'Retention',        weight: 2 },
  { keywords: /upsell|upgrade.*plan|premium.*feature|unlock.*more/i,                    objective: 'Upselling',        weight: 2 },
  { keywords: /cross.*sell|related.*product|bundle|recommend.*product/i,                objective: 'CrossSelling',     weight: 2 },
  { keywords: /brand.*awareness|visibility|marketing.*campaign|go.*to.*market/i,        objective: 'BrandAwareness',   weight: 2 },
  { keywords: /job.*posting|careers|hiring|recruit|talent/i,                            objective: 'Hiring',           weight: 2 },
  { keywords: /help.*center|support.*ticket|\bfaq\b|ticket.*system|live.*chat.*support/i, objective: 'Support',          weight: 2 },
  { keywords: /\bdocs\b|api.*reference|developer.*guide|technical.*documentation|knowledge.*base/i, objective: 'Documentation', weight: 2 },
];

export function detectBusinessObjective(prompt: string, goal: ProductGoal): BusinessObjective {
  const matches: Array<{ objective: BusinessObjective; score: number }> = [];

  for (const signal of OBJECTIVE_SIGNALS) {
    if (signal.keywords.test(prompt)) {
      matches.push({ objective: signal.objective, score: signal.weight });
    }
  }

  if (matches.length > 0) {
    return matches.sort((a, b) => b.score - a.score)[0].objective;
  }

  // Fallback by product goal
  const goalDefaults: Record<ProductGoal, BusinessObjective> = {
    LandingPage:         'LeadGeneration',
    MarketingWebsite:    'BrandAwareness',
    SaaS:                'Subscriptions',
    Dashboard:           'UserActivation',
    CRM:                 'Sales',
    AdminPanel:          'UserActivation',
    Marketplace:         'Sales',
    Portfolio:           'BrandAwareness',
    Agency:              'LeadGeneration',
    Blog:                'BrandAwareness',
    AIProduct:           'Subscriptions',
    ECommerce:           'Sales',
    Education:           'Subscriptions',
    Healthcare:          'Appointments',
    Finance:             'PaidSaaS',
    DeveloperTool:       'Freemium',
    EnterpriseSoftware:  'PaidSaaS',
    BookingPlatform:     'Bookings',
    InternalTool:        'UserActivation',
    AnalyticsPlatform:   'Subscriptions',
    CommunityPlatform:   'CommunityGrowth',
    KnowledgeBase:       'Documentation',
  };

  return goalDefaults[goal];
}

// ── User Persona Detection ────────────────────────────────────────────────────

type PersonaSignal = { keywords: RegExp; persona: UserPersona };

const PERSONA_SIGNALS: PersonaSignal[] = [
  { keywords: /founder|ceo|co-?founder|startup.*team|early.*team/i,         persona: 'Founder'        },
  { keywords: /developer|engineer|devs|coding|programming|software.*dev/i,   persona: 'Developer'      },
  { keywords: /designer|ux|ui.*design|creative.*team|design.*studio/i,       persona: 'Designer'       },
  { keywords: /agency|client.*work|web.*agency|digital.*agency/i,            persona: 'Agency'         },
  { keywords: /startup|early.*stage|seed|launch|mvp/i,                       persona: 'Startup'        },
  { keywords: /enterprise|corporate|fortune.*500|b2b|business.*client/i,     persona: 'Enterprise'     },
  { keywords: /student|learner|course|education|school|university|college/i,  persona: 'Student'        },
  { keywords: /teacher|instructor|tutor|professor|educator/i,                 persona: 'Teacher'        },
  { keywords: /doctor|physician|clinic|hospital|patient|medical/i,            persona: 'Doctor'         },
  { keywords: /lawyer|attorney|legal|law.*firm|paralegal/i,                   persona: 'Lawyer'         },
  { keywords: /creator|content.*creator|influencer|youtube|podcast/i,         persona: 'Creator'        },
  { keywords: /freelancer|consultant|independent|solo.*dev|solo.*designer/i,  persona: 'Freelancer'     },
  { keywords: /recruiter|talent.*acquisition|hr.*hiring|headhunter/i,         persona: 'Recruiter'      },
  { keywords: /sales.*team|account.*exec|sales.*rep|pipeline/i,               persona: 'SalesTeam'      },
  { keywords: /marketing.*team|growth.*team|campaign|seo|paid.*ads/i,         persona: 'MarketingTeam'  },
  { keywords: /operations|ops.*team|workflow|process/i,                        persona: 'OperationsTeam' },
  { keywords: /hr|human.*resources|people.*ops|onboarding.*employee/i,        persona: 'HR'             },
  { keywords: /finance.*team|cfo|accounting|payroll|invoice/i,                persona: 'FinanceTeam'    },
];

export function detectUserPersonas(prompt: string, goal: ProductGoal): UserPersona[] {
  const detected = new Set<UserPersona>();

  for (const signal of PERSONA_SIGNALS) {
    if (signal.keywords.test(prompt)) {
      detected.add(signal.persona);
    }
  }

  // Goal-based persona defaults
  if (detected.size === 0) {
    const goalPersonas: Record<ProductGoal, UserPersona[]> = {
      LandingPage:         ['Founder', 'Startup'],
      MarketingWebsite:    ['MarketingTeam', 'Founder'],
      SaaS:                ['Founder', 'Developer', 'Startup'],
      Dashboard:           ['OperationsTeam', 'Enterprise'],
      CRM:                 ['SalesTeam', 'MarketingTeam'],
      AdminPanel:          ['OperationsTeam', 'Developer'],
      Marketplace:         ['Founder', 'Agency'],
      Portfolio:           ['Designer', 'Developer', 'Freelancer'],
      Agency:              ['Agency', 'Founder'],
      Blog:                ['Creator', 'MarketingTeam'],
      AIProduct:           ['Founder', 'Developer'],
      ECommerce:           ['Founder', 'Startup'],
      Education:           ['Teacher', 'Student'],
      Healthcare:          ['Doctor', 'OperationsTeam'],
      Finance:             ['FinanceTeam', 'Enterprise'],
      DeveloperTool:       ['Developer', 'Startup'],
      EnterpriseSoftware:  ['Enterprise', 'OperationsTeam'],
      BookingPlatform:     ['Founder', 'OperationsTeam'],
      InternalTool:        ['OperationsTeam', 'Developer'],
      AnalyticsPlatform:   ['MarketingTeam', 'OperationsTeam'],
      CommunityPlatform:   ['Founder', 'Creator'],
      KnowledgeBase:       ['OperationsTeam', 'Developer'],
    };
    return goalPersonas[goal] ?? ['Founder'];
  }

  return [...detected].slice(0, 4);
}
