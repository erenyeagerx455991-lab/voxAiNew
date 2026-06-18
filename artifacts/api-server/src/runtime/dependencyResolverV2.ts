// ── V6.2: Dependency Intelligence Engine ─────────────────────────────────────
// Proactively resolves imports, components, routes, and packages in generated
// project files before runtime validation.

import type { ResolvedDependencies } from './dependencyResolver.js';
import {
  extractImportsAST,
  extractHooksAST,
  extractDefinedComponentsAST,
  extractUsedJSXComponentsAST,
  extractRoutesAST,
} from './astResolver.js';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface RuntimeImportResolution {
  file: string;
  importPath: string;
  resolved: boolean;
  autoInjected: boolean;
  reason?: string;
}

export interface RuntimeComponentResolution {
  name: string;
  definedIn?: string;
  usedIn: string[];
  resolved: boolean;
  stubGenerated: boolean;
}

export interface RuntimeRouteResolution {
  path: string;
  component: string;
  pageFile?: string;
  resolved: boolean;
  stubGenerated: boolean;
}

export interface RuntimePackageResolution {
  name: string;
  source: 'import' | 'feature' | 'inferred';
  required: boolean;
  inResolved: boolean;
}

export interface RuntimeDependencyGraph {
  imports: RuntimeImportResolution[];
  components: RuntimeComponentResolution[];
  routes: RuntimeRouteResolution[];
  packages: RuntimePackageResolution[];
  resolvedAt: number;
  totalImports: number;
  resolvedImports: number;
  unresolvedImports: number;
  totalComponents: number;
  resolvedComponents: number;
  missingComponents: number;
  totalRoutes: number;
  resolvedRoutes: number;
  missingRoutes: number;
  totalPackages: number;
  resolvedPackages: number;
  missingPackages: number;
  healthScore: number;
  injectedImports: number;
  generatedStubs: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REACT_HOOKS = new Set(['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer', 'useId', 'useLayoutEffect', 'useInsertionEffect', 'useTransition', 'useDeferredValue', 'useImperativeHandle', 'useDebugValue']);
const ROUTER_HOOKS = new Set(['useNavigate', 'useParams', 'useLocation', 'useSearchParams', 'useMatch', 'useOutlet', 'useOutletContext', 'useRouteError', 'useLoaderData']);
const ROUTER_COMPONENTS = new Set(['BrowserRouter', 'HashRouter', 'MemoryRouter', 'Routes', 'Route', 'Link', 'NavLink', 'Navigate', 'Outlet', 'Form']);

// Packages that are always available in preview (CDN/bundled)
const CDN_AVAILABLE = new Set(['react', 'react-dom', 'react-router-dom', 'lucide-react', 'framer-motion', 'clsx', 'class-variance-authority', 'tailwind-merge', '@radix-ui/react-slot']);

// ── V6.3-B: AST-primary extractors (regex kept as internal fallback in astResolver) ──

function extractAllImports(content: string): string[] {
  // AST primary — extractImportsAST handles internal regex fallback
  const { imports } = extractImportsAST(content);
  return [...new Set(imports.map(i => i.source))];
}

function extractUsedHooks(content: string): { reactHooks: string[]; routerHooks: string[]; routerComponents: string[] } {
  // AST primary for hook calls — internal regex fallback is inside extractHooksAST
  const { hooks } = extractHooksAST(content);
  // AST primary for JSX router components — internal regex fallback inside extractUsedJSXComponentsAST
  const usedJSX = extractUsedJSXComponentsAST(content);

  const reactHooks: string[] = [];
  const routerHooks: string[] = [];
  for (const h of hooks) {
    const bare = h.startsWith('React.') ? h.slice('React.'.length) : h;
    if (REACT_HOOKS.has(bare)) reactHooks.push(bare);
    else if (ROUTER_HOOKS.has(h)) routerHooks.push(h);
  }
  const routerComponents = usedJSX.filter(c => ROUTER_COMPONENTS.has(c));
  return { reactHooks, routerHooks, routerComponents };
}

function parseExistingNamedImports(content: string, pkg: string): string[] {
  const re = new RegExp(`import\\s+\\{([^}]*)\\}\\s+from\\s+['"]${pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`);
  const m = content.match(re);
  if (!m || !m[1]) return [];
  return m[1].split(',').map(s => s.trim().replace(/\s+as\s+\w+/, '')).filter(Boolean);
}

function extractDefinedComponents(content: string): string[] {
  // AST primary — extractDefinedComponentsAST has internal regex fallback
  return extractDefinedComponentsAST(content);
}

function extractUsedJSXComponents(content: string): string[] {
  // AST primary — extractUsedJSXComponentsAST has internal regex fallback
  return extractUsedJSXComponentsAST(content);
}

function extractRoutes(files: Array<{ name: string; content: string }>): Array<{ path: string; component: string }> {
  // AST primary — extractRoutesAST handles internal per-file regex fallback
  return extractRoutesAST(files);
}

function extractPackagesFromImports(files: Array<{ name: string; content: string }>): string[] {
  const pkgs = new Set<string>();
  for (const f of files) {
    const imports = extractAllImports(f.content);
    for (const imp of imports) {
      if (imp.startsWith('.') || imp.startsWith('/')) continue;
      // scoped: @org/pkg → @org/pkg, plain: pkg → pkg (ignore sub-paths)
      const pkg = imp.startsWith('@')
        ? imp.split('/').slice(0, 2).join('/')
        : imp.split('/')[0]!;
      if (pkg) pkgs.add(pkg);
    }
  }
  return [...pkgs];
}

// ── Import Resolver ───────────────────────────────────────────────────────────

export function resolveImports(
  files: Array<{ name: string; content: string; lang: string }>,
  resolvedDeps: ResolvedDependencies
): { resolutions: RuntimeImportResolution[]; patchedFiles: Array<{ name: string; content: string; lang: string }> } {
  const allPkgs = new Set([...resolvedDeps.packages, ...resolvedDeps.devPackages, ...CDN_AVAILABLE]);
  const resolutions: RuntimeImportResolution[] = [];
  const patchedFiles = files.map(f => ({ ...f }));

  for (let i = 0; i < patchedFiles.length; i++) {
    const f = patchedFiles[i]!;
    if (f.lang !== 'tsx' && f.lang !== 'ts' && f.lang !== 'jsx' && f.lang !== 'js') continue;

    const imports = extractAllImports(f.content);
    let patched = f.content;
    let injectedAny = false;

    // Check each import
    for (const imp of imports) {
      if (imp.startsWith('.') || imp.startsWith('/')) {
        resolutions.push({ file: f.name, importPath: imp, resolved: true, autoInjected: false, reason: 'relative import' });
        continue;
      }
      const pkg = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0]!;
      const resolved = allPkgs.has(pkg);
      resolutions.push({ file: f.name, importPath: imp, resolved, autoInjected: false, reason: resolved ? 'in resolved deps' : 'not in resolved deps' });
    }

    // Auto-inject missing React hook imports
    const { reactHooks, routerHooks, routerComponents } = extractUsedHooks(patched);
    const existingReactImports = parseExistingNamedImports(patched, 'react');
    const missingReactHooks = reactHooks.filter(h => !existingReactImports.includes(h));

    if (missingReactHooks.length > 0) {
      const reactImportRe = /import\s+React(?:,\s*\{([^}]*)\})?\s+from\s+['"]react['"]/;
      const hasReactImport = reactImportRe.test(patched);
      if (hasReactImport) {
        patched = patched.replace(reactImportRe, (match, existing: string | undefined) => {
          const existingSet = existing ? existing.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
          const merged = [...new Set([...existingSet, ...missingReactHooks])];
          return `import React, { ${merged.join(', ')} } from 'react'`;
        });
      } else if (/import\s*\{([^}]*)\}\s*from\s*['"]react['"]/.test(patched)) {
        patched = patched.replace(/import\s*\{([^}]*)\}\s*from\s*['"]react['"]/, (match, existing: string) => {
          const existingSet = existing.split(',').map((s: string) => s.trim()).filter(Boolean);
          const merged = [...new Set([...existingSet, ...missingReactHooks])];
          return `import { ${merged.join(', ')} } from 'react'`;
        });
      }
      missingReactHooks.forEach(h => resolutions.push({ file: f.name, importPath: 'react', resolved: true, autoInjected: true, reason: `auto-injected missing hook: ${h}` }));
      injectedAny = true;
    }

