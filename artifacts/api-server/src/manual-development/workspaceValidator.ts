// ── V10.2 Workspace Validator — Deterministic ─────────────────────────────────
//
// Validates workspace integrity: imports, exports, circular deps, type errors.
// Zero LLM calls. Never throws.

import type { WorkspaceFile, DiagnosticItem } from './manualWorkspaceTypes.js';
import { extractImports, separateExternalImports, detectCircularDependencies } from './dependencyPlanner.js';
import { runHeuristicLint } from './diagnosticsPlanner.js';

export interface WorkspaceValidationResult {
  valid:              boolean;
  healthScore:        number;
  brokenImports:      BrokenImport[];
  unusedFiles:        string[];
  circularDeps:       string[][];
  diagnostics:        DiagnosticItem[];
  missingDeps:        string[];
  totalIssues:        number;
  criticalIssues:     number;
  contextString:      string;
}

export interface BrokenImport {
  filePath:    string;
  importPath:  string;
  line:        number;
  type:        'local' | 'external';
}

// ── Import validation ─────────────────────────────────────────────────────────

export function validateImports(
  files:         Map<string, WorkspaceFile>,
  externalDeps:  Set<string>,
): BrokenImport[] {
  const broken: BrokenImport[] = [];
  const filePaths = new Set(files.keys());

  for (const [filePath, file] of files) {
    if (file.isDeleted) continue;
    const imports = extractImports(file.content);
    const { external, local } = separateExternalImports(imports);

    // Check local imports
    for (const imp of local) {
      const dir  = filePath.split('/').slice(0, -1).join('/');
      const raw  = dir ? `${dir}/${imp}` : imp;
      // Normalize: collapse /./  and strip leading ./
      const base = raw.replace(/\/\.\//g, '/').replace(/^\.\//g, '').replace(/\/\//g, '/');
      const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}/index.ts`, `${base}/index.tsx`];
      const exists = candidates.some(c => filePaths.has(c));
      if (!exists) {
        // Find line number
        const lineNum = file.content.split('\n').findIndex(l => l.includes(`'${imp}'`) || l.includes(`"${imp}"`)) + 1;
        broken.push({ filePath, importPath: imp, line: Math.max(1, lineNum), type: 'local' });
      }
    }

    // Check external imports
    for (const imp of external) {
      const pkgName = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
      if (pkgName && !externalDeps.has(pkgName)) {
        const lineNum = file.content.split('\n').findIndex(l => l.includes(`'${imp}'`) || l.includes(`"${imp}"`)) + 1;
        broken.push({ filePath, importPath: imp, line: Math.max(1, lineNum), type: 'external' });
      }
    }
  }
  return broken;
}

// ── Unused file detection ─────────────────────────────────────────────────────

export function findUnusedFiles(files: Map<string, WorkspaceFile>): string[] {
  const allPaths = new Set(files.keys());
  const referenced = new Set<string>();

  for (const [filePath, file] of files) {
    if (file.isDeleted) continue;
    const dir     = filePath.split('/').slice(0, -1).join('/');
    const imports = extractImports(file.content);
    const { local } = separateExternalImports(imports);

    for (const imp of local) {
      const base = `${dir}/${imp}`.replace(/\/\//g, '/');
      for (const p of allPaths) {
        if (p.startsWith(base)) referenced.add(p);
      }
    }
  }

  // Entry points are always referenced
  const entryPoints = ['src/index.ts', 'src/index.tsx', 'src/main.ts', 'src/main.tsx', 'src/App.tsx', 'index.ts'];
  for (const e of entryPoints) referenced.add(e);

  return [...allPaths].filter(p => !referenced.has(p) && !files.get(p)?.isDeleted);
}

// ── Circular dependency detection ─────────────────────────────────────────────

export function buildImportMap(files: Map<string, WorkspaceFile>): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [filePath, file] of files) {
    if (file.isDeleted) continue;
    const imports = extractImports(file.content);
    const { local } = separateExternalImports(imports);
    map.set(filePath, local.map(imp => {
      const dir = filePath.split('/').slice(0, -1).join('/');
      return `${dir}/${imp}`.replace(/\/\//g, '/');
    }));
  }
  return map;
}

// ── Full workspace validation ─────────────────────────────────────────────────

export function validateWorkspace(
  files:        Map<string, WorkspaceFile>,
  externalDeps: Set<string>,
): WorkspaceValidationResult {
  const brokenImports  = validateImports(files, externalDeps);
  const importMap      = buildImportMap(files);
  const circularDeps   = detectCircularDependencies(importMap);
  const unusedFiles    = findUnusedFiles(files);

  // Lint all TS/JS files
  const diagnostics: DiagnosticItem[] = [];
  for (const [, file] of files) {
    if (file.isDeleted) continue;
    if (/typescript|javascript/.test(file.language)) {
      diagnostics.push(...runHeuristicLint(file.path, file.content, file.language));
    }
  }

  const errorDiags    = diagnostics.filter(d => d.severity === 'error').length;
  const criticalIssues = brokenImports.filter(b => b.type === 'local').length + errorDiags;
  const totalIssues   = brokenImports.length + circularDeps.length + errorDiags;

  // Health score: start at 10, deduct
  const penalty = brokenImports.length * 1.5 + circularDeps.length + errorDiags * 0.5;
  const healthScore = Math.max(0, Math.round((10 - Math.min(penalty, 10)) * 10) / 10);

  const missingDeps = [...new Set(brokenImports.filter(b => b.type === 'external').map(b => b.importPath))];

  const contextString = [
    `Workspace health: ${healthScore}/10`,
    `Broken imports: ${brokenImports.length}`,
    `Circular deps: ${circularDeps.length}`,
    `Unused files: ${unusedFiles.length}`,
    `Lint errors: ${errorDiags}`,
    `Missing packages: ${missingDeps.join(', ') || 'none'}`,
  ].join('\n');

  return {
    valid: criticalIssues === 0,
    healthScore,
    brokenImports,
    unusedFiles,
    circularDeps,
    diagnostics,
    missingDeps,
    totalIssues,
    criticalIssues,
    contextString,
  };
}

export function scoreWorkspaceHealth(result: WorkspaceValidationResult): number {
  return result.healthScore;
}
