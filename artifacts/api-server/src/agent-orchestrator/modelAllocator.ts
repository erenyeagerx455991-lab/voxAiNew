// ── V9.2 Orchestrator — Dynamic Model Allocation ─────────────────────────────
//
// Maps each agent to a model tier (fast / high-quality / cheap-reasoning /
// highest-reasoning / balanced). Purely descriptive routing metadata — it
// does not itself call any model or introduce new LLM calls; existing steps
// keep choosing their own concrete model names via aiService.ts.
import type { AgentName, ModelTier } from './types.js';
import { AGENT_REGISTRY, ALL_AGENT_NAMES } from './agentRegistry.js';

export function allocateModel(agent: AgentName): ModelTier {
  return AGENT_REGISTRY[agent].modelTier;
}

export function buildModelAllocation(activeAgents: AgentName[] = ALL_AGENT_NAMES): Record<AgentName, ModelTier> {
  const out = {} as Record<AgentName, ModelTier>;
  for (const agent of activeAgents) out[agent] = allocateModel(agent);
  return out;
}

export function getAgentsByTier(tier: ModelTier): AgentName[] {
  return ALL_AGENT_NAMES.filter(a => AGENT_REGISTRY[a].modelTier === tier);
}