    // Auto-inject missing router imports
    const existingRouterImports = parseExistingNamedImports(patched, 'react-router-dom');
    const missingRouterItems = [...routerHooks, ...routerComponents].filter(h => !existingRouterImports.includes(h));
    if (missingRouterItems.length > 0) {
      if (/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"]/.test(patched)) {
        patched = patched.replace(/import\s*\{([^}]*)\}\s*from\s*['"]react-router-dom['"]/, (match, existing: string) => {
          const existingSet = existing.split(',').map((s: string) => s.trim()).filter(Boolean);
          const merged = [...new Set([...existingSet, ...missingRouterItems])];
          return `import { ${merged.join(', ')} } from 'react-router-dom'`;
        });
      } else if (missingRouterItems.length > 0) {
        const firstImport = patched.match(/^import .+ from .+;?$/m);
        if (firstImport) {
          patched = patched.replace(firstImport[0], `${firstImport[0]}\nimport { ${missingRouterItems.join(', ')} } from 'react-router-dom'`);
        }
      }
      missingRouterItems.forEach(h => resolutions.push({ file: f.name, importPath: 'react-router-dom', resolved: true, autoInjected: true, reason: `auto-injected missing: ${h}` }));
      injectedAny = true;
    }

    if (injectedAny) {
      patchedFiles[i] = { ...f, content: patched };
    }
  }

  return { resolutions, patchedFiles };
}

