// ── V9.2 Orchestrator — Dynamic Context Allocation ───────────────────────────
//
// Every agent receives only the context fields it declared as `consumes`.
// This is informational/telemetry-facing (the actual step functions already
// take explicit typed arguments — we do not change their signatures), but it
// gives the Orchestrator (and its telemetry) a real, computed view of what
// could be trimmed, and is used to size the cost prediction's context share.
import type { AgentName, ContextDistributionEntry } from './types.js';
import { AGENT_REGISTRY } from './agentRegistry.js';

/** Returns the minimal context field list a given agent needs. */
export function getRequiredContextFields(agent: AgentName): string[] {
  return [...AGENT_REGISTRY[agent].consumes];
}

/** Builds the full contextDistribution table for a set of active agents. */
export function buildContextDistribution(activeAgents: AgentName[]): ContextDistributionEntry[] {
  return activeAgents.map(agent => ({ agent, fields: getRequiredContextFields(agent) }));
}

/**
 * Given a full context bundle (object keyed by logical field name) and an
 * agent, returns a filtered object containing only the fields that agent
 * declared it consumes. Unknown/extra fields on the bundle are dropped.
 */
export function allocateContext<T extends Record<string, unknown>>(
  agent: AgentName,
  fullContext: T,
): Partial<T> {
  const fields = getRequiredContextFields(agent);
  const out: Partial<T> = {};
  for (const f of fields) {
    if (f in fullContext) out[f as keyof T] = fullContext[f as keyof T];
  }
  return out;
}

/** Rough estimate of token savings from trimming context vs. sending everything. */
export function estimateContextSavings(activeAgents: AgentName[], fullFieldCount: number): number {
  if (fullFieldCount <= 0 || activeAgents.length === 0) return 0;
  const totalConsumed = activeAgents.reduce((sum, a) => sum + getRequiredContextFields(a).length, 0);
  const totalIfFull = activeAgents.length * fullFieldCount;
  if (totalIfFull === 0) return 0;
  return Math.max(0, Math.round((1 - totalConsumed / totalIfFull) * 100));
}
