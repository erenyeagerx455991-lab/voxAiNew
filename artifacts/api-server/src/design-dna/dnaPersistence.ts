/**
 * V8.1 — Design DNA Persistence
 *
 * Saves DNA snapshots to disk (/tmp/voxai-dna-snapshot.json) so knowledge
 * survives server restarts. All operations are async and non-blocking.
 *
 * Phase 11 requirements:
 *   - DNA snapshots
 *   - Learning history
 *   - Rank history
 *   - Quality history
 *   - Evolution history
 *   - Never lose historical knowledge
 */

import { createWriteStream, createReadStream } from "node:fs";
import { stat, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { DNAPersistenceSnapshot } from "./dnaTypes.js";
import { exportRegistry, importRegistry } from "./dnaRegistry.js";
import { exportRankings, importRankings } from "./dnaRanking.js";
import {
  exportVersionHistory,
  importVersionHistory,
} from "./dnaVersioning.js";
import { createLogger } from "../lib/structuredLogger.js";

void createWriteStream; // keep import for future streaming
void createReadStream;

const log = createLogger("DnaPersistence");

const SNAPSHOT_DIR  = "/tmp/voxai-dna";
const SNAPSHOT_FILE = join(SNAPSHOT_DIR, "snapshot.json");
const SCHEMA_VERSION = "8.1.0";

let _evolutionCount = 0;
let _lastSaveAt: string | null = null;
let _persistenceEnabled = true;
let _saveScheduled = false;

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initPersistence(): Promise<void> {
  try {
    await mkdir(SNAPSHOT_DIR, { recursive: true });
    await loadSnapshot();
    log.info("DNA_PERSISTENCE_INIT", { file: SNAPSHOT_FILE });
  } catch (err) {
    log.warn("DNA_PERSISTENCE_INIT_FAILED", { error: String(err) });
    _persistenceEnabled = false;
  }
}

// ── Save ──────────────────────────────────────────────────────────────────────

export async function saveSnapshot(): Promise<void> {
  if (!_persistenceEnabled) return;

  try {
    const snapshot: DNAPersistenceSnapshot = {
      version:        SCHEMA_VERSION,
      savedAt:        new Date().toISOString(),
      dnaRecords:     exportRegistry(),
      rankingEntries: exportRankings(),
      evolutionCount: _evolutionCount,
      // V8.1: persist version history for rollback continuity across restarts
      versionHistory: exportVersionHistory(),
    };

    const json = JSON.stringify(snapshot, null, 2);
    await writeFile(SNAPSHOT_FILE, json, "utf-8");
    _lastSaveAt = snapshot.savedAt;

    log.info("DNA_SNAPSHOT_SAVED", {
      dnaCount:     snapshot.dnaRecords.length,
      rankingCount: snapshot.rankingEntries.length,
    });
  } catch (err) {
    log.error("DNA_SNAPSHOT_SAVE_FAILED", { error: String(err) });
  }
}

/** Debounced save — merges rapid consecutive saves into one write */
export function scheduleSave(delayMs = 5000): void {
  if (_saveScheduled || !_persistenceEnabled) return;
  _saveScheduled = true;
  setTimeout(() => {
    _saveScheduled = false;
    saveSnapshot().catch(() => { /* already logged inside saveSnapshot */ });
  }, delayMs);
}

// ── Load ──────────────────────────────────────────────────────────────────────

export async function loadSnapshot(): Promise<boolean> {
  try {
    await stat(SNAPSHOT_FILE);
    const raw  = await readFile(SNAPSHOT_FILE, "utf-8");
    const data = JSON.parse(raw) as Partial<DNAPersistenceSnapshot>;

    if (!data.version || !data.dnaRecords) {
      log.warn("DNA_SNAPSHOT_CORRUPT", { file: SNAPSHOT_FILE });
      return false;
    }

    if (data.dnaRecords.length > 0)     importRegistry(data.dnaRecords);
    if (data.rankingEntries?.length)    importRankings(data.rankingEntries);
    if (data.evolutionCount)            _evolutionCount = data.evolutionCount;
    // V8.1: restore version history for rollback continuity
    if (data.versionHistory?.length)    importVersionHistory(data.versionHistory);

    log.info("DNA_SNAPSHOT_LOADED", {
      dnaCount:        data.dnaRecords.length,
      rankingCount:    data.rankingEntries?.length ?? 0,
      versionDnas:     data.versionHistory?.length ?? 0,
      savedAt:         data.savedAt,
    });
    return true;
  } catch {
    // File does not exist yet — first run
    return false;
  }
}

// ── Evolution counter ─────────────────────────────────────────────────────────

export function incrementEvolutionCount(): void {
  _evolutionCount++;
}

export function getEvolutionCount(): number {
  return _evolutionCount;
}

// ── Telemetry ─────────────────────────────────────────────────────────────────

export function getPersistenceMetrics() {
  return {
    enabled:        _persistenceEnabled,
    snapshotFile:   SNAPSHOT_FILE,
    evolutionCount: _evolutionCount,
    lastSaveAt:     _lastSaveAt,
    saveScheduled:  _saveScheduled,
    schemaVersion:  SCHEMA_VERSION,
  };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function disablePersistence(): void {
  _persistenceEnabled = false;
}

export function enablePersistence(): void {
  _persistenceEnabled = true;
}

export function resetPersistenceMetrics(): void {
  _evolutionCount = 0;
  _lastSaveAt = null;
  _saveScheduled = false;
}
