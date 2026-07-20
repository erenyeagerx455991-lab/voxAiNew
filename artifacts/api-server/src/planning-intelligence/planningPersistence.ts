// ── V9.7 Planning Intelligence — Phase 17: Persistence ────────────────────────
// Versioned in-memory snapshots. 500-cap. Never throws.
import type { PlanningBlueprint, PlanningSnapshot } from './planningTypes.js';

const MAX_SNAPSHOTS = 500;
let _currentVersion = 0;
const _snapshots = new Map<number, PlanningSnapshot>();

export function savePlanningSnapshot(
  buildId: string,
  blueprint: PlanningBlueprint,
): PlanningSnapshot {
  _currentVersion++;
  const snap: PlanningSnapshot = {
    version:   _currentVersion,
    buildId,
    blueprint: { ...blueprint, version: _currentVersion },
    savedAt:   Date.now(),
  };
  _snapshots.set(_currentVersion, snap);

  // Evict oldest when over cap
  if (_snapshots.size > MAX_SNAPSHOTS) {
    const oldest = Math.min(..._snapshots.keys());
    _snapshots.delete(oldest);
  }

  return snap;
}

export function getCurrentPlanningSnapshot(): PlanningSnapshot | null {
  if (_currentVersion === 0) return null;
  return _snapshots.get(_currentVersion) ?? null;
}

export function getPlanningSnapshot(version: number): PlanningSnapshot | null {
  return _snapshots.get(version) ?? null;
}

export function getPlanningPersistenceStats() {
  const versions = Array.from(_snapshots.keys());
  const total = _snapshots.size;
  return {
    totalSnapshots:  total,
    currentVersion:  _currentVersion,
    capacityUsed:    Math.round((total / MAX_SNAPSHOTS) * 100),
    oldestVersion:   versions.length > 0 ? Math.min(...versions) : null,
    newestVersion:   versions.length > 0 ? Math.max(...versions) : null,
  };
}

export function resetPlanningPersistence(): void {
  _snapshots.clear();
  _currentVersion = 0;
}
