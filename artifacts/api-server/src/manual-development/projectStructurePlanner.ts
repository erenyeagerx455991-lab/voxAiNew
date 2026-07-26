// ── V10.2 Project Structure Planner — Deterministic ──────────────────────────
//
// Analyzes and plans the project structure, detects framework conventions,
// and guides AI generation to respect existing folder layout.
// Zero LLM calls. Never throws.

import type { FolderConventions, FrameworkPrefs } from './manualWorkspaceTypes.js';

// ── Framework detection ───────────────────────────────────────────────────────

export type DetectedFramework =
  | 'react-vite' | 'next' | 'remix' | 'astro'
  | 'express' | 'fastify' | 'hono'
  | 'unknown';

export function detectFramework(
  files: Set<string>,
  packageJsonContent?: string,
): DetectedFramework {
  if (files.has('next.config.js') || files.has('next.config.ts')) return 'next';
  if (files.has('remix.config.js'))  return 'remix';
  if (files.has('astro.config.mjs')) return 'astro';
  if (files.has('vite.config.ts') || files.has('vite.config.js')) return 'react-vite';

  if (packageJsonContent) {
    const pkg = tryParseJSON(packageJsonContent);
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies };
    if (deps?.next)     return 'next';
    if (deps?.remix)    return 'remix';
    if (deps?.fastify)  return 'fastify';
    if (deps?.hono)     return 'hono';
    if (deps?.express)  return 'express';
  }
  return 'unknown';
}

function tryParseJSON(s: string): Record<string, unknown> | null {
  try { return JSON.parse(s); } catch { return null; }
}

// ── Folder conventions ─────────────────────────────────────────────────────────

export function detectFolderConventions(paths: string[]): FolderConventions {
  const dirs = new Set(paths.map(p => p.split('/').slice(0, -1).join('/')));

  const find = (...candidates: string[]): string =>
    candidates.find(c => [...dirs].some(d => d.endsWith(c))) ?? candidates[0];

  return {
    componentDir: find('components', 'src/components', 'app/components'),
    hooksDir:     find('hooks', 'src/hooks'),
    utilsDir:     find('utils', 'src/utils', 'lib', 'src/lib'),
    typesDir:     find('types', 'src/types', '@types'),
    servicesDir:  find('services', 'src/services', 'api', 'src/api'),
    testDir:      find('__tests__', 'tests', 'src/tests', 'spec'),
  };
}

// ── Framework preferences ──────────────────────────────────────────────────────

export function detectFrameworkPrefs(
  packageJsonContent?: string,
): FrameworkPrefs {
  if (!packageJsonContent) {
    return { stateManagement: [], cssApproach: [], testingLibs: [], preferredLibs: [] };
  }

  const pkg  = tryParseJSON(packageJsonContent);
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies } as Record<string, string>;

  const stateManagement: string[] = [];
  if (deps?.zustand)      stateManagement.push('zustand');
  if (deps?.redux)        stateManagement.push('redux');
  if (deps?.jotai)        stateManagement.push('jotai');
  if (deps?.recoil)       stateManagement.push('recoil');
  if (deps?.['@tanstack/react-query']) stateManagement.push('react-query');

  const cssApproach: string[] = [];
  if (deps?.tailwindcss)        cssApproach.push('tailwind');
  if (deps?.['styled-components']) cssApproach.push('styled-components');
  if (deps?.emotion)            cssApproach.push('emotion');
  if (deps?.['@mui/material'])  cssApproach.push('mui');

  const testingLibs: string[] = [];
  if (deps?.vitest)  testingLibs.push('vitest');
  if (deps?.jest)    testingLibs.push('jest');
  if (deps?.mocha)   testingLibs.push('mocha');
  if (deps?.playwright) testingLibs.push('playwright');
  if (deps?.cypress) testingLibs.push('cypress');

  const preferredLibs = Object.keys(deps ?? {}).filter(k =>
    /^(@shadcn|framer-motion|lucide|react-icons|recharts|zod|drizzle)/.test(k),
  );

  return { stateManagement, cssApproach, testingLibs, preferredLibs };
}

// ── Project summary ───────────────────────────────────────────────────────────

export interface ProjectStructureSummary {
  framework:        DetectedFramework;
  fileCount:        number;
  componentCount:   number;
  testCount:        number;
  routeCount:       number;
  hasBackend:       boolean;
  hasDatabase:      boolean;
  hasAuth:          boolean;
  conventions:      FolderConventions;
  frameworkPrefs:   FrameworkPrefs;
  contextString:    string;
}

export function buildProjectStructureSummary(
  paths:              string[],
  packageJsonContent?: string,
): ProjectStructureSummary {
  const pathSet         = new Set(paths);
  const framework       = detectFramework(pathSet, packageJsonContent);
  const conventions     = detectFolderConventions(paths);
  const frameworkPrefs  = detectFrameworkPrefs(packageJsonContent);

  const componentCount  = paths.filter(p => /\.(tsx|jsx)$/.test(p) && !/test|spec/.test(p)).length;
  const testCount       = paths.filter(p => /\.(test|spec)\.(ts|js|tsx|jsx)$/.test(p)).length;
  const routeCount      = paths.filter(p => /routes?\/|pages?\//.test(p)).length;
  const hasBackend      = paths.some(p => /server|api|backend|express/.test(p));
  const hasDatabase     = paths.some(p => /db|database|drizzle|prisma|schema/.test(p));
  const hasAuth         = paths.some(p => /auth|session|login|clerk|supabase/.test(p));

  const contextString = [
    `Framework: ${framework}`,
    `Files: ${paths.length} total, ${componentCount} components, ${testCount} tests`,
    `Routes: ${routeCount}`,
    `Backend: ${hasBackend}, Database: ${hasDatabase}, Auth: ${hasAuth}`,
    `State: ${frameworkPrefs.stateManagement.join(', ') || 'none detected'}`,
    `CSS: ${frameworkPrefs.cssApproach.join(', ') || 'unknown'}`,
    `Testing: ${frameworkPrefs.testingLibs.join(', ') || 'none detected'}`,
    `Components in: ${conventions.componentDir}`,
    `Hooks in: ${conventions.hooksDir}`,
  ].join('\n');

  return {
    framework, fileCount: paths.length, componentCount, testCount, routeCount,
    hasBackend, hasDatabase, hasAuth, conventions, frameworkPrefs, contextString,
  };
}

// ── File placement ────────────────────────────────────────────────────────────

export function suggestFilePath(
  fileName:    string,
  type:        'component' | 'hook' | 'util' | 'type' | 'test' | 'service',
  conventions: FolderConventions,
): string {
  const dirMap: Record<typeof type, string> = {
    component: conventions.componentDir,
    hook:      conventions.hooksDir,
    util:      conventions.utilsDir,
    type:      conventions.typesDir,
    service:   conventions.servicesDir,
    test:      conventions.testDir,
  };
  const dir = dirMap[type];
  return `${dir}/${fileName}`;
}
