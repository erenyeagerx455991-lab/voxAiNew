// ── V8.6 Backend Architect — Persistence Layer (Phase 23) ─────────────────────
//
// Stores architecture history in-memory with version snapshots, rollback support,
// debounced writes, and a 500-record cap. Designed to never throw into the pipeline.

import type { BackendArchitectureBlueprint, BackendType } from './backendTypes.js';
import { initBackendPersistence } from './backendLearning.js';

const MAX_HISTORY    = 500;
const DEBOUNCE_MS    = 300;

// ── Version History Record ─────────────────────────────────────────────────────

export interface ArchitectureSnapshot {
  version:     number;
  buildId:     string;
  backendType: BackendType;
  overallScore:number;
  /** Serialised blueprint for rollback; intentionally compact subset. */
  blueprint:   Readonly<BackendArchitectureBlueprint>;
  recordedAt:  number;
}

// ── In-memory store ────────────────────────────────────────────────────────────

interface PersistenceState {
  history:     ArchitectureSnapshot[];
  version:     number;
  initialized: boolean;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

const state: PersistenceState = {
  history:      [],
  version:      0,
  initialized:  false,
  debounceTimer:null,
};

// ── Internal helpers ───────────────────────────────────────────────────────────

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

function scheduleFlush(): void {
  if (state.debounceTimer !== null) {
    clearTimeout(state.debounceTimer);
  }
  state.debounceTimer = setTimeout(() => {
    state.debounceTimer = null;
    // In a server environment, "flush" is a no-op — the in-memory store IS the
    // persisted state.  A filesystem or DB layer would write here.
  }, DEBOUNCE_MS);
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Must be called once at server startup. Idempotent. */
export function initBackendArchitectPersistence(): void {
  if (state.initialized) return;
  state.initialized = true;
  initBackendPersistence();
}

/** Record a new architecture snapshot. Never throws. */
export function persistArchitectureSnapshot(
  buildId:   string,
  blueprint: BackendArchitectureBlueprint,
): void {
  try {
    state.version++;
    const snapshot: ArchitectureSnapshot = {
      version:      state.version,
      buildId,
      backendType:  blueprint.backendType,
      overallScore: blueprint.overallScore,
      blueprint,
      recordedAt:   Date.now(),
    };
    state.history.push(snapshot);
    capHistory();
    scheduleFlush();
  } catch {
    // Persistence must never stop builds
  }
}

/** Return a shallow copy of all stored snapshots, newest first. */
export function getArchitectureHistory(): ArchitectureSnapshot[] {
  return [...state.history].reverse();
}

/** Return the N most recent snapshots. */
export function getRecentSnapshots(limit = 20): ArchitectureSnapshot[] {
  return state.history.slice(-Math.min(limit, MAX_HISTORY)).reverse();
}

/** Return the snapshot at the given version number, or undefined. */
export function getSnapshotAtVersion(version: number): ArchitectureSnapshot | undefined {
  return state.history.find(s => s.version === version);
}

/** Return the current (latest) snapshot, or undefined if no builds recorded. */
export function getCurrentSnapshot(): ArchitectureSnapshot | undefined {
  return state.history[state.history.length - 1];
}

/** Rollback: return the blueprint from a given version (does NOT re-run the pipeline). */
export function rollbackToVersion(
  version: number,
): { ok: true; snapshot: ArchitectureSnapshot } | { ok: false; reason: string } {
  const snapshot = getSnapshotAtVersion(version);
  if (!snapshot) {
    return { ok: false, reason: `Version ${version} not found in history` };
  }
  return { ok: true, snapshot };
}

/** Summary statistics for telemetry. */
export function getPersistenceStats(): {
  totalSnapshots: number;
  currentVersion: number;
  oldestVersion:  number | null;
  newestVersion:  number | null;
  capacityUsed:   number;
} {
  const n = state.history.length;
  return {
    totalSnapshots: n,
    currentVersion: state.version,
    oldestVersion:  n > 0 ? state.history[0].version     : null,
    newestVersion:  n > 0 ? state.history[n - 1].version : null,
    capacityUsed:   Math.round((n / MAX_HISTORY) * 100),
  };
}

/** Full reset — for tests only. */
export function resetBackendArchitectPersistence(): void {
  if (state.debounceTimer !== null) {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
  state.history.length = 0;
  state.version        = 0;
  state.initialized    = false;
  initBackendPersistence();
}
