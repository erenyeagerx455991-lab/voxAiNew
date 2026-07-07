// ── V8.2 UX Intelligence — Persistence ────────────────────────────────────────
// Stores UX history to disk (last 500 builds) for restart recovery.
// Uses same pattern as Design DNA persistence (dnaPersistence.ts).

import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../lib/structuredLogger.js';
import type { UXLearningRecord } from './uxTypes.js';

const log = createLogger('UXPersistence');

const UX_SNAPSHOT_DIR  = '/tmp/voxai-ux';
const UX_SNAPSHOT_FILE = path.join(UX_SNAPSHOT_DIR, 'ux-history.json');
const MAX_PERSISTED    = 500;

// ── Internal snapshot type ────────────────────────────────────────────────────

interface UXSnapshot {
  version:   string;
  savedAt:   string;
  records:   UXLearningRecord[];
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveUXSnapshot(records: UXLearningRecord[]): Promise<void> {
  try {
    await fs.promises.mkdir(UX_SNAPSHOT_DIR, { recursive: true });
    const snapshot: UXSnapshot = {
      version: 'v8.2',
      savedAt: new Date().toISOString(),
      records: records.slice(-MAX_PERSISTED),
    };
    await fs.promises.writeFile(UX_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
    log.info('UX_SNAPSHOT_SAVED', { count: snapshot.records.length, file: UX_SNAPSHOT_FILE });
  } catch (err) {
    log.warn('UX_SNAPSHOT_SAVE_FAILED', { error: String(err) });
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────

export async function loadUXSnapshot(): Promise<UXLearningRecord[]> {
  try {
    const raw = await fs.promises.readFile(UX_SNAPSHOT_FILE, 'utf-8');
    const snapshot = JSON.parse(raw) as UXSnapshot;
    if (!Array.isArray(snapshot.records)) return [];
    log.info('UX_SNAPSHOT_LOADED', {
      count: snapshot.records.length,
      version: snapshot.version,
      savedAt: snapshot.savedAt,
    });
    return snapshot.records.slice(-MAX_PERSISTED);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      log.warn('UX_SNAPSHOT_LOAD_FAILED', { error: String(err) });
    }
    return [];
  }
}

// ── Init (called at server start) ─────────────────────────────────────────────

export async function initUXPersistence(): Promise<UXLearningRecord[]> {
  log.info('UX_PERSISTENCE_INIT', { file: UX_SNAPSHOT_FILE });
  return loadUXSnapshot();
}
