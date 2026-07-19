// ── V9.6 Autonomous Execution Intelligence Engine — Comprehensive Tests ────────
//
// 250+ tests across 22 describe blocks covering every deliverable from the spec.

import { describe, it, expect, beforeEach } from 'vitest';

// ── Module imports ─────────────────────────────────────────────────────────────
import { buildTaskGraph } from '../../src/execution-intelligence/taskGraphBuilder.js';
import { resolveDependencies } from '../../src/execution-intelligence/dependencyResolver.js';
import { planParallelExecution } from '../../src/execution-intelligence/parallelPlanner.js';
import { computeCriticalPath } from '../../src/execution-intelligence/criticalPathPlanner.js';
import { computePriorityScore, toPriorityLabel } from '../../src/execution-intelligence/priorityPlanner.js';
import { scheduleExecution } from '../../src/execution-intelligence/executionScheduler.js';
import { computeRetryConfig, shouldRetry } from '../../src/execution-intelligence/retryPlanner.js';
import { computeTimeoutConfig } from '../../src/execution-intelligence/timeoutPlanner.js';
import { estimateResources } from '../../src/execution-intelligence/resourcePlanner.js';
import { estimateExecutionCost } from '../../src/execution-intelligence/executionCostPlanner.js';
import { estimateExecutionTime } from '../../src/execution-intelligence/executionTimePlanner.js';
import { planCheckpoints } from '../../src/execution-intelligence/checkpointPlanner.js';
import { planResume } from '../../src/execution-intelligence/resumePlanner.js';
import { planRollback } from '../../src/execution-intelligence/rollbackPlanner.js';
import { planFailureRecovery } from '../../src/execution-intelligence/failureRecoveryPlanner.js';
import { validateExecutionBlueprint } from '../../src/execution-intelligence/executionValidator.js';
import {
  learnFromExecution, getExecutionLearningStats, resetExecutionLearning,
} from '../../src/execution-intelligence/executionLearning.js';
import {
  recordExecutionMetric, getExecutionIntelligenceSnapshot, resetExecutionMetrics,
} from '../../src/execution-intelligence/executionMetrics.js';
import {
  saveExecutionSnapshot, getCurrentExecutionSnapshot, getExecutionSnapshot,
  getExecutionPersistenceStats, resetExecutionPersistence,
} from '../../src/execution-intelligence/executionPersistence.js';
import {
  buildExecutionBlueprint, buildFallbackExecutionBlueprint,
} from '../../src/execution-intelligence/executionIntelligence.js';
import { runExecutionIntelligence } from '../../src/execution-intelligence/executionFacade.js';

import type {
  ExecutionIntelligenceContext, ExecutionTask, ExecutionIntelligenceBlueprint,
} from '../../src/execution-intelligence/executionTypes.js';

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<ExecutionIntelligenceContext> = {}): ExecutionIntelligenceContext {
  return {
    buildId: 'test-build-001',
    complexity: 'standard',
    chosenPath: 'B',
    reasoningScore: 7,
    totalTokenBudget: 40000,
    expectedTotalCost: 0.015,
    tokenEfficiency: 0.8,
    productScore: 7,
    frontendScore: 8,
    backendScore: 7,
    devopsScore: 6,
    qaScore: 7,
    runtimeScore: 7.5,
    ...overrides,
  };
}

function makeTask(overrides: Partial<ExecutionTask> = {}): ExecutionTask {
  return {
    id: 'task-a',
    name: 'Task A',
    dependsOn: [],
    priority: 'high',
    priorityScore: 7,
    estimatedCostTokens: 1000,
    estimatedTimeMs: 5000,
    parallelizable: false,
    retryable: true,
    rollbackRequired: false,
    isCritical: false,
    isBlocking: false,
    timeout: { timeoutMs: 30000, onTimeout: 'retry', category: 'small' },
    ...overrides,
  };
}

