// ── V8.9 Security Architecture Integration — Unit Tests ──────────────────────
import { describe, it, expect, beforeEach } from 'vitest';
import { runSecurityArchitect } from '../../security-architect/securityArchitect.js';
import {
  planPrivacy }            from '../../security-architect/privacyPlanner.js';
import { planCompliance }         from '../../security-architect/compliancePlanner.js';
import { planThreatModel }        from '../../security-architect/threatModelPlanner.js';
import { planEncryption }         from '../../security-architect/encryptionPlanner.js';
import { planSecuritySecrets }    from '../../security-architect/secretPlanner.js';
import { planKeyManagement }      from '../../security-architect/keyManagementPlanner.js';
import { planSession }            from '../../security-architect/sessionPlanner.js';
import { planAudit }              from '../../security-architect/auditPlanner.js';
import { planOWASP }              from '../../security-architect/owaspPlanner.js';
import { planSecurityHeaders }    from '../../security-architect/securityHeaderPlanner.js';
import { planNetworkSecurity }    from '../../security-architect/networkSecurityPlanner.js';
import { planRateLimiting }       from '../../security-architect/rateLimitPlanner.js';
import { planSecurityMonitoring } from '../../security-architect/monitoringPlanner.js';
import { planIncident }           from '../../security-architect/incidentPlanner.js';
import { planSecurityRisks }      from '../../security-architect/riskPlanner.js';
import { validateSecurityIntelligence } from '../../security-architect/securityValidator.js';
import {
  getSecurityArchitectMetrics,
  recordSecurityArchitectBuild,
  resetSecurityArchitectMetrics,
} from '../../security-architect/securityMetrics.js';
import { ALL_SECURITY_DIMENSIONS } from '../../security-architect/securityTypes.js';
import type { BackendType } from '../../backend-architect/backendTypes.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BACKEND_TYPES: BackendType[] = [
  'SaaSBackend', 'Healthcare', 'Finance', 'ECommerce', 'AIPlatform',
  'LandingAPI', 'Dashboard', 'DeveloperPlatform', 'InternalTool', 'Marketplace',
];

// ── runSecurityArchitect — smoke tests ────────────────────────────────────────

describe('runSecurityArchitect — core output', () => {
  it('returns a SecurityIntelligenceOutput with required fields', () => {
    const out = runSecurityArchitect('SaaSBackend');
    expect(out).toHaveProperty('blueprint');
    expect(out).toHaveProperty('overallScore');
    expect(out).toHaveProperty('processingTimeMs');
  });

  it('overallScore is between 0 and 10', () => {
    const out = runSecurityArchitect('SaaSBackend');
    expect(out.overallScore).toBeGreaterThanOrEqual(0);
    expect(out.overallScore).toBeLessThanOrEqual(10);
  });

  it('processingTimeMs is non-negative', () => {
    const out = runSecurityArchitect('SaaSBackend');
    expect(out.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('blueprint contains all required sub-blueprints', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    expect(blueprint).toHaveProperty('privacy');
    expect(blueprint).toHaveProperty('compliance');
    expect(blueprint).toHaveProperty('threatModel');
    expect(blueprint).toHaveProperty('encryption');
    expect(blueprint).toHaveProperty('secrets');
    expect(blueprint).toHaveProperty('keyManagement');
    expect(blueprint).toHaveProperty('session');
    expect(blueprint).toHaveProperty('audit');
    expect(blueprint).toHaveProperty('owasp');
    expect(blueprint).toHaveProperty('securityHeaders');
    expect(blueprint).toHaveProperty('networkSecurity');
    expect(blueprint).toHaveProperty('rateLimit');
    expect(blueprint).toHaveProperty('monitoring');
    expect(blueprint).toHaveProperty('incident');
    expect(blueprint).toHaveProperty('risk');
    expect(blueprint).toHaveProperty('qualityScores');
    expect(blueprint).toHaveProperty('overallScore');
    expect(blueprint).toHaveProperty('recommendations');
  });

  it('qualityScores is a non-empty array', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    expect(Array.isArray(blueprint.qualityScores)).toBe(true);
    expect(blueprint.qualityScores.length).toBeGreaterThan(0);
  });

  it('every qualityScore has dimension and score between 0-10', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    for (const qs of blueprint.qualityScores) {
      expect(typeof qs.dimension).toBe('string');
      expect(qs.score).toBeGreaterThanOrEqual(0);
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });

  it('recommendations is an array of strings', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    expect(Array.isArray(blueprint.recommendations)).toBe(true);
    for (const rec of blueprint.recommendations) {
      expect(typeof rec).toBe('string');
    }
  });
});

