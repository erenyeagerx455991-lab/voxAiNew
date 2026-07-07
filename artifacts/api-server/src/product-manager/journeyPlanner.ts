// ── V8.4 Product Manager — User Journey & Monetization Planning ────────────────
// Generates user journey stages and monetization plans from product context.

import type { ProductGoal, BusinessObjective, ProductFeature, UserJourney, MonetizationPlan } from './productTypes.js';

// ── User Journey Planning ─────────────────────────────────────────────────────

export function planUserJourney(
  goal: ProductGoal,
  features: ProductFeature[],
  objective: BusinessObjective,
): UserJourney {
  const hasAuth      = features.includes('Authentication');
  const hasBilling   = features.includes('Billing') || features.includes('Payments');
  const hasDashboard = features.includes('Dashboard');
  const hasOnboard   = hasDashboard || features.includes('Workspace');

  const entryPoint = deriveEntryPoint(goal, objective);

  return {
    entryPoint,
    primaryFlow:   derivePrimaryFlow(goal, objective, hasAuth),
    secondaryFlow: deriveSecondaryFlow(goal, features),
    onboarding:    deriveOnboarding(goal, hasAuth, hasOnboard),
    activation:    deriveActivation(goal, features),
    conversion:    deriveConversion(objective, hasBilling),
    retention:     deriveRetention(goal, features),
    upgradeFlow:   deriveUpgradeFlow(objective, hasBilling),
    supportFlow:   ['Help Center', 'FAQ', 'Contact Form', 'Live Chat'],
    exitFlow:      ['Account Cancellation', 'Data Export', 'Re-engagement Email'],
  };
}

function deriveEntryPoint(goal: ProductGoal, objective: BusinessObjective): string {
  const entryPoints: Record<ProductGoal, string> = {
    LandingPage:         'Hero Section with Primary CTA',
    MarketingWebsite:    'Homepage Hero with Value Proposition',
    SaaS:                'Landing Page → Sign Up',
    Dashboard:           'Login → Dashboard Home',
    CRM:                 'Login → Contacts Overview',
    AdminPanel:          'Login → Admin Dashboard',
    Marketplace:         'Homepage → Search/Browse',
    Portfolio:           'Homepage → Featured Work',
    Agency:              'Homepage → Services Overview',
    Blog:                'Homepage → Latest Posts',
    AIProduct:           'Landing Page → Try for Free',
    ECommerce:           'Homepage → Product Catalog',
    Education:           'Landing Page → Course Preview',
    Healthcare:          'Landing Page → Book Appointment',
    Finance:             'Landing Page → Start Free Trial',
    DeveloperTool:       'Documentation → API Playground',
    EnterpriseSoftware:  'Landing Page → Request Demo',
    BookingPlatform:     'Homepage → Search & Availability',
    InternalTool:        'Login → Internal Dashboard',
    AnalyticsPlatform:   'Login → Analytics Overview',
    CommunityPlatform:   'Landing Page → Join Community',
    KnowledgeBase:       'Search → Article',
  };
  return entryPoints[goal] ?? 'Homepage';
}

function derivePrimaryFlow(goal: ProductGoal, objective: BusinessObjective, hasAuth: boolean): string[] {
  const authSteps = hasAuth ? ['Create Account', 'Verify Email', 'Complete Profile'] : [];

  const flows: Partial<Record<BusinessObjective, string[]>> = {
    LeadGeneration:  ['Land on Page', 'Read Value Prop', 'Submit Lead Form', 'Receive Confirmation'],
    Sales:           ['Discover Product', 'View Pricing', 'Add to Cart', 'Checkout', 'Order Confirmation'],
    Subscriptions:   [...authSteps, 'Choose Plan', 'Enter Payment', 'Activate Subscription', 'Onboard'],
    Freemium:        [...authSteps, 'Start Free', 'Hit Limit', 'See Upgrade CTA', 'Upgrade to Pro'],
    PaidSaaS:        [...authSteps, 'Choose Plan', 'Enter Payment', 'Access Product', 'Get Value'],
    DemoRequests:    ['Land on Page', 'Read Case Studies', 'Click Book Demo', 'Fill Form', 'Confirm Call'],
    Bookings:        ['Search Availability', 'Select Slot', 'Enter Details', 'Confirm Booking'],
    Appointments:    ['Browse Services', 'Select Time', 'Enter Info', 'Pay', 'Confirmation'],
    Contact:         ['Browse Site', 'Visit Contact Page', 'Fill Form', 'Receive Reply'],
  };

  return flows[objective] ?? ['Visit Homepage', 'Explore Features', 'Sign Up', 'Complete Goal'];
}

