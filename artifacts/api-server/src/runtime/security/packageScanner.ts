// ── V6.4.3: Package Security Scanner ─────────────────────────────────────────
// Scans package.json content before any npm install is executed.
// Blocks dangerous lifecycle scripts and reports suspicious/unknown dependencies.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PackageScanResult {
  safe: boolean;
  violations: string[];
  suspiciousDependencies: string[];
  unknownDependencies: string[];
  reason?: string;
}

export interface BuildSecurityReport {
  scriptsBlocked: number;
  suspiciousDependencies: string[];
  unknownDependencies: string[];
  pathViolations: number;
  installProtected: boolean;
}

// ── Phase 6: Dependency Allowlist ─────────────────────────────────────────────

export const SAFE_RUNTIME_DEPENDENCIES = new Set([
  'react',
  'react-dom',
  'react-router-dom',
  'vite',
  'typescript',
  'tailwindcss',
  'lucide-react',
  'framer-motion',
  'zod',
  'clsx',
  'tailwind-merge',
  'recharts',
  'zustand',
  'axios',
  'date-fns',
  'react-hook-form',
  '@tanstack/react-query',
  'react-hot-toast',
  'react-select',
  'react-dropzone',
  'react-chartjs-2',
  'chart.js',
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  '@radix-ui/react-slot',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-popover',
  '@radix-ui/react-toast',
  '@radix-ui/react-tooltip',
  '@radix-ui/react-tabs',
  '@radix-ui/react-select',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-switch',
  '@radix-ui/react-label',
  '@radix-ui/react-separator',
  '@radix-ui/react-avatar',
  '@radix-ui/react-badge',
  'class-variance-authority',
  'cmdk',
  'embla-carousel-react',
  'react-day-picker',
  'vaul',
  'sonner',
  'next-themes',
]);

// ── Phase 3: Dangerous Script Names ───────────────────────────────────────────

const DANGEROUS_SCRIPT_HOOKS = new Set([
  'preinstall',
  'postinstall',
  'prepare',
  'prepublish',
  'postpublish',
  'prepack',
  'postpack',
]);

// ── Phase 7: Suspicious Dependency Patterns ───────────────────────────────────

const SUSPICIOUS_PATTERNS = [
  'shell',
  'exec',
  'spawn',
  'child-process',
  'terminal',
  'bash',
  'powershell',
];

// ── Security Telemetry (Phase 11) ─────────────────────────────────────────────

interface SecurityMetrics {
  totalPackageScans: number;
  blockedPackages: number;
  suspiciousPackages: number;
  pathViolations: number;
  safeBuilds: number;
  failedBuilds: number;
}

const _metrics: SecurityMetrics = {
  totalPackageScans: 0,
  blockedPackages: 0,
  suspiciousPackages: 0,
  pathViolations: 0,
  safeBuilds: 0,
  failedBuilds: 0,
};

export function getSecurityMetrics(): Readonly<SecurityMetrics> {
  return { ..._metrics };
}

export function recordPathViolation(): void {
  _metrics.pathViolations++;
}

export function recordSafeBuild(): void {
  _metrics.safeBuilds++;
}

export function recordFailedBuild(): void {
  _metrics.failedBuilds++;
}

// ── Phase 13: Structured Security Logger ──────────────────────────────────────

export function securityLog(
  event: string,
  details: Record<string, unknown>
): void {
  const entry = {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  };
  console.log(`[${event}] ${JSON.stringify(entry)}`);
}

// ── Phase 2+3: Package JSON Scanner ──────────────────────────────────────────

