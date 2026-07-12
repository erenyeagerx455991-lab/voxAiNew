// ── V8.9 Security Architecture Integration — Blueprint Validator ─────────────
import type {
  SecurityIntelligenceBlueprint,
  SecurityIntelligenceQualityScore,
  SecurityIntelligenceDimension,
} from './securityTypes.js';

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

function ratio(flags: boolean[]): number {
  if (flags.length === 0) return 10;
  return clamp((flags.filter(Boolean).length / flags.length) * 10);
}

function scorePrivacy(bp: SecurityIntelligenceBlueprint): number {
  const p = bp.privacy;
  return ratio([
    p.hasGDPR, p.hasCCPA, p.hasDataRetentionPolicy, p.hasConsentManagement,
    p.hasCookiePolicy, p.hasDataExport, p.hasRightToDelete, p.hasRightToAccess,
    p.hasDataResidency,
  ]);
}

function scoreCompliance(bp: SecurityIntelligenceBlueprint): number {
  const c = bp.compliance;
  if (c.standards.length === 0) return 7; // nothing required is a valid, non-penalized state
  let s = 10 - c.gapCount * 0.3;
  if (!c.hasContinuousMonitoring) s -= 1;
  return clamp(s);
}

function scoreThreatModel(bp: SecurityIntelligenceBlueprint): number {
  const tm = bp.threatModel;
  let s = 6;
  if (tm.hasSTRIDE) s += 1;
  if (tm.threats.length >= 5) s += 1;
  if (tm.attackSurface.length >= 3) s += 1;
  if (tm.threats.every(t => !!t.mitigation)) s += 1;
  return clamp(s);
}

function scoreEncryption(bp: SecurityIntelligenceBlueprint): number {
  const e = bp.encryption;
  return ratio([
    e.hasHTTPS, e.hasEncryptionAtRest, e.hasEncryptionInTransit,
    e.hasDatabaseEncryption, e.hasObjectStorageEncryption, e.hasFieldEncryption,
  ]);
}

function scoreSecrets(bp: SecurityIntelligenceBlueprint): number {
  const s = bp.secrets;
  return ratio([
    s.hasSecretRotation, s.hasEnvSecrets, s.hasAPIKeyManagement,
    s.hasOAuthSecrets, s.hasSigningKeys, s.hasWebhookSecrets,
  ]);
}

function scoreKeyManagement(bp: SecurityIntelligenceBlueprint): number {
  const k = bp.keyManagement;
  return ratio([
    k.hasKMS, k.hasKeyRotation, k.hasBackupKeys,
    k.hasRecoveryKeys, k.hasSigningKeys, k.hasEncryptionKeys,
  ]);
}

function scoreSession(bp: SecurityIntelligenceBlueprint): number {
  const s = bp.session;
  return ratio([
    s.hasAccessToken, s.hasRefreshToken, s.hasTokenRotation,
    s.hasLogout, s.hasDeviceSessions, s.hasSessionRevocation,
  ]);
}

function scoreAudit(bp: SecurityIntelligenceBlueprint): number {
  const a = bp.audit;
  return ratio([
    a.hasAuditLogs, a.hasSecurityLogs, a.hasAuthLogs, a.hasPermissionChangeLogs,
    a.hasRoleChangeLogs, a.hasAPIAccessLogs, a.hasAdminActionLogs, a.hasComplianceLogs,
  ]);
}

function scoreOWASP(bp: SecurityIntelligenceBlueprint): number {
  return clamp(bp.owasp.owaspScore);
}

function scoreSecurityHeaders(bp: SecurityIntelligenceBlueprint): number {
  const h = bp.securityHeaders;
  return ratio([
    h.hasCSP, h.hasHSTS, h.hasXFrameOptions, h.hasXContentTypeOptions,
    h.hasPermissionsPolicy, h.hasReferrerPolicy, h.hasCrossOriginPolicies,
  ]);
}

function scoreNetworkSecurity(bp: SecurityIntelligenceBlueprint): number {
  const n = bp.networkSecurity;
  return ratio([
    n.hasFirewall, n.hasPrivateNetwork, n.hasPublicNetworkControls,
    n.hasIngressControl, n.hasEgressControl, n.hasVPN, n.hasZeroTrust,
  ]);
}

function scoreRateLimit(bp: SecurityIntelligenceBlueprint): number {
  const r = bp.rateLimit;
  return ratio([
    r.hasPerUserLimit, r.hasPerIPLimit, r.hasPerAPILimit, r.hasBurstProtection,
    r.hasSlidingWindow, r.hasAdaptiveLimits, r.hasBotProtection,
  ]);
}

function scoreMonitoring(bp: SecurityIntelligenceBlueprint): number {
  const m = bp.monitoring;
  return ratio([
    m.hasSecurityEvents, m.hasAnomalyDetection, m.hasLoginMonitoring,
    m.hasThreatDetection, m.hasBehaviorAnalytics, m.hasSIEM,
  ]);
}

