// ── V10.2 Refactor Planner — Deterministic ────────────────────────────────────
//
// Plans code refactoring operations: extract function, extract component,
// convert patterns, inline, move. Zero LLM calls. Never throws.

import type { EditRange } from './manualWorkspaceTypes.js';

export type RefactorKind =
  | 'extract-function'
  | 'extract-component'
  | 'inline-variable'
  | 'rename-symbol'
  | 'convert-to-arrow'
  | 'convert-to-named'
  | 'add-return-type'
  | 'extract-interface';

export interface RefactorProposal {
  kind:        RefactorKind;
  title:       string;
  description: string;
  applicable:  boolean;
  reason?:     string;
}

export interface RefactorEdit {
  filePath:    string;
  range:       EditRange;
  replacement: string;
  description: string;
}

// ── Applicability analysis ────────────────────────────────────────────────────

export function analyzeRefactorOpportunities(
  selection: string,
  language:  string,
): RefactorProposal[] {
  const proposals: RefactorProposal[] = [];
  const isTS = language.includes('typescript') || language.includes('javascript');
  if (!isTS) return proposals;

  const lines = selection.split('\n');
  const lineCount = lines.length;

  // Extract function
  proposals.push({
    kind:        'extract-function',
    title:       'Extract to function',
    description: 'Move selected code into a new named function',
    applicable:  lineCount >= 2,
    reason:      lineCount < 2 ? 'Selection too short' : undefined,
  });

  // Extract component
  const hasJSX = /<\w+/.test(selection);
  proposals.push({
    kind:        'extract-component',
    title:       'Extract to React component',
    description: 'Move selected JSX into a new React component',
    applicable:  hasJSX,
    reason:      !hasJSX ? 'No JSX found in selection' : undefined,
  });

  // Convert to arrow function
  const isNamedFn = /^function\s+\w+/.test(selection.trim());
  proposals.push({
    kind:        'convert-to-arrow',
    title:       'Convert to arrow function',
    description: 'Convert named function to arrow function expression',
    applicable:  isNamedFn,
    reason:      !isNamedFn ? 'Not a named function' : undefined,
  });

  // Add return type
  const isFnMissingReturnType = /function\s+\w+\s*\([^)]*\)\s*\{/.test(selection) &&
    !/function\s+\w+\s*\([^)]*\)\s*:\s*\w+/.test(selection);
  proposals.push({
    kind:        'add-return-type',
    title:       'Add return type annotation',
    description: 'Add explicit TypeScript return type',
    applicable:  isFnMissingReturnType,
    reason:      !isFnMissingReturnType ? 'Return type already present or not a function' : undefined,
  });

  // Extract interface
  const hasObjectLiteral = /\{[^}]+\}/.test(selection);
  proposals.push({
    kind:        'extract-interface',
    title:       'Extract to interface',
    description: 'Extract object shape into a TypeScript interface',
    applicable:  hasObjectLiteral && language.includes('typescript'),
    reason:      !hasObjectLiteral ? 'No object shape found' : undefined,
  });

  return proposals;
}

// ── Extract function ───────────────────────────────────────────────────────────

export function planExtractFunction(
  selection:    string,
  functionName: string,
  filePath:     string,
  insertLine:   number,
): RefactorEdit[] {
  if (!functionName || !selection.trim()) return [];

  const params    = extractFreeVariables(selection);
  const paramList = params.join(', ');
  const fnBody    = selection.split('\n').map(l => `  ${l}`).join('\n');

  const fnDefinition = `function ${functionName}(${paramList}) {\n${fnBody}\n}\n`;
  const callExpr     = `${functionName}(${paramList})`;

  return [
    {
      filePath,
      range: { startLine: insertLine, startColumn: 1, endLine: insertLine, endColumn: 1 },
      replacement: fnDefinition + '\n',
      description: `Insert extracted function "${functionName}"`,
    },
    {
      filePath,
      range: { startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 }, // caller fills exact range
      replacement: callExpr,
      description: `Replace selection with call to "${functionName}"`,
    },
  ];
}

function extractFreeVariables(code: string): string[] {
  // Heuristic: find identifiers that look like parameters
  const identifiers = code.match(/\b([a-z]\w*)\b/g) ?? [];
  const keywords = new Set(['const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'function', 'async', 'await', 'true', 'false', 'null', 'undefined']);
  return [...new Set(identifiers.filter(id => !keywords.has(id)))].slice(0, 5);
}

// ── Convert to arrow ───────────────────────────────────────────────────────────

export function planConvertToArrow(
  fnText: string,
): { ok: boolean; result?: string; error?: string } {
  const m = fnText.trim().match(/^(export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*([^{]+))?\s*\{([\s\S]*)\}$/);
  if (!m) return { ok: false, error: 'Not a recognizable named function' };

  const [, exportKw = '', asyncKw = '', name, params, returnType = '', body] = m;
  const rt = returnType.trim() ? `: ${returnType.trim()}` : '';
  const result = `${exportKw}${asyncKw}const ${name} = (${params})${rt} => {${body}};`;
  return { ok: true, result };
}

// ── Refactor prompt builder ────────────────────────────────────────────────────

export function buildRefactorAIPrompt(
  kind:      RefactorKind,
  code:      string,
  language:  string,
  options:   Record<string, string> = {},
): string {
  const instructions: Record<RefactorKind, string> = {
    'extract-function':    `Extract the selected code into a well-named function. Name: ${options.name ?? 'helper'}`,
    'extract-component':   `Extract the selected JSX into a new React component. Name: ${options.name ?? 'Component'}`,
    'inline-variable':     'Inline the variable — replace its reference with the direct value',
    'rename-symbol':       `Rename the symbol from "${options.oldName ?? ''}" to "${options.newName ?? ''}"`,
    'convert-to-arrow':    'Convert to an arrow function expression while preserving behavior',
    'convert-to-named':    'Convert the arrow function to a named function declaration',
    'add-return-type':     'Add an explicit TypeScript return type annotation',
    'extract-interface':   'Extract the object shape into a TypeScript interface',
  };

  return [
    `Language: ${language}`,
    `Refactor: ${instructions[kind]}`,
    '',
    'Code to refactor:',
    '```',
    code,
    '```',
    '',
    'Return ONLY the refactored code, no explanation.',
  ].join('\n');
}
