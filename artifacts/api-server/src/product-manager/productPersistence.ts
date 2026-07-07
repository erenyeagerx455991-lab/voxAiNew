// ── V8.4 Product Manager — Persistence ────────────────────────────────────────
// Stores product plan history to disk (last 500 plans) for restart recovery.

import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from '../lib/structuredLogger.js';
import type { ProductLearningRecord } from './productTypes.js';

const log = createLogger('ProductPersistence');

const PRODUCT_SNAPSHOT_DIR  = '/tmp/voxai-product-manager';
const PRODUCT_SNAPSHOT_FILE = path.join(PRODUCT_SNAPSHOT_DIR, 'product-history.json');
const MAX_PERSISTED          = 500;

interface ProductSnapshot {
  version: string;
  savedAt: string;
  records: ProductLearningRecord[];
}

export async function saveProductSnapshot(records: ProductLearningRecord[]): Promise<void> {
  try {
    await fs.promises.mkdir(PRODUCT_SNAPSHOT_DIR, { recursive: true });
    const snapshot: ProductSnapshot = {
      version: 'v8.4',
      savedAt: new Date().toISOString(),
      records: records.slice(-MAX_PERSISTED),
    };
    await fs.promises.writeFile(PRODUCT_SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2), 'utf-8');
    log.info('PRODUCT_SNAPSHOT_SAVED', { count: snapshot.records.length });
  } catch (err) {
    log.warn('PRODUCT_SNAPSHOT_SAVE_FAILED', { error: String(err) });
  }
}

export async function loadProductSnapshot(): Promise<ProductLearningRecord[]> {
  try {
    const raw      = await fs.promises.readFile(PRODUCT_SNAPSHOT_FILE, 'utf-8');
    const snapshot = JSON.parse(raw) as ProductSnapshot;
    if (!Array.isArray(snapshot.records)) return [];
    log.info('PRODUCT_SNAPSHOT_LOADED', { count: snapshot.records.length, version: snapshot.version });
    return snapshot.records.slice(-MAX_PERSISTED);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') log.warn('PRODUCT_SNAPSHOT_LOAD_FAILED', { error: String(err) });
    return [];
  }
}

export async function initProductPersistence(): Promise<ProductLearningRecord[]> {
  log.info('PRODUCT_PERSISTENCE_INIT', { file: PRODUCT_SNAPSHOT_FILE });
  return loadProductSnapshot();
}
