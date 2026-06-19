import { randomUUID } from 'crypto';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { registerWorkspace, setWorkspaceStatus, unregisterWorkspace, getStaleWorkspaces, getRegistryStats, type WorkspaceEntry } from './workspaceRegistry.js';
import { markWorkspaceActive, markWorkspaceDone } from '../security/workspaceCleanup.js';
import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('WorkspaceManager');

export const WORKSPACE_ROOT = process.env['WORKSPACE_ROOT'] ?? '/tmp/nexogen-runs';
const DEFAULT_MAX_AGE_MS = Number(process.env['WORKSPACE_MAX_AGE_MS'] ?? 60 * 60 * 1000);

export interface WorkspaceHandle {
  workspaceId: string;
  path: string;
  userId: string;
  done(): Promise<void>;
  fail(error: string): Promise<void>;
}

export async function allocateWorkspace(opts: {
  userId: string;
  buildId: string;
}): Promise<WorkspaceHandle> {
  const workspaceId = randomUUID();
  const path = join(WORKSPACE_ROOT, workspaceId);

  await mkdir(path, { recursive: true });
  markWorkspaceActive(path);

  registerWorkspace({
    workspaceId,
    buildId: opts.buildId,
    userId: opts.userId,
    path,
    status: 'creating',
  });

  setWorkspaceStatus(workspaceId, 'active');
  log.info('WORKSPACE_ALLOCATED', { workspaceId, path, userId: opts.userId });

  return {
    workspaceId,
    path,
    userId: opts.userId,
    async done() {
      markWorkspaceDone(path);
      setWorkspaceStatus(workspaceId, 'deleted');
      unregisterWorkspace(workspaceId);
      log.info('WORKSPACE_RELEASED', { workspaceId });
    },
    async fail(error: string) {
      markWorkspaceDone(path);
      setWorkspaceStatus(workspaceId, 'cleaning');
      try {
        await rm(path, { recursive: true, force: true });
      } catch (rmErr) {
        log.warn('WORKSPACE_CLEANUP_FAILED', { workspaceId, error: String(rmErr) });
      }
      unregisterWorkspace(workspaceId);
      log.error('WORKSPACE_FAILED', { workspaceId, error });
    },
  };
}

export async function cleanStaleWorkspaces(maxAgeMs = DEFAULT_MAX_AGE_MS): Promise<{
  checked: number; cleaned: number; errors: string[];
}> {
  const stale = getStaleWorkspaces(maxAgeMs);
  let cleaned = 0;
  const errors: string[] = [];

  for (const entry of stale) {
    try {
      setWorkspaceStatus(entry.workspaceId, 'cleaning');
      await rm(entry.path, { recursive: true, force: true });
      unregisterWorkspace(entry.workspaceId);
      cleaned++;
      log.info('STALE_WORKSPACE_CLEANED', { workspaceId: entry.workspaceId, ageMs: Date.now() - entry.lastAccessedAt });
    } catch (err) {
      errors.push(`${entry.workspaceId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { checked: stale.length, cleaned, errors };
}

export function getWorkspaceStats() {
  return getRegistryStats();
}
