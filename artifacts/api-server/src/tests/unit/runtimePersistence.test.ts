// ── V9.0 Runtime Intelligence — Persistence Unit Tests ───────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  initRuntimeIntelligencePersistence,
  persistRuntimeSnapshot,
  getCurrentRuntimeSnapshot,
  getRuntimeSnapshotByVersion,
  getRollbackSnapshot,
  getRuntimePersistenceStats,
  resetRuntimePersistence,
} from '../../runtime-intelligence/runtimePersistence.js';
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

function makeBlueprint() {
  return runRuntimeIntelligence(makeInput()).blueprint;
}

describe('initRuntimeIntelligencePersistence', () => {
  beforeEach(() => resetRuntimePersistence());

  it('initializes without throwing', () => {
    expect(() => initRuntimeIntelligencePersistence()).not.toThrow();
  });

  it('can be called multiple times safely', () => {
    expect(() => {
      initRuntimeIntelligencePersistence();
      initRuntimeIntelligencePersistence();
    }).not.toThrow();
  });
});

describe('persistRuntimeSnapshot', () => {
  beforeEach(() => {
    resetRuntimePersistence();
    initRuntimeIntelligencePersistence();
  });

  it('persists a snapshot without throwing', () => {
    const bp = makeBlueprint();
    expect(() => persistRuntimeSnapshot('b1', 'Balanced', bp)).not.toThrow();
  });

  it('increments totalSnapshots', () => {
    persistRuntimeSnapshot('b1', 'Balanced', makeBlueprint());
    expect(getRuntimePersistenceStats().totalSnapshots).toBe(1);
  });

  it('increments currentVersion monotonically', () => {
    persistRuntimeSnapshot('b1', 'Fast',       makeBlueprint());
    persistRuntimeSnapshot('b2', 'Balanced',   makeBlueprint());
    persistRuntimeSnapshot('b3', 'Enterprise', makeBlueprint());
    const stats = getRuntimePersistenceStats();
    expect(stats.currentVersion).toBe(3);
    expect(stats.newestVersion).toBe(3);
    expect(stats.oldestVersion).toBe(1);
  });

  it('capacityUsed is between 0 and 100', () => {
    persistRuntimeSnapshot('b1', 'Fast', makeBlueprint());
    const stats = getRuntimePersistenceStats();
    expect(stats.capacityUsed).toBeGreaterThanOrEqual(0);
    expect(stats.capacityUsed).toBeLessThanOrEqual(100);
  });

  it('stores the mode on the snapshot', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Quality', bp);
    const snap = getCurrentRuntimeSnapshot();
    expect(snap?.mode).toBe('Quality');
  });
});

describe('getCurrentRuntimeSnapshot', () => {
  beforeEach(() => {
    resetRuntimePersistence();
    initRuntimeIntelligencePersistence();
  });

  it('returns undefined when no snapshots exist', () => {
    expect(getCurrentRuntimeSnapshot()).toBeUndefined();
  });

  it('returns the most recent snapshot', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Fast',     bp);
    persistRuntimeSnapshot('b2', 'Quality',  bp);
    const snap = getCurrentRuntimeSnapshot();
    expect(snap?.buildId).toBe('b2');
    expect(snap?.mode).toBe('Quality');
  });

  it('snapshot.overallScore matches blueprint.overallScore', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Balanced', bp);
    const snap = getCurrentRuntimeSnapshot();
    expect(snap?.overallScore).toBe(bp.overallScore);
  });
});

describe('getRuntimeSnapshotByVersion', () => {
  beforeEach(() => {
    resetRuntimePersistence();
    initRuntimeIntelligencePersistence();
  });

  it('returns undefined for a non-existent version', () => {
    expect(getRuntimeSnapshotByVersion(999)).toBeUndefined();
  });

  it('retrieves the correct snapshot by version', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Fast',    bp);
    persistRuntimeSnapshot('b2', 'Quality', bp);
    const snap = getRuntimeSnapshotByVersion(1);
    expect(snap?.buildId).toBe('b1');
    expect(snap?.mode).toBe('Fast');
  });
});

describe('getRollbackSnapshot', () => {
  beforeEach(() => {
    resetRuntimePersistence();
    initRuntimeIntelligencePersistence();
  });

  it('returns undefined when there is only one snapshot', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Fast', bp);
    expect(getRollbackSnapshot(1)).toBeUndefined();
  });

  it('returns the snapshot before the given version', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Fast',    bp);  // version 1
    persistRuntimeSnapshot('b2', 'Quality', bp);  // version 2
    persistRuntimeSnapshot('b3', 'Enterprise', bp); // version 3
    const rollback = getRollbackSnapshot(3);
    expect(rollback?.version).toBe(2);
    expect(rollback?.mode).toBe('Quality');
  });
});

describe('getRuntimePersistenceStats', () => {
  beforeEach(() => {
    resetRuntimePersistence();
    initRuntimeIntelligencePersistence();
  });

  it('returns zero state when empty', () => {
    const stats = getRuntimePersistenceStats();
    expect(stats.totalSnapshots).toBe(0);
    expect(stats.currentVersion).toBe(0);
    expect(stats.oldestVersion).toBeNull();
    expect(stats.newestVersion).toBeNull();
    expect(stats.capacityUsed).toBe(0);
  });

  it('totalSnapshots matches the number of persisted snapshots', () => {
    const bp = makeBlueprint();
    persistRuntimeSnapshot('b1', 'Fast',       bp);
    persistRuntimeSnapshot('b2', 'Balanced',   bp);
    persistRuntimeSnapshot('b3', 'Enterprise', bp);
    expect(getRuntimePersistenceStats().totalSnapshots).toBe(3);
  });
});

describe('resetRuntimePersistence', () => {
  it('resets all state to zero', () => {
    const bp = makeBlueprint();
    initRuntimeIntelligencePersistence();
    persistRuntimeSnapshot('b1', 'Fast', bp);
    resetRuntimePersistence();
    const stats = getRuntimePersistenceStats();
    expect(stats.totalSnapshots).toBe(0);
    expect(stats.currentVersion).toBe(0);
    expect(getCurrentRuntimeSnapshot()).toBeUndefined();
  });
});
