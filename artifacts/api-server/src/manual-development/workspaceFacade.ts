// ── V10.2 Workspace Facade — Public API ───────────────────────────────────────
//
// Single public entry point for the Manual Development Intelligence engine.
// All external callers (routes, pipeline steps) use this facade.
// Zero LLM calls. Never throws.

import type {
  WorkspaceState, WorkspaceFile, WorkspaceEdit, WorkspaceBlueprint,
  MergeConflict, MergeStrategy, SnapshotTrigger, WorkspaceMode,
} from './manualWorkspaceTypes.js';
import {
  createWorkspaceState, addFile, updateFileContent, deleteFile, renameFile,
  openFile, closeFile, createSnapshot, restoreSnapshot, addConflicts,
  resolveConflictInState, setDiagnostics, addTerminal, removeTerminal,
  switchMode, getWorkspaceSummary,
} from './manualWorkspace.js';
import { buildProjectStructureSummary } from './projectStructurePlanner.js';
import { learnFromWorkspace, learnFromEdit, buildLearningContextString } from './workspaceLearning.js';
import { validateWorkspace } from './workspaceValidator.js';
import { planBatchMerge, executeMerge, detectManualChanges } from './manualMergePlanner.js';
import { autoMergeNonConflicting } from './conflictResolver.js';
import { initPersistence, saveSnapshot, getLearningForProject, getPersistenceStats } from './workspacePersistence.js';
import {
  getWorkspaceMetricsSnapshot, recordManualEdit, recordAiEdit, recordMergeConflict,
  recordMergeConflictResolved, recordSyncOperation, recordGitCommit,
  recordWorkspaceSnapshot, recordPreviewUpdate, recordDiagnostic, recordHealthScore,
} from './workspaceMetrics.js';
import { createTerminalSession } from './terminalPlanner.js';
import { createGitState, getGitSummary } from './gitPlanner.js';

// ── Workspace registry (in-memory, per project) ────────────────────────────────

const workspaces = new Map<string, WorkspaceState>();

export function getOrCreateWorkspace(projectId: string): WorkspaceState {
  if (!workspaces.has(projectId)) {
    initPersistence();
    workspaces.set(projectId, createWorkspaceState(projectId));
  }
  return workspaces.get(projectId)!;
}

function setWorkspace(state: WorkspaceState): void {
  workspaces.set(state.projectId, state);
}

// ── File operations ────────────────────────────────────────────────────────────

export function wsAddFile(projectId: string, file: WorkspaceFile): void {
  setWorkspace(addFile(getOrCreateWorkspace(projectId), file));
}

export function wsUpdateFile(
  projectId: string,
  filePath:  string,
  content:   string,
  source:    'ai' | 'manual',
): void {
  const state = getOrCreateWorkspace(projectId);
  setWorkspace(updateFileContent(state, filePath, content, source));
  if (source === 'manual') recordManualEdit();
  else recordAiEdit();
}

export function wsDeleteFile(projectId: string, filePath: string): void {
  setWorkspace(deleteFile(getOrCreateWorkspace(projectId), filePath));
}

export function wsRenameFile(projectId: string, fromPath: string, toPath: string): void {
  setWorkspace(renameFile(getOrCreateWorkspace(projectId), fromPath, toPath));
}

export function wsOpenFile(projectId: string, filePath: string): void {
  setWorkspace(openFile(getOrCreateWorkspace(projectId), filePath));
}

export function wsCloseFile(projectId: string, filePath: string): void {
  setWorkspace(closeFile(getOrCreateWorkspace(projectId), filePath));
}

// ── Mode ────────────────────────────────────────────────────────────────────────

export function wsSwitchMode(projectId: string, mode: WorkspaceMode): void {
  setWorkspace(switchMode(getOrCreateWorkspace(projectId), mode));
}

// ── Snapshots ──────────────────────────────────────────────────────────────────

export function wsCreateSnapshot(
  projectId: string,
  name:      string,
  trigger:   SnapshotTrigger = 'manual',
): string {
  const state = getOrCreateWorkspace(projectId);
  const { state: newState, snapshot } = createSnapshot(state, name, trigger);
  setWorkspace(newState);
  saveSnapshot(snapshot);
  recordWorkspaceSnapshot();
  return snapshot.id;
}

export function wsRestoreSnapshot(projectId: string, snapshotId: string): boolean {
  const state    = getOrCreateWorkspace(projectId);
  const snapshot = state.snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return false;
  setWorkspace(restoreSnapshot(state, snapshot));
  return true;
}

// ── Merge ──────────────────────────────────────────────────────────────────────

