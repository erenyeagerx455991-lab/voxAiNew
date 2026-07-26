// ── V10.2 Git Planner — Deterministic ────────────────────────────────────────
//
// Plans git operations: commit, diff, branch, checkout, rollback.
// Zero LLM calls. Never throws.

import type {
  GitCommit, GitDiff, GitHunk, GitBranch, GitStatus,
} from './manualWorkspaceTypes.js';

// ── Internal state ────────────────────────────────────────────────────────────

export interface GitState {
  commits:        GitCommit[];
  branches:       GitBranch[];
  currentBranch:  string;
  status:         GitStatus;
  stagedFiles:    Set<string>;
  modifiedFiles:  Set<string>;
  untrackedFiles: Set<string>;
}

export function createGitState(): GitState {
  return {
    commits:        [],
    branches:       [{ name: 'main', isCurrent: true, aheadBy: 0, behindBy: 0 }],
    currentBranch:  'main',
    status:         'clean',
    stagedFiles:    new Set(),
    modifiedFiles:  new Set(),
    untrackedFiles: new Set(),
  };
}

// ── Stage / unstage ───────────────────────────────────────────────────────────

export function stageFile(state: GitState, path: string): GitState {
  const staged  = new Set(state.stagedFiles).add(path);
  const modified = new Set(state.modifiedFiles);
  modified.delete(path);
  return { ...state, stagedFiles: staged, modifiedFiles: modified, status: 'staged' };
}

export function stageAll(state: GitState): GitState {
  const staged = new Set([...state.stagedFiles, ...state.modifiedFiles]);
  return { ...state, stagedFiles: staged, modifiedFiles: new Set(), status: 'staged' };
}

export function unstageFile(state: GitState, path: string): GitState {
  const staged   = new Set(state.stagedFiles);
  staged.delete(path);
  const modified = new Set(state.modifiedFiles).add(path);
  const status: GitStatus = staged.size > 0 ? 'staged' : modified.size > 0 ? 'modified' : 'clean';
  return { ...state, stagedFiles: staged, modifiedFiles: modified, status };
}

// ── Commit ────────────────────────────────────────────────────────────────────

const MAX_COMMITS = 500;

export function planCommit(
  state:   GitState,
  message: string,
  author:  string,
): { ok: boolean; state?: GitState; commit?: GitCommit; error?: string } {
  if (!message.trim()) return { ok: false, error: 'Commit message is required' };
  if (state.stagedFiles.size === 0) return { ok: false, error: 'Nothing staged to commit' };

  const commit: GitCommit = {
    hash:         generateHash(),
    message:      message.trim(),
    author,
    timestamp:    Date.now(),
    filesChanged: [...state.stagedFiles],
  };

  const commits = [commit, ...state.commits].slice(0, MAX_COMMITS);
  const newState: GitState = {
    ...state,
    commits,
    stagedFiles:  new Set(),
    modifiedFiles: new Set(),
    status:       'clean',
  };
  return { ok: true, state: newState, commit };
}

function generateHash(): string {
  return Math.random().toString(36).slice(2, 10) +
         Math.random().toString(36).slice(2, 10);
}

// ── Branches ──────────────────────────────────────────────────────────────────

export function planCreateBranch(
  state: GitState,
  name:  string,
): { ok: boolean; state?: GitState; error?: string } {
  if (!name.trim())                           return { ok: false, error: 'Branch name required' };
  if (state.branches.some(b => b.name === name)) return { ok: false, error: `Branch "${name}" already exists` };
  if (/[\s~^:?*\\]/.test(name))              return { ok: false, error: 'Invalid branch name characters' };

  const branches = [
    ...state.branches,
    { name, isCurrent: false, aheadBy: 0, behindBy: 0 },
  ];
  return { ok: true, state: { ...state, branches } };
}

export function planCheckout(
  state: GitState,
  name:  string,
): { ok: boolean; state?: GitState; error?: string } {
  if (state.status === 'conflict') return { ok: false, error: 'Resolve conflicts before switching branches' };
  const branch = state.branches.find(b => b.name === name);
  if (!branch) return { ok: false, error: `Branch "${name}" not found` };

  const branches = state.branches.map(b => ({ ...b, isCurrent: b.name === name }));
  return { ok: true, state: { ...state, branches, currentBranch: name } };
}

// ── Diff ──────────────────────────────────────────────────────────────────────

export function computeDiff(
  filePath:    string,
  oldContent:  string,
  newContent:  string,
): GitDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let additions = 0;
  let deletions = 0;
  const hunks: GitHunk[] = [];

  // Simple line-by-line diff (LCS not required for deterministic planning)
  const maxLen = Math.max(oldLines.length, newLines.length);
  let hunkStart = -1;
  const hunkLines: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? null;
    const newLine = newLines[i] ?? null;
    if (oldLine !== newLine) {
      if (hunkStart < 0) hunkStart = i;
      if (oldLine !== null) { hunkLines.push(`-${oldLine}`); deletions++; }
      if (newLine !== null) { hunkLines.push(`+${newLine}`); additions++; }
    } else if (hunkStart >= 0) {
      hunks.push({
        oldStart: hunkStart + 1,
        oldCount: deletions,
        newStart: hunkStart + 1,
        newCount: additions,
        lines:    [...hunkLines],
      });
      hunkStart = -1;
      hunkLines.length = 0;
    }
  }
  if (hunkStart >= 0) {
    hunks.push({ oldStart: hunkStart + 1, oldCount: deletions, newStart: hunkStart + 1, newCount: additions, lines: hunkLines });
  }
  return { filePath, additions, deletions, hunks };
}

// ── Rollback ──────────────────────────────────────────────────────────────────

export function planRollback(
  state:    GitState,
  commitHash: string,
): { ok: boolean; commit?: GitCommit; error?: string } {
  const commit = state.commits.find(c => c.hash === commitHash || c.hash.startsWith(commitHash));
  if (!commit) return { ok: false, error: `Commit "${commitHash}" not found` };
  return { ok: true, commit };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function markFileModified(state: GitState, path: string): GitState {
  const modified = new Set(state.modifiedFiles).add(path);
  return { ...state, modifiedFiles: modified, status: 'modified' };
}

export function markFileUntracked(state: GitState, path: string): GitState {
  const untracked = new Set(state.untrackedFiles).add(path);
  return { ...state, untrackedFiles: untracked };
}

export function getGitSummary(state: GitState): {
  branch: string; status: GitStatus;
  staged: number; modified: number; untracked: number; totalCommits: number;
} {
  return {
    branch:       state.currentBranch,
    status:       state.status,
    staged:       state.stagedFiles.size,
    modified:     state.modifiedFiles.size,
    untracked:    state.untrackedFiles.size,
    totalCommits: state.commits.length,
  };
}
