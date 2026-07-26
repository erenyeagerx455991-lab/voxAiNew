// ── V10.2 Completion Planner — Deterministic ─────────────────────────────────
//
// Plans autocomplete suggestions for TypeScript/JavaScript code.
// Zero LLM calls. Never throws.

import type { CompletionItem } from './manualWorkspaceTypes.js';
import type { SymbolInfo } from './manualWorkspaceTypes.js';

// ── Keyword completions ───────────────────────────────────────────────────────

const TS_KEYWORDS: CompletionItem[] = [
  'const', 'let', 'var', 'function', 'async', 'await', 'return', 'export',
  'import', 'from', 'default', 'class', 'extends', 'implements', 'interface',
  'type', 'enum', 'namespace', 'module', 'declare', 'abstract', 'readonly',
  'public', 'private', 'protected', 'static', 'override', 'new', 'this',
  'super', 'typeof', 'instanceof', 'keyof', 'infer', 'never', 'unknown',
  'void', 'null', 'undefined', 'true', 'false', 'if', 'else', 'for', 'while',
  'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
].map((kw, i) => ({
  label: kw, kind: 'keyword' as const, insertText: kw, sortOrder: 100 + i,
}));

// ── Snippet completions ───────────────────────────────────────────────────────

const TS_SNIPPETS: CompletionItem[] = [
  { label: 'rafce', kind: 'snippet', detail: 'React Arrow Function Component', insertText: 'const ${1:Component} = () => {\n  return (\n    <div>\n      ${2}\n    </div>\n  );\n};\n\nexport default ${1:Component};', sortOrder: 1 },
  { label: 'useState', kind: 'snippet', detail: 'React useState hook', insertText: 'const [${1:state}, set${1/(.+)/\\u$1/}] = useState${2:<${3:type}>}(${4:initialValue});', sortOrder: 2 },
  { label: 'useEffect', kind: 'snippet', detail: 'React useEffect hook', insertText: 'useEffect(() => {\n  ${1}\n  return () => {\n    ${2}\n  };\n}, [${3}]);', sortOrder: 3 },
  { label: 'interface', kind: 'snippet', detail: 'TypeScript interface', insertText: 'interface ${1:Name} {\n  ${2}\n}', sortOrder: 4 },
  { label: 'trycatch', kind: 'snippet', detail: 'Try/catch block', insertText: 'try {\n  ${1}\n} catch (error) {\n  ${2}\n}', sortOrder: 5 },
  { label: 'asyncfn', kind: 'snippet', detail: 'Async function', insertText: 'async function ${1:name}(${2}): Promise<${3:void}> {\n  ${4}\n}', sortOrder: 6 },
];

// ── Context-aware completion ───────────────────────────────────────────────────

export interface CompletionContext {
  prefix:         string;
  line:           number;
  column:         number;
  lineText:       string;
  triggerChar:    string;
  isInsideJSX:    boolean;
  isAfterDot:     boolean;
  currentWord:    string;
}

export function buildCompletionContext(
  content: string,
  line:    number,
  column:  number,
): CompletionContext {
  const lines = content.split('\n');
  const lineText   = lines[line - 1] ?? '';
  const prefix     = lineText.slice(0, column - 1);
  const triggerChar = prefix.slice(-1);
  const isAfterDot  = triggerChar === '.';
  const wordMatch   = prefix.match(/[\w$]+$/);
  const currentWord = wordMatch ? wordMatch[0] : '';
  const isInsideJSX = /<\w/.test(lineText) || /^\s+</.test(lineText);

  return { prefix, line, column, lineText, triggerChar, isInsideJSX, isAfterDot, currentWord };
}

export function getCompletions(
  ctx:     CompletionContext,
  symbols: SymbolInfo[],
  language: string,
): CompletionItem[] {
  const items: CompletionItem[] = [];
  const word = ctx.currentWord.toLowerCase();

  // Symbol completions
  for (let i = 0; i < symbols.length; i++) {
    const s = symbols[i];
    if (!s.name.toLowerCase().startsWith(word)) continue;
    items.push({
      label:      s.name,
      kind:       s.kind === 'function' ? 'function' : s.kind === 'class' ? 'class' : 'variable',
      detail:     `${s.kind} — ${s.filePath.split('/').pop()}`,
      insertText: s.name,
      sortOrder:  10 + i,
    });
  }

  // Keyword completions
  if (!ctx.isAfterDot && (language.includes('typescript') || language.includes('javascript'))) {
    for (const kw of TS_KEYWORDS) {
      if (kw.label.startsWith(word)) items.push(kw);
    }
  }

  // Snippet completions
  if (!ctx.isAfterDot && !ctx.isInsideJSX) {
    for (const snip of TS_SNIPPETS) {
      if (snip.label.startsWith(word)) items.push(snip);
    }
  }

  return items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 50);
}

// ── Hover info ────────────────────────────────────────────────────────────────

export interface HoverInfo {
  symbolName: string;
  kind:       string;
  definition: string;
  filePath:   string;
  line:       number;
}

export function getHoverInfo(
  symbolName: string,
  symbols:    SymbolInfo[],
): HoverInfo | null {
  const sym = symbols.find(s => s.name === symbolName);
  if (!sym) return null;
  return {
    symbolName: sym.name,
    kind:       sym.kind,
    definition: `(${sym.kind}) ${sym.name}`,
    filePath:   sym.filePath,
    line:       sym.line,
  };
}
