import { createLogger } from '../lib/structuredLogger.js';

const log = createLogger('WorkspaceRegistry');

export interface WorkspaceEntry {
  workspaceId: string;
  buildId: string;
  userId: string;
  path: string;
  createdAt: number;
  lastAccessedAt: number;
  status: 'creating' | 'active' | 'cleaning' | 'deleted';
  sizeBytes?: number;
}

const _registry = new Map<string, WorkspaceEntry>();

export function registerWorkspace(entry: Omit<WorkspaceEntry, 'lastAccessedAt' | 'createdAt'>): WorkspaceEntry {
  const now = Date.now();
  const full: WorkspaceEntry = { ...entry, createdAt: now, lastAccessedAt: now };
  _registry.set(entry.workspaceId, full);
  log.info('WORKSPACE_REGISTERED', { workspaceId: entry.workspaceId, userId: entry.userId, path: entry.path });
  return full;
}

export function touchWorkspace(workspaceId: string): boolean {
  const entry = _registry.get(workspaceId);
  if (!entry) return false;
  entry.lastAccessedAt = Date.now();
  return true;
}

export function setWorkspaceStatus(workspaceId: string, status: WorkspaceEntry['status']): void {
  const entry = _registry.get(workspaceId);
  if (entry) entry.status = status;
}

export function unregisterWorkspace(workspaceId: string): boolean {
  const removed = _registry.delete(workspaceId);
  if (removed) log.info('WORKSPACE_UNREGISTERED', { workspaceId });
  return removed;
}

export function getWorkspace(workspaceId: string): WorkspaceEntry | undefined {
  return _registry.get(workspaceId);
}

export function listWorkspaces(filter?: { userId?: string; status?: WorkspaceEntry['status'] }): WorkspaceEntry[] {
  return Array.from(_registry.values()).filter((e) => {
    if (filter?.userId && e.userId !== filter.userId) return false;
    if (filter?.status && e.status !== filter.status) return false;
    return true;
  });
}

export function getStaleWorkspaces(maxAgeMs: number): WorkspaceEntry[] {
  const cutoff = Date.now() - maxAgeMs;
  return Array.from(_registry.values()).filter(
    (e) => e.lastAccessedAt <= cutoff && e.status !== 'creating'
  );
}

export function getRegistryStats() {
  const all = Array.from(_registry.values());
  return {
    total: all.length,
    byStatus: Object.fromEntries(
      ['creating', 'active', 'cleaning', 'deleted'].map((s) => [
        s, all.filter((e) => e.status === s).length,
      ])
    ),
    oldest: all.length > 0 ? Math.min(...all.map((e) => e.createdAt)) : null,
  };
}

export function clearRegistry(): void {
  _registry.clear();
}
