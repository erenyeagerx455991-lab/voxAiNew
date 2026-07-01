/**
 * V8.2 — UX Persistence (Phase 10)
 *
 * Stores the last 500 UX build records to /tmp/voxai-ux/history.json
 * for restart recovery. Non-blocking, best-effort.
 */

import { writeFile, readFile, mkdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { UXBuildRecord, UXPredictionResult } from "./uxTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("UxPersistence");

const STORAGE_DIR  = "/tmp/voxai-ux";
const HISTORY_FILE = join(STORAGE_DIR, "history.json");
const MAX_RECORDS  = 500;

let _records: UXBuildRecord[] = [];
let _persistenceEnabled = true;
let _saveScheduled = false;
let _lastSaveAt: string | null = null;
let _totalSaved = 0;

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initUXPersistence(): Promise<void> {
  try {
    await mkdir(STORAGE_DIR, { recursive: true });
    await loadHistory();
    log.info("UX_PERSISTENCE_INIT", { file: HISTORY_FILE });
  } catch (err) {
    log.warn("UX_PERSISTENCE_INIT_FAILED", { error: String(err) });
    _persistenceEnabled = false;
  }
}

// ── Record a new build ────────────────────────────────────────────────────────

export function addUXRecord(buildId: string, result: UXPredictionResult): void {
  const record: UXBuildRecord = {
    buildId,
    timestamp:        result.analyzedAt,
    overallUXScore:   result.overallUXScore,
    conversionLevel:  result.conversionPrediction.level,
    dimensions:       result.dimensions,
    confidence:       result.confidence,
    issueCount:       result.issues.length,
  };

  _records.push(record);
  // Cap at MAX_RECORDS (remove oldest)
  if (_records.length > MAX_RECORDS) {
    _records = _records.slice(_records.length - MAX_RECORDS);
  }

  scheduleSave();
}

// ── Query ─────────────────────────────────────────────────────────────────────

export function getRecentRecords(limit = 50): UXBuildRecord[] {
  return [..._records].slice(-limit).reverse();
}

export function getRecordCount(): number {
  return _records.length;
}

export function getRecord(buildId: string): UXBuildRecord | undefined {
  return _records.find(r => r.buildId === buildId);
}

// ── Persistence ───────────────────────────────────────────────────────────────

async function saveHistory(): Promise<void> {
  if (!_persistenceEnabled) return;
  try {
    const json = JSON.stringify({ records: _records, savedAt: new Date().toISOString() }, null, 2);
    await writeFile(HISTORY_FILE, json, "utf-8");
    _lastSaveAt = new Date().toISOString();
    _totalSaved++;
    log.info("UX_HISTORY_SAVED", { count: _records.length });
  } catch (err) {
    log.error("UX_HISTORY_SAVE_FAILED", { error: String(err) });
  }
}

async function loadHistory(): Promise<void> {
  try {
    await stat(HISTORY_FILE);
    const raw  = await readFile(HISTORY_FILE, "utf-8");
    const data = JSON.parse(raw) as { records?: UXBuildRecord[] };
    if (data.records && Array.isArray(data.records)) {
      _records = data.records.slice(-MAX_RECORDS);
      log.info("UX_HISTORY_LOADED", { count: _records.length });
    }
  } catch {
    // File doesn't exist yet — first run
  }
}

function scheduleSave(delayMs = 5000): void {
  if (_saveScheduled || !_persistenceEnabled) return;
  _saveScheduled = true;
  setTimeout(() => {
    _saveScheduled = false;
    saveHistory().catch(() => { /* already logged */ });
  }, delayMs);
}

// ── Telemetry ─────────────────────────────────────────────────────────────────

export function getUXPersistenceMetrics() {
  return {
    enabled:          _persistenceEnabled,
    historyFile:      HISTORY_FILE,
    recordCount:      _records.length,
    maxRecords:       MAX_RECORDS,
    lastSaveAt:       _lastSaveAt,
    totalSaves:       _totalSaved,
    saveScheduled:    _saveScheduled,
  };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function disableUXPersistence(): void  { _persistenceEnabled = false; }
export function enableUXPersistence(): void   { _persistenceEnabled = true; }
export function resetUXPersistence(): void {
  _records = [];
  _saveScheduled = false;
  _lastSaveAt = null;
  _totalSaved = 0;
}
