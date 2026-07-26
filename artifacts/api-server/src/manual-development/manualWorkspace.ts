// ── V10.2 Manual Workspace — Core State Manager ────────────────────────────────
//
// Central orchestrator for the workspace state machine.
// Coordinates files, edits, snapshots, sync, and diagnostics.
// Zero LLM calls. Never throws.

import type {
  WorkspaceState, WorkspaceFile, WorkspaceEdit, WorkspaceSnapshot,
  MergeConflict, DiagnosticItem, TerminalSession, WorkspaceMode, SyncStatus,
  SnapshotTrigger,
} from './manualWorkspaceTypes.js';
import { v4 as uuidv4 } from 'uuid';

// uuid shim — avoids adding a dep
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const MAX_HISTORY   = 500;
const MAX_SNAPSHOTS = 50; // in-memory (disk persistence handles more)

// ── Factory ────────────────────────────────────────────────────────────────────

export function createWorkspaceState(projectId: string): WorkspaceState {
  return {
    projectId,
    mode:        'vibe',
    syncStatus:  'synced',
    activeFile:  undefined,
    openFiles:   [],
    files:       new Map(),
    snapshots:   [],
    editHistory: [],
    conflicts:   [],
    diagnostics: [],
    terminals:   [],
    gitStatus:   'clean',
    lastSyncMs:  Date.now(),
  };
}

// ── Mode ───────────────────────────────────────────────────────────────────────

export function switchMode(state: WorkspaceState, mode: WorkspaceMode): WorkspaceState {
  return { ...state, mode };
}

// ── File management ────────────────────────────────────────────────────────────

export function addFile(state: WorkspaceState, file: WorkspaceFile): WorkspaceState {
  const files = new Map(state.files).set(file.path, file);
  return { ...state, files };
}

export function updateFileContent(
  state:    WorkspaceState,
  filePath: string,
  content:  string,
  source:   'ai' | 'manual',
): WorkspaceState {
  const existing = state.files.get(filePath);
  if (!existing) return state;

  const updated: WorkspaceFile = {
    ...existing,
    content,
    editSource:   source,
    lastModified: Date.now(),
    size:         Buffer.byteLength(content, 'utf-8'),
  };
  const files = new Map(state.files).set(filePath, updated);

  const edit: WorkspaceEdit = {
    id:          generateId(),
    filePath,
    source,
    oldContent:  existing.content,
    newContent:  content,
    timestamp:   Date.now(),
  };
  const editHistory = [...state.editHistory, edit].slice(-MAX_HISTORY);

  return { ...state, files, editHistory };
}

export function deleteFile(state: WorkspaceState, filePath: string): WorkspaceState {
  const existing = state.files.get(filePath);
  if (!existing) return state;
  const files = new Map(state.files).set(filePath, { ...existing, isDeleted: true });
  const openFiles = state.openFiles.filter(p => p !== filePath);
  const activeFile = state.activeFile === filePath ? openFiles[0] : state.activeFile;
  return { ...state, files, openFiles, activeFile };
}

export function renameFile(
  state:    WorkspaceState,
  fromPath: string,
  toPath:   string,
): WorkspaceState {
  const file = state.files.get(fromPath);
  if (!file) return state;

  const files = new Map(state.files);
  files.delete(fromPath);
  files.set(toPath, { ...file, path: toPath, lastModified: Date.now() });

  const openFiles  = state.openFiles.map(p => p === fromPath ? toPath : p);
  const activeFile = state.activeFile === fromPath ? toPath : state.activeFile;
  return { ...state, files, openFiles, activeFile };
}

// ── Open/close files ───────────────────────────────────────────────────────────

export function openFile(state: WorkspaceState, filePath: string): WorkspaceState {
  if (!state.files.has(filePath)) return state;
  const openFiles = state.openFiles.includes(filePath)
    ? state.openFiles
    : [...state.openFiles, filePath];
  return { ...state, openFiles, activeFile: filePath };
}

export function closeFile(state: WorkspaceState, filePath: string): WorkspaceState {
  const openFiles  = state.openFiles.filter(p => p !== filePath);
  const activeFile = state.activeFile === filePath
    ? (openFiles[openFiles.length - 1] ?? undefined)
    : state.activeFile;
  return { ...state, openFiles, activeFile };
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export function createSnapshot(
  state:   WorkspaceState,
  name:    string,
  trigger: SnapshotTrigger,
): { state: WorkspaceState; snapshot: WorkspaceSnapshot } {
  const snapshot: WorkspaceSnapshot = {
    id:        generateId(),
    name,
    trigger,
    files:     [...state.files.values()].filter(f => !f.isDeleted),
    timestamp: Date.now(),
  };
  const snapshots = [snapshot, ...state.snapshots].slice(0, MAX_SNAPSHOTS);
  return { state: { ...state, snapshots }, snapshot };
}

export function restoreSnapshot(
  state:    WorkspaceState,
  snapshot: WorkspaceSnapshot,
): WorkspaceState {
  const files = new Map<string, WorkspaceFile>();
  for (const file of snapshot.files) files.set(file.path, file);
  return { ...state, files, conflicts: [], diagnostics: [] };
}

// ── Conflicts ─────────────────────────────────────────────────────────────────

export function addConflicts(state: WorkspaceState, conflicts: MergeConflict[]): WorkspaceState {
  const all = [...state.conflicts, ...conflicts];
  const syncStatus: SyncStatus = all.some(c => !c.resolvedWith) ? 'conflict' : state.syncStatus;
  return { ...state, conflicts: all, syncStatus };
}

export function resolveConflictInState(
  state:      WorkspaceState,
  conflictId: string,
  resolved:   MergeConflict,
): WorkspaceState {
  const conflicts = state.conflicts.map(c => c.id === conflictId ? resolved : c);
  const hasOpen   = conflicts.some(c => !c.resolvedWith);
  const syncStatus: SyncStatus = hasOpen ? 'conflict' : 'synced';
  return { ...state, conflicts, syncStatus };
}

// ── Diagnostics ────────────────────────────────────────────────────────────────

export function setDiagnostics(
  state:       WorkspaceState,
  diagnostics: DiagnosticItem[],
): WorkspaceState {
  return { ...state, diagnostics };
}

// ── Terminals ─────────────────────────────────────────────────────────────────

export function addTerminal(state: WorkspaceState, session: TerminalSession): WorkspaceState {
  return { ...state, terminals: [...state.terminals, session] };
}

export function removeTerminal(state: WorkspaceState, sessionId: string): WorkspaceState {
  return { ...state, terminals: state.terminals.filter(t => t.id !== sessionId) };
}

// ── Summary ────────────────────────────────────────────────────────────────────

export function getWorkspaceSummary(state: WorkspaceState): {
  projectId:    string;
  mode:         WorkspaceMode;
  syncStatus:   SyncStatus;
  fileCount:    number;
  openFiles:    number;
  editCount:    number;
  snapshotCount: number;
  conflictCount: number;
  terminalCount: number;
} {
  return {
    projectId:     state.projectId,
    mode:          state.mode,
    syncStatus:    state.syncStatus,
    fileCount:     [...state.files.values()].filter(f => !f.isDeleted).length,
    openFiles:     state.openFiles.length,
    editCount:     state.editHistory.length,
    snapshotCount: state.snapshots.length,
    conflictCount: state.conflicts.filter(c => !c.resolvedWith).length,
    terminalCount: state.terminals.length,
  };
}
