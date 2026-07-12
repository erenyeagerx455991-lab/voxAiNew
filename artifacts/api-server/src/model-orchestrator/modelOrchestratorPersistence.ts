// ── V9.3 Model Orchestrator — Persistence Layer ───────────────────────────────
//
// Capped in-memory store of ModelExecutionBlueprints + provider metrics +
// budget profiles + routing history. Max 500 records, version history,
// rollback. Crash-safe — never stops builds.
import type { ModelExecutionBlueprint } from './types.js';

const MAX_HISTORY = 500;

interface ModelOrchestratorSnapshot {
  version:    number;
  buildId:    string;
  blueprint:  ModelExecutionBlueprint;
  recordedAt: number;
}

interface PersistenceState {
  history: ModelOrchestratorSnapshot[];
  version: number;
}

const state: PersistenceState = { history: [], version: 0 };

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

export function persistModelBlueprint(buildId: string, blueprint: ModelExecutionBlueprint): void {
  try {
    state.version++;
    state.history.push({ version: state.version, buildId, blueprint, recordedAt: Date.now() });
    capHistory();
  } catch { /* persistence must never stop builds */ }
}

export function getCurrentModelBlueprint(): ModelOrchestratorSnapshot | undefined {
  return state.history[state.history.length - 1];
}

export function getModelBlueprintByVersion(version: number): ModelOrchestratorSnapshot | undefined {
  return state.history.find(s => s.version === version);
}

export function getModelBlueprintRollback(currentVersion: number): ModelOrchestratorSnapshot | undefined {
  const candidates = state.history.filter(s => s.version < currentVersion);
  return candidates[candidates.length - 1];
}

export function getModelOrchestratorPersistenceStats(): {
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
    oldestVersion:  n > 0 ? state.history[0].version : null,
    newestVersion:  n > 0 ? state.history[n - 1].version : null,
    capacityUsed:   Math.round((n / MAX_HISTORY) * 100),
  };
}

export function resetModelOrchestratorPersistence(): void {
  state.history.length = 0;
  state.version = 0;
}
