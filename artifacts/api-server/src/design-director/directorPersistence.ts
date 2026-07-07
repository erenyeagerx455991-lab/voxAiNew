// ── V8.3 Autonomous AI Design Director — Persistence ──────────────────────────
// Stores director history to disk (last 500 reviews) for restart recovery.
// Uses the same pattern as uxPersistence.ts.

import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../lib/structuredLogger.js';
import type { DirectorLearningRecord } from './directorTypes.js';

const log = createLogger('DirectorPersistence');

const DIRECTOR_SNAPSHOT_DIR  = '/tmp/voxai-director';
const DIRECTOR_SNAPSHOT_FILE = path.join(DIRECTOR_SNAPSHOT_DIR, 'director-history.json');
const MAX_PERSISTED          = 500;

interface DirectorSnapshot {
  version: string;
  savedAt: string;
  records: DirectorLearningRecord[];
}

// ── Save ───────────────────────────────────────────────────────────────────────

export async function saveDirectorSnapshot(records: DirectorLearningRecord[]): Promise<void> {
  try {
    await fs.promises.mkdir(DIRECTOR_SNAPSHOT_DIR, { recursive: true });
    const snapshot: DirectorSnapshot = {
      version: 'v8.3',
      savedAt: new Date().toISOString(),
      records: records.slice(-MAX_PERSISTED),
    };
    await fs.promises.writeFile(DIRECTOR_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
    log.info('DIRECTOR_SNAPSHOT_SAVED', { count: snapshot.records.length, file: DIRECTOR_SNAPSHOT_FILE });
  } catch (err) {
    log.warn('DIRECTOR_SNAPSHOT_SAVE_FAILED', { error: String(err) });
  }
}

// ── Load ───────────────────────────────────────────────────────────────────────

export async function loadDirectorSnapshot(): Promise<DirectorLearningRecord[]> {
  try {
    const raw = await fs.promises.readFile(DIRECTOR_SNAPSHOT_FILE, 'utf-8');
    const snapshot = JSON.parse(raw) as DirectorSnapshot;
    if (!Array.isArray(snapshot.records)) return [];
    log.info('DIRECTOR_SNAPSHOT_LOADED', {
      count:   snapshot.records.length,
      version: snapshot.version,
      savedAt: snapshot.savedAt,
    });
    return snapshot.records.slice(-MAX_PERSISTED);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      log.warn('DIRECTOR_SNAPSHOT_LOAD_FAILED', { error: String(err) });
    }
    return [];
  }
}

// ── Init (called at server start) ─────────────────────────────────────────────

export async function initDirectorPersistence(): Promise<DirectorLearningRecord[]> {
  log.info('DIRECTOR_PERSISTENCE_INIT', { file: DIRECTOR_SNAPSHOT_FILE });
  return loadDirectorSnapshot();
}
