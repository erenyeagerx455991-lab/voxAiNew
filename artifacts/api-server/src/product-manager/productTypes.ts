// ── V8.4 Autonomous AI Product Manager — Type System ──────────────────────────

// ── Product Goals (22) ────────────────────────────────────────────────────────

export type ProductGoal =
  | 'LandingPage'       | 'MarketingWebsite' | 'SaaS'              | 'Dashboard'
  | 'CRM'               | 'AdminPanel'       | 'Marketplace'       | 'Portfolio'
  | 'Agency'            | 'Blog'             | 'AIProduct'         | 'ECommerce'
  | 'Education'         | 'Healthcare'       | 'Finance'           | 'DeveloperTool'
  | 'EnterpriseSoftware'| 'BookingPlatform'  | 'InternalTool'      | 'AnalyticsPlatform'
  | 'CommunityPlatform' | 'KnowledgeBase';

export const ALL_PRODUCT_GOALS: ProductGoal[] = [
  'LandingPage', 'MarketingWebsite', 'SaaS', 'Dashboard', 'CRM', 'AdminPanel',
  'Marketplace', 'Portfolio', 'Agency', 'Blog', 'AIProduct', 'ECommerce',
  'Education', 'Healthcare', 'Finance', 'DeveloperTool', 'EnterpriseSoftware',
  'BookingPlatform', 'InternalTool', 'AnalyticsPlatform', 'CommunityPlatform', 'KnowledgeBase',
];

// ── Business Objectives (20) ──────────────────────────────────────────────────

export type BusinessObjective =
  | 'LeadGeneration' | 'Sales'          | 'Subscriptions'   | 'Freemium'
  | 'PaidSaaS'       | 'Downloads'      | 'Appointments'    | 'Bookings'
  | 'DemoRequests'   | 'Contact'        | 'Newsletter'      | 'CommunityGrowth'
  | 'UserActivation' | 'Retention'      | 'Upselling'       | 'CrossSelling'
  | 'BrandAwareness' | 'Hiring'         | 'Support'         | 'Documentation';

export const ALL_BUSINESS_OBJECTIVES: BusinessObjective[] = [
  'LeadGeneration', 'Sales', 'Subscriptions', 'Freemium', 'PaidSaaS', 'Downloads',
  'Appointments', 'Bookings', 'DemoRequests', 'Contact', 'Newsletter', 'CommunityGrowth',
  'UserActivation', 'Retention', 'Upselling', 'CrossSelling', 'BrandAwareness',
  'Hiring', 'Support', 'Documentation',
];

// ── User Personas (18) ────────────────────────────────────────────────────────

export type UserPersona =
  | 'Founder'       | 'Developer'      | 'Designer'        | 'Agency'
  | 'Startup'       | 'Enterprise'     | 'Student'         | 'Teacher'
  | 'Doctor'        | 'Lawyer'         | 'Creator'         | 'Freelancer'
  | 'Recruiter'     | 'SalesTeam'      | 'MarketingTeam'   | 'OperationsTeam'
  | 'HR'            | 'FinanceTeam';

export const ALL_USER_PERSONAS: UserPersona[] = [
  'Founder', 'Developer', 'Designer', 'Agency', 'Startup', 'Enterprise',
  'Student', 'Teacher', 'Doctor', 'Lawyer', 'Creator', 'Freelancer',
  'Recruiter', 'SalesTeam', 'MarketingTeam', 'OperationsTeam', 'HR', 'FinanceTeam',
];

// ── Product Features (26) ─────────────────────────────────────────────────────

export type ProductFeature =
  | 'Authentication' | 'Workspace'    | 'Projects'    | 'Billing'      | 'Notifications'
  | 'Search'         | 'Analytics'    | 'Dashboard'   | 'Profile'      | 'Settings'
  | 'Teams'          | 'Permissions'  | 'Comments'    | 'Chat'         | 'Reports'
  | 'Payments'       | 'Calendar'     | 'Bookings'    | 'Invoices'     | 'CRM'
  | 'Kanban'         | 'AIAssistant'  | 'Exports'     | 'Imports'      | 'History'
  | 'AuditLogs';

export const ALL_PRODUCT_FEATURES: ProductFeature[] = [
  'Authentication', 'Workspace', 'Projects', 'Billing', 'Notifications',
  'Search', 'Analytics', 'Dashboard', 'Profile', 'Settings', 'Teams',
  'Permissions', 'Comments', 'Chat', 'Reports', 'Payments', 'Calendar',
  'Bookings', 'Invoices', 'CRM', 'Kanban', 'AIAssistant', 'Exports',
  'Imports', 'History', 'AuditLogs',
];

// ── Product Risks (13) ────────────────────────────────────────────────────────

