// ── V9.0 Runtime Intelligence — Runtime Context Builder ──────────────────────
//
// Merges all individual strategy outputs into one immutable RuntimeContext.
// The context is injected into the Planner prompt via contextString.
import type {
  RuntimeBlueprint,
  RuntimeContext,
  RuntimeIntelligenceInput,
} from './runtimeTypes.js';

export function buildRuntimeContext(
  blueprint: Omit<RuntimeBlueprint, 'runtimeContext' | 'qualityScores' | 'overallScore' | 'recommendations'>,
  input: RuntimeIntelligenceInput,
): RuntimeContext {
  const { generationStrategy, candidateStrategy, promptStrategy,
          optimizationStrategy, retrievalIntelligence, evaluationStrategy,
          validationStrategy, memoryStrategy, riskStrategy } = blueprint;

  return Object.freeze({
    generationContext: {
      mode:          generationStrategy.mode,
      candidateCount:candidateStrategy.count,
      isParallel:    generationStrategy.isParallel,
    },
    promptContext: {
      depth:           promptStrategy.depth,
      maxTokens:       promptStrategy.maxSystemTokens,
      includeExamples: promptStrategy.includeExamples,
    },
    architectureContext: {
      backendType:  input.backendType,
      infraType:    input.infraType,
      serviceCount: input.serviceCount,
    },
    memoryContext: {
      maxRecords:          memoryStrategy.maxContextRecords,
      compressionEnabled:  memoryStrategy.compressionEnabled,
    },
    retrievalContext: {
      ragCount:    retrievalIntelligence.ragQueriesCount,
      libraries:   retrievalIntelligence.libraries,
      maxTokens:   retrievalIntelligence.maxContextTokens,
    },
    designContext: {
      evaluationPriority: evaluationStrategy.priorityDimension,
      dynamicWeights:     evaluationStrategy.weights,
    },
    backendContext: {
      backendType: input.backendType,
      score:       input.backendScore,
      hasAuth:     input.hasAuth,
    },
    securityContext: {
      score:         input.securityScore,
      hasCompliance: input.hasCompliance,
      riskLevel:     riskStrategy.level,
    },
    qaContext: {
      score:           input.qaScore,
      validationLevel: validationStrategy.level,
    },
    optimizationContext: {
      performanceOverAnimation: optimizationStrategy.performanceOverAnimation,
      seoOverMotion:            optimizationStrategy.seoOverMotion,
      accessibilityPriority:    optimizationStrategy.accessibilityPriority,
    },
  }) as RuntimeContext;
}

/** Serializes the RuntimeContext into a prompt-injectable string. */
export function buildContextString(blueprint: RuntimeBlueprint): string {
  const { mode, candidateStrategy, repairStrategy, evaluationStrategy,
          promptStrategy, retrievalIntelligence, performancePrediction } = blueprint;

  const weightSummary = Object.entries(evaluationStrategy.weights)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`)
    .join(', ');

  return `\n\n[RUNTIME INTELLIGENCE V9.0]
Mode: ${mode}
Candidates: ${candidateStrategy.count} (${candidateStrategy.type})
Repair: ${repairStrategy.policy} (max ${repairStrategy.maxPasses} passes, threshold ${repairStrategy.threshold})
Prompt depth: ${promptStrategy.depth} | Max system tokens: ${promptStrategy.maxSystemTokens}
Evaluation weights: ${weightSummary}
Priority dimension: ${evaluationStrategy.priorityDimension}
RAG libraries: ${retrievalIntelligence.libraries.join(', ')} (${retrievalIntelligence.ragQueriesCount} queries)
Est. build time: ${(performancePrediction.estimatedBuildTimeMs / 1000).toFixed(0)}s | Est. tokens: ${performancePrediction.estimatedTokenUsage.toLocaleString()}
[/RUNTIME INTELLIGENCE]`;
}
