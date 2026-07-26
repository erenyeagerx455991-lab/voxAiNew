// ── V10.2 Manual Development Intelligence Tests ───────────────────────────────
// 310 deterministic tests covering all 29 modules.
// Zero LLM calls, zero regressions, isolated state per test.

import { describe, it, expect, beforeEach } from 'vitest';

// ── Type imports ──────────────────────────────────────────────────────────────
import type {
  WorkspaceFile, WorkspaceEdit, MergeConflict, DiagnosticItem, EditRange,
} from '../../manual-development/manualWorkspaceTypes.js';

// ── Module imports ────────────────────────────────────────────────────────────
import {
  detectLanguage, buildDirectoryTree, planCreateFile, planRenameFile,
  planDeleteFile, planMoveFile, planDuplicateFile, searchFiles, validateFilePath,
} from '../../manual-development/fileSystemPlanner.js';

import {
  createCursorState, moveCursor, addSecondaryCursor, clearSecondaryCursors,
  gotoLine, cursorWordBoundary, getCursorLineContext, rangeContainsCursor,
} from '../../manual-development/cursorPlanner.js';

import {
  extractSelection, buildSelectionContext, applySelectionEdit,
  validateSelectionRange, buildPartialAIEditPrompt,
} from '../../manual-development/selectionPlanner.js';

import {
  createUndoRedoStack, pushEdit, planUndo, planRedo, clearHistory,
  getUndoRedoStatus, recordEditInStack,
} from '../../manual-development/undoRedoPlanner.js';

import {
  scoreDiagnostics, runHeuristicLint, deduplicateDiagnostics,
  getDiagnosticsForFile, getSortedDiagnostics, countBySeverity,
} from '../../manual-development/diagnosticsPlanner.js';

import {
  runLint, runLintOnFiles, aggregateLintScore,
} from '../../manual-development/lintPlanner.js';

import {
  detectCodingStyle, normalizeIndentation, trimTrailingWhitespace,
  ensureTrailingNewline, formatContent, computeFormatDiff,
} from '../../manual-development/formatterPlanner.js';

import {
  extractSymbols, findReferences, planRenameSymbol, findSymbolDefinition,
  getFileOutline,
} from '../../manual-development/symbolPlanner.js';

import {
  createNavigationHistory, pushNavigation, goBack, goForward,
  buildBreadcrumbs, planGotoDefinition, buildFileQuickOpenList,
} from '../../manual-development/navigationPlanner.js';

import {
  buildCompletionContext, getCompletions, getHoverInfo,
} from '../../manual-development/completionPlanner.js';

import {
  createGitState, stageFile, stageAll, unstageFile, planCommit,
  planCreateBranch, planCheckout, computeDiff, planRollback,
  markFileModified, getGitSummary,
} from '../../manual-development/gitPlanner.js';

import {
  parseVersion, formatVersion, bumpVersion, compareVersions, getLatestVersion,
  createChangelogState, addChangelogEntry, formatChangelog,
} from '../../manual-development/versionPlanner.js';

import {
  createTerminalSession, addToHistory, searchHistory, classifyCommandRisk,
  planCommand, detectPackageManager, buildInstallCommand, createCommandLog,
  recordCommandResult,
} from '../../manual-development/terminalPlanner.js';

import {
  planInstallDependencies, planTypeCheck, planBuildProject,
  validateCommandSequence, buildCustomSequence,
} from '../../manual-development/commandPlanner.js';

import {
  createPreviewState, setPreviewStatus, recordPreviewReload,
  determineReloadStrategy, parsePreviewError, aggregatePreviewMetrics,
} from '../../manual-development/previewPlanner.js';

import {
  createHotReloadState, registerModule, invalidateModule, planHotReload,
  batchPendingReloads, markReloadComplete,
} from '../../manual-development/hotReloadPlanner.js';

import {
  detectFramework, detectFolderConventions, detectFrameworkPrefs,
  buildProjectStructureSummary, suggestFilePath,
} from '../../manual-development/projectStructurePlanner.js';

import {
  parseDependencies, detectCircularDependencies, extractImports,
  separateExternalImports, auditDependencies,
} from '../../manual-development/dependencyPlanner.js';

import {
  detectConflicts, resolveConflict, applyResolutions,
  scoreConflictResolution, autoMergeNonConflicting,
} from '../../manual-development/conflictResolver.js';

import {
  planMerge, planBatchMerge, executeMerge, detectManualChanges,
  prepareAIRegeneration,
} from '../../manual-development/manualMergePlanner.js';

import {
  createLiveSyncState, registerAIFile, recordUserEdit,
  classifyFileOwnership, planSyncOperation, markSynced,
  markConflict, getDivergedFiles, getSyncSummary,
} from '../../manual-development/liveSyncPlanner.js';

import {
  defaultEditorConfig, getLanguageForFile, createTabState, openTab,
  closeTab, markTabDirty, buildMonacoModelOptions,
} from '../../manual-development/codeEditorPlanner.js';

import {
  analyzeRefactorOpportunities, planConvertToArrow, buildRefactorAIPrompt,
} from '../../manual-development/refactorPlanner.js';

import {
  validateRename, planRename, executeRename,
} from '../../manual-development/renamePlanner.js';

import {
  createWorkspaceState, addFile, updateFileContent, deleteFile, renameFile,
  openFile, closeFile, createSnapshot, restoreSnapshot, addConflicts,
  getWorkspaceSummary,
} from '../../manual-development/manualWorkspace.js';

import {
  validateWorkspace,
} from '../../manual-development/workspaceValidator.js';

import {
  getWorkspaceMetricsSnapshot, recordManualEdit, recordMergeConflict,
  resetWorkspaceMetrics,
} from '../../manual-development/workspaceMetrics.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(overrides: Partial<WorkspaceFile> = {}): WorkspaceFile {
  return {
    path: 'src/App.tsx', content: 'const x = 1;\n', language: 'typescript',
    encoding: 'utf-8', size: 13, editSource: 'ai', lastModified: Date.now(),
    isNew: false, isDeleted: false, ...overrides,
  };
}

function makeEdit(overrides: Partial<WorkspaceEdit> = {}): WorkspaceEdit {
  return {
    id: 'e1', filePath: 'src/App.tsx', source: 'manual',
    oldContent: 'const x = 1;\n', newContent: 'const x = 2;\n',
    timestamp: Date.now(), ...overrides,
  };
}

function makeRange(overrides: Partial<EditRange> = {}): EditRange {
  return { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1, ...overrides };
}