export type ProductRisk =
  | 'MissingCTA'               | 'MissingPricing'        | 'WeakOnboarding'
  | 'WeakNavigation'           | 'FeatureOverload'        | 'PoorInformationHierarchy'
  | 'PoorTrust'                | 'MissingAuthentication'  | 'WeakDashboard'
  | 'WeakEmptyStates'          | 'WeakErrorStates'        | 'MissingLoadingStates'
  | 'MissingUpgradeFlow';

export const ALL_PRODUCT_RISKS: ProductRisk[] = [
  'MissingCTA', 'MissingPricing', 'WeakOnboarding', 'WeakNavigation', 'FeatureOverload',
  'PoorInformationHierarchy', 'PoorTrust', 'MissingAuthentication', 'WeakDashboard',
  'WeakEmptyStates', 'WeakErrorStates', 'MissingLoadingStates', 'MissingUpgradeFlow',
];

// ── Product Quality Dimensions (11) ───────────────────────────────────────────

export type ProductQualityDimension =
  | 'businessValue'      | 'userValue'         | 'featureCompleteness'
  | 'navigation'         | 'scalability'       | 'productSimplicity'
  | 'monetization'       | 'retention'         | 'activation'
  | 'growthPotential'    | 'enterpriseReadiness';

export const ALL_QUALITY_DIMENSIONS: ProductQualityDimension[] = [
  'businessValue', 'userValue', 'featureCompleteness', 'navigation', 'scalability',
  'productSimplicity', 'monetization', 'retention', 'activation', 'growthPotential',
  'enterpriseReadiness',
];

export type ProductSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export function productScoreSeverity(score: number): ProductSeverity {
  if (score >= 7) return 'Low';
  if (score >= 5) return 'Medium';
  if (score >= 3) return 'High';
  return 'Critical';
}

// ── Sub-structures ────────────────────────────────────────────────────────────

export interface ProductQualityScore {
  dimension:      ProductQualityDimension;
  score:          number;      // 0–10
  severity:       ProductSeverity;
  confidence:     number;      // 0–1
  recommendation: string;
}

export interface InformationArchitecture {
  pages:            string[];
  sections:         string[];
  navigation:       string[];
  sidebar:          string[];
  footer:           string[];
  settingsStructure:string[];
  contentHierarchy: string[];
  featureRelationships: string[];
  dependencies:     string[];
}

export interface UserJourney {
  entryPoint:   string;
  primaryFlow:  string[];
  secondaryFlow:string[];
  onboarding:   string[];
  activation:   string[];
  conversion:   string[];
  retention:    string[];
  upgradeFlow:  string[];
  supportFlow:  string[];
  exitFlow:     string[];
}

export interface MonetizationPlan {
  strategy:        'Freemium' | 'Free' | 'Subscription' | 'OneTime' | 'Enterprise' | 'Usage' | 'None';
  freePlan:        string[];
  proPlan:         string[];
  enterprisePlan:  string[];
  pricingTable:    boolean;
  upgradePoints:   string[];
  featureGates:    string[];
  usageLimits:     string[];
  trialFlow:       boolean;
}

export interface ProductRoadmap {
  mvp:                  string[];
  phase2:               string[];
  phase3:               string[];
  futureFeatures:       string[];
  niceToHave:           string[];
  technicalPriorities:  string[];
  businessPriorities:   string[];
}

// ── Core Output ───────────────────────────────────────────────────────────────

export interface ProductPlan {
  productGoal:             ProductGoal;
  productGoalConfidence:   number;
  businessObjective:       BusinessObjective;
  userPersonas:            UserPersona[];
  plannedFeatures:         ProductFeature[];
  informationArchitecture: InformationArchitecture;
  userJourney:             UserJourney;
  monetizationPlan:        MonetizationPlan;
  roadmap:                 ProductRoadmap;
  detectedRisks:           ProductRisk[];
  qualityScores:           ProductQualityScore[];
  overallProductScore:     number;
  confidence:              number;
  promptSummary:           string;
}

export interface ProductManagerOutput {
  productPlan:   ProductPlan;
  productScore:  number;
  /** Injected into the Planner prompt as additional product strategy context */
  contextString: string;
}

// ── Learning ──────────────────────────────────────────────────────────────────

export interface ProductLearningRecord {
  buildId:           string;
  productGoal:       ProductGoal;
  businessObjective: BusinessObjective;
  overallScore:      number;
  riskCount:         number;
  featureCount:      number;
  personaCount:      number;
  improved:          boolean;
  recordedAt:        number;
}

export interface ProductLearningInput {
  buildId:      string;
  productPlan:  ProductPlan;
  evaluatorScore?: number;
}
