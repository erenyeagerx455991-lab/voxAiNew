// ── V8.9 Security Architecture Integration — Persistence Unit Tests ──────────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  initSecurityArchitectPersistence,
  persistSecuritySnapshot,
  getCurrentSecuritySnapshot,
  getSecurityArchitectPersistenceStats,
  resetSecurityArchitectPersistence,
} from '../../security-architect/securityPersistence.js';
import { runSecurityArchitect } from '../../security-architect/securityArchitect.js';

function makeBlueprint() {
  return runSecurityArchitect('SaaSBackend').blueprint;
}

describe('initSecurityArchitectPersistence', () => {
  beforeEach(() => {
    resetSecurityArchitectPersistence();
  });

  it('initializes without throwing', () => {
    expect(() => initSecurityArchitectPersistence()).not.toThrow();
  });

  it('can be called multiple times safely', () => {
    expect(() => {
      initSecurityArchitectPersistence();
      initSecurityArchitectPersistence();
    }).not.toThrow();
  });
});

describe('persistSecuritySnapshot', () => {
  beforeEach(() => {
    resetSecurityArchitectPersistence();
    initSecurityArchitectPersistence();
  });

  it('persists a snapshot without throwing', () => {
    const blueprint = makeBlueprint();
    expect(() =>
      persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint)
    ).not.toThrow();
  });

  it('increments totalSnapshots', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint);
    expect(getSecurityArchitectPersistenceStats().totalSnapshots).toBe(1);
  });

  it('increments currentVersion monotonically', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint);
    persistSecuritySnapshot('build-2', 'Healthcare',  blueprint);
    const stats = getSecurityArchitectPersistenceStats();
    expect(stats.currentVersion).toBe(2);
    expect(stats.newestVersion).toBe(2);
    expect(stats.oldestVersion).toBe(1);
  });

  it('capacityUsed is between 0 and 100', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint);
    const stats = getSecurityArchitectPersistenceStats();
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
    expect(stats.capacityUsed).toBeLessThanOrEqual(100);
  });
});

describe('getCurrentSecuritySnapshot', () => {
  beforeEach(() => {
    resetSecurityArchitectPersistence();
    initSecurityArchitectPersistence();
  });

  it('returns undefined when no snapshots exist', () => {
    expect(getCurrentSecuritySnapshot()).toBeUndefined();
  });

  it('returns the most recent snapshot', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint);
    persistSecuritySnapshot('build-2', 'Healthcare',  blueprint);
    const snap = getCurrentSecuritySnapshot();
    expect(snap).toBeDefined();
    expect(snap!.buildId).toBe('build-2');
    expect(snap!.backendType).toBe('Healthcare');
  });

  it('snapshot contains overallScore from blueprint', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'Finance', blueprint);
    const snap = getCurrentSecuritySnapshot();
    expect(snap!.overallScore).toBe(blueprint.overallScore);
  });

  it('snapshot.blueprint is the stored blueprint', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('build-1', 'SaaSBackend', blueprint);
    const snap = getCurrentSecuritySnapshot();
    expect(snap!.blueprint.overallScore).toBe(blueprint.overallScore);
  });
});

describe('getSecurityArchitectPersistenceStats', () => {
  beforeEach(() => {
    resetSecurityArchitectPersistence();
    initSecurityArchitectPersistence();
  });

  it('returns zero state when empty', () => {
    const stats = getSecurityArchitectPersistenceStats();
    expect(stats.totalSnapshots).toBe(0);
    expect(stats.currentVersion).toBe(0);
    expect(stats.oldestVersion).toBeNull();
    expect(stats.newestVersion).toBeNull();
    expect(stats.capacityUsed).toBe(0);
  });

  it('totalSnapshots matches the number of persisted snapshots', () => {
    const blueprint = makeBlueprint();
    persistSecuritySnapshot('b1', 'SaaSBackend', blueprint);
    persistSecuritySnapshot('b2', 'Healthcare',  blueprint);
    persistSecuritySnapshot('b3', 'Finance',     blueprint);
    expect(getSecurityArchitectPersistenceStats().totalSnapshots).toBe(3);
  });
});

describe('resetSecurityArchitectPersistence', () => {
  it('resets all state to zero', () => {
    const blueprint = makeBlueprint();
    initSecurityArchitectPersistence();
    persistSecuritySnapshot('b1', 'SaaSBackend', blueprint);
    resetSecurityArchitectPersistence();

    const stats = getSecurityArchitectPersistenceStats();
    expect(stats.totalSnapshots).toBe(0);
    expect(stats.currentVersion).toBe(0);
    expect(getCurrentSecuritySnapshot()).toBeUndefined();
  });
});
