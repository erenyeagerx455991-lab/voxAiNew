// ── V8.9 Security Architect — Phase 12: Threat Model Planner ─────────────────
import type { BackendType }     from '../backend-architect/backendTypes.js';
import type { ThreatModelBlueprint, ThreatItem, ThreatCategory, SecurityRiskLevel } from './securityTypes.js';

const BASE_THREATS: Array<{ category: ThreatCategory; severity: SecurityRiskLevel; description: string; mitigation: string }> = [
  { category: 'Spoofing',              severity: 'High',     description: 'Identity spoofing via forged tokens',          mitigation: 'Strict JWT validation + RS256 signing' },
  { category: 'Tampering',             severity: 'High',     description: 'Request payload tampering in transit',         mitigation: 'TLS 1.3 + request signing for sensitive ops' },
  { category: 'Repudiation',           severity: 'Medium',   description: 'User denies performing privileged actions',    mitigation: 'Immutable audit log with user attribution' },
  { category: 'InformationDisclosure', severity: 'High',     description: 'Sensitive data in error responses or logs',   mitigation: 'Error sanitization + log redaction' },
  { category: 'DenialOfService',       severity: 'Medium',   description: 'Volumetric attack exhausts API resources',    mitigation: 'Rate limiting + Cloudflare DDoS protection' },
  { category: 'ElevationOfPrivilege',  severity: 'Critical', description: 'Privilege escalation via broken authz',       mitigation: 'RBAC enforcement + permission tests' },
  { category: 'SupplyChain',           severity: 'Medium',   description: 'Malicious dependencies in npm packages',      mitigation: 'Dependabot + Snyk scanning in CI' },
];

const AI_THREAT: ThreatItem = {
  category: 'PromptInjection', severity: 'Critical',
  description: 'Adversarial prompts bypass AI safety controls',
  mitigation: 'Input sanitization + output filtering + rate limits on AI endpoints',
};
const INSIDER_THREAT: ThreatItem = {
  category: 'InsiderThreats', severity: 'High',
  description: 'Privileged insider exfiltrates sensitive data',
  mitigation: 'Audit logs + least-privilege IAM + separation of duties',
};

export function planThreatModel(t: BackendType): ThreatModelBlueprint {
  const isAI       = t === 'AIPlatform';
  const isEnterprise = ['Enterprise','Finance','Healthcare','ERPBackend'].includes(t);

  const threats: ThreatItem[] = [...BASE_THREATS];
  if (isAI)        threats.push(AI_THREAT);
  if (isEnterprise)threats.push(INSIDER_THREAT);

  const attackSurface = [
    'Public REST API',
    'Authentication endpoints',
    'File upload surface',
    ...(isAI        ? ['AI prompt endpoints','Model API proxy'] : []),
    ...(isEnterprise? ['Admin console','Internal service mesh'] : []),
    'WebSocket connections',
    'OAuth redirect URIs',
  ];

  return {
    threats,
    criticalCount: threats.filter(t => t.severity === 'Critical').length,
    highCount:     threats.filter(t => t.severity === 'High').length,
    attackSurface,
    hasSTRIDE:     true,
  };
}