// ── Component Resolver ────────────────────────────────────────────────────────

export function resolveComponents(
  files: Array<{ name: string; content: string; lang: string }>
): { resolutions: RuntimeComponentResolution[]; patchedFiles: Array<{ name: string; content: string; lang: string }> } {
  const resolutions: RuntimeComponentResolution[] = [];
  const patchedFiles = files.map(f => ({ ...f }));

  // Build map of all defined components
  const definedComponents = new Map<string, string>(); // name → file
  for (const f of files) {
    if (f.lang !== 'tsx' && f.lang !== 'jsx') continue;
    for (const comp of extractDefinedComponents(f.content)) {
      definedComponents.set(comp, f.name);
    }
  }

  // Find all used JSX components
  const usageMap = new Map<string, string[]>(); // component → files using it
  for (const f of files) {
    if (f.lang !== 'tsx' && f.lang !== 'jsx') continue;
    for (const comp of extractUsedJSXComponents(f.content)) {
      if (!usageMap.has(comp)) usageMap.set(comp, []);
      usageMap.get(comp)!.push(f.name);
    }
  }

  // Classify each used component
  for (const [comp, usedIn] of usageMap.entries()) {
    const definedIn = definedComponents.get(comp);
    const resolved = !!definedIn;
    resolutions.push({
      name: comp,
      definedIn,
      usedIn,
      resolved,
      stubGenerated: false,
    });
  }

  return { resolutions, patchedFiles };
}

// ── Route Resolver ────────────────────────────────────────────────────────────

