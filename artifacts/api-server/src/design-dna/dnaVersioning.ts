/**
 * V8.1 — Design DNA Versioning
 *
 * Every DNA evolution creates an immutable version snapshot.
 * Supports rollback to any previous version.
 *
 * Phase 6 requirements:
 *   - Version number, timestamp, changes list, reason
 *   - Previous score, new score
 *   - Full snapshot for rollback
 *   - All promotions and demotions reversible
 */

import type { DesignDNARecord, DNAVersion } from "./dnaTypes.js";
import { createLogger } from "../lib/structuredLogger.js";

const log = createLogger("DnaVersioning");

// ── In-memory version history ─────────────────────────────────────────────────

// Map from dnaId → ordered list of versions (oldest first)
const _history = new Map<string, DNAVersion[]>();
const MAX_VERSIONS_PER_DNA = 50;

// ── Version ID generator ──────────────────────────────────────────────────────

function makeVersionId(dnaId: string, version: number): string {
  return `${dnaId}::v${version}::${Date.now().toString(36)}`;
}

// ── Create a version snapshot ─────────────────────────────────────────────────

export function createVersion(
  record: DesignDNARecord,
  changes: string[],
  reason: string,
  previousScore: number,
): DNAVersion {
  const versionRecord: DNAVersion = {
    versionId:     makeVersionId(record.id, record.version),
    dnaId:         record.id,
    version:       record.version,
    timestamp:     new Date().toISOString(),
    changes,
    reason,
    previousScore,
    newScore:      record.rankingScore,
    snapshot:      Object.freeze({ ...record }),
  };

  if (!_history.has(record.id)) _history.set(record.id, []);
  const versions = _history.get(record.id)!;

  versions.push(versionRecord);

  // Cap history length per DNA
  if (versions.length > MAX_VERSIONS_PER_DNA) {
    versions.splice(0, versions.length - MAX_VERSIONS_PER_DNA);
  }

  log.info("DNA_VERSION_CREATED", {
    dnaId: record.id,
    version: record.version,
    reason,
    prevScore: previousScore,
    newScore: record.rankingScore,
  });

  return versionRecord;
}

// ── Query history ─────────────────────────────────────────────────────────────

export function getVersionHistory(dnaId: string): DNAVersion[] {
  return [...(_history.get(dnaId) ?? [])];
}

export function getVersion(dnaId: string, version: number): DNAVersion | undefined {
  return _history.get(dnaId)?.find(v => v.version === version);
}

export function getLatestVersion(dnaId: string): DNAVersion | undefined {
  const versions = _history.get(dnaId);
  if (!versions || versions.length === 0) return undefined;
  return versions[versions.length - 1];
}

export function getVersionCount(dnaId: string): number {
  return _history.get(dnaId)?.length ?? 0;
}

// ── Rollback ──────────────────────────────────────────────────────────────────

/**
 * Returns the snapshot from the given version so the caller can
 * restore it to the registry. Does NOT mutate any store — rollback
 * is always a new registry.updateDna() call at the caller's discretion.
 */
export function getRollbackSnapshot(
  dnaId: string,
  targetVersion: number,
): DesignDNARecord | null {
  const v = getVersion(dnaId, targetVersion);
  if (!v) {
    log.warn("DNA_ROLLBACK_NOT_FOUND", { dnaId, targetVersion });
    return null;
  }
  log.info("DNA_ROLLBACK_RETRIEVED", { dnaId, targetVersion });
  return { ...v.snapshot };
}

// ── Aggregate stats ───────────────────────────────────────────────────────────

export function getVersioningMetrics() {
  let totalVersions = 0;
  let maxVersions   = 0;
  let trackedDnas   = 0;

  for (const versions of _history.values()) {
    if (versions.length > 0) {
      trackedDnas++;
      totalVersions += versions.length;
      if (versions.length > maxVersions) maxVersions = versions.length;
    }
  }

  return {
    trackedDnas,
    totalVersions,
    maxVersionsPerDna: maxVersions,
    avgVersionsPerDna: trackedDnas > 0
      ? Math.round((totalVersions / trackedDnas) * 100) / 100
      : 0,
  };
}

// ── Serialise / deserialise (for persistence) ─────────────────────────────────

export function exportVersionHistory(): Array<{ dnaId: string; versions: DNAVersion[] }> {
  return [..._history.entries()].map(([dnaId, versions]) => ({ dnaId, versions: [...versions] }));
}

export function importVersionHistory(data: Array<{ dnaId: string; versions: DNAVersion[] }>): void {
  for (const { dnaId, versions } of data) {
    _history.set(dnaId, versions);
  }
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function resetVersionHistory(): void {
  _history.clear();
}
