// ── V9.6 Task Graph Builder ────────────────────────────────────────────────────
// Converts reasoning/pipeline context into a Directed Acyclic Graph (DAG).
// Static/deterministic — no LLM calls.
import type {
  ExecutionIntelligenceContext, ExecutionTask, TaskGraph, TaskId,
} from './executionTypes.js';
import { resolveDependencies } from './dependencyResolver.js';
import { computeRetryConfig } from './retryPlanner.js';
import { computeTimeoutConfig } from './timeoutPlanner.js';
import { computePriorityScore, toPriorityLabel } from './priorityPlanner.js';

// Pipeline-level task definitions — mirrors the build pipeline stages
const PIPELINE_TASK_DEFS: Array<{
  id: TaskId; name: string; dependsOn: TaskId[];
  baseCostTokens: number; baseDurationMs: number;
  parallelizable: boolean; retryable: boolean; rollbackRequired: boolean;
}> = [
  { id: 'planning',      name: 'Planning & Planner',          dependsOn: [],             baseCostTokens: 3000,  baseDurationMs: 8000,   parallelizable: false, retryable: true,  rollbackRequired: false },
  { id: 'architecture',  name: 'Architecture & Stack',         dependsOn: ['planning'],   baseCostTokens: 1500,  baseDurationMs: 4000,   parallelizable: false, retryable: true,  rollbackRequired: false },
  { id: 'component-tree',name: 'Component Tree Builder',       dependsOn: ['architecture'],baseCostTokens: 0,    baseDurationMs: 100,    parallelizable: false, retryable: false, rollbackRequired: false },
  { id: 'frontend',      name: 'Frontend Code Generation',     dependsOn: ['component-tree'],baseCostTokens: 6000,baseDurationMs: 20000, parallelizable: false, retryable: true,  rollbackRequired: true  },
  { id: 'candidates',    name: 'Multi-Candidate Selection',    dependsOn: ['frontend'],   baseCostTokens: 2000,  baseDurationMs: 5000,   parallelizable: false, retryable: false, rollbackRequired: false },
  { id: 'repair',        name: 'Code Repair Loop',             dependsOn: ['candidates'], baseCostTokens: 1500,  baseDurationMs: 6000,   parallelizable: false, retryable: true,  rollbackRequired: false },
  { id: 'ux-intel',      name: 'UX Intelligence',              dependsOn: ['repair'],     baseCostTokens: 200,   baseDurationMs: 200,    parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'evaluator',     name: 'Design Evaluator',             dependsOn: ['ux-intel'],   baseCostTokens: 0,     baseDurationMs: 200,    parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'critic',        name: 'Design Critic',                dependsOn: ['evaluator'],  baseCostTokens: 1000,  baseDurationMs: 3000,   parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'conversion',    name: 'Conversion Intelligence',      dependsOn: ['critic'],     baseCostTokens: 200,   baseDurationMs: 200,    parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'accessibility', name: 'Accessibility (WCAG)',         dependsOn: ['conversion'], baseCostTokens: 100,   baseDurationMs: 200,    parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'optimization',  name: 'Bundle Optimization',          dependsOn: ['accessibility'],baseCostTokens: 100, baseDurationMs: 200,    parallelizable: true,  retryable: false, rollbackRequired: false },
  { id: 'director',      name: 'AI Design Director',           dependsOn: ['optimization'],baseCostTokens: 150,  baseDurationMs: 400,    parallelizable: false, retryable: false, rollbackRequired: false },
  { id: 'scaffold',      name: 'Backend Scaffold',             dependsOn: ['director'],   baseCostTokens: 1000,  baseDurationMs: 2000,   parallelizable: false, retryable: true,  rollbackRequired: true  },
  { id: 'runtime-val',   name: 'Runtime Validation & Healing', dependsOn: ['scaffold'],   baseCostTokens: 2000,  baseDurationMs: 30000,  parallelizable: false, retryable: true,  rollbackRequired: false },
];

// For simple builds, trim optional enrichment tasks
const SIMPLE_SKIP_IDS: Set<TaskId> = new Set([
  'ux-intel', 'critic', 'conversion', 'accessibility', 'optimization', 'director',
]);

// For enterprise builds, add weight to repair + validation
const ENTERPRISE_WEIGHT = 1.5;

export function buildTaskGraph(ctx: ExecutionIntelligenceContext): TaskGraph {
  const isSimple = ctx.complexity === 'simple';
  const isEnterprise = ctx.complexity === 'enterprise';

  const defs = isSimple
    ? PIPELINE_TASK_DEFS.filter(d => !SIMPLE_SKIP_IDS.has(d.id))
    : PIPELINE_TASK_DEFS;

  const definedIds = new Set(defs.map(d => d.id));

  const tasks: ExecutionTask[] = defs.map(def => {
    const costMultiplier = isEnterprise ? ENTERPRISE_WEIGHT : 1;
    const priorityScore = computePriorityScore(def, ctx);
    const retryConfig = computeRetryConfig(def.id, def.retryable);
    const timeoutConfig = computeTimeoutConfig(def.id, def.baseDurationMs, ctx.complexity);

    // Filter dependsOn to only existing tasks (simple builds trim some)
    const filteredDeps = def.dependsOn.filter(d => definedIds.has(d));

    return {
      id: def.id,
      name: def.name,
      dependsOn: filteredDeps,
      priority: toPriorityLabel(priorityScore),
      priorityScore,
      estimatedCostTokens: Math.round(def.baseCostTokens * costMultiplier),
      estimatedTimeMs: Math.round(def.baseDurationMs * costMultiplier),
      parallelizable: def.parallelizable,
      retryable: def.retryable,
      timeout: timeoutConfig,
      rollbackRequired: def.rollbackRequired,
      isCritical: false,   // set by criticalPathPlanner
      isBlocking: false,   // set by dependencyResolver
    };
  });

  const taskMap: Record<TaskId, ExecutionTask> = {};
  for (const t of tasks) taskMap[t.id] = t;

  const dependencyAnalysis = resolveDependencies(tasks);

  // Topological sort (Kahn's algorithm)
  const inDegree: Record<TaskId, number> = {};
  const adjacency: Record<TaskId, TaskId[]> = {};
  for (const t of tasks) {
    inDegree[t.id] = t.dependsOn.length;
    adjacency[t.id] = [];
  }
  for (const t of tasks) {
    for (const dep of t.dependsOn) {
      if (adjacency[dep]) adjacency[dep].push(t.id);
    }
  }
  const queue = tasks.filter(t => inDegree[t.id] === 0).map(t => t.id);
  const topologicalOrder: TaskId[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    topologicalOrder.push(cur);
    for (const next of (adjacency[cur] ?? [])) {
      inDegree[next] -= 1;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  // Mark blocking tasks
  for (const t of tasks) {
    let dependentsCount = 0;
    for (const other of tasks) {
      if (other.dependsOn.includes(t.id)) dependentsCount++;
    }
    taskMap[t.id].isBlocking = dependentsCount > 1;
  }

  return {
    tasks,
    taskMap,
    topologicalOrder,
    dependencyAnalysis,
    totalTasks: tasks.length,
    parallelizableTasks: tasks.filter(t => t.parallelizable).length,
    criticalTasks: 0,  // set after criticalPathPlanner runs
  };
}
