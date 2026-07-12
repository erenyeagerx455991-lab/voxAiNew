// ── V9.0 Runtime Intelligence — Orchestration Engine ─────────────────────────
//
// Runs after all architects and BEFORE the Planner. Builds a RuntimeBlueprint
// that controls HOW the AI generation process executes. Static, deterministic,
// no LLM calls. Runtime failures must NEVER stop builds.
import type { RuntimeIntelligenceInput, RuntimeIntelligenceOutput, RuntimeBlueprint } from './runtimeTypes.js';
import { classifyGenerationMode }          from './generationModeClassifier.js';
import { planGenerationStrategy }          from './generationStrategyPlanner.js';
import { planCandidateStrategy }           from './candidateStrategyPlanner.js';
import { planRepairStrategy }              from './repairStrategyPlanner.js';
import { planEvaluationStrategy }          from './evaluationStrategyPlanner.js';
import { planOptimizationStrategy }        from './optimizationStrategyPlanner.js';
import { planCachingStrategy }             from './cachingStrategyPlanner.js';
import { planContextStrategy }             from './contextStrategyPlanner.js';
import { planParallelizationStrategy }     from './parallelizationStrategyPlanner.js';
import { planValidationStrategy }          from './validationStrategyPlanner.js';
import { planRenderingStrategy }           from './renderingStrategyPlanner.js';
import { planPromptStrategy }              from './promptStrategyPlanner.js';
import { planRetryStrategy }               from './retryStrategyPlanner.js';
import { planStreamingStrategy }           from './streamingStrategyPlanner.js';
import { planDeploymentStrategy }          from './deploymentStrategyPlanner.js';
import { planRiskStrategy }                from './riskStrategyPlanner.js';
import { planMemoryStrategy }              from './memoryStrategyPlanner.js';
import { predictPerformance }              from './performanceIntelligence.js';
import { planRetrievalIntelligence }       from './retrievalIntelligence.js';
import { buildRuntimeContext, buildContextString } from './runtimeContextBuilder.js';
import { validateRuntimeBlueprint }        from './runtimeValidator.js';
import { recordRuntimeBuild }              from './runtimeMetrics.js';

export function runRuntimeIntelligence(input: RuntimeIntelligenceInput): RuntimeIntelligenceOutput {
  const t0 = Date.now();

  // Phase 1: Classify generation mode from all project signals
  const mode = classifyGenerationMode(input);

  // Phase 2: Build all strategy blueprints (pure, deterministic)
  const generationStrategy      = planGenerationStrategy(mode, input);
  const candidateStrategy       = planCandidateStrategy(mode, input);
  const repairStrategy          = planRepairStrategy(mode, input);
  const evaluationStrategy      = planEvaluationStrategy(mode, input);
  const optimizationStrategy    = planOptimizationStrategy(mode, input);
  const cachingStrategy         = planCachingStrategy(mode, input);
  const contextStrategy         = planContextStrategy(mode, input);
  const parallelizationStrategy = planParallelizationStrategy(mode, input);
  const validationStrategy      = planValidationStrategy(mode, input);
  const renderingStrategy       = planRenderingStrategy(mode, input);
  const promptStrategy          = planPromptStrategy(mode, input);
  const retryStrategy           = planRetryStrategy(mode, input);
  const streamingStrategy       = planStreamingStrategy(mode, input);
  const deploymentStrategy      = planDeploymentStrategy(mode, input);
  const riskStrategy            = planRiskStrategy(mode, input);
  const memoryStrategy          = planMemoryStrategy(mode, input);

  // Phase 3: Performance prediction & retrieval intelligence
  const performancePrediction = predictPerformance(mode, input);
  const retrievalIntelligence = planRetrievalIntelligence(mode, input);

  // Assemble partial blueprint (without context/scores yet)
  const partialBlueprint = {
    mode,
    generationStrategy,
    candidateStrategy,
    repairStrategy,
    evaluationStrategy,
    optimizationStrategy,
    cachingStrategy,
    contextStrategy,
    parallelizationStrategy,
    validationStrategy,
    renderingStrategy,
    promptStrategy,
    retryStrategy,
    streamingStrategy,
    deploymentStrategy,
    riskStrategy,
    memoryStrategy,
    performancePrediction,
    retrievalIntelligence,
  };

  // Phase 4: Build immutable runtime context
  const runtimeContext = buildRuntimeContext(partialBlueprint, input);

  // Phase 5: Assemble full blueprint
  const blueprint: RuntimeBlueprint = {
    ...partialBlueprint,
    runtimeContext,
    qualityScores:   [],
    overallScore:    0,
    recommendations: [],
  };

  // Phase 6: Validate and score the blueprint
  const { qualityScores, overallScore, recommendations } =
    validateRuntimeBlueprint(blueprint);
  blueprint.qualityScores   = qualityScores;
  blueprint.overallScore    = overallScore;
  blueprint.recommendations = recommendations;

  recordRuntimeBuild(mode, qualityScores, overallScore, Date.now() - t0);

  // Phase 7: Build context string for Planner prompt injection
  const contextString = buildContextString(blueprint);

  return {
    blueprint,
    overallScore,
    processingTimeMs: Date.now() - t0,
    contextString,
  };
}
