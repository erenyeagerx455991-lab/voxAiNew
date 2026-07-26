// ── V10.2 Workspace Persistence — Deterministic ────────────────────────────────
//
// Persists workspace state to JSON files with TTL and size caps.
// Cap: 500 records per collection. Never throws.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { WorkspaceSnapshot, WorkspaceLearningRecord } from './manualWorkspaceTypes.js';

const PERSISTENCE_DIR = '/tmp/voxai-workspace';
const MAX_SNAPSHOTS   = 500;
const MAX_LEARNING    = 500;
const MAX_EDITS       = 500;

export interface WorkspacePersistenceState {
  snapshots:  WorkspaceSnapshot[];
  learning:   WorkspaceLearningRecord[];
  editCounts: Record<string, number>;
  savedAt:    number;
}

function ensureDir(): void {
  try { mkdirSync(PERSISTENCE_DIR, { recursive: true }); } catch { /* ignore */ }
}

function persistPath(name: string): string {
  return join(PERSISTENCE_DIR, `${name}.json`);
}

function readJSON<T>(name: string, fallback: T): T {
  try {
    const p = persistPath(name);
    if (!existsSync(p)) return fallback;
    return JSON.parse(readFileSync(p, 'utf-8')) as T;
  } catch { return fallback; }
}

function writeJSON(name: string, data: unknown): void {
  try {
    ensureDir();
    writeFileSync(persistPath(name), JSON.stringify(data, null, 2), 'utf-8');
  } catch { /* persistence must never throw */ }
}

// ── Snapshot persistence ───────────────────────────────────────────────────────

export function loadSnapshots(): WorkspaceSnapshot[] {
  return readJSON<WorkspaceSnapshot[]>('snapshots', []);
}

export function saveSnapshot(snapshot: WorkspaceSnapshot): void {
  const snapshots = [snapshot, ...loadSnapshots()].slice(0, MAX_SNAPSHOTS);
  writeJSON('snapshots', snapshots);
}

export function deleteSnapshot(id: string): void {
  const snapshots = loadSnapshots().filter(s => s.id !== id);
  writeJSON('snapshots', snapshots);
}

export function getSnapshotById(id: string): WorkspaceSnapshot | null {
  return loadSnapshots().find(s => s.id === id) ?? null;
}

// ── Learning persistence ───────────────────────────────────────────────────────

export function loadLearning(): WorkspaceLearningRecord[] {
  return readJSON<WorkspaceLearningRecord[]>('learning', []);
}

export function saveLearningRecord(record: WorkspaceLearningRecord): void {
  const existing = loadLearning().filter(r => r.projectId !== record.projectId);
  const learning = [record, ...existing].slice(0, MAX_LEARNING);
  writeJSON('learning', learning);
}

export function getLearningForProject(projectId: string): WorkspaceLearningRecord | null {
  return loadLearning().find(r => r.projectId === projectId) ?? null;
}

// ── Edit count persistence ─────────────────────────────────────────────────────

export function loadEditCounts(): Record<string, number> {
  return readJSON<Record<string, number>>('editCounts', {});
}

export function incrementEditCount(filePath: string): void {
  const counts = loadEditCounts();
  counts[filePath] = (counts[filePath] ?? 0) + 1;
  // Cap to MAX_EDITS most-edited files
  const entries = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_EDITS);
  writeJSON('editCounts', Object.fromEntries(entries));
}

export function getFrequentlyEditedFiles(limit = 10): Array<{ path: string; count: number }> {
  const counts = loadEditCounts();
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

// ── Full state persistence ─────────────────────────────────────────────────────

export function initPersistence(): void {
  ensureDir();
}

export function getPersistenceStats(): {
  snapshotCount: number; learningCount: number; editedFiles: number;
} {
  return {
    snapshotCount: loadSnapshots().length,
    learningCount: loadLearning().length,
    editedFiles:   Object.keys(loadEditCounts()).length,
  };
}
