// ── V10.1 — Meta Diagnostics ───────────────────────────────────────────────────
// Detects dead, duplicate, slow, unstable, unused, and overloaded modules.
// Zero LLM calls. Pure deterministic analysis.
import type { MetaContext, MetaDiagnosticsBlueprint } from './metaTypes.js';

const SLOW_THRESHOLD_MS       = 20_000;
const UNSTABLE_FAILURE_RATE   = 0.10;
const OVERLOADED_FAILURE_RATE = 0.20;

export function runDiagnostics(ctx: MetaContext): MetaDiagnosticsBlueprint {
  const latencies    = ctx.agentLatencies    ?? {};
  const failureRates = ctx.agentFailureRates ?? {};

  // Dead modules: latency === 0 AND failure rate is 1.0 (never succeeded)
  const deadModules: string[] = Object.entries(failureRates)
    .filter(([agent, rate]) => rate >= 1.0 && (latencies[agent] ?? 0) === 0)
    .map(([agent]) => agent);

  // Duplicate modules: if multiple agents have identical latency patterns
  // (deterministic proxy: same latency within 100ms bucket)
  const duplicateModules: string[] = [];
  const latencyBuckets: Record<string, string[]> = {};
  for (const [agent, ms] of Object.entries(latencies)) {
    const bucket = String(Math.round(ms / 1000)); // 1-second buckets
    if (!latencyBuckets[bucket]) latencyBuckets[bucket] = [];
    latencyBuckets[bucket]!.push(agent);
  }
  for (const [, agents] of Object.entries(latencyBuckets)) {
    if (agents.length > 2) {
      // More than 2 agents in same latency bucket — possible duplicate work
      duplicateModules.push(...agents.slice(1));
    }
  }

  // Unused modules: engine score = 0 (not contributing)
  const scoreMap: Record<string, number> = {
    ReasoningEngine:        ctx.reasoningScore,
    PlanningIntelligence:   ctx.planningScore,
    ExecutionIntelligence:  ctx.executionScore,
    AdaptiveIntelligence:   ctx.adaptiveScore,
    SelfOptimizationEngine: ctx.optimizationScore,
    KnowledgeEngine:        ctx.knowledgeScore  ?? 7,
    RuntimeIntelligence:    ctx.runtimeScore    ?? 7,
  };
  const unusedModules: string[] = Object.entries(scoreMap)
    .filter(([, score]) => score === 0)
    .map(([name]) => name);

  // Slow modules: latency > threshold
  const slowModules: string[] = Object.entries(latencies)
    .filter(([, ms]) => ms > SLOW_THRESHOLD_MS)
    .map(([agent]) => agent);

  // Unstable modules: failure rate > threshold but not overloaded
  const unstableModules: string[] = Object.entries(failureRates)
    .filter(([, rate]) => rate > UNSTABLE_FAILURE_RATE && rate <= OVERLOADED_FAILURE_RATE)
    .map(([agent]) => agent);

  // Overloaded modules: very high failure rate
  const overloadedModules: string[] = Object.entries(failureRates)
    .filter(([, rate]) => rate > OVERLOADED_FAILURE_RATE)
    .map(([agent]) => agent);

  const issueCount =
    deadModules.length +
    duplicateModules.length +
    unusedModules.length +
    slowModules.length +
    unstableModules.length +
    overloadedModules.length;

  // Diagnostic score: 10 = no issues; decreases per issue category
  const diagnosticScore = Math.max(0, Math.min(10,
    Math.round((10 - issueCount * 0.8) * 10) / 10
  ));

  return {
    deadModules,
    duplicateModules,
    unusedModules,
    slowModules,
    unstableModules,
    overloadedModules,
    diagnosticScore,
    issueCount,
  };
}
