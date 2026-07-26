// ── V10.2 Lint Planner — Deterministic ───────────────────────────────────────
//
// Plans static lint checks for TypeScript/JavaScript code.
// Zero LLM calls. Never throws.

import type { DiagnosticItem } from './manualWorkspaceTypes.js';

let _nextId = 1;
function nextId(): string { return `lint-${_nextId++}`; }

export interface LintRule {
  id:          string;
  name:        string;
  severity:    'error' | 'warning' | 'hint';
  check:       (line: string, lineNum: number, filePath: string) => DiagnosticItem | null;
}

export interface LintResult {
  filePath:    string;
  diagnostics: DiagnosticItem[];
  passedRules: number;
  failedRules: number;
  score:       number;
}

// ── Built-in rules ────────────────────────────────────────────────────────────

export const LINT_RULES: LintRule[] = [
  {
    id: 'no-console', name: 'No console.log', severity: 'hint',
    check: (line, lineNum, filePath) => {
      const col = line.indexOf('console.log');
      if (col < 0 || line.trim().startsWith('//')) return null;
      return { id: nextId(), filePath, line: lineNum, column: col + 1, message: 'No console.log', severity: 'hint', source: 'eslint' };
    },
  },
  {
    id: 'no-explicit-any', name: 'No explicit any', severity: 'warning',
    check: (line, lineNum, filePath) => {
      if (!/ any[,; )\]>]/.test(line) || line.trim().startsWith('//')) return null;
      const col = line.indexOf(' any');
      return { id: nextId(), filePath, line: lineNum, column: col + 1, message: 'Avoid explicit "any"', severity: 'warning', source: 'eslint' };
    },
  },
  {
    id: 'no-var', name: 'No var declaration', severity: 'warning',
    check: (line, lineNum, filePath) => {
      if (!/\bvar\s+\w/.test(line) || line.trim().startsWith('//')) return null;
      const col = line.indexOf('var');
      return { id: nextId(), filePath, line: lineNum, column: col + 1, message: 'Use const or let instead of var', severity: 'warning', source: 'eslint' };
    },
  },
  {
    id: 'max-line-length', name: 'Max line length 180', severity: 'hint',
    check: (line, lineNum, filePath) => {
      if (line.length <= 180) return null;
      return { id: nextId(), filePath, line: lineNum, column: 181, message: `Line too long (${line.length})`, severity: 'hint', source: 'prettier' };
    },
  },
  {
    id: 'no-debugger', name: 'No debugger', severity: 'error',
    check: (line, lineNum, filePath) => {
      if (!/\bdebugger\b/.test(line) || line.trim().startsWith('//')) return null;
      const col = line.indexOf('debugger');
      return { id: nextId(), filePath, line: lineNum, column: col + 1, message: 'Remove debugger statement', severity: 'error', source: 'eslint' };
    },
  },
  {
    id: 'no-todo-fixme', name: 'No TODO/FIXME in prod code', severity: 'hint',
    check: (line, lineNum, filePath) => {
      if (!/\b(TODO|FIXME|HACK)\b/.test(line)) return null;
      const col = Math.max(line.indexOf('TODO'), line.indexOf('FIXME'), line.indexOf('HACK'));
      return { id: nextId(), filePath, line: lineNum, column: col + 1, message: 'Unresolved TODO/FIXME', severity: 'hint', source: 'eslint' };
    },
  },
];

// ── Run lint ──────────────────────────────────────────────────────────────────

export function runLint(
  filePath:  string,
  content:   string,
  ruleIds?:  string[],
): LintResult {
  const rules = ruleIds
    ? LINT_RULES.filter(r => ruleIds.includes(r.id))
    : LINT_RULES;

  const lines = content.split('\n');
  const diagnostics: DiagnosticItem[] = [];
  let passedRules = 0;
  let failedRules = 0;

  for (const rule of rules) {
    let failed = false;
    for (let i = 0; i < lines.length; i++) {
      const result = rule.check(lines[i], i + 1, filePath);
      if (result) { diagnostics.push(result); failed = true; }
    }
    if (failed) failedRules++; else passedRules++;
  }

  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warnCount  = diagnostics.filter(d => d.severity === 'warning').length;
  const penalty    = errorCount * 2 + warnCount * 0.5;
  const score      = Math.max(0, Math.round((10 - Math.min(penalty, 10)) * 10) / 10);

  return { filePath, diagnostics, passedRules, failedRules, score };
}

export function runLintOnFiles(
  files: Array<{ filePath: string; content: string }>,
): LintResult[] {
  return files.map(f => runLint(f.filePath, f.content));
}

export function aggregateLintScore(results: LintResult[]): number {
  if (results.length === 0) return 10;
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  return Math.round(avg * 10) / 10;
}
