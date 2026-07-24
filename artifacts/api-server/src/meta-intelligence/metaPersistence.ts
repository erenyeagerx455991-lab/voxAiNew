// ── V10.1 — Meta Persistence ───────────────────────────────────────────────────
// Versioned in-memory snapshots. 500-cap. Never throws.
import type { MetaBlueprint, MetaSnapshot } from './metaTypes.js';

const MAX_SNAPSHOTS = 500;
let _currentVersion = 0;
const _snapshots = new Map<number, MetaSnapshot>();

export function saveMetaSnapshot(buildId: string, blueprint: MetaBlueprint): MetaSnapshot {
  try {
    _currentVersion++;
    const snap: MetaSnapshot = {
      version:   _currentVersion,
      buildId,
      blueprint: { ...blueprint, version: _currentVersion },
      savedAt:   Date.now(),
    };
    _snapshots.set(_currentVersion, snap);

    if (_snapshots.size > MAX_SNAPSHOTS) {
      const oldest = Math.min(..._snapshots.keys());
      _snapshots.delete(oldest);
    }

    return snap;
  } catch {
    return {
      version:   _currentVersion,
      buildId,
      blueprint: { ...blueprint, version: _currentVersion },
      savedAt:   Date.now(),
    };
  }
}

export function getCurrentMetaSnapshot(): MetaSnapshot | null {
  if (_currentVersion === 0) return null;
  return _snapshots.get(_currentVersion) ?? null;
}

export function getMetaSnapshot(version: number): MetaSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function getMetaPersistenceStats() {
  const versions = Array.from(_snapshots.keys());
  const total    = _snapshots.size;
  return {
    totalSnapshots: total,
    currentVersion: _currentVersion,
    capacityUsed:   total === 0 ? 0 : Math.max(1, Math.round((total / MAX_SNAPSHOTS) * 100)),
    oldestVersion:  versions.length > 0 ? Math.min(...versions) : null,
    newestVersion:  versions.length > 0 ? Math.max(...versions) : null,
  };
}

export function rollbackToMetaSnapshot(version: number): MetaSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function resetMetaPersistence(): void {
  _snapshots.clear();
  _currentVersion = 0;
}