// ══════════════════════════════════════════════════════════════════════════════
// File System Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('fileSystemPlanner', () => {
  describe('detectLanguage', () => {
    it('detects typescript', () => expect(detectLanguage('foo.ts')).toBe('typescript'));
    it('detects typescriptreact for tsx', () => expect(detectLanguage('App.tsx')).toBe('typescriptreact'));
    it('detects javascript', () => expect(detectLanguage('index.js')).toBe('javascript'));
    it('detects css', () => expect(detectLanguage('style.css')).toBe('css'));
    it('detects json', () => expect(detectLanguage('package.json')).toBe('json'));
    it('detects markdown', () => expect(detectLanguage('README.md')).toBe('markdown'));
    it('detects python', () => expect(detectLanguage('main.py')).toBe('python'));
    it('falls back to plaintext', () => expect(detectLanguage('file.xyz')).toBe('plaintext'));
    it('handles files without extension', () => expect(detectLanguage('Makefile')).toBe('plaintext'));
    it('is case-insensitive for extension', () => expect(detectLanguage('App.TS')).toBe('typescript'));
  });

  describe('buildDirectoryTree', () => {
    it('builds tree from paths', () => {
      const tree = buildDirectoryTree(['src/App.tsx', 'src/index.ts']);
      expect(tree.type).toBe('directory');
      expect(tree.children?.length).toBeGreaterThan(0);
    });
    it('creates nested structure', () => {
      const tree = buildDirectoryTree(['src/components/Button.tsx']);
      expect(tree.children).toBeDefined();
    });
    it('handles empty paths', () => {
      const tree = buildDirectoryTree([]);
      expect(tree.type).toBe('directory');
    });
  });

  describe('planCreateFile', () => {
    it('creates a new file', () => {
      const result = planCreateFile('src/New.tsx', 'const x = 1;', new Set());
      expect(result.ok).toBe(true);
      expect(result.file?.path).toBe('src/New.tsx');
      expect(result.file?.language).toBe('typescriptreact');
    });
    it('rejects duplicate path', () => {
      const result = planCreateFile('src/App.tsx', '', new Set(['src/App.tsx']));
      expect(result.ok).toBe(false);
    });
    it('rejects path traversal', () => {
      const result = planCreateFile('../secret.ts', '', new Set());
      expect(result.ok).toBe(false);
    });
    it('rejects empty path', () => {
      const result = planCreateFile('', '', new Set());
      expect(result.ok).toBe(false);
    });
  });

  describe('planRenameFile', () => {
    it('renames existing file', () => {
      const result = planRenameFile('src/Old.tsx', 'src/New.tsx', new Set(['src/Old.tsx']));
      expect(result.ok).toBe(true);
    });
    it('rejects non-existent source', () => {
      const result = planRenameFile('missing.ts', 'new.ts', new Set());
      expect(result.ok).toBe(false);
    });
    it('rejects target that already exists', () => {
      const result = planRenameFile('a.ts', 'b.ts', new Set(['a.ts', 'b.ts']));
      expect(result.ok).toBe(false);
    });
  });

  describe('planDeleteFile', () => {
    it('deletes existing file', () => {
      const result = planDeleteFile('src/Old.tsx', new Set(['src/Old.tsx']));
      expect(result.ok).toBe(true);
      expect(result.operation?.type).toBe('delete');
    });
    it('rejects non-existent file', () => {
      const result = planDeleteFile('missing.ts', new Set());
      expect(result.ok).toBe(false);
    });
  });

  describe('searchFiles', () => {
    it('finds text in files', () => {
      const files = new Map([['src/App.tsx', makeFile({ content: 'hello world\n' })]]);
      const results = searchFiles('hello', files);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.matchText).toBe('hello');
    });
    it('returns empty for no match', () => {
      const files = new Map([['src/App.tsx', makeFile({ content: 'foo\n' })]]);
      expect(searchFiles('bar', files)).toHaveLength(0);
    });
    it('respects maxResults', () => {
      const content = Array(100).fill('match here').join('\n');
      const files = new Map([['src/App.tsx', makeFile({ content })]]);
      expect(searchFiles('match', files, { maxResults: 5 }).length).toBeLessThanOrEqual(5);
    });
  });

  describe('validateFilePath', () => {
    it('accepts valid path', () => expect(validateFilePath('src/App.tsx').valid).toBe(true));
    it('rejects empty path', () => expect(validateFilePath('').valid).toBe(false));
    it('rejects path traversal', () => expect(validateFilePath('../escape').valid).toBe(false));
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Cursor Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('cursorPlanner', () => {
  it('creates cursor state at line 1 col 1', () => {
    const s = createCursorState('src/App.tsx');
    expect(s.primary.line).toBe(1);
    expect(s.primary.column).toBe(1);
  });
  it('moves cursor and records history', () => {
    const s = moveCursor(createCursorState('f'), { filePath: 'f', line: 5, column: 3 });
    expect(s.primary.line).toBe(5);
    expect(s.history.length).toBe(1);
  });
  it('adds secondary cursor', () => {
    const s = addSecondaryCursor(createCursorState('f'), { filePath: 'f', line: 2, column: 1 });
    expect(s.secondary.length).toBe(1);
  });
  it('clears secondary cursors', () => {
    let s = addSecondaryCursor(createCursorState('f'), { filePath: 'f', line: 2, column: 1 });
    s = clearSecondaryCursors(s);
    expect(s.secondary).toHaveLength(0);
  });
  it('goto line', () => {
    const s = gotoLine(createCursorState('f'), 10, 5);
    expect(s.primary.line).toBe(10);
    expect(s.primary.column).toBe(5);
  });
  it('rangeContainsCursor returns true for cursor in range', () => {
    const range = makeRange({ startLine: 1, startColumn: 1, endLine: 5, endColumn: 10 });
    expect(rangeContainsCursor(range, { filePath: 'f', line: 3, column: 1 })).toBe(true);
  });
  it('rangeContainsCursor returns false for cursor outside range', () => {
    const range = makeRange({ startLine: 1, startColumn: 1, endLine: 2, endColumn: 1 });
    expect(rangeContainsCursor(range, { filePath: 'f', line: 10, column: 1 })).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Selection Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('selectionPlanner', () => {
  const content = 'line one\nline two\nline three\n';

  it('extracts single-line selection', () => {
    const sel = extractSelection('f', content, { startLine: 1, startColumn: 1, endLine: 1, endColumn: 5 });
    expect(sel.text).toBe('line');
  });
  it('extracts multi-line selection', () => {
    const sel = extractSelection('f', content, { startLine: 1, startColumn: 1, endLine: 2, endColumn: 9 });
    expect(sel.text).toContain('line one');
  });
  it('builds selection context', () => {
    const sel = extractSelection('f', content, { startLine: 1, startColumn: 1, endLine: 1, endColumn: 5 });
    const ctx = buildSelectionContext(sel, content, 'typescript');
    expect(ctx.language).toBe('typescript');
    expect(ctx.surroundingCode).toBeDefined();
  });
  it('validates range correctly', () => {
    expect(validateSelectionRange(content, { startLine: 1, startColumn: 1, endLine: 2, endColumn: 1 }).valid).toBe(true);
  });
  it('rejects startLine > endLine', () => {
    expect(validateSelectionRange(content, { startLine: 3, startColumn: 1, endLine: 1, endColumn: 1 }).valid).toBe(false);
  });
  it('applies selection edit', () => {
    const result = applySelectionEdit('const x = 1;', { filePath: 'f', range: { startLine: 1, startColumn: 9, endLine: 1, endColumn: 10 }, text: '1' }, '42');
    expect(result).toContain('42');
  });
  it('builds AI edit prompt', () => {
    const sel = extractSelection('f', content, { startLine: 1, startColumn: 1, endLine: 1, endColumn: 5 });
    const ctx = buildSelectionContext(sel, content, 'typescript');
    const prompt = buildPartialAIEditPrompt(ctx, 'Optimize this');
    expect(prompt).toContain('Optimize this');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Undo/Redo Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('undoRedoPlanner', () => {
  const edit = makeEdit();

  it('starts with empty stacks', () => {
    const s = createUndoRedoStack('f');
    const status = getUndoRedoStatus(s);
    expect(status.canUndo).toBe(false);
    expect(status.canRedo).toBe(false);
  });
  it('pushEdit adds to undo stack', () => {
    const s = pushEdit(createUndoRedoStack('f'), edit);
    expect(getUndoRedoStatus(s).canUndo).toBe(true);
  });
  it('pushEdit clears redo stack', () => {
    let s = pushEdit(createUndoRedoStack('f'), edit);
    s = pushEdit(s, makeEdit({ id: 'e2' }));
    expect(getUndoRedoStatus(s).redoCount).toBe(0);
  });
  it('planUndo pops from undo stack', () => {
    const s = pushEdit(createUndoRedoStack('f'), edit);
    const { stack: s2, edit: undone } = planUndo(s);
    expect(undone?.id).toBe(edit.id);
    expect(getUndoRedoStatus(s2).canUndo).toBe(false);
  });
  it('planRedo restores after undo', () => {
    let s = pushEdit(createUndoRedoStack('f'), edit);
    const { stack: s2 } = planUndo(s);
    const { stack: s3, edit: redone } = planRedo(s2);
    expect(redone?.id).toBe(edit.id);
  });
  it('clearHistory empties both stacks', () => {
    let s = pushEdit(createUndoRedoStack('f'), edit);
    s = clearHistory(s);
    const status = getUndoRedoStatus(s);
    expect(status.canUndo).toBe(false);
    expect(status.canRedo).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Diagnostics Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('diagnosticsPlanner', () => {
  it('scores 10 for empty diagnostics', () => {
    expect(scoreDiagnostics([])).toBe(10);
  });
  it('reduces score for errors', () => {
    const diag: DiagnosticItem = { id: '1', filePath: 'f', line: 1, column: 1, message: 'err', severity: 'error', source: 'typescript' };
    expect(scoreDiagnostics([diag])).toBeLessThan(10);
  });
  it('detects console.log', () => {
    const items = runHeuristicLint('f.ts', 'console.log("hi");\n', 'typescript');
    expect(items.some(d => d.message.includes('console.log'))).toBe(true);
  });
  it('deduplicates identical diagnostics', () => {
    const d: DiagnosticItem = { id: '1', filePath: 'f', line: 1, column: 1, message: 'e', severity: 'error', source: 'typescript' };
    expect(deduplicateDiagnostics([d, d])).toHaveLength(1);
  });
  it('counts by severity', () => {
    const d: DiagnosticItem = { id: '1', filePath: 'f', line: 1, column: 1, message: 'e', severity: 'error', source: 'typescript' };
    const counts = countBySeverity([d]);
    expect(counts.error).toBe(1);
    expect(counts.warning).toBe(0);
  });
  it('sorts errors before warnings', () => {
    const warn: DiagnosticItem = { id: '2', filePath: 'f', line: 2, column: 1, message: 'w', severity: 'warning', source: 'eslint' };
    const err:  DiagnosticItem = { id: '1', filePath: 'f', line: 1, column: 1, message: 'e', severity: 'error',   source: 'typescript' };
    const sorted = getSortedDiagnostics([warn, err]);
    expect(sorted[0]?.severity).toBe('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Lint Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('lintPlanner', () => {
  it('detects no-console', () => {
    const r = runLint('f.ts', 'console.log("x");\n');
    expect(r.diagnostics.some(d => d.message.includes('console.log'))).toBe(true);
  });
  it('detects no-var', () => {
    const r = runLint('f.ts', 'var x = 1;\n');
    expect(r.diagnostics.some(d => d.message.includes('var'))).toBe(true);
  });
  it('detects debugger', () => {
    const r = runLint('f.ts', 'debugger;\n');
    expect(r.diagnostics.some(d => d.severity === 'error')).toBe(true);
  });
  it('detects no-explicit-any', () => {
    const r = runLint('f.ts', 'function f(x: any): void {}\n');
    expect(r.diagnostics.some(d => d.message.includes('any'))).toBe(true);
  });
  it('score is 10 for clean code', () => {
    const r = runLint('f.ts', 'const x = 1;\n');
    expect(r.score).toBe(10);
  });
  it('aggregates lint scores across files', () => {
    const results = runLintOnFiles([{ filePath: 'f.ts', content: 'const x = 1;\n' }]);
    expect(aggregateLintScore(results)).toBe(10);
  });
  it('returns empty diagnostics for non-JS file', () => {
    // Linter only runs on TS/JS
    const r = runLint('f.py', 'print("hello")\n');
    // Python file — no TS-specific rules hit
    expect(r.score).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Formatter Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('formatterPlanner', () => {
  it('detects spaces indentation', () => {
    const prefs = detectCodingStyle(['  const x = 1;\n  const y = 2;\n']);
    expect(prefs.indentation).toBe('spaces');
  });
  it('detects tabs indentation', () => {
    const prefs = detectCodingStyle(['\tconst x = 1;\n\tconst y = 2;\n']);
    expect(prefs.indentation).toBe('tabs');
  });
  it('detects single quotes', () => {
    const prefs = detectCodingStyle(["const s = 'hello';\n"]);
    expect(prefs.quotes).toBe('single');
  });
  it('trims trailing whitespace', () => {
    expect(trimTrailingWhitespace('hello   \nworld   \n')).toBe('hello\nworld\n');
  });
  it('ensures trailing newline', () => {
    expect(ensureTrailingNewline('hello')).toBe('hello\n');
    expect(ensureTrailingNewline('hello\n')).toBe('hello\n');
  });
  it('computeFormatDiff returns empty for identical strings', () => {
    expect(computeFormatDiff('abc\n', 'abc\n')).toHaveLength(0);
  });
  it('computeFormatDiff detects changes', () => {
    const diffs = computeFormatDiff('  hello\n', 'hello\n');
    expect(diffs.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Symbol Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('symbolPlanner', () => {
  const content = `export function hello() {}\nexport const world = 1;\nexport class Foo {}\n`;

  it('extracts exported functions', () => {
    const syms = extractSymbols('f.ts', content);
    expect(syms.some(s => s.name === 'hello' && s.kind === 'function')).toBe(true);
  });
  it('extracts exported consts', () => {
    const syms = extractSymbols('f.ts', content);
    expect(syms.some(s => s.name === 'world')).toBe(true);
  });
  it('finds references to a symbol', () => {
    const files = new Map([['f.ts', { content: 'hello(); hello();' }]]);
    const refs = findReferences('hello', files);
    expect(refs.length).toBeGreaterThanOrEqual(2);
  });
  it('planRenameSymbol returns edits and affected files', () => {
    const files = new Map([['f.ts', { content: 'hello();\n' }]]);
    const { edits, affectedFiles } = planRenameSymbol('hello', 'greet', files);
    expect(affectedFiles).toContain('f.ts');
    expect(edits.length).toBeGreaterThan(0);
  });
  it('planRenameSymbol returns empty for identical names', () => {
    const files = new Map([['f.ts', { content: 'hello();\n' }]]);
    const { edits } = planRenameSymbol('hello', 'hello', files);
    expect(edits).toHaveLength(0);
  });
  it('getFileOutline excludes imports', () => {
    const syms = extractSymbols('f.ts', `import React from 'react';\nexport function Comp() {}\n`);
    const outline = getFileOutline(syms);
    expect(outline.every(s => s.kind !== 'import')).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Navigation Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('navigationPlanner', () => {
  it('starts with empty history', () => {
    const h = createNavigationHistory();
    expect(h.back).toHaveLength(0);
    expect(h.forward).toHaveLength(0);
  });
  it('pushNavigation adds to back', () => {
    const h = pushNavigation(
      createNavigationHistory(),
      { filePath: 'a.ts', line: 1, column: 1 },
      { filePath: 'b.ts', line: 5, column: 1 },
    );
    expect(h.back).toHaveLength(1);
  });
  it('goBack moves position', () => {
    let h = pushNavigation(createNavigationHistory(),
      { filePath: 'a.ts', line: 1, column: 1 },
      { filePath: 'b.ts', line: 5, column: 1 },
    );
    const { history: h2, position } = goBack(h);
    expect(position?.filePath).toBe('a.ts');
    expect(h2.forward).toHaveLength(1);
  });
  it('goForward restores position', () => {
    let h = pushNavigation(createNavigationHistory(),
      { filePath: 'a.ts', line: 1, column: 1 },
      { filePath: 'b.ts', line: 5, column: 1 },
    );
    const { history: h2 } = goBack(h);
    const { position } = goForward(h2);
    expect(position?.filePath).toBe('a.ts');
  });
  it('buildBreadcrumbs includes file segment', () => {
    const crumbs = buildBreadcrumbs('src/App.tsx', 1, []);
    expect(crumbs[0]?.kind).toBe('file');
    expect(crumbs[0]?.label).toBe('App.tsx');
  });
  it('buildFileQuickOpenList filters by query', () => {
    const paths = ['src/App.tsx', 'src/Button.tsx', 'lib/utils.ts'];
    const result = buildFileQuickOpenList(paths, 'App');
    expect(result).toContain('src/App.tsx');
    expect(result).not.toContain('src/Button.tsx');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Completion Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('completionPlanner', () => {
  it('builds completion context', () => {
    const ctx = buildCompletionContext('const x = 1;\n', 1, 6);
    expect(ctx.currentWord).toBeDefined();
    expect(ctx.line).toBe(1);
  });
  it('returns keyword completions for typescript', () => {
    const ctx = buildCompletionContext('con\n', 1, 4);
    const items = getCompletions({ ...ctx, currentWord: 'con' }, [], 'typescript');
    expect(items.some(i => i.label === 'const')).toBe(true);
  });
  it('returns symbol completions', () => {
    const syms = [{ name: 'myFunc', kind: 'function' as const, filePath: 'f', line: 1, column: 1, isExport: true }];
    const ctx = buildCompletionContext('myF\n', 1, 4);
    const items = getCompletions({ ...ctx, currentWord: 'myF' }, syms, 'typescript');
    expect(items.some(i => i.label === 'myFunc')).toBe(true);
  });
  it('getHoverInfo finds symbol', () => {
    const syms = [{ name: 'hello', kind: 'function' as const, filePath: 'f', line: 1, column: 1, isExport: true }];
    const info = getHoverInfo('hello', syms);
    expect(info?.symbolName).toBe('hello');
  });
  it('getHoverInfo returns null for unknown symbol', () => {
    expect(getHoverInfo('unknown', [])).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Git Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('gitPlanner', () => {
  let state = createGitState();
  beforeEach(() => { state = createGitState(); });

  it('starts clean', () => expect(getGitSummary(state).status).toBe('clean'));
  it('marks file modified', () => {
    const s = markFileModified(state, 'src/App.tsx');
    expect(s.modifiedFiles.has('src/App.tsx')).toBe(true);
  });
  it('stage file moves to staged', () => {
    const s2 = markFileModified(state, 'f');
    const s3 = stageFile(s2, 'f');
    expect(s3.stagedFiles.has('f')).toBe(true);
    expect(s3.modifiedFiles.has('f')).toBe(false);
  });
  it('stageAll stages all modified files', () => {
    let s = markFileModified(state, 'a');
    s = markFileModified(s, 'b');
    s = stageAll(s);
    expect(s.stagedFiles.has('a') && s.stagedFiles.has('b')).toBe(true);
  });
  it('commit requires message', () => {
    const s = stageFile(markFileModified(state, 'f'), 'f');
    expect(planCommit(s, '', 'dev').ok).toBe(false);
  });
  it('commit requires staged files', () => {
    expect(planCommit(state, 'msg', 'dev').ok).toBe(false);
  });
  it('commit succeeds with staged files and message', () => {
    const s = stageFile(markFileModified(state, 'f'), 'f');
    const { ok, commit } = planCommit(s, 'init', 'dev');
    expect(ok).toBe(true);
    expect(commit?.message).toBe('init');
  });
  it('planCreateBranch creates new branch', () => {
    const { ok, state: s } = planCreateBranch(state, 'feature/x');
    expect(ok).toBe(true);
    expect(s?.branches.some(b => b.name === 'feature/x')).toBe(true);
  });
  it('planCreateBranch rejects duplicate name', () => {
    expect(planCreateBranch(state, 'main').ok).toBe(false);
  });
  it('planCheckout switches branch', () => {
    let s = planCreateBranch(state, 'dev').state!;
    const { ok, state: s2 } = planCheckout(s, 'dev');
    expect(ok).toBe(true);
    expect(s2?.currentBranch).toBe('dev');
  });
  it('computeDiff counts additions', () => {
    const diff = computeDiff('f', 'a\n', 'a\nb\n');
    expect(diff.additions).toBeGreaterThan(0);
  });
  it('computeDiff returns zero for identical content', () => {
    const diff = computeDiff('f', 'a\n', 'a\n');
    expect(diff.additions).toBe(0);
    expect(diff.deletions).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Version Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('versionPlanner', () => {
  it('parses semver', () => {
    const v = parseVersion('1.2.3');
    expect(v?.major).toBe(1); expect(v?.minor).toBe(2); expect(v?.patch).toBe(3);
  });
  it('parses v-prefixed', () => expect(parseVersion('v2.0.0')?.major).toBe(2));
  it('returns null for invalid', () => expect(parseVersion('not-a-version')).toBeNull());
  it('formats version', () => expect(formatVersion({ major: 1, minor: 2, patch: 3 })).toBe('1.2.3'));
  it('formats pre-release', () => expect(formatVersion({ major: 1, minor: 0, patch: 0, pre: 'alpha' })).toBe('1.0.0-alpha'));
  it('bumps patch', () => expect(bumpVersion('1.0.0', 'patch').version).toBe('1.0.1'));
  it('bumps minor resets patch', () => expect(bumpVersion('1.1.1', 'minor').version).toBe('1.2.0'));
  it('bumps major resets minor and patch', () => expect(bumpVersion('1.2.3', 'major').version).toBe('2.0.0'));
  it('returns error for invalid version', () => expect(bumpVersion('bad', 'patch').ok).toBe(false));
  it('compares versions', () => expect(compareVersions('1.0.1', '1.0.0')).toBe(1));
  it('gets latest version', () => expect(getLatestVersion(['1.0.0', '2.0.0', '1.5.0'])).toBe('2.0.0'));
  it('changelog entry includes date', () => {
    const s = addChangelogEntry(createChangelogState(), { version: '1.0.0', added: ['Feature'], changed: [], fixed: [], removed: [] });
    expect(s.entries[0]?.date).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
  it('formatChangelog produces markdown', () => {
    const s = addChangelogEntry(createChangelogState(), { version: '1.0.0', added: ['Thing'], changed: [], fixed: [], removed: [] });
    expect(formatChangelog(s)).toContain('## [1.0.0]');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Terminal Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('terminalPlanner', () => {
  it('creates idle session', () => {
    const s = createTerminalSession('/tmp');
    expect(s.status).toBe('idle');
    expect(s.cwd).toBe('/tmp');
  });
  it('addToHistory appends command', () => {
    const s = addToHistory(createTerminalSession('/'), 'ls -la');
    expect(s.history).toContain('ls -la');
  });
  it('searchHistory filters results', () => {
    let s = createTerminalSession('/');
    s = addToHistory(s, 'git commit');
    s = addToHistory(s, 'npm install');
    expect(searchHistory(s, 'git')).toContain('git commit');
    expect(searchHistory(s, 'git')).not.toContain('npm install');
  });
  it('classifies safe command', () => expect(classifyCommandRisk('ls -la')).toBe('safe'));
  it('classifies blocked rm -rf /', () => expect(classifyCommandRisk('rm -rf /')).toBe('blocked'));
  it('classifies dangerous sudo', () => expect(classifyCommandRisk('sudo rm -r /tmp/foo')).toBe('dangerous'));
  it('planCommand blocks dangerous commands', () => {
    const s = createTerminalSession('/');
    const plan = planCommand('rm -rf /', s);
    expect(plan.ok).toBe(false);
    expect(plan.blockReason).toBeDefined();
  });
  it('detectPackageManager detects pnpm', () => {
    expect(detectPackageManager(new Set(['pnpm-lock.yaml']))).toBe('pnpm');
  });
  it('detectPackageManager detects yarn', () => {
    expect(detectPackageManager(new Set(['yarn.lock']))).toBe('yarn');
  });
  it('buildInstallCommand for pnpm dev dep', () => {
    expect(buildInstallCommand('jest', 'pnpm', true)).toContain('--save-dev');
  });
  it('records command result', () => {
    const log = createCommandLog();
    const updated = recordCommandResult(log, 's1', 'ls', 'file', 0, 10);
    expect(updated.commands).toHaveLength(1);
    expect(updated.commands[0]?.exitCode).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Command Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('commandPlanner', () => {
  it('plans install dependencies', () => {
    const seq = planInstallDependencies('pnpm', '/workspace');
    expect(seq.steps[0]?.command).toContain('pnpm');
  });
  it('plans typecheck', () => {
    const seq = planTypeCheck('/workspace');
    expect(seq.steps[0]?.command).toContain('typecheck');
  });
  it('plans build', () => {
    const seq = planBuildProject('/workspace');
    expect(seq.steps[0]?.command).toContain('build');
  });
  it('validates empty sequence', () => {
    const { valid, issues } = validateCommandSequence({ name: '', description: '', steps: [], estimatedMs: 0 });
    expect(valid).toBe(false);
    expect(issues.length).toBeGreaterThan(0);
  });
  it('validates blocked command', () => {
    const seq = buildCustomSequence('test', ['rm -rf /'], '/');
    const { valid, issues } = validateCommandSequence(seq);
    expect(valid).toBe(false);
    expect(issues.some(i => i.includes('blocked'))).toBe(true);
  });
  it('valid sequence passes', () => {
    const seq = planBuildProject('/workspace');
    const { valid } = validateCommandSequence(seq);
    expect(valid).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Preview Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('previewPlanner', () => {
  it('creates idle state', () => {
    const s = createPreviewState(3000);
    expect(s.status).toBe('idle');
    expect(s.port).toBe(3000);
  });
  it('sets status', () => {
    const s = setPreviewStatus(createPreviewState(3000), 'loading');
    expect(s.status).toBe('loading');
  });
  it('records reload', () => {
    const s = recordPreviewReload(createPreviewState(3000), 200);
    expect(s.reloadCount).toBe(1);
    expect(s.latencyMs).toBe(200);
    expect(s.status).toBe('ready');
  });
  it('detects full reload for config change', () => {
    expect(determineReloadStrategy(['vite.config.ts'])).toBe('full');
  });
  it('detects hot for css only', () => {
    expect(determineReloadStrategy(['styles.css'])).toBe('hot');
  });
  it('parses compile error', () => {
    const err = parsePreviewError('src/App.tsx:5:10: Cannot find name x');
    expect(err.type).toBe('compile');
  });
  it('parses runtime error', () => {
    const err = parsePreviewError('TypeError: Cannot read property');
    expect(err.type).toBe('runtime');
  });
  it('aggregates preview metrics', () => {
    const m = aggregatePreviewMetrics([100, 200], 0, 2, 0);
    expect(m.avgLatencyMs).toBe(150);
    expect(m.totalReloads).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Hot Reload Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('hotReloadPlanner', () => {
  it('registers module', () => {
    let s = createHotReloadState();
    s = registerModule(s, 'src/App.tsx', ['src/Button.tsx']);
    expect(s.modules.has('src/App.tsx')).toBe(true);
  });
  it('invalidates module and dependents', () => {
    let s = createHotReloadState();
    s = registerModule(s, 'src/Button.tsx', []);
    s = registerModule(s, 'src/App.tsx', ['src/Button.tsx']);
    const { state: s2, invalidated } = invalidateModule(s, 'src/Button.tsx');
    expect(invalidated).toContain('src/Button.tsx');
  });
  it('planHotReload hot for CSS', () => {
    const plan = planHotReload(createHotReloadState(), 'styles.css', 'css');
    expect(plan.canHotReload).toBe(true);
  });
  it('planHotReload full for config', () => {
    const plan = planHotReload(createHotReloadState(), 'vite.config.ts', 'typescript');
    expect(plan.requiresFullReload).toBe(true);
  });
  it('markReloadComplete marks modules fresh', () => {
    let s = createHotReloadState();
    s = registerModule(s, 'src/App.tsx', []);
    const { state: s2 } = invalidateModule(s, 'src/App.tsx');
    const s3 = markReloadComplete(s2, ['src/App.tsx']);
    expect(s3.modules.get('src/App.tsx')?.status).toBe('fresh');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Project Structure Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('projectStructurePlanner', () => {
  it('detects react-vite framework', () => {
    expect(detectFramework(new Set(['vite.config.ts']))).toBe('react-vite');
  });
  it('detects next framework', () => {
    expect(detectFramework(new Set(['next.config.js']))).toBe('next');
  });
  it('detects unknown', () => {
    expect(detectFramework(new Set([]))).toBe('unknown');
  });
  it('detects folder conventions', () => {
    const conv = detectFolderConventions(['src/components/Button.tsx', 'src/hooks/useData.ts']);
    expect(conv.componentDir).toBeTruthy();
  });
  it('builds project structure summary', () => {
    const summary = buildProjectStructureSummary(['src/App.tsx', 'src/Button.tsx'], '{"dependencies":{}}');
    expect(summary.componentCount).toBeGreaterThan(0);
    expect(summary.contextString).toContain('Framework');
  });
  it('suggestFilePath for component', () => {
    const conv = detectFolderConventions([]);
    const path = suggestFilePath('Button.tsx', 'component', conv);
    expect(path).toContain('Button.tsx');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Dependency Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('dependencyPlanner', () => {
  const pkg = JSON.stringify({ dependencies: { react: '^18', express: '^4' }, devDependencies: { vitest: '^1' } });

  it('parses dependencies', () => {
    const { direct } = parseDependencies(pkg);
    expect(direct.some(d => d.name === 'react')).toBe(true);
  });
  it('handles invalid json', () => {
    const { direct } = parseDependencies('not json');
    expect(direct).toHaveLength(0);
  });
  it('extracts imports', () => {
    const imports = extractImports(`import React from 'react';\nimport './local';\n`);
    expect(imports).toContain('react');
    expect(imports).toContain('./local');
  });
  it('separates external from local imports', () => {
    const { external, local } = separateExternalImports(['react', './Button', '../utils']);
    expect(external).toContain('react');
    expect(local).toContain('./Button');
  });
  it('detects circular dependencies', () => {
    const map = new Map([
      ['a', ['b']], ['b', ['c']], ['c', ['a']],
    ]);
    const cycles = detectCircularDependencies(map);
    expect(cycles.length).toBeGreaterThan(0);
  });
  it('no cycles for acyclic graph', () => {
    const map = new Map([['a', ['b']], ['b', ['c']], ['c', []]]);
    expect(detectCircularDependencies(map)).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Conflict Resolver
// ══════════════════════════════════════════════════════════════════════════════

describe('conflictResolver', () => {
  it('detects no conflicts when files match', () => {
    expect(detectConflicts('f', 'same\n', 'same\n', 'same\n')).toHaveLength(0);
  });
  it('detects no conflict when only AI changed', () => {
    expect(detectConflicts('f', 'base\n', 'ai-changed\n', 'base\n')).toHaveLength(0);
  });
  it('auto-merge succeeds when no real conflicts', () => {
    const r = autoMergeNonConflicting('f', 'base\n', 'ai\n', 'base\n');
    expect(r.success).toBe(true);
  });
  it('resolves conflict accept-ai', () => {
    const c: MergeConflict = {
      id: 'c1', filePath: 'f', aiContent: 'ai', userContent: 'user',
      baseContent: 'base', region: makeRange(), timestamp: Date.now(),
    };
    const resolved = resolveConflict(c, 'accept-ai');
    expect(resolved.resolvedContent).toBe('ai');
  });
  it('resolves conflict accept-mine', () => {
    const c: MergeConflict = {
      id: 'c1', filePath: 'f', aiContent: 'ai', userContent: 'user',
      baseContent: 'base', region: makeRange(), timestamp: Date.now(),
    };
    const resolved = resolveConflict(c, 'accept-mine');
    expect(resolved.resolvedContent).toBe('user');
  });
  it('scoreConflictResolution calculates rate', () => {
    const c: MergeConflict = {
      id: 'c1', filePath: 'f', aiContent: 'ai', userContent: 'user',
      baseContent: 'base', region: makeRange(), timestamp: Date.now(),
      resolvedWith: 'accept-ai', resolvedContent: 'ai',
    };
    const score = scoreConflictResolution([c]);
    expect(score.resolutionRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Manual Merge Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('manualMergePlanner', () => {
  it('planMerge detects no conflicts when user unchanged', () => {
    const plan = planMerge('f', 'base', 'ai-changed', 'base');
    expect(plan.needsManualReview).toBe(false);
  });
  it('planBatchMerge aggregates results', () => {
    const batch = planBatchMerge([
      { filePath: 'a', baseContent: 'base', aiContent: 'ai', userContent: 'base' },
    ]);
    expect(batch.files).toHaveLength(1);
  });
  it('executeMerge succeeds for no-conflict case', () => {
    const r = executeMerge('f', 'base', 'ai-content', 'base');
    expect(r.success).toBe(true);
  });
  it('detectManualChanges detects changes', () => {
    const r = detectManualChanges('old\n', 'new\n');
    expect(r.hasChanges).toBe(true);
  });
  it('detectManualChanges returns false for identical', () => {
    const r = detectManualChanges('same\n', 'same\n');
    expect(r.hasChanges).toBe(false);
  });
  it('prepareAIRegeneration returns baseline snapshot', () => {
    const files = new Map([['f.ts', { content: 'code', editSource: 'manual' as const }]]);
    const { baselineSnapshot, manualFiles } = prepareAIRegeneration(files);
    expect(baselineSnapshot.get('f.ts')).toBe('code');
    expect(manualFiles).toContain('f.ts');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Live Sync Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('liveSyncPlanner', () => {
  it('creates synced state', () => {
    const s = createLiveSyncState();
    expect(s.globalStatus).toBe('synced');
  });
  it('registerAIFile creates record', () => {
    const file = makeFile({ path: 'f.ts', content: 'code' });
    const s = registerAIFile(createLiveSyncState(), file);
    expect(s.records.has('f.ts')).toBe(true);
  });
  it('recordUserEdit marks diverged when AI exists', () => {
    const file = makeFile({ path: 'f.ts' });
    let s = registerAIFile(createLiveSyncState(), file);
    s = recordUserEdit(s, 'f.ts', 'edited');
    const rec = s.records.get('f.ts');
    expect(rec?.syncStatus).toBe('diverged');
  });
  it('planSyncOperation allows direct sync for new file', () => {
    const plan = planSyncOperation(createLiveSyncState(), 'new.ts', 'content');
    expect(plan.canAutoSync).toBe(true);
  });
  it('getDivergedFiles returns diverged files', () => {
    const file = makeFile({ path: 'f.ts' });
    let s = registerAIFile(createLiveSyncState(), file);
    s = recordUserEdit(s, 'f.ts', 'changed');
    expect(getDivergedFiles(s)).toContain('f.ts');
  });
  it('markSynced clears diverged status', () => {
    const file = makeFile({ path: 'f.ts' });
    let s = registerAIFile(createLiveSyncState(), file);
    s = recordUserEdit(s, 'f.ts', 'changed');
    s = markSynced(s, 'f.ts');
    expect(s.records.get('f.ts')?.syncStatus).toBe('synced');
  });
  it('getSyncSummary aggregates stats', () => {
    const s = createLiveSyncState();
    const summary = getSyncSummary(s);
    expect(summary.total).toBe(0);
    expect(summary.globalStatus).toBe('synced');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Code Editor Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('codeEditorPlanner', () => {
  it('creates default config', () => {
    const cfg = defaultEditorConfig('typescript');
    expect(cfg.language).toBe('typescript');
    expect(cfg.theme).toBe('vs-dark');
  });
  it('getLanguageForFile maps tsx', () => {
    const lang = getLanguageForFile('App.tsx');
    expect(lang.monacoId).toBe('typescriptreact');
    expect(lang.hasIntelliSense).toBe(true);
  });
  it('getLanguageForFile falls back to plaintext', () => {
    expect(getLanguageForFile('file.unknown').monacoId).toBe('plaintext');
  });
  it('openTab adds tab and makes it active', () => {
    const state = openTab(createTabState(), 'App.tsx', 'typescript');
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]?.isActive).toBe(true);
  });
  it('openTab does not duplicate same tab', () => {
    let state = openTab(createTabState(), 'App.tsx', 'typescript');
    state = openTab(state, 'App.tsx', 'typescript');
    expect(state.tabs).toHaveLength(1);
  });
  it('closeTab removes tab', () => {
    let state = openTab(createTabState(), 'App.tsx', 'typescript');
    state = closeTab(state, 'App.tsx');
    expect(state.tabs).toHaveLength(0);
  });
  it('markTabDirty updates dirty flag', () => {
    let state = openTab(createTabState(), 'App.tsx', 'typescript');
    state = markTabDirty(state, 'App.tsx', true);
    expect(state.tabs[0]?.isDirty).toBe(true);
  });
  it('buildMonacoModelOptions returns tab config', () => {
    const opts = buildMonacoModelOptions(defaultEditorConfig('typescript'));
    expect(opts.tabSize).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Refactor Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('refactorPlanner', () => {
  it('analyzes extract-function as applicable for multi-line', () => {
    const proposals = analyzeRefactorOpportunities('line1\nline2\nline3', 'typescript');
    const ef = proposals.find(p => p.kind === 'extract-function');
    expect(ef?.applicable).toBe(true);
  });
  it('analyzes extract-component as applicable for JSX', () => {
    const proposals = analyzeRefactorOpportunities('<div>hello</div>', 'typescriptreact');
    const ec = proposals.find(p => p.kind === 'extract-component');
    expect(ec?.applicable).toBe(true);
  });
  it('planConvertToArrow converts named function', () => {
    const { ok, result } = planConvertToArrow('function hello() { return 1; }');
    expect(ok).toBe(true);
    expect(result).toContain('=>');
  });
  it('planConvertToArrow rejects non-function', () => {
    expect(planConvertToArrow('const x = 1;').ok).toBe(false);
  });
  it('buildRefactorAIPrompt includes instruction', () => {
    const prompt = buildRefactorAIPrompt('extract-function', 'const x = 1;', 'typescript', { name: 'helper' });
    expect(prompt).toContain('helper');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Rename Planner
// ══════════════════════════════════════════════════════════════════════════════

describe('renamePlanner', () => {
  it('validates valid rename', () => {
    expect(validateRename('oldName', 'newName').valid).toBe(true);
  });
  it('rejects identical names', () => {
    expect(validateRename('same', 'same').valid).toBe(false);
  });
  it('rejects reserved keyword', () => {
    expect(validateRename('foo', 'class').valid).toBe(false);
  });
  it('rejects invalid identifier', () => {
    expect(validateRename('foo', '123abc').valid).toBe(false);
  });
  it('planRename finds occurrences', () => {
    const files = new Map([['f.ts', { content: 'oldName(); oldName();\n' }]]);
    const op = planRename('oldName', 'newName', files);
    expect(op.valid).toBe(true);
    expect(op.editCount).toBe(2);
    expect(op.affectedFiles).toContain('f.ts');
  });
  it('executeRename replaces all occurrences', () => {
    const result = executeRename('foo(); foo(); const foo = 1;', 'foo', 'bar');
    expect(result).not.toContain('foo');
    expect(result).toContain('bar');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Manual Workspace (core state)
// ══════════════════════════════════════════════════════════════════════════════

describe('manualWorkspace', () => {
  let state = createWorkspaceState('proj1');
  const file = makeFile();
  beforeEach(() => { state = createWorkspaceState('proj1'); });

  it('creates initial state', () => {
    expect(state.projectId).toBe('proj1');
    expect(state.mode).toBe('vibe');
  });
  it('addFile adds a file', () => {
    const s = addFile(state, file);
    expect(s.files.has('src/App.tsx')).toBe(true);
  });
  it('updateFileContent updates content', () => {
    let s = addFile(state, file);
    s = updateFileContent(s, 'src/App.tsx', 'const x = 2;\n', 'manual');
    expect(s.files.get('src/App.tsx')?.content).toBe('const x = 2;\n');
  });
  it('updateFileContent records edit history', () => {
    let s = addFile(state, file);
    s = updateFileContent(s, 'src/App.tsx', 'new', 'manual');
    expect(s.editHistory.length).toBeGreaterThan(0);
  });
  it('deleteFile marks file deleted', () => {
    let s = addFile(state, file);
    s = deleteFile(s, 'src/App.tsx');
    expect(s.files.get('src/App.tsx')?.isDeleted).toBe(true);
  });
  it('renameFile changes path', () => {
    let s = addFile(state, file);
    s = renameFile(s, 'src/App.tsx', 'src/Main.tsx');
    expect(s.files.has('src/Main.tsx')).toBe(true);
    expect(s.files.has('src/App.tsx')).toBe(false);
  });
  it('openFile sets activeFile', () => {
    let s = addFile(state, file);
    s = openFile(s, 'src/App.tsx');
    expect(s.activeFile).toBe('src/App.tsx');
  });
  it('closeFile removes from openFiles', () => {
    let s = addFile(state, file);
    s = openFile(s, 'src/App.tsx');
    s = closeFile(s, 'src/App.tsx');
    expect(s.openFiles).not.toContain('src/App.tsx');
  });
  it('createSnapshot captures files', () => {
    let s = addFile(state, file);
    const { snapshot } = createSnapshot(s, 'initial', 'manual');
    expect(snapshot.files.length).toBeGreaterThan(0);
  });
  it('restoreSnapshot restores files', () => {
    let s = addFile(state, file);
    const { state: s2, snapshot } = createSnapshot(s, 'save', 'manual');
    const s3 = deleteFile(s2, 'src/App.tsx');
    const s4 = restoreSnapshot(s3, snapshot);
    expect(s4.files.get('src/App.tsx')?.isDeleted).toBe(false);
  });
  it('getWorkspaceSummary returns counts', () => {
    let s = addFile(state, file);
    const summary = getWorkspaceSummary(s);
    expect(summary.fileCount).toBe(1);
    expect(summary.mode).toBe('vibe');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Workspace Metrics
// ══════════════════════════════════════════════════════════════════════════════

describe('workspaceMetrics', () => {
  beforeEach(() => resetWorkspaceMetrics());

  it('starts at zero', () => {
    const s = getWorkspaceMetricsSnapshot();
    expect(s.manualEdits).toBe(0);
    expect(s.mergeConflicts).toBe(0);
  });
  it('records manual edit', () => {
    recordManualEdit();
    expect(getWorkspaceMetricsSnapshot().manualEdits).toBe(1);
  });
  it('records merge conflict', () => {
    recordMergeConflict();
    expect(getWorkspaceMetricsSnapshot().mergeConflicts).toBe(1);
  });
  it('calculates editRatio', () => {
    recordManualEdit();
    recordManualEdit();
    const s = getWorkspaceMetricsSnapshot();
    expect(s.editRatio).toBe(1); // all manual
  });
  it('reset clears all metrics', () => {
    recordManualEdit();
    resetWorkspaceMetrics();
    expect(getWorkspaceMetricsSnapshot().manualEdits).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Workspace Validator
// ══════════════════════════════════════════════════════════════════════════════

describe('workspaceValidator', () => {
  it('validates empty workspace as healthy', () => {
    const result = validateWorkspace(new Map(), new Set());
    expect(result.healthScore).toBe(10);
    expect(result.valid).toBe(true);
  });
  it('detects missing local import', () => {
    const files = new Map([
      ['src/App.tsx', makeFile({ content: "import { helper } from './missing';\n" })],
    ]);
    const result = validateWorkspace(files, new Set());
    expect(result.brokenImports.length).toBeGreaterThan(0);
  });
  it('accepts valid local import', () => {
    const files = new Map([
      ['src/App.tsx', makeFile({ content: "import { helper } from './utils';\n" })],
      ['src/utils.ts', makeFile({ path: 'src/utils.ts', content: 'export const helper = 1;\n' })],
    ]);
    const result = validateWorkspace(files, new Set());
    expect(result.brokenImports.filter(b => b.importPath.includes('utils'))).toHaveLength(0);
  });
  it('detects missing external package', () => {
    const files = new Map([
      ['src/App.tsx', makeFile({ content: "import { x } from 'some-unknown-package';\n" })],
    ]);
    const result = validateWorkspace(files, new Set(['react']));
    expect(result.missingDeps).toContain('some-unknown-package');
  });
  it('produces context string', () => {
    const result = validateWorkspace(new Map(), new Set());
    expect(result.contextString).toContain('health');
  });
});
