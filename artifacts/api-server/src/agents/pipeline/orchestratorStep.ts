// ── V9.2 Adaptive Multi-Agent Orchestrator — Pipeline Step ───────────────────
//
// Runs immediately after Runtime Intelligence (step 0.9), before the
// Planner. Uses the already-computed GenerationMode to classify project
// complexity and produce a real ExecutionBlueprint. The pipeline consults
// `skippedAgents` later to pass enrichment steps through unchanged for
// simple builds. Orchestrator failures MUST NEVER stop a build — any error
// falls back to a "run everything" blueprint.
import type { Response } from 'express';
import type { RuntimeIntelligenceOutput } from '../../runtime-intelligence/runtimeTypes.js';
import type { ExecutionBlueprint } from '../../agent-orchestrator/types.js';
import { planExecution } from '../../agent-orchestrator/executionPlanner.js';
import { persistExecutionSnapshot } from '../../agent-orchestrator/orchestratorPersistence.js';
import { getAllAgentHealth } from '../../agent-orchestrator/healthMonitor.js';
import { learnFromExecution } from '../../agent-orchestrator/orchestratorLearning.js';
import { recordOrchestratorExecution } from '../../agent-orchestrator/orchestratorMetrics.js';
import { ALL_AGENT_NAMES } from '../../agent-orchestrator/agentRegistry.js';
import { buildDependencyGraph, flattenWaves } from '../../agent-orchestrator/dependencyGraph.js';
import { predictExecutionCost } from '../../agent-orchestrator/costIntelligence.js';
import { withAgentMetrics } from '../../telemetry/agentMetrics.js';

function makeFallbackBlueprint(buildId: string): ExecutionBlueprint {
  const graph = buildDependencyGraph(ALL_AGENT_NAMES);
  const parallelGroups = graph.waves.filter(w => w.length > 1);
  const resourceBudget = predictExecutionCost(ALL_AGENT_NAMES, parallelGroups);
  return {
    buildId,
    complexity: 'standard',
    mode: 'Balanced',
    executionGraph: graph,
    agentPriority: flattenWaves(graph.waves),
    parallelGroups,
    sequentialGroups: graph.waves.filter(w => w.length === 1),
    skippedAgents: [],
    retryPolicy: {} as ExecutionBlueprint['retryPolicy'],
    timeoutPolicy: {} as ExecutionBlueprint['timeoutPolicy'],
    failureStrategy: 'fallback',
    recoveryStrategy: 'retry',
    contextDistribution: [],
    modelAllocation: {} as ExecutionBlueprint['modelAllocation'],
    resourceBudget,
    executionCost: resourceBudget.totalCost,
    estimatedDurationMs: resourceBudget.totalTimeMs,
    expectedQuality: 7,
    riskLevel: 'Low',
    recordedAt: Date.now(),
  };
}

export async function runOrchestratorStep(
  buildId: string,
  res: Response,
  runtimeIntelligenceOutput: RuntimeIntelligenceOutput,
): Promise<ExecutionBlueprint> {
  return withAgentMetrics('Orchestrator', async () => {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    sendEvent({ type: 'orchestrator_start', buildId });

    let blueprint: ExecutionBlueprint;
    try {
      const mode = runtimeIntelligenceOutput?.blueprint?.mode ?? 'Balanced';
      blueprint = planExecution({ buildId, mode });
    } catch {
      blueprint = makeFallbackBlueprint(buildId);
    }

    sendEvent({
      type:               'orchestrator_progress',
      buildId,
      complexity:          blueprint.complexity,
      activeAgents:        blueprint.agentPriority.length,
      skippedAgents:       blueprint.skippedAgents,
      estimatedDurationMs: blueprint.estimatedDurationMs,
      estimatedCost:       blueprint.executionCost,
      riskLevel:           blueprint.riskLevel,
    });

    for (const group of blueprint.parallelGroups) {
      sendEvent({ type: 'orchestrator_parallel_group', buildId, agents: group });
    }

    sendEvent({
      type:            'orchestrator_complete',
      buildId,
      expectedQuality: blueprint.expectedQuality,
      parallelGroups:  blueprint.parallelGroups.length,
      sequentialGroups: blueprint.sequentialGroups.length,
    });

    try {
      persistExecutionSnapshot(buildId, blueprint, getAllAgentHealth());
    } catch { /* persistence must never stop a build */ }

    return blueprint;
  });
}

/** Called after the build finishes — records learning + telemetry. Never throws. */
export function finalizeOrchestratorExecution(
  res: Response,
  blueprint: ExecutionBlueprint,
  overallScore: number,
  actualDurationMs: number,
  retries = 0,
  timeouts = 0,
): void {
  try {
    const sendEvent = (event: object) => {
      try { res.write(`data: ${JSON.stringify(event)}\n\n`); } catch { /* SSE writes must never throw */ }
    };

    void learnFromExecution({
      buildId:             blueprint.buildId,
      complexity:          blueprint.complexity,
      mode:                blueprint.mode,
      skippedAgents:       blueprint.skippedAgents,
      parallelGroupCount:  blueprint.parallelGroups.length,
      overallScore,
      actualDurationMs,
      estimatedDurationMs: blueprint.estimatedDurationMs,
      recordedAt:          Date.now(),
    });

    recordOrchestratorExecution(blueprint.buildId, blueprint, overallScore, actualDurationMs, retries, timeouts);

    sendEvent({
      type:    'orchestrator_learning',
      buildId: blueprint.buildId,
      overallScore,
      actualDurationMs,
      estimatedDurationMs: blueprint.estimatedDurationMs,
    });
  } catch { /* learning/telemetry must never stop a build */ }
}
