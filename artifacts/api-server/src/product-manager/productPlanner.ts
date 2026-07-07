// ── V8.4 Product Manager — Product Goal, IA, Roadmap & Quality Scoring ─────────
// All pure static analysis — keyword-based heuristics. No LLM.

import type {
  ProductGoal, BusinessObjective, UserPersona, ProductFeature, ProductRisk,
  ProductQualityScore, ProductQualityDimension, ProductSeverity,
  InformationArchitecture, ProductRoadmap,
} from './productTypes.js';
import { productScoreSeverity } from './productTypes.js';
import { isFeatureOverloaded } from './featurePlanner.js';

// ── Product Goal Detection ────────────────────────────────────────────────────

type GoalSignal = { keywords: RegExp; goal: ProductGoal; weight: number };

const GOAL_SIGNALS: GoalSignal[] = [
  { keywords: /landing.*page|waitlist|coming.*soon|product.*launch|pre-?launch/i,       goal: 'LandingPage',         weight: 4 },
  { keywords: /marketing.*website|company.*website|corporate.*site|business.*site/i,   goal: 'MarketingWebsite',    weight: 3 },
  { keywords: /\bsaas\b|software.*as.*service|web.*app|multi-?tenant/i,                goal: 'SaaS',                weight: 4 },
  { keywords: /dashboard|admin.*panel|management.*console|control.*panel/i,             goal: 'Dashboard',           weight: 3 },
  { keywords: /\bcrm\b|customer.*relationship|contact.*management|sales.*pipeline/i,   goal: 'CRM',                 weight: 4 },
  { keywords: /admin.*panel|back.*office|staff.*portal|internal.*admin/i,              goal: 'AdminPanel',          weight: 3 },
  { keywords: /marketplace|multi.*vendor|buy.*sell|listing.*platform/i,               goal: 'Marketplace',         weight: 4 },
  { keywords: /portfolio|personal.*site|showcase|my.*work|case.*stud/i,               goal: 'Portfolio',           weight: 3 },
  { keywords: /agency|studio|creative.*agency|design.*agency/i,                       goal: 'Agency',              weight: 3 },
  { keywords: /\bblog\b|articles|posts|publication|newsletter.*site/i,                goal: 'Blog',                weight: 3 },
  { keywords: /ai.*product|ai.*tool|gpt|copilot|generative|llm.*app/i,               goal: 'AIProduct',           weight: 4 },
  { keywords: /e-?commerce|online.*store|shop|woocommerce|shopify/i,                  goal: 'ECommerce',           weight: 4 },
  { keywords: /edtech|learning.*platform|course|e-?learning|lms|education/i,          goal: 'Education',           weight: 3 },
  { keywords: /clinic|hospital|healthcare|medical|telemedicine|patient/i,             goal: 'Healthcare',          weight: 4 },
  { keywords: /fintech|banking|wealth|investment|trading|finance.*platform/i,         goal: 'Finance',             weight: 4 },
  { keywords: /developer.*tool|dev.*tool|cli|sdk|api.*platform|devops/i,             goal: 'DeveloperTool',       weight: 4 },
  { keywords: /enterprise.*software|b2b.*platform|corporate.*software/i,             goal: 'EnterpriseSoftware',  weight: 3 },
  { keywords: /booking.*platform|reservation|appointment.*platform/i,                goal: 'BookingPlatform',     weight: 4 },
  { keywords: /internal.*tool|employee.*portal|intranet|ops.*tool/i,                 goal: 'InternalTool',        weight: 4 },
  { keywords: /analytics.*platform|data.*platform|bi.*tool|metrics/i,               goal: 'AnalyticsPlatform',   weight: 3 },
  { keywords: /community.*platform|forum|social.*network|discord-?like/i,            goal: 'CommunityPlatform',   weight: 4 },
  { keywords: /knowledge.*base|wiki|documentation.*site|help.*center/i,              goal: 'KnowledgeBase',       weight: 4 },
];