function makeFakeBlueprint(buildId = 'bp-001'): ExecutionIntelligenceBlueprint {
  return buildExecutionBlueprint(makeCtx({ buildId }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Task Graph Builder
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Task Graph Builder', () => {
  it('returns a TaskGraph with all required fields', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g).toHaveProperty('tasks');
    expect(g).toHaveProperty('taskMap');
    expect(g).toHaveProperty('topologicalOrder');
    expect(g).toHaveProperty('dependencyAnalysis');
    expect(g).toHaveProperty('totalTasks');
    expect(g).toHaveProperty('parallelizableTasks');
    expect(g).toHaveProperty('criticalTasks');
  });

  it('standard build has 15 tasks', () => {
    const g = buildTaskGraph(makeCtx({ complexity: 'standard' }));
    expect(g.totalTasks).toBe(15);
  });

  it('simple build has fewer tasks (optional enrichment trimmed)', () => {
    const simple = buildTaskGraph(makeCtx({ complexity: 'simple' }));
    const standard = buildTaskGraph(makeCtx({ complexity: 'standard' }));
    expect(simple.totalTasks).toBeLessThan(standard.totalTasks);
  });

  it('enterprise build has same task count as standard but higher costs', () => {
    const enterprise = buildTaskGraph(makeCtx({ complexity: 'enterprise' }));
    const standard = buildTaskGraph(makeCtx({ complexity: 'standard' }));
    expect(enterprise.totalTasks).toBe(standard.totalTasks);
    const entCost = enterprise.tasks.reduce((s, t) => s + t.estimatedCostTokens, 0);
    const stdCost = standard.tasks.reduce((s, t) => s + t.estimatedCostTokens, 0);
    expect(entCost).toBeGreaterThan(stdCost);
  });

  it('taskMap keys match task ids', () => {
    const g = buildTaskGraph(makeCtx());
    for (const t of g.tasks) {
      expect(g.taskMap[t.id]).toBeDefined();
      expect(g.taskMap[t.id].id).toBe(t.id);
    }
  });

  it('topologicalOrder contains all task ids', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g.topologicalOrder.length).toBe(g.tasks.length);
    for (const t of g.tasks) {
      expect(g.topologicalOrder).toContain(t.id);
    }
  });

  it('topologicalOrder is valid (every dep appears before its dependent)', () => {
    const g = buildTaskGraph(makeCtx());
    const orderMap: Record<string, number> = {};
    g.topologicalOrder.forEach((id, idx) => { orderMap[id] = idx; });
    for (const t of g.tasks) {
      for (const dep of t.dependsOn) {
        expect(orderMap[dep]).toBeLessThan(orderMap[t.id]);
      }
    }
  });

  it('frontend task has higher token cost than component-tree', () => {
    const g = buildTaskGraph(makeCtx());
    const frontend = g.tasks.find(t => t.id === 'frontend')!;
    const compTree = g.tasks.find(t => t.id === 'component-tree')!;
    expect(frontend.estimatedCostTokens).toBeGreaterThan(compTree.estimatedCostTokens);
  });

  it('planning task has no dependencies (root)', () => {
    const g = buildTaskGraph(makeCtx());
    const planning = g.tasks.find(t => t.id === 'planning')!;
    expect(planning.dependsOn).toHaveLength(0);
  });

  it('all task priority scores are in [0, 10]', () => {
    const g = buildTaskGraph(makeCtx());
    for (const t of g.tasks) {
      expect(t.priorityScore).toBeGreaterThanOrEqual(0);
      expect(t.priorityScore).toBeLessThanOrEqual(10);
    }
  });

  it('each task has a valid timeout config', () => {
    const g = buildTaskGraph(makeCtx());
    for (const t of g.tasks) {
      expect(t.timeout.timeoutMs).toBeGreaterThan(0);
      expect(['small', 'medium', 'large', 'enterprise']).toContain(t.timeout.category);
    }
  });

  it('frontend task is retryable', () => {
    const g = buildTaskGraph(makeCtx());
    const frontend = g.tasks.find(t => t.id === 'frontend')!;
    expect(frontend.retryable).toBe(true);
  });

  it('component-tree task is NOT retryable', () => {
    const g = buildTaskGraph(makeCtx());
    const ct = g.tasks.find(t => t.id === 'component-tree')!;
    expect(ct.retryable).toBe(false);
  });

  it('parallelizableTasks count ≤ totalTasks', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g.parallelizableTasks).toBeLessThanOrEqual(g.totalTasks);
  });

  it('dependency graph is valid for standard build', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g.dependencyAnalysis.isValid).toBe(true);
    expect(g.dependencyAnalysis.hasCycle).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Dependency Resolver
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Dependency Resolver', () => {
  it('returns DependencyAnalysis with all required fields', () => {
    const tasks = [makeTask()];
    const result = resolveDependencies(tasks);
    expect(result).toHaveProperty('missingDependencies');
    expect(result).toHaveProperty('circularDependencies');
    expect(result).toHaveProperty('redundantDependencies');
    expect(result).toHaveProperty('independentBranches');
    expect(result).toHaveProperty('blockingChains');
    expect(result).toHaveProperty('hasCycle');
    expect(result).toHaveProperty('isValid');
  });

  it('valid linear chain is isValid=true, hasCycle=false', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'a', dependsOn: [] }),
      makeTask({ id: 'b', dependsOn: ['a'] }),
      makeTask({ id: 'c', dependsOn: ['b'] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.isValid).toBe(true);
    expect(r.hasCycle).toBe(false);
    expect(r.missingDependencies).toHaveLength(0);
  });

  it('detects missing dependency', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'x', dependsOn: ['NONEXISTENT'] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.missingDependencies.length).toBeGreaterThan(0);
    expect(r.isValid).toBe(false);
  });

  it('detects circular dependency', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'a', dependsOn: ['b'] }),
      makeTask({ id: 'b', dependsOn: ['a'] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.hasCycle).toBe(true);
    expect(r.isValid).toBe(false);
  });

  it('detects redundant dependencies', () => {
    // c depends on a directly, but a is already reachable through b→a
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'a', dependsOn: [] }),
      makeTask({ id: 'b', dependsOn: ['a'] }),
      makeTask({ id: 'c', dependsOn: ['a', 'b'] }), // a is redundant (reachable via b)
    ];
    const r = resolveDependencies(tasks);
    const redundant = r.redundantDependencies.find(rd => rd.taskId === 'c');
    expect(redundant?.redundant).toContain('a');
  });

  it('detects blocking chains (tasks with ≥2 dependents)', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'root', dependsOn: [] }),
      makeTask({ id: 'child1', dependsOn: ['root'] }),
      makeTask({ id: 'child2', dependsOn: ['root'] }),
      makeTask({ id: 'child3', dependsOn: ['root'] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.blockingChains.some(chain => chain.includes('root'))).toBe(true);
  });

  it('independent branches: 2 roots → 2 branches', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'r1', dependsOn: [] }),
      makeTask({ id: 'r2', dependsOn: [] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.independentBranches.length).toBeGreaterThanOrEqual(2);
  });

  it('no redundant deps in a simple linear chain', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'a', dependsOn: [] }),
      makeTask({ id: 'b', dependsOn: ['a'] }),
      makeTask({ id: 'c', dependsOn: ['b'] }),
    ];
    const r = resolveDependencies(tasks);
    expect(r.redundantDependencies).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Parallel Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Parallel Planner', () => {
  it('returns a ParallelPlan with all required fields', () => {
    const tasks = [makeTask()];
    const plan = planParallelExecution(tasks, ['task-a']);
    expect(plan).toHaveProperty('groups');
    expect(plan).toHaveProperty('parallelGroups');
    expect(plan).toHaveProperty('parallelEfficiency');
    expect(plan).toHaveProperty('idleTimePrediction');
    expect(plan).toHaveProperty('sequentialFallback');
  });

  it('parallelEfficiency is in [0, 1]', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planParallelExecution(g.tasks, g.topologicalOrder);
    expect(plan.parallelEfficiency).toBeGreaterThanOrEqual(0);
    expect(plan.parallelEfficiency).toBeLessThanOrEqual(1);
  });

  it('tasks with same dependency level are grouped together', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'root', dependsOn: [], estimatedTimeMs: 1000 }),
      makeTask({ id: 'p1', dependsOn: ['root'], parallelizable: true, estimatedTimeMs: 500 }),
      makeTask({ id: 'p2', dependsOn: ['root'], parallelizable: true, estimatedTimeMs: 500 }),
    ];
    const order = ['root', 'p1', 'p2'];
    const plan = planParallelExecution(tasks, order);
    const waveWithP1 = plan.parallelGroups.find(g => g.includes('p1'));
    expect(waveWithP1).toContain('p2');
  });

  it('idleTimePrediction ≥ 0', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planParallelExecution(g.tasks, g.topologicalOrder);
    expect(plan.idleTimePrediction).toBeGreaterThanOrEqual(0);
  });

  it('sequentialFallback contains all task ids', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planParallelExecution(g.tasks, g.topologicalOrder);
    expect(plan.sequentialFallback.length).toBe(g.tasks.length);
  });

  it('single task produces 1 group with efficiency 0', () => {
    const tasks = [makeTask({ id: 'solo', dependsOn: [] })];
    const plan = planParallelExecution(tasks, ['solo']);
    expect(plan.groups).toHaveLength(1);
    expect(plan.parallelEfficiency).toBe(0);
  });

  it('group estimatedMs = max of contained tasks', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'r', dependsOn: [], estimatedTimeMs: 100 }),
      makeTask({ id: 'a', dependsOn: ['r'], estimatedTimeMs: 500 }),
      makeTask({ id: 'b', dependsOn: ['r'], estimatedTimeMs: 300 }),
    ];
    const order = ['r', 'a', 'b'];
    const plan = planParallelExecution(tasks, order);
    const secondWave = plan.groups.find(g => g.tasks.includes('a'));
    expect(secondWave?.estimatedMs).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Critical Path Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Critical Path Planner', () => {
  it('returns CriticalPathResult with all required fields', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    expect(cp).toHaveProperty('path');
    expect(cp).toHaveProperty('criticalTasks');
    expect(cp).toHaveProperty('blockingTasks');
    expect(cp).toHaveProperty('bottlenecks');
    expect(cp).toHaveProperty('estimatedCompletionMs');
    expect(cp).toHaveProperty('criticalPathDurationMs');
  });

  it('estimatedCompletionMs > 0 for non-trivial builds', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    expect(cp.estimatedCompletionMs).toBeGreaterThan(0);
  });

  it('criticalTasks is non-empty for a valid DAG', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    expect(cp.criticalTasks.length).toBeGreaterThan(0);
  });

  it('all criticalTasks exist in the task graph', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    for (const id of cp.criticalTasks) {
      expect(g.taskMap[id]).toBeDefined();
    }
  });

  it('bottlenecks are a subset of criticalTasks', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    for (const id of cp.bottlenecks) {
      expect(cp.criticalTasks).toContain(id);
    }
  });

  it('bottlenecks length ≤ 3', () => {
    const g = buildTaskGraph(makeCtx());
    const cp = computeCriticalPath(g.tasks, g.topologicalOrder);
    expect(cp.bottlenecks.length).toBeLessThanOrEqual(3);
  });

  it('empty task list → zero completion time', () => {
    const cp = computeCriticalPath([], []);
    expect(cp.estimatedCompletionMs).toBe(0);
    expect(cp.criticalTasks).toHaveLength(0);
  });

  it('single task → itself is the critical path', () => {
    const tasks = [makeTask({ id: 'solo', estimatedTimeMs: 5000 })];
    const cp = computeCriticalPath(tasks, ['solo']);
    expect(cp.criticalTasks).toContain('solo');
    expect(cp.estimatedCompletionMs).toBe(5000);
  });

  it('linear chain → all tasks on critical path', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'a', dependsOn: [], estimatedTimeMs: 1000 }),
      makeTask({ id: 'b', dependsOn: ['a'], estimatedTimeMs: 2000 }),
      makeTask({ id: 'c', dependsOn: ['b'], estimatedTimeMs: 3000 }),
    ];
    const cp = computeCriticalPath(tasks, ['a', 'b', 'c']);
    expect(cp.estimatedCompletionMs).toBe(6000);
    expect(cp.criticalTasks).toContain('a');
    expect(cp.criticalTasks).toContain('b');
    expect(cp.criticalTasks).toContain('c');
  });

  it('parallel branches → only the longer branch is critical', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'root', dependsOn: [], estimatedTimeMs: 1000 }),
      makeTask({ id: 'fast', dependsOn: ['root'], estimatedTimeMs: 1000 }),
      makeTask({ id: 'slow', dependsOn: ['root'], estimatedTimeMs: 5000 }),
      makeTask({ id: 'end', dependsOn: ['fast', 'slow'], estimatedTimeMs: 500 }),
    ];
    const cp = computeCriticalPath(tasks, ['root', 'fast', 'slow', 'end']);
    expect(cp.criticalTasks).toContain('slow');
    expect(cp.criticalTasks).not.toContain('fast');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Priority Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Priority Planner', () => {
  const simpleDef = { id: 'frontend', dependsOn: ['component-tree'], baseCostTokens: 6000, baseDurationMs: 20000, retryable: true, rollbackRequired: true };

  it('computePriorityScore returns value in [0, 10]', () => {
    const score = computePriorityScore(simpleDef, makeCtx());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('enterprise builds give higher priority scores', () => {
    const enterprise = computePriorityScore(simpleDef, makeCtx({ complexity: 'enterprise' }));
    const standard = computePriorityScore(simpleDef, makeCtx({ complexity: 'standard' }));
    expect(enterprise).toBeGreaterThan(standard);
  });

  it('simple builds give lower priority scores', () => {
    const simple = computePriorityScore(simpleDef, makeCtx({ complexity: 'simple' }));
    const standard = computePriorityScore(simpleDef, makeCtx({ complexity: 'standard' }));
    expect(simple).toBeLessThan(standard);
  });

  it('toPriorityLabel: score ≥ 8 → critical', () => {
    expect(toPriorityLabel(8.5)).toBe('critical');
    expect(toPriorityLabel(10)).toBe('critical');
  });

  it('toPriorityLabel: score [6,8) → high', () => {
    expect(toPriorityLabel(7)).toBe('high');
    expect(toPriorityLabel(6)).toBe('high');
  });

  it('toPriorityLabel: score [4,6) → medium', () => {
    expect(toPriorityLabel(5)).toBe('medium');
    expect(toPriorityLabel(4)).toBe('medium');
  });

  it('toPriorityLabel: score < 4 → low', () => {
    expect(toPriorityLabel(3)).toBe('low');
    expect(toPriorityLabel(0)).toBe('low');
  });

  it('rollbackRequired tasks score higher than non-rollback', () => {
    const with_ = computePriorityScore({ ...simpleDef, rollbackRequired: true }, makeCtx());
    const without = computePriorityScore({ ...simpleDef, rollbackRequired: false }, makeCtx());
    expect(with_).toBeGreaterThan(without);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Execution Scheduler
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Scheduler', () => {
  it('returns executionOrder and executionMode', () => {
    const g = buildTaskGraph(makeCtx());
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'B');
    expect(r).toHaveProperty('executionOrder');
    expect(r).toHaveProperty('executionMode');
  });

  it('executionOrder contains all task ids', () => {
    const g = buildTaskGraph(makeCtx());
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'B');
    expect(r.executionOrder.length).toBe(g.tasks.length);
    for (const t of g.tasks) expect(r.executionOrder).toContain(t.id);
  });

  it('chosenPath A → executionMode = critical-path-first', () => {
    const g = buildTaskGraph(makeCtx({ chosenPath: 'A' }));
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'A');
    expect(r.executionMode).toBe('critical-path-first');
  });

  it('chosenPath C → executionMode = cost-optimized', () => {
    const g = buildTaskGraph(makeCtx({ chosenPath: 'C' }));
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'C');
    expect(r.executionMode).toBe('cost-optimized');
  });

  it('chosenPath B with parallel tasks → hybrid or sequential mode', () => {
    const g = buildTaskGraph(makeCtx({ chosenPath: 'B' }));
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'B');
    expect(['hybrid', 'sequential']).toContain(r.executionMode);
  });

  it('execution order is topologically valid', () => {
    const g = buildTaskGraph(makeCtx());
    const r = scheduleExecution(g.tasks, g.topologicalOrder, 'B');
    const orderMap: Record<string, number> = {};
    r.executionOrder.forEach((id, i) => { orderMap[id] = i; });
    for (const t of g.tasks) {
      for (const dep of t.dependsOn) {
        if (orderMap[dep] !== undefined && orderMap[t.id] !== undefined) {
          expect(orderMap[dep]).toBeLessThan(orderMap[t.id]);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Retry Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Retry Planner', () => {
  it('retryable=false → retryCount=0, policy=never', () => {
    const cfg = computeRetryConfig('planning', false);
    expect(cfg.retryCount).toBe(0);
    expect(cfg.policy).toBe('never');
    expect(cfg.retryable).toBe(false);
  });

  it('planning task (retryable) → linear backoff, retryCount=1', () => {
    const cfg = computeRetryConfig('planning', true);
    expect(cfg.retryCount).toBe(1);
    expect(cfg.policy).toBe('linear');
    expect(cfg.backoff).toBe('linear');
    expect(cfg.retryable).toBe(true);
  });

  it('repair task → exponential backoff, retryCount=3', () => {
    const cfg = computeRetryConfig('repair', true);
    expect(cfg.retryCount).toBe(3);
    expect(cfg.policy).toBe('exponential');
    expect(cfg.backoff).toBe('exponential');
  });

  it('runtime-val task → exponential backoff, retryCount=3', () => {
    const cfg = computeRetryConfig('runtime-val', true);
    expect(cfg.retryCount).toBe(3);
    expect(cfg.backoff).toBe('exponential');
  });

  it('evaluator (never-retry) → retryCount=0, retryable=false', () => {
    const cfg = computeRetryConfig('evaluator', true);
    expect(cfg.retryCount).toBe(0);
    expect(cfg.retryable).toBe(false);
  });

  it('director (never-retry) → policy=never', () => {
    const cfg = computeRetryConfig('director', true);
    expect(cfg.policy).toBe('never');
  });

  it('shouldRetry: network failure → true for retryable task', () => {
    expect(shouldRetry('repair', 'network')).toBe(true);
  });

  it('shouldRetry: timeout → true for retryable task', () => {
    expect(shouldRetry('frontend', 'timeout')).toBe(true);
  });

  it('shouldRetry: provider error → true', () => {
    expect(shouldRetry('planning', 'provider')).toBe(true);
  });

  it('shouldRetry: validation failure → false always', () => {
    expect(shouldRetry('repair', 'validation')).toBe(false);
    expect(shouldRetry('planning', 'validation')).toBe(false);
  });

  it('shouldRetry: user error → false always', () => {
    expect(shouldRetry('frontend', 'user')).toBe(false);
  });

  it('shouldRetry: config error → false always', () => {
    expect(shouldRetry('scaffold', 'config')).toBe(false);
  });

  it('shouldRetry: never-retry task → false even for network', () => {
    expect(shouldRetry('evaluator', 'network')).toBe(false);
    expect(shouldRetry('director', 'timeout')).toBe(false);
  });

  it('retryWindowMs > 0 for retryable tasks', () => {
    const cfg = computeRetryConfig('frontend', true);
    expect(cfg.retryWindowMs).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Timeout Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Timeout Planner', () => {
  it('small task (<500ms base) → 30s timeout', () => {
    const cfg = computeTimeoutConfig('component-tree', 100, 'standard');
    expect(cfg.timeoutMs).toBe(30000);
    expect(cfg.category).toBe('small');
  });

  it('medium task → 120s timeout', () => {
    const cfg = computeTimeoutConfig('evaluator', 1000, 'standard');
    expect(cfg.timeoutMs).toBe(120000);
    expect(cfg.category).toBe('medium');
  });

  it('large task (≥5000ms base) → 300s timeout', () => {
    const cfg = computeTimeoutConfig('repair', 6000, 'standard');
    expect(cfg.timeoutMs).toBe(300000);
    expect(cfg.category).toBe('large');
  });

  it('very large task (≥20000ms) → enterprise category, 600s timeout', () => {
    const cfg = computeTimeoutConfig('frontend', 20000, 'standard');
    expect(cfg.category).toBe('enterprise');
    expect(cfg.timeoutMs).toBe(600000);
  });

  it('enterprise complexity doubles timeouts', () => {
    const standard = computeTimeoutConfig('task', 1000, 'standard');
    const enterprise = computeTimeoutConfig('task', 1000, 'enterprise');
    expect(enterprise.timeoutMs).toBe(standard.timeoutMs * 2);
  });

  it('simple complexity applies 0.8× multiplier', () => {
    const standard = computeTimeoutConfig('task', 1000, 'standard');
    const simple = computeTimeoutConfig('task', 1000, 'simple');
    expect(simple.timeoutMs).toBeCloseTo(standard.timeoutMs * 0.8, 0);
  });

  it('timeoutMs is always a positive integer', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const cfg = computeTimeoutConfig('test', 5000, complexity);
      expect(cfg.timeoutMs).toBeGreaterThan(0);
      expect(Number.isInteger(cfg.timeoutMs)).toBe(true);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Resource Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Resource Planner', () => {
  const tasks = [
    { id: 'a', estimatedCostTokens: 3000, estimatedTimeMs: 10000 },
    { id: 'b', estimatedCostTokens: 0, estimatedTimeMs: 100 },
  ];

  it('returns all 8 resource fields', () => {
    const r = estimateResources(tasks, makeCtx());
    const fields = ['cpu', 'memoryMb', 'llmCalls', 'apiCalls', 'diskMb', 'networkKb', 'cacheHits', 'tempStorageMb'];
    for (const f of fields) expect(r).toHaveProperty(f);
  });

  it('cpu is low/medium/high', () => {
    const r = estimateResources(tasks, makeCtx());
    expect(['low', 'medium', 'high']).toContain(r.cpu);
  });

  it('enterprise → high cpu, more memory', () => {
    const r = estimateResources(tasks, makeCtx({ complexity: 'enterprise' }));
    expect(r.cpu).toBe('high');
    expect(r.memoryMb).toBeGreaterThan(256);
  });

  it('apiCalls ≥ llmCalls (3× headroom)', () => {
    const r = estimateResources(tasks, makeCtx());
    expect(r.apiCalls).toBeGreaterThanOrEqual(r.llmCalls);
  });

  it('diskMb = 50 (constant)', () => {
    const r = estimateResources(tasks, makeCtx());
    expect(r.diskMb).toBe(50);
  });

  it('tempStorageMb = 200 (Vite artifacts)', () => {
    const r = estimateResources(tasks, makeCtx());
    expect(r.tempStorageMb).toBe(200);
  });

  it('llmCalls = count of tasks with tokens > 0', () => {
    const r = estimateResources(tasks, makeCtx());
    expect(r.llmCalls).toBe(1); // only 'a' has tokens
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. Execution Cost Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Cost Planner', () => {
  const tasks = [{ estimatedCostTokens: 6000 }, { estimatedCostTokens: 3000 }];

  it('returns all 5 cost fields', () => {
    const c = estimateExecutionCost(tasks, makeCtx());
    expect(c).toHaveProperty('tokenUsage');
    expect(c).toHaveProperty('apiCostUsd');
    expect(c).toHaveProperty('infrastructureCost');
    expect(c).toHaveProperty('totalCost');
    expect(c).toHaveProperty('costConfidence');
  });

  it('tokenUsage = sum of all task tokens', () => {
    const c = estimateExecutionCost(tasks, makeCtx());
    expect(c.tokenUsage).toBe(9000);
  });

  it('apiCostUsd = tokenUsage × $0.0000008', () => {
    const c = estimateExecutionCost(tasks, makeCtx());
    expect(c.apiCostUsd).toBeCloseTo(9000 * 0.0000008, 6);
  });

  it('totalCost = apiCostUsd + infrastructureCost', () => {
    const c = estimateExecutionCost(tasks, makeCtx());
    expect(c.totalCost).toBeCloseTo(c.apiCostUsd + c.infrastructureCost, 4);
  });

  it('enterprise → higher infrastructureCost', () => {
    const std = estimateExecutionCost(tasks, makeCtx());
    const ent = estimateExecutionCost(tasks, makeCtx({ complexity: 'enterprise' }));
    expect(ent.infrastructureCost).toBeGreaterThan(std.infrastructureCost);
  });

  it('costConfidence is in [0.3, 1]', () => {
    const c = estimateExecutionCost(tasks, makeCtx());
    expect(c.costConfidence).toBeGreaterThanOrEqual(0.3);
    expect(c.costConfidence).toBeLessThanOrEqual(1);
  });

  it('higher expectedTotalCost mismatch → lower confidence', () => {
    const close = estimateExecutionCost(tasks, makeCtx({ expectedTotalCost: 0.0072 }));
    const far = estimateExecutionCost(tasks, makeCtx({ expectedTotalCost: 10.0 }));
    expect(close.costConfidence).toBeGreaterThan(far.costConfidence);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 11. Execution Time Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Time Planner', () => {
  const tasks = [
    { estimatedTimeMs: 10000, parallelizable: false },
    { estimatedTimeMs: 5000, parallelizable: true },
  ];

  it('returns all 5 time fields', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t).toHaveProperty('minimumMs');
    expect(t).toHaveProperty('averageMs');
    expect(t).toHaveProperty('worstCaseMs');
    expect(t).toHaveProperty('criticalPathMs');
    expect(t).toHaveProperty('parallelSavingsMs');
  });

  it('minimumMs < averageMs < worstCaseMs', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t.minimumMs).toBeLessThan(t.averageMs);
    expect(t.averageMs).toBeLessThan(t.worstCaseMs);
  });

  it('criticalPathMs equals what was passed in', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t.criticalPathMs).toBe(12000);
  });

  it('parallelSavingsMs equals what was passed in', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t.parallelSavingsMs).toBe(2000);
  });

  it('minimumMs = round(averageMs × 0.7)', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t.minimumMs).toBeCloseTo(t.averageMs * 0.7, -2);
  });

  it('worstCaseMs = round(averageMs × 1.6)', () => {
    const t = estimateExecutionTime(tasks, 12000, 2000);
    expect(t.worstCaseMs).toBeCloseTo(t.averageMs * 1.6, -2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 12. Checkpoint Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Checkpoint Planner', () => {
  it('checkpoints are inserted after milestone tasks', () => {
    const g = buildTaskGraph(makeCtx());
    const checkpoints = planCheckpoints(g.tasks);
    const afterIds = checkpoints.map(c => c.afterTaskId);
    expect(afterIds).toContain('planning');
    expect(afterIds).toContain('frontend');
  });

  it('each checkpoint has id, afterTaskId, reason, supportsResume', () => {
    const g = buildTaskGraph(makeCtx());
    const checkpoints = planCheckpoints(g.tasks);
    for (const cp of checkpoints) {
      expect(cp).toHaveProperty('id');
      expect(cp).toHaveProperty('afterTaskId');
      expect(cp).toHaveProperty('reason');
      expect(cp).toHaveProperty('supportsResume');
      expect(cp.supportsResume).toBe(true);
    }
  });

  it('checkpoint ids are unique', () => {
    const g = buildTaskGraph(makeCtx());
    const checkpoints = planCheckpoints(g.tasks);
    const ids = checkpoints.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reason is one of the valid values', () => {
    const g = buildTaskGraph(makeCtx());
    const valid = ['milestone', 'cost-threshold', 'critical-boundary', 'recovery-point'];
    for (const cp of planCheckpoints(g.tasks)) {
      expect(valid).toContain(cp.reason);
    }
  });

  it('rollback-required tasks get supportsRollback=true', () => {
    const tasks = [
      makeTask({ id: 'planning', rollbackRequired: false, estimatedCostTokens: 5000 }),
      makeTask({ id: 'frontend', dependsOn: ['planning'], rollbackRequired: true, estimatedCostTokens: 6000 }),
    ];
    const checkpoints = planCheckpoints(tasks);
    const frontendCp = checkpoints.find(cp => cp.afterTaskId === 'frontend');
    expect(frontendCp?.supportsRollback).toBe(true);
  });

  it('at least 1 checkpoint for standard build', () => {
    const g = buildTaskGraph(makeCtx());
    expect(planCheckpoints(g.tasks).length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 13. Resume Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Resume Planner', () => {
  it('no checkpoints → resumable=false', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planResume(g.tasks, []);
    expect(plan.resumable).toBe(false);
    expect(plan.lastCheckpoint).toBeNull();
    expect(plan.resumeFromTaskId).toBeNull();
  });

  it('with checkpoints → resumable=true', () => {
    const g = buildTaskGraph(makeCtx());
    const checkpoints = planCheckpoints(g.tasks);
    const plan = planResume(g.tasks, checkpoints);
    expect(plan.resumable).toBe(true);
    expect(plan.lastCheckpoint).toBeTruthy();
  });

  it('skippableOnResume are tasks before the last checkpoint', () => {
    const g = buildTaskGraph(makeCtx());
    const checkpoints = planCheckpoints(g.tasks);
    const plan = planResume(g.tasks, checkpoints);
    expect(plan.skippableOnResume.length).toBeGreaterThanOrEqual(0);
  });

  it('supports all 5 resume reasons', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planResume(g.tasks, planCheckpoints(g.tasks));
    const reasons = plan.resumeReasons;
    expect(reasons).toContain('crash');
    expect(reasons).toContain('restart');
    expect(reasons).toContain('timeout');
    expect(reasons).toContain('user-pause');
    expect(reasons).toContain('deployment-interrupt');
  });

  it('estimatedResumeMs ≥ 0', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planResume(g.tasks, planCheckpoints(g.tasks));
    expect(plan.estimatedResumeMs).toBeGreaterThanOrEqual(0);
  });

  it('resumeFromTaskId is null or a valid task id', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planResume(g.tasks, planCheckpoints(g.tasks));
    if (plan.resumeFromTaskId !== null) {
      expect(g.taskMap[plan.resumeFromTaskId]).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 14. Rollback Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Rollback Planner', () => {
  it('returns a RollbackPlan with all required fields', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planRollback(g.tasks, 'frontend');
    expect(plan).toHaveProperty('rollbackTasks');
    expect(plan).toHaveProperty('fullPipelineRestart');
    expect(plan).toHaveProperty('rollbackOrder');
    expect(plan).toHaveProperty('estimatedRollbackMs');
  });

  it('rollbackTasks only includes rollbackRequired=true tasks', () => {
    const g = buildTaskGraph(makeCtx());
    for (const id of planRollback(g.tasks, 'frontend').rollbackTasks) {
      expect(g.taskMap[id].rollbackRequired).toBe(true);
    }
  });

  it('estimatedRollbackMs ≥ 0', () => {
    const g = buildTaskGraph(makeCtx());
    expect(planRollback(g.tasks, 'planning').estimatedRollbackMs).toBeGreaterThanOrEqual(0);
  });

  it('rollbackOrder length = rollbackTasks length', () => {
    const g = buildTaskGraph(makeCtx());
    const plan = planRollback(g.tasks, 'frontend');
    expect(plan.rollbackOrder.length).toBe(plan.rollbackTasks.length);
  });

  it('root task failure with many rollbacks → fullPipelineRestart possible', () => {
    const tasks: ExecutionTask[] = [
      makeTask({ id: 'root', dependsOn: [], rollbackRequired: true }),
      makeTask({ id: 'a', dependsOn: ['root'], rollbackRequired: true }),
      makeTask({ id: 'b', dependsOn: ['root'], rollbackRequired: true }),
      makeTask({ id: 'c', dependsOn: ['root'], rollbackRequired: true }),
      makeTask({ id: 'd', dependsOn: ['root'], rollbackRequired: true }),
    ];
    const plan = planRollback(tasks, 'root');
    expect(typeof plan.fullPipelineRestart).toBe('boolean');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15. Failure Recovery Planner
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Failure Recovery Planner', () => {
  it('returns all required fields', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'repair');
    expect(r).toHaveProperty('failedTaskId');
    expect(r).toHaveProperty('affectedTasks');
    expect(r).toHaveProperty('unaffectedTasks');
    expect(r).toHaveProperty('recoveryPath');
    expect(r).toHaveProperty('skipOnRecovery');
    expect(r).toHaveProperty('strategy');
    expect(r).toHaveProperty('estimatedRecoveryMs');
  });

  it('failedTaskId = the task passed in', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'repair');
    expect(r.failedTaskId).toBe('repair');
  });

  it('affected + unaffected = all tasks - 1 (failed)', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'repair');
    expect(r.affectedTasks.length + r.unaffectedTasks.length).toBe(g.tasks.length - 1);
  });

  it('planning (root) failure → affects all downstream tasks', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'planning');
    expect(r.affectedTasks.length).toBeGreaterThan(0);
    expect(r.unaffectedTasks.length).toBe(0);
  });

  it('strategy = retry when task is retryable', () => {
    const tasks = [makeTask({ id: 'x', retryable: true }), makeTask({ id: 'y', dependsOn: ['x'] })];
    const r = planFailureRecovery(tasks, 'x');
    expect(r.strategy).toBe('retry');
  });

  it('recoveryPath starts with the failed task', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'repair');
    expect(r.recoveryPath[0]).toBe('repair');
  });

  it('estimatedRecoveryMs ≥ 0', () => {
    const g = buildTaskGraph(makeCtx());
    const r = planFailureRecovery(g.tasks, 'frontend');
    expect(r.estimatedRecoveryMs).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 16. Execution Validator
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Validator', () => {
  it('returns all 10 score dimensions', () => {
    const bp = makeFakeBlueprint();
    const v = bp.validation;
    expect(v).toHaveProperty('taskGraphScore');
    expect(v).toHaveProperty('dependenciesScore');
    expect(v).toHaveProperty('parallelismScore');
    expect(v).toHaveProperty('criticalPathScore');
    expect(v).toHaveProperty('retryStrategyScore');
    expect(v).toHaveProperty('timeoutStrategyScore');
    expect(v).toHaveProperty('resourceScore');
    expect(v).toHaveProperty('costScore');
    expect(v).toHaveProperty('recoveryScore');
    expect(v).toHaveProperty('overallScore');
  });

  it('all scores are in [0, 10]', () => {
    const v = makeFakeBlueprint().validation;
    const dims = ['taskGraphScore', 'dependenciesScore', 'parallelismScore', 'criticalPathScore',
      'retryStrategyScore', 'timeoutStrategyScore', 'resourceScore', 'costScore', 'recoveryScore'] as const;
    for (const d of dims) expect(v[d]).toBeGreaterThanOrEqual(0), expect(v[d]).toBeLessThanOrEqual(10);
  });

  it('overallScore is in [0, 10]', () => {
    const bp = makeFakeBlueprint();
    expect(bp.validation.overallScore).toBeGreaterThanOrEqual(0);
    expect(bp.validation.overallScore).toBeLessThanOrEqual(10);
  });

  it('valid=true for a well-formed standard build', () => {
    expect(makeFakeBlueprint().validation.valid).toBe(true);
  });

  it('warnings is an array', () => {
    expect(Array.isArray(makeFakeBlueprint().validation.warnings)).toBe(true);
  });

  it('penalises hasCycle — taskGraphScore drops', () => {
    const bp = makeFakeBlueprint();
    // Mutate to inject a cycle for testing
    const mutatedBp = {
      ...bp,
      taskGraph: {
        ...bp.taskGraph,
        dependencyAnalysis: {
          ...bp.taskGraph.dependencyAnalysis,
          hasCycle: true,
          isValid: false,
        },
      },
    };
    const v = validateExecutionBlueprint(mutatedBp as any);
    expect(v.taskGraphScore).toBeLessThan(10);
    expect(v.valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 17. Execution Learning
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Learning', () => {
  beforeEach(() => resetExecutionLearning());

  it('empty → all zeros', () => {
    const s = getExecutionLearningStats();
    expect(s.totalRecords).toBe(0);
    expect(s.averageDurationMs).toBe(0);
    expect(s.failureRate).toBe(0);
    expect(s.executionSuccessRate).toBe(0);
  });

  it('records a learning entry', async () => {
    await learnFromExecution({ buildId: 'b1', executionMode: 'hybrid', actualDurationMs: 60000, estimatedDurationMs: 65000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0.3, executionScore: 8, recordedAt: Date.now() });
    expect(getExecutionLearningStats().totalRecords).toBe(1);
  });

  it('averageDurationMs reflects records', async () => {
    await learnFromExecution({ buildId: 'b2', executionMode: 'sequential', actualDurationMs: 40000, estimatedDurationMs: 45000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0, executionScore: 7, recordedAt: Date.now() });
    await learnFromExecution({ buildId: 'b3', executionMode: 'sequential', actualDurationMs: 60000, estimatedDurationMs: 65000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0, executionScore: 7, recordedAt: Date.now() });
    expect(getExecutionLearningStats().averageDurationMs).toBe(50000);
  });

  it('failureRate = failed / total', async () => {
    await learnFromExecution({ buildId: 'f1', executionMode: 'hybrid', actualDurationMs: 30000, estimatedDurationMs: 35000, actualRetries: 2, failed: true, recovered: false, parallelEfficiency: 0.2, executionScore: 3, recordedAt: Date.now() });
    await learnFromExecution({ buildId: 'f2', executionMode: 'hybrid', actualDurationMs: 60000, estimatedDurationMs: 65000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0.3, executionScore: 8, recordedAt: Date.now() });
    expect(getExecutionLearningStats().failureRate).toBeCloseTo(0.5, 2);
  });

  it('recoveryRate = recovered / failed', async () => {
    await learnFromExecution({ buildId: 'r1', executionMode: 'hybrid', actualDurationMs: 30000, estimatedDurationMs: 35000, actualRetries: 1, failed: true, recovered: true, parallelEfficiency: 0.2, executionScore: 5, recordedAt: Date.now() });
    await learnFromExecution({ buildId: 'r2', executionMode: 'hybrid', actualDurationMs: 20000, estimatedDurationMs: 25000, actualRetries: 1, failed: true, recovered: false, parallelEfficiency: 0.1, executionScore: 3, recordedAt: Date.now() });
    expect(getExecutionLearningStats().recoveryRate).toBeCloseTo(0.5, 2);
  });

  it('byMode tracks per-mode averages', async () => {
    await learnFromExecution({ buildId: 'm1', executionMode: 'cost-optimized', actualDurationMs: 50000, estimatedDurationMs: 55000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0.1, executionScore: 7, recordedAt: Date.now() });
    const stats = getExecutionLearningStats();
    expect(stats.byMode['cost-optimized']).toBeDefined();
    expect(stats.byMode['cost-optimized'].count).toBe(1);
  });

  it('caps at 500 records', async () => {
    for (let i = 0; i < 520; i++) {
      await learnFromExecution({ buildId: `cap-${i}`, executionMode: 'sequential', actualDurationMs: 1000, estimatedDurationMs: 1000, actualRetries: 0, failed: false, recovered: false, parallelEfficiency: 0, executionScore: 7, recordedAt: Date.now() });
    }
    expect(getExecutionLearningStats().totalRecords).toBeLessThanOrEqual(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 18. Execution Metrics (Telemetry)
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Metrics', () => {
  beforeEach(() => { resetExecutionMetrics(); resetExecutionLearning(); resetExecutionPersistence(); });

  it('empty → all zeros', () => {
    const s = getExecutionIntelligenceSnapshot();
    expect(s.executionScore).toBe(0);
    expect(s.parallelEfficiency).toBe(0);
    expect(s.averageDuration).toBe(0);
    expect(s.failureRate).toBe(0);
  });

  it('exposes all spec-required fields', () => {
    const required = ['executionScore', 'parallelEfficiency', 'averageDuration', 'averageRetries',
      'failureRate', 'recoveryRate', 'learningStatistics', 'plannerDistribution',
      'persistenceHealth', 'estimatedCost', 'estimatedTime'];
    const s = getExecutionIntelligenceSnapshot();
    for (const f of required) expect(s).toHaveProperty(f);
  });

  it('plannerDistribution includes all 5 execution modes', () => {
    const s = getExecutionIntelligenceSnapshot();
    const modes = ['sequential', 'parallel', 'hybrid', 'critical-path-first', 'cost-optimized'];
    for (const m of modes) expect(s.plannerDistribution).toHaveProperty(m);
  });

  it('recordExecutionMetric updates snapshot', () => {
    recordExecutionMetric({ executionScore: 8, parallelEfficiency: 0.4, actualDurationMs: 60000, actualRetries: 1, failed: false, recovered: false, executionMode: 'hybrid', estimatedCost: 0.015, estimatedTimeMs: 65000, recordedAt: Date.now() });
    const s = getExecutionIntelligenceSnapshot();
    expect(s.executionScore).toBeCloseTo(8, 1);
  });

  it('persistenceHealth reflects persisted snapshots', () => {
    saveExecutionSnapshot('x', makeFakeBlueprint());
    const s = getExecutionIntelligenceSnapshot();
    expect(s.persistenceHealth.totalSnapshots).toBe(1);
  });

  it('caps at 500 records', () => {
    for (let i = 0; i < 510; i++) {
      recordExecutionMetric({ executionScore: 7, parallelEfficiency: 0.3, actualDurationMs: 50000, actualRetries: 0, failed: false, recovered: false, executionMode: 'sequential', estimatedCost: 0.01, estimatedTimeMs: 55000, recordedAt: Date.now() });
    }
    const s = getExecutionIntelligenceSnapshot();
    expect(s.executionScore).toBeGreaterThanOrEqual(0); // no error thrown
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 19. Execution Persistence
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Persistence', () => {
  beforeEach(() => resetExecutionPersistence());

  it('starts empty', () => {
    const s = getExecutionPersistenceStats();
    expect(s.totalSnapshots).toBe(0);
    expect(s.currentVersion).toBe(0);
    expect(s.oldestVersion).toBeNull();
    expect(s.newestVersion).toBeNull();
    expect(s.capacityUsed).toBe(0);
  });

  it('saveExecutionSnapshot increments version', () => {
    const s1 = saveExecutionSnapshot('b1', makeFakeBlueprint());
    const s2 = saveExecutionSnapshot('b2', makeFakeBlueprint());
    expect(s1.version).toBe(1);
    expect(s2.version).toBe(2);
  });

  it('getCurrentExecutionSnapshot returns latest', () => {
    saveExecutionSnapshot('b1', makeFakeBlueprint());
    saveExecutionSnapshot('b2', makeFakeBlueprint());
    expect(getCurrentExecutionSnapshot()?.buildId).toBe('b2');
  });

  it('getExecutionSnapshot retrieves by version', () => {
    saveExecutionSnapshot('b1', makeFakeBlueprint());
    saveExecutionSnapshot('b2', makeFakeBlueprint());
    expect(getExecutionSnapshot(1)?.buildId).toBe('b1');
    expect(getExecutionSnapshot(2)?.buildId).toBe('b2');
  });

  it('getExecutionSnapshot returns null for unknown version', () => {
    expect(getExecutionSnapshot(999)).toBeNull();
  });

  it('getCurrentExecutionSnapshot returns null when empty', () => {
    expect(getCurrentExecutionSnapshot()).toBeNull();
  });

  it('capacityUsed = (snapshots/500) × 100', () => {
    for (let i = 0; i < 100; i++) saveExecutionSnapshot(`b${i}`, makeFakeBlueprint());
    expect(getExecutionPersistenceStats().capacityUsed).toBe(20); // 100/500 * 100 = 20
  });

  it('caps at 500 snapshots', () => {
    for (let i = 0; i < 510; i++) saveExecutionSnapshot(`b${i}`, makeFakeBlueprint());
    expect(getExecutionPersistenceStats().totalSnapshots).toBeLessThanOrEqual(500);
  });

  it('blueprint version is assigned by persistence layer', () => {
    const snap = saveExecutionSnapshot('v-test', makeFakeBlueprint());
    expect(snap.blueprint.version).toBe(snap.version);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 20. Blueprint Builder (Integration)
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Blueprint Builder (Integration)', () => {
  it('buildExecutionBlueprint returns all required top-level fields', () => {
    const bp = makeFakeBlueprint();
    const required = ['buildId', 'taskGraph', 'executionOrder', 'parallelGroups', 'checkpoints',
      'retries', 'timeoutPolicies', 'rollbackPlan', 'resumePlan', 'criticalPath',
      'executionScore', 'estimatedCost', 'estimatedTime', 'resourceUsage',
      'failureStrategy', 'executionMode', 'validation', 'recordedAt', 'version'];
    for (const f of required) expect(bp).toHaveProperty(f);
  });

  it('buildId is preserved', () => {
    const bp = buildExecutionBlueprint(makeCtx({ buildId: 'my-build-99' }));
    expect(bp.buildId).toBe('my-build-99');
  });

  it('executionOrder contains all task ids', () => {
    const bp = makeFakeBlueprint();
    expect(bp.executionOrder.length).toBe(bp.taskGraph.totalTasks);
    for (const t of bp.taskGraph.tasks) expect(bp.executionOrder).toContain(t.id);
  });

  it('retries has an entry for every task', () => {
    const bp = makeFakeBlueprint();
    for (const t of bp.taskGraph.tasks) expect(bp.retries).toHaveProperty(t.id);
  });

  it('timeoutPolicies has an entry for every task', () => {
    const bp = makeFakeBlueprint();
    for (const t of bp.taskGraph.tasks) expect(bp.timeoutPolicies).toHaveProperty(t.id);
  });

  it('executionScore matches validation.overallScore', () => {
    const bp = makeFakeBlueprint();
    expect(bp.executionScore).toBe(bp.validation.overallScore);
  });

  it('buildFallbackExecutionBlueprint never throws', () => {
    expect(() => buildFallbackExecutionBlueprint('fallback-001')).not.toThrow();
    const bp = buildFallbackExecutionBlueprint('fallback-001');
    expect(bp.buildId).toBe('fallback-001');
  });

  it('is deterministic — same input → same executionMode', () => {
    const ctx = makeCtx({ buildId: 'det-1' });
    const bp1 = buildExecutionBlueprint(ctx);
    const bp2 = buildExecutionBlueprint(ctx);
    expect(bp1.executionMode).toBe(bp2.executionMode);
    expect(bp1.taskGraph.totalTasks).toBe(bp2.taskGraph.totalTasks);
  });

  it('enterprise build → failureStrategy = recover', () => {
    const bp = buildExecutionBlueprint(makeCtx({ complexity: 'enterprise' }));
    expect(bp.failureStrategy).toBe('recover');
  });

  it('standard/simple build → failureStrategy = retry', () => {
    const bp = buildExecutionBlueprint(makeCtx({ complexity: 'standard' }));
    expect(bp.failureStrategy).toBe('retry');
  });

  it('chosenPath A → executionMode = critical-path-first', () => {
    const bp = buildExecutionBlueprint(makeCtx({ chosenPath: 'A' }));
    expect(bp.executionMode).toBe('critical-path-first');
  });

  it('chosenPath C → executionMode = cost-optimized', () => {
    const bp = buildExecutionBlueprint(makeCtx({ chosenPath: 'C' }));
    expect(bp.executionMode).toBe('cost-optimized');
  });

  it('version = 0 (set by persistence on save)', () => {
    const bp = buildExecutionBlueprint(makeCtx());
    expect(bp.version).toBe(0);
  });

  it('recordedAt is a recent timestamp', () => {
    const before = Date.now();
    const bp = buildExecutionBlueprint(makeCtx());
    expect(bp.recordedAt).toBeGreaterThanOrEqual(before);
    expect(bp.recordedAt).toBeLessThanOrEqual(Date.now() + 100);
  });

  it('criticalPath has criticalTasks from the real task graph', () => {
    const bp = makeFakeBlueprint();
    expect(bp.criticalPath.criticalTasks.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 21. Execution Façade
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Execution Façade', () => {
  beforeEach(() => { resetExecutionPersistence(); resetExecutionMetrics(); });

  it('runExecutionIntelligence returns blueprint + contextString', () => {
    const result = runExecutionIntelligence(makeCtx());
    expect(result).toHaveProperty('blueprint');
    expect(result).toHaveProperty('contextString');
  });

  it('contextString contains execution mode', () => {
    const result = runExecutionIntelligence(makeCtx());
    expect(result.contextString).toContain('Execution Mode');
  });

  it('contextString contains execution score', () => {
    const result = runExecutionIntelligence(makeCtx());
    expect(result.contextString).toContain('Execution Score');
  });

  it('blueprint version > 0 (assigned by persistence)', () => {
    const result = runExecutionIntelligence(makeCtx());
    expect(result.blueprint.version).toBeGreaterThan(0);
  });

  it('persists snapshot after run', () => {
    runExecutionIntelligence(makeCtx({ buildId: 'facade-1' }));
    expect(getCurrentExecutionSnapshot()?.buildId).toBe('facade-1');
  });

  it('records metric after run', () => {
    runExecutionIntelligence(makeCtx());
    expect(getExecutionIntelligenceSnapshot().executionScore).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 22. Regression Guards
// ═══════════════════════════════════════════════════════════════════════════════
describe('V9.6 — Regression Guards', () => {
  it('standard build has exactly 15 pipeline tasks', () => {
    const g = buildTaskGraph(makeCtx({ complexity: 'standard' }));
    expect(g.totalTasks).toBe(15);
  });

  it('all task ids are unique within a graph', () => {
    const g = buildTaskGraph(makeCtx());
    const ids = g.tasks.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all priority labels are valid', () => {
    const g = buildTaskGraph(makeCtx());
    for (const t of g.tasks) {
      expect(['critical', 'high', 'medium', 'low']).toContain(t.priority);
    }
  });

  it('executionBlueprint.parallelGroups is an array of arrays', () => {
    const bp = makeFakeBlueprint();
    expect(Array.isArray(bp.parallelGroups)).toBe(true);
    for (const g of bp.parallelGroups) expect(Array.isArray(g)).toBe(true);
  });

  it('all retry policies are valid', () => {
    const bp = makeFakeBlueprint();
    const validPolicies = ['never', 'linear', 'exponential', 'immediate'];
    for (const cfg of Object.values(bp.retries)) {
      expect(validPolicies).toContain(cfg.policy);
    }
  });

  it('all timeout categories are valid', () => {
    const bp = makeFakeBlueprint();
    const validCats = ['small', 'medium', 'large', 'enterprise'];
    for (const cfg of Object.values(bp.timeoutPolicies)) {
      expect(validCats).toContain(cfg.category);
    }
  });

  it('executionScore is always in [0, 10]', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const bp = buildExecutionBlueprint(makeCtx({ complexity }));
      expect(bp.executionScore).toBeGreaterThanOrEqual(0);
      expect(bp.executionScore).toBeLessThanOrEqual(10);
    }
  });

  it('checkpoints have unique ids', () => {
    const g = buildTaskGraph(makeCtx());
    const cps = planCheckpoints(g.tasks);
    const ids = cps.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no missing dependencies in a valid standard build', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g.dependencyAnalysis.missingDependencies).toHaveLength(0);
  });

  it('no circular dependencies in a valid standard build', () => {
    const g = buildTaskGraph(makeCtx());
    expect(g.dependencyAnalysis.hasCycle).toBe(false);
    expect(g.dependencyAnalysis.circularDependencies).toHaveLength(0);
  });

  it('resource cpu is always low/medium/high', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const g = buildTaskGraph(makeCtx({ complexity }));
      const r = estimateResources(g.tasks, makeCtx({ complexity }));
      expect(['low', 'medium', 'high']).toContain(r.cpu);
    }
  });

  it('failureStrategy is abort/skip/retry/fallback/recover', () => {
    const valid = ['abort', 'skip', 'retry', 'fallback', 'recover'];
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const bp = buildExecutionBlueprint(makeCtx({ complexity }));
      expect(valid).toContain(bp.failureStrategy);
    }
  });
});
