// ── V6.4: Real Build Execution Engine ────────────────────────────────────────
// Replaces prediction-based validation with actual npm install + Vite build.
// All execution is isolated inside /tmp/nexogen-runs/{buildId} workspaces.
//
// Architecture:
//   setupWorkspace()  — create dir + write files + npm install (once per build)
//   rebuildWorkspace() — update files on disk + vite build (per repair pass)
//   teardownWorkspace() — cleanup temp dir (even on failure)
//   buildRepairTargets() — Phase 8 targeted context (no token explosion)

import { spawn } from 'child_process';
import { mkdir, writeFile, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { classifyInstallOutput, classifyBuildOutput } from './errorClassifier.js';
import type { RealBuildError } from './errorClassifier.js';

export type { RealBuildError } from './errorClassifier.js';

// ── Types ────────────────────────────────────────────────────────────────────

export type BuildStatus =
  | 'IDLE'
  | 'INSTALLING'
  | 'BUILDING'
  | 'RUNNING'
  | 'REPAIRING'
  | 'PASSED'
  | 'FAILED';

export interface ProjectFile {
  name: string;
  path?: string;
  content: string;
  lang: string;
}

export interface SetupResult {
  workspaceDir: string;
  installSuccess: boolean;
  installDurationMs: number;
  errors: RealBuildError[];
  installOutput: string;
}

export interface BuildRunResult {
  success: boolean;
  errors: RealBuildError[];
  warnings: RealBuildError[];
  output: string;
  durationMs: number;
}

export interface RepairTarget {
  file: ProjectFile;
  errors: RealBuildError[];
  context: string;
}

// ── Phase 12: Security ────────────────────────────────────────────────────────

const WORKSPACE_ROOT = '/tmp/nexogen-runs';
const NPM_CACHE_DIR  = '/tmp/nexogen-npm-cache';

// Whitelisted base commands only
const ALLOWED_CMDS = new Set(['npm', 'npx', 'node']);

function assertSafePath(p: string): void {
  const normalized = p.replace(/\/+/g, '/');
  if (!normalized.startsWith(WORKSPACE_ROOT) && !normalized.startsWith(NPM_CACHE_DIR)) {
    throw new Error(`[Security] Path '${p}' is outside allowed workspace root`);
  }
}

// ── Phase 2: Isolated Workspace ───────────────────────────────────────────────

export async function teardownWorkspace(dir: string): Promise<void> {
  if (!dir) return;
  try {
    assertSafePath(dir);
    await rm(dir, { recursive: true, force: true });
  } catch {
    // Never fail on cleanup
  }
}

// ── Scaffold Generation ───────────────────────────────────────────────────────

const KNOWN_VERSIONS: Record<string, string> = {
  'react': '^18.3.0',
  'react-dom': '^18.3.0',
  'react-router-dom': '^6.22.0',
  'lucide-react': '^0.344.0',
  'framer-motion': '^11.0.0',
  'clsx': '^2.1.0',
  'tailwind-merge': '^2.2.0',
  '@radix-ui/react-slot': '^1.0.2',
  'recharts': '^2.10.0',
  'zustand': '^4.5.0',
  'axios': '^1.6.0',
  'date-fns': '^3.3.0',
  'react-hook-form': '^7.51.0',
  'zod': '^3.22.0',
  '@tanstack/react-query': '^5.18.0',
  'react-hot-toast': '^2.4.1',
  'react-select': '^5.8.0',
  'react-dropzone': '^14.2.3',
  'react-chartjs-2': '^5.2.0',
  'chart.js': '^4.4.0',
  '@types/react': '^18.3.0',
  '@types/react-dom': '^18.3.0',
  '@vitejs/plugin-react': '^4.2.0',
  'typescript': '^5.3.0',
  'vite': '^5.1.0',
};

const CORE_DEPS = ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'];
const CORE_DEV  = ['@types/react', '@types/react-dom', '@vitejs/plugin-react', 'typescript', 'vite'];

function buildPackageJson(extraPackages: string[]): string {
  const deps: Record<string, string> = {};
  const devDeps: Record<string, string> = {};

  for (const pkg of CORE_DEPS) {
    deps[pkg] = KNOWN_VERSIONS[pkg] ?? 'latest';
  }
  for (const pkg of CORE_DEV) {
    devDeps[pkg] = KNOWN_VERSIONS[pkg] ?? 'latest';
  }

  // Add extra packages resolved by the dependency resolver
  for (const pkg of extraPackages) {
    if (!pkg || pkg.startsWith('.') || pkg.startsWith('/')) continue;
    if (deps[pkg] || devDeps[pkg]) continue;
    const version = KNOWN_VERSIONS[pkg] ?? 'latest';
    deps[pkg] = version;
  }

  return JSON.stringify({
    name: 'nexogen-build',
    version: '0.0.1',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite --port 0',
      build: 'vite build',
      preview: 'vite preview --port 0',
    },
    dependencies: deps,
    devDependencies: devDeps,
  }, null, 2);
}

