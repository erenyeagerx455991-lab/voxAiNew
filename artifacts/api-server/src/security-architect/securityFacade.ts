// ── V8.9 Security Architecture Integration — Public API Facade ──────────────
export type {
  AuthStrategy,
  AuthzModel,
  TenantModel,
  ComplianceStandard,
  ThreatCategory,
  SecurityRiskLevel,
  SecurityDimension,
  PrivacyBlueprint,
  ComplianceBlueprint,
  ThreatItem,
  ThreatModelBlueprint,
  EncryptionBlueprint,
  SecretsPlannerBlueprint,
  KeyManagementBlueprint,
  SessionBlueprint,
  AuditBlueprint,
  OWASPBlueprint,
  SecurityHeaderBlueprint,
  NetworkSecurityBlueprint,
  RateLimitBlueprint,
  SecurityMonitoringBlueprint,
  IncidentBlueprint,
  SecurityRiskItem,
  SecurityRiskBlueprint,
  SecurityIntelligenceDimension,
  SecurityIntelligenceQualityScore,
  SecurityIntelligenceBlueprint,
  SecurityIntelligenceOutput,
  SecurityIntelligenceLearningRecord,
  SecurityIntelligenceLearningInput,
  SecurityIntelligenceMetricsSnapshot,
} from './securityTypes.js';

export { ALL_SECURITY_DIMENSIONS, ALL_SECURITY_INTELLIGENCE_DIMENSIONS } from './securityTypes.js';

export { planPrivacy }            from './privacyPlanner.js';
export { planCompliance }         from './compliancePlanner.js';
export { planThreatModel }        from './threatModelPlanner.js';
export { planEncryption }         from './encryptionPlanner.js';
export { planSecuritySecrets }    from './secretPlanner.js';
export { planKeyManagement }      from './keyManagementPlanner.js';
export { planSession }            from './sessionPlanner.js';
export { planAudit }              from './auditPlanner.js';
export { planOWASP }              from './owaspPlanner.js';
export { planSecurityHeaders }    from './securityHeaderPlanner.js';
export { planNetworkSecurity }    from './networkSecurityPlanner.js';
export { planRateLimiting }       from './rateLimitPlanner.js';
export { planSecurityMonitoring } from './monitoringPlanner.js';
export { planIncident }           from './incidentPlanner.js';
export { planSecurityRisks }      from './riskPlanner.js';

export { validateSecurityIntelligence } from './securityValidator.js';
export {
  recordSecurityArchitectBuild,
  recordSecurityArchitectLearning,
  getSecurityArchitectMetrics,
  resetSecurityArchitectMetrics,
} from './securityMetrics.js';
export {
  learnFromSecurityBuild,
  getSecurityLearningStats,
  getSecurityLearningRecords,
  resetSecurityLearning,
} from './securityLearning.js';
export {
  initSecurityArchitectPersistence,
  persistSecuritySnapshot,
  getCurrentSecuritySnapshot,
  getSecurityArchitectPersistenceStats,
  resetSecurityArchitectPersistence,
} from './securityPersistence.js';
export type { SecuritySnapshot } from './securityPersistence.js';

export { runSecurityArchitect } from './securityArchitect.js';
