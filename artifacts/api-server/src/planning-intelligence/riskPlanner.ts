// ── V9.7 Planning Intelligence — Phase 8: Risk Planning ───────────────────────
import type { RequirementBlueprint, RiskBlueprint, Risk, RiskLevel, RiskCategory } from './planningTypes.js';

function risk(
  id: string, name: string, level: RiskLevel, category: RiskCategory,
  mitigation: string, probability: number, impact: number,
): Risk {
  return { id, name, level, category, mitigation, probability, impact, riskScore: Math.round(probability * impact * 10) / 10 };
}

export function analyzeRisks(
  req: RequirementBlueprint,
  complexity: 'simple' | 'standard' | 'enterprise',
): RiskBlueprint {
  const risks: Risk[] = [];

  // ── Always-present baseline risks ────────────────────────────────────────
  risks.push(risk('r-scope', 'Scope creep', 'medium', 'timeline',
    'Lock down requirements before sprint 1; use feature flags for late additions', 0.5, 6));
  risks.push(risk('r-tech-debt', 'Technical debt accumulation', 'medium', 'technical',
    'Code reviews + linting + automated tests from day 1', 0.4, 5));

  // ── Authentication / Security ─────────────────────────────────────────────
  if (req.authentication) {
    risks.push(risk('r-auth-vuln', 'Authentication vulnerability', 'high', 'security',
      'Use battle-tested libs (NextAuth/Clerk); never roll custom crypto', 0.3, 9));
    risks.push(risk('r-session', 'Session hijacking / token theft', 'high', 'security',
      'HTTPS-only; httpOnly cookies; short JWT TTL + refresh tokens', 0.25, 9));
  }

  // ── Authorization ─────────────────────────────────────────────────────────
  if (req.authorization) {
    risks.push(risk('r-rbac', 'Privilege escalation via misconfigured RBAC', 'high', 'security',
      'Deny-by-default; test all role boundaries; audit logs', 0.2, 10));
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  if (req.payments) {
    risks.push(risk('r-payment', 'Payment processing failure / fraud', 'high', 'security',
      'PCI-DSS compliance; Stripe webhooks + idempotency keys; fraud detection', 0.2, 10));
    risks.push(risk('r-billing', 'Billing logic errors (over/under-charge)', 'high', 'technical',
      'Double-entry accounting; webhook retry + dedup; invoice reconciliation', 0.25, 9));
  }

  // ── Real-time / Websockets ────────────────────────────────────────────────
  if (req.components.includes('real-time') || req.notifications) {
    risks.push(risk('r-realtime', 'WebSocket connection instability', 'medium', 'technical',
      'Fallback to polling; heartbeat/reconnect; connection limit monitoring', 0.35, 6));
  }

  // ── File Upload ───────────────────────────────────────────────────────────
  if (req.components.includes('file-upload')) {
    risks.push(risk('r-upload', 'Malicious file upload', 'high', 'security',
      'MIME type + extension validation; virus scanning; sandboxed storage', 0.2, 8));
  }

  // ── Database ─────────────────────────────────────────────────────────────
  if (req.database.length > 3) {
    risks.push(risk('r-db-perf', 'Database performance degradation under load', 'medium', 'performance',
      'Index all FK + query columns; query explain plans; connection pooling', 0.35, 7));
  }

  // ── Complexity / Architecture ─────────────────────────────────────────────
  if (complexity === 'enterprise') {
    risks.push(risk('r-arch', 'Monolith bottleneck at scale', 'high', 'architecture',
      'Design modular boundaries now; extract services when traffic demands', 0.4, 8));
    risks.push(risk('r-migration', 'DB migration failure in production', 'medium', 'technical',
      'Blue-green deployments; backward-compatible migrations; tested rollback', 0.3, 8));
    risks.push(risk('r-compliance', 'GDPR/compliance violations', 'high', 'compliance',
      'Data retention policies; consent management; right-to-erasure API', 0.25, 9));
  }

  // ── Timeline ─────────────────────────────────────────────────────────────
  if (req.totalRequirements > 20) {
    risks.push(risk('r-timeline', 'Timeline overrun from requirement complexity', 'medium', 'timeline',
      'Phased releases; MVP scope lock; defer optional features', 0.5, 6));
  }

  // ── Technical debt ────────────────────────────────────────────────────────
  const technicalDebt: string[] = [];
  if (req.totalRequirements > 15) technicalDebt.push('High feature count may require future refactoring');
  if (req.payments && !req.authentication) technicalDebt.push('Payments without auth — security gap');
  if (complexity === 'enterprise') technicalDebt.push('Enterprise scale requires future microservice extraction');

  // Categorize
  const highRisks = risks.filter(r => r.level === 'high');
  const mediumRisks = risks.filter(r => r.level === 'medium');
  const lowRisks = risks.filter(r => r.level === 'low');
  const unknownRisks = risks.filter(r => r.level === 'unknown');

  const overallRiskLevel: RiskLevel = highRisks.length >= 3 ? 'high' : highRisks.length >= 1 ? 'medium' : 'low';
  const riskScore = Math.min(10, Math.round(risks.reduce((s, r) => s + r.riskScore, 0) / Math.max(1, risks.length)));

  return { risks, highRisks, mediumRisks, lowRisks, unknownRisks, technicalDebt, overallRiskLevel, riskScore };
}
