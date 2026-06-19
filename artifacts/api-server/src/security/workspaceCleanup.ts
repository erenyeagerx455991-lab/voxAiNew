// ── V6.4.6: Workspace Cleanup Service (Phase 9) ───────────────────────────────
// Scans /tmp/nexogen-runs and removes orphaned / expired workspaces.
// NEVER deletes active workspaces tracked in the active registry.

import { readdir, stat, rm } from 'fs/promises';
import { join } from 'path';
import { recordCleanupRun } from './securityMetrics.js';

const WORKSPACE_ROOT = '/tmp/nexogen-runs';

// ── Active Workspace Registry ─────────────────────────────────────────────────
// Build orchestrators call markActive()/markDone() to protect live workspaces.

const _activeWorkspaces = new Set<string>();

export function markWorkspaceActive(dir: string): void {
  _activeWorkspaces.add(dir);
}

export function markWorkspaceDone(dir: string): void {
  _activeWorkspaces.delete(dir);
}

export function isWorkspaceActive(dir: string): boolean {
  return _activeWorkspaces.has(dir);
}

// ── Cleanup Logic ─────────────────────────────────────────────────────────────

const MAX_AGE_MS = Number(process.env['WORKSPACE_MAX_AGE_MS'] ?? 60 * 60 * 1000); // 1 hour default

export interface CleanupResult {
  scanned: number;
  deleted: number;
  skipped: number;
  errors: string[];
  durationMs: number;
}

export async function runWorkspaceCleanup(): Promise<CleanupResult> {
  const t0 = Date.now();
  const result: CleanupResult = { scanned: 0, deleted: 0, skipped: 0, errors: [], durationMs: 0 };

  let entries: string[];
  try {
    entries = await readdir(WORKSPACE_ROOT);
  } catch {
    // Directory doesn't exist yet — nothing to clean
    result.durationMs = Date.now() - t0;
    return result;
  }

  const now = Date.now();

  for (const entry of entries) {
    const fullPath = join(WORKSPACE_ROOT, entry);
    result.scanned++;

    // Never delete active workspaces
    if (isWorkspaceActive(fullPath)) {
      result.skipped++;
      continue;
    }

    try {
      const s = await stat(fullPath);
      const ageMs = now - s.mtimeMs;

      if (ageMs > MAX_AGE_MS) {
        await rm(fullPath, { recursive: true, force: true });
        result.deleted++;
        console.log(`[WORKSPACE_CLEANUP] Deleted orphaned workspace: ${entry} (age: ${Math.round(ageMs / 1000)}s)`);
      } else {
        result.skipped++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${entry}: ${msg}`);
    }
  }

  result.durationMs = Date.now() - t0;
  recordCleanupRun(result.deleted);

  console.log(`[WORKSPACE_CLEANUP] Run complete — scanned: ${result.scanned}, deleted: ${result.deleted}, skipped: ${result.skipped} in ${result.durationMs}ms`);
  return result;
}

// ── Scheduled Cleanup ─────────────────────────────────────────────────────────

const CLEANUP_INTERVAL_MS = Number(process.env['WORKSPACE_CLEANUP_INTERVAL_MS'] ?? 15 * 60 * 1000); // 15 min

let _cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startCleanupScheduler(): void {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    runWorkspaceCleanup().catch(err =>
      console.error('[WORKSPACE_CLEANUP] Scheduler error:', err)
    );
  }, CLEANUP_INTERVAL_MS);

  // Run one immediately on startup to clear any crash-orphaned workspaces
  setTimeout(() => {
    runWorkspaceCleanup().catch(err =>
      console.error('[WORKSPACE_CLEANUP] Startup cleanup error:', err)
    );
  }, 5_000);

  console.log(`[WORKSPACE_CLEANUP] Scheduler started — interval: ${CLEANUP_INTERVAL_MS / 1000}s, max_age: ${MAX_AGE_MS / 1000}s`);
}

export function stopCleanupScheduler(): void {
  if (_cleanupTimer) {
    clearInterval(_cleanupTimer);
    _cleanupTimer = null;
  }
}
