// ── V10.2 Dependency Planner — Deterministic ─────────────────────────────────
//
// Plans dependency management: installation, removal, audit, graph resolution.
// Zero LLM calls. Never throws.

export interface DependencySpec {
  name:     string;
  version:  string;
  isDev:    boolean;
  resolved: boolean;
}

export interface DependencyGraph {
  direct:    DependencySpec[];
  indirect:  DependencySpec[];
  circular:  string[][];
  missing:   string[];
  unused:    string[];
}

// ── Package.json parsing ──────────────────────────────────────────────────────

export function parseDependencies(packageJsonContent: string): {
  direct: DependencySpec[];
  devDeps: DependencySpec[];
} {
  let pkg: Record<string, unknown>;
  try { pkg = JSON.parse(packageJsonContent); }
  catch { return { direct: [], devDeps: [] }; }

  const deps    = (pkg.dependencies    as Record<string, string>) ?? {};
  const devDeps = (pkg.devDependencies as Record<string, string>) ?? {};

  const toDep = (name: string, version: string, isDev: boolean): DependencySpec => ({
    name, version, isDev, resolved: !version.startsWith('workspace:'),
  });

  return {
    direct: Object.entries(deps).map(([n, v]) => toDep(n, v, false)),
    devDeps: Object.entries(devDeps).map(([n, v]) => toDep(n, v, true)),
  };
}

// ── Circular dependency detection ─────────────────────────────────────────────

export function detectCircularDependencies(
  importMap: Map<string, string[]>,
): string[][] {
  const cycles: string[][] = [];
  const visited   = new Set<string>();
  const inStack   = new Set<string>();
  const stack: string[] = [];

  function dfs(node: string): void {
    if (inStack.has(node)) {
      const cycleStart = stack.indexOf(node);
      if (cycleStart >= 0) cycles.push(stack.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    stack.push(node);

    for (const dep of importMap.get(node) ?? []) {
      dfs(dep);
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const node of importMap.keys()) dfs(node);
  return cycles.slice(0, 20); // Cap at 20 cycles
}

// ── Import extraction ─────────────────────────────────────────────────────────

export function extractImports(content: string): string[] {
  const imports: string[] = [];
  const patterns = [
    /import\s+.*?\bfrom\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(content)) !== null) {
      imports.push(m[1]);
    }
  }
  return [...new Set(imports)];
}

export function separateExternalImports(imports: string[]): {
  external: string[];
  local: string[];
} {
  const external = imports.filter(i => !i.startsWith('.') && !i.startsWith('/'));
  const local    = imports.filter(i => i.startsWith('.') || i.startsWith('/'));
  return { external, local };
}

// ── Dependency audit ──────────────────────────────────────────────────────────

export interface DependencyAudit {
  total:       number;
  resolved:    number;
  unresolved:  number;
  circular:    number;
  missing:     string[];
  unused:      string[];
  healthScore: number;
}

export function auditDependencies(
  packageJsonContent: string,
  files: Map<string, { content: string }>,
): DependencyAudit {
  const { direct, devDeps } = parseDependencies(packageJsonContent);
  const all = [...direct, ...devDeps];

  // Collect all external imports from files
  const usedPackages = new Set<string>();
  const importMap = new Map<string, string[]>();

  for (const [filePath, { content }] of files) {
    const imports = extractImports(content);
    const { external, local } = separateExternalImports(imports);
    for (const pkg of external) {
      const name = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
      if (name) usedPackages.add(name);
    }
    importMap.set(filePath, local);
  }

  const circular   = detectCircularDependencies(importMap);
  const missing    = [...usedPackages].filter(pkg => !all.some(d => d.name === pkg));
  const unused     = all
    .filter(d => !d.isDev && !usedPackages.has(d.name))
    .map(d => d.name);

  const total      = all.length;
  const resolved   = all.filter(d => d.resolved).length;
  const unresolved = total - resolved;
  const penalty    = missing.length * 2 + circular.length * 1.5 + unresolved;
  const healthScore = Math.max(0, Math.round((10 - Math.min(penalty, 10)) * 10) / 10);

  return { total, resolved, unresolved, circular: circular.length, missing, unused, healthScore };
}

// ── Package version suggestions ────────────────────────────────────────────────

export function suggestCompatibleVersion(
  packageName: string,
  currentDeps: DependencySpec[],
): string {
  // Heuristic: return existing version constraint or a safe wildcard
  const existing = currentDeps.find(d => d.name === packageName);
  return existing?.version ?? 'latest';
}