function deriveSecondaryFlow(goal: ProductGoal, features: ProductFeature[]): string[] {
  const flows: string[] = [];
  if (features.includes('Search')) flows.push('Search → Filter → View Result');
  if (features.includes('Profile')) flows.push('View Profile → Edit Settings');
  if (features.includes('Notifications')) flows.push('Receive Notification → Take Action');
  if (features.includes('Reports')) flows.push('Navigate to Reports → Export Data');
  if (features.includes('Teams')) flows.push('Invite Team Member → Collaborate');
  if (flows.length === 0) flows.push('Browse Content', 'Use Secondary Feature', 'Return to Home');
  return flows.slice(0, 5);
}

function deriveOnboarding(goal: ProductGoal, hasAuth: boolean, hasOnboard: boolean): string[] {
  if (!hasAuth) return ['Visit Site', 'Understand Value Proposition'];
  const steps = ['Create Account', 'Email Verification'];
  if (hasOnboard) {
    steps.push('Setup Wizard', 'Connect Integrations', 'First Key Action', 'Celebration / Aha Moment');
  } else {
    steps.push('Complete Profile', 'Explore Features');
  }
  return steps;
}

function deriveActivation(goal: ProductGoal, features: ProductFeature[]): string[] {
  const activation: string[] = ['Complete Profile'];
  if (features.includes('Dashboard')) activation.push('Explore Dashboard');
  if (features.includes('Projects'))  activation.push('Create First Project');
  if (features.includes('Search'))    activation.push('Run First Search');
  if (features.includes('Analytics')) activation.push('View First Report');
  activation.push('Reach First Value Moment', 'Invite Collaborator or Share');
  return activation.slice(0, 5);
}

function deriveConversion(objective: BusinessObjective, hasBilling: boolean): string[] {
  if (!hasBilling) return ['Engage with Content', 'Submit Lead Form', 'Confirm Interest'];
  return [
    'Hit Usage Limit or Trial End',
    'View Upgrade Page',
    'Compare Plans',
    'Enter Payment Details',
    'Confirm Subscription',
    'Access Premium Features',
  ];
}

function deriveRetention(goal: ProductGoal, features: ProductFeature[]): string[] {
  const retention: string[] = ['Return to Product'];
  if (features.includes('Notifications')) retention.push('Receive Re-engagement Notification');
  if (features.includes('Dashboard'))     retention.push('Check Dashboard Updates');
  if (features.includes('Analytics'))     retention.push('Review Progress / Metrics');
  if (features.includes('Chat'))          retention.push('Engage in Community or Chat');
  retention.push('Achieve Ongoing Value', 'Refer a Friend or Colleague');
  return retention.slice(0, 6);
}

function deriveUpgradeFlow(objective: BusinessObjective, hasBilling: boolean): string[] {
  if (!hasBilling) return [];
  return [
    'Hit Feature Gate or Usage Limit',
    'View Upgrade Prompt',
    'Compare Plans on Pricing Page',
    'Select Pro or Enterprise Plan',
    'Enter Payment Method',
    'Confirmation + Access to Premium Features',
  ];
}

// ── Monetization Planning ─────────────────────────────────────────────────────

