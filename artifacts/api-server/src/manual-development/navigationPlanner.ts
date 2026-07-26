// ── V10.2 Navigation Planner — Deterministic ─────────────────────────────────
//
// Plans code navigation: go-to-definition, breadcrumbs, outline, jump history.
// Zero LLM calls. Never throws.

import type { CursorPosition } from './manualWorkspaceTypes.js';
import type { SymbolInfo } from './manualWorkspaceTypes.js';

// ── Navigation history ────────────────────────────────────────────────────────

const MAX_HISTORY = 100;

export interface NavigationHistory {
  back:    CursorPosition[];
  forward: CursorPosition[];
}

export function createNavigationHistory(): NavigationHistory {
  return { back: [], forward: [] };
}

export function pushNavigation(
  history: NavigationHistory,
  from: CursorPosition,
  to: CursorPosition,
): NavigationHistory {
  const back = [...history.back, from].slice(-MAX_HISTORY);
  return { back, forward: [] };
}

export function goBack(history: NavigationHistory): { history: NavigationHistory; position?: CursorPosition } {
  if (history.back.length === 0) return { history };
  const back    = [...history.back];
  const position = back.pop()!;
  const forward  = [...history.forward, position].slice(-MAX_HISTORY);
  return { history: { back, forward }, position };
}

export function goForward(history: NavigationHistory): { history: NavigationHistory; position?: CursorPosition } {
  if (history.forward.length === 0) return { history };
  const forward  = [...history.forward];
  const position = forward.pop()!;
  const back     = [...history.back, position].slice(-MAX_HISTORY);
  return { history: { back, forward }, position };
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  kind:  'file' | 'function' | 'class' | 'block';
  line:  number;
}

export function buildBreadcrumbs(
  filePath:  string,
  line:      number,
  symbols:   SymbolInfo[],
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];

  // File segment
  const parts = filePath.split('/');
  crumbs.push({ label: parts[parts.length - 1] ?? filePath, kind: 'file', line: 1 });

  // Find enclosing symbols (symbols defined before the cursor line)
  const enclosing = symbols
    .filter(s => s.line <= line && s.kind !== 'import' && s.kind !== 'const')
    .sort((a, b) => b.line - a.line);

  for (const sym of enclosing.slice(0, 3)) {
    crumbs.push({
      label: sym.name,
      kind:  sym.kind === 'class' ? 'class' : 'function',
      line:  sym.line,
    });
  }
  return crumbs;
}

// ── Go to definition ──────────────────────────────────────────────────────────

export function planGotoDefinition(
  symbolName:    string,
  cursorFile:    string,
  allSymbols:    Map<string, SymbolInfo[]>,
): CursorPosition | null {
  // Look in current file first
  const localSyms = allSymbols.get(cursorFile) ?? [];
  const local     = localSyms.find(s => s.name === symbolName && s.kind !== 'import');
  if (local) return { filePath: local.filePath, line: local.line, column: local.column };

  // Search all other files
  for (const [, symbols] of allSymbols) {
    const match = symbols.find(s => s.name === symbolName && s.isExport);
    if (match) return { filePath: match.filePath, line: match.line, column: match.column };
  }
  return null;
}

// ── Import resolver ───────────────────────────────────────────────────────────

export interface ImportResolution {
  importedName: string;
  resolvedPath: string | null;
  isExternal:   boolean;
}

export function resolveImportPaths(
  content:     string,
  currentFile: string,
  existingPaths: Set<string>,
): ImportResolution[] {
  const resolutions: ImportResolution[] = [];
  const importRegex = /import\s+.*?\bfrom\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(content)) !== null) {
    const spec = m[1];
    const isExternal = !spec.startsWith('.') && !spec.startsWith('/');
    let resolved: string | null = null;
    if (!isExternal) {
      const dir  = currentFile.split('/').slice(0, -1).join('/');
      const base = `${dir}/${spec}`.replace(/\/\//g, '/');
      const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`];
      resolved = candidates.find(c => existingPaths.has(c)) ?? null;
    }
    resolutions.push({ importedName: spec, resolvedPath: resolved, isExternal });
  }
  return resolutions;
}

// ── File navigation ───────────────────────────────────────────────────────────

export function buildFileQuickOpenList(
  paths: string[],
  query: string,
): string[] {
  if (!query) return paths.slice(0, 50);
  const q = query.toLowerCase();
  return paths
    .filter(p => p.toLowerCase().includes(q))
    .sort((a, b) => {
      const aName = a.split('/').pop()?.toLowerCase() ?? '';
      const bName = b.split('/').pop()?.toLowerCase() ?? '';
      const aExact = aName.startsWith(q) ? 0 : 1;
      const bExact = bName.startsWith(q) ? 0 : 1;
      return aExact - bExact || a.length - b.length;
    })
    .slice(0, 50);
}
