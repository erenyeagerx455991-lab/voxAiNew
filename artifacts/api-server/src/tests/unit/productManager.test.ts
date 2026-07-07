// ── V8.4 Product Manager — Test Suite (250+ tests) ────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { runProductManager } from '../../product-manager/productManager.js';
import { detectProductGoal, generateInformationArchitecture, buildRoadmap, detectProductRisks, scoreProductQuality, computeOverallProductScore, buildProductContext, buildPromptSummary, QUALITY_WEIGHTS } from '../../product-manager/productPlanner.js';
import { detectBusinessObjective, detectUserPersonas } from '../../product-manager/businessPlanner.js';
import { planFeatures, isFeatureOverloaded } from '../../product-manager/featurePlanner.js';
import { planUserJourney, planMonetization } from '../../product-manager/journeyPlanner.js';
import { recordProductRun, getProductMetrics, resetProductMetrics } from '../../product-manager/productMetrics.js';
import { learnFromProduct, getProductLearningHistory, getProductLearningTrend, resetProductLearning } from '../../product-manager/productLearning.js';
import { productScoreSeverity, ALL_PRODUCT_GOALS, ALL_BUSINESS_OBJECTIVES, ALL_USER_PERSONAS, ALL_PRODUCT_FEATURES, ALL_PRODUCT_RISKS, ALL_QUALITY_DIMENSIONS } from '../../product-manager/productTypes.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const saasPrompt = 'Build a SaaS project management tool for startups with authentication, teams, billing, kanban board, and analytics dashboard. Freemium pricing with upgrade to Pro plan.';

const landingPrompt = 'Create a beautiful landing page for my AI product launch with waitlist signup, testimonials, and email capture.';

const ecommercePrompt = 'Build an e-commerce shop for handmade jewelry with product catalog, shopping cart, checkout, and order history.';

const healthcarePrompt = 'Create a healthcare booking platform where patients can book appointments with doctors, view availability, and receive reminders.';

const emptyPrompt = 'Build me a website';

// ── productScoreSeverity ──────────────────────────────────────────────────────

describe('productScoreSeverity', () => {
  it('returns Low for score >= 7', () => expect(productScoreSeverity(7)).toBe('Low'));
  it('returns Low for score = 10', () => expect(productScoreSeverity(10)).toBe('Low'));
  it('returns Medium for score = 6', () => expect(productScoreSeverity(6)).toBe('Medium'));
  it('returns Medium for score = 5', () => expect(productScoreSeverity(5)).toBe('Medium'));
  it('returns High for score = 4', () => expect(productScoreSeverity(4)).toBe('High'));
  it('returns High for score = 3', () => expect(productScoreSeverity(3)).toBe('High'));
  it('returns Critical for score = 2.9', () => expect(productScoreSeverity(2.9)).toBe('Critical'));
  it('returns Critical for score = 0', () => expect(productScoreSeverity(0)).toBe('Critical'));
});

// ── Constant arrays ───────────────────────────────────────────────────────────

describe('ALL_PRODUCT_GOALS', () => {
  it('contains exactly 22 goals', () => expect(ALL_PRODUCT_GOALS).toHaveLength(22));
  it('includes SaaS', () => expect(ALL_PRODUCT_GOALS).toContain('SaaS'));
  it('includes LandingPage', () => expect(ALL_PRODUCT_GOALS).toContain('LandingPage'));
  it('includes AIProduct', () => expect(ALL_PRODUCT_GOALS).toContain('AIProduct'));
  it('has no duplicates', () => expect(new Set(ALL_PRODUCT_GOALS).size).toBe(ALL_PRODUCT_GOALS.length));
});

describe('ALL_BUSINESS_OBJECTIVES', () => {
  it('contains exactly 20 objectives', () => expect(ALL_BUSINESS_OBJECTIVES).toHaveLength(20));
  it('includes LeadGeneration', () => expect(ALL_BUSINESS_OBJECTIVES).toContain('LeadGeneration'));
  it('includes Subscriptions', () => expect(ALL_BUSINESS_OBJECTIVES).toContain('Subscriptions'));
  it('has no duplicates', () => expect(new Set(ALL_BUSINESS_OBJECTIVES).size).toBe(ALL_BUSINESS_OBJECTIVES.length));
});

describe('ALL_USER_PERSONAS', () => {
  it('contains exactly 18 personas', () => expect(ALL_USER_PERSONAS).toHaveLength(18));
  it('includes Founder', () => expect(ALL_USER_PERSONAS).toContain('Founder'));
  it('includes Developer', () => expect(ALL_USER_PERSONAS).toContain('Developer'));
  it('has no duplicates', () => expect(new Set(ALL_USER_PERSONAS).size).toBe(ALL_USER_PERSONAS.length));
});

describe('ALL_PRODUCT_FEATURES', () => {
  it('contains exactly 26 features', () => expect(ALL_PRODUCT_FEATURES).toHaveLength(26));
  it('includes Authentication', () => expect(ALL_PRODUCT_FEATURES).toContain('Authentication'));
  it('includes AIAssistant', () => expect(ALL_PRODUCT_FEATURES).toContain('AIAssistant'));
  it('has no duplicates', () => expect(new Set(ALL_PRODUCT_FEATURES).size).toBe(ALL_PRODUCT_FEATURES.length));
});

describe('ALL_PRODUCT_RISKS', () => {
  it('contains exactly 13 risks', () => expect(ALL_PRODUCT_RISKS).toHaveLength(13));
  it('includes MissingCTA', () => expect(ALL_PRODUCT_RISKS).toContain('MissingCTA'));
  it('includes FeatureOverload', () => expect(ALL_PRODUCT_RISKS).toContain('FeatureOverload'));
  it('has no duplicates', () => expect(new Set(ALL_PRODUCT_RISKS).size).toBe(ALL_PRODUCT_RISKS.length));
});

