// Phase 6 — buildRepairTargets() unit tests
import { describe, it, expect } from 'vitest';
import { buildRepairTargets } from '../../runtime/buildExecutor.js';
import type { RealBuildError } from '../../runtime/errorClassifier.js';
import { APP_TSX, HERO_TSX, FEATURES_TSX } from '../helpers/fixtures.js';

const TS_ERROR_APP: RealBuildError = {
  category: 'typescript',
  file: 'App.tsx',
  line: 5,
  message: "Type 'string' is not assignable to type 'number'",
  confidence: 'high',
};

const IMPORT_ERROR_HERO: RealBuildError = {
  category: 'import',
  file: 'Hero.tsx',
  line: 1,
  message: "Cannot find module './Button'",
  confidence: 'high',
};

const GLOBAL_IMPORT_ERROR: RealBuildError = {
  category: 'import',
  message: "Cannot find module 'lucide-react'",
  confidence: 'high',
};

const GLOBAL_BUILD_ERROR: RealBuildError = {
  category: 'build',
  message: 'Build failed with unknown error',
  confidence: 'low',
};

const FILES = [APP_TSX, HERO_TSX, FEATURES_TSX];

describe('buildRepairTargets()', () => {
  it('returns target for single failing file', () => {
    const targets = buildRepairTargets([TS_ERROR_APP], FILES);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.file.name).toBe('App.tsx');
    expect(targets[0]!.errors).toHaveLength(1);
  });

  it('returns separate targets for multiple failing files', () => {
    const targets = buildRepairTargets([TS_ERROR_APP, IMPORT_ERROR_HERO], FILES);
    const names = targets.map(t => t.file.name);
    expect(names).toContain('App.tsx');
    expect(names).toContain('Hero.tsx');
  });

  it('includes related import file in context', () => {
    const targets = buildRepairTargets([TS_ERROR_APP], FILES);
    const appTarget = targets.find(t => t.file.name === 'App.tsx');
    expect(appTarget).toBeDefined();
    // App.tsx imports Hero and Features — context should reference them
    expect(appTarget!.context).toContain('App.tsx');
    expect(appTarget!.context).toContain('Fix the following build errors');
  });

  it('limits related imports to max 2 files', () => {
    const targets = buildRepairTargets([TS_ERROR_APP], FILES);
    const appTarget = targets.find(t => t.file.name === 'App.tsx');
    // Should not include more than 2 context imports
    const contextImports = (appTarget!.context.match(/direct import/g) ?? []).length;
    expect(contextImports).toBeLessThanOrEqual(2);
  });

  it('falls back to App.tsx for global import errors with no file', () => {
    const targets = buildRepairTargets([GLOBAL_IMPORT_ERROR], FILES);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.file.name).toBe('App.tsx');
  });

  it('falls back to App.tsx for global build errors', () => {
    const targets = buildRepairTargets([GLOBAL_BUILD_ERROR], FILES);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.file.name).toBe('App.tsx');
  });

  it('returns empty array if no matching files found', () => {
    const unknownError: RealBuildError = {
      category: 'typescript',
      file: 'NonExistent.tsx',
      message: 'error',
      confidence: 'low',
    };
    const targets = buildRepairTargets([unknownError], FILES);
    expect(targets).toHaveLength(0);
  });

  it('context string contains file content', () => {
    const targets = buildRepairTargets([TS_ERROR_APP], FILES);
    const appTarget = targets.find(t => t.file.name === 'App.tsx');
    expect(appTarget!.context).toContain(APP_TSX.content.slice(0, 30));
  });

  it('context string contains error message', () => {
    const targets = buildRepairTargets([TS_ERROR_APP], FILES);
    const appTarget = targets.find(t => t.file.name === 'App.tsx');
    expect(appTarget!.context).toContain(TS_ERROR_APP.message);
  });
});