export function resolveRoutes(
  files: Array<{ name: string; content: string; lang: string }>
): { resolutions: RuntimeRouteResolution[] } {
  const resolutions: RuntimeRouteResolution[] = [];
  const routes = extractRoutes(files as Array<{ name: string; content: string }>);

  // Build set of all page files
  const pageFiles = new Set(
    files
      .filter(f => (f.lang === 'tsx' || f.lang === 'jsx') && (f.name.includes('/pages/') || f.name.includes('Pages') || f.name.includes('Page')))
      .map(f => f.name)
  );

  // Build set of all defined component names
  const definedComponents = new Set<string>();
  for (const f of files) {
    if (f.lang !== 'tsx' && f.lang !== 'jsx') continue;
    for (const comp of extractDefinedComponents(f.content)) {
      definedComponents.add(comp);
    }
  }

  for (const route of routes) {
    // Check if there's a matching page file
    const pageFile = files.find(f =>
      f.name.replace(/\.(tsx|jsx)$/, '').toLowerCase().includes(route.component.toLowerCase()) ||
      f.name.replace(/\.(tsx|jsx)$/, '') === route.component
    )?.name;

    const resolved = definedComponents.has(route.component) || !!pageFile;
    resolutions.push({
      path: route.path,
      component: route.component,
      pageFile,
      resolved,
      stubGenerated: false,
    });
  }

  return { resolutions };
}

// ── Package Resolver ──────────────────────────────────────────────────────────

export function resolvePackages(
  files: Array<{ name: string; content: string; lang: string }>,
  resolvedDeps: ResolvedDependencies
): RuntimePackageResolution[] {
  const allPkgs = new Set([...resolvedDeps.packages, ...resolvedDeps.devPackages, ...CDN_AVAILABLE]);
  const detectedPkgs = extractPackagesFromImports(files as Array<{ name: string; content: string }>);

  return detectedPkgs.map(pkg => ({
    name: pkg,
    source: 'import' as const,
    required: true,
    inResolved: allPkgs.has(pkg),
  }));
}

// ── Main Builder ──────────────────────────────────────────────────────────────

export function buildRuntimeDependencyGraph(
  files: Array<{ name: string; content: string; lang: string }>,
  resolvedDeps: ResolvedDependencies
): RuntimeDependencyGraph {
  const { resolutions: imports } = resolveImports(files, resolvedDeps);
  const { resolutions: components } = resolveComponents(files);
  const { resolutions: routes } = resolveRoutes(files);
  const packages = resolvePackages(files, resolvedDeps);

  const resolvedImports = imports.filter(i => i.resolved).length;
  const resolvedComponents = components.filter(c => c.resolved).length;
  const resolvedRoutes = routes.filter(r => r.resolved).length;
  const resolvedPackages = packages.filter(p => p.inResolved).length;
  const injectedImports = imports.filter(i => i.autoInjected).length;
  const generatedStubs = components.filter(c => c.stubGenerated).length;

  const totalImports = imports.length;
  const totalComponents = components.length;
  const totalRoutes = routes.length;
  const totalPackages = packages.length;

  // Health score: weighted average across 4 dimensions
  const importScore = totalImports > 0 ? (resolvedImports / totalImports) * 100 : 100;
  const compScore = totalComponents > 0 ? (resolvedComponents / totalComponents) * 100 : 100;
  const routeScore = totalRoutes > 0 ? (resolvedRoutes / totalRoutes) * 100 : 100;
  const pkgScore = totalPackages > 0 ? (resolvedPackages / totalPackages) * 100 : 100;

  const healthScore = Math.round((importScore * 0.3 + compScore * 0.3 + routeScore * 0.2 + pkgScore * 0.2));

  return {
    imports,
    components,
    routes,
    packages,
    resolvedAt: Date.now(),
    totalImports,
    resolvedImports,
    unresolvedImports: totalImports - resolvedImports,
    totalComponents,
    resolvedComponents,
    missingComponents: totalComponents - resolvedComponents,
    totalRoutes,
    resolvedRoutes,
    missingRoutes: totalRoutes - resolvedRoutes,
    totalPackages,
    resolvedPackages,
    missingPackages: totalPackages - resolvedPackages,
    healthScore,
    injectedImports,
    generatedStubs,
  };
}