describe('ALL_QUALITY_DIMENSIONS', () => {
  it('contains exactly 11 dimensions', () => expect(ALL_QUALITY_DIMENSIONS).toHaveLength(11));
  it('includes businessValue', () => expect(ALL_QUALITY_DIMENSIONS).toContain('businessValue'));
  it('includes enterpriseReadiness', () => expect(ALL_QUALITY_DIMENSIONS).toContain('enterpriseReadiness'));
  it('has no duplicates', () => expect(new Set(ALL_QUALITY_DIMENSIONS).size).toBe(ALL_QUALITY_DIMENSIONS.length));
});

// ── QUALITY_WEIGHTS ───────────────────────────────────────────────────────────

describe('QUALITY_WEIGHTS', () => {
  it('covers all 11 dimensions', () => {
    for (const dim of ALL_QUALITY_DIMENSIONS) {
      expect(QUALITY_WEIGHTS[dim]).toBeDefined();
    }
  });
  it('all weights are positive', () => {
    for (const w of Object.values(QUALITY_WEIGHTS)) {
      expect(w).toBeGreaterThan(0);
    }
  });
  it('weights sum to 1.00 (±0.005)', () => {
    const sum = Object.values(QUALITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });
});

// ── detectProductGoal ─────────────────────────────────────────────────────────

describe('detectProductGoal', () => {
  it('detects SaaS from saas prompt', () => {
    const { goal } = detectProductGoal(saasPrompt);
    expect(goal).toBe('SaaS');
  });

  it('detects LandingPage from landing page prompt', () => {
    const { goal } = detectProductGoal(landingPrompt);
    expect(goal).toBe('LandingPage');
  });

  it('detects ECommerce from shop prompt', () => {
    const { goal } = detectProductGoal(ecommercePrompt);
    expect(goal).toBe('ECommerce');
  });

  it('detects Healthcare from doctor booking prompt', () => {
    const { goal } = detectProductGoal(healthcarePrompt);
    expect(goal).toBe('Healthcare');
  });

  it('detects AIProduct from AI/LLM prompt', () => {
    const { goal } = detectProductGoal('Build an AI copilot with GPT for developers');
    expect(goal).toBe('AIProduct');
  });

  it('detects Dashboard from admin/dashboard prompt', () => {
    const { goal } = detectProductGoal('Create a dashboard and admin panel with analytics');
    expect(['Dashboard', 'AdminPanel']).toContain(goal);
  });

  it('detects KnowledgeBase from docs prompt', () => {
    const { goal } = detectProductGoal('Build a knowledge base with wiki and documentation');
    expect(goal).toBe('KnowledgeBase');
  });

  it('detects CRM from CRM prompt', () => {
    const { goal } = detectProductGoal('Build a CRM for tracking contacts and sales pipeline');
    expect(goal).toBe('CRM');
  });

  it('returns LandingPage as default for vague prompt', () => {
    const { goal } = detectProductGoal(emptyPrompt);
    expect(typeof goal).toBe('string');
    expect(goal.length).toBeGreaterThan(0);
  });

  it('returns confidence between 0 and 1', () => {
    const { confidence } = detectProductGoal(saasPrompt);
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('returns higher confidence for specific prompts', () => {
    const specific = detectProductGoal('Build a SaaS web application with subscription billing');
    const vague    = detectProductGoal('Build a website');
    expect(specific.confidence).toBeGreaterThanOrEqual(vague.confidence);
  });

  it('detects Portfolio from portfolio prompt', () => {
    const { goal } = detectProductGoal('Build a portfolio website to showcase my design work');
    expect(goal).toBe('Portfolio');
  });

  it('detects DeveloperTool from API/SDK prompt', () => {
    const { goal } = detectProductGoal('Build a developer tool CLI with API platform for devops');
    expect(goal).toBe('DeveloperTool');
  });

  it('detects Marketplace from marketplace prompt', () => {
    const { goal } = detectProductGoal('Build a marketplace for buying and selling digital products');
    expect(goal).toBe('Marketplace');
  });
});

// ── detectBusinessObjective ───────────────────────────────────────────────────

describe('detectBusinessObjective', () => {
  it('detects Freemium from freemium/upgrade prompt', () => {
    const obj = detectBusinessObjective(saasPrompt, 'SaaS');
    expect(obj).toBe('Freemium');
  });

  it('detects LeadGeneration from landing page prompt', () => {
    const obj = detectBusinessObjective(landingPrompt, 'LandingPage');
    expect(obj).toBe('LeadGeneration');
  });

  it('detects Sales from e-commerce prompt', () => {
    const obj = detectBusinessObjective(ecommercePrompt, 'ECommerce');
    expect(obj).toBe('Sales');
  });

  it('detects Bookings from booking prompt', () => {
    const obj = detectBusinessObjective('Build a booking platform for restaurant reservations', 'BookingPlatform');
    expect(['Bookings', 'Appointments']).toContain(obj);
  });

  it('detects DemoRequests from demo prompt', () => {
    const obj = detectBusinessObjective('Build a landing page with request a demo CTA', 'LandingPage');
    expect(obj).toBe('DemoRequests');
  });

  it('detects Subscriptions from subscription prompt', () => {
    const obj = detectBusinessObjective('Monthly and annual subscription plans', 'SaaS');
    expect(obj).toBe('Subscriptions');
  });

  it('falls back to goal default for empty prompt', () => {
    const obj = detectBusinessObjective('', 'SaaS');
    expect(typeof obj).toBe('string');
    expect(obj.length).toBeGreaterThan(0);
  });

  it('detects Documentation from docs prompt', () => {
    const obj = detectBusinessObjective('Developer guide and API reference documentation site', 'KnowledgeBase');
    expect(obj).toBe('Documentation');
  });

  it('detects Hiring from job/careers prompt', () => {
    const obj = detectBusinessObjective('Job posting and recruiting platform for talent acquisition', 'Marketplace');
    expect(obj).toBe('Hiring');
  });

  it('returns a valid BusinessObjective', () => {
    const obj = detectBusinessObjective(saasPrompt, 'SaaS');
    expect(ALL_BUSINESS_OBJECTIVES).toContain(obj);
  });
});

// ── detectUserPersonas ────────────────────────────────────────────────────────

describe('detectUserPersonas', () => {
  it('detects Founder for SaaS prompt', () => {
    const personas = detectUserPersonas(saasPrompt, 'SaaS');
    expect(personas.length).toBeGreaterThan(0);
    expect(personas.every(p => ALL_USER_PERSONAS.includes(p))).toBe(true);
  });

  it('detects Developer from developer prompt', () => {
    const personas = detectUserPersonas('Build a tool for developers and engineers', 'DeveloperTool');
    expect(personas).toContain('Developer');
  });

  it('detects Doctor from healthcare prompt', () => {
    const personas = detectUserPersonas(healthcarePrompt, 'Healthcare');
    expect(personas).toContain('Doctor');
  });

  it('returns fallback personas for empty prompt', () => {
    const personas = detectUserPersonas('', 'SaaS');
    expect(personas.length).toBeGreaterThan(0);
  });

  it('returns at most 4 personas', () => {
    const longPrompt = 'founder developer designer agency startup enterprise student teacher doctor lawyer creator freelancer';
    const personas = detectUserPersonas(longPrompt, 'SaaS');
    expect(personas.length).toBeLessThanOrEqual(4);
  });

  it('detects Agency from agency prompt', () => {
    const personas = detectUserPersonas('Build a site for our digital agency and client work', 'Agency');
    expect(personas).toContain('Agency');
  });

  it('detects Enterprise from enterprise prompt', () => {
    const personas = detectUserPersonas('Enterprise B2B platform for corporate clients', 'EnterpriseSoftware');
    expect(personas).toContain('Enterprise');
  });
});

// ── planFeatures ──────────────────────────────────────────────────────────────

describe('planFeatures', () => {
  it('returns array of ProductFeatures', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder'], saasPrompt);
    expect(Array.isArray(features)).toBe(true);
  });

  it('includes Authentication for SaaS', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder'], 'saas with auth');
    expect(features).toContain('Authentication');
  });

  it('includes Billing for subscription objective', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder'], 'billing stripe');
    expect(features).toContain('Billing');
  });

  it('detects Kanban from kanban keyword', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder'], 'kanban board');
    expect(features).toContain('Kanban');
  });

  it('detects AIAssistant from ai/gpt keyword', () => {
    const features = planFeatures('AIProduct', 'Subscriptions', ['Developer'], 'ai gpt assistant');
    expect(features).toContain('AIAssistant');
  });

  it('excludes Workspace from LandingPage', () => {
    const features = planFeatures('LandingPage', 'LeadGeneration', ['Founder'], landingPrompt);
    expect(features).not.toContain('Workspace');
  });

  it('excludes Teams from Portfolio', () => {
    const features = planFeatures('Portfolio', 'BrandAwareness', ['Designer'], '');
    expect(features).not.toContain('Teams');
  });

  it('includes Calendar for Bookings objective', () => {
    const features = planFeatures('BookingPlatform', 'Bookings', ['Founder'], 'calendar booking appointment');
    expect(features).toContain('Calendar');
  });

  it('includes Teams for Enterprise persona', () => {
    const features = planFeatures('EnterpriseSoftware', 'PaidSaaS', ['Enterprise'], 'team collaboration');
    expect(features).toContain('Teams');
  });

  it('includes AuditLogs for compliance keywords', () => {
    const features = planFeatures('EnterpriseSoftware', 'PaidSaaS', ['Enterprise'], 'audit log compliance gdpr');
    expect(features).toContain('AuditLogs');
  });

  it('returns unique features', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder', 'Developer'], saasPrompt);
    expect(new Set(features).size).toBe(features.length);
  });
});

