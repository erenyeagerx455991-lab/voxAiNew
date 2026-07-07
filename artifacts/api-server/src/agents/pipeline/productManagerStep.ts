// ── V8.4 Autonomous AI Product Manager — Pipeline Step ────────────────────────
// Sits at step 0, before the Planner. Pure static analysis — no LLM.
// Emits SSE: product_manager_start / product_manager_progress /
//            product_manager_complete / product_manager_learning.

import type { Response } from 'express';
import { sse } from '../streaming/sseManager.js';
import { runProductManager } from '../../product-manager/productManager.js';
import { learnFromProduct } from '../../product-manager/productLearning.js';
import { recordProductRun } from '../../product-manager/productMetrics.js';
import type { ProductManagerOutput } from '../../product-manager/productTypes.js';
import { createLogger } from '../../lib/structuredLogger.js';

const log = createLogger('ProductManagerStep');

export { type ProductManagerOutput };

export async function runProductManagerStep(
  prompt: string,
  buildId: string,
  res:     Response,
): Promise<ProductManagerOutput> {

  sse(res, { type: 'product_manager_start', agent: 'Product Manager' });

  log.info('PRODUCT_MANAGER_START', { buildId, promptLength: prompt.length });

  let output: ProductManagerOutput;
  try {
    output = runProductManager(prompt);
  } catch (err) {
    // Product Manager failure must NEVER break the pipeline
    log.warn('PRODUCT_MANAGER_FAILED_FALLBACK', { buildId, error: String(err) });
    const fallback = buildFallbackOutput(prompt);
    return fallback;
  }

  const { productPlan, productScore } = output;

  log.info('PRODUCT_MANAGER_COMPLETE', {
    buildId,
    productGoal:       productPlan.productGoal,
    businessObjective: productPlan.businessObjective,
    personaCount:      productPlan.userPersonas.length,
    featureCount:      productPlan.plannedFeatures.length,
    riskCount:         productPlan.detectedRisks.length,
    overallScore:      productScore,
    confidence:        productPlan.confidence,
  });

  // ── SSE: product_manager_progress ───────────────────────────────────────────
  sse(res, {
    type:              'product_manager_progress',
    productGoal:       productPlan.productGoal,
    businessObjective: productPlan.businessObjective,
    personas:          productPlan.userPersonas.slice(0, 3),
    features:          productPlan.plannedFeatures.slice(0, 6),
    risks:             productPlan.detectedRisks.slice(0, 4),
    confidence:        productPlan.confidence,
  });

  // ── SSE: product_manager_complete ────────────────────────────────────────────
  sse(res, {
    type:              'product_manager_complete',
    productGoal:       productPlan.productGoal,
    businessObjective: productPlan.businessObjective,
    overallScore:      productScore,
    featureCount:      productPlan.plannedFeatures.length,
    riskCount:         productPlan.detectedRisks.length,
    monetizationStrategy: productPlan.monetizationPlan.strategy,
    topRecommendations: productPlan.qualityScores
      .filter(q => q.score < 7)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(q => q.recommendation),
  });

  // ── Telemetry (non-blocking) ────────────────────────────────────────────────
  try {
    recordProductRun({
      buildId,
      productGoal:       productPlan.productGoal,
      businessObjective: productPlan.businessObjective,
      overallScore:      productScore,
      featureCount:      productPlan.plannedFeatures.length,
      riskCount:         productPlan.detectedRisks.length,
      personaCount:      productPlan.userPersonas.length,
      confidence:        productPlan.confidence,
      personas:          productPlan.userPersonas,
      features:          productPlan.plannedFeatures.map(String),
    });
  } catch { /* telemetry must never throw */ }

  // ── Fire-and-forget learning ────────────────────────────────────────────────
  setImmediate(() => {
    try {
      learnFromProduct({ buildId, productPlan });

      sse(res, {
        type:         'product_manager_learning',
        buildId,
        productGoal:  productPlan.productGoal,
        overallScore: productScore,
        improved:     productScore >= 7.0 && productPlan.detectedRisks.length < 3,
      });
    } catch { /* learning must never throw into pipeline */ }
  });

  return output;
}

// ── Fallback (no-op plan) ─────────────────────────────────────────────────────

function buildFallbackOutput(prompt: string): ProductManagerOutput {
  return {
    productPlan: {
      productGoal:             'LandingPage',
      productGoalConfidence:   0.3,
      businessObjective:       'LeadGeneration',
      userPersonas:            ['Founder'],
      plannedFeatures:         [],
      informationArchitecture: {
        pages: ['Home'], sections: ['Navbar', 'Hero', 'CTA', 'Footer'],
        navigation: ['Home'], sidebar: [], footer: ['Privacy', 'Terms'],
        settingsStructure: [], contentHierarchy: ['Hero → CTA'],
        featureRelationships: [], dependencies: [],
      },
      userJourney: {
        entryPoint:   'Homepage',
        primaryFlow:  ['Visit', 'Read', 'Act'],
        secondaryFlow:[], onboarding: [], activation: [], conversion: [],
        retention: [], upgradeFlow: [], supportFlow: [], exitFlow: [],
      },
      monetizationPlan: {
        strategy: 'None', freePlan: [], proPlan: [], enterprisePlan: [],
        pricingTable: false, upgradePoints: [], featureGates: [],
        usageLimits: [], trialFlow: false,
      },
      roadmap: {
        mvp: [], phase2: [], phase3: [], futureFeatures: [],
        niceToHave: [], technicalPriorities: [], businessPriorities: [],
      },
      detectedRisks:       [],
      qualityScores:       [],
      overallProductScore: 7.0,
      confidence:          0,
      promptSummary:       prompt.slice(0, 80),
    },
    productScore:  7.0,
    contextString: '',
  };
}
