// ── V10.2 Undo/Redo Planner — Deterministic ───────────────────────────────────
//
// Plans undo/redo stacks per file with configurable depth.
// Zero LLM calls. Never throws.

import type { WorkspaceEdit } from './manualWorkspaceTypes.js';

const MAX_STACK_DEPTH = 200;

export interface UndoRedoStack {
  filePath:  string;
  undoStack: WorkspaceEdit[];
  redoStack: WorkspaceEdit[];
}

export function createUndoRedoStack(filePath: string): UndoRedoStack {
  return { filePath, undoStack: [], redoStack: [] };
}

export function pushEdit(
  stack: UndoRedoStack,
  edit: WorkspaceEdit,
): UndoRedoStack {
  const undoStack = [...stack.undoStack, edit].slice(-MAX_STACK_DEPTH);
  return { ...stack, undoStack, redoStack: [] }; // redo cleared on new edit
}

export function planUndo(
  stack: UndoRedoStack,
): { stack: UndoRedoStack; edit?: WorkspaceEdit } {
  if (stack.undoStack.length === 0) return { stack };
  const undoStack = [...stack.undoStack];
  const edit = undoStack.pop()!;
  const redoStack = [...stack.redoStack, edit];
  return { stack: { ...stack, undoStack, redoStack }, edit };
}

export function planRedo(
  stack: UndoRedoStack,
): { stack: UndoRedoStack; edit?: WorkspaceEdit } {
  if (stack.redoStack.length === 0) return { stack };
  const redoStack = [...stack.redoStack];
  const edit = redoStack.pop()!;
  const undoStack = [...stack.undoStack, edit];
  return { stack: { ...stack, undoStack, redoStack }, edit };
}

export function clearHistory(stack: UndoRedoStack): UndoRedoStack {
  return { ...stack, undoStack: [], redoStack: [] };
}

export function getUndoRedoStatus(stack: UndoRedoStack): {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
} {
  return {
    canUndo:    stack.undoStack.length > 0,
    canRedo:    stack.redoStack.length > 0,
    undoCount:  stack.undoStack.length,
    redoCount:  stack.redoStack.length,
  };
}

export type UndoRedoStacks = Map<string, UndoRedoStack>;

export function getOrCreateStack(stacks: UndoRedoStacks, filePath: string): UndoRedoStack {
  if (!stacks.has(filePath)) {
    stacks.set(filePath, createUndoRedoStack(filePath));
  }
  return stacks.get(filePath)!;
}

export function recordEditInStack(
  stacks: UndoRedoStacks,
  edit: WorkspaceEdit,
): void {
  const existing = getOrCreateStack(stacks, edit.filePath);
  stacks.set(edit.filePath, pushEdit(existing, edit));
}
