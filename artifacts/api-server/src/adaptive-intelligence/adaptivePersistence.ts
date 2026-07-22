// ── V9.9 Adaptive Intelligence — Phase 12: Persistence ────────────────────────
// Versioned in-memory snapshots. 500-cap. Never throws.
import type { AdaptiveBlueprint, AdaptiveSnapshot } from './adaptiveTypes.js';

const MAX_SNAPSHOTS = 500;
let _currentVersion = 0;
const _snapshots = new Map<number, AdaptiveSnapshot>();

export function saveAdaptiveSnapshot(buildId: string, blueprint: AdaptiveBlueprint): AdaptiveSnapshot {
  try {
    _currentVersion++;
    const snap: AdaptiveSnapshot = {
      version: _currentVersion,
      buildId,
      blueprint: { ...blueprint, version: _currentVersion },
      savedAt: Date.now(),
    };
    _snapshots.set(_currentVersion, snap);

    // Evict oldest when over cap
    if (_snapshots.size > MAX_SNAPSHOTS) {
      const oldest = Math.min(..._snapshots.keys());
      _snapshots.delete(oldest);
    }

    return snap;
  } catch {
    // Never throws — return identity with current version
    return { version: _currentVersion, buildId, blueprint: { ...blueprint, version: _currentVersion }, savedAt: Date.now() };
  }
}

export function getCurrentAdaptiveSnapshot(): AdaptiveSnapshot | null {
  if (_currentVersion === 0) return null;
  return _snapshots.get(_currentVersion) ?? null;
}

export function getAdaptiveSnapshot(version: number): AdaptiveSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function getAdaptivePersistenceStats() {
  const versions = Array.from(_snapshots.keys());
  const total = _snapshots.size;
  return {
    totalSnapshots:  total,
    currentVersion:  _currentVersion,
    capacityUsed:    total === 0 ? 0 : Math.max(1, Math.round((total / MAX_SNAPSHOTS) * 100)),
    oldestVersion:   versions.length > 0 ? Math.min(...versions) : null,
    newestVersion:   versions.length > 0 ? Math.max(...versions) : null,
  };
}

export function rollbackToAdaptiveSnapshot(version: number): AdaptiveSnapshot | null {
  const snap = _snapshots.get(version);
  if (!snap) return null;
  // Does not remove newer snapshots — rollback is non-destructive
  return snap;
}

export function resetAdaptivePersistence(): void {
  _snapshots.clear();
  _currentVersion = 0;
}
