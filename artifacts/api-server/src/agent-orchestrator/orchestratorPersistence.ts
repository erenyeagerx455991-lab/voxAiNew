// ── V9.2 Orchestrator — Persistence Layer ────────────────────────────────────
//
// Mirrors runtimePersistence.ts: in-memory capped snapshot store of
// ExecutionBlueprints + agent health + learning summary, with version
// history and rollback. Crash-safe — persistence never stops a build.
import type { AgentHealthSnapshot, ExecutionBlueprint } from './types.js';

const MAX_HISTORY = 500;

interface OrchestratorSnapshot {
  version:    number;
  buildId:    string;
  blueprint:  ExecutionBlueprint;
  health:     AgentHealthSnapshot[];
  recordedAt: number;
}

interface PersistenceState {
  history: OrchestratorSnapshot[];
  version: number;
}

const state: PersistenceState = { history: [], version: 0 };

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

export function persistExecutionSnapshot(
  buildId: string,
  blueprint: ExecutionBlueprint,
  health: AgentHealthSnapshot[],
): void {
  try {
    state.version++;
    state.history.push({ version: state.version, buildId, blueprint, health, recordedAt: Date.now() });
    capHistory();
  } catch { /* persistence must never stop builds */ }
}

export function getCurrentExecutionSnapshot(): OrchestratorSnapshot | undefined {
  return state.history[state.history.length - 1];
}

export function getExecutionSnapshotByVersion(version: number): OrchestratorSnapshot | undefined {
  return state.history.find(s => s.version === version);
}

export function getExecutionRollbackSnapshot(currentVersion: number): OrchestratorSnapshot | undefined {
  const candidates = state.history.filter(s => s.version < currentVersion);
  return candidates[candidates.length - 1];
}

export function getOrchestratorPersistenceStats(): {
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

export function resetOrchestratorPersistence(): void {
  state.history.length = 0;
  state.version = 0;
}
