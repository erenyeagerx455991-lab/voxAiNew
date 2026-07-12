// ── V9.0 Runtime Intelligence — Risk Strategy Planner ────────────────────────
import type { GenerationMode, RiskStrategy, RiskLevel, RuntimeIntelligenceInput } from './runtimeTypes.js';

function selectRiskLevel(mode: GenerationMode, input: RuntimeIntelligenceInput): RiskLevel {
  if (input.hasCompliance || ['Healthcare', 'Finance'].includes(input.backendType)) return 'critical';
  if (mode === 'Enterprise' || mode === 'Strict') return 'high';
  if (input.hasPayments || input.hasAuth) return 'moderate';
  if (mode === 'Experimental') return 'moderate';
  if (mode === 'Fast') return 'low';
  return 'low';
}

function buildMitigationPriority(level: RiskLevel, input: RuntimeIntelligenceInput): string[] {
  const priorities: string[] = [];
  if (level === 'critical' || level === 'high') {
    priorities.push('security-validation', 'compliance-check', 'access-control-review');
  }
  if (input.hasPayments) priorities.push('payment-security-check');
  if (input.hasAuth)     priorities.push('auth-flow-validation');
  if (input.hasRealtime) priorities.push('connection-resilience-test');
  if (level === 'low')   priorities.push('basic-error-handling');
  return priorities.length ? priorities : ['standard-quality-gate'];
}

export function planRiskStrategy(mode: GenerationMode, input: RuntimeIntelligenceInput): RiskStrategy {
  const level = selectRiskLevel(mode, input);
  const mitigationPriority = buildMitigationPriority(level, input);
  const failSafe = level === 'critical' || level === 'high' || mode === 'Safe';

  return {
    level,
    mitigationPriority,
    failSafe,
    rationale: `${mode} risk: level=${level}, fail-safe=${failSafe}, ${mitigationPriority.length} mitigations`,
  };
}
