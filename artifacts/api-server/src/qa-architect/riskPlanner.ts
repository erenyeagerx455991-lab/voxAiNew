// ── V8.8 QA Architect — Phase 17: Risk Planner ───────────────────────────────
import type { BackendType } from '../backend-architect/backendTypes.js';
import type { RiskBlueprint, RiskItem, RiskLevel } from './qaTypes.js';

interface SubsystemSpec { subsystem: string; level: RiskLevel; reason: string; mitigation: string }

export function planRisks(t: BackendType): RiskBlueprint {
  const items: SubsystemSpec[] = [
    { subsystem: 'Authentication', level: 'High',   reason: 'Token misuse leads to account takeover', mitigation: 'Penetration tests + JWT rotation' },
    { subsystem: 'Authorization',  level: 'High',   reason: 'Privilege escalation risk',              mitigation: 'RBAC unit tests + OWASP scan' },
    { subsystem: 'Database',       level: 'High',   reason: 'Schema drift & migration failures',       mitigation: 'Migration rollback tests' },
    { subsystem: 'API validation', level: 'Medium', reason: 'Unexpected payloads cause 500s',         mitigation: 'Schema fuzz testing' },
    { subsystem: 'State management',level:'Medium', reason: 'Race conditions on concurrent updates',  mitigation: 'Load tests + optimistic lock tests' },
    { subsystem: 'File uploads',   level: 'Medium', reason: 'Malicious file bypass',                  mitigation: 'Content-type & size validation tests' },
    { subsystem: 'Frontend routing',level:'Low',    reason: 'Deep-link breakage on deploy',           mitigation: 'E2E nav smoke tests' },
    { subsystem: 'UI rendering',   level: 'Low',    reason: 'Visual drift across browsers',           mitigation: 'Cross-browser visual regression' },
    ...(t === 'Finance' || t === 'ECommerce' ? [
      { subsystem: 'Payment',      level: 'High' as RiskLevel,   reason: 'Checkout failure = revenue loss',  mitigation: 'Full payment journey E2E + chaos' },
    ] : []),
    ...(t === 'AIPlatform' ? [
      { subsystem: 'AI prompts',   level: 'High' as RiskLevel,   reason: 'Prompt injection attacks',         mitigation: 'Adversarial prompt test suite' },
      { subsystem: 'AI latency',   level: 'Medium' as RiskLevel, reason: 'LLM timeouts degrade UX',          mitigation: 'Timeout + fallback tests' },
    ] : []),
    ...(['Enterprise','ERPBackend','CRMBackend'].includes(t) ? [
      { subsystem: 'Multi-tenant isolation', level: 'High' as RiskLevel, reason: 'Data leakage between tenants', mitigation: 'Cross-tenant data isolation tests' },
    ] : []),
  ];

  const high   = items.filter(i => i.level === 'High').length;
  const medium = items.filter(i => i.level === 'Medium').length;
  const low    = items.filter(i => i.level === 'Low').length;
  // Risk score: higher = riskier; 0–10
  const riskScore = parseFloat(Math.min(10, (high * 2.5 + medium * 1 + low * 0.3)).toFixed(1));

  const riskItems: RiskItem[] = items.map(i => ({ ...i }));
  const mitigation = items.filter(i => i.level !== 'Low').map(i => i.subsystem);

  return { items: riskItems, highRiskCount: high, mediumRiskCount: medium, lowRiskCount: low, overallRiskScore: riskScore, mitigationPriority: mitigation };
}
