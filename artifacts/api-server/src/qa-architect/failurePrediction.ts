// ── V8.8 QA Architect — Phase 18: Failure Prediction ─────────────────────────
import type { BackendType } from '../backend-architect/backendTypes.js';
import type { FailurePrediction, FailureCategory } from './qaTypes.js';

interface Spec { category: FailureCategory; probability: 'High'|'Medium'|'Low'; rationale: string; prevention: string }

const BASE: Spec[] = [
  { category: 'AuthBug',           probability: 'Medium', rationale: 'JWT edge cases in refresh flow',        prevention: 'Unit test all token expiry paths' },
  { category: 'BrokenForms',       probability: 'Medium', rationale: 'Client validation not mirroring server', prevention: 'Shared Zod schemas; integration tests' },
  { category: 'NavigationIssues',  probability: 'Low',    rationale: 'Deep-link 404 after dynamic routing',   prevention: 'E2E navigation smoke suite' },
  { category: 'HydrationMismatch', probability: 'Medium', rationale: 'Server/client DOM divergence in SSR',    prevention: 'Hydration-specific Playwright tests' },
  { category: 'APIFailure',        probability: 'Medium', rationale: 'Network timeouts on flaky endpoints',    prevention: 'Retry logic + timeout contract tests' },
  { category: 'StateMismatch',     probability: 'Low',    rationale: 'Stale cache not invalidated on mutation','prevention': 'Cache invalidation integration tests' },
];

const RACE_CONDITION: Spec = {
  category: 'RaceConditions', probability: 'High',
  rationale: 'Concurrent writes without optimistic locking',
  prevention: 'Concurrent-user load tests + DB lock tests',
};

const SLOW_RENDER: Spec = {
  category: 'SlowRendering', probability: 'High',
  rationale: 'AI streaming + large component trees cause lag',
  prevention: 'Bundle size + LCP + hydration performance tests',
};

export function predictFailures(t: BackendType): FailurePrediction[] {
  const extras: Spec[] = [];
  if (['Marketplace','SocialPlatform','ECommerce'].includes(t)) extras.push(RACE_CONDITION);
  if (t === 'AIPlatform') extras.push(SLOW_RENDER);
  if (['Finance','Healthcare'].includes(t)) {
    extras.push({
      category: 'AuthBug', probability: 'High',
      rationale: 'Strict compliance requires zero auth failures',
      prevention: 'Full auth penetration testing suite',
    });
  }

  const all = [...BASE, ...extras];
  // Deduplicate by category — later entries win
  const seen = new Set<FailureCategory>();
  return [...all].reverse().filter(s => {
    if (seen.has(s.category)) return false;
    seen.add(s.category); return true;
  }).reverse();
}
