// ── V10.0 — Optimization Persistence ──────────────────────────────────────────
// Versioned in-memory snapshots. 500-cap. Never throws.
import type { OptimizationBlueprint, OptimizationSnapshot } from './optimizationTypes.js';

const MAX_SNAPSHOTS = 500;
let _currentVersion = 0;
const _snapshots = new Map<number, OptimizationSnapshot>();

export function saveOptimizationSnapshot(buildId: string, blueprint: OptimizationBlueprint): OptimizationSnapshot {
  try {
    _currentVersion++;
    const snap: OptimizationSnapshot = {
      version: _currentVersion,
      buildId,
      blueprint: { ...blueprint, version: _currentVersion },
      savedAt: Date.now(),
    };
    _snapshots.set(_currentVersion, snap);

    if (_snapshots.size > MAX_SNAPSHOTS) {
      const oldest = Math.min(..._snapshots.keys());
      _snapshots.delete(oldest);
    }

    return snap;
  } catch {
    return { version: _currentVersion, buildId, blueprint: { ...blueprint, version: _currentVersion }, savedAt: Date.now() };
  }
}

export function getCurrentOptimizationSnapshot(): OptimizationSnapshot | null {
  if (_currentVersion === 0) return null;
  return _snapshots.get(_currentVersion) ?? null;
}

export function getOptimizationSnapshot(version: number): OptimizationSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function getOptimizationPersistenceStats() {
  const versions = Array.from(_snapshots.keys());
  const total = _snapshots.size;
  return {
    totalSnapshots: total,
    currentVersion: _currentVersion,
    capacityUsed: total === 0 ? 0 : Math.max(1, Math.round((total / MAX_SNAPSHOTS) * 100)),
    oldestVersion: versions.length > 0 ? Math.min(...versions) : null,
    newestVersion: versions.length > 0 ? Math.max(...versions) : null,
  };
}

export function rollbackToOptimizationSnapshot(version: number): OptimizationSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function resetOptimizationPersistence(): void {
  _snapshots.clear();
  _currentVersion = 0;
}
