// ── V10.2 Manual Merge Planner — Deterministic ────────────────────────────────
//
// Plans merge operations between AI and manual edits, coordinating conflict
// detection, auto-resolution, and merge strategy selection.
// Zero LLM calls. Never throws.

import type { MergeConflict, MergeResult, MergeStrategy, WorkspaceEdit } from './manualWorkspaceTypes.js';
import { detectConflicts, autoMergeNonConflicting, resolveConflict, applyResolutions } from './conflictResolver.js';

// ── Merge planning ─────────────────────────────────────────────────────────────

export interface MergePlan {
  filePath:         string;
  strategy:         MergeStrategy;
  needsManualReview: boolean;
  conflictCount:    number;
  autoResolvable:   number;
  estimatedMs:      number;
}

export function planMerge(
  filePath:    string,
  baseContent: string,
  aiContent:   string,
  userContent: string,
): MergePlan {
  const conflicts = detectConflicts(filePath, baseContent, aiContent, userContent);

  const autoResolvable = conflicts.filter(
    c => c.userContent === c.baseContent || c.aiContent === c.baseContent,
  ).length;
  const realConflicts = conflicts.length - autoResolvable;

  return {
    filePath,
    strategy:          realConflicts > 0 ? 'manual-edit' : 'merge-both',
    needsManualReview: realConflicts > 0,
    conflictCount:     conflicts.length,
    autoResolvable,
    estimatedMs:       autoResolvable * 10 + realConflicts * 100,
  };
}

// ── Batch merge planning ───────────────────────────────────────────────────────

export interface BatchMergePlan {
  files:                MergePlan[];
  totalConflicts:       number;
  totalAutoResolvable:  number;
  requiresReview:       string[]; // file paths
  canAutoMerge:         string[]; // file paths
  estimatedTotalMs:     number;
}

export function planBatchMerge(
  changes: Array<{
    filePath:    string;
    baseContent: string;
    aiContent:   string;
    userContent: string;
  }>,
): BatchMergePlan {
  const files = changes.map(c => planMerge(c.filePath, c.baseContent, c.aiContent, c.userContent));

  const totalConflicts      = files.reduce((s, f) => s + f.conflictCount, 0);
  const totalAutoResolvable = files.reduce((s, f) => s + f.autoResolvable, 0);
  const requiresReview      = files.filter(f => f.needsManualReview).map(f => f.filePath);
  const canAutoMerge        = files.filter(f => !f.needsManualReview).map(f => f.filePath);
  const estimatedTotalMs    = files.reduce((s, f) => s + f.estimatedMs, 0);

  return {
    files, totalConflicts, totalAutoResolvable, requiresReview, canAutoMerge, estimatedTotalMs,
  };
}

// ── Execute merge ──────────────────────────────────────────────────────────────

export function executeMerge(
  filePath:    string,
  baseContent: string,
  aiContent:   string,
  userContent: string,
  strategy:    MergeStrategy = 'merge-both',
): MergeResult {
  // 1. Try auto-merge first
  const auto = autoMergeNonConflicting(filePath, baseContent, aiContent, userContent);
  if (auto.success) return auto;

  // 2. Apply chosen strategy to remaining conflicts
  const resolvedConflicts = auto.conflicts.map(c => resolveConflict(c, strategy));
  const merged = applyResolutions(auto.merged, resolvedConflicts);

  return {
    filePath,
    merged,
    conflicts: resolvedConflicts.filter(c => !c.resolvedWith),
    strategy,
    success:   strategy !== 'manual-edit',
  };
}

// ── Change detection ───────────────────────────────────────────────────────────

export function detectManualChanges(
  originalContent: string,
  currentContent:  string,
): { hasChanges: boolean; lineChanges: number; charChanges: number } {
  if (originalContent === currentContent) return { hasChanges: false, lineChanges: 0, charChanges: 0 };

  const origLines = originalContent.split('\n');
  const currLines = currentContent.split('\n');
  let lineChanges = 0;
  const maxLen = Math.max(origLines.length, currLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (origLines[i] !== currLines[i]) lineChanges++;
  }

  let charChanges = 0;
  const minLen = Math.min(originalContent.length, currentContent.length);
  for (let i = 0; i < minLen; i++) {
    if (originalContent[i] !== currentContent[i]) charChanges++;
  }
  charChanges += Math.abs(originalContent.length - currentContent.length);

  return { hasChanges: true, lineChanges, charChanges };
}

// ── AI-safe regeneration wrapper ───────────────────────────────────────────────

export function prepareAIRegeneration(
  files: Map<string, { content: string; editSource: 'ai' | 'manual' }>,
): { baselineSnapshot: Map<string, string>; manualFiles: string[] } {
  const baselineSnapshot = new Map<string, string>();
  const manualFiles: string[] = [];

  for (const [path, file] of files) {
    baselineSnapshot.set(path, file.content);
    if (file.editSource === 'manual') manualFiles.push(path);
  }
  return { baselineSnapshot, manualFiles };
}

export function mergeAIRegeneration(
  baselineSnapshot:  Map<string, string>,
  aiGeneratedFiles:  Map<string, string>,
  currentFiles:      Map<string, { content: string; editSource: 'ai' | 'manual' }>,
): { results: MergeResult[]; conflictFiles: string[] } {
  const results: MergeResult[] = [];
  const conflictFiles: string[] = [];

  for (const [filePath, aiContent] of aiGeneratedFiles) {
    const current = currentFiles.get(filePath);
    const base    = baselineSnapshot.get(filePath) ?? '';

    if (!current) {
      // New file from AI — add it
      results.push({ filePath, merged: aiContent, conflicts: [], strategy: 'accept-ai', success: true });
      continue;
    }

    const result = executeMerge(filePath, base, aiContent, current.content, 'merge-both');
    results.push(result);
    if (!result.success || result.conflicts.length > 0) conflictFiles.push(filePath);
  }
  return { results, conflictFiles };
}
