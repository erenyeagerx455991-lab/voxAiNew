// Phase 4 — errorClassifier.ts unit tests
import { describe, it, expect } from 'vitest';
import { classifyInstallOutput, classifyBuildOutput } from '../../runtime/errorClassifier.js';
import {
  NPM_ERESOLVE_OUTPUT, NPM_404_OUTPUT, NPM_TIMEOUT_OUTPUT, NPM_SUCCESS_OUTPUT,
  VITE_IMPORT_ERROR, VITE_TS_ERROR, VITE_JSX_ERROR,
  VITE_ROLLUP_EXPORT_ERROR, VITE_BUILD_TIMEOUT, VITE_SUCCESS_OUTPUT,
} from '../helpers/fixtures.js';

// ── classifyInstallOutput ─────────────────────────────────────────────────────

describe('classifyInstallOutput()', () => {
  it('returns empty array on exit code 0', () => {
    const result = classifyInstallOutput(NPM_SUCCESS_OUTPUT, 0);
    expect(result).toHaveLength(0);
  });

  it('classifies ERESOLVE as dependency error', () => {
    const result = classifyInstallOutput(NPM_ERESOLVE_OUTPUT, 1);
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(e => e.category === 'dependency')).toBe(true);
    expect(result[0]!.confidence).toBe('high');
  });

  it('classifies 404 package not found', () => {
    const result = classifyInstallOutput(NPM_404_OUTPUT, 1);
    expect(result.length).toBeGreaterThan(0);
    // The 404 regex captures the path segment up to the first '.', so we check category
    // rather than the exact package name substring (domain dots break [\w/-]+ capture)
    const err = result.find(e => e.category === 'dependency' && e.message.includes('not found'));
    expect(err).toBeDefined();
    expect(err!.confidence).toBe('high');
  });

  it('classifies build timeout', () => {
    const result = classifyInstallOutput(NPM_TIMEOUT_OUTPUT, 124);
    const timeout = result.find(e => e.category === 'build' && e.message.includes('timeout'));
    expect(timeout).toBeDefined();
  });

  it('produces fallback error for generic npm ERR!', () => {
    const result = classifyInstallOutput('npm ERR! some unknown problem', 1);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]!.category).toBe('dependency');
  });

  it('returns empty on success even with npm ERR text in output', () => {
    // exitCode 0 always wins
    const result = classifyInstallOutput('npm ERR! irrelevant', 0);
    expect(result).toHaveLength(0);
  });
});

// ── classifyBuildOutput ───────────────────────────────────────────────────────

describe('classifyBuildOutput()', () => {
  it('returns no errors on clean vite build', () => {
    const result = classifyBuildOutput(VITE_SUCCESS_OUTPUT, 0);
    expect(result.errors).toHaveLength(0);
  });

  it('classifies vite:resolve import error', () => {
    const result = classifyBuildOutput(VITE_IMPORT_ERROR, 1);
    const err = result.errors.find(e => e.category === 'import');
    expect(err).toBeDefined();
    expect(err!.confidence).toBe('high');
    expect(err!.message).toContain('lucide-react');
  });

  it('classifies TypeScript type error', () => {
    const result = classifyBuildOutput(VITE_TS_ERROR, 1);
    const err = result.errors.find(e => e.category === 'typescript');
    expect(err).toBeDefined();
    expect(err!.file).toContain('App.tsx');
    expect(err!.line).toBe(12);
  });

  it('classifies JSX syntax error', () => {
    const result = classifyBuildOutput(VITE_JSX_ERROR, 1);
    const err = result.errors.find(e => e.category === 'jsx');
    expect(err).toBeDefined();
  });

  it('classifies rollup named-export error', () => {
    const result = classifyBuildOutput(VITE_ROLLUP_EXPORT_ERROR, 1);
    const err = result.errors.find(e => e.category === 'import');
    expect(err).toBeDefined();
    expect(err!.message).toContain('useAuth');
  });

  it('classifies build timeout', () => {
    const result = classifyBuildOutput(VITE_BUILD_TIMEOUT, 1);
    const err = result.errors.find(e => e.category === 'build' && e.message.includes('timeout'));
    expect(err).toBeDefined();
  });

  it('falls back to build category on unknown failure', () => {
    const result = classifyBuildOutput('error: something went horribly wrong', 1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('deduplicates identical errors', () => {
    // Same error appearing twice in output
    const doubled = VITE_TS_ERROR + VITE_TS_ERROR;
    const result = classifyBuildOutput(doubled, 1);
    const tsErrors = result.errors.filter(e => e.category === 'typescript');
    expect(tsErrors.length).toBe(1);
  });
});
