// ── V9.0 Runtime Intelligence — Persistence Layer ────────────────────────────
//
// Mirrors backendPersistence.ts / securityPersistence.ts:
// in-memory capped snapshot store, crash-safe, rollback-capable.
import type { RuntimeBlueprint, GenerationMode, RuntimeSnapshot } from './runtimeTypes.js';

const MAX_HISTORY = 500;

interface PersistenceState {
  history:     RuntimeSnapshot[];
  version:     number;
  initialized: boolean;
}

const state: PersistenceState = { history: [], version: 0, initialized: false };

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

export function initRuntimeIntelligencePersistence(): void {
  state.initialized = true;
}

export function persistRuntimeSnapshot(
  buildId:   string,
  mode:      GenerationMode,
  blueprint: RuntimeBlueprint,
): void {
  try {
    state.version++;
    state.history.push({
      version:      state.version,
      buildId,
      mode,
      overallScore: blueprint.overallScore,
      blueprint,
      recordedAt:   Date.now(),
    });
    capHistory();
  } catch {
    // Persistence must never stop builds
  }
}

export function getCurrentRuntimeSnapshot(): RuntimeSnapshot | undefined {
  return state.history[state.history.length - 1];
}

export function getRuntimeSnapshotByVersion(version: number): RuntimeSnapshot | undefined {
  return state.history.find(s => s.version === version);
}

/** Rollback: get the snapshot just before a given version. */
export function getRollbackSnapshot(currentVersion: number): RuntimeSnapshot | undefined {
  const candidates = state.history.filter(s => s.version < currentVersion);
  return candidates[candidates.length - 1];
}

/** V9.1: the currently-active evaluator weight profile, with rollback/version
 *  history available via getRuntimeSnapshotByVersion / getRollbackSnapshot. */
export function getActiveEvaluatorProfile(): {
  version:   number;
  buildId:   string;
  profile:   string;
  weights:   Record<string, number>;
  threshold: number;
} | undefined {
  const snap = getCurrentRuntimeSnapshot();
  if (!snap || !snap.blueprint?.evaluationStrategy) return undefined;
  const { profile, weights, threshold } = snap.blueprint.evaluationStrategy;
  return { version: snap.version, buildId: snap.buildId, profile, weights, threshold };
}

export function getRuntimePersistenceStats(): {
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
    oldestVersion:  n > 0 ? state.history[0].version       : null,
    newestVersion:  n > 0 ? state.history[n - 1].version   : null,
    capacityUsed:   Math.round((n / MAX_HISTORY) * 100),
  };
}

export function resetRuntimePersistence(): void {
  state.history.length = 0;
  state.version = 0;
  state.initialized = false;
}
