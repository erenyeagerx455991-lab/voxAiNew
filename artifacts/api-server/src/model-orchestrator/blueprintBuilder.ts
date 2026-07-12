// ── V9.3 Model Orchestrator — Blueprint Builder ───────────────────────────────
//
// Assembles a ModelExecutionBlueprint from ExecutionBlueprint (V9.2) +
// RuntimeBlueprint (V9.0). Deterministic — no LLM calls.
import type { AgentName, ProjectComplexity } from '../agent-orchestrator/types.js';
import type { ExecutionBlueprint } from '../agent-orchestrator/types.js';
import type { ModelExecutionBlueprint, AgentModelPlan, ProviderId } from './types.js';
import { routeAgent } from './modelRouter.js';
import { computeTokenBudget } from './tokenBudgetEngine.js';
import { predictTotalCost, estimateLatencyMs, estimateQuality } from './costIntelligence.js';
import { predictCacheHitRate } from './cacheIntelligence.js';
import { PROVIDER_REGISTRY } from './providerRegistry.js';

const PROMPT_BUDGET_RATIO  = 0.6; // 60% of token budget for prompt
const CONTEXT_BUDGET_RATIO = 0.4; // 40% of token budget for context

export function buildModelExecutionBlueprint(
  executionBlueprint: ExecutionBlueprint,
  buildCount = 0,
): ModelExecutionBlueprint {
  const { buildId, complexity, agentPriority, parallelGroups } = executionBlueprint;
  const activeAgents: AgentName[] = agentPriority;

  const tokenBudget = computeTokenBudget(complexity as ProjectComplexity, activeAgents);
  const agentPlans = {} as Record<AgentName, AgentModelPlan>;
  const agentProviders = {} as Record<AgentName, ProviderId>;
  const agentTokens = {} as Record<AgentName, number>;
  const providerDistribution: Record<ProviderId, number> = {} as Record<ProviderId, number>;

  for (const agent of activeAgents) {
    const routing = routeAgent(agent);
    const budget = tokenBudget.perAgent[agent] ?? { tokens: 1_000, percent: 1 };
    const cacheHitPrediction = predictCacheHitRate(routing.cachePolicy, buildCount);
    const effectiveTokens = Math.round(budget.tokens * (1 - cacheHitPrediction));
    const expectedLatencyMs = estimateLatencyMs(routing.selectedProvider, effectiveTokens);
    const expectedQuality = estimateQuality(routing.selectedProvider);
    const expectedCost = effectiveTokens * (1 / (PROVIDER_REGISTRY[routing.selectedProvider].costScore || 5)) * 0.00001;

    agentPlans[agent] = {
      agent,
      modelTier:          executionBlueprint.modelAllocation[agent] ?? 'balanced',
      selectedProvider:   routing.selectedProvider,
      fallbackChain:      routing.fallbackChain,
      tokenBudget:        budget.tokens,
      tokenBudgetPercent: budget.percent,
      promptBudget:       Math.round(budget.tokens * PROMPT_BUDGET_RATIO),
      contextBudget:      Math.round(budget.tokens * CONTEXT_BUDGET_RATIO),
      latencyTarget:      routing.latencyTarget,
      qualityTarget:      routing.qualityTarget,
      costTarget:         routing.costTarget,
      retryModel:         routing.retryModel,
      cachePolicy:        routing.cachePolicy,
      streamingPolicy:    routing.streamingPolicy,
      compressionPolicy:  routing.compressionPolicy,
      reasoningDepth:     routing.reasoningDepth,
      expectedCost:       parseFloat(expectedCost.toFixed(6)),
      expectedLatencyMs,
      expectedQuality,
    };

    agentProviders[agent] = routing.selectedProvider;
    agentTokens[agent]    = budget.tokens;

    providerDistribution[routing.selectedProvider] =
      (providerDistribution[routing.selectedProvider] ?? 0) + 1;
  }

  const globalCacheHit = predictCacheHitRate('prompt', buildCount);
  const costPrediction  = predictTotalCost(
    agentProviders, agentTokens, globalCacheHit, parallelGroups, tokenBudget.totalBudget,
  );

  const totalLatencyMs = activeAgents.reduce(
    (sum, a) => sum + (agentPlans[a]?.expectedLatencyMs ?? 0), 0,
  );

  const allocatedTokens = Object.values(agentTokens).reduce((a, b) => a + b, 0);
  const tokenEfficiency = tokenBudget.totalBudget > 0
    ? parseFloat(Math.min(1, allocatedTokens / tokenBudget.totalBudget).toFixed(3))
    : 0;

  return {
    buildId,
    complexity:              complexity as ProjectComplexity,
    totalTokenBudget:        tokenBudget.totalBudget,
    agentPlans,
    providerDistribution,
    expectedTotalCost:       costPrediction.totalCost,
    expectedTotalLatencyMs:  totalLatencyMs,
    cacheHitPrediction:      globalCacheHit,
    fallbackPrediction:      0.05,  // 5% fallback probability baseline
    tokenEfficiency,
    budgetUtilization:       costPrediction.budgetUtilization,
    recordedAt:              Date.now(),
  };
}

/** Safe default blueprint — all traffic to OpenRouter/Groq. */
export function buildFallbackModelBlueprint(buildId: string): ModelExecutionBlueprint {
  return {
    buildId,
    complexity:              'standard',
    totalTokenBudget:        100_000,
    agentPlans:              {} as Record<AgentName, AgentModelPlan>,
    providerDistribution:    { openrouter: 1, groq: 1 } as Record<ProviderId, number>,
    expectedTotalCost:       0,
    expectedTotalLatencyMs:  0,
    cacheHitPrediction:      0,
    fallbackPrediction:      0.05,
    tokenEfficiency:         0,
    budgetUtilization:       0,
    recordedAt:              Date.now(),
  };
}
