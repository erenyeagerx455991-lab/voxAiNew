// ── V10.2 Formatter Planner — Deterministic ──────────────────────────────────
//
// Plans code formatting operations and detects coding style preferences.
// Zero LLM calls. Never throws.

import type { CodingStylePrefs } from './manualWorkspaceTypes.js';

// ── Style detection ───────────────────────────────────────────────────────────

export function detectCodingStyle(samples: string[]): CodingStylePrefs {
  const all = samples.join('\n');
  const lines = all.split('\n').filter(l => l.trim() !== '');

  // indentation
  let spacesCount = 0, tabsCount = 0;
  const indentSizes: number[] = [];
  for (const line of lines) {
    if (line.startsWith('\t')) { tabsCount++; continue; }
    const match = line.match(/^( +)/);
    if (match) { spacesCount++; indentSizes.push(match[1].length); }
  }
  const indentation = tabsCount > spacesCount ? 'tabs' : 'spaces';
  const indentSize   = indentation === 'spaces' && indentSizes.length > 0
    ? (indentSizes.sort((a, b) => a - b)[Math.floor(indentSizes.length / 2)] ?? 2)
    : 2;

  // quotes
  const singleCount = (all.match(/'/g) ?? []).length;
  const doubleCount = (all.match(/"/g) ?? []).length;
  const quotes: 'single' | 'double' = singleCount >= doubleCount ? 'single' : 'double';

  // semicolons
  const stmtLines = lines.filter(l => /[^\s{}()]$/.test(l));
  const semiCount = stmtLines.filter(l => l.trimEnd().endsWith(';')).length;
  const semicolons = stmtLines.length === 0 || semiCount / stmtLines.length > 0.5;

  // trailing commas
  const trailingCommaCount = (all.match(/,\s*\n\s*[}\]]/g) ?? []).length;
  const noTrailingCommaCount = (all.match(/[^,]\s*\n\s*[}\]]/g) ?? []).length;
  const trailingCommas = trailingCommaCount > noTrailingCommaCount;

  // line ending
  const lineEnding: 'lf' | 'crlf' = all.includes('\r\n') ? 'crlf' : 'lf';

  // max line length
  const lineLengths = lines.map(l => l.length).sort((a, b) => a - b);
  const p95 = lineLengths[Math.floor(lineLengths.length * 0.95)] ?? 80;
  const maxLineLength = Math.max(80, Math.min(p95, 200));

  return { indentation, indentSize, quotes, semicolons, trailingCommas, lineEnding, maxLineLength };
}

// ── Format operations ─────────────────────────────────────────────────────────

export function normalizeIndentation(
  content: string,
  prefs: Pick<CodingStylePrefs, 'indentation' | 'indentSize'>,
): string {
  const lines = content.split('\n');
  return lines.map(line => {
    const match = line.match(/^(\s*)/);
    if (!match || match[1] === '') return line;
    const raw = match[1];
    const spaces = raw.replace(/\t/g, '    ');
    const depth  = Math.floor(spaces.length / 4) || Math.floor(spaces.length / prefs.indentSize);
    const indent = prefs.indentation === 'tabs'
      ? '\t'.repeat(depth)
      : ' '.repeat(depth * prefs.indentSize);
    return indent + line.trimStart();
  }).join('\n');
}

export function normalizeQuotes(
  content: string,
  style: 'single' | 'double',
): string {
  const from = style === 'single' ? /(?<!\\)"/g  : /(?<!\\)'/g;
  const to   = style === 'single' ? "'"          : '"';
  // Simple heuristic: only replace in non-template-literal, non-comment contexts
  return content.replace(from, to);
}

export function ensureTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : content + '\n';
}

export function trimTrailingWhitespace(content: string): string {
  return content.split('\n').map(l => l.trimEnd()).join('\n');
}

export function formatContent(
  content: string,
  prefs: CodingStylePrefs,
): string {
  let result = normalizeIndentation(content, prefs);
  result = trimTrailingWhitespace(result);
  result = ensureTrailingNewline(result);
  return result;
}

// ── Format diff ───────────────────────────────────────────────────────────────

export interface FormatChange {
  line:    number;
  before:  string;
  after:   string;
  type:    'indent' | 'whitespace' | 'newline';
}

export function computeFormatDiff(
  original: string,
  formatted: string,
): FormatChange[] {
  const origLines = original.split('\n');
  const fmtLines  = formatted.split('\n');
  const changes: FormatChange[] = [];
  const maxLen = Math.max(origLines.length, fmtLines.length);

  for (let i = 0; i < maxLen; i++) {
    const before = origLines[i] ?? '';
    const after  = fmtLines[i]  ?? '';
    if (before === after) continue;
    const type = before.trimStart() !== after.trimStart() ? 'newline'
               : before.trimEnd()   !== after.trimEnd()   ? 'whitespace'
               : 'indent';
    changes.push({ line: i + 1, before, after, type });
  }
  return changes;
}
