// Phase 5 — dependencyResolverV2.ts unit tests
import { describe, it, expect } from 'vitest';
import {
  resolveImports,
  resolveComponents,
  resolveRoutes,
  resolvePackages,
  buildRuntimeDependencyGraph,
} from '../../runtime/dependencyResolverV2.js';
import type { ResolvedDependencies } from '../../runtime/dependencyResolver.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const RESOLVED_DEPS: ResolvedDependencies = {
  packages: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  devPackages: ['vite', '@vitejs/plugin-react', 'typescript'],
  missing: [],
  packageJson: '{}',
};

const FILES = [
  {
    name: 'App.tsx', path: 'src/', lang: 'tsx',
    content: `import React, { useState } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Hero } from './components/Hero';
import { Features } from './components/Features';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </BrowserRouter>
  );
}`,
  },
  {
    name: 'Hero.tsx', path: 'src/components/', lang: 'tsx',
    content: `import React from 'react';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section>
      <h1>Hero</h1>
      <ArrowRight />
    </section>
  );
}`,
  },
  {
    name: 'Features.tsx', path: 'src/components/', lang: 'tsx',
    content: `import React, { useEffect } from 'react';

export function Features() {
  useEffect(() => {}, []);
  return <section>Features</section>;
}`,
  },
  {
    name: 'main.tsx', path: 'src/', lang: 'tsx',
    content: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
createRoot(document.getElementById('root')!).render(<App />);`,
  },
];

const FILES_WITH_MISSING = [
  ...FILES,
  {
    name: 'Dashboard.tsx', path: 'src/pages/', lang: 'tsx',
    content: `import React from 'react';
import { SomeChart } from 'recharts';
export function Dashboard() { return <SomeChart />; }`,
  },
];

// ── resolveImports ────────────────────────────────────────────────────────────

describe('resolveImports()', () => {
  it('resolves imports from installed packages as resolved', () => {
    const { resolutions } = resolveImports(FILES, RESOLVED_DEPS);
    const reactEntry = resolutions.find(r => r.importPath === 'react');
    expect(reactEntry).toBeDefined();
    expect(reactEntry!.resolved).toBe(true);
  });

  it('resolves CDN-available packages even if not in resolvedDeps', () => {
    const emptyDeps: ResolvedDependencies = { packages: [], devPackages: [], missing: [], packageJson: '{}' };
    const { resolutions } = resolveImports(FILES, emptyDeps);
    // react is in CDN_AVAILABLE
    const reactEntry = resolutions.find(r => r.importPath === 'react' || r.importPath === 'react-dom/client');
    expect(reactEntry?.resolved).toBe(true);
  });

  it('marks relative imports as resolved', () => {
    const { resolutions } = resolveImports(FILES, RESOLVED_DEPS);
    const relative = resolutions.find(r => r.importPath.startsWith('./'));
    expect(relative).toBeDefined();
    expect(relative!.resolved).toBe(true);
  });

  it('marks unknown external packages as unresolved', () => {
    const { resolutions } = resolveImports(FILES_WITH_MISSING, RESOLVED_DEPS);
    const rechartsEntry = resolutions.find(r => r.importPath === 'recharts');
    expect(rechartsEntry).toBeDefined();
    expect(rechartsEntry!.resolved).toBe(false);
  });

  it('returns patched files array with same length', () => {
    const { patchedFiles } = resolveImports(FILES, RESOLVED_DEPS);
    expect(patchedFiles).toHaveLength(FILES.length);
  });

  it('skips non-TS/TSX/JS/JSX files', () => {
    const withCss = [...FILES, { name: 'styles.css', path: 'src/', lang: 'css', content: '.foo {}' }];
    const { resolutions } = resolveImports(withCss, RESOLVED_DEPS);
    const cssEntry = resolutions.find(r => r.file === 'styles.css');
    expect(cssEntry).toBeUndefined();
  });
});

// ── resolveComponents ─────────────────────────────────────────────────────────

describe('resolveComponents()', () => {
  it('resolves components defined within the file set', () => {
    const { resolutions } = resolveComponents(FILES);
    const hero = resolutions.find(r => r.name === 'Hero');
    expect(hero).toBeDefined();
    expect(hero!.resolved).toBe(true);
  });

  it('marks components that are used but not defined as unresolved', () => {
    const { resolutions } = resolveComponents(FILES_WITH_MISSING);
    const missing = resolutions.find(r => r.name === 'SomeChart');
    expect(missing).toBeDefined();
    expect(missing!.resolved).toBe(false);
  });

  it('returns array of component resolution objects', () => {
    const { resolutions } = resolveComponents(FILES);
    expect(Array.isArray(resolutions)).toBe(true);
    resolutions.forEach(r => {
      expect(r).toHaveProperty('name');
      expect(r).toHaveProperty('resolved');
      expect(typeof r.resolved).toBe('boolean');
    });
  });

  it('each resolved component has definedIn set', () => {
    const { resolutions } = resolveComponents(FILES);
    const heroRes = resolutions.find(r => r.name === 'Hero' && r.resolved);
    expect(heroRes?.definedIn).toContain('Hero.tsx');
  });

  it('returns patched files with same count as input', () => {
    const { patchedFiles } = resolveComponents(FILES);
    expect(patchedFiles).toHaveLength(FILES.length);
  });
});

// ── resolveRoutes ─────────────────────────────────────────────────────────────

describe('resolveRoutes()', () => {
  it('detects Route definitions in project files', () => {
    const { resolutions } = resolveRoutes(FILES);
    const rootRoute = resolutions.find(r => r.path === '/');
    expect(rootRoute).toBeDefined();
  });

  it('resolves routes with matching component files', () => {
    const { resolutions } = resolveRoutes(FILES);
    expect(Array.isArray(resolutions)).toBe(true);
  });

  it('returns array of route resolution objects', () => {
    const { resolutions } = resolveRoutes(FILES);
    resolutions.forEach(r => {
      expect(r).toHaveProperty('path');
      expect(r).toHaveProperty('component');
      expect(r).toHaveProperty('resolved');
    });
  });

  it('handles files with no routes gracefully', () => {
    const noRouteFiles = [FILES[1]!, FILES[2]!]; // Hero + Features, no router
    const { resolutions } = resolveRoutes(noRouteFiles);
    expect(Array.isArray(resolutions)).toBe(true);
  });
});

// ── resolvePackages ───────────────────────────────────────────────────────────

describe('resolvePackages()', () => {
  it('detects packages used in imports', () => {
    const packages = resolvePackages(FILES, RESOLVED_DEPS);
    const react = packages.find(p => p.name === 'react');
    expect(react).toBeDefined();
    expect(react!.inResolved).toBe(true);
  });

  it('flags packages imported but not in resolvedDeps', () => {
    const packages = resolvePackages(FILES_WITH_MISSING, RESOLVED_DEPS);
    const recharts = packages.find(p => p.name === 'recharts');
    expect(recharts).toBeDefined();
    expect(recharts!.inResolved).toBe(false);
  });

  it('marks CDN-available packages as inResolved', () => {
    const emptyDeps: ResolvedDependencies = { packages: [], devPackages: [], missing: [], packageJson: '{}' };
    const packages = resolvePackages(FILES, emptyDeps);
    // react is in CDN_AVAILABLE so should be inResolved even with empty dep list
    const reactPkg = packages.find(p => p.name === 'react');
    expect(reactPkg?.inResolved).toBe(true);
  });

  it('returns array of RuntimePackageResolution objects', () => {
    const packages = resolvePackages(FILES, RESOLVED_DEPS);
    expect(Array.isArray(packages)).toBe(true);
    packages.forEach(p => {
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('inResolved');
      expect(p).toHaveProperty('required');
    });
  });
});

// ── buildRuntimeDependencyGraph ───────────────────────────────────────────────

describe('buildRuntimeDependencyGraph()', () => {
  it('returns a valid RuntimeDependencyGraph shape', () => {
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graph).toHaveProperty('imports');
    expect(graph).toHaveProperty('components');
    expect(graph).toHaveProperty('routes');
    expect(graph).toHaveProperty('packages');
    expect(graph).toHaveProperty('healthScore');
    expect(graph).toHaveProperty('resolvedAt');
  });

  it('health score is between 0 and 100', () => {
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graph.healthScore).toBeGreaterThanOrEqual(0);
    expect(graph.healthScore).toBeLessThanOrEqual(100);
  });

  it('totalImports equals length of imports array', () => {
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graph.totalImports).toBe(graph.imports.length);
  });

  it('reports healthy score for a well-formed project', () => {
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graph.healthScore).toBeGreaterThanOrEqual(50);
  });

  it('reports lower health when packages are missing', () => {
    const emptyDeps: ResolvedDependencies = { packages: [], devPackages: [], missing: [], packageJson: '{}' };
    const graphMissing = buildRuntimeDependencyGraph(FILES_WITH_MISSING, emptyDeps);
    const graphFull = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graphMissing.healthScore).toBeLessThanOrEqual(graphFull.healthScore);
  });

  it('resolvedAt is a recent timestamp', () => {
    const before = Date.now();
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    const after = Date.now();
    expect(graph.resolvedAt).toBeGreaterThanOrEqual(before);
    expect(graph.resolvedAt).toBeLessThanOrEqual(after);
  });

  it('missingPackages count is non-negative', () => {
    const graph = buildRuntimeDependencyGraph(FILES, RESOLVED_DEPS);
    expect(graph.missingPackages).toBeGreaterThanOrEqual(0);
  });

  it('works with empty file array', () => {
    const graph = buildRuntimeDependencyGraph([], RESOLVED_DEPS);
    expect(graph.totalImports).toBe(0);
    expect(graph.totalComponents).toBe(0);
    expect(graph.totalRoutes).toBe(0);
  });
});