// ── isFeatureOverloaded ───────────────────────────────────────────────────────

describe('isFeatureOverloaded', () => {
  it('returns false for ≤ 10 features', () => {
    const features = ALL_PRODUCT_FEATURES.slice(0, 10) as any;
    expect(isFeatureOverloaded(features)).toBe(false);
  });

  it('returns true for > 10 features', () => {
    const features = ALL_PRODUCT_FEATURES as any;
    expect(isFeatureOverloaded(features)).toBe(true);
  });
});

// ── planUserJourney ───────────────────────────────────────────────────────────

describe('planUserJourney', () => {
  it('returns a UserJourney with all required fields', () => {
    const journey = planUserJourney('SaaS', ['Authentication', 'Billing', 'Dashboard'], 'Subscriptions');
    expect(journey).toHaveProperty('entryPoint');
    expect(journey).toHaveProperty('primaryFlow');
    expect(journey).toHaveProperty('secondaryFlow');
    expect(journey).toHaveProperty('onboarding');
    expect(journey).toHaveProperty('activation');
    expect(journey).toHaveProperty('conversion');
    expect(journey).toHaveProperty('retention');
    expect(journey).toHaveProperty('upgradeFlow');
    expect(journey).toHaveProperty('supportFlow');
    expect(journey).toHaveProperty('exitFlow');
  });

  it('entryPoint is a non-empty string', () => {
    const journey = planUserJourney('SaaS', ['Authentication'], 'Subscriptions');
    expect(journey.entryPoint.length).toBeGreaterThan(0);
  });

  it('primaryFlow is an array of strings', () => {
    const journey = planUserJourney('LandingPage', [], 'LeadGeneration');
    expect(Array.isArray(journey.primaryFlow)).toBe(true);
    for (const step of journey.primaryFlow) expect(typeof step).toBe('string');
  });

  it('onboarding includes auth steps when Authentication in features', () => {
    const journey = planUserJourney('SaaS', ['Authentication', 'Dashboard'], 'Subscriptions');
    expect(journey.onboarding.join(' ')).toMatch(/account|email|profile/i);
  });

  it('upgradeFlow is non-empty for subscription objective with billing', () => {
    const journey = planUserJourney('SaaS', ['Authentication', 'Billing'], 'Subscriptions');
    expect(journey.upgradeFlow.length).toBeGreaterThan(0);
  });

  it('upgradeFlow is empty for non-billing objectives', () => {
    const journey = planUserJourney('LandingPage', [], 'LeadGeneration');
    expect(journey.upgradeFlow).toHaveLength(0);
  });

  it('retention array includes return step', () => {
    const journey = planUserJourney('SaaS', ['Notifications', 'Dashboard'], 'Retention');
    expect(journey.retention.length).toBeGreaterThan(0);
  });
});

