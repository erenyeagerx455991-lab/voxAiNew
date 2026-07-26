// ── V10.2 Cursor Planner — Deterministic ─────────────────────────────────────
//
// Plans cursor movement, multi-cursor support, and cursor state management.
// Zero LLM calls. Never throws.

import type { CursorPosition, EditRange } from './manualWorkspaceTypes.js';

export interface CursorState {
  primary:    CursorPosition;
  secondary:  CursorPosition[];
  history:    CursorPosition[];
  maxHistory: number;
}

export function createCursorState(filePath: string): CursorState {
  return {
    primary:    { filePath, line: 1, column: 1 },
    secondary:  [],
    history:    [],
    maxHistory: 100,
  };
}

export function moveCursor(
  state: CursorState,
  newPosition: CursorPosition,
): CursorState {
  const history = [state.primary, ...state.history].slice(0, state.maxHistory);
  return { ...state, primary: newPosition, history };
}

export function addSecondaryCursor(
  state: CursorState,
  position: CursorPosition,
): CursorState {
  const existing = state.secondary.some(
    c => c.filePath === position.filePath && c.line === position.line && c.column === position.column,
  );
  if (existing) return state;
  return { ...state, secondary: [...state.secondary, position] };
}

export function clearSecondaryCursors(state: CursorState): CursorState {
  return { ...state, secondary: [] };
}

export function gotoLine(state: CursorState, line: number, column = 1): CursorState {
  if (line < 1 || column < 1) return state;
  return moveCursor(state, { filePath: state.primary.filePath, line, column });
}

export function cursorWordBoundary(
  content: string,
  line: number,
  column: number,
  direction: 'left' | 'right',
): { line: number; column: number } {
  const lines = content.split('\n');
  const lineText = lines[line - 1] ?? '';
  const pos = column - 1;
  if (direction === 'right') {
    const rest = lineText.slice(pos);
    const match = rest.match(/^\W*\w+/);
    const jump = match ? match[0].length : lineText.length - pos;
    return { line, column: Math.min(column + jump, lineText.length + 1) };
  } else {
    const before = lineText.slice(0, pos);
    const match = before.match(/\w+\W*$/);
    const jump = match ? match[0].length : pos;
    return { line, column: Math.max(column - jump, 1) };
  }
}

export function getCursorLineContext(
  content: string,
  line: number,
  contextLines = 3,
): { before: string[]; current: string; after: string[] } {
  const lines = content.split('\n');
  const idx = line - 1;
  const before = lines.slice(Math.max(0, idx - contextLines), idx);
  const current = lines[idx] ?? '';
  const after = lines.slice(idx + 1, idx + 1 + contextLines);
  return { before, current, after };
}

export function rangeContainsCursor(range: EditRange, cursor: CursorPosition): boolean {
  const { startLine, startColumn, endLine, endColumn } = range;
  if (cursor.line < startLine || cursor.line > endLine) return false;
  if (cursor.line === startLine && cursor.column < startColumn) return false;
  if (cursor.line === endLine   && cursor.column > endColumn)   return false;
  return true;
}
