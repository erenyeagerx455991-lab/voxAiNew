// ── V9.5 Decision History / Persistence Layer ─────────────────────────────────
// Versioned snapshot history, capped at 1000 records per the V9.5 spec.
import type { ReasoningBlueprint } from './types.js';

const MAX_SNAPSHOTS = 1000;

interface Snapshot {
  version:    number;
  buildId:    string;
  blueprint:  ReasoningBlueprint;
  savedAt:    number;
}

let history: Snapshot[] = [];
let versionCounter = 0;

export function persistReasoningSnapshot(buildId: string, blueprint: ReasoningBlueprint): Snapshot {
  versionCounter += 1;
  const snapshot: Snapshot = { version: versionCounter, buildId, blueprint: { ...blueprint, version: versionCounter }, savedAt: Date.now() };
  history.push(snapshot);
  if (history.length > MAX_SNAPSHOTS) history = history.slice(history.length - MAX_SNAPSHOTS);
  return snapshot;
}

export function getCurrentReasoningSnapshot(): Snapshot | null {
  return history.length > 0 ? history[history.length - 1] : null;
}

export function getReasoningRollback(version: number): Snapshot | null {
  return history.find(s => s.version === version) ?? null;
}

export function getReasoningPersistenceStats(): {
  totalSnapshots: number; currentVersion: number; oldestVersion: number | null; newestVersion: number | null; capacityUsed: number;
} {
  const totalSnapshots = history.length;
  const currentVersion = totalSnapshots > 0 ? history[history.length - 1].version : 0;
  const oldestVersion = totalSnapshots > 0 ? history[0].version : null;
  const newestVersion = totalSnapshots > 0 ? history[history.length - 1].version : null;
  const capacityUsed = Math.round((totalSnapshots / MAX_SNAPSHOTS) * 100);
  return { totalSnapshots, currentVersion, oldestVersion, newestVersion, capacityUsed };
}

export function resetReasoningPersistence(): void {
  history = [];
  versionCounter = 0;
}