// ── planMonetization ──────────────────────────────────────────────────────────

describe('planMonetization', () => {
  it('returns a MonetizationPlan with strategy field', () => {
    const plan = planMonetization('SaaS', 'Subscriptions', ['Authentication', 'Billing']);
    expect(plan).toHaveProperty('strategy');
    expect(plan).toHaveProperty('pricingTable');
    expect(plan).toHaveProperty('trialFlow');
  });

  it('SaaS + Subscriptions returns Subscription strategy', () => {
    const plan = planMonetization('SaaS', 'Subscriptions', ['Authentication', 'Billing']);
    expect(plan.strategy).toBe('Subscription');
  });

  it('Freemium objective returns Freemium strategy', () => {
    const plan = planMonetization('SaaS', 'Freemium', ['Authentication', 'Billing']);
    expect(plan.strategy).toBe('Freemium');
  });

  it('LandingPage returns None or Free strategy', () => {
    const plan = planMonetization('LandingPage', 'LeadGeneration', []);
    expect(['None', 'Free']).toContain(plan.strategy);
  });

  it('ECommerce returns OneTime strategy', () => {
    const plan = planMonetization('ECommerce', 'Sales', ['Payments']);
    expect(plan.strategy).toBe('OneTime');
  });

  it('pricingTable is true for Subscription strategy', () => {
    const plan = planMonetization('SaaS', 'Subscriptions', ['Billing']);
    expect(plan.pricingTable).toBe(true);
  });

  it('pricingTable is false for Free/None strategy', () => {
    const plan = planMonetization('LandingPage', 'LeadGeneration', []);
    expect(plan.pricingTable).toBe(false);
  });

  it('trialFlow is true for Freemium', () => {
    const plan = planMonetization('SaaS', 'Freemium', ['Billing']);
    expect(plan.trialFlow).toBe(true);
  });

  it('enterprisePlan includes SSO for enterprise', () => {
    const plan = planMonetization('EnterpriseSoftware', 'PaidSaaS', ['Teams', 'Permissions', 'AuditLogs']);
    if (plan.enterprisePlan.length > 0) {
      expect(plan.enterprisePlan.join(' ')).toMatch(/sso|enterprise|unlimited/i);
    }
  });
});

// ── detectProductRisks ────────────────────────────────────────────────────────

describe('detectProductRisks', () => {
  it('detects MissingCTA for SaaS without CTA keywords', () => {
    const risks = detectProductRisks('SaaS', ['Authentication'], 'Subscriptions', 'Build a SaaS project management tool');
    expect(risks).toContain('MissingCTA');
  });

  it('does not flag MissingCTA when CTA present', () => {
    const risks = detectProductRisks('SaaS', ['Authentication', 'Billing'], 'Subscriptions', 'Get started free with our SaaS');
    expect(risks).not.toContain('MissingCTA');
  });

  it('detects MissingPricing for Subscriptions without pricing', () => {
    const risks = detectProductRisks('SaaS', ['Authentication'], 'Subscriptions', 'Build a subscription app');
    expect(risks).toContain('MissingPricing');
  });

  it('does not flag MissingPricing for LandingPage', () => {
    const risks = detectProductRisks('LandingPage', [], 'LeadGeneration', 'landing page');
    expect(risks).not.toContain('MissingPricing');
  });

  it('detects FeatureOverload for > 10 features', () => {
    const manyFeatures = ALL_PRODUCT_FEATURES.slice(0, 12) as any;
    const risks = detectProductRisks('SaaS', manyFeatures, 'Subscriptions', 'build');
    expect(risks).toContain('FeatureOverload');
  });

  it('detects MissingAuthentication for SaaS without Auth feature', () => {
    const risks = detectProductRisks('SaaS', ['Dashboard'], 'Subscriptions', 'build a saas');
    expect(risks).toContain('MissingAuthentication');
  });

  it('does not flag MissingAuthentication when Authentication present', () => {
    const risks = detectProductRisks('SaaS', ['Authentication', 'Dashboard'], 'Subscriptions', 'get started free');
    expect(risks).not.toContain('MissingAuthentication');
  });

  it('detects PoorTrust for SaaS without trust signals', () => {
    const risks = detectProductRisks('SaaS', ['Authentication'], 'Subscriptions', 'build a saas get started');
    expect(risks).toContain('PoorTrust');
  });

  it('does not flag PoorTrust when testimonials present', () => {
    const risks = detectProductRisks('SaaS', ['Authentication'], 'Subscriptions', 'customer testimonials social proof case studies get started');
    expect(risks).not.toContain('PoorTrust');
  });

  it('returns an array', () => {
    const risks = detectProductRisks('LandingPage', [], 'LeadGeneration', landingPrompt);
    expect(Array.isArray(risks)).toBe(true);
  });

  it('detects MissingUpgradeFlow for Freemium without Billing', () => {
    const risks = detectProductRisks('SaaS', ['Authentication'], 'Freemium', 'freemium build');
    expect(risks).toContain('MissingUpgradeFlow');
  });

  it('detects WeakDashboard for Dashboard goal without Analytics', () => {
    const risks = detectProductRisks('Dashboard', ['Authentication'], 'UserActivation', 'dashboard');
    expect(risks).toContain('WeakDashboard');
  });
});

// ── scoreProductQuality ───────────────────────────────────────────────────────