function scoreIncident(bp: SecurityIntelligenceBlueprint): number {
  const i = bp.incident;
  return ratio([
    i.hasDetection, i.hasContainment, i.hasRecovery, i.hasPostmortem,
    i.hasEscalationMatrix, i.hasRunbooks, i.oncallRotation,
  ]);
}

function scoreRisk(bp: SecurityIntelligenceBlueprint): number {
  // overallRiskScore is 0–10 where higher = riskier; invert to a quality score.
  return clamp(10 - bp.risk.overallRiskScore);
}

// Weights sum to 1.00
const WEIGHTS: Record<SecurityIntelligenceDimension, number> = {
  privacy:          0.10,
  compliance:       0.10,
  threatModel:      0.08,
  encryption:       0.10,
  secrets:          0.08,
  keyManagement:    0.06,
  session:          0.06,
  audit:            0.08,
  owasp:            0.10,
  securityHeaders:  0.06,
  networkSecurity:  0.06,
  rateLimit:        0.04,
  monitoring:       0.04,
  incident:         0.02,
  risk:             0.02,
};

const SCORERS: Record<SecurityIntelligenceDimension, (bp: SecurityIntelligenceBlueprint) => number> = {
  privacy:          scorePrivacy,
  compliance:       scoreCompliance,
  threatModel:      scoreThreatModel,
  encryption:       scoreEncryption,
  secrets:          scoreSecrets,
  keyManagement:    scoreKeyManagement,
  session:          scoreSession,
  audit:            scoreAudit,
  owasp:            scoreOWASP,
  securityHeaders:  scoreSecurityHeaders,
  networkSecurity:  scoreNetworkSecurity,
  rateLimit:        scoreRateLimit,
  monitoring:       scoreMonitoring,
  incident:         scoreIncident,
  risk:             scoreRisk,
};

const RATIONALE: Record<SecurityIntelligenceDimension, string> = {
  privacy:          'GDPR/CCPA rights, retention, and consent management coverage',
  compliance:       'Standards mapped, checklist gap count, and continuous monitoring',
  threatModel:      'STRIDE coverage, attack surface breadth, and mitigation completeness',
  encryption:       'Transit, at-rest, database, storage, and field-level encryption coverage',
  secrets:          'Rotation, API key, OAuth, signing, and webhook secret handling',
  keyManagement:    'KMS presence, key rotation, backup, and recovery key coverage',
  session:          'Token lifecycle, rotation, device sessions, and revocation support',
  audit:            'Audit/security/auth/permission/role/API/admin log coverage',
  owasp:            'OWASP Top 10 control coverage score',
  securityHeaders:  'CSP, HSTS, frame/content-type, permissions, and referrer policy coverage',
  networkSecurity:  'Firewall, network segmentation, ingress/egress, VPN, and zero-trust coverage',
  rateLimit:        'Per-user/IP/API limiting, burst protection, and adaptive/bot defenses',
  monitoring:       'Security event, anomaly, login, threat, and SIEM monitoring coverage',
  incident:         'Detection, containment, recovery, postmortem, and on-call readiness',
  risk:             'Aggregate residual risk across critical/high/medium/low findings',
};

export function validateSecurityIntelligence(
  bp: SecurityIntelligenceBlueprint,
): { qualityScores: SecurityIntelligenceQualityScore[]; overallScore: number; recommendations: string[] } {
  const qualityScores: SecurityIntelligenceQualityScore[] = [];
  let weighted = 0;

  for (const dim of Object.keys(WEIGHTS) as SecurityIntelligenceDimension[]) {
    const score = parseFloat(SCORERS[dim](bp).toFixed(2));
    qualityScores.push({ dimension: dim, score, rationale: RATIONALE[dim] });
    weighted += score * WEIGHTS[dim];
  }

  const overallScore = parseFloat(weighted.toFixed(2));

  const recommendations: string[] = [];
  for (const qs of qualityScores) {
    if (qs.score < 6) {
      recommendations.push(`Improve ${qs.dimension}: ${qs.rationale} (score ${qs.score}/10)`);
    }
  }
  if (bp.compliance.standards.length > 0 && !bp.compliance.hasContinuousMonitoring) {
    recommendations.push('Add continuous compliance monitoring given mapped standards');
  }
  if (bp.risk.criticalCount > 0) {
    recommendations.push(`Prioritize mitigation for ${bp.risk.criticalCount} critical risk item(s)`);
  }
  if (!bp.monitoring.hasSIEM && bp.threatModel.criticalCount > 0) {
    recommendations.push('Consider SIEM given critical threats in the threat model');
  }

  return { qualityScores, overallScore, recommendations };
}
