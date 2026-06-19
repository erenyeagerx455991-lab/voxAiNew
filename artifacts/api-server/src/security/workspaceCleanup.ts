import { readdir, stat, rm } from 'fs/promises';
import { join } from 'path';
import { recordCleanupRun } from './securityMetrics.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger("WorkspaceCleanup");
const WORKSPACE_ROOT = '/tmp/nexogen-runs';
const _activeWorkspaces = new Set<string>();

export function markWorkspaceActive(dir: string): void { _activeWorkspaces.add(dir); }
export function markWorkspaceDone(dir: string): void   { _activeWorkspaces.delete(dir); }
export function isWorkspaceActive(dir: string): boolean { return _activeWorkspaces.has(dir); }

const MAX_AGE_MS = Number(process.env['WORKSPACE_MAX_AGE_MS'] ?? 60 * 60 * 1000);

export interface CleanupResult {
  scanned: number; deleted: number; skipped: number; errors: string[]; durationMs: number;
}

export async function runWorkspaceCleanup(): Promise<CleanupResult> {
  const t0 = Date.now();
  const result: CleanupResult = { scanned: 0, deleted: 0, skipped: 0, errors: [], durationMs: 0 };
  let entries: string[];
  try {
    entries = await readdir(WORKSPACE_ROOT);
  } catch {
    result.durationMs = Date.now() - t0;
    return result;
  }
  const now = Date.now();
  for (const entry of entries) {
    const fullPath = join(WORKSPACE_ROOT, entry);
    result.scanned++;
    if (isWorkspaceActive(fullPath)) { result.skipped++; continue; }
    try {
      const s = await stat(fullPath);
      const ageMs = now - s.mtimeMs;
      if (ageMs > MAX_AGE_MS) {
        await rm(fullPath, { recursive: true, force: true });
        result.deleted++;
        log.info("WORKSPACE_DELETED", { entry, ageSeconds: Math.round(ageMs / 1000) });
      } else {
        result.skipped++;
      }
    } catch (err) {
      result.errors.push(`${entry}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  result.durationMs = Date.now() - t0;
  recordCleanupRun(result.deleted);
  log.info("CLEANUP_RUN_COMPLETE", { scanned: result.scanned, deleted: result.deleted, skipped: result.skipped, durationMs: result.durationMs });
  return result;
}

const CLEANUP_INTERVAL_MS = Number(process.env['WORKSPACE_CLEANUP_INTERVAL_MS'] ?? 15 * 60 * 1000);
let _cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function startCleanupScheduler(): void {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    runWorkspaceCleanup().catch(err => log.error("SCHEDULER_ERROR", { error: String(err) }));
  }, CLEANUP_INTERVAL_MS);
  setTimeout(() => {
    runWorkspaceCleanup().catch(err => log.error("STARTUP_CLEANUP_ERROR", { error: String(err) }));
  }, 5_000);
  log.info("SCHEDULER_STARTED", { intervalSeconds: CLEANUP_INTERVAL_MS / 1000, maxAgeSeconds: MAX_AGE_MS / 1000 });
}

export function stopCleanupScheduler(): void {
  if (_cleanupTimer) { clearInterval(_cleanupTimer); _cleanupTimer = null; }
}
