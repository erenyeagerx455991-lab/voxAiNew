// ── V8.7 DevOps Architect — Persistence Layer ────────────────────────────────
import type { DevOpsBlueprint } from './devopsTypes.js';

const MAX_SNAPSHOTS = 500;
const DEBOUNCE_MS   = 300;

export interface DevOpsSnapshot {
  version:    number;
  blueprint:  DevOpsBlueprint;
  recordedAt: number;
}

interface PersistenceState {
  snapshots:       DevOpsSnapshot[];
  versionCounter:  number;
  flushTimer:      ReturnType<typeof setTimeout> | null;
  pendingBlueprint:DevOpsBlueprint | null;
}

const state: PersistenceState = {
  snapshots:        [],
  versionCounter:   0,
  flushTimer:       null,
  pendingBlueprint: null,
};

function capHistory(): void {
  if (state.snapshots.length > MAX_SNAPSHOTS) {
    state.snapshots.splice(0, state.snapshots.length - MAX_SNAPSHOTS);
  }
}

function doFlush(): void {
  if (!state.pendingBlueprint) return;
  state.versionCounter++;
  state.snapshots.push({
    version:   state.versionCounter,
    blueprint: state.pendingBlueprint,
    recordedAt:Date.now(),
  });
  capHistory();
  state.pendingBlueprint = null;
  state.flushTimer = null;
}

export function saveDevOpsBlueprint(blueprint: DevOpsBlueprint): void {
  state.pendingBlueprint = blueprint;
  if (state.flushTimer) clearTimeout(state.flushTimer);
  state.flushTimer = setTimeout(doFlush, DEBOUNCE_MS);
}

export function flushDevOpsPersistence(): void {
  if (state.flushTimer) {
    clearTimeout(state.flushTimer);
    state.flushTimer = null;
  }
  doFlush();
}

export function getDevOpsSnapshots(): DevOpsSnapshot[] {
  return [...state.snapshots];
}

export function getRecentDevOpsSnapshots(limit = 10): DevOpsSnapshot[] {
  return state.snapshots.slice(-limit);
}

export function getDevOpsSnapshotAtVersion(version: number): DevOpsSnapshot | null {
  return state.snapshots.find(s => s.version === version) ?? null;
}

export function rollbackDevOpsToVersion(version: number): DevOpsBlueprint | null {
  const snap = getDevOpsSnapshotAtVersion(version);
  return snap ? snap.blueprint : null;
}

export function getCurrentDevOpsVersion(): number {
  return state.versionCounter;
}

export function getDevOpsPersistenceStats(): {
  totalSnapshots: number;
  currentVersion: number;
  capacityUsed:   number;
  oldestVersion:  number | null;
  newestVersion:  number | null;
} {
  const n = state.snapshots.length;
  return {
    totalSnapshots: n,
    currentVersion: state.versionCounter,
    capacityUsed:   n === 0 ? 0 : Math.round((n / MAX_SNAPSHOTS) * 100),
    oldestVersion:  n === 0 ? null : state.snapshots[0].version,
    newestVersion:  n === 0 ? null : state.snapshots[n - 1].version,
  };
}

export function resetDevOpsPersistence(): void {
  if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
  state.snapshots.length = 0;
  state.versionCounter   = 0;
  state.pendingBlueprint = null;
}

export function initDevOpsPersistence(): void {
  // In-memory store — always fresh after restart. Idempotent.
}
