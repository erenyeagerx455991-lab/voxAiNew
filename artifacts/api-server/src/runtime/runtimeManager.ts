import type { BuildError } from './runtimeValidator.js';
import type { ResolvedDependencies } from './dependencyResolver.js';
import type { RuntimeDependencyGraph } from './dependencyResolverV2.js';

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
  warnings?: BuildError[];
}

// ── V6.1: Repair History & Metrics ───────────────────────────────────────────

export interface RuntimeRepairRecord {
  id: string;
  timestamp: number;
  errorType: string;
  errorMessage: string;
  filesChanged: string[];
  attempt: number;
  success: boolean;
  qualityScore: number;
  duration: number;
}

export interface RepairMetrics {
  totalRepairs: number;
  successfulRepairs: number;
  failedRepairs: number;
  averageAttempts: number;
  successRate: number;
  mostCommonErrorType: string;
  averageQualityScore: number;
}

export interface RuntimeHealthV2 {
  overall: number;
  compile: number;
  runtime: number;
  repair: number;
  dependency: number;
  route: number;
}

const MAX_LOGS = 500;
const MAX_REPAIR_HISTORY = 50;
const store = new Map<string, RuntimeState>();
const repairStore = new Map<string, RuntimeRepairRecord[]>();

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
    warnings: [],
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
  if (state.buildPassed) score += 40;
  else if (fileRatio > 0.75) score += 25;
  else if (fileRatio > 0.5) score += 15;
  else if (state.buildErrors.length === 0) score += 20;
  if (state.dependencies && state.dependencies.packages.length > 0) score += 20;
  else score += 10;
  if (state.runtimePassed) score += 20;
  else if (state.buildPassed) score += 10;
  const hasRouteErrors = state.buildErrors.some(e =>
    e.message.toLowerCase().includes('route') || e.message.toLowerCase().includes('router')
  );
  if (!hasRouteErrors) score += 10;
  const hasConsoleErrors = state.logs.some(l => l.type === 'error');
  if (!hasConsoleErrors) score += 10;
  if (state.repairedFiles && state.repairedFiles > 0) score = Math.min(100, score + 5);
  return Math.min(100, Math.max(0, score));
}

// ── V6.1: 5-Dimension Health Score ───────────────────────────────────────────

export function computeHealthV2(state: RuntimeState): RuntimeHealthV2 {
  const errs = state.buildErrors ?? [];
  const compile = state.buildPassed
    ? 100
    : errs.length > 0
      ? Math.max(0, 100 - errs.filter(e => e.type === 'error').length * 15)
      : 75;

  const runtime = state.runtimePassed ? 100 : state.buildPassed ? 70 : 40;

  const repaired = state.repairedFiles ?? 0;
  const repairScore = repaired > 0
    ? Math.min(100, 60 + repaired * 15)
    : state.buildPassed ? 100 : 50;

  const dependency = state.dependencies && state.dependencies.packages.length > 0
    ? 100
    : state.buildPassed ? 80 : 60;

  const hasRouteErrors = errs.some(e =>
    e.message.toLowerCase().includes('route') || e.message.toLowerCase().includes('router')
  );
  const route = hasRouteErrors ? 50 : state.buildPassed ? 100 : 75;

  const overall = Math.round((compile + runtime + repairScore + dependency + route) / 5);
  return { overall, compile, runtime, repair: repairScore, dependency, route };
}

// ── V6.1: Repair History Management ──────────────────────────────────────────

export function addRepairRecord(chatId: string, record: RuntimeRepairRecord): void {
  const existing = repairStore.get(chatId) ?? [];
  const next = [...existing, record].slice(-MAX_REPAIR_HISTORY);
  repairStore.set(chatId, next);
}

export function getRepairHistory(chatId: string): RuntimeRepairRecord[] {
  return repairStore.get(chatId) ?? [];
}

export function clearRepairHistory(chatId: string): void {
  repairStore.delete(chatId);
}

export function getRepairMetrics(chatId: string): RepairMetrics {
  const history = getRepairHistory(chatId);
  if (history.length === 0) {
    return {
      totalRepairs: 0,
      successfulRepairs: 0,
      failedRepairs: 0,
      averageAttempts: 0,
      successRate: 0,
      mostCommonErrorType: 'none',
      averageQualityScore: 0,
    };
  }
  const successful = history.filter(r => r.success);
  const typeCounts: Record<string, number> = {};
  let totalAttempts = 0;
  let totalQuality = 0;
  for (const r of history) {
    typeCounts[r.errorType] = (typeCounts[r.errorType] ?? 0) + 1;
    totalAttempts += r.attempt;
    totalQuality += r.qualityScore;
  }
  const mostCommonErrorType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
  return {
    totalRepairs: history.length,
    successfulRepairs: successful.length,
    failedRepairs: history.length - successful.length,
    averageAttempts: Math.round((totalAttempts / history.length) * 10) / 10,
    successRate: Math.round((successful.length / history.length) * 100),
    mostCommonErrorType,
    averageQualityScore: Math.round(totalQuality / history.length),
  };
}