// ── runSecurityArchitect — runs across all backend types ─────────────────────

describe('runSecurityArchitect — backend type coverage', () => {
  for (const backendType of BACKEND_TYPES) {
    it(`executes without error for ${backendType}`, () => {
      expect(() => runSecurityArchitect(backendType)).not.toThrow();
    });

    it(`returns a valid overallScore for ${backendType}`, () => {
      const { overallScore } = runSecurityArchitect(backendType);
      expect(overallScore).toBeGreaterThanOrEqual(0);
      expect(overallScore).toBeLessThanOrEqual(10);
    });
  }
});

// ── runSecurityArchitect — no duplicate auth/authz planners ──────────────────

describe('runSecurityArchitect — no duplicate backend planner fields', () => {
  it('does NOT produce an authArchitecture field (owned by BackendArchitect)', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    expect(blueprint).not.toHaveProperty('authArchitecture');
  });

  it('does NOT produce a permissionArchitecture field (owned by BackendArchitect)', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    expect(blueprint).not.toHaveProperty('permissionArchitecture');
  });
});

// ── Individual planners — shape contracts ─────────────────────────────────────

describe('planPrivacy — shape contract', () => {
  it('returns required fields', () => {
    const p = planPrivacy('SaaSBackend');
    expect(typeof p.hasGDPR).toBe('boolean');
    expect(typeof p.hasCCPA).toBe('boolean');
    expect(typeof p.hasConsentManagement).toBe('boolean');
    expect(typeof p.hasRightToDelete).toBe('boolean');
    expect(typeof p.hasDataRetentionPolicy).toBe('boolean');
    expect(typeof p.retentionDays).toBe('number');
  });
});

describe('planCompliance — shape contract', () => {
  it('returns a standards array', () => {
    const c = planCompliance('Healthcare');
    expect(Array.isArray(c.standards)).toBe(true);
    expect(c.standards.length).toBeGreaterThan(0);
  });

  it('Healthcare includes HIPAA', () => {
    const c = planCompliance('Healthcare');
    expect(c.standards).toContain('HIPAA');
  });

  it('Finance includes PCIDSS or SOC2', () => {
    const c = planCompliance('Finance');
    const hasFinanceStandard = c.standards.includes('PCIDSS') || c.standards.includes('SOC2');
    expect(hasFinanceStandard).toBe(true);
  });
});

describe('planThreatModel — shape contract', () => {
  it('returns a threats array', () => {
    const tm = planThreatModel('SaaSBackend');
    expect(Array.isArray(tm.threats)).toBe(true);
  });

  it('each threat has category and severity', () => {
    const tm = planThreatModel('SaaSBackend');
    for (const t of tm.threats) {
      expect(typeof t.category).toBe('string');
      expect(typeof t.severity).toBe('string');
    }
  });
});

describe('planEncryption — shape contract', () => {
  it('returns encryption flags', () => {
    const e = planEncryption('SaaSBackend');
    expect(typeof e.hasHTTPS).toBe('boolean');
    expect(typeof e.hasEncryptionAtRest).toBe('boolean');
    expect(typeof e.hasEncryptionInTransit).toBe('boolean');
    expect(typeof e.tlsVersion).toBe('string');
    expect(typeof e.algorithm).toBe('string');
  });

  it('Enterprise types (Healthcare, Finance) have full encryption', () => {
    for (const t of ['Healthcare', 'Finance'] as BackendType[]) {
      const e = planEncryption(t);
      expect(e.hasEncryptionAtRest).toBe(true);
      expect(e.hasEncryptionInTransit).toBe(true);
    }
  });
});

describe('planSecuritySecrets — shape contract', () => {
  it('returns secrets fields', () => {
    const s = planSecuritySecrets('SaaSBackend');
    expect(typeof s.hasSecretRotation).toBe('boolean');
    expect(typeof s.vaultStrategy).toBe('string');
    expect(typeof s.rotationPeriodDays).toBe('number');
  });
});

