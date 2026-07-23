// ── V10.0 — Repair Optimizer ───────────────────────────────────────────────────
import type { SelfOptimizationContext, RepairBlueprint } from './optimizationTypes.js';

export function optimizeRepair(ctx: SelfOptimizationContext): RepairBlueprint {
  const attempts = ctx.repairAttempts ?? 0;
  const successRate = ctx.historicalSuccessRate ?? 0.9;
  const quality = ctx.qualityScore ?? 7.5;

  // Threshold: higher quality targets need lower repair threshold
  const repairThreshold = ctx.complexity === 'enterprise' ? 8.0
    : ctx.complexity === 'simple' ? 6.5
    : 7.0;

  // Max passes: reduce if repair has been expensive
  const maxRepairPasses = attempts > 3 ? 1
    : ctx.complexity === 'enterprise' ? 3
    : ctx.complexity === 'simple' ? 1
    : 2;

  // Confidence: how confident are we repair will improve quality?
  const repairConfidence = successRate >= 0.9 ? 0.9
    : successRate >= 0.75 ? 0.75
    : 0.6;

  // Is repair necessary? Only if quality is below threshold
  const repairNecessary = quality < repairThreshold;

  // Score: fewer unexpected repairs = higher score
  const repairScore = attempts === 0 ? 9
    : attempts === 1 ? 8
    : attempts === 2 ? 7
    : attempts <= 4 ? 6
    : 4;

  const recommendations: string[] = [];
  if (attempts > 2) recommendations.push(`${attempts} repair attempts — raise quality threshold or improve initial generation`);
  if (!repairNecessary) recommendations.push('Quality above repair threshold — skip repair pass if possible');
  if (repairConfidence < 0.7) recommendations.push('Low repair confidence — check agent success rates');

  return { repairThreshold, maxRepairPasses, repairConfidence, repairNecessary, repairScore, recommendations };
}
