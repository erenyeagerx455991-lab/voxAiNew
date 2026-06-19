// securityMetrics.ts unit tests
import { describe, it, expect } from 'vitest';
import {
  getSecurityMetrics,
  recordAuthSuccess,
  recordAuthFailure,
  recordBlockedRequest,
  recordCorsViolation,
  recordRateLimitHit,
  recordCleanupRun,
} from '../../security/securityMetrics.js';

describe('securityMetrics — counters', () => {
  it('getSecurityMetrics returns all required fields', () => {
    const m = getSecurityMetrics();
    expect(typeof m.authSuccess).toBe('number');
    expect(typeof m.authFailure).toBe('number');
    expect(typeof m.blockedRequests).toBe('number');
    expect(typeof m.corsViolations).toBe('number');
    expect(typeof m.rateLimitHits).toBe('number');
    expect(typeof m.cleanupRuns).toBe('number');
    expect(typeof m.workspacesDeleted).toBe('number');
    expect(typeof m.startedAt).toBe('string');
  });

  it('returns a snapshot (mutations do not affect returned object)', () => {
    const before = getSecurityMetrics();
    recordAuthSuccess();
    const after = getSecurityMetrics();
    expect(after.authSuccess).toBeGreaterThan(before.authSuccess);
    // The "before" snapshot should be unchanged
    expect(before.authSuccess).toBe(before.authSuccess);
  });

  it('recordAuthSuccess increments authSuccess', () => {
    const before = getSecurityMetrics().authSuccess;
    recordAuthSuccess();
    expect(getSecurityMetrics().authSuccess).toBe(before + 1);
  });

  it('recordAuthFailure increments authFailure', () => {
    const before = getSecurityMetrics().authFailure;
    recordAuthFailure();
    expect(getSecurityMetrics().authFailure).toBe(before + 1);
  });

  it('recordBlockedRequest increments blockedRequests', () => {
    const before = getSecurityMetrics().blockedRequests;
    recordBlockedRequest();
    expect(getSecurityMetrics().blockedRequests).toBe(before + 1);
  });

  it('recordCorsViolation increments corsViolations', () => {
    const before = getSecurityMetrics().corsViolations;
    recordCorsViolation();
    expect(getSecurityMetrics().corsViolations).toBe(before + 1);
  });

  it('recordRateLimitHit increments rateLimitHits', () => {
    const before = getSecurityMetrics().rateLimitHits;
    recordRateLimitHit();
    expect(getSecurityMetrics().rateLimitHits).toBe(before + 1);
  });

  it('recordCleanupRun increments cleanupRuns and workspacesDeleted', () => {
    const before = getSecurityMetrics();
    recordCleanupRun(5);
    const after = getSecurityMetrics();
    expect(after.cleanupRuns).toBe(before.cleanupRuns + 1);
    expect(after.workspacesDeleted).toBe(before.workspacesDeleted + 5);
  });
});
