// ── V9.6 Execution Persistence ────────────────────────────────────────────────
// In-memory versioned snapshot store, 500-record cap.
import type { ExecutionIntelligenceBlueprint } from './executionTypes.js';

const MAX_SNAPSHOTS = 500;

interface PersistedSnapshot {
  version:   number;
  buildId:   string;
  blueprint: ExecutionIntelligenceBlueprint;
  savedAt:   number;
}

let history: PersistedSnapshot[] = [];
let versionCounter = 0;

export function saveExecutionSnapshot(buildId: string, blueprint: ExecutionIntelligenceBlueprint): PersistedSnapshot {
  versionCounter += 1;
  const snap: PersistedSnapshot = {
    version: versionCounter,
    buildId,
    blueprint: { ...blueprint, version: versionCounter, recordedAt: Date.now() },
    savedAt: Date.now(),
  };
  history.push(snap);
  if (history.length > MAX_SNAPSHOTS) history = history.slice(history.length - MAX_SNAPSHOTS);
  return snap;
}

export function getCurrentExecutionSnapshot(): PersistedSnapshot | null {
  return history.length > 0 ? history[history.length - 1] : null;
}

export function getExecutionSnapshot(version: number): PersistedSnapshot | null {
  return history.find(s => s.version === version) ?? null;
}

export function getExecutionPersistenceStats(): {
  totalSnapshots: number; currentVersion: number;
  oldestVersion: number | null; newestVersion: number | null; capacityUsed: number;
} {
  const totalSnapshots = history.length;
  const currentVersion = totalSnapshots > 0 ? history[history.length - 1].version : 0;
  const oldestVersion = totalSnapshots > 0 ? history[0].version : null;
  const newestVersion = totalSnapshots > 0 ? history[history.length - 1].version : null;
  const capacityUsed = Math.round((totalSnapshots / MAX_SNAPSHOTS) * 100);
  return { totalSnapshots, currentVersion, oldestVersion, newestVersion, capacityUsed };
}

export function resetExecutionPersistence(): void {
  history = [];
  versionCounter = 0;
}
