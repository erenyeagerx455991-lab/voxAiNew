// ── V10.2 File System Planner — Deterministic ────────────────────────────────
//
// Plans and validates all file system operations: create, rename, delete,
// move, duplicate, search. Zero LLM calls. Never throws.

import type {
  WorkspaceFile,
  FileOperation,
  DirectoryNode,
} from './manualWorkspaceTypes.js';

// ── Language detection ───────────────────────────────────────────────────────

const EXT_LANGUAGE: Record<string, string> = {
  ts: 'typescript', tsx: 'typescriptreact',
  js: 'javascript', jsx: 'javascriptreact',
  html: 'html', css: 'css', scss: 'scss',
  json: 'json', md: 'markdown', mdx: 'mdx',
  py: 'python', yaml: 'yaml', yml: 'yaml',
  env: 'dotenv', sh: 'shellscript', bash: 'shellscript',
  sql: 'sql', graphql: 'graphql', toml: 'toml',
};

export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_LANGUAGE[ext] ?? 'plaintext';
}

// ── File creation ────────────────────────────────────────────────────────────

export function planCreateFile(
  path: string,
  content: string,
  existingPaths: Set<string>,
): { ok: boolean; file?: WorkspaceFile; error?: string } {
  if (!path || path.trim() === '') return { ok: false, error: 'Path is required' };
  if (existingPaths.has(path)) return { ok: false, error: `File already exists: ${path}` };
  if (path.includes('..')) return { ok: false, error: 'Path traversal not allowed' };

  const file: WorkspaceFile = {
    path,
    content,
    language: detectLanguage(path),
    encoding: 'utf-8',
    size: Buffer.byteLength(content, 'utf-8'),
    editSource: 'manual',
    lastModified: Date.now(),
    isNew: true,
    isDeleted: false,
  };
  return { ok: true, file };
}

// ── File rename ───────────────────────────────────────────────────────────────

export function planRenameFile(
  fromPath: string,
  toPath: string,
  existingPaths: Set<string>,
): { ok: boolean; operation?: FileOperation; error?: string } {
  if (!existingPaths.has(fromPath)) return { ok: false, error: `File not found: ${fromPath}` };
  if (existingPaths.has(toPath))    return { ok: false, error: `Target already exists: ${toPath}` };
  if (toPath.includes('..'))        return { ok: false, error: 'Path traversal not allowed' };
  const op: FileOperation = { type: 'rename', fromPath, toPath, timestamp: Date.now() };
  return { ok: true, operation: op };
}

// ── File delete ───────────────────────────────────────────────────────────────

export function planDeleteFile(
  path: string,
  existingPaths: Set<string>,
): { ok: boolean; operation?: FileOperation; error?: string } {
  if (!existingPaths.has(path)) return { ok: false, error: `File not found: ${path}` };
  const op: FileOperation = { type: 'delete', fromPath: path, timestamp: Date.now() };
  return { ok: true, operation: op };
}

// ── File move ────────────────────────────────────────────────────────────────

export function planMoveFile(
  fromPath: string,
  toPath: string,
  existingPaths: Set<string>,
): { ok: boolean; operation?: FileOperation; error?: string } {
  if (!existingPaths.has(fromPath)) return { ok: false, error: `File not found: ${fromPath}` };
  if (existingPaths.has(toPath))    return { ok: false, error: `Target already exists: ${toPath}` };
  if (toPath.includes('..'))        return { ok: false, error: 'Path traversal not allowed' };
  const op: FileOperation = { type: 'move', fromPath, toPath, timestamp: Date.now() };
  return { ok: true, operation: op };
}

// ── File duplicate ────────────────────────────────────────────────────────────

export function planDuplicateFile(
  fromPath: string,
  existingPaths: Set<string>,
): { ok: boolean; toPath?: string; operation?: FileOperation; error?: string } {
  if (!existingPaths.has(fromPath)) return { ok: false, error: `File not found: ${fromPath}` };
  const dot = fromPath.lastIndexOf('.');
  const toPath = dot >= 0
    ? `${fromPath.slice(0, dot)}.copy${fromPath.slice(dot)}`
    : `${fromPath}.copy`;
  const op: FileOperation = { type: 'duplicate', fromPath, toPath, timestamp: Date.now() };
  return { ok: true, toPath, operation: op };
}

// ── Directory tree ───────────────────────────────────────────────────────────

export function buildDirectoryTree(paths: string[]): DirectoryNode {
  const root: DirectoryNode = { name: '/', path: '/', type: 'directory', children: [] };
  const nodeMap = new Map<string, DirectoryNode>();
  nodeMap.set('/', root);

  const sortedPaths = [...paths].sort();
  for (const filePath of sortedPaths) {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;
    let accumulated = '';
    for (let i = 0; i < parts.length; i++) {
      accumulated = accumulated ? `${accumulated}/${parts[i]}` : parts[i];
      const isLast = i === parts.length - 1;
      if (!nodeMap.has(accumulated)) {
        const node: DirectoryNode = {
          name: parts[i],
          path: accumulated,
          type: isLast ? 'file' : 'directory',
          children: isLast ? undefined : [],
          language: isLast ? detectLanguage(parts[i]) : undefined,
        };
        nodeMap.set(accumulated, node);
        if (!current.children) current.children = [];
        current.children.push(node);
      }
      current = nodeMap.get(accumulated)!;
    }
  }
  return root;
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface FileSearchResult {
  filePath:    string;
  line:        number;
  column:      number;
  matchText:   string;
  lineContent: string;
}

export function searchFiles(
  query: string,
  files: Map<string, WorkspaceFile>,
  options: { caseSensitive?: boolean; regex?: boolean; maxResults?: number } = {},
): FileSearchResult[] {
  if (!query) return [];
  const max = options.maxResults ?? 200;
  const results: FileSearchResult[] = [];
  const flags = options.caseSensitive ? 'g' : 'gi';
  let pattern: RegExp;
  try {
    pattern = options.regex
      ? new RegExp(query, flags)
      : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
  } catch {
    return [];
  }

  for (const [filePath, file] of files) {
    if (file.isDeleted) continue;
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length && results.length < max; i++) {
      const line = lines[i];
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(line)) !== null && results.length < max) {
        results.push({
          filePath,
          line: i + 1,
          column: match.index + 1,
          matchText: match[0],
          lineContent: line.trim(),
        });
      }
    }
    if (results.length >= max) break;
  }
  return results;
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateFilePath(path: string): { valid: boolean; reason?: string } {
  if (!path)             return { valid: false, reason: 'Empty path' };
  if (path.includes('..')) return { valid: false, reason: 'Path traversal not allowed' };
  if (path.startsWith('/') && path !== '/') return { valid: true };
  if (/[<>:"|?*]/.test(path)) return { valid: false, reason: 'Invalid characters in path' };
  return { valid: true };
}
