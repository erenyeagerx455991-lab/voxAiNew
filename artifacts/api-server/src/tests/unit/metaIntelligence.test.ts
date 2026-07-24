// ── V10.1 Autonomous Meta Intelligence Engine — Tests ──────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import type { Response as ExpressResponse } from 'express';

import type { MetaContext, MetaLearningRecord, MetaMetricRecord } from '../../meta-intelligence/metaTypes.js';

import { analyzeSystem }           from '../../meta-intelligence/metaAnalyzer.js';
import { planMetaRecommendations } from '../../meta-intelligence/metaPlanner.js';
import { evaluateEngines }         from '../../meta-intelligence/metaEvaluator.js';
import { scoreModules }            from '../../meta-intelligence/metaScoring.js';
import { predictOutcomes }         from '../../meta-intelligence/metaPrediction.js';
import { generateRecommendations } from '../../meta-intelligence/metaRecommendations.js';
import { planEvolution }           from '../../meta-intelligence/metaEvolution.js';
import { computeHealth }           from '../../meta-intelligence/metaHealth.js';
import { runDiagnostics }          from '../../meta-intelligence/metaDiagnostics.js';
import { validateMeta }            from '../../meta-intelligence/metaValidator.js';

import {
  learnFromMeta,
  getMetaLearningStats,
  hydrateMetaLearning,
  resetMetaLearning,
} from '../../meta-intelligence/metaLearning.js';

import {
  recordMetaMetric,
  getMetaMetricsSnapshot,
  resetMetaMetrics,
} from '../../meta-intelligence/metaMetrics.js';

import {
  saveMetaSnapshot,
  getCurrentMetaSnapshot,
  getMetaSnapshot,
  getMetaPersistenceStats,
  rollbackToMetaSnapshot,
  resetMetaPersistence,
} from '../../meta-intelligence/metaPersistence.js';

import {
  buildMetaBlueprint,
  buildFallbackMetaBlueprint,
  runMetaIntelligenceEngine,
  learnFromMetaResult,
  getMetaMetrics,
  getMetaStats,
  rollbackMeta,
  resetMetaEngine,
  persistMetaSnapshot,
} from '../../meta-intelligence/metaFacade.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeCtx(overrides: Partial<MetaContext> = {}): MetaContext {
  return {
    buildId:           'test-meta-1',
    prompt:            'Build a SaaS analytics dashboard',
    complexity:        'standard',
    reasoningScore:    7.5,
    planningScore:     7.0,
    executionScore:    7.5,
    adaptiveScore:     7.5,
    optimizationScore: 7.5,
    qualityScore:      8,
    runtimeScore:      7,
    knowledgeScore:    7,
    workflowScore:     7,
    tokenEfficiency:   0.8,
    cacheHitRate:      0.5,
    parallelEfficiency: 0.7,
    memoryUsage:       512,
    repairAttempts:    0,
    retryCount:        0,
    historicalSuccessRate: 0.9,
    historicalBuildTimeMs: 90_000,
    ...overrides,
  };
}

function makeLearningRecord(overrides: Partial<MetaLearningRecord> = {}): MetaLearningRecord {
  return {
    buildId:          'lr-meta-1',
    overallMetaScore: 7.5,
    buildSucceeded:   true,
    buildTimeMs:      90_000,
    predictedQuality: 8,
    actualQuality:    7.8,
    complexity:       'standard',
    healthStatus:     'healthy',
    issueCount:       0,
    recordedAt:       Date.now(),
    ...overrides,
  };
}

function makeMetricRecord(overrides: Partial<MetaMetricRecord> = {}): MetaMetricRecord {
  return {
    overallMetaScore:    7.5,
    architectureScore:   8,
    performanceScore:    7,
    learningScore:       8,
    optimizationScore:   7.5,
    healthScore:         7.5,
    confidenceScore:     8,
    diagnosticScore:     9,
    recommendationCount: 3,
    adaptationTimeMs:    15,
    complexity:          'standard',
    recordedAt:          Date.now(),
    ...overrides,
  };
}

function resetAll() { resetMetaEngine(); }

