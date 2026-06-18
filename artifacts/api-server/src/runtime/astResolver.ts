// ── V6.3-A: AST Dependency Intelligence ──────────────────────────────────────
// Replaces fragile regex-based dependency detection with a real AST-powered
// analysis engine using @babel/parser + @babel/traverse.
//
// RULES:
//   - AST is primary source of truth
//   - Regex remains fallback only (try AST → catch → regex fallback)
//   - No UI changes, no runtime scoring changes, no build pipeline changes

import { parse, type ParseResult } from '@babel/parser';
import _traverse from '@babel/traverse';
import type { File, Node } from '@babel/types';

// @babel/traverse ships as CJS default export; unwrap for ESM compat
const traverse = ((_traverse as unknown as { default: typeof _traverse }).default ?? _traverse) as typeof _traverse;

// ── Diagnostics (Phase 6) ────────────────────────────────────────────────────

export interface ASTDiagnostics {
  astSuccessCount: number;
  astFailureCount: number;
  regexFallbackCount: number;
}

const diagnostics: ASTDiagnostics = {
  astSuccessCount: 0,
  astFailureCount: 0,
  regexFallbackCount: 0,
};

export function getASTDiagnostics(): Readonly<ASTDiagnostics> {
  return { ...diagnostics };
}

export function resetASTDiagnostics(): void {
  diagnostics.astSuccessCount = 0;
  diagnostics.astFailureCount = 0;
  diagnostics.regexFallbackCount = 0;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ASTParseResult {
  success: boolean;
  ast?: ParseResult<File>;
  error?: string;
}

export interface ImportEntry {
  source: string;
  type: 'default' | 'named' | 'namespace' | 'dynamic';
  imports: string[];
}

export interface ImportsResult {
  imports: ImportEntry[];
}

export interface ExportsResult {
  defaultExport?: string;
  namedExports: string[];
}

export interface HooksResult {
  hooks: string[];
}

// ── Phase 1: AST Parse Layer ─────────────────────────────────────────────────

/**
 * Parse a source file into a Babel AST.
 * Never throws — returns { success: false, error } on any failure.
 */
export function parseFileAST(sourceCode: string): ASTParseResult {
  try {
    const ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
      strictMode: false,
    });
    diagnostics.astSuccessCount++;
    console.log('[AST_SUCCESS] Parsed file successfully');
    return { success: true, ast };
  } catch (err: unknown) {
    diagnostics.astFailureCount++;
    const error = err instanceof Error ? err.message : String(err);
    console.warn('[AST_FAILURE]', error);
    return { success: false, error };
  }
}

// ── Phase 2: Import Extraction ───────────────────────────────────────────────

/**
 * Extract all imports from source code using AST.
 * Handles: static, named, namespace, default, dynamic, lazy imports.
 * Falls back to regex on AST failure.
 */