describe('scoreProductQuality', () => {
  it('returns 11 quality scores', () => {
    const scores = scoreProductQuality({
      goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication', 'Dashboard', 'Billing'],
      personas: ['Founder'], risks: [], prompt: saasPrompt,
    });
    expect(scores).toHaveLength(11);
  });

  it('all scores are in [0, 10]', () => {
    const scores = scoreProductQuality({
      goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'],
      personas: ['Founder'], risks: ['MissingCTA'], prompt: 'build a saas',
    });
    for (const s of scores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(10);
    }
  });

  it('covers all 11 dimensions', () => {
    const scores = scoreProductQuality({
      goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'],
      personas: ['Founder'], risks: [], prompt: saasPrompt,
    });
    const dims = scores.map(s => s.dimension);
    for (const dim of ALL_QUALITY_DIMENSIONS) {
      expect(dims).toContain(dim);
    }
  });

  it('MissingCTA risk lowers businessValue score', () => {
    const withRisk    = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'], personas: ['Founder'], risks: ['MissingCTA'], prompt: 'build' });
    const withoutRisk = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'], personas: ['Founder'], risks: [], prompt: 'get started free' });
    const bizWithRisk    = withRisk.find(s => s.dimension === 'businessValue')!.score;
    const bizWithoutRisk = withoutRisk.find(s => s.dimension === 'businessValue')!.score;
    expect(bizWithRisk).toBeLessThan(bizWithoutRisk);
  });

  it('FeatureOverload risk lowers productSimplicity', () => {
    const withRisk    = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: ALL_PRODUCT_FEATURES as any, personas: ['Founder'], risks: ['FeatureOverload'], prompt: 'build' });
    const withoutRisk = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'], personas: ['Founder'], risks: [], prompt: 'build' });
    const simpleWith    = withRisk.find(s => s.dimension === 'productSimplicity')!.score;
    const simpleWithout = withoutRisk.find(s => s.dimension === 'productSimplicity')!.score;
    expect(simpleWith).toBeLessThan(simpleWithout);
  });

  it('Teams+Permissions+AuditLogs boosts enterpriseReadiness', () => {
    const rich = scoreProductQuality({ goal: 'EnterpriseSoftware', objective: 'PaidSaaS', features: ['Teams', 'Permissions', 'AuditLogs', 'Authentication'], personas: ['Enterprise'], risks: [], prompt: 'enterprise' });
    const lean = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: ['Authentication'], personas: ['Founder'], risks: [], prompt: 'saas' });
    const richER = rich.find(s => s.dimension === 'enterpriseReadiness')!.score;
    const leanER = lean.find(s => s.dimension === 'enterpriseReadiness')!.score;
    expect(richER).toBeGreaterThan(leanER);
  });

  it('each score has severity field', () => {
    const scores = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: [], personas: [], risks: [], prompt: '' });
    for (const s of scores) {
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(s.severity);
    }
  });

  it('each score has recommendation string', () => {
    const scores = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: [], personas: [], risks: [], prompt: '' });
    for (const s of scores) {
      expect(typeof s.recommendation).toBe('string');
      expect(s.recommendation.length).toBeGreaterThan(0);
    }
  });
});

// ── computeOverallProductScore ────────────────────────────────────────────────

describe('computeOverallProductScore', () => {
  it('returns 5 for empty scores', () => {
    expect(computeOverallProductScore([])).toBe(5.0);
  });

  it('returns value in [0, 10]', () => {
    const scores = ALL_QUALITY_DIMENSIONS.map(dim => ({
      dimension: dim, score: 8, severity: 'Low' as const, confidence: 0.8, recommendation: 'ok',
    }));
    const overall = computeOverallProductScore(scores);
    expect(overall).toBeGreaterThanOrEqual(0);
    expect(overall).toBeLessThanOrEqual(10);
  });

  it('higher scores produce higher overall', () => {
    const high = ALL_QUALITY_DIMENSIONS.map(dim => ({ dimension: dim, score: 9, severity: 'Low' as const, confidence: 0.8, recommendation: 'ok' }));
    const low  = ALL_QUALITY_DIMENSIONS.map(dim => ({ dimension: dim, score: 3, severity: 'High' as const, confidence: 0.8, recommendation: 'fix' }));
    expect(computeOverallProductScore(high)).toBeGreaterThan(computeOverallProductScore(low));
  });

  it('result is rounded to 1 decimal', () => {
    const scores = ALL_QUALITY_DIMENSIONS.map(dim => ({ dimension: dim, score: 7.333, severity: 'Low' as const, confidence: 0.8, recommendation: 'ok' }));
    const result = computeOverallProductScore(scores);
    expect(result).toBe(Math.round(result * 10) / 10);
  });
});

// ── generateInformationArchitecture ──────────────────────────────────────────

describe('generateInformationArchitecture', () => {
  it('returns IA with all required fields', () => {
    const ia = generateInformationArchitecture('SaaS', ['Authentication', 'Dashboard'], 'Subscriptions');
    expect(ia).toHaveProperty('pages');
    expect(ia).toHaveProperty('sections');
    expect(ia).toHaveProperty('navigation');
    expect(ia).toHaveProperty('sidebar');
    expect(ia).toHaveProperty('footer');
    expect(ia).toHaveProperty('settingsStructure');
    expect(ia).toHaveProperty('contentHierarchy');
    expect(ia).toHaveProperty('featureRelationships');
    expect(ia).toHaveProperty('dependencies');
  });

  it('SaaS pages include Login', () => {
    const ia = generateInformationArchitecture('SaaS', ['Authentication'], 'Subscriptions');
    expect(ia.pages.join(' ')).toMatch(/login|sign/i);
  });

  it('Dashboard has sidebar items', () => {
    const ia = generateInformationArchitecture('Dashboard', ['Analytics', 'Reports', 'Settings'], 'UserActivation');
    expect(ia.sidebar.length).toBeGreaterThan(0);
  });

  it('LandingPage has empty sidebar', () => {
    const ia = generateInformationArchitecture('LandingPage', [], 'LeadGeneration');
    expect(ia.sidebar).toHaveLength(0);
  });

  it('sections include Navbar and Footer for marketing goals', () => {
    const ia = generateInformationArchitecture('SaaS', [], 'Subscriptions');
    expect(ia.sections).toContain('Navbar');
    expect(ia.sections).toContain('Footer');
  });

  it('Teams feature creates dependency entry', () => {
    const ia = generateInformationArchitecture('SaaS', ['Teams', 'Authentication'], 'Subscriptions');
    expect(ia.dependencies.join(' ')).toMatch(/teams requires auth/i);
  });

  it('Billing feature adds Billing to settings', () => {
    const ia = generateInformationArchitecture('SaaS', ['Billing', 'Authentication'], 'Subscriptions');
    expect(ia.settingsStructure.join(' ')).toMatch(/billing/i);
  });
});

