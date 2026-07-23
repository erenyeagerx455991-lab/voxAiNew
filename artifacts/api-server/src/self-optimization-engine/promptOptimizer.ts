// ── V10.0 — Prompt Optimizer ───────────────────────────────────────────────────
import type { SelfOptimizationContext, PromptBlueprint } from './optimizationTypes.js';

export function optimizePrompt(ctx: SelfOptimizationContext): PromptBlueprint {
  const compression = ctx.compressionRatio ?? 0.8;
  const efficiency = ctx.tokenEfficiency ?? 0.75;

  // Enable compression when efficiency is low
  const compressionEnabled = efficiency < 0.75 || compression > 0.85;
  const deduplicationEnabled = efficiency < 0.65;

  // How much can we compress?
  const compressionRatio = compressionEnabled ? Math.min(0.9, compression * 1.1) : compression;

  // Token savings from deduplication
  const budget = ctx.totalTokenBudget ?? 50_000;
  const estimatedSavingsTokens = deduplicationEnabled
    ? Math.round(budget * (1 - efficiency) * 0.4)
    : Math.round(budget * 0.05);

  const promptScore = efficiency >= 0.8 && !compressionEnabled ? 9
    : efficiency >= 0.65 ? 7.5
    : 6;

  const recommendations: string[] = [];
  if (compressionEnabled) recommendations.push('Enable prompt compression to reduce token spend');
  if (deduplicationEnabled) recommendations.push(`Deduplication could save ~${estimatedSavingsTokens} tokens`);
  if (efficiency < 0.5) recommendations.push('Critical: prompt efficiency very low — audit context injection');

  return { compressionEnabled, compressionRatio, deduplicationEnabled, estimatedSavingsTokens, promptScore, recommendations };
}
