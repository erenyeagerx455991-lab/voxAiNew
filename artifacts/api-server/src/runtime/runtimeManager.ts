import type { BuildError } from './runtimeValidator.js';
import type { ResolvedDependencies } from './dependencyResolver.js';

export type RuntimeStatus = 'idle' | 'installing' | 'validating' | 'running' | 'failed' | 'repaired';

export interface RuntimeLog {
  timestamp: number;
  type: 'info' | 'error' | 'warn' | 'success';
  message: string;
}

export interface RuntimeState {
  status: RuntimeStatus;
  buildPassed: boolean;
  runtimePassed: boolean;
  logs: RuntimeLog[];
  attempts: number;
  healthScore: number;
  buildErrors: BuildError[];
  dependencies: ResolvedDependencies | null;
  startedAt?: number;
  finishedAt?: number;
  filesValidated?: number;
  filesTotal?: number;
  missingImports?: Array<{ file: string; missingPackage: string }>;
  repairedFiles?: number;
}

const MAX_LOGS = 500;
const store = new Map<string, RuntimeState>();

export function getFreshState(): RuntimeState {
  return {
    status: 'idle',
    buildPassed: false,
    runtimePassed: false,
    logs: [],
    attempts: 0,
    healthScore: 0,
    buildErrors: [],
    dependencies: null,
  };
}

export function getState(chatId: string): RuntimeState {
  return store.get(chatId) ?? getFreshState();
}

export function setState(chatId: string, partial: Partial<RuntimeState>): RuntimeState {
  const prev = store.get(chatId) ?? getFreshState();
  const next = { ...prev, ...partial };
  store.set(chatId, next);
  return next;
}

export function addLog(chatId: string, type: RuntimeLog['type'], message: string): void {
  const state = store.get(chatId) ?? getFreshState();
  const logs = [...state.logs, { timestamp: Date.now(), type, message }];
  if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
  store.set(chatId, { ...state, logs });
}

export function clearState(chatId: string): void {
  store.delete(chatId);
}

export function computeHealthFromState(state: RuntimeState): number {
  let score = 0;

  const fileRatio = (state.filesValidated ?? 0) / Math.max(1, state.filesTotal ?? 1);

  if (state.buildPassed) {
    score += 40;
  } else if (fileRatio > 0.75) {
    score += 25;
  } else if (fileRatio > 0.5) {
    score += 15;
  } else if (state.buildErrors.length === 0) {
    score += 20;
  }

  if (state.dependencies && state.dependencies.packages.length > 0) score += 20;
  else score += 10;

  if (state.runtimePassed) score += 20;
  else if (state.buildPassed) score += 10;

  const hasRouteErrors = state.buildErrors.some(e =>
    e.message.toLowerCase().includes('route') ||
    e.message.toLowerCase().includes('router')
  );
  if (!hasRouteErrors) score += 10;

  const hasConsoleErrors = state.logs.some(l => l.type === 'error');
  if (!hasConsoleErrors) score += 10;

  if (state.repairedFiles && state.repairedFiles > 0) {
    score = Math.min(100, score + 5);
  }

  return Math.min(100, Math.max(0, score));
}

export function getAllStates(): Map<string, RuntimeState> {
  return new Map(store);
}

export function pruneOldStates(maxAgeMs = 30 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [chatId, state] of store.entries()) {
    if (state.finishedAt && state.finishedAt < cutoff) {
      store.delete(chatId);
    }
  }
}
