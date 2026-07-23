// ── V10.0 — Performance Optimizer ─────────────────────────────────────────────
import type { SelfOptimizationContext, PerformanceBlueprint } from './optimizationTypes.js';

const SLOW_AGENT_THRESHOLD_MS = 15_000;
const CRITICAL_PATH_AGENTS = ['Planner', 'Frontend', 'Backend', 'Repair', 'Architecture'];

export function optimizePerformance(ctx: SelfOptimizationContext): PerformanceBlueprint {
  const latencies = ctx.agentLatencies ?? {};
  const slowAgents = Object.entries(latencies)
    .filter(([, ms]) => ms > SLOW_AGENT_THRESHOLD_MS)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name);

  const criticalPath = CRITICAL_PATH_AGENTS.filter(a => latencies[a] !== undefined || CRITICAL_PATH_AGENTS.includes(a));

  const bottlenecks: string[] = [];
  if ((ctx.parallelEfficiency ?? 1) < 0.5) bottlenecks.push('low-parallel-efficiency');
  if ((ctx.idleTimeMs ?? 0) > 10_000) bottlenecks.push('high-idle-time');
  if (slowAgents.length > 3) bottlenecks.push('many-slow-agents');

  const parallelizableSteps = ['DesignEvaluator', 'DesignCritic', 'ConversionIntelligence', 'Accessibility'];

  const baseMs = ctx.historicalBuildTimeMs ?? 90_000;
  const complexityMultiplier = ctx.complexity === 'enterprise' ? 1.5 : ctx.complexity === 'simple' ? 0.6 : 1.0;
  const estimatedBuildTimeMs = Math.round(baseMs * complexityMultiplier);

  // Score: penalize slow agents, bottlenecks, low parallelism
  let score = 8;
  score -= slowAgents.length * 0.5;
  score -= bottlenecks.length * 0.5;
  if ((ctx.parallelEfficiency ?? 1) < 0.5) score -= 1;
  const performanceScore = Math.max(4, Math.min(10, Math.round(score * 10) / 10));

  const recommendations: string[] = [];
  if (slowAgents.length > 0) recommendations.push(`Optimize slow agents: ${slowAgents.slice(0, 3).join(', ')}`);
  if (bottlenecks.includes('low-parallel-efficiency')) recommendations.push('Increase parallelism to reduce idle time');
  if (ctx.complexity === 'enterprise') recommendations.push('Consider splitting enterprise build into phases');

  return { estimatedBuildTimeMs, slowAgents, criticalPath, bottlenecks, parallelizableSteps, performanceScore, recommendations };
}