export function extractImportsAST(sourceCode: string): ImportsResult {
  const result = parseFileAST(sourceCode);

  if (result.success && result.ast) {
    try {
      const imports: ImportEntry[] = [];

      traverse(result.ast, {
        // static: import X from 'y', import { a, b } from 'y', import * as Z from 'y'
        ImportDeclaration(path) {
          const source = path.node.source.value;
          const specifiers = path.node.specifiers;

          if (specifiers.length === 0) {
            // bare import: import 'y'
            imports.push({ source, type: 'named', imports: [] });
            return;
          }

          const defaultSpecs: string[] = [];
          const namedSpecs: string[] = [];
          const namespaceSpecs: string[] = [];

          for (const spec of specifiers) {
            if (spec.type === 'ImportDefaultSpecifier') {
              defaultSpecs.push(spec.local.name);
            } else if (spec.type === 'ImportNamespaceSpecifier') {
              namespaceSpecs.push(spec.local.name);
            } else if (spec.type === 'ImportSpecifier') {
              const imported = spec.imported;
              namedSpecs.push(imported.type === 'Identifier' ? imported.name : imported.value);
            }
          }

          if (namespaceSpecs.length > 0) {
            imports.push({ source, type: 'namespace', imports: namespaceSpecs });
          }
          if (defaultSpecs.length > 0) {
            imports.push({ source, type: 'default', imports: defaultSpecs });
          }
          if (namedSpecs.length > 0) {
            imports.push({ source, type: 'named', imports: namedSpecs });
          }
        },

        // dynamic: import('./Foo') — Babel v8 uses ImportExpression node (not CallExpression)
        // This covers both top-level `import('x')` and `lazy(() => import('x'))` patterns
        ImportExpression(path) {
          const src = path.node.source;
          if (src.type === 'StringLiteral') {
            imports.push({ source: src.value, type: 'dynamic', imports: [] });
          } else if (src.type === 'TemplateLiteral') {
            // template literal dynamic imports — source is opaque but we record it
            imports.push({ source: '(template literal)', type: 'dynamic', imports: [] });
          }
        },
      });

      return { imports };
    } catch (err) {
      console.warn('[REGEX_FALLBACK_USED] extractImportsAST traverse failed:', err);
      diagnostics.regexFallbackCount++;
      return extractImportsFallback(sourceCode);
    }
  }

  // Phase 7: regex fallback
  console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for imports');
  diagnostics.regexFallbackCount++;
  return extractImportsFallback(sourceCode);
}

function extractImportsFallback(sourceCode: string): ImportsResult {
  const imports: ImportEntry[] = [];
  const staticRe = /import\s+(?:type\s+)?(?:(\{[^}]*\})|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = staticRe.exec(sourceCode)) !== null) {
    const source = m[4]!;
    if (m[1]) {
      const names = m[1].replace(/[{}]/g, '').split(',').map(s => s.trim().replace(/\s+as\s+\w+/, '')).filter(Boolean);
      imports.push({ source, type: 'named', imports: names });
    } else if (m[2]) {
      imports.push({ source, type: 'namespace', imports: [m[2]] });
    } else if (m[3]) {
      imports.push({ source, type: 'default', imports: [m[3]] });
    }
  }
  const dynRe = /(?:require|import)\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = dynRe.exec(sourceCode)) !== null) {
    if (m[1]) imports.push({ source: m[1], type: 'dynamic', imports: [] });
  }
  return { imports };
}

// ── Phase 3: Export Extraction ───────────────────────────────────────────────

/**
 * Extract all exports from source code using AST.
 * Falls back to regex on AST failure.
 */
