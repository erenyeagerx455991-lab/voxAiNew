// ── V8.9 Security, Privacy & Compliance Architect — Type Definitions ──────────

export type AuthStrategy =
  | 'JWT' | 'Session' | 'OAuth' | 'OAuthPKCE' | 'SSO'
  | 'MagicLink' | 'Passwordless' | 'MFA' | 'Passkeys' | 'SocialLogin';

export type AuthzModel  = 'RBAC' | 'ABAC' | 'PBAC' | 'Hierarchical';
export type TenantModel = 'SingleTenant' | 'SharedDatabase' | 'SharedSchema' | 'DedicatedDatabase' | 'DedicatedCluster';
export type ComplianceStandard = 'SOC2' | 'ISO27001' | 'HIPAA' | 'PCIDSS' | 'GDPR' | 'CCPA' | 'FedRAMP';
export type ThreatCategory =
  | 'Spoofing' | 'Tampering' | 'Repudiation' | 'InformationDisclosure'
  | 'DenialOfService' | 'ElevationOfPrivilege' | 'PromptInjection'
  | 'SupplyChain' | 'InsiderThreats';
export type SecurityRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type SecurityDimension =
  | 'authentication' | 'authorization' | 'encryption' | 'privacy'
  | 'compliance' | 'owasp' | 'threatModel' | 'monitoring'
  | 'incidentResponse' | 'network' | 'secrets' | 'audit';

export const ALL_SECURITY_DIMENSIONS: SecurityDimension[] = [
  'authentication', 'authorization', 'encryption', 'privacy',
  'compliance', 'owasp', 'threatModel', 'monitoring',
  'incidentResponse', 'network', 'secrets', 'audit',
];

// ── Phase blueprints ──────────────────────────────────────────────────────────

export interface AuthenticationBlueprint {
  primaryStrategy:   AuthStrategy;
  strategies:        AuthStrategy[];
  hasMFA:            boolean;
  hasPasswordless:   boolean;
  hasSSO:            boolean;
  hasSocialLogin:    boolean;
  hasPasskeys:       boolean;
  confidence:        number;
  rationale:         string;
}

export interface AuthorizationBlueprint {
  model:             AuthzModel;
  hasRBAC:           boolean;
  hasABAC:           boolean;
  hasPBAC:           boolean;
  hasHierarchicalRoles: boolean;
  roles:             string[];
  hasPermissionMatrix: boolean;
  hasTenantRoles:    boolean;
  hasResourcePolicies: boolean;
}

export interface IdentityBlueprint {
  hasUserIdentity:    boolean;
  hasOrgIdentity:     boolean;
  hasWorkspaceIdentity:boolean;
  hasTeamIdentity:    boolean;
  hasAPIIdentity:     boolean;
  hasServiceIdentity: boolean;
  hasMachineIdentity: boolean;
  identityProvider:   string;
}

export interface MultiTenantBlueprint {
  model:              TenantModel;
  hasIsolation:       boolean;
  hasCrossTenantProtection: boolean;
  isolationLevel:     'Row' | 'Schema' | 'Database' | 'Cluster' | 'None';
  hasDataBoundary:    boolean;
  tenantIdStrategy:   string;
}

export interface EncryptionBlueprint {
  algorithm:          string;          // 'AES-256-GCM'
  tlsVersion:         string;          // '1.3'
  hasHTTPS:           boolean;
  hasEncryptionAtRest:boolean;
  hasEncryptionInTransit: boolean;
  hasDatabaseEncryption: boolean;
  hasObjectStorageEncryption: boolean;
  hasFieldEncryption: boolean;
}

export interface SecretsPlannerBlueprint {
  hasSecretRotation:  boolean;
  vaultStrategy:      string;
  hasEnvSecrets:      boolean;
  hasAPIKeyManagement:boolean;
  hasOAuthSecrets:    boolean;
  hasSigningKeys:     boolean;
  hasWebhookSecrets:  boolean;
  rotationPeriodDays: number;
  provider:           string;
}