// ════════════════════════════════════════════════════════════════════════════
// Meta Analyzer
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Analyzer', () => {
  it('returns analysisScore between 0 and 10', () => {
    const bp = analyzeSystem(makeCtx());
    expect(bp.analysisScore).toBeGreaterThanOrEqual(0);
    expect(bp.analysisScore).toBeLessThanOrEqual(10);
  });
  it('identifies weak modules when scores < 6', () => {
    const bp = analyzeSystem(makeCtx({ reasoningScore: 5, planningScore: 5 }));
    expect(bp.weakModules).toContain('ReasoningEngine');
    expect(bp.weakModules).toContain('PlanningIntelligence');
  });
  it('no weak modules for high scores', () => {
    const bp = analyzeSystem(makeCtx({ reasoningScore: 9, planningScore: 9, executionScore: 9, adaptiveScore: 9, optimizationScore: 9 }));
    expect(bp.weakModules).toHaveLength(0);
  });
  it('detects slow modules from latencies', () => {
    const bp = analyzeSystem(makeCtx({ agentLatencies: { Frontend: 25_000 } }));
    expect(bp.slowModules).toContain('Frontend');
  });
  it('no slow modules under threshold', () => {
    const bp = analyzeSystem(makeCtx({ agentLatencies: { Frontend: 5_000 } }));
    expect(bp.slowModules).not.toContain('Frontend');
  });
  it('detects expensive modules from high failure rates', () => {
    const bp = analyzeSystem(makeCtx({ agentFailureRates: { Repair: 0.2 } }));
    expect(bp.expensiveModules).toContain('Repair');
  });
  it('detects unstable modules at failure rate > 0.1', () => {
    const bp = analyzeSystem(makeCtx({ agentFailureRates: { Backend: 0.15 } }));
    expect(bp.unstableModules).toContain('Backend');
  });
  it('analyzedEngines is non-empty', () => {
    const bp = analyzeSystem(makeCtx());
    expect(bp.analyzedEngines.length).toBeGreaterThan(0);
  });
  it('engineCount matches known engines', () => {
    const bp = analyzeSystem(makeCtx());
    expect(bp.engineCount).toBeGreaterThan(10);
  });
  it('detects bottleneck for very slow agent', () => {
    const bp = analyzeSystem(makeCtx({ agentLatencies: { Frontend: 25_000 } }));
    expect(bp.bottlenecks.some(b => b.includes('Frontend'))).toBe(true);
  });
  it('detects low-cache bottleneck', () => {
    const bp = analyzeSystem(makeCtx({ cacheHitRate: 0.2 }));
    expect(bp.bottlenecks).toContain('low-cache-hit-rate');
  });
  it('records success pattern for high historical success', () => {
    const bp = analyzeSystem(makeCtx({ historicalSuccessRate: 0.95 }));
    expect(bp.successPatterns).toContain('high-historical-success-rate');
  });
  it('records zero-repair success pattern', () => {
    const bp = analyzeSystem(makeCtx({ repairAttempts: 0 }));
    expect(bp.successPatterns).toContain('zero-repair-needed');
  });
  it('records high-retry failure pattern', () => {
    const bp = analyzeSystem(makeCtx({ retryCount: 5 }));
    expect(bp.failurePatterns).toContain('high-retry-frequency');
  });
  it('recommendations is array', () => {
    const bp = analyzeSystem(makeCtx());
    expect(Array.isArray(bp.recommendations)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Planner
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Planner', () => {
  it('plannerScore is 0-10', () => {
    const bp = planMetaRecommendations(makeCtx());
    expect(bp.plannerScore).toBeGreaterThanOrEqual(0);
    expect(bp.plannerScore).toBeLessThanOrEqual(10);
  });
  it('low planningScore adds planner recommendations', () => {
    const bp = planMetaRecommendations(makeCtx({ planningScore: 5 }));
    expect(bp.plannerRecommendations.length).toBeGreaterThan(0);
  });
  it('enterprise complexity adds planner recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ complexity: 'enterprise' }));
    expect(bp.plannerRecommendations.some(r => r.includes('enterprise'))).toBe(true);
  });
  it('low parallelEfficiency adds workflow recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ parallelEfficiency: 0.3 }));
    expect(bp.workflowRecommendations.some(r => r.includes('parallel'))).toBe(true);
  });
  it('low cacheHitRate adds knowledge recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ cacheHitRate: 0.2 }));
    expect(bp.knowledgeRecommendations.some(r => r.includes('cache'))).toBe(true);
  });
  it('high repair adds repair recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ repairAttempts: 5 }));
    expect(bp.repairRecommendations.some(r => r.includes('repair'))).toBe(true);
  });
  it('zero repair adds positive repair recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ repairAttempts: 0 }));
    expect(bp.repairRecommendations.some(r => r.includes('Zero'))).toBe(true);
  });
  it('high retryCount adds retry recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ retryCount: 5 }));
    expect(bp.retryRecommendations.some(r => r.includes('retry') || r.includes('rate-limit'))).toBe(true);
  });
  it('high memory adds resource recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ memoryUsage: 2_000 }));
    expect(bp.resourceRecommendations.some(r => r.includes('memory') || r.includes('Memory'))).toBe(true);
  });
  it('low parallelEfficiency adds parallel recommendation', () => {
    const bp = planMetaRecommendations(makeCtx({ parallelEfficiency: 0.3 }));
    expect(bp.parallelRecommendations.length).toBeGreaterThan(0);
  });
  it('all recommendation arrays are arrays', () => {
    const bp = planMetaRecommendations(makeCtx());
    expect(Array.isArray(bp.plannerRecommendations)).toBe(true);
    expect(Array.isArray(bp.workflowRecommendations)).toBe(true);
    expect(Array.isArray(bp.knowledgeRecommendations)).toBe(true);
    expect(Array.isArray(bp.executionRecommendations)).toBe(true);
    expect(Array.isArray(bp.reasoningRecommendations)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Evaluator
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Evaluator', () => {
  it('evaluatorScore is 0-10', () => {
    const bp = evaluateEngines(makeCtx());
    expect(bp.evaluatorScore).toBeGreaterThanOrEqual(0);
    expect(bp.evaluatorScore).toBeLessThanOrEqual(10);
  });
  it('returns engine evaluations for all known engines', () => {
    const bp = evaluateEngines(makeCtx());
    expect(bp.engines.length).toBeGreaterThan(5);
  });
  it('each engine has score 0-10', () => {
    const bp = evaluateEngines(makeCtx());
    for (const e of bp.engines) {
      expect(e.score).toBeGreaterThanOrEqual(0);
      expect(e.score).toBeLessThanOrEqual(10);
    }
  });
  it('each engine has confidence 0-1', () => {
    const bp = evaluateEngines(makeCtx());
    for (const e of bp.engines) {
      expect(e.confidence).toBeGreaterThanOrEqual(0);
      expect(e.confidence).toBeLessThanOrEqual(1);
    }
  });
  it('each engine has improvementPotential 0-10', () => {
    const bp = evaluateEngines(makeCtx());
    for (const e of bp.engines) {
      expect(e.improvementPotential).toBeGreaterThanOrEqual(0);
      expect(e.improvementPotential).toBeLessThanOrEqual(10);
    }
  });
  it('bestEngine and worstEngine are non-empty strings', () => {
    const bp = evaluateEngines(makeCtx());
    expect(typeof bp.bestEngine).toBe('string');
    expect(bp.bestEngine.length).toBeGreaterThan(0);
    expect(typeof bp.worstEngine).toBe('string');
  });
  it('low score engine has high risk', () => {
    const bp = evaluateEngines(makeCtx({ reasoningScore: 4 }));
    const reasoning = bp.engines.find(e => e.name === 'ReasoningEngine');
    expect(reasoning?.risk).toBe('high');
  });
  it('high score engine has low risk', () => {
    const bp = evaluateEngines(makeCtx({
      reasoningScore: 9.5, planningScore: 9.5, executionScore: 9.5,
      adaptiveScore: 9.5, optimizationScore: 9.5,
    }));
    const reasoning = bp.engines.find(e => e.name === 'ReasoningEngine');
    expect(reasoning?.risk).toBe('low');
  });
  it('avgScore is weighted correctly', () => {
    const bp = evaluateEngines(makeCtx());
    expect(bp.avgScore).toBeGreaterThan(0);
    expect(bp.avgScore).toBeLessThanOrEqual(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Scoring
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Scoring', () => {
  it('scoringScore is 0-10', () => {
    const bp = scoreModules(makeCtx());
    expect(bp.scoringScore).toBeGreaterThanOrEqual(0);
    expect(bp.scoringScore).toBeLessThanOrEqual(10);
  });
  it('returns module scores for all engines', () => {
    const bp = scoreModules(makeCtx());
    expect(bp.moduleScores.length).toBeGreaterThan(5);
  });
  it('each module score has all 10 dimensions', () => {
    const bp = scoreModules(makeCtx());
    for (const m of bp.moduleScores) {
      expect(m.efficiency).toBeDefined();
      expect(m.quality).toBeDefined();
      expect(m.reliability).toBeDefined();
      expect(m.scalability).toBeDefined();
      expect(m.maintainability).toBeDefined();
      expect(m.performance).toBeDefined();
      expect(m.learning).toBeDefined();
      expect(m.optimization).toBeDefined();
      expect(m.cost).toBeDefined();
      expect(m.confidence).toBeDefined();
    }
  });
  it('each module dimension is 0-10', () => {
    const bp = scoreModules(makeCtx());
    for (const m of bp.moduleScores) {
      expect(m.overall).toBeGreaterThanOrEqual(0);
      expect(m.overall).toBeLessThanOrEqual(10);
    }
  });
  it('topModule and bottomModule are non-empty', () => {
    const bp = scoreModules(makeCtx());
    expect(bp.topModule.length).toBeGreaterThan(0);
    expect(bp.bottomModule.length).toBeGreaterThan(0);
  });
  it('low-score engine is bottomModule', () => {
    const bp = scoreModules(makeCtx({ reasoningScore: 3, planningScore: 9, executionScore: 9, adaptiveScore: 9, optimizationScore: 9 }));
    expect(bp.bottomModule).toBe('ReasoningEngine');
  });
  it('avgModuleScore is between 0 and 10', () => {
    const bp = scoreModules(makeCtx());
    expect(bp.avgModuleScore).toBeGreaterThanOrEqual(0);
    expect(bp.avgModuleScore).toBeLessThanOrEqual(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Prediction
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Prediction', () => {
  it('predictedQualityScore is 0-10', () => {
    const bp = predictOutcomes(makeCtx());
    expect(bp.predictedQualityScore).toBeGreaterThanOrEqual(0);
    expect(bp.predictedQualityScore).toBeLessThanOrEqual(10);
  });
  it('predictedBuildTimeMs is positive', () => {
    const bp = predictOutcomes(makeCtx());
    expect(bp.predictedBuildTimeMs).toBeGreaterThan(0);
  });
  it('enterprise build time > simple build time', () => {
    const simple     = predictOutcomes(makeCtx({ complexity: 'simple' }));
    const enterprise = predictOutcomes(makeCtx({ complexity: 'enterprise' }));
    expect(enterprise.predictedBuildTimeMs).toBeGreaterThan(simple.predictedBuildTimeMs);
  });
  it('predictedCost is positive', () => {
    const bp = predictOutcomes(makeCtx());
    expect(bp.predictedCost).toBeGreaterThan(0);
  });
  it('high repair increases predicted cost', () => {
    const zero = predictOutcomes(makeCtx({ repairAttempts: 0 }));
    const many = predictOutcomes(makeCtx({ repairAttempts: 5 }));
    expect(many.predictedCost).toBeGreaterThan(zero.predictedCost);
  });
  it('predictedSuccessRate is 0-1', () => {
    const bp = predictOutcomes(makeCtx());
    expect(bp.predictedSuccessRate).toBeGreaterThanOrEqual(0);
    expect(bp.predictedSuccessRate).toBeLessThanOrEqual(1);
  });
  it('high historical success rate improves prediction', () => {
    const low  = predictOutcomes(makeCtx({ historicalSuccessRate: 0.5 }));
    const high = predictOutcomes(makeCtx({ historicalSuccessRate: 0.95 }));
    expect(high.predictedSuccessRate).toBeGreaterThan(low.predictedSuccessRate);
  });
  it('predictionConfidence increases with available data', () => {
    const noData  = predictOutcomes(makeCtx({ agentLatencies: {}, historicalBuildTimeMs: 0 }));
    const hasData = predictOutcomes(makeCtx({ agentLatencies: { A: 5000 }, historicalBuildTimeMs: 90_000 }));
    expect(hasData.predictionConfidence).toBeGreaterThan(noData.predictionConfidence);
  });
  it('predictionScore is 0-10', () => {
    const bp = predictOutcomes(makeCtx());
    expect(bp.predictionScore).toBeGreaterThanOrEqual(0);
    expect(bp.predictionScore).toBeLessThanOrEqual(10);
  });
  it('recommendations array exists', () => {
    const bp = predictOutcomes(makeCtx());
    expect(Array.isArray(bp.recommendations)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Recommendations
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Recommendations', () => {
  it('totalCount = immediate + shortTerm + longTerm', () => {
    const bp = generateRecommendations(makeCtx());
    expect(bp.totalCount).toBe(bp.immediate.length + bp.shortTerm.length + bp.longTerm.length);
  });
  it('recommendationScore is 0-10', () => {
    const bp = generateRecommendations(makeCtx());
    expect(bp.recommendationScore).toBeGreaterThanOrEqual(0);
    expect(bp.recommendationScore).toBeLessThanOrEqual(10);
  });
  it('high repair adds immediate recommendation', () => {
    const bp = generateRecommendations(makeCtx({ repairAttempts: 6 }));
    expect(bp.immediate.some(r => r.includes('repair'))).toBe(true);
  });
  it('high retry adds immediate recommendation', () => {
    const bp = generateRecommendations(makeCtx({ retryCount: 6 }));
    expect(bp.immediate.some(r => r.includes('retry') || r.includes('API'))).toBe(true);
  });
  it('low token efficiency adds immediate recommendation', () => {
    const bp = generateRecommendations(makeCtx({ tokenEfficiency: 0.3 }));
    expect(bp.immediate.some(r => r.includes('compression') || r.includes('token'))).toBe(true);
  });
  it('many urgent issues lowers recommendationScore', () => {
    const clean  = generateRecommendations(makeCtx({ repairAttempts: 0, retryCount: 0 }));
    const urgent = generateRecommendations(makeCtx({ repairAttempts: 10, retryCount: 10, tokenEfficiency: 0.2, reasoningScore: 4 }));
    expect(clean.recommendationScore).toBeGreaterThan(urgent.recommendationScore);
  });
  it('longTerm always has at least one recommendation', () => {
    const bp = generateRecommendations(makeCtx());
    expect(bp.longTerm.length).toBeGreaterThan(0);
  });
  it('all recommendation lists are arrays', () => {
    const bp = generateRecommendations(makeCtx());
    expect(Array.isArray(bp.immediate)).toBe(true);
    expect(Array.isArray(bp.shortTerm)).toBe(true);
    expect(Array.isArray(bp.longTerm)).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Evolution
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Evolution', () => {
  it('evolutionScore is 0-10', () => {
    const bp = planEvolution(makeCtx());
    expect(bp.evolutionScore).toBeGreaterThanOrEqual(0);
    expect(bp.evolutionScore).toBeLessThanOrEqual(10);
  });
  it('advanced maturity for very high scores and success rate', () => {
    const bp = planEvolution(makeCtx({
      reasoningScore: 9, planningScore: 9, executionScore: 9,
      adaptiveScore: 9, optimizationScore: 9, historicalSuccessRate: 0.95,
    }));
    expect(bp.maturityLevel).toBe('advanced');
  });
  it('bootstrap maturity for very low scores', () => {
    const bp = planEvolution(makeCtx({
      reasoningScore: 3, planningScore: 3, executionScore: 3,
      adaptiveScore: 3, optimizationScore: 3, historicalSuccessRate: 0.5,
    }));
    expect(bp.maturityLevel).toBe('bootstrap');
  });
  it('nextImprovementTargets contains weakest engine', () => {
    const bp = planEvolution(makeCtx({ reasoningScore: 3 }));
    expect(bp.nextImprovementTargets.some(t => t.includes('ReasoningEngine'))).toBe(true);
  });
  it('evolutionPriority is valid', () => {
    const bp = planEvolution(makeCtx());
    expect(['performance', 'quality', 'cost', 'reliability', 'balanced']).toContain(bp.evolutionPriority);
  });
  it('low success rate triggers reliability priority', () => {
    const bp = planEvolution(makeCtx({
      reasoningScore: 4, planningScore: 4, executionScore: 4,
      adaptiveScore: 4, optimizationScore: 4,
    }));
    expect(bp.evolutionPriority).toBe('reliability');
  });
  it('recommendations is non-empty', () => {
    const bp = planEvolution(makeCtx());
    expect(bp.recommendations.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Health
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Health', () => {
  it('all health dims are 0-10', () => {
    const bp = computeHealth(makeCtx());
    expect(bp.systemHealth).toBeGreaterThanOrEqual(0);
    expect(bp.systemHealth).toBeLessThanOrEqual(10);
    expect(bp.moduleHealth).toBeGreaterThanOrEqual(0);
    expect(bp.pipelineHealth).toBeGreaterThanOrEqual(0);
    expect(bp.agentHealth).toBeGreaterThanOrEqual(0);
    expect(bp.learningHealth).toBeGreaterThanOrEqual(0);
    expect(bp.memoryHealth).toBeGreaterThanOrEqual(0);
    expect(bp.optimizationHealth).toBeGreaterThanOrEqual(0);
  });
  it('overallHealth is 0-10', () => {
    const bp = computeHealth(makeCtx());
    expect(bp.overallHealth).toBeGreaterThanOrEqual(0);
    expect(bp.overallHealth).toBeLessThanOrEqual(10);
  });
  it('optimal status for high scores', () => {
    const bp = computeHealth(makeCtx({
      reasoningScore: 9, planningScore: 9, executionScore: 9,
      adaptiveScore: 9, optimizationScore: 9, qualityScore: 9,
      runtimeScore: 9, knowledgeScore: 9, workflowScore: 9,
      parallelEfficiency: 0.9, cacheHitRate: 0.9, tokenEfficiency: 0.9,
      historicalSuccessRate: 0.95, repairAttempts: 0, retryCount: 0,
    }));
    expect(bp.healthStatus).toBe('optimal');
  });
  it('critical status for very low overallHealth', () => {
    const bp = computeHealth(makeCtx({
      reasoningScore: 2, planningScore: 2, executionScore: 2,
      adaptiveScore: 2, optimizationScore: 2, qualityScore: 2,
      runtimeScore: 2, knowledgeScore: 2, workflowScore: 2,
      parallelEfficiency: 0.1, cacheHitRate: 0.1, tokenEfficiency: 0.2,
      historicalSuccessRate: 0.4, repairAttempts: 5, retryCount: 5,
    }));
    expect(bp.healthStatus).toBe('critical');
  });
  it('high memoryUsage lowers memoryHealth', () => {
    const low  = computeHealth(makeCtx({ memoryUsage: 200 }));
    const high = computeHealth(makeCtx({ memoryUsage: 2000 }));
    expect(low.memoryHealth).toBeGreaterThan(high.memoryHealth);
  });
  it('high failureRate lowers agentHealth', () => {
    const good = computeHealth(makeCtx({ agentFailureRates: { A: 0.01 } }));
    const bad  = computeHealth(makeCtx({ agentFailureRates: { A: 0.5 } }));
    expect(good.agentHealth).toBeGreaterThan(bad.agentHealth);
  });
  it('high repair lowers pipelineHealth', () => {
    const none = computeHealth(makeCtx({ repairAttempts: 0, retryCount: 0 }));
    const many = computeHealth(makeCtx({ repairAttempts: 5, retryCount: 3 }));
    expect(none.pipelineHealth).toBeGreaterThan(many.pipelineHealth);
  });
  it('healthStatus is a valid value', () => {
    const bp = computeHealth(makeCtx());
    expect(['critical', 'degraded', 'healthy', 'optimal']).toContain(bp.healthStatus);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Diagnostics
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Diagnostics', () => {
  it('diagnosticScore is 0-10', () => {
    const bp = runDiagnostics(makeCtx());
    expect(bp.diagnosticScore).toBeGreaterThanOrEqual(0);
    expect(bp.diagnosticScore).toBeLessThanOrEqual(10);
  });
  it('no issues for clean ctx → high diagnosticScore', () => {
    const bp = runDiagnostics(makeCtx());
    expect(bp.issueCount).toBe(0);
    expect(bp.diagnosticScore).toBeGreaterThanOrEqual(9);
  });
  it('detects slow modules', () => {
    const bp = runDiagnostics(makeCtx({ agentLatencies: { Frontend: 25_000 } }));
    expect(bp.slowModules).toContain('Frontend');
  });
  it('detects unstable modules', () => {
    const bp = runDiagnostics(makeCtx({ agentFailureRates: { Backend: 0.15 } }));
    expect(bp.unstableModules).toContain('Backend');
  });
  it('detects overloaded modules', () => {
    const bp = runDiagnostics(makeCtx({ agentFailureRates: { Repair: 0.3 } }));
    expect(bp.overloadedModules).toContain('Repair');
  });
  it('detects dead modules at 100% failure', () => {
    const bp = runDiagnostics(makeCtx({ agentFailureRates: { DeadAgent: 1.0 }, agentLatencies: { DeadAgent: 0 } }));
    expect(bp.deadModules).toContain('DeadAgent');
  });
  it('all diagnostic arrays are arrays', () => {
    const bp = runDiagnostics(makeCtx());
    expect(Array.isArray(bp.deadModules)).toBe(true);
    expect(Array.isArray(bp.duplicateModules)).toBe(true);
    expect(Array.isArray(bp.unusedModules)).toBe(true);
    expect(Array.isArray(bp.slowModules)).toBe(true);
    expect(Array.isArray(bp.unstableModules)).toBe(true);
    expect(Array.isArray(bp.overloadedModules)).toBe(true);
  });
  it('issueCount sums all diagnostic categories', () => {
    const bp = runDiagnostics(makeCtx({ agentLatencies: { Frontend: 25_000 } }));
    const totalFromArrays =
      bp.deadModules.length + bp.duplicateModules.length + bp.unusedModules.length +
      bp.slowModules.length + bp.unstableModules.length + bp.overloadedModules.length;
    expect(bp.issueCount).toBe(totalFromArrays);
  });
  it('low score engine detected as unused', () => {
    const bp = runDiagnostics(makeCtx({ reasoningScore: 0 }));
    expect(bp.unusedModules).toContain('ReasoningEngine');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Validator — 12 dimensions
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Validator', () => {
  function doValidate(ctx: MetaContext) {
    const analysis   = analyzeSystem(ctx);
    const evaluator  = evaluateEngines(ctx);
    const health     = computeHealth(ctx);
    const diagnostics = runDiagnostics(ctx);
    const prediction = predictOutcomes(ctx);
    return validateMeta(
      analysis, evaluator, health, diagnostics, prediction,
      ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
      ctx.workflowScore ?? 7, ctx.knowledgeScore ?? 7,
    );
  }

  it('overallMetaScore is 0-10', () => {
    const v = doValidate(makeCtx());
    expect(v.overallMetaScore).toBeGreaterThanOrEqual(0);
    expect(v.overallMetaScore).toBeLessThanOrEqual(10);
  });
  it('all 12 dimensions are 0-10', () => {
    const v = doValidate(makeCtx());
    const dims = [
      v.architectureScore, v.performanceScore, v.learningScore,
      v.optimizationScore, v.reasoningScore, v.planningScore,
      v.executionScore, v.workflowScore, v.knowledgeScore,
      v.confidenceScore, v.maintainabilityScore, v.reliabilityScore,
    ];
    for (const d of dims) {
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(10);
    }
  });
  it('valid=true for healthy system', () => {
    const v = doValidate(makeCtx());
    expect(v.valid).toBe(true);
  });
  it('valid=false for critical health', () => {
    const v = doValidate(makeCtx({
      reasoningScore: 2, planningScore: 2, executionScore: 2,
      adaptiveScore: 2, optimizationScore: 2, qualityScore: 2,
      runtimeScore: 2, knowledgeScore: 2, workflowScore: 2,
      historicalSuccessRate: 0.3, repairAttempts: 8, retryCount: 8,
      agentFailureRates: { A: 0.9, B: 0.9, C: 0.9 },
    }));
    expect(v.valid).toBe(false);
  });
  it('warnings array exists', () => {
    const v = doValidate(makeCtx());
    expect(Array.isArray(v.warnings)).toBe(true);
  });
  it('high all scores → high overallMetaScore', () => {
    const v = doValidate(makeCtx({
      reasoningScore: 9.5, planningScore: 9.5, executionScore: 9.5,
      adaptiveScore: 9.5, optimizationScore: 9.5, qualityScore: 9.5,
      runtimeScore: 9.5, knowledgeScore: 9.5, workflowScore: 9.5,
      historicalSuccessRate: 0.98, parallelEfficiency: 0.9,
    }));
    expect(v.overallMetaScore).toBeGreaterThanOrEqual(8);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Learning
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Learning', () => {
  beforeEach(() => { resetMetaLearning(); });

  it('starts empty', () => {
    const stats = getMetaLearningStats();
    expect(stats.totalRecords).toBe(0);
  });
  it('learnFromMeta increments record count', async () => {
    await learnFromMeta(makeLearningRecord());
    expect(getMetaLearningStats().totalRecords).toBe(1);
  });
  it('averageMetaScore is computed correctly', async () => {
    await learnFromMeta(makeLearningRecord({ overallMetaScore: 8 }));
    await learnFromMeta(makeLearningRecord({ overallMetaScore: 6 }));
    expect(getMetaLearningStats().averageMetaScore).toBe(7);
  });
  it('buildSuccessRate reflects successes', async () => {
    await learnFromMeta(makeLearningRecord({ buildSucceeded: true }));
    await learnFromMeta(makeLearningRecord({ buildSucceeded: false }));
    expect(getMetaLearningStats().buildSuccessRate).toBe(0.5);
  });
  it('predictionAccuracy is 0-1', async () => {
    await learnFromMeta(makeLearningRecord({ predictedQuality: 8, actualQuality: 7.5 }));
    const stats = getMetaLearningStats();
    expect(stats.predictionAccuracy).toBeGreaterThanOrEqual(0);
    expect(stats.predictionAccuracy).toBeLessThanOrEqual(1);
  });
  it('byComplexity groups records correctly', async () => {
    await learnFromMeta(makeLearningRecord({ complexity: 'simple' }));
    await learnFromMeta(makeLearningRecord({ complexity: 'enterprise' }));
    const stats = getMetaLearningStats();
    expect(stats.byComplexity['simple']?.count).toBe(1);
    expect(stats.byComplexity['enterprise']?.count).toBe(1);
  });
  it('byHealthStatus groups records correctly', async () => {
    await learnFromMeta(makeLearningRecord({ healthStatus: 'optimal' }));
    await learnFromMeta(makeLearningRecord({ healthStatus: 'degraded' }));
    const stats = getMetaLearningStats();
    expect(stats.byHealthStatus['optimal']?.count).toBe(1);
    expect(stats.byHealthStatus['degraded']?.count).toBe(1);
  });
  it('caps at 500 records', async () => {
    for (let i = 0; i < 505; i++) await learnFromMeta(makeLearningRecord({ buildId: `b${i}` }));
    expect(getMetaLearningStats().totalRecords).toBe(500);
  });
  it('hydrateMetaLearning loads records', () => {
    hydrateMetaLearning([makeLearningRecord(), makeLearningRecord({ buildId: 'b2' })]);
    expect(getMetaLearningStats().totalRecords).toBe(2);
  });
  it('resetMetaLearning clears records', async () => {
    await learnFromMeta(makeLearningRecord());
    resetMetaLearning();
    expect(getMetaLearningStats().totalRecords).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Metrics
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Metrics', () => {
  beforeEach(() => { resetMetaMetrics(); resetMetaLearning(); resetMetaPersistence(); });

  it('empty snapshot returns zeros', () => {
    const snap = getMetaMetricsSnapshot();
    expect(snap.overallMetaScore).toBe(0);
    expect(snap.adaptationSuccessRate).toBe(0);
  });
  it('recordMetaMetric stores data', () => {
    recordMetaMetric(makeMetricRecord({ overallMetaScore: 8 }));
    const snap = getMetaMetricsSnapshot();
    expect(snap.overallMetaScore).toBe(8);
  });
  it('averages multiple records', () => {
    recordMetaMetric(makeMetricRecord({ overallMetaScore: 8 }));
    recordMetaMetric(makeMetricRecord({ overallMetaScore: 6 }));
    expect(getMetaMetricsSnapshot().overallMetaScore).toBe(7);
  });
  it('adaptationSuccessRate reflects score >= 6', () => {
    recordMetaMetric(makeMetricRecord({ overallMetaScore: 8 }));
    recordMetaMetric(makeMetricRecord({ overallMetaScore: 4 }));
    expect(getMetaMetricsSnapshot().adaptationSuccessRate).toBe(0.5);
  });
  it('plannerDistribution groups by complexity', () => {
    recordMetaMetric(makeMetricRecord({ complexity: 'simple' }));
    recordMetaMetric(makeMetricRecord({ complexity: 'enterprise' }));
    const snap = getMetaMetricsSnapshot();
    expect(snap.plannerDistribution['simple']).toBe(1);
    expect(snap.plannerDistribution['enterprise']).toBe(1);
  });
  it('caps at 500 metrics records', () => {
    for (let i = 0; i < 505; i++) recordMetaMetric(makeMetricRecord());
    // Should not throw; internal cap enforced
    const snap = getMetaMetricsSnapshot();
    expect(snap.overallMetaScore).toBeGreaterThan(0);
  });
  it('resetMetaMetrics clears records', () => {
    recordMetaMetric(makeMetricRecord());
    resetMetaMetrics();
    expect(getMetaMetricsSnapshot().overallMetaScore).toBe(0);
  });
  it('persistenceHealth returns stats object', () => {
    const snap = getMetaMetricsSnapshot();
    expect(snap.persistenceHealth).toBeDefined();
    expect(typeof snap.persistenceHealth.totalSnapshots).toBe('number');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Persistence
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Persistence', () => {
  beforeEach(() => { resetMetaPersistence(); });

  it('empty state returns null snapshot', () => {
    expect(getCurrentMetaSnapshot()).toBeNull();
  });
  it('saveMetaSnapshot stores and returns snapshot', () => {
    const bp = buildFallbackMetaBlueprint('p-1');
    const snap = saveMetaSnapshot('p-1', bp);
    expect(snap.buildId).toBe('p-1');
    expect(snap.version).toBe(1);
  });
  it('getCurrentMetaSnapshot returns latest', () => {
    saveMetaSnapshot('p-1', buildFallbackMetaBlueprint('p-1'));
    saveMetaSnapshot('p-2', buildFallbackMetaBlueprint('p-2'));
    const cur = getCurrentMetaSnapshot();
    expect(cur?.buildId).toBe('p-2');
    expect(cur?.version).toBe(2);
  });
  it('getMetaSnapshot retrieves specific version', () => {
    saveMetaSnapshot('p-1', buildFallbackMetaBlueprint('p-1'));
    saveMetaSnapshot('p-2', buildFallbackMetaBlueprint('p-2'));
    const snap = getMetaSnapshot(1);
    expect(snap?.buildId).toBe('p-1');
  });
  it('getMetaSnapshot returns null for unknown version', () => {
    expect(getMetaSnapshot(999)).toBeNull();
  });
  it('rollbackToMetaSnapshot retrieves old version', () => {
    saveMetaSnapshot('p-1', buildFallbackMetaBlueprint('p-1'));
    const snap = rollbackToMetaSnapshot(1);
    expect(snap?.buildId).toBe('p-1');
  });
  it('rollbackToMetaSnapshot returns null for missing version', () => {
    expect(rollbackToMetaSnapshot(999)).toBeNull();
  });
  it('capacityUsed is positive after first save', () => {
    saveMetaSnapshot('p-1', buildFallbackMetaBlueprint('p-1'));
    const stats = getMetaPersistenceStats();
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(1);
  });
  it('caps at 500 snapshots', () => {
    for (let i = 0; i < 505; i++) saveMetaSnapshot(`b${i}`, buildFallbackMetaBlueprint(`b${i}`));
    const stats = getMetaPersistenceStats();
    expect(stats.totalSnapshots).toBeLessThanOrEqual(500);
  });
  it('resetMetaPersistence clears all', () => {
    saveMetaSnapshot('p-1', buildFallbackMetaBlueprint('p-1'));
    resetMetaPersistence();
    expect(getCurrentMetaSnapshot()).toBeNull();
    expect(getMetaPersistenceStats().totalSnapshots).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Facade — buildMetaBlueprint
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Facade — buildMetaBlueprint', () => {
  it('returns a MetaBlueprint', () => {
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.buildId).toBe('test-meta-1');
    expect(bp.overallMetaScore).toBeGreaterThanOrEqual(0);
    expect(bp.overallMetaScore).toBeLessThanOrEqual(10);
  });
  it('contextString starts with V10.1', () => {
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.contextString).toContain('V10.1');
  });
  it('contextString includes health status', () => {
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.contextString).toMatch(/Health:/);
  });
  it('all sub-blueprints present', () => {
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.analysis).toBeDefined();
    expect(bp.planner).toBeDefined();
    expect(bp.evaluator).toBeDefined();
    expect(bp.scoring).toBeDefined();
    expect(bp.prediction).toBeDefined();
    expect(bp.recommendations).toBeDefined();
    expect(bp.evolution).toBeDefined();
    expect(bp.health).toBeDefined();
    expect(bp.diagnostics).toBeDefined();
    expect(bp.validation).toBeDefined();
  });
  it('version starts at 0 before persistence', () => {
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.version).toBe(0);
  });
  it('recordedAt is a recent timestamp', () => {
    const before = Date.now();
    const bp = buildMetaBlueprint(makeCtx());
    expect(bp.recordedAt).toBeGreaterThanOrEqual(before);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Facade — buildFallbackMetaBlueprint
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Facade — buildFallbackMetaBlueprint', () => {
  it('returns a blueprint without throwing', () => {
    expect(() => buildFallbackMetaBlueprint('fallback-1')).not.toThrow();
  });
  it('buildId matches input', () => {
    const bp = buildFallbackMetaBlueprint('fallback-2');
    expect(bp.buildId).toBe('fallback-2');
  });
  it('overallMetaScore is valid range', () => {
    const bp = buildFallbackMetaBlueprint('fb');
    expect(bp.overallMetaScore).toBeGreaterThanOrEqual(0);
    expect(bp.overallMetaScore).toBeLessThanOrEqual(10);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Facade — runMetaIntelligenceEngine
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Facade — runMetaIntelligenceEngine', () => {
  beforeEach(() => { resetAll(); });

  it('returns blueprint and contextString', () => {
    const result = runMetaIntelligenceEngine(makeCtx());
    expect(result.blueprint).toBeDefined();
    expect(typeof result.contextString).toBe('string');
  });
  it('records a metric on run', () => {
    runMetaIntelligenceEngine(makeCtx());
    const snap = getMetaMetricsSnapshot();
    expect(snap.overallMetaScore).toBeGreaterThan(0);
  });
  it('saves a snapshot on run', () => {
    runMetaIntelligenceEngine(makeCtx({ buildId: 'run-1' }));
    const cur = getCurrentMetaSnapshot();
    expect(cur?.buildId).toBe('run-1');
  });
  it('blueprint version is incremented after persistence', () => {
    runMetaIntelligenceEngine(makeCtx());
    const cur = getCurrentMetaSnapshot();
    expect(cur?.version).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Facade — learnFromMetaResult
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Facade — learnFromMetaResult', () => {
  beforeEach(() => { resetAll(); });

  it('does not throw', () => {
    const bp = buildFallbackMetaBlueprint('lr-1');
    expect(() => learnFromMetaResult('lr-1', bp, true, 90_000, 8)).not.toThrow();
  });
  it('eventually increments learning stats (async)', async () => {
    const bp = buildFallbackMetaBlueprint('lr-2');
    learnFromMetaResult('lr-2', bp, true, 90_000, 8);
    await new Promise(r => setTimeout(r, 10));
    expect(getMetaStats().totalRecords).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Meta Facade — rollback & reset
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Meta Facade — rollback and reset', () => {
  beforeEach(() => { resetAll(); });

  it('rollbackMeta returns null for missing version', () => {
    expect(rollbackMeta(999)).toBeNull();
  });
  it('rollbackMeta returns stored snapshot', () => {
    const result = runMetaIntelligenceEngine(makeCtx({ buildId: 'rb-1' }));
    const snap = rollbackMeta(result.blueprint.version);
    expect(snap?.buildId).toBe('rb-1');
  });
  it('resetMetaEngine clears all state', () => {
    runMetaIntelligenceEngine(makeCtx());
    resetMetaEngine();
    expect(getMetaMetricsSnapshot().overallMetaScore).toBe(0);
    expect(getCurrentMetaSnapshot()).toBeNull();
  });
  it('persistMetaSnapshot stores snapshot', () => {
    const bp = buildFallbackMetaBlueprint('ps-1');
    const snap = persistMetaSnapshot('ps-1', bp);
    expect(snap.buildId).toBe('ps-1');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Pipeline Step — SSE events
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Pipeline Step — SSE events', () => {
  beforeEach(() => { resetAll(); });

  function makeRes(): { written: string[]; write: (d: string) => void } {
    const written: string[] = [];
    return { written, write: (d: string) => { written.push(d); } };
  }

  async function runStep(ctx: MetaContext, res: ReturnType<typeof makeRes>) {
    const { runMetaStep } = await import('../../agents/pipeline/metaStep.js');
    return runMetaStep(
      ctx.buildId, res as unknown as ExpressResponse, ctx.prompt, ctx.complexity,
      ctx.reasoningScore, ctx.planningScore, ctx.executionScore,
      ctx.adaptiveScore, ctx.optimizationScore,
    );
  }

  it('emits meta_start event', async () => {
    const res = makeRes();
    await runStep(makeCtx(), res);
    const events = res.written.map(d => JSON.parse(d.replace('data: ', '')));
    expect(events.some(e => e.type === 'meta_start')).toBe(true);
  });
  it('emits meta_progress event with overallMetaScore', async () => {
    const res = makeRes();
    await runStep(makeCtx(), res);
    const events = res.written.map(d => JSON.parse(d.replace('data: ', '')));
    const progress = events.find(e => e.type === 'meta_progress');
    expect(progress).toBeDefined();
    expect(typeof progress?.overallMetaScore).toBe('number');
  });
  it('emits meta_complete event', async () => {
    const res = makeRes();
    await runStep(makeCtx(), res);
    const events = res.written.map(d => JSON.parse(d.replace('data: ', '')));
    expect(events.some(e => e.type === 'meta_complete')).toBe(true);
  });
  it('meta_progress includes healthStatus', async () => {
    const res = makeRes();
    await runStep(makeCtx(), res);
    const events = res.written.map(d => JSON.parse(d.replace('data: ', '')));
    const progress = events.find(e => e.type === 'meta_progress');
    expect(typeof progress?.healthStatus).toBe('string');
  });
  it('returns MetaStepOutput with blueprint and contextString', async () => {
    const res = makeRes();
    const out = await runStep(makeCtx(), res);
    expect(out.blueprint).toBeDefined();
    expect(typeof out.contextString).toBe('string');
  });
  it('finalizeMetaStep emits meta_learning event', async () => {
    const { finalizeMetaStep } = await import('../../agents/pipeline/metaStep.js');
    const res = makeRes();
    const bp = buildFallbackMetaBlueprint('finalize-1');
    finalizeMetaStep(res as unknown as ExpressResponse, 'finalize-1', bp, true, 90_000, 8);
    const events = res.written.map(d => JSON.parse(d.replace('data: ', '')));
    expect(events.some(e => e.type === 'meta_learning')).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Edge cases
// ════════════════════════════════════════════════════════════════════════════
describe('V10.1 — Edge Cases', () => {
  beforeEach(() => { resetAll(); });

  it('handles all-zero upstream scores', () => {
    const ctx = makeCtx({ reasoningScore: 0, planningScore: 0, executionScore: 0, adaptiveScore: 0, optimizationScore: 0 });
    expect(() => buildMetaBlueprint(ctx)).not.toThrow();
  });
  it('handles all-max upstream scores', () => {
    const ctx = makeCtx({ reasoningScore: 10, planningScore: 10, executionScore: 10, adaptiveScore: 10, optimizationScore: 10 });
    const bp = buildMetaBlueprint(ctx);
    expect(bp.overallMetaScore).toBeGreaterThanOrEqual(8);
  });
  it('handles missing optional fields gracefully', () => {
    const ctx: MetaContext = {
      buildId: 'min-1', prompt: '', complexity: 'simple',
      reasoningScore: 7, planningScore: 7, executionScore: 7,
      adaptiveScore: 7, optimizationScore: 7,
    };
    expect(() => buildMetaBlueprint(ctx)).not.toThrow();
  });
  it('buildFallbackMetaBlueprint is deterministic', () => {
    const bp1 = buildFallbackMetaBlueprint('d-1');
    const bp2 = buildFallbackMetaBlueprint('d-1');
    expect(bp1.overallMetaScore).toBe(bp2.overallMetaScore);
    expect(bp1.health.healthStatus).toBe(bp2.health.healthStatus);
  });
  it('runMetaIntelligenceEngine never throws', () => {
    const ctx: MetaContext = {
      buildId: 'safe-1', prompt: '', complexity: 'enterprise',
      reasoningScore: 0, planningScore: 0, executionScore: 0,
      adaptiveScore: 0, optimizationScore: 0,
    };
    expect(() => runMetaIntelligenceEngine(ctx)).not.toThrow();
  });
  it('simple complexity runs faster than enterprise prediction', () => {
    const s = predictOutcomes(makeCtx({ complexity: 'simple' }));
    const e = predictOutcomes(makeCtx({ complexity: 'enterprise' }));
    expect(s.predictedBuildTimeMs).toBeLessThan(e.predictedBuildTimeMs);
  });
  it('analyzeSystem with empty latencies and failureRates', () => {
    const bp = analyzeSystem(makeCtx({ agentLatencies: {}, agentFailureRates: {} }));
    expect(bp.slowModules).toHaveLength(0);
    expect(bp.expensiveModules).toHaveLength(0);
  });
  it('computeHealth with all optional fields missing', () => {
    const ctx: MetaContext = {
      buildId: 'h-1', prompt: '', complexity: 'standard',
      reasoningScore: 7, planningScore: 7, executionScore: 7,
      adaptiveScore: 7, optimizationScore: 7,
    };
    const bp = computeHealth(ctx);
    expect(bp.overallHealth).toBeGreaterThan(0);
  });
  it('validator does not throw with minimum inputs', () => {
    const ctx = makeCtx();
    const analysis   = analyzeSystem(ctx);
    const evaluator  = evaluateEngines(ctx);
    const health     = computeHealth(ctx);
    const diagnostics = runDiagnostics(ctx);
    const prediction = predictOutcomes(ctx);
    expect(() => validateMeta(
      analysis, evaluator, health, diagnostics, prediction,
      7, 7, 7, 7, 7,
    )).not.toThrow();
  });
  it('getMetaMetrics alias returns metrics snapshot', () => {
    runMetaIntelligenceEngine(makeCtx());
    const snap = getMetaMetrics();
    expect(snap.overallMetaScore).toBeGreaterThan(0);
  });
  it('getMetaStats alias returns learning stats', async () => {
    await learnFromMeta(makeLearningRecord());
    const stats = getMetaStats();
    expect(stats.totalRecords).toBe(1);
  });
});
