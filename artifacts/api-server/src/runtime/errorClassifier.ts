// ── V6.4: Error Classifier — Structured Build Error Classification ────────────
// Parses raw npm install and Vite build stdout/stderr into typed BuildError objects.
// Extends the category taxonomy from repairStrategies.ts.

export type BuildErrorCategory =
  | 'dependency'
  | 'typescript'
  | 'jsx'
  | 'import'
  | 'route'
  | 'runtime'
  | 'api'
  | 'build'
  | 'unknown';

export interface RealBuildError {
  category: BuildErrorCategory;
  file?: string;
  line?: number;
  column?: number;
  message: string;
  confidence: 'high' | 'medium' | 'low';
  rootCause?: string;
  raw?: string;
}

export interface ClassificationResult {
  errors: RealBuildError[];
  warnings: RealBuildError[];
}

// ── npm install output classification ────────────────────────────────────────

export function classifyInstallOutput(output: string, exitCode: number): RealBuildError[] {
  if (exitCode === 0) return [];

  const errors: RealBuildError[] = [];

  // ERESOLVE / peer dependency conflict
  const eresolveRe = /npm ERR! ERESOLVE.*|npm ERR! Found: ([^\n]+)|npm ERR! Could not resolve dependency: ([^\n]+)/gm;
  let m: RegExpExecArray | null;
  while ((m = eresolveRe.exec(output)) !== null) {
    const pkg = (m[1] ?? m[2] ?? '').trim();
    errors.push({
      category: 'dependency',
      message: pkg ? `Dependency conflict: ${pkg}` : 'Peer dependency conflict (ERESOLVE)',
      confidence: 'high',
      rootCause: 'Conflicting peer dependency versions. Try adding --legacy-peer-deps or aligning versions.',
      raw: m[0],
    });
  }

  // 404 Not Found - package does not exist
  const notFoundRe = /npm ERR! 404\s+Not Found - GET.*?\/([a-z@][\w/-]+)/gim;
  while ((m = notFoundRe.exec(output)) !== null) {
    errors.push({
      category: 'dependency',
      message: `Package not found in registry: ${m[1]}`,
      confidence: 'high',
      rootCause: `Package '${m[1]}' does not exist on npm. Remove it or fix the name.`,
      raw: m[0],
    });
  }

  // ENOTFOUND / network error
  if (/ENOTFOUND|ETIMEDOUT|network/i.test(output)) {
    errors.push({
      category: 'dependency',
      message: 'Network error during npm install',
      confidence: 'high',
      rootCause: 'Could not reach npm registry. Check connectivity or use --prefer-offline.',
    });
  }

  // TIMEOUT
  if (/\[BUILD TIMEOUT\]/i.test(output)) {
    errors.push({
      category: 'build',
      message: 'npm install exceeded timeout (180s)',
      confidence: 'high',
      rootCause: 'Too many packages or slow network. Consider reducing dependencies.',
    });
  }

  // Generic npm ERR! fallback
  if (errors.length === 0 && /npm ERR!/i.test(output)) {
    const lines = output.split('\n').filter(l => /npm ERR!/i.test(l)).slice(0, 3);
    errors.push({
      category: 'dependency',
      message: lines.join(' | ') || 'npm install failed',
      confidence: 'low',
      raw: output.slice(0, 600),
    });
  }

  return errors;
}

// ── Vite build output classification ─────────────────────────────────────────

export function classifyBuildOutput(output: string, exitCode: number): ClassificationResult {
  const errors: RealBuildError[] = [];
  const warnings: RealBuildError[] = [];

  // Vite/Rollup import resolution: [plugin:vite:resolve] Failed to resolve...
  const importRe = /\[plugin:vite:resolve\]\s*(.*?)(?:\n|$)/gm;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(output)) !== null) {
    const msg = m[1]!.trim();
    const pkgMatch = msg.match(/['"]([^'"]+)['"]/);
    errors.push({
      category: 'import',
      message: pkgMatch ? `Cannot resolve import: ${pkgMatch[1]}` : msg,
      confidence: 'high',
      rootCause: pkgMatch ? `Package '${pkgMatch[1]}' not installed or path is wrong.` : msg,
      raw: m[0],
    });
  }

  // Rollup: "foo" is not exported by "bar"
  const exportRe = /"([^"]+)" is not exported by "([^"]+)"/gm;
  while ((m = exportRe.exec(output)) !== null) {
    errors.push({
      category: 'import',
      message: `'${m[1]}' is not exported by '${m[2]}'`,
      confidence: 'high',
      rootCause: `Check the import statement — the named export may not exist in this package version.`,
      raw: m[0],
    });
  }

  // esbuild TypeScript/JSX: path/to/File.tsx:LINE:COL: ERROR: message
  const esbuildRe = /([A-Za-z0-9_./@-]+\.(?:tsx?|jsx?))\s*:(\d+):(\d+):\s*(error|warning):\s*(.+)/gim;
  while ((m = esbuildRe.exec(output)) !== null) {
    const severity = m[4]!.toLowerCase();
    const file = m[1]!;
    const line = parseInt(m[2]!, 10);
    const col = parseInt(m[3]!, 10);
    const message = m[5]!.trim();

    // Classify message content
    let category: BuildErrorCategory = 'typescript';
    if (/unexpected token|unterminated|adjacent jsx|expected.*jsx|required.*jsx/i.test(message)) category = 'jsx';
    else if (/module.*not found|cannot find module|failed to resolve/i.test(message)) category = 'import';

    const entry: RealBuildError = {
      category,
      file,
      line,
      column: col,
      message,
      confidence: 'high',
      raw: m[0],
    };

    if (severity === 'error') errors.push(entry);
    else warnings.push(entry);
  }

  // Vite generic error line: error during build:
  const genericBuildRe = /error during build:\s*\n?((?:.|\n){0,300})/i;
  const genericMatch = output.match(genericBuildRe);
  if (genericMatch && errors.length === 0) {
    errors.push({
      category: 'build',
      message: `Build error: ${genericMatch[1]!.trim().slice(0, 200)}`,
      confidence: 'medium',
      raw: genericMatch[0],
    });
  }

  // BUILD TIMEOUT
  if (/\[BUILD TIMEOUT\]/i.test(output)) {
    errors.push({
      category: 'build',
      message: 'Vite build exceeded timeout (120s)',
      confidence: 'high',
      rootCause: 'Build is too slow. Check for large dependencies or circular imports.',
    });
  }

  // Fallback when build failed but we couldn't parse specific errors
  if (exitCode !== 0 && errors.length === 0) {
    const relevantLines = output.split('\n')
      .filter(l => /error|failed|cannot|unexpected|undefined/i.test(l) && l.trim().length > 8)
      .slice(0, 5)
      .join(' | ');
    errors.push({
      category: 'build',
      message: relevantLines || 'Build failed with unknown error',
      confidence: 'low',
      raw: output.slice(-1000),
    });
  }

  // Deduplicate errors by message
  const seen = new Set<string>();
  const deduped = errors.filter(e => {
    const key = `${e.file ?? ''}:${e.line ?? ''}:${e.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { errors: deduped, warnings };
}
