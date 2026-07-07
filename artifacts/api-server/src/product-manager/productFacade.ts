// ── V8.4 Product Manager — Public Facade ──────────────────────────────────────

export { runProductManager } from './productManager.js';
export { detectProductGoal, buildPromptSummary, generateInformationArchitecture, buildRoadmap, detectProductRisks, scoreProductQuality, computeOverallProductScore, buildProductContext, QUALITY_WEIGHTS } from './productPlanner.js';
export { detectBusinessObjective, detectUserPersonas } from './businessPlanner.js';
export { planFeatures, isFeatureOverloaded } from './featurePlanner.js';
export { planUserJourney, planMonetization } from './journeyPlanner.js';
export { recordProductRun, getProductMetrics, resetProductMetrics } from './productMetrics.js';
export { learnFromProduct, getProductLearningTrend, getProductLearningHistory, resetProductLearning, hydrateProductLearning } from './productLearning.js';
export { initProductPersistence, saveProductSnapshot, loadProductSnapshot } from './productPersistence.js';
export type { ProductGoal, BusinessObjective, UserPersona, ProductFeature, ProductRisk, ProductQualityDimension, ProductQualityScore, InformationArchitecture, UserJourney, MonetizationPlan, ProductRoadmap, ProductPlan, ProductManagerOutput, ProductLearningRecord, ProductLearningInput } from './productTypes.js';
