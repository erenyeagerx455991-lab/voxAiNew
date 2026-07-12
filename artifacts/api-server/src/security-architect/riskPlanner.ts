// ── V8.9 Security Architect — Phase 19: Security Risk Planner ────────────────
// NOTE: function is planSecurityRisks to avoid collision with qa-architect/riskPlanner.ts
import type { BackendType }          from '../backend-architect/backendTypes.js';
import type { SecurityRiskBlueprint, SecurityRiskItem, SecurityRiskLevel } from './securityTypes.js';

const BASE_RISKS: SecurityRiskItem[] = [
  { category: 'Token compromise',      level: 'High',   description: 'JWT stolen via XSS or MITM',            mitigation: 'Short-lived tokens + HttpOnly cookies + HSTS' },
  { category: 'Broken access control', level: 'Critical',description:'IDOR or missing authz checks',           mitigation: 'RBAC unit tests + OWASP access control scan' },
  { category: 'SQL injection',         level: 'Critical',description: 'Unsanitized query parameter injection', mitigation: 'Parameterized queries + ORM + WAF' },
  { category: 'Dependency vuln',       level: 'High',   description: 'CVE in third-party npm package',        mitigation: 'Dependabot + Snyk in CI' },
  { category: 'Secret leak',           level: 'High',   description: 'API key committed to source control',   mitigation: 'Pre-commit hooks + secret scanning + rotation' },
  { category: 'CSRF',                  level: 'Medium', description: 'Cross-site request forgery on forms',   mitigation: 'CSRF tokens + SameSite cookies' },
  { category: 'Insecure deserialization',level:'Medium',description: 'Untrusted data deserialized unsafely',  mitigation: 'Input validation + avoid eval/Function()' },
  { category: 'Security misconfiguration',level:'Medium',description:'Open ports or debug endpoints exposed', mitigation: 'Automated config scan in CI' },
];

const FINANCIAL_RISK: SecurityRiskItem = {
  category: 'Payment fraud', level: 'Critical',
  description: 'Transaction manipulation or card data theft',
  mitigation: 'PCI DSS controls + fraud scoring + 3DS2',
};
const AI_RISK: SecurityRiskItem = {
  category: 'Prompt injection', level: 'Critical',
  description: 'Adversarial prompts bypass AI safety',
  mitigation: 'Input sanitization + output filtering + prompt hardening',
};
const MT_RISK: SecurityRiskItem = {
  category: 'Cross-tenant data leak', level: 'Critical',
  description: 'Tenant isolation bypassed via query manipulation',
  mitigation: 'Row-level security + tenant_id enforcement + integration tests',
};

export function planSecurityRisks(t: BackendType): SecurityRiskBlueprint {
  const items: SecurityRiskItem[] = [...BASE_RISKS];
  if (t === 'Finance' || t === 'ECommerce')   items.push(FINANCIAL_RISK);
  if (t === 'AIPlatform')                     items.push(AI_RISK);
  if (['MultiTenant','SaaSBackend','ERPBackend','CRMBackend','Marketplace'].includes(t)) items.push(MT_RISK);

  const critical = items.filter(i => i.level === 'Critical').length;
  const high     = items.filter(i => i.level === 'High').length;
  const medium   = items.filter(i => i.level === 'Medium').length;
  const low      = items.filter(i => i.level === 'Low').length;
  const riskScore= parseFloat(Math.min(10, critical * 3 + high * 1.5 + medium * 0.5 + low * 0.1).toFixed(1));

  return {
    items,
    criticalCount:    critical,
    highCount:        high,
    mediumCount:      medium,
    lowCount:         low,
    overallRiskScore: riskScore,
    mitigationPriority: items.filter(i => i.level === 'Critical' || i.level === 'High').map(i => i.category),
  };
}
