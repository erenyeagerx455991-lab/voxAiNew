// ── V10.0 — Latency Optimizer ──────────────────────────────────────────────────
import type { SelfOptimizationContext, LatencyBlueprint } from './optimizationTypes.js';

export function optimizeLatency(ctx: SelfOptimizationContext): LatencyBlueprint {
  const baseMs = ctx.historicalBuildTimeMs ?? 90_000;

  // P50 / P95 estimates
  const p50EstimateMs = Math.round(baseMs * 0.85);
  const p95EstimateMs = Math.round(baseMs * 1.4);

  // Per-agent latency budgets (ms)
  const agentLatencyBudgets: Record<string, number> = {
    Planner:          ctx.complexity === 'simple' ? 8_000 : ctx.complexity === 'enterprise' ? 20_000 : 12_000,
    Architecture:     ctx.complexity === 'enterprise' ? 15_000 : 8_000,
    Frontend:         ctx.complexity === 'enterprise' ? 30_000 : 20_000,
    Backend:          12_000,
    Repair:           ctx.complexity === 'enterprise' ? 20_000 : 12_000,
    DesignEvaluator:  8_000,
    DesignCritic:     6_000,
    RuntimeValidation:4_000,
  };

  const targetLatencyMs = ctx.complexity === 'simple' ? 45_000 : ctx.complexity === 'enterprise' ? 180_000 : 90_000;

  // Score: how close are we to target?
  const ratio = baseMs / targetLatencyMs;
  let latencyScore: number;
  if (ratio <= 0.8) latencyScore = 10;
  else if (ratio <= 1.0) latencyScore = 8;
  else if (ratio <= 1.3) latencyScore = 6;
  else latencyScore = 4;

  const recommendations: string[] = [];
  if (ratio > 1.0) recommendations.push(`Reduce build time: target ${Math.round(targetLatencyMs / 1000)}s, estimated ${Math.round(p50EstimateMs / 1000)}s`);
  if ((ctx.agentLatencies?.['Frontend'] ?? 0) > 25_000) recommendations.push('Frontend agent over latency budget — reduce prompt size');

  return { p50EstimateMs, p95EstimateMs, agentLatencyBudgets, latencyScore, targetLatencyMs, recommendations };
}
