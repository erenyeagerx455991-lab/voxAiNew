// ── V10.0 — Agent Optimizer ────────────────────────────────────────────────────
import type { SelfOptimizationContext, AgentBlueprint, AgentOptimizationScore } from './optimizationTypes.js';

const KNOWN_AGENTS = [
  'Planner', 'Architecture', 'Frontend', 'Backend', 'Repair',
  'DesignEvaluator', 'DesignCritic', 'RuntimeValidation',
  'KnowledgeEngine', 'ReasoningEngine', 'ExecutionIntelligence',
  'PlanningIntelligence', 'AdaptiveIntelligence', 'SelfOptimizationEngine',
  'Accessibility', 'Optimization', 'DesignDirector', 'ConversionIntelligence',
  'ProductManager', 'QAArchitect', 'DevOpsArchitect', 'BackendArchitect', 'FrontendArchitect',
];

export function optimizeAgents(ctx: SelfOptimizationContext): AgentBlueprint {
  const latencies = ctx.agentLatencies ?? {};
  const failureRates = ctx.agentFailureRates ?? {};
  const successRate = ctx.historicalSuccessRate ?? 0.9;

  const agentScores: Record<string, AgentOptimizationScore> = {};

  for (const agent of KNOWN_AGENTS) {
    const latMs = latencies[agent] ?? 5_000;
    const failRate = failureRates[agent] ?? (1 - successRate);

    // Score each dimension 0-10
    const efficiency  = Math.max(0, Math.min(10, 10 - latMs / 5_000));
    const latency     = Math.max(0, Math.min(10, 10 - latMs / 8_000));
    const quality     = Math.max(0, Math.min(10, (1 - failRate) * 10));
    const cost        = Math.max(0, Math.min(10, 10 - (latMs / 10_000) * 3));
    const sr          = Math.min(10, (1 - failRate) * 10);
    const confidence  = Math.min(10, sr * 0.9);

    const composite = Math.round(
      (efficiency * 0.2 + latency * 0.15 + quality * 0.25 + cost * 0.15 + sr * 0.15 + confidence * 0.1) * 10
    ) / 10;

    agentScores[agent] = { efficiency, latency, quality, cost, successRate: sr, confidence, composite };
  }

  const sorted = Object.entries(agentScores).sort((a, b) => b[1].composite - a[1].composite);
  const highPerformingAgents = sorted.slice(0, 5).map(([n]) => n);
  const lowPerformingAgents  = sorted.slice(-5).filter(([, s]) => s.composite < 6).map(([n]) => n);

  const agentScore = Math.round(
    sorted.reduce((sum, [, s]) => sum + s.composite, 0) / Math.max(1, sorted.length) * 10
  ) / 10;

  const recommendations: string[] = [];
  if (lowPerformingAgents.length > 0) recommendations.push(`Low-performing agents: ${lowPerformingAgents.join(', ')}`);
  if (highPerformingAgents.length > 0) recommendations.push(`High-performing agents: ${highPerformingAgents.slice(0, 3).join(', ')}`);

  return { agentScores, lowPerformingAgents, highPerformingAgents, agentScore, recommendations };
}
