// ── V8.9 Security Architecture Integration — Facade Unit Tests ───────────────
//
// Verifies that the facade re-exports every public symbol.
// This catches accidental omissions when new planners or types are added.
import { describe, it, expect } from 'vitest';
import * as facade from '../../security-architect/securityFacade.js';

describe('securityFacade — type exports', () => {
  // Type-only exports compile away; we verify the module loads cleanly instead.
  it('imports without throwing', () => {
    expect(facade).toBeDefined();
  });
});

describe('securityFacade — planner function exports', () => {
  const expectedPlanners = [
    'planPrivacy',
    'planCompliance',
    'planThreatModel',
    'planEncryption',
    'planSecuritySecrets',
    'planKeyManagement',
    'planSession',
    'planAudit',
    'planOWASP',
    'planSecurityHeaders',
    'planNetworkSecurity',
    'planRateLimiting',
    'planSecurityMonitoring',
    'planIncident',
    'planSecurityRisks',
  ];

  for (const name of expectedPlanners) {
    it(`exports ${name} as a function`, () => {
      expect(typeof (facade as Record<string, unknown>)[name]).toBe('function');
    });
  }
});

describe('securityFacade — infrastructure exports', () => {
  it('exports runSecurityArchitect', () => {
    expect(typeof facade.runSecurityArchitect).toBe('function');
  });

  it('exports validateSecurityIntelligence', () => {
    expect(typeof facade.validateSecurityIntelligence).toBe('function');
  });

  it('exports recordSecurityArchitectBuild', () => {
    expect(typeof facade.recordSecurityArchitectBuild).toBe('function');
  });

  it('exports getSecurityArchitectMetrics', () => {
    expect(typeof facade.getSecurityArchitectMetrics).toBe('function');
  });

  it('exports learnFromSecurityBuild', () => {
    expect(typeof facade.learnFromSecurityBuild).toBe('function');
  });

  it('exports getSecurityLearningStats', () => {
    expect(typeof facade.getSecurityLearningStats).toBe('function');
  });

  it('exports initSecurityArchitectPersistence', () => {
    expect(typeof facade.initSecurityArchitectPersistence).toBe('function');
  });

  it('exports persistSecuritySnapshot', () => {
    expect(typeof facade.persistSecuritySnapshot).toBe('function');
  });

  it('exports getSecurityArchitectPersistenceStats', () => {
    expect(typeof facade.getSecurityArchitectPersistenceStats).toBe('function');
  });
});

describe('securityFacade — constant exports', () => {
  it('exports ALL_SECURITY_DIMENSIONS as a non-empty array', () => {
    expect(Array.isArray(facade.ALL_SECURITY_DIMENSIONS)).toBe(true);
    expect(facade.ALL_SECURITY_DIMENSIONS.length).toBeGreaterThan(0);
  });
});

describe('securityFacade — runSecurityArchitect integration smoke', () => {
  it('produces a blueprint with a positive overallScore', () => {
    const { blueprint, overallScore } = facade.runSecurityArchitect('SaaSBackend');
    expect(overallScore).toBeGreaterThan(0);
    expect(blueprint.qualityScores.length).toBeGreaterThan(0);
  });

  it('validates correctly via the facade validator', () => {
    const { blueprint } = facade.runSecurityArchitect('Healthcare');
    const result = facade.validateSecurityIntelligence(blueprint);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(10);
  });
});
