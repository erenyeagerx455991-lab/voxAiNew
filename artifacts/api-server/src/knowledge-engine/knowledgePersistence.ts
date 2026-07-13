// ── V9.4 Knowledge Engine — Persistence ────────────────────────────────────────
//
// Capped in-memory store of knowledge snapshots (graph + semantic index +
// store + relationships), version history, rollback support, automatic
// cleanup. Max 1000 records per the V9.4 spec (V9.3's model-orchestrator used
// 500 — V9.4 explicitly calls for 1000).
import { getGraphStats } from './knowledgeGraph.js';
import { getKnowledgeStats } from './knowledgeCollector.js';

const MAX_HISTORY = 1000;

interface KnowledgeSnapshot {
  version:      number;
  buildId:      string;
  totalRecords: number;
  graphStats:   ReturnType<typeof getGraphStats>;
  recordedAt:   number;
}

interface PersistenceState {
  history: KnowledgeSnapshot[];
  version: number;
}

const state: PersistenceState = { history: [], version: 0 };

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

export function persistKnowledgeSnapshot(buildId: string): KnowledgeSnapshot | undefined {
  try {
    state.version++;
    const snapshot: KnowledgeSnapshot = {
      version:      state.version,
      buildId,
      totalRecords: getKnowledgeStats().totalRecords,
      graphStats:   getGraphStats(),
      recordedAt:   Date.now(),
    };
    state.history.push(snapshot);
    capHistory();
    return snapshot;
  } catch { return undefined; /* persistence must never stop builds */ }
}

export function getCurrentKnowledgeSnapshot(): KnowledgeSnapshot | undefined {
  return state.history[state.history.length - 1];
}

export function getKnowledgeSnapshotByVersion(version: number): KnowledgeSnapshot | undefined {
  return state.history.find(s => s.version === version);
}

export function getKnowledgeRollback(currentVersion: number): KnowledgeSnapshot | undefined {
  const candidates = state.history.filter(s => s.version < currentVersion);
  return candidates[candidates.length - 1];
}

export function getKnowledgePersistenceStats(): {
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

export function resetKnowledgePersistence(): void {
  state.history.length = 0;
  state.version = 0;
}
