// ── V10.0 — Model Optimizer ────────────────────────────────────────────────────
import type { SelfOptimizationContext, ModelBlueprint } from './optimizationTypes.js';

export function optimizeModel(ctx: SelfOptimizationContext): ModelBlueprint {
  const adaptiveScore  = ctx.adaptiveScore ?? 7.5;
  const executionScore = ctx.executionScore ?? 7.5;
  const efficiency     = ctx.tokenEfficiency ?? 0.75;
  const cost           = ctx.expectedTotalCost ?? 0.05;

  let recommendedTier: ModelBlueprint['recommendedTier'];
  if (ctx.complexity === 'enterprise' || adaptiveScore >= 8.5) recommendedTier = 'premium';
  else if (ctx.complexity === 'simple' || efficiency < 0.5) recommendedTier = 'fast';
  else if (adaptiveScore >= 7.5 && executionScore >= 7.5) recommendedTier = 'quality';
  else recommendedTier = 'standard';

  // Weight allocation based on tier
  let qualityWeight: number, latencyWeight: number, costWeight: number;
  if (recommendedTier === 'premium')  { qualityWeight = 0.6; latencyWeight = 0.2; costWeight = 0.2; }
  else if (recommendedTier === 'fast') { qualityWeight = 0.2; latencyWeight = 0.5; costWeight = 0.3; }
  else if (recommendedTier === 'quality') { qualityWeight = 0.5; latencyWeight = 0.3; costWeight = 0.2; }
  else { qualityWeight = 0.4; latencyWeight = 0.3; costWeight = 0.3; }

  const modelSelectionRationale = recommendedTier === 'premium'
    ? `Enterprise complexity (${ctx.complexity}) + high adaptive score (${adaptiveScore.toFixed(1)}) → premium tier`
    : recommendedTier === 'fast'
    ? `Simple complexity or high cost pressure → fast tier`
    : recommendedTier === 'quality'
    ? `High upstream scores (adaptive=${adaptiveScore.toFixed(1)}, execution=${executionScore.toFixed(1)}) → quality tier`
    : `Standard complexity → balanced tier`;

  // Score: premium and quality score highly
  const modelScore = recommendedTier === 'premium' ? 9
    : recommendedTier === 'quality' ? 8.5
    : recommendedTier === 'standard' ? 7.5
    : 7;

  const recommendations: string[] = [];
  recommendations.push(`Use ${recommendedTier} model tier: ${modelSelectionRationale}`);
  if (cost > 0.1) recommendations.push('High cost detected — consider downgrading non-critical agents to fast tier');

  return { recommendedTier, modelSelectionRationale, qualityWeight, latencyWeight, costWeight, modelScore, recommendations };
}