export function detectProductGoal(prompt: string): { goal: ProductGoal; confidence: number } {
  const scores: Array<{ goal: ProductGoal; score: number }> = [];

  for (const signal of GOAL_SIGNALS) {
    const matchCount = (prompt.match(signal.keywords) ?? []).length;
    if (matchCount > 0) {
      scores.push({ goal: signal.goal, score: signal.weight * matchCount });
    }
  }

  if (scores.length === 0) {
    return { goal: 'LandingPage', confidence: 0.3 };
  }

  scores.sort((a, b) => b.score - a.score);
  const topScore  = scores[0].score;
  const maxWeight = GOAL_SIGNALS.reduce((m, s) => Math.max(m, s.weight), 0);
  const confidence = Math.min(1, topScore / (maxWeight * 2));

  return { goal: scores[0].goal, confidence };
}

// ── Prompt Summary ────────────────────────────────────────────────────────────

export function buildPromptSummary(prompt: string, goal: ProductGoal, objective: BusinessObjective): string {
  const words = prompt.trim().split(/\s+/).slice(0, 20).join(' ');
  return `${goal} targeting ${objective} — "${words}${prompt.split(/\s+/).length > 20 ? '…' : ''}"`;
}

// ── Information Architecture ──────────────────────────────────────────────────

export function generateInformationArchitecture(
  goal: ProductGoal,
  features: ProductFeature[],
  objective: BusinessObjective,
): InformationArchitecture {
  return {
    pages:             derivePages(goal, features),
    sections:          deriveSections(goal, objective),
    navigation:        deriveNavigation(goal, features),
    sidebar:           deriveSidebar(goal, features),
    footer:            deriveFooter(goal),
    settingsStructure: deriveSettingsStructure(features),
    contentHierarchy:  deriveContentHierarchy(goal),
    featureRelationships: deriveFeatureRelationships(features),
    dependencies:      deriveDependencies(features),
  };
}

function derivePages(goal: ProductGoal, features: ProductFeature[]): string[] {
  const base: Record<ProductGoal, string[]> = {
    LandingPage:         ['Home'],
    MarketingWebsite:    ['Home', 'About', 'Services', 'Case Studies', 'Contact'],
    SaaS:                ['Home', 'Features', 'Pricing', 'Blog', 'Login', 'Dashboard'],
    Dashboard:           ['Dashboard', 'Reports', 'Settings', 'Profile'],
    CRM:                 ['Contacts', 'Deals', 'Pipeline', 'Reports', 'Settings'],
    AdminPanel:          ['Overview', 'Users', 'Content', 'Settings', 'Logs'],
    Marketplace:         ['Home', 'Browse', 'Product Detail', 'Cart', 'Checkout', 'Profile'],
    Portfolio:           ['Home', 'Work', 'About', 'Contact'],
    Agency:              ['Home', 'Services', 'Work', 'Team', 'Contact'],
    Blog:                ['Home', 'Blog', 'Article', 'About', 'Newsletter'],
    AIProduct:           ['Home', 'Features', 'Pricing', 'Docs', 'Login', 'App'],
    ECommerce:           ['Home', 'Catalog', 'Product', 'Cart', 'Checkout', 'Account'],
    Education:           ['Home', 'Courses', 'Course Detail', 'Lesson', 'Dashboard'],
    Healthcare:          ['Home', 'Services', 'Booking', 'Providers', 'Patient Portal'],
    Finance:             ['Home', 'Features', 'Pricing', 'Security', 'Login', 'Dashboard'],
    DeveloperTool:       ['Home', 'Docs', 'API Reference', 'Playground', 'Pricing'],
    EnterpriseSoftware:  ['Home', 'Features', 'Enterprise', 'Pricing', 'Contact', 'Login'],
    BookingPlatform:     ['Home', 'Search', 'Listing', 'Booking', 'Confirmation', 'Account'],
    InternalTool:        ['Dashboard', 'Data', 'Reports', 'Settings'],
    AnalyticsPlatform:   ['Overview', 'Reports', 'Dashboards', 'Data Sources', 'Settings'],
    CommunityPlatform:   ['Home', 'Feed', 'Groups', 'Members', 'Events', 'Profile'],
    KnowledgeBase:       ['Home', 'Categories', 'Article', 'Search'],
  };
  const pages = [...(base[goal] ?? ['Home'])];
  if (features.includes('Authentication') && !pages.includes('Login')) pages.push('Login', 'Sign Up');
  if (features.includes('Billing') && !pages.includes('Billing')) pages.push('Billing');
  return pages;
}

