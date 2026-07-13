// ── V9.5 Decision Explanation Engine ──────────────────────────────────────────
import type {
  ConflictResolution, DecisionExplanation, DecisionMatrixResult, ReasoningPath,
} from './types.js';

export function buildExplanation(
  buildId: string,
  chosen: ReasoningPath,
  allPaths: ReasoningPath[],
  decision: DecisionMatrixResult,
  conflicts: ConflictResolution[],
): DecisionExplanation {
  const rejected = allPaths.filter(p => p.id !== chosen.id);
  const whyAlternativesRejected: Record<string, string> = {};
  for (const p of rejected) {
    whyAlternativesRejected[p.id] = `${p.name} scored ${p.overallScore.toFixed(1)} vs the chosen path's ${chosen.overallScore.toFixed(1)} on the current constraints.`;
  }

  const expectedRisks: string[] = [];
  if (decision.factors.risk < 6) expectedRisks.push('Elevated ambiguity increases the chance of misaligned output.');
  if (chosen.id === 'C') expectedRisks.push('Speed-optimized path trades away some polish and depth.');
  if (chosen.id === 'A') expectedRisks.push('Highest-quality path consumes more tokens/time than a balanced build.');
  if (expectedRisks.length === 0) expectedRisks.push('No elevated risk factors detected.');

  const expectedBenefits = [
    `${chosen.name} path optimizes for the dominant constraint signal in this build.`,
    `Composite decision score of ${decision.compositeScore.toFixed(1)}/10 across 10 weighted factors.`,
  ];

  const expectedTradeoffs = rejected.map(p => `Gave up ${p.name.toLowerCase()} characteristics (score ${p.overallScore.toFixed(1)}).`);

  return {
    decisionId: `${buildId}:decision`,
    chosenPath: chosen.id,
    whyChosen: `${chosen.name} path selected — best fit for the detected constraints and trade-off profile (composite score ${decision.compositeScore.toFixed(1)}/10).`,
    whyAlternativesRejected,
    expectedImpact: `Build proceeds under the "${chosen.name}" strategy across Product, Architecture, and Generation stages.`,
    expectedRisks,
    expectedBenefits,
    expectedTradeoffs,
    futureImplications: 'Decision outcome will be recorded and used to refine future path selection for similar prompts.',
  };
}