export function extractExportsAST(sourceCode: string): ExportsResult {
  const result = parseFileAST(sourceCode);

  if (result.success && result.ast) {
    try {
      let defaultExport: string | undefined;
      const namedExports: string[] = [];

      traverse(result.ast, {
        ExportDefaultDeclaration(path) {
          const decl = path.node.declaration;
          if (decl.type === 'FunctionDeclaration' && decl.id) {
            defaultExport = decl.id.name;
          } else if (decl.type === 'ClassDeclaration' && decl.id) {
            defaultExport = decl.id.name;
          } else if (decl.type === 'Identifier') {
            defaultExport = decl.name;
          } else {
            defaultExport = '__default__';
          }
        },

        ExportNamedDeclaration(path) {
          const decl = path.node.declaration;
          if (!decl) {
            // export { a, b }
            for (const spec of path.node.specifiers) {
              if (spec.type === 'ExportSpecifier') {
                const exported = spec.exported;
                namedExports.push(exported.type === 'Identifier' ? exported.name : exported.value);
              }
            }
            return;
          }

          if (decl.type === 'VariableDeclaration') {
            for (const vd of decl.declarations) {
              if (vd.id.type === 'Identifier') namedExports.push(vd.id.name);
            }
          } else if (
            (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') &&
            decl.id
          ) {
            namedExports.push(decl.id.name);
          }
        },
      });

      return { defaultExport, namedExports };
    } catch (err) {
      console.warn('[REGEX_FALLBACK_USED] extractExportsAST traverse failed:', err);
      diagnostics.regexFallbackCount++;
      return extractExportsFallback(sourceCode);
    }
  }

  console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for exports');
  diagnostics.regexFallbackCount++;
  return extractExportsFallback(sourceCode);
}

function extractExportsFallback(sourceCode: string): ExportsResult {
  let defaultExport: string | undefined;
  const namedExports: string[] = [];

  const defRe = /export\s+default\s+(?:function|class)?\s*([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let m = defRe.exec(sourceCode);
  if (m && m[1]) defaultExport = m[1];

  const namedRe = /export\s+(?:const|function|class|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;
  let n: RegExpExecArray | null;
  while ((n = namedRe.exec(sourceCode)) !== null) {
    if (n[1]) namedExports.push(n[1]);
  }
  return { defaultExport, namedExports };
}

// ── Phase 4: Hook Extraction ─────────────────────────────────────────────────

const HOOK_PATTERN = /^use[A-Z]/;

/**
 * Extract all React hooks (built-in + custom) from source code using AST.
 * Correctly handles React.useState(), custom hooks, ignores strings/comments.
 * Falls back to regex on AST failure.
 */
export function extractHooksAST(sourceCode: string): HooksResult {
  const result = parseFileAST(sourceCode);

  if (result.success && result.ast) {
    try {
      const hooks = new Set<string>();

      traverse(result.ast, {
        CallExpression(path) {
          const callee = path.node.callee;

          // useState(), useEffect(), useAuth(), etc.
          if (callee.type === 'Identifier' && HOOK_PATTERN.test(callee.name)) {
            hooks.add(callee.name);
            return;
          }

          // React.useState(), React.useEffect(), etc.
          if (
            callee.type === 'MemberExpression' &&
            callee.object.type === 'Identifier' &&
            callee.object.name === 'React' &&
            callee.property.type === 'Identifier' &&
            HOOK_PATTERN.test(callee.property.name)
          ) {
            hooks.add(`React.${callee.property.name}`);
          }
        },
      });

      return { hooks: [...hooks] };
    } catch (err) {
      console.warn('[REGEX_FALLBACK_USED] extractHooksAST traverse failed:', err);
      diagnostics.regexFallbackCount++;
      return extractHooksFallback(sourceCode);
    }
  }

  console.warn('[REGEX_FALLBACK_USED] AST parse failed, falling back to regex for hooks');
  diagnostics.regexFallbackCount++;
  return extractHooksFallback(sourceCode);
}

function extractHooksFallback(sourceCode: string): HooksResult {
  const hooks = new Set<string>();
  const re = /\b(use[A-Z][A-Za-z0-9_]*)\s*[(<]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sourceCode)) !== null) {
    if (m[1]) hooks.add(m[1]);
  }
  // React.useX()
  const reactRe = /React\.(use[A-Z][A-Za-z0-9_]*)\s*[(<]/g;
  while ((m = reactRe.exec(sourceCode)) !== null) {
    if (m[1]) hooks.add(`React.${m[1]}`);
  }
  return { hooks: [...hooks] };
}

// ── Phase 5: Validation (Known Regex Failure Cases) ──────────────────────────

export interface ValidationCase {
  name: string;
  passed: boolean;
  details: string;
}

export interface ValidationReport {
  allPassed: boolean;
  cases: ValidationCase[];
}

export function runASTValidation(): ValidationReport {
  const cases: ValidationCase[] = [];

  // Case 1: multiline imports
  {
    const code = `import {
  useState,
  useEffect,
  useCallback
} from "react";`;
    const result = extractImportsAST(code);
    const named = result.imports.find(i => i.source === 'react' && i.type === 'named');
    const passed = !!named && named.imports.includes('useState') && named.imports.includes('useEffect') && named.imports.includes('useCallback');
    cases.push({ name: 'Case 1: multiline imports', passed, details: passed ? `Extracted: ${named?.imports.join(', ')}` : 'Failed to extract multiline imports' });
  }

  // Case 2: dynamic imports
  {
    const code = `const Page = React.lazy(() => import('./pages/Dashboard'));
const Other = await import('./utils');`;
    const result = extractImportsAST(code);
    const dynamics = result.imports.filter(i => i.type === 'dynamic');
    const passed = dynamics.some(i => i.source.includes('Dashboard'));
    cases.push({ name: 'Case 2: dynamic imports', passed, details: passed ? `Found dynamic: ${dynamics.map(d => d.source).join(', ')}` : 'Failed to detect dynamic imports' });
  }

  // Case 3: namespace imports
  {
    const code = `import * as Icons from "lucide-react";
import * as R from "react";`;
    const result = extractImportsAST(code);
    const ns = result.imports.filter(i => i.type === 'namespace');
    const passed = ns.some(i => i.source === 'lucide-react') && ns.some(i => i.source === 'react');
    cases.push({ name: 'Case 3: namespace imports', passed, details: passed ? `Found namespace: ${ns.map(n => n.source).join(', ')}` : 'Failed to detect namespace imports' });
  }

  // Case 4: React.useState()
  {
    const code = `function App() {
  const [count, setCount] = React.useState(0);
  const ref = React.useRef(null);
  return <div>{count}</div>;
}`;
    const result = extractHooksAST(code);
    const passed = result.hooks.includes('React.useState') && result.hooks.includes('React.useRef');
    cases.push({ name: 'Case 4: React.useState() member expression', passed, details: passed ? `Found: ${result.hooks.join(', ')}` : `Found only: ${result.hooks.join(', ')}` });
  }

  // Case 5: custom hooks
  {
    const code = `function Dashboard() {
  const user = useAuth();
  const data = useUser();
  const theme = useTheme();
  return <div />;
}`;
    const result = extractHooksAST(code);
    const passed = result.hooks.includes('useAuth') && result.hooks.includes('useUser') && result.hooks.includes('useTheme');
    cases.push({ name: 'Case 5: custom hooks', passed, details: passed ? `Found: ${result.hooks.join(', ')}` : `Found only: ${result.hooks.join(', ')}` });
  }

  const allPassed = cases.every(c => c.passed);
  return { allPassed, cases };
}

// ── Migration Report ─────────────────────────────────────────────────────────

export interface MigrationReport {
  parserImplementation: string;
  supportedSyntax: string[];
  knownLimitations: string[];
  fallbackBehavior: string;
  validationResults: ValidationReport;
  diagnostics: ASTDiagnostics;
}

export function generateMigrationReport(): MigrationReport {
  resetASTDiagnostics();
  const validationResults = runASTValidation();

  return {
    parserImplementation: '@babel/parser v8 + @babel/traverse v8 — sourceType: module, plugins: [jsx, typescript]',
    supportedSyntax: [
      'static imports (default, named, namespace)',
      'multiline named imports',
      'dynamic import() expressions',
      'React.lazy(() => import(...)) patterns',
      'export default (function, class, identifier)',
      'export const / function / class',
      'export { a, b } re-exports',
      'React hooks (useState, useEffect, useMemo, useCallback, etc.)',
      'React.useX() member expression hooks',
      'custom hooks (useAuth, useUser, etc.)',
      '.ts / .tsx / .js / .jsx source files',
    ],
    knownLimitations: [
      'Conditional re-exports (export { x } from "y" if ...) not supported by Babel spec',
      'eval() or Function() based dynamic imports undetectable',
      'Template literal dynamic imports: import(`${path}`) tracked as dynamic but source is opaque',
      'CommonJS require() caught by fallback regex only',
    ],
    fallbackBehavior: 'On any AST parse or traverse failure, each extractor transparently falls back to regex patterns. regexFallbackCount is incremented and [REGEX_FALLBACK_USED] is logged. Build process is never interrupted.',
    validationResults,
    diagnostics: getASTDiagnostics(),
  };
}