export function scanPackageJson(
  pkgJsonContent: string,
  context?: { workspaceId?: string; projectId?: string }
): PackageScanResult {
  _metrics.totalPackageScans++;

  securityLog('PACKAGE_SCAN', {
    workspaceId: context?.workspaceId ?? 'unknown',
    projectId: context?.projectId ?? 'unknown',
  });

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(pkgJsonContent);
  } catch {
    securityLog('PACKAGE_SCAN_FAILED', {
      reason: 'invalid_json',
      workspaceId: context?.workspaceId ?? 'unknown',
    });
    return {
      safe: false,
      violations: ['package.json is not valid JSON'],
      suspiciousDependencies: [],
      unknownDependencies: [],
      reason: 'invalid_json',
    };
  }

  const violations: string[] = [];

  // Phase 3: Block dangerous lifecycle scripts
  const scripts = (pkg['scripts'] as Record<string, unknown>) ?? {};
  for (const hook of DANGEROUS_SCRIPT_HOOKS) {
    if (hook in scripts) {
      violations.push(`Dangerous lifecycle script detected: "${hook}"`);
      _metrics.blockedPackages++;

      securityLog('PACKAGE_SCRIPT_BLOCKED', {
        script: hook,
        workspaceId: context?.workspaceId ?? 'unknown',
        projectId: context?.projectId ?? 'unknown',
        reason: 'dangerous_install_script',
      });
    }
  }

  if (violations.length > 0) {
    return {
      safe: false,
      violations,
      suspiciousDependencies: [],
      unknownDependencies: [],
      reason: 'dangerous_install_script',
    };
  }

  // Phase 6+7: Analyze dependencies
  const allDeps: string[] = [
    ...Object.keys((pkg['dependencies'] as Record<string, unknown>) ?? {}),
    ...Object.keys((pkg['devDependencies'] as Record<string, unknown>) ?? {}),
  ];

  const suspiciousDependencies: string[] = [];
  const unknownDependencies: string[] = [];

  for (const dep of allDeps) {
    // Phase 7: Flag suspicious patterns
    const depLower = dep.toLowerCase();
    const isSuspicious = SUSPICIOUS_PATTERNS.some(pat => depLower.includes(pat));
    if (isSuspicious) {
      suspiciousDependencies.push(dep);
      _metrics.suspiciousPackages++;

      securityLog('SUSPICIOUS_DEPENDENCY', {
        dependency: dep,
        workspaceId: context?.workspaceId ?? 'unknown',
        projectId: context?.projectId ?? 'unknown',
        reason: 'suspicious_name_pattern',
      });
    }

    // Phase 6: Report unknown (non-allowlisted) deps — warn only, do not block
    // Strip scope prefix for allowlist check (e.g. @radix-ui/react-slot → check full name)
    if (!SAFE_RUNTIME_DEPENDENCIES.has(dep)) {
      unknownDependencies.push(dep);
    }
  }

  securityLog('PACKAGE_SCAN_COMPLETE', {
    workspaceId: context?.workspaceId ?? 'unknown',
    safe: true,
    totalDeps: allDeps.length,
    suspiciousCount: suspiciousDependencies.length,
    unknownCount: unknownDependencies.length,
  });

  return {
    safe: true,
    violations: [],
    suspiciousDependencies,
    unknownDependencies,
  };
}

// ── Phase 8+9: Workspace Path Validation ──────────────────────────────────────

const WORKSPACE_ROOT = '/tmp/nexogen-runs';
const NPM_CACHE_DIR  = '/tmp/nexogen-npm-cache';

export function validateWorkspacePath(
  p: string,
  workspaceDir: string,
  context?: { workspaceId?: string; projectId?: string }
): void {
  // Reject any path traversal sequences before normalization
  if (p.includes('../') || p.includes('..\\')) {
    _metrics.pathViolations++;
    securityLog('PATH_ESCAPE_BLOCKED', {
      path: p,
      workspaceId: context?.workspaceId ?? 'unknown',
      projectId: context?.projectId ?? 'unknown',
      reason: 'path_traversal_sequence',
    });
    throw new Error(`[PATH_ESCAPE_BLOCKED] Path traversal detected: "${p}"`);
  }

  // Normalize double slashes
  const normalized = p.replace(/\/+/g, '/');

  // Must start within workspace root, npm cache, or the specific workspaceDir
  const allowedRoots = [WORKSPACE_ROOT, NPM_CACHE_DIR, workspaceDir];
  const isAllowed = allowedRoots.some(root => normalized.startsWith(root));

  if (!isAllowed) {
    _metrics.pathViolations++;
    securityLog('PATH_ESCAPE_BLOCKED', {
      path: p,
      workspaceId: context?.workspaceId ?? 'unknown',
      projectId: context?.projectId ?? 'unknown',
      reason: 'outside_workspace_root',
    });
    throw new Error(`[PATH_ESCAPE_BLOCKED] Path "${p}" is outside allowed workspace root`);
  }
}
