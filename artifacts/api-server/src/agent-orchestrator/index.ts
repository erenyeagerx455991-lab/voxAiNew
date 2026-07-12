// ── V9.2 Adaptive Multi-Agent Orchestrator — Facade ──────────────────────────
export * from './types.js';
export { AGENT_REGISTRY, ALL_AGENT_NAMES, PASS_THROUGH_SKIPPABLE, getModelTier } from './agentRegistry.js';
export { buildDependencyGraph, flattenWaves } from './dependencyGraph.js';
export { planExecution, classifyComplexity } from './executionPlanner.js';
export { runSchedule } from './parallelScheduler.js';
export type { ScheduledTask, TaskResult, ScheduleRunResult } from './parallelScheduler.js';
export { withRetry } from './retryEngine.js';
export type { RetryOutcome } from './retryEngine.js';
export { allocateContext, getRequiredContextFields, buildContextDistribution, estimateContextSavings } from './contextAllocator.js';
export { allocateModel, buildModelAllocation, getAgentsByTier } from './modelAllocator.js';
export { predictExecutionCost, predictSkipSavings } from './costIntelligence.js';
export {
  recordAgentOutcome, getAgentHealth, getAllAgentHealth, resetAgentHealth,
} from './healthMonitor.js';
export {
  learnFromExecution, getOrchestratorLearningRecords, getOrchestratorLearningStats, resetOrchestratorLearning,
} from './orchestratorLearning.js';
export {
  persistExecutionSnapshot, getCurrentExecutionSnapshot, getExecutionSnapshotByVersion,
  getExecutionRollbackSnapshot, getOrchestratorPersistenceStats, resetOrchestratorPersistence,
} from './orchestratorPersistence.js';
export {
  recordOrchestratorExecution, getOrchestratorQualitySnapshot, resetOrchestratorMetrics,
} from './orchestratorMetrics.js';