export interface KeyManagementBlueprint {
  hasKMS:             boolean;
  provider:           string;
  hasKeyRotation:     boolean;
  rotationPeriodDays: number;
  hasBackupKeys:      boolean;
  hasRecoveryKeys:    boolean;
  hasSigningKeys:     boolean;
  hasEncryptionKeys:  boolean;
}

export interface SessionBlueprint {
  hasAccessToken:     boolean;
  hasRefreshToken:    boolean;
  hasTokenRotation:   boolean;
  idleTimeoutMinutes: number;
  absoluteTimeoutHours:number;
  hasLogout:          boolean;
  hasDeviceSessions:  boolean;
  hasSessionRevocation:boolean;
  accessTokenTTLMinutes: number;
}

export interface AuditBlueprint {
  hasAuditLogs:       boolean;
  hasSecurityLogs:    boolean;
  hasAuthLogs:        boolean;
  hasPermissionChangeLogs: boolean;
  hasRoleChangeLogs:  boolean;
  hasAPIAccessLogs:   boolean;
  hasAdminActionLogs: boolean;
  hasComplianceLogs:  boolean;
  retentionDays:      number;
  logFormat:          string;
}

export interface PrivacyBlueprint {
  hasGDPR:            boolean;
  hasCCPA:            boolean;
  hasDataRetentionPolicy: boolean;
  hasConsentManagement: boolean;
  hasCookiePolicy:    boolean;
  hasDataExport:      boolean;
  hasRightToDelete:   boolean;
  hasRightToAccess:   boolean;
  hasDataResidency:   boolean;
  retentionDays:      number;
}

export interface ComplianceBlueprint {
  standards:          ComplianceStandard[];
  readinessChecklist: Record<ComplianceStandard, string[]>;
  complianceLevel:    'Basic' | 'Standard' | 'Enterprise';
  hasContinuousMonitoring: boolean;
  gapCount:           number;
}

export interface ThreatItem {
  category:    ThreatCategory;
  severity:    SecurityRiskLevel;
  description: string;
  mitigation:  string;
}

export interface ThreatModelBlueprint {
  threats:        ThreatItem[];
  criticalCount:  number;
  highCount:      number;
  attackSurface:  string[];
  hasSTRIDE:      boolean;
}

export interface OWASPBlueprint {
  hasInjectionProtection:     boolean;
  hasBrokenAuthProtection:    boolean;
  hasSensitiveDataProtection: boolean;
  hasXXEProtection:           boolean;
  hasSSRFProtection:          boolean;
  hasXSSProtection:           boolean;
  hasCSRFProtection:          boolean;
  hasBrokenAccessControl:     boolean;
  hasSecurityMisconfigCheck:  boolean;
  hasLoggingMonitoring:       boolean;
  owaspScore:                 number;    // 0–10
}

export interface SecurityHeaderBlueprint {
  hasCSP:              boolean;
  cspPolicy:           string;
  hasHSTS:             boolean;
  hstsMaxAge:          number;
  hasXFrameOptions:    boolean;
  hasXContentTypeOptions: boolean;
  hasPermissionsPolicy:boolean;
  hasReferrerPolicy:   boolean;
  hasCrossOriginPolicies: boolean;
}

export interface NetworkSecurityBlueprint {
  hasFirewall:         boolean;
  hasPrivateNetwork:   boolean;
  hasPublicNetworkControls: boolean;
  hasIngressControl:   boolean;
  hasEgressControl:    boolean;
  hasVPN:              boolean;
  hasZeroTrust:        boolean;
  networkSegments:     string[];
}