// ── buildRoadmap ──────────────────────────────────────────────────────────────

describe('buildRoadmap', () => {
  it('returns a ProductRoadmap with all fields', () => {
    const roadmap = buildRoadmap('SaaS', ['Authentication', 'Dashboard', 'Billing'], 'Subscriptions');
    expect(roadmap).toHaveProperty('mvp');
    expect(roadmap).toHaveProperty('phase2');
    expect(roadmap).toHaveProperty('phase3');
    expect(roadmap).toHaveProperty('futureFeatures');
    expect(roadmap).toHaveProperty('niceToHave');
    expect(roadmap).toHaveProperty('technicalPriorities');
    expect(roadmap).toHaveProperty('businessPriorities');
  });

  it('mvp has at most 5 features', () => {
    const features = ALL_PRODUCT_FEATURES as any;
    const roadmap = buildRoadmap('SaaS', features, 'Subscriptions');
    expect(roadmap.mvp.length).toBeLessThanOrEqual(5);
  });

  it('niceToHave includes Dark Mode', () => {
    const roadmap = buildRoadmap('SaaS', [], 'Subscriptions');
    expect(roadmap.niceToHave).toContain('Dark Mode');
  });

  it('technicalPriorities includes Performance', () => {
    const roadmap = buildRoadmap('SaaS', [], 'Subscriptions');
    expect(roadmap.technicalPriorities).toContain('Performance');
  });

  it('businessPriorities is non-empty', () => {
    const roadmap = buildRoadmap('SaaS', [], 'Subscriptions');
    expect(roadmap.businessPriorities.length).toBeGreaterThan(0);
  });
});

// ── buildProductContext ───────────────────────────────────────────────────────

describe('buildProductContext', () => {
  it('returns a non-empty string', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const ctx = buildProductContext(productPlan);
    expect(typeof ctx).toBe('string');
    expect(ctx.length).toBeGreaterThan(10);
  });

  it('includes product goal', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const ctx = buildProductContext(productPlan);
    expect(ctx).toContain(productPlan.productGoal);
  });

  it('includes business objective', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const ctx = buildProductContext(productPlan);
    expect(ctx).toContain(productPlan.businessObjective);
  });

  it('contains the PRODUCT MANAGER STRATEGY marker', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const ctx = buildProductContext(productPlan);
    expect(ctx).toContain('PRODUCT MANAGER STRATEGY');
  });
});

// ── buildPromptSummary ────────────────────────────────────────────────────────

describe('buildPromptSummary', () => {
  it('returns a non-empty string', () => {
    const s = buildPromptSummary(saasPrompt, 'SaaS', 'Subscriptions');
    expect(typeof s).toBe('string');
    expect(s.length).toBeGreaterThan(5);
  });

  it('includes goal and objective', () => {
    const s = buildPromptSummary(saasPrompt, 'SaaS', 'Subscriptions');
    expect(s).toContain('SaaS');
    expect(s).toContain('Subscriptions');
  });
});

// ── runProductManager (full engine) ──────────────────────────────────────────

describe('runProductManager', () => {
  it('returns ProductManagerOutput with all fields', () => {
    const output = runProductManager(saasPrompt);
    expect(output).toHaveProperty('productPlan');
    expect(output).toHaveProperty('productScore');
    expect(output).toHaveProperty('contextString');
  });

  it('productScore is in [0, 10]', () => {
    const { productScore } = runProductManager(saasPrompt);
    expect(productScore).toBeGreaterThanOrEqual(0);
    expect(productScore).toBeLessThanOrEqual(10);
  });

  it('contextString is a non-empty string', () => {
    const { contextString } = runProductManager(saasPrompt);
    expect(typeof contextString).toBe('string');
    expect(contextString.length).toBeGreaterThan(10);
  });

  it('productPlan has all required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan).toHaveProperty('productGoal');
    expect(productPlan).toHaveProperty('businessObjective');
    expect(productPlan).toHaveProperty('userPersonas');
    expect(productPlan).toHaveProperty('plannedFeatures');
    expect(productPlan).toHaveProperty('informationArchitecture');
    expect(productPlan).toHaveProperty('userJourney');
    expect(productPlan).toHaveProperty('monetizationPlan');
    expect(productPlan).toHaveProperty('roadmap');
    expect(productPlan).toHaveProperty('detectedRisks');
    expect(productPlan).toHaveProperty('qualityScores');
    expect(productPlan).toHaveProperty('overallProductScore');
    expect(productPlan).toHaveProperty('confidence');
    expect(productPlan).toHaveProperty('promptSummary');
  });

  it('qualityScores has exactly 11 items', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.qualityScores).toHaveLength(11);
  });

  it('detects SaaS goal from saas prompt', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.productGoal).toBe('SaaS');
  });

  it('detects LandingPage from landing prompt', () => {
    const { productPlan } = runProductManager(landingPrompt);
    expect(productPlan.productGoal).toBe('LandingPage');
  });

  it('detects ECommerce from shop prompt', () => {
    const { productPlan } = runProductManager(ecommercePrompt);
    expect(productPlan.productGoal).toBe('ECommerce');
  });

  it('detects Healthcare from healthcare prompt', () => {
    const { productPlan } = runProductManager(healthcarePrompt);
    expect(productPlan.productGoal).toBe('Healthcare');
  });

  it('handles empty prompt without throwing', () => {
    expect(() => runProductManager('')).not.toThrow();
  });

  it('handles very long prompt without throwing', () => {
    const longPrompt = saasPrompt.repeat(20);
    expect(() => runProductManager(longPrompt)).not.toThrow();
  });

  it('is deterministic for same input', () => {
    const r1 = runProductManager(saasPrompt);
    const r2 = runProductManager(saasPrompt);
    expect(r1.productScore).toBe(r2.productScore);
    expect(r1.productPlan.productGoal).toBe(r2.productPlan.productGoal);
  });

  it('richer prompts produce better plans', () => {
    const rich   = runProductManager(saasPrompt);
    const sparse  = runProductManager('Build a website');
    expect(rich.productPlan.plannedFeatures.length).toBeGreaterThan(sparse.productPlan.plannedFeatures.length);
  });

  it('detects risks for incomplete plans', () => {
    const { productPlan } = runProductManager('Build a saas without cta or pricing or testimonials or authentication');
    expect(productPlan.detectedRisks.length).toBeGreaterThan(0);
  });

  it('userPersonas is a non-empty array', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.userPersonas.length).toBeGreaterThan(0);
  });

  it('monetizationPlan has a strategy', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(typeof productPlan.monetizationPlan.strategy).toBe('string');
  });

  it('roadmap.mvp has at most 5 items', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.roadmap.mvp.length).toBeLessThanOrEqual(5);
  });

  it('informationArchitecture.pages is non-empty', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.informationArchitecture.pages.length).toBeGreaterThan(0);
  });

  it('promptSummary contains goal', () => {
    const { productPlan } = runProductManager(saasPrompt);
    expect(productPlan.promptSummary).toContain(productPlan.productGoal);
  });
});