function deriveSections(goal: ProductGoal, objective: BusinessObjective): string[] {
  const common = ['Navbar', 'Footer'];
  const map: Record<ProductGoal, string[]> = {
    LandingPage:         ['Hero', 'Features', 'Social Proof', 'Pricing', 'FAQ', 'CTA'],
    MarketingWebsite:    ['Hero', 'Services', 'Case Studies', 'Team', 'Testimonials', 'CTA'],
    SaaS:                ['Hero', 'Features', 'How It Works', 'Testimonials', 'Pricing', 'CTA'],
    Dashboard:           ['Stats Cards', 'Charts', 'Data Table', 'Activity Feed'],
    CRM:                 ['Contact List', 'Deal Pipeline', 'Activity', 'Stats'],
    AdminPanel:          ['Stats Overview', 'User Table', 'Recent Activity', 'Quick Actions'],
    Marketplace:         ['Search Bar', 'Categories', 'Featured Listings', 'Trust Signals'],
    Portfolio:           ['Hero', 'Selected Work', 'About', 'Skills', 'Contact'],
    Agency:              ['Hero', 'Services', 'Case Studies', 'Team', 'Client Logos', 'CTA'],
    Blog:                ['Featured Post', 'Post Grid', 'Categories', 'Newsletter Signup'],
    AIProduct:           ['Hero', 'Demo', 'Features', 'How It Works', 'Pricing', 'Waitlist'],
    ECommerce:           ['Hero Banner', 'Categories', 'Featured Products', 'Promotions', 'Testimonials'],
    Education:           ['Hero', 'Featured Courses', 'How It Works', 'Instructor Profiles', 'Pricing'],
    Healthcare:          ['Hero', 'Services', 'Providers', 'Booking CTA', 'Trust Signals'],
    Finance:             ['Hero', 'Features', 'Security', 'Social Proof', 'Pricing', 'CTA'],
    DeveloperTool:       ['Hero', 'Code Demo', 'Features', 'Integration List', 'Pricing'],
    EnterpriseSoftware:  ['Hero', 'Features', 'Enterprise Features', 'Security', 'Customers', 'Contact'],
    BookingPlatform:     ['Search', 'Featured Listings', 'Categories', 'How It Works', 'Testimonials'],
    InternalTool:        ['Header', 'Sidebar', 'Main Content', 'Stats', 'Activity'],
    AnalyticsPlatform:   ['Overview Cards', 'Line Charts', 'Breakdown Table', 'Filters'],
    CommunityPlatform:   ['Hero', 'Feed', 'Trending Topics', 'Top Members', 'Events'],
    KnowledgeBase:       ['Search Hero', 'Category Grid', 'Featured Articles', 'Recent Updates'],
  };
  return [...common, ...(map[goal] ?? ['Hero', 'Features', 'CTA'])];
}

function deriveNavigation(goal: ProductGoal, features: ProductFeature[]): string[] {
  const nav: string[] = [];
  if (goal === 'Dashboard' || goal === 'AdminPanel' || goal === 'InternalTool') {
    nav.push('Dashboard', 'Data', 'Reports', 'Settings');
    if (features.includes('Teams')) nav.push('Team');
    return nav;
  }
  nav.push('Home');
  if (goal === 'SaaS' || goal === 'AIProduct') nav.push('Features', 'Pricing');
  if (goal === 'MarketingWebsite' || goal === 'Agency') nav.push('Services', 'Work');
  if (goal === 'Blog') nav.push('Blog', 'Newsletter');
  if (goal === 'ECommerce') nav.push('Catalog', 'Cart');
  if (features.includes('Authentication')) nav.push('Login', 'Sign Up');
  return nav.slice(0, 7);
}

