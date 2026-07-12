// ── V8.9 Security Architecture Integration — Learning Engine Unit Tests ──────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  learnFromSecurityBuild,
  getSecurityLearningStats,
  getSecurityLearningRecords,
  resetSecurityLearning,
} from '../../security-architect/securityLearning.js';
import {
  getSecurityArchitectMetrics,
  resetSecurityArchitectMetrics,
} from '../../security-architect/securityMetrics.js';
import { runSecurityArchitect } from '../../security-architect/securityArchitect.js';

function makeInput(buildId: string, backendType = 'SaaSBackend') {
  const blueprint = runSecurityArchitect(backendType as any).blueprint;
  return { buildId, backendType, blueprint };
}

describe('learnFromSecurityBuild — basic recording', () => {
  beforeEach(() => {
    resetSecurityLearning();
    resetSecurityArchitectMetrics();
  });

  it('resolves without throwing', async () => {
    await expect(learnFromSecurityBuild(makeInput('b1'))).resolves.toBeUndefined();
  });

  it('adds a learning record', async () => {
    await learnFromSecurityBuild(makeInput('b1'));
    expect(getSecurityLearningRecords().length).toBe(1);
  });

  it('record contains correct buildId and backendType', async () => {
    await learnFromSecurityBuild(makeInput('b1', 'Healthcare'));
    const records = getSecurityLearningRecords();
    expect(records[0].buildId).toBe('b1');
    expect(records[0].backendType).toBe('Healthcare');
  });

  it('record.overallScore matches blueprint.overallScore', async () => {
    const input = makeInput('b1');
    await learnFromSecurityBuild(input);
    const records = getSecurityLearningRecords();
    expect(records[0].overallScore).toBe(input.blueprint.overallScore);
  });

  it('record.privacyScore comes from qualityScores', async () => {
    const input = makeInput('b1');
    await learnFromSecurityBuild(input);
    const records = getSecurityLearningRecords();
    const expected = input.blueprint.qualityScores.find(q => q.dimension === 'privacy')?.score ?? 0;
    expect(records[0].privacyScore).toBe(expected);
  });

  it('record.complianceScore comes from qualityScores', async () => {
    const input = makeInput('b1', 'Healthcare');
    await learnFromSecurityBuild(input);
    const records = getSecurityLearningRecords();
    const expected = input.blueprint.qualityScores.find(q => q.dimension === 'compliance')?.score ?? 0;
    expect(records[0].complianceScore).toBe(expected);
  });

  it('record.threatScore comes from qualityScores', async () => {
    const input = makeInput('b1');
    await learnFromSecurityBuild(input);
    const records = getSecurityLearningRecords();
    const expected = input.blueprint.qualityScores.find(q => q.dimension === 'threatModel')?.score ?? 0;
    expect(records[0].threatScore).toBe(expected);
  });

  it('record.recordedAt is a recent timestamp', async () => {
    const before = Date.now();
    await learnFromSecurityBuild(makeInput('b1'));
    const after = Date.now();
    const record = getSecurityLearningRecords()[0];
    expect(record.recordedAt).toBeGreaterThanOrEqual(before);
    expect(record.recordedAt).toBeLessThanOrEqual(after);
  });

  it('increments the learningRecordCount in securityMetrics', async () => {
    const before = getSecurityArchitectMetrics().learningRecordCount;
    await learnFromSecurityBuild(makeInput('b1'));
    const after = getSecurityArchitectMetrics().learningRecordCount;
    expect(after).toBe(before + 1);
  });
});

describe('learnFromSecurityBuild — multiple records', () => {
  beforeEach(() => {
    resetSecurityLearning();
    resetSecurityArchitectMetrics();
  });

  it('accumulates multiple records', async () => {
    await learnFromSecurityBuild(makeInput('b1'));
    await learnFromSecurityBuild(makeInput('b2'));
    await learnFromSecurityBuild(makeInput('b3'));
    expect(getSecurityLearningRecords().length).toBe(3);
  });

  it('returns a copy so mutations do not affect the store', async () => {
    await learnFromSecurityBuild(makeInput('b1'));
    const records = getSecurityLearningRecords();
    records.push({ ...records[0], buildId: 'mutated' });
    expect(getSecurityLearningRecords().length).toBe(1);
  });
});

// ── getSecurityLearningStats ──────────────────────────────────────────────────

describe('getSecurityLearningStats', () => {
  beforeEach(() => {
    resetSecurityLearning();
  });

  it('returns zeroed stats when store is empty', () => {
    const stats = getSecurityLearningStats();
    expect(stats.totalRecords).toBe(0);
    expect(stats.improvedCount).toBe(0);
    expect(stats.averageScore).toBe(0);
    expect(stats.byType).toEqual({});
  });

  it('totalRecords matches number of calls', async () => {
    await learnFromSecurityBuild(makeInput('b1'));
    await learnFromSecurityBuild(makeInput('b2'));
    expect(getSecurityLearningStats().totalRecords).toBe(2);
  });

  it('averageScore is correct', async () => {
    const input1 = makeInput('b1', 'SaaSBackend');
    const input2 = makeInput('b2', 'Healthcare');
    await learnFromSecurityBuild(input1);
    await learnFromSecurityBuild(input2);
    const stats = getSecurityLearningStats();
    const expected = (input1.blueprint.overallScore + input2.blueprint.overallScore) / 2;
    expect(stats.averageScore).toBeCloseTo(expected, 1);
  });

  it('byType counts backend types correctly', async () => {
    await learnFromSecurityBuild(makeInput('b1', 'SaaSBackend'));
    await learnFromSecurityBuild(makeInput('b2', 'SaaSBackend'));
    await learnFromSecurityBuild(makeInput('b3', 'Healthcare'));
    const stats = getSecurityLearningStats();
    expect(stats.byType['SaaSBackend']).toBe(2);
    expect(stats.byType['Healthcare']).toBe(1);
  });
});

// ── resetSecurityLearning ─────────────────────────────────────────────────────

describe('resetSecurityLearning', () => {
  it('clears all records', async () => {
    await learnFromSecurityBuild(makeInput('b1'));
    resetSecurityLearning();
    expect(getSecurityLearningRecords().length).toBe(0);
    expect(getSecurityLearningStats().totalRecords).toBe(0);
  });
});
