// ── V10.2 Workspace Metrics — Deterministic ────────────────────────────────────
//
// Telemetry and metrics for the manual development workspace.
// Zero LLM calls. Never throws.

import type { SyncStatus } from './manualWorkspaceTypes.js';

// ── Internal state ────────────────────────────────────────────────────────────

interface WorkspaceMetricsState {
  manualEdits:          number;
  aiEdits:              number;
  mergeConflicts:       number;
  mergeConflictsResolved: number;
  syncOperations:       number;
  terminalCommands:     number;
  gitCommits:           number;
  workspaceSnapshots:   number;
  previewUpdates:       number;
  previewLatenciesMs:   number[];
  editorDiagnostics:    number;
  workspaceHealthScores: number[];
  sessionStartMs:       number;
}

let _state: WorkspaceMetricsState = createEmptyState();

function createEmptyState(): WorkspaceMetricsState {
  return {
    manualEdits:           0,
    aiEdits:               0,
    mergeConflicts:        0,
    mergeConflictsResolved: 0,
    syncOperations:        0,
    terminalCommands:      0,
    gitCommits:            0,
    workspaceSnapshots:    0,
    previewUpdates:        0,
    previewLatenciesMs:    [],
    editorDiagnostics:     0,
    workspaceHealthScores: [],
    sessionStartMs:        Date.now(),
  };
}

const MAX_SAMPLES = 200;

// ── Increment helpers ──────────────────────────────────────────────────────────

export function recordManualEdit(): void {
  _state.manualEdits++;
}

export function recordAiEdit(): void {
  _state.aiEdits++;
}

export function recordMergeConflict(): void {
  _state.mergeConflicts++;
}

export function recordMergeConflictResolved(): void {
  _state.mergeConflictsResolved++;
}

export function recordSyncOperation(): void {
  _state.syncOperations++;
}

export function recordTerminalCommand(): void {
  _state.terminalCommands++;
}

export function recordGitCommit(): void {
  _state.gitCommits++;
}

export function recordWorkspaceSnapshot(): void {
  _state.workspaceSnapshots++;
}

export function recordPreviewUpdate(latencyMs: number): void {
  _state.previewUpdates++;
  _state.previewLatenciesMs = [..._state.previewLatenciesMs, latencyMs].slice(-MAX_SAMPLES);
}

export function recordDiagnostic(): void {
  _state.editorDiagnostics++;
}

export function recordHealthScore(score: number): void {
  _state.workspaceHealthScores = [..._state.workspaceHealthScores, score].slice(-MAX_SAMPLES);
}

// ── Snapshot ───────────────────────────────────────────────────────────────────

export interface ManualDevelopmentMetricsSnapshot {
  manualEdits:           number;
  aiEdits:               number;
  editRatio:             number;
  mergeConflicts:        number;
  mergeConflictsResolved: number;
  conflictResolutionRate: string;
  syncOperations:        number;
  terminalCommands:      number;
  gitCommits:            number;
  workspaceSnapshots:    number;
  previewUpdates:        number;
  avgPreviewLatencyMs:   number;
  editorDiagnostics:     number;
  avgWorkspaceHealth:    number;
  sessionDurationMs:     number;
}

export function getWorkspaceMetricsSnapshot(): ManualDevelopmentMetricsSnapshot {
  const totalEdits = _state.manualEdits + _state.aiEdits;
  const editRatio  = totalEdits > 0
    ? Math.round((_state.manualEdits / totalEdits) * 100) / 100
    : 0;

  const conflictResolutionRate = _state.mergeConflicts > 0
    ? `${Math.round((_state.mergeConflictsResolved / _state.mergeConflicts) * 100)}%`
    : 'n/a';

  const latencies    = _state.previewLatenciesMs;
  const avgLatencyMs = latencies.length > 0
    ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
    : 0;

  const healthScores = _state.workspaceHealthScores;
  const avgHealth    = healthScores.length > 0
    ? Math.round(healthScores.reduce((s, h) => s + h, 0) / healthScores.length * 10) / 10
    : 0;

  return {
    manualEdits:           _state.manualEdits,
    aiEdits:               _state.aiEdits,
    editRatio,
    mergeConflicts:        _state.mergeConflicts,
    mergeConflictsResolved: _state.mergeConflictsResolved,
    conflictResolutionRate,
    syncOperations:        _state.syncOperations,
    terminalCommands:      _state.terminalCommands,
    gitCommits:            _state.gitCommits,
    workspaceSnapshots:    _state.workspaceSnapshots,
    previewUpdates:        _state.previewUpdates,
    avgPreviewLatencyMs:   avgLatencyMs,
    editorDiagnostics:     _state.editorDiagnostics,
    avgWorkspaceHealth:    avgHealth,
    sessionDurationMs:     Date.now() - _state.sessionStartMs,
  };
}

export function resetWorkspaceMetrics(): void {
  _state = createEmptyState();
}