function deriveSidebar(goal: ProductGoal, features: ProductFeature[]): string[] {
  const sidebarGoals: ProductGoal[] = ['Dashboard', 'AdminPanel', 'CRM', 'InternalTool', 'AnalyticsPlatform'];
  if (!sidebarGoals.includes(goal)) return [];
  const sidebar = ['Overview', 'Data'];
  if (features.includes('Analytics')) sidebar.push('Analytics');
  if (features.includes('Reports')) sidebar.push('Reports');
  if (features.includes('Settings')) sidebar.push('Settings');
  if (features.includes('Teams')) sidebar.push('Team');
  sidebar.push('Help');
  return sidebar;
}

function deriveFooter(goal: ProductGoal): string[] {
  if (['Dashboard', 'AdminPanel', 'InternalTool'].includes(goal)) return [];
  return ['About', 'Privacy', 'Terms', 'Contact', 'Social Links'];
}

function deriveSettingsStructure(features: ProductFeature[]): string[] {
  const settings = ['Profile', 'Account'];
  if (features.includes('Notifications')) settings.push('Notifications');
  if (features.includes('Billing'))       settings.push('Billing & Subscription');
  if (features.includes('Teams'))         settings.push('Team Members');
  if (features.includes('Permissions'))   settings.push('Roles & Permissions');
  if (features.includes('AuditLogs'))     settings.push('Audit Log');
  settings.push('Security', 'Integrations');
  return settings;
}

function deriveContentHierarchy(goal: ProductGoal): string[] {
  const hierarchies: Partial<Record<ProductGoal, string[]>> = {
    LandingPage:      ['Value Proposition → Benefits → Proof → CTA'],
    SaaS:             ['Problem → Solution → Features → Social Proof → Pricing → CTA'],
    Dashboard:        ['KPIs → Charts → Data Table → Actions'],
    ECommerce:        ['Category → Products → Product Detail → Cart → Checkout'],
    Blog:             ['Latest Posts → Categories → Featured → Newsletter'],
    Education:        ['Course Catalog → Course Detail → Lessons → Assessment'],
    Marketplace:      ['Search → Browse → Listing → Detail → Book/Buy'],
  };
  return hierarchies[goal] ?? ['Hero → Content → CTA'];
}

function deriveFeatureRelationships(features: ProductFeature[]): string[] {
  const rels: string[] = [];
  if (features.includes('Authentication') && features.includes('Teams')) rels.push('Authentication → Teams → Permissions');
  if (features.includes('Billing') && features.includes('Analytics')) rels.push('Billing → Usage Analytics');
  if (features.includes('Projects') && features.includes('Kanban')) rels.push('Projects → Kanban → Tasks');
  if (features.includes('CRM') && features.includes('Reports')) rels.push('CRM → Reports → Exports');
  if (features.includes('Calendar') && features.includes('Bookings')) rels.push('Calendar → Bookings → Notifications');
  return rels;
}

function deriveDependencies(features: ProductFeature[]): string[] {
  const deps: string[] = [];
  if (features.includes('Teams'))       deps.push('Teams requires Authentication');
  if (features.includes('Billing'))     deps.push('Billing requires Authentication');
  if (features.includes('Permissions')) deps.push('Permissions requires Teams');
  if (features.includes('AuditLogs'))   deps.push('AuditLogs requires Authentication');
  if (features.includes('Kanban'))      deps.push('Kanban requires Projects');
  return deps;
}

// ── Product Roadmap ───────────────────────────────────────────────────────────

