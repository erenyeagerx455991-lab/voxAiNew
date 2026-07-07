// ── V8.4 Autonomous AI Product Manager — Core Engine ─────────────────────────
// Runs all 9 planning phases. Pure static analysis. No LLM. Fast & deterministic.

import type { ProductPlan, ProductManagerOutput } from './productTypes.js';
import { detectProductGoal, buildPromptSummary, generateInformationArchitecture, buildRoadmap, detectProductRisks, scoreProductQuality, computeOverallProductScore, buildProductContext } from './productPlanner.js';
import { detectBusinessObjective, detectUserPersonas } from './businessPlanner.js';
import { planFeatures } from './featurePlanner.js';
import { planUserJourney, planMonetization } from './journeyPlanner.js';

export function runProductManager(prompt: string): ProductManagerOutput {
  // Phase 2: Product Goal Detection
  const { goal: productGoal, confidence: goalConfidence } = detectProductGoal(prompt);

  // Phase 3: Business Objective Detection
  const businessObjective = detectBusinessObjective(prompt, productGoal);

  // Phase 4: User Persona Detection
  const userPersonas = detectUserPersonas(prompt, productGoal);

  // Phase 5: Feature Planning
  const plannedFeatures = planFeatures(productGoal, businessObjective, userPersonas, prompt);

  // Phase 6: Information Architecture
  const informationArchitecture = generateInformationArchitecture(productGoal, plannedFeatures, businessObjective);

  // Phase 7: User Journey Planning
  const userJourney = planUserJourney(productGoal, plannedFeatures, businessObjective);

  // Phase 8: Monetization Intelligence
  const monetizationPlan = planMonetization(productGoal, businessObjective, plannedFeatures);

  // Phase 9: Product Roadmap
  const roadmap = buildRoadmap(productGoal, plannedFeatures, businessObjective);

  // Phase 10: Risk Detection
  const riskStrings = detectProductRisks(productGoal, plannedFeatures, businessObjective, prompt);
  const detectedRisks = riskStrings as ProductPlan['detectedRisks'];

  // Phase 11: Product Quality Score
  const qualityScores = scoreProductQuality({
    goal: productGoal,
    objective: businessObjective,
    features: plannedFeatures,
    personas: userPersonas,
    risks: riskStrings,
    prompt,
  });

  const overallProductScore = computeOverallProductScore(qualityScores);

  const promptSummary = buildPromptSummary(prompt, productGoal, businessObjective);

  const productPlan: ProductPlan = {
    productGoal,
    productGoalConfidence: goalConfidence,
    businessObjective,
    userPersonas,
    plannedFeatures,
    informationArchitecture,
    userJourney,
    monetizationPlan,
    roadmap,
    detectedRisks,
    qualityScores,
    overallProductScore,
    confidence: goalConfidence,
    promptSummary,
  };

  const contextString = buildProductContext(productPlan);

  return {
    productPlan,
    productScore: overallProductScore,
    contextString,
  };
}
