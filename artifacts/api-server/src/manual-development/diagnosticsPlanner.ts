// ── V10.2 Diagnostics Planner — Deterministic ────────────────────────────────
//
// Plans diagnostic collection, deduplication, and severity scoring.
// Zero LLM calls. Never throws.

import type { DiagnosticItem, DiagnosticSeverity } from './manualWorkspaceTypes.js';

let _nextId = 1;
function nextId(): string { return `diag-${_nextId++}`; }

// ── Severity scoring ──────────────────────────────────────────────────────────

const SEVERITY_SCORE: Record<DiagnosticSeverity, number> = {
  error: 4, warning: 3, info: 2, hint: 1,
};

export function scoreDiagnostics(items: DiagnosticItem[]): number {
  if (items.length === 0) return 10;
  const errors   = items.filter(d => d.severity === 'error').length;
  const warnings = items.filter(d => d.severity === 'warning').length;
  const penalty  = errors * 2 + warnings * 0.5;
  return Math.max(0, Math.round((10 - Math.min(penalty, 10)) * 10) / 10);
}

// ── TypeScript error patterns ─────────────────────────────────────────────────

const TS_PATTERNS: Array<{ pattern: RegExp; message: string; severity: DiagnosticSeverity }> = [
  { pattern: /Cannot find name '(\w+)'/,         message: "Undefined identifier",        severity: 'error'   },
  { pattern: /Property '(\w+)' does not exist/,   message: "Unknown property",            severity: 'error'   },
  { pattern: /Type '(.+)' is not assignable to/,  message: "Type mismatch",               severity: 'error'   },
  { pattern: /Parameter '(\w+)' implicitly has/,  message: "Implicit any",                severity: 'warning' },
  { pattern: /is declared but its value is never read/, message: "Unused variable",        severity: 'hint'    },
  { pattern: /Cannot find module '(.+)'/,         message: "Missing module",              severity: 'error'   },
  { pattern: /'(\w+)' is possibly 'undefined'/,   message: "Possible undefined access",   severity: 'warning' },
];

export function parseTypeScriptErrors(
  filePath: string,
  compilerOutput: string,
): DiagnosticItem[] {
  const items: DiagnosticItem[] = [];
  const lineRegex = /\((\d+),(\d+)\):\s*(error|warning)\s+TS\d+:\s*(.+)/g;
  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(compilerOutput)) !== null) {
    items.push({
      id:       nextId(),
      filePath,
      line:     parseInt(match[1], 10),
      column:   parseInt(match[2], 10),
      severity: (match[3] as DiagnosticSeverity),
      message:  match[4].trim(),
      source:   'typescript',
    });
  }
  return items;
}

// ── Static heuristic lint ─────────────────────────────────────────────────────

export function runHeuristicLint(
  filePath: string,
  content: string,
  language: string,
): DiagnosticItem[] {
  if (!language.includes('typescript') && !language.includes('javascript')) return [];
  const items: DiagnosticItem[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const col  = line.indexOf('console.log');
    if (col >= 0) {
      items.push({
        id: nextId(), filePath, line: i + 1, column: col + 1,
        message: 'console.log left in code', severity: 'hint', source: 'eslint',
      });
    }
    if (/\bany\b/.test(line) && !line.trim().startsWith('//')) {
      const anyCol = line.indexOf('any');
      items.push({
        id: nextId(), filePath, line: i + 1, column: anyCol + 1,
        message: 'Avoid explicit "any" type', severity: 'warning', source: 'eslint',
      });
    }
    if (line.length > 200) {
      items.push({
        id: nextId(), filePath, line: i + 1, column: 1,
        message: `Line too long (${line.length} chars)`, severity: 'hint', source: 'prettier',
      });
    }
  }
  return items;
}

// ── Deduplication ─────────────────────────────────────────────────────────────

export function deduplicateDiagnostics(items: DiagnosticItem[]): DiagnosticItem[] {
  const seen = new Set<string>();
  return items.filter(d => {
    const key = `${d.filePath}:${d.line}:${d.column}:${d.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── File diagnostics ──────────────────────────────────────────────────────────

export function getDiagnosticsForFile(
  allDiagnostics: DiagnosticItem[],
  filePath: string,
): DiagnosticItem[] {
  return allDiagnostics.filter(d => d.filePath === filePath);
}

export function getSortedDiagnostics(items: DiagnosticItem[]): DiagnosticItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = SEVERITY_SCORE[b.severity] - SEVERITY_SCORE[a.severity];
    if (scoreDiff !== 0) return scoreDiff;
    if (a.filePath !== b.filePath) return a.filePath.localeCompare(b.filePath);
    return a.line - b.line;
  });
}

export function countBySeverity(items: DiagnosticItem[]): Record<DiagnosticSeverity, number> {
  return {
    error:   items.filter(d => d.severity === 'error').length,
    warning: items.filter(d => d.severity === 'warning').length,
    info:    items.filter(d => d.severity === 'info').length,
    hint:    items.filter(d => d.severity === 'hint').length,
  };
}
