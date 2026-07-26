// ── V10.2 Live Sync Planner — Deterministic ───────────────────────────────────
//
// Plans synchronization between AI generation and manual workspace.
// Tracks which files are AI-owned vs user-owned and coordinates updates.
// Zero LLM calls. Never throws.

import type { SyncStatus, EditSource, WorkspaceFile } from './manualWorkspaceTypes.js';

// ── Sync state ────────────────────────────────────────────────────────────────

export interface SyncRecord {
  filePath:      string;
  lastAIContent: string;
  lastUserEdit:  number; // timestamp ms, 0 = never
  lastAIEdit:    number; // timestamp ms, 0 = never
  editSource:    EditSource;
  syncStatus:    SyncStatus;
}

export interface LiveSyncState {
  records:      Map<string, SyncRecord>;
  globalStatus: SyncStatus;
  lastSyncMs:   number;
  syncCount:    number;
}

export function createLiveSyncState(): LiveSyncState {
  return {
    records:      new Map(),
    globalStatus: 'synced',
    lastSyncMs:   Date.now(),
    syncCount:    0,
  };
}

// ── Record management ─────────────────────────────────────────────────────────

export function registerAIFile(
  state:   LiveSyncState,
  file:    WorkspaceFile,
): LiveSyncState {
  const existing = state.records.get(file.path);
  const record: SyncRecord = {
    filePath:      file.path,
    lastAIContent: file.content,
    lastUserEdit:  existing?.lastUserEdit ?? 0,
    lastAIEdit:    Date.now(),
    editSource:    'ai',
    syncStatus:    existing?.lastUserEdit ? 'diverged' : 'synced',
  };
  const records = new Map(state.records).set(file.path, record);
  return { ...state, records, globalStatus: computeGlobalStatus(records) };
}

export function recordUserEdit(
  state:    LiveSyncState,
  filePath: string,
  content:  string,
): LiveSyncState {
  const existing = state.records.get(filePath);
  const record: SyncRecord = {
    filePath,
    lastAIContent: existing?.lastAIContent ?? '',
    lastUserEdit:  Date.now(),
    lastAIEdit:    existing?.lastAIEdit ?? 0,
    editSource:    'manual',
    syncStatus:    existing?.lastAIContent && existing.lastAIContent !== content ? 'diverged' : 'synced',
  };
  const records = new Map(state.records).set(filePath, record);
  return { ...state, records, globalStatus: computeGlobalStatus(records), lastSyncMs: Date.now() };
}

// ── Sync classification ───────────────────────────────────────────────────────

function computeGlobalStatus(records: Map<string, SyncRecord>): SyncStatus {
  const statuses = [...records.values()].map(r => r.syncStatus);
  if (statuses.includes('conflict')) return 'conflict';
  if (statuses.includes('merging'))  return 'merging';
  if (statuses.includes('diverged')) return 'diverged';
  return 'synced';
}

export function classifyFileOwnership(
  state:    LiveSyncState,
  filePath: string,
): { owner: EditSource; hasBothEdits: boolean; syncStatus: SyncStatus } {
  const record = state.records.get(filePath);
  if (!record) return { owner: 'ai', hasBothEdits: false, syncStatus: 'synced' };

  const hasBothEdits = record.lastAIEdit > 0 && record.lastUserEdit > 0;
  const owner: EditSource = record.lastUserEdit > record.lastAIEdit ? 'manual' : 'ai';
  return { owner, hasBothEdits, syncStatus: record.syncStatus };
}

// ── Sync operations ────────────────────────────────────────────────────────────

export function planSyncOperation(
  state: LiveSyncState,
  filePath: string,
  newAIContent: string,
): { needsMerge: boolean; canAutoSync: boolean; reason: string } {
  const record = state.records.get(filePath);

  if (!record) {
    return { needsMerge: false, canAutoSync: true, reason: 'New file — direct sync' };
  }

  if (record.lastUserEdit === 0) {
    return { needsMerge: false, canAutoSync: true, reason: 'No user edits — safe to sync' };
  }

  if (newAIContent === record.lastAIContent) {
    return { needsMerge: false, canAutoSync: true, reason: 'AI content unchanged — skip' };
  }

  return {
    needsMerge:   true,
    canAutoSync:  false,
    reason:       'User has manual edits — merge required',
  };
}

export function markSynced(state: LiveSyncState, filePath: string): LiveSyncState {
  const existing = state.records.get(filePath);
  if (!existing) return state;
  const record = { ...existing, syncStatus: 'synced' as SyncStatus };
  const records = new Map(state.records).set(filePath, record);
  return {
    ...state,
    records,
    globalStatus: computeGlobalStatus(records),
    lastSyncMs:   Date.now(),
    syncCount:    state.syncCount + 1,
  };
}

export function markConflict(state: LiveSyncState, filePath: string): LiveSyncState {
  const existing = state.records.get(filePath);
  if (!existing) return state;
  const record = { ...existing, syncStatus: 'conflict' as SyncStatus };
  const records = new Map(state.records).set(filePath, record);
  return { ...state, records, globalStatus: 'conflict' };
}

// ── Diverged file report ───────────────────────────────────────────────────────

export function getDivergedFiles(state: LiveSyncState): string[] {
  return [...state.records.values()]
    .filter(r => r.syncStatus === 'diverged' || r.syncStatus === 'conflict')
    .map(r => r.filePath);
}

export function getSyncSummary(state: LiveSyncState): {
  total: number; synced: number; diverged: number; conflicted: number; globalStatus: SyncStatus;
} {
  const all       = [...state.records.values()];
  const synced    = all.filter(r => r.syncStatus === 'synced').length;
  const diverged  = all.filter(r => r.syncStatus === 'diverged').length;
  const conflicted = all.filter(r => r.syncStatus === 'conflict').length;
  return { total: all.length, synced, diverged, conflicted, globalStatus: state.globalStatus };
}
