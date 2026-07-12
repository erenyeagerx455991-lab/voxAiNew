// ── V8.8 QA Architect — Phase 22: Persistence ────────────────────────────────
import type { QABlueprint } from './qaTypes.js';

const MAX_SNAPSHOTS = 500;
const DEBOUNCE_MS   = 300;

interface QASnapshot {
  version:   number;
  blueprint: QABlueprint;
  savedAt:   string;
}

interface PersistenceState {
  snapshots:      QASnapshot[];
  versionCounter: number;
  pendingBlueprint: QABlueprint | null;
  flushTimer:     ReturnType<typeof setTimeout> | null;
}

const state: PersistenceState = {
  snapshots:       [],
  versionCounter:  0,
  pendingBlueprint:null,
  flushTimer:      null,
};

function capHistory(): void {
  if (state.snapshots.length > MAX_SNAPSHOTS) {
    state.snapshots.splice(0, state.snapshots.length - MAX_SNAPSHOTS);
  }
}

export function saveQABlueprint(bp: QABlueprint): void {
  state.pendingBlueprint = bp;
  if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
  state.flushTimer = setTimeout(() => flushQAPersistence(), DEBOUNCE_MS);
}

export function flushQAPersistence(): void {
  if (!state.pendingBlueprint) return;
  state.versionCounter += 1;
  state.snapshots.push({
    version:   state.versionCounter,
    blueprint: state.pendingBlueprint,
    savedAt:   new Date().toISOString(),
  });
  state.pendingBlueprint = null;
  if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
  capHistory();
}

export function getQASnapshots(): QASnapshot[] { return [...state.snapshots]; }

export function getRecentQASnapshots(limit: number): QASnapshot[] {
  return state.snapshots.slice(-limit);
}

export function getQASnapshotAtVersion(version: number): QASnapshot | null {
  return state.snapshots.find(s => s.version === version) ?? null;
}

export function rollbackQAToVersion(version: number): QABlueprint | null {
  const snap = getQASnapshotAtVersion(version);
  return snap ? snap.blueprint : null;
}

export function getCurrentQAVersion(): number { return state.versionCounter; }

export interface QAPersistenceStats {
  totalSnapshots: number;
  currentVersion: number;
  capacityUsed:   number;
  oldestVersion:  number | null;
  newestVersion:  number | null;
}

export function getQAPersistenceStats(): QAPersistenceStats {
  const n = state.snapshots.length;
  return {
    totalSnapshots: n,
    currentVersion: state.versionCounter,
    capacityUsed:   n === 0 ? 0 : Math.max(1, Math.round((n / MAX_SNAPSHOTS) * 100)),
    oldestVersion:  n === 0 ? null : state.snapshots[0].version,
    newestVersion:  n === 0 ? null : state.snapshots[n - 1].version,
  };
}

export function resetQAPersistence(): void {
  if (state.flushTimer) { clearTimeout(state.flushTimer); state.flushTimer = null; }
  state.snapshots.length = 0;
  state.versionCounter   = 0;
  state.pendingBlueprint = null;
}
