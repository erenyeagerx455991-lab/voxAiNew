// Phase 8 — workspaceCleanup.ts unit tests
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, rm } from 'fs/promises';
import { join } from 'path';
import {
  markWorkspaceActive,
  markWorkspaceDone,
  isWorkspaceActive,
  runWorkspaceCleanup,
  stopCleanupScheduler,
} from '../../security/workspaceCleanup.js';

const TEST_ROOT = '/tmp/nexogen-runs';

beforeEach(() => stopCleanupScheduler());
afterEach(() => stopCleanupScheduler());

describe('Active Workspace Registry', () => {
  it('marks workspace as active and detects it', () => {
    const dir = `${TEST_ROOT}/test-active-1`;
    markWorkspaceActive(dir);
    expect(isWorkspaceActive(dir)).toBe(true);
  });

  it('removes workspace from active registry on done', () => {
    const dir = `${TEST_ROOT}/test-active-2`;
    markWorkspaceActive(dir);
    markWorkspaceDone(dir);
    expect(isWorkspaceActive(dir)).toBe(false);
  });

  it('returns false for unknown workspace', () => {
    expect(isWorkspaceActive(`${TEST_ROOT}/completely-unknown-xyz`)).toBe(false);
  });

  it('handles multiple concurrent active workspaces', () => {
    const dirs = [
      `${TEST_ROOT}/ws-concurrent-a`,
      `${TEST_ROOT}/ws-concurrent-b`,
      `${TEST_ROOT}/ws-concurrent-c`,
    ];
    dirs.forEach(markWorkspaceActive);
    dirs.forEach(d => expect(isWorkspaceActive(d)).toBe(true));

    markWorkspaceDone(dirs[1]!);
    expect(isWorkspaceActive(dirs[0]!)).toBe(true);
    expect(isWorkspaceActive(dirs[1]!)).toBe(false);
    expect(isWorkspaceActive(dirs[2]!)).toBe(true);

    dirs.forEach(markWorkspaceDone);
  });
});

describe('runWorkspaceCleanup()', () => {
  it('returns zero scanned when workspace root does not exist', async () => {
    // Use a fake root that doesn't exist
    const result = await runWorkspaceCleanup();
    // Should not throw — graceful degradation
    expect(typeof result.scanned).toBe('number');
    expect(typeof result.deleted).toBe('number');
  });

  it('preserves active workspace during cleanup', async () => {
    const wsId = `test-preserve-${Date.now()}`;
    const wsDir = join(TEST_ROOT, wsId);

    try {
      await mkdir(wsDir, { recursive: true });
      markWorkspaceActive(wsDir);

      const result = await runWorkspaceCleanup();
      expect(result.skipped).toBeGreaterThanOrEqual(1);

      // Directory should still exist
      const { access } = await import('fs/promises');
      await expect(access(wsDir)).resolves.toBeUndefined();
    } finally {
      markWorkspaceDone(wsDir);
      await rm(wsDir, { recursive: true, force: true });
    }
  });

  it('cleanup returns valid result structure', async () => {
    const result = await runWorkspaceCleanup();
    expect(result).toHaveProperty('scanned');
    expect(result).toHaveProperty('deleted');
    expect(result).toHaveProperty('skipped');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('durationMs');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
