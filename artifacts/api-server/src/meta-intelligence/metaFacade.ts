// ── V10.1 — Autonomous Meta Intelligence Engine — Main Entry Point ─────────────
// Runs all sub-modules, validates, persists, and returns a MetaBlueprint.
// Zero LLM calls. Fully deterministic. Never throws into the pipeline.
import type { MetaContext, MetaBlueprint, MetaLearningRecord } from './metaTypes.js';
import { analyzeSystem }           from './metaAnalyzer.js';
import { planMetaRecommendations } from './metaPlanner.js';
import { evaluateEngines }         from './metaEvaluator.js';
import { scoreModules }            from './metaScoring.js';
import { predictOutcomes }         from './metaPrediction.js';
import { generateRecommendations } from './metaRecommendations.js';
import { planEvolution }           from './metaEvolution.js';
import { computeHealth }           from './metaHealth.js';
import { runDiagnostics }          from './metaDiagnostics.js';
import { validateMeta }            from './metaValidator.js';
import { saveMetaSnapshot, getCurrentMetaSnapshot, getMetaPersistenceStats, rollbackToMetaSnapshot, resetMetaPersistence } from './metaPersistence.js';
import { learnFromMeta, getMetaLearningStats, resetMetaLearning } from './metaLearning.js';
import { recordMetaMetric, getMetaMetricsSnapshot, resetMetaMetrics } from './metaMetrics.js';

// ── Context string builder ──────────────────────────────────────────────────────
function buildContextString(bp: Omit<MetaBlueprint, 'contextString'>): string {
  const { validation: v, evolution, health, diagnostics, recommendations } = bp;
  const topTarget = evolution.nextImprovementTargets[0] ?? 'none';
  const urgent    = recommendations.immediate.length;
  return [
    '\n\n## V10.1 Meta Intelligence Engine',
    `Meta Score: ${v.overallMetaScore}/10 | Health: ${health.healthStatus} | Maturity: ${evolution.maturityLevel}`,
    `Architecture: ${v.architectureScore}/10 | Performance: ${v.performanceScore}/10 | Optimization: ${v.optimizationScore}/10`,
    `Reasoning: ${v.reasoningScore}/10 | Planning: ${v.planningScore}/10 | Execution: ${v.executionScore}/10`,
    `Issues: ${diagnostics.issueCount} | Urgent recommendations: ${urgent} | Priority: ${evolution.evolutionPriority}`,
    `Next improvement: ${topTarget}`,
  ].join('\n');
}

// ── Main builder ────────────────────────────────────────────────────────────────
export function buildMetaBlueprint(ctx: MetaContext): MetaBlueprint {
  const analysis        = analyzeSystem(ctx);
  const planner         = planMetaRecommendations(ctx);
  const evaluator       = evaluateEngines(ctx);
  const scoring         = scoreModules(ctx);
  const prediction      = predictOutcomes(ctx);
  const recommendations = generateRecommendations(ctx);
  const evolution       = planEvolution(ctx);
  const health          = computeHealth(ctx);
  const diagnostics     = runDiagnostics(ctx);

  const validation = validateMeta(
    analysis, evaluator, health, diagnostics, prediction,
    ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
    ctx.workflowScore ?? 7, ctx.knowledgeScore ?? 7,
  );

  const base: Omit<MetaBlueprint, 'contextString'> = {
    buildId:         ctx.buildId,
    analysis, planner, evaluator, scoring, prediction,
    recommendations, evolution, health, diagnostics,
    validation,
    overallMetaScore: validation.overallMetaScore,
    recordedAt:      Date.now(),
    version:         0,
  };

  return { ...base, contextString: buildContextString(base) };
}

export function buildFallbackMetaBlueprint(buildId: string): MetaBlueprint {
  return buildMetaBlueprint({
    buildId,
    prompt:            '',
    complexity:        'standard',
    reasoningScore:    7,
    planningScore:     7,
    executionScore:    7,
    adaptiveScore:     7,
    optimizationScore: 7,
    tokenEfficiency:   0.75,
    historicalSuccessRate: 0.9,
  });
}

// ── Façade API ──────────────────────────────────────────────────────────────────
export interface MetaFacadeResult {
  blueprint:     MetaBlueprint;
  contextString: string;
}

export function runMetaIntelligenceEngine(ctx: MetaContext): MetaFacadeResult {
  const startedAt = Date.now();
  let blueprint: MetaBlueprint;

  try {
    blueprint = buildMetaBlueprint(ctx);
  } catch {
    blueprint = buildFallbackMetaBlueprint(ctx.buildId);
  }

  const snap = saveMetaSnapshot(ctx.buildId, blueprint);
  blueprint  = snap.blueprint;

  const adaptationTimeMs = Date.now() - startedAt;
  recordMetaMetric({
    overallMetaScore:    blueprint.overallMetaScore,
    architectureScore:   blueprint.validation.architectureScore,
    performanceScore:    blueprint.validation.performanceScore,
    learningScore:       blueprint.validation.learningScore,
    optimizationScore:   blueprint.validation.optimizationScore,
    healthScore:         blueprint.health.overallHealth,
    confidenceScore:     blueprint.validation.confidenceScore,
    diagnosticScore:     blueprint.diagnostics.diagnosticScore,
    recommendationCount: blueprint.recommendations.totalCount,
    adaptationTimeMs,
    complexity:          ctx.complexity,
    recordedAt:          Date.now(),
  });

  return { blueprint, contextString: blueprint.contextString };
}

export function learnFromMetaResult(
  buildId:            string,
  blueprint:          MetaBlueprint,
  buildSucceeded:     boolean,
  buildTimeMs:        number,
  actualQualityScore: number,
): void {
  const record: MetaLearningRecord = {
    buildId,
    overallMetaScore:  blueprint.overallMetaScore,
    buildSucceeded,
    buildTimeMs,
    predictedQuality:  blueprint.prediction.predictedQualityScore,
    actualQuality:     actualQualityScore,
    complexity:        blueprint.evolution.evolutionPriority === 'balanced'
                         ? (blueprint.health.healthStatus === 'optimal' ? 'enterprise' : 'standard')
                         : 'standard',
    healthStatus:      blueprint.health.healthStatus,
    issueCount:        blueprint.diagnostics.issueCount,
    recordedAt:        Date.now(),
  };
  learnFromMeta(record).catch(() => { /* fire-and-forget */ });
}

export function persistMetaSnapshot(buildId: string, blueprint: MetaBlueprint) {
  return saveMetaSnapshot(buildId, blueprint);
}

export { getMetaMetricsSnapshot as getMetaMetrics };
export { getMetaLearningStats   as getMetaStats };
export { getCurrentMetaSnapshot, getMetaPersistenceStats };
export { rollbackToMetaSnapshot as rollbackMeta };

export function resetMetaEngine(): void {
  resetMetaPersistence();
  resetMetaLearning();
  resetMetaMetrics();
}
