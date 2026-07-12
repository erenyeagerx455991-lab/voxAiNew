// ── V9.3 Model Orchestrator — Token Budget Engine ────────────────────────────
//
// Dynamically allocates token budget percentages per agent based on project
// complexity. Matches the Simple Landing / Enterprise SaaS examples from spec.
// Deterministic — no LLM calls.
import type { AgentName, ProjectComplexity } from '../agent-orchestrator/types.js';
import { ALL_AGENT_NAMES } from '../agent-orchestrator/agentRegistry.js';

const TOTAL_BUDGET_TOKENS: Record<ProjectComplexity, number> = {
  simple:     50_000,
  standard:  100_000,
  enterprise: 200_000,
};

/** Base percentage allocations per agent per complexity tier.
 *  Sums to 100 for each tier (unallocated goes to a pool). */
const BASE_ALLOCATIONS: Record<ProjectComplexity, Partial<Record<AgentName, number>>> = {
  simple: {
    Planner:            2,
    Frontend:          25,
    DesignDirector:     5,
    CandidateSelection: 8,
    Architecture:       5,
    ComponentTree:      1,
    Repair:             4,
    // rest get 0 — they're skipped or minimal
  },
  standard: {
    Planner:            8,
    Frontend:          20,
    Backend:            5,
    CandidateSelection: 8,
    Architecture:       5,
    Repair:             6,
    DesignEvaluator:    3,
    DesignCritic:       3,
    DesignDirector:     5,
    SecurityIntelligence: 4,
    RuntimeValidation:  8,
  },
  enterprise: {
    Planner:            10,
    Frontend:           20,
    BackendArchitect:    5,
    CandidateSelection:  8,
    Architecture:        5,
    Repair:              6,
    DesignEvaluator:     3,
    DesignCritic:        3,
    ConversionIntelligence: 2,
    Accessibility:       2,
    Optimization:        2,
    DesignDirector:      5,
    SecurityIntelligence: 15,
    QAArchitect:         5,
    RuntimeIntelligence: 5,
    RuntimeValidation:  10,
    Scaffold:            5,
  },
};

const DEFAULT_AGENT_PERCENT = 1; // fallback for unlisted agents

export interface TokenBudgetResult {
  totalBudget:       number;
  perAgent:          Record<AgentName, { tokens: number; percent: number }>;
  allocatedTokens:   number;
  unallocatedTokens: number;
}

export function computeTokenBudget(
  complexity: ProjectComplexity,
  activeAgents: AgentName[] = ALL_AGENT_NAMES,
): TokenBudgetResult {
  const totalBudget = TOTAL_BUDGET_TOKENS[complexity];
  const baseAlloc = BASE_ALLOCATIONS[complexity];
  const perAgent = {} as Record<AgentName, { tokens: number; percent: number }>;

  let usedPercent = 0;
  for (const agent of activeAgents) {
    const pct = baseAlloc[agent] ?? DEFAULT_AGENT_PERCENT;
    usedPercent += pct;
  }

  // Normalize so active agents share 100%
  let allocatedTokens = 0;
  for (const agent of activeAgents) {
    const rawPct = baseAlloc[agent] ?? DEFAULT_AGENT_PERCENT;
    const normalizedPct = usedPercent > 0 ? (rawPct / usedPercent) * 100 : 0;
    const tokens = Math.round((normalizedPct / 100) * totalBudget);
    perAgent[agent] = { tokens, percent: parseFloat(normalizedPct.toFixed(2)) };
    allocatedTokens += tokens;
  }

  return {
    totalBudget,
    perAgent,
    allocatedTokens,
    unallocatedTokens: Math.max(0, totalBudget - allocatedTokens),
  };
}

export function getAgentTokenBudget(
  agent: AgentName,
  complexity: ProjectComplexity,
  activeAgents: AgentName[] = ALL_AGENT_NAMES,
): { tokens: number; percent: number } {
  const result = computeTokenBudget(complexity, activeAgents);
  return result.perAgent[agent] ?? { tokens: 1_000, percent: 1 };
}