export function buildRoadmap(
  goal: ProductGoal,
  features: ProductFeature[],
  objective: BusinessObjective,
): ProductRoadmap {
  const mvp       = features.slice(0, Math.min(5, features.length));
  const phase2    = features.slice(5, Math.min(10, features.length));
  const phase3    = features.slice(10, Math.min(15, features.length));

  return {
    mvp:                mvp.map(f => String(f)),
    phase2:             phase2.map(f => String(f)),
    phase3:             phase3.map(f => String(f)),
    futureFeatures:     deriveFutureFeatures(goal),
    niceToHave:         ['Dark Mode', 'Keyboard Shortcuts', 'API Access', 'White-labeling', 'Webhooks'],
    technicalPriorities:['Performance', 'Security', 'Scalability', 'Accessibility', 'Mobile Responsiveness'],
    businessPriorities: deriveBizPriorities(objective),
  };
}

function deriveFutureFeatures(goal: ProductGoal): string[] {
  const map: Partial<Record<ProductGoal, string[]>> = {
    SaaS:                ['Mobile App', 'API Access', 'White-labeling', 'SSO/SAML'],
    AIProduct:           ['Custom AI Model', 'Fine-tuning', 'Batch Processing', 'API'],
    ECommerce:           ['Loyalty Program', 'Abandoned Cart Recovery', 'Multi-currency'],
    Dashboard:           ['Custom Dashboards', 'Scheduled Reports', 'Embedded Analytics'],
    CRM:                 ['Email Sequences', 'Lead Scoring', 'Sales Forecasting', 'Mobile App'],
    MarketingWebsite:    ['Blog', 'Case Studies', 'Partner Program', 'Localization'],
    KnowledgeBase:       ['AI Search', 'Versioning', 'Localization', 'Feedback System'],
  };
  return map[goal] ?? ['Mobile App', 'Integrations', 'API Access', 'Localization'];
}

function deriveBizPriorities(objective: BusinessObjective): string[] {
  const map: Partial<Record<BusinessObjective, string[]>> = {
    LeadGeneration:  ['CTA Optimization', 'Lead Capture', 'Email Nurture', 'A/B Testing'],
    Subscriptions:   ['Trial Conversion', 'Churn Reduction', 'Upgrade Flow', 'Payment Recovery'],
    Sales:           ['Checkout Optimization', 'Cart Recovery', 'Upsells', 'Reviews'],
    Freemium:        ['Free → Paid Conversion', 'Feature Gates', 'Usage Limit UX'],
    DemoRequests:    ['Demo Booking Rate', 'Follow-up Sequences', 'Demo Quality'],
  };
  return map[objective] ?? ['Growth', 'Retention', 'Monetization', 'Expansion'];
}

// ── Risk Detection ─────────────────────────────────────────────────────────────