export function wsMergeAIChanges(
  projectId: string,
  aiFiles:   Array<{ filePath: string; content: string }>,
): { conflictFiles: string[]; mergedCount: number } {
  const state = getOrCreateWorkspace(projectId);
  let newState = state;
  const conflictFiles: string[] = [];
  let mergedCount = 0;

  for (const { filePath, content: aiContent } of aiFiles) {
    const existing = state.files.get(filePath);
    if (!existing) {
      // New file from AI
      wsAddFile(projectId, {
        path: filePath, content: aiContent, language: 'typescript',
        encoding: 'utf-8', size: Buffer.byteLength(aiContent, 'utf-8'),
        editSource: 'ai', lastModified: Date.now(), isNew: true, isDeleted: false,
      });
      mergedCount++;
      continue;
    }

    const result = autoMergeNonConflicting(filePath, existing.content, aiContent, existing.content);
    if (result.success) {
      newState = updateFileContent(newState, filePath, result.merged, 'ai');
      recordSyncOperation();
      mergedCount++;
    } else {
      newState = addConflicts(newState, result.conflicts);
      conflictFiles.push(filePath);
      result.conflicts.forEach(() => recordMergeConflict());
    }
  }

  setWorkspace(newState);
  return { conflictFiles, mergedCount };
}

export function wsResolveConflict(
  projectId:  string,
  conflictId: string,
  strategy:   MergeStrategy,
  manualContent?: string,
): boolean {
  const state    = getOrCreateWorkspace(projectId);
  const conflict = state.conflicts.find(c => c.id === conflictId);
  if (!conflict) return false;

  let resolved: MergeConflict;
  switch (strategy) {
    case 'accept-ai':    resolved = { ...conflict, resolvedWith: strategy, resolvedContent: conflict.aiContent };   break;
    case 'accept-mine':  resolved = { ...conflict, resolvedWith: strategy, resolvedContent: conflict.userContent }; break;
    case 'merge-both':   resolved = { ...conflict, resolvedWith: strategy, resolvedContent: `${conflict.userContent}\n${conflict.aiContent}` }; break;
    case 'manual-edit':  resolved = { ...conflict, resolvedWith: strategy, resolvedContent: manualContent ?? conflict.userContent }; break;
  }
  setWorkspace(resolveConflictInState(state, conflictId, resolved));
  recordMergeConflictResolved();
  return true;
}

// ── Terminals ──────────────────────────────────────────────────────────────────

export function wsCreateTerminal(projectId: string, cwd: string): string {
  const session  = createTerminalSession(cwd);
  const state    = getOrCreateWorkspace(projectId);
  setWorkspace(addTerminal(state, session));
  return session.id;
}

export function wsCloseTerminal(projectId: string, sessionId: string): void {
  setWorkspace(removeTerminal(getOrCreateWorkspace(projectId), sessionId));
}

// ── Validation ─────────────────────────────────────────────────────────────────

export function wsValidate(projectId: string, externalDeps?: Set<string>): ReturnType<typeof validateWorkspace> {
  const state  = getOrCreateWorkspace(projectId);
  const result = validateWorkspace(state.files, externalDeps ?? new Set());
  setWorkspace(setDiagnostics(state, result.diagnostics));
  result.diagnostics.forEach(() => recordDiagnostic());
  recordHealthScore(result.healthScore);
  return result;
}

// ── Blueprint ──────────────────────────────────────────────────────────────────

export function buildWorkspaceBlueprint(projectId: string): WorkspaceBlueprint {
  const state        = getOrCreateWorkspace(projectId);
  const summary      = getWorkspaceSummary(state);
  const validation   = validateWorkspace(state.files, new Set());
  const learning     = getLearningForProject(projectId);
  const contextParts: string[] = [
    `Workspace: ${summary.fileCount} files, mode=${summary.mode}`,
    `Sync: ${summary.syncStatus}`,
    `Health: ${validation.healthScore}/10`,
  ];
  if (learning) contextParts.push(buildLearningContextString(learning));

  return {
    projectId,
    mode:            summary.mode,
    fileCount:       summary.fileCount,
    editCount:       summary.editCount,
    conflictCount:   summary.conflictCount,
    snapshotCount:   summary.snapshotCount,
    healthScore:     validation.healthScore,
    syncStatus:      state.syncStatus,
    mergeStrategy:   'merge-both',
    learningApplied: !!learning,
    validationScore: validation.healthScore,
    contextString:   contextParts.join('\n'),
  };
}

// ── Metrics ────────────────────────────────────────────────────────────────────

export function getWorkspaceMetrics() {
  return getWorkspaceMetricsSnapshot();
}

export function getWorkspacePersistenceStats() {
  return getPersistenceStats();
}
