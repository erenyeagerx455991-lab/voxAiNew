export interface BuildError {
  file: string;
  line?: number;
  col?: number;
  type: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  errors: BuildError[];
  warnings: BuildError[];
  filesChecked: number;
  filesPassed: number;
  details: Record<string, boolean>;
}

export interface HealthMetrics {
  compileSuccess: boolean;
  dependenciesResolved: boolean;
  runtimeSuccess: boolean;
  routesValid: boolean;
  noConsoleErrors: boolean;
  staticScore?: number;
  repairAttempts?: number;
  filesPassed?: number;
  filesTotal?: number;
}

export function computeHealthScore(metrics: HealthMetrics): number {
  let score = 0;

  if (metrics.compileSuccess)         score += 40;
  else if ((metrics.filesPassed ?? 0) / Math.max(1, metrics.filesTotal ?? 1) > 0.75) score += 25;
  else if ((metrics.filesPassed ?? 0) / Math.max(1, metrics.filesTotal ?? 1) > 0.50) score += 15;

  if (metrics.dependenciesResolved)   score += 20;
  else                                 score += 10;

  if (metrics.runtimeSuccess)         score += 20;
  else if (metrics.compileSuccess)     score += 10;

  if (metrics.routesValid)            score += 10;

  if (metrics.noConsoleErrors)        score += 10;
  else if ((metrics.repairAttempts ?? 0) > 0 && metrics.runtimeSuccess) score += 5;

  if (metrics.staticScore !== undefined) {
    const staticBonus = Math.round((metrics.staticScore / 100) * 5);
    score = Math.min(100, score + staticBonus);
  }

  return Math.min(100, Math.max(0, score));
}

