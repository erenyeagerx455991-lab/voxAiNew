// ── V10.2 Symbol Planner — Deterministic ─────────────────────────────────────
//
// Plans symbol extraction, lookup, and rename operations across files.
// Zero LLM calls. Never throws.

import type { SymbolInfo, SymbolReference } from './manualWorkspaceTypes.js';

// ── Symbol extraction ─────────────────────────────────────────────────────────

export function extractSymbols(
  filePath: string,
  content:  string,
): SymbolInfo[] {
  const symbols: SymbolInfo[] = [];
  const lines = content.split('\n');

  const patterns: Array<{ pattern: RegExp; kind: SymbolInfo['kind'] }> = [
    { pattern: /^export\s+(async\s+)?function\s+(\w+)/, kind: 'function' },
    { pattern: /^export\s+const\s+(\w+)\s*=\s*(async\s+)?\(/, kind: 'function' },
    { pattern: /^export\s+const\s+(\w+)\s*=\s*(async\s+)?\w+ =>/, kind: 'function' },
    { pattern: /^export\s+(default\s+)?(abstract\s+)?class\s+(\w+)/, kind: 'class' },
    { pattern: /^export\s+(type|interface)\s+(\w+)/, kind: 'type' },
    { pattern: /^export\s+const\s+(\w+)\s*(?::\s*[\w<>[\]|,\s]+)?\s*=/, kind: 'const' },
    { pattern: /^(async\s+)?function\s+(\w+)/, kind: 'function' },
    { pattern: /^const\s+(\w+)\s*=/, kind: 'const' },
    { pattern: /^class\s+(\w+)/, kind: 'class' },
    { pattern: /^import\s+.*\bfrom\s+['"]([^'"]+)['"]/, kind: 'import' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const { pattern, kind } of patterns) {
      const m = line.match(pattern);
      if (!m) continue;
      // extract last capture group that looks like an identifier
      const name = [...m].reverse().find(g => g && /^\w+$/.test(g) && g !== 'async' && g !== 'default' && g !== 'abstract');
      if (!name) continue;
      const isExport = line.startsWith('export');
      symbols.push({ name, kind, filePath, line: i + 1, column: 1, isExport });
      break;
    }
  }
  return symbols;
}

// ── Find references ───────────────────────────────────────────────────────────

export function findReferences(
  symbolName: string,
  files: Map<string, { content: string }>,
): SymbolReference[] {
  const refs: SymbolReference[] = [];
  const pattern = new RegExp(`\\b${symbolName}\\b`, 'g');

  for (const [filePath, { content }] of files) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(lines[i])) !== null) {
        refs.push({
          symbol: { name: symbolName, kind: 'variable', filePath, line: i + 1, column: m.index + 1, isExport: false },
          location: { filePath, line: i + 1, column: m.index + 1 },
        });
      }
    }
  }
  return refs;
}

// ── Rename symbol ─────────────────────────────────────────────────────────────

export interface RenameEdit {
  filePath:  string;
  line:      number;
  column:    number;
  oldText:   string;
  newText:   string;
}

export function planRenameSymbol(
  oldName:   string,
  newName:   string,
  files: Map<string, { content: string }>,
): { edits: RenameEdit[]; affectedFiles: string[] } {
  if (!newName || !oldName || oldName === newName) return { edits: [], affectedFiles: [] };
  if (!/^\w+$/.test(newName)) return { edits: [], affectedFiles: [] };

  const refs = findReferences(oldName, files);
  const edits: RenameEdit[] = refs.map(r => ({
    filePath: r.location.filePath,
    line:     r.location.line,
    column:   r.location.column,
    oldText:  oldName,
    newText:  newName,
  }));
  const affectedFiles = [...new Set(edits.map(e => e.filePath))];
  return { edits, affectedFiles };
}

export function applyRenameEdits(
  content: string,
  edits: RenameEdit[],
): string {
  const pattern = new RegExp(`\\b${edits[0]?.oldText ?? '__'}\\b`, 'g');
  return content.replace(pattern, edits[0]?.newText ?? '');
}

// ── Symbol lookup ─────────────────────────────────────────────────────────────

export function findSymbolDefinition(
  symbolName: string,
  symbols: SymbolInfo[],
): SymbolInfo | undefined {
  return symbols.find(s => s.name === symbolName && s.isExport)
      ?? symbols.find(s => s.name === symbolName);
}

export function getFileOutline(symbols: SymbolInfo[]): SymbolInfo[] {
  return symbols
    .filter(s => s.kind !== 'import')
    .sort((a, b) => a.line - b.line);
}
