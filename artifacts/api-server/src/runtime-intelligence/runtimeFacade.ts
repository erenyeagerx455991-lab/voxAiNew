// ── V9.0 Runtime Intelligence — Public API Facade ────────────────────────────
export type {
  GenerationMode,
  RuntimeDimension,
  CandidateCount,
  CandidateType,
  RepairPolicy,
  ValidationLevel,
  ContextDepth,
  PromptDepth,
  CompressionLevel,
  RenderingType,
  DeploymentType,
  BundleSizeTarget,
  RiskLevel,
  GenerationStrategy,
  CandidateStrategy,
  RepairStrategy,
  EvaluationStrategy,
  OptimizationStrategy,
  CachingStrategy,
  ContextStrategy,
  ParallelizationStrategy,
  ValidationStrategy,
  RenderingStrategy,
  PromptStrategy,
  RetryStrategy,
  StreamingStrategy,
  DeploymentStrategy,
  RiskStrategy,
  MemoryStrategy,
  PerformancePrediction,
  RetrievalIntelligence,
  RuntimeContext,
  RuntimeQualityScore,
  RuntimeBlueprint,
  RuntimeIntelligenceInput,
  RuntimeIntelligenceOutput,
  RuntimeSnapshot,
  RuntimeLearningInput,
  RuntimeLearningRecord,
  RuntimeIntelligenceMetricsSnapshot,
} from './runtimeTypes.js';

export { ALL_RUNTIME_DIMENSIONS } from './runtimeTypes.js';

// Classifier
export { classifyGenerationMode, getModeRationale } from './generationModeClassifier.js';

// Strategy planners
export { planGenerationStrategy }          from './generationStrategyPlanner.js';
export { planCandidateStrategy }           from './candidateStrategyPlanner.js';
export { planRepairStrategy }              from './repairStrategyPlanner.js';
export { planEvaluationStrategy }          from './evaluationStrategyPlanner.js';
export { planOptimizationStrategy }        from './optimizationStrategyPlanner.js';
export { planCachingStrategy }             from './cachingStrategyPlanner.js';
export { planContextStrategy }             from './contextStrategyPlanner.js';
export { planParallelizationStrategy }     from './parallelizationStrategyPlanner.js';
export { planValidationStrategy }          from './validationStrategyPlanner.js';
export { planRenderingStrategy }           from './renderingStrategyPlanner.js';
export { planPromptStrategy }              from './promptStrategyPlanner.js';
export { planRetryStrategy }               from './retryStrategyPlanner.js';
export { planStreamingStrategy }           from './streamingStrategyPlanner.js';
export { planDeploymentStrategy }          from './deploymentStrategyPlanner.js';
export { planRiskStrategy }                from './riskStrategyPlanner.js';
export { planMemoryStrategy }              from './memoryStrategyPlanner.js';

// Intelligence modules
export { predictPerformance }              from './performanceIntelligence.js';
export { planRetrievalIntelligence }       from './retrievalIntelligence.js';

// Context builder
export { buildRuntimeContext, buildContextString } from './runtimeContextBuilder.js';

// Validator
export { validateRuntimeBlueprint }        from './runtimeValidator.js';

// Metrics
export {
  recordRuntimeBuild,
  recordRuntimeLearning,
  getRuntimeMetrics,
  resetRuntimeMetrics,
} from './runtimeMetrics.js';

// Learning
export {
  learnFromRuntimeBuild,
  getRuntimeLearningRecords,
  getRuntimeLearningStats,
  resetRuntimeLearning,
} from './runtimeLearning.js';

// Persistence
export {
  initRuntimeIntelligencePersistence,
  persistRuntimeSnapshot,
  getCurrentRuntimeSnapshot,
  getRuntimeSnapshotByVersion,
  getRollbackSnapshot,
  getRuntimePersistenceStats,
  resetRuntimePersistence,
} from './runtimePersistence.js';
export type { RuntimeSnapshot as RuntimeSnapshotRecord } from './runtimePersistence.js';

// Orchestrator
export { runRuntimeIntelligence } from './runtimeArchitect.js';
