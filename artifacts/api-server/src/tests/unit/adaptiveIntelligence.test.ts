// ── V9.9 Autonomous Adaptive Intelligence Engine — Tests ──────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import type { Response as ExpressResponse } from 'express';

import {
  analyzeRuntime,
  selectStrategy,
  adaptAgents,
  adaptResources,
  adaptExecution,
  adaptQuality,
  adaptFailure,
  adaptPerformance,
  validateAdaptation,
  buildAdaptiveBlueprint,
  buildFallbackAdaptiveBlueprint,
} from '../../adaptive-intelligence/adaptiveIntelligence.js';

import {
  learnFromAdaptive,
  getAdaptiveLearningStats,
  hydrateAdaptiveLearning,
  resetAdaptiveLearning,
} from '../../adaptive-intelligence/adaptiveLearning.js';

import {
  recordAdaptiveMetric,
  getAdaptiveMetricsSnapshot,
  resetAdaptiveMetrics,
} from '../../adaptive-intelligence/adaptiveMetrics.js';

import {
  saveAdaptiveSnapshot,
  getCurrentAdaptiveSnapshot,
  getAdaptiveSnapshot,
  getAdaptivePersistenceStats,
  rollbackToAdaptiveSnapshot,
  resetAdaptivePersistence,
} from '../../adaptive-intelligence/adaptivePersistence.js';

import {
  runAdaptiveIntelligence,
  persistAdaptiveSnapshot,
  learnFromAdaptiveResult,
  getAdaptiveMetrics,
  getAdaptiveStats,
  rollbackAdaptive,
  resetAdaptive,
} from '../../adaptive-intelligence/adaptiveFacade.js';

import type {
  AdaptiveIntelligenceContext,
  AdaptiveLearningRecord,
  AdaptiveMetricRecord,
} from '../../adaptive-intelligence/adaptiveTypes.js';

// ── Helpers ─────────────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<AdaptiveIntelligenceContext> = {}): AdaptiveIntelligenceContext {
  return {
    buildId: 'test-build-1',
    prompt: 'Build a SaaS dashboard with analytics',
    complexity: 'standard',
    executionMode: 'balanced',
    chosenPath: 'A',
    reasoningScore: 7.5,
    planningScore: 7.0,
    executionScore: 7.5,
    tokenEfficiency: 0.8,
    totalTokenBudget: 50_000,
    expectedTotalCost: 0.05,
    historicalSuccessRate: 0.9,
    ...overrides,
  };
}

function makeLearningRecord(overrides: Partial<AdaptiveLearningRecord> = {}): AdaptiveLearningRecord {
  return {
    buildId: 'test-1',
    strategy: 'balanced',
    complexity: 'standard',
    adaptiveScore: 7.5,
    buildSucceeded: true,
    buildTimeMs: 90_000,
    estimatedBuildTimeMs: 85_000,
    agentsSkipped: 1,
    costActual: 0.05,
    costEstimated: 0.05,
    failuresDetected: 0,
    recordedAt: Date.now(),
    ...overrides,
  };
}

function makeMetricRecord(overrides: Partial<AdaptiveMetricRecord> = {}): AdaptiveMetricRecord {
  return {
    adaptiveScore: 7.5,
    runtimeOptimizationScore: 5,
    costOptimizationScore: 7,
    qualityOptimizationScore: 7.5,
    performanceGain: 0.1,
    failureReduction: 0,
    agentUtilization: 0.9,
    adaptationTimeMs: 20,
    strategy: 'balanced',
    complexity: 'standard',
    recordedAt: Date.now(),
    ...overrides,
  };
}

function resetAll() {
  resetAdaptive();
}