export function detectProductRisks(
  goal: ProductGoal,
  features: ProductFeature[],
  objective: BusinessObjective,
  prompt: string,
): string[] {
  const risks: string[] = [];

  // Missing CTA
  const hasCTA = /cta|call.?to.?action|get.*started|sign.*up|try.*free|book.*demo/i.test(prompt);
  if (!hasCTA && goal !== 'KnowledgeBase' && goal !== 'Blog') risks.push('MissingCTA');

  // Missing pricing for commercial goals
  const needsPricing: BusinessObjective[] = ['Subscriptions', 'Freemium', 'PaidSaaS', 'Sales'];
  const hasPricing = /pricing|price|plan.*free|plan.*pro|tier|\$\d+|per.*month|monthly.*plan|annual.*plan/i.test(prompt);
  if (needsPricing.includes(objective) && !hasPricing) risks.push('MissingPricing');

  // Weak onboarding for SaaS/apps
  const needsOnboarding: ProductGoal[] = ['SaaS', 'AIProduct', 'Dashboard', 'CRM', 'Education'];
  if (needsOnboarding.includes(goal) && !features.includes('Notifications')) risks.push('WeakOnboarding');

  // Weak navigation
  if (features.length > 6 && !features.includes('Search')) risks.push('WeakNavigation');

  // Feature overload
  if (isFeatureOverloaded(features)) risks.push('FeatureOverload');

  // Poor info hierarchy
  const hasBadHierarchy = goal === 'LandingPage' && features.length > 8;
  if (hasBadHierarchy) risks.push('PoorInformationHierarchy');

  // Poor trust
  const hasTrust = /testimonial|review|trust|social.*proof|case.*stud|customer/i.test(prompt);
  if (!hasTrust && ['SaaS', 'ECommerce', 'Finance', 'Healthcare'].includes(goal)) risks.push('PoorTrust');

  // Missing auth for app-like goals
  const needsAuth: ProductGoal[] = ['SaaS', 'Dashboard', 'CRM', 'AdminPanel', 'AIProduct', 'ECommerce'];
  if (needsAuth.includes(goal) && !features.includes('Authentication')) risks.push('MissingAuthentication');

  // Weak dashboard for dashboard goals
  if ((goal === 'Dashboard' || goal === 'AdminPanel') && !features.includes('Analytics')) risks.push('WeakDashboard');

  // Missing loading states for async-heavy products
  const asyncGoals: ProductGoal[] = ['Dashboard', 'AIProduct', 'AnalyticsPlatform', 'CRM'];
  if (asyncGoals.includes(goal)) risks.push('MissingLoadingStates');

  // Weak empty states
  if (features.includes('Dashboard') || features.includes('CRM') || features.includes('Kanban')) {
    risks.push('WeakEmptyStates');
  }

  // Missing upgrade flow for freemium
  if (objective === 'Freemium' || objective === 'Subscriptions') {
    if (!features.includes('Billing')) risks.push('MissingUpgradeFlow');
  }

  return risks;
}

// ── Product Quality Scoring ───────────────────────────────────────────────────

interface QualityInput {
  goal:       ProductGoal;
  objective:  BusinessObjective;
  features:   ProductFeature[];
  personas:   UserPersona[];
  risks:      string[];
  prompt:     string;
}

export function scoreProductQuality(input: QualityInput): ProductQualityScore[] {
  const { goal, objective, features, risks, prompt } = input;
  const riskPenalty = (r: string) => (risks.includes(r) ? -1.5 : 0);

  const dimensions: Array<[ProductQualityDimension, number, number, string]> = [
    [
      'businessValue',
      computeBusinessValue(goal, objective, features, risks),
      0.80,
      risks.includes('MissingCTA') ? 'Add a primary CTA to drive business value' : 'Business value signals are strong',
    ],
    [
      'userValue',
      computeUserValue(features, risks, prompt),
      0.75,
      risks.includes('WeakOnboarding') ? 'Improve onboarding to activate users faster' : 'User value proposition is clear',
    ],
    [
      'featureCompleteness',
      computeFeatureCompleteness(goal, features, risks),
      0.78,
      risks.includes('FeatureOverload') ? 'Reduce features to avoid overwhelming users' : 'Feature set is well-balanced',
    ],
    [
      'navigation',
      computeNavigationScore(features, risks),
      0.72,
      risks.includes('WeakNavigation') ? 'Simplify navigation structure' : 'Navigation is adequate',
    ],
    [
      'scalability',
      computeScalabilityScore(goal, features),
      0.65,
      'Ensure architecture supports team collaboration and growth',
    ],
    [
      'productSimplicity',
      computeSimplicityScore(features, risks),
      0.70,
      risks.includes('FeatureOverload') ? 'Reduce scope to improve simplicity' : 'Product simplicity is acceptable',
    ],
    [
      'monetization',
      computeMonetizationScore(objective, features, risks),
      0.75,
      risks.includes('MissingPricing') ? 'Add clear pricing tiers to drive revenue' : 'Monetization strategy is clear',
    ],
    [
      'retention',
      computeRetentionScore(features, goal),
      0.65,
      'Add habit loops, notifications and dashboard activity to improve retention',
    ],
    [
      'activation',
      computeActivationScore(features, risks),
      0.72,
      risks.includes('WeakOnboarding') ? 'Add guided onboarding flow to increase activation' : 'Activation path is defined',
    ],
    [
      'growthPotential',
      computeGrowthScore(goal, objective, features),
      0.68,
      'Add virality features (referral, share, invite) to accelerate growth',
    ],
    [
      'enterpriseReadiness',
      computeEnterpriseScore(features),
      0.62,
      features.includes('AuditLogs') ? 'Enterprise-ready' : 'Add SSO, Audit Logs and Permissions for enterprise',
    ],
  ];

  return dimensions.map(([dimension, score, confidence, recommendation]) => ({
    dimension,
    score:   Math.round(Math.min(10, Math.max(0, score)) * 10) / 10,
    severity: productScoreSeverity(score) as ProductQualityScore['severity'],
    confidence,
    recommendation,
  }));
}

