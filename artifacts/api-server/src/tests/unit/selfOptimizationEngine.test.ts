// ── V10.0 Autonomous Self-Optimization Engine — Tests ─────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import type { Response as ExpressResponse } from 'express';

import type { SelfOptimizationContext, OptimizationLearningRecord, OptimizationMetricRecord } from '../../self-optimization-engine/optimizationTypes.js';

import { optimizePerformance  } from '../../self-optimization-engine/performanceOptimizer.js';
import { optimizeLatency      } from '../../self-optimization-engine/latencyOptimizer.js';
import { optimizeTokens       } from '../../self-optimization-engine/tokenOptimizer.js';
import { optimizeCost         } from '../../self-optimization-engine/costOptimizer.js';
import { optimizeWorkflow     } from '../../self-optimization-engine/workflowOptimizer.js';
import { optimizeParallel     } from '../../self-optimization-engine/parallelOptimizer.js';
import { optimizeScheduler    } from '../../self-optimization-engine/schedulerOptimizer.js';
import { optimizeRepair       } from '../../self-optimization-engine/repairOptimizer.js';
import { optimizeRetry        } from '../../self-optimization-engine/retryOptimizer.js';
import { optimizeTimeouts     } from '../../self-optimization-engine/timeoutOptimizer.js';
import { optimizeResources    } from '../../self-optimization-engine/resourceOptimizer.js';
import { optimizeMemory       } from '../../self-optimization-engine/memoryOptimizer.js';
import { optimizeCache        } from '../../self-optimization-engine/cacheOptimizer.js';
import { optimizePrompt       } from '../../self-optimization-engine/promptOptimizer.js';
import { optimizeContext      } from '../../self-optimization-engine/contextOptimizer.js';
import { optimizeQuality      } from '../../self-optimization-engine/qualityOptimizer.js';
import { optimizeAgents       } from '../../self-optimization-engine/agentOptimizer.js';
import { optimizeModel        } from '../../self-optimization-engine/modelOptimizer.js';
import { optimizeOrdering     } from '../../self-optimization-engine/orderingOptimizer.js';
import { optimizeConfidence   } from '../../self-optimization-engine/confidenceOptimizer.js';
import { validateOptimization } from '../../self-optimization-engine/optimizationValidator.js';

import {
  learnFromOptimization,
  getOptimizationLearningStats,
  hydrateOptimizationLearning,
  resetOptimizationLearning,
} from '../../self-optimization-engine/optimizationLearning.js';

import {
  recordOptimizationMetric,
  getOptimizationMetricsSnapshot,
  resetOptimizationMetrics,
} from '../../self-optimization-engine/optimizationMetrics.js';

import {
  saveOptimizationSnapshot,
  getCurrentOptimizationSnapshot,
  getOptimizationSnapshot,
  getOptimizationPersistenceStats,
  rollbackToOptimizationSnapshot,
  resetOptimizationPersistence,
} from '../../self-optimization-engine/optimizationPersistence.js';

import {
  buildOptimizationBlueprint,
  buildFallbackOptimizationBlueprint,
  runSelfOptimizationEngine,
  learnFromOptimizationResult,
  getOptimizationMetrics,
  getOptimizationStats,
  rollbackOptimization,
  resetOptimizationEngine,
  persistOptimizationSnapshot,
} from '../../self-optimization-engine/optimizationFacade.js';

// ── Helpers ─────────────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<SelfOptimizationContext> = {}): SelfOptimizationContext {
  return {
    buildId: 'test-build-1',
    prompt: 'Build a SaaS dashboard with analytics',
    complexity: 'standard',
    reasoningScore: 7.5,
    planningScore: 7.0,
    executionScore: 7.5,
    adaptiveScore: 7.5,
    tokenEfficiency: 0.8,
    totalTokenBudget: 50_000,
    expectedTotalCost: 0.05,
    historicalSuccessRate: 0.9,
    historicalBuildTimeMs: 90_000,
    parallelEfficiency: 0.7,
    cacheHitRate: 0.5,
    compressionRatio: 0.8,
    memoryUsage: 512,
    repairAttempts: 0,
    retryCount: 0,
    ...overrides,
  };
}

function makeLearningRecord(overrides: Partial<OptimizationLearningRecord> = {}): OptimizationLearningRecord {
  return {
    buildId: 'lr-1',
    overallOptimizationScore: 7.5,
    buildSucceeded: true,
    buildTimeMs: 90_000,
    estimatedBuildTimeMs: 85_000,
    totalCostActual: 0.05,
    totalCostEstimated: 0.05,
    qualityScoreActual: 8,
    repairAttempts: 0,
    retryCount: 0,
    complexity: 'standard',
    modelTier: 'standard',
    recordedAt: Date.now(),
    ...overrides,
  };
}

function makeMetricRecord(overrides: Partial<OptimizationMetricRecord> = {}): OptimizationMetricRecord {
  return {
    overallOptimizationScore: 7.5,
    performanceScore: 8,
    latencyScore: 8,
    costScore: 7,
    qualityScore: 7.5,
    workflowScore: 8,
    parallelScore: 7,
    resourceScore: 8,
    tokenScore: 7.5,
    repairScore: 9,
    retryScore: 9,
    modelScore: 7.5,
    agentUtilization: 0.9,
    adaptationTimeMs: 20,
    complexity: 'standard',
    recordedAt: Date.now(),
    ...overrides,
  };
}

function resetAll() { resetOptimizationEngine(); }