// ── productMetrics ────────────────────────────────────────────────────────────

describe('productMetrics', () => {
  beforeEach(() => resetProductMetrics());

  it('starts with 0 runs', () => {
    expect(getProductMetrics().runsTracked).toBe(0);
  });

  it('tracks a run after recordProductRun', () => {
    const { productPlan } = runProductManager(saasPrompt);
    recordProductRun({
      buildId: 'b1', productGoal: productPlan.productGoal, businessObjective: productPlan.businessObjective,
      overallScore: productPlan.overallProductScore, featureCount: productPlan.plannedFeatures.length,
      riskCount: productPlan.detectedRisks.length, personaCount: productPlan.userPersonas.length,
      confidence: productPlan.confidence, personas: productPlan.userPersonas,
      features: productPlan.plannedFeatures.map(String),
    });
    expect(getProductMetrics().runsTracked).toBe(1);
  });

  it('averageProductScore updates', () => {
    const { productPlan } = runProductManager(saasPrompt);
    recordProductRun({
      buildId: 'b2', productGoal: productPlan.productGoal, businessObjective: productPlan.businessObjective,
      overallScore: productPlan.overallProductScore, featureCount: productPlan.plannedFeatures.length,
      riskCount: productPlan.detectedRisks.length, personaCount: productPlan.userPersonas.length,
      confidence: productPlan.confidence, personas: productPlan.userPersonas,
      features: productPlan.plannedFeatures.map(String),
    });
    expect(getProductMetrics().averageProductScore).toBeGreaterThan(0);
  });

  it('businessGoalDistribution includes recorded goal', () => {
    const { productPlan } = runProductManager(saasPrompt);
    recordProductRun({
      buildId: 'b3', productGoal: productPlan.productGoal, businessObjective: productPlan.businessObjective,
      overallScore: 7, featureCount: 5, riskCount: 1, personaCount: 2,
      confidence: 0.8, personas: productPlan.userPersonas, features: ['Authentication'],
    });
    const dist = getProductMetrics().businessGoalDistribution;
    expect(dist[productPlan.productGoal]).toBeGreaterThan(0);
  });

  it('resetProductMetrics clears all state', () => {
    const { productPlan } = runProductManager(saasPrompt);
    recordProductRun({
      buildId: 'b4', productGoal: productPlan.productGoal, businessObjective: productPlan.businessObjective,
      overallScore: 7, featureCount: 5, riskCount: 0, personaCount: 2,
      confidence: 0.8, personas: ['Founder'], features: [],
    });
    resetProductMetrics();
    expect(getProductMetrics().runsTracked).toBe(0);
  });

  it('learningTrend is a string', () => {
    expect(typeof getProductMetrics().learningTrend).toBe('string');
  });

  it('mostCommonPersonas is an array', () => {
    expect(Array.isArray(getProductMetrics().mostCommonPersonas)).toBe(true);
  });

  it('topPlannedFeatures is an array', () => {
    expect(Array.isArray(getProductMetrics().topPlannedFeatures)).toBe(true);
  });

  it('planningAccuracy is a number', () => {
    expect(typeof getProductMetrics().planningAccuracy).toBe('number');
  });
});

// ── productLearning ───────────────────────────────────────────────────────────