export interface RateLimitBlueprint {
  hasPerUserLimit:     boolean;
  hasPerIPLimit:       boolean;
  hasPerAPILimit:      boolean;
  hasBurstProtection:  boolean;
  hasSlidingWindow:    boolean;
  hasAdaptiveLimits:   boolean;
  hasBotProtection:    boolean;
  perIPRequestsPerMin: number;
  perUserRequestsPerMin: number;
}

export interface SecurityMonitoringBlueprint {
  hasSecurityEvents:   boolean;
  hasAnomalyDetection: boolean;
  hasLoginMonitoring:  boolean;
  hasThreatDetection:  boolean;
  hasBehaviorAnalytics:boolean;
  hasSIEM:             boolean;
  alertChannels:       string[];
  retentionDays:       number;
}

export interface IncidentBlueprint {
  hasDetection:        boolean;
  hasContainment:      boolean;
  hasRecovery:         boolean;
  hasPostmortem:       boolean;
  hasEscalationMatrix: boolean;
  hasRunbooks:         boolean;
  mttrMinutes:         number;
  oncallRotation:      boolean;
}

export interface SecurityRiskItem {
  category:    string;
  level:       SecurityRiskLevel;
  description: string;
  mitigation:  string;
}

export interface SecurityRiskBlueprint {
  items:          SecurityRiskItem[];
  criticalCount:  number;
  highCount:      number;
  mediumCount:    number;
  lowCount:       number;
  overallRiskScore: number;    // 0–10; higher = riskier
  mitigationPriority: string[];
}

// ── Validator ─────────────────────────────────────────────────────────────────

export interface SecurityQualityScore {
  dimension: SecurityDimension;
  score:     number;           // 0–10
  rationale: string;
}

export interface SecurityValidationResult {
  qualityScores:    SecurityQualityScore[];
  overallScore:     number;
  confidence:       number;
  recommendations:  string[];
}

// ── Composed blueprint ────────────────────────────────────────────────────────

export interface SecurityBlueprint {
  authentication:     AuthenticationBlueprint;
  authorization:      AuthorizationBlueprint;
  identity:           IdentityBlueprint;
  multiTenant:        MultiTenantBlueprint;
  encryption:         EncryptionBlueprint;
  secrets:            SecretsPlannerBlueprint;
  keyManagement:      KeyManagementBlueprint;
  session:            SessionBlueprint;
  audit:              AuditBlueprint;
  privacy:            PrivacyBlueprint;
  compliance:         ComplianceBlueprint;
  threatModel:        ThreatModelBlueprint;
  owasp:              OWASPBlueprint;
  securityHeaders:    SecurityHeaderBlueprint;
  networkSecurity:    NetworkSecurityBlueprint;
  rateLimit:          RateLimitBlueprint;
  monitoring:         SecurityMonitoringBlueprint;
  incident:           IncidentBlueprint;
  risk:               SecurityRiskBlueprint;
  qualityScores:      SecurityQualityScore[];
  overallScore:       number;
  recommendations:    string[];
}

// ── Orchestrator output ───────────────────────────────────────────────────────

export interface SecurityArchitectOutput {
  blueprint:                   Readonly<SecurityBlueprint>;
  overallScore:                number;
  enrichedPromptWithSecurity:  string;
  processingTimeMs:            number;
}

// ── Metrics ───────────────────────────────────────────────────────────────────

export interface SecurityMetricsSnapshot {
  totalBuilds:              number;
  averageScore:             number;
  averageAuthScore:         number;
  averageAuthzScore:        number;
  averageEncryptionScore:   number;
  averagePrivacyScore:      number;
  averageComplianceScore:   number;
  averageOWASPScore:        number;
  averageNetworkScore:      number;
  averageAuditScore:        number;
  scoreByDimension:         Partial<Record<SecurityDimension, number>>;
  topAuthStrategies:        Array<{ strategy: AuthStrategy; count: number }>;
  topComplianceStandards:   Array<{ standard: ComplianceStandard; count: number }>;
  learningRecordCount:      number;
  lastUpdated:              string;
}
