// ── V9.3 Model & Resource Orchestration Engine — Facade ──────────────────────
export * from './types.js';
export { PROVIDER_REGISTRY, ALL_PROVIDER_IDS, getProvider, getAvailableProviders, isProviderAvailable } from './providerRegistry.js';
export { resolveProvider, buildFallbackChain, routeAgent } from './modelRouter.js';
export type { RoutingDecision } from './modelRouter.js';
export { computeTokenBudget, getAgentTokenBudget } from './tokenBudgetEngine.js';
export type { TokenBudgetResult } from './tokenBudgetEngine.js';
export { compressContext, estimateCompressionSavings } from './contextCompressionEngine.js';
export type { CompressionInput, CompressionResult } from './contextCompressionEngine.js';
export { cacheSet, cacheGet, getCacheHitRate, getCacheSnapshot, predictCacheHitRate, resetCacheIntelligence } from './cacheIntelligence.js';
export type { CacheType } from './cacheIntelligence.js';
export {
  predictAgentCost, predictTotalCost, getProviderCostScore, estimateLatencyMs, estimateQuality,
} from './costIntelligence.js';
export type { AgentCostPrediction, CostPrediction } from './costIntelligence.js';
export {
  recordProviderOutcome, getProviderHealth, getAllProviderHealth, isProviderHealthy, resetModelHealthMonitor,
} from './modelHealthMonitor.js';
export {
  learnFromModelOrchestration, getModelOrchestratorLearningStats,
  getModelOrchestratorLearningRecords, resetModelOrchestratorLearning,
} from './modelOrchestratorLearning.js';
export {
  persistModelBlueprint, getCurrentModelBlueprint, getModelBlueprintByVersion,
  getModelBlueprintRollback, getModelOrchestratorPersistenceStats, resetModelOrchestratorPersistence,
} from './modelOrchestratorPersistence.js';
export {
  recordModelOrchestration, getModelOrchestrationSnapshot, resetModelOrchestratorMetrics,
} from './modelOrchestratorMetrics.js';
export { buildModelExecutionBlueprint, buildFallbackModelBlueprint } from './blueprintBuilder.js';
