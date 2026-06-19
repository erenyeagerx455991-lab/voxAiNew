// Phase 3 — packageScanner.ts unit tests
import { describe, it, expect, beforeEach } from 'vitest';
import {
  scanPackageJson,
  validateWorkspacePath,
  getSecurityMetrics,
} from '../../runtime/security/packageScanner.js';
import {
  SAFE_PKG, PREINSTALL_PKG, POSTINSTALL_PKG, PREPARE_PKG,
  PREPUBLISH_PKG, SUSPICIOUS_PKG, UNKNOWN_DEP_PKG,
} from '../helpers/fixtures.js';

const WS_DIR = '/tmp/nexogen-runs/test-scan-ws';

describe('packageScanner — scanPackageJson()', () => {
  it('passes a safe React package.json', () => {
    const result = scanPackageJson(SAFE_PKG);
    expect(result.safe).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('blocks preinstall script', () => {
    const result = scanPackageJson(PREINSTALL_PKG);
    expect(result.safe).toBe(false);
    expect(result.violations.some(v => v.includes('preinstall'))).toBe(true);
    expect(result.reason).toBe('dangerous_install_script');
  });

  it('blocks postinstall script', () => {
    const result = scanPackageJson(POSTINSTALL_PKG);
    expect(result.safe).toBe(false);
    expect(result.violations.some(v => v.includes('postinstall'))).toBe(true);
  });

  it('blocks prepare script', () => {
    const result = scanPackageJson(PREPARE_PKG);
    expect(result.safe).toBe(false);
    expect(result.violations.some(v => v.includes('prepare'))).toBe(true);
  });

  it('blocks prepublish script', () => {
    const result = scanPackageJson(PREPUBLISH_PKG);
    expect(result.safe).toBe(false);
    expect(result.violations.some(v => v.includes('prepublish'))).toBe(true);
  });

  it('flags suspicious dependencies (shell/exec patterns) but does not block', () => {
    const result = scanPackageJson(SUSPICIOUS_PKG);
    expect(result.safe).toBe(true); // warn only, not blocked
    expect(result.suspiciousDependencies).toContain('evil-shell-runner');
    expect(result.suspiciousDependencies).toContain('node-exec-helper');
  });

  it('reports unknown (non-allowlisted) dependencies', () => {
    const result = scanPackageJson(UNKNOWN_DEP_PKG);
    expect(result.safe).toBe(true);
    expect(result.unknownDependencies).toContain('some-random-ui-lib');
  });

  it('does not flag react as unknown or suspicious', () => {
    const result = scanPackageJson(SAFE_PKG);
    expect(result.suspiciousDependencies).not.toContain('react');
  });

  it('returns invalid_json reason for malformed input', () => {
    const result = scanPackageJson('{ this is not json }');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('invalid_json');
  });

  it('works with context metadata attached', () => {
    const result = scanPackageJson(SAFE_PKG, { workspaceId: 'ws-001', projectId: 'proj-001' });
    expect(result.safe).toBe(true);
  });
});

describe('packageScanner — validateWorkspacePath()', () => {
  it('allows paths inside workspace root', () => {
    expect(() => validateWorkspacePath('/tmp/nexogen-runs/abc/src/App.tsx', WS_DIR)).not.toThrow();
  });

  it('allows paths inside /tmp/nexogen-npm-cache', () => {
    expect(() => validateWorkspacePath('/tmp/nexogen-npm-cache/registry', WS_DIR)).not.toThrow();
  });

  it('blocks ../ path traversal', () => {
    expect(() => validateWorkspacePath('../../etc/passwd', WS_DIR)).toThrow(/PATH_ESCAPE_BLOCKED/);
  });

  it('blocks absolute path outside workspace', () => {
    expect(() => validateWorkspacePath('/etc/shadow', WS_DIR)).toThrow();
  });

  it('blocks ../ embedded in deeper path', () => {
    expect(() => validateWorkspacePath('/tmp/nexogen-runs/abc/../../secret', WS_DIR)).toThrow(/PATH_ESCAPE_BLOCKED/);
  });
});

describe('packageScanner — getSecurityMetrics()', () => {
  it('returns a valid metrics snapshot', () => {
    const m = getSecurityMetrics();
    expect(typeof m.totalPackageScans).toBe('number');
    expect(typeof m.blockedPackages).toBe('number');
    expect(typeof m.suspiciousPackages).toBe('number');
    expect(typeof m.pathViolations).toBe('number');
    expect(typeof m.safeBuilds).toBe('number');
    expect(typeof m.failedBuilds).toBe('number');
  });
});
