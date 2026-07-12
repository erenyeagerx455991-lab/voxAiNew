// ── V8.9 Security Architecture Integration — Orchestration Engine ───────────
//
// Activates the pre-existing (previously unwired) planners in this module.
// Does NOT re-plan authentication, authorization, permissions, or rate-limit
// enforcement decisions — those remain owned by Backend Architect
// (authPlanner.ts / permissionPlanner.ts / securityPlanner.ts). This engine
// only orchestrates: privacy, compliance, threat model, encryption, secrets
// lifecycle, key management, session policy, audit, OWASP, security headers,
// network security, rate-limit shape, monitoring, incident response, and risk.
import type { BackendType } from '../backend-architect/backendTypes.js';
import type { SecurityIntelligenceBlueprint, SecurityIntelligenceOutput } from './securityTypes.js';
import { planPrivacy }            from './privacyPlanner.js';
import { planCompliance }         from './compliancePlanner.js';
import { planThreatModel }        from './threatModelPlanner.js';
import { planEncryption }         from './encryptionPlanner.js';
import { planSecuritySecrets }    from './secretPlanner.js';
import { planKeyManagement }      from './keyManagementPlanner.js';
import { planSession }            from './sessionPlanner.js';
import { planAudit }              from './auditPlanner.js';
import { planOWASP }              from './owaspPlanner.js';
import { planSecurityHeaders }    from './securityHeaderPlanner.js';
import { planNetworkSecurity }    from './networkSecurityPlanner.js';
import { planRateLimiting }       from './rateLimitPlanner.js';
import { planSecurityMonitoring } from './monitoringPlanner.js';
import { planIncident }           from './incidentPlanner.js';
import { planSecurityRisks }      from './riskPlanner.js';
import { validateSecurityIntelligence } from './securityValidator.js';
import { recordSecurityArchitectBuild }  from './securityMetrics.js';

export function runSecurityArchitect(backendType: BackendType): SecurityIntelligenceOutput {
  const t0 = Date.now();

  const blueprint: SecurityIntelligenceBlueprint = {
    privacy:          planPrivacy(backendType),
    compliance:       planCompliance(backendType),
    threatModel:      planThreatModel(backendType),
    encryption:       planEncryption(backendType),
    secrets:          planSecuritySecrets(backendType),
    keyManagement:    planKeyManagement(backendType),
    session:          planSession(backendType),
    audit:            planAudit(backendType),
    owasp:            planOWASP(backendType),
    securityHeaders:  planSecurityHeaders(backendType),
    networkSecurity:  planNetworkSecurity(backendType),
    rateLimit:        planRateLimiting(backendType),
    monitoring:       planSecurityMonitoring(backendType),
    incident:         planIncident(backendType),
    risk:             planSecurityRisks(backendType),
    qualityScores:    [],
    overallScore:     0,
    recommendations:  [],
  };

  const { qualityScores, overallScore, recommendations } = validateSecurityIntelligence(blueprint);
  blueprint.qualityScores   = qualityScores;
  blueprint.overallScore    = overallScore;
  blueprint.recommendations = recommendations;

  recordSecurityArchitectBuild(backendType, qualityScores, overallScore);

  return {
    blueprint,
    overallScore,
    processingTimeMs: Date.now() - t0,
  };
}
