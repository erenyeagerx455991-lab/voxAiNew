// ── V9.2 Orchestrator — Telemetry ────────────────────────────────────────────
//
// Aggregates orchestrator execution outcomes for GET /api/telemetry/quality.
// In-memory counters, capped, additive-only (never mutates existing telemetry
// modules).
import type { AgentName, ExecutionBlueprint } from './types.js';
import { getAllAgentHealth } from './healthMonitor.js';
import { getOrchestratorLearningStats } from './orchestratorLearning.js';
import { getOrchestratorPersistenceStats } from './orchestratorPersistence.js';

const MAX_RECORDS = 500;

interface ExecutionRecord {
  buildId:           string;
  complexity:        string;
  overallScore:      number;
  parallelGroupCount: number;
  sequentialGroupCount: number;
  skippedAgentCount: number;
  activeAgentCount:  number;
  retries:           number;
  timeouts:          number;
  actualDurationMs:  number;
  estimatedDurationMs: number;
  totalCost:         number;
  recordedAt:        number;
}

let executions: ExecutionRecord[] = [];

export function recordOrchestratorExecution(
  buildId: string,
  blueprint: ExecutionBlueprint,
  overallScore: number,
  actualDurationMs: number,
  retries: number,
  timeouts: number,
): void {
  try {
    const activeAgentCount = blueprint.agentPriority.length;
    executions.push({
      buildId,
      complexity: blueprint.complexity,
      overallScore,
      parallelGroupCount: blueprint.parallelGroups.length,
      sequentialGroupCount: blueprint.sequentialGroups.length,
      skippedAgentCount: blueprint.skippedAgents.length,
      activeAgentCount,
      retries,
      timeouts,
      actualDurationMs,
      estimatedDurationMs: blueprint.estimatedDurationMs,
      totalCost: blueprint.executionCost,
      recordedAt: Date.now(),
    });
    if (executions.length > MAX_RECORDS) executions.shift();
  } catch { /* telemetry must never break a build */ }
}

export function getOrchestratorQualitySnapshot(): {
  executionScore:        number;
  parallelEfficiency:    number;
  averageExecutionTime:  number;
  retryEfficiency:       number;
  agentDistribution:     Record<string, number>;
  dependencyGraphStats:  { averageParallelGroups: number; averageSequentialGroups: number; averageSkippedAgents: number };
  resourceUsage:         { averageCost: number; averageActiveAgents: number };
  costEfficiency:        number;
  learningStatistics:    ReturnType<typeof getOrchestratorLearningStats>;
  persistenceHealth:     ReturnType<typeof getOrchestratorPersistenceStats>;
  agentHealth:           ReturnType<typeof getAllAgentHealth>;
  totalExecutions:       number;
} {
  const n = executions.length;

  const agentDistribution: Record<string, number> = {};
  for (const e of executions) {
    agentDistribution[e.complexity] = (agentDistribution[e.complexity] ?? 0) + 1;
  }

  if (n === 0) {
    return {
      executionScore: 0, parallelEfficiency: 0, averageExecutionTime: 0, retryEfficiency: 1,
      agentDistribution, dependencyGraphStats: { averageParallelGroups: 0, averageSequentialGroups: 0, averageSkippedAgents: 0 },
      resourceUsage: { averageCost: 0, averageActiveAgents: 0 }, costEfficiency: 0,
      learningStatistics: getOrchestratorLearningStats(),
      persistenceHealth: getOrchestratorPersistenceStats(),
      agentHealth: getAllAgentHealth(),
      totalExecutions: 0,
    };
  }

  const totalScore = executions.reduce((s, e) => s + e.overallScore, 0);
  const totalDuration = executions.reduce((s, e) => s + e.actualDurationMs, 0);
  const totalEstimated = executions.reduce((s, e) => s + e.estimatedDurationMs, 0);
  const totalParallel = executions.reduce((s, e) => s + e.parallelGroupCount, 0);
  const totalSequential = executions.reduce((s, e) => s + e.sequentialGroupCount, 0);
  const totalSkipped = executions.reduce((s, e) => s + e.skippedAgentCount, 0);
  const totalActive = executions.reduce((s, e) => s + e.activeAgentCount, 0);
  const totalCost = executions.reduce((s, e) => s + e.totalCost, 0);
  const totalRetries = executions.reduce((s, e) => s + e.retries, 0);
  const totalTimeouts = executions.reduce((s, e) => s + e.timeouts, 0);

  // Parallel efficiency: how much faster actual runs were vs. a fully-sequential estimate.
  const parallelEfficiency = totalEstimated > 0
    ? parseFloat(Math.max(0, Math.min(1, 1 - totalDuration / totalEstimated)).toFixed(3))
    : 0;

  const retryEfficiency = parseFloat(Math.max(0, 1 - (totalRetries + totalTimeouts) / (totalActive || 1)).toFixed(3));

  return {
    executionScore: parseFloat((totalScore / n).toFixed(2)),
    parallelEfficiency,
    averageExecutionTime: Math.round(totalDuration / n),
    retryEfficiency,
    agentDistribution,
    dependencyGraphStats: {
      averageParallelGroups: parseFloat((totalParallel / n).toFixed(2)),
      averageSequentialGroups: parseFloat((totalSequential / n).toFixed(2)),
      averageSkippedAgents: parseFloat((totalSkipped / n).toFixed(2)),
    },
    resourceUsage: {
      averageCost: parseFloat((totalCost / n).toFixed(4)),
      averageActiveAgents: parseFloat((totalActive / n).toFixed(2)),
    },
    costEfficiency: parseFloat((totalSkipped / (totalActive + totalSkipped || 1)).toFixed(3)),
    learningStatistics: getOrchestratorLearningStats(),
    persistenceHealth: getOrchestratorPersistenceStats(),
    agentHealth: getAllAgentHealth(),
    totalExecutions: n,
  };
}

export function resetOrchestratorMetrics(): void {
  executions = [];
}
