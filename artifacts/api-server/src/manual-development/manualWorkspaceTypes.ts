// ── V10.2 Manual Development Intelligence — Shared Types ─────────────────────
//
// Central type definitions for the Autonomous Dual-Mode Development Engine.
// Fully additive — zero changes to existing pipeline types.

export type WorkspaceMode = 'vibe' | 'manual' | 'hybrid';
export type EditSource    = 'ai' | 'manual';
export type SyncStatus    = 'synced' | 'diverged' | 'conflict' | 'merging';
export type MergeStrategy = 'accept-ai' | 'accept-mine' | 'merge-both' | 'manual-edit';
export type FileStatus    = 'tracked' | 'modified' | 'untracked' | 'deleted' | 'renamed';
export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';
export type TerminalStatus = 'idle' | 'running' | 'exited' | 'error';
export type GitStatus      = 'clean' | 'modified' | 'staged' | 'conflict';
export type SnapshotTrigger = 'manual' | 'auto' | 'pre-ai' | 'pre-merge';

// ── File system ──────────────────────────────────────────────────────────────

export interface WorkspaceFile {
  path:      string;
  content:   string;
  language:  string;
  encoding:  'utf-8';
  size:      number;
  editSource: EditSource;
  lastModified: number; // unix ms
  isNew:     boolean;
  isDeleted: boolean;
}

export interface FileOperation {
  type:    'create' | 'rename' | 'delete' | 'move' | 'duplicate';
  fromPath: string;
  toPath?:  string;
  content?: string;
  timestamp: number;
}

export interface DirectoryNode {
  name:     string;
  path:     string;
  type:     'file' | 'directory';
  children?: DirectoryNode[];
  language?: string;
  size?:    number;
}

// ── Edits ─────────────────────────────────────────────────────────────────────

export interface WorkspaceEdit {
  id:         string;
  filePath:   string;
  source:     EditSource;
  oldContent: string;
  newContent: string;
  timestamp:  number;
  description?: string;
}

export interface EditRange {
  startLine:   number;
  startColumn: number;
  endLine:     number;
  endColumn:   number;
}

export interface CursorPosition {
  filePath: string;
  line:     number;
  column:   number;
}

export interface TextSelection {
  filePath:  string;
  range:     EditRange;
  text:      string;
}

// ── Conflicts ────────────────────────────────────────────────────────────────

export interface MergeConflict {
  id:          string;
  filePath:    string;
  aiContent:   string;
  userContent: string;
  baseContent: string;
  region:      EditRange;
  resolvedWith?: MergeStrategy;
  resolvedContent?: string;
  timestamp:   number;
}

export interface MergeResult {
  filePath:    string;
  merged:      string;
  conflicts:   MergeConflict[];
  strategy:    MergeStrategy;
  success:     boolean;
}

// ── Diagnostics ──────────────────────────────────────────────────────────────

export interface DiagnosticItem {
  id:       string;
  filePath: string;
  line:     number;
  column:   number;
  message:  string;
  severity: DiagnosticSeverity;
  source:   'typescript' | 'eslint' | 'prettier' | 'custom';
  code?:    string;
}

// ── Git ───────────────────────────────────────────────────────────────────────

export interface GitCommit {
  hash:      string;
  message:   string;
  author:    string;
  timestamp: number;
  filesChanged: string[];
}

export interface GitDiff {
  filePath:    string;
  additions:   number;
  deletions:   number;
  hunks:       GitHunk[];
}

export interface GitHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines:    string[];
}

export interface GitBranch {
  name:      string;
  isCurrent: boolean;
  aheadBy:   number;
  behindBy:  number;
}

// ── Terminal ─────────────────────────────────────────────────────────────────

export interface TerminalSession {
  id:      string;
  cwd:     string;
  status:  TerminalStatus;
  history: string[];
  env:     Record<string, string>;
}

export interface TerminalCommand {
  sessionId: string;
  command:   string;
  output?:   string;
  exitCode?: number;
  timestamp: number;
  durationMs?: number;
}

// ── Snapshots ────────────────────────────────────────────────────────────────

export interface WorkspaceSnapshot {
  id:        string;
  name:      string;
  trigger:   SnapshotTrigger;
  files:     WorkspaceFile[];
  timestamp: number;
  buildId?:  string;
}

// ── Completion ───────────────────────────────────────────────────────────────

export interface CompletionItem {
  label:         string;
  kind:          'variable' | 'function' | 'class' | 'property' | 'keyword' | 'snippet';
  detail?:       string;
  documentation?: string;
  insertText:    string;
  sortOrder:     number;
}

// ── Symbols ──────────────────────────────────────────────────────────────────

export interface SymbolInfo {
  name:     string;
  kind:     'variable' | 'function' | 'class' | 'interface' | 'type' | 'const' | 'import';
  filePath: string;
  line:     number;
  column:   number;
  isExport: boolean;
}

export interface SymbolReference {
  symbol:   SymbolInfo;
  location: { filePath: string; line: number; column: number };
}

// ── Workspace state ───────────────────────────────────────────────────────────

export interface WorkspaceState {
  projectId:    string;
  mode:         WorkspaceMode;
  syncStatus:   SyncStatus;
  activeFile?:  string;
  openFiles:    string[];
  files:        Map<string, WorkspaceFile>;
  snapshots:    WorkspaceSnapshot[];
  editHistory:  WorkspaceEdit[];
  conflicts:    MergeConflict[];
  diagnostics:  DiagnosticItem[];
  terminals:    TerminalSession[];
  gitStatus:    GitStatus;
  lastSyncMs:   number;
}

// ── Learning ─────────────────────────────────────────────────────────────────

export interface WorkspaceLearningRecord {
  projectId:          string;
  codingStyle:        CodingStylePrefs;
  frameworkPrefs:     FrameworkPrefs;
  folderConventions:  FolderConventions;
  editFrequency:      Record<string, number>;
  aiAcceptanceRate:   number;
  conflictRate:       number;
  manualEditRatio:    number;
  observedAt:         number;
}

export interface CodingStylePrefs {
  indentation:     'spaces' | 'tabs';
  indentSize:      number;
  quotes:          'single' | 'double';
  semicolons:      boolean;
  trailingCommas:  boolean;
  lineEnding:      'lf' | 'crlf';
  maxLineLength:   number;
}

export interface FrameworkPrefs {
  stateManagement: string[];
  cssApproach:     string[];
  testingLibs:     string[];
  preferredLibs:   string[];
}

export interface FolderConventions {
  componentDir:  string;
  hooksDir:      string;
  utilsDir:      string;
  typesDir:      string;
  servicesDir:   string;
  testDir:       string;
}

// ── Blueprint ─────────────────────────────────────────────────────────────────

export interface WorkspaceBlueprint {
  projectId:      string;
  mode:           WorkspaceMode;
  fileCount:      number;
  editCount:      number;
  conflictCount:  number;
  snapshotCount:  number;
  healthScore:    number;
  syncStatus:     SyncStatus;
  mergeStrategy:  MergeStrategy;
  learningApplied: boolean;
  validationScore: number;
  contextString:  string;
}