export function getAllStates(): Map<string, RuntimeState> {
  return new Map(store);
}

// ── V6.2: 9-Dimension Health Score ───────────────────────────────────────────

export interface RuntimeHealthV3 {
  overall: number;
  compile: number;
  runtime: number;
  repair: number;
  dependencies: number;
  routes: number;
  imports: number;
  packages: number;
  components: number;
  pages: number;
}

export interface TimelineEvent {
  timestamp: number;
  phase: string;
  label: string;
  status: 'pass' | 'fail' | 'warn' | 'info';
  score?: number;
  detail?: string;
}

export interface RuntimeTimeline {
  chatId: string;
  startedAt: number;
  finishedAt?: number;
  events: TimelineEvent[];
  totalPasses: number;
  peakHealth: number;
  finalHealth: number;
}

const timelineStore = new Map<string, RuntimeTimeline>();

export function initTimeline(chatId: string): RuntimeTimeline {
  const tl: RuntimeTimeline = {
    chatId,
    startedAt: Date.now(),
    events: [],
    totalPasses: 0,
    peakHealth: 0,
    finalHealth: 0,
  };
  timelineStore.set(chatId, tl);
  return tl;
}

export function addTimelineEvent(chatId: string, event: Omit<TimelineEvent, 'timestamp'>): void {
  const tl = timelineStore.get(chatId);
  if (!tl) return;
  tl.events.push({ ...event, timestamp: Date.now() });
  if (event.score !== undefined && event.score > tl.peakHealth) tl.peakHealth = event.score;
}

export function finalizeTimeline(chatId: string, finalHealth: number): RuntimeTimeline | null {
  const tl = timelineStore.get(chatId);
  if (!tl) return null;
  tl.finishedAt = Date.now();
  tl.finalHealth = finalHealth;
  if (finalHealth > tl.peakHealth) tl.peakHealth = finalHealth;
  return tl;
}

export function getTimeline(chatId: string): RuntimeTimeline | null {
  return timelineStore.get(chatId) ?? null;
}

export function computeHealthV3(state: RuntimeState, depGraph?: RuntimeDependencyGraph | null): RuntimeHealthV3 {
  const errs = state.buildErrors ?? [];

  const compile = state.buildPassed
    ? 100
    : errs.length > 0
      ? Math.max(0, 100 - errs.filter(e => e.type === 'error').length * 15)
      : 75;

  const runtime = state.runtimePassed ? 100 : state.buildPassed ? 70 : 40;

  const repaired = state.repairedFiles ?? 0;
  const repair = repaired > 0
    ? Math.min(100, 60 + repaired * 15)
    : state.buildPassed ? 100 : 50;

  const dependencies = state.dependencies && state.dependencies.packages.length > 0
    ? 100
    : state.buildPassed ? 80 : 60;

  const hasRouteErrors = errs.some(e =>
    e.message.toLowerCase().includes('route') || e.message.toLowerCase().includes('router')
  );
  const routes = hasRouteErrors ? 50 : state.buildPassed ? 100 : 75;

  // V6.2: new 4 dimensions from dependency graph
  const imports = depGraph
    ? (depGraph.totalImports > 0 ? Math.round((depGraph.resolvedImports / depGraph.totalImports) * 100) : 100)
    : (state.missingImports && state.missingImports.length > 0 ? 70 : 100);

  const packages = depGraph
    ? (depGraph.totalPackages > 0 ? Math.round((depGraph.resolvedPackages / depGraph.totalPackages) * 100) : 100)
    : (state.dependencies?.packages.length ?? 0) > 0 ? 100 : 80;

  const components = depGraph
    ? (depGraph.totalComponents > 0 ? Math.round((depGraph.resolvedComponents / depGraph.totalComponents) * 100) : 100)
    : 85;

  const pages = depGraph
    ? (depGraph.totalRoutes > 0 ? Math.round((depGraph.resolvedRoutes / depGraph.totalRoutes) * 100) : 100)
    : state.buildPassed ? 100 : 75;

  const overall = Math.round(
    (compile * 0.15) + (runtime * 0.15) + (repair * 0.10) +
    (dependencies * 0.10) + (routes * 0.10) + (imports * 0.10) +
    (packages * 0.10) + (components * 0.10) + (pages * 0.10)
  );

  return { overall, compile, runtime, repair, dependencies, routes, imports, packages, components, pages };
}

export function pruneOldStates(maxAgeMs = 30 * 60 * 1000): void {
  const cutoff = Date.now() - maxAgeMs;
  for (const [chatId, state] of store.entries()) {
    if (state.finishedAt && state.finishedAt < cutoff) {
      store.delete(chatId);
    }
  }
}