function computeBusinessValue(goal: ProductGoal, objective: BusinessObjective, features: ProductFeature[], risks: string[]): number {
  let score = 7.0;
  if (risks.includes('MissingCTA'))     score -= 1.5;
  if (risks.includes('MissingPricing')) score -= 1.0;
  if (risks.includes('PoorTrust'))      score -= 0.5;
  if (features.includes('Analytics'))  score += 0.5;
  if (features.includes('Billing'))    score += 0.3;
  return score;
}

function computeUserValue(features: ProductFeature[], risks: string[], prompt: string): number {
  let score = 6.5;
  if (!risks.includes('WeakOnboarding'))           score += 0.5;
  if (features.includes('AIAssistant'))             score += 0.5;
  if (features.includes('Search'))                  score += 0.3;
  if (features.includes('Notifications'))           score += 0.2;
  if (/10x|faster|better|save.*time|effortless/i.test(prompt)) score += 0.5;
  return score;
}

function computeFeatureCompleteness(goal: ProductGoal, features: ProductFeature[], risks: string[]): number {
  let score = 6.0 + Math.min(2, features.length * 0.2);
  if (risks.includes('FeatureOverload'))          score -= 1.0;
  if (risks.includes('MissingAuthentication'))    score -= 0.8;
  return score;
}

function computeNavigationScore(features: ProductFeature[], risks: string[]): number {
  let score = 7.0;
  if (risks.includes('WeakNavigation'))           score -= 1.5;
  if (risks.includes('PoorInformationHierarchy')) score -= 0.8;
  if (features.includes('Search'))                score += 0.5;
  return score;
}

function computeScalabilityScore(goal: ProductGoal, features: ProductFeature[]): number {
  let score = 5.5;
  if (features.includes('Teams'))      score += 1.0;
  if (features.includes('Permissions'))score += 0.8;
  if (features.includes('AuditLogs')) score += 0.7;
  if (features.includes('Workspace')) score += 0.5;
  const enterpriseGoals: ProductGoal[] = ['EnterpriseSoftware', 'CRM', 'Dashboard', 'AnalyticsPlatform'];
  if (enterpriseGoals.includes(goal))  score += 0.5;
  return score;
}

function computeSimplicityScore(features: ProductFeature[], risks: string[]): number {
  let score = 8.0;
  if (features.length > 10) score -= (features.length - 10) * 0.3;
  if (risks.includes('FeatureOverload'))          score -= 1.0;
  if (risks.includes('PoorInformationHierarchy')) score -= 0.5;
  return score;
}

function computeMonetizationScore(objective: BusinessObjective, features: ProductFeature[], risks: string[]): number {
  let score = 5.0;
  if (features.includes('Billing'))    score += 1.5;
  if (features.includes('Payments'))  score += 1.0;
  if (!risks.includes('MissingPricing')) score += 0.5;
  const commercialObjectives: BusinessObjective[] = ['Subscriptions', 'Freemium', 'PaidSaaS', 'Sales'];
  if (commercialObjectives.includes(objective)) score += 0.5;
  if (risks.includes('MissingUpgradeFlow')) score -= 1.0;
  return score;
}

