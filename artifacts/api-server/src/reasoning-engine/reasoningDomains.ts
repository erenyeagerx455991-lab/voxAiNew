// ── V9.5 Reasoning Domains ─────────────────────────────────────────────────────
// 25 independent reasoning domains. Each domain is scored deterministically from
// upstream signals already computed by existing static engines — this module
// does not duplicate those engines, it aggregates their signal per-domain.
import type { AmbiguityReport, ReasoningContext, ReasoningDomain } from './types.js';
import { ALL_REASONING_DOMAINS } from './types.js';

function clamp(n: number): number {
  return Math.max(0, Math.min(10, n));
}

export function scoreDomain(domain: ReasoningDomain, ctx: ReasoningContext, ambiguity: AmbiguityReport): number {
  const fallback = 6;
  switch (domain) {
    case 'Business':          return clamp(ctx.productScore ?? fallback);
    case 'Product':            return clamp(ctx.productScore ?? fallback);
    case 'Architecture':       return clamp(((ctx.frontendScore ?? fallback) + (ctx.backendScore ?? fallback)) / 2);
    case 'UI':                 return clamp(ctx.frontendScore ?? fallback);
    case 'Backend':            return clamp(ctx.backendScore ?? fallback);
    case 'Infrastructure':     return clamp(ctx.devopsScore ?? fallback);
    case 'Security':           return clamp(ctx.securityScore ?? fallback);
    case 'QA':                 return clamp(ctx.qaScore ?? fallback);
    case 'Performance':        return clamp(ctx.runtimeScore ?? fallback);
    case 'Runtime':            return clamp(ctx.runtimeScore ?? fallback);
    case 'Cost':               return clamp((ctx.tokenEfficiency ?? 0.5) * 10);
    case 'Accessibility':      return clamp(ctx.frontendScore ?? fallback);
    case 'Scalability':        return clamp(ctx.devopsScore ?? fallback);
    case 'Reliability':        return clamp(ctx.qaScore ?? fallback);
    case 'Maintainability':    return clamp(ctx.backendScore ?? fallback);
    case 'Deployment':         return clamp(ctx.devopsScore ?? fallback);
    case 'UserExperience':     return clamp(ctx.frontendScore ?? fallback);
    case 'Conversion':         return clamp(ctx.frontendScore ?? fallback);
    case 'Risk':                return clamp(10 - ambiguity.ambiguityScore);
    case 'Priority':           return clamp(fallback);
    case 'Dependency':         return clamp(ctx.complexity === 'enterprise' ? 5 : 7);
    case 'Constraint':         return clamp(10 - ambiguity.ambiguityScore * 0.5);
    case 'Resource':           return clamp((ctx.tokenEfficiency ?? 0.5) * 10);
    case 'Execution':          return clamp(ctx.runtimeScore ?? fallback);
    case 'Failure':            return clamp(ctx.qaScore ?? fallback);
    default:                   return fallback;
  }
}

export function scoreAllDomains(ctx: ReasoningContext, ambiguity: AmbiguityReport): Record<ReasoningDomain, number> {
  const result = {} as Record<ReasoningDomain, number>;
  for (const domain of ALL_REASONING_DOMAINS) {
    result[domain] = Number(scoreDomain(domain, ctx, ambiguity).toFixed(2));
  }
  return result;
}
