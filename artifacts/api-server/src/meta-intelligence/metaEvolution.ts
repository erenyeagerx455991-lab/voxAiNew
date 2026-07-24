// ── V10.1 — Meta Evolution ─────────────────────────────────────────────────────
// Identifies what the system should improve next and its maturity level.
// Never modifies anything. Only creates deterministic recommendations.
// Zero LLM calls.
import type { MetaContext, MetaEvolutionBlueprint } from './metaTypes.js';

type EvolutionPriority = MetaEvolutionBlueprint['evolutionPriority'];
type MaturityLevel     = MetaEvolutionBlueprint['maturityLevel'];

export function planEvolution(ctx: MetaContext): MetaEvolutionBlueprint {
  const scores = [
    ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
    ctx.adaptiveScore,  ctx.optimizationScore,
  ];
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const repairAttempts  = ctx.repairAttempts  ?? 0;
  const tokenEfficiency = ctx.tokenEfficiency  ?? 0.75;
  const parallelEff     = ctx.parallelEfficiency ?? 0.7;
  const successRate     = ctx.historicalSuccessRate ?? 0.9;

  // Identify next improvement targets
  const nextImprovementTargets: string[] = [];

  // Rank by gap to 10
  const engineGaps = ([
    ['ReasoningEngine',        10 - ctx.reasoningScore],
    ['PlanningIntelligence',   10 - ctx.planningScore],
    ['ExecutionIntelligence',  10 - ctx.executionScore],
    ['AdaptiveIntelligence',   10 - ctx.adaptiveScore],
    ['SelfOptimizationEngine', 10 - ctx.optimizationScore],
  ] as Array<[string, number]>).sort((a, b) => b[1] - a[1]);

  for (const [name, gap] of engineGaps) {
    if (gap > 2) nextImprovementTargets.push(`${name} (gap: ${gap.toFixed(1)}/10)`);
    if (nextImprovementTargets.length >= 3) break;
  }

  if (parallelEff < 0.6)    nextImprovementTargets.push('Parallel execution efficiency');
  if (tokenEfficiency < 0.7) nextImprovementTargets.push('Token efficiency and prompt compression');
  if (repairAttempts > 2)   nextImprovementTargets.push('Code generation quality — reduce repair dependency');
  if (successRate < 0.85)   nextImprovementTargets.push('Build reliability and failure recovery');

  // Evolution priority: find the weakest dimension
  const minScoreEngine = engineGaps[0]?.[0] ?? 'ReasoningEngine';
  let evolutionPriority: EvolutionPriority = 'balanced';

  const lowestScore = scores.reduce((a, b) => Math.min(a, b), 10);
  if (lowestScore < 5) {
    evolutionPriority = 'reliability';
  } else if (parallelEff < 0.5) {
    evolutionPriority = 'performance';
  } else if (tokenEfficiency < 0.5 || repairAttempts > 3) {
    evolutionPriority = 'cost';
  } else if ((ctx.qualityScore ?? 8) < 7) {
    evolutionPriority = 'quality';
  }
  void minScoreEngine; // used for clarity above

  // Maturity level: based on avg score and success rate
  let maturityLevel: MaturityLevel;
  if (avgScore >= 8.5 && successRate >= 0.92) {
    maturityLevel = 'advanced';
  } else if (avgScore >= 7.5 && successRate >= 0.85) {
    maturityLevel = 'mature';
  } else if (avgScore >= 6.0 && successRate >= 0.7) {
    maturityLevel = 'developing';
  } else {
    maturityLevel = 'bootstrap';
  }

  // Evolution score: higher avg score + success rate = better evolution position
  const evolutionScore = Math.min(10,
    Math.round((avgScore * 0.6 + successRate * 10 * 0.4) * 10) / 10
  );

  const recommendations: string[] = [];
  recommendations.push(`Current maturity: ${maturityLevel} — priority: ${evolutionPriority}`);
  if (nextImprovementTargets.length > 0)
    recommendations.push(`Top improvement target: ${nextImprovementTargets[0]}`);
  if (maturityLevel === 'advanced')
    recommendations.push('System is advanced — ready for V10.2 Autonomous Software Company layer');
  if (maturityLevel === 'bootstrap')
    recommendations.push('System in bootstrap phase — focus on stabilizing core engine scores first');

  return {
    nextImprovementTargets,
    evolutionPriority,
    evolutionScore,
    maturityLevel,
    recommendations,
  };
}
