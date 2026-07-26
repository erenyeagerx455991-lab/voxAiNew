// ── V10.2 Selection Planner — Deterministic ──────────────────────────────────
//
// Plans code selections for partial AI edits (highlight → ask AI).
// Zero LLM calls. Never throws.

import type { TextSelection, EditRange } from './manualWorkspaceTypes.js';

export interface SelectionContext {
  selection:      TextSelection;
  surroundingCode: string;
  language:       string;
  isCompleteBlock: boolean;
  blockType:      'function' | 'class' | 'component' | 'expression' | 'statement' | 'unknown';
}

export function extractSelection(
  filePath: string,
  content: string,
  range: EditRange,
): TextSelection {
  const lines = content.split('\n');
  const selectedLines: string[] = [];
  for (let i = range.startLine - 1; i <= range.endLine - 1 && i < lines.length; i++) {
    const line = lines[i];
    if (i === range.startLine - 1 && i === range.endLine - 1) {
      selectedLines.push(line.slice(range.startColumn - 1, range.endColumn - 1));
    } else if (i === range.startLine - 1) {
      selectedLines.push(line.slice(range.startColumn - 1));
    } else if (i === range.endLine - 1) {
      selectedLines.push(line.slice(0, range.endColumn - 1));
    } else {
      selectedLines.push(line);
    }
  }
  return { filePath, range, text: selectedLines.join('\n') };
}

export function buildSelectionContext(
  selection: TextSelection,
  content: string,
  language: string,
): SelectionContext {
  const lines = content.split('\n');
  const contextStart = Math.max(0, selection.range.startLine - 6);
  const contextEnd   = Math.min(lines.length, selection.range.endLine + 5);
  const surroundingCode = lines.slice(contextStart, contextEnd).join('\n');
  const blockType = classifySelectionBlock(selection.text, language);
  const isCompleteBlock = blockType !== 'unknown';
  return { selection, surroundingCode, language, isCompleteBlock, blockType };
}

function classifySelectionBlock(
  text: string,
  language: string,
): SelectionContext['blockType'] {
  const trimmed = text.trim();
  const isTS = language.includes('typescript') || language.includes('javascript');
  if (!isTS) return 'unknown';

  if (/^(export\s+)?(default\s+)?function\s+\w+/.test(trimmed)) return 'function';
  if (/^(export\s+)?(default\s+)?(abstract\s+)?class\s+\w+/.test(trimmed)) return 'class';
  if (/^(export\s+)?(const|function)\s+\w+\s*[=(][\s\S]*</.test(trimmed)) return 'component';
  if (/^(const|let|var|return)/.test(trimmed)) return 'statement';
  if (/[=+\-*/]/.test(trimmed)) return 'expression';
  return 'unknown';
}

export function buildPartialAIEditPrompt(
  context: SelectionContext,
  instruction: string,
): string {
  return [
    `Language: ${context.language}`,
    `Block type: ${context.blockType}`,
    '',
    'Surrounding context:',
    '```',
    context.surroundingCode,
    '```',
    '',
    'Selected code to modify:',
    '```',
    context.selection.text,
    '```',
    '',
    `Instruction: ${instruction}`,
    '',
    'Rules:',
    '- Only modify the selected code',
    '- Preserve surrounding code exactly',
    '- Match existing code style',
    '- Return ONLY the replacement for the selected code',
  ].join('\n');
}

export function applySelectionEdit(
  content: string,
  selection: TextSelection,
  newText: string,
): string {
  const lines = content.split('\n');
  const { startLine, startColumn, endLine, endColumn } = selection.range;

  if (startLine === endLine) {
    const line = lines[startLine - 1] ?? '';
    lines[startLine - 1] =
      line.slice(0, startColumn - 1) + newText + line.slice(endColumn - 1);
  } else {
    const firstLine = lines[startLine - 1] ?? '';
    const lastLine  = lines[endLine - 1]   ?? '';
    const prefix = firstLine.slice(0, startColumn - 1);
    const suffix = lastLine.slice(endColumn - 1);
    const replacement = (prefix + newText + suffix).split('\n');
    lines.splice(startLine - 1, endLine - startLine + 1, ...replacement);
  }
  return lines.join('\n');
}

export function validateSelectionRange(
  content: string,
  range: EditRange,
): { valid: boolean; reason?: string } {
  const lines = content.split('\n');
  if (range.startLine < 1)                    return { valid: false, reason: 'startLine < 1' };
  if (range.endLine > lines.length)            return { valid: false, reason: 'endLine exceeds file length' };
  if (range.startLine > range.endLine)         return { valid: false, reason: 'startLine > endLine' };
  if (range.startLine === range.endLine && range.startColumn > range.endColumn)
                                               return { valid: false, reason: 'startColumn > endColumn on same line' };
  return { valid: true };
}
