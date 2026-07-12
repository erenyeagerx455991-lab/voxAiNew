// ── V9.2 Orchestrator — Cost Intelligence ────────────────────────────────────
//
// Predicts tokens/cost/time/LLM-calls for a given ExecutionBlueprint before
// it runs, using each agent's declared baseCostTokens/baseDurationMs plus
// the parallel/skip decisions already made by the planner. Deterministic —
// no LLM calls, no randomness.
import type { AgentName, ExecutionCostPrediction } from './types.js';
import { AGENT_REGISTRY } from './agentRegistry.js';

const TOKEN_TO_COST_UNIT = 0.000002; // arbitrary proportional cost unit per token

export function predictExecutionCost(
  activeAgents: AgentName[],
  parallelGroups: AgentName[][],
  cacheHitAgents: AgentName[] = [],
): ExecutionCostPrediction {
  const cacheHitSet = new Set(cacheHitAgents);
  let totalTokens = 0;
  let llmCalls = 0;
  let cacheHits = 0;

  for (const agent of activeAgents) {
    const decl = AGENT_REGISTRY[agent];
    if (cacheHitSet.has(agent)) {
      cacheHits++;
      continue; // cached — no tokens/LLM call spent
    }
    totalTokens += decl.baseCostTokens;
    if (decl.baseCostTokens > 0) llmCalls++;
  }

  // Sequential time = sum of every active agent's base duration.
  const sequentialTimeMs = activeAgents.reduce((sum, a) => sum + AGENT_REGISTRY[a].baseDurationMs, 0);

  // Parallel time = for each wave, the max duration among its members
  // (agents not in a declared parallel group run alone in their own wave).
  const grouped = new Set(parallelGroups.flat());
  let parallelTimeMs = 0;
  for (const group of parallelGroups) {
    parallelTimeMs += Math.max(...group.map(a => AGENT_REGISTRY[a].baseDurationMs));
  }
  for (const agent of activeAgents) {
    if (!grouped.has(agent)) parallelTimeMs += AGENT_REGISTRY[agent].baseDurationMs;
  }

  const parallelSavingsMs = Math.max(0, sequentialTimeMs - parallelTimeMs);

  // Optimization savings: skipped agents' would-be duration is pure savings.
  const skippedDurationMs = 0; // computed by caller from full registry diff when needed

  return {
    totalTokens,
    totalCost: Math.round(totalTokens * TOKEN_TO_COST_UNIT * 1000) / 1000,
    totalTimeMs: parallelTimeMs,
    llmCalls,
    cacheHits,
    parallelSavingsMs,
    optimizationSavingsMs: skippedDurationMs,
  };
}

/** Cost saved by skipping a set of agents entirely (vs. running everything). */
export function predictSkipSavings(skippedAgents: AgentName[]): { tokensSaved: number; timeSavedMs: number } {
  let tokensSaved = 0;
  let timeSavedMs = 0;
  for (const agent of skippedAgents) {
    tokensSaved += AGENT_REGISTRY[agent].baseCostTokens;
    timeSavedMs += AGENT_REGISTRY[agent].baseDurationMs;
  }
  return { tokensSaved, timeSavedMs };
}
