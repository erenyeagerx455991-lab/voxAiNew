// ── V9.2 Orchestrator — Execution Planner (the brain) ────────────────────────
//
// Classifies project complexity from already-computed architect signals
// (reusing Runtime Intelligence's GenerationMode — no duplicate classifier),
// decides which skippable agents to omit, builds the dependency graph over
// the resulting active-agent set, and assembles the full ExecutionBlueprint:
// priority order, parallel/sequential groups, retry/timeout/model policy,
// context distribution, cost prediction, and risk/quality estimates.
//
// Deterministic — no LLM calls, no randomness.
import type {
  AgentName, ExecutionBlueprint, ProjectComplexity, RetryPolicy, TimeoutPolicy,
} from './types.js';
import { AGENT_REGISTRY, ALL_AGENT_NAMES, PASS_THROUGH_SKIPPABLE } from './agentRegistry.js';
import { buildDependencyGraph, flattenWaves } from './dependencyGraph.js';
import { buildContextDistribution } from './contextAllocator.js';
import { buildModelAllocation } from './modelAllocator.js';
import { predictExecutionCost, predictSkipSavings } from './costIntelligence.js';

/** Fast/Safe → simple; Balanced/Strict → standard; everything else → enterprise. */
export function classifyComplexity(mode: string): ProjectComplexity {
  if (mode === 'Fast' || mode === 'Safe') return 'simple';
  if (mode === 'Balanced' || mode === 'Strict') return 'standard';
  return 'enterprise'; // Quality, Enterprise, Creative, Experimental
}

/** Which optional/enrichment agents are safe to skip for a given complexity tier. */
function agentsToSkip(complexity: ProjectComplexity): AgentName[] {
  if (complexity === 'enterprise') return []; // run everything for high-stakes builds
  if (complexity === 'standard') {
    // Trim the cheapest, least load-bearing enrichment passes only.
    return ['ConversionIntelligence', 'DesignDirector'];
  }
  // simple: trim every pass-through-skippable enrichment step — these are
  // purely additive quality scoring/repair passes, safe to omit for a
  // simple landing page without breaking pipeline data flow.
  return [...PASS_THROUGH_SKIPPABLE];
}

function computeRiskLevel(complexity: ProjectComplexity, skippedCount: number): ExecutionBlueprint['riskLevel'] {
  if (complexity === 'enterprise') return skippedCount > 0 ? 'Medium' : 'Low';
  if (complexity === 'standard') return 'Low';
  return skippedCount > 2 ? 'Medium' : 'Low';
}

function expectedQuality(complexity: ProjectComplexity, skippedCount: number): number {
  const base = complexity === 'enterprise' ? 9.0 : complexity === 'standard' ? 8.0 : 7.0;
  return parseFloat(Math.max(5, base - skippedCount * 0.15).toFixed(2));
}

export interface PlanExecutionInput {
  buildId: string;
  mode: string; // GenerationMode from RuntimeIntelligenceOutput.blueprint.mode
}

export function planExecution(input: PlanExecutionInput): ExecutionBlueprint {
  const { buildId, mode } = input;
  const complexity = classifyComplexity(mode);
  const skippedAgents = agentsToSkip(complexity);
  const skippedSet = new Set(skippedAgents);
  const activeAgents = ALL_AGENT_NAMES.filter(a => !skippedSet.has(a));

  const graph = buildDependencyGraph(activeAgents);
  const agentPriority = flattenWaves(graph.waves);
  const parallelGroups = graph.waves.filter(w => w.length > 1);
  const sequentialGroups = graph.waves.filter(w => w.length === 1);

  const retryPolicy = {} as Record<AgentName, RetryPolicy>;
  const timeoutPolicy = {} as Record<AgentName, TimeoutPolicy>;
  for (const agent of activeAgents) {
    retryPolicy[agent] = AGENT_REGISTRY[agent].retryPolicy;
    timeoutPolicy[agent] = AGENT_REGISTRY[agent].timeoutPolicy;
  }

  const modelAllocation = buildModelAllocation(activeAgents);
  const contextDistribution = buildContextDistribution(activeAgents);
  const resourceBudget = predictExecutionCost(activeAgents, parallelGroups);
  const { timeSavedMs } = predictSkipSavings(skippedAgents);
  resourceBudget.optimizationSavingsMs = timeSavedMs;

  return {
    buildId,
    complexity,
    mode,
    executionGraph: graph,
    agentPriority,
    parallelGroups,
    sequentialGroups,
    skippedAgents,
    retryPolicy,
    timeoutPolicy,
    failureStrategy: complexity === 'enterprise' ? 'abort' : 'fallback',
    recoveryStrategy: 'retry',
    contextDistribution,
    modelAllocation,
    resourceBudget,
    executionCost: resourceBudget.totalCost,
    estimatedDurationMs: resourceBudget.totalTimeMs,
    expectedQuality: expectedQuality(complexity, skippedAgents.length),
    riskLevel: computeRiskLevel(complexity, skippedAgents.length),
    recordedAt: Date.now(),
  };
}
