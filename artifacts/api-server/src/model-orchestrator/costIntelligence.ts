// ── V9.3 Model Orchestrator — Cost Intelligence ───────────────────────────────
//
// Predicts total/per-agent/per-model/monthly cost, cache savings, parallel
// savings, and budget utilization. Deterministic — no LLM calls.
import type { AgentName, ProjectComplexity } from '../agent-orchestrator/types.js';
import type { ProviderId } from './types.js';
import { PROVIDER_REGISTRY } from './providerRegistry.js';
import { AGENT_REGISTRY } from '../agent-orchestrator/agentRegistry.js';

/** Cost per token by provider (arbitrary normalized units). */
const PROVIDER_COST_PER_TOKEN: Record<ProviderId, number> = {
  openrouter: 0.0000020,
  groq:       0.0000008,
  openai:     0.0000060,
  claude:     0.0000055,
  gemini:     0.0000030,
  deepseek:   0.0000007,
  local:      0.0000000,
  future:     0.0000020,
};

export interface AgentCostPrediction {
  agent:        AgentName;
  provider:     ProviderId;
  tokens:       number;
  cost:         number;
  cacheSavings: number;
}

export interface CostPrediction {
  totalCost:          number;
  perAgent:           AgentCostPrediction[];
  perModel:           Record<ProviderId, number>;
  monthlyCost:        number;  // estimated at 1000 builds/month
  cacheSavings:       number;
  parallelSavings:    number;
  budgetUtilization:  number;  // 0-1
  expectedBudget:     number;
}

export function predictAgentCost(
  agent: AgentName,
  provider: ProviderId,
  tokenBudget: number,
  cacheHitRate: number,
): AgentCostPrediction {
  const costPerToken = PROVIDER_COST_PER_TOKEN[provider] ?? PROVIDER_COST_PER_TOKEN.openrouter;
  const effectiveTokens = Math.round(tokenBudget * (1 - cacheHitRate));
  const cost = parseFloat((effectiveTokens * costPerToken).toFixed(6));
  const cacheSavings = parseFloat((tokenBudget * cacheHitRate * costPerToken).toFixed(6));
  return { agent, provider, tokens: effectiveTokens, cost, cacheSavings };
}

export function predictTotalCost(
  agentProviders: Record<AgentName, ProviderId>,
  agentTokens: Record<AgentName, number>,
  cacheHitRate: number,
  parallelGroups: AgentName[][],
  totalBudget: number,
): CostPrediction {
  const perAgent: AgentCostPrediction[] = [];
  const perModel: Record<ProviderId, number> = {};
  let totalCost = 0;
  let totalCacheSavings = 0;

  for (const [agent, provider] of Object.entries(agentProviders) as [AgentName, ProviderId][]) {
    const tokens = agentTokens[agent] ?? AGENT_REGISTRY[agent]?.baseCostTokens ?? 0;
    const prediction = predictAgentCost(agent, provider, tokens, cacheHitRate);
    perAgent.push(prediction);
    totalCost        += prediction.cost;
    totalCacheSavings += prediction.cacheSavings;
    perModel[provider] = (perModel[provider] ?? 0) + prediction.cost;
  }

  // Parallel savings: agents in parallel groups share wall-clock time,
  // reducing compute cost by ~15% per parallel group.
  const parallelSavings = parseFloat((parallelGroups.length * 0.15 * totalCost).toFixed(6));

  const monthlyCost      = parseFloat((totalCost * 1000).toFixed(2));
  const budgetUtilization = totalBudget > 0
    ? parseFloat(Math.min(1, totalCost / (totalBudget * PROVIDER_COST_PER_TOKEN.openrouter)).toFixed(3))
    : 0;

  return {
    totalCost:   parseFloat(totalCost.toFixed(6)),
    perAgent,
    perModel,
    monthlyCost,
    cacheSavings: parseFloat(totalCacheSavings.toFixed(6)),
    parallelSavings,
    budgetUtilization,
    expectedBudget: totalBudget,
  };
}

export function getProviderCostScore(provider: ProviderId): number {
  return PROVIDER_REGISTRY[provider]?.costScore ?? 5;
}

export function estimateLatencyMs(provider: ProviderId, tokens: number): number {
  const latencyScore = PROVIDER_REGISTRY[provider]?.latency ?? 5;
  // Groq is very fast; OpenRouter is moderate; others are slower
  const baseMs = provider === 'groq' ? 500
    : provider === 'local' ? 3_000
    : 2_000;
  const tokensMs = Math.round(tokens / 100);  // ~100 tokens/ms throughput estimate
  const latencyMultiplier = Math.max(0.1, (10 - latencyScore) / 5);
  return Math.round(baseMs * latencyMultiplier + tokensMs);
}

export function estimateQuality(provider: ProviderId): number {
  return PROVIDER_REGISTRY[provider]?.quality ?? 7;
}
