// ── V10.2 Workspace Route — REST + SSE API ────────────────────────────────────
//
// Provides the workspace API for the Manual Development Intelligence engine.
// All routes are additive — zero changes to existing build/edit/repair routes.

import { Router } from 'express';
import { authMiddleware } from '../security/authMiddleware.js';
import {
  getOrCreateWorkspace, wsAddFile, wsUpdateFile, wsDeleteFile, wsRenameFile,
  wsOpenFile, wsCloseFile, wsSwitchMode, wsCreateSnapshot, wsRestoreSnapshot,
  wsMergeAIChanges, wsResolveConflict, wsCreateTerminal, wsCloseTerminal,
  wsValidate, buildWorkspaceBlueprint, getWorkspaceMetrics,
} from '../manual-development/workspaceFacade.js';
import { getWorkspaceSummary } from '../manual-development/manualWorkspace.js';
import { detectLanguage } from '../manual-development/fileSystemPlanner.js';
import {
  recordManualEdit, recordSyncOperation, recordGitCommit,
} from '../manual-development/workspaceMetrics.js';
import type { WorkspaceFile } from '../manual-development/manualWorkspaceTypes.js';

const router: Router = Router();

// ── Workspace state ────────────────────────────────────────────────────────────

router.get('/workspace/:projectId', authMiddleware, (req, res) => {
  try {
    const state   = getOrCreateWorkspace(req.params.projectId);
    const summary = getWorkspaceSummary(state);
    res.json({ ...summary, generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get workspace state' });
  }
});

router.get('/workspace/:projectId/blueprint', authMiddleware, (req, res) => {
  try {
    const blueprint = buildWorkspaceBlueprint(req.params.projectId);
    res.json({ blueprint, generatedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to build workspace blueprint' });
  }
});

// ── File operations ────────────────────────────────────────────────────────────

router.get('/workspace/:projectId/files', authMiddleware, (req, res) => {
  try {
    const state = getOrCreateWorkspace(req.params.projectId);
    const files = [...state.files.values()]
      .filter(f => !f.isDeleted)
      .map(f => ({
        path: f.path, language: f.language, size: f.size,
        editSource: f.editSource, lastModified: f.lastModified,
      }));
    res.json({ files, count: files.length });
  } catch {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.get('/workspace/:projectId/files/*', authMiddleware, (req, res) => {
  try {
    const filePath = (req.params as Record<string, string>)[0] ?? '';
    const state    = getOrCreateWorkspace(req.params.projectId);
    const file     = state.files.get(filePath);
    if (!file || file.isDeleted) return res.status(404).json({ error: 'File not found' });
    res.json({ file });
  } catch {
    res.status(500).json({ error: 'Failed to get file' });
  }
});

router.post('/workspace/:projectId/files', authMiddleware, (req, res) => {
  try {
    const { path, content = '' } = req.body as { path?: string; content?: string };
    if (!path) return res.status(400).json({ error: 'path is required' });
    const file: WorkspaceFile = {
      path,
      content,
      language:     detectLanguage(path),
      encoding:     'utf-8',
      size:         Buffer.byteLength(content, 'utf-8'),
      editSource:   'manual',
      lastModified: Date.now(),
      isNew:        true,
      isDeleted:    false,
    };
    wsAddFile(req.params.projectId, file);
    recordManualEdit();
    res.status(201).json({ path, created: true });
  } catch {
    res.status(500).json({ error: 'Failed to create file' });
  }
});

router.put('/workspace/:projectId/files/*', authMiddleware, (req, res) => {
  try {
    const filePath = (req.params as Record<string, string>)[0] ?? '';
    const { content = '', source = 'manual' } = req.body as { content?: string; source?: 'ai' | 'manual' };
    wsUpdateFile(req.params.projectId, filePath, content, source);
    if (source === 'manual') recordManualEdit();
    res.json({ path: filePath, updated: true });
  } catch {
    res.status(500).json({ error: 'Failed to update file' });
  }
});

router.delete('/workspace/:projectId/files/*', authMiddleware, (req, res) => {
  try {
    const filePath = (req.params as Record<string, string>)[0] ?? '';
    wsDeleteFile(req.params.projectId, filePath);
    res.json({ path: filePath, deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

router.post('/workspace/:projectId/rename', authMiddleware, (req, res) => {
  try {
    const { from, to } = req.body as { from?: string; to?: string };
    if (!from || !to) return res.status(400).json({ error: 'from and to are required' });
    wsRenameFile(req.params.projectId, from, to);
    res.json({ from, to, renamed: true });
  } catch {
    res.status(500).json({ error: 'Failed to rename file' });
  }
});

// ── Editor tabs ────────────────────────────────────────────────────────────────

router.post('/workspace/:projectId/open', authMiddleware, (req, res) => {
  try {
    const { filePath } = req.body as { filePath?: string };
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    wsOpenFile(req.params.projectId, filePath);
    res.json({ filePath, opened: true });
  } catch {
    res.status(500).json({ error: 'Failed to open file' });
  }
});

router.post('/workspace/:projectId/close', authMiddleware, (req, res) => {
  try {
    const { filePath } = req.body as { filePath?: string };
    if (!filePath) return res.status(400).json({ error: 'filePath is required' });
    wsCloseFile(req.params.projectId, filePath);
    res.json({ filePath, closed: true });
  } catch {
    res.status(500).json({ error: 'Failed to close file' });
  }
});

// ── Mode ────────────────────────────────────────────────────────────────────────

router.post('/workspace/:projectId/mode', authMiddleware, (req, res) => {
  try {
    const { mode } = req.body as { mode?: 'vibe' | 'manual' | 'hybrid' };
    if (!mode || !['vibe', 'manual', 'hybrid'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be vibe|manual|hybrid' });
    }
    wsSwitchMode(req.params.projectId, mode);
    res.json({ mode, switched: true });
  } catch {
    res.status(500).json({ error: 'Failed to switch mode' });
  }
});

// ── Snapshots ──────────────────────────────────────────────────────────────────

router.get('/workspace/:projectId/snapshots', authMiddleware, (req, res) => {
  try {
    const state = getOrCreateWorkspace(req.params.projectId);
    const snapshots = state.snapshots.map(s => ({
      id: s.id, name: s.name, trigger: s.trigger,
      fileCount: s.files.length, timestamp: s.timestamp,
    }));
    res.json({ snapshots, count: snapshots.length });
  } catch {
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

router.post('/workspace/:projectId/snapshots', authMiddleware, (req, res) => {
  try {
    const { name = 'Snapshot', trigger = 'manual' } = req.body as { name?: string; trigger?: string };
    const id = wsCreateSnapshot(req.params.projectId, name, trigger as 'manual');
    res.status(201).json({ id, created: true });
  } catch {
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

router.post('/workspace/:projectId/snapshots/:id/restore', authMiddleware, (req, res) => {
  try {
    const ok = wsRestoreSnapshot(req.params.projectId, req.params.id);
    if (!ok) return res.status(404).json({ error: 'Snapshot not found' });
    res.json({ restored: true });
  } catch {
    res.status(500).json({ error: 'Failed to restore snapshot' });
  }
});

// ── Merge ──────────────────────────────────────────────────────────────────────

router.post('/workspace/:projectId/merge', authMiddleware, (req, res) => {
  try {
    const { files = [] } = req.body as { files?: Array<{ filePath: string; content: string }> };
    const result = wsMergeAIChanges(req.params.projectId, files);
    recordSyncOperation();
    res.json({ ...result, generatedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to merge AI changes' });
  }
});

router.post('/workspace/:projectId/conflicts/:id/resolve', authMiddleware, (req, res) => {
  try {
    const { strategy, manualContent } = req.body as { strategy?: string; manualContent?: string };
    if (!strategy) return res.status(400).json({ error: 'strategy is required' });
    const ok = wsResolveConflict(
      req.params.projectId, req.params.id,
      strategy as 'accept-ai', manualContent,
    );
    if (!ok) return res.status(404).json({ error: 'Conflict not found' });
    res.json({ resolved: true });
  } catch {
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// ── Terminals ──────────────────────────────────────────────────────────────────

router.post('/workspace/:projectId/terminals', authMiddleware, (req, res) => {
  try {
    const { cwd = '/tmp' } = req.body as { cwd?: string };
    const sessionId = wsCreateTerminal(req.params.projectId, cwd);
    res.status(201).json({ sessionId, created: true });
  } catch {
    res.status(500).json({ error: 'Failed to create terminal' });
  }
});

router.delete('/workspace/:projectId/terminals/:sessionId', authMiddleware, (req, res) => {
  try {
    wsCloseTerminal(req.params.projectId, req.params.sessionId);
    res.json({ closed: true });
  } catch {
    res.status(500).json({ error: 'Failed to close terminal' });
  }
});

// ── Validation ─────────────────────────────────────────────────────────────────

router.get('/workspace/:projectId/validate', authMiddleware, (req, res) => {
  try {
    const result = wsValidate(req.params.projectId);
    res.json({ ...result, generatedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to validate workspace' });
  }
});

// ── Metrics ────────────────────────────────────────────────────────────────────

router.get('/workspace/metrics', authMiddleware, (_req, res) => {
  try {
    res.json({ ...getWorkspaceMetrics(), generatedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to get workspace metrics' });
  }
});

// ── SSE event stream ───────────────────────────────────────────────────────────

router.get('/workspace/:projectId/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'workspace_connected', projectId: req.params.projectId })}\n\n`);

  // Keep alive
  const interval = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(interval); }
  }, 30_000);

  req.on('close', () => clearInterval(interval));
});

export default router;
