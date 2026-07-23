// ── V10.0 — Timeout Optimizer ──────────────────────────────────────────────────
import type { SelfOptimizationContext, TimeoutBlueprint } from './optimizationTypes.js';

export function optimizeTimeouts(ctx: SelfOptimizationContext): TimeoutBlueprint {
  const globalTimeoutMs = ctx.complexity === 'enterprise' ? 300_000
    : ctx.complexity === 'simple' ? 60_000
    : 120_000;

  // Per-agent timeouts based on complexity
  const mult = ctx.complexity === 'enterprise' ? 2 : ctx.complexity === 'simple' ? 0.5 : 1;
  const agentTimeouts: Record<string, number> = {
    Planner:              Math.round(15_000 * mult),
    Architecture:         Math.round(10_000 * mult),
    Frontend:             Math.round(40_000 * mult),
    Backend:              Math.round(20_000 * mult),
    Repair:               Math.round(20_000 * mult),
    DesignEvaluator:      Math.round(10_000 * mult),
    DesignCritic:         Math.round(8_000 * mult),
    RuntimeValidation:    Math.round(5_000 * mult),
    KnowledgeEngine:      Math.round(3_000),
    ReasoningEngine:      Math.round(3_000),
    ExecutionIntelligence:Math.round(3_000),
    PlanningIntelligence: Math.round(3_000),
    AdaptiveIntelligence: Math.round(3_000),
    SelfOptimizationEngine: Math.round(3_000),
  };

  // Score: well-calibrated timeouts = high score
  const timeoutScore = ctx.complexity === 'enterprise' ? 8
    : ctx.complexity === 'simple' ? 9
    : 8.5;

  const recommendations: string[] = [];
  if (ctx.complexity === 'enterprise') recommendations.push('Enterprise: extend per-agent timeouts to handle large codebases');
  if (ctx.historicalBuildTimeMs && ctx.historicalBuildTimeMs > globalTimeoutMs * 0.8) {
    recommendations.push('Historical builds approaching global timeout — increase global limit');
  }

  return { globalTimeoutMs, agentTimeouts, timeoutScore, recommendations };
}
