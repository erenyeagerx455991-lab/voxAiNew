// Phase 9 — Critical Regression Protection
// These tests ensure security controls cannot be accidentally removed.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '../../..');

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), 'utf8');
}

describe('Critical Regression — npm install --ignore-scripts', () => {
  it('buildExecutor.ts always uses --ignore-scripts', () => {
    const src = read('src/runtime/buildExecutor.ts');
    expect(src).toContain('--ignore-scripts');
  });

  it('--ignore-scripts appears before other install flags (not commented out)', () => {
    const src = read('src/runtime/buildExecutor.ts');
    const match = src.match(/'install'[\s\S]*?'--ignore-scripts'/);
    expect(match).not.toBeNull();
  });
});

describe('Critical Regression — Package Scanner', () => {
  it('packageScanner.ts exports scanPackageJson', () => {
    const src = read('src/runtime/security/packageScanner.ts');
    expect(src).toContain('export function scanPackageJson');
  });

  it('setupWorkspace calls scanPackageJson and aborts if scan fails', () => {
    const src = read('src/runtime/buildExecutor.ts');
    // Scope to the setupWorkspace function body
    const setupStart = src.indexOf('export async function setupWorkspace(');
    expect(setupStart).toBeGreaterThan(0);
    const nextExportIdx = src.indexOf('\nexport ', setupStart + 1);
    const setupBlock = src.slice(setupStart, nextExportIdx > 0 ? nextExportIdx : undefined);
    // Scan must be called
    expect(setupBlock).toContain('scanPackageJson(');
    // Must have an early-return / abort path if scan fails (safe guard)
    const hasAbortPath = setupBlock.includes('!scanResult.safe') || setupBlock.includes('scanResult.safe === false');
    expect(hasAbortPath).toBe(true);
  });

  it('DANGEROUS_SCRIPT_HOOKS includes all required hooks', () => {
    const src = read('src/runtime/security/packageScanner.ts');
    const required = ['preinstall', 'postinstall', 'prepare', 'prepublish', 'prepack', 'postpack'];
    for (const hook of required) {
      expect(src).toContain(`'${hook}'`);
    }
  });
});

describe('Critical Regression — Path Traversal Protection', () => {
  it('validateWorkspacePath is exported from packageScanner', () => {
    const src = read('src/runtime/security/packageScanner.ts');
    expect(src).toContain('export function validateWorkspacePath');
  });

  it('buildExecutor.ts imports validateWorkspacePath', () => {
    const src = read('src/runtime/buildExecutor.ts');
    expect(src).toContain('validateWorkspacePath');
  });

  it('../ traversal detection exists in validateWorkspacePath', () => {
    const src = read('src/runtime/security/packageScanner.ts');
    expect(src).toContain('../');
  });
});

describe('Critical Regression — Auth Middleware', () => {
  it('authMiddleware.ts exports authMiddleware function', () => {
    const src = read('src/security/authMiddleware.ts');
    expect(src).toContain('export function authMiddleware');
  });

  it('authMiddleware reads x-api-key header', () => {
    const src = read('src/security/authMiddleware.ts');
    expect(src).toContain('x-api-key');
  });

  it('authMiddleware returns 401 on rejection', () => {
    const src = read('src/security/authMiddleware.ts');
    expect(src).toContain('401');
    expect(src).toContain('unauthorized');
  });

  it('app.ts registers authMiddleware on /api/agents', () => {
    const src = read('src/app.ts');
    expect(src).toContain('authMiddleware');
    expect(src).toContain('/api/agents');
  });
});

describe('Critical Regression — Rate Limiting', () => {
  it('rateLimiter.ts exports buildRateLimiter', () => {
    const src = read('src/security/rateLimiter.ts');
    expect(src).toContain('export const buildRateLimiter');
  });

  it('rateLimiter.ts exports chatRateLimiter', () => {
    const src = read('src/security/rateLimiter.ts');
    expect(src).toContain('export const chatRateLimiter');
  });

  it('app.ts registers rate limiters', () => {
    const src = read('src/app.ts');
    expect(src).toContain('buildRateLimiter');
    expect(src).toContain('chatRateLimiter');
  });
});

describe('Critical Regression — Helmet & CORS', () => {
  it('app.ts uses helmet()', () => {
    const src = read('src/app.ts');
    expect(src).toContain('helmet(');
  });

  it('app.ts uses corsMiddleware (not open cors())', () => {
    const src = read('src/app.ts');
    expect(src).toContain('corsMiddleware');
    expect(src).not.toContain('app.use(cors())');
  });
});
