// ── V10.2 Conflict Resolver — Deterministic ──────────────────────────────────
//
// Resolves merge conflicts between AI-generated and manually-edited code.
// Zero LLM calls. Never throws.

import type { MergeConflict, MergeResult, MergeStrategy, EditRange } from './manualWorkspaceTypes.js';

let _nextId = 1;
function nextId(): string { return `conflict-${_nextId++}`; }

// ── Diff3 heuristic ───────────────────────────────────────────────────────────

export function detectConflicts(
  filePath:    string,
  baseContent: string,
  aiContent:   string,
  userContent: string,
): MergeConflict[] {
  if (aiContent === userContent) return [];
  if (aiContent === baseContent) return []; // only user changed — no conflict

  const baseLines = baseContent.split('\n');
  const aiLines   = aiContent.split('\n');
  const userLines = userContent.split('\n');

  const conflicts: MergeConflict[] = [];
  const maxLen = Math.max(aiLines.length, userLines.length);
  let conflictStart = -1;
  let conflictAI: string[] = [];
  let conflictUser: string[] = [];

  for (let i = 0; i <= maxLen; i++) {
    const ai   = aiLines[i]   ?? null;
    const user = userLines[i] ?? null;
    const base = baseLines[i] ?? null;

    // Both changed from base differently → conflict
    const aiChanged   = ai   !== base;
    const userChanged = user !== base;
    const inConflict  = aiChanged && userChanged && ai !== user;

    if (inConflict) {
      if (conflictStart < 0) { conflictStart = i; conflictAI = []; conflictUser = []; }
      if (ai !== null)   conflictAI.push(ai);
      if (user !== null) conflictUser.push(user);
    } else {
      if (conflictStart >= 0) {
        const region: EditRange = {
          startLine: conflictStart + 1, startColumn: 1,
          endLine:   i,                 endColumn:   1,
        };
        conflicts.push({
          id:          nextId(),
          filePath,
          aiContent:   conflictAI.join('\n'),
          userContent: conflictUser.join('\n'),
          baseContent: baseLines.slice(conflictStart, i).join('\n'),
          region,
          timestamp:   Date.now(),
        });
        conflictStart = -1;
      }
    }
  }
  return conflicts;
}

// ── Resolution ────────────────────────────────────────────────────────────────

export function resolveConflict(
  conflict:  MergeConflict,
  strategy:  MergeStrategy,
  manualContent?: string,
): MergeConflict {
  let resolvedContent: string;
  switch (strategy) {
    case 'accept-ai':
      resolvedContent = conflict.aiContent;
      break;
    case 'accept-mine':
      resolvedContent = conflict.userContent;
      break;
    case 'merge-both':
      resolvedContent = mergeBothSides(conflict.aiContent, conflict.userContent);
      break;
    case 'manual-edit':
      resolvedContent = manualContent ?? conflict.userContent;
      break;
  }
  return { ...conflict, resolvedWith: strategy, resolvedContent };
}

function mergeBothSides(ai: string, user: string): string {
  const aiLines   = ai.split('\n');
  const userLines = user.split('\n');
  const merged: string[] = [];
  const maxLen = Math.max(aiLines.length, userLines.length);

  for (let i = 0; i < maxLen; i++) {
    const a = aiLines[i];
    const u = userLines[i];
    if (a === u || a === undefined)      { merged.push(u ?? ''); }
    else if (u === undefined)            { merged.push(a); }
    else if (a.trim() === '')            { merged.push(u); }
    else if (u.trim() === '')            { merged.push(a); }
    else                                 { merged.push(u); merged.push(a); } // keep both
  }
  return merged.join('\n');
}

// ── Apply resolved conflicts to file ─────────────────────────────────────────

export function applyResolutions(
  originalContent: string,
  conflicts:       MergeConflict[],
): string {
  const resolved = conflicts.filter(c => c.resolvedContent !== undefined);
  if (resolved.length === 0) return originalContent;

  let lines = originalContent.split('\n');
  // Apply in reverse order to preserve line numbers
  const sorted = [...resolved].sort((a, b) => b.region.startLine - a.region.startLine);

  for (const c of sorted) {
    const newLines = (c.resolvedContent ?? '').split('\n');
    lines.splice(
      c.region.startLine - 1,
      c.region.endLine - c.region.startLine,
      ...newLines,
    );
  }
  return lines.join('\n');
}

// ── Conflict score ────────────────────────────────────────────────────────────

export function scoreConflictResolution(conflicts: MergeConflict[]): {
  total: number; resolved: number; unresolved: number; resolutionRate: number;
} {
  const total      = conflicts.length;
  const resolved   = conflicts.filter(c => c.resolvedWith !== undefined).length;
  const unresolved = total - resolved;
  const resolutionRate = total === 0 ? 100 : Math.round((resolved / total) * 100);
  return { total, resolved, unresolved, resolutionRate };
}

// ── Auto-merge simple conflicts ───────────────────────────────────────────────

export function autoMergeNonConflicting(
  filePath:    string,
  baseContent: string,
  aiContent:   string,
  userContent: string,
): MergeResult {
  const conflicts = detectConflicts(filePath, baseContent, aiContent, userContent);

  if (conflicts.length === 0) {
    // Pick whichever changed from base, or user content on tie
    const merged = userContent !== baseContent ? userContent : aiContent;
    return { filePath, merged, conflicts: [], strategy: 'accept-mine', success: true };
  }

  // Auto-resolve single-line conflicts where AI added and user didn't change base
  const autoResolved = conflicts.map(c => {
    if (c.userContent === c.baseContent) return resolveConflict(c, 'accept-ai');
    if (c.aiContent   === c.baseContent) return resolveConflict(c, 'accept-mine');
    return c; // real conflict — needs manual resolution
  });

  const realConflicts = autoResolved.filter(c => !c.resolvedWith);
  const merged = applyResolutions(userContent, autoResolved.filter(c => !!c.resolvedWith));

  return {
    filePath,
    merged,
    conflicts: realConflicts,
    strategy:  realConflicts.length === 0 ? 'merge-both' : 'manual-edit',
    success:   realConflicts.length === 0,
  };
}
