// ── V8.9 Security Architecture Integration — Persistence Layer ───────────────
//
// Mirrors backendPersistence.ts: in-memory version history with a capped
// snapshot store. Not a separate persistence mechanism — same pattern, scoped
// to SecurityIntelligenceBlueprint snapshots.
import type { SecurityIntelligenceBlueprint } from './securityTypes.js';

const MAX_HISTORY = 500;

export interface SecuritySnapshot {
  version:      number;
  buildId:      string;
  backendType:  string;
  overallScore: number;
  blueprint:    Readonly<SecurityIntelligenceBlueprint>;
  recordedAt:   number;
}

interface PersistenceState {
  history:     SecuritySnapshot[];
  version:     number;
  initialized: boolean;
}

const state: PersistenceState = { history: [], version: 0, initialized: false };

function capHistory(): void {
  if (state.history.length > MAX_HISTORY) {
    state.history.splice(0, state.history.length - MAX_HISTORY);
  }
}

export function initSecurityArchitectPersistence(): void {
  state.initialized = true;
}

export function persistSecuritySnapshot(
  buildId:     string,
  backendType: string,
  blueprint:   SecurityIntelligenceBlueprint,
): void {
  try {
    state.version++;
    state.history.push({
      version: state.version,
      buildId,
      backendType,
      overallScore: blueprint.overallScore,
      blueprint,
      recordedAt: Date.now(),
    });
    capHistory();
  } catch {
    // Persistence must never stop builds
  }
}

export function getCurrentSecuritySnapshot(): SecuritySnapshot | undefined {
  return state.history[state.history.length - 1];
}

export function getSecurityArchitectPersistenceStats(): {
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

export function resetSecurityArchitectPersistence(): void {
  state.history.length = 0;
  state.version = 0;
  state.initialized = false;
}