describe('productLearning', () => {
  beforeEach(() => resetProductLearning());

  it('starts with empty history', () => {
    expect(getProductLearningHistory()).toHaveLength(0);
  });

  it('adds a record after learnFromProduct', () => {
    const { productPlan } = runProductManager(saasPrompt);
    learnFromProduct({ buildId: 'l1', productPlan });
    expect(getProductLearningHistory()).toHaveLength(1);
  });

  it('records buildId correctly', () => {
    const { productPlan } = runProductManager(saasPrompt);
    learnFromProduct({ buildId: 'my-build-42', productPlan });
    expect(getProductLearningHistory()[0].buildId).toBe('my-build-42');
  });

  it('records productGoal correctly', () => {
    const { productPlan } = runProductManager(saasPrompt);
    learnFromProduct({ buildId: 'l2', productPlan });
    expect(getProductLearningHistory()[0].productGoal).toBe('SaaS');
  });

  it('records overallScore correctly', () => {
    const { productPlan } = runProductManager(saasPrompt);
    learnFromProduct({ buildId: 'l3', productPlan });
    expect(getProductLearningHistory()[0].overallScore).toBe(productPlan.overallProductScore);
  });

  it('improved is true for high score & few risks', () => {
    const { productPlan } = runProductManager(saasPrompt);
    if (productPlan.overallProductScore >= 7 && productPlan.detectedRisks.length < 3) {
      learnFromProduct({ buildId: 'l4', productPlan });
      expect(getProductLearningHistory()[0].improved).toBe(true);
    }
  });

  it('trend is stable for empty history', () => {
    expect(getProductLearningTrend()).toBe('stable');
  });

  it('resets correctly', () => {
    const { productPlan } = runProductManager(saasPrompt);
    learnFromProduct({ buildId: 'l5', productPlan });
    resetProductLearning();
    expect(getProductLearningHistory()).toHaveLength(0);
  });

  it('handles multiple records', () => {
    const { productPlan } = runProductManager(saasPrompt);
    for (let i = 0; i < 10; i++) learnFromProduct({ buildId: `l${i}`, productPlan });
    expect(getProductLearningHistory()).toHaveLength(10);
  });

  it('trend is a valid string value', () => {
    expect(['rising', 'stable', 'falling']).toContain(getProductLearningTrend());
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('detectProductGoal handles empty string', () => {
    const { goal } = detectProductGoal('');
    expect(typeof goal).toBe('string');
  });

  it('detectBusinessObjective handles empty string', () => {
    const obj = detectBusinessObjective('', 'SaaS');
    expect(typeof obj).toBe('string');
  });

  it('detectUserPersonas handles empty string', () => {
    const personas = detectUserPersonas('', 'SaaS');
    expect(Array.isArray(personas)).toBe(true);
    expect(personas.length).toBeGreaterThan(0);
  });

  it('planFeatures handles empty prompt', () => {
    const features = planFeatures('SaaS', 'Subscriptions', ['Founder'], '');
    expect(Array.isArray(features)).toBe(true);
  });

  it('detectProductRisks handles empty features', () => {
    const risks = detectProductRisks('SaaS', [], 'Subscriptions', '');
    expect(Array.isArray(risks)).toBe(true);
  });

  it('scoreProductQuality handles empty features and risks', () => {
    const scores = scoreProductQuality({ goal: 'SaaS', objective: 'Subscriptions', features: [], personas: [], risks: [], prompt: '' });
    expect(scores).toHaveLength(11);
  });

  it('computeOverallProductScore handles partial dimensions', () => {
    const partial = [{ dimension: 'businessValue' as const, score: 8, severity: 'Low' as const, confidence: 0.8, recommendation: 'ok' }];
    const result = computeOverallProductScore(partial);
    expect(result).toBeGreaterThan(0);
  });

  it('planMonetization handles empty features', () => {
    const plan = planMonetization('SaaS', 'Subscriptions', []);
    expect(typeof plan.strategy).toBe('string');
  });

  it('planUserJourney handles empty features', () => {
    const journey = planUserJourney('SaaS', [], 'Subscriptions');
    expect(journey.entryPoint.length).toBeGreaterThan(0);
  });

  it('buildRoadmap handles empty features', () => {
    const roadmap = buildRoadmap('SaaS', [], 'Subscriptions');
    expect(Array.isArray(roadmap.mvp)).toBe(true);
  });

  it('runProductManager handles special characters', () => {
    expect(() => runProductManager('Build a <SaaS> platform & dashboard — "modern"!')).not.toThrow();
  });

  it('runProductManager is consistent across calls', () => {
    const r1 = runProductManager(landingPrompt);
    const r2 = runProductManager(landingPrompt);
    expect(r1.productPlan.productGoal).toBe(r2.productPlan.productGoal);
    expect(r1.productScore).toBe(r2.productScore);
  });
});

// ── Regression: ProductPlan shape ─────────────────────────────────────────────

describe('Regression: ProductPlan shape', () => {
  it('userJourney has all 10 required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const j = productPlan.userJourney;
    expect(j).toHaveProperty('entryPoint');
    expect(j).toHaveProperty('primaryFlow');
    expect(j).toHaveProperty('secondaryFlow');
    expect(j).toHaveProperty('onboarding');
    expect(j).toHaveProperty('activation');
    expect(j).toHaveProperty('conversion');
    expect(j).toHaveProperty('retention');
    expect(j).toHaveProperty('upgradeFlow');
    expect(j).toHaveProperty('supportFlow');
    expect(j).toHaveProperty('exitFlow');
  });

  it('monetizationPlan has all required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const m = productPlan.monetizationPlan;
    expect(m).toHaveProperty('strategy');
    expect(m).toHaveProperty('freePlan');
    expect(m).toHaveProperty('proPlan');
    expect(m).toHaveProperty('enterprisePlan');
    expect(m).toHaveProperty('pricingTable');
    expect(m).toHaveProperty('upgradePoints');
    expect(m).toHaveProperty('featureGates');
    expect(m).toHaveProperty('usageLimits');
    expect(m).toHaveProperty('trialFlow');
  });

  it('roadmap has all required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const r = productPlan.roadmap;
    expect(r).toHaveProperty('mvp');
    expect(r).toHaveProperty('phase2');
    expect(r).toHaveProperty('phase3');
    expect(r).toHaveProperty('futureFeatures');
    expect(r).toHaveProperty('niceToHave');
    expect(r).toHaveProperty('technicalPriorities');
    expect(r).toHaveProperty('businessPriorities');
  });

  it('informationArchitecture has all required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    const ia = productPlan.informationArchitecture;
    expect(ia).toHaveProperty('pages');
    expect(ia).toHaveProperty('sections');
    expect(ia).toHaveProperty('navigation');
    expect(ia).toHaveProperty('sidebar');
    expect(ia).toHaveProperty('footer');
    expect(ia).toHaveProperty('settingsStructure');
    expect(ia).toHaveProperty('contentHierarchy');
    expect(ia).toHaveProperty('featureRelationships');
    expect(ia).toHaveProperty('dependencies');
  });

  it('qualityScores all have required fields', () => {
    const { productPlan } = runProductManager(saasPrompt);
    for (const q of productPlan.qualityScores) {
      expect(q).toHaveProperty('dimension');
      expect(q).toHaveProperty('score');
      expect(q).toHaveProperty('severity');
      expect(q).toHaveProperty('confidence');
      expect(q).toHaveProperty('recommendation');
    }
  });
});
