// ── V9.7 Planning Intelligence — Phase 9: Estimation Planning ─────────────────
import type { RequirementBlueprint, EstimationBlueprint } from './planningTypes.js';

export function estimatePlan(
  req: RequirementBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
  expectedTotalCost?: number,
): EstimationBlueprint {
  const mult = complexity === 'enterprise' ? 1.8 : complexity === 'simple' ? 0.6 : 1;

  // ── Development time ──────────────────────────────────────────────────────
  const baseDays = complexity === 'simple' ? 7 : complexity === 'enterprise' ? 30 : 14;
  const featureMultiplier = 1 + req.detectedFeatures.filter(f => f.detected).length * 0.1;
  const developmentDays = Math.round(baseDays * featureMultiplier * mult);

  // ── Token estimates ───────────────────────────────────────────────────────
  const baseTokens = complexity === 'simple' ? 15000 : complexity === 'enterprise' ? 60000 : 35000;
  const tokenFeatureBonus = req.detectedFeatures.filter(f => f.detected).length * 2000;
  const llmTokens = baseTokens + tokenFeatureBonus;

  // ── File / component counts ───────────────────────────────────────────────
  const baseFiles = complexity === 'simple' ? 10 : complexity === 'enterprise' ? 50 : 25;
  const filesCount = Math.round(baseFiles + req.pages.length * 1.5 + req.components.length * 0.5);
  const componentsCount = Math.round(req.components.length + req.pages.length * 2);
  const apisCount = req.apis.length;
  const dbTablesCount = req.database.length;

  // ── Infrastructure ────────────────────────────────────────────────────────
  const infrastructure = ['web-server', 'postgresql'];
  if (req.authentication)         infrastructure.push('session-store');
  if (req.payments)               infrastructure.push('stripe-integration');
  if (complexity === 'enterprise') infrastructure.push('redis-cache', 'cdn', 'load-balancer');
  if (req.notifications)          infrastructure.push('email-service');
  if (req.components.includes('file-upload')) infrastructure.push('object-storage');

  // ── Cost ─────────────────────────────────────────────────────────────────
  const llmCost = llmTokens * 0.0000008;
  const infraCost = complexity === 'enterprise' ? 0.004 : complexity === 'simple' ? 0.001 : 0.002;
  const totalCost = llmCost + infraCost;

  // Confidence: how close is our estimate to the expected cost
  let confidence = 0.8;
  if (expectedTotalCost !== undefined && expectedTotalCost > 0) {
    const ratio = Math.abs(totalCost - expectedTotalCost) / expectedTotalCost;
    confidence = Math.max(0.3, Math.min(1, 1 - ratio));
  }

  return {
    developmentDays, llmTokens, filesCount, componentsCount,
    apisCount, dbTablesCount, infrastructure, overallCost: totalCost,
    costBreakdown: { llmCost, infraCost, totalCost }, confidence,
  };
}
