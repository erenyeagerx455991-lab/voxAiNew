// ── V9.0 Runtime Intelligence — Metrics Unit Tests ───────────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordRuntimeBuild,
  recordRuntimeLearning,
  getRuntimeMetrics,
  resetRuntimeMetrics,
} from '../../runtime-intelligence/runtimeMetrics.js';
import { runRuntimeIntelligence } from '../../runtime-intelligence/runtimeArchitect.js';
import type { RuntimeIntelligenceInput } from '../../runtime-intelligence/runtimeTypes.js';

function makeInput(overrides: Partial<RuntimeIntelligenceInput> = {}): RuntimeIntelligenceInput {
  return {
    prompt: 'Build a SaaS app', buildId: 'b1',
    productGoal: 'SaaS', productFeatures: ['Auth', 'Dashboard'],
    businessObjective: 'Freemium', backendType: 'SaaSBackend', infraType: 'Standard',
    serviceCount: 2, hasAuth: true, hasPayments: false, hasRealtime: false, hasCompliance: false,
    productScore: 7, frontendScore: 7, backendScore: 7, devopsScore: 7, qaScore: 7, securityScore: 7,
    ...overrides,
  };
}

describe('runtimeMetrics — initial state', () => {
  beforeEach(() => resetRuntimeMetrics());

  it('starts at zero after reset', () => {
    const m = getRuntimeMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageScore).toBe(0);
    expect(m.averageGenerationTime).toBe(0);
    expect(m.strategyDistribution).toEqual({});
    expect(m.scoreByDimension).toEqual({});
    expect(m.learningRecordCount).toBe(0);
  });
});

describe('runtimeMetrics — recordRuntimeBuild', () => {
  beforeEach(() => resetRuntimeMetrics());

  it('increments totalBuilds', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    // Reset AFTER blueprint creation — runRuntimeIntelligence records internally
    resetRuntimeMetrics();
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, blueprint.overallScore, 80_000);
    expect(getRuntimeMetrics().totalBuilds).toBe(1);
  });

  it('averageScore reflects recorded builds', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    // Reset AFTER blueprint creation — runRuntimeIntelligence records internally
    resetRuntimeMetrics();
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 6.0, 80_000);
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 8.0, 80_000);
    expect(getRuntimeMetrics().averageScore).toBeCloseTo(7.0, 1);
  });

  it('averageGenerationTime is computed correctly', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    // Reset AFTER blueprint creation — runRuntimeIntelligence records internally
    resetRuntimeMetrics();
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 7.0, 60_000);
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 7.0, 90_000);
    expect(getRuntimeMetrics().averageGenerationTime).toBe(75_000);
  });

  it('strategyDistribution tracks mode counts', () => {
    const { blueprint: bp1 } = runRuntimeIntelligence(makeInput());
    const { blueprint: bp2 } = runRuntimeIntelligence(makeInput({ backendType: 'Healthcare', hasCompliance: true }));
    // Reset AFTER blueprint creation — runRuntimeIntelligence records internally
    resetRuntimeMetrics();
    recordRuntimeBuild(bp1.mode, bp1.qualityScores, 7.0, 80_000);
    recordRuntimeBuild(bp1.mode, bp1.qualityScores, 7.0, 80_000);
    recordRuntimeBuild(bp2.mode, bp2.qualityScores, 8.0, 100_000);
    const m = getRuntimeMetrics();
    expect(m.strategyDistribution[bp1.mode]).toBe(2);
    expect(m.strategyDistribution[bp2.mode]).toBeGreaterThanOrEqual(1);
  });

  it('scoreByDimension tracks dimension averages', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, blueprint.overallScore, 80_000);
    const m = getRuntimeMetrics();
    expect(Object.keys(m.scoreByDimension).length).toBeGreaterThan(0);
  });

  it('efficiency fields are non-negative', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, blueprint.overallScore, 80_000);
    const m = getRuntimeMetrics();
    expect(m.repairEfficiency).toBeGreaterThanOrEqual(0);
    expect(m.evaluationEfficiency).toBeGreaterThanOrEqual(0);
    expect(m.optimizationEfficiency).toBeGreaterThanOrEqual(0);
    expect(m.tokenEfficiency).toBeGreaterThanOrEqual(0);
    expect(m.candidateEfficiency).toBeGreaterThanOrEqual(0);
    expect(m.cacheHitRate).toBeGreaterThanOrEqual(0);
  });

  it('capped at 500 records', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    for (let i = 0; i < 550; i++) {
      recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 7.0, 80_000);
    }
    // Should not exceed 500
    expect(getRuntimeMetrics().totalBuilds).toBeLessThanOrEqual(500);
  });
});

describe('runtimeMetrics — recordRuntimeLearning', () => {
  beforeEach(() => resetRuntimeMetrics());

  it('increments learningRecordCount', () => {
    recordRuntimeLearning();
    recordRuntimeLearning();
    expect(getRuntimeMetrics().learningRecordCount).toBe(2);
  });
});

describe('runtimeMetrics — resetRuntimeMetrics', () => {
  it('resets all state', () => {
    const { blueprint } = runRuntimeIntelligence(makeInput());
    recordRuntimeBuild(blueprint.mode, blueprint.qualityScores, 7.0, 80_000);
    recordRuntimeLearning();
    resetRuntimeMetrics();
    const m = getRuntimeMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.learningRecordCount).toBe(0);
  });
});

describe('runtimeMetrics — lastUpdated', () => {
  it('is a recent timestamp', () => {
    resetRuntimeMetrics();
    const before = Date.now();
    const m = getRuntimeMetrics();
    expect(m.lastUpdated).toBeGreaterThanOrEqual(before);
  });
});
