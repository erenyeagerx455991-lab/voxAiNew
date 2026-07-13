// ── V9.5 Confidence Engine ────────────────────────────────────────────────────
import type { AmbiguityReport, ConfidenceBundle, DecisionMatrixResult, ReasoningPath } from './types.js';

export function computeConfidence(
  decision: DecisionMatrixResult,
  ambiguity: AmbiguityReport,
  paths: ReasoningPath[],
): ConfidenceBundle {
  const riskScore = ambiguity.ambiguityScore;
  const complexityScore = Math.max(0, 10 - decision.factors.complexity);
  const reasoningScore = Math.max(0, 10 - ambiguity.ambiguityScore * 0.6);

  // Decision stability: how far apart the top path is from the runner-up (bigger gap = more stable).
  const sorted = [...paths].sort((a, b) => b.overallScore - a.overallScore);
  const gap = sorted.length > 1 ? sorted[0].overallScore - sorted[1].overallScore : 5;
  const decisionStability = Math.max(0, Math.min(10, 5 + gap));

  const alternativeAvailability = Math.min(10, paths.length * 3.3);

  const confidenceScore = Math.max(0, Math.min(10,
    decision.compositeScore * 0.5 + reasoningScore * 0.3 + decisionStability * 0.2 - riskScore * 0.1,
  ));

  return {
    confidenceScore: Number(confidenceScore.toFixed(2)),
    reasoningScore: Number(reasoningScore.toFixed(2)),
    riskScore: Number(riskScore.toFixed(2)),
    complexityScore: Number(complexityScore.toFixed(2)),
    decisionStability: Number(decisionStability.toFixed(2)),
    alternativeAvailability: Number(alternativeAvailability.toFixed(2)),
  };
}