describe('planKeyManagement — shape contract', () => {
  it('returns key management fields', () => {
    const km = planKeyManagement('SaaSBackend');
    expect(typeof km.hasKMS).toBe('boolean');
    expect(typeof km.hasKeyRotation).toBe('boolean');
    expect(typeof km.rotationPeriodDays).toBe('number');
  });
});

describe('planSession — shape contract', () => {
  it('returns session policy fields', () => {
    const s = planSession('SaaSBackend');
    expect(typeof s.hasAccessToken).toBe('boolean');
    expect(typeof s.hasRefreshToken).toBe('boolean');
    expect(typeof s.idleTimeoutMinutes).toBe('number');
    expect(typeof s.absoluteTimeoutHours).toBe('number');
    expect(s.idleTimeoutMinutes).toBeGreaterThan(0);
  });
});

describe('planAudit — shape contract', () => {
  it('returns audit configuration', () => {
    const a = planAudit('SaaSBackend');
    expect(typeof a.hasAuditLogs).toBe('boolean');
    expect(typeof a.hasSecurityLogs).toBe('boolean');
    expect(typeof a.hasAuthLogs).toBe('boolean');
    expect(typeof a.retentionDays).toBe('number');
    expect(typeof a.logFormat).toBe('string');
  });
});

describe('planOWASP — shape contract', () => {
  it('returns OWASP boolean flags', () => {
    const o = planOWASP('SaaSBackend');
    expect(typeof o.hasInjectionProtection).toBe('boolean');
    expect(typeof o.hasBrokenAuthProtection).toBe('boolean');
    expect(typeof o.hasXSSProtection).toBe('boolean');
    expect(typeof o.hasCSRFProtection).toBe('boolean');
  });
});

describe('planSecurityHeaders — shape contract', () => {
  it('returns header configuration', () => {
    const h = planSecurityHeaders('SaaSBackend');
    expect(typeof h.hasCSP).toBe('boolean');
    expect(typeof h.hasHSTS).toBe('boolean');
  });
});

describe('planNetworkSecurity — shape contract', () => {
  it('returns network security configuration', () => {
    const n = planNetworkSecurity('SaaSBackend');
    expect(typeof n.hasFirewall).toBe('boolean');
    expect(typeof n.hasZeroTrust).toBe('boolean');
  });
});

describe('planRateLimiting — shape contract', () => {
  it('returns rate limit configuration', () => {
    const r = planRateLimiting('SaaSBackend');
    expect(typeof r.hasPerUserLimit).toBe('boolean');
    expect(typeof r.hasPerIPLimit).toBe('boolean');
    expect(typeof r.hasBurstProtection).toBe('boolean');
    expect(typeof r.perIPRequestsPerMin).toBe('number');
    expect(typeof r.perUserRequestsPerMin).toBe('number');
    expect(r.perIPRequestsPerMin).toBeGreaterThan(0);
  });
});

describe('planSecurityMonitoring — shape contract', () => {
  it('returns monitoring configuration', () => {
    const m = planSecurityMonitoring('SaaSBackend');
    expect(typeof m.hasAnomalyDetection).toBe('boolean');
    expect(typeof m.hasSIEM).toBe('boolean');
  });
});

describe('planIncident — shape contract', () => {
  it('returns incident response configuration', () => {
    const i = planIncident('SaaSBackend');
    expect(typeof i.hasDetection).toBe('boolean');
    expect(typeof i.hasContainment).toBe('boolean');
    expect(typeof i.hasRecovery).toBe('boolean');
    expect(typeof i.hasRunbooks).toBe('boolean');
    expect(typeof i.oncallRotation).toBe('boolean');
    expect(typeof i.mttrMinutes).toBe('number');
  });
});