function computeRetentionScore(features: ProductFeature[], goal: ProductGoal): number {
  let score = 5.0;
  if (features.includes('Notifications')) score += 1.0;
  if (features.includes('Dashboard'))     score += 0.8;
  if (features.includes('Analytics'))     score += 0.5;
  if (features.includes('Comments'))      score += 0.3;
  if (features.includes('Chat'))          score += 0.3;
  return score;
}

function computeActivationScore(features: ProductFeature[], risks: string[]): number {
  let score = 6.0;
  if (!risks.includes('WeakOnboarding')) score += 1.0;
  if (features.includes('Notifications')) score += 0.5;
  if (features.includes('Dashboard'))    score += 0.5;
  if (risks.includes('MissingAuthentication')) score -= 0.5;
  return score;
}

function computeGrowthScore(goal: ProductGoal, objective: BusinessObjective, features: ProductFeature[]): number {
  let score = 5.5;
  if (features.includes('Analytics'))  score += 0.8;
  if (features.includes('Exports'))    score += 0.3;
  if (features.includes('Search'))     score += 0.3;
  const growthGoals: ProductGoal[] = ['SaaS', 'AIProduct', 'Marketplace', 'CommunityPlatform'];
  if (growthGoals.includes(goal)) score += 0.5;
  return score;
}

function computeEnterpriseScore(features: ProductFeature[]): number {
  let score = 3.0;
  if (features.includes('Teams'))       score += 1.5;
  if (features.includes('Permissions')) score += 1.5;
  if (features.includes('AuditLogs'))   score += 1.5;
  if (features.includes('Workspace'))   score += 0.5;
  if (features.includes('Search'))      score += 0.3;
  return score;
}

// ── Overall Product Score ─────────────────────────────────────────────────────

const QUALITY_WEIGHTS: Record<ProductQualityDimension, number> = {
  businessValue:       0.15,
  userValue:           0.15,
  featureCompleteness: 0.12,
  navigation:          0.10,
  scalability:         0.08,
  productSimplicity:   0.10,
  monetization:        0.10,
  retention:           0.07,
  activation:          0.07,
  growthPotential:     0.04,
  enterpriseReadiness: 0.02,
};

export function computeOverallProductScore(qualityScores: ProductQualityScore[]): number {
  const byDim = new Map(qualityScores.map(q => [q.dimension, q.score]));
  let total = 0;
  let weightSum = 0;
  for (const [dim, weight] of Object.entries(QUALITY_WEIGHTS)) {
    const score = byDim.get(dim as ProductQualityDimension) ?? 5;
    total += score * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return 5.0;
  return Math.round(Math.min(10, Math.max(0, total / weightSum)) * 10) / 10;
}

export { QUALITY_WEIGHTS };

// ── Context String Builder ─────────────────────────────────────────────────────

export function buildProductContext(plan: import('./productTypes.js').ProductPlan): string {
  const { productGoal, businessObjective, userPersonas, plannedFeatures, detectedRisks, overallProductScore } = plan;
  const personaList  = userPersonas.slice(0, 3).join(', ');
  const featureList  = plannedFeatures.slice(0, 8).join(', ');
  const riskWarnings = detectedRisks.slice(0, 4).join(', ');
  const sections     = plan.informationArchitecture.sections.slice(0, 6).join(', ');
  const pages        = plan.informationArchitecture.pages.slice(0, 6).join(', ');

  return [
    `\n\n--- PRODUCT MANAGER STRATEGY (V8.4) ---`,
    `Product Goal: ${productGoal}`,
    `Business Objective: ${businessObjective}`,
    `Primary Personas: ${personaList}`,
    `Core Features: ${featureList}`,
    `Suggested Sections: ${sections}`,
    `Suggested Pages: ${pages}`,
    `Monetization Strategy: ${plan.monetizationPlan.strategy}`,
    riskWarnings ? `Known Risks to Avoid: ${riskWarnings}` : '',
    `Product Quality Score: ${overallProductScore}/10`,
    `--- END PRODUCT MANAGER STRATEGY ---\n`,
  ].filter(Boolean).join('\n');
}