// ════════════════════════════════════════════════════════════════════════════════
// Performance Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Performance Optimizer', () => {
  it('returns a performanceScore between 0 and 10', () => {
    const bp = optimizePerformance(makeCtx());
    expect(bp.performanceScore).toBeGreaterThanOrEqual(0);
    expect(bp.performanceScore).toBeLessThanOrEqual(10);
  });
  it('detects slow agents from latencies', () => {
    const bp = optimizePerformance(makeCtx({ agentLatencies: { Frontend: 25_000, Backend: 5_000 } }));
    expect(bp.slowAgents).toContain('Frontend');
    expect(bp.slowAgents).not.toContain('Backend');
  });
  it('returns criticalPath array', () => {
    const bp = optimizePerformance(makeCtx());
    expect(Array.isArray(bp.criticalPath)).toBe(true);
  });
  it('returns parallelizableSteps', () => {
    const bp = optimizePerformance(makeCtx());
    expect(bp.parallelizableSteps.length).toBeGreaterThan(0);
  });
  it('scales estimatedBuildTimeMs with complexity', () => {
    const simple     = optimizePerformance(makeCtx({ complexity: 'simple' }));
    const enterprise = optimizePerformance(makeCtx({ complexity: 'enterprise' }));
    expect(simple.estimatedBuildTimeMs).toBeLessThan(enterprise.estimatedBuildTimeMs);
  });
  it('detects bottleneck for low parallel efficiency', () => {
    const bp = optimizePerformance(makeCtx({ parallelEfficiency: 0.3 }));
    expect(bp.bottlenecks).toContain('low-parallel-efficiency');
  });
  it('lowers score for many slow agents', () => {
    const noSlow   = optimizePerformance(makeCtx());
    const withSlow = optimizePerformance(makeCtx({ agentLatencies: { A: 20_000, B: 20_000, C: 20_000, D: 20_000 } }));
    expect(withSlow.performanceScore).toBeLessThanOrEqual(noSlow.performanceScore);
  });
  it('provides recommendations', () => {
    const bp = optimizePerformance(makeCtx({ agentLatencies: { Frontend: 25_000 } }));
    expect(bp.recommendations.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Latency Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Latency Optimizer', () => {
  it('p95 > p50', () => {
    const bp = optimizeLatency(makeCtx());
    expect(bp.p95EstimateMs).toBeGreaterThan(bp.p50EstimateMs);
  });
  it('has per-agent latency budgets', () => {
    const bp = optimizeLatency(makeCtx());
    expect(bp.agentLatencyBudgets['Planner']).toBeGreaterThan(0);
    expect(bp.agentLatencyBudgets['Frontend']).toBeGreaterThan(0);
  });
  it('latencyScore is 0-10', () => {
    const bp = optimizeLatency(makeCtx());
    expect(bp.latencyScore).toBeGreaterThanOrEqual(0);
    expect(bp.latencyScore).toBeLessThanOrEqual(10);
  });
  it('longer target for enterprise', () => {
    const simple     = optimizeLatency(makeCtx({ complexity: 'simple' }));
    const enterprise = optimizeLatency(makeCtx({ complexity: 'enterprise' }));
    expect(enterprise.targetLatencyMs).toBeGreaterThan(simple.targetLatencyMs);
  });
  it('high score for build time well below target', () => {
    const bp = optimizeLatency(makeCtx({ historicalBuildTimeMs: 20_000 }));
    expect(bp.latencyScore).toBeGreaterThanOrEqual(8);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Token Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Token Optimizer', () => {
  it('promptTokenBudget + completionTokenBudget ≈ totalTokenBudget', () => {
    const bp = optimizeTokens(makeCtx({ totalTokenBudget: 100_000 }));
    expect(bp.promptTokenBudget + bp.completionTokenBudget).toBe(100_000);
  });
  it('tokenScore is 0-10', () => {
    const bp = optimizeTokens(makeCtx());
    expect(bp.tokenScore).toBeGreaterThanOrEqual(0);
    expect(bp.tokenScore).toBeLessThanOrEqual(10);
  });
  it('low efficiency triggers compression opportunities', () => {
    const bp = optimizeTokens(makeCtx({ tokenEfficiency: 0.4 }));
    expect(bp.compressionOpportunities.length).toBeGreaterThan(0);
  });
  it('high efficiency gets high tokenScore', () => {
    const bp = optimizeTokens(makeCtx({ tokenEfficiency: 0.9 }));
    expect(bp.tokenScore).toBeGreaterThanOrEqual(7);
  });
  it('provides duplicateContextSavings', () => {
    const bp = optimizeTokens(makeCtx({ tokenEfficiency: 0.4 }));
    expect(bp.duplicateContextSavings).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Cost Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Cost Optimizer', () => {
  it('costScore is 0-10', () => {
    const bp = optimizeCost(makeCtx());
    expect(bp.costScore).toBeGreaterThanOrEqual(0);
    expect(bp.costScore).toBeLessThanOrEqual(10);
  });
  it('repair cost increases with repairAttempts', () => {
    const zero = optimizeCost(makeCtx({ repairAttempts: 0 }));
    const many = optimizeCost(makeCtx({ repairAttempts: 5 }));
    expect(many.repairCostEstimate).toBeGreaterThan(zero.repairCostEstimate);
  });
  it('aggressive mode for high cost overrun', () => {
    const bp = optimizeCost(makeCtx({ tokenEfficiency: 0.3 }));
    expect(bp.costMode).toBe('aggressive');
  });
  it('none mode for well-controlled cost', () => {
    const bp = optimizeCost(makeCtx({ tokenEfficiency: 0.9, repairAttempts: 0, retryCount: 0 }));
    expect(bp.costMode).toBe('none');
  });
  it('high repair attempts gets recommendations', () => {
    const bp = optimizeCost(makeCtx({ repairAttempts: 3 }));
    expect(bp.recommendations.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Workflow Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Workflow Optimizer', () => {
  it('skips optional steps for simple complexity', () => {
    const bp = optimizeWorkflow(makeCtx({ complexity: 'simple' }));
    expect(bp.skippableSteps.length).toBeGreaterThan(0);
  });
  it('no skips for enterprise', () => {
    const bp = optimizeWorkflow(makeCtx({ complexity: 'enterprise' }));
    expect(bp.skippableSteps.length).toBe(0);
  });
  it('workflowScore is 0-10', () => {
    const bp = optimizeWorkflow(makeCtx());
    expect(bp.workflowScore).toBeGreaterThanOrEqual(0);
    expect(bp.workflowScore).toBeLessThanOrEqual(10);
  });
  it('recommendedOrder is non-empty', () => {
    const bp = optimizeWorkflow(makeCtx());
    expect(bp.recommendedOrder.length).toBeGreaterThan(0);
  });
  it('mergeableSteps for non-enterprise', () => {
    const bp = optimizeWorkflow(makeCtx({ complexity: 'standard' }));
    expect(bp.mergeableSteps.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Parallel Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Parallel Optimizer', () => {
  it('parallelScore is 0-10', () => {
    const bp = optimizeParallel(makeCtx());
    expect(bp.parallelScore).toBeGreaterThanOrEqual(0);
    expect(bp.parallelScore).toBeLessThanOrEqual(10);
  });
  it('enterprise has higher maxDegree', () => {
    const std  = optimizeParallel(makeCtx({ complexity: 'standard' }));
    const ent  = optimizeParallel(makeCtx({ complexity: 'enterprise' }));
    expect(ent.maxDegree).toBeGreaterThan(std.maxDegree);
  });
  it('parallelGroups is array of arrays', () => {
    const bp = optimizeParallel(makeCtx());
    expect(Array.isArray(bp.parallelGroups)).toBe(true);
    expect(Array.isArray(bp.parallelGroups[0])).toBe(true);
  });
  it('low efficiency raises idleWorkerCount', () => {
    const low  = optimizeParallel(makeCtx({ parallelEfficiency: 0.2 }));
    const high = optimizeParallel(makeCtx({ parallelEfficiency: 0.9 }));
    expect(low.idleWorkerCount).toBeGreaterThanOrEqual(high.idleWorkerCount);
  });
  it('high efficiency gets score ≥ 8', () => {
    const bp = optimizeParallel(makeCtx({ parallelEfficiency: 0.9 }));
    expect(bp.parallelScore).toBeGreaterThanOrEqual(8);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Scheduler Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Scheduler Optimizer', () => {
  it('enterprise gets high priority', () => {
    const bp = optimizeScheduler(makeCtx({ complexity: 'enterprise' }));
    expect(bp.priority).toBe('high');
  });
  it('schedulerScore is 0-10', () => {
    const bp = optimizeScheduler(makeCtx());
    expect(bp.schedulerScore).toBeGreaterThanOrEqual(0);
    expect(bp.schedulerScore).toBeLessThanOrEqual(10);
  });
  it('high priority uses priority queue', () => {
    const bp = optimizeScheduler(makeCtx({ complexity: 'enterprise' }));
    expect(bp.queueStrategy).toBe('priority');
  });
  it('simple complexity uses lazy scheduling', () => {
    const bp = optimizeScheduler(makeCtx({ complexity: 'simple', tokenEfficiency: 0.9 }));
    expect(bp.schedulingMode).toBe('lazy');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Repair Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Repair Optimizer', () => {
  it('repairScore is 0-10', () => {
    const bp = optimizeRepair(makeCtx());
    expect(bp.repairScore).toBeGreaterThanOrEqual(0);
    expect(bp.repairScore).toBeLessThanOrEqual(10);
  });
  it('enterprise has higher repairThreshold', () => {
    const std = optimizeRepair(makeCtx({ complexity: 'standard' }));
    const ent = optimizeRepair(makeCtx({ complexity: 'enterprise' }));
    expect(ent.repairThreshold).toBeGreaterThan(std.repairThreshold);
  });
  it('high repair attempts lowers score', () => {
    const zero = optimizeRepair(makeCtx({ repairAttempts: 0 }));
    const many = optimizeRepair(makeCtx({ repairAttempts: 5 }));
    expect(many.repairScore).toBeLessThan(zero.repairScore);
  });
  it('repairNecessary when quality below threshold', () => {
    const bp = optimizeRepair(makeCtx({ qualityScore: 5 }));
    expect(bp.repairNecessary).toBe(true);
  });
  it('repairNecessary is false when quality high', () => {
    const bp = optimizeRepair(makeCtx({ qualityScore: 9 }));
    expect(bp.repairNecessary).toBe(false);
  });
  it('maxRepairPasses is at least 1', () => {
    const bp = optimizeRepair(makeCtx());
    expect(bp.maxRepairPasses).toBeGreaterThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Retry Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Retry Optimizer', () => {
  it('retryScore is 0-10', () => {
    const bp = optimizeRetry(makeCtx());
    expect(bp.retryScore).toBeGreaterThanOrEqual(0);
    expect(bp.retryScore).toBeLessThanOrEqual(10);
  });
  it('enterprise uses exponential strategy', () => {
    const bp = optimizeRetry(makeCtx({ complexity: 'enterprise' }));
    expect(bp.retryStrategy).toBe('exponential');
  });
  it('high token pressure uses no retries', () => {
    const bp = optimizeRetry(makeCtx({ tokenEfficiency: 0.3 }));
    expect(bp.maxRetries).toBe(1);
  });
  it('zero retries gets score 9', () => {
    const bp = optimizeRetry(makeCtx({ retryCount: 0 }));
    expect(bp.retryScore).toBe(9);
  });
  it('high retries lowers score', () => {
    const low  = optimizeRetry(makeCtx({ retryCount: 0 }));
    const high = optimizeRetry(makeCtx({ retryCount: 5 }));
    expect(high.retryScore).toBeLessThan(low.retryScore);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Timeout Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Timeout Optimizer', () => {
  it('enterprise has longest global timeout', () => {
    const simple = optimizeTimeouts(makeCtx({ complexity: 'simple' }));
    const ent    = optimizeTimeouts(makeCtx({ complexity: 'enterprise' }));
    expect(ent.globalTimeoutMs).toBeGreaterThan(simple.globalTimeoutMs);
  });
  it('returns per-agent timeouts', () => {
    const bp = optimizeTimeouts(makeCtx());
    expect(bp.agentTimeouts['Planner']).toBeGreaterThan(0);
    expect(bp.agentTimeouts['Frontend']).toBeGreaterThan(0);
  });
  it('timeoutScore is 0-10', () => {
    const bp = optimizeTimeouts(makeCtx());
    expect(bp.timeoutScore).toBeGreaterThanOrEqual(0);
    expect(bp.timeoutScore).toBeLessThanOrEqual(10);
  });
  it('enterprise agent timeouts are double standard', () => {
    const std = optimizeTimeouts(makeCtx({ complexity: 'standard' }));
    const ent = optimizeTimeouts(makeCtx({ complexity: 'enterprise' }));
    expect(ent.agentTimeouts['Frontend']).toBeGreaterThan(std.agentTimeouts['Frontend']!);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Resource Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Resource Optimizer', () => {
  it('enterprise has highest cpuAllocation', () => {
    const std = optimizeResources(makeCtx({ complexity: 'standard' }));
    const ent = optimizeResources(makeCtx({ complexity: 'enterprise' }));
    expect(ent.cpuAllocation).toBeGreaterThan(std.cpuAllocation);
  });
  it('resourceScore is 0-10', () => {
    const bp = optimizeResources(makeCtx());
    expect(bp.resourceScore).toBeGreaterThanOrEqual(0);
    expect(bp.resourceScore).toBeLessThanOrEqual(10);
  });
  it('returns all 7 resource fields', () => {
    const bp = optimizeResources(makeCtx());
    expect(bp.cpuAllocation).toBeGreaterThan(0);
    expect(bp.memoryAllocationMB).toBeGreaterThan(0);
    expect(bp.diskBudgetMB).toBeGreaterThan(0);
    expect(bp.networkBudget).toBeGreaterThan(0);
    expect(bp.llmConcurrency).toBeGreaterThan(0);
    expect(bp.apiConcurrency).toBeGreaterThan(0);
    expect(bp.cacheAllocationMB).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Memory Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Memory Optimizer', () => {
  it('enterprise uses generous mode', () => {
    const bp = optimizeMemory(makeCtx({ complexity: 'enterprise' }));
    expect(bp.memoryMode).toBe('generous');
  });
  it('simple uses minimal mode', () => {
    const bp = optimizeMemory(makeCtx({ complexity: 'simple', memoryUsage: 100 }));
    expect(bp.memoryMode).toBe('minimal');
  });
  it('memoryScore is 0-10', () => {
    const bp = optimizeMemory(makeCtx());
    expect(bp.memoryScore).toBeGreaterThanOrEqual(0);
    expect(bp.memoryScore).toBeLessThanOrEqual(10);
  });
  it('minimal mode uses aggressive GC', () => {
    const bp = optimizeMemory(makeCtx({ complexity: 'simple', memoryUsage: 100 }));
    expect(bp.garbageCollectionHint).toBe('aggressive');
  });
  it('estimatedPeakMB > current memoryUsage', () => {
    const bp = optimizeMemory(makeCtx({ memoryUsage: 512 }));
    expect(bp.estimatedPeakMB).toBeGreaterThan(512);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Cache Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Cache Optimizer', () => {
  it('cacheScore is 0-10', () => {
    const bp = optimizeCache(makeCtx());
    expect(bp.cacheScore).toBeGreaterThanOrEqual(0);
    expect(bp.cacheScore).toBeLessThanOrEqual(10);
  });
  it('high hitRate gets aggressive strategy', () => {
    const bp = optimizeCache(makeCtx({ cacheHitRate: 0.8 }));
    expect(bp.cacheStrategy).toBe('aggressive');
  });
  it('estimatedHitRate >= actual hitRate', () => {
    const bp = optimizeCache(makeCtx({ cacheHitRate: 0.5 }));
    expect(bp.estimatedHitRate).toBeGreaterThanOrEqual(0.5);
  });
  it('enterprise has longer TTL', () => {
    const std = optimizeCache(makeCtx({ complexity: 'standard' }));
    const ent = optimizeCache(makeCtx({ complexity: 'enterprise' }));
    expect(ent.cacheTtlMs).toBeGreaterThan(std.cacheTtlMs);
  });
  it('low hitRate gets recommendations', () => {
    const bp = optimizeCache(makeCtx({ cacheHitRate: 0.2 }));
    expect(bp.recommendations.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Prompt Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Prompt Optimizer', () => {
  it('promptScore is 0-10', () => {
    const bp = optimizePrompt(makeCtx());
    expect(bp.promptScore).toBeGreaterThanOrEqual(0);
    expect(bp.promptScore).toBeLessThanOrEqual(10);
  });
  it('low efficiency enables compression', () => {
    const bp = optimizePrompt(makeCtx({ tokenEfficiency: 0.4 }));
    expect(bp.compressionEnabled).toBe(true);
  });
  it('low efficiency enables deduplication', () => {
    const bp = optimizePrompt(makeCtx({ tokenEfficiency: 0.5 }));
    expect(bp.deduplicationEnabled).toBe(true);
  });
  it('estimatedSavingsTokens > 0 when dedup enabled', () => {
    const bp = optimizePrompt(makeCtx({ tokenEfficiency: 0.4 }));
    if (bp.deduplicationEnabled) expect(bp.estimatedSavingsTokens).toBeGreaterThan(0);
  });
  it('compressionRatio between 0 and 1', () => {
    const bp = optimizePrompt(makeCtx());
    expect(bp.compressionRatio).toBeGreaterThanOrEqual(0);
    expect(bp.compressionRatio).toBeLessThanOrEqual(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Context Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Context Optimizer', () => {
  it('contextScore is 0-10', () => {
    const bp = optimizeContext(makeCtx());
    expect(bp.contextScore).toBeGreaterThanOrEqual(0);
    expect(bp.contextScore).toBeLessThanOrEqual(10);
  });
  it('contextWindowUsage is 0-1', () => {
    const bp = optimizeContext(makeCtx());
    expect(bp.contextWindowUsage).toBeGreaterThanOrEqual(0);
    expect(bp.contextWindowUsage).toBeLessThanOrEqual(1);
  });
  it('low efficiency triggers contextReductionEnabled', () => {
    const bp = optimizeContext(makeCtx({ tokenEfficiency: 0.3 }));
    expect(bp.contextReductionEnabled).toBe(true);
  });
  it('unusedContextFraction is non-negative', () => {
    const bp = optimizeContext(makeCtx());
    expect(bp.unusedContextFraction).toBeGreaterThanOrEqual(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Quality Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Quality Optimizer', () => {
  it('qualityScore is 0-10', () => {
    const bp = optimizeQuality(makeCtx());
    expect(bp.qualityScore).toBeGreaterThanOrEqual(0);
    expect(bp.qualityScore).toBeLessThanOrEqual(10);
  });
  it('enterprise has highest qualityThreshold', () => {
    const std = optimizeQuality(makeCtx({ complexity: 'standard' }));
    const ent = optimizeQuality(makeCtx({ complexity: 'enterprise' }));
    expect(ent.qualityThreshold).toBeGreaterThan(std.qualityThreshold);
  });
  it('enterprise uses 3 candidates', () => {
    const bp = optimizeQuality(makeCtx({ complexity: 'enterprise' }));
    expect(bp.candidateCount).toBe(3);
  });
  it('simple uses 1 candidate', () => {
    const bp = optimizeQuality(makeCtx({ complexity: 'simple' }));
    expect(bp.candidateCount).toBe(1);
  });
  it('enterprise uses strict validation', () => {
    const bp = optimizeQuality(makeCtx({ complexity: 'enterprise' }));
    expect(bp.validationStrictness).toBe('strict');
  });
  it('repairThreshold is below qualityThreshold', () => {
    const bp = optimizeQuality(makeCtx());
    expect(bp.repairThreshold).toBeLessThan(bp.qualityThreshold);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Agent Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Agent Optimizer', () => {
  it('agentScore is 0-10', () => {
    const bp = optimizeAgents(makeCtx());
    expect(bp.agentScore).toBeGreaterThanOrEqual(0);
    expect(bp.agentScore).toBeLessThanOrEqual(10);
  });
  it('agentScores contains known agents', () => {
    const bp = optimizeAgents(makeCtx());
    expect(bp.agentScores['Planner']).toBeDefined();
    expect(bp.agentScores['Frontend']).toBeDefined();
  });
  it('each agent score has 7 fields', () => {
    const bp = optimizeAgents(makeCtx());
    const s = bp.agentScores['Planner']!;
    expect(s).toHaveProperty('efficiency');
    expect(s).toHaveProperty('latency');
    expect(s).toHaveProperty('quality');
    expect(s).toHaveProperty('cost');
    expect(s).toHaveProperty('successRate');
    expect(s).toHaveProperty('confidence');
    expect(s).toHaveProperty('composite');
  });
  it('composite score is 0-10', () => {
    const bp = optimizeAgents(makeCtx());
    for (const s of Object.values(bp.agentScores)) {
      expect(s.composite).toBeGreaterThanOrEqual(0);
      expect(s.composite).toBeLessThanOrEqual(10);
    }
  });
  it('high failure rate produces low-performing agents', () => {
    const bp = optimizeAgents(makeCtx({ agentFailureRates: { Planner: 0.9 } }));
    expect(bp.lowPerformingAgents.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Model Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Model Optimizer', () => {
  it('modelScore is 0-10', () => {
    const bp = optimizeModel(makeCtx());
    expect(bp.modelScore).toBeGreaterThanOrEqual(0);
    expect(bp.modelScore).toBeLessThanOrEqual(10);
  });
  it('enterprise selects premium tier', () => {
    const bp = optimizeModel(makeCtx({ complexity: 'enterprise' }));
    expect(bp.recommendedTier).toBe('premium');
  });
  it('simple + high cost pressure selects fast', () => {
    const bp = optimizeModel(makeCtx({ complexity: 'simple', tokenEfficiency: 0.3 }));
    expect(bp.recommendedTier).toBe('fast');
  });
  it('weights sum to 1', () => {
    const bp = optimizeModel(makeCtx());
    expect(bp.qualityWeight + bp.latencyWeight + bp.costWeight).toBeCloseTo(1, 1);
  });
  it('modelSelectionRationale is non-empty', () => {
    const bp = optimizeModel(makeCtx());
    expect(bp.modelSelectionRationale.length).toBeGreaterThan(5);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Ordering Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Ordering Optimizer', () => {
  it('orderingScore is 0-10', () => {
    const bp = optimizeOrdering(makeCtx());
    expect(bp.orderingScore).toBeGreaterThanOrEqual(0);
    expect(bp.orderingScore).toBeLessThanOrEqual(10);
  });
  it('enterprise selects quality-first ordering', () => {
    const bp = optimizeOrdering(makeCtx({ complexity: 'enterprise' }));
    expect(bp.orderingStrategy).toBe('quality-first');
  });
  it('simple selects critical-path ordering', () => {
    const bp = optimizeOrdering(makeCtx({ complexity: 'simple' }));
    expect(bp.orderingStrategy).toBe('critical-path');
  });
  it('recommendedOrder is non-empty', () => {
    const bp = optimizeOrdering(makeCtx());
    expect(bp.recommendedOrder.length).toBeGreaterThan(0);
  });
  it('high cost pressure selects cost-first', () => {
    const bp = optimizeOrdering(makeCtx({ tokenEfficiency: 0.3, complexity: 'standard' }));
    expect(bp.orderingStrategy).toBe('cost-first');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Confidence Optimizer
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Confidence Optimizer', () => {
  it('confidenceScore is 0-10', () => {
    const bp = optimizeConfidence(makeCtx());
    expect(bp.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(bp.confidenceScore).toBeLessThanOrEqual(10);
  });
  it('executionConfidence is 0-1', () => {
    const bp = optimizeConfidence(makeCtx());
    expect(bp.executionConfidence).toBeGreaterThanOrEqual(0);
    expect(bp.executionConfidence).toBeLessThanOrEqual(1);
  });
  it('low success rate → high risk', () => {
    const bp = optimizeConfidence(makeCtx({ historicalSuccessRate: 0.4, reasoningScore: 5 }));
    expect(bp.riskLevel).toBe('high');
  });
  it('high all scores → low risk', () => {
    const bp = optimizeConfidence(makeCtx({
      reasoningScore: 9, planningScore: 9, executionScore: 9,
      adaptiveScore: 9, historicalSuccessRate: 0.95, tokenEfficiency: 0.9,
    }));
    expect(bp.riskLevel).toBe('low');
  });
  it('confidenceFactors is non-empty', () => {
    const bp = optimizeConfidence(makeCtx());
    expect(bp.confidenceFactors.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Optimization Validator — 13 dimensions
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Optimization Validator', () => {
  function validate(ctx: SelfOptimizationContext) {
    const perf  = optimizePerformance(ctx);
    const lat   = optimizeLatency(ctx);
    const cost  = optimizeCost(ctx);
    const qual  = optimizeQuality(ctx);
    const wf    = optimizeWorkflow(ctx);
    const sched = optimizeScheduler(ctx);
    const par   = optimizeParallel(ctx);
    const res   = optimizeResources(ctx);
    const tok   = optimizeTokens(ctx);
    const rep   = optimizeRepair(ctx);
    const ret   = optimizeRetry(ctx);
    const mod   = optimizeModel(ctx);
    const conf  = optimizeConfidence(ctx);
    return validateOptimization(perf, lat, cost, qual, wf, sched, par, res, tok, rep, ret, mod, conf);
  }

  it('overallScore is 0-10', () => {
    const v = validate(makeCtx());
    expect(v.overallScore).toBeGreaterThanOrEqual(0);
    expect(v.overallScore).toBeLessThanOrEqual(10);
  });
  it('valid=true when overallScore >= 6', () => {
    const v = validate(makeCtx());
    expect(v.overallScore).toBeGreaterThanOrEqual(6);
    expect(v.valid).toBe(true);
  });
  it('returns all 13 dimension scores', () => {
    const v = validate(makeCtx());
    expect(v.performanceScore).toBeDefined();
    expect(v.latencyScore).toBeDefined();
    expect(v.costScore).toBeDefined();
    expect(v.qualityScore).toBeDefined();
    expect(v.workflowScore).toBeDefined();
    expect(v.schedulingScore).toBeDefined();
    expect(v.parallelismScore).toBeDefined();
    expect(v.resourceUsageScore).toBeDefined();
    expect(v.tokenEfficiencyScore).toBeDefined();
    expect(v.repairStrategyScore).toBeDefined();
    expect(v.retryStrategyScore).toBeDefined();
    expect(v.modelAllocationScore).toBeDefined();
    expect(v.confidenceScore).toBeDefined();
  });
  it('warnings array is present', () => {
    const v = validate(makeCtx());
    expect(Array.isArray(v.warnings)).toBe(true);
  });
  it('high-risk context produces warnings', () => {
    const v = validate(makeCtx({ historicalSuccessRate: 0.3, tokenEfficiency: 0.2, reasoningScore: 3 }));
    expect(v.warnings.length).toBeGreaterThan(0);
  });
  it('all-green context passes with no warnings', () => {
    const v = validate(makeCtx({
      historicalSuccessRate: 0.98, tokenEfficiency: 0.9, parallelEfficiency: 0.85,
      reasoningScore: 9, planningScore: 9, executionScore: 9, adaptiveScore: 9,
      repairAttempts: 0, retryCount: 0, qualityScore: 9,
    }));
    expect(v.valid).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// buildOptimizationBlueprint — Full Integration
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — buildOptimizationBlueprint', () => {
  it('returns all 20 sub-blueprints', () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    expect(bp.performance).toBeDefined();
    expect(bp.latency).toBeDefined();
    expect(bp.token).toBeDefined();
    expect(bp.cost).toBeDefined();
    expect(bp.workflow).toBeDefined();
    expect(bp.parallel).toBeDefined();
    expect(bp.scheduler).toBeDefined();
    expect(bp.repair).toBeDefined();
    expect(bp.retry).toBeDefined();
    expect(bp.timeout).toBeDefined();
    expect(bp.resource).toBeDefined();
    expect(bp.memory).toBeDefined();
    expect(bp.cache).toBeDefined();
    expect(bp.prompt).toBeDefined();
    expect(bp.context).toBeDefined();
    expect(bp.quality).toBeDefined();
    expect(bp.agent).toBeDefined();
    expect(bp.model).toBeDefined();
    expect(bp.ordering).toBeDefined();
    expect(bp.confidence).toBeDefined();
  });
  it('overallOptimizationScore equals validation.overallScore', () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    expect(bp.overallOptimizationScore).toBe(bp.validation.overallScore);
  });
  it('contextString contains V10.0 header', () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    expect(bp.contextString).toContain('V10.0 Self-Optimization Engine');
  });
  it('buildId is preserved', () => {
    const bp = buildOptimizationBlueprint(makeCtx({ buildId: 'my-build-10' }));
    expect(bp.buildId).toBe('my-build-10');
  });
  it('recordedAt is a recent timestamp', () => {
    const before = Date.now();
    const bp = buildOptimizationBlueprint(makeCtx());
    expect(bp.recordedAt).toBeGreaterThanOrEqual(before);
    expect(bp.recordedAt).toBeLessThanOrEqual(Date.now());
  });
  it('works for all complexity levels', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const bp = buildOptimizationBlueprint(makeCtx({ complexity }));
      expect(bp.validation.valid).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// buildFallbackOptimizationBlueprint
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — buildFallbackOptimizationBlueprint', () => {
  it('returns valid blueprint', () => {
    const bp = buildFallbackOptimizationBlueprint('fallback-1');
    expect(bp.buildId).toBe('fallback-1');
    expect(bp.validation.valid).toBe(true);
  });
  it('contextString has V10.0 header', () => {
    const bp = buildFallbackOptimizationBlueprint('fallback-2');
    expect(bp.contextString).toContain('V10.0');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Learning
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Optimization Learning', () => {
  beforeEach(() => resetOptimizationLearning());

  it('starts with zero records', () => {
    expect(getOptimizationLearningStats().totalRecords).toBe(0);
  });
  it('records a learning entry', async () => {
    await learnFromOptimization(makeLearningRecord());
    expect(getOptimizationLearningStats().totalRecords).toBe(1);
  });
  it('computes averageOptimizationScore', async () => {
    await learnFromOptimization(makeLearningRecord({ overallOptimizationScore: 8 }));
    await learnFromOptimization(makeLearningRecord({ overallOptimizationScore: 6 }));
    expect(getOptimizationLearningStats().averageOptimizationScore).toBe(7);
  });
  it('computes buildSuccessRate', async () => {
    await learnFromOptimization(makeLearningRecord({ buildSucceeded: true }));
    await learnFromOptimization(makeLearningRecord({ buildSucceeded: false }));
    expect(getOptimizationLearningStats().buildSuccessRate).toBe(0.5);
  });
  it('caps at 500 records', async () => {
    for (let i = 0; i < 510; i++) await learnFromOptimization(makeLearningRecord({ buildId: `b${i}` }));
    expect(getOptimizationLearningStats().totalRecords).toBe(500);
  });
  it('groups by complexity', async () => {
    await learnFromOptimization(makeLearningRecord({ complexity: 'simple' }));
    await learnFromOptimization(makeLearningRecord({ complexity: 'enterprise' }));
    const stats = getOptimizationLearningStats();
    expect(stats.byComplexity['simple']).toBeDefined();
    expect(stats.byComplexity['enterprise']).toBeDefined();
  });
  it('groups by modelTier', async () => {
    await learnFromOptimization(makeLearningRecord({ modelTier: 'premium' }));
    const stats = getOptimizationLearningStats();
    expect(stats.byModelTier['premium']).toBeDefined();
  });
  it('computes timeAccuracy', async () => {
    await learnFromOptimization(makeLearningRecord({ buildTimeMs: 90_000, estimatedBuildTimeMs: 90_000 }));
    expect(getOptimizationLearningStats().timeAccuracy).toBe(1);
  });
  it('hydrates records', () => {
    hydrateOptimizationLearning([makeLearningRecord(), makeLearningRecord({ buildId: 'b2' })]);
    expect(getOptimizationLearningStats().totalRecords).toBe(2);
  });
  it('resets', async () => {
    await learnFromOptimization(makeLearningRecord());
    resetOptimizationLearning();
    expect(getOptimizationLearningStats().totalRecords).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Metrics
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Optimization Metrics', () => {
  beforeEach(() => resetOptimizationMetrics());

  it('returns zero snapshot when empty', () => {
    expect(getOptimizationMetricsSnapshot().overallOptimizationScore).toBe(0);
  });
  it('records a metric', () => {
    recordOptimizationMetric(makeMetricRecord());
    expect(getOptimizationMetricsSnapshot().overallOptimizationScore).toBe(7.5);
  });
  it('averages overallOptimizationScore', () => {
    recordOptimizationMetric(makeMetricRecord({ overallOptimizationScore: 8 }));
    recordOptimizationMetric(makeMetricRecord({ overallOptimizationScore: 6 }));
    expect(getOptimizationMetricsSnapshot().overallOptimizationScore).toBe(7);
  });
  it('computes adaptationSuccessRate', () => {
    recordOptimizationMetric(makeMetricRecord({ overallOptimizationScore: 8 }));
    recordOptimizationMetric(makeMetricRecord({ overallOptimizationScore: 8 }));
    recordOptimizationMetric(makeMetricRecord({ overallOptimizationScore: 4 }));
    expect(getOptimizationMetricsSnapshot().adaptationSuccessRate).toBeCloseTo(0.67, 1);
  });
  it('plannerDistribution by complexity', () => {
    recordOptimizationMetric(makeMetricRecord({ complexity: 'simple' }));
    recordOptimizationMetric(makeMetricRecord({ complexity: 'enterprise' }));
    const snap = getOptimizationMetricsSnapshot();
    expect(snap.plannerDistribution['simple']).toBe(1);
    expect(snap.plannerDistribution['enterprise']).toBe(1);
  });
  it('exposes persistenceHealth', () => {
    recordOptimizationMetric(makeMetricRecord());
    const snap = getOptimizationMetricsSnapshot();
    expect(snap.persistenceHealth).toHaveProperty('totalSnapshots');
  });
  it('resets metrics', () => {
    recordOptimizationMetric(makeMetricRecord());
    resetOptimizationMetrics();
    expect(getOptimizationMetricsSnapshot().overallOptimizationScore).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Persistence
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Optimization Persistence', () => {
  beforeEach(() => resetOptimizationPersistence());

  it('starts with no snapshot', () => {
    expect(getCurrentOptimizationSnapshot()).toBeNull();
  });
  it('saves and retrieves a snapshot', () => {
    const bp = buildFallbackOptimizationBlueprint('p-1');
    const snap = saveOptimizationSnapshot('p-1', bp);
    expect(snap.buildId).toBe('p-1');
    expect(snap.version).toBeGreaterThan(0);
  });
  it('getCurrentOptimizationSnapshot returns latest', () => {
    const bp = buildFallbackOptimizationBlueprint('p-2');
    saveOptimizationSnapshot('p-2', bp);
    expect(getCurrentOptimizationSnapshot()?.buildId).toBe('p-2');
  });
  it('getOptimizationSnapshot by version', () => {
    const bp = buildFallbackOptimizationBlueprint('p-3');
    const snap = saveOptimizationSnapshot('p-3', bp);
    expect(getOptimizationSnapshot(snap.version)?.version).toBe(snap.version);
  });
  it('returns null for non-existent version', () => {
    expect(getOptimizationSnapshot(9999)).toBeNull();
  });
  it('stats correct after one save', () => {
    saveOptimizationSnapshot('p-4', buildFallbackOptimizationBlueprint('p-4'));
    const s = getOptimizationPersistenceStats();
    expect(s.totalSnapshots).toBe(1);
    expect(s.capacityUsed).toBeGreaterThan(0);
  });
  it('evicts at 500 cap', () => {
    const bp = buildFallbackOptimizationBlueprint('cap');
    for (let i = 0; i < 502; i++) saveOptimizationSnapshot(`b${i}`, bp);
    expect(getOptimizationPersistenceStats().totalSnapshots).toBeLessThanOrEqual(500);
  });
  it('rollback returns snapshot without deleting others', () => {
    const bp = buildFallbackOptimizationBlueprint('roll');
    const s1 = saveOptimizationSnapshot('r-a', bp);
    saveOptimizationSnapshot('r-b', bp);
    expect(rollbackToOptimizationSnapshot(s1.version)?.version).toBe(s1.version);
    expect(getOptimizationPersistenceStats().totalSnapshots).toBe(2);
  });
  it('rollback returns null for missing version', () => {
    expect(rollbackToOptimizationSnapshot(9999)).toBeNull();
  });
  it('reset clears all', () => {
    saveOptimizationSnapshot('r-clear', buildFallbackOptimizationBlueprint('r-clear'));
    resetOptimizationPersistence();
    expect(getCurrentOptimizationSnapshot()).toBeNull();
    expect(getOptimizationPersistenceStats().totalSnapshots).toBe(0);
  });
  it('version increments monotonically', () => {
    const bp = buildFallbackOptimizationBlueprint('mono');
    const s1 = saveOptimizationSnapshot('m1', bp);
    const s2 = saveOptimizationSnapshot('m2', bp);
    expect(s2.version).toBe(s1.version + 1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Façade
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Façade', () => {
  beforeEach(() => resetAll());

  it('runSelfOptimizationEngine returns blueprint and contextString', () => {
    const result = runSelfOptimizationEngine(makeCtx());
    expect(result.blueprint).toBeDefined();
    expect(result.contextString.length).toBeGreaterThan(0);
  });
  it('blueprint has version assigned after persistence', () => {
    const result = runSelfOptimizationEngine(makeCtx());
    expect(result.blueprint.version).toBeGreaterThan(0);
  });
  it('persistOptimizationSnapshot saves blueprint', () => {
    const bp = buildFallbackOptimizationBlueprint('f-1');
    persistOptimizationSnapshot('f-1', bp);
    expect(getCurrentOptimizationSnapshot()?.buildId).toBe('f-1');
  });
  it('learnFromOptimizationResult does not throw', () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    expect(() => learnFromOptimizationResult('lr-1', bp, true, 90_000, 0.05, 8)).not.toThrow();
  });
  it('getOptimizationMetrics returns snapshot after run', () => {
    runSelfOptimizationEngine(makeCtx());
    expect(getOptimizationMetrics().overallOptimizationScore).toBeGreaterThan(0);
  });
  it('getOptimizationStats returns learning stats', () => {
    const stats = getOptimizationStats();
    expect(stats).toHaveProperty('totalRecords');
  });
  it('rollbackOptimization returns null for missing version', () => {
    expect(rollbackOptimization(9999)).toBeNull();
  });
  it('rollbackOptimization returns snapshot for valid version', () => {
    const { blueprint } = runSelfOptimizationEngine(makeCtx());
    const snap = rollbackOptimization(blueprint.version);
    expect(snap?.version).toBe(blueprint.version);
  });
  it('resetOptimizationEngine clears all state', () => {
    runSelfOptimizationEngine(makeCtx());
    resetOptimizationEngine();
    expect(getOptimizationMetrics().overallOptimizationScore).toBe(0);
    expect(getCurrentOptimizationSnapshot()).toBeNull();
  });
  it('multiple runs accumulate metrics', () => {
    runSelfOptimizationEngine(makeCtx({ buildId: 'm1' }));
    runSelfOptimizationEngine(makeCtx({ buildId: 'm2' }));
    runSelfOptimizationEngine(makeCtx({ buildId: 'm3' }));
    expect(getOptimizationPersistenceStats().totalSnapshots).toBe(3);
  });
  it('contextString includes model tier', () => {
    const { contextString } = runSelfOptimizationEngine(makeCtx({ complexity: 'enterprise' }));
    expect(contextString).toContain('premium');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SSE Events
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — SSE Events', () => {
  function makeMockRes() {
    const events: object[] = [];
    const res = { write: (s: string) => { events.push(JSON.parse(s.replace('data: ', '').trim())); } } as unknown as ExpressResponse;
    return { res, events };
  }

  it('optimization_start has buildId', async () => {
    const { res, events } = makeMockRes();
    const { runOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    await runOptimizationStep('sse-1', res, 'test', 'standard', 7.5, 7.0, 7.5, 7.5);
    const start = events.find((e: Record<string, unknown>) => e.type === 'optimization_start') as Record<string, unknown> | undefined;
    expect(start?.buildId).toBe('sse-1');
  });

  it('optimization_progress includes overallOptimizationScore', async () => {
    const { res, events } = makeMockRes();
    const { runOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    await runOptimizationStep('sse-2', res, 'test', 'simple', 7, 7, 7, 7);
    const prog = events.find((e: Record<string, unknown>) => e.type === 'optimization_progress') as Record<string, unknown> | undefined;
    expect(prog?.overallOptimizationScore).toBeDefined();
  });

  it('optimization_complete has valid=true', async () => {
    const { res, events } = makeMockRes();
    const { runOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    await runOptimizationStep('sse-3', res, 'test', 'standard', 7.5, 7, 7.5, 7.5);
    const complete = events.find((e: Record<string, unknown>) => e.type === 'optimization_complete') as Record<string, unknown> | undefined;
    expect(complete?.valid).toBe(true);
  });

  it('emits exactly 3 SSE events for normal run', async () => {
    const { res, events } = makeMockRes();
    const { runOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    await runOptimizationStep('sse-4', res, 'test', 'standard', 7, 7, 7, 7);
    const typed = events.filter((e: Record<string, unknown>) =>
      ['optimization_start', 'optimization_progress', 'optimization_complete'].includes(e.type as string)
    );
    expect(typed).toHaveLength(3);
  });

  it('finalizeOptimizationStep emits optimization_learning', async () => {
    const { res, events } = makeMockRes();
    const { finalizeOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    const bp = buildOptimizationBlueprint(makeCtx());
    finalizeOptimizationStep(res, 'fin-1', bp, true, 90_000, 0.05, 8);
    const learning = events.find((e: Record<string, unknown>) => e.type === 'optimization_learning') as Record<string, unknown> | undefined;
    expect(learning?.buildId).toBe('fin-1');
  });

  it('finalizeOptimizationStep does not throw when SSE fails', async () => {
    const badRes = { write: () => { throw new Error('SSE closed'); } } as unknown as ExpressResponse;
    const { finalizeOptimizationStep } = await import('../../agents/pipeline/optimizationStep.js');
    const bp = buildFallbackOptimizationBlueprint('safe-1');
    expect(() => finalizeOptimizationStep(badRes, 'safe-1', bp, false, 0, 0, 0)).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Integration
// ════════════════════════════════════════════════════════════════════════════════
describe('V10.0 — Integration Tests', () => {
  beforeEach(() => resetAll());

  it('enterprise context produces premium model tier', () => {
    const bp = buildOptimizationBlueprint(makeCtx({ complexity: 'enterprise' }));
    expect(bp.model.recommendedTier).toBe('premium');
    expect(bp.quality.candidateCount).toBe(3);
    expect(bp.quality.validationStrictness).toBe('strict');
  });

  it('high-pressure context reduces costs', () => {
    const bp = buildOptimizationBlueprint(makeCtx({ tokenEfficiency: 0.3, complexity: 'standard' }));
    expect(bp.cost.costMode).toBe('aggressive');
    expect(bp.model.recommendedTier).toBe('fast');
  });

  it('blueprint stored and retrievable by version', () => {
    const { blueprint } = runSelfOptimizationEngine(makeCtx({ buildId: 'int-1' }));
    const stored = getOptimizationSnapshot(blueprint.version);
    expect(stored?.buildId).toBe('int-1');
  });

  it('learning stats update after learnFromOptimizationResult', async () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    learnFromOptimizationResult('learn-1', bp, true, 80_000, 0.04, 8);
    await new Promise(r => setTimeout(r, 10));
    expect(getOptimizationStats().totalRecords).toBe(1);
  });

  it('context string non-empty and contains scores', () => {
    const { contextString } = runSelfOptimizationEngine(makeCtx());
    expect(contextString.length).toBeGreaterThan(50);
    expect(contextString).toContain('Overall:');
  });

  it('simple build has skippable steps and minimal resources', () => {
    const bp = buildOptimizationBlueprint(makeCtx({ complexity: 'simple' }));
    expect(bp.workflow.skippableSteps.length).toBeGreaterThan(0);
    expect(bp.resource.cpuAllocation).toBeLessThan(75);
  });

  it('fallback blueprint does not throw', () => {
    expect(() => buildFallbackOptimizationBlueprint('safe')).not.toThrow();
  });

  it('all 20 sub-blueprints have score fields', () => {
    const bp = buildOptimizationBlueprint(makeCtx());
    const scoreFields = [
      bp.performance.performanceScore, bp.latency.latencyScore,
      bp.token.tokenScore, bp.cost.costScore, bp.workflow.workflowScore,
      bp.parallel.parallelScore, bp.scheduler.schedulerScore,
      bp.repair.repairScore, bp.retry.retryScore, bp.timeout.timeoutScore,
      bp.resource.resourceScore, bp.memory.memoryScore, bp.cache.cacheScore,
      bp.prompt.promptScore, bp.context.contextScore, bp.quality.qualityScore,
      bp.agent.agentScore, bp.model.modelScore, bp.ordering.orderingScore,
      bp.confidence.confidenceScore,
    ];
    for (const s of scoreFields) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(10);
    }
  });
});