describe('planSecurityRisks — shape contract', () => {
  it('returns an items array', () => {
    const r = planSecurityRisks('SaaSBackend');
    expect(Array.isArray(r.items)).toBe(true);
    expect(r.items.length).toBeGreaterThan(0);
  });

  it('each risk item has level, description and mitigation', () => {
    const r = planSecurityRisks('SaaSBackend');
    for (const risk of r.items) {
      expect(['Critical', 'High', 'Medium', 'Low']).toContain(risk.level);
      expect(typeof risk.description).toBe('string');
      expect(typeof risk.mitigation).toBe('string');
    }
  });

  it('returns aggregate count fields', () => {
    const r = planSecurityRisks('SaaSBackend');
    expect(typeof r.criticalCount).toBe('number');
    expect(typeof r.highCount).toBe('number');
    expect(typeof r.overallRiskScore).toBe('number');
  });

  it('Finance adds payment fraud risk', () => {
    const r = planSecurityRisks('Finance');
    const hasPayment = r.items.some(i => i.category.toLowerCase().includes('payment'));
    expect(hasPayment).toBe(true);
  });

  it('AIPlatform adds prompt injection risk', () => {
    const r = planSecurityRisks('AIPlatform');
    const hasAI = r.items.some(i => i.category.toLowerCase().includes('prompt'));
    expect(hasAI).toBe(true);
  });
});

// ── validateSecurityIntelligence — scoring contract ──────────────────────────

describe('validateSecurityIntelligence', () => {
  it('returns qualityScores, overallScore, and recommendations', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    const result = validateSecurityIntelligence(blueprint);
    expect(result).toHaveProperty('qualityScores');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('recommendations');
  });

  it('overallScore is between 0 and 10', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    const { overallScore } = validateSecurityIntelligence(blueprint);
    expect(overallScore).toBeGreaterThanOrEqual(0);
    expect(overallScore).toBeLessThanOrEqual(10);
  });

  it('all quality score values are capped at 10', () => {
    const { blueprint } = runSecurityArchitect('Finance');
    const { qualityScores } = validateSecurityIntelligence(blueprint);
    for (const qs of qualityScores) {
      expect(qs.score).toBeLessThanOrEqual(10);
    }
  });
});

// ── securityMetrics — aggregate counters ─────────────────────────────────────
// NOTE: runSecurityArchitect() calls recordSecurityArchitectBuild() internally.
// To get a clean slate for manual-recording tests, we get the blueprint first,
// then reset, then record manually. This avoids the internal side-effect.

describe('securityMetrics — recordSecurityArchitectBuild', () => {
  it('starts at zero after reset', () => {
    resetSecurityArchitectMetrics();
    const m = getSecurityArchitectMetrics();
    expect(m.totalBuilds).toBe(0);
    expect(m.averageScore).toBe(0);
  });

  it('increments totalBuilds by 1 when recording manually', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    resetSecurityArchitectMetrics();                             // clear internal record
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, blueprint.overallScore);
    expect(getSecurityArchitectMetrics().totalBuilds).toBe(1);
  });

  it('averageScore reflects only manually recorded builds', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    resetSecurityArchitectMetrics();
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, 7.0);
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, 9.0);
    const m = getSecurityArchitectMetrics();
    expect(m.averageScore).toBeCloseTo(8.0, 0);
  });

  it('topBackendTypes tracks type distribution correctly', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    resetSecurityArchitectMetrics();
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, blueprint.overallScore);
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, blueprint.overallScore);
    recordSecurityArchitectBuild('Healthcare',  blueprint.qualityScores, blueprint.overallScore);
    const m = getSecurityArchitectMetrics();
    const top = m.topBackendTypes[0];
    expect(top.type).toBe('SaaSBackend');
    expect(top.count).toBe(2);
  });

  it('scoreByDimension maps all recorded dimensions', () => {
    const { blueprint } = runSecurityArchitect('SaaSBackend');
    resetSecurityArchitectMetrics();
    recordSecurityArchitectBuild('SaaSBackend', blueprint.qualityScores, blueprint.overallScore);
    const m = getSecurityArchitectMetrics();
    expect(Object.keys(m.scoreByDimension).length).toBeGreaterThan(0);
  });
});

// ── ALL_SECURITY_DIMENSIONS — completeness ───────────────────────────────────

describe('ALL_SECURITY_DIMENSIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(ALL_SECURITY_DIMENSIONS)).toBe(true);
    expect(ALL_SECURITY_DIMENSIONS.length).toBeGreaterThan(0);
  });

  it('includes expected dimensions', () => {
    expect(ALL_SECURITY_DIMENSIONS).toContain('privacy');
    expect(ALL_SECURITY_DIMENSIONS).toContain('compliance');
    expect(ALL_SECURITY_DIMENSIONS).toContain('threatModel');
    expect(ALL_SECURITY_DIMENSIONS).toContain('encryption');
  });
});
