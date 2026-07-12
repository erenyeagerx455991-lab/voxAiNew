// ── V9.0 Runtime Intelligence — Learning Engine Unit Tests ───────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  learnFromRuntimeBuild,
  getRuntimeLearningRecords,
  getRuntimeLearningStats,
  resetRuntimeLearning,
} from '../../runtime-intelligence/runtimeLearning.js';
import {
  getRuntimeMetrics,
  resetRuntimeMetrics,
} from '../../runtime-intelligence/runtimeMetrics.js';
import { runRuntimeIntelligence } from '../../runtime-intelligence/runtimeArchitect.js';
import type { RuntimeIntelligenceInput, RuntimeLearningInput } from '../../runtime-intelligence/runtimeTypes.js';

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

function makeLearningInput(buildId: string, backendType = 'SaaSBackend'): RuntimeLearningInput {
  const blueprint = runRuntimeIntelligence(makeInput({ buildId, backendType })).blueprint;
  return {
    buildId,
    blueprint,
    actualBuildTimeMs:  85_000,
    actualRepairCount:  2,
    overallBuildScore:  7.5,
  };
}

describe('learnFromRuntimeBuild — basic recording', () => {
  beforeEach(() => {
    resetRuntimeLearning();
    resetRuntimeMetrics();
  });

  it('resolves without throwing', async () => {
    await expect(learnFromRuntimeBuild(makeLearningInput('b1'))).resolves.toBeUndefined();
  });

  it('adds a learning record', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    expect(getRuntimeLearningRecords().length).toBe(1);
  });

  it('record contains correct buildId', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    expect(getRuntimeLearningRecords()[0].buildId).toBe('b1');
  });

  it('record.mode matches the classified mode for the input', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1', 'Healthcare'));
    const record = getRuntimeLearningRecords()[0];
    expect(record.mode).toBe('Enterprise');
  });

  it('record.overallScore matches the provided overallBuildScore', async () => {
    const input = makeLearningInput('b1');
    await learnFromRuntimeBuild(input);
    expect(getRuntimeLearningRecords()[0].overallScore).toBe(7.5);
  });

  it('record.actualBuildTimeMs matches the provided value', async () => {
    const input = makeLearningInput('b1');
    await learnFromRuntimeBuild(input);
    expect(getRuntimeLearningRecords()[0].actualBuildTimeMs).toBe(85_000);
  });

  it('record.actualRepairCount matches the provided value', async () => {
    const input = makeLearningInput('b1');
    await learnFromRuntimeBuild(input);
    expect(getRuntimeLearningRecords()[0].actualRepairCount).toBe(2);
  });

  it('record.estimatedBuildTimeMs comes from blueprint performance prediction', async () => {
    const input = makeLearningInput('b1');
    await learnFromRuntimeBuild(input);
    const record = getRuntimeLearningRecords()[0];
    expect(record.estimatedBuildTimeMs).toBe(input.blueprint.performancePrediction.estimatedBuildTimeMs);
  });

  it('record.recordedAt is a recent timestamp', async () => {
    const before = Date.now();
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    const after = Date.now();
    const record = getRuntimeLearningRecords()[0];
    expect(record.recordedAt).toBeGreaterThanOrEqual(before);
    expect(record.recordedAt).toBeLessThanOrEqual(after);
  });

  it('increments the learningRecordCount in runtimeMetrics', async () => {
    const before = getRuntimeMetrics().learningRecordCount;
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    const after = getRuntimeMetrics().learningRecordCount;
    expect(after).toBe(before + 1);
  });
});

describe('learnFromRuntimeBuild — multiple records', () => {
  beforeEach(() => {
    resetRuntimeLearning();
    resetRuntimeMetrics();
  });

  it('accumulates multiple records', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    await learnFromRuntimeBuild(makeLearningInput('b2'));
    await learnFromRuntimeBuild(makeLearningInput('b3'));
    expect(getRuntimeLearningRecords().length).toBe(3);
  });

  it('getRuntimeLearningRecords returns a copy', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    const records = getRuntimeLearningRecords();
    const before = records.length;
    records.push({ ...records[0], buildId: 'mutated' });
    expect(getRuntimeLearningRecords().length).toBe(before);
  });
});

describe('getRuntimeLearningStats', () => {
  beforeEach(() => {
    resetRuntimeLearning();
  });

  it('returns zeroed stats when store is empty', () => {
    const stats = getRuntimeLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.improvedCount).toBe(0);
    expect(stats.averageScore).toBe(0);
    expect(stats.averageBuildTimeMs).toBe(0);
    expect(stats.byMode).toEqual({});
  });

  it('totalRecords matches number of calls', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    await learnFromRuntimeBuild(makeLearningInput('b2'));
    expect(getRuntimeLearningStats().totalRecords).toBe(2);
  });

  it('averageScore is computed correctly', async () => {
    const input1 = { ...makeLearningInput('b1'), overallBuildScore: 6.0 };
    const input2 = { ...makeLearningInput('b2'), overallBuildScore: 8.0 };
    await learnFromRuntimeBuild(input1);
    await learnFromRuntimeBuild(input2);
    expect(getRuntimeLearningStats().averageScore).toBeCloseTo(7.0, 1);
  });

  it('timeAccuracy is between 0 and 1', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    const stats = getRuntimeLearningStats();
    expect(stats.timeAccuracy).toBeGreaterThanOrEqual(0);
    expect(stats.timeAccuracy).toBeLessThanOrEqual(1);
  });

  it('repairAccuracy is between 0 and 1', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    const stats = getRuntimeLearningStats();
    expect(stats.repairAccuracy).toBeGreaterThanOrEqual(0);
    expect(stats.repairAccuracy).toBeLessThanOrEqual(1);
  });

  it('byMode counts modes correctly', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1', 'SaaSBackend'));    // Balanced
    await learnFromRuntimeBuild(makeLearningInput('b2', 'SaaSBackend'));    // Balanced
    await learnFromRuntimeBuild(makeLearningInput('b3', 'Healthcare'));     // Enterprise
    const stats = getRuntimeLearningStats();
    expect(stats.byMode['Balanced']).toBe(2);
    expect(stats.byMode['Enterprise']).toBe(1);
  });
});

describe('resetRuntimeLearning', () => {
  it('clears all records', async () => {
    await learnFromRuntimeBuild(makeLearningInput('b1'));
    resetRuntimeLearning();
    expect(getRuntimeLearningRecords().length).toBe(0);
    expect(getRuntimeLearningStats().totalRecords).toBe(0);
  });
});