// ════════════════════════════════════════════════════════════════════════════════
// Phase 1 — Runtime Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 1: Runtime Adaptation', () => {
  it('sets complexityFactor=0.2 for simple', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'simple' }));
    expect(r.complexityFactor).toBe(0.2);
  });

  it('sets complexityFactor=0.5 for standard', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'standard' }));
    expect(r.complexityFactor).toBe(0.5);
  });

  it('sets complexityFactor=1.0 for enterprise', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'enterprise' }));
    expect(r.complexityFactor).toBe(1.0);
  });

  it('detects high resource pressure when tokenEfficiency < 0.5', () => {
    const r = analyzeRuntime(makeCtx({ tokenEfficiency: 0.4 }));
    expect(r.resourcePressure).toBe('high');
  });

  it('detects medium resource pressure when tokenEfficiency in 0.5-0.75', () => {
    const r = analyzeRuntime(makeCtx({ tokenEfficiency: 0.6 }));
    expect(r.resourcePressure).toBe('medium');
  });

  it('detects low resource pressure when tokenEfficiency >= 0.75', () => {
    const r = analyzeRuntime(makeCtx({ tokenEfficiency: 0.8 }));
    expect(r.resourcePressure).toBe('low');
  });

  it('detects enterprise mode for enterprise complexity', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'enterprise' }));
    expect(r.detectedMode).toBe('enterprise');
  });

  it('detects fast mode for simple + low pressure', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'simple', tokenEfficiency: 0.9 }));
    expect(r.detectedMode).toBe('fast');
  });

  it('detects quality mode for high reasoningScore', () => {
    const r = analyzeRuntime(makeCtx({ reasoningScore: 9, complexity: 'standard' }));
    expect(r.detectedMode).toBe('quality');
  });

  it('defaults to balanced mode', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'standard', reasoningScore: 7 }));
    expect(r.detectedMode).toBe('balanced');
  });

  it('sets adaptationRequired=true when complexityFactor > 0.5', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'enterprise' }));
    expect(r.adaptationRequired).toBe(true);
  });

  it('sets adaptationRequired=false for simple + low pressure', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'simple', tokenEfficiency: 0.9 }));
    expect(r.adaptationRequired).toBe(false);
  });

  it('includes adaptation reasons when applicable', () => {
    const r = analyzeRuntime(makeCtx({ complexity: 'enterprise', tokenEfficiency: 0.4 }));
    expect(r.adaptationReasons.length).toBeGreaterThan(0);
  });

  it('sets historicalSuccessRate from context', () => {
    const r = analyzeRuntime(makeCtx({ historicalSuccessRate: 0.75 }));
    expect(r.historicalSuccessRate).toBe(0.75);
  });

  it('defaults historicalSuccessRate to 1.0 when absent', () => {
    const r = analyzeRuntime(makeCtx({ historicalSuccessRate: undefined }));
    expect(r.historicalSuccessRate).toBe(1.0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 2 — Strategy Selection
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 2: Strategy Selection', () => {
  it('selects enterprise strategy for enterprise complexity', () => {
    const ctx = makeCtx({ complexity: 'enterprise' });
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.selectedStrategy).toBe('enterprise');
  });

  it('selects speed strategy for simple + low pressure', () => {
    const ctx = makeCtx({ complexity: 'simple', tokenEfficiency: 0.9 });
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.selectedStrategy).toBe('speed');
  });

  it('selects cost strategy for high resource pressure', () => {
    const ctx = makeCtx({ complexity: 'standard', tokenEfficiency: 0.3 });
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.selectedStrategy).toBe('cost');
  });

  it('selects balanced for standard complexity + medium pressure', () => {
    const ctx = makeCtx({ complexity: 'standard', tokenEfficiency: 0.8 });
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.selectedStrategy).toBe('balanced');
  });

  it('returns all five score dimensions', () => {
    const ctx = makeCtx();
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.speedScore).toBeGreaterThanOrEqual(0);
    expect(s.costScore).toBeGreaterThanOrEqual(0);
    expect(s.qualityScore).toBeGreaterThanOrEqual(0);
    expect(s.balancedScore).toBeGreaterThanOrEqual(0);
    expect(s.enterpriseScore).toBeGreaterThanOrEqual(0);
  });

  it('provides a rationale string', () => {
    const ctx = makeCtx();
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.strategyRationale.length).toBeGreaterThan(5);
  });

  it('strategyScore is between 0 and 10', () => {
    const ctx = makeCtx();
    const runtime = analyzeRuntime(ctx);
    const s = selectStrategy(ctx, runtime);
    expect(s.strategyScore).toBeGreaterThanOrEqual(0);
    expect(s.strategyScore).toBeLessThanOrEqual(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 3 — Agent Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 3: Agent Adaptation', () => {
  it('speed strategy skips agents for simple complexity', () => {
    const aa = adaptAgents('speed', makeCtx({ complexity: 'simple' }));
    expect(aa.agentsToSkip.length).toBeGreaterThan(0);
  });

  it('cost strategy skips expensive agents', () => {
    const aa = adaptAgents('cost', makeCtx());
    expect(aa.agentsToSkip).toContain('DesignDirector');
  });

  it('quality strategy upgrades quality agents', () => {
    const aa = adaptAgents('quality', makeCtx());
    expect(aa.agentsToUpgrade.length).toBeGreaterThan(0);
  });

  it('quality strategy repeats repair', () => {
    const aa = adaptAgents('quality', makeCtx());
    expect(aa.agentsToRepeat).toContain('Repair');
  });

  it('enterprise strategy upgrades agents and repeats repair', () => {
    const aa = adaptAgents('enterprise', makeCtx({ complexity: 'enterprise' }));
    expect(aa.agentsToUpgrade.length).toBeGreaterThan(0);
    expect(aa.agentsToRepeat.length).toBeGreaterThan(0);
  });

  it('balanced strategy with standard complexity skips nothing or minimal', () => {
    const aa = adaptAgents('balanced', makeCtx({ complexity: 'standard' }));
    expect(aa.agentsToSkip.length).toBe(0);
  });

  it('balanced strategy with simple complexity may skip DesignDirector', () => {
    const aa = adaptAgents('balanced', makeCtx({ complexity: 'simple' }));
    expect(aa.agentsToSkip).toContain('DesignDirector');
  });

  it('returns decisions array with action and reason', () => {
    const aa = adaptAgents('cost', makeCtx());
    expect(aa.decisions.length).toBeGreaterThan(0);
    expect(aa.decisions[0]).toHaveProperty('agent');
    expect(aa.decisions[0]).toHaveProperty('action');
    expect(aa.decisions[0]).toHaveProperty('reason');
  });

  it('skippableCount equals agentsToSkip.length', () => {
    const aa = adaptAgents('speed', makeCtx({ complexity: 'simple' }));
    expect(aa.skippableCount).toBe(aa.agentsToSkip.length);
  });

  it('totalAgents is a positive number', () => {
    const aa = adaptAgents('balanced', makeCtx());
    expect(aa.totalAgents).toBeGreaterThan(0);
  });

  it('cost strategy includes downgrade decisions', () => {
    const aa = adaptAgents('cost', makeCtx());
    expect(aa.agentsToDowngrade.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 4 — Resource Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 4: Resource Adaptation', () => {
  it('speed strategy has lower tokenBudget than enterprise', () => {
    const speed = adaptResources('speed', makeCtx());
    const enterprise = adaptResources('enterprise', makeCtx());
    expect(speed.tokenBudget).toBeLessThan(enterprise.tokenBudget);
  });

  it('cost strategy has zero retryBudget', () => {
    const rb = adaptResources('cost', makeCtx());
    expect(rb.retryBudget).toBe(0);
  });

  it('enterprise strategy has max cpuBudget', () => {
    const rb = adaptResources('enterprise', makeCtx());
    expect(rb.cpuBudget).toBe(100);
  });

  it('all strategies return positive tokenBudget', () => {
    for (const s of ['speed', 'cost', 'quality', 'balanced', 'enterprise'] as const) {
      const rb = adaptResources(s, makeCtx());
      expect(rb.tokenBudget).toBeGreaterThan(0);
    }
  });

  it('quality strategy has highest retryBudget', () => {
    const quality = adaptResources('quality', makeCtx());
    const speed = adaptResources('speed', makeCtx());
    expect(quality.retryBudget).toBeGreaterThan(speed.retryBudget);
  });

  it('respects custom totalTokenBudget from context', () => {
    const rb = adaptResources('balanced', makeCtx({ totalTokenBudget: 100_000 }));
    expect(rb.tokenBudget).toBe(100_000);
  });

  it('returns all six budget fields', () => {
    const rb = adaptResources('balanced', makeCtx());
    expect(rb).toHaveProperty('cpuBudget');
    expect(rb).toHaveProperty('memoryBudget');
    expect(rb).toHaveProperty('tokenBudget');
    expect(rb).toHaveProperty('apiBudget');
    expect(rb).toHaveProperty('retryBudget');
    expect(rb).toHaveProperty('timeoutBudget');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 5 — Execution Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 5: Execution Adaptation', () => {
  const lowRuntime = analyzeRuntime(makeCtx({ tokenEfficiency: 0.9 }));
  const highRuntime = analyzeRuntime(makeCtx({ tokenEfficiency: 0.3 }));

  it('speed strategy uses full parallelism', () => {
    const ea = adaptExecution('speed', lowRuntime);
    expect(ea.parallelism).toBe('full');
  });

  it('cost strategy uses sequential execution', () => {
    const ea = adaptExecution('cost', lowRuntime);
    expect(ea.parallelism).toBe('sequential');
  });

  it('enterprise strategy uses partial parallelism', () => {
    const ea = adaptExecution('enterprise', lowRuntime);
    expect(ea.parallelism).toBe('partial');
  });

  it('enterprise strategy uses resilient recovery', () => {
    const ea = adaptExecution('enterprise', lowRuntime);
    expect(ea.recoveryPolicy).toBe('resilient');
  });

  it('speed strategy uses fail-fast recovery', () => {
    const ea = adaptExecution('speed', lowRuntime);
    expect(ea.recoveryPolicy).toBe('fail-fast');
  });

  it('balanced strategy uses partial parallelism under high pressure', () => {
    const ea = adaptExecution('balanced', highRuntime);
    expect(ea.parallelism).toBe('partial');
  });

  it('balanced strategy uses full parallelism under low pressure', () => {
    const ea = adaptExecution('balanced', lowRuntime);
    expect(ea.parallelism).toBe('full');
  });

  it('returns maxParallelAgents > 0', () => {
    const ea = adaptExecution('balanced', lowRuntime);
    expect(ea.maxParallelAgents).toBeGreaterThan(0);
  });

  it('cost strategy uses cost-optimized execution order', () => {
    const ea = adaptExecution('cost', lowRuntime);
    expect(ea.executionOrder).toBe('cost-optimized');
  });

  it('quality strategy uses quality-first execution order', () => {
    const ea = adaptExecution('quality', lowRuntime);
    expect(ea.executionOrder).toBe('quality-first');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 6 — Quality Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 6: Quality Adaptation', () => {
  it('enterprise strategy has highest evaluation threshold', () => {
    const qa = adaptQuality('enterprise', makeCtx());
    expect(qa.evaluationThreshold).toBeGreaterThanOrEqual(8.5);
  });

  it('cost strategy has lowest evaluation threshold', () => {
    const cost = adaptQuality('cost', makeCtx());
    const quality = adaptQuality('quality', makeCtx());
    expect(cost.evaluationThreshold).toBeLessThan(quality.evaluationThreshold);
  });

  it('enterprise and quality strategies use 3 candidates', () => {
    expect(adaptQuality('enterprise', makeCtx()).candidateCount).toBe(3);
    expect(adaptQuality('quality', makeCtx()).candidateCount).toBe(3);
  });

  it('speed strategy uses 1 candidate', () => {
    const qa = adaptQuality('speed', makeCtx());
    expect(qa.candidateCount).toBe(1);
  });

  it('enterprise strategy has strict quality mode', () => {
    const qa = adaptQuality('enterprise', makeCtx());
    expect(qa.qualityMode).toBe('strict');
  });

  it('cost strategy has permissive quality mode', () => {
    const qa = adaptQuality('cost', makeCtx());
    expect(qa.qualityMode).toBe('permissive');
  });

  it('returns runtimePolicies array', () => {
    const qa = adaptQuality('balanced', makeCtx());
    expect(Array.isArray(qa.runtimePolicies)).toBe(true);
    expect(qa.runtimePolicies.length).toBeGreaterThan(0);
  });

  it('balanced strategy with enterprise complexity gets 2 candidates', () => {
    const qa = adaptQuality('balanced', makeCtx({ complexity: 'enterprise' }));
    expect(qa.candidateCount).toBe(3);
  });

  it('balanced strategy with simple complexity gets 1 candidate', () => {
    const qa = adaptQuality('balanced', makeCtx({ complexity: 'simple' }));
    expect(qa.candidateCount).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 7 — Failure Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 7: Failure Adaptation', () => {
  it('detects frequent-failures when successRate < 0.8', () => {
    const ctx = makeCtx({ historicalSuccessRate: 0.65 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    const pattern = fa.patterns.find(p => p.type === 'frequent-failures')!;
    expect(pattern.detected).toBe(true);
  });

  it('does not detect frequent-failures when successRate >= 0.8', () => {
    const ctx = makeCtx({ historicalSuccessRate: 0.95 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    const pattern = fa.patterns.find(p => p.type === 'frequent-failures')!;
    expect(pattern.detected).toBe(false);
  });

  it('detects cost-spikes on high resource pressure', () => {
    const ctx = makeCtx({ tokenEfficiency: 0.3 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    const pattern = fa.patterns.find(p => p.type === 'cost-spikes')!;
    expect(pattern.detected).toBe(true);
  });

  it('enables circuit breaker when 2+ patterns detected', () => {
    const ctx = makeCtx({ historicalSuccessRate: 0.5, tokenEfficiency: 0.3 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    expect(fa.circuitBreakerEnabled).toBe(true);
  });

  it('returns five failure pattern types', () => {
    const ctx = makeCtx();
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    expect(fa.patterns).toHaveLength(5);
  });

  it('returns detectedCount', () => {
    const ctx = makeCtx();
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    expect(typeof fa.detectedCount).toBe('number');
  });

  it('uses minimal-pipeline fallback for 3+ patterns', () => {
    const ctx = makeCtx({ historicalSuccessRate: 0.5, tokenEfficiency: 0.3, historicalBuildTimeMs: 200_000 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    expect(fa.fallbackStrategy).toBe('minimal-pipeline');
  });

  it('uses standard fallback with no failures detected', () => {
    const ctx = makeCtx({ historicalSuccessRate: 1.0, tokenEfficiency: 0.9, historicalBuildTimeMs: 60_000 });
    const runtime = analyzeRuntime(ctx);
    const fa = adaptFailure(ctx, runtime);
    expect(fa.fallbackStrategy).toBe('standard');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 8 — Performance Adaptation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 8: Performance Adaptation', () => {
  it('speed strategy has the lowest target build time', () => {
    const speed = adaptPerformance('speed', makeCtx());
    const enterprise = adaptPerformance('enterprise', makeCtx());
    expect(speed.targetBuildTimeMs).toBeLessThan(enterprise.targetBuildTimeMs);
  });

  it('cost strategy uses aggressive cost optimization', () => {
    const pa = adaptPerformance('cost', makeCtx());
    expect(pa.costOptimization).toBe('aggressive');
  });

  it('enterprise strategy uses none cost optimization', () => {
    const pa = adaptPerformance('enterprise', makeCtx());
    expect(pa.costOptimization).toBe('none');
  });

  it('speed strategy uses aggressive memory optimization', () => {
    const pa = adaptPerformance('speed', makeCtx());
    expect(pa.memoryOptimization).toBe('aggressive');
  });

  it('quality strategy uses thorough latency target', () => {
    const pa = adaptPerformance('quality', makeCtx());
    expect(pa.latencyTarget).toBe('thorough');
  });

  it('returns estimatedBuildTimeMs and estimatedCost', () => {
    const pa = adaptPerformance('balanced', makeCtx());
    expect(pa.estimatedBuildTimeMs).toBeGreaterThan(0);
    expect(pa.estimatedCost).toBeGreaterThan(0);
  });

  it('balanced strategy scales estimatedBuildTimeMs with complexity', () => {
    const simple = adaptPerformance('balanced', makeCtx({ complexity: 'simple' }));
    const enterprise = adaptPerformance('balanced', makeCtx({ complexity: 'enterprise' }));
    expect(simple.estimatedBuildTimeMs).toBeLessThan(enterprise.estimatedBuildTimeMs);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 9 — Adaptive Validator
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 9: Adaptive Validator', () => {
  function validate(ctx: AdaptiveIntelligenceContext) {
    const runtime   = analyzeRuntime(ctx);
    const strategy  = selectStrategy(ctx, runtime);
    const aa        = adaptAgents(strategy.selectedStrategy, ctx);
    const rb        = adaptResources(strategy.selectedStrategy, ctx);
    const ea        = adaptExecution(strategy.selectedStrategy, runtime);
    const qa        = adaptQuality(strategy.selectedStrategy, ctx);
    return validateAdaptation(ctx, runtime, strategy, aa, rb, ea, qa);
  }

  it('returns overallScore between 0 and 10', () => {
    const v = validate(makeCtx());
    expect(v.overallScore).toBeGreaterThanOrEqual(0);
    expect(v.overallScore).toBeLessThanOrEqual(10);
  });

  it('valid=true when overallScore >= 6', () => {
    const v = validate(makeCtx());
    expect(v.overallScore).toBeGreaterThanOrEqual(6);
    expect(v.valid).toBe(true);
  });

  it('returns six scoring dimensions', () => {
    const v = validate(makeCtx());
    expect(v.adaptationQuality).toBeGreaterThanOrEqual(0);
    expect(v.resourceUsageScore).toBeGreaterThanOrEqual(0);
    expect(v.costEfficiencyScore).toBeGreaterThanOrEqual(0);
    expect(v.runtimeStabilityScore).toBeGreaterThanOrEqual(0);
    expect(v.learningQualityScore).toBeGreaterThanOrEqual(0);
    expect(v.adaptationAccuracyScore).toBeGreaterThanOrEqual(0);
  });

  it('warns when historicalSuccessRate < 0.7', () => {
    const v = validate(makeCtx({ historicalSuccessRate: 0.5 }));
    expect(v.warnings.length).toBeGreaterThan(0);
  });

  it('no warnings for ideal context', () => {
    const v = validate(makeCtx({ complexity: 'standard', historicalSuccessRate: 0.95 }));
    expect(v.warnings.length).toBe(0);
  });

  it('enterprise strategy + enterprise complexity scores high adaptationQuality', () => {
    const v = validate(makeCtx({ complexity: 'enterprise' }));
    expect(v.adaptationQuality).toBe(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// buildAdaptiveBlueprint — Full Integration
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — buildAdaptiveBlueprint', () => {
  it('returns all required blueprint fields', () => {
    const bp = buildAdaptiveBlueprint(makeCtx());
    expect(bp).toHaveProperty('buildId');
    expect(bp).toHaveProperty('runtimeAdaptation');
    expect(bp).toHaveProperty('strategySelection');
    expect(bp).toHaveProperty('agentAdaptation');
    expect(bp).toHaveProperty('resourceBudget');
    expect(bp).toHaveProperty('executionAdaptation');
    expect(bp).toHaveProperty('qualityAdaptation');
    expect(bp).toHaveProperty('failureAdaptation');
    expect(bp).toHaveProperty('performanceAdaptation');
    expect(bp).toHaveProperty('validation');
    expect(bp).toHaveProperty('adaptiveScore');
    expect(bp).toHaveProperty('contextString');
    expect(bp).toHaveProperty('recordedAt');
  });

  it('adaptiveScore equals validation.overallScore', () => {
    const bp = buildAdaptiveBlueprint(makeCtx());
    expect(bp.adaptiveScore).toBe(bp.validation.overallScore);
  });

  it('contextString starts with V9.9 header', () => {
    const bp = buildAdaptiveBlueprint(makeCtx());
    expect(bp.contextString).toContain('V9.9 Adaptive Intelligence');
  });

  it('contextString includes strategy', () => {
    const bp = buildAdaptiveBlueprint(makeCtx({ complexity: 'enterprise' }));
    expect(bp.contextString).toContain('enterprise');
  });

  it('buildId is preserved', () => {
    const bp = buildAdaptiveBlueprint(makeCtx({ buildId: 'my-build-99' }));
    expect(bp.buildId).toBe('my-build-99');
  });

  it('recordedAt is a recent timestamp', () => {
    const before = Date.now();
    const bp = buildAdaptiveBlueprint(makeCtx());
    const after = Date.now();
    expect(bp.recordedAt).toBeGreaterThanOrEqual(before);
    expect(bp.recordedAt).toBeLessThanOrEqual(after);
  });

  it('works for all three complexity levels', () => {
    for (const complexity of ['simple', 'standard', 'enterprise'] as const) {
      const bp = buildAdaptiveBlueprint(makeCtx({ complexity }));
      expect(bp.validation.valid).toBe(true);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// buildFallbackAdaptiveBlueprint
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — buildFallbackAdaptiveBlueprint', () => {
  it('returns a valid blueprint', () => {
    const bp = buildFallbackAdaptiveBlueprint('fallback-1');
    expect(bp.buildId).toBe('fallback-1');
    expect(bp.validation.valid).toBe(true);
    expect(bp.adaptiveScore).toBeGreaterThan(0);
  });

  it('uses balanced strategy', () => {
    const bp = buildFallbackAdaptiveBlueprint('fallback-2');
    expect(bp.strategySelection.selectedStrategy).toBe('balanced');
  });

  it('contextString mentions fallback', () => {
    const bp = buildFallbackAdaptiveBlueprint('fallback-3');
    expect(bp.contextString.toLowerCase()).toContain('fallback');
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 10 — Adaptive Learning
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 10: Adaptive Learning', () => {
  beforeEach(() => resetAdaptiveLearning());

  it('starts with zero records', () => {
    const stats = getAdaptiveLearningStats();
    expect(stats.totalRecords).toBe(0);
  });

  it('records a learning entry', async () => {
    await learnFromAdaptive(makeLearningRecord());
    expect(getAdaptiveLearningStats().totalRecords).toBe(1);
  });

  it('computes averageAdaptiveScore', async () => {
    await learnFromAdaptive(makeLearningRecord({ adaptiveScore: 8.0 }));
    await learnFromAdaptive(makeLearningRecord({ adaptiveScore: 6.0 }));
    const stats = getAdaptiveLearningStats();
    expect(stats.averageAdaptiveScore).toBe(7.0);
  });

  it('computes buildSuccessRate', async () => {
    await learnFromAdaptive(makeLearningRecord({ buildSucceeded: true }));
    await learnFromAdaptive(makeLearningRecord({ buildSucceeded: false }));
    const stats = getAdaptiveLearningStats();
    expect(stats.buildSuccessRate).toBe(0.5);
  });

  it('groups by strategy', async () => {
    await learnFromAdaptive(makeLearningRecord({ strategy: 'speed' }));
    await learnFromAdaptive(makeLearningRecord({ strategy: 'cost' }));
    const stats = getAdaptiveLearningStats();
    expect(stats.byStrategy['speed']).toBeDefined();
    expect(stats.byStrategy['cost']).toBeDefined();
  });

  it('groups by complexity', async () => {
    await learnFromAdaptive(makeLearningRecord({ complexity: 'simple' }));
    await learnFromAdaptive(makeLearningRecord({ complexity: 'enterprise' }));
    const stats = getAdaptiveLearningStats();
    expect(stats.byComplexity['simple']).toBeDefined();
    expect(stats.byComplexity['enterprise']).toBeDefined();
  });

  it('caps at 500 records', async () => {
    for (let i = 0; i < 510; i++) {
      await learnFromAdaptive(makeLearningRecord({ buildId: `b${i}` }));
    }
    expect(getAdaptiveLearningStats().totalRecords).toBe(500);
  });

  it('hydrates records', () => {
    hydrateAdaptiveLearning([makeLearningRecord(), makeLearningRecord({ buildId: 'b2' })]);
    expect(getAdaptiveLearningStats().totalRecords).toBe(2);
  });

  it('resets learning data', async () => {
    await learnFromAdaptive(makeLearningRecord());
    resetAdaptiveLearning();
    expect(getAdaptiveLearningStats().totalRecords).toBe(0);
  });

  it('computes timeAccuracy', async () => {
    await learnFromAdaptive(makeLearningRecord({ buildTimeMs: 90_000, estimatedBuildTimeMs: 90_000 }));
    const stats = getAdaptiveLearningStats();
    expect(stats.timeAccuracy).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 11 — Adaptive Metrics
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 11: Adaptive Metrics', () => {
  beforeEach(() => resetAdaptiveMetrics());

  it('returns zero snapshot when empty', () => {
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.adaptiveScore).toBe(0);
    expect(snap.adaptationSuccessRate).toBe(0);
  });

  it('records a metric', () => {
    recordAdaptiveMetric(makeMetricRecord());
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.adaptiveScore).toBe(7.5);
  });

  it('computes average adaptiveScore', () => {
    recordAdaptiveMetric(makeMetricRecord({ adaptiveScore: 8 }));
    recordAdaptiveMetric(makeMetricRecord({ adaptiveScore: 6 }));
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.adaptiveScore).toBe(7);
  });

  it('computes plannerDistribution by strategy', () => {
    recordAdaptiveMetric(makeMetricRecord({ strategy: 'speed' }));
    recordAdaptiveMetric(makeMetricRecord({ strategy: 'balanced' }));
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.plannerDistribution['speed']).toBe(1);
    expect(snap.plannerDistribution['balanced']).toBe(1);
  });

  it('computes adaptationSuccessRate', () => {
    recordAdaptiveMetric(makeMetricRecord({ adaptiveScore: 8 }));
    recordAdaptiveMetric(makeMetricRecord({ adaptiveScore: 8 }));
    recordAdaptiveMetric(makeMetricRecord({ adaptiveScore: 4 })); // failure
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.adaptationSuccessRate).toBeCloseTo(0.67, 1);
  });

  it('caps at 500 records', () => {
    for (let i = 0; i < 510; i++) recordAdaptiveMetric(makeMetricRecord());
    // No error thrown — capped internally
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.adaptiveScore).toBeGreaterThan(0);
  });

  it('exposes persistenceHealth', () => {
    recordAdaptiveMetric(makeMetricRecord());
    const snap = getAdaptiveMetricsSnapshot();
    expect(snap.persistenceHealth).toHaveProperty('totalSnapshots');
    expect(snap.persistenceHealth).toHaveProperty('capacityUsed');
  });

  it('resets metrics', () => {
    recordAdaptiveMetric(makeMetricRecord());
    resetAdaptiveMetrics();
    expect(getAdaptiveMetricsSnapshot().adaptiveScore).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 12 — Adaptive Persistence
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 12: Adaptive Persistence', () => {
  beforeEach(() => resetAdaptivePersistence());

  it('starts with no snapshot', () => {
    expect(getCurrentAdaptiveSnapshot()).toBeNull();
  });

  it('saves and retrieves a snapshot', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-1');
    const snap = saveAdaptiveSnapshot('p-1', bp);
    expect(snap.buildId).toBe('p-1');
    expect(snap.version).toBeGreaterThan(0);
  });

  it('getCurrentAdaptiveSnapshot returns latest', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-2');
    saveAdaptiveSnapshot('p-2', bp);
    const cur = getCurrentAdaptiveSnapshot();
    expect(cur?.buildId).toBe('p-2');
  });

  it('getAdaptiveSnapshot retrieves by version', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-3');
    const snap = saveAdaptiveSnapshot('p-3', bp);
    const retrieved = getAdaptiveSnapshot(snap.version);
    expect(retrieved?.version).toBe(snap.version);
  });

  it('returns null for non-existent version', () => {
    expect(getAdaptiveSnapshot(9999)).toBeNull();
  });

  it('reports stats correctly', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-4');
    saveAdaptiveSnapshot('p-4', bp);
    const stats = getAdaptivePersistenceStats();
    expect(stats.totalSnapshots).toBe(1);
    expect(stats.currentVersion).toBe(1);
    expect(stats.capacityUsed).toBeGreaterThan(0);
  });

  it('evicts oldest snapshot at 500 cap', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-cap');
    for (let i = 0; i < 502; i++) saveAdaptiveSnapshot(`b${i}`, bp);
    const stats = getAdaptivePersistenceStats();
    expect(stats.totalSnapshots).toBeLessThanOrEqual(500);
  });

  it('rollback returns snapshot without deleting others', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-5');
    const s1 = saveAdaptiveSnapshot('p-5a', bp);
    saveAdaptiveSnapshot('p-5b', bp);
    const rolled = rollbackToAdaptiveSnapshot(s1.version);
    expect(rolled?.version).toBe(s1.version);
    const stats = getAdaptivePersistenceStats();
    expect(stats.totalSnapshots).toBe(2);
  });

  it('rollback returns null for missing version', () => {
    expect(rollbackToAdaptiveSnapshot(9999)).toBeNull();
  });

  it('resets clears all snapshots', () => {
    const bp = buildFallbackAdaptiveBlueprint('p-6');
    saveAdaptiveSnapshot('p-6', bp);
    resetAdaptivePersistence();
    expect(getCurrentAdaptiveSnapshot()).toBeNull();
    expect(getAdaptivePersistenceStats().totalSnapshots).toBe(0);
  });

  it('increments version monotonically', () => {
    const bp = buildFallbackAdaptiveBlueprint('mono');
    const s1 = saveAdaptiveSnapshot('m1', bp);
    const s2 = saveAdaptiveSnapshot('m2', bp);
    expect(s2.version).toBe(s1.version + 1);
  });

  it('assigns version to blueprint', () => {
    const bp = buildFallbackAdaptiveBlueprint('ver');
    const snap = saveAdaptiveSnapshot('ver', bp);
    expect(snap.blueprint.version).toBe(snap.version);
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Phase 18 — Façade
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 18: Façade', () => {
  beforeEach(() => resetAll());

  it('runAdaptiveIntelligence returns blueprint and contextString', () => {
    const result = runAdaptiveIntelligence(makeCtx());
    expect(result.blueprint).toBeDefined();
    expect(result.contextString.length).toBeGreaterThan(0);
  });

  it('blueprint has version assigned after persistence', () => {
    const result = runAdaptiveIntelligence(makeCtx());
    expect(result.blueprint.version).toBeGreaterThan(0);
  });

  it('persistAdaptiveSnapshot saves blueprint', () => {
    const bp = buildFallbackAdaptiveBlueprint('f-1');
    persistAdaptiveSnapshot('f-1', bp);
    const snap = getCurrentAdaptiveSnapshot();
    expect(snap?.buildId).toBe('f-1');
  });

  it('learnFromAdaptiveResult does not throw', () => {
    const bp = buildAdaptiveBlueprint(makeCtx());
    expect(() =>
      learnFromAdaptiveResult('lr-1', bp, true, 90_000, 0.05),
    ).not.toThrow();
  });

  it('getAdaptiveMetrics returns snapshot after run', () => {
    runAdaptiveIntelligence(makeCtx());
    const snap = getAdaptiveMetrics();
    expect(snap.adaptiveScore).toBeGreaterThan(0);
  });

  it('getAdaptiveStats returns learning stats', () => {
    const stats = getAdaptiveStats();
    expect(stats).toHaveProperty('totalRecords');
    expect(stats).toHaveProperty('averageAdaptiveScore');
  });

  it('rollbackAdaptive returns null for missing version', () => {
    const result = rollbackAdaptive(9999);
    expect(result).toBeNull();
  });

  it('rollbackAdaptive returns snapshot for valid version', () => {
    const { blueprint } = runAdaptiveIntelligence(makeCtx());
    const snap = rollbackAdaptive(blueprint.version);
    expect(snap).not.toBeNull();
    expect(snap?.version).toBe(blueprint.version);
  });

  it('resetAdaptive clears all state', () => {
    runAdaptiveIntelligence(makeCtx());
    resetAdaptive();
    expect(getAdaptiveMetrics().adaptiveScore).toBe(0);
    expect(getCurrentAdaptiveSnapshot()).toBeNull();
  });

  it('runAdaptiveIntelligence records metric', () => {
    runAdaptiveIntelligence(makeCtx());
    const snap = getAdaptiveMetrics();
    expect(snap.plannerDistribution).toBeDefined();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// SSE Event Validation
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Phase 14: SSE Events', () => {
  function makeMockRes() {
    const events: object[] = [];
    const res = { write: (s: string) => { events.push(JSON.parse(s.replace('data: ', '').trim())); } } as unknown as ExpressResponse;
    return { res, events };
  }

  it('adaptive_start event has buildId', async () => {
    const { res, events } = makeMockRes();
    const { runAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    await runAdaptiveIntelligenceStep('sse-1', res, 'test prompt', 'standard', 'A', 7.5, 'balanced', 7.0, 7.5);
    const start = events.find((e: Record<string, unknown>) => e.type === 'adaptive_start') as Record<string, unknown> | undefined;
    expect(start?.buildId).toBe('sse-1');
  });

  it('adaptive_progress event includes strategy', async () => {
    const { res, events } = makeMockRes();
    const { runAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    await runAdaptiveIntelligenceStep('sse-2', res, 'test', 'simple', 'A', 7, 'fast', 6.5, 7);
    const progress = events.find((e: Record<string, unknown>) => e.type === 'adaptive_progress') as Record<string, unknown> | undefined;
    expect(progress?.strategy).toBeDefined();
  });

  it('adaptive_complete event has valid=true', async () => {
    const { res, events } = makeMockRes();
    const { runAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    await runAdaptiveIntelligenceStep('sse-3', res, 'test', 'standard', 'A', 7.5, 'balanced', 7.0, 7.5);
    const complete = events.find((e: Record<string, unknown>) => e.type === 'adaptive_complete') as Record<string, unknown> | undefined;
    expect(complete?.valid).toBe(true);
  });

  it('emits exactly 3 SSE events for normal run', async () => {
    const { res, events } = makeMockRes();
    const { runAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    await runAdaptiveIntelligenceStep('sse-4', res, 'test', 'standard', 'A', 7, 'balanced', 7, 7);
    expect(events.filter((e: Record<string, unknown>) => ['adaptive_start','adaptive_progress','adaptive_complete'].includes(e.type as string))).toHaveLength(3);
  });

  it('finalizeAdaptiveIntelligenceStep emits adaptive_learning event', async () => {
    const { res, events } = makeMockRes();
    const { finalizeAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    const bp = buildAdaptiveBlueprint(makeCtx());
    finalizeAdaptiveIntelligenceStep(res, 'fin-1', bp, true, 90_000, 0.05);
    const learning = events.find((e: Record<string, unknown>) => e.type === 'adaptive_learning') as Record<string, unknown> | undefined;
    expect(learning?.buildId).toBe('fin-1');
  });

  it('finalizeAdaptiveIntelligenceStep does not throw when SSE fails', async () => {
    const badRes = { write: () => { throw new Error('SSE closed'); } } as unknown as ExpressResponse;
    const { finalizeAdaptiveIntelligenceStep } = await import('../../agents/pipeline/adaptiveIntelligenceStep.js');
    const bp = buildFallbackAdaptiveBlueprint('safe-1');
    expect(() => finalizeAdaptiveIntelligenceStep(badRes, 'safe-1', bp, false, 0, 0)).not.toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════════
// Integration — full pipeline context
// ════════════════════════════════════════════════════════════════════════════════
describe('V9.9 — Integration Tests', () => {
  beforeEach(() => resetAll());

  it('enterprise context produces enterprise strategy end-to-end', () => {
    const bp = buildAdaptiveBlueprint(makeCtx({ complexity: 'enterprise' }));
    expect(bp.strategySelection.selectedStrategy).toBe('enterprise');
    expect(bp.qualityAdaptation.candidateCount).toBe(3);
    expect(bp.qualityAdaptation.evaluationThreshold).toBeGreaterThanOrEqual(8.5);
    expect(bp.agentAdaptation.agentsToRepeat.length).toBeGreaterThan(0);
  });

  it('simple+low-pressure context produces fast/speed strategy', () => {
    const bp = buildAdaptiveBlueprint(makeCtx({ complexity: 'simple', tokenEfficiency: 0.95 }));
    expect(['speed', 'balanced']).toContain(bp.strategySelection.selectedStrategy);
    expect(bp.qualityAdaptation.candidateCount).toBeLessThanOrEqual(2);
  });

  it('high resource pressure context triggers cost adaptation', () => {
    const bp = buildAdaptiveBlueprint(makeCtx({ tokenEfficiency: 0.3, complexity: 'standard' }));
    expect(bp.strategySelection.selectedStrategy).toBe('cost');
    expect(bp.performanceAdaptation.costOptimization).toBe('aggressive');
  });

  it('blueprint from facade stores to persistence and is retrievable', () => {
    const { blueprint } = runAdaptiveIntelligence(makeCtx({ buildId: 'int-persist' }));
    const stored = getAdaptiveSnapshot(blueprint.version);
    expect(stored?.buildId).toBe('int-persist');
  });

  it('multiple runs accumulate metrics correctly', () => {
    runAdaptiveIntelligence(makeCtx({ buildId: 'multi-1' }));
    runAdaptiveIntelligence(makeCtx({ buildId: 'multi-2' }));
    runAdaptiveIntelligence(makeCtx({ buildId: 'multi-3' }));
    const snap = getAdaptiveMetrics();
    // Three snapshots recorded
    expect(snap.persistenceHealth.totalSnapshots).toBe(3);
  });

  it('learning stats update after learnFromAdaptiveResult', async () => {
    const bp = buildAdaptiveBlueprint(makeCtx());
    learnFromAdaptiveResult('learn-1', bp, true, 80_000, 0.04);
    // give fire-and-forget a tick
    await new Promise(r => setTimeout(r, 10));
    const stats = getAdaptiveStats();
    expect(stats.totalRecords).toBe(1);
  });

  it('context string appended to enriched prompt is non-empty', () => {
    const { contextString } = runAdaptiveIntelligence(makeCtx());
    expect(contextString.length).toBeGreaterThan(50);
    expect(contextString).toContain('Strategy:');
  });

  it('fallback blueprint is valid and non-throwing', () => {
    const bp = buildFallbackAdaptiveBlueprint('fallback-int');
    expect(bp.validation.valid).toBe(true);
    expect(bp.adaptiveScore).toBeGreaterThan(6);
  });

  it('runAdaptiveIntelligence with all upstream scores', () => {
    const ctx = makeCtx({
      productScore: 8, frontendScore: 8, backendScore: 7,
      devopsScore: 8, qaScore: 7,
    });
    const { blueprint } = runAdaptiveIntelligence(ctx);
    expect(blueprint.adaptiveScore).toBeGreaterThan(0);
  });
});
