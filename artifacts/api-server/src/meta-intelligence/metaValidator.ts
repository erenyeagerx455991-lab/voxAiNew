// ── V10.1 — Meta Validator ─────────────────────────────────────────────────────
// Validates 12 dimensions and computes an overall meta score (0-10).
// Zero LLM calls. Deterministic weighted formula only.
import type {
  MetaAnalysisBlueprint,
  MetaEvaluatorBlueprint,
  MetaHealthBlueprint,
  MetaDiagnosticsBlueprint,
  MetaPredictionBlueprint,
  MetaValidation,
} from './metaTypes.js';

// Weights must sum to 1.00
const WEIGHTS = {
  architecture:    0.10,
  performance:     0.10,
  learning:        0.08,
  optimization:    0.10,
  reasoning:       0.10,
  planning:        0.10,
  execution:       0.10,
  workflow:        0.08,
  knowledge:       0.08,
  confidence:      0.08,
  maintainability: 0.06,
  reliability:     0.02,
} as const;

// Verify weights sum to 1 at compile time (runtime sanity check)
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(`[metaValidator] WEIGHTS must sum to 1.00, got ${WEIGHT_SUM}`);
}

export function validateMeta(
  analysis:    MetaAnalysisBlueprint,
  evaluator:   MetaEvaluatorBlueprint,
  health:      MetaHealthBlueprint,
  diagnostics: MetaDiagnosticsBlueprint,
  prediction:  MetaPredictionBlueprint,
  reasoningScore: number,
  planningScore:  number,
  executionScore: number,
  workflowScore:  number,
  knowledgeScore: number,
): MetaValidation {
  const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 10) / 10));

  const architectureScore   = clamp(analysis.analysisScore);
  const performanceScore    = clamp(health.pipelineHealth);
  const learningScore       = clamp(health.learningHealth);
  const optimizationScore   = clamp(evaluator.evaluatorScore);
  const reasoningScoreDim   = clamp(reasoningScore);
  const planningScoreDim    = clamp(planningScore);
  const executionScoreDim   = clamp(executionScore);
  const workflowScoreDim    = clamp(workflowScore);
  const knowledgeScoreDim   = clamp(knowledgeScore);
  const confidenceScore     = clamp(prediction.predictionConfidence * 10);
  const maintainabilityScore = clamp(diagnostics.diagnosticScore);
  const reliabilityScore    = clamp(health.agentHealth);

  const overallMetaScore = clamp(
    architectureScore   * WEIGHTS.architecture   +
    performanceScore    * WEIGHTS.performance    +
    learningScore       * WEIGHTS.learning       +
    optimizationScore   * WEIGHTS.optimization   +
    reasoningScoreDim   * WEIGHTS.reasoning      +
    planningScoreDim    * WEIGHTS.planning       +
    executionScoreDim   * WEIGHTS.execution      +
    workflowScoreDim    * WEIGHTS.workflow       +
    knowledgeScoreDim   * WEIGHTS.knowledge      +
    confidenceScore     * WEIGHTS.confidence     +
    maintainabilityScore * WEIGHTS.maintainability +
    reliabilityScore    * WEIGHTS.reliability
  );

  const valid = overallMetaScore >= 5 && health.healthStatus !== 'critical';

  const warnings: string[] = [];
  if (architectureScore < 6)    warnings.push('Architecture health below threshold');
  if (performanceScore < 6)     warnings.push('Pipeline performance degraded');
  if (diagnostics.issueCount > 5) warnings.push(`${diagnostics.issueCount} diagnostic issues detected`);
  if (health.healthStatus === 'critical') warnings.push('System health critical — immediate attention required');
  if (health.healthStatus === 'degraded') warnings.push('System health degraded — monitor closely');

  return {
    architectureScore,
    performanceScore,
    learningScore,
    optimizationScore,
    reasoningScore:       reasoningScoreDim,
    planningScore:        planningScoreDim,
    executionScore:       executionScoreDim,
    workflowScore:        workflowScoreDim,
    knowledgeScore:       knowledgeScoreDim,
    confidenceScore,
    maintainabilityScore,
    reliabilityScore,
    overallMetaScore,
    valid,
    warnings,
  };
}
