// ── V8.5 Frontend Architect — Architecture Persistence ───────────────────────

import { promises as fs } from 'fs';
import { join } from 'path';
import type { ArchitectureLearningRecord } from './frontendTypes.js';
import { hydrateArchitectureLearning } from './architectureLearning.js';

const PERSIST_DIR  = '/tmp/voxai-frontend-architect';
const PERSIST_FILE = join(PERSIST_DIR, 'architecture-history.json');
const MAX_RECORDS  = 500;
const VERSION      = 'v8.5';

interface PersistedStore {
  version: string;
  records: ArchitectureLearningRecord[];
  savedAt:  number;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRecords: ArchitectureLearningRecord[] = [];

export async function initArchitecturePersistence(): Promise<void> {
  try {
    await fs.mkdir(PERSIST_DIR, { recursive: true });
  } catch {
    // directory already exists
  }
}

export async function persistArchitectureRecord(record: ArchitectureLearningRecord): Promise<void> {
  pendingRecords.push(record);
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushToDisk, 30_000);
}

async function flushToDisk(): Promise<void> {
  saveTimer = null;
  if (pendingRecords.length === 0) return;
  const toWrite = [...pendingRecords];
  pendingRecords = [];
  try {
    let existing: ArchitectureLearningRecord[] = [];
    try {
      const raw = await fs.readFile(PERSIST_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedStore;
      if (parsed.version === VERSION) existing = parsed.records;
    } catch {
      // no file yet
    }
    const combined = [...existing, ...toWrite].slice(-MAX_RECORDS);
    const store: PersistedStore = { version: VERSION, records: combined, savedAt: Date.now() };
    await fs.writeFile(PERSIST_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // persistence failure is non-fatal
  }
}

export async function hydrateFromDisk(): Promise<void> {
  try {
    const raw = await fs.readFile(PERSIST_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedStore;
    if (parsed.version === VERSION && Array.isArray(parsed.records)) {
      hydrateArchitectureLearning(parsed.records);
    }
  } catch {
    // no persisted data yet — fine
  }
}