const VITE_CONFIG_TS = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress noisy non-critical warnings
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      },
    },
  },
});
`;

const TSCONFIG_JSON = JSON.stringify({
  compilerOptions: {
    target: 'ES2020',
    useDefineForClassFields: true,
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    module: 'ESNext',
    skipLibCheck: true,
    moduleResolution: 'bundler',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    jsx: 'react-jsx',
    strict: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
    allowJs: true,
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
  },
  include: ['src', 'vite.config.ts'],
}, null, 2);

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const MAIN_TSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

// ── File Writing ──────────────────────────────────────────────────────────────

async function writeProjectFiles(workspaceDir: string, files: ProjectFile[]): Promise<void> {
  assertSafePath(workspaceDir);

  for (const file of files) {
    // Resolve the full relative path within the workspace
    let relPath: string;
    if (file.path && file.path !== '' && file.path !== '/') {
      // path like "src/components/" + name like "Header.tsx"
      relPath = join(file.path.replace(/^\//, ''), file.name);
    } else if (file.name.includes('/')) {
      // name already encodes directory: "src/components/Header.tsx"
      relPath = file.name;
    } else if (['package.json', 'index.html', 'vite.config.ts', 'tsconfig.json', '.env', '.replit', 'replit.nix', 'README.md', '.env.example'].includes(file.name)) {
      relPath = file.name;
    } else {
      // Flat file — place under src/
      relPath = join('src', file.name);
    }

    const fullPath = join(workspaceDir, relPath);
    assertSafePath(fullPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.content, 'utf8');
  }
}

// ── Phase 12: Secure Process Runner ──────────────────────────────────────────

interface RunOpts {
  cwd: string;
  timeoutMs: number;
  onLine?: (line: string) => void;
}

function runCmd(
  cmd: string,
  args: string[],
  opts: RunOpts
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (!ALLOWED_CMDS.has(cmd)) throw new Error(`[Security] Command '${cmd}' is not whitelisted`);
  assertSafePath(opts.cwd);

  return new Promise((resolve) => {
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      HOME: opts.cwd,
      npm_config_cache: NPM_CACHE_DIR,
      npm_config_prefer_offline: 'true',
    };

    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      text.split('\n').filter(l => l.trim()).forEach(l => opts.onLine?.(l));
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      text.split('\n').filter(l => l.trim()).forEach(l => opts.onLine?.(l));
    });

    // Phase 13: Resource limits — kill on timeout
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      stderr += '\n[BUILD TIMEOUT]';
      resolve({ exitCode: 124, stdout, stderr });
    }, opts.timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, stdout, stderr });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ exitCode: 1, stdout, stderr: stderr + '\n' + err.message });
    });
  });
}

// ── Phase 3: Real npm Install ─────────────────────────────────────────────────

type LogFn = (type: 'info' | 'warn' | 'error' | 'success', msg: string) => void;

async function runInstall(workspaceDir: string, onLog?: LogFn): Promise<{ success: boolean; output: string; durationMs: number }> {
  const t0 = Date.now();
  onLog?.('info', 'Running npm install...');

  await mkdir(NPM_CACHE_DIR, { recursive: true }).catch(() => {});

  const { exitCode, stdout, stderr } = await runCmd('npm', [
    'install',
    '--prefer-offline',
    '--no-audit',
    '--no-fund',
    '--legacy-peer-deps',
    '--loglevel=warn',
  ], {
    cwd: workspaceDir,
    timeoutMs: 180_000,     // Phase 13: 180s install timeout
    onLine: (line) => {
      if (/warn|error/i.test(line)) onLog?.('warn', `[npm] ${line}`);
    },
  });

  const durationMs = Date.now() - t0;
  const combined = stdout + '\n' + stderr;
  const success = exitCode === 0;

  if (success) {
    onLog?.('success', `npm install done in ${(durationMs / 1000).toFixed(1)}s`);
  } else {
    onLog?.('error', `npm install failed (exit ${exitCode}) in ${(durationMs / 1000).toFixed(1)}s`);
  }

  return { success, output: combined, durationMs };
}

// ── Phase 4: Real Vite Build ──────────────────────────────────────────────────

async function runBuild(workspaceDir: string, onLog?: LogFn): Promise<{ exitCode: number; output: string; durationMs: number }> {
  const t0 = Date.now();
  onLog?.('info', 'Running vite build...');

  const { exitCode, stdout, stderr } = await runCmd('npm', ['run', 'build'], {
    cwd: workspaceDir,
    timeoutMs: 120_000,     // Phase 13: 120s build timeout
    onLine: (line) => {
      if (line.trim()) onLog?.('info', `[vite] ${line}`);
    },
  });

  const durationMs = Date.now() - t0;
  const combined = stdout + '\n' + stderr;

  if (exitCode === 0) {
    onLog?.('success', `vite build passed in ${(durationMs / 1000).toFixed(1)}s`);
  } else {
    onLog?.('error', `vite build failed (exit ${exitCode}) in ${(durationMs / 1000).toFixed(1)}s`);
  }

  return { exitCode, output: combined, durationMs };
}

// ── Phase 5: Runtime Startup Check ───────────────────────────────────────────
// Lightweight: start vite preview, wait 8s, check if it booted without crashing.

export async function executeRuntimeCheck(
  workspaceDir: string,
  onLog?: LogFn
): Promise<{ success: boolean; durationMs: number }> {
  const t0 = Date.now();
  onLog?.('info', 'Runtime startup check...');

  let booted = false;
  const child = spawn('npm', ['run', 'preview'], {
    cwd: workspaceDir,
    env: { ...process.env as Record<string, string>, HOME: workspaceDir, npm_config_cache: NPM_CACHE_DIR },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (d: Buffer) => {
    if (/local:/i.test(d.toString())) booted = true;
  });
  child.stderr?.on('data', (d: Buffer) => {
    if (/local:/i.test(d.toString())) booted = true;
  });

  await new Promise(r => setTimeout(r, 8_000));   // Phase 13: 60s cap, 8s check
  child.kill('SIGTERM');

  const durationMs = Date.now() - t0;
  if (booted) onLog?.('success', `Runtime startup OK in ${(durationMs / 1000).toFixed(1)}s`);
  else onLog?.('warn', 'Runtime startup could not be fully verified (non-blocking)');

  return { success: booted, durationMs };
}

// ── Phase 2+3: Setup Workspace (create + install once) ───────────────────────

export async function setupWorkspace(
  files: ProjectFile[],
  extraPackages: string[],
  onLog?: LogFn
): Promise<SetupResult> {
  // Create isolated directory
  const buildId = crypto.randomUUID();
  const workspaceDir = join(WORKSPACE_ROOT, buildId);
  await mkdir(workspaceDir, { recursive: true });
  assertSafePath(workspaceDir);

  onLog?.('info', `Workspace: ${workspaceDir}`);

  // Write scaffold files
  await writeFile(join(workspaceDir, 'package.json'), buildPackageJson(extraPackages), 'utf8');
  await writeFile(join(workspaceDir, 'vite.config.ts'), VITE_CONFIG_TS, 'utf8');
  await writeFile(join(workspaceDir, 'tsconfig.json'), TSCONFIG_JSON, 'utf8');
  await writeFile(join(workspaceDir, 'index.html'), INDEX_HTML, 'utf8');

  // Write project files
  await mkdir(join(workspaceDir, 'src'), { recursive: true });
  await writeProjectFiles(workspaceDir, files);

  // Ensure main.tsx exists (required entry point)
  const hasMains = files.some(f => f.name === 'main.tsx' || f.name.endsWith('/main.tsx'));
  if (!hasMains) {
    await writeFile(join(workspaceDir, 'src', 'main.tsx'), MAIN_TSX, 'utf8');
  }

  onLog?.('info', `Wrote ${files.length} project files`);

  // Phase 3: npm install (once per workspace)
  const { success: installSuccess, output: installOutput, durationMs: installDurationMs } = await runInstall(workspaceDir, onLog);
  const errors = classifyInstallOutput(installOutput, installSuccess ? 0 : 1);

  if (!installSuccess) {
    for (const err of errors.slice(0, 3)) {
      onLog?.('error', `  → [${err.category}] ${err.message}`);
    }
  }

  return { workspaceDir, installSuccess, installDurationMs, errors, installOutput };
}

// ── Phase 4: Rebuild (update files + vite build) ─────────────────────────────
// Called on each repair pass. Rewrites modified files in-place, then rebuilds.

export async function rebuildWorkspace(
  workspaceDir: string,
  files: ProjectFile[],
  onLog?: LogFn
): Promise<BuildRunResult> {
  assertSafePath(workspaceDir);

  // Overwrite files on disk (picks up in-memory repairs)
  await writeProjectFiles(workspaceDir, files);

  // Phase 4: vite build
  const { exitCode, output, durationMs } = await runBuild(workspaceDir, onLog);
  const { errors, warnings } = classifyBuildOutput(output, exitCode);

  if (!exitCode) {
    onLog?.('success', `Build passed — ${files.length} files`);
  } else {
    for (const err of errors.slice(0, 3)) {
      onLog?.('error', `  → [${err.category}${err.file ? ' ' + err.file : ''}${err.line ? ':' + err.line : ''}] ${err.message}`);
    }
  }

  return { success: exitCode === 0, errors, warnings, output, durationMs };
}

// ── Phase 8: Targeted Repair Context ─────────────────────────────────────────
// Builds minimal per-file repair context to avoid token explosion.
// Sends: failing file + its direct project imports + error list.

export function buildRepairTargets(
  buildErrors: RealBuildError[],
  files: ProjectFile[]
): RepairTarget[] {
  // Group errors by file (normalize path separators)
  const errorsByFile = new Map<string, RealBuildError[]>();
  for (const err of buildErrors) {
    if (!err.file) continue;
    // Normalize: strip leading "./" and workspace paths
    const key = err.file.replace(/^\.\//, '').split('/').pop() ?? err.file;
    if (!errorsByFile.has(key)) errorsByFile.set(key, []);
    errorsByFile.get(key)!.push(err);
  }

  // Handle global import errors (no specific file)
  const globalImportErrors = buildErrors.filter(e => e.category === 'import' && !e.file);
  const globalFileErrors = buildErrors.filter(e => ['build', 'dependency'].includes(e.category) && !e.file);

  const targets: RepairTarget[] = [];

  for (const [fileKey, errs] of errorsByFile.entries()) {
    // Find the matching project file
    const file = files.find(f =>
      f.name === fileKey ||
      f.name.endsWith('/' + fileKey) ||
      (f.path && (f.path + f.name).endsWith(fileKey))
    );
    if (!file) continue;

    // Extract import paths mentioned in errors to pull in direct dependencies
    const relatedFiles = files
      .filter(rf => {
        if (rf.name === file.name) return false;
        // Check if the failing file imports from this file
        return file.content.includes(`from './${rf.name.replace(/\.(tsx?|jsx?)$/, '')}`) ||
               file.content.includes(`from "./${rf.name.replace(/\.(tsx?|jsx?)$/, '')}`);
      })
      .slice(0, 2) // max 2 related files for context
      .map(rf => `\n--- ${rf.name} (direct import) ---\n${rf.content.slice(0, 400)}`);

    const errorList = errs.map(e =>
      `- [${e.category}${e.line ? ':' + e.line : ''}] ${e.message}${e.rootCause ? ' → ' + e.rootCause : ''}`
    ).join('\n');

    const context = [
      `Fix the following build errors in this file.`,
      `File: ${file.name}`,
      `\nErrors:\n${errorList}`,
      relatedFiles.length ? `\nContext from imports:${relatedFiles.join('')}` : '',
      `\nFile to fix:\n${file.content}`,
    ].filter(Boolean).join('\n');

    targets.push({ file, errors: errs, context });
  }

  // If all errors are global (no file pinpointed), target App.tsx or main entry
  if (targets.length === 0 && (globalImportErrors.length > 0 || globalFileErrors.length > 0)) {
    const entryFile = files.find(f => f.name === 'App.tsx' || f.name.endsWith('/App.tsx'));
    if (entryFile) {
      const errorList = [...globalImportErrors, ...globalFileErrors]
        .map(e => `- [${e.category}] ${e.message}`).join('\n');
      targets.push({
        file: entryFile,
        errors: [...globalImportErrors, ...globalFileErrors],
        context: `Fix the following build errors.\nFile: ${entryFile.name}\nErrors:\n${errorList}\n\nFile:\n${entryFile.content}`,
      });
    }
  }

  return targets;
}

// ── Phase 10: Runtime State ───────────────────────────────────────────────────

export interface RuntimeState {
  status: BuildStatus;
  pass: number;
  buildPassed: boolean;
  runtimePassed: boolean;
  errors: RealBuildError[];
  totalDurationMs: number;
  repairAttempts: number;
}

export function buildRuntimeState(
  status: BuildStatus,
  pass: number,
  buildPassed: boolean,
  errors: RealBuildError[],
  totalDurationMs: number,
  repairAttempts: number
): RuntimeState {
  return {
    status,
    pass,
    buildPassed,
    runtimePassed: buildPassed,
    errors,
    totalDurationMs,
    repairAttempts,
  };
}