export function planMonetization(
  goal: ProductGoal,
  objective: BusinessObjective,
  features: ProductFeature[],
): MonetizationPlan {
  const hasBilling = features.includes('Billing') || features.includes('Payments');
  const strategy = deriveMonetizationStrategy(goal, objective);

  if (strategy === 'None' || strategy === 'Free') {
    return {
      strategy,
      freePlan:      ['Full Access'],
      proPlan:       [],
      enterprisePlan:[],
      pricingTable:  false,
      upgradePoints: [],
      featureGates:  [],
      usageLimits:   [],
      trialFlow:     false,
    };
  }

  const freePlanFeatures   = deriveFreePlanFeatures(strategy, features);
  const proPlanFeatures    = deriveProPlanFeatures(strategy, features);
  const enterpriseFeatures = deriveEnterprisePlanFeatures(features);

  return {
    strategy,
    freePlan:      freePlanFeatures,
    proPlan:       proPlanFeatures,
    enterprisePlan:enterpriseFeatures,
    pricingTable:  true,
    upgradePoints: ['After Free Trial Expires', 'Hit Usage Limit', 'Access Advanced Feature'],
    featureGates:  deriveFeatureGates(features),
    usageLimits:   deriveUsageLimits(strategy),
    trialFlow:     strategy === 'Freemium' || strategy === 'Subscription',
  };
}

function deriveMonetizationStrategy(
  goal: ProductGoal,
  objective: BusinessObjective,
): MonetizationPlan['strategy'] {
  const objectiveMap: Partial<Record<BusinessObjective, MonetizationPlan['strategy']>> = {
    Subscriptions:  'Subscription',
    Freemium:       'Freemium',
    PaidSaaS:       'Subscription',
    Sales:          'OneTime',
    Bookings:       'OneTime',
    Appointments:   'OneTime',
    LeadGeneration: 'Free',
    Contact:        'Free',
    Newsletter:     'Free',
    Documentation:  'Free',
    BrandAwareness: 'Free',
  };
  if (objectiveMap[objective]) return objectiveMap[objective]!;

  const goalMap: Partial<Record<ProductGoal, MonetizationPlan['strategy']>> = {
    SaaS:                'Subscription',
    AIProduct:           'Freemium',
    ECommerce:           'OneTime',
    EnterpriseSoftware:  'Enterprise',
    BookingPlatform:     'OneTime',
    AnalyticsPlatform:   'Subscription',
    DeveloperTool:       'Freemium',
    LandingPage:         'None',
    Portfolio:           'None',
    Blog:                'Free',
  };
  return goalMap[goal] ?? 'Subscription';
}

function deriveFreePlanFeatures(strategy: MonetizationPlan['strategy'], features: ProductFeature[]): string[] {
  if (strategy === 'Freemium') {
    return ['Core Features (Limited)', '1 User', '100 Records Limit', 'Community Support'];
  }
  if (strategy === 'Subscription') {
    return ['14-day Free Trial', 'All Pro Features', 'No Credit Card Required'];
  }
  return ['Basic Access'];
}

function deriveProPlanFeatures(strategy: MonetizationPlan['strategy'], features: ProductFeature[]): string[] {
  const base = ['All Free Features', 'Unlimited Records', 'Priority Support', 'Advanced Analytics'];
  if (features.includes('Teams')) base.push('Up to 10 Team Members');
  if (features.includes('Exports')) base.push('Data Exports (CSV, PDF)');
  if (features.includes('APIAccess' as unknown as ProductFeature)) base.push('API Access');
  return base;
}

function deriveEnterprisePlanFeatures(features: ProductFeature[]): string[] {
  const base = ['Everything in Pro', 'Unlimited Users', 'SSO / SAML', 'Custom Integrations', 'Dedicated Support'];
  if (features.includes('AuditLogs')) base.push('Audit Logs & Compliance');
  if (features.includes('Permissions')) base.push('Advanced Role-Based Permissions');
  return base;
}

function deriveFeatureGates(features: ProductFeature[]): string[] {
  const gates: string[] = [];
  if (features.includes('Analytics'))  gates.push('Advanced Analytics (Pro only)');
  if (features.includes('Teams'))      gates.push('Team Collaboration (Pro only)');
  if (features.includes('Reports'))    gates.push('Custom Reports (Pro only)');
  if (features.includes('AuditLogs'))  gates.push('Audit Logs (Enterprise only)');
  if (features.includes('Exports'))    gates.push('Bulk Exports (Pro only)');
  return gates;
}

function deriveUsageLimits(strategy: MonetizationPlan['strategy']): string[] {
  if (strategy === 'Freemium') {
    return ['100 records on Free plan', '3 projects on Free plan', '5 team members on Free plan'];
  }
  if (strategy === 'Subscription') {
    return ['1,000 records on Starter', 'Unlimited on Pro'];
  }
  return [];
}