const COMMON_PATTERNS: Array<{ pattern: RegExp; type: BuildError['type']; message: string; rule: string }> = [
  { pattern: /import\s+.*\s+from\s+['"](?!react|react-dom|react-router|lucide|@)/,   type: 'warning', message: 'External import may not be available at runtime',      rule: 'external-import' },
  { pattern: /console\.error\(/,                                                       type: 'warning', message: 'console.error() call detected in production code',      rule: 'console-error' },
  { pattern: /any\s*;|:\s*any\b/,                                                      type: 'info',    message: 'TypeScript `any` type usage detected',                  rule: 'no-explicit-any' },
  { pattern: /TODO|FIXME|HACK|XXX/,                                                    type: 'info',    message: 'Code comment marker found',                             rule: 'no-todo-comments' },
  { pattern: /undefined\./,                                                             type: 'warning', message: 'Potential undefined property access',                   rule: 'no-unsafe-member' },
  { pattern: /!\./,                                                                     type: 'warning', message: 'Non-null assertion used — may throw at runtime',        rule: 'no-non-null' },
  { pattern: /as\s+any\b/,                                                              type: 'warning', message: 'Unsafe type cast via `as any`',                         rule: 'no-any-cast' },
  { pattern: /eval\(/,                                                                  type: 'error',   message: '`eval()` is not allowed',                               rule: 'no-eval' },
  { pattern: /document\.write\(/,                                                       type: 'error',   message: '`document.write()` is not safe in React apps',          rule: 'no-document-write' },
  { pattern: /dangerouslySetInnerHTML/,                                                 type: 'warning', message: 'dangerouslySetInnerHTML can lead to XSS vulnerabilities', rule: 'no-dangerous-html' },
];

export function lintFile(content: string, filename: string): BuildError[] {
  const errors: BuildError[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const check of COMMON_PATTERNS) {
      if (check.pattern.test(line)) {
        errors.push({
          file: filename,
          line: i + 1,
          type: check.type,
          message: check.message,
          rule: check.rule,
        });
        break;
      }
    }
  }

  return errors;
}

export function validateFiles(
  files: Array<{ name: string; content: string; lang: string }>
): ValidationResult {
  let allErrors: BuildError[] = [];
  let filesPassed = 0;

  for (const file of files) {
    if (file.lang !== 'tsx' && file.lang !== 'ts') {
      filesPassed++;
      continue;
    }

    const errors = lintFile(file.content, file.name);
    const fileErrors = errors.filter(e => e.type === 'error');
    if (fileErrors.length === 0) filesPassed++;
    allErrors = [...allErrors, ...errors];
  }

  const buildErrors = allErrors.filter(e => e.type === 'error');
  const buildWarnings = allErrors.filter(e => e.type !== 'error');
  const passed = buildErrors.length === 0;

  const score = Math.round((filesPassed / Math.max(1, files.length)) * 100);

  return {
    passed,
    score,
    errors: buildErrors,
    warnings: buildWarnings,
    filesChecked: files.length,
    filesPassed,
    details: {
      noBlockingErrors: passed,
      allFilesChecked: files.length > 0,
      noUnsafePatterns: buildErrors.filter(e => e.rule === 'no-eval' || e.rule === 'no-document-write').length === 0,
    },
  };
}

export function parseStaticValidatorScore(issues: string[]): number {
  if (issues.length === 0) return 100;
  const criticalIssues = issues.filter(i =>
    i.toLowerCase().includes('missing') ||
    i.toLowerCase().includes('error') ||
    i.toLowerCase().includes('no app.tsx')
  ).length;
  const minorIssues = issues.length - criticalIssues;
  return Math.max(0, Math.min(100, 100 - criticalIssues * 20 - minorIssues * 5));
}

export function extractImports(content: string): string[] {
  const imports: string[] = [];
  const regex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const pkg = match[1];
    if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
      imports.push(pkg.split('/')[0]);
    }
  }
  return [...new Set(imports)];
}

// ── V6.1: Repair Quality Gate ─────────────────────────────────────────────────

export function computeRepairQuality(
  repairedContent: string,
  originalContent: string,
  category: string
): number {
  if (!repairedContent || repairedContent.trim().length < 50) return 0;
  if (repairedContent.trim() === originalContent.trim()) return 0;

  let score = 100;

  // Penalise leftover markdown fences
  if (repairedContent.includes('```')) score -= 30;

  // Must contain some code structure
  const hasCode =
    repairedContent.includes('function') ||
    repairedContent.includes('const') ||
    repairedContent.includes('=>') ||
    repairedContent.includes('class ');
  if (!hasCode) score -= 35;

  // Must have a return statement for components
  if (!repairedContent.includes('return') && (repairedContent.includes('function') || repairedContent.includes('=>'))) {
    score -= 20;
  }

  // Category-specific checks
  if (category === 'jsx') {
    const openTags  = (repairedContent.match(/<[A-Z][a-zA-Z]*/g) ?? []).length;
    const closeTags = (repairedContent.match(/<\/[A-Z][a-zA-Z]*/g) ?? []).length;
    const selfClose = (repairedContent.match(/\/>/g) ?? []).length;
    if (Math.abs(openTags - closeTags - selfClose) > 3) score -= 20;
  }

  if (category === 'import') {
    if (!repairedContent.includes('import ') && originalContent.includes('import ')) {
      score -= 25;
    }
  }

  if (category === 'hook') {
    // Penalise if hooks appear inside conditional blocks (rough check)
    if (/if\s*\(.*\)\s*\{[^}]*use[A-Z]/.test(repairedContent)) score -= 20;
  }

  // Size sanity: repaired should not be <30% or >5× original
  const ratio = repairedContent.length / Math.max(1, originalContent.length);
  if (ratio < 0.3) score -= 25;
  if (ratio > 5)   score -= 10;

  // Reward improvement: fewer unsafe patterns than original
  const unsafeBefore = (originalContent.match(/undefined\.|!\./g) ?? []).length;
  const unsafeAfter  = (repairedContent.match(/undefined\.|!\./g) ?? []).length;
  if (unsafeAfter < unsafeBefore) score += Math.min(10, (unsafeBefore - unsafeAfter) * 3);

  return Math.max(0, Math.min(100, score));
}

export function detectMissingImports(
  files: Array<{ name: string; content: string; lang: string }>,
  resolvedPackages: string[]
): Array<{ file: string; missingPackage: string }> {
  const missing: Array<{ file: string; missingPackage: string }> = [];
  const resolvedSet = new Set(resolvedPackages);

  const BROWSER_BUILTINS = new Set(['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client']);
  const WORKSPACE_PATHS = new Set(['@workspace']);

  for (const file of files) {
    if (file.lang !== 'tsx' && file.lang !== 'ts') continue;
    const imports = extractImports(file.content);
    for (const pkg of imports) {
      if (BROWSER_BUILTINS.has(pkg)) continue;
      if ([...WORKSPACE_PATHS].some(p => pkg.startsWith(p))) continue;
      if (!resolvedSet.has(pkg) && !resolvedSet.has(`@${pkg.split('/')[0]}`)) {
        const isScope = pkg.startsWith('@');
        const base = isScope ? pkg : pkg.split('/')[0];
        if (!resolvedSet.has(base) && !resolvedSet.has(pkg)) {
          missing.push({ file: file.name, missingPackage: pkg });
        }
      }
    }
  }

  return missing;
}
